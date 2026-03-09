import type { ReactNode } from 'react'
import { formatCurrency } from '../../utils/currency'
import SparkLine from '../charts/SparkLine'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StatCardProps = {
  label: string
  value: number
  icon: ReactNode
  color: string
  isCurrency?: boolean
  isPercentage?: boolean
  currencyCode?: string
  /** 7-day trend data for sparkline display */
  sparkline?: number[]
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const colors = {
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
} as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(
  value: number,
  isCurrency?: boolean,
  isPercentage?: boolean,
  currencyCode?: string,
): string {
  if (isCurrency) {
    return formatCurrency(value, currencyCode)
  }
  if (isPercentage) {
    return `${value.toFixed(1)}%`
  }
  return value.toLocaleString()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StatCard = ({
  label,
  value,
  icon,
  color,
  isCurrency,
  isPercentage,
  currencyCode,
  sparkline,
}: StatCardProps) => {
  return (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Top row: label + icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: colors.textSecondary,
            lineHeight: 1.3,
          }}
        >
          {label}
        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: `${color}18`,
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      </div>

      {/* Value + Sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1.2,
          }}
        >
          {formatValue(value, isCurrency, isPercentage, currencyCode)}
        </span>
        {sparkline && sparkline.length > 1 && (
          <SparkLine values={sparkline} color={color} width={72} height={28} />
        )}
      </div>
    </div>
  )
}

export default StatCard
