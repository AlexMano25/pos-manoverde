// ---------------------------------------------------------------------------
// POS Mano Verde SA -- Report Engine (pure computation functions)
// ---------------------------------------------------------------------------

import type { Order, Product } from '../types'

// -- Inventory Valuation ---------------------------------------------------

export type InventoryValuationItem = {
  category: string
  productCount: number
  totalUnits: number
  costValue: number      // total stock * cost
  retailValue: number    // total stock * price
  potentialMargin: number // retailValue - costValue
  marginPct: number
}

export function computeInventoryValuation(products: Product[]): {
  items: InventoryValuationItem[]
  totalCostValue: number
  totalRetailValue: number
  totalMargin: number
  totalMarginPct: number
  totalProducts: number
  totalUnits: number
} {
  const catMap = new Map<string, { products: Product[] }>()

  for (const p of products) {
    const cat = p.category || 'Autre'
    const entry = catMap.get(cat)
    if (entry) {
      entry.products.push(p)
    } else {
      catMap.set(cat, { products: [p] })
    }
  }

  const items: InventoryValuationItem[] = []
  let totalCostValue = 0
  let totalRetailValue = 0

  for (const [category, data] of catMap) {
    const productCount = data.products.length
    const totalUnits = data.products.reduce((s, p) => s + Math.max(p.stock, 0), 0)
    const costValue = data.products.reduce((s, p) => s + (p.cost ?? 0) * Math.max(p.stock, 0), 0)
    const retailValue = data.products.reduce((s, p) => s + p.price * Math.max(p.stock, 0), 0)
    const potentialMargin = retailValue - costValue
    const marginPct = retailValue > 0 ? (potentialMargin / retailValue) * 100 : 0

    totalCostValue += costValue
    totalRetailValue += retailValue

    items.push({ category, productCount, totalUnits, costValue, retailValue, potentialMargin, marginPct })
  }

  items.sort((a, b) => b.retailValue - a.retailValue)

  const totalMargin = totalRetailValue - totalCostValue
  const totalMarginPct = totalRetailValue > 0 ? (totalMargin / totalRetailValue) * 100 : 0

  return {
    items,
    totalCostValue,
    totalRetailValue,
    totalMargin,
    totalMarginPct,
    totalProducts: products.length,
    totalUnits: products.reduce((s, p) => s + Math.max(p.stock, 0), 0),
  }
}

// -- Profit Analysis -------------------------------------------------------

export type ProfitAnalysisItem = {
  category: string
  revenue: number
  cost: number
  profit: number
  marginPct: number
  unitsSold: number
}

export function computeProfitAnalysis(
  orders: Order[],
  products: Product[],
): {
  items: ProfitAnalysisItem[]
  totalRevenue: number
  totalCost: number
  totalProfit: number
  totalMarginPct: number
} {
  const productMap = new Map(products.map(p => [p.id, p]))
  const catData = new Map<string, { revenue: number; cost: number; units: number }>()

  const paidOrders = orders.filter(o => o.status === 'paid')
  for (const order of paidOrders) {
    for (const item of order.items) {
      const prod = productMap.get(item.product_id)
      const cat = prod?.category || 'Autre'
      const entry = catData.get(cat)
      const rev = item.price * item.qty
      const cost = (prod?.cost ?? 0) * item.qty
      if (entry) {
        entry.revenue += rev
        entry.cost += cost
        entry.units += item.qty
      } else {
        catData.set(cat, { revenue: rev, cost, units: item.qty })
      }
    }
  }

  const items: ProfitAnalysisItem[] = []
  let totalRevenue = 0
  let totalCost = 0

  for (const [category, data] of catData) {
    const profit = data.revenue - data.cost
    const marginPct = data.revenue > 0 ? (profit / data.revenue) * 100 : 0
    totalRevenue += data.revenue
    totalCost += data.cost
    items.push({ category, revenue: data.revenue, cost: data.cost, profit, marginPct, unitsSold: data.units })
  }

  items.sort((a, b) => b.revenue - a.revenue)

  const totalProfit = totalRevenue - totalCost
  const totalMarginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  return { items, totalRevenue, totalCost, totalProfit, totalMarginPct }
}

// -- Tax Summary -----------------------------------------------------------

export type TaxSummaryItem = {
  taxRate: number       // e.g. 19.25
  taxableAmount: number
  taxCollected: number
  orderCount: number
}

