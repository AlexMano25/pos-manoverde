import { useState, useMemo, useCallback } from 'react'
import { useOrderStore } from '../stores/orderStore'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import MiniBarChart from '../components/charts/MiniBarChart'
import MiniDonutChart from '../components/charts/MiniDonutChart'
import InventoryValuationReport from '../components/reports/InventoryValuationReport'
import TaxSummaryReport from '../components/reports/TaxSummaryReport'
import CategoryAnalysis from '../components/reports/CategoryAnalysis'
import {
  computeInventoryValuation,
  computeTaxSummary,
  computeCategoryRevenue,
} from '../utils/reportEngine'
import type { Order, PaymentMethod } from '../types'

// ── Types ────────────────────────────────────────────────────────────────────

type PeriodKey = 'today' | 'week' | 'month' | 'custom'
type ReportTab = 'sales' | 'inventory' | 'tax' | 'categories'

interface TopProduct {
  product_id: string
  name: string
  qty: number
  revenue: number
}

interface EmployeePerf {
  user_id: string
  name: string
  transactions: number
  revenue: number
  avgTicket: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function getDayLabel(d: Date, short?: boolean): string {
  const days = short
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[d.getDay()]
}

function formatDateShort(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function getDateRange(
  period: PeriodKey,
  customFrom: string,
  customTo: string
): { from: Date; to: Date } {
  const now = new Date()
  const today = startOfDay(now)

  switch (period) {
    case 'today':
      return { from: today, to: new Date(today.getTime() + 86400000) }
    case 'week': {
      const weekAgo = new Date(today.getTime() - 6 * 86400000)
      return { from: weekAgo, to: new Date(today.getTime() + 86400000) }
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: monthStart, to: new Date(today.getTime() + 86400000) }
    }
    case 'custom': {
      const f = customFrom ? new Date(customFrom) : today
      const t = customTo ? new Date(customTo) : now
      return { from: startOfDay(f), to: new Date(startOfDay(t).getTime() + 86400000) }
    }
    default:
      return { from: today, to: new Date(today.getTime() + 86400000) }
  }
}

function getPreviousRange(from: Date, to: Date): { from: Date; to: Date } {
  const duration = to.getTime() - from.getTime()
  return { from: new Date(from.getTime() - duration), to: new Date(from.getTime()) }
}

function filterOrders(orders: Order[], storeId: string, from: Date, to: Date): Order[] {
  return orders.filter((o) => {
    if (o.store_id !== storeId) return false
    if (o.status === 'cancelled') return false
    const d = new Date(o.created_at)
    return d >= from && d < to
  })
}

// ── Payment colors ──────────────────────────────────────────────────────────

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#22c55e',
  card: '#3b82f6',
  momo: '#f59e0b',
  transfer: '#8b5cf6',
  orange_money: '#f97316',
  mtn_money: '#eab308',
  carte_bancaire: '#06b6d4',
  paypal: '#0070ba',
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  momo: 'Mobile Money',
  transfer: 'Transfer',
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  carte_bancaire: 'Carte Bancaire',
  paypal: 'PayPal',
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { orders } = useOrderStore()
  const { products } = useProductStore()
  const { currentStore } = useAppStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  const storeId = currentStore?.id || 'default-store'
  const currencyCode = currentStore?.currency || 'XAF'
  const isAdmin = user?.role === 'admin'

