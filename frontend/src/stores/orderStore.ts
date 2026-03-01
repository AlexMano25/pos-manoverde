import { create } from 'zustand'
import type { CartItem, Order, PaymentMethod, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

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
    storeId: string
  ) => Promise<Order>
  getOrdersByDate: (date: string) => Order[]
  getTodayRevenue: () => number
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
      storeId: string
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

      const order: Order = {
        id: generateUUID(),
        store_id: storeId,
        user_id: userId,
        device_id: deviceId,
        items,
        subtotal,
        discount,
        tax,
        total,
        payment_method: paymentMethod,
        status: 'paid',
        synced: false,
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

        return order
      } catch (error) {
        console.error('[orderStore] Failed to create order:', error)
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
  })
)
