import type { Activity, SidebarItemConfig } from '../types'

// ── Phase 5 shared items ─────────────────────────────────────────────────
const GIFT_CARDS: SidebarItemConfig = { section: 'gift_cards', icon: 'Ticket', i18nKey: 'nav.giftCards', pageComponent: 'gift_cards', allowedRoles: ['admin', 'manager'] }
const EXPENSES: SidebarItemConfig = { section: 'expenses', icon: 'Wallet', i18nKey: 'nav.expenses', pageComponent: 'expenses', serverOnly: true, allowedRoles: ['admin', 'manager'] }
const CAMPAIGNS: SidebarItemConfig = { section: 'campaigns', icon: 'Megaphone', i18nKey: 'nav.campaigns', pageComponent: 'campaigns', serverOnly: true, allowedRoles: ['admin', 'manager'] }
const PAYROLL: SidebarItemConfig = { section: 'payroll', icon: 'Coins', i18nKey: 'nav.payroll', pageComponent: 'payroll', serverOnly: true, allowedRoles: ['admin'] }

// ── Phase 6 shared items ─────────────────────────────────────────────────
const NOTIFICATIONS: SidebarItemConfig = { section: 'notifications', icon: 'Bell', i18nKey: 'nav.notifications', pageComponent: 'notifications', allowedRoles: ['admin', 'manager'] }
const AUDIT_TRAIL: SidebarItemConfig = { section: 'audit_trail', icon: 'Shield', i18nKey: 'nav.auditTrail', pageComponent: 'audit_trail', serverOnly: true, allowedRoles: ['admin'] }
const RETURNS: SidebarItemConfig = { section: 'returns', icon: 'RotateCcw', i18nKey: 'nav.returns', pageComponent: 'returns', allowedRoles: ['admin', 'manager', 'cashier'] }
const DOCUMENTS: SidebarItemConfig = { section: 'documents', icon: 'FolderOpen', i18nKey: 'nav.documents', pageComponent: 'documents', serverOnly: true, allowedRoles: ['admin', 'manager'] }

// ── Phase 7 shared items ─────────────────────────────────────────────────
const TRANSFERS: SidebarItemConfig = { section: 'transfers', icon: 'ArrowLeftRight', i18nKey: 'nav.transfers', pageComponent: 'transfers', serverOnly: true, allowedRoles: ['admin', 'manager'] }
const ONLINE_ORDERS: SidebarItemConfig = { section: 'online_orders', icon: 'Globe', i18nKey: 'nav.onlineOrders', pageComponent: 'online_orders', allowedRoles: ['admin', 'manager', 'cashier'] }
const MAINTENANCE: SidebarItemConfig = { section: 'maintenance', icon: 'Wrench', i18nKey: 'nav.maintenance', pageComponent: 'maintenance', serverOnly: true, allowedRoles: ['admin', 'manager'] }

// ── Phase 8 shared items ─────────────────────────────────────────────────
const SELF_CHECKOUT: SidebarItemConfig = { section: 'self_checkout', icon: 'Monitor', i18nKey: 'nav.selfCheckout', pageComponent: 'self_checkout', serverOnly: true, allowedRoles: ['admin', 'manager'] }
const WARRANTY: SidebarItemConfig = { section: 'warranty', icon: 'ShieldCheck', i18nKey: 'nav.warranty', pageComponent: 'warranty', allowedRoles: ['admin', 'manager'] }
const BARCODE: SidebarItemConfig = { section: 'barcode', icon: 'ScanBarcode', i18nKey: 'nav.barcode', pageComponent: 'barcode', serverOnly: true, allowedRoles: ['admin', 'manager', 'stock'] }
const DYNAMIC_PRICING: SidebarItemConfig = { section: 'dynamic_pricing', icon: 'TrendingUp', i18nKey: 'nav.dynamicPricing', pageComponent: 'dynamic_pricing', serverOnly: true, allowedRoles: ['admin', 'manager'] }

