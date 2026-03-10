/**
 * FunnelChart — SVG funnel chart for conversion/pipeline visualization
 * E.g., Visits → Cart → Checkout → Purchase
 */
import { useResponsive } from '../../hooks/useLayoutMode'

interface FunnelStep {
  label: string
  value: number
  color?: string
}

interface Props {
  steps: FunnelStep[]
  height?: number
  showPercentage?: boolean
  formatValue?: (v: number) => string
}

const DEFAULT_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc']

export default function FunnelChart({
  steps,
  height = 200,
  showPercentage = true,
  formatValue = (v) => v.toLocaleString(),
}: Props) {
  const { rv } = useResponsive()

  if (steps.length === 0) return null

  const maxVal = steps[0].value || 1
  const stepHeight = height / steps.length
  const svgWidth = rv(280, 360, 440)
  const centerX = svgWidth / 2
  const maxBarWidth = svgWidth * 0.85

  return (
    <svg width={svgWidth} height={height + 20} style={{ display: 'block', margin: '0 auto' }}>
      {steps.map((step, i) => {
        const ratio = step.value / maxVal
        const barWidth = Math.max(maxBarWidth * ratio, 40)
        const nextRatio = i < steps.length - 1 ? (steps[i + 1].value / maxVal) : ratio
        const nextBarWidth = Math.max(maxBarWidth * nextRatio, 40)
        const y = i * stepHeight
        const color = step.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]

        // Trapezoid points
        const x1 = centerX - barWidth / 2
        const x2 = centerX + barWidth / 2
        const x3 = centerX + nextBarWidth / 2
        const x4 = centerX - nextBarWidth / 2

        return (
          <g key={i}>
            <polygon
              points={`${x1},${y} ${x2},${y} ${x3},${y + stepHeight} ${x4},${y + stepHeight}`}
              fill={color}
              opacity={0.85}
            >
              <title>{step.label}: {formatValue(step.value)}</title>
            </polygon>

            {/* Label */}
            <text
              x={centerX}
              y={y + stepHeight / 2 - 2}
              textAnchor="middle"
              style={{
                fontSize: rv(11, 12, 13),
                fontWeight: 600,
                fill: '#ffffff',
              }}
            >
              {step.label}
            </text>

            {/* Value */}
            <text
              x={centerX}
              y={y + stepHeight / 2 + 12}
              textAnchor="middle"
              style={{
                fontSize: rv(10, 11, 12),
                fill: '#ffffff',
                opacity: 0.9,
              }}
            >
              {formatValue(step.value)}
              {showPercentage && i > 0 ? ` (${(ratio * 100).toFixed(0)}%)` : ''}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export type { FunnelStep }
