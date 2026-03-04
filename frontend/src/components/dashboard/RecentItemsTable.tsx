import type { Order } from '../../types'
import { ArrowRight } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecentItemsTableProps = {
  orders: Order[]
  title: string
  onViewAll: () => void
  viewAllLabel: string
  currencyCode?: string
  labels: {
    orderId: string
    dateTime: string
    articles: string
    total: string
    paymentMethod: string
    status: string
  }
  paymentLabels: Record<string, string>
  statusLabels: Record<string, string>
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const colors = {
  primary: '#2563eb',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
} as const

// ---------------------------------------------------------------------------
// Badge color maps
// ---------------------------------------------------------------------------

const paymentColors: Record<string, string> = {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function badge(label: string, color: string) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        color,
        backgroundColor: `${color}18`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RecentItemsTable = ({
  orders,
  title,
  onViewAll,
  viewAllLabel,
  currencyCode,
  labels,
  paymentLabels,
  statusLabels,
}: RecentItemsTableProps) => {
  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textAlign: 'left',
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap',
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 13,
    color: colors.text,
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap',
  }

  return (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
          {title}
        </span>
        <button
          onClick={onViewAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 500,
            color: colors.primary,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {viewAllLabel}
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Table or empty state */}
      {orders.length === 0 ? (
        <div
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            fontSize: 13,
            color: colors.textSecondary,
          }}
        >
          Aucune commande
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>{labels.orderId}</th>
                <th style={thStyle}>{labels.dateTime}</th>
                <th style={thStyle}>{labels.articles}</th>
                <th style={thStyle}>{labels.total}</th>
                <th style={thStyle}>{labels.paymentMethod}</th>
                <th style={thStyle}>{labels.status}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const itemCount = order.items.reduce(
                  (sum, item) => sum + item.qty,
                  0,
                )
                const pmColor =
                  paymentColors[order.payment_method] ?? colors.textSecondary
                const pmLabel =
                  paymentLabels[order.payment_method] ?? order.payment_method
                const stColor =
                  statusColors[order.status] ?? colors.textSecondary
                const stLabel = statusLabels[order.status] ?? order.status

                return (
                  <tr key={order.id}>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      #{order.id.slice(0, 8)}
                    </td>
                    <td style={tdStyle}>{formatDateTime(order.created_at)}</td>
                    <td style={tdStyle}>{itemCount}</td>
                    <td style={tdStyle}>
                      {formatCurrency(order.total, currencyCode)}
                    </td>
                    <td style={tdStyle}>{badge(pmLabel, pmColor)}</td>
                    <td style={tdStyle}>{badge(stLabel, stColor)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RecentItemsTable
