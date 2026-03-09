// ---------------------------------------------------------------------------
// POS Mano Verde SA -- Customer Analytics Engine
// RFM Segmentation, Lifetime Value, Churn Risk, Spending Analysis
// ---------------------------------------------------------------------------

import type { Customer, Order } from '../types'

// -- RFM Segmentation -------------------------------------------------------

export type RFMScore = {
  recency: number   // 1-5 (5 = most recent)
  frequency: number // 1-5 (5 = most frequent)
  monetary: number  // 1-5 (5 = highest spender)
  total: number     // sum of R + F + M
  segment: RFMSegment
}

export type RFMSegment =
  | 'champion'       // 555, 554, 545, 544
  | 'loyal'          // 534, 535, 434, 435, 445, 543, 553
  | 'potential_loyal' // 443, 444, 453, 454, 343, 344, 353, 354
  | 'new_customer'   // 511, 512, 521, 522
  | 'promising'      // 412, 413, 422, 423, 512, 513, 522, 523
  | 'needs_attention' // 333, 334, 335, 343, 433, 434, 332
  | 'about_to_sleep' // 233, 234, 243, 244, 323, 324
  | 'at_risk'        // 222, 223, 232, 133, 134, 143
  | 'lost'           // 111, 112, 121, 122, 131, 132, 211, 212

export type RFMDistribution = {
  segment: RFMSegment
  label: string
  count: number
  percentage: number
  color: string
}

const SEGMENT_META: Record<RFMSegment, { label: string; color: string }> = {
  champion: { label: 'Champions', color: '#16a34a' },
  loyal: { label: 'Loyal', color: '#22c55e' },
  potential_loyal: { label: 'Potential Loyal', color: '#84cc16' },
  new_customer: { label: 'New Customers', color: '#3b82f6' },
  promising: { label: 'Promising', color: '#06b6d4' },
  needs_attention: { label: 'Need Attention', color: '#f59e0b' },
  about_to_sleep: { label: 'About to Sleep', color: '#f97316' },
  at_risk: { label: 'At Risk', color: '#ef4444' },
  lost: { label: 'Lost', color: '#94a3b8' },
}

function scoreToSegment(r: number, f: number, m: number): RFMSegment {
  const total = r + f + m
  if (total >= 13) return 'champion'
  if (total >= 11) return 'loyal'
  if (total >= 9) {
    if (r >= 4) return 'potential_loyal'
    return 'needs_attention'
  }
  if (r >= 4 && f <= 2) return 'new_customer'
  if (r >= 3 && total >= 7) return 'promising'
  if (total >= 7) return 'needs_attention'
  if (r >= 2 && total >= 6) return 'about_to_sleep'
  if (total >= 4) return 'at_risk'
  return 'lost'
}

function quintile(values: number[], value: number): number {
  if (values.length === 0) return 3
  const sorted = [...values].sort((a, b) => a - b)
  const idx = sorted.findIndex(v => v >= value)
  if (idx === -1) return 5
  const pct = idx / sorted.length
  if (pct >= 0.8) return 5
  if (pct >= 0.6) return 4
  if (pct >= 0.4) return 3
  if (pct >= 0.2) return 2
  return 1
}

