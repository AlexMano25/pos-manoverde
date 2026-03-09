// ---------------------------------------------------------------------------
// TaxSummaryReport — Tax collection summary for the selected period
// ---------------------------------------------------------------------------

import MiniDonutChart from '../charts/MiniDonutChart'
import { formatCurrency } from '../../utils/currency'
import type { TaxSummaryItem } from '../../utils/reportEngine'

type Props = {
  items: TaxSummaryItem[]
  totalGross: number
  totalNet: number
  totalTax: number
  currencyCode: string
  labels: {
    title: string
    grossRevenue: string
    netRevenue: string
    taxCollected: string
    taxRate: string
    taxableAmount: string
    taxAmount: string
    orders: string
    noData: string
    totalLabel: string
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

export default function TaxSummaryReport({
  items,
  totalGross,
  totalNet,
  totalTax,
  currencyCode,
  labels,
}: Props) {
  if (items.length === 0 && totalGross === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
        {labels.noData}
      </div>
    )
  }

  const donutSegments = items
    .filter(it => it.taxRate > 0)
    .map(it => ({
      label: `${it.taxRate}%`,
      value: it.taxCollected,
    }))

  // Add zero-tax segment if exists
  const zeroTaxItem = items.find(it => it.taxRate === 0)
  if (zeroTaxItem) {
    donutSegments.push({ label: '0%', value: zeroTaxItem.taxableAmount })
  }

  const taxPct = totalGross > 0 ? (totalTax / totalGross) * 100 : 0

  return (
    <div>
      {/* Summary cards */}
      <div style={S.summaryGrid}>
        <div style={S.summaryCard('linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')}>
          <div style={S.summaryLabel}>{labels.grossRevenue}</div>
          <div style={S.summaryValue}>{formatCurrency(totalGross, currencyCode)}</div>
        </div>
        <div style={S.summaryCard('linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')}>
          <div style={S.summaryLabel}>{labels.netRevenue}</div>
          <div style={S.summaryValue}>{formatCurrency(totalNet, currencyCode)}</div>
        </div>
        <div style={S.summaryCard('linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')}>
          <div style={S.summaryLabel}>{labels.taxCollected}</div>
          <div style={S.summaryValue}>{formatCurrency(totalTax, currencyCode)}</div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
            {taxPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Donut chart */}
      {donutSegments.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <MiniDonutChart
            segments={donutSegments}
            size={140}
            thickness={20}
            centerValue={formatCurrency(totalTax, currencyCode)}
            centerLabel={labels.taxCollected}
          />
        </div>
      )}

      {/* Detail table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th('left')}>{labels.taxRate}</th>
              <th style={S.th('right')}>{labels.taxableAmount}</th>
              <th style={S.th('right')}>{labels.taxAmount}</th>
              <th style={S.th('right')}>{labels.orders}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={S.td('left', true)}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: it.taxRate === 0 ? '#f1f5f9' : '#dbeafe',
                    color: it.taxRate === 0 ? '#64748b' : '#2563eb',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}>
                    {it.taxRate}%
                  </span>
                </td>
                <td style={S.td('right')}>{formatCurrency(it.taxableAmount, currencyCode)}</td>
                <td style={S.td('right', true)}>{formatCurrency(it.taxCollected, currencyCode)}</td>
                <td style={S.td('right')}>{it.orderCount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #1e293b' }}>
              <td style={{ ...S.td('left', true), fontWeight: 800 }}>{labels.totalLabel}</td>
              <td style={S.td('right', true)}>{formatCurrency(totalNet, currencyCode)}</td>
              <td style={S.td('right', true)}>{formatCurrency(totalTax, currencyCode)}</td>
              <td style={S.td('right', true)}>
                {items.reduce((s, it) => s + it.orderCount, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
