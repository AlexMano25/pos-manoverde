import { create } from 'zustand'
import type { OnlineOrder, OnlineOrderStatus, OnlineOrderChannel, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'
import { useKdsStore } from './kdsStore'
import { useAppStore } from './appStore'
import { supabase } from '../services/supabase'

// ── State ────────────────────────────────────────────────────────────────────

interface OnlineOrderState {
  orders: OnlineOrder[]
  loading: boolean
  filterStatus: OnlineOrderStatus | 'all'
  filterChannel: OnlineOrderChannel | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface OnlineOrderActions {
  loadOrders: (storeId: string) => Promise<void>
  addOrder: (
    storeId: string,
    data: Omit<OnlineOrder, 'id' | 'store_id' | 'order_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<OnlineOrder>
  updateOrder: (id: string, updates: Partial<OnlineOrder>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  confirmOrder: (id: string) => Promise<void>
  startPreparing: (id: string) => Promise<void>
  markReady: (id: string) => Promise<void>
  shipOrder: (id: string) => Promise<void>
  deliverOrder: (id: string) => Promise<void>
  cancelOrder: (id: string) => Promise<void>
  refundOrder: (id: string) => Promise<void>
  getNewOrdersCount: (storeId: string) => number
  getTodayDelivered: (storeId: string) => number
  setFilterStatus: (status: OnlineOrderStatus | 'all') => void
  setFilterChannel: (channel: OnlineOrderChannel | 'all') => void
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

async function generateOrderNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const count = await db.online_orders.where('store_id').equals(storeId).count()
  const seq = String(count + 1).padStart(3, '0')
  return `ON-${yy}${mm}${dd}-${seq}`
}

function getTodayRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
  return { start, end }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useOnlineOrderStore = create<OnlineOrderState & OnlineOrderActions>()(
  (set, get) => ({
    orders: [],
    loading: false,
    filterStatus: 'all',
    filterChannel: 'all',

    loadOrders: async (storeId: string) => {
      set({ loading: true })
      try {
        // Load from local IndexedDB
        const localOrders = await db.online_orders
          .where('store_id')
          .equals(storeId)
          .toArray()

        // Also fetch from Supabase cloud (catalog/QR orders)
        let cloudOrders: OnlineOrder[] = []
        if (supabase) {
          try {
            const { data } = await supabase
              .from('online_orders')
              .select('*')
              .eq('store_id', storeId)
              .order('created_at', { ascending: false })
              .limit(200)
            if (data && data.length > 0) {
              const localIds = new Set(localOrders.map(o => o.id))
              for (const co of data) {
                if (!localIds.has(co.id)) {
                  const mapped: OnlineOrder = {
                    id: co.id,
                    store_id: co.store_id,
                    order_number: co.order_number || '',
                    channel: (co.channel || 'website') as OnlineOrderChannel,
                    customer_name: co.customer_name || '',
                    customer_email: co.customer_email || undefined,
                    customer_phone: co.customer_phone || undefined,
                    delivery_address: co.delivery_address || undefined,
                    fulfillment: co.fulfillment || 'delivery',
                    items: co.items || [],
                    subtotal: co.subtotal || 0,
                    delivery_fee: co.delivery_fee || 0,
                    discount: co.discount || 0,
                    tax: co.tax || 0,
                    total: co.total || 0,
                    payment_status: co.payment_status || 'pending',
                    payment_method: co.payment_method || undefined,
                    status: (co.status || 'new') as OnlineOrderStatus,
                    delivered_at: co.delivered_at || undefined,
                    pos_order_id: co.pos_order_id || undefined,
                    notes: co.notes || undefined,
                    synced: true,
                    created_at: co.created_at,
                    updated_at: co.updated_at,
                  }
                  try { await db.online_orders.put(mapped) } catch { /* ignore dupe */ }
                  cloudOrders.push(mapped)
                }
              }
            }
          } catch (err) {
            console.warn('[onlineOrderStore] Cloud fetch failed (offline?):', err)
          }
        }

        const allOrders = [...localOrders, ...cloudOrders]
        // Deduplicate
        const seen = new Set<string>()
        const unique = allOrders.filter(o => {
          if (seen.has(o.id)) return false
          seen.add(o.id)
          return true
        })
        // Sort by created_at descending (newest first)
        unique.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ orders: unique })
      } catch (error) {
        console.error('[onlineOrderStore] Failed to load orders:', error)
      } finally {
        set({ loading: false })
      }
    },

    addOrder: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const order_number = await generateOrderNumber(storeId)

        const order: OnlineOrder = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          order_number,
          synced: false,
          created_at: now,
          updated_at: now,
        }

        await db.online_orders.add(order)
        await addToSyncQueue('online_order', order.id, 'create', order, storeId)

        // Decrement product stock for each item
        for (const item of order.items) {
          const product = await db.products.get(item.product_id)
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity)
            await db.products.update(item.product_id, {
              stock: newStock,
              updated_at: now,
            })
          }
        }

        // Create KDS order for food activities
        try {
          const activity = useAppStore.getState().activity
          const foodActivities = [
            'restaurant', 'bakery', 'bar', 'fast_food', 'coffee_shop',
            'food_truck', 'catering', 'ice_cream', 'juice_bar', 'hotel',
          ]
          const isFood = activity && foodActivities.includes(activity)

          if (isFood && order.items.length > 0) {
            const kdsItems = order.items.map((item) => ({
              product_name: item.product_name,
              quantity: item.quantity,
              notes: item.notes || undefined,
              station: 'all' as const,
              done: false,
            }))

            useKdsStore.getState().addOrder(storeId, {
              order_id: order.id,
              order_number: order.order_number,
              items: kdsItems,
              status: 'new',
              station: 'all',
              priority: false,
            }).catch((err) => {
              console.error('[onlineOrderStore] KDS order creation failed:', err)
            })
          }
        } catch (kdsErr) {
          console.error('[onlineOrderStore] KDS integration error:', kdsErr)
        }

        set((state) => ({
          orders: [order, ...state.orders],
        }))
        return order
      } catch (error) {
        console.error('[onlineOrderStore] Failed to add order:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    updateOrder: async (id, updates) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }

        // Update local IndexedDB
        try {
          await db.online_orders.update(id, merged)
        } catch { /* order may only exist in cloud */ }

        const order = await db.online_orders.get(id)
        if (order) {
          await addToSyncQueue('online_order', id, 'update', order, order.store_id)
        }

        // Also update in Supabase
        if (supabase) {
          await supabase.from('online_orders')
            .update(merged)
            .eq('id', id)
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, ...merged } : o
          ),
        }))
      } catch (error) {
        console.error('[onlineOrderStore] Failed to update order:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    deleteOrder: async (id) => {
      set({ loading: true })
      try {
        const order = await db.online_orders.get(id)
        await db.online_orders.delete(id)
        if (order) {
          await addToSyncQueue('online_order', id, 'delete', order, order.store_id)
        }
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        }))
      } catch (error) {
        console.error('[onlineOrderStore] Failed to delete order:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    confirmOrder: async (id) => {
      try {
        await get().updateOrder(id, { status: 'confirmed' })

        // Also update in Supabase online_orders table
        if (supabase) {
          await supabase.from('online_orders')
            .update({ status: 'confirmed', updated_at: new Date().toISOString() })
            .eq('id', id)
        }

        // Create KDS order for kitchen when staff confirms
        const order = get().orders.find(o => o.id === id)
        if (order) {
          const activity = useAppStore.getState().activity
          const foodActivities = [
            'restaurant', 'bakery', 'bar', 'fast_food', 'coffee_shop',
            'food_truck', 'catering', 'ice_cream', 'juice_bar', 'hotel',
          ]
          const isFood = activity && foodActivities.includes(activity)

          if (isFood && order.items.length > 0) {
            const kdsItems = order.items.map(item => ({
              product_name: item.product_name,
              quantity: item.quantity,
              notes: item.notes || undefined,
              station: 'all' as const,
              done: false,
            }))

            const tableLabel = `${order.fulfillment === 'delivery' ? 'Livraison' : 'Retrait'} - ${order.customer_name}`
            useKdsStore.getState().addOrder(order.store_id, {
              order_id: order.id,
              order_number: order.order_number,
              table_number: tableLabel,
              items: kdsItems,
              status: 'new',
              station: 'all',
              priority: false,
            }).catch(err => {
              console.error('[onlineOrderStore] KDS order creation failed:', err)
            })
            // Note: kdsStore.addOrder already syncs to Supabase cloud
          }
        }
      } catch (error) {
        console.error('[onlineOrderStore] Failed to confirm order:', error)
        throw error
      }
    },

    startPreparing: async (id) => {
      try {
        await get().updateOrder(id, { status: 'preparing' })
      } catch (error) {
        console.error('[onlineOrderStore] Failed to start preparing order:', error)
        throw error
      }
    },

    markReady: async (id) => {
      try {
        await get().updateOrder(id, { status: 'ready' })
      } catch (error) {
        console.error('[onlineOrderStore] Failed to mark order ready:', error)
        throw error
      }
    },

    shipOrder: async (id) => {
      try {
        await get().updateOrder(id, { status: 'shipped' })
      } catch (error) {
        console.error('[onlineOrderStore] Failed to ship order:', error)
        throw error
      }
    },

    deliverOrder: async (id) => {
      try {
        const now = new Date().toISOString()
        await get().updateOrder(id, { status: 'delivered', delivered_at: now })
      } catch (error) {
        console.error('[onlineOrderStore] Failed to deliver order:', error)
        throw error
      }
    },

    cancelOrder: async (id) => {
      try {
        await get().updateOrder(id, { status: 'cancelled' })
      } catch (error) {
        console.error('[onlineOrderStore] Failed to cancel order:', error)
        throw error
      }
    },

    refundOrder: async (id) => {
      try {
        await get().updateOrder(id, { status: 'refunded', payment_status: 'refunded' })
      } catch (error) {
        console.error('[onlineOrderStore] Failed to refund order:', error)
        throw error
      }
    },

    getNewOrdersCount: (storeId) => {
      return get().orders.filter(
        (o) => o.store_id === storeId && o.status === 'new'
      ).length
    },

    getTodayDelivered: (storeId) => {
      const { start, end } = getTodayRange()
      return get().orders.filter(
        (o) =>
          o.store_id === storeId &&
          o.status === 'delivered' &&
          o.delivered_at &&
          o.delivered_at >= start &&
          o.delivered_at <= end
      ).length
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },

    setFilterChannel: (channel) => {
      set({ filterChannel: channel })
    },
  })
)
