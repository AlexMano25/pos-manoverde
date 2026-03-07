import { create } from 'zustand'
import type { WorkOrder, WorkOrderStatus, WorkOrderItem, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface WorkOrderState {
  workOrders: WorkOrder[]
  loading: boolean
  filterStatus: WorkOrderStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface WorkOrderActions {
  loadWorkOrders: (storeId: string) => Promise<void>
  addWorkOrder: (
    storeId: string,
    data: Omit<WorkOrder, 'id' | 'store_id' | 'order_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<WorkOrder>
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<void>
  deleteWorkOrder: (id: string) => Promise<void>
  setStatus: (id: string, status: WorkOrderStatus) => Promise<void>
  addItem: (workOrderId: string, item: WorkOrderItem) => Promise<void>
  removeItem: (workOrderId: string, itemIndex: number) => Promise<void>
  getWorkOrdersByCustomer: (customerId: string) => WorkOrder[]
  setFilterStatus: (status: WorkOrderStatus | 'all') => void
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

function generateOrderNumber(existingCount: number): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const nnn = String(existingCount + 1).padStart(3, '0')
  return `WO-${yy}${mm}${dd}-${nnn}`
}

function recalculateTotals(items: WorkOrderItem[]): {
  labor_total: number
  parts_total: number
  estimated_total: number
} {
  let labor_total = 0
  let parts_total = 0
  for (const item of items) {
    if (item.type === 'labor') {
      labor_total += item.total
    } else if (item.type === 'part') {
      parts_total += item.total
    }
  }
  return { labor_total, parts_total, estimated_total: labor_total + parts_total }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useWorkOrderStore = create<WorkOrderState & WorkOrderActions>()(
  (set, get) => ({
    workOrders: [],
    loading: false,
    filterStatus: 'all',

    loadWorkOrders: async (storeId: string) => {
      set({ loading: true })
      try {
        const workOrders = await db.work_orders
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        workOrders.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ workOrders })
      } catch (error) {
        console.error('[workOrderStore] Failed to load work orders:', error)
      } finally {
        set({ loading: false })
      }
    },

    addWorkOrder: async (storeId, data) => {
      const now = new Date().toISOString()
      const todayStr = now.slice(0, 10) // 'YYYY-MM-DD'

      // Count today's work orders for order number generation
      const todayCount = get().workOrders.filter((wo) =>
        wo.store_id === storeId && wo.created_at.startsWith(todayStr)
      ).length

      const workOrder: WorkOrder = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        order_number: generateOrderNumber(todayCount),
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.work_orders.add(workOrder)
      await addToSyncQueue('work_order', workOrder.id, 'create', workOrder, storeId)

      set((state) => ({
        workOrders: [workOrder, ...state.workOrders],
      }))
      return workOrder
    },

    updateWorkOrder: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.work_orders.update(id, merged)

      const workOrder = await db.work_orders.get(id)
      if (workOrder) {
        await addToSyncQueue('work_order', id, 'update', workOrder, workOrder.store_id)
      }

      set((state) => ({
        workOrders: state.workOrders.map((wo) =>
          wo.id === id ? { ...wo, ...merged } : wo
        ),
      }))
    },

    deleteWorkOrder: async (id) => {
      const workOrder = await db.work_orders.get(id)
      await db.work_orders.delete(id)
      if (workOrder) {
        await addToSyncQueue('work_order', id, 'delete', workOrder, workOrder.store_id)
      }
      set((state) => ({
        workOrders: state.workOrders.filter((wo) => wo.id !== id),
      }))
    },

    setStatus: async (id, status) => {
      const now = new Date().toISOString()
      const updates: Partial<WorkOrder> = { status }

      if (status === 'completed') {
        updates.completed_at = now
      } else if (status === 'delivered') {
        updates.delivered_at = now
      }

      await get().updateWorkOrder(id, updates)
    },

    addItem: async (workOrderId, item) => {
      const workOrder = await db.work_orders.get(workOrderId)
      if (!workOrder) return

      const newItems = [...workOrder.items, item]
      const totals = recalculateTotals(newItems)
      const updates = { items: newItems, ...totals }

      await get().updateWorkOrder(workOrderId, updates)
    },

    removeItem: async (workOrderId, itemIndex) => {
      const workOrder = await db.work_orders.get(workOrderId)
      if (!workOrder) return

      const newItems = workOrder.items.filter((_, i) => i !== itemIndex)
      const totals = recalculateTotals(newItems)
      const updates = { items: newItems, ...totals }

      await get().updateWorkOrder(workOrderId, updates)
    },

    getWorkOrdersByCustomer: (customerId) => {
      return get().workOrders.filter((wo) => wo.customer_id === customerId)
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
