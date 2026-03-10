/**
 * Demand Forecasting Engine — Pure JS, no external ML libraries
 * Uses Weighted Moving Average (WMA) with seasonal (day-of-week) adjustments
 */

import type { Order, Product } from '../types'

// ── Types ─────────────────────────────────────────────────────────
export interface DailyDemand {
  date: string        // YYYY-MM-DD
  dayOfWeek: number   // 0=Sun … 6=Sat
  qty: number
  revenue: number
}

export interface ProductForecast {
  productId: string
  productName: string
  category: string
  currentStock: number
  avgDailyDemand: number          // units/day (last 30d)
  trend: 'increasing' | 'decreasing' | 'stable'
  trendPct: number                // % change recent vs older half
  forecastNext7: number[]         // predicted daily qty for next 7 days
  forecastTotal7: number          // sum of next 7 days
  forecastTotal30: number         // estimated 30-day demand
  daysUntilStockout: number | null // null = no sales history
  seasonalIndex: number[]         // 7 values (Sun–Sat), 1.0 = avg
  confidence: 'high' | 'medium' | 'low'
  historyDays: number             // how many days of data
}

export interface ForecastSummary {
  totalProducts: number
  forecastedProducts: number
  atRiskProducts: number          // stockout within 14 days
  trendingUp: number
  trendingDown: number
  stable: number
  forecasts: ProductForecast[]
}

// ── Helpers ───────────────────────────────────────────────────────
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Group orders into per-product daily demand */
function buildDailyDemand(
  orders: Order[],
  lookbackDays: number
): Map<string, DailyDemand[]> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - lookbackDays * 86400000)
  const cutoffStr = dateStr(cutoff)

  const map = new Map<string, Map<string, { qty: number; revenue: number }>>()

  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'refunded') continue
    const orderDate = (order.created_at || '').slice(0, 10)
    if (orderDate < cutoffStr) continue

    for (const item of order.items) {
      if (!map.has(item.product_id)) map.set(item.product_id, new Map())
      const prodMap = map.get(item.product_id)!
      const existing = prodMap.get(orderDate) || { qty: 0, revenue: 0 }
      existing.qty += item.qty
      existing.revenue += item.price * item.qty
      prodMap.set(orderDate, existing)
    }
  }

  // Convert to sorted DailyDemand arrays (fill zero-days)
  const result = new Map<string, DailyDemand[]>()
  for (const [productId, dayMap] of map) {
    const demands: DailyDemand[] = []
    for (let d = new Date(cutoff); d <= now; d.setDate(d.getDate() + 1)) {
      const ds = dateStr(d)
      const data = dayMap.get(ds) || { qty: 0, revenue: 0 }
      demands.push({
        date: ds,
        dayOfWeek: d.getDay(),
        qty: data.qty,
        revenue: data.revenue,
      })
    }
    result.set(productId, demands)
  }
  return result
}

/** Weighted Moving Average — recent days weighted more */
function weightedMovingAverage(values: number[], window: number): number {
  const n = Math.min(values.length, window)
  if (n === 0) return 0
  const slice = values.slice(-n)
  let weightSum = 0
  let totalWeight = 0
  for (let i = 0; i < slice.length; i++) {
    const w = i + 1 // more recent = higher weight
    weightSum += slice[i] * w
    totalWeight += w
  }
  return totalWeight > 0 ? weightSum / totalWeight : 0
}

/** Compute seasonal (day-of-week) indices */
function computeSeasonalIndex(demands: DailyDemand[]): number[] {
  const daySums = [0, 0, 0, 0, 0, 0, 0]
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]

  for (const d of demands) {
    daySums[d.dayOfWeek] += d.qty
    dayCounts[d.dayOfWeek]++
  }

  const dayAvgs = daySums.map((s, i) => (dayCounts[i] > 0 ? s / dayCounts[i] : 0))
  const overallAvg = dayAvgs.reduce((a, b) => a + b, 0) / 7

  if (overallAvg === 0) return [1, 1, 1, 1, 1, 1, 1]
  return dayAvgs.map(a => +(a / overallAvg).toFixed(3))
}

