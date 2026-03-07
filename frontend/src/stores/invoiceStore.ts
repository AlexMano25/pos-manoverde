import { create } from 'zustand'
import type { PosInvoice, PosInvoiceStatus, PosInvoicePayment, PaymentMethod, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface InvoiceState {
  invoices: PosInvoice[]
  loading: boolean
  filterStatus: PosInvoiceStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface InvoiceActions {
  loadInvoices: (storeId: string) => Promise<void>
  addInvoice: (
    storeId: string,
    data: Omit<PosInvoice, 'id' | 'store_id' | 'invoice_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<PosInvoice>
  updateInvoice: (id: string, updates: Partial<PosInvoice>) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  setStatus: (id: string, status: PosInvoiceStatus) => Promise<void>
  addPayment: (
    invoiceId: string,
    amount: number,
    method: PaymentMethod,
    note?: string
  ) => Promise<void>
  checkOverdue: (storeId: string) => Promise<void>
  getOverdueInvoices: (storeId: string) => PosInvoice[]
  setFilterStatus: (status: PosInvoiceStatus | 'all') => void
}

// ── Sync helper ──────────────────────────────────────────────────────────────

async function addToSyncQueue(
  entityType: SyncEntry['entity_type'],
  entityId: string,
  operation: SyncEntry['operation'],
  entity: unknown,
  storeId: string
): Promise<void> {
  const entry: SyncEntry = {
    id: generateUUID(),
    entity_type: entityType,
    entity_id: entityId,
    operation,
    data: JSON.stringify(entity),
    device_id: getDeviceId(),
    store_id: storeId,
    retries: 0,
    created_at: new Date().toISOString(),
  }
  await db.sync_queue.add(entry)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateInvoiceNumber(existingCount: number): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const nnn = String(existingCount + 1).padStart(3, '0')
  return `INV-${yy}${mm}${dd}-${nnn}`
}


// ── Store ────────────────────────────────────────────────────────────────────

export const useInvoiceStore = create<InvoiceState & InvoiceActions>()(
  (set, get) => ({
    invoices: [],
    loading: false,
    filterStatus: 'all',

    loadInvoices: async (storeId: string) => {
      set({ loading: true })
      try {
        const invoices = await db.pos_invoices
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        invoices.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ invoices })
      } catch (error) {
        console.error('[invoiceStore] Failed to load invoices:', error)
      } finally {
        set({ loading: false })
      }
    },

    addInvoice: async (storeId, data) => {
      const now = new Date().toISOString()
      const todayStr = now.slice(0, 10)

      // Count today's invoices for number generation
      const todayCount = get().invoices.filter((inv) =>
        inv.store_id === storeId && inv.created_at.startsWith(todayStr)
      ).length

      const invoice: PosInvoice = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        invoice_number: generateInvoiceNumber(todayCount),
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.pos_invoices.add(invoice)
      await addToSyncQueue('pos_invoice', invoice.id, 'create', invoice, storeId)

      set((state) => ({
        invoices: [invoice, ...state.invoices],
      }))
      return invoice
    },

    updateInvoice: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.pos_invoices.update(id, merged)

      const invoice = await db.pos_invoices.get(id)
      if (invoice) {
        await addToSyncQueue('pos_invoice', id, 'update', invoice, invoice.store_id)
      }

      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, ...merged } : inv
        ),
      }))
    },

    deleteInvoice: async (id) => {
      const invoice = await db.pos_invoices.get(id)
      await db.pos_invoices.delete(id)
      if (invoice) {
        await addToSyncQueue('pos_invoice', id, 'delete', invoice, invoice.store_id)
      }
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
      }))
    },

    setStatus: async (id, status) => {
      await get().updateInvoice(id, { status })
    },

    addPayment: async (invoiceId, amount, method, note) => {
      const invoice = await db.pos_invoices.get(invoiceId)
      if (!invoice) return

      const now = new Date().toISOString()
      const payment: PosInvoicePayment = {
        id: generateUUID(),
        amount,
        payment_method: method,
        paid_at: now,
        note,
      }

      const newPayments = [...invoice.payments, payment]
      const amountPaid = newPayments.reduce((sum, p) => sum + p.amount, 0)
      const balanceDue = invoice.total - amountPaid

      const updates: Partial<PosInvoice> = {
        payments: newPayments,
        amount_paid: amountPaid,
        balance_due: balanceDue,
      }

      if (balanceDue <= 0) {
        updates.status = 'paid'
        updates.paid_at = now
      }

      await get().updateInvoice(invoiceId, updates)
    },

    checkOverdue: async (storeId) => {
      const todayStr = new Date().toISOString().split('T')[0]
      const invoices = get().invoices.filter(
        (inv) =>
          inv.store_id === storeId &&
          inv.due_date &&
          inv.due_date < todayStr &&
          inv.status === 'sent'
      )
      for (const inv of invoices) {
        await get().updateInvoice(inv.id, { status: 'overdue' })
      }
    },

    getOverdueInvoices: (storeId) => {
      return get().invoices.filter(
        (inv) => inv.store_id === storeId && inv.status === 'overdue'
      )
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
