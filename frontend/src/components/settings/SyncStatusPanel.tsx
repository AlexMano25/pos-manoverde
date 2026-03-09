// ---------------------------------------------------------------------------
// SyncStatusPanel — Detailed sync status panel for Settings page
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react'
import { useSyncStore } from '../../stores/syncStore'
import type { FailedSyncEntry, SyncEntityCount } from '../../stores/syncStore'

type Props = {
  labels: {
    syncStatusPanel: string
    lastSync: string
    neverSynced: string
    pending: string
    failed: string
    retryAll: string
    retryOne: string
    clearFailed: string
    ordersSync: string
    productsSync: string
    stockMovesSync: string
    noFailedItems: string
    retryCount: string
  }
}

const C = {
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  primary: '#2563eb',
} as const

export default function SyncStatusPanel({ labels }: Props) {
  const {
    pendingCount,
    lastSyncAt,
    isSyncing,
    syncError,
    getFailedEntries,
    retryEntry,
    clearFailed,
    getPendingByEntity,
    syncToServer,
  } = useSyncStore()

  const [failedEntries, setFailedEntries] = useState<FailedSyncEntry[]>([])
  const [entityCounts, setEntityCounts] = useState<SyncEntityCount>({ orders: 0, products: 0, stock_moves: 0, users: 0 })
  const [retrying, setRetrying] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [failed, counts] = await Promise.all([
      getFailedEntries(),
      getPendingByEntity(),
    ])
    setFailedEntries(failed)
    setEntityCounts(counts)
  }, [getFailedEntries, getPendingByEntity])

  useEffect(() => {
    loadData()
  }, [loadData, pendingCount])

  const handleRetry = async (id: string) => {
    setRetrying(id)
    await retryEntry(id)
    await loadData()
    setRetrying(null)
  }

  const handleRetryAll = async () => {
    setRetrying('all')
    await syncToServer()
    await loadData()
    setRetrying(null)
  }

  const handleClearFailed = async () => {
    await clearFailed()
    await loadData()
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return labels.neverSynced
    const d = new Date(iso)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const totalPending = entityCounts.orders + entityCounts.products + entityCounts.stock_moves + entityCounts.users

  return (
    <div style={{
      background: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: 20,
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 16px 0' }}>
        {labels.syncStatusPanel}
      </h3>

      {/* Last sync info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        padding: '12px 16px',
        borderRadius: 10,
        background: '#f8fafc',
      }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: syncError ? C.danger : isSyncing ? C.warning : C.success,
          flexShrink: 0,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            {labels.lastSync}: {formatDate(lastSyncAt)}
          </div>
          {syncError && (
            <div style={{ fontSize: 12, color: C.danger, marginTop: 2 }}>
              {syncError}
            </div>
          )}
        </div>
        <button
          onClick={handleRetryAll}
          disabled={isSyncing || totalPending === 0}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: 'none',
            background: isSyncing ? '#94a3b8' : C.primary,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
          }}
        >
          {isSyncing ? '...' : labels.retryAll}
        </button>
      </div>

      {/* Entity breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10,
        marginBottom: 16,
      }}>
        {[
          { label: labels.ordersSync, count: entityCounts.orders, color: '#3b82f6' },
          { label: labels.productsSync, count: entityCounts.products, color: '#7c3aed' },
          { label: labels.stockMovesSync, count: entityCounts.stock_moves, color: '#f59e0b' },
        ].map((item, i) => (
          <div key={i} style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: item.count > 0 ? `${item.color}08` : '#fafafa',
          }}>
            <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 500, marginBottom: 2 }}>
              {item.label}
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              color: item.count > 0 ? item.color : C.textSecondary,
            }}>
              {item.count}
            </div>
            <div style={{ fontSize: 10, color: C.textSecondary }}>
              {labels.pending}
            </div>
          </div>
        ))}
      </div>

      {/* Failed entries */}
      {failedEntries.length > 0 ? (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.danger }}>
              {labels.failed} ({failedEntries.length})
            </div>
            <button
              onClick={handleClearFailed}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: `1px solid ${C.danger}40`,
                background: 'transparent',
                color: C.danger,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {labels.clearFailed}
            </button>
          </div>

          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {failedEntries.map(entry => (
              <div key={entry.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                marginBottom: 6,
                fontSize: 12,
              }}>
                <div style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#fef2f2',
                  color: C.danger,
                  fontWeight: 600,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}>
                  {entry.entity_type}
                </div>
                <div style={{ flex: 1, color: C.textSecondary }}>
                  {entry.operation} — {entry.entity_id.slice(0, 8)}...
                </div>
                <div style={{ color: C.warning, fontWeight: 600, fontSize: 11, flexShrink: 0 }}>
                  {labels.retryCount}: {entry.retries}
                </div>
                <button
                  onClick={() => handleRetry(entry.id)}
                  disabled={retrying === entry.id}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    border: `1px solid ${C.primary}40`,
                    background: 'transparent',
                    color: C.primary,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: retrying === entry.id ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {retrying === entry.id ? '...' : labels.retryOne}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          color: C.success,
          fontSize: 13,
          fontWeight: 500,
        }}>
          {labels.noFailedItems}
        </div>
      )}
    </div>
  )
}
