import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  MapPin,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Coffee,
  Utensils,
  Moon,
  Bus,
  Home,
  Tag,
  X,
  Route,
  ArrowRight,
  GripVertical,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useTravelStore } from '../stores/travelStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { Itinerary, ItineraryDay } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#dbeafe',
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
  purple: '#7c3aed',
  purpleBg: '#f3e8ff',
  orange: '#ea580c',
  orangeBg: '#fff7ed',
  grayBg: '#f1f5f9',
  cyan: '#0891b2',
  cyanBg: '#ecfeff',
} as const

// ── Empty day template ───────────────────────────────────────────────────

const emptyDay = (dayNum: number): ItineraryDay => ({
  day: dayNum,
  title: '',
  description: '',
  activities: [],
  meals_included: [],
  accommodation: '',
  transport: '',
})

// ── Form state ───────────────────────────────────────────────────────────

interface ItineraryForm {
  title: string
  destination: string
  start_date: string
  end_date: string
  package_id: string
  booking_id: string
  customer_name: string
  days: ItineraryDay[]
  total_price: number
  notes: string
}

const emptyForm: ItineraryForm = {
  title: '',
  destination: '',
  start_date: '',
  end_date: '',
  package_id: '',
  booking_id: '',
  customer_name: '',
  days: [emptyDay(1)],
  total_price: 0,
  notes: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const MEAL_OPTIONS = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee },
  { key: 'lunch', label: 'Lunch', icon: Utensils },
  { key: 'dinner', label: 'Dinner', icon: Moon },
]

// ── Component ────────────────────────────────────────────────────────────

export default function ItineraryPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    itineraries,
    packages,
    bookings,
    loading,
    loadItineraries,
    loadPackages,
    loadBookings,
    createItinerary,
    updateItinerary,
    deleteItinerary,
  } = useTravelStore()

  const storeId = currentStore?.id || 'default-store'
  const currencyCode = currentStore?.currency || 'XAF'

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingIt, setEditingIt] = useState<Itinerary | null>(null)
  const [form, setForm] = useState<ItineraryForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingIt, setDeletingIt] = useState<Itinerary | null>(null)
  const [expandedDay, setExpandedDay] = useState<number | null>(0)
  const [activityInput, setActivityInput] = useState<Record<number, string>>({})
  const [viewItinerary, setViewItinerary] = useState<Itinerary | null>(null)

  // ── i18n helpers ─────────────────────────────────────────────────────
  const tTravel = (key: string, fallback: string): string => {
    const tObj = (t as Record<string, unknown>).travel
    if (tObj && typeof tObj === 'object') {
      const val = (tObj as Record<string, string>)[key]
      if (typeof val === 'string') return val
    }
    return fallback
  }
  const tCommon = (key: string, fallback: string): string => {
    const obj = (t as Record<string, unknown>).common
    if (obj && typeof obj === 'object') {
      const val = (obj as Record<string, string>)[key]
      if (typeof val === 'string') return val
    }
    return fallback
  }

  // ── Load on mount ──────────────────────────────────────────────────
  useEffect(() => {
    loadItineraries(storeId)
    loadPackages(storeId)
    loadBookings(storeId)
  }, [storeId, loadItineraries, loadPackages, loadBookings])

  // ── Filtering ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...itineraries]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(it =>
        it.title.toLowerCase().includes(q) ||
        it.destination.toLowerCase().includes(q) ||
        (it.customer_name || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [itineraries, searchQuery])

  // ── Modal actions ─────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingIt(null)
    setForm(emptyForm)
    setFormError('')
    setExpandedDay(0)
    setActivityInput({})
    setShowModal(true)
  }

  const openEditModal = (it: Itinerary) => {
    setEditingIt(it)
    setForm({
      title: it.title,
      destination: it.destination,
      start_date: it.start_date,
      end_date: it.end_date,
      package_id: it.package_id || '',
      booking_id: it.booking_id || '',
      customer_name: it.customer_name || '',
      days: it.days.length > 0 ? it.days : [emptyDay(1)],
      total_price: it.total_price,
      notes: it.notes || '',
    })
    setFormError('')
    setExpandedDay(0)
    setActivityInput({})
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setFormError(tTravel('titleRequired', 'Title is required')); return }
    if (!form.destination.trim()) { setFormError(tTravel('destRequired', 'Destination is required')); return }
    if (!form.start_date) { setFormError(tTravel('startDateRequired', 'Start date is required')); return }
    if (!form.end_date) { setFormError(tTravel('endDateRequired', 'End date is required')); return }

    setSaving(true)
    setFormError('')
    try {
      const data = {
        store_id: storeId,
        title: form.title.trim(),
        destination: form.destination.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        package_id: form.package_id || undefined,
        booking_id: form.booking_id || undefined,
        customer_name: form.customer_name.trim() || undefined,
        days: form.days.map((d, i) => ({ ...d, day: i + 1 })),
        total_price: form.total_price,
        notes: form.notes.trim() || undefined,
      }
      if (editingIt) {
        await updateItinerary(editingIt.id, data)
      } else {
        await createItinerary(data)
      }
      setShowModal(false)
      setForm(emptyForm)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingIt) return
    try {
      await deleteItinerary(deletingIt.id)
      setShowDeleteModal(false)
      setDeletingIt(null)
    } catch (err) {
      console.error('Delete itinerary error:', err)
    }
  }

  // ── Day management ─────────────────────────────────────────────────
  const addDay = () => {
    setForm(prev => ({
      ...prev,
      days: [...prev.days, emptyDay(prev.days.length + 1)],
    }))
    setExpandedDay(form.days.length)
  }

  const removeDay = (idx: number) => {
    if (form.days.length <= 1) return
    setForm(prev => ({
      ...prev,
      days: prev.days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })),
    }))
    if (expandedDay !== null && expandedDay >= form.days.length - 1) {
      setExpandedDay(Math.max(0, form.days.length - 2))
    }
  }

  const updateDay = (idx: number, field: keyof ItineraryDay, value: unknown) => {
    setForm(prev => ({
      ...prev,
      days: prev.days.map((d, i) => i === idx ? { ...d, [field]: value } : d),
    }))
  }

  const toggleMeal = (dayIdx: number, meal: string) => {
    const day = form.days[dayIdx]
    const meals = day.meals_included.includes(meal)
      ? day.meals_included.filter(m => m !== meal)
      : [...day.meals_included, meal]
    updateDay(dayIdx, 'meals_included', meals)
  }

  const addActivity = (dayIdx: number) => {
    const val = (activityInput[dayIdx] || '').trim()
    if (!val) return
    const day = form.days[dayIdx]
    updateDay(dayIdx, 'activities', [...day.activities, val])
    setActivityInput(prev => ({ ...prev, [dayIdx]: '' }))
  }

  const removeActivity = (dayIdx: number, actIdx: number) => {
    const day = form.days[dayIdx]
    updateDay(dayIdx, 'activities', day.activities.filter((_, i) => i !== actIdx))
  }

  // ── Styles ──────────────────────────────────────────────────────────

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

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 22, 24),
    fontWeight: 700,
    color: C.text,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

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
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
  }

  const searchInputWrap: React.CSSProperties = {
    position: 'relative',
    marginBottom: 20,
    maxWidth: isMobile ? '100%' : 400,
  }

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px 10px 38px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: C.card,
  }

  const listCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    padding: rv(14, 18, 20),
    marginBottom: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s',
  }

  const formFieldStyle: React.CSSProperties = { marginBottom: 16 }
  const formLabelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 6 }
  const formInputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }
  const formRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }
  const formErrorStyle: React.CSSProperties = { backgroundColor: C.dangerBg, color: C.danger, padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }
  const formBtnRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }
  const cancelBtnStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`, backgroundColor: '#ffffff', color: C.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }
  const saveBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }
  const deleteBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, border: 'none', backgroundColor: C.danger, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }

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
  })

  const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color,
    backgroundColor: bg,
  })

  const dayHeaderStyle = (isExpanded: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: isExpanded ? C.primaryLight : C.grayBg,
    borderRadius: isExpanded ? '10px 10px 0 0' : 10,
    cursor: 'pointer',
    border: `1px solid ${isExpanded ? C.primary : C.border}`,
    borderBottom: isExpanded ? `1px solid ${C.border}` : undefined,
    marginBottom: isExpanded ? 0 : 8,
    transition: 'all 0.15s',
  })

  const dayBodyStyle: React.CSSProperties = {
    padding: 14,
    border: `1px solid ${C.primary}`,
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
    marginBottom: 8,
    backgroundColor: C.card,
  }

  const timelineNodeStyle = (isActive: boolean): React.CSSProperties => ({
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: isActive ? C.primary : C.grayBg,
    color: isActive ? '#ffffff' : C.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
    border: `2px solid ${isActive ? C.primary : C.border}`,
  })

  const chipStyle = (selected: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: 8,
    border: selected ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
    backgroundColor: selected ? C.primaryLight : C.card,
    color: selected ? C.primary : C.textSecondary,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  })

  // ── Loading ──────────────────────────────────────────────────────────

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

  // ── View Itinerary (Timeline) ──────────────────────────────────────

  if (viewItinerary) {
    return (
      <div style={pageStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            style={{ ...cancelBtnStyle, padding: '8px 16px' }}
            onClick={() => setViewItinerary(null)}
          >
            {tCommon('back', 'Back')}
          </button>
          <h1 style={{ ...titleStyle, fontSize: rv(18, 20, 22) }}>
            {viewItinerary.title}
          </h1>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
          fontSize: 13,
          color: C.textSecondary,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={14} /> {viewItinerary.destination}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={14} /> {formatDateShort(viewItinerary.start_date)} <ArrowRight size={12} /> {formatDateShort(viewItinerary.end_date)}
          </span>
          {viewItinerary.customer_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={14} /> {viewItinerary.customer_name}
            </span>
          )}
          <span style={badgeStyle(C.primary, C.primaryLight)}>
            {formatCurrency(viewItinerary.total_price, currencyCode)}
          </span>
        </div>

        {/* Timeline view */}
        {viewItinerary.days.map((day, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 16, marginBottom: 0 }}>
            {/* Timeline line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 }}>
              <div style={timelineNodeStyle(true)}>{day.day}</div>
              {idx < viewItinerary.days.length - 1 && (
                <div style={{ width: 2, flex: 1, backgroundColor: C.primary, minHeight: 20, opacity: 0.3 }} />
              )}
            </div>

            {/* Day content card */}
            <div style={{
              flex: 1,
              backgroundColor: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: rv(12, 16, 18),
              marginBottom: 16,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
                {tTravel('day', 'Day')} {day.day}{day.title ? `: ${day.title}` : ''}
              </h3>
              {day.description && (
                <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 10px', lineHeight: 1.5 }}>
                  {day.description}
                </p>
              )}

              {/* Activities */}
              {day.activities.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {day.activities.map((act, ai) => (
                    <span key={ai} style={{ ...badgeStyle(C.primary, C.primaryLight), fontSize: 11 }}>
                      <Tag size={11} /> {act}
                    </span>
                  ))}
                </div>
              )}

              {/* Meals */}
              {day.meals_included.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {day.meals_included.map(meal => {
                    const mCfg = MEAL_OPTIONS.find(m => m.key === meal)
                    if (!mCfg) return null
                    const IconComp = mCfg.icon
                    return (
                      <span key={meal} style={{ ...badgeStyle(C.success, C.successBg), fontSize: 11 }}>
                        <IconComp size={11} /> {mCfg.label}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Accommodation & Transport */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: C.textSecondary }}>
                {day.accommodation && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Home size={12} /> {day.accommodation}
                  </span>
                )}
                {day.transport && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Bus size={12} /> {day.transport}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          <Route size={rv(22, 24, 26)} color={C.primary} />
          {tTravel('itineraries', 'Itineraries')}
          <span style={badgeStyle(C.primary, C.primaryLight)}>
            {itineraries.length}
          </span>
        </h1>
        <button style={createBtnStyle} onClick={openCreateModal}>
          <Plus size={16} /> {tTravel('createItinerary', 'Create Itinerary')}
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div style={searchInputWrap}>
        <Search size={16} color={C.textSecondary} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          style={searchInputStyle}
          type="text"
          placeholder={tTravel('searchItineraries', 'Search itineraries...')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={e => { e.target.style.borderColor = C.primary }}
          onBlur={e => { e.target.style.borderColor = C.border }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 4 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Itinerary List ──────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          backgroundColor: C.card,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}>
          <Route size={40} color={C.border} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
            {tTravel('noItineraries', 'No itineraries yet')}
          </p>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
            {tTravel('createFirstItinerary', 'Build your first itinerary for a travel package or booking')}
          </p>
        </div>
      ) : (
        filtered.map(it => {
          const nDays = it.days.length
          const linkedPkg = packages.find(p => p.id === it.package_id)
          return (
            <div key={it.id} style={listCardStyle}>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                gap: isMobile ? 12 : 16,
              }}>
                {/* Left: Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{it.title}</span>
                    <span style={badgeStyle(C.primary, C.primaryLight)}>
                      {nDays} {tTravel('days', 'days')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} /> {it.destination}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} /> {formatDateShort(it.start_date)} <ArrowRight size={10} /> {formatDateShort(it.end_date)}
                    </span>
                    {it.customer_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={13} /> {it.customer_name}
                      </span>
                    )}
                  </div>

                  {linkedPkg && (
                    <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>
                      {tTravel('linkedPackage', 'Package')}: <strong>{linkedPkg.name}</strong>
                    </div>
                  )}

                  <div style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>
                    {formatCurrency(it.total_price, currencyCode)}
                  </div>

                  {/* Mini timeline preview */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                    {it.days.slice(0, 7).map((d, i) => (
                      <div key={i} style={{
                        ...timelineNodeStyle(true),
                        width: 22,
                        height: 22,
                        fontSize: 10,
                        border: `1.5px solid ${C.primary}`,
                      }}>
                        {d.day}
                      </div>
                    ))}
                    {it.days.length > 7 && (
                      <span style={{ fontSize: 11, color: C.textSecondary, alignSelf: 'center' }}>+{it.days.length - 7}</span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'row' : 'column',
                  alignItems: isMobile ? 'center' : 'flex-end',
                  gap: 6,
                  flexShrink: 0,
                }}>
                  <button
                    style={{ ...badgeStyle(C.cyan, C.cyanBg), border: 'none', cursor: 'pointer', fontSize: 11 }}
                    onClick={() => setViewItinerary(it)}
                  >
                    <Calendar size={12} /> {tTravel('viewTimeline', 'View')}
                  </button>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      style={actionBtnStyle(C.primary)}
                      onClick={() => openEditModal(it)}
                      title={tCommon('edit', 'Edit')}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.primaryLight }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      style={actionBtnStyle(C.danger)}
                      onClick={() => { setDeletingIt(it); setShowDeleteModal(true) }}
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

      {/* ── Create/Edit Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingIt ? tTravel('editItinerary', 'Edit Itinerary') : tTravel('createItinerary', 'Create Itinerary')}
        size="lg"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        {/* Title */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('itineraryTitle', 'Title')} *</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder={tTravel('itineraryTitlePlaceholder', 'e.g. Safari Adventure Week')}
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
            autoFocus
          />
        </div>

        {/* Destination + Customer */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('destination', 'Destination')} *</label>
            <input
              style={formInputStyle}
              type="text"
              placeholder={tTravel('destinationPlaceholder', 'e.g. Kenya, East Africa')}
              value={form.destination}
              onChange={e => setForm(prev => ({ ...prev, destination: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('customerName', 'Customer')}</label>
            <input
              style={formInputStyle}
              type="text"
              placeholder={tTravel('customerNamePlaceholder', 'e.g. John Doe')}
              value={form.customer_name}
              onChange={e => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Dates */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('startDate', 'Start Date')} *</label>
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
            <label style={formLabelStyle}>{tTravel('endDate', 'End Date')} *</label>
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

        {/* Linked package + Booking */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('linkedPackage', 'Package')}</label>
            <select
              style={{ ...formInputStyle, cursor: 'pointer' }}
              value={form.package_id}
              onChange={e => setForm(prev => ({ ...prev, package_id: e.target.value }))}
            >
              <option value="">{tTravel('noPackage', '-- None --')}</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.destination}</option>
              ))}
            </select>
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('linkedBooking', 'Booking')}</label>
            <select
              style={{ ...formInputStyle, cursor: 'pointer' }}
              value={form.booking_id}
              onChange={e => setForm(prev => ({ ...prev, booking_id: e.target.value }))}
            >
              <option value="">{tTravel('noBooking', '-- None --')}</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>{b.booking_number} - {b.customer_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Total Price */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('totalPrice', 'Total Price')}</label>
          <input
            style={formInputStyle}
            type="number"
            min="0"
            step="0.01"
            value={form.total_price || ''}
            onChange={e => setForm(prev => ({ ...prev, total_price: Number(e.target.value) }))}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
        </div>

        {/* ── Day-by-Day Builder ──────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ ...formLabelStyle, marginBottom: 0 }}>
              {tTravel('dayByDay', 'Day-by-Day Itinerary')} ({form.days.length} {tTravel('days', 'days')})
            </label>
            <button
              type="button"
              style={{ ...badgeStyle(C.success, C.successBg), border: 'none', cursor: 'pointer', fontSize: 12, padding: '6px 12px' }}
              onClick={addDay}
            >
              <Plus size={14} /> {tTravel('addDay', 'Add Day')}
            </button>
          </div>

          {form.days.map((day, idx) => {
            const isExpanded = expandedDay === idx
            return (
              <div key={idx}>
                {/* Day header */}
                <div
                  style={dayHeaderStyle(isExpanded)}
                  onClick={() => setExpandedDay(isExpanded ? null : idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GripVertical size={14} color={C.textSecondary} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                      {tTravel('day', 'Day')} {idx + 1}
                      {day.title ? `: ${day.title}` : ''}
                    </span>
                    {day.activities.length > 0 && (
                      <span style={badgeStyle(C.primary, C.primaryLight)}>
                        {day.activities.length} {tTravel('activities', 'activities')}
                      </span>
                    )}
                    {day.meals_included.length > 0 && (
                      <span style={badgeStyle(C.success, C.successBg)}>
                        {day.meals_included.length} {tTravel('meals', 'meals')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {form.days.length > 1 && (
                      <button
                        type="button"
                        style={{ ...actionBtnStyle(C.danger), padding: 4 }}
                        onClick={e => { e.stopPropagation(); removeDay(idx) }}
                        title={tTravel('removeDay', 'Remove Day')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {isExpanded ? <ChevronUp size={16} color={C.textSecondary} /> : <ChevronDown size={16} color={C.textSecondary} />}
                  </div>
                </div>

                {/* Day body (expanded) */}
                {isExpanded && (
                  <div style={dayBodyStyle}>
                    {/* Day title */}
                    <div style={formFieldStyle}>
                      <label style={formLabelStyle}>{tTravel('dayTitle', 'Day Title')}</label>
                      <input
                        style={formInputStyle}
                        type="text"
                        placeholder={tTravel('dayTitlePlaceholder', 'e.g. Arrival & City Tour')}
                        value={day.title}
                        onChange={e => updateDay(idx, 'title', e.target.value)}
                        onFocus={e => { e.target.style.borderColor = C.primary }}
                        onBlur={e => { e.target.style.borderColor = C.border }}
                      />
                    </div>

                    {/* Day description */}
                    <div style={formFieldStyle}>
                      <label style={formLabelStyle}>{tTravel('dayDescription', 'Description')}</label>
                      <textarea
                        style={{ ...formInputStyle, minHeight: 60, resize: 'vertical' }}
                        placeholder={tTravel('dayDescPlaceholder', 'Describe the day...')}
                        value={day.description}
                        onChange={e => updateDay(idx, 'description', e.target.value)}
                        onFocus={e => { e.target.style.borderColor = C.primary }}
                        onBlur={e => { e.target.style.borderColor = C.border }}
                      />
                    </div>

                    {/* Activities (tags) */}
                    <div style={formFieldStyle}>
                      <label style={formLabelStyle}>{tTravel('activities', 'Activities')}</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {day.activities.map((act, ai) => (
                          <span key={ai} style={{
                            ...badgeStyle(C.primary, C.primaryLight),
                            cursor: 'pointer',
                          }}>
                            {act}
                            <button
                              type="button"
                              onClick={() => removeActivity(idx, ai)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, padding: 0, marginLeft: 4, display: 'inline-flex' }}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          style={{ ...formInputStyle, flex: 1 }}
                          type="text"
                          placeholder={tTravel('addActivityPlaceholder', 'Add activity...')}
                          value={activityInput[idx] || ''}
                          onChange={e => setActivityInput(prev => ({ ...prev, [idx]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addActivity(idx) } }}
                          onFocus={e => { e.target.style.borderColor = C.primary }}
                          onBlur={e => { e.target.style.borderColor = C.border }}
                        />
                        <button
                          type="button"
                          style={{ ...badgeStyle(C.primary, C.primaryLight), border: 'none', cursor: 'pointer', padding: '8px 14px', fontSize: 13 }}
                          onClick={() => addActivity(idx)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Meals included (checkboxes) */}
                    <div style={formFieldStyle}>
                      <label style={formLabelStyle}>{tTravel('mealsIncluded', 'Meals Included')}</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {MEAL_OPTIONS.map(m => {
                          const selected = day.meals_included.includes(m.key)
                          const IconComp = m.icon
                          return (
                            <button
                              key={m.key}
                              type="button"
                              style={chipStyle(selected)}
                              onClick={() => toggleMeal(idx, m.key)}
                            >
                              <IconComp size={14} /> {m.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Accommodation + Transport */}
                    <div style={formRowStyle}>
                      <div style={formFieldStyle}>
                        <label style={formLabelStyle}>{tTravel('accommodation', 'Accommodation')}</label>
                        <input
                          style={formInputStyle}
                          type="text"
                          placeholder={tTravel('accommodationPlaceholder', 'e.g. Hilton Resort')}
                          value={day.accommodation || ''}
                          onChange={e => updateDay(idx, 'accommodation', e.target.value)}
                          onFocus={e => { e.target.style.borderColor = C.primary }}
                          onBlur={e => { e.target.style.borderColor = C.border }}
                        />
                      </div>
                      <div style={formFieldStyle}>
                        <label style={formLabelStyle}>{tTravel('transport', 'Transport')}</label>
                        <input
                          style={formInputStyle}
                          type="text"
                          placeholder={tTravel('transportPlaceholder', 'e.g. Private minibus')}
                          value={day.transport || ''}
                          onChange={e => updateDay(idx, 'transport', e.target.value)}
                          onFocus={e => { e.target.style.borderColor = C.primary }}
                          onBlur={e => { e.target.style.borderColor = C.border }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Notes */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('notes', 'Notes')}</label>
          <textarea
            style={{ ...formInputStyle, minHeight: 60, resize: 'vertical' }}
            placeholder={tTravel('notesPlaceholder', 'Additional notes...')}
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
        </div>

        {/* Action buttons */}
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowModal(false)}>
            {tCommon('cancel', 'Cancel')}
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? tCommon('loading', 'Loading...') : editingIt ? tCommon('save', 'Save') : tTravel('create', 'Create')}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={tTravel('deleteItinerary', 'Delete Itinerary')}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 8px' }}>
          {tTravel('deleteItineraryConfirm', 'Are you sure you want to delete this itinerary?')}
        </p>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
          <strong>{deletingIt?.title}</strong> - {deletingIt?.destination}
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

      {/* ── CSS keyframes ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
