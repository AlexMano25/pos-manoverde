import React from 'react'
import type { PeakHourItem } from '../../utils/dashboardComputations'
import { formatCurrency } from '../../utils/currency'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type PeakHoursWidgetProps = {
  data: PeakHourItem[]
  title: string
  currencyCode?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BAR_HEIGHT = 160
const PRIMARY = '#2563eb'
const PRIMARY_FADED = 'rgba(37, 99, 235, 0.2)'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PeakHoursWidget: React.FC<PeakHoursWidgetProps> = ({
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

  const maxCount = Math.max(...data.map(d => d.count), 1)
  const peakHour = data.reduce((best, d) => (d.count > best.count ? d : best), data[0])
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
          {title}
        </h3>
        <span style={{ fontSize: 13, color: '#64748b' }}>
          Total: {formatCurrency(totalRevenue, currencyCode)}
        </span>
      </div>

      {/* Bar chart */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          height: BAR_HEIGHT,
        }}
      >
        {data.map(item => {
          const isPeak = item.hour === peakHour.hour
          const barPct = (item.count / maxCount) * 100
          return (
            <div
              key={item.hour}
              style={{
                flex: 1,
                minWidth: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <div
                title={`${item.count} commande(s) — ${formatCurrency(item.revenue, currencyCode)}`}
                style={{
                  width: '100%',
                  height: `${Math.max(barPct, 4)}%`,
                  backgroundColor: isPeak ? PRIMARY : PRIMARY_FADED,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.4s ease',
                  cursor: 'default',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Hour labels */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {data.map(item => (
          <div
            key={item.hour}
            style={{
              flex: 1,
              minWidth: 32,
              textAlign: 'center',
              fontSize: 11,
              color: '#64748b',
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PeakHoursWidget
