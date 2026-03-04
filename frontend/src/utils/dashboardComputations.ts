// ---------------------------------------------------------------------------
// POS Mano Verde SA -- Dashboard KPI pure computation functions
// ---------------------------------------------------------------------------

import type { StatCardVariant, AlertVariant, Order, Product } from '../types'

// -- computeStatValue --------------------------------------------------------

export function computeStatValue(
  variant: StatCardVariant,
  todayOrders: Order[],
  allOrders: Order[],
  products: Product[],
): number {
  switch (variant) {
    case 'revenue':
      return todayOrders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total, 0)
    case 'orders':
      return todayOrders.length
    case 'products':
      return products.length
    case 'low_stock':
      return products.filter(p => p.stock <= (p.min_stock ?? 5)).length
    case 'avg_check':
    case 'avg_order': {
      const paid = todayOrders.filter(o => o.status === 'paid')
      return paid.length > 0 ? paid.reduce((s, o) => s + o.total, 0) / paid.length : 0
    }
    case 'gross_margin': {
      const revenue = todayOrders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total, 0)
      const cost = todayOrders.filter(o => o.status === 'paid').reduce((s, o) => {
        return s + o.items.reduce((is, item) => {
          const prod = products.find(p => p.id === item.product_id)
          return is + (prod?.cost ?? 0) * item.qty
        }, 0)
      }, 0)
      return revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0
    }
    case 'food_cost':
    case 'beverage_cost': {
      const rev = todayOrders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total, 0)
      const cst = todayOrders.filter(o => o.status === 'paid').reduce((s, o) => {
        return s + o.items.reduce((is, item) => {
          const prod = products.find(p => p.id === item.product_id)
          return is + (prod?.cost ?? 0) * item.qty
        }, 0)
      }, 0)
      return rev > 0 ? (cst / rev) * 100 : 0
    }
    case 'expiring_items': {
      const now = new Date()
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return products.filter(p => {
        if (!p.expiry_date) return false
        const exp = new Date(p.expiry_date)
        return exp <= weekLater
      }).length
    }
    case 'occupancy': {
      // For hotel: count products with room_type that have stock > 0 (available rooms)
      const rooms = products.filter(p => p.room_type)
      const totalRooms = rooms.length
      const occupiedToday = todayOrders.filter(o => o.status === 'paid').length
      return totalRooms > 0 ? Math.min((occupiedToday / totalRooms) * 100, 100) : 0
    }
    case 'appointments_today':
    case 'services_today':
      return todayOrders.length
    case 'active_members': {
      // Count products in subscription-like categories with stock > 0
      return products.filter(p =>
        p.category.toLowerCase().includes('abonnement') ||
        p.category.toLowerCase().includes('membership') ||
        p.category.toLowerCase().includes('subscription')
      ).reduce((s, p) => s + Math.max(p.stock, 0), 0)
    }
    case 'vehicles_today':
      return todayOrders.length
    case 'pending_bookings':
    case 'pending_jobs':
      return allOrders.filter(o => o.status === 'pending').length
    case 'enrollment': {
      return products.filter(p =>
        p.category.toLowerCase().includes('inscription') ||
        p.category.toLowerCase().includes('enrollment')
      ).reduce((s, p) => s + Math.max(p.stock, 0), 0)
    }
    case 'active_listings':
      return products.filter(p => p.is_active).length
    case 'conversions': {
      const total = allOrders.length
      const paid = allOrders.filter(o => o.status === 'paid').length
      return total > 0 ? Math.round((paid / total) * 100) : 0
    }
    case 'capacity_rate': {
      // Simplified: today's orders vs estimated daily capacity (e.g., 50)
      const capacity = 50
      return Math.min(Math.round((todayOrders.length / capacity) * 100), 100)
    }
    case 'credit':
      return 0 // handled separately in DashboardPage
    default:
      return 0
  }
}

// -- getStatCardMeta ---------------------------------------------------------

