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

// -- Restaurant / Bar table management ----------------------------------------

export type TableStatus = 'free' | 'occupied' | 'reserved' | 'bill_requested'

export type RestaurantTable = {
  id: string
  store_id: string
  number: number
  name: string
  capacity: number
  status: TableStatus
  current_order_id?: string
  zone?: string
  created_at: string
  updated_at: string
}

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
  | 'tables'       // restaurant, bar, bakery, hotel
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
  | 'customers'     // CRM — all activities
  | 'promotions'    // promotions engine
  | 'reports'       // advanced reporting
  | 'quotes'        // quotes/estimates
  // Phase 3 — cash register, suppliers, invoices, deliveries
  | 'cash_register'  // all activities
  | 'suppliers'      // retail, food & beverage, auto_repair
  | 'deliveries'     // restaurant, pharmacy, florist, etc.
  // Phase 4 — time attendance, loyalty, KDS
  | 'time_attendance' // all activities
  | 'loyalty'         // all activities
  | 'kds'             // food & beverage only
  // Phase 5 — gift cards, expenses, campaigns, payroll
  | 'gift_cards'      // all activities
  | 'expenses'        // all activities
  | 'campaigns'       // all activities
  | 'payroll'         // all activities
  // Phase 6 — notifications, audit trail, returns, documents
  | 'notifications'   // all activities
  | 'audit_trail'     // all activities (admin only)
  | 'returns'         // all activities
  | 'documents'       // all activities
  // Phase 7 — transfers, recipes, online orders, maintenance
  | 'transfers'        // multi-store stock transfers
  | 'recipes'          // recipe & production management (food)
  | 'online_orders'    // e-commerce / online ordering
  | 'maintenance'      // equipment & facility maintenance

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
  | 'tables'
  | 'customers'
  | 'promotions'
  | 'reports'
  // Phase 2 — activity-specific modules
  | 'appointments'
  | 'memberships'
  | 'work_orders'
  | 'quotes'
  // Phase 3 — cash register, suppliers, invoices, deliveries
  | 'cash_register'
  | 'suppliers'
  | 'invoices'
  | 'deliveries'
  // Phase 4 — time attendance, loyalty, KDS
  | 'time_attendance'
  | 'loyalty'
  | 'kds'
  // Phase 5 — gift cards, expenses, campaigns, payroll
  | 'gift_cards'
  | 'expenses'
  | 'campaigns'
  | 'payroll'
  // Phase 6 — notifications, audit trail, returns, documents
  | 'notifications'
  | 'audit_trail'
  | 'returns'
  | 'documents'
  // Phase 7 — transfers, recipes, online orders, maintenance
  | 'transfers'
  | 'recipes'
  | 'online_orders'
  | 'maintenance'

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

// -- Customers / CRM ----------------------------------------------------------

export type Customer = {
  id: string
  store_id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  loyalty_points: number
  total_spent: number
  visit_count: number
  last_visit?: string
  tags?: string[]       // "VIP", "allergies", "professionnel"
  created_at: string
  updated_at: string
}

// -- Promotions ---------------------------------------------------------------

export type PromotionType = 'percentage' | 'fixed_amount' | 'bogo' | 'bundle' | 'happy_hour'

export type PromotionConditions = {
  min_qty?: number        // qté minimum pour déclencher
  min_amount?: number     // montant minimum
  categories?: string[]   // catégories éligibles
  product_ids?: string[]  // produits spécifiques
  days?: number[]         // jours de la semaine (0=dim, 6=sam)
  time_start?: string     // "17:00" (happy hour)
  time_end?: string       // "19:00"
  customer_only?: boolean // réservé clients fidélité
}

