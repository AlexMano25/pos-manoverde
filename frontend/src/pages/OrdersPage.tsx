import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Download,
  FileText,
  X,
} from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
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

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Especes',
  card: 'Carte',
  momo: 'MoMo',
  transfer: 'Virement',
}

const paymentColors: Record<PaymentMethod, string> = {
  cash: '#16a34a',
  card: '#2563eb',
  momo: '#f59e0b',
  transfer: '#8b5cf6',
}

const statusLabels: Record<OrderStatus, string> = {
  paid: 'Paye',
  pending: 'En attente',
  refunded: 'Rembourse',
  cancelled: 'Annule',
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

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

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
    // Placeholder - in production, call orderStore or API
    console.log('Refund requested for order:', order.id)
    alert(`Remboursement de la commande #${order.id.slice(0, 8).toUpperCase()} - Fonctionnalite bientot disponible`)
  }

  const handleExport = () => {
    alert('Export des commandes - Fonctionnalite bientot disponible')
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId))
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: 24,
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
    alignItems: 'center',
    flexWrap: 'wrap',
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
    maxWidth: 320,
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

  const emptyStyle: React.CSSProperties = {
    padding: 60,
    textAlign: 'center',
    color: C.textSecondary,
  }

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textSecondary, fontSize: 16 }}>Chargement des commandes...</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Commandes</h1>
        <button style={exportBtnStyle} onClick={handleExport}>
          <Download size={16} /> Exporter
        </button>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={searchBarStyle}>
          <Search size={16} color={C.textSecondary} />
          <input
            style={searchInputStyle}
            type="text"
            placeholder="Rechercher par numero ou produit..."
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
          <option value="">Tous les statuts</option>
          <option value="paid">Paye</option>
          <option value="pending">En attente</option>
          <option value="refunded">Rembourse</option>
          <option value="cancelled">Annule</option>
        </select>

        {(dateFilter || statusFilter) && (
          <button
            style={{ ...exportBtnStyle, padding: '10px 14px' }}
            onClick={() => { setDateFilter(''); setStatusFilter('') }}
          >
            <X size={14} /> Reinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div style={tableCardStyle}>
        {filteredOrders.length === 0 ? (
          <div style={emptyStyle}>
            <FileText size={40} color={C.border} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>Aucune commande trouvee</p>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}></th>
                <th style={thStyle}>N&deg; Commande</th>
                <th style={thStyle}>Date / Heure</th>
                <th style={thStyle}>Articles</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Paiement</th>
                <th style={thStyle}>Statut</th>
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
                      {order.items.length} article{order.items.length > 1 ? 's' : ''}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{formatFCFA(order.total)}</td>
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
                              Detail de la commande
                            </p>

                            {order.items.map((item, idx) => (
                              <div key={idx} style={detailItemRowStyle}>
                                <span>
                                  {item.name}{' '}
                                  <span style={{ color: C.textSecondary }}>x{item.qty}</span>
                                </span>
                                <span style={{ fontWeight: 500 }}>{formatFCFA(item.price * item.qty)}</span>
                              </div>
                            ))}

                            <div style={{ height: 1, backgroundColor: C.border, margin: '10px 0' }} />

                            <div style={detailItemRowStyle}>
                              <span style={{ color: C.textSecondary }}>Sous-total</span>
                              <span>{formatFCFA(order.subtotal)}</span>
                            </div>
                            {order.discount > 0 && (
                              <div style={detailItemRowStyle}>
                                <span style={{ color: C.textSecondary }}>Remise</span>
                                <span style={{ color: C.danger }}>-{formatFCFA(order.discount)}</span>
                              </div>
                            )}
                            {order.tax > 0 && (
                              <div style={detailItemRowStyle}>
                                <span style={{ color: C.textSecondary }}>Taxe</span>
                                <span>{formatFCFA(order.tax)}</span>
                              </div>
                            )}
                            <div style={{ ...detailItemRowStyle, fontWeight: 700, fontSize: 15 }}>
                              <span>Total</span>
                              <span>{formatFCFA(order.total)}</span>
                            </div>

                            {order.amount_received != null && (
                              <>
                                <div style={{ height: 1, backgroundColor: C.border, margin: '8px 0' }} />
                                <div style={detailItemRowStyle}>
                                  <span style={{ color: C.textSecondary }}>Montant recu</span>
                                  <span>{formatFCFA(order.amount_received)}</span>
                                </div>
                                {order.change_due != null && order.change_due > 0 && (
                                  <div style={detailItemRowStyle}>
                                    <span style={{ color: C.textSecondary }}>Monnaie rendue</span>
                                    <span style={{ color: C.success }}>{formatFCFA(order.change_due)}</span>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Refund button */}
                            {canRefund && order.status === 'paid' && (
                              <button
                                style={refundBtnStyle}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRefund(order)
                                }}
                              >
                                <RotateCcw size={14} /> Rembourser
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
        )}
      </div>
    </div>
  )
}
