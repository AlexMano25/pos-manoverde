import { create } from 'zustand'
import type { RestaurantTable, TableStatus } from '../types'
import { db } from '../db/dexie'
import { generateUUID } from '../utils/uuid'
import { supabase } from '../services/supabase'

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
        // Load from local IndexedDB
        const localTables = await db.restaurant_tables
          .where('store_id')
          .equals(storeId)
          .sortBy('number')

        // Also fetch from Supabase cloud
        if (supabase) {
          try {
            const { data: cloudTables } = await supabase
              .from('restaurant_tables')
              .select('*')
              .eq('store_id', storeId)
              .order('number')
            if (cloudTables && cloudTables.length > 0) {
              const localIds = new Set(localTables.map(t => t.id))
              for (const ct of cloudTables) {
                const mapped: RestaurantTable = {
                  id: ct.id, store_id: ct.store_id,
                  number: ct.number, name: ct.name,
                  capacity: ct.seats || 4, status: ct.status || 'free',
                  zone: ct.zone, current_order_id: ct.current_order_id,
                  created_at: ct.created_at, updated_at: ct.updated_at,
                }
                if (!localIds.has(ct.id)) {
                  try { await db.restaurant_tables.add(mapped) } catch { /* dupe */ }
                  localTables.push(mapped)
                } else {
                  // Update local with cloud data
                  try { await db.restaurant_tables.put(mapped) } catch { /* ignore */ }
                  const idx = localTables.findIndex(t => t.id === ct.id)
                  if (idx >= 0) localTables[idx] = mapped
                }
              }
              // Push local-only tables to cloud
              const cloudIds = new Set(cloudTables.map((t: any) => t.id))
              for (const lt of localTables) {
                if (!cloudIds.has(lt.id)) {
                  supabase.from('restaurant_tables').upsert({
                    id: lt.id, store_id: lt.store_id,
                    name: lt.name, number: lt.number,
                    seats: lt.capacity || 4, zone: lt.zone || 'Salle',
                    status: lt.status, current_order_id: lt.current_order_id,
                    created_at: lt.created_at, updated_at: lt.updated_at,
                  } as never).then(({ error }) => {
                    if (error) console.warn('[tableStore] Cloud push failed:', error.message)
                  })
                }
              }
            } else if (localTables.length > 0) {
              // No cloud tables yet — push all local tables to cloud
              const rows = localTables.map(t => ({
                id: t.id, store_id: t.store_id,
                name: t.name, number: t.number,
                seats: t.capacity || 4, zone: t.zone || 'Salle',
                status: t.status, current_order_id: t.current_order_id,
                created_at: t.created_at, updated_at: t.updated_at,
              }))
              supabase.from('restaurant_tables').upsert(rows as never[]).then(({ error }) => {
                if (error) console.warn('[tableStore] Bulk cloud push failed:', error.message)
              })
            }
          } catch (err) {
            console.warn('[tableStore] Cloud sync failed (offline?):', err)
          }
        }

        localTables.sort((a, b) => a.number - b.number)
        // Deduplicate
        const seen = new Set<string>()
        const unique = localTables.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
        set({ tables: unique })
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
      // Sync to cloud
      if (supabase) {
        supabase.from('restaurant_tables').upsert({
          id: table.id, store_id: table.store_id,
          name: table.name, number: table.number,
          seats: table.capacity || 4, zone: table.zone || 'Salle',
          status: table.status, created_at: table.created_at, updated_at: table.updated_at,
        } as never).then(({ error: e }) => { if (e) console.warn('[tableStore]', e.message) })
      }
      set((state) => ({
        tables: [...state.tables, table].sort((a, b) => a.number - b.number),
      }))
      return table
    },

    updateTable: async (id, data) => {
      const now = new Date().toISOString()
      await db.restaurant_tables.update(id, { ...data, updated_at: now })
      if (supabase) {
        const cloudData: Record<string, unknown> = { updated_at: now }
        if (data.name !== undefined) cloudData.name = data.name
        if (data.number !== undefined) cloudData.number = data.number
        if (data.capacity !== undefined) cloudData.seats = data.capacity
        if (data.zone !== undefined) cloudData.zone = data.zone
        supabase.from('restaurant_tables').update(cloudData).eq('id', id).then(({ error }) => {
          if (error) console.warn('[tableStore] Cloud update failed:', error.message)
        })
      }
      set((state) => ({
        tables: state.tables.map((t) =>
          t.id === id ? { ...t, ...data, updated_at: now } : t
        ),
      }))
    },

    deleteTable: async (id) => {
      await db.restaurant_tables.delete(id)
      if (supabase) {
        supabase.from('restaurant_tables').delete().eq('id', id).then(({ error }) => {
          if (error) console.warn('[tableStore] Cloud delete failed:', error.message)
        })
      }
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
      if (supabase) {
        const cloudUpdate: Record<string, unknown> = { status, updated_at: now }
        if (orderId !== undefined) cloudUpdate.current_order_id = orderId
        if (status === 'free') cloudUpdate.current_order_id = null
        supabase.from('restaurant_tables').update(cloudUpdate).eq('id', id).then(({ error: e }) => { if (e) console.warn('[tableStore]', e.message) })
      }
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
