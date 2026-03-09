// ---------------------------------------------------------------------------
// ExpiryAlertWidget — Dashboard widget showing products expiring soon
// Color-coded: red (<7 days), orange (7-14 days), yellow (14-30 days)
// ---------------------------------------------------------------------------

import { useMemo } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import type { Product } from '../../types'

type ExpiryAlertWidgetProps = {
  products: Product[]
  title: string
  labels?: {
    expired?: string
    expiringToday?: string
    daysUntilExpiry?: string
    noAlerts?: string
  }
}

type ExpiryItem = {
  product: Product
  daysLeft: number
  severity: 'danger' | 'warning' | 'info'
  color: string
  bgColor: string
}

const colors = {
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
} as const

export default function ExpiryAlertWidget({
  products,
  title,
  labels,
}: ExpiryAlertWidgetProps) {
  const expiryItems: ExpiryItem[] = useMemo(() => {
    const now = new Date()
    const day30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return products
      .filter(p => {
        if (!p.expiry_date || !p.is_active) return false
        const exp = new Date(p.expiry_date)
        return exp <= day30
      })
      .map(p => {
        const exp = new Date(p.expiry_date!)
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

        let severity: ExpiryItem['severity'] = 'info'
        let color = '#d97706'
        let bgColor = '#fef9c3'

        if (daysLeft <= 0) {
          severity = 'danger'
          color = '#dc2626'
          bgColor = '#fee2e2'
        } else if (daysLeft <= 7) {
          severity = 'danger'
          color = '#dc2626'
          bgColor = '#fee2e2'
        } else if (daysLeft <= 14) {
          severity = 'warning'
          color = '#ea580c'
          bgColor = '#ffedd5'
        }

        return { product: p, daysLeft, severity, color, bgColor }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 8)
  }, [products])

  const getDaysLabel = (days: number): string => {
    if (days <= 0) return labels?.expired || 'Expiré'
    if (days === 0) return labels?.expiringToday || 'Expire aujourd\'hui'
    return `${days}j`
  }

  return (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Clock size={18} color="#dc2626" />
        <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>
          {title}
        </h3>
        {expiryItems.length > 0 && (
          <span
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            {expiryItems.length}
          </span>
        )}
      </div>

      {expiryItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '16px 0',
            color: '#16a34a',
            fontSize: 13,
          }}
        >
          ✓ {labels?.noAlerts || 'Aucun produit expirant'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {expiryItems.map(item => (
            <div
              key={item.product.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                backgroundColor: item.bgColor,
                borderRadius: 8,
                borderLeft: `3px solid ${item.color}`,
              }}
            >
              <AlertTriangle size={14} color={item.color} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: colors.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.product.name}
                </div>
                {item.product.expiry_date && (
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>
                    {new Date(item.product.expiry_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: item.color,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {getDaysLabel(item.daysLeft)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
