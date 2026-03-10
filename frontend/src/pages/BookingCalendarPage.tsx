import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  MapPin,
  Users,
  Plane,
  User,
  Phone,
  Mail,
  X,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useTravelStore } from '../stores/travelStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { TravelBooking, BookingStatus } from '../types'

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

// ── Booking status config ────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { color: string; bg: string; label: string }> = {
  inquiry:      { color: C.textSecondary, bg: C.grayBg,    label: 'Inquiry' },
  confirmed:    { color: C.primary,       bg: C.primaryLight, label: 'Confirmed' },
  deposit_paid: { color: C.orange,        bg: C.orangeBg,  label: 'Deposit Paid' },
  fully_paid:   { color: C.success,       bg: C.successBg, label: 'Fully Paid' },
  completed:    { color: C.purple,        bg: C.purpleBg,  label: 'Completed' },
  cancelled:    { color: C.danger,        bg: C.dangerBg,  label: 'Cancelled' },
}

const STATUS_FLOW: BookingStatus[] = ['inquiry', 'confirmed', 'deposit_paid', 'fully_paid', 'completed']

// ── Calendar helpers ─────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Form state ───────────────────────────────────────────────────────────

interface BookingForm {
  customer_name: string
  customer_phone: string
  customer_email: string
  package_id: string
  destination: string
  departure_date: string
  return_date: string
  travelers: number
  total_price: number
  deposit_amount: number
  balance_due: number
  status: BookingStatus
  special_requests: string
  payment_method: string
}

const emptyForm: BookingForm = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  package_id: '',
  destination: '',
  departure_date: '',
  return_date: '',
  travelers: 1,
  total_price: 0,
  deposit_amount: 0,
  balance_due: 0,
  status: 'inquiry',
  special_requests: '',
  payment_method: '',
}

// ── Component ────────────────────────────────────────────────────────────

