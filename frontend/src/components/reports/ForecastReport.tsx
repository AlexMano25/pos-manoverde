/**
 * ForecastReport — Demand forecasting & anomaly detection report tab
 * Used inside ReportsPage as the "AI" tab
 */
import { useMemo, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Brain,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import { forecastDemand, getTopMovers, getTrendLeaders } from '../../utils/demandForecast'
import { computeReorderSuggestions as computeSmartReorder, getUrgencyColor } from '../../utils/smartReorder'
import { detectAnomalies } from '../../utils/anomalyDetection'
import MiniBarChart from '../charts/MiniBarChart'
import SparkLine from '../charts/SparkLine'
import type { Order, Product } from '../../types'
import { useResponsive } from '../../hooks/useLayoutMode'

const C = {
  primary: '#2563eb',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  purple: '#7c3aed',
  teal: '#0d9488',
}

interface Props {
  orders: Order[]
  products: Product[]
  currencyCode: string
  labels: Record<string, string>
}

export default function ForecastReport({ orders, products, currencyCode, labels }: Props) {
  const { isMobile, rv } = useResponsive()
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [anomalyExpanded, setAnomalyExpanded] = useState(false)

  // ── Compute forecasts ─────────────────────────────────────────
  const forecastSummary = useMemo(
    () => forecastDemand(orders, products, { lookbackDays: 60, wmaWindow: 14 }),
    [orders, products]
  )

  const topMovers = useMemo(
    () => getTopMovers(forecastSummary.forecasts, 5),
    [forecastSummary.forecasts]
  )

  const trendUp = useMemo(
    () => getTrendLeaders(forecastSummary.forecasts, 'increasing', 5),
    [forecastSummary.forecasts]
  )

  const trendDown = useMemo(
    () => getTrendLeaders(forecastSummary.forecasts, 'decreasing', 5),
    [forecastSummary.forecasts]
  )

  // ── Smart reorder ─────────────────────────────────────────────
  const reorderData = useMemo(
    () => computeSmartReorder(products, forecastSummary.forecasts),
    [products, forecastSummary.forecasts]
  )

  // ── Anomaly detection ─────────────────────────────────────────
  const anomalyData = useMemo(
    () => detectAnomalies(orders),
    [orders]
  )

  // ── Styles ────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: rv(16, 20, 24),
    marginBottom: 16,
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: C.text,
    margin: '0 0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const statBox: React.CSSProperties = {
    padding: rv(12, 16, 16),
    borderRadius: 10,
    textAlign: 'center' as const,
    flex: 1,
    minWidth: rv(100, 120, 140),
  }

  const trendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp size={14} color={C.success} />
    if (trend === 'decreasing') return <TrendingDown size={14} color={C.danger} />
    return <Minus size={14} color={C.textSecondary} />
  }

  const trendColor = (trend: string) => {
    if (trend === 'increasing') return C.success
    if (trend === 'decreasing') return C.danger
    return C.textSecondary
  }

  const dayLabels = labels.sun
    ? [labels.sun, labels.mon, labels.tue, labels.wed, labels.thu, labels.fri, labels.sat]
    : ['D', 'L', 'M', 'M', 'J', 'V', 'S']

  if (forecastSummary.forecastedProducts === 0 && anomalyData.totalAnomalies === 0) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Brain size={48} color={C.textSecondary} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ color: C.textSecondary, fontSize: 15, margin: 0 }}>
            {labels.noForecastData || 'Not enough sales data for AI analysis. Continue recording sales to unlock forecasts.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Summary Stats ─────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: rv(10, 12, 16),
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ ...statBox, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
          <div style={{ fontSize: rv(20, 24, 28), fontWeight: 800, color: C.primary }}>
            {forecastSummary.forecastedProducts}
          </div>
          <div style={{ fontSize: 12, color: C.primary, fontWeight: 500, marginTop: 2 }}>
            {labels.forecastedProducts || 'Products Forecasted'}
          </div>
        </div>
        <div style={{ ...statBox, background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
          <div style={{ fontSize: rv(20, 24, 28), fontWeight: 800, color: '#b45309' }}>
            {forecastSummary.atRiskProducts}
          </div>
          <div style={{ fontSize: 12, color: '#b45309', fontWeight: 500, marginTop: 2 }}>
            {labels.atRiskStockout || 'At Risk (14d)'}
          </div>
        </div>
        <div style={{ ...statBox, background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)' }}>
          <div style={{ fontSize: rv(20, 24, 28), fontWeight: 800, color: C.success }}>
            {forecastSummary.trendingUp}
          </div>
          <div style={{ fontSize: 12, color: C.success, fontWeight: 500, marginTop: 2 }}>
            {labels.trendingUp || 'Trending Up'}
          </div>
        </div>
        <div style={{ ...statBox, background: 'linear-gradient(135deg, #fef2f2, #fecaca)' }}>
          <div style={{ fontSize: rv(20, 24, 28), fontWeight: 800, color: C.danger }}>
            {anomalyData.totalAnomalies}
          </div>
          <div style={{ fontSize: 12, color: C.danger, fontWeight: 500, marginTop: 2 }}>
            {labels.anomaliesDetected || 'Anomalies'}
          </div>
        </div>
      </div>

      {/* ── Top Movers ────────────────────────────────────────── */}
      {topMovers.length > 0 && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>
            <TrendingUp size={18} color={C.primary} />
            {labels.topMovers || 'Top Movers (Daily Demand)'}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: C.textSecondary, fontWeight: 600 }}>{labels.product || 'Product'}</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', color: C.textSecondary, fontWeight: 600 }}>{labels.avgDaily || 'Avg/Day'}</th>
                  <th style={{ textAlign: 'center', padding: '8px 10px', color: C.textSecondary, fontWeight: 600 }}>{labels.trend || 'Trend'}</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', color: C.textSecondary, fontWeight: 600 }}>{labels.forecast7d || '7d Forecast'}</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', color: C.textSecondary, fontWeight: 600 }}>{labels.stockDays || 'Stock Days'}</th>
                  {!isMobile && (
                    <th style={{ textAlign: 'center', padding: '8px 10px', color: C.textSecondary, fontWeight: 600 }}>{labels.sparkline || 'Forecast'}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {topMovers.map((f) => (
                  <tr
                    key={f.productId}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      cursor: 'pointer',
                      backgroundColor: expandedProduct === f.productId ? '#f8fafc' : undefined,
                    }}
                    onClick={() => setExpandedProduct(expandedProduct === f.productId ? null : f.productId)}
                  >
                    <td style={{ padding: '10px', fontWeight: 500, color: C.text }}>
                      <div>{f.productName}</div>
                      <div style={{ fontSize: 11, color: C.textSecondary }}>{f.category}</div>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                      {f.avgDailyDemand.toFixed(1)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: trendColor(f.trend) }}>
                        {trendIcon(f.trend)}
                        {f.trendPct > 0 ? '+' : ''}{f.trendPct}%
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                      {f.forecastTotal7.toFixed(0)} {labels.units || 'u.'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: f.daysUntilStockout !== null && f.daysUntilStockout <= 7
                          ? '#fef2f2'
                          : f.daysUntilStockout !== null && f.daysUntilStockout <= 14
                            ? '#fffbeb'
                            : '#f0fdf4',
                        color: f.daysUntilStockout !== null && f.daysUntilStockout <= 7
                          ? C.danger
                          : f.daysUntilStockout !== null && f.daysUntilStockout <= 14
                            ? '#b45309'
                            : C.success,
                      }}>
                        {f.daysUntilStockout !== null ? `${f.daysUntilStockout}d` : '∞'}
                      </span>
                    </td>
                    {!isMobile && (
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <SparkLine values={f.forecastNext7} width={80} height={24} color={C.primary} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Demand Trends ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'), gap: 16, marginBottom: 16 }}>
        {/* Trending Up */}
        {trendUp.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ ...sectionTitle, marginBottom: 12 }}>
              <TrendingUp size={16} color={C.success} />
              {labels.demandIncreasing || 'Demand Increasing'}
            </h3>
            {trendUp.map((f) => (
              <div key={f.productId} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{f.productName}</div>
                  <div style={{ fontSize: 11, color: C.textSecondary }}>{f.avgDailyDemand.toFixed(1)}/day</div>
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.success,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <TrendingUp size={14} />
                  +{f.trendPct}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Trending Down */}
        {trendDown.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ ...sectionTitle, marginBottom: 12 }}>
              <TrendingDown size={16} color={C.danger} />
              {labels.demandDecreasing || 'Demand Decreasing'}
            </h3>
            {trendDown.map((f) => (
              <div key={f.productId} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{f.productName}</div>
                  <div style={{ fontSize: 11, color: C.textSecondary }}>{f.avgDailyDemand.toFixed(1)}/day</div>
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.danger,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <TrendingDown size={14} />
                  {f.trendPct}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Smart Reorder Suggestions ─────────────────────────── */}
      {reorderData.totalSuggestions > 0 && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>
            <ArrowRight size={18} color={C.warning} />
            {labels.reorderSuggestions || 'Smart Reorder Suggestions'}
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#fef3c7',
              color: '#b45309',
              padding: '2px 8px',
              borderRadius: 10,
              marginLeft: 'auto',
            }}>
              {reorderData.totalSuggestions}
            </span>
          </h3>

          {/* Urgency pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {reorderData.criticalCount > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 8, backgroundColor: '#fef2f2', color: C.danger }}>
                {reorderData.criticalCount} {labels.critical || 'Critical'}
              </span>
            )}
            {reorderData.highCount > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 8, backgroundColor: '#fff7ed', color: '#ea580c' }}>
                {reorderData.highCount} {labels.high || 'High'}
              </span>
            )}
            {reorderData.mediumCount > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 8, backgroundColor: '#fffbeb', color: '#b45309' }}>
                {reorderData.mediumCount} {labels.medium || 'Medium'}
              </span>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: C.textSecondary, fontWeight: 600 }}>{labels.product || 'Product'}</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: C.textSecondary, fontWeight: 600 }}>{labels.stock || 'Stock'}</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: C.textSecondary, fontWeight: 600 }}>{labels.reorderQty || 'Order Qty'}</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: C.textSecondary, fontWeight: 600 }}>{labels.estimatedCost || 'Est. Cost'}</th>
                  <th style={{ textAlign: 'center', padding: '8px', color: C.textSecondary, fontWeight: 600 }}>{labels.urgency || 'Urgency'}</th>
                </tr>
              </thead>
              <tbody>
                {reorderData.suggestions.slice(0, 10).map((s) => (
                  <tr key={s.productId} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontWeight: 500, color: C.text }}>{s.productName}</div>
                      <div style={{ fontSize: 11, color: C.textSecondary }}>
                        {s.avgDailyDemand.toFixed(1)}/day · {s.daysUntilStockout !== null ? `${s.daysUntilStockout}d` : '∞'} {labels.remaining || 'left'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>{s.currentStock}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: C.primary }}>{s.suggestedQty}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      {s.estimatedCost !== null ? formatCurrency(s.estimatedCost, currencyCode) : '—'}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        color: '#fff',
                        backgroundColor: getUrgencyColor(s.urgency),
                      }}>
                        {(labels as Record<string, string>)[s.urgency] || s.urgency}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reorderData.totalEstimatedCost > 0 && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
            }}>
              <span style={{ color: C.textSecondary, fontWeight: 500 }}>
                {labels.totalEstimatedCost || 'Total Estimated Cost'}
              </span>
              <span style={{ fontWeight: 700, color: C.text }}>
                {formatCurrency(reorderData.totalEstimatedCost, currencyCode)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Anomaly Detection ─────────────────────────────────── */}
      {anomalyData.totalAnomalies > 0 && (
        <div style={cardStyle}>
          <h3 style={{ ...sectionTitle, cursor: 'pointer' }} onClick={() => setAnomalyExpanded(!anomalyExpanded)}>
            <ShieldAlert size={18} color={C.danger} />
            {labels.anomalyDetection || 'Anomaly Detection'}
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: anomalyData.highSeverity > 0 ? '#fef2f2' : '#fffbeb',
              color: anomalyData.highSeverity > 0 ? C.danger : '#b45309',
              padding: '2px 8px',
              borderRadius: 10,
            }}>
              {labels.riskScore || 'Risk'}: {anomalyData.riskScore}/100
            </span>
            <span style={{ marginLeft: 'auto' }}>
              {anomalyExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </h3>

          {/* Summary bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: anomalyExpanded ? 12 : 0, flexWrap: 'wrap' }}>
            {anomalyData.highSeverity > 0 && (
              <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: C.danger }}>
                <AlertTriangle size={12} /> {anomalyData.highSeverity} {labels.highSeverity || 'high'}
              </span>
            )}
            {anomalyData.mediumSeverity > 0 && (
              <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#b45309' }}>
                <AlertTriangle size={12} /> {anomalyData.mediumSeverity} {labels.mediumSeverity || 'medium'}
              </span>
            )}
            {anomalyData.lowSeverity > 0 && (
              <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: C.textSecondary }}>
                <AlertTriangle size={12} /> {anomalyData.lowSeverity} {labels.lowSeverity || 'low'}
              </span>
            )}
            <span style={{ fontSize: 12, color: C.textSecondary }}>
              {labels.anomalyRate || 'Rate'}: {anomalyData.stats.anomalyRate}%
            </span>
          </div>

          {anomalyExpanded && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: C.textSecondary, fontWeight: 600 }}>{labels.type || 'Type'}</th>
                    <th style={{ textAlign: 'right', padding: '8px', color: C.textSecondary, fontWeight: 600 }}>{labels.amount || 'Amount'}</th>
                    <th style={{ textAlign: 'center', padding: '8px', color: C.textSecondary, fontWeight: 600 }}>{labels.severity || 'Severity'}</th>
                    <th style={{ textAlign: 'right', padding: '8px', color: C.textSecondary, fontWeight: 600 }}>{labels.score || 'Score'}</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: C.textSecondary, fontWeight: 600 }}>{labels.date || 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalyData.anomalies.slice(0, 15).map((a) => (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: '#f1f5f9',
                          color: C.text,
                        }}>
                          {(labels as Record<string, string>)[`anomaly_${a.type}`] || a.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>
                        {formatCurrency(a.orderTotal, currencyCode)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          color: '#fff',
                          backgroundColor: a.severity === 'high' ? C.danger : a.severity === 'medium' ? C.warning : '#94a3b8',
                        }}>
                          {(labels as Record<string, string>)[a.severity] || a.severity}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{a.score}</td>
                      <td style={{ padding: '8px', fontSize: 12, color: C.textSecondary }}>
                        {a.timestamp.length > 10
                          ? new Date(a.timestamp).toLocaleDateString()
                          : a.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Seasonal Patterns ─────────────────────────────────── */}
      {forecastSummary.forecasts.length > 0 && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>
            <Brain size={18} color={C.purple} />
            {labels.seasonalPatterns || 'Seasonal Demand Patterns'}
          </h3>
          <p style={{ fontSize: 12, color: C.textSecondary, margin: '0 0 12px' }}>
            {labels.seasonalDesc || 'Day-of-week demand index (1.0 = average). Higher values indicate peak demand days.'}
          </p>

          {/* Aggregate seasonal across top products */}
          {(() => {
            const aggSeasonal = [0, 0, 0, 0, 0, 0, 0]
            const count = Math.min(forecastSummary.forecasts.length, 20)
            for (let i = 0; i < count; i++) {
              const f = forecastSummary.forecasts[i]
              for (let d = 0; d < 7; d++) {
                aggSeasonal[d] += f.seasonalIndex[d]
              }
            }
            const bars = aggSeasonal.map((v, i) => ({
              label: dayLabels[i] || `D${i}`,
              value: +(v / count).toFixed(2),
            }))
            return (
              <MiniBarChart
                data={bars}
                height={rv(120, 150, 160)}
                color={C.purple}
                currencyCode=""
              />
            )
          })()}
        </div>
      )}
    </div>
  )
}