// ── Phase 9 shared items ─────────────────────────────────────────────────
const WASTE_LOSS: SidebarItemConfig = { section: 'waste_loss', icon: 'Trash2', i18nKey: 'nav.wasteLoss', pageComponent: 'waste_loss', serverOnly: true, allowedRoles: ['admin', 'manager'] }
const STOCKTAKE: SidebarItemConfig = { section: 'stocktake', icon: 'ClipboardCheck', i18nKey: 'nav.stocktake', pageComponent: 'stocktake', serverOnly: true, allowedRoles: ['admin', 'manager', 'stock'] }
const TAX: SidebarItemConfig = { section: 'tax', icon: 'Receipt', i18nKey: 'nav.tax', pageComponent: 'tax', serverOnly: true, allowedRoles: ['admin'] }
const FEEDBACK: SidebarItemConfig = { section: 'feedback', icon: 'MessageSquareHeart', i18nKey: 'nav.feedback', pageComponent: 'feedback', allowedRoles: ['admin', 'manager'] }

// ── Cross-functional server order-taking ─────────────────────────────────
const SERVER_ORDERS: SidebarItemConfig = { section: 'server_orders', icon: 'ClipboardList', i18nKey: 'nav.serverOrders', pageComponent: 'server_orders', allowedRoles: ['admin', 'manager', 'cashier'] }

// ── LT-1 Deep Business Module items ─────────────────────────────────────
const ROOM_MANAGEMENT: SidebarItemConfig = { section: 'room_management', icon: 'BedDouble', i18nKey: 'nav.roomManagement', pageComponent: 'room_management', allowedRoles: ['admin', 'manager'] }
const HOUSEKEEPING: SidebarItemConfig = { section: 'housekeeping', icon: 'Sparkles', i18nKey: 'nav.housekeeping', pageComponent: 'housekeeping', allowedRoles: ['admin', 'manager', 'cashier'] }
const MINIBAR: SidebarItemConfig = { section: 'minibar', icon: 'Wine', i18nKey: 'nav.minibar', pageComponent: 'minibar', allowedRoles: ['admin', 'manager'] }
const STUDENT_ENROLLMENT: SidebarItemConfig = { section: 'student_enrollment', icon: 'GraduationCap', i18nKey: 'nav.studentEnrollment', pageComponent: 'student_enrollment', allowedRoles: ['admin', 'manager'] }
const ATTENDANCE_PAGE: SidebarItemConfig = { section: 'attendance', icon: 'ListChecks', i18nKey: 'nav.attendance', pageComponent: 'attendance', allowedRoles: ['admin', 'manager'] }
const GRADES: SidebarItemConfig = { section: 'grades', icon: 'FileSpreadsheet', i18nKey: 'nav.grades', pageComponent: 'grades', allowedRoles: ['admin', 'manager'] }
const TRAVEL_PACKAGES: SidebarItemConfig = { section: 'travel_packages', icon: 'Map', i18nKey: 'nav.travelPackages', pageComponent: 'travel_packages', allowedRoles: ['admin', 'manager'] }
const ITINERARIES: SidebarItemConfig = { section: 'itineraries', icon: 'Route', i18nKey: 'nav.itineraries', pageComponent: 'itineraries', allowedRoles: ['admin', 'manager'] }
const BOOKING_CALENDAR: SidebarItemConfig = { section: 'booking_calendar', icon: 'CalendarRange', i18nKey: 'nav.bookingCalendar', pageComponent: 'booking_calendar', allowedRoles: ['admin', 'manager', 'cashier'] }
const VIN_DECODER: SidebarItemConfig = { section: 'vin_decoder', icon: 'ScanSearch', i18nKey: 'nav.vinDecoder', pageComponent: 'vin_decoder', allowedRoles: ['admin', 'manager'] }
const VEHICLE_HISTORY: SidebarItemConfig = { section: 'vehicle_history', icon: 'CarFront', i18nKey: 'nav.vehicleHistory', pageComponent: 'vehicle_history', allowedRoles: ['admin', 'manager'] }
const PARTS_CATALOG: SidebarItemConfig = { section: 'parts_catalog', icon: 'Cog', i18nKey: 'nav.partsCatalog', pageComponent: 'parts_catalog', allowedRoles: ['admin', 'manager', 'stock'] }

// ── Shared sidebar configs ───────────────────────────────────────────────

