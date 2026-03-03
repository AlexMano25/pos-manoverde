import React, { useEffect, useMemo, useState } from 'react'
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
  TrendingUp,
  Download,
  CreditCard,
} from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import ExportMenu from '../components/common/ExportMenu'
import { exportDailySummary } from '../utils/pdfExport'
import { formatCurrency } from '../utils/currency'
import type { Order, PaymentMethod, CreditBalance } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

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
} as const

const paymentColors: Record<PaymentMethod, string> = {
  cash: '#16a34a',
  card: '#2563eb',
  momo: '#f59e0b',
  transfer: '#8b5cf6',
  orange_money: '#f97316',
  mtn_money: '#eab308',
  carte_bancaire: '#6366f1',
}

const statusColors: Record<string, string> = {
  paid: '#16a34a',
  pending: '#f59e0b',
  refunded: '#dc2626',
  cancelled: '#64748b',
}

// ── Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { orders, loading: ordersLoading, loadOrders, getTodayRevenue } = useOrderStore()
  const { products, loading: productsLoading, loadProducts } = useProductStore()
  const { currentStore, setSection } = useAppStore()
  const { t, language } = useLanguageStore()

  // ── Locale-aware helpers ────────────────────────────────────────────────

  const intlLocale = language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : language === 'it' ? 'it-IT' : language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : 'en-US'

  function formatDateTime(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString(intlLocale, { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })
  }

  const paymentLabels: Record<PaymentMethod, string> = {
    cash: t.pos.cash,
    card: t.pos.card,
    momo: t.pos.momo,
    transfer: t.pos.transfer,
    orange_money: t.pos.orangeMoney,
    mtn_money: t.pos.mtnMoney,
    carte_bancaire: t.pos.carteBancaire,
  }

  const statusLabels: Record<string, string> = {
    paid: t.orders.paid,
    pending: t.orders.pending,
    refunded: t.orders.refunded,
    cancelled: t.orders.cancelled,
  }

  // ── Credit balance for pay-as-you-grow ────────────────────────────────

  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)

  useEffect(() => {
    if (currentStore?.id) {
      loadOrders(currentStore.id)
      loadProducts(currentStore.id)
    }
  }, [currentStore?.id, loadOrders, loadProducts])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const orgId = currentStore?.organization_id
    if (!orgId) return

    supabase
      .from('credit_balances')
      .select('*')
      .eq('organization_id', orgId)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('[DashboardPage] Credit balance fetch failed:', error)
        else if (data) setCreditBalance(data as CreditBalance)
      })
  }, [currentStore?.organization_id])

  const todayStr = new Date().toISOString().slice(0, 10)

  const todayOrders = useMemo(
    () => orders.filter((o) => o.created_at.slice(0, 10) === todayStr),
    [orders, todayStr]
  )

  const todayRevenue = getTodayRevenue()

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= (p.min_stock ?? 5)),
    [products]
  )

  const recentOrders = useMemo(() => orders.slice(0, 10), [orders])

  const hasData = orders.length > 0 || products.length > 0

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: 24,
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }
  const titleStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }
  const subtitleStyle: React.CSSProperties = { fontSize: 14, color: C.textSecondary, margin: '4px 0 0' }
  const actionsStyle: React.CSSProperties = { display: 'flex', gap: 10 }
  const primaryBtnStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: C.primary, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
  const outlineBtnStyle: React.CSSProperties = { ...primaryBtnStyle, backgroundColor: '#ffffff', color: C.primary, border: `1px solid ${C.primary}` }
  const statsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: creditBalance ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }
  const statCardStyle: React.CSSProperties = { backgroundColor: C.card, borderRadius: 12, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${C.border}` }
  const statHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }
  const statLabelStyle: React.CSSProperties = { fontSize: 13, color: C.textSecondary, fontWeight: 500, margin: 0 }
  const statValueStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }
  const iconBoxStyle = (bg: string): React.CSSProperties => ({ width: 40, height: 40, borderRadius: 10, backgroundColor: bg + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' })
  const tableCardStyle: React.CSSProperties = { backgroundColor: C.card, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${C.border}`, overflow: 'hidden' }
  const tableHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}` }
  const tableTitleStyle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
  const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${C.border}`, backgroundColor: '#f8fafc' }
  const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: 14, color: C.text, borderBottom: `1px solid ${C.border}` }
  const badgeStyle = (bgColor: string): React.CSSProperties => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, color: bgColor, backgroundColor: bgColor + '15' })
  const emptyStyle: React.CSSProperties = { textAlign: 'center', padding: '60px 24px', backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}` }
  const emptyIconStyle: React.CSSProperties = { width: 64, height: 64, borderRadius: 16, backgroundColor: C.primary + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }

  if (ordersLoading || productsLoading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textSecondary, fontSize: 16 }}>{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t.dashboard.title}</h1>
          <p style={subtitleStyle}>
            {currentStore?.name || 'POS Mano Verde'} &mdash;{' '}
            {new Date().toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={actionsStyle}>
          <ExportMenu
            label={t.common.export}
            items={[
              {
                label: t.common.exportPDF,
                icon: <Download size={14} color={C.primary} />,
                onClick: () => exportDailySummary(orders, products, currentStore?.name || 'POS'),
              },
            ]}
          />
          <button style={primaryBtnStyle} onClick={() => setSection('pos')}>
            <ShoppingCart size={16} /> {t.dashboard.newSale}
          </button>
          <button style={outlineBtnStyle} onClick={() => setSection('products')}>
            <Plus size={16} /> {t.dashboard.addProduct}
          </button>
        </div>
      </div>

      {!hasData ? (
        <div style={emptyStyle}>
          <div style={emptyIconStyle}>
            <TrendingUp size={32} color={C.primary} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
            {t.dashboard.welcomeTitle}
          </h2>
          <p style={{ color: C.textSecondary, fontSize: 14, margin: '0 0 24px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            {t.dashboard.welcomeMessage}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button style={primaryBtnStyle} onClick={() => setSection('products')}>
              <Plus size={16} /> {t.dashboard.addProduct}
            </button>
            <button style={outlineBtnStyle} onClick={() => setSection('pos')}>
              <ShoppingCart size={16} /> {t.dashboard.newSale}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <div style={statHeaderStyle}>
                <p style={statLabelStyle}>{t.dashboard.todayRevenue}</p>
                <div style={iconBoxStyle(C.success)}><DollarSign size={20} color={C.success} /></div>
              </div>
              <p style={statValueStyle}>{formatCurrency(todayRevenue, currentStore?.currency)}</p>
            </div>

            <div style={statCardStyle}>
              <div style={statHeaderStyle}>
                <p style={statLabelStyle}>{t.dashboard.todayOrders}</p>
                <div style={iconBoxStyle(C.primary)}><ShoppingCart size={20} color={C.primary} /></div>
              </div>
              <p style={statValueStyle}>{todayOrders.length}</p>
            </div>

            <div style={statCardStyle}>
              <div style={statHeaderStyle}>
                <p style={statLabelStyle}>{t.dashboard.totalProducts}</p>
                <div style={iconBoxStyle('#8b5cf6')}><Package size={20} color="#8b5cf6" /></div>
              </div>
              <p style={statValueStyle}>{products.length}</p>
            </div>

            <div style={statCardStyle}>
              <div style={statHeaderStyle}>
                <p style={statLabelStyle}>{t.dashboard.lowStock}</p>
                <div style={iconBoxStyle(lowStockProducts.length > 0 ? C.warning : C.success)}>
                  <AlertTriangle size={20} color={lowStockProducts.length > 0 ? C.warning : C.success} />
                </div>
              </div>
              <p style={{ ...statValueStyle, color: lowStockProducts.length > 0 ? C.warning : C.text }}>
                {lowStockProducts.length}
              </p>
            </div>

            {creditBalance && (
              <div style={statCardStyle}>
                <div style={statHeaderStyle}>
                  <p style={statLabelStyle}>{t.billing.creditLabel}</p>
                  <div style={iconBoxStyle(C.primary)}><CreditCard size={20} color={C.primary} /></div>
                </div>
                <p style={statValueStyle}>${creditBalance.balance_usd.toFixed(2)}</p>
                <p style={{ fontSize: 12, color: C.textSecondary, margin: '4px 0 0' }}>
                  {Math.floor(creditBalance.balance_usd / 0.02).toLocaleString()} {t.billing.ticketsLabel}
                </p>
              </div>
            )}
          </div>

          {/* Recent Orders Table */}
          <div style={tableCardStyle}>
            <div style={tableHeaderStyle}>
              <h3 style={tableTitleStyle}>{t.dashboard.recentOrders}</h3>
              <button
                style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => setSection('orders')}
              >
                {t.dashboard.viewAll} <ArrowRight size={14} />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.textSecondary, fontSize: 14 }}>
                {t.dashboard.noOrdersYet}
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>{t.orders.orderId}</th>
                    <th style={thStyle}>{t.orders.dateTime}</th>
                    <th style={thStyle}>{t.common.articles}</th>
                    <th style={thStyle}>{t.common.total}</th>
                    <th style={thStyle}>{t.orders.paymentMethod}</th>
                    <th style={thStyle}>{t.common.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order: Order) => (
                    <tr key={order.id}>
                      <td style={{ ...tdStyle, fontWeight: 600, fontFamily: 'monospace' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td style={tdStyle}>{formatDateTime(order.created_at)}</td>
                      <td style={tdStyle}>{order.items.length} {t.common.articles}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{formatCurrency(order.total, currentStore?.currency)}</td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(paymentColors[order.payment_method])}>
                          {paymentLabels[order.payment_method]}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(statusColors[order.status] || C.textSecondary)}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
