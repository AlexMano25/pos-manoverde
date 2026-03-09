import { create } from 'zustand'
import type { WasteCategory, WasteEntry, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface WasteLossState {
  entries: WasteEntry[]
  loading: boolean
  filterCategory: WasteCategory | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface WasteLossActions {
  loadEntries: (storeId: string) => Promise<void>
  addEntry: (
    storeId: string,
    data: Omit<WasteEntry, 'id' | 'store_id' | 'entry_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<WasteEntry>
  updateEntry: (id: string, updates: Partial<WasteEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  approveEntry: (id: string, approverId: string, approverName: string) => Promise<void>
  getMonthlyTotal: (storeId: string) => number
  getTodayTotal: (storeId: string) => number
  getTopCategory: (storeId: string) => WasteCategory | null
  setFilterCategory: (category: WasteCategory | 'all') => void
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

function getTodayRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
  return { start, end }
}

async function generateEntryNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const todayPrefix = `WL-${yy}${mm}${dd}-`
  const allEntries = await db.waste_entries
    .where('store_id')
    .equals(storeId)
    .toArray()
  const todayCount = allEntries.filter((e) => e.entry_number.startsWith(todayPrefix)).length
  const seq = String(todayCount + 1).padStart(3, '0')
  return `${todayPrefix}${seq}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useWasteLossStore = create<WasteLossState & WasteLossActions>()(
  (set, get) => ({
    entries: [],
    loading: false,
    filterCategory: 'all',

    loadEntries: async (storeId: string) => {
      set({ loading: true })
      try {
        const entries = await db.waste_entries
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        entries.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ entries })
      } catch (error) {
        console.error('[wasteLossStore] Failed to load entries:', error)
      } finally {
        set({ loading: false })
      }
    },

    addEntry: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const entry_number = await generateEntryNumber(storeId)

        const entry: WasteEntry = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          entry_number,
          synced: false,
          created_at: now,
          updated_at: now,
        }

        await db.waste_entries.add(entry)
        await addToSyncQueue('waste_entry', entry.id, 'create', entry, storeId)

        set((state) => ({
          entries: [entry, ...state.entries],
        }))
        return entry
      } catch (error) {
        console.error('[wasteLossStore] Failed to add entry:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    updateEntry: async (id, updates) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.waste_entries.update(id, merged)

        const entry = await db.waste_entries.get(id)
        if (entry) {
          await addToSyncQueue('waste_entry', id, 'update', entry, entry.store_id)
        }

        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...merged } : e
          ),
        }))
      } catch (error) {
        console.error('[wasteLossStore] Failed to update entry:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    deleteEntry: async (id) => {
      set({ loading: true })
      try {
        const entry = await db.waste_entries.get(id)
        await db.waste_entries.delete(id)
        if (entry) {
          await addToSyncQueue('waste_entry', id, 'delete', entry, entry.store_id)
        }
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }))
      } catch (error) {
        console.error('[wasteLossStore] Failed to delete entry:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    approveEntry: async (id, approverId, approverName) => {
      try {
        await get().updateEntry(id, {
          approved_by: approverId,
          approved_by_name: approverName,
        })
      } catch (error) {
        console.error('[wasteLossStore] Failed to approve entry:', error)
        throw error
      }
    },

    getMonthlyTotal: (storeId) => {
      const { start, end } = getCurrentMonthRange()
      return get()
        .entries.filter(
          (e) =>
            e.store_id === storeId &&
            e.waste_date >= start &&
            e.waste_date <= end
        )
        .reduce((sum, e) => sum + e.total_cost, 0)
    },

    getTodayTotal: (storeId) => {
      const { start, end } = getTodayRange()
      return get()
        .entries.filter(
          (e) =>
            e.store_id === storeId &&
            e.waste_date >= start &&
            e.waste_date <= end
        )
        .reduce((sum, e) => sum + e.total_cost, 0)
    },

    getTopCategory: (storeId) => {
      const storeEntries = get().entries.filter((e) => e.store_id === storeId)
      if (storeEntries.length === 0) return null

      const counts: Record<string, number> = {}
      for (const e of storeEntries) {
        counts[e.category] = (counts[e.category] || 0) + e.total_cost
      }

      let topCategory: WasteCategory | null = null
      let maxCost = 0
      for (const key of Object.keys(counts)) {
        if (counts[key] > maxCost) {
          maxCost = counts[key]
          topCategory = key as WasteCategory
        }
      }
      return topCategory
    },

    setFilterCategory: (category) => {
      set({ filterCategory: category })
    },
  })
)
