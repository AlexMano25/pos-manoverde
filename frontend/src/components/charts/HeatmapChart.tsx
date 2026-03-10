/**
 * HeatmapChart — 7×24 grid showing intensity by day/hour
 * Used for analyzing sales patterns across week & time of day
 */
import { useResponsive } from '../../hooks/useLayoutMode'

const C = {
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
}

interface HeatmapCell {
  day: number      // 0=Sun..6=Sat
  hour: number     // 0..23
  value: number
}

interface Props {
  data: HeatmapCell[]
  dayLabels?: string[]
  colorScale?: string[]   // gradient colors, e.g. ['#f1f5f9', '#2563eb']
  title?: string
}

function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex = (c: string) => parseInt(c, 16)
  const r1 = hex(color1.slice(1, 3))
  const g1 = hex(color1.slice(3, 5))
  const b1 = hex(color1.slice(5, 7))
  const r2 = hex(color2.slice(1, 3))
  const g2 = hex(color2.slice(3, 5))
  const b2 = hex(color2.slice(5, 7))
  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)
  return `rgb(${r},${g},${b})`
}

export default function HeatmapChart({
  data,
  dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  colorScale = ['#f1f5f9', '#bfdbfe', '#3b82f6', '#1d4ed8'],
  title,
}: Props) {
  const { rv } = useResponsive()

  // Build 7×24 grid
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  let maxVal = 1
  for (const cell of data) {
    if (cell.day >= 0 && cell.day < 7 && cell.hour >= 0 && cell.hour < 24) {
      grid[cell.day][cell.hour] = cell.value
      if (cell.value > maxVal) maxVal = cell.value
    }
  }

  const cellSize = rv(12, 16, 20)
  const labelWidth = rv(28, 36, 44)
  const svgWidth = labelWidth + cellSize * 24 + 4
  const svgHeight = 20 + cellSize * 7 + 4

  function getCellColor(value: number): string {
    if (value === 0) return colorScale[0]
    const ratio = value / maxVal
    if (ratio < 0.33) return interpolateColor(colorScale[0], colorScale[1], ratio / 0.33)
    if (ratio < 0.66) return interpolateColor(colorScale[1], colorScale[2], (ratio - 0.33) / 0.33)
    return interpolateColor(colorScale[2], colorScale[3] || colorScale[2], (ratio - 0.66) / 0.34)
  }

  return (
    <div>
      {title && (
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>
          {title}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
          {/* Hour labels */}
          {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
            <text
              key={`h${h}`}
              x={labelWidth + h * cellSize + cellSize / 2}
              y={12}
              textAnchor="middle"
              style={{ fontSize: rv(8, 9, 10), fill: C.textSecondary }}
            >
              {`${h}h`}
            </text>
          ))}

          {/* Grid rows */}
          {grid.map((row, dayIdx) => (
            <g key={dayIdx}>
              {/* Day label */}
              <text
                x={labelWidth - 4}
                y={20 + dayIdx * cellSize + cellSize / 2 + 3}
                textAnchor="end"
                style={{ fontSize: rv(9, 10, 11), fill: C.textSecondary, fontWeight: 500 }}
              >
                {dayLabels[dayIdx]}
              </text>

              {/* Cells */}
              {row.map((val, hourIdx) => (
                <rect
                  key={hourIdx}
                  x={labelWidth + hourIdx * cellSize}
                  y={20 + dayIdx * cellSize}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  rx={2}
                  fill={getCellColor(val)}
                  stroke={C.border}
                  strokeWidth={0.5}
                >
                  <title>
                    {dayLabels[dayIdx]} {hourIdx}h: {val.toFixed(0)}
                  </title>
                </rect>
              ))}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        fontSize: rv(9, 10, 11),
        color: C.textSecondary,
      }}>
        <span>0</span>
        <div style={{
          width: rv(60, 80, 100),
          height: 8,
          borderRadius: 4,
          background: `linear-gradient(to right, ${colorScale.join(', ')})`,
        }} />
        <span>{maxVal.toFixed(0)}</span>
      </div>
    </div>
  )
}

export type { HeatmapCell }
