// ---------------------------------------------------------------------------
// POS Mano Verde SA -- Comprehensive TypeScript Types
// Currency: FCFA (Central African CFA Franc, ISO 4217: XAF)
// ---------------------------------------------------------------------------

// -- Application modes -------------------------------------------------------

/** server = manager terminal (back-office) | client = cashier terminal */
export type Mode = 'server' | 'client'

// -- Activity types ----------------------------------------------------------

/** Business verticals supported by the POS */
export type Activity =
  | 'restaurant'
  | 'supermarket'
  | 'pharmacy'
  | 'fashion'
  | 'electronics'
  | 'services'
  | 'bar'
  | 'bakery'
  | 'hotel'
  | 'hair_salon'
  | 'spa'
  | 'gym'
  | 'pool'
  | 'car_wash'
  | 'gas_station'
  | 'laundry'
  | 'auto_repair'
  | 'daycare'
  | 'school'
  | 'home_cleaning'
  | 'florist'
  | 'pet_shop'
  | 'bookstore'
  | 'printing'
  | 'real_estate'
  | 'travel_agency'

// -- Store / Boutique --------------------------------------------------------

export type Store = {
  id: string
  name: string
  address: string
  phone: string
  activity: Activity
  logo_url?: string
  tax_id?: string
  currency: string // default 'XAF' (FCFA)
  tax_rate: number // percentage, e.g. 19.25
  created_at: string
  updated_at: string
}

// -- Users -------------------------------------------------------------------

export type UserRole = 'admin' | 'manager' | 'cashier' | 'stock'

export type User = {
  id: string
  store_id: string
  name: string
  email: string
  role: UserRole
  pin?: string // 4-6 digit PIN for quick POS login
  phone?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

// -- Products ----------------------------------------------------------------

export type Product = {
  id: string
  store_id: string
  name: string
  price: number // selling price in FCFA
  cost?: number // purchase cost in FCFA
  stock: number // current quantity on hand
  min_stock?: number // reorder threshold
  category: string
  sku?: string
  barcode?: string
  image_url?: string
  unit?: string // 'piece' | 'kg' | 'litre' | 'box' ...
  is_active: boolean
  created_at: string
  updated_at: string
}

// -- Cart (in-memory, not persisted to DB) -----------------------------------

export type CartItem = {
  product_id: string
  name: string
  price: number // unit price in FCFA
  qty: number
  discount?: number // item-level discount in FCFA
}

// -- Payment -----------------------------------------------------------------

export type PaymentMethod = 'cash' | 'card' | 'momo' | 'transfer'

// -- Orders ------------------------------------------------------------------

export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'cancelled'

export type Order = {
  id: string
  store_id: string
  user_id: string // cashier who created the order
  items: CartItem[]
  subtotal: number // sum of (price * qty) in FCFA
  discount: number // order-level discount in FCFA
  tax: number // tax amount in FCFA
  total: number // final amount in FCFA
  amount_received?: number // cash tendered
  change_due?: number // change given back
  payment_method: PaymentMethod
  status: OrderStatus
  note?: string
  synced: boolean // false = needs sync, true = synced to server
  device_id: string
  created_at: string
  updated_at: string
}

// -- Stock movements ---------------------------------------------------------

export type StockMoveType = 'in' | 'out' | 'adjust' | 'sale' | 'return'

export type StockMove = {
  id: string
  store_id: string
  product_id: string
  type: StockMoveType
  qty: number // positive = increase, negative = decrease
  reason?: string
  reference_id?: string // e.g. order_id for sale type
  user_id: string
  synced: boolean
  created_at: string
}

// -- Sync queue --------------------------------------------------------------

export type SyncOperation = 'create' | 'update' | 'delete'

export type SyncEntry = {
  id: string
  entity_type: 'product' | 'order' | 'stock_move' | 'user'
  entity_id: string
  operation: SyncOperation
  data: string // JSON-stringified entity payload
  device_id: string
  store_id: string
  retries: number // number of failed sync attempts
  created_at: string
  synced_at?: string
}

// -- Connection status -------------------------------------------------------

/**
 * online      - connected to remote server / Supabase
 * offline     - no network, operating from local IndexedDB
 * local-only  - intentionally configured without remote backend
 */
export type ConnectionStatus = 'online' | 'offline' | 'local-only'

// -- Printer -----------------------------------------------------------------

export type PrinterStatus = 'connected' | 'disconnected' | 'printing' | 'error'

export type PrinterInfo = {
  name: string
  id: string
  status: PrinterStatus
  type?: 'thermal' | 'standard'
  width?: number // paper width in mm (e.g. 58 or 80)
}

// -- Receipt -----------------------------------------------------------------

export type ReceiptLine = {
  label: string
  value: string
  bold?: boolean
}

export type Receipt = {
  store_name: string
  store_address: string
  store_phone: string
  cashier_name: string
  order_id: string
  date: string
  items: CartItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  payment_method: PaymentMethod
  amount_received?: number
  change_due?: number
  footer?: string
}

// -- Dashboard / Reports -----------------------------------------------------

export type DailySummary = {
  date: string
  total_orders: number
  total_revenue: number // in FCFA
  total_cost: number
  gross_profit: number
  payment_breakdown: Record<PaymentMethod, number>
  top_products: Array<{
    product_id: string
    name: string
    qty: number
    revenue: number
  }>
}

export type DateRange = {
  from: string // ISO date string
  to: string // ISO date string
}

// -- API responses -----------------------------------------------------------

export type ApiResponse<T> = {
  data: T | null
  error: string | null
  status: number
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// -- Settings ----------------------------------------------------------------

export type AppSettings = {
  mode: Mode
  server_url: string
  store_id: string
  device_id: string
  activity: Activity
  language: 'fr' | 'en'
  theme: 'light' | 'dark'
  auto_print: boolean
  sound_enabled: boolean
  tax_inclusive: boolean // whether displayed prices include tax
}
