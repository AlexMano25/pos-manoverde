// ---------------------------------------------------------------------------
// POS Mano Verde SA -- Comprehensive TypeScript Types
// Currency: FCFA (Central African CFA Franc, ISO 4217: XAF)
// ---------------------------------------------------------------------------

// -- Application modes -------------------------------------------------------

/** server = manager terminal (back-office) | client = cashier terminal */
export type Mode = 'server' | 'client' | 'all_in_one'

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

// -- Sidebar section identifiers ----------------------------------------------

/** All possible sidebar sections across all activities */
export type SidebarSection =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'orders'
  | 'stock'
  | 'employees'
  | 'settings'
  | 'billing'
  // Activity-specific sections (reuse existing page components)
  | 'reservations'  // hotel, travel_agency
  | 'rooms'         // hotel
  | 'properties'    // real_estate
  | 'contracts'     // real_estate
  | 'clients'       // real_estate, travel_agency
  | 'enrollments'   // school, daycare
  | 'services'      // gym, spa, pool, laundry, etc.
  | 'members'       // gym, spa, pool
  | 'schedule'      // gym, spa
  | 'workshop'      // auto_repair
  | 'parts'         // auto_repair
  | 'invoices'      // auto_repair
  | 'appointments'  // hair_salon
  | 'bookings'      // travel_agency
  | 'packages'      // travel_agency

/** Which existing page component to render for a sidebar section */
export type PageComponent =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'orders'
  | 'stock'
  | 'employees'
  | 'settings'
  | 'billing'

/** Sidebar item configuration */
export type SidebarItemConfig = {
  section: SidebarSection
  icon: string             // Lucide icon component name
  i18nKey: string          // dot-path key e.g. 'nav.reservations'
  pageComponent: PageComponent
  allowedRoles?: UserRole[] // undefined = all roles
  serverOnly?: boolean      // only visible in server/all_in_one mode
}

// -- Store / Boutique --------------------------------------------------------

export type Store = {
  id: string
  organization_id?: string
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

  // ── Activity-specific optional fields ──
  description?: string       // General: long text description
  expiry_date?: string       // pharmacy, supermarket, bakery: ISO date
  dosage?: string            // pharmacy: e.g. "500mg", "2x/day"
  manufacturer?: string      // pharmacy, electronics: brand/maker
  room_type?: string         // hotel: "single", "double", "suite"
  room_number?: string       // hotel: "101", "A-3"
  duration_minutes?: number  // spa, gym, hair_salon, car_wash, services: session length
  weight_kg?: number         // supermarket, bakery, florist, pet_shop: product weight
  size?: string              // fashion: "S/M/L/XL" or "42"
  color?: string             // fashion, florist: item color
  vehicle_type?: string      // auto_repair, car_wash, gas_station: "car", "moto", "truck"
  author?: string            // bookstore: book author
  isbn?: string              // bookstore: International Standard Book Number
  destination?: string       // travel_agency: trip destination
  age_group?: string         // daycare, school: "0-3", "3-6", "6-12"
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

export type PaymentMethod = 'cash' | 'card' | 'momo' | 'transfer' | 'orange_money' | 'mtn_money' | 'carte_bancaire'

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

// -- Subscription Plans -------------------------------------------------------

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise' | 'pay_as_you_grow'
export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trial'

// -- Organization -------------------------------------------------------------

export type Organization = {
  id: string
  name: string
  owner_name: string
  owner_email: string
  owner_phone?: string
  address?: string
  tax_id?: string
  created_at: string
  updated_at: string
}

// -- Subscription -------------------------------------------------------------

export type Subscription = {
  id: string
  organization_id: string
  plan: SubscriptionPlan
  billing_cycle: BillingCycle
  payment_method?: string
  price_fcfa: number
  status: SubscriptionStatus
  current_period_start: string
  current_period_end?: string
  created_at: string
  updated_at: string
}

// -- Invoice ------------------------------------------------------------------

export type Invoice = {
  id: string
  organization_id: string
  subscription_id?: string
  invoice_number: string
  amount_fcfa: number
  payment_method?: string
  payment_reference?: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  issued_at: string
  paid_at?: string
  billing_name?: string
  billing_email?: string
  billing_phone?: string
  billing_address?: string
  created_at: string
}

// -- Credit Balance (Pay-as-you-grow) ----------------------------------------

export type CreditBalance = {
  id: string
  organization_id: string
  balance_usd: number
  total_loaded_usd: number
  total_consumed_usd: number
  updated_at: string
}

export type CreditTransaction = {
  id: string
  organization_id: string
  store_id?: string
  type: 'load' | 'deduct' | 'refund' | 'bonus'
  amount_usd: number
  description?: string
  reference_id?: string
  activity?: string
  created_at: string
}

// -- Dashboard Widgets --------------------------------------------------------

export type StatCardVariant =
  | 'revenue' | 'orders' | 'products' | 'low_stock' | 'credit'
  | 'avg_check' | 'avg_order' | 'gross_margin' | 'food_cost' | 'beverage_cost'
  | 'expiring_items' | 'occupancy' | 'appointments_today' | 'services_today'
  | 'active_members' | 'vehicles_today' | 'pending_bookings' | 'pending_jobs'
  | 'enrollment' | 'active_listings' | 'conversions' | 'capacity_rate'

export type WidgetType =
  | 'stat_card'
  | 'quick_actions'
  | 'recent_items'
  | 'category_breakdown'
  | 'alerts_panel'
  | 'contract_shortcuts'
  | 'peak_hours'

export type AlertVariant =
  | 'low_stock'
  | 'expiring_soon'
  | 'pending_bookings'
  | 'pending_repairs'
  | 'overdue_payments'
  | 'contract_expiring'

export type QuickActionDef = {
  i18nKey: string
  icon: string
  targetSection: string
}

export type DashboardWidgetConfig = {
  type: WidgetType
  variant?: StatCardVariant
  actions?: QuickActionDef[]
  itemType?: 'orders' | 'bookings' | 'appointments' | 'repairs' | 'jobs'
  alertTypes?: AlertVariant[]
  templates?: string[]
  colSpan?: number
}

export type ActivityDashboardConfig = {
  statCards: StatCardVariant[]
  quickActions: QuickActionDef[]
  widgets: DashboardWidgetConfig[]
}

// -- Contract Templates -------------------------------------------------------

export type ContractFieldType = 'text' | 'date' | 'number' | 'textarea' | 'select'

export type ContractField = {
  key: string
  i18nKey: string
  type: ContractFieldType
  required: boolean
  options?: string[]
}

export type ContractTemplate = {
  key: string
  i18nKey: string
  activities: Activity[]
  icon: string
  fields: ContractField[]
}

// -- Registration Data --------------------------------------------------------

export type RegistrationData = {
  orgName: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  ownerAddress: string
  plan: SubscriptionPlan
  billingCycle: BillingCycle
  paymentMethod: string
  storeName: string
  activity: Activity
  password: string
  termsAcceptedAt?: string
}

