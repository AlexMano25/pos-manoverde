import { create } from 'zustand'
import type { Stocktake, StocktakeStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface StocktakeState {
  counts: Stocktake[]
  loading: boolean
  filterStatus: StocktakeStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface StocktakeActions {
  loadCounts: (storeId: string) => Promise<void>
  addCount: (
    storeId: string,
    data: Omit<Stocktake, 'id' | 'store_id' | 'count_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<Stocktake>
  updateCount: (id: string, updates: Partial<Stocktake>) => Promise<void>
  deleteCount: (id: string) => Promise<void>
  startCount: (id: string) => Promise<void>
  completeCount: (id: string, completedBy: string, completedByName: string) => Promise<void>
  cancelCount: (id: string) => Promise<void>
  getOpenCounts: (storeId: string) => Stocktake[]
  getAvgVariance: (storeId: string) => number
  setFilterStatus: (status: StocktakeStatus | 'all') => void
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

async function generateCountNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const todayPrefix = `SC-${yy}${mm}${dd}-`
  const allCounts = await db.stocktakes
    .where('store_id')
    .equals(storeId)
    .toArray()
  const todayCount = allCounts.filter((c) => c.count_number.startsWith(todayPrefix)).length
  const seq = String(todayCount + 1).padStart(3, '0')
  return `${todayPrefix}${seq}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useStocktakeStore = create<StocktakeState & StocktakeActions>()(
  (set, get) => ({
    counts: [],
    loading: false,
    filterStatus: 'all',

    loadCounts: async (storeId: string) => {
      set({ loading: true })
      try {
        const counts = await db.stocktakes
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        counts.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ counts })
      } catch (error) {
        console.error('[stocktakeStore] Failed to load counts:', error)
      } finally {
        set({ loading: false })
      }
    },

    addCount: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const count_number = await generateCountNumber(storeId)

        const count: Stocktake = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          count_number,
          synced: false,
          created_at: now,
          updated_at: now,
        }

        await db.stocktakes.add(count)
        await addToSyncQueue('stocktake', count.id, 'create', count, storeId)

        set((state) => ({
          counts: [count, ...state.counts],
        }))
        return count
      } catch (error) {
        console.error('[stocktakeStore] Failed to add count:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    updateCount: async (id, updates) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.stocktakes.update(id, merged)

        const count = await db.stocktakes.get(id)
        if (count) {
          await addToSyncQueue('stocktake', id, 'update', count, count.store_id)
        }

        set((state) => ({
          counts: state.counts.map((c) =>
            c.id === id ? { ...c, ...merged } : c
          ),
        }))
      } catch (error) {
        console.error('[stocktakeStore] Failed to update count:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    deleteCount: async (id) => {
      set({ loading: true })
      try {
        const count = await db.stocktakes.get(id)
        await db.stocktakes.delete(id)
        if (count) {
          await addToSyncQueue('stocktake', id, 'delete', count, count.store_id)
        }
        set((state) => ({
          counts: state.counts.filter((c) => c.id !== id),
        }))
      } catch (error) {
        console.error('[stocktakeStore] Failed to delete count:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    startCount: async (id) => {
      try {
        await get().updateCount(id, {
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('[stocktakeStore] Failed to start count:', error)
        throw error
      }
    },

    completeCount: async (id, completedBy, completedByName) => {
      try {
        await get().updateCount(id, {
          status: 'completed',
          completed_by: completedBy,
          completed_by_name: completedByName,
          completed_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('[stocktakeStore] Failed to complete count:', error)
        throw error
      }
    },

    cancelCount: async (id) => {
      try {
        await get().updateCount(id, {
          status: 'cancelled',
        })
      } catch (error) {
        console.error('[stocktakeStore] Failed to cancel count:', error)
        throw error
      }
    },

    getOpenCounts: (storeId) => {
      return get().counts.filter(
        (c) =>
          c.store_id === storeId &&
          (c.status === 'draft' || c.status === 'in_progress')
      )
    },

    getAvgVariance: (storeId) => {
      const completed = get().counts.filter(
        (c) => c.store_id === storeId && c.status === 'completed'
      )
      if (completed.length === 0) return 0
      const totalVarianceCost = completed.reduce(
        (sum, c) => sum + Math.abs(c.total_variance_cost),
        0
      )
      return totalVarianceCost / completed.length
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
