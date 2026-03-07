import { useState, useEffect, useMemo } from 'react'
import {
  Banknote,
  Plus,
  Minus,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  X,
  Check,
  Loader2,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useCashRegisterStore } from '../stores/cashRegisterStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { CashSession, CashMovementType, DenominationCount } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#059669',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
} as const

// ── Movement type config ─────────────────────────────────────────────────

const MOVEMENT_CONFIG: Record<CashMovementType, { color: string; bg: string; label: string; icon: 'in' | 'out' }> = {
  cash_in:    { color: '#16a34a', bg: '#f0fdf4', label: 'Cash In',    icon: 'in' },
  cash_out:   { color: '#dc2626', bg: '#fef2f2', label: 'Cash Out',   icon: 'out' },
  tip:        { color: '#059669', bg: '#ecfdf5', label: 'Tip',        icon: 'in' },
  petty_cash: { color: '#f59e0b', bg: '#fffbeb', label: 'Petty Cash', icon: 'out' },
  return:     { color: '#ef4444', bg: '#fef2f2', label: 'Return',     icon: 'out' },
}

// ── Denomination sets by currency ────────────────────────────────────────

function getDenominations(currency: string): number[] {
  switch (currency) {
    case 'XAF':
    case 'XOF':
      return [10000, 5000, 2000, 1000, 500, 100, 50, 25, 10, 5]
    case 'USD':
      return [100, 50, 20, 10, 5, 2, 1, 0.25, 0.10, 0.05, 0.01]
    case 'EUR':
      return [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01]
    default:
      return [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01]
  }
}

// ── Component ────────────────────────────────────────────────────────────

