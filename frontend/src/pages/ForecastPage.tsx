import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  Package,
  Clock,
  BarChart3,
  AlertTriangle,
  Activity,
  Minus,
  Brain,
  CalendarDays,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useProductStore } from '../stores/productStore'
import { useOrderStore } from '../stores/orderStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { db } from '../db/dexie'
import type { Order, Product } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────
const C = {
  primary: '#6366f1',
  primaryLight: '#eef2ff',
  primaryDark: '#4f46e5',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#2563eb',
  infoBg: '#eff6ff',
  accent: '#8b5cf6',
  accentBg: '#f5f3ff',
} as const

// ── Day labels ────────────────────────────────────────────────────────────
const DAY_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Types ─────────────────────────────────────────────────────────────────
interface DailyRevenue {
  date: string
  revenue: number
  orderCount: number
}

interface StockDepletion {
  productId: string
  productName: string
  category: string
  currentStock: number
  avgDailySales: number
  daysUntilStockout: number | null
  confidence: 'high' | 'medium' | 'low'
}

interface PeakPeriod {
  dayOfWeek: number
  hour: number
  orderCount: number
  revenue: number
}

// ── Helper: date string ──────────────────────────────────────────────────
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ── Compute forecasts ────────────────────────────────────────────────────
function computeDailyRevenues(orders: Order[], days: number): DailyRevenue[] {
  const now = new Date()
  const result: DailyRevenue[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const ds = dateStr(d)
    const dayOrders = orders.filter(
      o => o.created_at.slice(0, 10) === ds && o.status === 'paid'
    )
    result.push({
      date: ds,
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orderCount: dayOrders.length,
    })
  }
  return result
}

function computeDayOfWeekWeights(dailyRevenues: DailyRevenue[]): number[] {
  const sums = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const dr of dailyRevenues) {
    const dow = new Date(dr.date + 'T12:00:00').getDay()
    sums[dow] += dr.revenue
    counts[dow]++
  }
  const avgs = sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : 0))
  const overallAvg = avgs.reduce((a, b) => a + b, 0) / 7
  if (overallAvg === 0) return [1, 1, 1, 1, 1, 1, 1]
  return avgs.map(a => +(a / overallAvg).toFixed(3))
}

function forecastRevenue(
  dailyRevenues: DailyRevenue[],
  dayWeights: number[],
  futureDays: number
): { date: string; predicted: number }[] {
  const recentRevenues = dailyRevenues.slice(-30).map(d => d.revenue)
  const avg = recentRevenues.length > 0
    ? recentRevenues.reduce((a, b) => a + b, 0) / recentRevenues.length
    : 0

  const now = new Date()
  const result: { date: string; predicted: number }[] = []
  for (let i = 1; i <= futureDays; i++) {
    const futureDate = new Date(now.getTime() + i * 86400000)
    const dow = futureDate.getDay()
    result.push({
      date: dateStr(futureDate),
      predicted: Math.max(0, +(avg * dayWeights[dow]).toFixed(0)),
    })
  }
  return result
}

function computeStockDepletion(
  orders: Order[],
  products: Product[]
): StockDepletion[] {
  const now = new Date()
  const cutoff30 = new Date(now.getTime() - 30 * 86400000)
  const cutoffStr = dateStr(cutoff30)

  // Aggregate daily sales per product over last 30 days
  const productSales = new Map<string, number>()
  let salesDays = 0

  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'refunded') continue
    if (order.created_at.slice(0, 10) < cutoffStr) continue
    for (const item of order.items) {
      productSales.set(
        item.product_id,
        (productSales.get(item.product_id) || 0) + item.qty
      )
    }
  }

  // Count distinct days with data in the 30-day window
  const daysWithData = new Set<string>()
  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'refunded') continue
    const d = order.created_at.slice(0, 10)
    if (d >= cutoffStr) daysWithData.add(d)
  }
  salesDays = Math.max(daysWithData.size, 1)

  const result: StockDepletion[] = []
  for (const product of products) {
    const totalSold = productSales.get(product.id) || 0
    const avgDaily = totalSold / salesDays
    let daysUntilStockout: number | null = null
    if (avgDaily > 0) {
      daysUntilStockout = Math.floor(product.stock / avgDaily)
      if (daysUntilStockout > 365) daysUntilStockout = null
    }

    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (salesDays >= 20) confidence = 'high'
    else if (salesDays >= 10) confidence = 'medium'

    result.push({
      productId: product.id,
      productName: product.name,
      category: product.category || '-',
      currentStock: product.stock,
      avgDailySales: +avgDaily.toFixed(2),
      daysUntilStockout,
      confidence,
    })
  }

  // Sort: lowest daysUntilStockout first
  result.sort((a, b) => {
    const aD = a.daysUntilStockout ?? 9999
    const bD = b.daysUntilStockout ?? 9999
    return aD - bD
  })

  return result
}