/** Detect trend: compare first-half avg vs second-half avg */
function detectTrend(demands: DailyDemand[]): { trend: 'increasing' | 'decreasing' | 'stable'; pct: number } {
  if (demands.length < 7) return { trend: 'stable', pct: 0 }
  const mid = Math.floor(demands.length / 2)
  const firstHalf = demands.slice(0, mid)
  const secondHalf = demands.slice(mid)

  const avgFirst = firstHalf.reduce((s, d) => s + d.qty, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((s, d) => s + d.qty, 0) / secondHalf.length

  if (avgFirst === 0 && avgSecond === 0) return { trend: 'stable', pct: 0 }
  if (avgFirst === 0) return { trend: 'increasing', pct: 100 }

  const changePct = ((avgSecond - avgFirst) / avgFirst) * 100

  if (changePct > 15) return { trend: 'increasing', pct: +changePct.toFixed(1) }
  if (changePct < -15) return { trend: 'decreasing', pct: +changePct.toFixed(1) }
  return { trend: 'stable', pct: +changePct.toFixed(1) }
}

// ── Main Forecast Function ────────────────────────────────────────
export function forecastDemand(
  orders: Order[],
  products: Product[],
  options?: { lookbackDays?: number; wmaWindow?: number }
): ForecastSummary {
  const lookback = options?.lookbackDays || 60
  const wmaWindow = options?.wmaWindow || 14

  const dailyDemandMap = buildDailyDemand(orders, lookback)
  const productMap = new Map(products.map(p => [p.id, p]))

  const forecasts: ProductForecast[] = []
  let atRisk = 0
  let up = 0
  let down = 0
  let stable = 0

  // Only forecast products that have sales history
  for (const [productId, demands] of dailyDemandMap) {
    const product = productMap.get(productId)
    if (!product) continue

    const qtyValues = demands.map(d => d.qty)
    const avgDaily = qtyValues.reduce((a, b) => a + b, 0) / qtyValues.length
    const wma = weightedMovingAverage(qtyValues, wmaWindow)
    const seasonal = computeSeasonalIndex(demands)
    const { trend, pct } = detectTrend(demands)

    // Forecast next 7 days
    const today = new Date()
    const forecast7: number[] = []
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(today.getTime() + i * 86400000)
      const dow = futureDate.getDay()
      // WMA × seasonal adjustment, minimum 0
      const predicted = Math.max(0, +(wma * seasonal[dow]).toFixed(2))
      forecast7.push(predicted)
    }

    const forecastTotal7 = +forecast7.reduce((a, b) => a + b, 0).toFixed(1)
    const forecastTotal30 = +(wma * 30).toFixed(1)

    // Days until stockout
    let daysUntilStockout: number | null = null
    if (wma > 0) {
      daysUntilStockout = Math.floor(product.stock / wma)
      if (daysUntilStockout > 365) daysUntilStockout = null // effectively infinite
    }

    // Confidence based on data volume
    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (demands.length >= 30) confidence = 'high'
    else if (demands.length >= 14) confidence = 'medium'

    if (trend === 'increasing') up++
    else if (trend === 'decreasing') down++
    else stable++

    if (daysUntilStockout !== null && daysUntilStockout <= 14) atRisk++

    forecasts.push({
      productId,
      productName: product.name,
      category: product.category,
      currentStock: product.stock,
      avgDailyDemand: +avgDaily.toFixed(2),
      trend,
      trendPct: pct,
      forecastNext7: forecast7,
      forecastTotal7,
      forecastTotal30,
      daysUntilStockout,
      seasonalIndex: seasonal,
      confidence,
      historyDays: demands.length,
    })
  }

  // Sort by urgency (lowest daysUntilStockout first)
  forecasts.sort((a, b) => {
    const aD = a.daysUntilStockout ?? 9999
    const bD = b.daysUntilStockout ?? 9999
    return aD - bD
  })

  return {
    totalProducts: products.length,
    forecastedProducts: forecasts.length,
    atRiskProducts: atRisk,
    trendingUp: up,
    trendingDown: down,
    stable,
    forecasts,
  }
}

/** Quick helper: forecast a single product */
export function forecastSingleProduct(
  orders: Order[],
  productId: string,
  product: Product,
  lookbackDays = 60
): ProductForecast | null {
  const summary = forecastDemand(orders, [product], { lookbackDays })
  return summary.forecasts.find(f => f.productId === productId) || null
}

/** Compute top-N fastest-moving products */
export function getTopMovers(
  forecasts: ProductForecast[],
  n = 10
): ProductForecast[] {
  return [...forecasts]
    .sort((a, b) => b.avgDailyDemand - a.avgDailyDemand)
    .slice(0, n)
}

/** Compute products with strongest upward/downward trends */
export function getTrendLeaders(
  forecasts: ProductForecast[],
  direction: 'increasing' | 'decreasing',
  n = 10
): ProductForecast[] {
  return forecasts
    .filter(f => f.trend === direction)
    .sort((a, b) => Math.abs(b.trendPct) - Math.abs(a.trendPct))
    .slice(0, n)
}

