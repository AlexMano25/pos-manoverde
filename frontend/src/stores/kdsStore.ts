import { create } from 'zustand'
import type { KdsOrder, KdsOrderStatus, KdsStation, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'
import { useTableStore } from './tableStore'
import { useNotificationStore } from './notificationStore'
import { supabase } from '../services/supabase'

// ── State ────────────────────────────────────────────────────────────────────

interface KdsState {
  orders: KdsOrder[]
  loading: boolean
  stationFilter: KdsStation
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface KdsActions {
  loadOrders: (storeId: string) => Promise<void>
  addOrder: (
    storeId: string,
    data: Omit<KdsOrder, 'id' | 'store_id' | 'synced' | 'created_at'>
  ) => Promise<KdsOrder>
  updateItemStatus: (orderId: string, itemIndex: number, done: boolean) => Promise<void>
  bumpOrder: (id: string) => Promise<void>
  startOrder: (id: string) => Promise<void>
  markServed: (id: string) => Promise<void>
  togglePriority: (id: string) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  setStationFilter: (station: KdsStation) => void
  getOrdersByStatus: (storeId: string, status: KdsOrderStatus) => KdsOrder[]
  getHistory: () => KdsOrder[]
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

export const useKdsStore = create<KdsState & KdsActions>()(
  (set, get) => ({
    orders: [],
    loading: false,
    stationFilter: 'all',

    loadOrders: async (storeId: string) => {
      set({ loading: true })
      try {
        // Load from local IndexedDB
        const localOrders = await db.kds_orders
          .where('store_id')
          .equals(storeId)
          .toArray()

        // Also fetch from Supabase (for QR/online orders)
        let cloudOrders: KdsOrder[] = []
        if (supabase) {
          try {
            const { data } = await supabase
              .from('kds_orders')
              .select('*')
              .eq('store_id', storeId)
              .in('status', ['new', 'preparing', 'ready'])
              .order('created_at', { ascending: true })
            if (data && data.length > 0) {
              // Merge cloud orders into local (avoid duplicates by id)
              const localIds = new Set(localOrders.map(o => o.id))
              for (const co of data) {
                if (!localIds.has(co.id)) {
                  // Save to local DB for persistence
                  const kdsOrder = {
                    id: co.id,
                    store_id: co.store_id,
                    order_number: co.order_number || '',
                    table_number: co.table_name || undefined,
                    status: co.status as KdsOrderStatus,
                    priority: co.priority || false,
                    items: co.items || [],
                    station: 'all' as KdsStation,
                    created_at: co.created_at,
                  } as KdsOrder
                  try { await db.kds_orders.put(kdsOrder) } catch { /* ignore dupe */ }
                  cloudOrders.push(kdsOrder)
                }
              }
            }
          } catch (err) {
            console.warn('[kdsStore] Cloud fetch failed (offline?):', err)
          }
        }

        const allOrders = [...localOrders, ...cloudOrders]
        // Sort by created_at ascending (oldest first for kitchen)
        allOrders.sort((a, b) => a.created_at.localeCompare(b.created_at))
        // Deduplicate by id
        const seen = new Set<string>()
        const uniqueOrders = allOrders.filter(o => {
          if (seen.has(o.id)) return false
          seen.add(o.id)
          return true
        })
        set({ orders: uniqueOrders })
      } catch (error) {
        console.error('[kdsStore] Failed to load orders:', error)
      } finally {
        set({ loading: false })
      }
    },

    addOrder: async (storeId, data) => {
      const now = new Date().toISOString()

      const order: KdsOrder = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
      }

      await db.kds_orders.add(order)
      await addToSyncQueue('kds_order', order.id, 'create', order, storeId)

      set((state) => ({
        orders: [...state.orders, order],
      }))
      return order
    },

    updateItemStatus: async (orderId, itemIndex, done) => {
      const order = await db.kds_orders.get(orderId)
      if (!order) return

      const updatedItems = order.items.map((item, idx) =>
        idx === itemIndex ? { ...item, done } : item
      )

      const now = new Date().toISOString()
      const updates: Partial<KdsOrder> = { items: updatedItems }

      // Auto-advance to 'in_progress' if first item done and status is 'new'
      const anyDone = updatedItems.some((item) => item.done)
      if (anyDone && order.status === 'new') {
        updates.status = 'in_progress'
        updates.started_at = now
      }

      await db.kds_orders.update(orderId, updates)

      const updated = await db.kds_orders.get(orderId)
      if (updated) {
        await addToSyncQueue('kds_order', orderId, 'update', updated, updated.store_id)
      }

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, ...updates } : o
        ),
      }))
    },

    bumpOrder: async (id) => {
      const now = new Date().toISOString()
      const updates: Partial<KdsOrder> = {
        status: 'ready',
        completed_at: now,
      }

      await db.kds_orders.update(id, updates)

      const order = await db.kds_orders.get(id)
      if (order) {
        await addToSyncQueue('kds_order', id, 'update', order, order.store_id)

        // Update table status to 'food_ready' if order has a table_id
        if (order.table_id) {
          try {
            useTableStore.getState().setTableStatus(order.table_id, 'food_ready')
          } catch (e) {
            console.error('[kdsStore] Failed to update table status:', e)
          }
        }

        // Create notification for servers
        try {
          const tableLabel = order.table_number || order.table_id || ''
          const title = tableLabel
            ? `Commande prête - ${tableLabel}`
            : `Commande prête - #${order.order_number}`
          useNotificationStore.getState().addNotification(order.store_id, {
            type: 'order_ready',
            title,
            message: `La commande #${order.order_number} est prête à servir.`,
            priority: 'high',
          }).catch(() => {})
        } catch (e) {
          console.error('[kdsStore] Failed to create notification:', e)
        }
      }

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      }))
    },

    startOrder: async (id) => {
      const now = new Date().toISOString()
      const updates: Partial<KdsOrder> = {
        status: 'in_progress',
        started_at: now,
      }

      await db.kds_orders.update(id, updates)

      const order = await db.kds_orders.get(id)
      if (order) {
        await addToSyncQueue('kds_order', id, 'update', order, order.store_id)
      }

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      }))
    },

    markServed: async (id) => {
      const updates: Partial<KdsOrder> = { status: 'served' }

      await db.kds_orders.update(id, updates)

      const order = await db.kds_orders.get(id)
      if (order) {
        await addToSyncQueue('kds_order', id, 'update', order, order.store_id)

        // Update table status back to 'occupied' (waiting for payment)
        if (order.table_id) {
          try {
            useTableStore.getState().setTableStatus(order.table_id, 'occupied')
          } catch (e) {
            console.error('[kdsStore] Failed to update table status:', e)
          }
        }
      }

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      }))
    },

    togglePriority: async (id) => {
      const order = await db.kds_orders.get(id)
      if (!order) return

      const updates: Partial<KdsOrder> = { priority: !order.priority }

      await db.kds_orders.update(id, updates)

      const updated = await db.kds_orders.get(id)
      if (updated) {
        await addToSyncQueue('kds_order', id, 'update', updated, updated.store_id)
      }

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      }))
    },

    deleteOrder: async (id) => {
      const order = await db.kds_orders.get(id)
      await db.kds_orders.delete(id)
      if (order) {
        await addToSyncQueue('kds_order', id, 'delete', order, order.store_id)
      }
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id),
      }))
    },

    setStationFilter: (station) => {
      set({ stationFilter: station })
    },

    getOrdersByStatus: (storeId, status) => {
      return get().orders.filter(
        (o) => o.store_id === storeId && o.status === status
      )
    },

    getHistory: () => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      return get()
        .orders.filter(
          (o) => o.status === 'served' && o.completed_at && o.completed_at >= cutoff
        )
        .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
    },
  })
)
