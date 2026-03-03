import React, { useEffect, useState } from 'react'
import { CreditCard, RefreshCw, ArrowUpCircle, ArrowDownCircle, Gift, RotateCcw } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import type { CreditBalance, CreditTransaction } from '../types'

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

// ── Ticket price constant ────────────────────────────────────────────────

const TICKET_PRICE_USD = 0.02

// ── Component ────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { currentStore } = useAppStore()
  const { t, language } = useLanguageStore()

  const [balance, setBalance] = useState<CreditBalance | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [consumptionByActivity, setConsumptionByActivity] = useState<
    { activity: string; store_id: string | null; tickets: number; amount: number }[]
  >([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    const orgId = currentStore?.organization_id
    if (!orgId) {
      setLoading(false)
      return
    }

    async function fetchBillingData() {
      setLoading(true)
      try {
        // Fetch credit balance
        const { data: balanceData } = await supabase!
          .from('credit_balances')
          .select('*')
          .eq('organization_id', orgId)
          .single()

        if (balanceData) {
          setBalance(balanceData as CreditBalance)
        }

        // Fetch recent transactions (last 50)
        const { data: txData } = await supabase!
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

    fetchBillingData()
  }, [currentStore?.organization_id])

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
    padding: 24,
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: 24,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
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
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: `1px solid ${C.border}`,
    marginBottom: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  }

  const tableCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    marginBottom: 24,
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

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>{t.billing.title}</h1>
        <p style={subtitleStyle}>{t.billing.subtitle}</p>
      </div>

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
                {t.billing.balance}
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: C.text, margin: 0 }}>
                ${balance?.balance_usd?.toFixed(2) ?? '0.00'}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
            {ticketsRemaining.toLocaleString()} {t.billing.ticketsRemaining}
          </p>
        </div>
        <button
          style={rechargeBtnStyle}
          onClick={() => {
            // Placeholder for future payment integration
            console.log('[BillingPage] Recharge clicked - payment integration pending')
          }}
        >
          <RefreshCw size={16} />
          {t.billing.recharge}
        </button>
      </div>

      {/* Consumption Breakdown */}
      <div style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <h3 style={tableTitleStyle}>{t.billing.consumption}</h3>
        </div>
        {consumptionByActivity.length === 0 ? (
          <div style={emptyStyle}>{t.billing.noTransactions}</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t.billing.activity}</th>
                <th style={thStyle}>{t.billing.store}</th>
                <th style={thStyle}>{t.billing.tickets}</th>
                <th style={thStyle}>{t.billing.amount}</th>
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
        )}
      </div>

      {/* Transaction History */}
      <div style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <h3 style={tableTitleStyle}>{t.billing.transactions}</h3>
        </div>
        {transactions.length === 0 ? (
          <div style={emptyStyle}>{t.billing.noTransactions}</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t.billing.date}</th>
                <th style={thStyle}>{t.billing.type}</th>
                <th style={thStyle}>{t.billing.amount}</th>
                <th style={thStyle}>{t.billing.description}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={tdStyle}>{formatDateTime(tx.created_at)}</td>
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
        )}
      </div>
    </div>
  )
}
