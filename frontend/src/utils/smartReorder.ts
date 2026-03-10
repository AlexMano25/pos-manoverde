/**
 * Smart Reorder Suggestions — AI-powered inventory replenishment
 * Uses demand forecasts + lead times + safety stock calculations
 */

import type { Product } from '../types'
import type { ProductForecast } from './demandForecast'

// ── Types ─────────────────────────────────────────────────────────
export type ReorderUrgency = 'critical' | 'high' | 'medium' | 'low' | 'ok'

export interface ReorderSuggestion {
  productId: string
  productName: string
  category: string
  currentStock: number
  minStock: number
  avgDailyDemand: number
  leadTimeDays: number
  safetyStock: number
  reorderPoint: number
  suggestedQty: number          // Economic Order Quantity approximation
  urgency: ReorderUrgency
  daysUntilStockout: number | null
  estimatedCost: number | null   // suggestedQty × product.cost
  trend: 'increasing' | 'decreasing' | 'stable'
  reason: string                 // human-readable explanation key
}

export interface ReorderSummary {
  totalSuggestions: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  totalEstimatedCost: number
  suggestions: ReorderSuggestion[]
}

// ── Configuration ─────────────────────────────────────────────────
const DEFAULT_LEAD_TIME = 3       // days
const EOQ_ORDERING_COST = 10      // assumed fixed ordering cost per order
const TARGET_DAYS_SUPPLY = 30     // aim for 30 days of stock

// ── Safety Stock Calculation ──────────────────────────────────────
/** Z-score for desired service level */
function serviceZ(level: number): number {
  // 95% → 1.645, 99% → 2.326
  if (level >= 0.99) return 2.326
  if (level >= 0.95) return 1.645
  if (level >= 0.90) return 1.282
  return 1.0
}

/** Compute standard deviation of daily demand from forecast data */
function demandStdDev(forecast: ProductForecast): number {
  // Approximate from the seasonal index variation
  const indices = forecast.seasonalIndex
  const mean = indices.reduce((a, b) => a + b, 0) / indices.length
  const variance = indices.reduce((s, v) => s + (v - mean) ** 2, 0) / indices.length
  return Math.sqrt(variance) * forecast.avgDailyDemand
}

// ── Main Reorder Logic ────────────────────────────────────────────
export function computeReorderSuggestions(
  products: Product[],
  forecasts: ProductForecast[],
  options?: {
    defaultLeadTime?: number
    serviceLevel?: number
    targetDaysSupply?: number
  }
): ReorderSummary {
  const leadTime = options?.defaultLeadTime || DEFAULT_LEAD_TIME
  const zScore = serviceZ(options?.serviceLevel || 0.95)
  const targetDays = options?.targetDaysSupply || TARGET_DAYS_SUPPLY

  const forecastMap = new Map(forecasts.map(f => [f.productId, f]))
  const suggestions: ReorderSuggestion[] = []

  for (const product of products) {
    if (!product.is_active) continue

    const forecast = forecastMap.get(product.id)
    const avgDaily = forecast?.avgDailyDemand || 0

    // Skip products with no demand history
    if (avgDaily <= 0) continue

    const minStock = product.min_stock || 0
    const stdDev = forecast ? demandStdDev(forecast) : avgDaily * 0.3

    // Safety stock = Z × σ × √(lead time)
    const safetyStock = Math.ceil(zScore * stdDev * Math.sqrt(leadTime))

    // Reorder point = (avg daily demand × lead time) + safety stock
    const reorderPoint = Math.ceil(avgDaily * leadTime + safetyStock)

    // Check if we need to reorder
    if (product.stock > reorderPoint && product.stock > minStock) continue

    // Simplified EOQ: √(2 × D × S / H) where D=annual demand, S=ordering cost, H=holding cost
    const annualDemand = avgDaily * 365
    const holdingCost = (product.cost || product.price * 0.6) * 0.2 // 20% of cost
    let eoq = Math.ceil(Math.sqrt((2 * annualDemand * EOQ_ORDERING_COST) / Math.max(holdingCost, 0.01)))

    // But at minimum order enough for target days supply
    const targetSupplyQty = Math.ceil(avgDaily * targetDays) - product.stock + safetyStock
    const suggestedQty = Math.max(eoq, targetSupplyQty, 1)

    // Determine urgency
    const daysUntilStockout = forecast?.daysUntilStockout ?? (avgDaily > 0 ? Math.floor(product.stock / avgDaily) : null)
    let urgency: ReorderUrgency = 'low'
    let reason = 'ai.reorderBelowPoint'

    if (product.stock <= 0) {
      urgency = 'critical'
      reason = 'ai.reorderOutOfStock'
    } else if (daysUntilStockout !== null && daysUntilStockout <= 2) {
      urgency = 'critical'
      reason = 'ai.reorderStockoutSoon'
    } else if (daysUntilStockout !== null && daysUntilStockout <= 7) {
      urgency = 'high'
      reason = 'ai.reorderLowDays'
    } else if (product.stock <= minStock) {
      urgency = 'high'
      reason = 'ai.reorderBelowMin'
    } else if (product.stock <= reorderPoint) {
      urgency = 'medium'
      reason = 'ai.reorderBelowPoint'
    }

    // Adjust for trend
    if (forecast?.trend === 'increasing' && urgency !== 'critical') {
      // Bump urgency up if demand is increasing
      if (urgency === 'low') urgency = 'medium'
      else if (urgency === 'medium') urgency = 'high'
      reason = 'ai.reorderTrendUp'
    }

    suggestions.push({
      productId: product.id,
      productName: product.name,
      category: product.category,
      currentStock: product.stock,
      minStock,
      avgDailyDemand: avgDaily,
      leadTimeDays: leadTime,
      safetyStock,
      reorderPoint,
      suggestedQty,
      urgency,
      daysUntilStockout,
      estimatedCost: product.cost ? +(product.cost * suggestedQty).toFixed(2) : null,
      trend: forecast?.trend || 'stable',
      reason,
    })
  }

  // Sort by urgency then by days until stockout
  const urgencyOrder: Record<ReorderUrgency, number> = { critical: 0, high: 1, medium: 2, low: 3, ok: 4 }
  suggestions.sort((a, b) => {
    const urgDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    if (urgDiff !== 0) return urgDiff
    return (a.daysUntilStockout ?? 9999) - (b.daysUntilStockout ?? 9999)
  })

  return {
    totalSuggestions: suggestions.length,
    criticalCount: suggestions.filter(s => s.urgency === 'critical').length,
    highCount: suggestions.filter(s => s.urgency === 'high').length,
    mediumCount: suggestions.filter(s => s.urgency === 'medium').length,
    lowCount: suggestions.filter(s => s.urgency === 'low').length,
    totalEstimatedCost: suggestions.reduce((s, r) => s + (r.estimatedCost || 0), 0),
    suggestions,
  }
}

/** Format urgency for display */
export function getUrgencyColor(urgency: ReorderUrgency): string {
  switch (urgency) {
    case 'critical': return '#dc2626'
    case 'high': return '#ea580c'
    case 'medium': return '#f59e0b'
    case 'low': return '#3b82f6'
    case 'ok': return '#16a34a'
  }
}

export function getUrgencyLabel(urgency: ReorderUrgency): string {
  switch (urgency) {
    case 'critical': return 'Critical'
    case 'high': return 'High'
    case 'medium': return 'Medium'
    case 'low': return 'Low'
    case 'ok': return 'OK'
  }
}
