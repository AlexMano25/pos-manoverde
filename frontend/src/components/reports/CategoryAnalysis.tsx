// ---------------------------------------------------------------------------
// CategoryAnalysis — Revenue breakdown by product category with donut chart
// ---------------------------------------------------------------------------

import MiniDonutChart from '../charts/MiniDonutChart'
import MiniBarChart from '../charts/MiniBarChart'
import { formatCurrency } from '../../utils/currency'
import type { CategoryRevenueItem } from '../../utils/reportEngine'

type Props = {
  items: CategoryRevenueItem[]
  currencyCode: string
  labels: {
    title: string
    category: string
    revenue: string
    unitsSold: string
    revenueShare: string
    avgPrice: string
    orders: string
    noData: string
    totalLabel: string
  }
}

const S = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  th: (align: 'left' | 'right' = 'left') => ({
    textAlign: align,
    padding: '8px 10px',
    color: '#64748b',
    fontWeight: 600,
    borderBottom: '2px solid #e2e8f0',
    fontSize: '12px',
    whiteSpace: 'nowrap' as const,
  }),
  td: (align: 'left' | 'right' = 'left', bold?: boolean) => ({
    textAlign: align,
    padding: '10px',
    fontWeight: bold ? 700 : 500,
    color: bold ? '#1e293b' : '#475569',
    whiteSpace: 'nowrap' as const,
  }),
}

const DONUT_COLORS = [
  '#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#0891b2',
  '#dc2626', '#d97706', '#059669', '#4f46e5', '#be185d',
]

export default function CategoryAnalysis({
  items,
  currencyCode,
  labels,
}: Props) {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
        {labels.noData}
      </div>
    )
  }

  const totalRevenue = items.reduce((s, it) => s + it.revenue, 0)
  const totalUnits = items.reduce((s, it) => s + it.unitsSold, 0)

  // Donut segments for top categories
  const donutSegments = items.slice(0, 8).map((it, i) => ({
    label: it.category,
    value: it.revenue,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }))

  // Bar chart: units sold by category
  const barData = items.slice(0, 8).map(it => ({
    label: it.category.length > 10 ? it.category.slice(0, 9) + '...' : it.category,
    value: it.unitsSold,
  }))

  return (
    <div>
      {/* Charts row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '24px',
        marginBottom: '24px',
        alignItems: 'center',
      }}>
        {/* Donut - Revenue share */}
        <div>
          <MiniDonutChart
            segments={donutSegments}
            size={160}
            thickness={22}
            centerValue={formatCurrency(totalRevenue, currencyCode)}
            centerLabel={labels.revenue}
          />
        </div>

        {/* Bar - Units sold */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
            {labels.unitsSold}
          </div>
          <MiniBarChart data={barData} height={160} />
        </div>
      </div>

      {/* Detail table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th('left')}>{labels.category}</th>
              <th style={S.th('right')}>{labels.revenue}</th>
              <th style={S.th('right')}>{labels.revenueShare}</th>
              <th style={S.th('right')}>{labels.unitsSold}</th>
              <th style={S.th('right')}>{labels.avgPrice}</th>
              <th style={S.th('right')}>{labels.orders}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={S.td('left')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '3px',
                      background: DONUT_COLORS[i % DONUT_COLORS.length],
                      flexShrink: 0,
                    }} />
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{it.category}</span>
                  </div>
                </td>
                <td style={S.td('right', true)}>{formatCurrency(it.revenue, currencyCode)}</td>
                <td style={S.td('right')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <div style={{
                      width: '60px',
                      height: '6px',
                      borderRadius: '3px',
                      background: '#f1f5f9',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(it.percentage, 100)}%`,
                        borderRadius: '3px',
                        background: DONUT_COLORS[i % DONUT_COLORS.length],
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <span style={{ fontWeight: 600, minWidth: '42px', textAlign: 'right' }}>
                      {it.percentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td style={S.td('right')}>{it.unitsSold}</td>
                <td style={S.td('right')}>{formatCurrency(it.avgPrice, currencyCode)}</td>
                <td style={S.td('right')}>{it.orderCount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #1e293b' }}>
              <td style={{ ...S.td('left', true), fontWeight: 800 }}>{labels.totalLabel}</td>
              <td style={S.td('right', true)}>{formatCurrency(totalRevenue, currencyCode)}</td>
              <td style={S.td('right', true)}>100%</td>
              <td style={S.td('right', true)}>{totalUnits}</td>
              <td style={S.td('right')}>-</td>
              <td style={S.td('right')}>-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
