import { create } from 'zustand'
import type { CartItem, Order, OrderPayment, OrderStatus, PaymentMethod, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'
import { supabase } from '../services/supabase'
import { useAppStore } from './appStore'
import { getNextReceiptNumber } from '../utils/receiptCounter'
import { triggerWebhookEvent } from '../utils/webhookEngine'

// ── State ────────────────────────────────────────────────────────────────────

interface OrderState {
  orders: Order[]
  loading: boolean
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface OrderActions {
  loadOrders: (storeId: string) => Promise<void>
  createOrder: (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    userId: string,
    storeId: string,
    options?: {
      customer_id?: string
      customer_name?: string
      table_id?: string
      table_name?: string
      promotion_discount?: number
      promotion_names?: string[]
      payments?: OrderPayment[]
      tip_amount?: number
      status?: OrderStatus
    }
  ) => Promise<Order>
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    paymentMethod?: PaymentMethod
  ) => Promise<void>
  getOrdersByDate: (date: string) => Order[]
  getTodayRevenue: () => number
  clearOrders: (
    storeId: string,
    filter?: { from?: string; to?: string }
  ) => Promise<number>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

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

export const useOrderStore = create<OrderState & OrderActions>()(
  (set, get) => ({
    // State
    orders: [],
    loading: false,

    // Actions
    loadOrders: async (storeId: string) => {
      set({ loading: true })
      try {
        const orders = await db.orders
          .where('store_id')
          .equals(storeId)
          .reverse()
          .sortBy('created_at')

        set({ orders })
      } catch (error) {
        console.error('[orderStore] Failed to load orders:', error)
      } finally {
        set({ loading: false })
      }
    },

    createOrder: async (
      items: CartItem[],
      paymentMethod: PaymentMethod,
      userId: string,
      storeId: string,
      options?: {
        customer_id?: string
        customer_name?: string
        table_id?: string
        table_name?: string
        promotion_discount?: number
        promotion_names?: string[]
        payments?: OrderPayment[]
        tip_amount?: number
        status?: OrderStatus
      }
    ): Promise<Order> => {
      const deviceId = getDeviceId()
      const now = new Date().toISOString()

      // Calculate financial breakdown
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      )
      const itemDiscounts = items.reduce(
        (sum, item) => sum + (item.discount ?? 0),
        0
      )
      const discount = itemDiscounts
      const tax = 0 // Tax can be computed by the caller or via store tax_rate
      const total = subtotal - discount + tax

      const promoDiscount = options?.promotion_discount ?? 0
      const finalTotal = total - promoDiscount

      const order: Order = {
        id: generateUUID(),
        store_id: storeId,
        user_id: userId,
        device_id: deviceId,
        items,
        subtotal,
        discount: discount + promoDiscount,
        tax,
        total: finalTotal,
        payment_method: paymentMethod,
        status: options?.status || 'paid',
        synced: false,
        customer_id: options?.customer_id,
        customer_name: options?.customer_name,
        table_id: options?.table_id,
        table_name: options?.table_name,
        promotion_discount: promoDiscount > 0 ? promoDiscount : undefined,
        promotion_names: options?.promotion_names,
        payments: options?.payments,
        tip_amount: options?.tip_amount,
        receipt_number: getNextReceiptNumber(storeId, useAppStore.getState().currentStore?.receipt_prefix),
        created_at: now,
        updated_at: now,
      }

      try {
        await db.transaction(
          'rw',
          db.orders,
          db.products,
          db.sync_queue,
          async () => {
            // 1. Save the order
            await db.orders.add(order)

            // 2. Decrement product stock for each cart item
            for (const item of items) {
              const product = await db.products.get(item.product_id)
              if (product) {
                const newStock = Math.max(0, product.stock - item.qty)
                await db.products.update(item.product_id, {
                  stock: newStock,
                  updated_at: now,
                })
              }
            }

            // 3. Add to sync queue
            await addToSyncQueue('order', order.id, 'create', order, storeId)
          }
        )

        // Update in-memory state
        set((state) => ({
          orders: [order, ...state.orders],
        }))

        // Deduct credit for pay-as-you-grow billing (non-blocking, skip for pending orders)
        if (supabase && order.status === 'paid') {
          const appState = useAppStore.getState()
          const orgId = appState.currentStore?.organization_id
          if (orgId) {
            supabase
              .rpc('deduct_ticket_credit', {
                p_organization_id: orgId,
                p_store_id: appState.currentStore?.id,
                p_order_id: order.id,
                p_activity: appState.activity || 'unknown',
              })
              .then(({ data, error }) => {
                if (error) console.error('[orderStore] Credit deduction failed:', error)
                else if (data === false)
                  console.warn('[orderStore] Insufficient credit balance')
              })
          }
        }

        // Fire webhook events (non-blocking)
        try {
          triggerWebhookEvent(storeId, 'order.created', { order })
          if (order.status === 'paid') {
            triggerWebhookEvent(storeId, 'order.paid', { order })
          }
        } catch (e) {
          console.error('[orderStore] Webhook trigger error:', e)
        }

        return order
      } catch (error) {
        console.error('[orderStore] Failed to create order:', error)
        throw error
      }
    },

    updateOrderStatus: async (
      orderId: string,
      status: OrderStatus,
      paymentMethod?: PaymentMethod
    ): Promise<void> => {
      const now = new Date().toISOString()

      try {
        // Update in IndexedDB
        const updates: Partial<Order> = {
          status,
          updated_at: now,
        }
        if (paymentMethod) updates.payment_method = paymentMethod

        await db.orders.update(orderId, updates)

        // Add to sync queue
        const order = await db.orders.get(orderId)
        if (order) {
          await addToSyncQueue('order', orderId, 'update', order, order.store_id)

          // Deduct billing credit when moving to 'paid'
          if (status === 'paid' && supabase) {
            const appState = useAppStore.getState()
            const orgId = appState.currentStore?.organization_id
            if (orgId) {
              supabase
                .rpc('deduct_ticket_credit', {
                  p_organization_id: orgId,
                  p_store_id: appState.currentStore?.id,
                  p_order_id: orderId,
                  p_activity: appState.activity || 'unknown',
                })
                .then(({ error }) => {
                  if (error) console.error('[orderStore] Credit deduction failed:', error)
                })
            }
          }
        }

        // Fire webhook events (non-blocking)
        if (order) {
          try {
            const updatedOrder = { ...order, ...updates }
            triggerWebhookEvent(order.store_id, 'order.updated', { order: updatedOrder, previous_status: order.status })
            if (status === 'paid') triggerWebhookEvent(order.store_id, 'order.paid', { order: updatedOrder })
            if (status === 'refunded') triggerWebhookEvent(order.store_id, 'order.refunded', { order: updatedOrder })
            if (status === 'cancelled') triggerWebhookEvent(order.store_id, 'order.cancelled', { order: updatedOrder })
          } catch (e) {
            console.error('[orderStore] Webhook trigger error:', e)
          }
        }

        // Update in-memory state
        set((state) => ({
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, ...updates } : o
          ),
        }))
      } catch (error) {
        console.error('[orderStore] Failed to update order status:', error)
        throw error
      }
    },

    getOrdersByDate: (date: string): Order[] => {
      return get().orders.filter(
        (order) => order.created_at.slice(0, 10) === date
      )
    },

    getTodayRevenue: (): number => {
      const today = getTodayDateString()
      return get()
        .orders.filter(
          (order) =>
            order.created_at.slice(0, 10) === today &&
            order.status === 'paid'
        )
        .reduce((sum, order) => sum + order.total, 0)
    },

    clearOrders: async (
      storeId: string,
      filter?: { from?: string; to?: string }
    ): Promise<number> => {
      try {
        // Get matching orders
        let ordersToDelete: Order[]

        if (filter?.from || filter?.to) {
          // Filter by date range
          const allOrders = await db.orders
            .where('store_id')
            .equals(storeId)
            .toArray()

          ordersToDelete = allOrders.filter((o) => {
            const d = o.created_at.slice(0, 10)
            if (filter.from && d < filter.from) return false
            if (filter.to && d > filter.to) return false
            return true
          })
        } else {
          // All orders for this store
          ordersToDelete = await db.orders
            .where('store_id')
            .equals(storeId)
            .toArray()
        }

        if (ordersToDelete.length === 0) return 0

        const count = ordersToDelete.length

        // Delete in transaction + sync queue
        await db.transaction('rw', db.orders, db.sync_queue, async () => {
          const ids = ordersToDelete.map((o) => o.id)
          await db.orders.bulkDelete(ids)

          // Queue deletions for sync
          for (const order of ordersToDelete) {
            await addToSyncQueue('order', order.id, 'delete', order, storeId)
          }
        })

        // Update in-memory state
        const deletedIds = new Set(ordersToDelete.map((o) => o.id))
        set((state) => ({
          orders: state.orders.filter((o) => !deletedIds.has(o.id)),
        }))

        return count
      } catch (error) {
        console.error('[orderStore] Failed to clear orders:', error)
        throw error
      }
    },
  })
)