const STANDARD_RETAIL: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  NOTIFICATIONS,
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.pos', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'cash_register', icon: 'Banknote', i18nKey: 'nav.cashRegister', pageComponent: 'cash_register', allowedRoles: ['admin', 'manager', 'cashier'] },
  SERVER_ORDERS,
  SELF_CHECKOUT,
  EXPENSES,
  { section: 'products', icon: 'Package', i18nKey: 'nav.products', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  RETURNS,
  WARRANTY,
  { section: 'customers', icon: 'UserCheck', i18nKey: 'nav.customers', pageComponent: 'customers', allowedRoles: ['admin', 'manager'] },
  { section: 'loyalty', icon: 'Gift', i18nKey: 'nav.loyalty', pageComponent: 'loyalty', allowedRoles: ['admin', 'manager'] },
  GIFT_CARDS,
  { section: 'stock', icon: 'BarChart3', i18nKey: 'nav.stock', pageComponent: 'stock', allowedRoles: ['admin', 'manager', 'stock'] },
  STOCKTAKE,
  WASTE_LOSS,
  TRANSFERS,
  BARCODE,
  { section: 'suppliers', icon: 'Truck', i18nKey: 'nav.suppliers', pageComponent: 'suppliers', allowedRoles: ['admin', 'manager'] },
  { section: 'invoices', icon: 'Receipt', i18nKey: 'nav.invoices', pageComponent: 'invoices', allowedRoles: ['admin', 'manager'] },
  { section: 'deliveries', icon: 'Bike', i18nKey: 'nav.deliveries', pageComponent: 'deliveries', allowedRoles: ['admin', 'manager', 'cashier'] },
  ONLINE_ORDERS,
  DOCUMENTS,
  { section: 'promotions', icon: 'Tag', i18nKey: 'nav.promotions', pageComponent: 'promotions', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  DYNAMIC_PRICING,
  CAMPAIGNS,
  FEEDBACK,
  { section: 'reports', icon: 'PieChart', i18nKey: 'nav.reports', pageComponent: 'reports', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'time_attendance', icon: 'Clock', i18nKey: 'nav.timeAttendance', pageComponent: 'time_attendance', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  PAYROLL,
  MAINTENANCE,
  AUDIT_TRAIL,
  TAX,
  { section: 'billing', icon: 'CreditCard', i18nKey: 'nav.billing', pageComponent: 'billing', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const FOOD_BEVERAGE: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  NOTIFICATIONS,
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.caisse', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'cash_register', icon: 'Banknote', i18nKey: 'nav.cashRegister', pageComponent: 'cash_register', allowedRoles: ['admin', 'manager', 'cashier'] },
  SERVER_ORDERS,
  SELF_CHECKOUT,
  EXPENSES,
  { section: 'tables', icon: 'Grid3X3', i18nKey: 'nav.tables', pageComponent: 'tables', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'kds', icon: 'ChefHat', i18nKey: 'nav.kds', pageComponent: 'kds', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'products', icon: 'UtensilsCrossed', i18nKey: 'nav.menu', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  RETURNS,
  { section: 'customers', icon: 'UserCheck', i18nKey: 'nav.customers', pageComponent: 'customers', allowedRoles: ['admin', 'manager'] },
  { section: 'loyalty', icon: 'Gift', i18nKey: 'nav.loyalty', pageComponent: 'loyalty', allowedRoles: ['admin', 'manager'] },
  GIFT_CARDS,
  { section: 'stock', icon: 'BarChart3', i18nKey: 'nav.stock', pageComponent: 'stock', allowedRoles: ['admin', 'manager', 'stock'] },
  STOCKTAKE,
  WASTE_LOSS,
  TRANSFERS,
  BARCODE,
  { section: 'suppliers', icon: 'Truck', i18nKey: 'nav.suppliers', pageComponent: 'suppliers', allowedRoles: ['admin', 'manager'] },
  { section: 'deliveries', icon: 'Bike', i18nKey: 'nav.deliveries', pageComponent: 'deliveries', allowedRoles: ['admin', 'manager', 'cashier'] },
  ONLINE_ORDERS,
  { section: 'recipes', icon: 'CookingPot', i18nKey: 'nav.recipes', pageComponent: 'recipes', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  DOCUMENTS,
  { section: 'promotions', icon: 'Tag', i18nKey: 'nav.promotions', pageComponent: 'promotions', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  DYNAMIC_PRICING,
  CAMPAIGNS,
  FEEDBACK,
  { section: 'reports', icon: 'PieChart', i18nKey: 'nav.reports', pageComponent: 'reports', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'time_attendance', icon: 'Clock', i18nKey: 'nav.timeAttendance', pageComponent: 'time_attendance', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  PAYROLL,
  MAINTENANCE,
  AUDIT_TRAIL,
  TAX,
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const SERVICE_POS: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  NOTIFICATIONS,
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.pos', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'cash_register', icon: 'Banknote', i18nKey: 'nav.cashRegister', pageComponent: 'cash_register', allowedRoles: ['admin', 'manager', 'cashier'] },
  SERVER_ORDERS,
  EXPENSES,
  { section: 'services', icon: 'Briefcase', i18nKey: 'nav.services', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  RETURNS,
  { section: 'customers', icon: 'UserCheck', i18nKey: 'nav.customers', pageComponent: 'customers', allowedRoles: ['admin', 'manager'] },
  { section: 'loyalty', icon: 'Gift', i18nKey: 'nav.loyalty', pageComponent: 'loyalty', allowedRoles: ['admin', 'manager'] },
  GIFT_CARDS,
  { section: 'invoices', icon: 'Receipt', i18nKey: 'nav.invoices', pageComponent: 'invoices', allowedRoles: ['admin', 'manager'] },
  { section: 'deliveries', icon: 'Bike', i18nKey: 'nav.deliveries', pageComponent: 'deliveries', allowedRoles: ['admin', 'manager', 'cashier'] },
  ONLINE_ORDERS,
  DOCUMENTS,
  { section: 'quotes', icon: 'FileText', i18nKey: 'nav.quotes', pageComponent: 'quotes', allowedRoles: ['admin', 'manager'], serverOnly: true },
  { section: 'promotions', icon: 'Tag', i18nKey: 'nav.promotions', pageComponent: 'promotions', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  DYNAMIC_PRICING,
  CAMPAIGNS,
  FEEDBACK,
  { section: 'reports', icon: 'PieChart', i18nKey: 'nav.reports', pageComponent: 'reports', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'time_attendance', icon: 'Clock', i18nKey: 'nav.timeAttendance', pageComponent: 'time_attendance', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  PAYROLL,
  MAINTENANCE,
  AUDIT_TRAIL,
  TAX,
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const HOTEL: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  NOTIFICATIONS,
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.caisse', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'cash_register', icon: 'Banknote', i18nKey: 'nav.cashRegister', pageComponent: 'cash_register', allowedRoles: ['admin', 'manager', 'cashier'] },
  SERVER_ORDERS,
  SELF_CHECKOUT,
  EXPENSES,
  ROOM_MANAGEMENT,
  HOUSEKEEPING,
  MINIBAR,
  { section: 'tables', icon: 'Grid3X3', i18nKey: 'nav.tables', pageComponent: 'tables', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'reservations', icon: 'CalendarCheck', i18nKey: 'nav.reservations', pageComponent: 'appointments', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'rooms', icon: 'BedDouble', i18nKey: 'nav.rooms', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  RETURNS,
  { section: 'invoices', icon: 'Receipt', i18nKey: 'nav.invoices', pageComponent: 'invoices', allowedRoles: ['admin', 'manager'] },
  { section: 'customers', icon: 'UserCheck', i18nKey: 'nav.customers', pageComponent: 'customers', allowedRoles: ['admin', 'manager'] },
  { section: 'loyalty', icon: 'Gift', i18nKey: 'nav.loyalty', pageComponent: 'loyalty', allowedRoles: ['admin', 'manager'] },
  GIFT_CARDS,
  ONLINE_ORDERS,
  DOCUMENTS,
  { section: 'promotions', icon: 'Tag', i18nKey: 'nav.promotions', pageComponent: 'promotions', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  DYNAMIC_PRICING,
  CAMPAIGNS,
  FEEDBACK,
  { section: 'reports', icon: 'PieChart', i18nKey: 'nav.reports', pageComponent: 'reports', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'time_attendance', icon: 'Clock', i18nKey: 'nav.timeAttendance', pageComponent: 'time_attendance', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  PAYROLL,
  MAINTENANCE,
  AUDIT_TRAIL,
  TAX,
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const REAL_ESTATE: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  NOTIFICATIONS,
  { section: 'pos', icon: 'CreditCard', i18nKey: 'nav.transactions', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'cash_register', icon: 'Banknote', i18nKey: 'nav.cashRegister', pageComponent: 'cash_register', allowedRoles: ['admin', 'manager', 'cashier'] },
  SERVER_ORDERS,
  EXPENSES,
  { section: 'properties', icon: 'Home', i18nKey: 'nav.properties', pageComponent: 'products', allowedRoles: ['admin', 'manager'] },
  { section: 'contracts', icon: 'FileText', i18nKey: 'nav.contracts', pageComponent: 'orders', allowedRoles: ['admin', 'manager'] },
  { section: 'clients', icon: 'Users', i18nKey: 'nav.clients', pageComponent: 'customers', allowedRoles: ['admin', 'manager'] },
  { section: 'loyalty', icon: 'Gift', i18nKey: 'nav.loyalty', pageComponent: 'loyalty', allowedRoles: ['admin', 'manager'] },
  GIFT_CARDS,
  DOCUMENTS,
  { section: 'quotes', icon: 'FileText', i18nKey: 'nav.quotes', pageComponent: 'quotes', allowedRoles: ['admin', 'manager'], serverOnly: true },
  CAMPAIGNS,
  FEEDBACK,
  { section: 'reports', icon: 'PieChart', i18nKey: 'nav.reports', pageComponent: 'reports', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'time_attendance', icon: 'Clock', i18nKey: 'nav.timeAttendance', pageComponent: 'time_attendance', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  PAYROLL,
  MAINTENANCE,
  AUDIT_TRAIL,
  TAX,
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const EDUCATION: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  NOTIFICATIONS,
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.caisse', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'cash_register', icon: 'Banknote', i18nKey: 'nav.cashRegister', pageComponent: 'cash_register', allowedRoles: ['admin', 'manager', 'cashier'] },
  SERVER_ORDERS,
  EXPENSES,
  { section: 'enrollments', icon: 'GraduationCap', i18nKey: 'nav.enrollments', pageComponent: 'appointments', allowedRoles: ['admin', 'manager'] },
  STUDENT_ENROLLMENT,
  ATTENDANCE_PAGE,
  GRADES,
  { section: 'services', icon: 'BookOpen', i18nKey: 'nav.services', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'customers', icon: 'UserCheck', i18nKey: 'nav.customers', pageComponent: 'customers', allowedRoles: ['admin', 'manager'] },
  { section: 'loyalty', icon: 'Gift', i18nKey: 'nav.loyalty', pageComponent: 'loyalty', allowedRoles: ['admin', 'manager'] },
  GIFT_CARDS,
  DOCUMENTS,
  CAMPAIGNS,
  FEEDBACK,
  { section: 'reports', icon: 'PieChart', i18nKey: 'nav.reports', pageComponent: 'reports', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  { section: 'billing', icon: 'CreditCard', i18nKey: 'nav.billing', pageComponent: 'billing', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'time_attendance', icon: 'Clock', i18nKey: 'nav.timeAttendance', pageComponent: 'time_attendance', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  PAYROLL,
  MAINTENANCE,
  AUDIT_TRAIL,
  TAX,
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const TRAVEL_AGENCY: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  NOTIFICATIONS,
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.caisse', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'cash_register', icon: 'Banknote', i18nKey: 'nav.cashRegister', pageComponent: 'cash_register', allowedRoles: ['admin', 'manager', 'cashier'] },
  SERVER_ORDERS,
  EXPENSES,
  { section: 'bookings', icon: 'Plane', i18nKey: 'nav.bookings', pageComponent: 'appointments', allowedRoles: ['admin', 'manager', 'cashier'] },
  TRAVEL_PACKAGES,
  ITINERARIES,
  BOOKING_CALENDAR,
  { section: 'packages', icon: 'Globe', i18nKey: 'nav.packages', pageComponent: 'products', allowedRoles: ['admin', 'manager'] },
  { section: 'clients', icon: 'Users', i18nKey: 'nav.clients', pageComponent: 'customers', allowedRoles: ['admin', 'manager'] },
  RETURNS,
  { section: 'loyalty', icon: 'Gift', i18nKey: 'nav.loyalty', pageComponent: 'loyalty', allowedRoles: ['admin', 'manager'] },
  GIFT_CARDS,
  ONLINE_ORDERS,
  DOCUMENTS,
  { section: 'quotes', icon: 'FileText', i18nKey: 'nav.quotes', pageComponent: 'quotes', allowedRoles: ['admin', 'manager'], serverOnly: true },
  { section: 'promotions', icon: 'Tag', i18nKey: 'nav.promotions', pageComponent: 'promotions', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  CAMPAIGNS,
  FEEDBACK,
  { section: 'reports', icon: 'PieChart', i18nKey: 'nav.reports', pageComponent: 'reports', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  { section: 'billing', icon: 'CreditCard', i18nKey: 'nav.billing', pageComponent: 'billing', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'time_attendance', icon: 'Clock', i18nKey: 'nav.timeAttendance', pageComponent: 'time_attendance', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  PAYROLL,
  MAINTENANCE,
  AUDIT_TRAIL,
  TAX,
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const WELLNESS: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  NOTIFICATIONS,
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.pos', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'cash_register', icon: 'Banknote', i18nKey: 'nav.cashRegister', pageComponent: 'cash_register', allowedRoles: ['admin', 'manager', 'cashier'] },
  SERVER_ORDERS,
  EXPENSES,
  { section: 'services', icon: 'Sparkles', i18nKey: 'nav.services', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'appointments', icon: 'Calendar', i18nKey: 'nav.appointments', pageComponent: 'appointments', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'members', icon: 'UserCheck', i18nKey: 'nav.members', pageComponent: 'memberships', allowedRoles: ['admin', 'manager'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  RETURNS,
  { section: 'customers', icon: 'Heart', i18nKey: 'nav.customers', pageComponent: 'customers', allowedRoles: ['admin', 'manager'] },
  { section: 'loyalty', icon: 'Gift', i18nKey: 'nav.loyalty', pageComponent: 'loyalty', allowedRoles: ['admin', 'manager'] },
  GIFT_CARDS,
  ONLINE_ORDERS,
  DOCUMENTS,
  { section: 'promotions', icon: 'Tag', i18nKey: 'nav.promotions', pageComponent: 'promotions', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  DYNAMIC_PRICING,
  CAMPAIGNS,
  FEEDBACK,
  { section: 'reports', icon: 'PieChart', i18nKey: 'nav.reports', pageComponent: 'reports', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'time_attendance', icon: 'Clock', i18nKey: 'nav.timeAttendance', pageComponent: 'time_attendance', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  PAYROLL,
  MAINTENANCE,
  AUDIT_TRAIL,
  TAX,
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const AUTO_REPAIR: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  NOTIFICATIONS,
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.caisse', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'cash_register', icon: 'Banknote', i18nKey: 'nav.cashRegister', pageComponent: 'cash_register', allowedRoles: ['admin', 'manager', 'cashier'] },
  SERVER_ORDERS,
  EXPENSES,
  { section: 'workshop', icon: 'Wrench', i18nKey: 'nav.workshop', pageComponent: 'work_orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  VIN_DECODER,
  VEHICLE_HISTORY,
  PARTS_CATALOG,
  { section: 'parts', icon: 'Cog', i18nKey: 'nav.parts', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  RETURNS,
  WARRANTY,
  { section: 'customers', icon: 'UserCheck', i18nKey: 'nav.customers', pageComponent: 'customers', allowedRoles: ['admin', 'manager'] },
  { section: 'loyalty', icon: 'Gift', i18nKey: 'nav.loyalty', pageComponent: 'loyalty', allowedRoles: ['admin', 'manager'] },
  GIFT_CARDS,
  { section: 'stock', icon: 'BarChart3', i18nKey: 'nav.stock', pageComponent: 'stock', allowedRoles: ['admin', 'manager', 'stock'] },
  STOCKTAKE,
  WASTE_LOSS,
  { section: 'suppliers', icon: 'Truck', i18nKey: 'nav.suppliers', pageComponent: 'suppliers', allowedRoles: ['admin', 'manager'] },
  { section: 'invoices', icon: 'Receipt', i18nKey: 'nav.invoices', pageComponent: 'invoices', allowedRoles: ['admin', 'manager'] },
  TRANSFERS,
  BARCODE,
  DOCUMENTS,
  { section: 'quotes', icon: 'FileText', i18nKey: 'nav.quotes', pageComponent: 'quotes', allowedRoles: ['admin', 'manager'], serverOnly: true },
  CAMPAIGNS,
  FEEDBACK,
  { section: 'reports', icon: 'PieChart', i18nKey: 'nav.reports', pageComponent: 'reports', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'time_attendance', icon: 'Clock', i18nKey: 'nav.timeAttendance', pageComponent: 'time_attendance', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  PAYROLL,
  MAINTENANCE,
  AUDIT_TRAIL,
  TAX,
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const HAIR_SALON: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  NOTIFICATIONS,
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.pos', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'cash_register', icon: 'Banknote', i18nKey: 'nav.cashRegister', pageComponent: 'cash_register', allowedRoles: ['admin', 'manager', 'cashier'] },
  SERVER_ORDERS,
  EXPENSES,
  { section: 'appointments', icon: 'Calendar', i18nKey: 'nav.appointments', pageComponent: 'appointments', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'products', icon: 'Package', i18nKey: 'nav.products', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  RETURNS,
  { section: 'customers', icon: 'UserCheck', i18nKey: 'nav.customers', pageComponent: 'customers', allowedRoles: ['admin', 'manager'] },
  { section: 'loyalty', icon: 'Gift', i18nKey: 'nav.loyalty', pageComponent: 'loyalty', allowedRoles: ['admin', 'manager'] },
  GIFT_CARDS,
  ONLINE_ORDERS,
  DOCUMENTS,
  { section: 'promotions', icon: 'Tag', i18nKey: 'nav.promotions', pageComponent: 'promotions', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  DYNAMIC_PRICING,
  CAMPAIGNS,
  FEEDBACK,
  { section: 'reports', icon: 'PieChart', i18nKey: 'nav.reports', pageComponent: 'reports', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'time_attendance', icon: 'Clock', i18nKey: 'nav.timeAttendance', pageComponent: 'time_attendance', serverOnly: true, allowedRoles: ['admin', 'manager'] },
  PAYROLL,
  MAINTENANCE,
  AUDIT_TRAIL,
  TAX,
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

// ── Main config map ──────────────────────────────────────────────────────

export const SIDEBAR_CONFIG: Record<Activity, SidebarItemConfig[]> = {
  // Food & Beverage
  restaurant: FOOD_BEVERAGE,
  bar: FOOD_BEVERAGE,
  bakery: FOOD_BEVERAGE,

  // Retail
  supermarket: STANDARD_RETAIL,
  pharmacy: STANDARD_RETAIL,
  fashion: STANDARD_RETAIL,
  electronics: STANDARD_RETAIL,
  florist: STANDARD_RETAIL,
  pet_shop: STANDARD_RETAIL,
  bookstore: STANDARD_RETAIL,
  gas_station: STANDARD_RETAIL,

  // Services
  laundry: SERVICE_POS,
  printing: SERVICE_POS,
  home_cleaning: SERVICE_POS,
  car_wash: SERVICE_POS,
  services: SERVICE_POS,

  // Hotel
  hotel: HOTEL,

  // Real Estate
  real_estate: REAL_ESTATE,

  // Education
  school: EDUCATION,
  daycare: EDUCATION,

  // Travel
  travel_agency: TRAVEL_AGENCY,

  // Wellness & Fitness
  gym: WELLNESS,
  spa: WELLNESS,
  pool: WELLNESS,

  // Auto Repair
  auto_repair: AUTO_REPAIR,

  // Hair Salon
  hair_salon: HAIR_SALON,
}

// Helper: get sidebar items for a given activity (with fallback)
export function getSidebarItems(activity: Activity | string | undefined | null): SidebarItemConfig[] {
  if (activity && activity in SIDEBAR_CONFIG) {
    return SIDEBAR_CONFIG[activity as Activity]
  }
  return SIDEBAR_CONFIG.restaurant // safe default
}

// Helper: get the first POS-like section for client mode
export function getDefaultSection(activity: Activity): string {
  const items = SIDEBAR_CONFIG[activity]
  // In client mode, prefer 'pos' or the first cashier-accessible section
  const posItem = items.find(i => i.allowedRoles?.includes('cashier'))
  return posItem?.section || items[0]?.section || 'dashboard'
}