export default function BookingCalendarPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    bookings,
    packages,
    loading,
    loadBookings,
    loadPackages,
    createBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
  } = useTravelStore()

  const storeId = currentStore?.id || 'default-store'
  const currencyCode = currentStore?.currency || 'XAF'

  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all')
  const [filterDest, setFilterDest] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<TravelBooking | null>(null)
  const [form, setForm] = useState<BookingForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingBooking, setDeletingBooking] = useState<TravelBooking | null>(null)
  const [detailBooking, setDetailBooking] = useState<TravelBooking | null>(null)

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
    loadBookings(storeId)
    loadPackages(storeId)
  }, [storeId, loadBookings, loadPackages])

  // ── Calendar data ──────────────────────────────────────────────────
  const bookingsByDate = useMemo(() => {
    const map: Record<string, TravelBooking[]> = {}
    for (const b of bookings) {
      const dt = b.departure_date
      if (!dt) continue
      if (!map[dt]) map[dt] = []
      map[dt].push(b)
    }
    return map
  }, [bookings])

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfWeek(currentYear, currentMonth)
    const cells: { day: number; dateStr: string; isCurrentMonth: boolean }[] = []

    // Previous month padding
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1)
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      const m = currentMonth === 0 ? 11 : currentMonth - 1
      const y = currentMonth === 0 ? currentYear - 1 : currentYear
      cells.push({ day: d, dateStr: toDateStr(y, m, d), isCurrentMonth: false })
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, dateStr: toDateStr(currentYear, currentMonth, d), isCurrentMonth: true })
    }

    // Next month padding to fill grid
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1
      const y = currentMonth === 11 ? currentYear + 1 : currentYear
      cells.push({ day: d, dateStr: toDateStr(y, m, d), isCurrentMonth: false })
    }

    return cells
  }, [currentYear, currentMonth])

  // ── Filtered list ──────────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    let list = [...bookings]
    if (filterStatus !== 'all') {
      list = list.filter(b => b.status === filterStatus)
    }
    if (filterDest.trim()) {
      const q = filterDest.toLowerCase()
      list = list.filter(b => b.destination.toLowerCase().includes(q))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(b =>
        b.customer_name.toLowerCase().includes(q) ||
        b.booking_number.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q)
      )
    }
    if (selectedDate) {
      list = list.filter(b => b.departure_date === selectedDate)
    }
    return list
  }, [bookings, filterStatus, filterDest, searchQuery, selectedDate])

  // ── Stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => ['confirmed', 'deposit_paid', 'fully_paid'].includes(b.status)).length
    const revenue = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((s, b) => s + b.total_price, 0)
    const upcoming = bookings.filter(b => {
      if (b.status === 'cancelled' || b.status === 'completed') return false
      return b.departure_date >= new Date().toISOString().slice(0, 10)
    }).length
    return { total: bookings.length, confirmed, revenue, upcoming }
  }, [bookings])

  // ── Navigation ────────────────────────────────────────────────────
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const goToToday = () => {
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
  }

  // ── Modal actions ──────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingBooking(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (booking: TravelBooking) => {
    setEditingBooking(booking)
    setForm({
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone || '',
      customer_email: booking.customer_email || '',
      package_id: booking.package_id || '',
      destination: booking.destination,
      departure_date: booking.departure_date,
      return_date: booking.return_date,
      travelers: booking.travelers,
      total_price: booking.total_price,
      deposit_amount: booking.deposit_amount,
      balance_due: booking.balance_due,
      status: booking.status,
      special_requests: booking.special_requests || '',
      payment_method: booking.payment_method || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.customer_name.trim()) { setFormError(tTravel('customerRequired', 'Customer name is required')); return }
    if (!form.destination.trim()) { setFormError(tTravel('destRequired', 'Destination is required')); return }
    if (!form.departure_date) { setFormError(tTravel('departureDateRequired', 'Departure date is required')); return }
    if (!form.return_date) { setFormError(tTravel('returnDateRequired', 'Return date is required')); return }

    setSaving(true)
    setFormError('')
    try {
      const pkg = packages.find(p => p.id === form.package_id)
      const data = {
        store_id: storeId,
        booking_number: '',
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || undefined,
        customer_email: form.customer_email.trim() || undefined,
        package_id: form.package_id || undefined,
        package_name: pkg?.name || undefined,
        destination: form.destination.trim(),
        departure_date: form.departure_date,
        return_date: form.return_date,
        travelers: form.travelers,
        total_price: form.total_price,
        deposit_amount: form.deposit_amount,
        balance_due: form.total_price - form.deposit_amount,
        status: form.status,
        special_requests: form.special_requests.trim() || undefined,
        payment_method: (form.payment_method || undefined) as any,
      }
      if (editingBooking) {
        await updateBooking(editingBooking.id, data)
      } else {
        await createBooking(data)
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
    if (!deletingBooking) return
    try {
      await deleteBooking(deletingBooking.id)
      setShowDeleteModal(false)
      setDeletingBooking(null)
      if (detailBooking?.id === deletingBooking.id) setDetailBooking(null)
    } catch (err) {
      console.error('Delete booking error:', err)
    }
  }

  const handleStatusChange = async (booking: TravelBooking, newStatus: BookingStatus) => {
    await updateBookingStatus(booking.id, newStatus)
    setDetailBooking(prev => prev && prev.id === booking.id ? { ...prev, status: newStatus } : prev)
  }

  // ── When package is selected, auto-fill fields ──────────────────
  const handlePackageSelect = (pkgId: string) => {
    setForm(prev => {
      const pkg = packages.find(p => p.id === pkgId)
      if (!pkg) return { ...prev, package_id: pkgId }
      return {
        ...prev,
        package_id: pkgId,
        destination: pkg.destination,
        departure_date: pkg.departure_date || prev.departure_date,
        return_date: pkg.return_date || prev.return_date,
        total_price: pkg.price_per_person * prev.travelers,
      }
    })
  }

  // ── Auto-calculate balance ─────────────────────────────────────
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      balance_due: Math.max(0, prev.total_price - prev.deposit_amount),
    }))
  }, [form.total_price, form.deposit_amount])

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

  const statsRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
    gap: rv(8, 12, 16),
    marginBottom: 20,
  }

  const statCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: rv(12, 14, 16),
    border: `1px solid ${C.border}`,
    textAlign: 'center',
  }

  const calendarWrapStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    padding: rv(12, 16, 20),
    marginBottom: 20,
  }

  const calNavStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  }

  const calGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
  }

  const calDayHeaderStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: C.textSecondary,
    padding: '8px 0',
  }

  const calCellStyle = (isCurrentMonth: boolean, isToday: boolean, isSelected: boolean, hasBookings: boolean): React.CSSProperties => ({
    minHeight: rv(40, 60, 80),
    padding: rv(2, 4, 6),
    borderRadius: 8,
    border: isSelected ? `2px solid ${C.primary}` : isToday ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
    backgroundColor: isSelected ? C.primaryLight : isToday ? '#f0f7ff' : isCurrentMonth ? C.card : C.grayBg,
    cursor: hasBookings || isCurrentMonth ? 'pointer' : 'default',
    opacity: isCurrentMonth ? 1 : 0.4,
    transition: 'all 0.15s',
    overflow: 'hidden',
  })

  const listCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    padding: rv(14, 18, 20),
    marginBottom: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }

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

  const viewToggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 8,
    border: active ? 'none' : `1px solid ${C.border}`,
    backgroundColor: active ? C.primary : C.card,
    color: active ? '#ffffff' : C.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  })

  const statusProgressStyle = (status: BookingStatus, targetStatus: BookingStatus): React.CSSProperties => {
    const targetIdx = STATUS_FLOW.indexOf(targetStatus)
    const currentIdx = STATUS_FLOW.indexOf(status)
    const isCompleted = currentIdx >= targetIdx
    const isCurrent = currentIdx === targetIdx
    const cfg = STATUS_CONFIG[targetStatus]
    return {
      padding: '6px 12px',
      borderRadius: 8,
      border: isCurrent ? `2px solid ${cfg.color}` : isCompleted ? 'none' : `1px solid ${C.border}`,
      backgroundColor: isCompleted ? cfg.bg : C.card,
      color: isCompleted ? cfg.color : C.textSecondary,
      fontSize: 11,
      fontWeight: 600,
      cursor: isCompleted && !isCurrent ? 'default' : 'pointer',
      opacity: isCompleted ? 1 : 0.6,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }
  }

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

  // ── Booking Detail View ────────────────────────────────────────────

  if (detailBooking) {
    const b = detailBooking
    const stCfg = STATUS_CONFIG[b.status]
    return (
      <div style={pageStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            style={{ ...cancelBtnStyle, padding: '8px 16px' }}
            onClick={() => setDetailBooking(null)}
          >
            {tCommon('back', 'Back')}
          </button>
          <h1 style={{ ...titleStyle, fontSize: rv(18, 20, 22) }}>
            {b.booking_number}
          </h1>
          <span style={badgeStyle(stCfg.color, stCfg.bg)}>{stCfg.label}</span>
        </div>

        {/* Booking detail card */}
        <div style={{
          backgroundColor: C.card,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          padding: rv(16, 20, 24),
          marginBottom: 20,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
            {/* Customer info */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {tTravel('customerInfo', 'Customer Information')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 14, color: C.text }}>
                <User size={16} color={C.textSecondary} /> <strong>{b.customer_name}</strong>
              </div>
              {b.customer_phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: C.textSecondary }}>
                  <Phone size={14} /> {b.customer_phone}
                </div>
              )}
              {b.customer_email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: C.textSecondary }}>
                  <Mail size={14} /> {b.customer_email}
                </div>
              )}
            </div>

            {/* Trip details */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {tTravel('tripDetails', 'Trip Details')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 14, color: C.text }}>
                <MapPin size={16} color={C.textSecondary} /> {b.destination}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: C.textSecondary }}>
                <Calendar size={14} /> {formatDateShort(b.departure_date)} <ArrowRight size={10} /> {formatDateShort(b.return_date)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: C.textSecondary }}>
                <Users size={14} /> {b.travelers} {tTravel('travelers', 'travelers')}
              </div>
              {b.package_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textSecondary }}>
                  <Plane size={14} /> {b.package_name}
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div style={{
            marginTop: 20,
            padding: 16,
            backgroundColor: C.grayBg,
            borderRadius: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            textAlign: 'center',
          }}>
            <div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>{tTravel('totalPrice', 'Total')}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{formatCurrency(b.total_price, currencyCode)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>{tTravel('depositPaid', 'Deposit')}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.success }}>{formatCurrency(b.deposit_amount, currencyCode)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>{tTravel('balanceDue', 'Balance')}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: b.balance_due > 0 ? C.danger : C.success }}>{formatCurrency(b.balance_due, currencyCode)}</div>
            </div>
          </div>

          {/* Special requests */}
          {b.special_requests && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textSecondary, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {tTravel('specialRequests', 'Special Requests')}
              </h3>
              <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.5, padding: 12, backgroundColor: C.warningBg, borderRadius: 8 }}>
                {b.special_requests}
              </p>
            </div>
          )}
        </div>

        {/* Status progression */}
        <div style={{
          backgroundColor: C.card,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          padding: rv(16, 20, 24),
          marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textSecondary, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {tTravel('statusProgression', 'Status Progression')}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {STATUS_FLOW.map((s, idx) => {
              const currentIdx = STATUS_FLOW.indexOf(b.status)
              const isNext = idx === currentIdx + 1
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    style={statusProgressStyle(b.status, s)}
                    onClick={() => {
                      if (isNext || idx > currentIdx) {
                        handleStatusChange(b, s)
                      }
                    }}
                    disabled={idx <= currentIdx}
                  >
                    {idx <= currentIdx && <CheckCircle2 size={12} />}
                    {STATUS_CONFIG[s].label}
                  </button>
                  {idx < STATUS_FLOW.length - 1 && (
                    <ArrowRight size={14} color={C.border} />
                  )}
                </div>
              )
            })}
          </div>
          {b.status !== 'cancelled' && (
            <button
              style={{ ...badgeStyle(C.danger, C.dangerBg), border: 'none', cursor: 'pointer', marginTop: 12, fontSize: 12, padding: '6px 14px' }}
              onClick={() => handleStatusChange(b, 'cancelled')}
            >
              <X size={12} /> {tTravel('cancelBooking', 'Cancel Booking')}
            </button>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{ ...createBtnStyle, background: C.primary }}
            onClick={() => openEditModal(b)}
          >
            <Edit2 size={16} /> {tCommon('edit', 'Edit')}
          </button>
          <button
            style={{ ...deleteBtnStyle }}
            onClick={() => { setDeletingBooking(b); setShowDeleteModal(true) }}
          >
            <Trash2 size={16} /> {tCommon('delete', 'Delete')}
          </button>
        </div>
      </div>
    )
  }

  // ── Main Render ────────────────────────────────────────────────────

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <div style={pageStyle}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          <Calendar size={rv(22, 24, 26)} color={C.primary} />
          {tTravel('bookingCalendar', 'Booking Calendar')}
        </h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4, backgroundColor: C.grayBg, borderRadius: 10, padding: 3 }}>
            <button style={viewToggleStyle(viewMode === 'calendar')} onClick={() => setViewMode('calendar')}>
              <Calendar size={14} /> {tTravel('calendar', 'Calendar')}
            </button>
            <button style={viewToggleStyle(viewMode === 'list')} onClick={() => setViewMode('list')}>
              <List size={14} /> {tTravel('list', 'List')}
            </button>
          </div>
          <button style={createBtnStyle} onClick={openCreateModal}>
            <Plus size={16} /> {tTravel('addBooking', 'Add Booking')}
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div style={statsRowStyle}>
        <div style={statCardStyle}>
          <div style={{ fontSize: rv(20, 22, 26), fontWeight: 800, color: C.primary }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{tTravel('totalBookings', 'Total Bookings')}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: rv(20, 22, 26), fontWeight: 800, color: C.success }}>{stats.confirmed}</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{tTravel('confirmed', 'Confirmed')}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: rv(20, 22, 26), fontWeight: 800, color: C.purple }}>{formatCurrency(stats.revenue, currencyCode)}</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{tTravel('revenue', 'Revenue')}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: rv(20, 22, 26), fontWeight: 800, color: C.warning }}>{stats.upcoming}</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{tTravel('upcoming', 'Upcoming')}</div>
        </div>
      </div>

      {/* ── Calendar View ─────────────────────────────────────────────── */}
      {viewMode === 'calendar' && (
        <div style={calendarWrapStyle}>
          {/* Calendar navigation */}
          <div style={calNavStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                style={{ ...actionBtnStyle(C.text), padding: 8 }}
                onClick={goToPrevMonth}
              >
                <ChevronLeft size={20} />
              </button>
              <h2 style={{ fontSize: rv(16, 18, 20), fontWeight: 700, color: C.text, margin: 0 }}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <button
                style={{ ...actionBtnStyle(C.text), padding: 8 }}
                onClick={goToNextMonth}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ ...badgeStyle(C.primary, C.primaryLight), border: 'none', cursor: 'pointer', padding: '6px 14px', fontSize: 12 }}
                onClick={goToToday}
              >
                {tTravel('today', 'Today')}
              </button>
              {selectedDate && (
                <button
                  style={{ ...badgeStyle(C.textSecondary, C.grayBg), border: 'none', cursor: 'pointer', padding: '6px 14px', fontSize: 12 }}
                  onClick={() => setSelectedDate(null)}
                >
                  <X size={12} /> {tTravel('clearFilter', 'Clear')}
                </button>
              )}
            </div>
          </div>

          {/* Day headers */}
          <div style={calGridStyle}>
            {DAY_NAMES.map(d => (
              <div key={d} style={calDayHeaderStyle}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={calGridStyle}>
            {calendarDays.map((cell, idx) => {
              const dayBookings = bookingsByDate[cell.dateStr] || []
              const isToday = cell.dateStr === todayStr
              const isSelected = cell.dateStr === selectedDate
              return (
                <div
                  key={idx}
                  style={calCellStyle(cell.isCurrentMonth, isToday, isSelected, dayBookings.length > 0)}
                  onClick={() => {
                    if (cell.isCurrentMonth) {
                      setSelectedDate(isSelected ? null : cell.dateStr)
                    }
                  }}
                >
                  <div style={{
                    fontSize: rv(10, 11, 12),
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? C.primary : C.text,
                    marginBottom: 2,
                    textAlign: 'right',
                    padding: '2px 4px',
                  }}>
                    {cell.day}
                  </div>
                  {/* Booking dots/labels */}
                  {!isMobile ? (
                    dayBookings.slice(0, 2).map((b, bi) => {
                      const stCfg = STATUS_CONFIG[b.status]
                      return (
                        <div key={bi} style={{
                          fontSize: 9,
                          padding: '1px 4px',
                          borderRadius: 4,
                          backgroundColor: stCfg.bg,
                          color: stCfg.color,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: 1,
                          cursor: 'pointer',
                        }}
                          onClick={e => { e.stopPropagation(); setDetailBooking(b) }}
                        >
                          {b.customer_name.split(' ')[0]}
                        </div>
                      )
                    })
                  ) : (
                    dayBookings.length > 0 && (
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {dayBookings.slice(0, 3).map((b, bi) => (
                          <div key={bi} style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: STATUS_CONFIG[b.status].color,
                          }} />
                        ))}
                      </div>
                    )
                  )}
                  {dayBookings.length > 2 && !isMobile && (
                    <div style={{ fontSize: 9, color: C.textSecondary, textAlign: 'center' }}>
                      +{dayBookings.length - 2}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── List View / Filtered Bookings ─────────────────────────────── */}
      {(viewMode === 'list' || selectedDate) && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '1 1 auto', maxWidth: isMobile ? '100%' : 300 }}>
              <Search size={16} color={C.textSecondary} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                style={{ ...formInputStyle, paddingLeft: 38 }}
                type="text"
                placeholder={tTravel('searchBookings', 'Search bookings...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={e => { e.target.style.borderColor = C.primary }}
                onBlur={e => { e.target.style.borderColor = C.border }}
              />
            </div>
            <select
              style={{ ...formInputStyle, width: isMobile ? '100%' : 150, cursor: 'pointer' }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as BookingStatus | 'all')}
            >
              <option value="all">{tTravel('allStatuses', 'All Statuses')}</option>
              {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <input
              style={{ ...formInputStyle, width: isMobile ? '100%' : 180 }}
              type="text"
              placeholder={tTravel('filterDestination', 'Destination...')}
              value={filterDest}
              onChange={e => setFilterDest(e.target.value)}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>

          {selectedDate && (
            <div style={{ ...badgeStyle(C.primary, C.primaryLight), marginBottom: 12, padding: '6px 14px', fontSize: 13 }}>
              <Calendar size={14} /> {formatDateShort(selectedDate)}
              <button
                onClick={() => setSelectedDate(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, padding: 0, marginLeft: 6, display: 'inline-flex' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Booking cards */}
          {filteredBookings.length === 0 ? (
            <div style={{
              padding: 60,
              textAlign: 'center',
              backgroundColor: C.card,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
            }}>
              <Calendar size={40} color={C.border} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
                {tTravel('noBookings', 'No bookings found')}
              </p>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
                {selectedDate
                  ? tTravel('noBookingsDate', 'No bookings for this date')
                  : tTravel('createFirstBooking', 'Create your first booking to get started')}
              </p>
            </div>
          ) : (
            filteredBookings.map(b => {
              const stCfg = STATUS_CONFIG[b.status]
              return (
                <div
                  key={b.id}
                  style={{ ...listCardStyle, borderLeft: `4px solid ${stCfg.color}`, cursor: 'pointer' }}
                  onClick={() => setDetailBooking(b)}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    gap: isMobile ? 10 : 16,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{b.booking_number}</span>
                        <span style={badgeStyle(stCfg.color, stCfg.bg)}>{stCfg.label}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={13} /> {b.customer_name}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> {b.destination}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={13} /> {formatDateShort(b.departure_date)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={13} /> {b.travelers}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'row' : 'column',
                      alignItems: isMobile ? 'center' : 'flex-end',
                      justifyContent: 'space-between',
                      gap: 6,
                      flexShrink: 0,
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>
                        {formatCurrency(b.total_price, currencyCode)}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          style={actionBtnStyle(C.primary)}
                          onClick={e => { e.stopPropagation(); openEditModal(b) }}
                          title={tCommon('edit', 'Edit')}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.primaryLight }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          style={actionBtnStyle(C.danger)}
                          onClick={e => { e.stopPropagation(); setDeletingBooking(b); setShowDeleteModal(true) }}
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
        </div>
      )}

      {/* ── Create/Edit Booking Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBooking ? tTravel('editBooking', 'Edit Booking') : tTravel('addBooking', 'Add Booking')}
        size="lg"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        {/* Customer info */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('customerName', 'Customer Name')} *</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder={tTravel('customerNamePlaceholder', 'e.g. Jane Smith')}
            value={form.customer_name}
            onChange={e => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
            autoFocus
          />
        </div>

        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('phone', 'Phone')}</label>
            <input
              style={formInputStyle}
              type="tel"
              placeholder="+1 234 567 890"
              value={form.customer_phone}
              onChange={e => setForm(prev => ({ ...prev, customer_phone: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('email', 'Email')}</label>
            <input
              style={formInputStyle}
              type="email"
              placeholder="jane@example.com"
              value={form.customer_email}
              onChange={e => setForm(prev => ({ ...prev, customer_email: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Package selection */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('selectPackage', 'Select Package')}</label>
          <select
            style={{ ...formInputStyle, cursor: 'pointer' }}
            value={form.package_id}
            onChange={e => handlePackageSelect(e.target.value)}
          >
            <option value="">{tTravel('noPackage', '-- Custom Trip --')}</option>
            {packages.filter(p => p.status === 'published').map(p => (
              <option key={p.id} value={p.id}>{p.name} - {p.destination} ({formatCurrency(p.price_per_person, currencyCode)}/person)</option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('destination', 'Destination')} *</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder={tTravel('destinationPlaceholder', 'e.g. Maldives')}
            value={form.destination}
            onChange={e => setForm(prev => ({ ...prev, destination: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
        </div>

        {/* Dates */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('departureDate', 'Departure Date')} *</label>
            <input
              style={formInputStyle}
              type="date"
              value={form.departure_date}
              onChange={e => setForm(prev => ({ ...prev, departure_date: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('returnDate', 'Return Date')} *</label>
            <input
              style={formInputStyle}
              type="date"
              value={form.return_date}
              onChange={e => setForm(prev => ({ ...prev, return_date: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Travelers */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('travelers', 'Travelers')} *</label>
          <input
            style={formInputStyle}
            type="number"
            min="1"
            value={form.travelers || ''}
            onChange={e => {
              const travelers = Number(e.target.value)
              setForm(prev => {
                const pkg = packages.find(p => p.id === prev.package_id)
                const total = pkg ? pkg.price_per_person * travelers : prev.total_price
                return { ...prev, travelers, total_price: total }
              })
            }}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
        </div>

        {/* Pricing */}
        <div style={{ ...formRowStyle, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }}>
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
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('depositAmount', 'Deposit')}</label>
            <input
              style={formInputStyle}
              type="number"
              min="0"
              step="0.01"
              value={form.deposit_amount || ''}
              onChange={e => setForm(prev => ({ ...prev, deposit_amount: Number(e.target.value) }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('balanceDue', 'Balance Due')}</label>
            <input
              style={{ ...formInputStyle, backgroundColor: C.grayBg }}
              type="number"
              readOnly
              value={form.balance_due}
            />
          </div>
        </div>

        {/* Status */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('status', 'Status')}</label>
            <select
              style={{ ...formInputStyle, cursor: 'pointer' }}
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as BookingStatus }))}
            >
              {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('paymentMethod', 'Payment Method')}</label>
            <select
              style={{ ...formInputStyle, cursor: 'pointer' }}
              value={form.payment_method}
              onChange={e => setForm(prev => ({ ...prev, payment_method: e.target.value }))}
            >
              <option value="">{tTravel('selectPayment', '-- Select --')}</option>
              <option value="cash">{tTravel('cash', 'Cash')}</option>
              <option value="card">{tTravel('card', 'Card')}</option>
              <option value="mobile_money">{tTravel('mobileMoney', 'Mobile Money')}</option>
              <option value="bank_transfer">{tTravel('bankTransfer', 'Bank Transfer')}</option>
            </select>
          </div>
        </div>

        {/* Special requests */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('specialRequests', 'Special Requests')}</label>
          <textarea
            style={{ ...formInputStyle, minHeight: 70, resize: 'vertical' }}
            placeholder={tTravel('specialRequestsPlaceholder', 'e.g. Vegetarian meals, wheelchair accessible...')}
            value={form.special_requests}
            onChange={e => setForm(prev => ({ ...prev, special_requests: e.target.value }))}
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
            {saving ? tCommon('loading', 'Loading...') : editingBooking ? tCommon('save', 'Save') : tTravel('create', 'Create')}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={tTravel('deleteBooking', 'Delete Booking')}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 8px' }}>
          {tTravel('deleteBookingConfirm', 'Are you sure you want to delete this booking?')}
        </p>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
          <strong>{deletingBooking?.booking_number}</strong> - {deletingBooking?.customer_name}
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
