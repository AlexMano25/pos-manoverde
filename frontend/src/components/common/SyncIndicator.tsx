import React, { useCallback } from 'react'
import {
  Check,
  RefreshCw,
  CloudOff,
  AlertTriangle,
} from 'lucide-react'
import { useSyncStore } from '../../stores/syncStore'

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const colors = {
  primary: '#2563eb',
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  white: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
} as const

// ---------------------------------------------------------------------------
// Sync state derivation
// ---------------------------------------------------------------------------

type SyncState = 'synced' | 'syncing' | 'pending' | 'error'

function deriveSyncState(
  isSyncing: boolean,
  pendingCount: number,
  syncError: string | null
): SyncState {
  if (syncError) return 'error'
  if (isSyncing) return 'syncing'
  if (pendingCount > 0) return 'pending'
  return 'synced'
}

// ---------------------------------------------------------------------------
// Visual configuration per state
// ---------------------------------------------------------------------------

type SyncVisual = {
  icon: React.ElementType
  label: string
  color: string
  bg: string
  borderColor: string
  spinning: boolean
}

function syncVisual(
  state: SyncState,
  pendingCount: number,
  syncError: string | null
): SyncVisual {
  switch (state) {
    case 'synced':
      return {
        icon: Check,
        label: 'Synchronise',
        color: colors.success,
        bg: colors.successBg,
        borderColor: colors.success,
        spinning: false,
      }
    case 'syncing':
      return {
        icon: RefreshCw,
        label: 'Synchronisation...',
        color: colors.primary,
        bg: '#eff6ff',
        borderColor: colors.primary,
        spinning: true,
      }
    case 'pending':
      return {
        icon: CloudOff,
        label: `${pendingCount} en attente`,
        color: colors.warning,
        bg: colors.warningBg,
        borderColor: colors.warning,
        spinning: false,
      }
    case 'error':
      return {
        icon: AlertTriangle,
        label: syncError ?? 'Erreur de synchronisation',
        color: colors.danger,
        bg: colors.dangerBg,
        borderColor: colors.danger,
        spinning: false,
      }
  }
}

// ---------------------------------------------------------------------------
// Time formatter
// ---------------------------------------------------------------------------

function formatLastSync(isoString: string | null): string | null {
  if (!isoString) return null
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SyncIndicator: React.FC = () => {
  const { pendingCount, lastSyncAt, isSyncing, syncError, syncToServer } =
    useSyncStore()

  const state = deriveSyncState(isSyncing, pendingCount, syncError)
  const visual = syncVisual(state, pendingCount, syncError)
  const Icon = visual.icon
  const lastSyncFormatted = formatLastSync(lastSyncAt)

  const handleClick = useCallback(() => {
    if (!isSyncing) {
      syncToServer()
    }
  }, [isSyncing, syncToServer])

  return (
    <button
      onClick={handleClick}
      disabled={isSyncing}
      title={
        isSyncing
          ? 'Synchronisation en cours...'
          : 'Cliquer pour synchroniser'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 20,
        border: `1px solid ${visual.borderColor}`,
        backgroundColor: visual.bg,
        color: visual.color,
        fontSize: 13,
        fontWeight: 600,
        cursor: isSyncing ? 'wait' : 'pointer',
        transition: 'box-shadow 0.15s, opacity 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        lineHeight: 1.3,
      }}
      onMouseEnter={(e) => {
        if (!isSyncing) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
      }}
    >
      <Icon
        size={15}
        style={{
          animation: visual.spinning ? 'spin 1s linear infinite' : 'none',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {visual.label}
      </span>
      {lastSyncFormatted && state !== 'syncing' && (
        <span
          style={{
            fontSize: 11,
            color: colors.textSecondary,
            fontWeight: 400,
            marginLeft: 2,
          }}
        >
          {lastSyncFormatted}
        </span>
      )}

      {/* CSS keyframes for spinning */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}

export default SyncIndicator
