import React, { useEffect, useMemo } from 'react'
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import type { Order, PaymentMethod } from '../types'

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

// ── Helpers ──────────────────────────────────────────────────────────────

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

const statusLabels: Record<string, string> = {
  paid: 'Paye',
  pending: 'En attente',
  refunded: 'Rembourse',
  cancelled: 'Annule',
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

  useEffect(() => {
    if (currentStore?.id) {
      loadOrders(currentStore.id)
      loadProducts(currentStore.id)
    }
  }, [currentStore?.id, loadOrders, loadProducts])

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

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: 14,
    color: C.textSecondary,
    margin: '4px 0 0',
  }

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
  }

  const primaryBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.primary,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const outlineBtnStyle: React.CSSProperties = {
    ...primaryBtnStyle,
    backgroundColor: '#ffffff',
    color: C.primary,
    border: `1px solid ${C.primary}`,
  }

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24,
  }

  const statCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: `1px solid ${C.border}`,
  }

  const statHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  }

  const statLabelStyle: React.CSSProperties = {
    fontSize: 13,
    color: C.textSecondary,
    fontWeight: 500,
    margin: 0,
  }

  const statValueStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const iconBoxStyle = (bg: string): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: bg + '15',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const tableCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
  }

  const tableHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
  }

  const tableTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: C.text,
    margin: 0,
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

  const badgeStyle = (bgColor: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    color: bgColor,
    backgroundColor: bgColor + '15',
  })

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px 24px',
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
  }

  const emptyIconStyle: React.CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: C.primary + '10',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  }

  if (ordersLoading || productsLoading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textSecondary, fontSize: 16 }}>Chargement du tableau de bord...</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Tableau de bord</h1>
          <p style={subtitleStyle}>
            {currentStore?.name || 'POS Mano Verde'} &mdash;{' '}
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div style={actionsStyle}>
          <button style={primaryBtnStyle} onClick={() => setSection('pos')}>
            <ShoppingCart size={16} /> Nouvelle vente
          </button>
          <button style={outlineBtnStyle} onClick={() => setSection('products')}>
            <Plus size={16} /> Ajouter produit
          </button>
        </div>
      </div>

      {!hasData ? (
        /* Welcome state */
        <div style={emptyStyle}>
          <div style={emptyIconStyle}>
            <TrendingUp size={32} color={C.primary} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
            Bienvenue sur POS Mano Verde
          </h2>
          <p style={{ color: C.textSecondary, fontSize: 14, margin: '0 0 24px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            Commencez par ajouter vos produits, puis effectuez votre premiere vente. Vos statistiques apparaitront ici.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button style={primaryBtnStyle} onClick={() => setSection('products')}>
              <Plus size={16} /> Ajouter des produits
            </button>
            <button style={outlineBtnStyle} onClick={() => setSection('pos')}>
              <ShoppingCart size={16} /> Aller a la caisse
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <div style={statHeaderStyle}>
                <p style={statLabelStyle}>Revenu du jour</p>
                <div style={iconBoxStyle(C.success)}>
                  <DollarSign size={20} color={C.success} />
                </div>
              </div>
              <p style={statValueStyle}>{formatFCFA(todayRevenue)}</p>
            </div>

            <div style={statCardStyle}>
              <div style={statHeaderStyle}>
                <p style={statLabelStyle}>Commandes du jour</p>
                <div style={iconBoxStyle(C.primary)}>
                  <ShoppingCart size={20} color={C.primary} />
                </div>
              </div>
              <p style={statValueStyle}>{todayOrders.length}</p>
            </div>

            <div style={statCardStyle}>
              <div style={statHeaderStyle}>
                <p style={statLabelStyle}>Produits</p>
                <div style={iconBoxStyle('#8b5cf6')}>
                  <Package size={20} color="#8b5cf6" />
                </div>
              </div>
              <p style={statValueStyle}>{products.length}</p>
            </div>

            <div style={statCardStyle}>
              <div style={statHeaderStyle}>
                <p style={statLabelStyle}>Stock faible</p>
                <div style={iconBoxStyle(lowStockProducts.length > 0 ? C.warning : C.success)}>
                  <AlertTriangle
                    size={20}
                    color={lowStockProducts.length > 0 ? C.warning : C.success}
                  />
                </div>
              </div>
              <p
                style={{
                  ...statValueStyle,
                  color: lowStockProducts.length > 0 ? C.warning : C.text,
                }}
              >
                {lowStockProducts.length}
              </p>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div style={tableCardStyle}>
            <div style={tableHeaderStyle}>
              <h3 style={tableTitleStyle}>Commandes recentes</h3>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.primary,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                onClick={() => setSection('orders')}
              >
                Voir tout <ArrowRight size={14} />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.textSecondary, fontSize: 14 }}>
                Aucune commande pour le moment
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>N&deg; Commande</th>
                    <th style={thStyle}>Date / Heure</th>
                    <th style={thStyle}>Articles</th>
                    <th style={thStyle}>Total</th>
                    <th style={thStyle}>Paiement</th>
                    <th style={thStyle}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order: Order) => (
                    <tr key={order.id}>
                      <td style={{ ...tdStyle, fontWeight: 600, fontFamily: 'monospace' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td style={tdStyle}>{formatDateTime(order.created_at)}</td>
                      <td style={tdStyle}>{order.items.length} article{order.items.length > 1 ? 's' : ''}</td>
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