export type Promotion = {
  id: string
  store_id: string
  name: string
  type: PromotionType
  value: number             // % ou montant fixe
  conditions: PromotionConditions
  start_date: string
  end_date?: string
  is_active: boolean
  usage_count: number
  max_uses?: number
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

export type PaymentMethod = 'cash' | 'card' | 'momo' | 'transfer' | 'orange_money' | 'mtn_money' | 'carte_bancaire' | 'paypal'

// -- Payment integration types ------------------------------------------------

export type PayPalResult = {
  mode: 'subscription' | 'capture'
  subscriptionId?: string
  orderId?: string
  payerId?: string
  amount?: number
  currency?: string
  status: string
}

export type OrangeMoneyStatus = 'pending' | 'success' | 'failed' | 'expired'

export type OrangeMoneyPaymentResult = {
  transactionId: string
  status: OrangeMoneyStatus
  phoneNumber: string
  amount: number
  currency: string
}

export type RechargePackage = {
  id: string
  label: string
  amountXAF: number
  amountUSD: number
  tickets: number
}

export type PaymentGateway = 'paypal' | 'orange_money' | 'mtn_momo'

// -- Orders ------------------------------------------------------------------

export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'cancelled'

// Split payment support
export type OrderPayment = {
  method: PaymentMethod
  amount: number
}

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
  payment_method: PaymentMethod // primary method (backward compat)
  payments?: OrderPayment[] // split payments (Phase 4)
  status: OrderStatus
  note?: string
  synced: boolean // false = needs sync, true = synced to server
  device_id: string
  table_id?: string       // restaurant table association
  table_name?: string     // e.g. "Table 5"
  customer_id?: string    // CRM customer association
  customer_name?: string  // denormalized for quick display
  promotion_discount?: number // discount from promotions engine
  promotion_names?: string[]  // applied promotion names
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
  entity_type: 'product' | 'order' | 'stock_move' | 'user' | 'customer' | 'promotion' | 'appointment' | 'membership' | 'work_order' | 'quote' | 'cash_session' | 'supplier' | 'purchase_order' | 'pos_invoice' | 'delivery' | 'time_entry' | 'loyalty_reward' | 'point_transaction' | 'kds_order' | 'gift_card' | 'gift_card_transaction' | 'expense' | 'campaign' | 'payroll_entry' | 'commission_rule' | 'notification' | 'audit_log' | 'pos_return' | 'pos_document' | 'stock_transfer' | 'recipe' | 'production_batch' | 'online_order' | 'maintenance_task'
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
  action?: 'add'  // triggers an action on the target page (e.g. open add modal)
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

// -- Appointments / Reservations / Bookings -----------------------------------

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

export type Appointment = {
  id: string
  store_id: string
  customer_id?: string
  customer_name?: string
  service_id?: string        // product_id of the service
  service_name?: string
  staff_id?: string          // assigned employee
  staff_name?: string
  date: string               // 'YYYY-MM-DD'
  time_start: string         // 'HH:mm'
  time_end: string           // 'HH:mm'
  duration_minutes: number
  status: AppointmentStatus
  price?: number
  notes?: string
  // Hotel-specific
  room_id?: string
  room_number?: string
  guests?: number
  // Travel-specific
  destination?: string
  passengers?: number
  synced: boolean
  created_at: string
  updated_at: string
}

// -- Memberships / Subscriptions ----------------------------------------------

export type MembershipStatus = 'active' | 'expired' | 'suspended' | 'cancelled'
export type MembershipPlanType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'session_pack'

export type Membership = {
  id: string
  store_id: string
  customer_id: string
  customer_name: string
  plan_type: MembershipPlanType
  plan_name: string
  price: number
  status: MembershipStatus
  start_date: string
  end_date: string
  sessions_total?: number     // for session_pack type
  sessions_used?: number
  auto_renew: boolean
  payment_method?: string
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// -- Work Orders / Service Tickets --------------------------------------------

export type WorkOrderStatus = 'received' | 'diagnosed' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
export type WorkOrderPriority = 'low' | 'normal' | 'high' | 'urgent'

export type WorkOrderItem = {
  description: string
  type: 'labor' | 'part' | 'service'
  product_id?: string
  quantity: number
  unit_price: number
  total: number
}

export type WorkOrder = {
  id: string
  store_id: string
  order_number: string       // auto-generated: "WO-YYMMDD-NNN"
  customer_id?: string
  customer_name?: string
  customer_phone?: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  item_description: string   // "Toyota Corolla 2019" / "iPhone 14" / "3 suits"
  item_identifier?: string   // license plate / serial number / tag number
  diagnosis?: string
  items: WorkOrderItem[]
  labor_total: number
  parts_total: number
  estimated_total: number
  final_total?: number
  received_at: string
  estimated_completion?: string
  completed_at?: string
  delivered_at?: string
  quote_id?: string          // linked quote
  order_id?: string          // linked POS order when invoiced
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// -- Quotes / Estimates -------------------------------------------------------

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'

export type QuoteItem = {
  description: string
  product_id?: string
  quantity: number
  unit_price: number
  discount?: number
  total: number
}

export type Quote = {
  id: string
  store_id: string
  quote_number: string       // auto-generated: "QT-YYMMDD-NNN"
  customer_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  status: QuoteStatus
  title: string
  items: QuoteItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  valid_until: string
  notes?: string
  terms?: string
  work_order_id?: string     // if converted to work order
  order_id?: string          // if converted to order
  synced: boolean
  created_at: string
  updated_at: string
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

// -- Phase 3: Cash Register, Suppliers, POS Invoices, Deliveries ---------------

// Cash Register / Till Management
export type CashSessionStatus = 'open' | 'closed'
export type CashMovementType = 'cash_in' | 'cash_out' | 'tip' | 'petty_cash' | 'return'

export type DenominationCount = {
  denomination: number
  count: number
  total: number
}

export type CashMovement = {
  id: string
  type: CashMovementType
  amount: number
  reason?: string
  user_id: string
  user_name?: string
  created_at: string
}

export type CashSession = {
  id: string
  store_id: string
  user_id: string
  user_name?: string
  status: CashSessionStatus
  opening_float: number
  closing_count: DenominationCount[]
  closing_total: number
  cash_sales_total: number
  expected_cash: number
  discrepancy: number
  cash_movements: CashMovement[]
  opened_at: string
  closed_at?: string
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// Suppliers & Purchase Orders
export type PurchaseOrderStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'

export type PurchaseOrderItem = {
  product_id?: string
  description: string
  quantity: number
  received_quantity: number
  unit_cost: number
  total: number
}

export type PurchaseOrder = {
  id: string
  store_id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  items: PurchaseOrderItem[]
  subtotal: number
  tax: number
  total: number
  status: PurchaseOrderStatus
  expected_delivery?: string
  received_at?: string
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

export type Supplier = {
  id: string
  store_id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  category?: string
  payment_terms?: string
  notes?: string
  is_active: boolean
  synced: boolean
  created_at: string
  updated_at: string
}

// POS Invoices (customer invoices, not subscription billing)
export type PosInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export type PosInvoiceItem = {
  description: string
  product_id?: string
  quantity: number
  unit_price: number
  tax_rate: number
  discount: number
  total: number
}

export type PosInvoicePayment = {
  id: string
  amount: number
  payment_method: PaymentMethod
  paid_at: string
  note?: string
}

export type PosInvoice = {
  id: string
  store_id: string
  invoice_number: string
  customer_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  customer_address?: string
  status: PosInvoiceStatus
  items: PosInvoiceItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  amount_paid: number
  balance_due: number
  payments: PosInvoicePayment[]
  order_id?: string
  work_order_id?: string
  quote_id?: string
  due_date?: string
  issued_at: string
  paid_at?: string
  notes?: string
  terms?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// Delivery Management
export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
export type DeliveryFeeType = 'flat' | 'zone'

export type Delivery = {
  id: string
  store_id: string
  order_id?: string
  customer_id?: string
  customer_name?: string
  customer_phone?: string
  delivery_address: string
  delivery_notes?: string
  driver_id?: string
  driver_name?: string
  status: DeliveryStatus
  fee: number
  fee_type: DeliveryFeeType
  zone?: string
  estimated_time?: string
  picked_up_at?: string
  delivered_at?: string
  failed_reason?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Phase 4 — Time & Attendance, Loyalty & Rewards, Kitchen Display
// ---------------------------------------------------------------------------

// Time & Attendance
export type ClockStatus = 'clocked_in' | 'clocked_out' | 'on_break'

export type TimeEntry = {
  id: string
  store_id: string
  user_id: string
  user_name: string
  clock_in: string
  clock_out?: string
  break_start?: string
  break_end?: string
  total_hours?: number
  status: ClockStatus
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// Loyalty & Rewards
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export type PointTransactionType = 'earn' | 'redeem' | 'bonus' | 'expire' | 'adjust'

export type LoyaltyRewardType = 'discount_pct' | 'discount_fixed' | 'free_product' | 'voucher'

export type LoyaltyReward = {
  id: string
  store_id: string
  name: string
  description?: string
  points_required: number
  reward_type: LoyaltyRewardType
  reward_value: number
  is_active: boolean
  image_url?: string
  redemption_count: number
  synced: boolean
  created_at: string
  updated_at: string
}

export type PointTransaction = {
  id: string
  store_id: string
  customer_id: string
  customer_name: string
  type: PointTransactionType
  points: number
  balance_after: number
  order_id?: string
  reward_id?: string
  description?: string
  synced: boolean
  created_at: string
}

export type LoyaltyConfig = {
  points_per_unit: number
  currency_per_point: number
  tier_thresholds: Record<LoyaltyTier, number>
}

// Kitchen Display System (KDS)
export type KdsOrderStatus = 'new' | 'in_progress' | 'ready' | 'served'

export type KdsStation = 'grill' | 'fridge' | 'drinks' | 'pastry' | 'expo' | 'all'

export type KdsOrderItem = {
  product_name: string
  quantity: number
  notes?: string
  station: KdsStation
  done: boolean
}

export type KdsOrder = {
  id: string
  store_id: string
  order_id: string
  order_number: string
  table_number?: string
  items: KdsOrderItem[]
  status: KdsOrderStatus
  station: KdsStation
  priority: boolean
  created_at: string
  started_at?: string
  completed_at?: string
  elapsed_seconds?: number
  synced: boolean
}

// ---------------------------------------------------------------------------
// Phase 5 — Gift Cards, Expense Tracking, Marketing Campaigns, Payroll
// ---------------------------------------------------------------------------

// Gift Cards & Vouchers
export type GiftCardStatus = 'active' | 'redeemed' | 'expired' | 'disabled'

export type GiftCard = {
  id: string
  store_id: string
  code: string              // unique redemption code e.g. "GC-XXXX-YYYY"
  initial_balance: number
  current_balance: number
  status: GiftCardStatus
  customer_id?: string
  customer_name?: string
  purchased_by?: string     // name of purchaser
  recipient_name?: string
  recipient_email?: string
  recipient_phone?: string
  message?: string          // personal message on the card
  expires_at?: string
  activated_at?: string
  last_used_at?: string
  synced: boolean
  created_at: string
  updated_at: string
}

export type GiftCardTransaction = {
  id: string
  store_id: string
  gift_card_id: string
  gift_card_code: string
  type: 'purchase' | 'redeem' | 'refund' | 'adjust' | 'expire'
  amount: number
  balance_after: number
  order_id?: string
  cashier_id?: string
  cashier_name?: string
  notes?: string
  synced: boolean
  created_at: string
}

// Expense Tracking
export type ExpenseCategory = 'rent' | 'utilities' | 'salaries' | 'supplies' | 'marketing' | 'maintenance' | 'transport' | 'taxes' | 'insurance' | 'food_cost' | 'equipment' | 'other'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid'
export type ExpenseRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export type Expense = {
  id: string
  store_id: string
  category: ExpenseCategory
  description: string
  amount: number
  payment_method?: PaymentMethod
  vendor?: string
  receipt_url?: string
  status: ExpenseStatus
  approved_by?: string
  user_id: string
  user_name: string
  recurrence: ExpenseRecurrence
  expense_date: string
  notes?: string
  tags?: string[]
  synced: boolean
  created_at: string
  updated_at: string
}

// Marketing Campaigns
export type CampaignType = 'sms' | 'email' | 'push' | 'whatsapp'
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
export type CampaignAudience = 'all_customers' | 'vip' | 'inactive' | 'birthday' | 'loyalty_tier' | 'custom'

export type Campaign = {
  id: string
  store_id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  audience: CampaignAudience
  audience_filter?: string       // JSON-encoded filter for custom audiences
  subject?: string               // email subject line
  message: string                // campaign body/content
  template_id?: string
  scheduled_at?: string
  sent_at?: string
  recipients_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  failed_count: number
  promotion_id?: string          // linked promotion
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// Payroll & Commissions
export type PayrollStatus = 'draft' | 'approved' | 'paid'
export type CommissionType = 'percentage' | 'fixed_per_sale' | 'tiered'

export type PayrollEntry = {
  id: string
  store_id: string
  user_id: string
  user_name: string
  period_start: string
  period_end: string
  base_salary: number
  hours_worked: number
  overtime_hours: number
  overtime_pay: number
  commission_total: number
  tips_total: number
  bonuses: number
  deductions: number
  net_pay: number
  status: PayrollStatus
  approved_by?: string
  paid_at?: string
  payment_method?: PaymentMethod
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

export type CommissionRule = {
  id: string
  store_id: string
  name: string
  type: CommissionType
  value: number                  // percentage or fixed amount
  min_sales?: number             // minimum sales to qualify
  product_categories?: string[]  // specific categories eligible
  is_active: boolean
  synced: boolean
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Phase 6 — Notifications, Audit Trail, Returns & Refunds, Documents
// ---------------------------------------------------------------------------

// Notifications & Alerts
export type NotificationType = 'low_stock' | 'new_order' | 'payment_due' | 'appointment_reminder' | 'employee_clock' | 'delivery_update' | 'return_request' | 'system' | 'campaign' | 'custom'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export type PosNotification = {
  id: string
  store_id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  is_read: boolean
  is_dismissed: boolean
  action_url?: string           // deep-link section e.g. "stock", "orders"
  action_id?: string            // entity ID for navigation
  user_id?: string              // target user (null = all users)
  created_by?: string           // system or user ID
  read_at?: string
  expires_at?: string
  synced: boolean
  created_at: string
}

// Audit Trail / Activity Log
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'print' | 'approve' | 'reject' | 'refund' | 'void' | 'clock_in' | 'clock_out' | 'settings_change'
export type AuditModule = 'pos' | 'products' | 'orders' | 'stock' | 'employees' | 'customers' | 'settings' | 'cash_register' | 'suppliers' | 'invoices' | 'deliveries' | 'loyalty' | 'gift_cards' | 'expenses' | 'campaigns' | 'payroll' | 'returns' | 'auth' | 'system'

export type AuditLog = {
  id: string
  store_id: string
  user_id: string
  user_name: string
  action: AuditAction
  module: AuditModule
  entity_type?: string
  entity_id?: string
  description: string
  old_value?: string            // JSON-stringified previous state
  new_value?: string            // JSON-stringified new state
  ip_address?: string
  device_info?: string
  created_at: string
}

// Returns & Refunds
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'processed' | 'refunded'
export type ReturnReason = 'defective' | 'wrong_item' | 'not_satisfied' | 'expired' | 'damaged' | 'duplicate' | 'other'
export type RefundMethod = 'original_payment' | 'cash' | 'store_credit' | 'gift_card' | 'exchange'

export type ReturnItem = {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total: number
  reason: ReturnReason
  condition: 'new' | 'used' | 'damaged'
  restock: boolean
}

export type PosReturn = {
  id: string
  store_id: string
  return_number: string         // auto-generated: "RT-YYMMDD-NNN"
  order_id: string
  order_number?: string
  customer_id?: string
  customer_name?: string
  items: ReturnItem[]
  subtotal: number
  tax_refund: number
  total_refund: number
  refund_method: RefundMethod
  status: ReturnStatus
  reason_notes?: string
  processed_by?: string
  processed_by_name?: string
  approved_by?: string
  approved_by_name?: string
  exchange_order_id?: string    // new order ID if exchanged
  gift_card_id?: string         // if refunded to gift card
  synced: boolean
  created_at: string
  updated_at: string
}

// Documents & File Management
export type DocumentType = 'receipt' | 'invoice' | 'contract' | 'report' | 'certificate' | 'license' | 'photo' | 'manual' | 'other'
export type DocumentStatus = 'active' | 'archived' | 'expired'

export type PosDocument = {
  id: string
  store_id: string
  name: string
  type: DocumentType
  description?: string
  file_url?: string             // URL or base64 data
  file_size?: number            // bytes
  mime_type?: string
  category?: string
  tags?: string[]
  related_entity_type?: string  // e.g. 'order', 'customer', 'employee'
  related_entity_id?: string
  status: DocumentStatus
  uploaded_by: string
  uploaded_by_name: string
  expires_at?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Phase 7 — Stock Transfers, Recipes & Production, Online Orders, Maintenance
// ---------------------------------------------------------------------------

// Stock Transfers (inter-store)
export type TransferStatus = 'draft' | 'pending' | 'in_transit' | 'received' | 'cancelled'

export type TransferItem = {
  product_id: string
  product_name: string
  quantity_sent: number
  quantity_received: number
  unit_cost: number
  total: number
}

export type StockTransfer = {
  id: string
  store_id: string
  transfer_number: string
  from_store_id: string
  from_store_name: string
  to_store_id: string
  to_store_name: string
  items: TransferItem[]
  total_items: number
  total_value: number
  status: TransferStatus
  requested_by: string
  requested_by_name: string
  approved_by?: string
  approved_by_name?: string
  shipped_at?: string
  received_at?: string
  received_by?: string
  received_by_name?: string
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// Recipes & Production
export type RecipeStatus = 'active' | 'draft' | 'archived'
export type ProductionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export type RecipeIngredient = {
  product_id: string
  product_name: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
}

export type Recipe = {
  id: string
  store_id: string
  name: string
  category?: string
  description?: string
  output_product_id?: string
  output_product_name?: string
  output_quantity: number
  ingredients: RecipeIngredient[]
  instructions?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  total_cost: number
  selling_price?: number
  margin_percent?: number
  status: RecipeStatus
  image_url?: string
  allergens?: string[]
  tags?: string[]
  synced: boolean
  created_at: string
  updated_at: string
}

export type ProductionBatch = {
  id: string
  store_id: string
  batch_number: string
  recipe_id: string
  recipe_name: string
  quantity: number
  status: ProductionStatus
  planned_date: string
  started_at?: string
  completed_at?: string
  produced_by?: string
  produced_by_name?: string
  actual_cost?: number
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// Online Orders / E-commerce
export type OnlineOrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type OnlineOrderChannel = 'website' | 'mobile_app' | 'whatsapp' | 'facebook' | 'instagram' | 'marketplace' | 'other'
export type OnlineFulfillment = 'delivery' | 'pickup' | 'dine_in'

export type OnlineOrderItem = {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  notes?: string
  total: number
}

export type OnlineOrder = {
  id: string
  store_id: string
  order_number: string
  channel: OnlineOrderChannel
  customer_name: string
  customer_email?: string
  customer_phone?: string
  delivery_address?: string
  fulfillment: OnlineFulfillment
  items: OnlineOrderItem[]
  subtotal: number
  delivery_fee: number
  discount: number
  tax: number
  total: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method?: PaymentMethod
  status: OnlineOrderStatus
  estimated_delivery?: string
  delivered_at?: string
  pos_order_id?: string
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}

// Maintenance & Equipment
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical'
export type MaintenanceType = 'preventive' | 'corrective' | 'emergency' | 'inspection'

export type MaintenanceTask = {
  id: string
  store_id: string
  task_number: string
  title: string
  description?: string
  equipment_name: string
  equipment_id?: string
  location?: string
  type: MaintenanceType
  priority: MaintenancePriority
  status: MaintenanceStatus
  assigned_to?: string
  assigned_to_name?: string
  scheduled_date: string
  due_date?: string
  started_at?: string
  completed_at?: string
  completed_by?: string
  completed_by_name?: string
  cost?: number
  parts_used?: string[]
  vendor?: string
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  last_maintenance?: string
  next_maintenance?: string
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string
}
