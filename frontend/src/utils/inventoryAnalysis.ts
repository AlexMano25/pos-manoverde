// ---------------------------------------------------------------------------
// POS Mano Verde SA -- Inventory Analysis Engine
// Sales Velocity, Reorder Suggestions, ABC Analysis, Supplier Performance
// ---------------------------------------------------------------------------

import type { Product, Order, PurchaseOrder, Supplier } from '../types'

// -- Sales Velocity -----------------------------------------------------------

export type SalesVelocity = {
  productId: string
  name: string
  category: string
  dailyAvg: number        // units per day
  weeklyAvg: number       // units per week
  monthlyAvg: number      // units per month
  daysUntilStockout: number // estimated days until stock = 0
}

export function computeSalesVelocity(
  products: Product[],
  orders: Order[],
  periodDays: number = 30,
): Map<string, SalesVelocity> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

  const recentOrders = orders.filter(
    o => o.status === 'paid' && new Date(o.created_at) >= cutoff
  )

  // Aggregate sold quantities per product
  const soldMap = new Map<string, number>()
  for (const order of recentOrders) {
    for (const item of order.items) {
      soldMap.set(item.product_id, (soldMap.get(item.product_id) || 0) + item.qty)
    }
  }

  const results = new Map<string, SalesVelocity>()

  for (const product of products) {
    const totalSold = soldMap.get(product.id) || 0
    const dailyAvg = totalSold / periodDays
    const weeklyAvg = dailyAvg * 7
    const monthlyAvg = dailyAvg * 30

    const daysUntilStockout = dailyAvg > 0
      ? Math.floor(product.stock / dailyAvg)
      : product.stock > 0 ? 999 : 0

    results.set(product.id, {
      productId: product.id,
      name: product.name,
      category: product.category,
      dailyAvg: Math.round(dailyAvg * 100) / 100,
      weeklyAvg: Math.round(weeklyAvg * 100) / 100,
      monthlyAvg: Math.round(monthlyAvg * 100) / 100,
      daysUntilStockout,
    })
  }

  return results
}

// -- Reorder Suggestions -----------------------------------------------------

export type ReorderSuggestion = {
  productId: string
  name: string
  category: string
  currentStock: number
  minStock: number
  suggestedQty: number     // calculated reorder quantity
  urgency: 'critical' | 'high' | 'medium' | 'low'
  dailyVelocity: number
  daysUntilStockout: number
  supplierName?: string
  estimatedCost?: number
}

export function computeReorderSuggestions(
  products: Product[],
  orders: Order[],
  suppliers?: Supplier[],
  periodDays: number = 30,
  leadTimeDays: number = 7,
): ReorderSuggestion[] {
  const velocity = computeSalesVelocity(products, orders, periodDays)
  const suggestions: ReorderSuggestion[] = []

  for (const product of products) {
    if (!product.is_active) continue

    const vel = velocity.get(product.id)
    if (!vel) continue

    const minStock = product.min_stock ?? 5
    const needsReorder = product.stock <= minStock || vel.daysUntilStockout <= leadTimeDays * 2

    if (!needsReorder) continue

    // Suggested quantity: enough for 30 days of sales + safety buffer
    const baseQty = Math.ceil(vel.monthlyAvg * 1.2) // 20% safety margin
    const suggestedQty = Math.max(
      minStock * 2 - product.stock, // at least bring to 2x min_stock
      baseQty - product.stock,       // or cover 1 month
      minStock,                       // minimum order = min_stock
    )

    // Determine urgency
    let urgency: ReorderSuggestion['urgency'] = 'low'
    if (product.stock === 0) urgency = 'critical'
    else if (product.stock <= Math.floor(minStock * 0.5)) urgency = 'high'
    else if (product.stock <= minStock) urgency = 'medium'
    else if (vel.daysUntilStockout <= leadTimeDays) urgency = 'high'

    // Find supplier by product category match
    const supplier = suppliers?.find(
      s => s.is_active && s.category && product.category.toLowerCase().includes(s.category.toLowerCase())
    )

    suggestions.push({
      productId: product.id,
      name: product.name,
      category: product.category,
      currentStock: product.stock,
      minStock,
      suggestedQty: Math.max(1, suggestedQty),
      urgency,
      dailyVelocity: vel.dailyAvg,
      daysUntilStockout: vel.daysUntilStockout,
      supplierName: supplier?.name,
      estimatedCost: product.cost ? product.cost * Math.max(1, suggestedQty) : undefined,
    })
  }

  // Sort: critical first, then high, medium, low
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return suggestions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
}

// -- ABC Analysis (Pareto) ---------------------------------------------------

export type ABCCategory = 'A' | 'B' | 'C'

export type ABCItem = {
  productId: string
  name: string
  category: string
  totalRevenue: number
  totalQty: number
  cumulativePercent: number
  abcClass: ABCCategory
}