export function computeRFM(
  customers: Customer[],
  orders: Order[],
): Map<string, RFMScore> {
  const now = new Date()
  const results = new Map<string, RFMScore>()

  // Build per-customer metrics
  const customerMetrics = new Map<string, { recencyDays: number; frequency: number; monetary: number }>()

  for (const customer of customers) {
    const customerOrders = orders.filter(
      o => o.customer_id === customer.id && o.status === 'paid'
    )

    const lastOrderDate = customerOrders.length > 0
      ? Math.max(...customerOrders.map(o => new Date(o.created_at).getTime()))
      : customer.last_visit ? new Date(customer.last_visit).getTime() : 0

    const recencyDays = lastOrderDate > 0
      ? Math.floor((now.getTime() - lastOrderDate) / (1000 * 60 * 60 * 24))
      : 365

    customerMetrics.set(customer.id, {
      recencyDays,
      frequency: customerOrders.length || customer.visit_count,
      monetary: customerOrders.reduce((s, o) => s + o.total, 0) || customer.total_spent,
    })
  }

  // Compute quintiles for each dimension
  const allRecency = Array.from(customerMetrics.values()).map(m => m.recencyDays)
  const allFrequency = Array.from(customerMetrics.values()).map(m => m.frequency)
  const allMonetary = Array.from(customerMetrics.values()).map(m => m.monetary)

  for (const [customerId, metrics] of customerMetrics) {
    // Recency: lower days = better, so invert the quintile
    const rScore = 6 - quintile(allRecency, metrics.recencyDays)
    const fScore = quintile(allFrequency, metrics.frequency)
    const mScore = quintile(allMonetary, metrics.monetary)

    const r = Math.max(1, Math.min(5, rScore))
    const f = Math.max(1, Math.min(5, fScore))
    const m = Math.max(1, Math.min(5, mScore))

    results.set(customerId, {
      recency: r,
      frequency: f,
      monetary: m,
      total: r + f + m,
      segment: scoreToSegment(r, f, m),
    })
  }

  return results
}

export function computeRFMDistribution(rfmScores: Map<string, RFMScore>): RFMDistribution[] {
  const segmentCounts = new Map<RFMSegment, number>()
  const total = rfmScores.size

  for (const score of rfmScores.values()) {
    segmentCounts.set(score.segment, (segmentCounts.get(score.segment) || 0) + 1)
  }

  return Object.entries(SEGMENT_META)
    .map(([segment, meta]) => ({
      segment: segment as RFMSegment,
      label: meta.label,
      count: segmentCounts.get(segment as RFMSegment) || 0,
      percentage: total > 0 ? ((segmentCounts.get(segment as RFMSegment) || 0) / total) * 100 : 0,
      color: meta.color,
    }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count)
}

// -- Customer Lifetime Value ------------------------------------------------

export type CLVData = {
  customerId: string
  avgOrderValue: number
  purchaseFrequency: number  // orders per month
  customerLifespan: number   // months since first order
  estimatedCLV: number       // projected lifetime value
  actualCLV: number          // total_spent so far
}

export function computeCLV(
  customer: Customer,
  orders: Order[],
  avgRetentionMonths: number = 24,
): CLVData {
  const customerOrders = orders.filter(
    o => o.customer_id === customer.id && o.status === 'paid'
  )

  const totalSpent = customerOrders.reduce((s, o) => s + o.total, 0) || customer.total_spent
  const orderCount = customerOrders.length || customer.visit_count
  const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0

  // Calculate customer lifespan in months
  const firstOrder = customerOrders.length > 0
    ? Math.min(...customerOrders.map(o => new Date(o.created_at).getTime()))
    : new Date(customer.created_at).getTime()
  const now = new Date().getTime()
  const lifespanMonths = Math.max(1, Math.floor((now - firstOrder) / (1000 * 60 * 60 * 24 * 30)))

  const purchaseFrequency = orderCount / lifespanMonths

  // CLV = Average Order Value × Purchase Frequency (per month) × Average Retention Period (months)
  const estimatedCLV = avgOrderValue * purchaseFrequency * avgRetentionMonths

  return {
    customerId: customer.id,
    avgOrderValue,
    purchaseFrequency,
    customerLifespan: lifespanMonths,
    estimatedCLV,
    actualCLV: totalSpent,
  }
}

// -- Churn Risk ---------------------------------------------------------------

export type ChurnRisk = 'low' | 'medium' | 'high' | 'critical'

export type ChurnData = {
  risk: ChurnRisk
  score: number       // 0-100 (100 = highest risk)
  daysSinceLastVisit: number
  avgDaysBetweenVisits: number
  isOverdue: boolean
}

export function computeChurnRisk(
  customer: Customer,
  orders: Order[],
): ChurnData {
  const customerOrders = orders
    .filter(o => o.customer_id === customer.id && o.status === 'paid')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const now = new Date().getTime()

  // Days since last visit
  const lastVisit = customer.last_visit
    ? new Date(customer.last_visit).getTime()
    : customerOrders.length > 0
      ? new Date(customerOrders[customerOrders.length - 1].created_at).getTime()
      : new Date(customer.created_at).getTime()

  const daysSinceLastVisit = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24))

  // Average days between visits
  let avgDaysBetweenVisits = 30 // default
  if (customerOrders.length >= 2) {
    const gaps: number[] = []
    for (let i = 1; i < customerOrders.length; i++) {
      const gap = new Date(customerOrders[i].created_at).getTime() -
        new Date(customerOrders[i - 1].created_at).getTime()
      gaps.push(gap / (1000 * 60 * 60 * 24))
    }
    avgDaysBetweenVisits = gaps.reduce((s, g) => s + g, 0) / gaps.length
  }

  const isOverdue = daysSinceLastVisit > avgDaysBetweenVisits * 1.5

  // Churn score: 0-100
  let score = 0
  if (avgDaysBetweenVisits > 0) {
    score = Math.min(100, Math.round((daysSinceLastVisit / avgDaysBetweenVisits) * 33))
  }
  if (customer.visit_count <= 1) score = Math.max(score, 50)
  if (daysSinceLastVisit > 90) score = Math.max(score, 70)
  if (daysSinceLastVisit > 180) score = Math.max(score, 90)

  let risk: ChurnRisk = 'low'
  if (score >= 75) risk = 'critical'
  else if (score >= 50) risk = 'high'
  else if (score >= 25) risk = 'medium'

  return { risk, score, daysSinceLastVisit, avgDaysBetweenVisits, isOverdue }
}