export function computeTaxSummary(orders: Order[], storeTaxRate: number = 0): {
  items: TaxSummaryItem[]
  totalGross: number
  totalNet: number
  totalTax: number
} {
  const paidOrders = orders.filter(o => o.status === 'paid')
  const rateMap = new Map<number, { taxable: number; tax: number; count: number }>()

  let totalGross = 0
  let totalNet = 0
  let totalTax = 0

  for (const order of paidOrders) {
    // Use store-level tax rate
    const taxRate = storeTaxRate
    const gross = order.total
    const net = taxRate > 0 ? gross / (1 + taxRate / 100) : gross
    const tax = gross - net

    totalGross += gross
    totalNet += net
    totalTax += tax

    const existing = rateMap.get(taxRate)
    if (existing) {
      existing.taxable += net
      existing.tax += tax
      existing.count++
    } else {
      rateMap.set(taxRate, { taxable: net, tax, count: 1 })
    }
  }

  const items: TaxSummaryItem[] = Array.from(rateMap.entries())
    .map(([taxRate, data]) => ({
      taxRate,
      taxableAmount: data.taxable,
      taxCollected: data.tax,
      orderCount: data.count,
    }))
    .sort((a, b) => b.taxCollected - a.taxCollected)

  return { items, totalGross, totalNet, totalTax }
}

// -- Category Revenue Breakdown --------------------------------------------

export type CategoryRevenueItem = {
  category: string
  revenue: number
  unitsSold: number
  orderCount: number
  percentage: number
  avgPrice: number
}

export function computeCategoryRevenue(
  orders: Order[],
  products: Product[],
): CategoryRevenueItem[] {
  const productMap = new Map(products.map(p => [p.id, p]))
  const catData = new Map<string, { revenue: number; units: number; orderIds: Set<string> }>()

  const paidOrders = orders.filter(o => o.status === 'paid')
  for (const order of paidOrders) {
    for (const item of order.items) {
      const prod = productMap.get(item.product_id)
      const cat = prod?.category || 'Autre'
      const entry = catData.get(cat)
      const rev = item.price * item.qty
      if (entry) {
        entry.revenue += rev
        entry.units += item.qty
        entry.orderIds.add(order.id)
      } else {
        catData.set(cat, { revenue: rev, units: item.qty, orderIds: new Set([order.id]) })
      }
    }
  }

  const totalRevenue = Array.from(catData.values()).reduce((s, d) => s + d.revenue, 0)

  return Array.from(catData.entries())
    .map(([category, data]) => ({
      category,
      revenue: data.revenue,
      unitsSold: data.units,
      orderCount: data.orderIds.size,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      avgPrice: data.units > 0 ? data.revenue / data.units : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

// -- Hourly Sales ----------------------------------------------------------

export type HourlySalesItem = {
  hour: number
  label: string
  revenue: number
  transactions: number
  avgTicket: number
}

export function computeHourlySales(orders: Order[]): HourlySalesItem[] {
  const paidOrders = orders.filter(o => o.status === 'paid')
  const hourMap = new Map<number, { revenue: number; count: number }>()

  for (const order of paidOrders) {
    const hour = new Date(order.created_at).getHours()
    const entry = hourMap.get(hour)
    if (entry) {
      entry.revenue += order.total
      entry.count++
    } else {
      hourMap.set(hour, { revenue: order.total, count: 1 })
    }
  }

  return Array.from(hourMap.entries())
    .map(([hour, data]) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}h`,
      revenue: data.revenue,
      transactions: data.count,
      avgTicket: data.count > 0 ? data.revenue / data.count : 0,
    }))
    .sort((a, b) => a.hour - b.hour)
}

// -- Payment Method Revenue ------------------------------------------------

export type PaymentMethodRevenue = {
  method: string
  label: string
  revenue: number
  count: number
  percentage: number
}

const PAYMENT_DISPLAY: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  momo: 'Mobile Money',
  transfer: 'Transfer',
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  carte_bancaire: 'Carte Bancaire',
  paypal: 'PayPal',
}

export function computePaymentMethodRevenue(orders: Order[]): PaymentMethodRevenue[] {
  const paidOrders = orders.filter(o => o.status === 'paid')
  const map = new Map<string, { revenue: number; count: number }>()

  for (const order of paidOrders) {
    const method = order.payment_method
    const entry = map.get(method)
    if (entry) {
      entry.revenue += order.total
      entry.count++
    } else {
      map.set(method, { revenue: order.total, count: 1 })
    }
  }

  const total = Array.from(map.values()).reduce((s, d) => s + d.revenue, 0)

  return Array.from(map.entries())
    .map(([method, data]) => ({
      method,
      label: PAYMENT_DISPLAY[method] || method,
      revenue: data.revenue,
      count: data.count,
      percentage: total > 0 ? (data.revenue / total) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
}
