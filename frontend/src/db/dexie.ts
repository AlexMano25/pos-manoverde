import Dexie, { type Table } from 'dexie'
import type {
  Appointment,
  AuditLog,
  BarcodeBatch,
  Campaign,
  CashSession,
  CommissionRule,
  Customer,
  Delivery,
  Expense,
  GiftCard,
  GiftCardTransaction,
  KdsOrder,
  KioskSession,
  LoyaltyReward,
  MaintenanceTask,
  Membership,
  OnlineOrder,
  Order,
  PayrollEntry,
  PointTransaction,
  PosDocument,
  PosInvoice,
  PosNotification,
  PosReturn,
  PricingRule,
  Product,
  ProductionBatch,
  Promotion,
  PurchaseOrder,
  Quote,
  Recipe,
  RestaurantTable,
  StockMove,
  StockTransfer,
  Supplier,
  SyncEntry,
  Store,
  TimeEntry,
  User,
  WarrantyClaim,
  WorkOrder,
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
  restaurant_tables!: Table<RestaurantTable, string>
  customers!: Table<Customer, string>
  promotions!: Table<Promotion, string>
  appointments!: Table<Appointment, string>
  memberships!: Table<Membership, string>
  work_orders!: Table<WorkOrder, string>
  quotes!: Table<Quote, string>
  cash_sessions!: Table<CashSession, string>
  suppliers!: Table<Supplier, string>
  purchase_orders!: Table<PurchaseOrder, string>
  pos_invoices!: Table<PosInvoice, string>
  deliveries!: Table<Delivery, string>
  time_entries!: Table<TimeEntry, string>
  loyalty_rewards!: Table<LoyaltyReward, string>
  point_transactions!: Table<PointTransaction, string>
  kds_orders!: Table<KdsOrder, string>
  gift_cards!: Table<GiftCard, string>
  gift_card_transactions!: Table<GiftCardTransaction, string>
  expenses!: Table<Expense, string>
  campaigns!: Table<Campaign, string>
  payroll_entries!: Table<PayrollEntry, string>
  commission_rules!: Table<CommissionRule, string>
  notifications!: Table<PosNotification, string>
  audit_logs!: Table<AuditLog, string>
  pos_returns!: Table<PosReturn, string>
  pos_documents!: Table<PosDocument, string>
  stock_transfers!: Table<StockTransfer, string>
  recipes!: Table<Recipe, string>
  production_batches!: Table<ProductionBatch, string>
  online_orders!: Table<OnlineOrder, string>
  maintenance_tasks!: Table<MaintenanceTask, string>
  kiosk_sessions!: Table<KioskSession, string>
  warranty_claims!: Table<WarrantyClaim, string>
  barcode_batches!: Table<BarcodeBatch, string>
  pricing_rules!: Table<PricingRule, string>

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
      restaurant_tables:
        'id, store_id, number, status, zone, current_order_id, [store_id+status]',
    })

    // Schema version 5 -- CRM customers + promotions
    this.version(5).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode], [store_id+expiry_date]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced], table_id, customer_id',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
      restaurant_tables:
        'id, store_id, number, status, zone, current_order_id, [store_id+status]',
      customers:
        'id, store_id, name, phone, email, loyalty_points, [store_id+name], [store_id+phone]',
      promotions:
        'id, store_id, type, is_active, start_date, end_date, [store_id+is_active]',
    })

    // Schema version 6 -- Phase 2 activity-specific tables
    this.version(6).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode], [store_id+expiry_date]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced], table_id, customer_id',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
      restaurant_tables:
        'id, store_id, number, status, zone, current_order_id, [store_id+status]',
      customers:
        'id, store_id, name, phone, email, loyalty_points, [store_id+name], [store_id+phone]',
      promotions:
        'id, store_id, type, is_active, start_date, end_date, [store_id+is_active]',
      appointments:
        'id, store_id, customer_id, status, date, [store_id+date], [store_id+status]',
      memberships:
        'id, store_id, customer_id, status, plan_type, end_date, [store_id+status], [store_id+customer_id]',
      work_orders:
        'id, store_id, customer_id, status, priority, [store_id+status]',
      quotes:
        'id, store_id, customer_id, status, valid_until, [store_id+status]',
    })

    // Schema version 7 -- Phase 3: cash register, suppliers, invoices, deliveries
    this.version(7).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode], [store_id+expiry_date]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced], table_id, customer_id',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
      restaurant_tables:
        'id, store_id, number, status, zone, current_order_id, [store_id+status]',
      customers:
        'id, store_id, name, phone, email, loyalty_points, [store_id+name], [store_id+phone]',
      promotions:
        'id, store_id, type, is_active, start_date, end_date, [store_id+is_active]',
      appointments:
        'id, store_id, customer_id, status, date, [store_id+date], [store_id+status]',
      memberships:
        'id, store_id, customer_id, status, plan_type, end_date, [store_id+status], [store_id+customer_id]',
      work_orders:
        'id, store_id, customer_id, status, priority, [store_id+status]',
      quotes:
        'id, store_id, customer_id, status, valid_until, [store_id+status]',
      cash_sessions:
        'id, store_id, status, opened_at, [store_id+status]',
      suppliers:
        'id, store_id, name, is_active, [store_id+is_active]',
      purchase_orders:
        'id, store_id, supplier_id, status, [store_id+status]',
      pos_invoices:
        'id, store_id, customer_id, status, due_date, [store_id+status]',
      deliveries:
        'id, store_id, order_id, driver_id, status, [store_id+status]',
    })

    // Schema version 8 -- Phase 4: time attendance, loyalty, KDS
    this.version(8).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode], [store_id+expiry_date]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced], table_id, customer_id',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
      restaurant_tables:
        'id, store_id, number, status, zone, current_order_id, [store_id+status]',
      customers:
        'id, store_id, name, phone, email, loyalty_points, [store_id+name], [store_id+phone]',
      promotions:
        'id, store_id, type, is_active, start_date, end_date, [store_id+is_active]',
      appointments:
        'id, store_id, customer_id, status, date, [store_id+date], [store_id+status]',
      memberships:
        'id, store_id, customer_id, status, plan_type, end_date, [store_id+status], [store_id+customer_id]',
      work_orders:
        'id, store_id, customer_id, status, priority, [store_id+status]',
      quotes:
        'id, store_id, customer_id, status, valid_until, [store_id+status]',
      cash_sessions:
        'id, store_id, status, opened_at, [store_id+status]',
      suppliers:
        'id, store_id, name, is_active, [store_id+is_active]',
      purchase_orders:
        'id, store_id, supplier_id, status, [store_id+status]',
      pos_invoices:
        'id, store_id, customer_id, status, due_date, [store_id+status]',
      deliveries:
        'id, store_id, order_id, driver_id, status, [store_id+status]',
      time_entries:
        'id, store_id, user_id, status, created_at, [store_id+user_id], [store_id+created_at]',
      loyalty_rewards:
        'id, store_id, is_active, [store_id+is_active]',
      point_transactions:
        'id, store_id, customer_id, type, created_at, [store_id+customer_id], [store_id+type]',
      kds_orders:
        'id, store_id, order_id, status, station, created_at, [store_id+status], [store_id+station]',
    })

    // Schema version 9 -- Phase 5: gift cards, expenses, campaigns, payroll
    this.version(9).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode], [store_id+expiry_date]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced], table_id, customer_id',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
      restaurant_tables:
        'id, store_id, number, status, zone, current_order_id, [store_id+status]',
      customers:
        'id, store_id, name, phone, email, loyalty_points, [store_id+name], [store_id+phone]',
      promotions:
        'id, store_id, type, is_active, start_date, end_date, [store_id+is_active]',
      appointments:
        'id, store_id, customer_id, status, date, [store_id+date], [store_id+status]',
      memberships:
        'id, store_id, customer_id, status, plan_type, end_date, [store_id+status], [store_id+customer_id]',
      work_orders:
        'id, store_id, customer_id, status, priority, [store_id+status]',
      quotes:
        'id, store_id, customer_id, status, valid_until, [store_id+status]',
      cash_sessions:
        'id, store_id, status, opened_at, [store_id+status]',
      suppliers:
        'id, store_id, name, is_active, [store_id+is_active]',
      purchase_orders:
        'id, store_id, supplier_id, status, [store_id+status]',
      pos_invoices:
        'id, store_id, customer_id, status, due_date, [store_id+status]',
      deliveries:
        'id, store_id, order_id, driver_id, status, [store_id+status]',
      time_entries:
        'id, store_id, user_id, status, created_at, [store_id+user_id], [store_id+created_at]',
      loyalty_rewards:
        'id, store_id, is_active, [store_id+is_active]',
      point_transactions:
        'id, store_id, customer_id, type, created_at, [store_id+customer_id], [store_id+type]',
      kds_orders:
        'id, store_id, order_id, status, station, created_at, [store_id+status], [store_id+station]',
      gift_cards:
        'id, store_id, code, status, customer_id, [store_id+status], [store_id+code]',
      gift_card_transactions:
        'id, store_id, gift_card_id, type, created_at, [store_id+gift_card_id]',
      expenses:
        'id, store_id, category, status, expense_date, user_id, [store_id+category], [store_id+status], [store_id+expense_date]',
      campaigns:
        'id, store_id, type, status, scheduled_at, [store_id+status], [store_id+type]',
      payroll_entries:
        'id, store_id, user_id, status, period_start, [store_id+user_id], [store_id+status]',
      commission_rules:
        'id, store_id, is_active, [store_id+is_active]',
    })

    // Schema version 10 -- Phase 6: notifications, audit trail, returns, documents
    this.version(10).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode], [store_id+expiry_date]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced], table_id, customer_id',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
      restaurant_tables:
        'id, store_id, number, status, zone, current_order_id, [store_id+status]',
      customers:
        'id, store_id, name, phone, email, loyalty_points, [store_id+name], [store_id+phone]',
      promotions:
        'id, store_id, type, is_active, start_date, end_date, [store_id+is_active]',
      appointments:
        'id, store_id, customer_id, status, date, [store_id+date], [store_id+status]',
      memberships:
        'id, store_id, customer_id, status, plan_type, end_date, [store_id+status], [store_id+customer_id]',
      work_orders:
        'id, store_id, customer_id, status, priority, [store_id+status]',
      quotes:
        'id, store_id, customer_id, status, valid_until, [store_id+status]',
      cash_sessions:
        'id, store_id, status, opened_at, [store_id+status]',
      suppliers:
        'id, store_id, name, is_active, [store_id+is_active]',
      purchase_orders:
        'id, store_id, supplier_id, status, [store_id+status]',
      pos_invoices:
        'id, store_id, customer_id, status, due_date, [store_id+status]',
      deliveries:
        'id, store_id, order_id, driver_id, status, [store_id+status]',
      time_entries:
        'id, store_id, user_id, status, created_at, [store_id+user_id], [store_id+created_at]',
      loyalty_rewards:
        'id, store_id, is_active, [store_id+is_active]',
      point_transactions:
        'id, store_id, customer_id, type, created_at, [store_id+customer_id], [store_id+type]',
      kds_orders:
        'id, store_id, order_id, status, station, created_at, [store_id+status], [store_id+station]',
      gift_cards:
        'id, store_id, code, status, customer_id, [store_id+status], [store_id+code]',
      gift_card_transactions:
        'id, store_id, gift_card_id, type, created_at, [store_id+gift_card_id]',
      expenses:
        'id, store_id, category, status, expense_date, user_id, [store_id+category], [store_id+status], [store_id+expense_date]',
      campaigns:
        'id, store_id, type, status, scheduled_at, [store_id+status], [store_id+type]',
      payroll_entries:
        'id, store_id, user_id, status, period_start, [store_id+user_id], [store_id+status]',
      commission_rules:
        'id, store_id, is_active, [store_id+is_active]',
      notifications:
        'id, store_id, type, priority, is_read, user_id, created_at, [store_id+is_read], [store_id+type], [store_id+created_at]',
      audit_logs:
        'id, store_id, user_id, action, module, created_at, [store_id+module], [store_id+action], [store_id+created_at]',
      pos_returns:
        'id, store_id, order_id, status, customer_id, created_at, [store_id+status], [store_id+created_at]',
      pos_documents:
        'id, store_id, type, status, category, created_at, [store_id+type], [store_id+status], [store_id+created_at]',
    })

    // Schema version 11 -- Phase 7: stock transfers, recipes, online orders, maintenance
    this.version(11).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode], [store_id+expiry_date]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced], table_id, customer_id',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
      restaurant_tables:
        'id, store_id, number, status, zone, current_order_id, [store_id+status]',
      customers:
        'id, store_id, name, phone, email, loyalty_points, [store_id+name], [store_id+phone]',
      promotions:
        'id, store_id, type, is_active, start_date, end_date, [store_id+is_active]',
      appointments:
        'id, store_id, customer_id, status, date, [store_id+date], [store_id+status]',
      memberships:
        'id, store_id, customer_id, status, plan_type, end_date, [store_id+status], [store_id+customer_id]',
      work_orders:
        'id, store_id, customer_id, status, priority, [store_id+status]',
      quotes:
        'id, store_id, customer_id, status, valid_until, [store_id+status]',
      cash_sessions:
        'id, store_id, status, opened_at, [store_id+status]',
      suppliers:
        'id, store_id, name, is_active, [store_id+is_active]',
      purchase_orders:
        'id, store_id, supplier_id, status, [store_id+status]',
      pos_invoices:
        'id, store_id, customer_id, status, due_date, [store_id+status]',
      deliveries:
        'id, store_id, order_id, driver_id, status, [store_id+status]',
      time_entries:
        'id, store_id, user_id, status, created_at, [store_id+user_id], [store_id+created_at]',
      loyalty_rewards:
        'id, store_id, is_active, [store_id+is_active]',
      point_transactions:
        'id, store_id, customer_id, type, created_at, [store_id+customer_id], [store_id+type]',
      kds_orders:
        'id, store_id, order_id, status, station, created_at, [store_id+status], [store_id+station]',
      gift_cards:
        'id, store_id, code, status, customer_id, [store_id+status], [store_id+code]',
      gift_card_transactions:
        'id, store_id, gift_card_id, type, created_at, [store_id+gift_card_id]',
      expenses:
        'id, store_id, category, status, expense_date, user_id, [store_id+category], [store_id+status], [store_id+expense_date]',
      campaigns:
        'id, store_id, type, status, scheduled_at, [store_id+status], [store_id+type]',
      payroll_entries:
        'id, store_id, user_id, status, period_start, [store_id+user_id], [store_id+status]',
      commission_rules:
        'id, store_id, is_active, [store_id+is_active]',
      notifications:
        'id, store_id, type, priority, is_read, user_id, created_at, [store_id+is_read], [store_id+type], [store_id+created_at]',
      audit_logs:
        'id, store_id, user_id, action, module, created_at, [store_id+module], [store_id+action], [store_id+created_at]',
      pos_returns:
        'id, store_id, order_id, status, customer_id, created_at, [store_id+status], [store_id+created_at]',
      pos_documents:
        'id, store_id, type, status, category, created_at, [store_id+type], [store_id+status], [store_id+created_at]',
      stock_transfers:
        'id, store_id, from_store_id, to_store_id, status, created_at, [store_id+status], [store_id+created_at]',
      recipes:
        'id, store_id, name, category, status, [store_id+status], [store_id+category]',
      production_batches:
        'id, store_id, recipe_id, status, planned_date, [store_id+status], [store_id+planned_date]',
      online_orders:
        'id, store_id, channel, status, payment_status, created_at, [store_id+status], [store_id+channel], [store_id+created_at]',
      maintenance_tasks:
        'id, store_id, status, priority, type, scheduled_date, [store_id+status], [store_id+priority], [store_id+scheduled_date]',
    })

    // Schema version 12 -- Phase 8: self-checkout, warranty, barcode, dynamic pricing
    this.version(12).stores({
      stores: 'id, name, activity, created_at',
      users:
        'id, store_id, email, role, pin, is_active, created_at, [store_id+role], [store_id+is_active]',
      products:
        'id, store_id, name, category, sku, barcode, is_active, price, created_at, updated_at, [store_id+category], [store_id+is_active], [store_id+barcode], [store_id+expiry_date]',
      orders:
        'id, store_id, user_id, device_id, status, payment_method, synced, created_at, updated_at, [store_id+status], [store_id+created_at], [store_id+synced], table_id, customer_id',
      stock_moves:
        'id, store_id, product_id, type, user_id, synced, created_at, [store_id+product_id], [store_id+synced], [store_id+created_at]',
      sync_queue:
        'id, entity_type, entity_id, operation, store_id, device_id, retries, created_at, synced_at, [store_id+entity_type]',
      restaurant_tables:
        'id, store_id, number, status, zone, current_order_id, [store_id+status]',
      customers:
        'id, store_id, name, phone, email, loyalty_points, [store_id+name], [store_id+phone]',
      promotions:
        'id, store_id, type, is_active, start_date, end_date, [store_id+is_active]',
      appointments:
        'id, store_id, customer_id, status, date, [store_id+date], [store_id+status]',
      memberships:
        'id, store_id, customer_id, status, plan_type, end_date, [store_id+status], [store_id+customer_id]',
      work_orders:
        'id, store_id, customer_id, status, priority, [store_id+status]',
      quotes:
        'id, store_id, customer_id, status, valid_until, [store_id+status]',
      cash_sessions:
        'id, store_id, status, opened_at, [store_id+status]',
      suppliers:
        'id, store_id, name, is_active, [store_id+is_active]',
      purchase_orders:
        'id, store_id, supplier_id, status, [store_id+status]',
      pos_invoices:
        'id, store_id, customer_id, status, due_date, [store_id+status]',
      deliveries:
        'id, store_id, order_id, driver_id, status, [store_id+status]',
      time_entries:
        'id, store_id, user_id, status, created_at, [store_id+user_id], [store_id+created_at]',
      loyalty_rewards:
        'id, store_id, is_active, [store_id+is_active]',
      point_transactions:
        'id, store_id, customer_id, type, created_at, [store_id+customer_id], [store_id+type]',
      kds_orders:
        'id, store_id, order_id, status, station, created_at, [store_id+status], [store_id+station]',
      gift_cards:
        'id, store_id, code, status, customer_id, [store_id+status], [store_id+code]',
      gift_card_transactions:
        'id, store_id, gift_card_id, type, created_at, [store_id+gift_card_id]',
      expenses:
        'id, store_id, category, status, expense_date, user_id, [store_id+category], [store_id+status], [store_id+expense_date]',
      campaigns:
        'id, store_id, type, status, scheduled_at, [store_id+status], [store_id+type]',
      payroll_entries:
        'id, store_id, user_id, status, period_start, [store_id+user_id], [store_id+status]',
      commission_rules:
        'id, store_id, is_active, [store_id+is_active]',
      notifications:
        'id, store_id, type, priority, is_read, user_id, created_at, [store_id+is_read], [store_id+type], [store_id+created_at]',
      audit_logs:
        'id, store_id, user_id, action, module, created_at, [store_id+module], [store_id+action], [store_id+created_at]',
      pos_returns:
        'id, store_id, order_id, status, customer_id, created_at, [store_id+status], [store_id+created_at]',
      pos_documents:
        'id, store_id, type, status, category, created_at, [store_id+type], [store_id+status], [store_id+created_at]',
      stock_transfers:
        'id, store_id, from_store_id, to_store_id, status, created_at, [store_id+status], [store_id+created_at]',
      recipes:
        'id, store_id, name, category, status, [store_id+status], [store_id+category]',
      production_batches:
        'id, store_id, recipe_id, status, planned_date, [store_id+status], [store_id+planned_date]',
      online_orders:
        'id, store_id, channel, status, payment_status, created_at, [store_id+status], [store_id+channel], [store_id+created_at]',
      maintenance_tasks:
        'id, store_id, status, priority, type, scheduled_date, [store_id+status], [store_id+priority], [store_id+scheduled_date]',
      kiosk_sessions:
        'id, store_id, terminal_id, status, payment_status, created_at, [store_id+status], [store_id+terminal_id], [store_id+created_at]',
      warranty_claims:
        'id, store_id, customer_id, claim_status, warranty_status, product_id, created_at, [store_id+claim_status], [store_id+warranty_status], [store_id+created_at]',
      barcode_batches:
        'id, store_id, status, format, created_at, [store_id+status], [store_id+created_at]',
      pricing_rules:
        'id, store_id, type, status, priority, start_date, [store_id+status], [store_id+type], [store_id+start_date]',
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
        this.restaurant_tables,
        this.customers,
        this.promotions,
        this.appointments,
        this.memberships,
        this.work_orders,
        this.quotes,
        this.cash_sessions,
        this.suppliers,
        this.purchase_orders,
        this.pos_invoices,
        this.deliveries,
        this.time_entries,
        this.loyalty_rewards,
        this.point_transactions,
        this.kds_orders,
        this.gift_cards,
        this.gift_card_transactions,
        this.expenses,
        this.campaigns,
        this.payroll_entries,
        this.commission_rules,
        this.notifications,
        this.audit_logs,
        this.pos_returns,
        this.pos_documents,
        this.stock_transfers,
        this.recipes,
        this.production_batches,
        this.online_orders,
        this.maintenance_tasks,
        this.kiosk_sessions,
        this.warranty_claims,
        this.barcode_batches,
        this.pricing_rules,
      ],
      async () => {
        await this.stores.clear()
        await this.users.clear()
        await this.products.clear()
        await this.orders.clear()
        await this.stock_moves.clear()
        await this.sync_queue.clear()
        await this.restaurant_tables.clear()
        await this.customers.clear()
        await this.promotions.clear()
        await this.appointments.clear()
        await this.memberships.clear()
        await this.work_orders.clear()
        await this.quotes.clear()
        await this.cash_sessions.clear()
        await this.suppliers.clear()
        await this.purchase_orders.clear()
        await this.pos_invoices.clear()
        await this.deliveries.clear()
        await this.time_entries.clear()
        await this.loyalty_rewards.clear()
        await this.point_transactions.clear()
        await this.kds_orders.clear()
        await this.gift_cards.clear()
        await this.gift_card_transactions.clear()
        await this.expenses.clear()
        await this.campaigns.clear()
        await this.payroll_entries.clear()
        await this.commission_rules.clear()
        await this.notifications.clear()
        await this.audit_logs.clear()
        await this.pos_returns.clear()
        await this.pos_documents.clear()
        await this.stock_transfers.clear()
        await this.recipes.clear()
        await this.production_batches.clear()
        await this.online_orders.clear()
        await this.maintenance_tasks.clear()
        await this.kiosk_sessions.clear()
        await this.warranty_claims.clear()
        await this.barcode_batches.clear()
        await this.pricing_rules.clear()
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