// -- Spending History --------------------------------------------------------

export type SpendingHistoryItem = {
  month: string       // "2026-01"
  label: string       // "Jan 26"
  revenue: number
  orderCount: number
}

export function computeSpendingHistory(
  customerId: string,
  orders: Order[],
  months: number = 6,
): SpendingHistoryItem[] {
  const customerOrders = orders.filter(
    o => o.customer_id === customerId && o.status === 'paid'
  )

  const now = new Date()
  const result: SpendingHistoryItem[] = []
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
    const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`

    const monthOrders = customerOrders.filter(o => o.created_at.startsWith(monthStr))
    const revenue = monthOrders.reduce((s, o) => s + o.total, 0)

    result.push({ month: monthStr, label, revenue, orderCount: monthOrders.length })
  }

  return result
}

// -- Favorite Products -------------------------------------------------------

export type FavoriteProduct = {
  productId: string
  name: string
  totalQty: number
  totalSpent: number
  orderCount: number
}

export function computeFavoriteProducts(
  customerId: string,
  orders: Order[],
  limit: number = 5,
): FavoriteProduct[] {
  const customerOrders = orders.filter(
    o => o.customer_id === customerId && o.status === 'paid'
  )

  const productMap = new Map<string, FavoriteProduct>()

  for (const order of customerOrders) {
    for (const item of order.items) {
      const existing = productMap.get(item.product_id)
      if (existing) {
        existing.totalQty += item.qty
        existing.totalSpent += item.price * item.qty
        existing.orderCount++
      } else {
        productMap.set(item.product_id, {
          productId: item.product_id,
          name: item.name,
          totalQty: item.qty,
          totalSpent: item.price * item.qty,
          orderCount: 1,
        })
      }
    }
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, limit)
}

// -- Export segment meta for UI -----------------------------------------------

export function getSegmentMeta(segment: RFMSegment): { label: string; color: string } {
  return SEGMENT_META[segment]
}
