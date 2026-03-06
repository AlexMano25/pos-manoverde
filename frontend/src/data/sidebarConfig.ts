import type { Activity, SidebarItemConfig } from '../types'

// ── Shared sidebar configs (same pattern as dashboardConfig.ts) ────────────

const STANDARD_RETAIL: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.pos', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'products', icon: 'Package', i18nKey: 'nav.products', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'stock', icon: 'BarChart3', i18nKey: 'nav.stock', pageComponent: 'stock', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'billing', icon: 'CreditCard', i18nKey: 'nav.billing', pageComponent: 'billing', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const FOOD_BEVERAGE: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.caisse', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'products', icon: 'UtensilsCrossed', i18nKey: 'nav.menu', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'stock', icon: 'BarChart3', i18nKey: 'nav.stock', pageComponent: 'stock', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const SERVICE_POS: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.pos', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'services', icon: 'Briefcase', i18nKey: 'nav.services', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const HOTEL: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.caisse', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'reservations', icon: 'CalendarCheck', i18nKey: 'nav.reservations', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'rooms', icon: 'BedDouble', i18nKey: 'nav.rooms', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'Receipt', i18nKey: 'nav.invoices', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const REAL_ESTATE: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  { section: 'pos', icon: 'CreditCard', i18nKey: 'nav.transactions', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'properties', icon: 'Home', i18nKey: 'nav.properties', pageComponent: 'products', allowedRoles: ['admin', 'manager'] },
  { section: 'contracts', icon: 'FileText', i18nKey: 'nav.contracts', pageComponent: 'orders', allowedRoles: ['admin', 'manager'] },
  { section: 'clients', icon: 'Users', i18nKey: 'nav.clients', pageComponent: 'orders', allowedRoles: ['admin', 'manager'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const EDUCATION: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.caisse', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'enrollments', icon: 'GraduationCap', i18nKey: 'nav.enrollments', pageComponent: 'orders', allowedRoles: ['admin', 'manager'] },
  { section: 'services', icon: 'BookOpen', i18nKey: 'nav.services', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'billing', icon: 'CreditCard', i18nKey: 'nav.billing', pageComponent: 'billing', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const TRAVEL_AGENCY: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.caisse', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'bookings', icon: 'Plane', i18nKey: 'nav.bookings', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'packages', icon: 'Globe', i18nKey: 'nav.packages', pageComponent: 'products', allowedRoles: ['admin', 'manager'] },
  { section: 'clients', icon: 'Users', i18nKey: 'nav.clients', pageComponent: 'orders', allowedRoles: ['admin', 'manager'] },
  { section: 'billing', icon: 'CreditCard', i18nKey: 'nav.billing', pageComponent: 'billing', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const WELLNESS: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.pos', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'services', icon: 'Sparkles', i18nKey: 'nav.services', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'members', icon: 'UserCheck', i18nKey: 'nav.members', pageComponent: 'employees', allowedRoles: ['admin', 'manager'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const AUTO_REPAIR: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.caisse', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'workshop', icon: 'Wrench', i18nKey: 'nav.workshop', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'parts', icon: 'Cog', i18nKey: 'nav.parts', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'orders', icon: 'ClipboardList', i18nKey: 'nav.orders', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'invoices', icon: 'Receipt', i18nKey: 'nav.invoices', pageComponent: 'orders', allowedRoles: ['admin', 'manager'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
  { section: 'settings', icon: 'Settings', i18nKey: 'nav.settings', pageComponent: 'settings', serverOnly: true, allowedRoles: ['admin', 'manager'] },
]

const HAIR_SALON: SidebarItemConfig[] = [
  { section: 'dashboard', icon: 'LayoutDashboard', i18nKey: 'nav.dashboard', pageComponent: 'dashboard' },
  { section: 'pos', icon: 'ShoppingCart', i18nKey: 'nav.pos', pageComponent: 'pos', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'appointments', icon: 'Calendar', i18nKey: 'nav.appointments', pageComponent: 'orders', allowedRoles: ['admin', 'manager', 'cashier'] },
  { section: 'products', icon: 'Package', i18nKey: 'nav.products', pageComponent: 'products', allowedRoles: ['admin', 'manager', 'stock'] },
  { section: 'employees', icon: 'Users', i18nKey: 'nav.employees', pageComponent: 'employees', serverOnly: true, allowedRoles: ['admin'] },
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
