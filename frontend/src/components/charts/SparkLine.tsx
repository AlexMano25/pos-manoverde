// ---------------------------------------------------------------------------
// SparkLine — tiny inline 7-day trend sparkline (pure SVG, no dependencies)
// ---------------------------------------------------------------------------

type SparkLineProps = {
  values: number[]
  width?: number
  height?: number
  color?: string
  showDot?: boolean
}

export default function SparkLine({
  values,
  width = 80,
  height = 24,
  color = '#2563eb',
  showDot = true,
}: SparkLineProps) {
  if (!values.length || values.every(v => v === 0)) return null

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1

  const padY = 3
  const plotH = height - padY * 2

  const points = values.map((v, i) => {
    const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width
    const y = padY + plotH - ((v - min) / range) * plotH
    return { x, y }
  })

  const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // Determine trend: compare last vs first value
  const trend = values[values.length - 1] - values[0]
  const trendColor = trend > 0 ? '#16a34a' : trend < 0 ? '#dc2626' : color

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Area fill */}
      <polygon
        points={`${points[0].x},${height} ${polyline} ${points[points.length - 1].x},${height}`}
        fill={trendColor}
        opacity={0.1}
      />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={trendColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {showDot && points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2.5}
          fill={trendColor}
        />
      )}
    </svg>
  )
}
