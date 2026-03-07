import { create } from 'zustand'
import type { Delivery, DeliveryStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface DeliveryState {
  deliveries: Delivery[]
  loading: boolean
  filterStatus: DeliveryStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface DeliveryActions {
  loadDeliveries: (storeId: string) => Promise<void>
  addDelivery: (
    storeId: string,
    data: Omit<Delivery, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<Delivery>
  updateDelivery: (id: string, updates: Partial<Delivery>) => Promise<void>
  deleteDelivery: (id: string) => Promise<void>
  assignDriver: (id: string, driverId: string, driverName: string) => Promise<void>
  advanceStatus: (
    id: string,
    newStatus: DeliveryStatus,
    metadata?: { failed_reason?: string }
  ) => Promise<void>
  getActiveDeliveries: (storeId: string) => Delivery[]
  setFilterStatus: (status: DeliveryStatus | 'all') => void
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

export const useDeliveryStore = create<DeliveryState & DeliveryActions>()(
  (set, get) => ({
    deliveries: [],
    loading: false,
    filterStatus: 'all',

    loadDeliveries: async (storeId: string) => {
      set({ loading: true })
      try {
        const deliveries = await db.deliveries
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        deliveries.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ deliveries })
      } catch (error) {
        console.error('[deliveryStore] Failed to load deliveries:', error)
      } finally {
        set({ loading: false })
      }
    },

    addDelivery: async (storeId, data) => {
      const now = new Date().toISOString()

      const delivery: Delivery = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        status: 'pending',
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.deliveries.add(delivery)
      await addToSyncQueue('delivery', delivery.id, 'create', delivery, storeId)

      set((state) => ({
        deliveries: [delivery, ...state.deliveries],
      }))
      return delivery
    },

    updateDelivery: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.deliveries.update(id, merged)

      const delivery = await db.deliveries.get(id)
      if (delivery) {
        await addToSyncQueue('delivery', id, 'update', delivery, delivery.store_id)
      }

      set((state) => ({
        deliveries: state.deliveries.map((d) =>
          d.id === id ? { ...d, ...merged } : d
        ),
      }))
    },

    deleteDelivery: async (id) => {
      const delivery = await db.deliveries.get(id)
      await db.deliveries.delete(id)
      if (delivery) {
        await addToSyncQueue('delivery', id, 'delete', delivery, delivery.store_id)
      }
      set((state) => ({
        deliveries: state.deliveries.filter((d) => d.id !== id),
      }))
    },

    assignDriver: async (id, driverId, driverName) => {
      const delivery = await db.deliveries.get(id)
      if (!delivery) return

      const updates: Partial<Delivery> = {
        driver_id: driverId,
        driver_name: driverName,
      }

      // Advance to 'assigned' if currently 'pending'
      if (delivery.status === 'pending') {
        updates.status = 'assigned'
      }

      await get().updateDelivery(id, updates)
    },

    advanceStatus: async (id, newStatus, metadata) => {
      const now = new Date().toISOString()
      const updates: Partial<Delivery> = { status: newStatus }

      if (newStatus === 'picked_up') {
        updates.picked_up_at = now
      } else if (newStatus === 'delivered') {
        updates.delivered_at = now
      } else if (newStatus === 'failed') {
        updates.failed_reason = metadata?.failed_reason || ''
      }

      await get().updateDelivery(id, updates)
    },

    getActiveDeliveries: (storeId) => {
      return get().deliveries.filter(
        (d) =>
          d.store_id === storeId &&
          d.status !== 'delivered' &&
          d.status !== 'failed'
      )
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