export type StatCardMeta = {
  labelKey: string   // i18n key
  icon: string       // lucide icon name
  color: string      // hex color
  isCurrency: boolean
  isPercentage: boolean
}

export function getStatCardMeta(variant: StatCardVariant): StatCardMeta {
  switch (variant) {
    case 'revenue': return { labelKey: 'dashboard.todayRevenue', icon: 'DollarSign', color: '#16a34a', isCurrency: true, isPercentage: false }
    case 'orders': return { labelKey: 'dashboard.todayOrders', icon: 'ShoppingCart', color: '#2563eb', isCurrency: false, isPercentage: false }
    case 'products': return { labelKey: 'dashboard.totalProducts', icon: 'Package', color: '#7c3aed', isCurrency: false, isPercentage: false }
    case 'low_stock': return { labelKey: 'dashboard.lowStock', icon: 'AlertTriangle', color: '#f59e0b', isCurrency: false, isPercentage: false }
    case 'credit': return { labelKey: 'dashboard.creditBalance', icon: 'CreditCard', color: '#2563eb', isCurrency: true, isPercentage: false }
    case 'avg_check': return { labelKey: 'dashboard.avgCheck', icon: 'Receipt', color: '#0891b2', isCurrency: true, isPercentage: false }
    case 'avg_order': return { labelKey: 'dashboard.avgBasket', icon: 'ShoppingBag', color: '#0891b2', isCurrency: true, isPercentage: false }
    case 'gross_margin': return { labelKey: 'dashboard.grossMarginPct', icon: 'TrendingUp', color: '#16a34a', isCurrency: false, isPercentage: true }
    case 'food_cost': return { labelKey: 'dashboard.foodCostPct', icon: 'UtensilsCrossed', color: '#ea580c', isCurrency: false, isPercentage: true }
    case 'beverage_cost': return { labelKey: 'dashboard.beverageCostPct', icon: 'Wine', color: '#ea580c', isCurrency: false, isPercentage: true }
    case 'expiring_items': return { labelKey: 'dashboard.expiringItems', icon: 'Clock', color: '#dc2626', isCurrency: false, isPercentage: false }
    case 'occupancy': return { labelKey: 'dashboard.occupancyRate', icon: 'BedDouble', color: '#2563eb', isCurrency: false, isPercentage: true }
    case 'appointments_today': return { labelKey: 'dashboard.appointmentsToday', icon: 'Calendar', color: '#7c3aed', isCurrency: false, isPercentage: false }
    case 'services_today': return { labelKey: 'dashboard.servicesToday', icon: 'Activity', color: '#2563eb', isCurrency: false, isPercentage: false }
    case 'active_members': return { labelKey: 'dashboard.activeMembers', icon: 'Users', color: '#16a34a', isCurrency: false, isPercentage: false }
    case 'vehicles_today': return { labelKey: 'dashboard.vehiclesToday', icon: 'Car', color: '#2563eb', isCurrency: false, isPercentage: false }
    case 'pending_bookings': return { labelKey: 'dashboard.pendingBookings', icon: 'Clock', color: '#f59e0b', isCurrency: false, isPercentage: false }
    case 'pending_jobs': return { labelKey: 'dashboard.pendingJobs', icon: 'Loader', color: '#f59e0b', isCurrency: false, isPercentage: false }
    case 'enrollment': return { labelKey: 'dashboard.enrollmentCount', icon: 'GraduationCap', color: '#7c3aed', isCurrency: false, isPercentage: false }
    case 'active_listings': return { labelKey: 'dashboard.activeListings', icon: 'Home', color: '#2563eb', isCurrency: false, isPercentage: false }
    case 'conversions': return { labelKey: 'dashboard.conversions', icon: 'Target', color: '#16a34a', isCurrency: false, isPercentage: true }
    case 'capacity_rate': return { labelKey: 'dashboard.capacityRate', icon: 'Users', color: '#2563eb', isCurrency: false, isPercentage: true }
    default: return { labelKey: 'dashboard.todayRevenue', icon: 'DollarSign', color: '#16a34a', isCurrency: true, isPercentage: false }
  }
}

