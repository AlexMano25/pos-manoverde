// ---------------------------------------------------------------------------
// InventoryValuationReport — Stock valuation by category with bar chart
// ---------------------------------------------------------------------------

import MiniBarChart from '../charts/MiniBarChart'
import type { InventoryValuationItem } from '../../utils/reportEngine'
import { formatCurrency } from '../../utils/currency'

type Props = {
  items: InventoryValuationItem[]
  totalCostValue: number
  totalRetailValue: number
  totalMargin: number
  totalMarginPct: number
  totalProducts: number
  totalUnits: number
  currencyCode: string
  labels: {
    title: string
    totalAtCost: string
    totalAtPrice: string
    potentialMargin: string
    category: string
    products: string
    units: string
    costValue: string
    retailValue: string
    margin: string
    noData: string
  }
}

const S = {
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  } as React.CSSProperties,
  summaryCard: (bg: string) => ({
    background: bg,
    borderRadius: '12px',
    padding: '16px',
    color: '#ffffff',
  }) as React.CSSProperties,
  summaryLabel: {
    fontSize: '12px',
    fontWeight: 500,
    opacity: 0.9,
    marginBottom: '4px',
  } as React.CSSProperties,
  summaryValue: {
    fontSize: '22px',
    fontWeight: 800,
  } as React.CSSProperties,
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

export default function InventoryValuationReport({
  items,
  totalCostValue,
  totalRetailValue,
  totalMargin,
  totalMarginPct,
  totalProducts,
  totalUnits,
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

  const chartData = items.slice(0, 8).map(it => ({
    label: it.category.length > 10 ? it.category.slice(0, 9) + '...' : it.category,
    value: it.retailValue,
  }))

  return (
    <div>
      {/* Summary cards */}
      <div style={S.summaryGrid}>
        <div style={S.summaryCard('linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')}>
          <div style={S.summaryLabel}>{labels.totalAtCost}</div>
          <div style={S.summaryValue}>{formatCurrency(totalCostValue, currencyCode)}</div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
            {totalProducts} {labels.products} / {totalUnits} {labels.units}
          </div>
        </div>
        <div style={S.summaryCard('linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}>
          <div style={S.summaryLabel}>{labels.totalAtPrice}</div>
          <div style={S.summaryValue}>{formatCurrency(totalRetailValue, currencyCode)}</div>
        </div>
        <div style={S.summaryCard('linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)')}>
          <div style={S.summaryLabel}>{labels.potentialMargin}</div>
          <div style={S.summaryValue}>{formatCurrency(totalMargin, currencyCode)}</div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
            {totalMarginPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Bar chart: retail value by category */}
      <div style={{ marginBottom: '24px' }}>
        <MiniBarChart
          data={chartData}
          height={180}
          color="#2563eb"
          currencyCode={currencyCode}
          isCurrency
        />
      </div>

      {/* Detail table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th('left')}>{labels.category}</th>
              <th style={S.th('right')}>{labels.products}</th>
              <th style={S.th('right')}>{labels.units}</th>
              <th style={S.th('right')}>{labels.costValue}</th>
              <th style={S.th('right')}>{labels.retailValue}</th>
              <th style={S.th('right')}>{labels.margin}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={S.td('left', true)}>{it.category}</td>
                <td style={S.td('right')}>{it.productCount}</td>
                <td style={S.td('right')}>{it.totalUnits}</td>
                <td style={S.td('right')}>{formatCurrency(it.costValue, currencyCode)}</td>
                <td style={S.td('right', true)}>{formatCurrency(it.retailValue, currencyCode)}</td>
                <td style={S.td('right')}>
                  <span style={{ color: it.marginPct >= 30 ? '#16a34a' : it.marginPct >= 15 ? '#f59e0b' : '#dc2626', fontWeight: 700 }}>
                    {it.marginPct.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #1e293b' }}>
              <td style={{ ...S.td('left', true), fontWeight: 800 }}>Total</td>
              <td style={S.td('right', true)}>{totalProducts}</td>
              <td style={S.td('right', true)}>{totalUnits}</td>
              <td style={S.td('right', true)}>{formatCurrency(totalCostValue, currencyCode)}</td>
              <td style={S.td('right', true)}>{formatCurrency(totalRetailValue, currencyCode)}</td>
              <td style={S.td('right')}>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>{totalMarginPct.toFixed(1)}%</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
