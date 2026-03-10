/**
 * ScatterChart — SVG scatter plot for correlation analysis
 * E.g., Price vs Units Sold, Discount % vs Revenue
 */
import { useResponsive } from '../../hooks/useLayoutMode'

const C = {
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
}

interface ScatterPoint {
  x: number
  y: number
  label?: string
  color?: string
  size?: number
}

interface Props {
  points: ScatterPoint[]
  width?: number
  height?: number
  xLabel?: string
  yLabel?: string
  color?: string
  showTrendLine?: boolean
}

export default function ScatterChart({
  points,
  width: propWidth,
  height: propHeight,
  xLabel = 'X',
  yLabel = 'Y',
  color = '#3b82f6',
  showTrendLine = false,
}: Props) {
  const { rv } = useResponsive()

  if (points.length === 0) return null

  const width = propWidth || rv(280, 360, 440)
  const height = propHeight || rv(200, 240, 260)
  const pad = { top: 10, right: 10, bottom: 30, left: 50 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  const xValues = points.map(p => p.x)
  const yValues = points.map(p => p.y)
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const yMin = Math.min(...yValues)
  const yMax = Math.max(...yValues)
  const xRange = xMax - xMin || 1
  const yRange = yMax - yMin || 1

  const scaleX = (v: number) => pad.left + ((v - xMin) / xRange) * plotW
  const scaleY = (v: number) => pad.top + plotH - ((v - yMin) / yRange) * plotH

  // Simple linear regression for trend line
  let trendLine = null
  if (showTrendLine && points.length >= 3) {
    const n = points.length
    const sumX = xValues.reduce((a, b) => a + b, 0)
    const sumY = yValues.reduce((a, b) => a + b, 0)
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
    const sumXX = xValues.reduce((s, x) => s + x * x, 0)
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    trendLine = {
      x1: scaleX(xMin),
      y1: scaleY(slope * xMin + intercept),
      x2: scaleX(xMax),
      y2: scaleY(slope * xMax + intercept),
    }
  }

  // Axis ticks (5 ticks each)
  const xTicks = Array.from({ length: 5 }, (_, i) => xMin + (xRange * i) / 4)
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (yRange * i) / 4)

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* Grid lines */}
      {yTicks.map((v, i) => (
        <line
          key={`gy${i}`}
          x1={pad.left}
          y1={scaleY(v)}
          x2={width - pad.right}
          y2={scaleY(v)}
          stroke={C.border}
          strokeWidth={0.5}
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((v, i) => (
        <text
          key={`yl${i}`}
          x={pad.left - 6}
          y={scaleY(v) + 3}
          textAnchor="end"
          style={{ fontSize: 9, fill: C.textSecondary }}
        >
          {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
        </text>
      ))}

      {/* X-axis labels */}
      {xTicks.map((v, i) => (
        <text
          key={`xl${i}`}
          x={scaleX(v)}
          y={height - pad.bottom + 14}
          textAnchor="middle"
          style={{ fontSize: 9, fill: C.textSecondary }}
        >
          {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
        </text>
      ))}

      {/* Axis labels */}
      <text
        x={pad.left + plotW / 2}
        y={height - 2}
        textAnchor="middle"
        style={{ fontSize: 10, fill: C.text, fontWeight: 500 }}
      >
        {xLabel}
      </text>
      <text
        x={12}
        y={pad.top + plotH / 2}
        textAnchor="middle"
        transform={`rotate(-90, 12, ${pad.top + plotH / 2})`}
        style={{ fontSize: 10, fill: C.text, fontWeight: 500 }}
      >
        {yLabel}
      </text>

      {/* Trend line */}
      {trendLine && (
        <line
          x1={trendLine.x1}
          y1={trendLine.y1}
          x2={trendLine.x2}
          y2={trendLine.y2}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="4,3"
          opacity={0.5}
        />
      )}

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={scaleX(p.x)}
          cy={scaleY(p.y)}
          r={p.size || 4}
          fill={p.color || color}
          opacity={0.7}
          stroke="#fff"
          strokeWidth={1}
        >
          <title>{p.label || `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`}</title>
        </circle>
      ))}
    </svg>
  )
}

export type { ScatterPoint }
