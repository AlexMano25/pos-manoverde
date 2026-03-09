// ---------------------------------------------------------------------------
// MiniBarChart — SVG bar chart (pure, no dependencies)
// ---------------------------------------------------------------------------

import { formatCurrency } from '../../utils/currency'

type BarDataItem = {
  label: string
  value: number
}

type MiniBarChartProps = {
  data: BarDataItem[]
  height?: number
  color?: string
  currencyCode?: string
  /** If true, format values as currency */
  isCurrency?: boolean
}

const BAR_COLORS = [
  '#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#0891b2',
  '#dc2626', '#d97706', '#059669', '#4f46e5', '#be185d',
]

export default function MiniBarChart({
  data,
  height = 160,
  color,
  currencyCode,
  isCurrency = false,
}: MiniBarChartProps) {
  if (!data.length) return null

  const max = Math.max(...data.map(d => d.value), 1)
  const barGap = 6
  const labelHeight = 22
  const topPad = 20
  const chartH = height - labelHeight - topPad
  const totalWidth = 100 // percentage

  const barWidth = Math.min(
    (totalWidth - barGap * (data.length + 1)) / data.length,
    totalWidth / 3,
  )

  const formatVal = (v: number): string => {
    if (isCurrency && currencyCode) return formatCurrency(v, currencyCode)
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
    return v.toLocaleString()
  }

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {data.map((item, i) => {
        const barH = max > 0 ? (item.value / max) * chartH : 0
        const x = barGap + i * (barWidth + barGap)
        const y = topPad + chartH - barH
        const barColor = color || BAR_COLORS[i % BAR_COLORS.length]

        return (
          <g key={i}>
            {/* Value label above bar */}
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize={3.2}
              fill="#64748b"
              fontWeight={500}
            >
              {formatVal(item.value)}
            </text>
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barH, 1)}
              rx={1.5}
              fill={barColor}
              opacity={0.85}
            >
              <title>{`${item.label}: ${formatVal(item.value)}`}</title>
            </rect>
            {/* X-axis label */}
            <text
              x={x + barWidth / 2}
              y={topPad + chartH + 12}
              textAnchor="middle"
              fontSize={3}
              fill="#64748b"
            >
              {item.label.length > 8 ? item.label.slice(0, 7) + '…' : item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