// -- computeCategoryBreakdown ------------------------------------------------

export type CategoryBreakdownItem = {
  category: string
  revenue: number
  percentage: number
}

export function computeCategoryBreakdown(
  todayOrders: Order[],
  products: Product[],
): CategoryBreakdownItem[] {
  const categoryRevenue: Record<string, number> = {}

  todayOrders.filter(o => o.status === 'paid').forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.product_id)
      const cat = product?.category || 'Autre'
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.price * item.qty
    })
  })

  const total = Object.values(categoryRevenue).reduce((s, v) => s + v, 0)

  return Object.entries(categoryRevenue)
    .map(([category, revenue]) => ({
      category,
      revenue,
      percentage: total > 0 ? (revenue / total) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6) // top 6 categories
}

// -- computePeakHours --------------------------------------------------------

export type PeakHourItem = {
  hour: number    // 0-23
  label: string   // "08h", "14h"
  count: number
  revenue: number
}

export function computePeakHours(todayOrders: Order[]): PeakHourItem[] {
  const hourData: Record<number, { count: number; revenue: number }> = {}

  todayOrders.filter(o => o.status === 'paid').forEach(order => {
    const hour = new Date(order.created_at).getHours()
    if (!hourData[hour]) hourData[hour] = { count: 0, revenue: 0 }
    hourData[hour].count++
    hourData[hour].revenue += order.total
  })

  // Return all hours that have data, sorted by hour
  return Object.entries(hourData)
    .map(([h, data]) => ({
      hour: parseInt(h),
      label: `${h.padStart(2, '0')}h`,
      count: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => a.hour - b.hour)
}

// -- computeAlerts -----------------------------------------------------------

export type AlertItem = {
  type: AlertVariant
  message: string
  count: number
  severity: 'warning' | 'danger'
}

export function computeAlerts(
  alertTypes: AlertVariant[],
  products: Product[],
  orders: Order[],
): AlertItem[] {
  const alerts: AlertItem[] = []

  if (alertTypes.includes('low_stock')) {
    const lowStockCount = products.filter(p => p.stock <= (p.min_stock ?? 5) && p.stock > 0).length
    const outOfStockCount = products.filter(p => p.stock === 0).length
    if (lowStockCount > 0) {
      alerts.push({ type: 'low_stock', message: `${lowStockCount} produit(s) en stock faible`, count: lowStockCount, severity: 'warning' })
    }
    if (outOfStockCount > 0) {
      alerts.push({ type: 'low_stock', message: `${outOfStockCount} produit(s) en rupture`, count: outOfStockCount, severity: 'danger' })
    }
  }

  if (alertTypes.includes('expiring_soon')) {
    const now = new Date()
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const expiringCount = products.filter(p => {
      if (!p.expiry_date) return false
      const exp = new Date(p.expiry_date)
      return exp <= weekLater && exp >= now
    }).length
    const expiredCount = products.filter(p => {
      if (!p.expiry_date) return false
      return new Date(p.expiry_date) < now
    }).length
    if (expiringCount > 0) {
      alerts.push({ type: 'expiring_soon', message: `${expiringCount} produit(s) expirent bientôt`, count: expiringCount, severity: 'warning' })
    }
    if (expiredCount > 0) {
      alerts.push({ type: 'expiring_soon', message: `${expiredCount} produit(s) expirés`, count: expiredCount, severity: 'danger' })
    }
  }

  if (alertTypes.includes('pending_bookings') || alertTypes.includes('pending_repairs')) {
    const pendingCount = orders.filter(o => o.status === 'pending').length
    if (pendingCount > 0) {
      alerts.push({ type: 'pending_bookings', message: `${pendingCount} commande(s) en attente`, count: pendingCount, severity: 'warning' })
    }
  }

  return alerts
}
