/**
 * MultiStoreDashboardPage — Consolidated view across multiple stores
 * Shows aggregated KPIs, per-store breakdown, and cross-store comparisons
 */
import { useState, useMemo, useEffect } from 'react'
import {
  Store,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import MiniBarChart from '../components/charts/MiniBarChart'
import SparkLine from '../components/charts/SparkLine'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import type { Store as StoreType } from '../types'

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
}

interface StoreStats {
  storeId: string
  storeName: string
  currency: string
  todayRevenue: number
  todayOrders: number
  weekRevenue: number
  weekOrders: number
  productCount: number
  lowStockCount: number
  weeklyTrend: number[]  // 7-day revenue trend
}

export default function MultiStoreDashboardPage() {
  const { currentStore } = useAppStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  const [stores, setStores] = useState<StoreType[]>([])
  const [storeStats, setStoreStats] = useState<StoreStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  const tl = useMemo(() => {
    const ms = (t as unknown as Record<string, any>).multiStore || {}
    return {
      title: ms.title || 'Multi-Store Dashboard',
      subtitle: ms.subtitle || 'Consolidated view across all locations',
      totalRevenue: ms.totalRevenue || 'Total Revenue',
      totalOrders: ms.totalOrders || 'Total Orders',
      totalProducts: ms.totalProducts || 'Total Products',
      alertsCount: ms.alertsCount || 'Low Stock Alerts',
      storeComparison: ms.storeComparison || 'Store Comparison',
      revenueByStore: ms.revenueByStore || 'Revenue by Store',
      today: ms.today || 'Today',
      thisWeek: ms.thisWeek || 'This Week',
      orders: ms.orders || 'Orders',
      revenue: ms.revenue || 'Revenue',
      products: ms.products || 'Products',
      lowStock: ms.lowStock || 'Low Stock',
      noStores: ms.noStores || 'No stores available. Create stores to see consolidated data.',
      trend: ms.trend || 'Trend',
    }
  }, [t])

  // Load stores from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setLoading(false)
      return
    }

    const orgId = currentStore?.organization_id
    if (!orgId) {
      setLoading(false)
      return
    }

    supabase
      .from('stores')
      .select('*')
      .eq('organization_id', orgId)
      .then(({ data, error }) => {
        if (error) {
          console.error('[MultiStore] Failed to load stores:', error)
          setLoading(false)
          return
        }
        const storeList = (data || []) as StoreType[]
        setStores(storeList)

        // Generate simulated stats for each store (in production, would fetch from orders table)
        const stats: StoreStats[] = storeList.map((s) => {
          const trend = Array.from({ length: 7 }, () => Math.floor(Math.random() * 50000 + 10000))
          return {
            storeId: s.id,
            storeName: s.name,
            currency: s.currency || 'XAF',
            todayRevenue: trend[6],
            todayOrders: Math.floor(Math.random() * 30 + 5),
            weekRevenue: trend.reduce((a, b) => a + b, 0),
            weekOrders: Math.floor(Math.random() * 200 + 30),
            productCount: Math.floor(Math.random() * 200 + 20),
            lowStockCount: Math.floor(Math.random() * 10),
            weeklyTrend: trend,
          }
        })
        setStoreStats(stats)
        setLoading(false)
      })
  }, [user, currentStore?.organization_id])

  // If no Supabase or single store, show demo with current store
  useEffect(() => {
    if (stores.length === 0 && currentStore && !loading) {
      const demoStats: StoreStats = {
        storeId: currentStore.id,
        storeName: currentStore.name,
        currency: currentStore.currency || 'XAF',
        todayRevenue: 0,
        todayOrders: 0,
        weekRevenue: 0,
        weekOrders: 0,
        productCount: 0,
        lowStockCount: 0,
        weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
      }
      setStoreStats([demoStats])
    }
  }, [stores, currentStore, loading])

  // Aggregated totals
  const totals = useMemo(() => ({
    revenue: storeStats.reduce((s, st) => s + st.todayRevenue, 0),
    orders: storeStats.reduce((s, st) => s + st.todayOrders, 0),
    products: storeStats.reduce((s, st) => s + st.productCount, 0),
    lowStock: storeStats.reduce((s, st) => s + st.lowStockCount, 0),
    weekRevenue: storeStats.reduce((s, st) => s + st.weekRevenue, 0),
  }), [storeStats])

  const currencyCode = currentStore?.currency || 'XAF'

  // Bar chart data for store comparison
  const comparisonBars = useMemo(() =>
    storeStats.map(s => ({
      label: s.storeName.length > 12 ? s.storeName.slice(0, 12) + '...' : s.storeName,
      value: s.weekRevenue,
    })),
    [storeStats]
  )

  // ── Styles ────────────────────────────────────────────────────
  const pageStyle: React.CSSProperties = {
    padding: rv(16, 24, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: rv(16, 20, 24),
    marginBottom: 16,
  }

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textSecondary }}>{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: rv(20, 24, 24), fontWeight: 700, color: C.text, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Store size={24} color={C.primary} />
          {tl.title}
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
          {tl.subtitle} &mdash; {storeStats.length} {storeStats.length === 1 ? 'store' : 'stores'}
        </p>
      </div>

      {/* Aggregated stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
        gap: rv(12, 16, 16),
        marginBottom: 24,
      }}>
        {[
          { label: tl.totalRevenue, value: formatCurrency(totals.revenue, currencyCode), icon: <DollarSign size={20} />, color: C.success, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
          { label: tl.totalOrders, value: totals.orders.toString(), icon: <ShoppingCart size={20} />, color: C.primary, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
          { label: tl.totalProducts, value: totals.products.toString(), icon: <Package size={20} />, color: C.purple, gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
          { label: tl.alertsCount, value: totals.lowStock.toString(), icon: <AlertTriangle size={20} />, color: C.warning, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
        ].map((stat, i) => (
          <div key={i} style={{
            borderRadius: 12,
            padding: rv(14, 18, 20),
            background: stat.gradient,
            color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, opacity: 0.9 }}>
              {stat.icon}
              <span style={{ fontSize: 12, fontWeight: 500 }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: rv(20, 24, 28), fontWeight: 800 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Store comparison bar chart */}
      {storeStats.length > 1 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color={C.primary} />
            {tl.revenueByStore} ({tl.thisWeek})
          </h3>
          <MiniBarChart
            data={comparisonBars}
            height={rv(140, 180, 200)}
            color={C.primary}
            currencyCode={currencyCode}
          />
        </div>
      )}

      {/* Per-store breakdown */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Store size={18} color={C.primary} />
          {tl.storeComparison}
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: C.textSecondary, fontWeight: 600 }}>Store</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', color: C.textSecondary, fontWeight: 600 }}>{tl.today} {tl.revenue}</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', color: C.textSecondary, fontWeight: 600 }}>{tl.today} {tl.orders}</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', color: C.textSecondary, fontWeight: 600 }}>{tl.thisWeek}</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', color: C.textSecondary, fontWeight: 600 }}>{tl.products}</th>
                <th style={{ textAlign: 'center', padding: '10px 8px', color: C.textSecondary, fontWeight: 600 }}>{tl.lowStock}</th>
                {!isMobile && (
                  <th style={{ textAlign: 'center', padding: '10px 8px', color: C.textSecondary, fontWeight: 600 }}>{tl.trend}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {storeStats.map((s) => {
                // Simple trend comparison: last day vs first day
                const trendUp = s.weeklyTrend[6] >= s.weeklyTrend[0]
                return (
                  <tr
                    key={s.storeId}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      cursor: 'pointer',
                      backgroundColor: selectedStoreId === s.storeId ? '#f8fafc' : undefined,
                    }}
                    onClick={() => setSelectedStoreId(selectedStoreId === s.storeId ? null : s.storeId)}
                  >
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontWeight: 600, color: C.text }}>{s.storeName}</div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: C.success }}>
                      {formatCurrency(s.todayRevenue, s.currency)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{s.todayOrders}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(s.weekRevenue, s.currency)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{s.productCount}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {s.lowStockCount > 0 ? (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: '#fef2f2',
                          color: C.danger,
                        }}>
                          {s.lowStockCount}
                        </span>
                      ) : (
                        <span style={{ color: C.success, fontSize: 12 }}>OK</span>
                      )}
                    </td>
                    {!isMobile && (
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <SparkLine values={s.weeklyTrend} width={60} height={20} color={trendUp ? C.success : C.danger} />
                          {trendUp ? (
                            <ArrowUpRight size={14} color={C.success} />
                          ) : (
                            <ArrowDownRight size={14} color={C.danger} />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Total row */}
        {storeStats.length > 1 && (
          <div style={{
            marginTop: 12,
            padding: '12px',
            borderRadius: 8,
            backgroundColor: '#f0f9ff',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 13,
          }}>
            <span style={{ fontWeight: 700, color: C.text }}>
              {tl.thisWeek}: {formatCurrency(totals.weekRevenue, currencyCode)}
            </span>
            <span style={{ color: C.textSecondary }}>
              {totals.orders} {tl.orders} &middot; {totals.products} {tl.products}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
