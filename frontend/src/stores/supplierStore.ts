import { create } from 'zustand'
import type { Supplier, PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface SupplierState {
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
  loading: boolean
  filterStatus: PurchaseOrderStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface SupplierActions {
  loadSuppliers: (storeId: string) => Promise<void>
  loadPurchaseOrders: (storeId: string) => Promise<void>
  addSupplier: (
    storeId: string,
    data: Omit<Supplier, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<Supplier>
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
  addPurchaseOrder: (
    storeId: string,
    data: Omit<PurchaseOrder, 'id' | 'store_id' | 'po_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<PurchaseOrder>
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => Promise<void>
  deletePurchaseOrder: (id: string) => Promise<void>
  sendPurchaseOrder: (id: string) => Promise<void>
  receiveGoods: (
    poId: string,
    receivedItems: { index: number; received_quantity: number }[]
  ) => Promise<void>
  cancelPurchaseOrder: (id: string) => Promise<void>
  setFilterStatus: (status: PurchaseOrderStatus | 'all') => void
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

function generatePoNumber(existingCount: number): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const nnn = String(existingCount + 1).padStart(3, '0')
  return `PO-${yy}${mm}${dd}-${nnn}`
}

function recalculatePoTotals(items: PurchaseOrderItem[]): {
  subtotal: number
  total: number
} {
  let subtotal = 0
  for (const item of items) {
    subtotal += item.total
  }
  return { subtotal, total: subtotal }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useSupplierStore = create<SupplierState & SupplierActions>()(
  (set, get) => ({
    suppliers: [],
    purchaseOrders: [],
    loading: false,
    filterStatus: 'all',

    loadSuppliers: async (storeId: string) => {
      set({ loading: true })
      try {
        const suppliers = await db.suppliers
          .where('store_id')
          .equals(storeId)
          .toArray()
        suppliers.sort((a, b) => a.name.localeCompare(b.name))
        set({ suppliers })
      } catch (error) {
        console.error('[supplierStore] Failed to load suppliers:', error)
      } finally {
        set({ loading: false })
      }
    },

    loadPurchaseOrders: async (storeId: string) => {
      set({ loading: true })
      try {
        const purchaseOrders = await db.purchase_orders
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        purchaseOrders.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ purchaseOrders })
      } catch (error) {
        console.error('[supplierStore] Failed to load purchase orders:', error)
      } finally {
        set({ loading: false })
      }
    },

    addSupplier: async (storeId, data) => {
      const now = new Date().toISOString()

      const supplier: Supplier = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.suppliers.add(supplier)
      await addToSyncQueue('supplier', supplier.id, 'create', supplier, storeId)

      set((state) => ({
        suppliers: [...state.suppliers, supplier].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      return supplier
    },

    updateSupplier: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.suppliers.update(id, merged)

      const supplier = await db.suppliers.get(id)
      if (supplier) {
        await addToSyncQueue('supplier', id, 'update', supplier, supplier.store_id)
      }

      set((state) => ({
        suppliers: state.suppliers
          .map((s) => (s.id === id ? { ...s, ...merged } : s))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
    },

    deleteSupplier: async (id) => {
      const supplier = await db.suppliers.get(id)
      await db.suppliers.delete(id)
      if (supplier) {
        await addToSyncQueue('supplier', id, 'delete', supplier, supplier.store_id)
      }
      set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id),
      }))
    },

    addPurchaseOrder: async (storeId, data) => {
      const now = new Date().toISOString()
      const todayStr = now.slice(0, 10)

      // Count today's POs for number generation
      const todayCount = get().purchaseOrders.filter((po) =>
        po.store_id === storeId && po.created_at.startsWith(todayStr)
      ).length

      const totals = recalculatePoTotals(data.items)

      const purchaseOrder: PurchaseOrder = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        po_number: generatePoNumber(todayCount),
        subtotal: totals.subtotal,
        total: totals.total + (data.tax || 0),
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.purchase_orders.add(purchaseOrder)
      await addToSyncQueue('purchase_order', purchaseOrder.id, 'create', purchaseOrder, storeId)

      set((state) => ({
        purchaseOrders: [purchaseOrder, ...state.purchaseOrders],
      }))
      return purchaseOrder
    },

    updatePurchaseOrder: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.purchase_orders.update(id, merged)

      const po = await db.purchase_orders.get(id)
      if (po) {
        await addToSyncQueue('purchase_order', id, 'update', po, po.store_id)
      }

      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((po) =>
          po.id === id ? { ...po, ...merged } : po
        ),
      }))
    },

    deletePurchaseOrder: async (id) => {
      const po = await db.purchase_orders.get(id)
      await db.purchase_orders.delete(id)
      if (po) {
        await addToSyncQueue('purchase_order', id, 'delete', po, po.store_id)
      }
      set((state) => ({
        purchaseOrders: state.purchaseOrders.filter((po) => po.id !== id),
      }))
    },

    sendPurchaseOrder: async (id) => {
      await get().updatePurchaseOrder(id, { status: 'sent' })
    },

    receiveGoods: async (poId, receivedItems) => {
      const po = await db.purchase_orders.get(poId)
      if (!po) return

      const updatedItems = [...po.items]
      for (const ri of receivedItems) {
        if (ri.index >= 0 && ri.index < updatedItems.length) {
          updatedItems[ri.index] = {
            ...updatedItems[ri.index],
            received_quantity: updatedItems[ri.index].received_quantity + ri.received_quantity,
          }
        }
      }

      // Determine new status
      const allReceived = updatedItems.every((item) => item.received_quantity >= item.quantity)
      const someReceived = updatedItems.some((item) => item.received_quantity > 0)

      let newStatus: PurchaseOrderStatus = po.status
      if (allReceived) {
        newStatus = 'received'
      } else if (someReceived) {
        newStatus = 'partial'
      }

      const updates: Partial<PurchaseOrder> = {
        items: updatedItems,
        status: newStatus,
      }

      if (allReceived) {
        updates.received_at = new Date().toISOString()
      }

      await get().updatePurchaseOrder(poId, updates)
    },

    cancelPurchaseOrder: async (id) => {
      await get().updatePurchaseOrder(id, { status: 'cancelled' })
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
