import React from 'react'
import type { CategoryBreakdownItem } from '../../utils/dashboardComputations'
import { formatCurrency } from '../../utils/currency'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CategoryBreakdownProps = {
  data: CategoryBreakdownItem[]
  title: string
  currencyCode?: string
}

// ---------------------------------------------------------------------------
// Bar colors (cycle through)
// ---------------------------------------------------------------------------

const BAR_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#0891b2', '#ea580c']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  data,
  title,
  currencyCode = 'XAF',
}) => {
  if (data.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #e2e8f0',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
          {title}
        </h3>
        <p
          style={{
            textAlign: 'center',
            color: '#64748b',
            marginTop: 32,
            marginBottom: 32,
            fontSize: 14,
          }}
        >
          Aucune donnée
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #e2e8f0',
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
        {title}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.map((item, idx) => {
          const barColor = BAR_COLORS[idx % BAR_COLORS.length]
          return (
            <div key={item.category}>
              {/* Label row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>
                  {item.category}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  {formatCurrency(item.revenue, currencyCode)}{' '}
                  <span style={{ fontWeight: 400 }}>({item.percentage.toFixed(1)}%)</span>
                </span>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  height: 8,
                  backgroundColor: '#f1f5f9',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(item.percentage, 1)}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryBreakdown
