import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { usePromotionStore } from '../stores/promotionStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { PromotionType, PromotionConditions } from '../types'
import type { Promotion } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#f59e0b',
  primaryDark: '#d97706',
  bgWarm: '#fffbeb',
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#dcfce7',
  info: '#2563eb',
  infoBg: '#dbeafe',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  purple: '#7c3aed',
  purpleBg: '#f3e8ff',
  orange: '#ea580c',
  orangeBg: '#fff7ed',
  grayBg: '#f1f5f9',
} as const

// ── Promotion type config ────────────────────────────────────────────────

const TYPE_CONFIG: Record<PromotionType, { icon: string; label: string; color: string; bg: string }> = {
  percentage:   { icon: '\uD83D\uDCCA', label: '%',          color: C.purple,  bg: C.purpleBg },
  fixed_amount: { icon: '\uD83D\uDCB0', label: '$',          color: C.success,  bg: C.successBg },
  bogo:         { icon: '\uD83C\uDF81', label: 'BOGO',       color: C.orange,   bg: C.orangeBg },
  bundle:       { icon: '\uD83D\uDCE6', label: 'Bundle',     color: C.primaryDark, bg: C.bgWarm },
  happy_hour:   { icon: '\u23F0',       label: 'Happy Hour', color: C.info,     bg: C.infoBg },
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Filter type ──────────────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'scheduled' | 'expired'

// ── Form state ───────────────────────────────────────────────────────────

interface PromotionForm {
  name: string
  type: PromotionType
  value: number
  start_date: string
  end_date: string
  is_active: boolean
  max_uses: string
  min_qty: string
  min_amount: string
  days: number[]
  time_start: string
  time_end: string
  customer_only: boolean
}

const emptyForm: PromotionForm = {
  name: '',
  type: 'percentage',
  value: 0,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  is_active: true,
  max_uses: '',
  min_qty: '',
  min_amount: '',
  days: [],
  time_start: '',
  time_end: '',
  customer_only: false,
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getPromotionStatus(promo: Promotion): 'active' | 'scheduled' | 'expired' {
  const today = new Date().toISOString().slice(0, 10)
  if (promo.end_date && promo.end_date < today) return 'expired'
  if (promo.start_date > today) return 'scheduled'
  if (!promo.is_active) return 'expired'
  if (promo.max_uses && promo.usage_count >= promo.max_uses) return 'expired'
  return 'active'
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Component ────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    promotions,
    loading,
    loadPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion,
  } = usePromotionStore()

  const storeId = currentStore?.id || 'default-store'
  const currencyCode = currentStore?.currency || 'XAF'

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [form, setForm] = useState<PromotionForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingPromo, setDeletingPromo] = useState<Promotion | null>(null)
  const [conditionsOpen, setConditionsOpen] = useState(false)

  // ── Load promotions on mount ─────────────────────────────────────────
  useEffect(() => {
    loadPromotions(storeId)
  }, [storeId, loadPromotions])

  // ── Filter logic ─────────────────────────────────────────────────────
  const categorized = useMemo(() => {
    const active: Promotion[] = []
    const scheduled: Promotion[] = []
    const expired: Promotion[] = []
    for (const p of promotions) {
      const s = getPromotionStatus(p)
      if (s === 'active') active.push(p)
      else if (s === 'scheduled') scheduled.push(p)
      else expired.push(p)
    }
    return { active, scheduled, expired }
  }, [promotions])

  const filteredPromotions = useMemo(() => {
    if (activeFilter === 'active') return categorized.active
    if (activeFilter === 'scheduled') return categorized.scheduled
    if (activeFilter === 'expired') return categorized.expired
    return promotions
  }, [activeFilter, categorized, promotions])

  // ── Translation helpers ──────────────────────────────────────────────
  const tPromo = (key: string, fallback: string): string => {
    const promoT = (t as Record<string, unknown>).promotions
    if (promoT && typeof promoT === 'object') {
      const val = (promoT as Record<string, string>)[key]
      if (typeof val === 'string') return val
    }
    return fallback
  }
  const tCommon = (key: string, fallback: string): string => {
    const commonT = (t as Record<string, unknown>).common
    if (commonT && typeof commonT === 'object') {
      const val = (commonT as Record<string, string>)[key]
      if (typeof val === 'string') return val
    }
    return fallback
  }

  // ── Modal actions ────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingPromo(null)
    setForm(emptyForm)
    setFormError('')
    setConditionsOpen(false)
    setShowModal(true)
  }

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo)
    setForm({
      name: promo.name,
      type: promo.type,
      value: promo.value,
      start_date: promo.start_date,
      end_date: promo.end_date || '',
      is_active: promo.is_active,
      max_uses: promo.max_uses ? String(promo.max_uses) : '',
      min_qty: promo.conditions.min_qty ? String(promo.conditions.min_qty) : '',
      min_amount: promo.conditions.min_amount ? String(promo.conditions.min_amount) : '',
      days: promo.conditions.days || [],
      time_start: promo.conditions.time_start || '',
      time_end: promo.conditions.time_end || '',
      customer_only: promo.conditions.customer_only || false,
    })
    setFormError('')
    setConditionsOpen(
      !!(promo.conditions.min_qty || promo.conditions.min_amount ||
         promo.conditions.days?.length || promo.conditions.time_start ||
         promo.conditions.customer_only)
    )
    setShowModal(true)
  }

  const openDeleteModal = (promo: Promotion) => {
    setDeletingPromo(promo)
    setShowDeleteModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(tPromo('nameRequired', 'Promotion name is required'))
      return
    }
    if (form.value <= 0) {
      setFormError(tPromo('valueRequired', 'Value must be greater than 0'))
      return
    }
    if (form.type === 'percentage' && form.value > 100) {
      setFormError(tPromo('percentageMax', 'Percentage cannot exceed 100%'))
      return
    }
    if (!form.start_date) {
      setFormError(tPromo('startDateRequired', 'Start date is required'))
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const conditions: PromotionConditions = {}
      if (form.min_qty) conditions.min_qty = Number(form.min_qty)
      if (form.min_amount) conditions.min_amount = Number(form.min_amount)
      if (form.days.length > 0) conditions.days = form.days
      if (form.time_start) conditions.time_start = form.time_start
      if (form.time_end) conditions.time_end = form.time_end
      if (form.customer_only) conditions.customer_only = true

      if (editingPromo) {
        await updatePromotion(editingPromo.id, {
          name: form.name.trim(),
          type: form.type,
          value: form.value,
          start_date: form.start_date,
          end_date: form.end_date || undefined,
          is_active: form.is_active,
          max_uses: form.max_uses ? Number(form.max_uses) : undefined,
          conditions,
        })
      } else {
        await addPromotion(storeId, {
          name: form.name.trim(),
          type: form.type,
          value: form.value,
          start_date: form.start_date,
          end_date: form.end_date || undefined,
          is_active: form.is_active,
          max_uses: form.max_uses ? Number(form.max_uses) : undefined,
          conditions,
        })
      }

      setShowModal(false)
      setForm(emptyForm)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingPromo) return
    try {
      await deletePromotion(deletingPromo.id)
      setShowDeleteModal(false)
      setDeletingPromo(null)
    } catch (err) {
      console.error('Delete promotion error:', err)
    }
  }

  const handleToggle = async (promoId: string) => {
    await togglePromotion(promoId)
  }

  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }))
  }

  // ── Value display helper ─────────────────────────────────────────────
  const getValueDisplay = (promo: Promotion): string => {
    switch (promo.type) {
      case 'percentage':
      case 'happy_hour':
        return `-${promo.value}%`
      case 'fixed_amount':
        return `-${formatCurrency(promo.value, currencyCode)}`
      case 'bogo':
        return tPromo('buyOneGetOne', 'Buy 1 Get 1')
      case 'bundle':
        return `-${formatCurrency(promo.value, currencyCode)}`
      default:
        return String(promo.value)
    }
  }

  // ── Conditions preview ───────────────────────────────────────────────
  const getConditionsPreview = (promo: Promotion): string[] => {
    const previews: string[] = []
    if (promo.conditions.min_qty) {
      previews.push(`Min. ${promo.conditions.min_qty} ${tPromo('items', 'items')}`)
    }
    if (promo.conditions.min_amount) {
      previews.push(`Min. ${formatCurrency(promo.conditions.min_amount, currencyCode)}`)
    }
    if (promo.conditions.time_start && promo.conditions.time_end) {
      previews.push(`${promo.conditions.time_start}-${promo.conditions.time_end}`)
    }
    if (promo.conditions.days && promo.conditions.days.length > 0 && promo.conditions.days.length < 7) {
      previews.push(promo.conditions.days.map(d => DAY_LABELS[d]).join(', '))
    }
    if (promo.conditions.customer_only) {
      previews.push(tPromo('loyaltyOnly', 'Loyalty only'))
    }
    return previews
  }

  // ── Status styles ────────────────────────────────────────────────────
  const statusConfig: Record<string, { color: string; bg: string; label: string; dot: boolean }> = {
    active:    { color: C.success,       bg: C.successBg, label: tPromo('active', 'Active'),       dot: true },
    scheduled: { color: C.info,          bg: C.infoBg,    label: tPromo('scheduled', 'Scheduled'), dot: false },
    expired:   { color: C.textSecondary, bg: C.grayBg,    label: tPromo('expired', 'Expired'),     dot: false },
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
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? 12 : 0,
    marginBottom: 20,
  }

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 22, 24),
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const countBadge = (color: string, bg: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color,
    backgroundColor: bg,
  })

  const createBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
  }

  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    overflowX: 'auto',
    paddingBottom: 4,
  }

  const filterTabStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 10,
    border: active ? 'none' : `1px solid ${C.border}`,
    backgroundColor: active ? color : C.card,
    color: active ? '#ffffff' : C.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  })

  const cardStyle = (status: string): React.CSSProperties => ({
    backgroundColor: C.card,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    borderLeft: `4px solid ${statusConfig[status]?.color || C.border}`,
    padding: rv(14, 18, 20),
    marginBottom: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s',
  })

  const typeBadgeStyle = (type: PromotionType): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    color: TYPE_CONFIG[type].color,
    backgroundColor: TYPE_CONFIG[type].bg,
  })

  const statusBadgeStyle = (status: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color: statusConfig[status]?.color || C.textSecondary,
    backgroundColor: statusConfig[status]?.bg || C.grayBg,
    textDecoration: status === 'expired' ? 'line-through' : 'none',
  })

  const toggleSwitchOuter = (active: boolean): React.CSSProperties => ({
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: active ? C.success : '#cbd5e1',
    position: 'relative',
    cursor: 'pointer',
    border: 'none',
    padding: 0,
    transition: 'background-color 0.2s',
    flexShrink: 0,
  })

  const toggleSwitchKnob = (active: boolean): React.CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 2,
    left: active ? 20 : 2,
    transition: 'left 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  })

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color,
    padding: 6,
    borderRadius: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s',
  })

  // Form styles
  const formFieldStyle: React.CSSProperties = { marginBottom: 16 }
  const formLabelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 6 }
  const formInputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }
  const formRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }
  const formErrorStyle: React.CSSProperties = { backgroundColor: C.dangerBg, color: C.danger, padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }
  const formBtnRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }
  const cancelBtnStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`, backgroundColor: '#ffffff', color: C.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }
  const saveBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }
  const deleteBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, border: 'none', backgroundColor: C.danger, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 12 }}>
            {tCommon('loading', 'Loading...')}
          </p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={headerStyle}>
        <div style={titleRowStyle}>
          <h1 style={titleStyle}>{tPromo('title', 'Promotions')}</h1>
          <span style={countBadge(C.success, C.successBg)}>
            {categorized.active.length} {tPromo('active', 'Active')}
          </span>
          <span style={countBadge(C.textSecondary, C.grayBg)}>
            {categorized.expired.length} {tPromo('expired', 'Expired')}
          </span>
          <span style={countBadge(C.info, C.infoBg)}>
            {categorized.scheduled.length} {tPromo('scheduled', 'Scheduled')}
          </span>
        </div>
        <button style={createBtnStyle} onClick={openCreateModal}>
          <Plus size={16} /> {tPromo('createPromotion', 'Create Promotion')}
        </button>
      </div>

      {/* ── Filter Tabs ──────────────────────────────────────────────────── */}
      <div style={filterBarStyle}>
        <button
          style={filterTabStyle(activeFilter === 'all', C.text)}
          onClick={() => setActiveFilter('all')}
        >
          {tPromo('all', 'All')} ({promotions.length})
        </button>
        <button
          style={filterTabStyle(activeFilter === 'active', C.success)}
          onClick={() => setActiveFilter('active')}
        >
          {tPromo('active', 'Active')} ({categorized.active.length})
        </button>
        <button
          style={filterTabStyle(activeFilter === 'scheduled', C.info)}
          onClick={() => setActiveFilter('scheduled')}
        >
          {tPromo('scheduled', 'Scheduled')} ({categorized.scheduled.length})
        </button>
        <button
          style={filterTabStyle(activeFilter === 'expired', C.textSecondary)}
          onClick={() => setActiveFilter('expired')}
        >
          {tPromo('expired', 'Expired')} ({categorized.expired.length})
        </button>
      </div>

      {/* ── Promotion Cards ──────────────────────────────────────────────── */}
      {filteredPromotions.length === 0 ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          backgroundColor: C.card,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}>
          <Tag size={40} color={C.border} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
            {tPromo('noPromotions', 'No promotions yet')}
          </p>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
            {tPromo('createFirst', 'Create your first promotion to attract more customers')}
          </p>
        </div>
      ) : (
        filteredPromotions.map(promo => {
          const status = getPromotionStatus(promo)
          const condPreviews = getConditionsPreview(promo)

          return (
            <div key={promo.id} style={cardStyle(status)}>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                gap: isMobile ? 12 : 16,
              }}>
                {/* Left: Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Row 1: Name + Type badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                      {promo.name}
                    </span>
                    <span style={typeBadgeStyle(promo.type)}>
                      {TYPE_CONFIG[promo.type].icon} {TYPE_CONFIG[promo.type].label}
                    </span>
                  </div>

                  {/* Row 2: Value + Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: status === 'expired' ? C.textSecondary : C.primaryDark,
                      textDecoration: status === 'expired' ? 'line-through' : 'none',
                    }}>
                      {getValueDisplay(promo)}
                    </span>
                    <span style={statusBadgeStyle(status)}>
                      {statusConfig[status].dot && (
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: C.success,
                          display: 'inline-block',
                          animation: 'pulse 2s infinite',
                        }} />
                      )}
                      {statusConfig[status].label}
                    </span>
                  </div>

                  {/* Row 3: Date range + Usage */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 13, color: C.textSecondary }}>
                    <span>
                      {formatDateShort(promo.start_date)}
                      {promo.end_date ? ` \u2192 ${formatDateShort(promo.end_date)}` : ` \u2192 \u221E`}
                    </span>
                    <span>
                      {tPromo('used', 'Used')} {promo.usage_count} {tPromo('times', 'times')}
                      {promo.max_uses ? ` / ${promo.max_uses}` : ''}
                    </span>
                  </div>

                  {/* Row 4: Conditions preview */}
                  {condPreviews.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {condPreviews.map((cond, i) => (
                        <span key={i} style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          color: C.textSecondary,
                          backgroundColor: C.grayBg,
                          border: `1px solid ${C.border}`,
                        }}>
                          {cond}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Toggle + Actions */}
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'row' : 'column',
                  alignItems: isMobile ? 'center' : 'flex-end',
                  gap: 10,
                  flexShrink: 0,
                }}>
                  {/* Toggle switch */}
                  <button
                    style={toggleSwitchOuter(promo.is_active)}
                    onClick={() => handleToggle(promo.id)}
                    title={promo.is_active
                      ? tPromo('deactivate', 'Deactivate')
                      : tPromo('activate', 'Activate')}
                  >
                    <span style={toggleSwitchKnob(promo.is_active)} />
                  </button>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      style={actionBtnStyle(C.info)}
                      onClick={() => openEditModal(promo)}
                      title={tCommon('edit', 'Edit')}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.infoBg }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      style={actionBtnStyle(C.danger)}
                      onClick={() => openDeleteModal(promo)}
                      title={tCommon('delete', 'Delete')}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.dangerBg }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* ── Create/Edit Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPromo
          ? tPromo('editPromotion', 'Edit Promotion')
          : tPromo('createPromotion', 'Create Promotion')}
        size="lg"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        {/* Name */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tPromo('name', 'Promotion Name')} *</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder={tPromo('namePlaceholder', 'e.g. Summer Sale 2026')}
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
            autoFocus
          />
        </div>

        {/* Type selector cards */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tPromo('type', 'Type')} *</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
            gap: 8,
          }}>
            {(Object.entries(TYPE_CONFIG) as Array<[PromotionType, typeof TYPE_CONFIG[PromotionType]]>).map(([typeKey, config]) => (
              <button
                key={typeKey}
                style={{
                  padding: '12px 8px',
                  borderRadius: 12,
                  border: form.type === typeKey
                    ? `2px solid ${config.color}`
                    : `1px solid ${C.border}`,
                  backgroundColor: form.type === typeKey ? config.bg : C.card,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
                onClick={() => setForm(prev => ({ ...prev, type: typeKey as PromotionType }))}
              >
                <div style={{ fontSize: 22, marginBottom: 4 }}>{config.icon}</div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: form.type === typeKey ? config.color : C.textSecondary,
                }}>
                  {config.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Value input */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>
            {form.type === 'percentage' || form.type === 'happy_hour'
              ? tPromo('percentage', 'Percentage (%)')
              : tPromo('amount', 'Amount')} *
          </label>
          <input
            style={formInputStyle}
            type="number"
            min="0"
            max={form.type === 'percentage' || form.type === 'happy_hour' ? '100' : undefined}
            placeholder={form.type === 'percentage' || form.type === 'happy_hour' ? '20' : '5000'}
            value={form.value || ''}
            onChange={e => setForm(prev => ({ ...prev, value: Number(e.target.value) }))}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
        </div>

        {/* Date range */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tPromo('startDate', 'Start Date')} *</label>
            <input
              style={formInputStyle}
              type="date"
              value={form.start_date}
              onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tPromo('endDate', 'End Date')} ({tPromo('optional', 'optional')})</label>
            <input
              style={formInputStyle}
              type="date"
              value={form.end_date}
              onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Max uses */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tPromo('maxUses', 'Max Uses')} ({tPromo('optional', 'optional')})</label>
          <input
            style={formInputStyle}
            type="number"
            min="0"
            placeholder={tPromo('maxUsesPlaceholder', 'e.g. 100 (leave empty for unlimited)')}
            value={form.max_uses}
            onChange={e => setForm(prev => ({ ...prev, max_uses: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
        </div>

        {/* ── Conditions section (collapsible) ──────────────────────────── */}
        <div style={{
          marginBottom: 16,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <button
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: C.grayBg,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: C.text,
            }}
            onClick={() => setConditionsOpen(!conditionsOpen)}
          >
            <span>{tPromo('conditions', 'Conditions')}</span>
            {conditionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {conditionsOpen && (
            <div style={{ padding: 16 }}>
              {/* Min quantity & Min amount */}
              <div style={formRowStyle}>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>{tPromo('minQuantity', 'Min Quantity')}</label>
                  <input
                    style={formInputStyle}
                    type="number"
                    min="0"
                    placeholder="2"
                    value={form.min_qty}
                    onChange={e => setForm(prev => ({ ...prev, min_qty: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = C.primary }}
                    onBlur={e => { e.target.style.borderColor = C.border }}
                  />
                </div>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>{tPromo('minAmount', 'Min Amount')}</label>
                  <input
                    style={formInputStyle}
                    type="number"
                    min="0"
                    placeholder="10000"
                    value={form.min_amount}
                    onChange={e => setForm(prev => ({ ...prev, min_amount: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = C.primary }}
                    onBlur={e => { e.target.style.borderColor = C.border }}
                  />
                </div>
              </div>

              {/* Days of week */}
              <div style={formFieldStyle}>
                <label style={formLabelStyle}>{tPromo('daysOfWeek', 'Days of Week')}</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DAY_LABELS.map((label, idx) => (
                    <button
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: form.days.includes(idx)
                          ? `2px solid ${C.primary}`
                          : `1px solid ${C.border}`,
                        backgroundColor: form.days.includes(idx) ? C.bgWarm : C.card,
                        color: form.days.includes(idx) ? C.primaryDark : C.textSecondary,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => toggleDay(idx)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time window (shown primarily for happy_hour but always available) */}
              {(form.type === 'happy_hour' || form.time_start || form.time_end) && (
                <div style={formRowStyle}>
                  <div style={formFieldStyle}>
                    <label style={formLabelStyle}>{tPromo('timeStart', 'Start Time')}</label>
                    <input
                      style={formInputStyle}
                      type="time"
                      value={form.time_start}
                      onChange={e => setForm(prev => ({ ...prev, time_start: e.target.value }))}
                      onFocus={e => { e.target.style.borderColor = C.primary }}
                      onBlur={e => { e.target.style.borderColor = C.border }}
                    />
                  </div>
                  <div style={formFieldStyle}>
                    <label style={formLabelStyle}>{tPromo('timeEnd', 'End Time')}</label>
                    <input
                      style={formInputStyle}
                      type="time"
                      value={form.time_end}
                      onChange={e => setForm(prev => ({ ...prev, time_end: e.target.value }))}
                      onFocus={e => { e.target.style.borderColor = C.primary }}
                      onBlur={e => { e.target.style.borderColor = C.border }}
                    />
                  </div>
                </div>
              )}

              {/* Always show time fields toggle if type is happy_hour */}
              {form.type === 'happy_hour' && !form.time_start && !form.time_end && null}

              {/* Customer loyalty only */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                  {tPromo('customerOnly', 'Loyalty customers only')}
                </span>
                <button
                  style={toggleSwitchOuter(form.customer_only)}
                  onClick={() => setForm(prev => ({ ...prev, customer_only: !prev.customer_only }))}
                >
                  <span style={toggleSwitchKnob(form.customer_only)} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Action buttons ────────────────────────────────────────────── */}
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowModal(false)}>
            {tCommon('cancel', 'Cancel')}
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving
              ? tCommon('loading', 'Loading...')
              : editingPromo
                ? tCommon('save', 'Save')
                : tPromo('create', 'Create')}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={tPromo('deletePromotion', 'Delete Promotion')}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 8px' }}>
          {tPromo('deleteConfirm', 'Are you sure you want to delete this promotion?')}
        </p>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
          <strong>{deletingPromo?.name}</strong>
        </p>
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowDeleteModal(false)}>
            {tCommon('cancel', 'Cancel')}
          </button>
          <button style={deleteBtnStyle} onClick={handleDelete}>
            {tCommon('delete', 'Delete')}
          </button>
        </div>
      </Modal>

      {/* ── CSS keyframes ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
