/**
 * AIInsightsWidget — Compact AI insights card for the dashboard
 * Shows key forecasting metrics, at-risk products, and anomaly alert
 */
import { useMemo } from 'react'
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import { forecastDemand } from '../../utils/demandForecast'
import { detectAnomalies } from '../../utils/anomalyDetection'
import SparkLine from '../charts/SparkLine'
import type { Order, Product } from '../../types'
import { useResponsive } from '../../hooks/useLayoutMode'

const C = {
  primary: '#2563eb',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  purple: '#7c3aed',
}

interface Props {
  orders: Order[]
  products: Product[]
  labels: Record<string, string>
  onNavigate?: (section: string) => void
}

export default function AIInsightsWidget({ orders, products, labels, onNavigate }: Props) {
  const { rv } = useResponsive()

  const forecast = useMemo(
    () => forecastDemand(orders, products, { lookbackDays: 30, wmaWindow: 7 }),
    [orders, products]
  )

  const anomalies = useMemo(
    () => detectAnomalies(orders),
    [orders]
  )

  if (forecast.forecastedProducts === 0 && anomalies.totalAnomalies === 0) return null

  // Top 3 at-risk products
  const atRisk = forecast.forecasts
    .filter(f => f.daysUntilStockout !== null && f.daysUntilStockout <= 14)
    .slice(0, 3)

  // Top trending product
  const topTrending = forecast.forecasts
    .filter(f => f.trend === 'increasing')
    .sort((a, b) => b.trendPct - a.trendPct)[0]

  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: rv(16, 20, 24),
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: C.text,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Brain size={16} color="#fff" />
          </div>
          {labels.aiInsights || 'AI Insights'}
        </h3>
        {onNavigate && (
          <button
            onClick={() => onNavigate('reports')}
            style={{
              background: 'none',
              border: 'none',
              color: C.primary,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {labels.viewAll || 'View All'} <ArrowRight size={12} />
          </button>
        )}
      </div>

      {/* Quick stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: rv(8, 12, 12),
        marginBottom: 16,
      }}>
        <div style={{
          padding: rv(10, 12, 14),
          borderRadius: 8,
          backgroundColor: '#f0fdf4',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: rv(16, 20, 22), fontWeight: 800, color: C.success }}>
            {forecast.trendingUp}
          </div>
          <div style={{ fontSize: 11, color: C.success, fontWeight: 500 }}>
            <TrendingUp size={10} /> {labels.rising || 'Rising'}
          </div>
        </div>

        <div style={{
          padding: rv(10, 12, 14),
          borderRadius: 8,
          backgroundColor: '#fef3c7',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: rv(16, 20, 22), fontWeight: 800, color: '#b45309' }}>
            {forecast.atRiskProducts}
          </div>
          <div style={{ fontSize: 11, color: '#b45309', fontWeight: 500 }}>
            <AlertTriangle size={10} /> {labels.atRisk || 'At Risk'}
          </div>
        </div>

        <div style={{
          padding: rv(10, 12, 14),
          borderRadius: 8,
          backgroundColor: anomalies.highSeverity > 0 ? '#fef2f2' : '#f1f5f9',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: rv(16, 20, 22),
            fontWeight: 800,
            color: anomalies.highSeverity > 0 ? C.danger : C.textSecondary,
          }}>
            {anomalies.totalAnomalies}
          </div>
          <div style={{
            fontSize: 11,
            color: anomalies.highSeverity > 0 ? C.danger : C.textSecondary,
            fontWeight: 500,
          }}>
            <ShieldAlert size={10} /> {labels.anomalies || 'Anomalies'}
          </div>
        </div>
      </div>

      {/* At-risk products list */}
      {atRisk.length > 0 && (
        <div style={{ marginBottom: topTrending ? 12 : 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>
            {labels.stockoutWarning || 'Stockout Risk (< 14 days)'}
          </div>
          {atRisk.map((f) => (
            <div key={f.productId} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={12} color={
                  f.daysUntilStockout !== null && f.daysUntilStockout <= 3 ? C.danger : C.warning
                } />
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{f.productName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SparkLine values={f.forecastNext7} width={50} height={16} color={C.danger} />
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: f.daysUntilStockout !== null && f.daysUntilStockout <= 3 ? C.danger : C.warning,
                }}>
                  {f.daysUntilStockout}d
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top trending product */}
      {topTrending && (
        <div style={{
          padding: '10px 12px',
          borderRadius: 8,
          backgroundColor: '#f0fdf4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={14} color={C.success} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.success }}>
                {labels.topTrending || 'Top Trending'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                {topTrending.productName}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.success }}>
            +{topTrending.trendPct}%
          </span>
        </div>
      )}
    </div>
  )
}
