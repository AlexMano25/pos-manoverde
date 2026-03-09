// ---------------------------------------------------------------------------
// MiniLineChart — SVG line chart with area fill (pure, no dependencies)
// ---------------------------------------------------------------------------

import { formatCurrency } from '../../utils/currency'

type LineDataItem = {
  label: string
  value: number
}

type MiniLineChartProps = {
  data: LineDataItem[]
  height?: number
  color?: string
  currencyCode?: string
  isCurrency?: boolean
  showGrid?: boolean
}

export default function MiniLineChart({
  data,
  height = 160,
  color = '#2563eb',
  currencyCode,
  isCurrency = false,
  showGrid = true,
}: MiniLineChartProps) {
  if (!data.length) return null

  const padX = 8
  const padY = 16
  const labelH = 20
  const chartW = 100 - padX * 2
  const chartH = height - padY * 2 - labelH

  const max = Math.max(...data.map(d => d.value), 1)
  const min = Math.min(...data.map(d => d.value), 0)
  const range = max - min || 1

  const points = data.map((d, i) => {
    const x = padX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW)
    const y = padY + chartH - ((d.value - min) / range) * chartH
    return { x, y, ...d }
  })

  const polyline = points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const areaPoints = `${points[0].x},${padY + chartH} ${polyline} ${points[points.length - 1].x},${padY + chartH}`

  const formatVal = (v: number): string => {
    if (isCurrency && currencyCode) return formatCurrency(v, currencyCode)
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
    return v.toLocaleString()
  }

  // Grid lines (3 horizontal)
  const gridLines = showGrid
    ? [0.25, 0.5, 0.75].map(frac => ({
      y: padY + chartH - frac * chartH,
      val: min + frac * range,
    }))
    : []

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Grid lines */}
      {gridLines.map((g, i) => (
        <g key={`grid-${i}`}>
          <line
            x1={padX}
            y1={g.y}
            x2={padX + chartW}
            y2={g.y}
            stroke="#e2e8f0"
            strokeWidth={0.3}
            strokeDasharray="2,2"
          />
          <text x={padX - 1} y={g.y + 1} textAnchor="end" fontSize={2.5} fill="#94a3b8">
            {formatVal(g.val)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={areaPoints} fill={color} opacity={0.08} />

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={1.2} fill="#fff" stroke={color} strokeWidth={0.6} />
          <title>{`${p.label}: ${formatVal(p.value)}`}</title>
        </g>
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => {
        // Show every label if <=7 items, else show every 2nd
        const show = data.length <= 7 || i % 2 === 0 || i === data.length - 1
        if (!show) return null
        return (
          <text
            key={`label-${i}`}
            x={p.x}
            y={padY + chartH + 12}
            textAnchor="middle"
            fontSize={2.8}
            fill="#64748b"
          >
            {p.label}
          </text>
        )
      })}
    </svg>
  )
}
