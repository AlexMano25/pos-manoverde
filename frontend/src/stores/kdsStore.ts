import { create } from 'zustand'
import type { KdsOrder, KdsOrderStatus, KdsStation, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

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
        const orders = await db.kds_orders
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at ascending (oldest first for kitchen)
        orders.sort((a, b) => a.created_at.localeCompare(b.created_at))
        set({ orders })
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
  })
)