export default function CashRegisterPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    sessions,
    currentSession,
    loading,
    loadSessions,
    openSession,
    closeSession,
    addMovement,
  } = useCashRegisterStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n
  const label = (t as Record<string, any>).cashRegister || {}
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: label.title || 'Cash Register',
    openRegister: label.openRegister || 'Open Register',
    closeRegister: label.closeRegister || 'Close Register',
    cashIn: label.cashIn || 'Cash In',
    cashOut: label.cashOut || 'Cash Out',
    openingFloat: label.openingFloat || 'Opening Float',
    closingCount: label.closingCount || 'Closing Count',
    denomination: label.denomination || 'Denomination',
    count: label.count || 'Count',
    total: label.total || 'Total',
    countedTotal: label.countedTotal || 'Counted Total',
    expectedCash: label.expectedCash || 'Expected Cash',
    discrepancy: label.discrepancy || 'Discrepancy',
    cashSales: label.cashSales || 'Cash Sales',
    cashInTotal: label.cashInTotal || 'Cash In',
    cashOutTotal: label.cashOutTotal || 'Cash Out',
    notes: label.notes || 'Notes',
    confirm: tCommon.confirm || 'Confirm',
    cancel: tCommon.cancel || 'Cancel',
    amount: label.amount || 'Amount',
    reason: label.reason || 'Reason',
    type: label.type || 'Type',
    movementType: label.movementType || 'Movement Type',
    addMovement: label.addMovement || 'Add Movement',
    noSessions: label.noSessions || 'No sessions yet',
    totalSessions: label.totalSessions || 'Total Sessions',
    lastClosed: label.lastClosed || 'Last Closed',
    sessionHistory: label.sessionHistory || 'Session History',
    movements: label.movements || 'Movements',
    noMovements: label.noMovements || 'No movements yet',
    zReport: label.zReport || 'Z Report',
    openedBy: label.openedBy || 'Opened by',
    closedAt: label.closedAt || 'Closed at',
    openedAt: label.openedAt || 'Opened at',
    summary: label.summary || 'Summary',
    movementsSummary: label.movementsSummary || 'Movements Summary',
    denominationBreakdown: label.denominationBreakdown || 'Denomination Breakdown',
    over: label.over || 'Over',
    short: label.short || 'Short',
    exact: label.exact || 'Exact',
    save: tCommon.save || 'Save',
    tip: label.tip || 'Tip',
    pettyCash: label.pettyCash || 'Petty Cash',
    return: label.return || 'Return',
  }

  // Local state
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showZReportModal, setShowZReportModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CashSession | null>(null)

  // Open session form
  const [openingFloat, setOpeningFloat] = useState<string>('')

  // Close session form
  const [denominationCounts, setDenominationCounts] = useState<Record<number, number>>({})
  const [closeNotes, setCloseNotes] = useState('')

  // Movement form
  const [movementType, setMovementType] = useState<CashMovementType>('cash_in')
  const [movementAmount, setMovementAmount] = useState<string>('')
  const [movementReason, setMovementReason] = useState('')

  // Saving states
  const [saving, setSaving] = useState(false)

  // ── Load data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    loadSessions(storeId)
  }, [storeId, loadSessions])

  // ── Computed values ────────────────────────────────────────────────────

  const closedSessions = useMemo(
    () => sessions.filter((s) => s.status === 'closed'),
    [sessions]
  )

  const lastClosedDate = useMemo(() => {
    const last = closedSessions[0]
    return last?.closed_at || null
  }, [closedSessions])

  // Live cash sales for current session
  const liveCashSales = useMemo(() => {
    if (!currentSession) return 0
    return currentSession.cash_sales_total || 0
  }, [currentSession])

  const movementTotals = useMemo(() => {
    if (!currentSession) return { cashIn: 0, cashOut: 0 }
    const movements = currentSession.cash_movements || []
    let cashIn = 0
    let cashOut = 0
    for (const m of movements) {
      if (m.type === 'cash_in' || m.type === 'tip') {
        cashIn += m.amount
      } else {
        cashOut += m.amount
      }
    }
    return { cashIn, cashOut }
  }, [currentSession])

  const expectedCash = useMemo(() => {
    if (!currentSession) return 0
    return currentSession.opening_float + liveCashSales + movementTotals.cashIn - movementTotals.cashOut
  }, [currentSession, liveCashSales, movementTotals])

  // Denomination totals for close modal
  const closingTotal = useMemo(() => {
    const denoms = getDenominations(currency)
    return denoms.reduce((sum, d) => sum + d * (denominationCounts[d] || 0), 0)
  }, [denominationCounts, currency])

  const closeDiscrepancy = useMemo(
    () => closingTotal - expectedCash,
    [closingTotal, expectedCash]
  )

  // ── Helpers ────────────────────────────────────────────────────────────

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const fc = (amount: number) => formatCurrency(amount, currency)

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleOpenSession = async () => {
    const floatVal = parseFloat(openingFloat) || 0
    if (floatVal < 0) return
    setSaving(true)
    try {
      await openSession(storeId, userId, userName, floatVal)
      setShowOpenModal(false)
      setOpeningFloat('')
    } catch (err) {
      console.error('[CashRegisterPage] Failed to open session:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCloseSession = async () => {
    if (!currentSession) return
    setSaving(true)
    try {
      const denoms = getDenominations(currency)
      const closingCountArr: DenominationCount[] = denoms
        .filter((d) => (denominationCounts[d] || 0) > 0)
        .map((d) => ({
          denomination: d,
          count: denominationCounts[d] || 0,
          total: d * (denominationCounts[d] || 0),
        }))
      await closeSession(currentSession.id, closingCountArr, closeNotes || undefined)
      setShowCloseModal(false)
      setDenominationCounts({})
      setCloseNotes('')
      // Reload sessions to refresh data
      await loadSessions(storeId)
    } catch (err) {
      console.error('[CashRegisterPage] Failed to close session:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddMovement = async () => {
    if (!currentSession) return
    const amtVal = parseFloat(movementAmount) || 0
    if (amtVal <= 0) return
    setSaving(true)
    try {
      await addMovement(currentSession.id, movementType, amtVal, movementReason, userId, userName)
      setShowMovementModal(false)
      setMovementAmount('')
      setMovementReason('')
      setMovementType('cash_in')
    } catch (err) {
      console.error('[CashRegisterPage] Failed to add movement:', err)
    } finally {
      setSaving(false)
    }
  }

  const openCloseModal = () => {
    setDenominationCounts({})
    setCloseNotes('')
    setShowCloseModal(true)
  }

  const openZReport = (session: CashSession) => {
    setSelectedSession(session)
    setShowZReportModal(true)
  }

  // ── Styles ─────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(12, 20, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 12 : 0,
    marginBottom: 20,
    padding: rv(16, 20, 24),
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    borderRadius: 16,
    color: '#ffffff',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 24, 28),
    fontWeight: 700,
    margin: 0,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const statBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    marginRight: 8,
  }

  const bigBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 12,
    border: '2px solid rgba(255,255,255,0.4)',
    background: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backdropFilter: 'blur(4px)',
    whiteSpace: 'nowrap',
  }

  const statCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    padding: rv(14, 16, 20),
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  }

  const statGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: rv(10, 14, 16),
    marginBottom: 20,
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    padding: rv(14, 16, 20),
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  }

  const actionBtnStyle = (bg: string, clr: string): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: 12,
    border: 'none',
    backgroundColor: bg,
    color: clr,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'opacity 0.15s',
  })

  const formFieldStyle: React.CSSProperties = { marginBottom: 14 }
  const formLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    marginBottom: 5,
  }
  const formInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
  }
  const formTextareaStyle: React.CSSProperties = {
    ...formInputStyle,
    minHeight: 70,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  }

  const historyCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: rv(12, 14, 16),
    marginBottom: 10,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s',
  }

  const movementRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: `1px solid ${C.border}`,
  }

  const saveBtnStyle: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: C.primary,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const cancelBtnStyle: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    backgroundColor: 'transparent',
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 size={32} style={{ color: C.primary, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── RENDER: No session open ────────────────────────────────────────────

  if (!currentSession) {
    return (
      <div style={pageStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>
              <Banknote size={rv(22, 26, 30)} />
              {L.title}
            </h1>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <span style={statBadgeStyle}>
                {closedSessions.length} {L.totalSessions}
              </span>
              {lastClosedDate && (
                <span style={statBadgeStyle}>
                  {L.lastClosed}: {formatDate(lastClosedDate)}
                </span>
              )}
            </div>
          </div>
          <button
            style={bigBtnStyle}
            onClick={() => {
              setOpeningFloat('')
              setShowOpenModal(true)
            }}
          >
            <DollarSign size={18} />
            {L.openRegister}
          </button>
        </div>

        {/* Session history */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: 16, fontWeight: 600, color: C.text }}>
            {L.sessionHistory}
          </h3>

          {closedSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textSecondary }}>
              <Banknote size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15 }}>{L.noSessions}</p>
            </div>
          ) : (
            closedSessions.map((session) => (
              <div
                key={session.id}
                style={historyCardStyle}
                onClick={() => openZReport(session)}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                      {session.user_name || '-'}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                      {formatDateTime(session.opened_at)} &rarr; {formatTime(session.closed_at)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                      {fc(session.closing_total)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          session.discrepancy === 0
                            ? C.success
                            : session.discrepancy > 0
                              ? C.warning
                              : C.danger,
                        marginTop: 2,
                      }}
                    >
                      {session.discrepancy === 0
                        ? L.exact
                        : session.discrepancy > 0
                          ? `+${fc(session.discrepancy)} ${L.over}`
                          : `${fc(session.discrepancy)} ${L.short}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: C.textSecondary }}>
                  <span>{L.openingFloat}: {fc(session.opening_float)}</span>
                  <span>{L.cashSales}: {fc(session.cash_sales_total)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Open Session Modal */}
        <Modal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} title={L.openRegister}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.openingFloat}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              style={formInputStyle}
              placeholder="0"
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button style={cancelBtnStyle} onClick={() => setShowOpenModal(false)}>
              {L.cancel}
            </button>
            <button style={saveBtnStyle} onClick={handleOpenSession} disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
              {L.confirm}
            </button>
          </div>
        </Modal>

        {/* Z Report Modal */}
        {selectedSession && (
          <Modal
            isOpen={showZReportModal}
            onClose={() => { setShowZReportModal(false); setSelectedSession(null) }}
            title={L.zReport}
            size="lg"
          >
            <ZReportContent session={selectedSession} fc={fc} L={L} C={C} formatDateTime={formatDateTime} />
          </Modal>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── RENDER: Session is open ────────────────────────────────────────────

  const movements = currentSession.cash_movements || []

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <Banknote size={rv(22, 26, 30)} />
            {L.title}
          </h1>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <span style={statBadgeStyle}>
              <Clock size={12} style={{ marginRight: 4 }} />
              {L.openedAt}: {formatTime(currentSession.opened_at)}
            </span>
            <span style={statBadgeStyle}>
              {L.openedBy}: {currentSession.user_name || '-'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            style={actionBtnStyle('#f0fdf4', '#16a34a')}
            onClick={() => {
              setMovementType('cash_in')
              setMovementAmount('')
              setMovementReason('')
              setShowMovementModal(true)
            }}
          >
            <Plus size={16} />
            {L.cashIn}
          </button>
          <button
            style={actionBtnStyle('#fef2f2', '#dc2626')}
            onClick={() => {
              setMovementType('cash_out')
              setMovementAmount('')
              setMovementReason('')
              setShowMovementModal(true)
            }}
          >
            <Minus size={16} />
            {L.cashOut}
          </button>
          <button style={bigBtnStyle} onClick={openCloseModal}>
            <X size={16} />
            {L.closeRegister}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={statGridStyle}>
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color={C.primary} />
            </div>
            <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>{L.openingFloat}</span>
          </div>
          <div style={{ fontSize: rv(18, 20, 22), fontWeight: 700, color: C.text, marginTop: 4 }}>
            {fc(currentSession.opening_float)}
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color={C.success} />
            </div>
            <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>{L.cashSales}</span>
          </div>
          <div style={{ fontSize: rv(18, 20, 22), fontWeight: 700, color: C.success, marginTop: 4 }}>
            {fc(liveCashSales)}
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownCircle size={18} color={C.primary} />
            </div>
            <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>{L.cashInTotal}</span>
          </div>
          <div style={{ fontSize: rv(18, 20, 22), fontWeight: 700, color: C.primary, marginTop: 4 }}>
            {fc(movementTotals.cashIn)}
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={18} color={C.warning} />
            </div>
            <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>{L.expectedCash}</span>
          </div>
          <div style={{ fontSize: rv(18, 20, 22), fontWeight: 700, color: C.text, marginTop: 4 }}>
            {fc(expectedCash)}
          </div>
        </div>
      </div>

      {/* Movements list */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: 16, fontWeight: 600, color: C.text }}>
          {L.movements}
        </h3>

        {movements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: C.textSecondary }}>
            <ArrowUpCircle size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 14 }}>{L.noMovements}</p>
          </div>
        ) : (
          <div>
            {movements.map((m) => {
              const cfg = MOVEMENT_CONFIG[m.type]
              return (
                <div key={m.id} style={movementRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: cfg.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cfg.icon === 'in' ? (
                        <ArrowDownCircle size={16} color={cfg.color} />
                      ) : (
                        <ArrowUpCircle size={16} color={cfg.color} />
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 8,
                            backgroundColor: cfg.bg,
                            color: cfg.color,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      {m.reason && (
                        <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                          {m.reason}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                        {m.user_name} &middot; {formatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: cfg.icon === 'in' ? C.success : C.danger,
                    }}
                  >
                    {cfg.icon === 'in' ? '+' : '-'}{fc(m.amount)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Movement Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        title={L.addMovement}
      >
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.movementType}</label>
          <select
            value={movementType}
            onChange={(e) => setMovementType(e.target.value as CashMovementType)}
            style={formInputStyle}
          >
            <option value="cash_in">{L.cashIn}</option>
            <option value="cash_out">{L.cashOut}</option>
            <option value="tip">{L.tip}</option>
            <option value="petty_cash">{L.pettyCash}</option>
            <option value="return">{L.return}</option>
          </select>
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.amount}</label>
          <input
            type="number"
            min="0"
            step="any"
            value={movementAmount}
            onChange={(e) => setMovementAmount(e.target.value)}
            style={formInputStyle}
            placeholder="0"
          />
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.reason}</label>
          <input
            type="text"
            value={movementReason}
            onChange={(e) => setMovementReason(e.target.value)}
            style={formInputStyle}
            placeholder={L.reason}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button style={cancelBtnStyle} onClick={() => setShowMovementModal(false)}>
            {L.cancel}
          </button>
          <button
            style={saveBtnStyle}
            onClick={handleAddMovement}
            disabled={saving || !(parseFloat(movementAmount) > 0)}
          >
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
            {L.confirm}
          </button>
        </div>
      </Modal>

      {/* ── Close Session Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title={L.closeRegister}
        size="lg"
      >
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 600, color: C.text }}>
            {L.closingCount}
          </h4>

          {/* Denomination grid */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderBottom: `2px solid ${C.border}`,
                      color: C.textSecondary,
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {L.denomination}
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '8px 12px',
                      borderBottom: `2px solid ${C.border}`,
                      color: C.textSecondary,
                      fontWeight: 600,
                      fontSize: 12,
                      width: 100,
                    }}
                  >
                    {L.count}
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '8px 12px',
                      borderBottom: `2px solid ${C.border}`,
                      color: C.textSecondary,
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {L.total}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getDenominations(currency).map((denom) => {
                  const cnt = denominationCounts[denom] || 0
                  const rowTotal = denom * cnt
                  return (
                    <tr key={denom}>
                      <td
                        style={{
                          padding: '6px 12px',
                          borderBottom: `1px solid ${C.border}`,
                          fontWeight: 600,
                          color: C.text,
                        }}
                      >
                        {fc(denom)}
                      </td>
                      <td
                        style={{
                          padding: '4px 12px',
                          borderBottom: `1px solid ${C.border}`,
                          textAlign: 'center',
                        }}
                      >
                        <input
                          type="number"
                          min="0"
                          value={cnt || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0
                            setDenominationCounts((prev) => ({ ...prev, [denom]: val }))
                          }}
                          style={{
                            width: 70,
                            padding: '5px 8px',
                            borderRadius: 8,
                            border: `1px solid ${C.border}`,
                            fontSize: 14,
                            textAlign: 'center',
                            color: C.text,
                            outline: 'none',
                          }}
                        />
                      </td>
                      <td
                        style={{
                          padding: '6px 12px',
                          borderBottom: `1px solid ${C.border}`,
                          textAlign: 'right',
                          fontWeight: 500,
                          color: rowTotal > 0 ? C.text : C.textSecondary,
                        }}
                      >
                        {fc(rowTotal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals comparison */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: C.textSecondary }}>{L.countedTotal}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{fc(closingTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: C.textSecondary }}>{L.expectedCash}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{fc(expectedCash)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTop: `2px solid ${C.border}`,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: closeDiscrepancy === 0 ? C.success : C.danger,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {closeDiscrepancy !== 0 && <AlertTriangle size={14} />}
              {L.discrepancy}
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: closeDiscrepancy === 0 ? C.success : closeDiscrepancy > 0 ? C.warning : C.danger,
              }}
            >
              {closeDiscrepancy > 0 ? '+' : ''}{fc(closeDiscrepancy)}
              <span style={{ fontSize: 11, marginLeft: 6, fontWeight: 500 }}>
                {closeDiscrepancy === 0 ? L.exact : closeDiscrepancy > 0 ? L.over : L.short}
              </span>
            </span>
          </div>
        </div>

        {/* Notes */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.notes}</label>
          <textarea
            value={closeNotes}
            onChange={(e) => setCloseNotes(e.target.value)}
            style={formTextareaStyle}
            placeholder={L.notes}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button style={cancelBtnStyle} onClick={() => setShowCloseModal(false)}>
            {L.cancel}
          </button>
          <button style={saveBtnStyle} onClick={handleCloseSession} disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
            {L.closeRegister}
          </button>
        </div>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Z Report Content Component ───────────────────────────────────────────

function ZReportContent({
  session,
  fc,
  L,
  C: colors,
  formatDateTime,
}: {
  session: CashSession
  fc: (amount: number) => string
  L: Record<string, string>
  C: typeof C
  formatDateTime: (dateStr: string | undefined) => string
}) {
  const movements = session.cash_movements || []
  const movementIn = movements.filter((m) => m.type === 'cash_in' || m.type === 'tip')
  const movementOut = movements.filter((m) => m.type === 'cash_out' || m.type === 'petty_cash' || m.type === 'return')
  const totalIn = movementIn.reduce((s, m) => s + m.amount, 0)
  const totalOut = movementOut.reduce((s, m) => s + m.amount, 0)

  const sectionStyle: React.CSSProperties = {
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: 14,
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  return (
    <div>
      {/* Header info */}
      <div style={{ marginBottom: 16 }}>
        <div style={rowStyle}>
          <span style={{ color: colors.textSecondary }}>{L.openedBy}</span>
          <span style={{ fontWeight: 600, color: colors.text }}>{session.user_name || '-'}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: colors.textSecondary }}>{L.openedAt}</span>
          <span style={{ fontWeight: 500, color: colors.text }}>{formatDateTime(session.opened_at)}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: colors.textSecondary }}>{L.closedAt}</span>
          <span style={{ fontWeight: 500, color: colors.text }}>{formatDateTime(session.closed_at)}</span>
        </div>
      </div>

      {/* Summary */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <FileText size={14} />
          {L.summary}
        </div>
        <div style={rowStyle}>
          <span style={{ color: colors.textSecondary }}>{L.openingFloat}</span>
          <span style={{ fontWeight: 600, color: colors.text }}>{fc(session.opening_float)}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: colors.textSecondary }}>{L.cashSales}</span>
          <span style={{ fontWeight: 600, color: colors.success }}>{fc(session.cash_sales_total)}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: colors.textSecondary }}>{L.cashInTotal}</span>
          <span style={{ fontWeight: 600, color: colors.success }}>+{fc(totalIn)}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: colors.textSecondary }}>{L.cashOutTotal}</span>
          <span style={{ fontWeight: 600, color: colors.danger }}>-{fc(totalOut)}</span>
        </div>
        <div style={{ ...rowStyle, paddingTop: 8, borderTop: `1px solid ${colors.border}` }}>
          <span style={{ fontWeight: 600, color: colors.text }}>{L.expectedCash}</span>
          <span style={{ fontWeight: 700, color: colors.text }}>{fc(session.expected_cash)}</span>
        </div>
      </div>

      {/* Movements breakdown */}
      {movements.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <ArrowDownCircle size={14} />
            {L.movementsSummary}
          </div>
          {movements.map((m) => {
            const cfg = MOVEMENT_CONFIG[m.type]
            return (
              <div key={m.id} style={{ ...rowStyle, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 8,
                      backgroundColor: cfg.bg,
                      color: cfg.color,
                    }}
                  >
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textSecondary }}>
                    {m.reason || '-'}
                  </span>
                </div>
                <span
                  style={{
                    fontWeight: 600,
                    color: cfg.icon === 'in' ? colors.success : colors.danger,
                  }}
                >
                  {cfg.icon === 'in' ? '+' : '-'}{fc(m.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Denomination breakdown */}
      {session.closing_count && session.closing_count.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <Banknote size={14} />
            {L.denominationBreakdown}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 0', color: colors.textSecondary, fontWeight: 500 }}>
                  {L.denomination}
                </th>
                <th style={{ textAlign: 'center', padding: '4px 0', color: colors.textSecondary, fontWeight: 500 }}>
                  {L.count}
                </th>
                <th style={{ textAlign: 'right', padding: '4px 0', color: colors.textSecondary, fontWeight: 500 }}>
                  {L.total}
                </th>
              </tr>
            </thead>
            <tbody>
              {session.closing_count.map((d) => (
                <tr key={d.denomination}>
                  <td style={{ padding: '3px 0', color: colors.text }}>{fc(d.denomination)}</td>
                  <td style={{ padding: '3px 0', textAlign: 'center', color: colors.text }}>{d.count}</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, color: colors.text }}>{fc(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Closing total & discrepancy */}
      <div
        style={{
          padding: 14,
          borderRadius: 12,
          backgroundColor:
            session.discrepancy === 0 ? '#f0fdf4' : session.discrepancy > 0 ? '#fffbeb' : '#fef2f2',
        }}
      >
        <div style={rowStyle}>
          <span style={{ fontWeight: 600, color: colors.text }}>{L.countedTotal}</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>{fc(session.closing_total)}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ fontWeight: 600, color: colors.text }}>{L.expectedCash}</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>{fc(session.expected_cash)}</span>
        </div>
        <div
          style={{
            ...rowStyle,
            paddingTop: 8,
            borderTop: `1px solid ${colors.border}`,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              color: session.discrepancy === 0 ? colors.success : colors.danger,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {session.discrepancy !== 0 && <AlertTriangle size={14} />}
            {L.discrepancy}
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              color: session.discrepancy === 0 ? colors.success : session.discrepancy > 0 ? colors.warning : colors.danger,
            }}
          >
            {session.discrepancy > 0 ? '+' : ''}{fc(session.discrepancy)}
            <span style={{ fontSize: 11, marginLeft: 6, fontWeight: 500 }}>
              {session.discrepancy === 0 ? L.exact : session.discrepancy > 0 ? L.over : L.short}
            </span>
          </span>
        </div>
      </div>

      {/* Notes */}
      {session.notes && (
        <div style={{ marginTop: 14, fontSize: 13, color: colors.textSecondary }}>
          <strong>{L.notes}:</strong> {session.notes}
        </div>
      )}
    </div>
  )
}
