/**
 * Transaction Anomaly Detection — Pure JS statistical analysis
 * Detects unusual amounts, hours, frequencies, rapid transactions, discount abuse
 */

import type { Order } from '../types'

// ── Types ─────────────────────────────────────────────────────────
export type AnomalyType =
  | 'unusual_amount'       // Order amount is Z > 3 std devs from mean
  | 'unusual_hour'         // Transaction outside normal business hours
  | 'rapid_succession'     // Multiple transactions within 2 minutes
  | 'high_discount'        // Excessive discount percentage
  | 'high_refund_rate'     // User has unusually high refund ratio
  | 'round_amount'         // Suspiciously round amount (potential fraud)
  | 'unusual_volume'       // Day's transaction count is abnormal

export type AnomalySeverity = 'high' | 'medium' | 'low'

export interface TransactionAnomaly {
  id: string
  type: AnomalyType
  severity: AnomalySeverity
  orderId: string
  orderTotal: number
  userId: string
  timestamp: string
  description: string      // i18n key
  details: Record<string, number | string>
  score: number            // 0–100, higher = more anomalous
}

export interface AnomalySummary {
  totalAnomalies: number
  highSeverity: number
  mediumSeverity: number
  lowSeverity: number
  anomalies: TransactionAnomaly[]
  riskScore: number          // overall 0–100
  stats: {
    meanAmount: number
    stdDevAmount: number
    totalOrders: number
    anomalyRate: number      // percentage
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(variance)
}

function zScore(value: number, m: number, sd: number): number {
  if (sd === 0) return 0
  return (value - m) / sd
}

function generateId(): string {
  return `anom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ── Detection Functions ───────────────────────────────────────────

/** Detect orders with unusually high or low amounts */
function detectUnusualAmounts(
  orders: Order[],
  threshold = 3.0
): TransactionAnomaly[] {
  const amounts = orders.map(o => o.total)
  const m = mean(amounts)
  const sd = stdDev(amounts)
  if (sd === 0) return []

  const anomalies: TransactionAnomaly[] = []

  for (const order of orders) {
    const z = Math.abs(zScore(order.total, m, sd))
    if (z >= threshold) {
      anomalies.push({
        id: generateId(),
        type: 'unusual_amount',
        severity: z >= 4 ? 'high' : 'medium',
        orderId: order.id,
        orderTotal: order.total,
        userId: order.user_id,
        timestamp: order.created_at,
        description: 'ai.anomalyUnusualAmount',
        details: {
          zScore: +z.toFixed(2),
          mean: +m.toFixed(2),
          stdDev: +sd.toFixed(2),
        },
        score: Math.min(100, Math.round(z * 20)),
      })
    }
  }
  return anomalies
}

/** Detect transactions at unusual hours */
function detectUnusualHours(
  orders: Order[],
  normalStart = 6,   // 6 AM
  normalEnd = 23     // 11 PM
): TransactionAnomaly[] {
  const anomalies: TransactionAnomaly[] = []

  for (const order of orders) {
    const hour = new Date(order.created_at).getHours()
    if (hour < normalStart || hour >= normalEnd) {
      anomalies.push({
        id: generateId(),
        type: 'unusual_hour',
        severity: (hour >= 0 && hour < 4) ? 'high' : 'low',
        orderId: order.id,
        orderTotal: order.total,
        userId: order.user_id,
        timestamp: order.created_at,
        description: 'ai.anomalyUnusualHour',
        details: { hour, normalStart, normalEnd },
        score: hour >= 0 && hour < 4 ? 75 : 40,
      })
    }
  }
  return anomalies
}

/** Detect rapid succession: multiple orders by same user within 2 min */
function detectRapidSuccession(
  orders: Order[],
  windowMs = 120000
): TransactionAnomaly[] {
  const anomalies: TransactionAnomaly[] = []
  const byUser = new Map<string, Order[]>()

  for (const order of orders) {
    const uid = order.user_id
    if (!byUser.has(uid)) byUser.set(uid, [])
    byUser.get(uid)!.push(order)
  }

  for (const [, userOrders] of byUser) {
    const sorted = [...userOrders].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    for (let i = 1; i < sorted.length; i++) {
      const diff = new Date(sorted[i].created_at).getTime() - new Date(sorted[i - 1].created_at).getTime()
      if (diff < windowMs && diff >= 0) {
        anomalies.push({
          id: generateId(),
          type: 'rapid_succession',
          severity: diff < 30000 ? 'high' : 'medium',
          orderId: sorted[i].id,
          orderTotal: sorted[i].total,
          userId: sorted[i].user_id,
          timestamp: sorted[i].created_at,
          description: 'ai.anomalyRapidSuccession',
          details: {
            intervalSeconds: Math.round(diff / 1000),
            previousOrderId: sorted[i - 1].id,
          },
          score: diff < 30000 ? 80 : 55,
        })
      }
    }
  }
  return anomalies
}

/** Detect orders with high discount rates (> 50%) */
function detectHighDiscounts(
  orders: Order[],
  maxDiscountPct = 50
): TransactionAnomaly[] {
  const anomalies: TransactionAnomaly[] = []

  for (const order of orders) {
    if (order.discount <= 0 || order.subtotal <= 0) continue
    const discountPct = (order.discount / order.subtotal) * 100
    if (discountPct > maxDiscountPct) {
      anomalies.push({
        id: generateId(),
        type: 'high_discount',
        severity: discountPct > 80 ? 'high' : 'medium',
        orderId: order.id,
        orderTotal: order.total,
        userId: order.user_id,
        timestamp: order.created_at,
        description: 'ai.anomalyHighDiscount',
        details: {
          discountPct: +discountPct.toFixed(1),
          discountAmount: order.discount,
          subtotal: order.subtotal,
        },
        score: Math.min(100, Math.round(discountPct)),
      })
    }
  }
  return anomalies
}

/** Detect users with high refund rates */
function detectHighRefundRate(
  orders: Order[],
  minOrders = 5,
  maxRefundPct = 30
): TransactionAnomaly[] {
  const anomalies: TransactionAnomaly[] = []
  const byUser = new Map<string, { total: number; refunded: number; orders: Order[] }>()

  for (const order of orders) {
    const uid = order.user_id
    if (!byUser.has(uid)) byUser.set(uid, { total: 0, refunded: 0, orders: [] })
    const userData = byUser.get(uid)!
    userData.total++
    if (order.status === 'refunded') userData.refunded++
    userData.orders.push(order)
  }

  for (const [userId, data] of byUser) {
    if (data.total < minOrders) continue
    const refundPct = (data.refunded / data.total) * 100
    if (refundPct > maxRefundPct) {
      const latestOrder = data.orders.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
      anomalies.push({
        id: generateId(),
        type: 'high_refund_rate',
        severity: refundPct > 50 ? 'high' : 'medium',
        orderId: latestOrder.id,
        orderTotal: latestOrder.total,
        userId,
        timestamp: latestOrder.created_at,
        description: 'ai.anomalyHighRefund',
        details: {
          refundPct: +refundPct.toFixed(1),
          totalOrders: data.total,
          refundedOrders: data.refunded,
        },
        score: Math.min(100, Math.round(refundPct * 1.5)),
      })
    }
  }
  return anomalies
}

/** Detect suspiciously round amounts (multiples of 1000, 5000, 10000) */
function detectRoundAmounts(
  orders: Order[],
  threshold = 1000
): TransactionAnomaly[] {
  const anomalies: TransactionAnomaly[] = []

  for (const order of orders) {
    if (order.total >= threshold && order.total % 1000 === 0) {
      // Check if the items actually add up to a round number naturally
      const itemsTotal = order.items.reduce((s, item) => s + item.price * item.qty, 0)
      const isNaturallyRound = itemsTotal % 1000 === 0

      if (!isNaturallyRound && order.total >= 5000) {
        anomalies.push({
          id: generateId(),
          type: 'round_amount',
          severity: order.total >= 50000 ? 'high' : 'low',
          orderId: order.id,
          orderTotal: order.total,
          userId: order.user_id,
          timestamp: order.created_at,
          description: 'ai.anomalyRoundAmount',
          details: {
            amount: order.total,
            itemsTotal: +itemsTotal.toFixed(2),
          },
          score: order.total >= 50000 ? 60 : 30,
        })
      }
    }
  }
  return anomalies
}

/** Detect days with unusual transaction volume */
function detectUnusualVolume(
  orders: Order[],
  threshold = 2.5
): TransactionAnomaly[] {
  const anomalies: TransactionAnomaly[] = []
  const dailyCounts = new Map<string, { count: number; orders: Order[] }>()

  for (const order of orders) {
    const day = (order.created_at || '').slice(0, 10)
    if (!dailyCounts.has(day)) dailyCounts.set(day, { count: 0, orders: [] })
    const dc = dailyCounts.get(day)!
    dc.count++
    dc.orders.push(order)
  }

  const counts = [...dailyCounts.values()].map(d => d.count)
  const m = mean(counts)
  const sd = stdDev(counts)
  if (sd === 0) return []

  for (const [day, data] of dailyCounts) {
    const z = zScore(data.count, m, sd)
    if (Math.abs(z) >= threshold) {
      const latestOrder = data.orders.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
      anomalies.push({
        id: generateId(),
        type: 'unusual_volume',
        severity: Math.abs(z) >= 3.5 ? 'high' : 'medium',
        orderId: latestOrder.id,
        orderTotal: data.orders.reduce((s, o) => s + o.total, 0),
        userId: latestOrder.user_id,
        timestamp: day,
        description: z > 0 ? 'ai.anomalyHighVolume' : 'ai.anomalyLowVolume',
        details: {
          dayCount: data.count,
          avgCount: +m.toFixed(1),
          zScore: +z.toFixed(2),
        },
        score: Math.min(100, Math.round(Math.abs(z) * 25)),
      })
    }
  }
  return anomalies
}

// ── Main Detection Function ───────────────────────────────────────
export function detectAnomalies(
  orders: Order[],
  options?: {
    amountThreshold?: number
    hourStart?: number
    hourEnd?: number
    rapidWindowMs?: number
    maxDiscountPct?: number
    volumeThreshold?: number
  }
): AnomalySummary {
  if (orders.length === 0) {
    return {
      totalAnomalies: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
      anomalies: [],
      riskScore: 0,
      stats: { meanAmount: 0, stdDevAmount: 0, totalOrders: 0, anomalyRate: 0 },
    }
  }

  const validOrders = orders.filter(o => o.status !== 'cancelled')

  const allAnomalies: TransactionAnomaly[] = [
    ...detectUnusualAmounts(validOrders, options?.amountThreshold || 3.0),
    ...detectUnusualHours(validOrders, options?.hourStart || 6, options?.hourEnd || 23),
    ...detectRapidSuccession(validOrders, options?.rapidWindowMs || 120000),
    ...detectHighDiscounts(validOrders, options?.maxDiscountPct || 50),
    ...detectHighRefundRate(validOrders),
    ...detectRoundAmounts(validOrders),
    ...detectUnusualVolume(validOrders, options?.volumeThreshold || 2.5),
  ]

  // Sort by score descending
  allAnomalies.sort((a, b) => b.score - a.score)

  const amounts = validOrders.map(o => o.total)
  const high = allAnomalies.filter(a => a.severity === 'high').length
  const med = allAnomalies.filter(a => a.severity === 'medium').length
  const low = allAnomalies.filter(a => a.severity === 'low').length

  // Risk score: weighted by severity
  const riskScore = Math.min(100, Math.round(
    ((high * 30 + med * 10 + low * 3) / Math.max(validOrders.length, 1)) * 10
  ))

  return {
    totalAnomalies: allAnomalies.length,
    highSeverity: high,
    mediumSeverity: med,
    lowSeverity: low,
    anomalies: allAnomalies,
    riskScore,
    stats: {
      meanAmount: +mean(amounts).toFixed(2),
      stdDevAmount: +stdDev(amounts).toFixed(2),
      totalOrders: validOrders.length,
      anomalyRate: validOrders.length > 0
        ? +((allAnomalies.length / validOrders.length) * 100).toFixed(1)
        : 0,
    },
  }
}
