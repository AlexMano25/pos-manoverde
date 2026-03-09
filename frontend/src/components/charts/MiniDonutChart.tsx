// ---------------------------------------------------------------------------
// MiniDonutChart — SVG donut chart using stroke-dasharray (pure, no deps)
// ---------------------------------------------------------------------------

type DonutSegment = {
  label: string
  value: number
  color?: string
}

type MiniDonutChartProps = {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  /** Label displayed in the center of the donut */
  centerLabel?: string
  centerValue?: string
}

const DONUT_COLORS = [
  '#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#0891b2',
  '#dc2626', '#d97706', '#059669', '#4f46e5', '#be185d',
]

export default function MiniDonutChart({
  segments,
  size = 120,
  thickness = 16,
  centerLabel,
  centerValue,
}: MiniDonutChartProps) {
  if (!segments.length) return null

  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null

  const cx = size / 2
  const cy = size / 2
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  // Build segments with cumulative offset
  let cumulativeOffset = 0
  const arcs = segments.map((seg, i) => {
    const fraction = seg.value / total
    const dashLength = fraction * circumference
    const gap = circumference - dashLength
    const offset = -cumulativeOffset + circumference * 0.25 // start at top (12 o'clock)
    cumulativeOffset += dashLength

    return {
      ...seg,
      color: seg.color || DONUT_COLORS[i % DONUT_COLORS.length],
      dashLength,
      gap,
      offset,
      percentage: Math.round(fraction * 100),
    }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {/* Donut SVG */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={thickness}
        />
        {/* Segments */}
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={thickness}
            strokeDasharray={`${arc.dashLength.toFixed(2)} ${arc.gap.toFixed(2)}`}
            strokeDashoffset={arc.offset.toFixed(2)}
            strokeLinecap="butt"
          >
            <title>{`${arc.label}: ${arc.percentage}%`}</title>
          </circle>
        ))}
        {/* Center text */}
        {centerValue && (
          <>
            <text
              x={cx}
              y={centerLabel ? cy - 4 : cy + 2}
              textAnchor="middle"
              fontSize={size * 0.13}
              fontWeight={700}
              fill="#1e293b"
            >
              {centerValue}
            </text>
            {centerLabel && (
              <text
                x={cx}
                y={cy + size * 0.09}
                textAnchor="middle"
                fontSize={size * 0.08}
                fill="#64748b"
              >
                {centerLabel}
              </text>
            )}
          </>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 80 }}>
        {arcs.slice(0, 6).map((arc, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#1e293b',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                backgroundColor: arc.color,
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {arc.label}
            </span>
            <span style={{ color: '#64748b', fontWeight: 500, flexShrink: 0 }}>
              {arc.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
