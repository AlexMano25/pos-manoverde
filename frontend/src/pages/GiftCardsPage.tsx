import React, { useState, useEffect, useMemo } from 'react'
import {
  Gift,
  Plus,
  Search,
  Trash2,
  Edit,
  CreditCard,
  Eye,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useGiftCardStore } from '../stores/giftCardStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { GiftCardStatus } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#7c3aed',
  primaryDark: '#6d28d9',
  primaryLight: '#c4b5fd',
  primaryBg: '#f5f3ff',
  primaryBg2: '#ede9fe',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#dcfce7',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  blue: '#3b82f6',
  blueBg: '#dbeafe',
  gray: '#94a3b8',
  grayBg: '#f1f5f9',
} as const

// ── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<GiftCardStatus, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',   color: C.success,  bg: C.successBg },
  redeemed: { label: 'Redeemed', color: C.gray,     bg: C.grayBg },
  expired:  { label: 'Expired',  color: C.danger,   bg: C.dangerBg },
  disabled: { label: 'Disabled', color: C.warning,  bg: C.warningBg },
}

// ── Transaction type config ──────────────────────────────────────────────

const TX_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  purchase: { label: 'Purchase', color: C.primary,  bg: C.primaryBg },
  redeem:   { label: 'Redeem',   color: C.danger,   bg: C.dangerBg },
  refund:   { label: 'Refund',   color: C.success,  bg: C.successBg },
  adjust:   { label: 'Adjust',   color: C.blue,     bg: C.blueBg },
  expire:   { label: 'Expire',   color: C.gray,     bg: C.grayBg },
}

// ── Tab type ─────────────────────────────────────────────────────────────

type TabKey = 'cards' | 'transactions'

// ── Form state ───────────────────────────────────────────────────────────

interface CardForm {
  initial_balance: number
  recipient_name: string
  recipient_email: string
  recipient_phone: string
  message: string
  expires_at: string
}

const emptyForm: CardForm = {
  initial_balance: 0,
  recipient_name: '',
  recipient_email: '',
  recipient_phone: '',
  message: '',
  expires_at: '',
}

// ── Redeem state ─────────────────────────────────────────────────────────

interface RedeemState {
  code: string
  amount: number
  lookupDone: boolean
}

const emptyRedeem: RedeemState = {
  code: '',
  amount: 0,
  lookupDone: false,
}

// ── Main Component ───────────────────────────────────────────────────────

