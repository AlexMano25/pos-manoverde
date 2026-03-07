import Dexie, { type Table } from 'dexie'
import type {
  Order,
  Product,
  RestaurantTable,
  StockMove,
  SyncEntry,
  Store,
  User,
} from '../types'
import { generateUUID } from '../utils/uuid'

// ---------------------------------------------------------------------------
// POS Database -- IndexedDB via Dexie for offline-first storage
// ---------------------------------------------------------------------------

export class PosDatabase extends Dexie {
  stores!: Table<Store, string>
  users!: Table<User, string>
  products!: Table<Product, string>
  orders!: Table<Order, string>
  stock_moves!: Table<StockMove, string>
  sync_queue!: Table<SyncEntry, string>
  tables!: Table<RestaurantTable, string>

  constructor() {
    super('pos_manoverde')

    // Schema version 1 -- initial tables
    this.version(1).stores({
      stores: 'id, name, activity, created_at',
      users: 'id, store_id, email, role, pin, is_active, created_at',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at',
    })

    // Schema version 2 -- compound indexes for common queries
    this.version(2).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced]',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
    })

    // Schema version 3 -- activity-specific product fields + expiry_date index
    this.version(3).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode], [store_id+expiry_date]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced]',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
    })

    // Schema version 4 -- restaurant tables + order table_id
    this.version(4).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode], [store_id+expiry_date]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced], table_id',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
      tables:
        'id, store_id, number, status, zone, current_order_id, [store_id+status]',
    })
  }

  // ---- Clear all data (useful for store reset / logout) ----

  async clearAll(): Promise<void> {
    await this.transaction(
      'rw',
      [
        this.stores,
        this.users,
        this.products,
        this.orders,
        this.stock_moves,
        this.sync_queue,
        this.tables,
      ],
      async () => {
        await this.stores.clear()
        await this.users.clear()
        await this.products.clear()
        await this.orders.clear()
        await this.stock_moves.clear()
        await this.sync_queue.clear()
        await this.tables.clear()
      },
    )
  }

  // ---- Unsynced orders for a store ----

  async getUnsyncedOrders(storeId: string): Promise<Order[]> {
    return this.orders
      .where('store_id')
      .equals(storeId)
      .filter((o) => !o.synced)
      .toArray()
  }

  // ---- Unsynced stock moves for a store ----

  async getUnsyncedStockMoves(storeId: string): Promise<StockMove[]> {
    return this.stock_moves
      .where('store_id')
      .equals(storeId)
      .filter((m) => !m.synced)
      .toArray()
  }

  // ---- Pending sync-queue entries ----

  async getPendingSyncEntries(
    storeId: string,
    limit = 50,
  ): Promise<SyncEntry[]> {
    return this.sync_queue
      .where('store_id')
      .equals(storeId)
      .filter((e) => !e.synced_at)
      .limit(limit)
      .sortBy('created_at')
  }

  // ---- Products by category for a store ----

  async getProductsByCategory(
    storeId: string,
    category: string,
  ): Promise<Product[]> {
    return this.products
      .where({ store_id: storeId, category })
      .filter((p) => p.is_active)
      .toArray()
  }

  // ---- All active products for a store ----

  async getActiveProducts(storeId: string): Promise<Product[]> {
    return this.products
      .where('store_id')
      .equals(storeId)
      .filter((p) => p.is_active)
      .toArray()
  }

  // ---- Distinct product categories for a store ----

  async getCategories(storeId: string): Promise<string[]> {
    const products = await this.products
      .where('store_id')
      .equals(storeId)
      .filter((p) => p.is_active)
      .toArray()
    const categories = new Set(products.map((p) => p.category))
    return Array.from(categories).sort()
  }

  // ---- Search products by name, barcode, or SKU ----

  async searchProducts(
    storeId: string,
    query: string,
  ): Promise<Product[]> {
    const lower = query.toLowerCase()
    return this.products
      .where('store_id')
      .equals(storeId)
      .filter(
        (p) =>
          p.is_active &&
          (p.name.toLowerCase().includes(lower) ||
            (p.barcode != null && p.barcode.includes(query)) ||
            (p.sku != null && p.sku.toLowerCase().includes(lower))),
      )
      .toArray()
  }

  // ---- Find a single product by barcode ----

  async findByBarcode(
    storeId: string,
    barcode: string,
  ): Promise<Product | undefined> {
    return this.products
      .where({ store_id: storeId, barcode })
      .first()
  }

  // ---- Orders within a date range ----

  async getOrdersByDateRange(
    storeId: string,
    from: string,
    to: string,
  ): Promise<Order[]> {
    return this.orders
      .where('store_id')
      .equals(storeId)
      .filter((o) => o.created_at >= from && o.created_at <= to)
      .toArray()
  }

  // ---- Today's orders ----

  async getTodayOrders(storeId: string): Promise<Order[]> {
    const now = new Date()
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString()
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    ).toISOString()
    return this.getOrdersByDateRange(storeId, startOfDay, endOfDay)
  }

  // ---- Count of pending sync items ----

  async getPendingSyncCount(storeId: string): Promise<number> {
    return this.sync_queue
      .where('store_id')
      .equals(storeId)
      .filter((e) => !e.synced_at)
      .count()
  }

  // ---- Low-stock products (stock <= min_stock) ----

  async getLowStockProducts(storeId: string): Promise<Product[]> {
    return this.products
      .where('store_id')
      .equals(storeId)
      .filter(
        (p) =>
          p.is_active && p.min_stock != null && p.stock <= p.min_stock,
      )
      .toArray()
  }
}

// ---------------------------------------------------------------------------
// Singleton database instance
// ---------------------------------------------------------------------------

export const db = new PosDatabase()

// ---------------------------------------------------------------------------
// Device ID -- unique per browser/device, persisted in localStorage
// ---------------------------------------------------------------------------

const DEVICE_ID_KEY = 'pos_device_id'

/**
 * Returns a stable unique device identifier.
 * Generates one with `crypto.randomUUID()` on first call and persists it
 * in localStorage so it survives page reloads and app updates.
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = generateUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}
