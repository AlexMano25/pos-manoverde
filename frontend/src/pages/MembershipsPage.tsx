import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Eye,
  RefreshCw,
  PauseCircle,
  XCircle,
  UserCheck,
  Loader2,
  Calendar,
  CreditCard,
  RotateCcw,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useMembershipStore } from '../stores/membershipStore'
import { useCustomerStore } from '../stores/customerStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { generateUUID } from '../utils/uuid'
import type { Membership, MembershipStatus, MembershipPlanType } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#10b981',
  primaryDark: '#059669',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  successBg: '#dcfce7',
  warningBg: '#fef3c7',
  dangerBg: '#fef2f2',
} as const

// ── Plan type config ────────────────────────────────────────────────────

const PLAN_CONFIG: Record<MembershipPlanType, { icon: string; label: string; color: string; bg: string }> = {
  daily:        { icon: '\u2600\uFE0F', label: 'Daily',        color: '#3b82f6', bg: '#dbeafe' },
  weekly:       { icon: '\uD83D\uDCC5', label: 'Weekly',       color: '#6366f1', bg: '#e0e7ff' },
  monthly:      { icon: '\uD83D\uDCC6', label: 'Monthly',      color: '#8b5cf6', bg: '#ede9fe' },
  quarterly:    { icon: '\uD83D\uDDD3\uFE0F', label: 'Quarterly',    color: '#7c3aed', bg: '#f3e8ff' },
  yearly:       { icon: '\u2B50',       label: 'Yearly',       color: '#ec4899', bg: '#fce7f3' },
  session_pack: { icon: '\uD83C\uDF9F\uFE0F', label: 'Session Pack', color: '#f59e0b', bg: '#fef3c7' },
}

// ── Status config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MembershipStatus, { label: string; color: string; bg: string; borderColor?: string }> = {
  active:    { label: 'Active',    color: '#16a34a', bg: '#dcfce7' },
  expired:   { label: 'Expired',   color: '#dc2626', bg: '#fef2f2' },
  suspended: { label: 'Suspended', color: '#64748b', bg: '#f1f5f9' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#ffffff', borderColor: '#dc2626' },
}

// ── Filter type ─────────────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'expiring' | 'expired' | 'suspended'

// ── Form state ──────────────────────────────────────────────────────────

interface MembershipForm {
  customer_id: string
  customer_name: string
  plan_type: MembershipPlanType
  plan_name: string
  price: string
  start_date: string
  end_date: string
  auto_renew: boolean
  sessions_total: string
  payment_method: string
  notes: string
}

const emptyForm: MembershipForm = {
  customer_id: '',
  customer_name: '',
  plan_type: 'monthly',
  plan_name: '',
  price: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  auto_renew: false,
  sessions_total: '10',
  payment_method: 'cash',
  notes: '',
}

// ── End date calculation ────────────────────────────────────────────────

function computeEndDate(startDate: string, planType: MembershipPlanType): string {
  const d = new Date(startDate)
  switch (planType) {
    case 'daily':     d.setDate(d.getDate() + 1); break
    case 'weekly':    d.setDate(d.getDate() + 7); break
    case 'monthly':   d.setMonth(d.getMonth() + 1); break
    case 'quarterly': d.setMonth(d.getMonth() + 3); break
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break
    case 'session_pack': d.setFullYear(d.getFullYear() + 1); break
  }
  return d.toISOString().slice(0, 10)
}

// ── Component ───────────────────────────────────────────────────────────

