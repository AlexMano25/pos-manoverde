import React, { useEffect, useState } from 'react'
import { CreditCard, RefreshCw, ArrowUpCircle, ArrowDownCircle, Gift, RotateCcw, X, Check } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import PaymentMethodSelector, { RECHARGE_PACKAGES } from '../components/billing/PaymentMethodSelector'
import SubscriptionManager from '../components/billing/SubscriptionManager'
import { TICKET_PRICE_USD } from '../config/planLimits'
import type { CreditBalance, CreditTransaction, RechargePackage, PayPalResult } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#f59e0b',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
} as const

// ── Component ────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { currentStore, selectedPlan } = useAppStore()
  const { t, language } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [consumptionByActivity, setConsumptionByActivity] = useState<
    { activity: string; store_id: string | null; tickets: number; amount: number }[]
  >([])
  const [loading, setLoading] = useState(true)

  // Recharge modal state
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null)
  const [rechargeSuccess, setRechargeSuccess] = useState(false)
  const [rechargeError, setRechargeError] = useState('')

  // ── Locale-aware date formatting ────────────────────────────────────────

  const intlLocale =
    language === 'fr' ? 'fr-FR' :
    language === 'de' ? 'de-DE' :
    language === 'es' ? 'es-ES' :
    language === 'it' ? 'it-IT' :
    language === 'ar' ? 'ar-SA' :
    language === 'zh' ? 'zh-CN' :
    'en-US'

  function formatDateTime(iso: string): string {
    const d = new Date(iso)
    return (
      d.toLocaleDateString(intlLocale, { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })
    )
  }

  // ── Fetch billing data ──────────────────────────────────────────────────

  const orgId = currentStore?.organization_id

  const fetchBillingData = async () => {
    if (!isSupabaseConfigured || !supabase || !orgId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch credit balance
      const { data: balanceData } = await supabase
        .from('credit_balances')
        .select('*')
        .eq('organization_id', orgId)
        .single()

      if (balanceData) {
        setBalance(balanceData as CreditBalance)
      }

      // Fetch recent transactions (last 50)
      const { data: txData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (txData) {
        setTransactions(txData as CreditTransaction[])

        // Build consumption breakdown from deductions
        const deductions = (txData as CreditTransaction[]).filter(
          (tx) => tx.type === 'deduct'
        )
        const grouped: Record<string, { activity: string; store_id: string | null; tickets: number; amount: number }> = {}
        for (const tx of deductions) {
          const key = `${tx.activity || 'unknown'}-${tx.store_id || 'all'}`
          if (!grouped[key]) {
            grouped[key] = {
              activity: tx.activity || 'unknown',
              store_id: tx.store_id || null,
              tickets: 0,
              amount: 0,
            }
          }
          grouped[key].tickets += 1
          grouped[key].amount += Math.abs(tx.amount_usd)
        }
        setConsumptionByActivity(Object.values(grouped))
      }
    } catch (err) {
      console.error('[BillingPage] Failed to fetch billing data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingData()
  }, [orgId])

  // ── Payment success handlers ──────────────────────────────────────────

  const handlePayPalSuccess = async (result: PayPalResult) => {
    console.log('[BillingPage] PayPal success:', result)

    if (supabase && orgId && selectedPackage) {
      try {
        // Record credit load via RPC or direct insert
        const { error } = await supabase.from('credit_transactions').insert({
          organization_id: orgId,
          type: 'load',
          amount_usd: selectedPackage.amountUSD,
          description: `PayPal recharge - ${selectedPackage.id} (${result.orderId || result.subscriptionId || ''})`,
          reference_id: result.orderId || result.subscriptionId,
        })

        if (error) console.error('[BillingPage] Failed to record transaction:', error)

        // Update balance
        const { error: balError } = await supabase.rpc('add_credit', {
          p_organization_id: orgId,
          p_amount_usd: selectedPackage.amountUSD,
        })

        if (balError) console.error('[BillingPage] Failed to update balance:', balError)
      } catch (err) {
        console.error('[BillingPage] Post-payment processing error:', err)
      }
    }

    setRechargeSuccess(true)
    setRechargeError('')

    // Refresh billing data
    setTimeout(() => {
      fetchBillingData()
    }, 1000)
  }

  const handleOrangeMoneySuccess = async (transactionId: string) => {
    console.log('[BillingPage] Orange Money success:', transactionId)

    // The Edge Function should have already credited the balance
    // Just refresh the data
    setRechargeSuccess(true)
    setRechargeError('')

    setTimeout(() => {
      fetchBillingData()
    }, 1000)
  }

  const handlePaymentError = (error: string) => {
    console.error('[BillingPage] Payment error:', error)
    setRechargeError(error)
  }

  // ── Open / close recharge modal ───────────────────────────────────────

  const openRechargeModal = () => {
    setShowRechargeModal(true)
    setSelectedPackage(null)
    setRechargeSuccess(false)
    setRechargeError('')
  }

  const closeRechargeModal = () => {
    setShowRechargeModal(false)
    setSelectedPackage(null)
    setRechargeSuccess(false)
    setRechargeError('')
  }

  // ── Transaction type helpers ────────────────────────────────────────────

  const txTypeLabel = (type: CreditTransaction['type']): string => {
    switch (type) {
      case 'load':
        return t.billing.load
      case 'deduct':
        return t.billing.deduct
      case 'refund':
        return t.billing.refund
      case 'bonus':
        return t.billing.bonus
      default:
        return type
    }
  }

  const txTypeColor = (type: CreditTransaction['type']): string => {
    switch (type) {
      case 'load':
        return C.success
      case 'deduct':
        return C.danger
      case 'refund':
        return C.primary
      case 'bonus':
        return C.warning
      default:
        return C.textSecondary
    }
  }

  const txTypeIcon = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'load':
        return <ArrowUpCircle size={16} color={C.success} />
      case 'deduct':
        return <ArrowDownCircle size={16} color={C.danger} />
      case 'refund':
        return <RotateCcw size={16} color={C.primary} />
      case 'bonus':
        return <Gift size={16} color={C.warning} />
      default:
        return null
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(12, 20, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: 24,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 22, 24),
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: 14,
    color: C.textSecondary,
    margin: '4px 0 0',
  }

  const balanceCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: rv(16, 20, 24),
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: `1px solid ${C.border}`,
    marginBottom: rv(16, 20, 24),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    gap: 16,
  }

  const tableCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    marginBottom: rv(16, 20, 24),
  }

  const tableScrollStyle: React.CSSProperties = {
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  }

  const tableHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
  }

  const tableTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: C.text,
    margin: 0,
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `1px solid ${C.border}`,
    backgroundColor: '#f8fafc',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 14,
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
  }

  const badgeStyle = (bgColor: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    color: bgColor,
    backgroundColor: bgColor + '15',
  })

  const rechargeBtnStyle: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.primary,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 24px',
    color: C.textSecondary,
    fontSize: 14,
  }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textSecondary, fontSize: 16 }}>{t.common.loading}</p>
      </div>
    )
  }

  // ── No Supabase configured ─────────────────────────────────────────────

  if (!isSupabaseConfigured) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>{t.billing.title}</h1>
          <p style={subtitleStyle}>{t.billing.subtitle}</p>
        </div>
        <div style={{ ...tableCardStyle, padding: 40, textAlign: 'center' as const }}>
          <p style={{ color: C.textSecondary, fontSize: 14 }}>
            {t.billing.noBalance}
          </p>
        </div>
      </div>
    )
  }

  const ticketsRemaining = balance ? Math.floor(balance.balance_usd / TICKET_PRICE_USD) : 0

  const billing = t.billing

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>{billing.title}</h1>
        <p style={subtitleStyle}>{billing.subtitle}</p>
      </div>

      {/* Subscription Manager */}
      <SubscriptionManager />

      {/* Balance Card */}
      <div style={balanceCardStyle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: C.primary + '15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={24} color={C.primary} />
            </div>
            <div>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, fontWeight: 500 }}>
                {(billing as any).currentPlan || 'Plan actuel'}: <span style={{ fontWeight: 700, color: C.text, textTransform: 'capitalize' }}>{(selectedPlan || 'free').replace(/_/g, ' ')}</span>
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: C.text, margin: 0 }}>
                ${balance?.balance_usd?.toFixed(2) ?? '0.00'}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
            {ticketsRemaining.toLocaleString()} {billing.ticketsRemaining}
          </p>
        </div>
        <button style={rechargeBtnStyle} onClick={openRechargeModal}>
          <RefreshCw size={16} />
          {billing.recharge}
        </button>
      </div>

      {/* Consumption Breakdown */}
      <div style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <h3 style={tableTitleStyle}>{billing.consumption}</h3>
        </div>
        {consumptionByActivity.length === 0 ? (
          <div style={emptyStyle}>{billing.noTransactions}</div>
        ) : (
          <div style={tableScrollStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>{billing.activity}</th>
                  <th style={thStyle}>{billing.store}</th>
                  <th style={thStyle}>{billing.tickets}</th>
                  <th style={thStyle}>{billing.amount}</th>
                </tr>
              </thead>
              <tbody>
                {consumptionByActivity.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ ...tdStyle, fontWeight: 600, textTransform: 'capitalize' }}>
                      {row.activity}
                    </td>
                    <td style={tdStyle}>{row.store_id || '—'}</td>
                    <td style={tdStyle}>{row.tickets}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>${row.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <h3 style={tableTitleStyle}>{billing.transactions}</h3>
        </div>
        {transactions.length === 0 ? (
          <div style={emptyStyle}>{billing.noTransactions}</div>
        ) : (
          <div style={tableScrollStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>{billing.date}</th>
                  <th style={thStyle}>{billing.type}</th>
                  <th style={thStyle}>{billing.amount}</th>
                  <th style={thStyle}>{billing.description}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDateTime(tx.created_at)}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(txTypeColor(tx.type))}>
                        {txTypeIcon(tx.type)}
                        {txTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        color: tx.type === 'deduct' ? C.danger : C.success,
                      }}
                    >
                      {tx.type === 'deduct' ? '-' : '+'}${Math.abs(tx.amount_usd).toFixed(2)}
                    </td>
                    <td style={{ ...tdStyle, color: C.textSecondary }}>
                      {tx.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recharge Modal ─────────────────────────────────────────────── */}
      {showRechargeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRechargeModal()
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: isMobile ? 12 : 16,
              padding: rv(16, 24, 28),
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RefreshCw size={20} color="#ffffff" />
                </div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>
                  {billing.rechargeCredits}
                </h2>
              </div>
              <button
                onClick={closeRechargeModal}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, borderRadius: 8, display: 'flex',
                  color: C.textSecondary,
                }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ height: 1, backgroundColor: C.border, marginBottom: 20 }} />

            {/* Success state */}
            {rechargeSuccess ? (
              <div style={{
                textAlign: 'center', padding: '32px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  backgroundColor: '#f0fdf4', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={28} color={C.success} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: C.success, margin: 0 }}>
                  {billing.paymentSuccess}
                </p>
                <button
                  onClick={closeRechargeModal}
                  style={{
                    marginTop: 12, padding: '10px 24px', borderRadius: 8,
                    border: 'none', backgroundColor: C.primary, color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {t.common.close}
                </button>
              </div>
            ) : (
              <>
                {/* Error message */}
                {rechargeError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8,
                    backgroundColor: '#fef2f2', color: C.danger,
                    fontSize: 13, marginBottom: 16, textAlign: 'center',
                  }}>
                    {rechargeError}
                  </div>
                )}

                {/* Package selection */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 10 }}>
                    {billing.selectAmount}
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                  }}>
                    {RECHARGE_PACKAGES.map((pkg) => {
                      const isSelected = selectedPackage?.id === pkg.id
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => {
                            setSelectedPackage(pkg)
                            setRechargeError('')
                          }}
                          style={{
                            padding: '14px 12px',
                            borderRadius: 10,
                            border: `2px solid ${isSelected ? C.primary : C.border}`,
                            backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s',
                          }}
                        >
                          <p style={{
                            margin: 0, fontSize: 13, fontWeight: 600,
                            color: isSelected ? C.primary : C.textSecondary,
                          }}>
                            {(billing as Record<string, string>)[pkg.label] || pkg.id}
                          </p>
                          <p style={{
                            margin: '4px 0 2px', fontSize: 18, fontWeight: 700,
                            color: isSelected ? C.primary : C.text,
                          }}>
                            {pkg.amountXAF.toLocaleString()} XAF
                          </p>
                          <p style={{
                            margin: 0, fontSize: 11,
                            color: isSelected ? C.primary : C.textSecondary,
                          }}>
                            ~${pkg.amountUSD} · {pkg.tickets.toLocaleString()} tickets
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Payment method selector (only if package selected) */}
                {selectedPackage && (
                  <PaymentMethodSelector
                    context="recharge"
                    selectedPackage={selectedPackage}
                    onPayPalSuccess={handlePayPalSuccess}
                    onOrangeMoneySuccess={handleOrangeMoneySuccess}
                    onError={handlePaymentError}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
