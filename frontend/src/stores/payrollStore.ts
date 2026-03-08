import { create } from 'zustand'
import type { PayrollEntry, PayrollStatus, CommissionRule, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface PayrollState {
  entries: PayrollEntry[]
  commissionRules: CommissionRule[]
  loading: boolean
  filterStatus: PayrollStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface PayrollActions {
  loadEntries: (storeId: string) => Promise<void>
  loadCommissionRules: (storeId: string) => Promise<void>
  addEntry: (
    storeId: string,
    data: Omit<PayrollEntry, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<PayrollEntry>
  updateEntry: (id: string, updates: Partial<PayrollEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  approveEntry: (id: string, approvedBy: string) => Promise<void>
  markPaid: (id: string, paymentMethod: string) => Promise<void>
  addCommissionRule: (
    storeId: string,
    data: Omit<CommissionRule, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<CommissionRule>
  updateCommissionRule: (id: string, updates: Partial<CommissionRule>) => Promise<void>
  deleteCommissionRule: (id: string) => Promise<void>
  setFilterStatus: (status: PayrollStatus | 'all') => void
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

// ── Store ────────────────────────────────────────────────────────────────────

export const usePayrollStore = create<PayrollState & PayrollActions>()(
  (set, get) => ({
    entries: [],
    commissionRules: [],
    loading: false,
    filterStatus: 'all',

    loadEntries: async (storeId: string) => {
      set({ loading: true })
      try {
        const entries = await db.payroll_entries
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by period_start descending (newest first)
        entries.sort((a, b) => b.period_start.localeCompare(a.period_start))
        set({ entries })
      } catch (error) {
        console.error('[payrollStore] Failed to load entries:', error)
      } finally {
        set({ loading: false })
      }
    },

    loadCommissionRules: async (storeId: string) => {
      try {
        const commissionRules = await db.commission_rules
          .where('store_id')
          .equals(storeId)
          .toArray()
        set({ commissionRules })
      } catch (error) {
        console.error('[payrollStore] Failed to load commission rules:', error)
      }
    },

    addEntry: async (storeId, data) => {
      const now = new Date().toISOString()

      const entry: PayrollEntry = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      try {
        await db.payroll_entries.add(entry)
        await addToSyncQueue('payroll_entry', entry.id, 'create', entry, storeId)

        set((state) => ({
          entries: [entry, ...state.entries],
        }))
      } catch (error) {
        console.error('[payrollStore] Failed to add entry:', error)
        throw error
      }
      return entry
    },

    updateEntry: async (id, updates) => {
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.payroll_entries.update(id, merged)

        const entry = await db.payroll_entries.get(id)
        if (entry) {
          await addToSyncQueue('payroll_entry', id, 'update', entry, entry.store_id)
        }

        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...merged } : e
          ),
        }))
      } catch (error) {
        console.error('[payrollStore] Failed to update entry:', error)
        throw error
      }
    },

    deleteEntry: async (id) => {
      try {
        const entry = await db.payroll_entries.get(id)
        await db.payroll_entries.delete(id)
        if (entry) {
          await addToSyncQueue('payroll_entry', id, 'delete', entry, entry.store_id)
        }
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }))
      } catch (error) {
        console.error('[payrollStore] Failed to delete entry:', error)
        throw error
      }
    },

    approveEntry: async (id, approvedBy) => {
      try {
        await get().updateEntry(id, {
          status: 'approved',
          approved_by: approvedBy,
        })
      } catch (error) {
        console.error('[payrollStore] Failed to approve entry:', error)
        throw error
      }
    },

    markPaid: async (id, paymentMethod) => {
      try {
        await get().updateEntry(id, {
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod as PayrollEntry['payment_method'],
        })
      } catch (error) {
        console.error('[payrollStore] Failed to mark entry as paid:', error)
        throw error
      }
    },

    addCommissionRule: async (storeId, data) => {
      const now = new Date().toISOString()

      const rule: CommissionRule = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      try {
        await db.commission_rules.add(rule)
        await addToSyncQueue('commission_rule', rule.id, 'create', rule, storeId)

        set((state) => ({
          commissionRules: [rule, ...state.commissionRules],
        }))
      } catch (error) {
        console.error('[payrollStore] Failed to add commission rule:', error)
        throw error
      }
      return rule
    },

    updateCommissionRule: async (id, updates) => {
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.commission_rules.update(id, merged)

        const rule = await db.commission_rules.get(id)
        if (rule) {
          await addToSyncQueue('commission_rule', id, 'update', rule, rule.store_id)
        }

        set((state) => ({
          commissionRules: state.commissionRules.map((r) =>
            r.id === id ? { ...r, ...merged } : r
          ),
        }))
      } catch (error) {
        console.error('[payrollStore] Failed to update commission rule:', error)
        throw error
      }
    },

    deleteCommissionRule: async (id) => {
      try {
        const rule = await db.commission_rules.get(id)
        await db.commission_rules.delete(id)
        if (rule) {
          await addToSyncQueue('commission_rule', id, 'delete', rule, rule.store_id)
        }
        set((state) => ({
          commissionRules: state.commissionRules.filter((r) => r.id !== id),
        }))
      } catch (error) {
        console.error('[payrollStore] Failed to delete commission rule:', error)
        throw error
      }
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