const GiftCardsPage: React.FC = () => {
  const { isMobile, rv } = useResponsive()
  const { t } = useLanguageStore()
  const gt = (t as Record<string, any>).giftCards || {}
  const store = useAppStore((s) => s.currentStore)

  const {
    cards,
    transactions,
    loading,
    filterStatus,
    loadCards,
    loadTransactions,
    addCard,
    updateCard,
    deleteCard,
    redeemCard,
    getCardByCode,
    setFilterStatus,
  } = useGiftCardStore()

  // ── Local state ──────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<TabKey>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [viewingCardId, setViewingCardId] = useState<string | null>(null)
  const [form, setForm] = useState<CardForm>(emptyForm)
  const [redeemState, setRedeemState] = useState<RedeemState>(emptyRedeem)
  const [redeemError, setRedeemError] = useState('')
  const [redeemSuccess, setRedeemSuccess] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // ── Load data ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (store?.id) {
      loadCards(store.id)
      loadTransactions(store.id)
    }
  }, [store?.id, loadCards, loadTransactions])

  // ── Filtered cards ───────────────────────────────────────────────────────

  const filteredCards = useMemo(() => {
    let result = cards
    if (filterStatus !== 'all') {
      result = result.filter((c) => c.status === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          (c.recipient_name && c.recipient_name.toLowerCase().includes(q)) ||
          (c.recipient_email && c.recipient_email.toLowerCase().includes(q))
      )
    }
    return result
  }, [cards, filterStatus, searchQuery])

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalCards = cards.length
    const totalValue = cards.reduce((sum, c) => sum + c.current_balance, 0)
    const activeCards = cards.filter((c) => c.status === 'active').length
    const today = new Date().toISOString().slice(0, 10)
    const redeemedToday = transactions.filter(
      (tx) => tx.type === 'redeem' && tx.created_at.slice(0, 10) === today
    ).length
    return { totalCards, totalValue, activeCards, redeemedToday }
  }, [cards, transactions])

  // ── Currency helper ──────────────────────────────────────────────────────

  const currency = store?.currency || 'XOF'
  const fmt = (amount: number) => formatCurrency(amount, currency)

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setEditingCardId(null)
    setForm(emptyForm)
    setCreatedCode(null)
    setShowAddModal(true)
  }

  const handleOpenEdit = (id: string) => {
    const card = cards.find((c) => c.id === id)
    if (!card) return
    setEditingCardId(id)
    setForm({
      initial_balance: card.initial_balance,
      recipient_name: card.recipient_name || '',
      recipient_email: card.recipient_email || '',
      recipient_phone: card.recipient_phone || '',
      message: card.message || '',
      expires_at: card.expires_at ? card.expires_at.slice(0, 10) : '',
    })
    setCreatedCode(null)
    setShowAddModal(true)
  }

  const handleOpenView = (id: string) => {
    setViewingCardId(id)
    setShowViewModal(true)
  }

  const handleSaveCard = async () => {
    if (!store?.id || form.initial_balance <= 0) return
    setSaving(true)
    try {
      if (editingCardId) {
        await updateCard(editingCardId, {
          initial_balance: form.initial_balance,
          recipient_name: form.recipient_name || undefined,
          recipient_email: form.recipient_email || undefined,
          recipient_phone: form.recipient_phone || undefined,
          message: form.message || undefined,
          expires_at: form.expires_at || undefined,
        })
        setShowAddModal(false)
      } else {
        const card = await addCard(store.id, {
          code: '',
          initial_balance: form.initial_balance,
          current_balance: form.initial_balance,
          status: 'active',
          recipient_name: form.recipient_name || undefined,
          recipient_email: form.recipient_email || undefined,
          recipient_phone: form.recipient_phone || undefined,
          message: form.message || undefined,
          expires_at: form.expires_at || undefined,
        })
        setCreatedCode(card.code)
      }
    } catch (error) {
      console.error('[GiftCardsPage] Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCard = async (id: string) => {
    if (!window.confirm(gt.confirmDelete || 'Delete this gift card?')) return
    await deleteCard(id)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    })
  }

  const handleLookupCode = () => {
    if (!store?.id || !redeemState.code.trim()) return
    setRedeemError('')
    setRedeemSuccess('')
    const card = getCardByCode(store.id, redeemState.code.trim().toUpperCase())
    if (!card) {
      setRedeemError(gt.codeNotFound || 'Gift card not found.')
      setRedeemState((s) => ({ ...s, lookupDone: false }))
      return
    }
    if (card.status !== 'active') {
      setRedeemError(gt.cardNotActive || 'This gift card is not active.')
      setRedeemState((s) => ({ ...s, lookupDone: false }))
      return
    }
    setRedeemState((s) => ({ ...s, lookupDone: true }))
  }

  const handleRedeem = async () => {
    if (!store?.id || !redeemState.code.trim()) return
    const card = getCardByCode(store.id, redeemState.code.trim().toUpperCase())
    if (!card) return
    if (redeemState.amount <= 0 || redeemState.amount > card.current_balance) {
      setRedeemError(gt.invalidAmount || 'Invalid redemption amount.')
      return
    }
    setSaving(true)
    setRedeemError('')
    try {
      await redeemCard(store.id, card.id, redeemState.amount)
      setRedeemSuccess(
        (gt.redeemSuccess || 'Redeemed {amount} successfully!').replace(
          '{amount}',
          fmt(redeemState.amount)
        )
      )
      setRedeemState(emptyRedeem)
      // Refresh
      loadCards(store.id)
      loadTransactions(store.id)
    } catch (err: any) {
      setRedeemError(err.message || 'Redemption failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleCloseRedeem = () => {
    setShowRedeemModal(false)
    setRedeemState(emptyRedeem)
    setRedeemError('')
    setRedeemSuccess('')
  }

  // ── Viewing card ─────────────────────────────────────────────────────────

  const viewingCard = viewingCardId ? cards.find((c) => c.id === viewingCardId) : null
  const viewingCardTxs = viewingCard
    ? transactions.filter((tx) => tx.gift_card_id === viewingCard.id)
    : []

  // ── Lookup card in redeem modal ─────────────────────────────────────────

  const redeemLookupCard =
    store && redeemState.code.trim()
      ? getCardByCode(store.id, redeemState.code.trim().toUpperCase())
      : undefined

  // ── Date formatting ─────────────────────────────────────────────────────

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return iso
    }
  }

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  // ── Filter statuses ────────────────────────────────────────────────────

  const statusOptions: Array<{ value: GiftCardStatus | 'all'; label: string }> = [
    { value: 'all', label: gt.all || 'All' },
    { value: 'active', label: gt.active || 'Active' },
    { value: 'redeemed', label: gt.redeemed || 'Redeemed' },
    { value: 'expired', label: gt.expired || 'Expired' },
    { value: 'disabled', label: gt.disabled || 'Disabled' },
  ]

  // ── No store guard ─────────────────────────────────────────────────────

  if (!store) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.textSecondary }}>
        <p>{gt.noStore || 'Please select a store first.'}</p>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading && cards.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: C.textSecondary }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>{gt.loading || 'Loading gift cards...'}</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100%', backgroundColor: C.bg }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
          padding: rv('20px 16px', '28px 32px', '32px 40px'),
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 16 : 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: rv(44, 50, 54),
                  height: rv(44, 50, 54),
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Gift size={rv(22, 26, 28)} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: rv(22, 26, 28), fontWeight: 800 }}>
                  {gt.title || 'Gift Cards & Vouchers'}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: rv(13, 14, 15), opacity: 0.85 }}>
                  {gt.subtitle || 'Create, manage, and track gift cards'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => { setRedeemError(''); setRedeemSuccess(''); setRedeemState(emptyRedeem); setShowRedeemModal(true) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '2px solid rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                }}
              >
                <CreditCard size={18} />
                {gt.redeem || 'Redeem'}
              </button>
              <button
                onClick={handleOpenAdd}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: '#fff',
                  color: C.primary,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Plus size={18} />
                {gt.addCard || 'New Gift Card'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ padding: rv('16px', '24px 32px', '28px 40px'), maxWidth: 1200, margin: '0 auto' }}>
        {/* ── Stats bar ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: rv('1fr 1fr', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
            gap: rv(10, 14, 16),
            marginBottom: rv(20, 24, 28),
          }}
        >
          {/* Total Cards */}
          <StatCard
            icon={<Gift size={20} />}
            iconBg={C.primaryBg}
            iconColor={C.primary}
            label={gt.totalCards || 'Total Cards'}
            value={String(stats.totalCards)}
            rv={rv}
          />
          {/* Total Value Outstanding */}
          <StatCard
            icon={<CreditCard size={20} />}
            iconBg={C.successBg}
            iconColor={C.success}
            label={gt.totalValue || 'Outstanding Value'}
            value={fmt(stats.totalValue)}
            rv={rv}
          />
          {/* Active Cards */}
          <StatCard
            icon={<CheckCircle size={20} />}
            iconBg={C.blueBg}
            iconColor={C.blue}
            label={gt.activeCards || 'Active Cards'}
            value={String(stats.activeCards)}
            rv={rv}
          />
          {/* Redeemed Today */}
          <StatCard
            icon={<RefreshCw size={20} />}
            iconBg={C.warningBg}
            iconColor={C.warning}
            label={gt.redeemedToday || 'Redeemed Today'}
            value={String(stats.redeemedToday)}
            rv={rv}
          />
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: rv(16, 20, 24),
            background: C.card,
            borderRadius: 12,
            padding: 4,
            border: `1px solid ${C.border}`,
            width: 'fit-content',
          }}
        >
          {(
            [
              { key: 'cards' as TabKey, label: gt.tabCards || 'Cards', icon: <Gift size={16} /> },
              { key: 'transactions' as TabKey, label: gt.tabTransactions || 'Transactions', icon: <RefreshCw size={16} /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: rv('8px 14px', '10px 20px', '10px 24px'),
                borderRadius: 8,
                border: 'none',
                backgroundColor: activeTab === tab.key ? C.primary : 'transparent',
                color: activeTab === tab.key ? '#fff' : C.textSecondary,
                fontSize: rv(13, 14, 14),
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Cards Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'cards' && (
          <div>
            {/* Search + Filter */}
            <div
              style={{
                display: 'flex',
                gap: rv(10, 12, 14),
                marginBottom: rv(16, 20, 24),
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
              }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: C.gray,
                  }}
                />
                <input
                  type="text"
                  placeholder={gt.searchPlaceholder || 'Search by code, recipient...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 42px',
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    fontSize: 14,
                    color: C.text,
                    backgroundColor: C.card,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: filterStatus === opt.value ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                      backgroundColor: filterStatus === opt.value ? C.primaryBg : C.card,
                      color: filterStatus === opt.value ? C.primary : C.textSecondary,
                      fontSize: 13,
                      fontWeight: filterStatus === opt.value ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards grid */}
            {filteredCards.length === 0 ? (
              <EmptyState
                icon={<Gift size={48} color={C.primaryLight} />}
                title={gt.noCards || 'No gift cards yet'}
                message={gt.noCardsMessage || 'Create your first gift card to get started.'}
                actionLabel={gt.addCard || 'New Gift Card'}
                onAction={handleOpenAdd}
                rv={rv}
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: rv('1fr', '1fr 1fr', 'repeat(3, 1fr)'),
                  gap: rv(12, 14, 16),
                }}
              >
                {filteredCards.map((card) => {
                  const sc = STATUS_CONFIG[card.status]
                  const percentUsed =
                    card.initial_balance > 0
                      ? ((card.initial_balance - card.current_balance) / card.initial_balance) * 100
                      : 0

                  return (
                    <div
                      key={card.id}
                      style={{
                        background: C.card,
                        borderRadius: 14,
                        border: `1px solid ${C.border}`,
                        overflow: 'hidden',
                        transition: 'box-shadow 0.2s, transform 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.1)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                      onClick={() => handleOpenView(card.id)}
                    >
                      {/* Card header gradient */}
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${C.primaryBg} 0%, ${C.primaryBg2} 100%)`,
                          padding: rv('14px 16px', '16px 18px', '16px 20px'),
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily: 'monospace',
                              fontSize: rv(15, 16, 17),
                              fontWeight: 700,
                              color: C.primary,
                              letterSpacing: '0.05em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            {card.code}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyCode(card.code)
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 2,
                                color: copiedCode === card.code ? C.success : C.gray,
                                transition: 'color 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title={gt.copyCode || 'Copy code'}
                            >
                              {copiedCode === card.code ? (
                                <CheckCircle size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                          {card.recipient_name && (
                            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                              {gt.toLabel || 'To'}: {card.recipient_name}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            color: sc.color,
                            backgroundColor: sc.bg,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                          }}
                        >
                          {sc.label}
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: rv('14px 16px', '16px 18px', '16px 20px') }}>
                        {/* Balance */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>
                              {gt.balance || 'Balance'}
                            </span>
                            <span style={{ fontSize: 12, color: C.gray }}>
                              {gt.initialLabel || 'Initial'}: {fmt(card.initial_balance)}
                            </span>
                          </div>
                          <div style={{ fontSize: rv(20, 22, 24), fontWeight: 800, color: C.text }}>
                            {fmt(card.current_balance)}
                          </div>
                          {/* Progress bar */}
                          <div
                            style={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: C.border,
                              marginTop: 8,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                borderRadius: 3,
                                width: `${Math.min(100, percentUsed)}%`,
                                backgroundColor: percentUsed >= 100 ? C.gray : C.primary,
                                transition: 'width 0.3s',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 11, color: C.gray, marginTop: 4, textAlign: 'right' }}>
                            {Math.round(percentUsed)}% {gt.used || 'used'}
                          </div>
                        </div>

                        {/* Expiry */}
                        {card.expires_at && (
                          <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 12 }}>
                            {gt.expires || 'Expires'}: {formatDate(card.expires_at)}
                          </div>
                        )}

                        {/* Actions */}
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            borderTop: `1px solid ${C.border}`,
                            paddingTop: 12,
                          }}
                        >
                          <ActionButton
                            icon={<Eye size={14} />}
                            label={gt.view || 'View'}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenView(card.id)
                            }}
                            color={C.blue}
                            bg={C.blueBg}
                          />
                          <ActionButton
                            icon={<Edit size={14} />}
                            label={gt.edit || 'Edit'}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(card.id)
                            }}
                            color={C.primary}
                            bg={C.primaryBg}
                          />
                          <ActionButton
                            icon={<Trash2 size={14} />}
                            label={gt.delete || 'Delete'}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCard(card.id)
                            }}
                            color={C.danger}
                            bg={C.dangerBg}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Transactions Tab ───────────────────────────────────────────── */}
        {activeTab === 'transactions' && (
          <div>
            {transactions.length === 0 ? (
              <EmptyState
                icon={<RefreshCw size={48} color={C.primaryLight} />}
                title={gt.noTransactions || 'No transactions yet'}
                message={gt.noTransactionsMessage || 'Transactions will appear when gift cards are used.'}
                rv={rv}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: rv(8, 10, 10) }}>
                {transactions.map((tx) => {
                  const txc = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.redeem
                  return (
                    <div
                      key={tx.id}
                      style={{
                        background: C.card,
                        borderRadius: 12,
                        border: `1px solid ${C.border}`,
                        padding: rv('14px 16px', '16px 20px', '16px 22px'),
                        display: 'flex',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        justifyContent: 'space-between',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 10 : 0,
                        transition: 'box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: rv(10, 14, 16) }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: txc.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {tx.type === 'redeem' ? (
                            <CreditCard size={18} color={txc.color} />
                          ) : tx.type === 'refund' ? (
                            <RefreshCw size={18} color={txc.color} />
                          ) : tx.type === 'purchase' ? (
                            <Gift size={18} color={txc.color} />
                          ) : (
                            <Edit size={18} color={txc.color} />
                          )}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: 14,
                                fontWeight: 600,
                                color: C.text,
                                letterSpacing: '0.03em',
                              }}
                            >
                              {tx.gift_card_code}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                color: txc.color,
                                backgroundColor: txc.bg,
                                textTransform: 'uppercase',
                              }}
                            >
                              {txc.label}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>
                            {formatDateTime(tx.created_at)}
                            {tx.cashier_name && (
                              <span> &middot; {tx.cashier_name}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                        <div
                          style={{
                            fontSize: rv(16, 17, 18),
                            fontWeight: 700,
                            color: tx.amount < 0 ? C.danger : C.success,
                          }}
                        >
                          {tx.amount < 0 ? '-' : '+'}{fmt(Math.abs(tx.amount))}
                        </div>
                        <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
                          {gt.balanceAfter || 'Balance'}: {fmt(tx.balance_after)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setCreatedCode(null) }}
        title={editingCardId ? (gt.editCard || 'Edit Gift Card') : (gt.newCard || 'New Gift Card')}
        size="md"
      >
        {createdCode ? (
          /* ── Success screen after creation ─────────────────────────────── */
          <div style={{ textAlign: 'center', padding: rv('20px 0', '32px 0', '40px 0') }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: C.successBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle size={36} color={C.success} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text }}>
              {gt.cardCreated || 'Gift Card Created!'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: C.textSecondary }}>
              {gt.cardCreatedMessage || 'Share this code with the recipient.'}
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 24px',
                borderRadius: 12,
                backgroundColor: C.primaryBg,
                border: `2px dashed ${C.primaryLight}`,
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.primary,
                  letterSpacing: '0.08em',
                }}
              >
                {createdCode}
              </span>
              <button
                onClick={() => handleCopyCode(createdCode)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: copiedCode === createdCode ? C.success : C.primary,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {copiedCode === createdCode ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: C.gray }}>
              {gt.initialValueLabel || 'Value'}: {fmt(form.initial_balance)}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 }}>
              <button
                onClick={() => { setShowAddModal(false); setCreatedCode(null) }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.card,
                  color: C.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {gt.close || 'Close'}
              </button>
              <button
                onClick={() => {
                  setCreatedCode(null)
                  setForm(emptyForm)
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: C.primary,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {gt.createAnother || 'Create Another'}
              </button>
            </div>
          </div>
        ) : (
          /* ── Form ──────────────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Initial Balance */}
            <FormField label={gt.initialBalance || 'Initial Balance'} required>
              <input
                type="number"
                min={0}
                step={100}
                value={form.initial_balance || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, initial_balance: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
            </FormField>

            {/* Recipient Name */}
            <FormField label={gt.recipientName || 'Recipient Name'}>
              <input
                type="text"
                value={form.recipient_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recipient_name: e.target.value }))
                }
                placeholder={gt.recipientNamePH || 'John Doe'}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
            </FormField>

            {/* Email + Phone row */}
            <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
              <FormField label={gt.recipientEmail || 'Email'} style={{ flex: 1 }}>
                <input
                  type="email"
                  value={form.recipient_email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recipient_email: e.target.value }))
                  }
                  placeholder="email@example.com"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
              </FormField>
              <FormField label={gt.recipientPhone || 'Phone'} style={{ flex: 1 }}>
                <input
                  type="tel"
                  value={form.recipient_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recipient_phone: e.target.value }))
                  }
                  placeholder="+1 234 567 890"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
              </FormField>
            </div>

            {/* Personal Message */}
            <FormField label={gt.personalMessage || 'Personal Message'}>
              <textarea
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                placeholder={gt.personalMessagePH || 'Happy birthday! Enjoy your gift...'}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: 70,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
            </FormField>

            {/* Expiry Date */}
            <FormField label={gt.expiryDate || 'Expiry Date'}>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expires_at: e.target.value }))
                }
                min={new Date().toISOString().slice(0, 10)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
            </FormField>

            {/* Submit buttons */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                marginTop: 8,
                borderTop: `1px solid ${C.border}`,
                paddingTop: 16,
              }}
            >
              <button
                onClick={() => { setShowAddModal(false); setCreatedCode(null) }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.card,
                  color: C.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {gt.cancel || 'Cancel'}
              </button>
              <button
                onClick={handleSaveCard}
                disabled={saving || form.initial_balance <= 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor:
                    saving || form.initial_balance <= 0 ? C.gray : C.primary,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving || form.initial_balance <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  opacity: saving || form.initial_balance <= 0 ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : editingCardId ? (
                  <CheckCircle size={16} />
                ) : (
                  <Gift size={16} />
                )}
                {editingCardId
                  ? (gt.save || 'Save Changes')
                  : (gt.createCard || 'Create Gift Card')}
              </button>
            </div>
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </Modal>

      {/* ── Redeem Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={showRedeemModal}
        onClose={handleCloseRedeem}
        title={gt.redeemCard || 'Redeem Gift Card'}
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Code lookup */}
          <FormField label={gt.giftCardCode || 'Gift Card Code'} required>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={redeemState.code}
                onChange={(e) => {
                  setRedeemState((s) => ({
                    ...s,
                    code: e.target.value.toUpperCase(),
                    lookupDone: false,
                  }))
                  setRedeemError('')
                  setRedeemSuccess('')
                }}
                placeholder="GC-XXXX-YYYY"
                style={{
                  ...inputStyle,
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: 16,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLookupCode()
                }}
              />
              <button
                onClick={handleLookupCode}
                disabled={!redeemState.code.trim()}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: !redeemState.code.trim() ? C.gray : C.primary,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: !redeemState.code.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: !redeemState.code.trim() ? 0.6 : 1,
                }}
              >
                <Search size={16} />
              </button>
            </div>
          </FormField>

          {/* Card info display (after lookup) */}
          {redeemState.lookupDone && redeemLookupCard && (
            <div
              style={{
                background: C.primaryBg,
                borderRadius: 12,
                padding: 16,
                border: `1px solid ${C.primaryLight}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.primary,
                    letterSpacing: '0.05em',
                  }}
                >
                  {redeemLookupCard.code}
                </span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    color: STATUS_CONFIG[redeemLookupCard.status].color,
                    backgroundColor: STATUS_CONFIG[redeemLookupCard.status].bg,
                    textTransform: 'uppercase',
                  }}
                >
                  {STATUS_CONFIG[redeemLookupCard.status].label}
                </span>
              </div>
              {redeemLookupCard.recipient_name && (
                <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>
                  {gt.recipientLabel || 'Recipient'}: {redeemLookupCard.recipient_name}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, color: C.textSecondary }}>
                  {gt.availableBalance || 'Available Balance'}
                </span>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.success }}>
                  {fmt(redeemLookupCard.current_balance)}
                </span>
              </div>

              {/* Redeem amount */}
              <div style={{ marginTop: 16 }}>
                <FormField label={gt.redeemAmount || 'Redemption Amount'} required>
                  <input
                    type="number"
                    min={0}
                    max={redeemLookupCard.current_balance}
                    step={100}
                    value={redeemState.amount || ''}
                    onChange={(e) =>
                      setRedeemState((s) => ({
                        ...s,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder={`Max: ${fmt(redeemLookupCard.current_balance)}`}
                    style={{
                      ...inputStyle,
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                  />
                </FormField>
                {/* Quick amounts */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {[25, 50, 75, 100].map((pct) => {
                    const val = Math.round(redeemLookupCard.current_balance * (pct / 100))
                    if (val <= 0) return null
                    return (
                      <button
                        key={pct}
                        onClick={() =>
                          setRedeemState((s) => ({ ...s, amount: val }))
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: `1px solid ${C.border}`,
                          backgroundColor: redeemState.amount === val ? C.primaryBg : C.card,
                          color: redeemState.amount === val ? C.primary : C.textSecondary,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {pct}% ({fmt(val)})
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {redeemError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: C.dangerBg,
                color: C.danger,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <XCircle size={16} />
              {redeemError}
            </div>
          )}

          {/* Success */}
          {redeemSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: C.successBg,
                color: C.success,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <CheckCircle size={16} />
              {redeemSuccess}
            </div>
          )}

          {/* Redeem button */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              onClick={handleCloseRedeem}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.text,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {gt.cancel || 'Cancel'}
            </button>
            {redeemState.lookupDone && redeemLookupCard && (
              <button
                onClick={handleRedeem}
                disabled={saving || redeemState.amount <= 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor:
                    saving || redeemState.amount <= 0 ? C.gray : C.primary,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving || redeemState.amount <= 0 ? 'not-allowed' : 'pointer',
                  opacity: saving || redeemState.amount <= 0 ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <CreditCard size={16} />
                )}
                {gt.confirmRedeem || 'Redeem'}
              </button>
            )}
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </Modal>

      {/* ── View Card Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingCardId(null) }}
        title={gt.cardDetails || 'Gift Card Details'}
        size="md"
      >
        {viewingCard ? (
          <div>
            {/* Card visual */}
            <div
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                borderRadius: 16,
                padding: rv('20px', '24px', '28px'),
                color: '#fff',
                marginBottom: 24,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background pattern */}
              <div
                style={{
                  position: 'absolute',
                  right: -20,
                  top: -20,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 30,
                  bottom: -30,
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Gift size={24} />
                  <span style={{ fontSize: 16, fontWeight: 700, opacity: 0.9 }}>
                    {gt.giftCardLabel || 'GIFT CARD'}
                  </span>
                </div>
                <div
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    textTransform: 'uppercase',
                  }}
                >
                  {STATUS_CONFIG[viewingCard.status].label}
                </div>
              </div>

              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: rv(22, 26, 28),
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {viewingCard.code}
                <button
                  onClick={() => handleCopyCode(viewingCard.code)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: 6,
                    padding: 4,
                    cursor: 'pointer',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {copiedCode === viewingCard.code ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                    {gt.currentBalance || 'Current Balance'}
                  </div>
                  <div style={{ fontSize: rv(28, 32, 36), fontWeight: 800 }}>
                    {fmt(viewingCard.current_balance)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                    {gt.initialLabel || 'Initial'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.9 }}>
                    {fmt(viewingCard.initial_balance)}
                  </div>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {viewingCard.recipient_name && (
                <DetailRow
                  icon={<Send size={14} color={C.primary} />}
                  label={gt.recipientLabel || 'Recipient'}
                  value={viewingCard.recipient_name}
                />
              )}
              {viewingCard.recipient_email && (
                <DetailRow
                  icon={<Send size={14} color={C.blue} />}
                  label={gt.emailLabel || 'Email'}
                  value={viewingCard.recipient_email}
                />
              )}
              {viewingCard.recipient_phone && (
                <DetailRow
                  icon={<Send size={14} color={C.success} />}
                  label={gt.phoneLabel || 'Phone'}
                  value={viewingCard.recipient_phone}
                />
              )}
              {viewingCard.expires_at && (
                <DetailRow
                  icon={<XCircle size={14} color={C.danger} />}
                  label={gt.expiryLabel || 'Expires'}
                  value={formatDate(viewingCard.expires_at)}
                />
              )}
              <DetailRow
                icon={<Gift size={14} color={C.primary} />}
                label={gt.createdLabel || 'Created'}
                value={formatDate(viewingCard.created_at)}
              />
              {viewingCard.last_used_at && (
                <DetailRow
                  icon={<CreditCard size={14} color={C.warning} />}
                  label={gt.lastUsedLabel || 'Last Used'}
                  value={formatDate(viewingCard.last_used_at)}
                />
              )}
            </div>

            {/* Personal message */}
            {viewingCard.message && (
              <div
                style={{
                  background: C.primaryBg,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  borderLeft: `4px solid ${C.primaryLight}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>
                  {gt.messageLabel || 'Personal Message'}
                </div>
                <div style={{ fontSize: 14, color: C.text, fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{viewingCard.message}"
                </div>
              </div>
            )}

            {/* Transaction history for this card */}
            {viewingCardTxs.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: C.text }}>
                  {gt.transactionHistory || 'Transaction History'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {viewingCardTxs.map((tx) => {
                    const txc = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.redeem
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: `1px solid ${C.border}`,
                          backgroundColor: C.card,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 10,
                              fontSize: 11,
                              fontWeight: 700,
                              color: txc.color,
                              backgroundColor: txc.bg,
                              textTransform: 'uppercase',
                            }}
                          >
                            {txc.label}
                          </span>
                          <span style={{ fontSize: 12, color: C.gray }}>
                            {formatDateTime(tx.created_at)}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: tx.amount < 0 ? C.danger : C.success,
                            }}
                          >
                            {tx.amount < 0 ? '-' : '+'}{fmt(Math.abs(tx.amount))}
                          </span>
                          <div style={{ fontSize: 11, color: C.gray }}>
                            {gt.balanceAfter || 'Balance'}: {fmt(tx.balance_after)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: C.textSecondary }}>
            {gt.cardNotFound || 'Card not found.'}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────

/** Stat card at the top */
const StatCard: React.FC<{
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  value: string
  rv: <T>(m: T, t: T, d: T) => T
}> = ({ icon, iconBg, iconColor, label, value, rv }) => (
  <div
    style={{
      background: C.card,
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      padding: rv('14px 14px', '18px 20px', '20px 22px'),
      display: 'flex',
      alignItems: 'center',
      gap: rv(10, 14, 16),
      transition: 'box-shadow 0.15s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <div
      style={{
        width: rv(38, 44, 48),
        height: rv(38, 44, 48),
        borderRadius: 12,
        backgroundColor: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: iconColor,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: rv(11, 12, 12),
          color: C.textSecondary,
          fontWeight: 500,
          marginBottom: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: rv(18, 20, 22),
          fontWeight: 800,
          color: C.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
    </div>
  </div>
)

/** Empty state placeholder */
const EmptyState: React.FC<{
  icon: React.ReactNode
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  rv: <T>(m: T, t: T, d: T) => T
}> = ({ icon, title, message, actionLabel, onAction, rv }) => (
  <div
    style={{
      textAlign: 'center',
      padding: rv('48px 20px', '64px 32px', '80px 40px'),
      background: C.card,
      borderRadius: 16,
      border: `1px solid ${C.border}`,
    }}
  >
    <div style={{ marginBottom: 16 }}>{icon}</div>
    <h3
      style={{
        margin: '0 0 8px',
        fontSize: rv(18, 20, 22),
        fontWeight: 700,
        color: C.text,
      }}
    >
      {title}
    </h3>
    <p
      style={{
        margin: '0 0 20px',
        fontSize: rv(13, 14, 15),
        color: C.textSecondary,
        maxWidth: 400,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {message}
    </p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 24px',
          borderRadius: 12,
          border: 'none',
          backgroundColor: C.primary,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s',
          boxShadow: `0 4px 14px rgba(124, 58, 237, 0.3)`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(124, 58, 237, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 58, 237, 0.3)'
        }}
      >
        <Plus size={18} />
        {actionLabel}
      </button>
    )}
  </div>
)

/** Small action button on card items */
const ActionButton: React.FC<{
  icon: React.ReactNode
  label: string
  onClick: (e: React.MouseEvent) => void
  color: string
  bg: string
}> = ({ icon, label, onClick, color, bg }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '6px 10px',
      borderRadius: 8,
      border: 'none',
      backgroundColor: bg,
      color,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '0.8'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '1'
    }}
  >
    {icon}
    {label}
  </button>
)

/** Form field wrapper */
const FormField: React.FC<{
  label: string
  required?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}> = ({ label, required, children, style: wrapperStyle }) => (
  <div style={wrapperStyle}>
    <label
      style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: C.text,
        marginBottom: 6,
      }}
    >
      {label}
      {required && (
        <span style={{ color: C.danger, marginLeft: 2 }}>*</span>
      )}
    </label>
    {children}
  </div>
)

/** Detail row in view modal */
const DetailRow: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
}> = ({ icon, label, value }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      borderRadius: 10,
      border: `1px solid ${C.border}`,
      backgroundColor: C.card,
    }}
  >
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: C.primaryBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: C.gray, fontWeight: 500 }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: C.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
    </div>
  </div>
)

// ── Shared input style ──────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: `1px solid ${C.border}`,
  fontSize: 14,
  color: C.text,
  backgroundColor: C.card,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

export default GiftCardsPage
