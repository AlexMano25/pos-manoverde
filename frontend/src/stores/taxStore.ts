import { create } from 'zustand'
import type { TaxRate, TaxType, TaxRateStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface TaxState {
  rates: TaxRate[]
  loading: boolean
  filterStatus: TaxRateStatus | 'all'
  filterType: TaxType | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface TaxActions {
  loadRates: (storeId: string) => Promise<void>
  addRate: (
    storeId: string,
    data: Omit<TaxRate, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<TaxRate>
  updateRate: (id: string, updates: Partial<TaxRate>) => Promise<void>
  deleteRate: (id: string) => Promise<void>
  activateRate: (id: string) => Promise<void>
  deactivateRate: (id: string) => Promise<void>
  getActiveCount: (storeId: string) => number
  getAvgRate: (storeId: string) => number
  setFilterStatus: (status: TaxRateStatus | 'all') => void
  setFilterType: (type: TaxType | 'all') => void
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

export const useTaxStore = create<TaxState & TaxActions>()(
  (set, get) => ({
    rates: [],
    loading: false,
    filterStatus: 'all',
    filterType: 'all',

    loadRates: async (storeId: string) => {
      set({ loading: true })
      try {
        const rates = await db.tax_rates
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        rates.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ rates })
      } catch (error) {
        console.error('[taxStore] Failed to load rates:', error)
      } finally {
        set({ loading: false })
      }
    },

    addRate: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()

        const rate: TaxRate = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          synced: false,
          created_at: now,
          updated_at: now,
        }

        await db.tax_rates.add(rate)
        await addToSyncQueue('tax_rate', rate.id, 'create', rate, storeId)

        set((state) => ({
          rates: [rate, ...state.rates],
        }))
        return rate
      } catch (error) {
        console.error('[taxStore] Failed to add rate:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    updateRate: async (id, updates) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.tax_rates.update(id, merged)

        const rate = await db.tax_rates.get(id)
        if (rate) {
          await addToSyncQueue('tax_rate', id, 'update', rate, rate.store_id)
        }

        set((state) => ({
          rates: state.rates.map((r) =>
            r.id === id ? { ...r, ...merged } : r
          ),
        }))
      } catch (error) {
        console.error('[taxStore] Failed to update rate:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    deleteRate: async (id) => {
      set({ loading: true })
      try {
        const rate = await db.tax_rates.get(id)
        await db.tax_rates.delete(id)
        if (rate) {
          await addToSyncQueue('tax_rate', id, 'delete', rate, rate.store_id)
        }
        set((state) => ({
          rates: state.rates.filter((r) => r.id !== id),
        }))
      } catch (error) {
        console.error('[taxStore] Failed to delete rate:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    activateRate: async (id) => {
      try {
        await get().updateRate(id, {
          status: 'active',
        })
      } catch (error) {
        console.error('[taxStore] Failed to activate rate:', error)
        throw error
      }
    },

    deactivateRate: async (id) => {
      try {
        await get().updateRate(id, {
          status: 'inactive',
        })
      } catch (error) {
        console.error('[taxStore] Failed to deactivate rate:', error)
        throw error
      }
    },

    getActiveCount: (storeId) => {
      return get().rates.filter(
        (r) => r.store_id === storeId && r.status === 'active'
      ).length
    },

    getAvgRate: (storeId) => {
      const activeRates = get().rates.filter(
        (r) => r.store_id === storeId && r.status === 'active'
      )
      if (activeRates.length === 0) return 0
      const sum = activeRates.reduce((acc, r) => acc + r.rate, 0)
      return sum / activeRates.length
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },

    setFilterType: (type) => {
      set({ filterType: type })
    },
  })
)
