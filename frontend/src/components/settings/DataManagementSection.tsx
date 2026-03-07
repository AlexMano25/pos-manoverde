import React, { useState } from 'react'
import { Trash2, Calendar, RotateCcw, AlertTriangle, CheckCircle2, Lock, X } from 'lucide-react'
import { useOrderStore } from '../../stores/orderStore'
import { useAppStore } from '../../stores/appStore'
import { useAuthStore } from '../../stores/authStore'
import { useLanguageStore } from '../../stores/languageStore'
import { useResponsive } from '../../hooks/useLayoutMode'

// ── Colors ─────────────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
} as const

// ── Types ──────────────────────────────────────────────────────────────────

type ClearAction = 'all' | 'byDate' | 'today' | null

// ── Component ──────────────────────────────────────────────────────────────

export default function DataManagementSection() {
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const { currentStore } = useAppStore()
  const { user } = useAuthStore()
  const { clearOrders, orders } = useOrderStore()

  const [activeAction, setActiveAction] = useState<ClearAction>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [result, setResult] = useState<{ count: number } | null>(null)
  const [processing, setProcessing] = useState(false)

  // Only show for admin in server / all_in_one mode
  const mode = useAppStore((s) => s.mode)
  if (user?.role !== 'admin' || mode === 'client') return null

  const todayStr = new Date().toISOString().slice(0, 10)
  const totalOrders = orders.length
  const todayOrders = orders.filter((o) => o.created_at.slice(0, 10) === todayStr).length

  const handleAction = (action: ClearAction) => {
    setActiveAction(action)
    setPinInput('')
    setPinError(false)
    setDateFrom('')
    setDateTo('')
    setResult(null)
  }

  const handleConfirm = async () => {
    if (!currentStore || !user) return

    // Verify PIN
    if (pinInput !== user.pin) {
      setPinError(true)
      return
    }

    setPinError(false)
    setProcessing(true)

    try {
      let count = 0

      if (activeAction === 'all') {
        count = await clearOrders(currentStore.id)
      } else if (activeAction === 'byDate') {
        count = await clearOrders(currentStore.id, {
          from: dateFrom || undefined,
          to: dateTo || undefined,
        })
      } else if (activeAction === 'today') {
        count = await clearOrders(currentStore.id, {
          from: todayStr,
          to: todayStr,
        })
      }

      setResult({ count })
      setTimeout(() => {
        setActiveAction(null)
        setResult(null)
      }, 3000)
    } catch (err) {
      console.error('Clear orders failed:', err)
    } finally {
      setProcessing(false)
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const sectionCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: rv(16, 20, 24),
    marginBottom: rv(14, 18, 20),
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  }

  const sectionIconStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.danger + '15',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: C.text,
    margin: 0,
  }

  const sectionDescStyle: React.CSSProperties = {
    fontSize: 13,
    color: C.textSecondary,
    margin: 0,
  }

  const actionBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 8,
    border: `1px solid ${C.danger}30`,
    backgroundColor: C.danger + '08',
    color: C.danger,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    width: isMobile ? '100%' : 'auto',
    justifyContent: isMobile ? 'center' : 'flex-start',
  }

  const actionContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    flexDirection: isMobile ? 'column' : 'row',
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: 16,
  }

  const modalStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: rv(20, 24, 28),
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${pinError ? C.danger : C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
    textAlign: 'center',
    letterSpacing: 8,
    fontFamily: 'monospace',
    fontWeight: 700,
  }

  const dateInputStyle: React.CSSProperties = {
    ...inputStyle,
    textAlign: 'left',
    letterSpacing: 'normal',
    fontFamily: 'inherit',
    fontWeight: 400,
  }

  const confirmBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.danger,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: processing ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    justifyContent: 'center',
    opacity: processing ? 0.7 : 1,
  }

  const cancelBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    backgroundColor: C.card,
    color: C.text,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    justifyContent: 'center',
  }

  const infoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 8,
    backgroundColor: C.warning + '10',
    color: '#92400e',
    fontSize: 12,
    marginTop: 10,
  }

  // ── Modal title based on action ──────────────────────────────────────────

  const getActionLabel = () => {
    if (activeAction === 'all') return t.settings.clearAllOrders
    if (activeAction === 'byDate') return t.settings.clearByDate
    if (activeAction === 'today') return t.settings.resetDailySales
    return ''
  }

  return (
    <div style={sectionCardStyle}>
      <div style={sectionHeaderStyle}>
        <div style={sectionIconStyle}>
          <Trash2 size={18} color={C.danger} />
        </div>
        <div>
          <h3 style={sectionTitleStyle}>{t.settings.dataManagement}</h3>
          <p style={sectionDescStyle}>{t.settings.dataManagementDesc}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{
          padding: '8px 14px',
          borderRadius: 8,
          backgroundColor: C.bg,
          fontSize: 13,
        }}>
          <span style={{ color: C.textSecondary }}>Total : </span>
          <span style={{ fontWeight: 600, color: C.text }}>{totalOrders}</span>
        </div>
        <div style={{
          padding: '8px 14px',
          borderRadius: 8,
          backgroundColor: C.bg,
          fontSize: 13,
        }}>
          <span style={{ color: C.textSecondary }}>{t.dashboard.today} : </span>
          <span style={{ fontWeight: 600, color: C.text }}>{todayOrders}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={actionContainerStyle}>
        <button style={actionBtnStyle} onClick={() => handleAction('all')}>
          <Trash2 size={15} />
          {t.settings.clearAllOrders}
        </button>
        <button style={actionBtnStyle} onClick={() => handleAction('byDate')}>
          <Calendar size={15} />
          {t.settings.clearByDate}
        </button>
        <button style={actionBtnStyle} onClick={() => handleAction('today')}>
          <RotateCcw size={15} />
          {t.settings.resetDailySales}
        </button>
      </div>

      <div style={infoStyle}>
        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
        <span>{t.settings.clearConfirmMessage}</span>
      </div>

      {/* ── Confirmation Modal ── */}
      {activeAction && (
        <div style={overlayStyle} onClick={() => !processing && setActiveAction(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.text }}>
                {t.settings.clearConfirmTitle}
              </h3>
              <button
                onClick={() => setActiveAction(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: C.textSecondary,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Success result */}
            {result ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '20px 0',
              }}>
                <CheckCircle2 size={48} color={C.success} />
                <p style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: C.text,
                  margin: 0,
                  textAlign: 'center',
                }}>
                  {t.settings.ordersCleared.replace('{count}', String(result.count))}
                </p>
              </div>
            ) : (
              <>
                {/* Action label */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: C.danger + '10',
                  color: C.danger,
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <AlertTriangle size={16} />
                  {getActionLabel()}
                </div>

                {/* Date range inputs (only for byDate) */}
                {activeAction === 'byDate' && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.text,
                        marginBottom: 4,
                      }}>
                        {t.settings.dateFrom}
                      </label>
                      <input
                        type="date"
                        style={dateInputStyle}
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        max={todayStr}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.text,
                        marginBottom: 4,
                      }}>
                        {t.settings.dateTo}
                      </label>
                      <input
                        type="date"
                        style={dateInputStyle}
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        max={todayStr}
                      />
                    </div>
                  </div>
                )}

                {/* PIN input */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.text,
                    marginBottom: 6,
                  }}>
                    <Lock size={14} />
                    {t.settings.enterPin}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    style={inputStyle}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, ''))
                      setPinError(false)
                    }}
                    placeholder="••••"
                    autoFocus
                  />
                  {pinError && (
                    <p style={{
                      fontSize: 12,
                      color: C.danger,
                      margin: '6px 0 0',
                      textAlign: 'center',
                    }}>
                      PIN incorrect
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
                  <button style={cancelBtnStyle} onClick={() => setActiveAction(null)} disabled={processing}>
                    {t.common.cancel}
                  </button>
                  <button
                    style={confirmBtnStyle}
                    onClick={handleConfirm}
                    disabled={processing || !pinInput}
                  >
                    <Trash2 size={15} />
                    {processing ? t.common.loading : t.common.confirm}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
