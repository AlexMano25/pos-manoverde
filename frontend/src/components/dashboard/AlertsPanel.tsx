import React from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import type { AlertItem } from '../../utils/dashboardComputations'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type AlertsPanelProps = {
  alerts: AlertItem[]
  title: string
}

// ---------------------------------------------------------------------------
// Severity color mapping
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<AlertItem['severity'], { dot: string; badge: string; badgeBg: string }> = {
  warning: { dot: '#f59e0b', badge: '#f59e0b', badgeBg: '#fffbeb' },
  danger:  { dot: '#dc2626', badge: '#dc2626', badgeBg: '#fef2f2' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, title }) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <AlertTriangle size={18} color="#f59e0b" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
          {title}
        </h3>
      </div>

      {/* Empty state */}
      {alerts.length === 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            borderRadius: 8,
          }}
        >
          <CheckCircle size={18} color="#16a34a" />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#16a34a' }}>
            Aucune alerte
          </span>
        </div>
      )}

      {/* Alert rows */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map((alert, idx) => {
            const colors = SEVERITY_COLORS[alert.severity]
            return (
              <div
                key={`${alert.type}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                }}
              >
                {/* Severity dot */}
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: colors.dot,
                    flexShrink: 0,
                  }}
                />

                {/* Message */}
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#1e293b',
                  }}
                >
                  {alert.message}
                </span>

                {/* Count badge */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 24,
                    height: 24,
                    padding: '0 8px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.badge,
                    backgroundColor: colors.badgeBg,
                    flexShrink: 0,
                  }}
                >
                  {alert.count}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AlertsPanel
