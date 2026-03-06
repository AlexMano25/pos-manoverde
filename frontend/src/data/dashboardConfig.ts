import type { Activity, ActivityDashboardConfig, QuickActionDef } from '../types'

// ---------------------------------------------------------------------------
// POS Mano Verde SA -- Activity Dashboard Configurations
// Maps each of the 26 activities to their specific dashboard layout:
//   - statCards: 5 stat card variants displayed at the top
//   - quickActions: 3-4 quick action buttons
//   - widgets: body widgets (category_breakdown, alerts_panel, peak_hours, contract_shortcuts)
// ---------------------------------------------------------------------------

// -- Shared quick-action sets (avoids repetition) ---------------------------

const QA_STANDARD_POS: QuickActionDef[] = [
  { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
  { i18nKey: 'dashboard.addProduct', icon: 'Plus', targetSection: 'products' },
  { i18nKey: 'dashboard.viewAll', icon: 'ClipboardList', targetSection: 'orders' },
]

const QA_EXPIRY_CHECK: QuickActionDef[] = [
  { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
  { i18nKey: 'dashboard.addProduct', icon: 'Plus', targetSection: 'products' },
  { i18nKey: 'dashboard.checkExpiry', icon: 'AlertTriangle', targetSection: 'products' },
]

const QA_SERVICE: QuickActionDef[] = [
  { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
  { i18nKey: 'dashboard.newService', icon: 'Plus', targetSection: 'services' },
  { i18nKey: 'dashboard.viewAll', icon: 'ClipboardList', targetSection: 'orders' },
]

// ---------------------------------------------------------------------------
// Main config map
// ---------------------------------------------------------------------------

export const DASHBOARD_CONFIG: Record<Activity, ActivityDashboardConfig> = {

  // =========================================================================
  // FOOD & BEVERAGE
  // =========================================================================

  restaurant: {
    statCards: ['revenue', 'orders', 'avg_check', 'food_cost', 'products'],
    quickActions: QA_STANDARD_POS,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'peak_hours' },
      { type: 'alerts_panel', alertTypes: ['low_stock'] },
    ],
  },

  bar: {
    statCards: ['revenue', 'orders', 'avg_check', 'beverage_cost', 'products'],
    quickActions: QA_STANDARD_POS,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'peak_hours' },
      { type: 'alerts_panel', alertTypes: ['low_stock'] },
    ],
  },

  bakery: {
    statCards: ['revenue', 'orders', 'food_cost', 'expiring_items', 'products'],
    quickActions: QA_EXPIRY_CHECK,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'alerts_panel', alertTypes: ['low_stock', 'expiring_soon'] },
    ],
  },

  // =========================================================================
  // RETAIL
  // =========================================================================

  supermarket: {
    statCards: ['revenue', 'orders', 'avg_order', 'gross_margin', 'expiring_items'],
    quickActions: QA_EXPIRY_CHECK,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'alerts_panel', alertTypes: ['low_stock', 'expiring_soon'] },
    ],
  },

  pharmacy: {
    statCards: ['revenue', 'orders', 'gross_margin', 'expiring_items', 'low_stock'],
    quickActions: QA_EXPIRY_CHECK,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'alerts_panel', alertTypes: ['low_stock', 'expiring_soon'] },
    ],
  },

  fashion: {
    statCards: ['revenue', 'orders', 'avg_order', 'gross_margin', 'products'],
    quickActions: QA_STANDARD_POS,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'alerts_panel', alertTypes: ['low_stock'] },
    ],
  },

  electronics: {
    statCards: ['revenue', 'orders', 'avg_order', 'gross_margin', 'low_stock'],
    quickActions: QA_STANDARD_POS,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'alerts_panel', alertTypes: ['low_stock'] },
    ],
  },

  florist: {
    statCards: ['revenue', 'orders', 'avg_order', 'products', 'low_stock'],
    quickActions: QA_STANDARD_POS,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'alerts_panel', alertTypes: ['low_stock'] },
      { type: 'contract_shortcuts', templates: ['bon_commande'] },
    ],
  },

  pet_shop: {
    statCards: ['revenue', 'orders', 'avg_order', 'gross_margin', 'low_stock'],
    quickActions: QA_STANDARD_POS,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'alerts_panel', alertTypes: ['low_stock'] },
    ],
  },

  bookstore: {
    statCards: ['revenue', 'orders', 'avg_order', 'products', 'low_stock'],
    quickActions: [
      { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
      { i18nKey: 'dashboard.addProduct', icon: 'Plus', targetSection: 'products' },
      { i18nKey: 'dashboard.searchISBN', icon: 'Search', targetSection: 'products' },
    ],
    widgets: [
      { type: 'category_breakdown' },
      { type: 'alerts_panel', alertTypes: ['low_stock'] },
    ],
  },

  // =========================================================================
  // PERSONAL CARE & WELLNESS
  // =========================================================================

  hair_salon: {
    statCards: ['revenue', 'services_today', 'avg_check', 'appointments_today', 'products'],
    quickActions: [
      { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
      { i18nKey: 'dashboard.addProduct', icon: 'Plus', targetSection: 'products' },
      { i18nKey: 'dashboard.viewAll', icon: 'ClipboardList', targetSection: 'appointments' },
    ],
    widgets: [
      { type: 'category_breakdown' },
      { type: 'alerts_panel', alertTypes: ['low_stock'] },
    ],
  },

  spa: {
    statCards: ['revenue', 'services_today', 'avg_check', 'appointments_today', 'products'],
    quickActions: QA_SERVICE,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'peak_hours' },
      { type: 'alerts_panel', alertTypes: ['low_stock'] },
    ],
  },

  gym: {
    statCards: ['revenue', 'orders', 'active_members', 'services_today', 'avg_order'],
    quickActions: QA_SERVICE,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'alerts_panel', alertTypes: ['low_stock'] },
    ],
  },

  pool: {
    statCards: ['revenue', 'orders', 'capacity_rate', 'services_today', 'avg_order'],
    quickActions: QA_SERVICE,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'peak_hours' },
    ],
  },

  // =========================================================================
  // SERVICES
  // =========================================================================

  laundry: {
    statCards: ['revenue', 'orders', 'avg_order', 'pending_jobs', 'services_today'],
    quickActions: QA_SERVICE,
    widgets: [
      { type: 'category_breakdown' },
    ],
  },

  home_cleaning: {
    statCards: ['revenue', 'orders', 'avg_order', 'services_today', 'pending_jobs'],
    quickActions: QA_SERVICE,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'contract_shortcuts', templates: ['devis_prestation'] },
    ],
  },

  printing: {
    statCards: ['revenue', 'orders', 'avg_order', 'pending_jobs', 'products'],
    quickActions: QA_SERVICE,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'contract_shortcuts', templates: ['devis_prestation', 'bon_commande'] },
    ],
  },

  // =========================================================================
  // AUTOMOTIVE
  // =========================================================================

  car_wash: {
    statCards: ['revenue', 'vehicles_today', 'avg_order', 'services_today', 'orders'],
    quickActions: QA_SERVICE,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'peak_hours' },
    ],
  },

  gas_station: {
    statCards: ['revenue', 'orders', 'avg_order', 'low_stock', 'products'],
    quickActions: QA_STANDARD_POS,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'peak_hours' },
    ],
  },

  auto_repair: {
    statCards: ['revenue', 'orders', 'avg_order', 'pending_jobs', 'gross_margin'],
    quickActions: [
      { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
      { i18nKey: 'dashboard.generateQuote', icon: 'FileText', targetSection: 'dashboard' },
      { i18nKey: 'dashboard.viewAll', icon: 'ClipboardList', targetSection: 'orders' },
    ],
    widgets: [
      { type: 'category_breakdown' },
      { type: 'contract_shortcuts', templates: ['devis_reparation', 'facture_travaux'] },
      { type: 'alerts_panel', alertTypes: ['low_stock', 'pending_repairs'] },
    ],
  },

  // =========================================================================
  // HOSPITALITY & TRAVEL
  // =========================================================================

  hotel: {
    statCards: ['revenue', 'orders', 'occupancy', 'avg_order', 'products'],
    quickActions: [
      { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
      { i18nKey: 'dashboard.newBooking', icon: 'Calendar', targetSection: 'pos' },
      { i18nKey: 'dashboard.viewAll', icon: 'ClipboardList', targetSection: 'orders' },
    ],
    widgets: [
      { type: 'category_breakdown' },
      { type: 'contract_shortcuts', templates: ['fiche_client', 'facture_sejour'] },
      { type: 'alerts_panel', alertTypes: ['pending_bookings'] },
    ],
  },

  travel_agency: {
    statCards: ['revenue', 'orders', 'avg_order', 'pending_bookings', 'conversions'],
    quickActions: [
      { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
      { i18nKey: 'dashboard.newBooking', icon: 'Calendar', targetSection: 'bookings' },
      { i18nKey: 'dashboard.viewAll', icon: 'ClipboardList', targetSection: 'bookings' },
    ],
    widgets: [
      { type: 'category_breakdown' },
      { type: 'contract_shortcuts', templates: ['contrat_voyage', 'assurance_voyage'] },
    ],
  },

  // =========================================================================
  // EDUCATION & CHILDCARE
  // =========================================================================

  daycare: {
    statCards: ['revenue', 'enrollment', 'services_today', 'avg_order', 'orders'],
    quickActions: [
      { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
      { i18nKey: 'dashboard.addProduct', icon: 'Plus', targetSection: 'services' },
      { i18nKey: 'dashboard.markAttendance', icon: 'CheckSquare', targetSection: 'enrollments' },
    ],
    widgets: [
      { type: 'category_breakdown' },
      { type: 'contract_shortcuts', templates: ['fiche_inscription', 'autorisation_parentale'] },
    ],
  },

  school: {
    statCards: ['revenue', 'enrollment', 'orders', 'avg_order', 'products'],
    quickActions: [
      { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
      { i18nKey: 'dashboard.addProduct', icon: 'Plus', targetSection: 'services' },
      { i18nKey: 'dashboard.viewAll', icon: 'ClipboardList', targetSection: 'enrollments' },
    ],
    widgets: [
      { type: 'category_breakdown' },
      { type: 'contract_shortcuts', templates: ['fiche_inscription', 'autorisation_parentale'] },
    ],
  },

  // =========================================================================
  // REAL ESTATE
  // =========================================================================

  real_estate: {
    statCards: ['revenue', 'active_listings', 'conversions', 'orders', 'avg_order'],
    quickActions: [
      { i18nKey: 'dashboard.newSale', icon: 'ShoppingCart', targetSection: 'pos' },
      { i18nKey: 'dashboard.newListing', icon: 'Plus', targetSection: 'properties' },
      { i18nKey: 'dashboard.generateQuote', icon: 'FileText', targetSection: 'dashboard' },
    ],
    widgets: [
      { type: 'category_breakdown' },
      { type: 'contract_shortcuts', templates: ['etat_des_lieux', 'bail', 'compromis_vente'] },
    ],
  },

  // =========================================================================
  // GENERAL SERVICES
  // =========================================================================

  services: {
    statCards: ['revenue', 'orders', 'avg_order', 'services_today', 'appointments_today'],
    quickActions: QA_SERVICE,
    widgets: [
      { type: 'category_breakdown' },
      { type: 'contract_shortcuts', templates: ['devis_prestation'] },
    ],
  },
}