export default function MembershipsPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    memberships,
    loading,
    loadMemberships,
    addMembership,
    updateMembership,
    renewMembership,
    suspendMembership,
    checkIn,
    getActiveMembers,
    getExpiringMemberships,
  } = useMembershipStore()
  const { customers, loadCustomers } = useCustomerStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null)
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null)
  const [form, setForm] = useState<MembershipForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [checkInQuery, setCheckInQuery] = useState('')
  const [checkInFeedback, setCheckInFeedback] = useState<{ success: boolean; message: string } | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')

  // Translation helpers with fallbacks
  const tm = (t as Record<string, any>).memberships || {}
  const tCommon = (t as Record<string, any>).common || {}

  const label = {
    title: tm.title || 'Memberships',
    addMembership: tm.addMembership || 'New Membership',
    editMembership: tm.editMembership || 'Edit Membership',
    membershipDetail: tm.membershipDetail || 'Membership Detail',
    searchPlaceholder: tm.searchPlaceholder || 'Search by customer name or phone...',
    noMemberships: tm.noMemberships || 'No memberships yet',
    noMembershipsHint: tm.noMembershipsHint || 'Add your first membership to get started',
    noResults: tm.noResults || 'No memberships match your search',
    all: tCommon.all || 'All',
    active: tm.active || 'Active',
    expiring: tm.expiring || 'Expiring',
    expired: tm.expired || 'Expired',
    suspended: tm.suspended || 'Suspended',
    customer: tm.customer || 'Customer',
    planType: tm.planType || 'Plan Type',
    planName: tm.planName || 'Plan Name',
    price: tCommon.price || 'Price',
    startDate: tm.startDate || 'Start Date',
    endDate: tm.endDate || 'End Date',
    autoRenew: tm.autoRenew || 'Auto-Renew',
    sessions: tm.sessions || 'Sessions',
    sessionsTotal: tm.sessionsTotal || 'Total Sessions',
    paymentMethod: tm.paymentMethod || 'Payment Method',
    notes: tCommon.notes || 'Notes',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    view: tCommon.view || 'View',
    renew: tm.renew || 'Renew',
    suspend: tm.suspend || 'Suspend',
    cancelMembership: tm.cancelMembership || 'Cancel Membership',
    checkIn: tm.checkIn || 'Check In',
    quickCheckIn: tm.quickCheckIn || 'Quick Check-In',
    checkInSearch: tm.checkInSearch || 'Search customer by name or phone...',
    checkInSuccess: tm.checkInSuccess || 'Check-in successful!',
    checkInError: tm.checkInError || 'Check-in failed',
    selectCustomer: tm.selectCustomer || 'Select Customer',
    searchCustomer: tm.searchCustomer || 'Search customer...',
    loading: tCommon.loading || 'Loading...',
    noCustomerSelected: tm.noCustomerSelected || 'Please select a customer',
    required: tCommon.required || 'Required',
    used: tm.used || 'used',
    of: tm.of || 'of',
    expiringCount: tm.expiringCount || 'expiring soon',
    activeCount: tm.activeCount || 'active',
    cash: tCommon.cash || 'Cash',
    card: tCommon.card || 'Card',
    mobileMoney: tCommon.mobileMoney || 'Mobile Money',
    transfer: tCommon.transfer || 'Transfer',
    other: tCommon.other || 'Other',
  }

  // ── Load data on mount ─────────────────────────────────────────────────

  useEffect(() => {
    loadMemberships(storeId)
    loadCustomers(storeId)
  }, [storeId, loadMemberships, loadCustomers])

  // ── Stats ──────────────────────────────────────────────────────────────

  const activeCount = getActiveMembers(storeId).length
  const expiringCount = getExpiringMemberships(storeId, 7).length

  // ── Filtered memberships ───────────────────────────────────────────────

  const filteredMemberships = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
    const thresholdStr = sevenDaysLater.toISOString().slice(0, 10)

    let filtered = memberships

    // Apply status filter
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter((m) => m.status === 'active')
        break
      case 'expiring':
        filtered = filtered.filter(
          (m) => m.status === 'active' && m.end_date >= today && m.end_date <= thresholdStr
        )
        break
      case 'expired':
        filtered = filtered.filter((m) => m.status === 'expired' || (m.status === 'active' && m.end_date < today))
        break
      case 'suspended':
        filtered = filtered.filter((m) => m.status === 'suspended')
        break
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.customer_name.toLowerCase().includes(q) ||
          (m.plan_name && m.plan_name.toLowerCase().includes(q))
      )
    }

    return filtered
  }, [memberships, activeFilter, searchQuery])

  // ── Customer search for check-in ───────────────────────────────────────

  const checkInResults = useMemo(() => {
    if (!checkInQuery.trim()) return []
    const q = checkInQuery.toLowerCase()
    return memberships.filter(
      (m) =>
        m.status === 'active' &&
        (m.customer_name.toLowerCase().includes(q) ||
          customers.find((c) => c.id === m.customer_id && c.phone?.includes(checkInQuery)))
    )
  }, [memberships, customers, checkInQuery])

  // ── Customer search for form ───────────────────────────────────────────

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 10)
    const q = customerSearch.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(customerSearch)) ||
        (c.email && c.email.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [customers, customerSearch])

  // ── Auto-calculate end date when start or plan type changes ────────────

  useEffect(() => {
    if (form.start_date && form.plan_type) {
      const end = computeEndDate(form.start_date, form.plan_type)
      setForm((f) => ({ ...f, end_date: end }))
    }
  }, [form.start_date, form.plan_type])

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setEditingMembership(null)
    setForm(emptyForm)
    setFormError('')
    setCustomerSearch('')
    setShowAddEditModal(true)
  }


  const handleOpenDetail = (m: Membership) => {
    setSelectedMembership(m)
    setShowDetailModal(true)
  }

  const handleSave = async () => {
    if (!form.customer_id) {
      setFormError(label.noCustomerSelected)
      return
    }
    if (!form.plan_name.trim()) {
      setFormError(`${label.planName}: ${label.required}`)
      return
    }
    if (!form.price || Number(form.price) <= 0) {
      setFormError(`${label.price}: ${label.required}`)
      return
    }

    setSaving(true)
    setFormError('')

    try {
      if (editingMembership) {
        await updateMembership(editingMembership.id, {
          customer_id: form.customer_id,
          customer_name: form.customer_name,
          plan_type: form.plan_type,
          plan_name: form.plan_name,
          price: Number(form.price),
          start_date: form.start_date,
          end_date: form.end_date,
          auto_renew: form.auto_renew,
          sessions_total: form.plan_type === 'session_pack' ? Number(form.sessions_total) : undefined,
          payment_method: form.payment_method,
          notes: form.notes || undefined,
        })
      } else {
        await addMembership(storeId, {
          customer_id: form.customer_id,
          customer_name: form.customer_name,
          plan_type: form.plan_type,
          plan_name: form.plan_name,
          price: Number(form.price),
          status: 'active',
          start_date: form.start_date,
          end_date: form.end_date,
          auto_renew: form.auto_renew,
          sessions_total: form.plan_type === 'session_pack' ? Number(form.sessions_total) : undefined,
          sessions_used: form.plan_type === 'session_pack' ? 0 : undefined,
          payment_method: form.payment_method,
          notes: form.notes || undefined,
        })
      }
      setShowAddEditModal(false)
    } catch (err) {
      setFormError(String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCheckIn = async (membershipId: string) => {
    try {
      await checkIn(membershipId)
      setCheckInFeedback({ success: true, message: label.checkInSuccess })
      setTimeout(() => setCheckInFeedback(null), 3000)
    } catch {
      setCheckInFeedback({ success: false, message: label.checkInError })
      setTimeout(() => setCheckInFeedback(null), 3000)
    }
  }

  const handleRenew = async (id: string) => {
    await renewMembership(id)
    // Refresh detail if open
    const updated = memberships.find((m) => m.id === id)
    if (updated && selectedMembership?.id === id) {
      setSelectedMembership({ ...updated })
    }
  }

  const handleSuspend = async (id: string) => {
    await suspendMembership(id)
    const updated = memberships.find((m) => m.id === id)
    if (updated && selectedMembership?.id === id) {
      setSelectedMembership({ ...updated })
    }
  }

  const handleCancelMembership = async (id: string) => {
    await updateMembership(id, { status: 'cancelled' })
    const updated = memberships.find((m) => m.id === id)
    if (updated && selectedMembership?.id === id) {
      setSelectedMembership({ ...updated })
    }
  }

  // ── Filter tabs config ────────────────────────────────────────────────

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: label.all, count: memberships.length },
    { key: 'active', label: label.active, count: activeCount },
    { key: 'expiring', label: label.expiring, count: expiringCount },
    { key: 'expired', label: label.expired },
    { key: 'suspended', label: label.suspended },
  ]

  // ── Suppress unused import warning for generateUUID ────────────────────
  // generateUUID is used by the store but imported here for type-safety
  void generateUUID

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: C.textSecondary }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>{label.loading}</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
          padding: rv('20px 16px', '28px 32px', '32px 40px'),
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: rv(22, 26, 30), fontWeight: 800, letterSpacing: -0.5 }}>
              {label.title}
            </h1>
            <div style={{ display: 'flex', gap: rv(12, 20, 24), marginTop: 8, fontSize: rv(13, 14, 15), opacity: 0.9 }}>
              <span>{activeCount} {label.activeCount}</span>
              {expiringCount > 0 && (
                <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                  {expiringCount} {label.expiringCount}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 10,
              border: '2px solid rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)' }}
          >
            <Plus size={18} />
            {!isMobile && (label.addMembership)}
          </button>
        </div>
      </div>

      {/* ── Quick Check-In ────────────────────────────────────────────── */}
      <div style={{ padding: rv('12px 16px', '16px 32px', '16px 40px') }}>
        <button
          onClick={() => { setShowCheckInModal(true); setCheckInQuery(''); setCheckInFeedback(null) }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: isMobile ? '100%' : 'auto',
            padding: '12px 24px',
            borderRadius: 12,
            border: `2px solid ${C.primary}`,
            backgroundColor: '#ecfdf5',
            color: C.primary,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d1fae5' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5' }}
        >
          <UserCheck size={20} />
          {label.quickCheckIn}
        </button>
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────────── */}
      <div style={{ padding: rv('0 16px', '0 32px', '0 40px'), display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: activeFilter === tab.key ? C.primary : C.card,
              color: activeFilter === tab.key ? '#ffffff' : C.textSecondary,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              boxShadow: activeFilter === tab.key ? `0 2px 8px ${C.primary}40` : '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                marginLeft: 6,
                backgroundColor: activeFilter === tab.key ? 'rgba(255,255,255,0.25)' : C.bg,
                padding: '1px 7px',
                borderRadius: 10,
                fontSize: 11,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <div style={{ padding: rv('12px 16px', '12px 32px', '12px 40px') }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 10,
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
        }}>
          <Search size={18} color={C.textSecondary} />
          <input
            type="text"
            placeholder={label.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: 14,
              color: C.text,
            }}
          />
        </div>
      </div>

      {/* ── Membership cards grid ─────────────────────────────────────── */}
      <div style={{ padding: rv('0 16px 24px', '0 32px 32px', '0 40px 40px') }}>
        {filteredMemberships.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: C.textSecondary,
          }}>
            <Calendar size={48} color={C.border} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: C.text }}>
              {memberships.length === 0 ? label.noMemberships : label.noResults}
            </p>
            {memberships.length === 0 && (
              <p style={{ fontSize: 13 }}>{label.noMembershipsHint}</p>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: rv('1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)'),
            gap: rv(12, 16, 16),
          }}>
            {filteredMemberships.map((m) => {
              const plan = PLAN_CONFIG[m.plan_type]
              const status = STATUS_CONFIG[m.status]
              const isSessionPack = m.plan_type === 'session_pack'
              const sessionsUsed = m.sessions_used || 0
              const sessionsTotal = m.sessions_total || 0
              const sessionsPct = sessionsTotal > 0 ? Math.min((sessionsUsed / sessionsTotal) * 100, 100) : 0

              return (
                <div
                  key={m.id}
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 14,
                    border: `1px solid ${C.border}`,
                    padding: rv('16px', '18px', '20px'),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'box-shadow 0.15s',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleOpenDetail(m)}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Customer name + status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: rv(16, 17, 18), fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.customer_name}
                      </div>
                      <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>
                        {m.plan_name}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      color: status.color,
                      backgroundColor: status.bg,
                      border: status.borderColor ? `1.5px solid ${status.borderColor}` : 'none',
                      whiteSpace: 'nowrap',
                    }}>
                      {status.label}
                    </span>
                  </div>

                  {/* Plan type badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: plan.color,
                      backgroundColor: plan.bg,
                    }}>
                      {plan.icon} {plan.label}
                    </span>
                    {m.auto_renew && (
                      <RotateCcw size={14} color={C.primary} aria-label={label.autoRenew} />
                    )}
                  </div>

                  {/* Date range */}
                  <div style={{ fontSize: 13, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} />
                    <span>{m.start_date}</span>
                    <span style={{ color: C.border }}>→</span>
                    <span>{m.end_date}</span>
                  </div>

                  {/* Sessions progress for session_pack */}
                  {isSessionPack && (
                    <div>
                      <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
                        {label.sessions}: {sessionsUsed} / {sessionsTotal} {label.used}
                      </div>
                      <div style={{ height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${sessionsPct}%`,
                          backgroundColor: sessionsPct >= 90 ? C.danger : sessionsPct >= 70 ? C.warning : C.primary,
                          borderRadius: 3,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>
                    {formatCurrency(m.price, currency)}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenDetail(m) }}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        padding: '7px 0', borderRadius: 8, border: `1px solid ${C.border}`,
                        backgroundColor: C.card, color: C.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSecondary }}
                    >
                      <Eye size={13} /> {label.view}
                    </button>
                    {m.status === 'active' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRenew(m.id) }}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            padding: '7px 0', borderRadius: 8, border: `1px solid ${C.successBg}`,
                            backgroundColor: C.successBg, color: C.success, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#bbf7d0' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.successBg }}
                        >
                          <RefreshCw size={13} /> {label.renew}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSuspend(m.id) }}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            padding: '7px 0', borderRadius: 8, border: `1px solid ${C.warningBg}`,
                            backgroundColor: C.warningBg, color: C.warning, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fde68a' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.warningBg }}
                        >
                          <PauseCircle size={13} /> {label.suspend}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Quick Check-In Modal ──────────────────────────────────────── */}
      <Modal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} title={label.quickCheckIn} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 10,
            backgroundColor: C.bg,
            border: `1px solid ${C.border}`,
          }}>
            <Search size={18} color={C.textSecondary} />
            <input
              type="text"
              placeholder={label.checkInSearch}
              value={checkInQuery}
              onChange={(e) => setCheckInQuery(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent',
                fontSize: 14, color: C.text,
              }}
              autoFocus
            />
          </div>

          {/* Feedback */}
          {checkInFeedback && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 10,
              backgroundColor: checkInFeedback.success ? C.successBg : C.dangerBg,
              color: checkInFeedback.success ? C.success : C.danger,
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center',
            }}>
              {checkInFeedback.message}
            </div>
          )}

          {/* Results */}
          {checkInQuery.trim() && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {checkInResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: C.textSecondary, fontSize: 14 }}>
                  {label.noResults}
                </div>
              ) : (
                checkInResults.map((m) => {
                  const plan = PLAN_CONFIG[m.plan_type]
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 10,
                        backgroundColor: C.card,
                        border: `1px solid ${C.border}`,
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.customer_name}
                        </div>
                        <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: plan.color }}>{plan.icon} {plan.label}</span>
                          <span>|</span>
                          <span>{m.plan_name}</span>
                          {m.plan_type === 'session_pack' && (
                            <>
                              <span>|</span>
                              <span>{m.sessions_used || 0}/{m.sessions_total || 0}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckIn(m.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          backgroundColor: C.primary,
                          color: '#ffffff',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryDark }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
                      >
                        <UserCheck size={15} />
                        {label.checkIn}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Add/Edit Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        title={editingMembership ? label.editMembership : label.addMembership}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Error */}
          {formError && (
            <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: C.dangerBg, color: C.danger, fontSize: 13, fontWeight: 600 }}>
              {formError}
            </div>
          )}

          {/* Customer search */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
              {label.customer} *
            </label>
            {form.customer_id ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: '#ecfdf5',
                border: `1px solid ${C.primary}40`,
              }}>
                <span style={{ fontWeight: 600, color: C.text }}>{form.customer_name}</span>
                <button
                  onClick={() => setForm((f) => ({ ...f, customer_id: '', customer_name: '' }))}
                  style={{ border: 'none', backgroundColor: 'transparent', color: C.danger, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  &times;
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder={label.searchCustomer}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    fontSize: 14,
                    color: C.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {filteredCustomers.length > 0 && (
                  <div style={{
                    marginTop: 4,
                    maxHeight: 150,
                    overflowY: 'auto',
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.card,
                  }}>
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setForm((f) => ({ ...f, customer_id: c.id, customer_name: c.name }))
                          setCustomerSearch('')
                        }}
                        style={{
                          padding: '8px 14px',
                          cursor: 'pointer',
                          fontSize: 13,
                          color: C.text,
                          borderBottom: `1px solid ${C.border}`,
                          transition: 'background-color 0.1s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bg }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        {c.phone && <span style={{ color: C.textSecondary, marginLeft: 8 }}>{c.phone}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plan type selector */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
              {label.planType}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(Object.keys(PLAN_CONFIG) as MembershipPlanType[]).map((pt) => {
                const cfg = PLAN_CONFIG[pt]
                const isSelected = form.plan_type === pt
                return (
                  <button
                    key={pt}
                    onClick={() => setForm((f) => ({ ...f, plan_type: pt }))}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: `2px solid ${isSelected ? cfg.color : C.border}`,
                      backgroundColor: isSelected ? cfg.bg : C.card,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? cfg.color : C.textSecondary }}>
                      {cfg.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Plan name */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
              {label.planName} *
            </label>
            <input
              type="text"
              value={form.plan_name}
              onChange={(e) => setForm((f) => ({ ...f, plan_name: e.target.value }))}
              placeholder="Gold, Premium, Basic..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Price */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
              {label.price} *
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              min={0}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                {label.startDate}
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                  fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                {label.endDate}
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                  fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Auto-renew toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label.autoRenew}</label>
            <div
              onClick={() => setForm((f) => ({ ...f, auto_renew: !f.auto_renew }))}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                backgroundColor: form.auto_renew ? C.primary : C.border,
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s',
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#ffffff',
                position: 'absolute',
                top: 2,
                left: form.auto_renew ? 22 : 2,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>

          {/* Sessions total (only for session_pack) */}
          {form.plan_type === 'session_pack' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                {label.sessionsTotal}
              </label>
              <input
                type="number"
                value={form.sessions_total}
                onChange={(e) => setForm((f) => ({ ...f, sessions_total: e.target.value }))}
                min={1}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                  fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Payment method */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
              {label.paymentMethod}
            </label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 14, color: C.text, backgroundColor: C.card, outline: 'none', boxSizing: 'border-box',
              }}
            >
              <option value="cash">{label.cash}</option>
              <option value="card">{label.card}</option>
              <option value="mobile_money">{label.mobileMoney}</option>
              <option value="transfer">{label.transfer}</option>
              <option value="other">{label.other}</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
              {label.notes}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 14, color: C.text, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={() => setShowAddEditModal(false)}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.textSecondary,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {label.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: saving ? C.textSecondary : C.primary,
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              {label.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={label.membershipDetail}
        size="md"
      >
        {selectedMembership && (() => {
          const m = memberships.find((x) => x.id === selectedMembership.id) || selectedMembership
          const plan = PLAN_CONFIG[m.plan_type]
          const status = STATUS_CONFIG[m.status]
          const isSessionPack = m.plan_type === 'session_pack'
          const sessionsUsed = m.sessions_used || 0
          const sessionsTotal = m.sessions_total || 0
          const sessionsPct = sessionsTotal > 0 ? Math.min((sessionsUsed / sessionsTotal) * 100, 100) : 0

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Customer + status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{m.customer_name}</div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  color: status.color,
                  backgroundColor: status.bg,
                  border: status.borderColor ? `1.5px solid ${status.borderColor}` : 'none',
                }}>
                  {status.label}
                </span>
              </div>

              {/* Plan badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: plan.color,
                  backgroundColor: plan.bg,
                }}>
                  {plan.icon} {plan.label}
                </span>
                <span style={{ fontSize: 14, color: C.textSecondary }}>{m.plan_name}</span>
                {m.auto_renew && (
                  <RotateCcw size={14} color={C.primary} aria-label={label.autoRenew} />
                )}
              </div>

              {/* Info rows */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                padding: 16,
                borderRadius: 12,
                backgroundColor: C.bg,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>
                    {label.startDate}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 2 }}>
                    {m.start_date}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>
                    {label.endDate}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 2 }}>
                    {m.end_date}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>
                    {label.price}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.primary, marginTop: 2 }}>
                    {formatCurrency(m.price, currency)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>
                    {label.paymentMethod}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CreditCard size={14} />
                    {m.payment_method || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Sessions progress */}
              {isSessionPack && (
                <div style={{ padding: 16, borderRadius: 12, backgroundColor: C.bg }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                    {label.sessions}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: C.text }}>
                      {sessionsUsed}
                    </span>
                    <span style={{ fontSize: 14, color: C.textSecondary }}>
                      {label.of} {sessionsTotal}
                    </span>
                  </div>
                  <div style={{ height: 10, backgroundColor: C.border, borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${sessionsPct}%`,
                      backgroundColor: sessionsPct >= 90 ? C.danger : sessionsPct >= 70 ? C.warning : C.primary,
                      borderRadius: 5,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              )}

              {/* Notes */}
              {m.notes && (
                <div style={{ padding: 12, borderRadius: 10, backgroundColor: C.bg, fontSize: 13, color: C.textSecondary }}>
                  {m.notes}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {m.status === 'active' && (
                  <button
                    onClick={() => handleCheckIn(m.id)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 16px', borderRadius: 10, border: 'none',
                      backgroundColor: C.primary, color: '#ffffff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      transition: 'background-color 0.15s', minWidth: 100,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryDark }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
                  >
                    <UserCheck size={16} /> {label.checkIn}
                  </button>
                )}
                <button
                  onClick={() => handleRenew(m.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.success}`,
                    backgroundColor: C.successBg, color: C.success, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    transition: 'background-color 0.15s', minWidth: 100,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#bbf7d0' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.successBg }}
                >
                  <RefreshCw size={16} /> {label.renew}
                </button>
                {m.status === 'active' && (
                  <button
                    onClick={() => handleSuspend(m.id)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.warning}`,
                      backgroundColor: C.warningBg, color: C.warning, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      transition: 'background-color 0.15s', minWidth: 100,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fde68a' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.warningBg }}
                  >
                    <PauseCircle size={16} /> {label.suspend}
                  </button>
                )}
                {(m.status === 'active' || m.status === 'suspended') && (
                  <button
                    onClick={() => handleCancelMembership(m.id)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.danger}`,
                      backgroundColor: C.dangerBg, color: C.danger, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      transition: 'background-color 0.15s', minWidth: 100,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fecaca' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg }}
                  >
                    <XCircle size={16} /> {label.cancelMembership}
                  </button>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
