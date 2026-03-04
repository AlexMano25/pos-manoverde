import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileText,
  X,
  MessageCircle,
  Mail,
  Receipt,
} from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import ExportMenu from '../components/common/ExportMenu'
import { exportSalesReport, exportInvoice, exportReceipt } from '../utils/pdfExport'
import { shareViaWhatsApp, shareViaEmail, formatOrderForSharing } from '../utils/sharing'
import { formatCurrency } from '../utils/currency'
import { useResponsive } from '../hooks/useLayoutMode'
import type { Order, PaymentMethod, OrderStatus } from '../types'

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
  paypal: '#003087',
}

const statusColors: Record<OrderStatus, string> = {
  paid: '#16a34a',
  pending: '#f59e0b',
  refunded: '#dc2626',
  cancelled: '#64748b',
}

// ── Component ────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { orders, loading, loadOrders } = useOrderStore()
  const { user } = useAuthStore()
  const { currentStore } = useAppStore()
  const { t, language } = useLanguageStore()

  const { isMobile, rv } = useResponsive()
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  function formatDateTime(iso: string): string {
    const locale = language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : language === 'ar' ? 'ar-SA' : language === 'es' ? 'es-ES' : language === 'it' ? 'it-IT' : language === 'zh' ? 'zh-CN' : 'en-US'
    const d = new Date(iso)
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' ' + d.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const paymentLabels: Record<PaymentMethod, string> = {
    cash: t.pos.cash,
    card: t.pos.card,
    momo: t.pos.momo,
    transfer: t.pos.transfer,
    orange_money: t.pos.orangeMoney,
    mtn_money: t.pos.mtnMoney,
    carte_bancaire: t.pos.carteBancaire,
    paypal: 'PayPal',
  }

  const statusLabels: Record<OrderStatus, string> = {
    paid: t.orders.paid,
    pending: t.orders.pending,
    refunded: t.orders.refunded,
    cancelled: t.orders.cancelled,
  }

  useEffect(() => {
    if (currentStore?.id) {
      loadOrders(currentStore.id)
    }
  }, [currentStore?.id, loadOrders])

  const filteredOrders = useMemo(() => {
    let result = orders
    if (dateFilter) {
      result = result.filter((o) => o.created_at.slice(0, 10) === dateFilter)
    }
    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.items.some((item) => item.name.toLowerCase().includes(q))
      )
    }
    return result
  }, [orders, dateFilter, statusFilter, searchQuery])

  const canRefund = user?.role === 'admin' || user?.role === 'manager'

  const handleRefund = async (order: Order) => {
    console.log('Refund requested for order:', order.id)
    alert(`${t.orders.refund} #${order.id.slice(0, 8).toUpperCase()} - ${t.common.comingSoon}`)
  }

  const storeName = currentStore?.name || 'POS'

  const handleExportSalesReport = () => {
    exportSalesReport(filteredOrders, storeName, dateFilter || undefined, {
      orderId: t.orders.orderId,
      date: t.orders.dateTime,
      items: t.orders.itemCount,
      total: t.common.total,
      payment: t.orders.paymentMethod,
      status: t.common.status,
    })
  }

  const handleExportInvoice = (order: Order) => {
    exportInvoice(order, storeName, currentStore?.address, currentStore?.phone, user?.name)
  }

  const handleExportReceipt = (order: Order) => {
    exportReceipt(order, storeName, currentStore?.address, currentStore?.phone, user?.name)
  }

  const handleShareWhatsApp = (order: Order) => {
    const text = formatOrderForSharing(order, storeName)
    shareViaWhatsApp(text)
  }

  const handleShareEmail = (order: Order) => {
    const text = formatOrderForSharing(order, storeName)
    shareViaEmail(`Order #${order.id.slice(0, 8).toUpperCase()} — ${storeName}`, text)
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId))
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(12, 20, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const exportBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    backgroundColor: C.card,
    color: C.text,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    alignItems: isMobile ? 'stretch' : 'center',
    flexWrap: 'wrap',
    flexDirection: isMobile ? 'column' : 'row',
  }

  const searchBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 8,
    padding: '0 12px',
    border: `1px solid ${C.border}`,
    flex: 1,
    maxWidth: isMobile ? '100%' : 320,
  }

  const searchInputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '10px 0',
    fontSize: 14,
    color: C.text,
    backgroundColor: 'transparent',
  }

  const filterInputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.card,
    outline: 'none',
    cursor: 'pointer',
  }

  const tableCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `1px solid ${C.border}`,
    backgroundColor: '#f8fafc',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 14,
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
  }

  const clickableRowStyle: React.CSSProperties = {
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  }

  const badgeStyle = (bgColor: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    color: bgColor,
    backgroundColor: bgColor + '15',
  })

  const expandedRowStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
  }

  const expandedContentStyle: React.CSSProperties = {
    padding: '16px 20px',
  }

  const detailItemRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    fontSize: 13,
    color: C.text,
  }

  const refundBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 8,
    border: `1px solid ${C.danger}`,
    backgroundColor: 'transparent',
    color: C.danger,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  }

  const actionBtnSmStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }

  const emptyStyle: React.CSSProperties = {
    padding: 60,
    textAlign: 'center',
    color: C.textSecondary,
  }

  if (loading) {
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
        <h1 style={titleStyle}>{t.orders.title}</h1>
        <ExportMenu
          label={t.common.export}
          items={[
            {
              label: t.orders.salesReport,
              icon: <FileText size={14} color={C.primary} />,
              onClick: handleExportSalesReport,
            },
          ]}
        />
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={searchBarStyle}>
          <Search size={16} color={C.textSecondary} />
          <input
            style={searchInputStyle}
            type="text"
            placeholder={t.common.search + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 2, display: 'flex' }}
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <input
          style={filterInputStyle}
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <select
          style={filterInputStyle}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t.orders.allStatuses}</option>
          <option value="paid">{t.orders.paid}</option>
          <option value="pending">{t.orders.pending}</option>
          <option value="refunded">{t.orders.refunded}</option>
          <option value="cancelled">{t.orders.cancelled}</option>
        </select>

        {(dateFilter || statusFilter) && (
          <button
            style={{ ...exportBtnStyle, padding: '10px 14px' }}
            onClick={() => { setDateFilter(''); setStatusFilter('') }}
          >
            <X size={14} /> {t.common.reset}
          </button>
        )}
      </div>

      {/* Table */}
      <div style={tableCardStyle}>
        {filteredOrders.length === 0 ? (
          <div style={emptyStyle}>
            <FileText size={40} color={C.border} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>{t.orders.noOrders}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}></th>
                <th style={thStyle}>{t.orders.orderId}</th>
                <th style={thStyle}>{t.orders.dateTime}</th>
                <th style={thStyle}>{t.orders.itemCount}</th>
                <th style={thStyle}>{t.orders.totalAmount}</th>
                <th style={thStyle}>{t.orders.paymentMethod}</th>
                <th style={thStyle}>{t.orders.statusLabel}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr
                    style={clickableRowStyle}
                    onClick={() => toggleExpand(order.id)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ ...tdStyle, width: 32, padding: '12px 8px 12px 16px' }}>
                      {expandedOrderId === order.id ? (
                        <ChevronUp size={16} color={C.textSecondary} />
                      ) : (
                        <ChevronDown size={16} color={C.textSecondary} />
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, fontFamily: 'monospace' }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={tdStyle}>{formatDateTime(order.created_at)}</td>
                    <td style={tdStyle}>
                      {order.items.length} {t.common.articles}
                    </td>
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

                  {/* Expanded Detail Row */}
                  {expandedOrderId === order.id && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0, borderBottom: `1px solid ${C.border}` }}>
                        <div style={expandedRowStyle}>
                          <div style={expandedContentStyle}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {t.orders.orderDetail}
                            </p>

                            {order.items.map((item, idx) => (
                              <div key={idx} style={detailItemRowStyle}>
                                <span>
                                  {item.name}{' '}
                                  <span style={{ color: C.textSecondary }}>x{item.qty}</span>
                                </span>
                                <span style={{ fontWeight: 500 }}>{formatCurrency(item.price * item.qty, currentStore?.currency)}</span>
                              </div>
                            ))}

                            <div style={{ height: 1, backgroundColor: C.border, margin: '10px 0' }} />

                            <div style={detailItemRowStyle}>
                              <span style={{ color: C.textSecondary }}>{t.pos.subtotal}</span>
                              <span>{formatCurrency(order.subtotal, currentStore?.currency)}</span>
                            </div>
                            {order.discount > 0 && (
                              <div style={detailItemRowStyle}>
                                <span style={{ color: C.textSecondary }}>{t.pos.discount}</span>
                                <span style={{ color: C.danger }}>-{formatCurrency(order.discount, currentStore?.currency)}</span>
                              </div>
                            )}
                            {order.tax > 0 && (
                              <div style={detailItemRowStyle}>
                                <span style={{ color: C.textSecondary }}>{t.pos.tax}</span>
                                <span>{formatCurrency(order.tax, currentStore?.currency)}</span>
                              </div>
                            )}
                            <div style={{ ...detailItemRowStyle, fontWeight: 700, fontSize: 15 }}>
                              <span>{t.common.total}</span>
                              <span>{formatCurrency(order.total, currentStore?.currency)}</span>
                            </div>

                            {order.amount_received != null && (
                              <>
                                <div style={{ height: 1, backgroundColor: C.border, margin: '8px 0' }} />
                                <div style={detailItemRowStyle}>
                                  <span style={{ color: C.textSecondary }}>{t.pos.amountReceived}</span>
                                  <span>{formatCurrency(order.amount_received, currentStore?.currency)}</span>
                                </div>
                                {order.change_due != null && order.change_due > 0 && (
                                  <div style={detailItemRowStyle}>
                                    <span style={{ color: C.textSecondary }}>{t.pos.changeDue}</span>
                                    <span style={{ color: C.success }}>{formatCurrency(order.change_due, currentStore?.currency)}</span>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Order action buttons */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                              <button
                                style={{ ...actionBtnSmStyle, backgroundColor: C.primary + '10', color: C.primary }}
                                onClick={(e) => { e.stopPropagation(); handleExportInvoice(order) }}
                              >
                                <FileText size={13} /> {t.orders.invoice}
                              </button>
                              <button
                                style={{ ...actionBtnSmStyle, backgroundColor: C.success + '10', color: C.success }}
                                onClick={(e) => { e.stopPropagation(); handleExportReceipt(order) }}
                              >
                                <Receipt size={13} /> {t.orders.receipt}
                              </button>
                              <button
                                style={{ ...actionBtnSmStyle, backgroundColor: '#25D366' + '15', color: '#25D366' }}
                                onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(order) }}
                              >
                                <MessageCircle size={13} /> WhatsApp
                              </button>
                              <button
                                style={{ ...actionBtnSmStyle, backgroundColor: C.textSecondary + '10', color: C.textSecondary }}
                                onClick={(e) => { e.stopPropagation(); handleShareEmail(order) }}
                              >
                                <Mail size={13} /> Email
                              </button>
                            </div>

                            {/* Refund button */}
                            {canRefund && order.status === 'paid' && (
                              <button
                                style={refundBtnStyle}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRefund(order)
                                }}
                              >
                                <RotateCcw size={14} /> {t.orders.refund}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
