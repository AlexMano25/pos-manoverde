import { create } from 'zustand'
import type { RestaurantTable, TableStatus } from '../types'
import { db } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface TableState {
  tables: RestaurantTable[]
  loading: boolean
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface TableActions {
  loadTables: (storeId: string) => Promise<void>
  addTable: (storeId: string, data: { number: number; name: string; capacity: number; zone?: string }) => Promise<RestaurantTable>
  updateTable: (id: string, data: Partial<RestaurantTable>) => Promise<void>
  deleteTable: (id: string) => Promise<void>
  setTableStatus: (id: string, status: TableStatus, orderId?: string) => Promise<void>
  initializeDefaultTables: (storeId: string, count: number) => Promise<void>
  getTableById: (id: string) => RestaurantTable | undefined
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useTableStore = create<TableState & TableActions>()(
  (set, get) => ({
    tables: [],
    loading: false,

    loadTables: async (storeId: string) => {
      set({ loading: true })
      try {
        const tables = await db.tables
          .where('store_id')
          .equals(storeId)
          .sortBy('number')
        set({ tables })
      } catch (error) {
        console.error('[tableStore] Failed to load tables:', error)
      } finally {
        set({ loading: false })
      }
    },

    addTable: async (storeId, data) => {
      const now = new Date().toISOString()
      const table: RestaurantTable = {
        id: generateUUID(),
        store_id: storeId,
        number: data.number,
        name: data.name,
        capacity: data.capacity,
        status: 'free',
        zone: data.zone,
        created_at: now,
        updated_at: now,
      }

      await db.tables.add(table)
      set((state) => ({
        tables: [...state.tables, table].sort((a, b) => a.number - b.number),
      }))
      return table
    },

    updateTable: async (id, data) => {
      const now = new Date().toISOString()
      await db.tables.update(id, { ...data, updated_at: now })
      set((state) => ({
        tables: state.tables.map((t) =>
          t.id === id ? { ...t, ...data, updated_at: now } : t
        ),
      }))
    },

    deleteTable: async (id) => {
      await db.tables.delete(id)
      set((state) => ({
        tables: state.tables.filter((t) => t.id !== id),
      }))
    },

    setTableStatus: async (id, status, orderId) => {
      const now = new Date().toISOString()
      const update: Partial<RestaurantTable> = {
        status,
        updated_at: now,
      }
      if (orderId !== undefined) {
        update.current_order_id = orderId
      }
      if (status === 'free') {
        update.current_order_id = undefined
      }

      await db.tables.update(id, update)
      set((state) => ({
        tables: state.tables.map((t) =>
          t.id === id ? { ...t, ...update } : t
        ),
      }))
    },

    initializeDefaultTables: async (storeId, count) => {
      const now = new Date().toISOString()
      const newTables: RestaurantTable[] = []

      for (let i = 1; i <= count; i++) {
        newTables.push({
          id: generateUUID(),
          store_id: storeId,
          number: i,
          name: `Table ${i}`,
          capacity: 4,
          status: 'free',
          created_at: now,
          updated_at: now,
        })
      }

      await db.tables.bulkAdd(newTables)
      set({ tables: newTables })
    },

    getTableById: (id) => {
      return get().tables.find((t) => t.id === id)
    },
  })
)
