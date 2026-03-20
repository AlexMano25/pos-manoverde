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
  transferTable: (fromId: string, toId: string) => Promise<void>
  mergeTables: (primaryId: string, secondaryIds: string[]) => Promise<void>
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useTableStore = create<TableState & TableActions>()(
  (set, get) => ({
    tables: [],
    loading: false,

    loadTables: async (storeId: string) => {
      set({ loading: true })
      try {
        const tables = await db.restaurant_tables
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

      await db.restaurant_tables.add(table)
      set((state) => ({
        tables: [...state.tables, table].sort((a, b) => a.number - b.number),
      }))
      return table
    },

    updateTable: async (id, data) => {
      const now = new Date().toISOString()
      await db.restaurant_tables.update(id, { ...data, updated_at: now })
      set((state) => ({
        tables: state.tables.map((t) =>
          t.id === id ? { ...t, ...data, updated_at: now } : t
        ),
      }))
    },

    deleteTable: async (id) => {
      await db.restaurant_tables.delete(id)
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

      await db.restaurant_tables.update(id, update)
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

      await db.restaurant_tables.bulkAdd(newTables)
      set({ tables: newTables })
    },

    getTableById: (id) => {
      return get().tables.find((t) => t.id === id)
    },

    transferTable: async (fromId, toId) => {
      const now = new Date().toISOString()
      const fromTable = get().tables.find((t) => t.id === fromId)
      if (!fromTable) return

      // Move order reference to the target table, mark it occupied
      const toUpdate: Partial<RestaurantTable> = {
        status: 'occupied' as TableStatus,
        current_order_id: fromTable.current_order_id,
        updated_at: now,
      }
      await db.restaurant_tables.update(toId, toUpdate)

      // Free the source table
      const fromUpdate: Partial<RestaurantTable> = {
        status: 'free' as TableStatus,
        current_order_id: undefined,
        updated_at: now,
      }
      await db.restaurant_tables.update(fromId, fromUpdate)

      set((state) => ({
        tables: state.tables.map((t) => {
          if (t.id === toId) return { ...t, ...toUpdate }
          if (t.id === fromId) return { ...t, ...fromUpdate }
          return t
        }),
      }))
    },

    mergeTables: async (primaryId, secondaryIds) => {
      const now = new Date().toISOString()

      // Free all secondary tables
      for (const secId of secondaryIds) {
        const secUpdate: Partial<RestaurantTable> = {
          status: 'free' as TableStatus,
          current_order_id: undefined,
          updated_at: now,
        }
        await db.restaurant_tables.update(secId, secUpdate)
      }

      // Ensure primary table is occupied
      const priUpdate: Partial<RestaurantTable> = {
        status: 'occupied' as TableStatus,
        updated_at: now,
      }
      await db.restaurant_tables.update(primaryId, priUpdate)

      set((state) => ({
        tables: state.tables.map((t) => {
          if (t.id === primaryId) return { ...t, ...priUpdate }
          if (secondaryIds.includes(t.id)) return { ...t, status: 'free' as TableStatus, current_order_id: undefined, updated_at: now }
          return t
        }),
      }))
    },
  })
)
