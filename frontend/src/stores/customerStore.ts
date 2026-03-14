import { create } from 'zustand'
import type { Customer, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface CustomerState {
  customers: Customer[]
  loading: boolean
  selectedCustomer: Customer | null
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface CustomerActions {
  loadCustomers: (storeId: string) => Promise<void>
  addCustomer: (storeId: string, data: {
    name: string
    phone?: string
    email?: string
    address?: string
    notes?: string
    tags?: string[]
  }) => Promise<Customer>
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  searchCustomers: (storeId: string, query: string) => Promise<Customer[]>
  addLoyaltyPoints: (id: string, points: number) => Promise<void>
  recordVisit: (id: string, orderTotal: number) => Promise<void>
  getTopCustomers: (storeId: string, limit?: number) => Customer[]
  selectCustomer: (customer: Customer | null) => void
  getCustomerById: (id: string) => Customer | undefined
}

// ── Sync helper ──────────────────────────────────────────────────────────────

async function addToSyncQueue(
  entityId: string,
  operation: SyncEntry['operation'],
  entity: unknown,
  storeId: string
): Promise<void> {
  const entry: SyncEntry = {
    id: generateUUID(),
    entity_type: 'customer',
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

export const useCustomerStore = create<CustomerState & CustomerActions>()(
  (set, get) => ({
    customers: [],
    loading: false,
    selectedCustomer: null,

    loadCustomers: async (storeId: string) => {
      set({ loading: true })
      try {
        const customers = await db.customers
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by name
        customers.sort((a, b) => a.name.localeCompare(b.name))
        set({ customers })
      } catch (error) {
        console.error('[customerStore] Failed to load customers:', error)
      } finally {
        set({ loading: false })
      }
    },

    addCustomer: async (storeId, data) => {
      const now = new Date().toISOString()
      const customer: Customer = {
        id: generateUUID(),
        store_id: storeId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
        tags: data.tags || [],
        loyalty_points: 0,
        total_spent: 0,
        visit_count: 0,
        created_at: now,
        updated_at: now,
      }

      await db.customers.add(customer)
      await addToSyncQueue(customer.id, 'create', customer, storeId)

      set((state) => ({
        customers: [...state.customers, customer].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      }))
      return customer
    },

    updateCustomer: async (id, data) => {
      const now = new Date().toISOString()
      const updates = { ...data, updated_at: now }
      await db.customers.update(id, updates)

      const customer = await db.customers.get(id)
      if (customer) {
        await addToSyncQueue(id, 'update', customer, customer.store_id)
      }

      set((state) => ({
        customers: state.customers
          .map((c) => (c.id === id ? { ...c, ...updates } : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
    },

    deleteCustomer: async (id) => {
      const customer = await db.customers.get(id)
      await db.customers.delete(id)
      if (customer) {
        await addToSyncQueue(id, 'delete', customer, customer.store_id)
      }
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        selectedCustomer:
          state.selectedCustomer?.id === id ? null : state.selectedCustomer,
      }))
    },

    searchCustomers: async (storeId: string, query: string) => {
      const lower = query.toLowerCase()
      // Search in-memory Zustand array first (instantly reactive after addCustomer)
      const inMemory = get().customers.filter(
        (c) =>
          c.store_id === storeId &&
          (c.name.toLowerCase().includes(lower) ||
            (c.phone != null && c.phone.includes(query)) ||
            (c.email != null && c.email.toLowerCase().includes(lower)))
      )
      if (inMemory.length > 0) return inMemory
      // Fallback to Dexie query (covers edge cases where Zustand is not yet loaded)
      return db.customers
        .where('store_id')
        .equals(storeId)
        .filter(
          (c) =>
            c.name.toLowerCase().includes(lower) ||
            (c.phone != null && c.phone.includes(query)) ||
            (c.email != null && c.email.toLowerCase().includes(lower))
        )
        .toArray()
    },

    addLoyaltyPoints: async (id, points) => {
      const customer = await db.customers.get(id)
      if (!customer) return
      const now = new Date().toISOString()
      const newPoints = customer.loyalty_points + points
      await db.customers.update(id, {
        loyalty_points: newPoints,
        updated_at: now,
      })
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id
            ? { ...c, loyalty_points: newPoints, updated_at: now }
            : c
        ),
        selectedCustomer:
          state.selectedCustomer?.id === id
            ? { ...state.selectedCustomer, loyalty_points: newPoints, updated_at: now }
            : state.selectedCustomer,
      }))
    },

    recordVisit: async (id, orderTotal) => {
      const customer = await db.customers.get(id)
      if (!customer) return
      const now = new Date().toISOString()
      // +1 loyalty point per 1000 in currency (floored)
      const earnedPoints = Math.floor(orderTotal / 1000)
      const updates = {
        visit_count: customer.visit_count + 1,
        total_spent: customer.total_spent + orderTotal,
        loyalty_points: customer.loyalty_points + earnedPoints,
        last_visit: now,
        updated_at: now,
      }
      await db.customers.update(id, updates)
      await addToSyncQueue(id, 'update', { ...customer, ...updates }, customer.store_id)

      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
        selectedCustomer:
          state.selectedCustomer?.id === id
            ? { ...state.selectedCustomer, ...updates }
            : state.selectedCustomer,
      }))
    },

    getTopCustomers: (storeId, limit = 10) => {
      return get()
        .customers.filter((c) => c.store_id === storeId)
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, limit)
    },

    selectCustomer: (customer) => {
      set({ selectedCustomer: customer })
    },

    getCustomerById: (id) => {
      return get().customers.find((c) => c.id === id)
    },
  })
)