function computePeakAnalysis(orders: Order[]): PeakPeriod[] {
  const grid = new Map<string, { count: number; revenue: number }>()

  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'refunded') continue
    const d = new Date(order.created_at)
    const dow = d.getDay()
    const hour = d.getHours()
    const key = `${dow}-${hour}`
    const existing = grid.get(key) || { count: 0, revenue: 0 }
    existing.count++
    existing.revenue += order.total
    grid.set(key, existing)
  }

  const result: PeakPeriod[] = []
  for (const [key, data] of grid) {
    const [dow, hour] = key.split('-').map(Number)
    result.push({
      dayOfWeek: dow,
      hour,
      orderCount: data.count,
      revenue: data.revenue,
    })
  }

  return result
}

function compute7dMovingAverage(dailyRevenues: DailyRevenue[]): number[] {
  const result: number[] = []
  for (let i = 0; i < dailyRevenues.length; i++) {
    const start = Math.max(0, i - 6)
    const window = dailyRevenues.slice(start, i + 1)
    const avg = window.reduce((s, d) => s + d.revenue, 0) / window.length
    result.push(+avg.toFixed(0))
  }
  return result
}

// ── SVG Bar Chart ────────────────────────────────────────────────────────
function BarChartSVG({
  data,
  width,
  height,
  barColor = C.primary,
  currency,
}: {
  data: { label: string; value: number }[]
  width: number
  height: number
  barColor?: string
  currency: string
}) {
  if (data.length === 0) return null
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const barWidth = Math.max(8, Math.min(30, (width - 60) / data.length - 4))
  const chartHeight = height - 40
  const chartLeft = 50
  const chartWidth = width - chartLeft - 10

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = 10 + chartHeight * (1 - pct)
        const val = Math.round(maxVal * pct)
        return (
          <g key={pct}>
            <line x1={chartLeft} y1={y} x2={chartLeft + chartWidth} y2={y} stroke={C.border} strokeDasharray="3,3" />
            <text x={chartLeft - 5} y={y + 4} textAnchor="end" fontSize={9} fill={C.textMuted}>
              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
            </text>
          </g>
        )
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartHeight
        const x = chartLeft + (chartWidth / data.length) * i + (chartWidth / data.length - barWidth) / 2
        const y = 10 + chartHeight - barH
        return (
          <g key={i}>
            <rect
              x={x} y={y}
              width={barWidth} height={barH}
              rx={3} fill={barColor}
              opacity={0.85}
            >
              <title>{`${d.label}: ${formatCurrency(d.value, currency)}`}</title>
            </rect>
            {data.length <= 14 && (
              <text
                x={x + barWidth / 2}
                y={height - 5}
                textAnchor="middle"
                fontSize={8}
                fill={C.textMuted}
              >
                {d.label.slice(-5)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── SVG Line Chart ───────────────────────────────────────────────────────
function LineChartSVG({
  dailyData,
  movingAvg,
  width,
  height,
  currency: _currency,
  labels,
}: {
  dailyData: number[]
  movingAvg: number[]
  width: number
  height: number
  currency: string
  labels: { daily: string; movingAverage: string }
}) {
  if (dailyData.length === 0) return null
  const allVals = [...dailyData, ...movingAvg]
  const maxVal = Math.max(...allVals, 1)
  const chartLeft = 50
  const chartWidth = width - chartLeft - 20
  const chartHeight = height - 50
  const chartTop = 15

  const toX = (i: number) => chartLeft + (i / Math.max(dailyData.length - 1, 1)) * chartWidth
  const toY = (v: number) => chartTop + chartHeight - (v / maxVal) * chartHeight

  const dailyPath = dailyData.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ')
  const maPath = movingAvg.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = chartTop + chartHeight * (1 - pct)
        const val = Math.round(maxVal * pct)
        return (
          <g key={pct}>
            <line x1={chartLeft} y1={y} x2={chartLeft + chartWidth} y2={y} stroke={C.border} strokeDasharray="3,3" />
            <text x={chartLeft - 5} y={y + 4} textAnchor="end" fontSize={9} fill={C.textMuted}>
              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
            </text>
          </g>
        )
      })}
      {/* Daily revenue line */}
      <path d={dailyPath} fill="none" stroke={C.primary} strokeWidth={1.5} opacity={0.4} />
      {/* Moving average line */}
      <path d={maPath} fill="none" stroke={C.danger} strokeWidth={2.5} />
      {/* Legend */}
      <rect x={chartLeft + 10} y={height - 20} width={12} height={3} fill={C.primary} opacity={0.4} rx={1} />
      <text x={chartLeft + 26} y={height - 15} fontSize={9} fill={C.textSecondary}>{labels.daily}</text>
      <rect x={chartLeft + 100} y={height - 20} width={12} height={3} fill={C.danger} rx={1} />
      <text x={chartLeft + 116} y={height - 15} fontSize={9} fill={C.textSecondary}>{labels.movingAverage}</text>
    </svg>
  )
}

// ── Heatmap Grid ─────────────────────────────────────────────────────────
function HeatmapGrid({
  peakData,
  dayLabels,
  lowLabel,
  highLabel,
}: {
  peakData: PeakPeriod[]
  dayLabels: string[]
  lowLabel: string
  highLabel: string
}) {
  // Hours 8am to 8pm (12 columns)
  const hours = Array.from({ length: 12 }, (_, i) => i + 8)
  const maxCount = Math.max(...peakData.map(p => p.orderCount), 1)

  const getCount = (dow: number, hour: number): number => {
    const found = peakData.find(p => p.dayOfWeek === dow && p.hour === hour)
    return found?.orderCount || 0
  }

  const getColor = (count: number): string => {
    if (count === 0) return '#f8fafc'
    const intensity = Math.min(count / maxCount, 1)
    // Gradient from light purple to deep purple
    const r = Math.round(238 - intensity * 139)
    const g = Math.round(242 - intensity * 179)
    const b = Math.round(255 - intensity * 36)
    return `rgb(${r},${g},${b})`
  }

  const cellSize = 36
  const labelWidth = 40
  const svgWidth = labelWidth + hours.length * cellSize + 10
  const svgHeight = 30 + 7 * cellSize + 30

  return (
    <svg width={svgWidth} height={svgHeight} style={{ display: 'block', maxWidth: '100%' }}>
      {/* Hour labels */}
      {hours.map((h, i) => (
        <text
          key={h}
          x={labelWidth + i * cellSize + cellSize / 2}
          y={16}
          textAnchor="middle"
          fontSize={9}
          fill={C.textMuted}
        >
          {`${h}h`}
        </text>
      ))}
      {/* Day rows */}
      {Array.from({ length: 7 }, (_, dow) => (
        <g key={dow}>
          <text
            x={labelWidth - 6}
            y={30 + dow * cellSize + cellSize / 2 + 3}
            textAnchor="end"
            fontSize={9}
            fill={C.textSecondary}
          >
            {dayLabels[dow]}
          </text>
          {hours.map((h, hi) => {
            const count = getCount(dow, h)
            return (
              <g key={h}>
                <rect
                  x={labelWidth + hi * cellSize + 1}
                  y={30 + dow * cellSize + 1}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  rx={4}
                  fill={getColor(count)}
                  stroke={C.border}
                  strokeWidth={0.5}
                >
                  <title>{`${dayLabels[dow]} ${h}h: ${count} orders`}</title>
                </rect>
                {count > 0 && (
                  <text
                    x={labelWidth + hi * cellSize + cellSize / 2}
                    y={30 + dow * cellSize + cellSize / 2 + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fill={count / maxCount > 0.5 ? '#fff' : C.textSecondary}
                    fontWeight={count / maxCount > 0.7 ? 600 : 400}
                  >
                    {count}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      ))}
      {/* Legend */}
      <text x={labelWidth} y={svgHeight - 5} fontSize={9} fill={C.textMuted}>{lowLabel}</text>
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <rect
          key={pct}
          x={labelWidth + 40 + i * 18}
          y={svgHeight - 16}
          width={16}
          height={10}
          rx={2}
          fill={getColor(maxCount * pct)}
          stroke={C.border}
          strokeWidth={0.5}
        />
      ))}
      <text x={labelWidth + 135} y={svgHeight - 5} fontSize={9} fill={C.textMuted}>{highLabel}</text>
    </svg>
  )
}

// ── Main Page Component ──────────────────────────────────────────────────
export default function ForecastPage() {
  const { t } = useLanguageStore()
  const lang = useLanguageStore(s => s.language)
  const { currentStore } = useAppStore()
  const { products } = useProductStore()
  useOrderStore()
  const { isMobile } = useResponsive()

  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [forecastDays, setForecastDays] = useState<7 | 30>(7)

  const currencyCode = currentStore?.currency || 'XAF'
  const dayLabels = lang === 'fr' ? DAY_LABELS_FR : DAY_LABELS_EN
  const ft = (t as any).forecast || {} as any

  // Load all orders from IndexedDB for the store (last 90 days)
  useEffect(() => {
    if (!currentStore?.id) return
    setLoading(true)
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString()
    db.orders
      .where('store_id')
      .equals(currentStore.id)
      .and(o => o.created_at >= cutoff)
      .toArray()
      .then(setAllOrders)
      .catch(err => console.error('[ForecastPage] Error loading orders:', err))
      .finally(() => setLoading(false))
  }, [currentStore?.id])

  // Compute all forecasts
  const dailyRevenues = useMemo(
    () => computeDailyRevenues(allOrders, 30),
    [allOrders]
  )

  const dayWeights = useMemo(
    () => computeDayOfWeekWeights(dailyRevenues),
    [dailyRevenues]
  )

  const salesForecast = useMemo(
    () => forecastRevenue(dailyRevenues, dayWeights, forecastDays),
    [dailyRevenues, dayWeights, forecastDays]
  )

  const stockDepletion = useMemo(
    () => computeStockDepletion(allOrders, products),
    [allOrders, products]
  )

  const peakAnalysis = useMemo(
    () => computePeakAnalysis(allOrders),
    [allOrders]
  )

  const movingAvg = useMemo(
    () => compute7dMovingAverage(dailyRevenues),
    [dailyRevenues]
  )

  const topPeaks = useMemo(() => {
    return [...peakAnalysis]
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)
  }, [peakAnalysis])

  const totalPredicted = salesForecast.reduce((s, f) => s + f.predicted, 0)
  const atRiskProducts = stockDepletion.filter(
    s => s.daysUntilStockout !== null && s.daysUntilStockout <= 14
  ).length

  const hasData = allOrders.length > 0

  // Chart width based on container
  const chartWidth = isMobile ? 340 : 600

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: C.textMuted }}>
        {(t as any).common?.loading || 'Loading...'}
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? 12 : 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>
            {ft.title || 'Forecast & AI Predictions'}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: C.textSecondary }}>
            {currentStore?.name || ''}
          </p>
        </div>
      </div>

      {!hasData && (
        <div style={{
          padding: 40, textAlign: 'center',
          background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
        }}>
          <AlertTriangle size={40} color={C.warning} style={{ marginBottom: 12 }} />
          <p style={{ color: C.textSecondary, fontSize: 15 }}>
            {ft.noData || 'Not enough data to generate forecasts.'}
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* Summary cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: 12, marginBottom: 24,
          }}>
            {[
              {
                icon: <TrendingUp size={20} color={C.primary} />,
                label: ft.predictedRevenue || 'Predicted Revenue',
                value: formatCurrency(totalPredicted, currencyCode),
                sub: forecastDays === 7
                  ? (ft.next7days || 'Next 7 Days')
                  : (ft.next30days || 'Next 30 Days'),
                bg: C.primaryLight,
              },
              {
                icon: <BarChart3 size={20} color={C.success} />,
                label: ft.avgDailySales || 'Avg Daily Sales',
                value: formatCurrency(
                  dailyRevenues.length > 0
                    ? dailyRevenues.reduce((s, d) => s + d.revenue, 0) / dailyRevenues.length
                    : 0,
                  currencyCode
                ),
                sub: ft.trend || 'Trend',
                bg: C.successBg,
              },
              {
                icon: <AlertTriangle size={20} color={C.danger} />,
                label: ft.stockForecast || 'Stock Forecast',
                value: `${atRiskProducts}`,
                sub: `${ft.daysUntilStockout || 'Days until stockout'} < 14d`,
                bg: C.dangerBg,
              },
              {
                icon: <Clock size={20} color={C.accent} />,
                label: ft.peakHours || 'Peak Hours',
                value: topPeaks.length > 0
                  ? `${dayLabels[topPeaks[0].dayOfWeek]} ${topPeaks[0].hour}h`
                  : '-',
                sub: topPeaks.length > 0
                  ? `${topPeaks[0].orderCount} ${ft.orderCount || 'orders'}`
                  : '',
                bg: C.accentBg,
              },
            ].map((card, i) => (
              <div key={i} style={{
                background: C.card, borderRadius: 12, padding: 16,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: card.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  {card.icon}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{card.value}</div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Sales Forecast */}
          <div style={{
            background: C.card, borderRadius: 12, padding: isMobile ? 12 : 20,
            border: `1px solid ${C.border}`, marginBottom: 20,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16, flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color={C.primary} />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.text }}>
                  {ft.salesForecast || 'Sales Forecast'}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {([7, 30] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setForecastDays(d)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                      border: `1px solid ${forecastDays === d ? C.primary : C.border}`,
                      background: forecastDays === d ? C.primaryLight : '#fff',
                      color: forecastDays === d ? C.primary : C.textSecondary,
                      cursor: 'pointer',
                    }}
                  >
                    {d === 7 ? (ft.next7days || '7 Days') : (ft.next30days || '30 Days')}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <BarChartSVG
                data={salesForecast.map(f => ({
                  label: f.date,
                  value: f.predicted,
                }))}
                width={forecastDays === 30 ? Math.max(chartWidth, 800) : chartWidth}
                height={220}
                barColor={C.primary}
                currency={currencyCode}
              />
            </div>
            <div style={{
              marginTop: 10, fontSize: 12, color: C.textMuted, textAlign: 'center',
            }}>
              {ft.predictedRevenue || 'Predicted Revenue'}: {formatCurrency(totalPredicted, currencyCode)}
            </div>
          </div>

          {/* Revenue Trend with Moving Average */}
          <div style={{
            background: C.card, borderRadius: 12, padding: isMobile ? 12 : 20,
            border: `1px solid ${C.border}`, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Activity size={18} color={C.danger} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.text }}>
                {ft.trend || 'Trend'} - {ft.movingAverage || 'Moving Average (7d)'}
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <LineChartSVG
                dailyData={dailyRevenues.map(d => d.revenue)}
                movingAvg={movingAvg}
                width={chartWidth}
                height={220}
                currency={currencyCode}
                labels={{
                  daily: ft.daily || 'Daily',
                  movingAverage: ft.movingAverage || 'Moving Avg (7d)',
                }}
              />
            </div>
          </div>

          {/* Peak Hours Heatmap */}
          <div style={{
            background: C.card, borderRadius: 12, padding: isMobile ? 12 : 20,
            border: `1px solid ${C.border}`, marginBottom: 20,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            }}>
              <CalendarDays size={18} color={C.accent} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.text }}>
                {ft.peakHours || 'Peak Hours'}
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <HeatmapGrid
                peakData={peakAnalysis}
                dayLabels={dayLabels}
                lowLabel={ft.heatmapLow || 'Low'}
                highLabel={ft.heatmapHigh || 'High'}
              />
            </div>
            {/* Top 5 peaks table */}
            {topPeaks.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ textAlign: 'left', padding: '8px 6px', color: C.textMuted, fontWeight: 500 }}>#</th>
                      <th style={{ textAlign: 'left', padding: '8px 6px', color: C.textMuted, fontWeight: 500 }}>
                        {ft.peakDay || 'Day'}
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px 6px', color: C.textMuted, fontWeight: 500 }}>
                        {ft.peakHour || 'Hour'}
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 6px', color: C.textMuted, fontWeight: 500 }}>
                        {ft.orderCount || 'Orders'}
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px 6px', color: C.textMuted, fontWeight: 500 }}>
                        {ft.revenue || 'Revenue'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPeaks.map((p, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '8px 6px', color: C.textSecondary }}>{i + 1}</td>
                        <td style={{ padding: '8px 6px', color: C.text, fontWeight: 500 }}>
                          {dayLabels[p.dayOfWeek]}
                        </td>
                        <td style={{ padding: '8px 6px', color: C.text }}>{`${p.hour}:00 - ${p.hour + 1}:00`}</td>
                        <td style={{ padding: '8px 6px', color: C.text, textAlign: 'right', fontWeight: 600 }}>
                          {p.orderCount}
                        </td>
                        <td style={{ padding: '8px 6px', color: C.success, textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(p.revenue, currencyCode)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stock Depletion Forecast */}
          <div style={{
            background: C.card, borderRadius: 12, padding: isMobile ? 12 : 20,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            }}>
              <Package size={18} color={C.warning} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.text }}>
                {ft.stockForecast || 'Stock Forecast'}
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px', color: C.textMuted, fontWeight: 500 }}>
                      {ft.product || 'Product'}
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 6px', color: C.textMuted, fontWeight: 500 }}>
                      {ft.currentStock || 'Stock'}
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 6px', color: C.textMuted, fontWeight: 500 }}>
                      {ft.avgDailySales || 'Avg/Day'}
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 6px', color: C.textMuted, fontWeight: 500 }}>
                      {ft.daysUntilStockout || 'Days Until Stockout'}
                    </th>
                    <th style={{ textAlign: 'center', padding: '8px 6px', color: C.textMuted, fontWeight: 500 }}>
                      {ft.confidence || 'Confidence'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stockDepletion.slice(0, 20).map(item => {
                    const isUrgent = item.daysUntilStockout !== null && item.daysUntilStockout <= 7
                    const isWarning = item.daysUntilStockout !== null && item.daysUntilStockout <= 14
                    const daysColor = isUrgent ? C.danger : isWarning ? C.warning : C.success
                    const confidenceColor = item.confidence === 'high'
                      ? C.success
                      : item.confidence === 'medium'
                        ? C.warning
                        : C.textMuted

                    return (
                      <tr key={item.productId} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '10px 6px' }}>
                          <div style={{ fontWeight: 500, color: C.text }}>{item.productName}</div>
                          <div style={{ fontSize: 11, color: C.textMuted }}>{item.category}</div>
                        </td>
                        <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 500, color: C.text }}>
                          {item.currentStock}
                        </td>
                        <td style={{ padding: '10px 6px', textAlign: 'right', color: C.textSecondary }}>
                          {item.avgDailySales}
                        </td>
                        <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                          {item.daysUntilStockout !== null ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 6,
                              background: isUrgent ? C.dangerBg : isWarning ? C.warningBg : C.successBg,
                              color: daysColor, fontWeight: 600, fontSize: 12,
                            }}>
                              {isUrgent && <AlertTriangle size={12} />}
                              {item.daysUntilStockout}d
                            </span>
                          ) : (
                            <span style={{ color: C.textMuted }}>
                              <Minus size={14} />
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 500, color: confidenceColor,
                            textTransform: 'capitalize',
                          }}>
                            {item.confidence === 'high' ? (lang === 'fr' ? 'Haute' : 'High')
                              : item.confidence === 'medium' ? (lang === 'fr' ? 'Moyenne' : 'Medium')
                              : (lang === 'fr' ? 'Faible' : 'Low')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {stockDepletion.length > 20 && (
              <div style={{
                marginTop: 10, fontSize: 12, color: C.textMuted, textAlign: 'center',
              }}>
                +{stockDepletion.length - 20} {(t as any).common?.articles || 'more'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
