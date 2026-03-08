import { create } from 'zustand'
import type { PosReturn, ReturnStatus, ReturnReason, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface ReturnState {
  returns: PosReturn[]
  loading: boolean
  filterStatus: ReturnStatus | 'all'
  filterReason: ReturnReason | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface ReturnActions {
  loadReturns: (storeId: string) => Promise<void>
  addReturn: (
    storeId: string,
    data: Omit<PosReturn, 'id' | 'store_id' | 'return_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<PosReturn>
  updateReturn: (id: string, updates: Partial<PosReturn>) => Promise<void>
  deleteReturn: (id: string) => Promise<void>
  approveReturn: (id: string, approvedBy: string, approvedByName: string) => Promise<void>
  rejectReturn: (id: string) => Promise<void>
  processReturn: (id: string, processedBy: string, processedByName: string) => Promise<void>
  issueRefund: (id: string) => Promise<void>
  getMonthlyTotal: (storeId: string) => number
  setFilterStatus: (status: ReturnStatus | 'all') => void
  setFilterReason: (reason: ReturnReason | 'all') => void
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

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
  return { start, end }
}

async function generateReturnNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const count = await db.pos_returns.where('store_id').equals(storeId).count()
  const seq = String(count + 1).padStart(3, '0')
  return `RT-${yy}${mm}${dd}-${seq}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useReturnStore = create<ReturnState & ReturnActions>()(
  (set, get) => ({
    returns: [],
    loading: false,
    filterStatus: 'all',
    filterReason: 'all',

    loadReturns: async (storeId: string) => {
      set({ loading: true })
      try {
        const returns = await db.pos_returns
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        returns.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ returns })
      } catch (error) {
        console.error('[returnStore] Failed to load returns:', error)
      } finally {
        set({ loading: false })
      }
    },

    addReturn: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const return_number = await generateReturnNumber(storeId)

        const posReturn: PosReturn = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          return_number,
          synced: false,
          created_at: now,
          updated_at: now,
        }

        await db.pos_returns.add(posReturn)
        await addToSyncQueue('pos_return', posReturn.id, 'create', posReturn, storeId)

        set((state) => ({
          returns: [posReturn, ...state.returns],
        }))
        return posReturn
      } catch (error) {
        console.error('[returnStore] Failed to add return:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    updateReturn: async (id, updates) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.pos_returns.update(id, merged)

        const posReturn = await db.pos_returns.get(id)
        if (posReturn) {
          await addToSyncQueue('pos_return', id, 'update', posReturn, posReturn.store_id)
        }

        set((state) => ({
          returns: state.returns.map((r) =>
            r.id === id ? { ...r, ...merged } : r
          ),
        }))
      } catch (error) {
        console.error('[returnStore] Failed to update return:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    deleteReturn: async (id) => {
      set({ loading: true })
      try {
        const posReturn = await db.pos_returns.get(id)
        await db.pos_returns.delete(id)
        if (posReturn) {
          await addToSyncQueue('pos_return', id, 'delete', posReturn, posReturn.store_id)
        }
        set((state) => ({
          returns: state.returns.filter((r) => r.id !== id),
        }))
      } catch (error) {
        console.error('[returnStore] Failed to delete return:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    approveReturn: async (id, approvedBy, approvedByName) => {
      try {
        await get().updateReturn(id, {
          status: 'approved',
          approved_by: approvedBy,
          approved_by_name: approvedByName,
        })
      } catch (error) {
        console.error('[returnStore] Failed to approve return:', error)
        throw error
      }
    },

    rejectReturn: async (id) => {
      try {
        await get().updateReturn(id, {
          status: 'rejected',
        })
      } catch (error) {
        console.error('[returnStore] Failed to reject return:', error)
        throw error
      }
    },

    processReturn: async (id, processedBy, processedByName) => {
      try {
        await get().updateReturn(id, {
          status: 'processed',
          processed_by: processedBy,
          processed_by_name: processedByName,
        })
      } catch (error) {
        console.error('[returnStore] Failed to process return:', error)
        throw error
      }
    },

    issueRefund: async (id) => {
      try {
        await get().updateReturn(id, {
          status: 'refunded',
        })
      } catch (error) {
        console.error('[returnStore] Failed to issue refund:', error)
        throw error
      }
    },

    getMonthlyTotal: (storeId) => {
      const { start, end } = getCurrentMonthRange()
      return get()
        .returns.filter(
          (r) =>
            r.store_id === storeId &&
            r.created_at >= start &&
            r.created_at <= end &&
            (r.status === 'processed' || r.status === 'refunded')
        )
        .reduce((sum, r) => sum + r.total_refund, 0)
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },

    setFilterReason: (reason) => {
      set({ filterReason: reason })
    },
  })
)