  // ── Period & tab state ─────────────────────────────────────────────────
  const [period, setPeriod] = useState<PeriodKey>('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [activeTab, setActiveTab] = useState<ReportTab>('sales')

  // Translation helpers with fallbacks
  const tr = useMemo(() => {
    const r = (t as Record<string, unknown>).reports as Record<string, string> | undefined
    return {
      title: r?.title || 'Reports',
      today: r?.today || 'Today',
      thisWeek: r?.thisWeek || 'This Week',
      thisMonth: r?.thisMonth || 'This Month',
      custom: r?.custom || 'Custom',
      totalRevenue: r?.totalRevenue || 'Total Revenue',
      transactions: r?.transactions || 'Transactions',
      averageTicket: r?.averageTicket || 'Average Ticket',
      grossMargin: r?.grossMargin || 'Gross Margin',
      revenueChart: r?.revenueChart || 'Revenue Chart',
      topProducts: r?.topProducts || 'Top Products',
      rank: r?.rank || '#',
      product: r?.product || 'Product',
      qtySold: r?.qtySold || 'Qty Sold',
      revenue: r?.revenue || 'Revenue',
      paymentBreakdown: r?.paymentBreakdown || 'Payment Breakdown',
      employeePerformance: r?.employeePerformance || 'Employee Performance',
      employee: r?.employee || 'Employee',
      avgTicket: r?.avgTicket || 'Avg Ticket',
      exportPDF: r?.exportPDF || 'PDF',
      exportCSV: r?.exportCSV || 'CSV',
      noData: r?.noData || 'No data for this period',
      from: r?.from || 'From',
      to: r?.to || 'To',
      vsLastPeriod: r?.vsLastPeriod || 'vs last period',
      // Tab names
      salesTab: r?.salesTab || 'Sales',
      inventoryTab: r?.inventoryTab || 'Inventory',
      taxTab: r?.taxTab || 'Taxes',
      categoryTab: r?.categoryTab || 'Categories',
      // Inventory report labels
      totalAtCost: r?.totalAtCost || 'Value at Cost',
      totalAtPrice: r?.totalAtPrice || 'Value at Price',
      potentialMargin: r?.potentialMargin || 'Potential Margin',
      // Tax report labels
      grossRevenue: r?.grossRevenue || 'Gross Revenue',
      netRevenue: r?.netRevenue || 'Net Revenue',
      taxCollected: r?.taxCollected || 'Tax Collected',
      taxRate: r?.taxRate || 'Tax Rate',
      taxableAmount: r?.taxableAmount || 'Taxable Amount',
      taxAmount: r?.taxAmount || 'Tax Amount',
      // Category report labels
      unitsSold: r?.unitsSold || 'Units Sold',
      revenueShare: r?.revenueShare || 'Revenue Share',
      avgPrice: r?.avgPrice || 'Avg Price',
      // Common report labels
      costValue: r?.costValue || 'Cost Value',
      retailValue: r?.retailValue || 'Retail Value',
      margin: r?.margin || 'Margin',
      category: r?.category || 'Category',
      products: r?.products || 'Products',
      units: r?.units || 'Units',
      orders: r?.orders || 'Orders',
      method: r?.method || 'Method',
      totalLabel: r?.totalLabel || 'Total',
    }
  }, [t])

  // ── Compute date ranges ────────────────────────────────────────────────
  const { from, to } = useMemo(() => getDateRange(period, customFrom, customTo), [period, customFrom, customTo])
  const { from: prevFrom, to: prevTo } = useMemo(() => getPreviousRange(from, to), [from, to])

  // ── Filtered orders ────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => filterOrders(orders, storeId, from, to), [orders, storeId, from, to])
  const prevOrders = useMemo(() => filterOrders(orders, storeId, prevFrom, prevTo), [orders, storeId, prevFrom, prevTo])

  // Store products filtered
  const storeProducts = useMemo(() => products.filter(p => p.store_id === storeId), [products, storeId])

  // ── Stat computations ─────────────────────────────────────────────────

  const totalRevenue = useMemo(() => filteredOrders.reduce((s, o) => s + o.total, 0), [filteredOrders])
  const prevRevenue = useMemo(() => prevOrders.reduce((s, o) => s + o.total, 0), [prevOrders])
  const txCount = filteredOrders.length
  const prevTxCount = prevOrders.length
  const avgTicket = txCount > 0 ? totalRevenue / txCount : 0
  const prevAvgTicket = prevTxCount > 0 ? prevRevenue / prevTxCount : 0

  // Gross margin from product cost data
  const grossMarginData = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]))
    let totalCost = 0
    let totalSales = 0
    for (const order of filteredOrders) {
      for (const item of order.items) {
        const prod = productMap.get(item.product_id)
        const cost = prod?.cost ?? 0
        totalCost += cost * item.qty
        totalSales += item.price * item.qty
      }
    }
    const margin = totalSales > 0 ? ((totalSales - totalCost) / totalSales) * 100 : 0
    return { margin, totalCost, totalSales }
  }, [filteredOrders, products])

  const prevGrossMarginData = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]))
    let totalCost = 0
    let totalSales = 0
    for (const order of prevOrders) {
      for (const item of order.items) {
        const prod = productMap.get(item.product_id)
        const cost = prod?.cost ?? 0
        totalCost += cost * item.qty
        totalSales += item.price * item.qty
      }
    }
    return totalSales > 0 ? ((totalSales - totalCost) / totalSales) * 100 : 0
  }, [prevOrders, products])

  // ── Revenue chart data ────────────────────────────────────────────────

  const chartBars = useMemo(() => {
    if (period === 'today') {
      const buckets: { label: string; value: number }[] = []
      for (let h = 0; h < 24; h++) {
        const label = `${h.toString().padStart(2, '0')}h`
        const value = filteredOrders
          .filter((o) => new Date(o.created_at).getHours() === h)
          .reduce((s, o) => s + o.total, 0)
        buckets.push({ label, value })
      }
      return buckets
    }

    const buckets: { label: string; value: number }[] = []
    const cursor = new Date(from)
    while (cursor < to) {
      const dayStart = new Date(cursor)
      const dayEnd = new Date(cursor.getTime() + 86400000)
      const value = filteredOrders
        .filter((o) => {
          const d = new Date(o.created_at)
          return d >= dayStart && d < dayEnd
        })
        .reduce((s, o) => s + o.total, 0)
      const label =
        period === 'week'
          ? getDayLabel(dayStart, true)
          : formatDateShort(dayStart)
      buckets.push({ label, value })
      cursor.setDate(cursor.getDate() + 1)
    }
    return buckets
  }, [filteredOrders, period, from, to])

  // ── Top products ──────────────────────────────────────────────────────

  const topProducts = useMemo(() => {
    const map = new Map<string, TopProduct>()
    for (const order of filteredOrders) {
      for (const item of order.items) {
        const existing = map.get(item.product_id)
        if (existing) {
          existing.qty += item.qty
          existing.revenue += item.price * item.qty
        } else {
          map.set(item.product_id, {
            product_id: item.product_id,
            name: item.name,
            qty: item.qty,
            revenue: item.price * item.qty,
          })
        }
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [filteredOrders])

  const topProductMax = useMemo(() => (topProducts.length > 0 ? topProducts[0].revenue : 1), [topProducts])

  // ── Payment breakdown ─────────────────────────────────────────────────

  const paymentBreakdown = useMemo(() => {
    const map = new Map<PaymentMethod, number>()
    for (const order of filteredOrders) {
      const pm = order.payment_method
      map.set(pm, (map.get(pm) || 0) + order.total)
    }
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((s, e) => s + e[1], 0)
    return entries.map(([method, amount]) => ({
      method,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: PAYMENT_COLORS[method] || '#94a3b8',
    }))
  }, [filteredOrders])

  // ── Employee performance (admin only) ─────────────────────────────────

  const employeePerf = useMemo((): EmployeePerf[] => {
    if (!isAdmin) return []
    const map = new Map<string, EmployeePerf>()
    for (const order of filteredOrders) {
      const existing = map.get(order.user_id)
      if (existing) {
        existing.transactions += 1
        existing.revenue += order.total
      } else {
        map.set(order.user_id, {
          user_id: order.user_id,
          name: order.user_id,
          transactions: 1,
          revenue: order.total,
          avgTicket: 0,
        })
      }
    }
    const result = Array.from(map.values())
    for (const emp of result) {
      emp.avgTicket = emp.transactions > 0 ? emp.revenue / emp.transactions : 0
      const sampleOrder = filteredOrders.find((o) => o.user_id === emp.user_id)
      if (sampleOrder) {
        emp.name = emp.user_id.length > 12 ? emp.user_id.slice(0, 8) + '...' : emp.user_id
      }
    }
    return result.sort((a, b) => b.revenue - a.revenue)
  }, [filteredOrders, isAdmin])

  const employeeMaxRevenue = useMemo(
    () => (employeePerf.length > 0 ? employeePerf[0].revenue : 1),
    [employeePerf]
  )

  // ── Report data for other tabs ────────────────────────────────────────

  const inventoryData = useMemo(
    () => computeInventoryValuation(storeProducts),
    [storeProducts]
  )

  const storeTaxRate = currentStore?.tax_rate ?? 0
  const taxData = useMemo(
    () => computeTaxSummary(filteredOrders, storeTaxRate),
    [filteredOrders, storeTaxRate]
  )

  const categoryData = useMemo(
    () => computeCategoryRevenue(filteredOrders, products),
    [filteredOrders, products]
  )

  // ── CSV Export ─────────────────────────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    const BOM = '\uFEFF'
    const headers = ['Date', 'Order ID', 'Items', 'Total', 'Payment Method', 'Status']
    const rows = filteredOrders.map((o) => [
      o.created_at.slice(0, 10),
      o.receipt_number || o.id,
      o.items.map((i) => `${i.name} x${i.qty}`).join('; '),
      o.total.toString(),
      o.payment_method,
      o.status,
    ])
    const csv = BOM + [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reports_${period}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredOrders, period])

  // ── PDF Export ─────────────────────────────────────────────────────────

  const handleExportPDF = useCallback(() => {
    const w = window.open('', '_blank')
    if (!w) return
    const html = `
      <html><head><title>${tr.title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
        h1 { color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
        th { background: #f1f5f9; font-weight: 600; }
        .stat { display: inline-block; width: 22%; text-align: center; margin: 8px 1%; padding: 16px; border-radius: 8px; background: #f8fafc; }
        .stat h3 { margin: 0; font-size: 14px; color: #64748b; }
        .stat p { margin: 4px 0 0; font-size: 22px; font-weight: 700; }
      </style></head><body>
      <h1>${tr.title} - ${currentStore?.name || 'Store'}</h1>
      <p>${from.toLocaleDateString()} - ${new Date(to.getTime() - 1).toLocaleDateString()}</p>
      <div>
        <div class="stat"><h3>${tr.totalRevenue}</h3><p>${formatCurrency(totalRevenue, currencyCode)}</p></div>
        <div class="stat"><h3>${tr.transactions}</h3><p>${txCount}</p></div>
        <div class="stat"><h3>${tr.averageTicket}</h3><p>${formatCurrency(avgTicket, currencyCode)}</p></div>
        <div class="stat"><h3>${tr.grossMargin}</h3><p>${grossMarginData.margin.toFixed(1)}%</p></div>
      </div>
      <h2>${tr.topProducts}</h2>
      <table>
        <tr><th>${tr.rank}</th><th>${tr.product}</th><th>${tr.qtySold}</th><th>${tr.revenue}</th></tr>
        ${topProducts.map((p, i) => `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.qty}</td><td>${formatCurrency(p.revenue, currencyCode)}</td></tr>`).join('')}
      </table>
      <h2>${tr.paymentBreakdown}</h2>
      <table>
        <tr><th>Method</th><th>Amount</th><th>%</th></tr>
        ${paymentBreakdown.map((p) => `<tr><td>${PAYMENT_LABELS[p.method]}</td><td>${formatCurrency(p.amount, currencyCode)}</td><td>${p.percentage.toFixed(1)}%</td></tr>`).join('')}
      </table>
      </body></html>
    `
    w.document.write(html)
    w.document.close()
    w.print()
  }, [tr, filteredOrders, totalRevenue, txCount, avgTicket, grossMarginData, topProducts, paymentBreakdown, currencyCode, currentStore, from, to])

  // ── Comparison helpers ────────────────────────────────────────────────

  function comparisonBadge(current: number, previous: number): { text: string; up: boolean } {
    if (previous === 0) return { text: '+100%', up: true }
    const diff = ((current - previous) / previous) * 100
    return { text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, up: diff >= 0 }
  }

  const revComp = comparisonBadge(totalRevenue, prevRevenue)
  const txComp = comparisonBadge(txCount, prevTxCount)
  const avgComp = comparisonBadge(avgTicket, prevAvgTicket)
  const marginComp = comparisonBadge(grossMarginData.margin, prevGrossMarginData)

  // ── Styles ────────────────────────────────────────────────────────────

  const S = {
    container: {
      padding: rv('12px', '20px', '28px'),
      minHeight: '100vh',
      background: '#f1f5f9',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      marginBottom: '20px',
    } as React.CSSProperties,
    title: {
      fontSize: rv('22px', '26px', '30px'),
      fontWeight: 800,
      color: '#1e293b',
      margin: 0,
    } as React.CSSProperties,
    periodBar: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const,
      alignItems: 'center',
    } as React.CSSProperties,
    periodBtn: (active: boolean) =>
      ({
        padding: '8px 16px',
        borderRadius: '10px',
        border: 'none',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        background: active ? '#1e293b' : '#ffffff',
        color: active ? '#ffffff' : '#64748b',
        boxShadow: active ? '0 2px 8px rgba(30,41,59,0.18)' : '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'all 0.2s',
      }) as React.CSSProperties,
    exportBtn: (bg: string) =>
      ({
        padding: '8px 14px',
        borderRadius: '10px',
        border: 'none',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        background: bg,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        transition: 'all 0.2s',
      }) as React.CSSProperties,
    tabBar: {
      display: 'flex',
      gap: '4px',
      marginBottom: '20px',
      background: '#ffffff',
      borderRadius: '12px',
      padding: '4px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      overflowX: 'auto' as const,
    } as React.CSSProperties,
    tabBtn: (active: boolean) =>
      ({
        padding: '10px 20px',
        borderRadius: '10px',
        border: 'none',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        background: active ? '#1e293b' : 'transparent',
        color: active ? '#ffffff' : '#64748b',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap' as const,
        flex: isMobile ? 1 : undefined,
        textAlign: 'center' as const,
      }) as React.CSSProperties,
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: rv('1fr', 'repeat(2, 1fr)', 'repeat(4, 1fr)'),
      gap: '16px',
      marginBottom: '24px',
    } as React.CSSProperties,
    card: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: rv('16px', '20px', '24px'),
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      marginBottom: '24px',
    } as React.CSSProperties,
    cardTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#1e293b',
      margin: '0 0 16px 0',
    } as React.CSSProperties,
    customDates: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap' as const,
    } as React.CSSProperties,
    dateInput: {
      padding: '6px 10px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      fontSize: '13px',
      color: '#1e293b',
      background: '#ffffff',
    } as React.CSSProperties,
  }

  // ── Stat card component ───────────────────────────────────────────────

  function StatCardLocal({
    label,
    value,
    gradient,
    comparison,
  }: {
    label: string
    value: string
    gradient: string
    comparison: { text: string; up: boolean }
  }) {
    return (
      <div
        style={{
          background: gradient,
          borderRadius: '16px',
          padding: rv('16px', '20px', '24px'),
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
          }}
        />
        <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.9, marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: rv('20px', '24px', '28px'), fontWeight: 800, marginBottom: '8px' }}>
          {value}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '3px 8px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <span>{comparison.up ? '\u2191' : '\u2193'}</span>
          <span>{comparison.text}</span>
        </div>
      </div>
    )
  }

  // ── Tab content renderers ─────────────────────────────────────────────

  const renderSalesTab = () => (
    <>
      {/* Revenue Chart (SVG) */}
      <div style={S.card}>
        <h2 style={S.cardTitle}>{tr.revenueChart}</h2>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
            {tr.noData}
          </div>
        ) : (
          <MiniBarChart
            data={chartBars}
            height={220}
            color="#22c55e"
            currencyCode={currencyCode}
            isCurrency
          />
        )}
      </div>

      {/* Two-column layout for Top Products and Payment Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {/* Top Products */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>{tr.topProducts}</h2>
          {topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px' }}>
              {tr.noData}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {[tr.rank, tr.product, tr.qtySold, tr.revenue].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          textAlign: i >= 2 ? 'right' : 'left',
                          padding: '8px 10px',
                          color: '#64748b',
                          fontWeight: 600,
                          borderBottom: '2px solid #e2e8f0',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => {
                    const barWidth = topProductMax > 0 ? (p.revenue / topProductMax) * 100 : 0
                    return (
                      <tr key={p.product_id}>
                        <td
                          style={{
                            padding: '10px',
                            fontWeight: 700,
                            color: idx < 3 ? '#22c55e' : '#64748b',
                            width: '36px',
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                            {p.name}
                          </div>
                          <div
                            style={{
                              height: '4px',
                              borderRadius: '2px',
                              background: '#f1f5f9',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${barWidth}%`,
                                borderRadius: '2px',
                                background: 'linear-gradient(90deg, #22c55e, #10b981)',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>
                          {p.qty}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                          {formatCurrency(p.revenue, currencyCode)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Breakdown - SVG Donut */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>{tr.paymentBreakdown}</h2>
          {paymentBreakdown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px' }}>
              {tr.noData}
            </div>
          ) : (
            <MiniDonutChart
              segments={paymentBreakdown.map((entry) => ({
                label: PAYMENT_LABELS[entry.method],
                value: entry.amount,
                color: entry.color,
              }))}
              size={isMobile ? 140 : 160}
              thickness={20}
              centerValue={formatCurrency(totalRevenue, currencyCode)}
              centerLabel="Total"
            />
          )}
        </div>
      </div>

      {/* Employee Performance (admin only) */}
      {isAdmin && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>{tr.employeePerformance}</h2>
          {employeePerf.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px' }}>
              {tr.noData}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {[tr.employee, tr.transactions, tr.revenue, tr.avgTicket].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          textAlign: i >= 1 ? 'right' : 'left',
                          padding: '8px 10px',
                          color: '#64748b',
                          fontWeight: 600,
                          borderBottom: '2px solid #e2e8f0',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employeePerf.map((emp) => {
                    const barWidth = employeeMaxRevenue > 0 ? (emp.revenue / employeeMaxRevenue) * 100 : 0
                    return (
                      <tr key={emp.user_id}>
                        <td style={{ padding: '10px', fontWeight: 600, color: '#1e293b' }}>
                          {emp.name}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#64748b', fontWeight: 500 }}>
                          {emp.transactions}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <div
                              style={{
                                width: rv('60px', '80px', '120px'),
                                height: '6px',
                                borderRadius: '3px',
                                background: '#f1f5f9',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${barWidth}%`,
                                  borderRadius: '3px',
                                  background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                            <span style={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                              {formatCurrency(emp.revenue, currencyCode)}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                          {formatCurrency(emp.avgTicket, currencyCode)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )

  const renderInventoryTab = () => (
    <div style={S.card}>
      <h2 style={S.cardTitle}>{tr.inventoryTab}</h2>
      <InventoryValuationReport
        {...inventoryData}
        currencyCode={currencyCode}
        labels={{
          title: tr.inventoryTab,
          totalAtCost: tr.totalAtCost,
          totalAtPrice: tr.totalAtPrice,
          potentialMargin: tr.potentialMargin,
          category: tr.category,
          products: tr.products,
          units: tr.units,
          costValue: tr.costValue,
          retailValue: tr.retailValue,
          margin: tr.margin,
          noData: tr.noData,
        }}
      />
    </div>
  )

  const renderTaxTab = () => (
    <div style={S.card}>
      <h2 style={S.cardTitle}>{tr.taxTab}</h2>
      <TaxSummaryReport
        {...taxData}
        currencyCode={currencyCode}
        labels={{
          title: tr.taxTab,
          grossRevenue: tr.grossRevenue,
          netRevenue: tr.netRevenue,
          taxCollected: tr.taxCollected,
          taxRate: tr.taxRate,
          taxableAmount: tr.taxableAmount,
          taxAmount: tr.taxAmount,
          orders: tr.orders,
          noData: tr.noData,
          totalLabel: tr.totalLabel,
        }}
      />
    </div>
  )

  const renderCategoryTab = () => (
    <div style={S.card}>
      <h2 style={S.cardTitle}>{tr.categoryTab}</h2>
      <CategoryAnalysis
        items={categoryData}
        currencyCode={currencyCode}
        labels={{
          title: tr.categoryTab,
          category: tr.category,
          revenue: tr.revenue,
          unitsSold: tr.unitsSold,
          revenueShare: tr.revenueShare,
          avgPrice: tr.avgPrice,
          orders: tr.orders,
          noData: tr.noData,
          totalLabel: tr.totalLabel,
        }}
      />
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'sales', label: tr.salesTab },
    { key: 'inventory', label: tr.inventoryTab },
    { key: 'tax', label: tr.taxTab },
    { key: 'categories', label: tr.categoryTab },
  ]

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>{tr.title}</h1>

        <div style={S.periodBar}>
          {(['today', 'week', 'month', 'custom'] as PeriodKey[]).map((p) => (
            <button
              key={p}
              style={S.periodBtn(period === p)}
              onClick={() => setPeriod(p)}
            >
              {p === 'today'
                ? tr.today
                : p === 'week'
                  ? tr.thisWeek
                  : p === 'month'
                    ? tr.thisMonth
                    : tr.custom}
            </button>
          ))}

          {period === 'custom' && (
            <div style={S.customDates}>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={S.dateInput}
              />
              <span style={{ color: '#64748b', fontSize: '13px' }}>{tr.to}</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={S.dateInput}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={S.exportBtn('#3b82f6')} onClick={handleExportPDF}>
            <span role="img" aria-label="pdf">\ud83d\udcc4</span> {tr.exportPDF}
          </button>
          <button style={S.exportBtn('#16a34a')} onClick={handleExportCSV}>
            <span role="img" aria-label="csv">\ud83d\udcca</span> {tr.exportCSV}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={S.statsGrid}>
        <StatCardLocal
          label={tr.totalRevenue}
          value={formatCurrency(totalRevenue, currencyCode)}
          gradient="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
          comparison={revComp}
        />
        <StatCardLocal
          label={tr.transactions}
          value={txCount.toString()}
          gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
          comparison={txComp}
        />
        <StatCardLocal
          label={tr.averageTicket}
          value={formatCurrency(avgTicket, currencyCode)}
          gradient="linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
          comparison={avgComp}
        />
        <StatCardLocal
          label={tr.grossMargin}
          value={`${grossMarginData.margin.toFixed(1)}%`}
          gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          comparison={marginComp}
        />
      </div>

      {/* Tab Bar */}
      <div style={S.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={S.tabBtn(activeTab === tab.key)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'sales' && renderSalesTab()}
      {activeTab === 'inventory' && renderInventoryTab()}
      {activeTab === 'tax' && renderTaxTab()}
      {activeTab === 'categories' && renderCategoryTab()}
    </div>
  )
}
