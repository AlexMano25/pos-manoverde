// ---------------------------------------------------------------------------
// SalesTrendWidget — 7-day sales trend line chart for dashboard
// ---------------------------------------------------------------------------

import MiniLineChart from '../charts/MiniLineChart'
import type { SalesTrendItem } from '../../utils/dashboardComputations'

type SalesTrendWidgetProps = {
  data: SalesTrendItem[]
  title: string
  currencyCode?: string
}

const colors = {
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
} as const

export default function SalesTrendWidget({
  data,
  title,
  currencyCode,
}: SalesTrendWidgetProps) {
  const total = data.reduce((s, d) => s + d.value, 0)

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>
          {title}
        </h3>
      </div>
      {total > 0 ? (
        <MiniLineChart
          data={data.map(d => ({ label: d.label, value: d.value }))}
          height={140}
          color="#16a34a"
          currencyCode={currencyCode}
          isCurrency
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: colors.textSecondary, fontSize: 13 }}>
          Aucune donnée
        </div>
      )}
    </div>
  )
}
