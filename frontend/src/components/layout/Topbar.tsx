import React, { useEffect, useState } from 'react'
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Radio,
  Clock,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useSyncStore } from '../../stores/syncStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopbarProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const colors = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  background: '#f1f5f9',
  cardBg: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  white: '#ffffff',
} as const

// ---------------------------------------------------------------------------
// Connection status helpers
// ---------------------------------------------------------------------------

function connectionLabel(status: string): string {
  switch (status) {
    case 'online':
      return 'En ligne'
    case 'local-only':
      return 'Local'
    default:
      return 'Hors ligne'
  }
}

function connectionBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'online':
      return {
        backgroundColor: colors.successBg,
        color: colors.success,
        borderColor: colors.success,
      }
    case 'local-only':
      return {
        backgroundColor: '#fffbeb',
        color: colors.warning,
        borderColor: colors.warning,
      }
    default:
      return {
        backgroundColor: colors.dangerBg,
        color: colors.danger,
        borderColor: colors.danger,
      }
  }
}

function ConnectionIcon({ status }: { status: string }) {
  switch (status) {
    case 'online':
      return <Wifi size={14} />
    case 'local-only':
      return <Radio size={14} />
    default:
      return <WifiOff size={14} />
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Topbar: React.FC<TopbarProps> = ({ title, subtitle, children }) => {
  const { connectionStatus } = useAppStore()
  const { pendingCount, isSyncing, syncToServer } = useSyncStore()
  const [time, setTime] = useState(new Date())
  const [syncHover, setSyncHover] = useState(false)

  // ── Live clock ──────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formattedTime = time.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const formattedDate = time.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // ── Sync handler ────────────────────────────────────────────────────────
  const handleSync = () => {
    if (!isSyncing) {
      syncToServer()
    }
  }

  const badgeStyle = connectionBadgeStyle(connectionStatus)

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        backgroundColor: colors.cardBg,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        gap: 16,
        flexWrap: 'wrap',
        minHeight: 64,
      }}
    >
      {/* ── Left: Title & subtitle ────────────────────────────────────── */}
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: colors.textPrimary,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 13,
              color: colors.textSecondary,
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Right: actions area ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        {/* Custom action buttons from parent */}
        {children}

        {/* Connection status badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid',
            ...badgeStyle,
          }}
        >
          <ConnectionIcon status={connectionStatus} />
          <span>{connectionLabel(connectionStatus)}</span>
        </div>

        {/* Sync button with pending count */}
        <button
          onClick={handleSync}
          onMouseEnter={() => setSyncHover(true)}
          onMouseLeave={() => setSyncHover(false)}
          disabled={isSyncing}
          title={
            isSyncing
              ? 'Synchronisation en cours...'
              : pendingCount > 0
                ? `${pendingCount} en attente de sync`
                : 'Synchroniser'
          }
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            backgroundColor: syncHover ? colors.background : colors.white,
            cursor: isSyncing ? 'wait' : 'pointer',
            color: isSyncing ? colors.primary : colors.textSecondary,
            transition: 'background-color 0.15s',
          }}
        >
          <RefreshCw
            size={16}
            style={{
              animation: isSyncing ? 'spin 1s linear infinite' : 'none',
            }}
          />
          {/* Pending badge */}
          {pendingCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                backgroundColor: colors.warning,
                color: colors.white,
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: `2px solid ${colors.white}`,
              }}
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </button>

        {/* Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 12,
            borderLeft: `1px solid ${colors.border}`,
          }}
        >
          <Clock size={16} color={colors.textMuted} />
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.textPrimary,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.3,
              }}
            >
              {formattedTime}
            </div>
            <div
              style={{
                fontSize: 11,
                color: colors.textMuted,
                lineHeight: 1.2,
              }}
            >
              {formattedDate}
            </div>
          </div>
        </div>
      </div>

      {/* ── CSS keyframes for spinner ─────────────────────────────────── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  )
}

export default Topbar