export function computeABCAnalysis(
  products: Product[],
  orders: Order[],
): ABCItem[] {
  const paidOrders = orders.filter(o => o.status === 'paid')

  // Aggregate revenue per product
  const revenueMap = new Map<string, { revenue: number; qty: number }>()
  for (const order of paidOrders) {
    for (const item of order.items) {
      const existing = revenueMap.get(item.product_id)
      if (existing) {
        existing.revenue += item.price * item.qty
        existing.qty += item.qty
      } else {
        revenueMap.set(item.product_id, {
          revenue: item.price * item.qty,
          qty: item.qty,
        })
      }
    }
  }

  const totalRevenue = Array.from(revenueMap.values()).reduce((s, v) => s + v.revenue, 0)
  if (totalRevenue === 0) return []

  // Build items sorted by revenue descending
  const items: ABCItem[] = products
    .map(p => {
      const data = revenueMap.get(p.id) || { revenue: 0, qty: 0 }
      return {
        productId: p.id,
        name: p.name,
        category: p.category,
        totalRevenue: data.revenue,
        totalQty: data.qty,
        cumulativePercent: 0,
        abcClass: 'C' as ABCCategory,
      }
    })
    .filter(item => item.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  // Compute cumulative percentages and assign ABC classes
  let cumulative = 0
  for (const item of items) {
    cumulative += item.totalRevenue
    item.cumulativePercent = (cumulative / totalRevenue) * 100

    if (item.cumulativePercent <= 80) {
      item.abcClass = 'A' // Top 80% revenue
    } else if (item.cumulativePercent <= 95) {
      item.abcClass = 'B' // Next 15% revenue
    } else {
      item.abcClass = 'C' // Bottom 5% revenue
    }
  }

  return items
}

// -- Supplier Performance ----------------------------------------------------

export type SupplierPerformance = {
  supplierId: string
  supplierName: string
  totalOrders: number
  completedOrders: number
  avgDeliveryDays: number   // avg days between sent and received
  onTimeRate: number        // % delivered within expected date
  totalSpent: number
  avgOrderValue: number
  lastOrderDate: string | null
}

export function computeSupplierPerformance(
  suppliers: Supplier[],
  purchaseOrders: PurchaseOrder[],
): SupplierPerformance[] {
  const results: SupplierPerformance[] = []

  for (const supplier of suppliers) {
    const supplierPOs = purchaseOrders.filter(po => po.supplier_id === supplier.id)
    const completedPOs = supplierPOs.filter(po => po.status === 'received')

    // Calculate avg delivery time
    let totalDeliveryDays = 0
    let deliveryCount = 0
    let onTimeCount = 0

    for (const po of completedPOs) {
      if (po.received_at) {
        const sentDate = new Date(po.created_at).getTime()
        const receivedDate = new Date(po.received_at).getTime()
        const days = Math.floor((receivedDate - sentDate) / (1000 * 60 * 60 * 24))
        totalDeliveryDays += days
        deliveryCount++

        // Check if on time (within expected delivery date)
        if (po.expected_delivery) {
          const expectedDate = new Date(po.expected_delivery).getTime()
          if (receivedDate <= expectedDate + 24 * 60 * 60 * 1000) { // 1 day grace
            onTimeCount++
          }
        } else {
          onTimeCount++ // No expected date = assume on time
        }
      }
    }

    const totalSpent = completedPOs.reduce((s, po) => s + po.total, 0)

    // Sort POs to find last order date
    const sortedPOs = [...supplierPOs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    results.push({
      supplierId: supplier.id,
      supplierName: supplier.name,
      totalOrders: supplierPOs.length,
      completedOrders: completedPOs.length,
      avgDeliveryDays: deliveryCount > 0 ? Math.round(totalDeliveryDays / deliveryCount) : 0,
      onTimeRate: deliveryCount > 0 ? Math.round((onTimeCount / deliveryCount) * 100) : 0,
      totalSpent,
      avgOrderValue: completedPOs.length > 0 ? Math.round(totalSpent / completedPOs.length) : 0,
      lastOrderDate: sortedPOs[0]?.created_at || null,
    })
  }

  // Sort by total spent descending
  return results.sort((a, b) => b.totalSpent - a.totalSpent)
}

// -- Stock Turnover ----------------------------------------------------------

export type StockTurnover = {
  productId: string
  name: string
  category: string
  turnoverRate: number    // times stock was sold through in period
  avgDaysToSell: number   // average days to sell through current stock
}

export function computeStockTurnover(
  products: Product[],
  orders: Order[],
  periodDays: number = 90,
): StockTurnover[] {
  const velocity = computeSalesVelocity(products, orders, periodDays)
  const results: StockTurnover[] = []

  for (const product of products) {
    if (!product.is_active) continue

    const vel = velocity.get(product.id)
    if (!vel || vel.monthlyAvg === 0) continue

    // Turnover = total sold / average stock (approximate with current stock)
    const avgStock = Math.max(product.stock, product.min_stock ?? 5)
    const totalSold = vel.dailyAvg * periodDays
    const turnoverRate = avgStock > 0 ? totalSold / avgStock : 0

    results.push({
      productId: product.id,
      name: product.name,
      category: product.category,
      turnoverRate: Math.round(turnoverRate * 100) / 100,
      avgDaysToSell: vel.dailyAvg > 0 ? Math.round(product.stock / vel.dailyAvg) : 999,
    })
  }

  return results.sort((a, b) => b.turnoverRate - a.turnoverRate)
}
