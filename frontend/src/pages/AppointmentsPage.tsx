import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Calendar,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User as UserIcon,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertCircle,
  Eye,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAppointmentStore } from '../stores/appointmentStore'
import { useCustomerStore } from '../stores/customerStore'
import { useProductStore } from '../stores/productStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { db } from '../db/dexie'
import type { Appointment, AppointmentStatus, User, Product, Customer } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

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

// ── Status colors ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: '#3b82f6',
  confirmed: '#10b981',
  in_progress: '#f59e0b',
  completed: '#16a34a',
  cancelled: '#ef4444',
  no_show: '#6b7280',
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Planifie',
  confirmed: 'Confirme',
  in_progress: 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
  no_show: 'Absent',
}

// ── Helpers ──────────────────────────────────────────────────────────────

type ViewMode = 'day' | 'week' | 'list'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 08:00 - 20:00
const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function formatTime(t: string): string {
  return t.length === 5 ? t : t.slice(0, 5)
}

// ── Form state ──────────────────────────────────────────────────────────

interface AppointmentForm {
  customer_id: string
  customer_name: string
  service_id: string
  service_name: string
  staff_id: string
  staff_name: string
  date: string
  time_start: string
  duration_minutes: number
  price: number
  notes: string
  room_number: string
  guests: number
  destination: string
  passengers: number
}

const emptyForm: AppointmentForm = {
  customer_id: '',
  customer_name: '',
  service_id: '',
  service_name: '',
  staff_id: '',
  staff_name: '',
  date: toDateStr(new Date()),
  time_start: '',
  duration_minutes: 60,
  price: 0,
  notes: '',
  room_number: '',
  guests: 1,
  destination: '',
  passengers: 1,
}

// ── Component ───────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const { currentStore, activity } = useAppStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    appointments,
    loading,
    loadAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAvailableSlots,
  } = useAppointmentStore()
  const { customers } = useCustomerStore()
  const { products } = useProductStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'list' : 'day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [form, setForm] = useState<AppointmentForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [employees, setEmployees] = useState<User[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  // Suppress unused var warning for user (required by spec)
  void user

  // Translation helpers with fallbacks
  const ta = (t as Record<string, any>).appointments || {}
  const tCommon = (t as Record<string, any>).common || {}

  // Activity-adaptive title
  const getTitle = useCallback((): string => {
    if (ta.title) return ta.title
    switch (activity) {
      case 'hair_salon':
      case 'spa':
        return 'Rendez-vous'
      case 'hotel':
        return 'Reservations'
      case 'travel_agency':
        return 'Bookings'
      case 'gym':
      case 'pool':
        return 'Seances'
      case 'daycare':
      case 'school':
        return 'Inscriptions'
      default:
        return 'Rendez-vous'
    }
  }, [activity, ta.title])

  const label = useMemo(() => ({
    title: getTitle(),
    addNew: ta.addNew || '+ Nouveau',
    day: ta.day || 'Jour',
    week: ta.week || 'Semaine',
    list: ta.list || 'Liste',
    today: ta.today || "Aujourd'hui",
    available: ta.available || 'Disponible',
    noAppointments: ta.noAppointments || 'Aucun rendez-vous',
    noAppointmentsHint: ta.noAppointmentsHint || 'Planifiez votre premier rendez-vous',
    customer: ta.customer || 'Client',
    service: ta.service || 'Service',
    staff: ta.staff || 'Personnel',
    date: ta.date || 'Date',
    time: ta.time || 'Heure',
    duration: ta.duration || 'Duree (min)',
    price: ta.price || 'Prix',
    notes: ta.notes || 'Notes',
    roomNumber: ta.roomNumber || 'N. chambre',
    guests: ta.guests || 'Invites',
    destination: ta.destination || 'Destination',
    passengers: ta.passengers || 'Passagers',
    selectSlot: ta.selectSlot || 'Creneaux disponibles',
    searchCustomer: ta.searchCustomer || 'Rechercher un client...',
    selectService: ta.selectService || 'Choisir un service',
    selectStaff: ta.selectStaff || 'Choisir le personnel',
    addAppointment: ta.addAppointment || 'Nouveau rendez-vous',
    editAppointment: ta.editAppointment || 'Modifier le rendez-vous',
    appointmentDetail: ta.appointmentDetail || 'Detail du rendez-vous',
    confirm: ta.confirm || 'Confirmer',
    cancel: tCommon.cancel || 'Annuler',
    start: ta.start || 'Demarrer',
    complete: ta.complete || 'Terminer',
    noShow: ta.noShow || 'Absent',
    save: tCommon.save || 'Enregistrer',
    delete: tCommon.delete || 'Supprimer',
    deleteConfirm: ta.deleteConfirm || 'Supprimer ce rendez-vous ?',
    deleteWarning: ta.deleteWarning || 'Cette action est irreversible.',
    loading: tCommon.loading || 'Chargement...',
    error: tCommon.error || 'Erreur',
    all: ta.all || 'Tous',
    appointmentsToday: ta.appointmentsToday || 'rendez-vous aujourd\'hui',
    confirmed: ta.confirmed || 'confirmes',
  }), [getTitle, ta, tCommon])

  // ── Load data on mount ─────────────────────────────────────────────────

  useEffect(() => {
    loadAppointments(storeId)
  }, [storeId, loadAppointments])

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const users = await db.users
          .where('store_id')
          .equals(storeId)
          .filter((u) => u.is_active)
          .toArray()
        setEmployees(users)
      } catch (err) {
        console.error('[AppointmentsPage] Failed to load employees:', err)
      }
    }
    loadEmployees()
  }, [storeId])

  // ── Derived data ──────────────────────────────────────────────────────

  const dateStr = toDateStr(currentDate)

  const todayAppointments = useMemo(() => {
    const today = toDateStr(new Date())
    return appointments.filter((a) => a.date === today)
  }, [appointments])

  const todayConfirmed = useMemo(() => {
    return todayAppointments.filter((a) => a.status === 'confirmed').length
  }, [todayAppointments])

  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === dateStr)
      .sort((a, b) => parseTime(a.time_start) - parseTime(b.time_start))
  }, [appointments, dateStr])

  const weekStart = useMemo(() => getMonday(currentDate), [currentDate])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const weekAppointments = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    for (const d of weekDays) {
      const ds = toDateStr(d)
      map[ds] = appointments
        .filter((a) => a.date === ds)
        .sort((a, b) => parseTime(a.time_start) - parseTime(b.time_start))
    }
    return map
  }, [appointments, weekDays])

  const filteredAppointments = useMemo(() => {
    let list = [...appointments]
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter)
    }
    list.sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date)
      if (dateComp !== 0) return dateComp
      return parseTime(a.time_start) - parseTime(b.time_start)
    })
    return list
  }, [appointments, statusFilter])

  // Services (products with duration_minutes)
  const services = useMemo(() => {
    return products.filter((p) => p.is_active && p.duration_minutes && p.duration_minutes > 0)
  }, [products])

  // Filtered customers for search dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 10)
    const q = customerSearch.toLowerCase()
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone != null && c.phone.toLowerCase().includes(q))
      )
      .slice(0, 10)
  }, [customers, customerSearch])

  // ── Handlers ──────────────────────────────────────────────────────────

  const navigateDate = (direction: number) => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => addDays(prev, direction * 7))
    } else {
      setCurrentDate((prev) => addDays(prev, direction))
    }
  }

  const goToToday = () => setCurrentDate(new Date())

  const openAddModal = () => {
    setEditingAppointment(null)
    setForm({ ...emptyForm, date: dateStr })
    setFormError('')
    setCustomerSearch('')
    setShowCustomerDropdown(false)
    setAvailableSlots([])
    setShowAddEditModal(true)
  }

  const openEditModal = (appt: Appointment) => {
    setEditingAppointment(appt)
    setForm({
      customer_id: appt.customer_id || '',
      customer_name: appt.customer_name || '',
      service_id: appt.service_id || '',
      service_name: appt.service_name || '',
      staff_id: appt.staff_id || '',
      staff_name: appt.staff_name || '',
      date: appt.date,
      time_start: appt.time_start,
      duration_minutes: appt.duration_minutes,
      price: appt.price || 0,
      notes: appt.notes || '',
      room_number: appt.room_number || '',
      guests: appt.guests || 1,
      destination: appt.destination || '',
      passengers: appt.passengers || 1,
    })
    setFormError('')
    setCustomerSearch(appt.customer_name || '')
    setShowCustomerDropdown(false)
    setAvailableSlots([])
    setShowAddEditModal(true)
  }

  const openDetailModal = (appt: Appointment) => {
    setSelectedAppointment(appt)
    setShowDetailModal(true)
  }

  const selectCustomer = (c: Customer) => {
    setForm((prev) => ({ ...prev, customer_id: c.id, customer_name: c.name }))
    setCustomerSearch(c.name)
    setShowCustomerDropdown(false)
  }

  const selectService = (p: Product) => {
    setForm((prev) => ({
      ...prev,
      service_id: p.id,
      service_name: p.name,
      duration_minutes: p.duration_minutes || 60,
      price: p.price,
    }))
    // Load available slots when service and date are set
    if (form.date && form.staff_id) {
      loadSlots(form.date, form.staff_id, p.duration_minutes || 60)
    }
  }

  const selectStaff = (u: User) => {
    setForm((prev) => ({ ...prev, staff_id: u.id, staff_name: u.name }))
    if (form.date && form.service_id) {
      loadSlots(form.date, u.id, form.duration_minutes)
    }
  }

  const loadSlots = (date: string, _staffId: string, duration: number) => {
    void _staffId // staff filtering done within store by storeId
    const slots = getAvailableSlots(storeId, date, duration)
    setAvailableSlots(slots)
  }

  const handleDateChange = (newDate: string) => {
    setForm((prev) => ({ ...prev, date: newDate, time_start: '' }))
    if (form.staff_id && form.service_id) {
      loadSlots(newDate, form.staff_id, form.duration_minutes)
    }
  }

  const computeEndTime = (start: string, durationMin: number): string => {
    const startMinutes = parseTime(start)
    const endMinutes = startMinutes + durationMin
    const h = Math.floor(endMinutes / 60)
    const m = endMinutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const handleSave = async () => {
    if (!form.customer_name.trim()) {
      setFormError(label.customer + ' - requis')
      return
    }
    if (!form.time_start) {
      setFormError(label.time + ' - requis')
      return
    }
    setSaving(true)
    setFormError('')

    try {
      const timeEnd = computeEndTime(form.time_start, form.duration_minutes)

      if (editingAppointment) {
        await updateAppointment(editingAppointment.id, {
          customer_id: form.customer_id || undefined,
          customer_name: form.customer_name.trim(),
          service_id: form.service_id || undefined,
          service_name: form.service_name || undefined,
          staff_id: form.staff_id || undefined,
          staff_name: form.staff_name || undefined,
          date: form.date,
          time_start: form.time_start,
          time_end: timeEnd,
          duration_minutes: form.duration_minutes,
          price: form.price || undefined,
          notes: form.notes.trim() || undefined,
          room_number: form.room_number.trim() || undefined,
          guests: form.guests > 0 ? form.guests : undefined,
          destination: form.destination.trim() || undefined,
          passengers: form.passengers > 0 ? form.passengers : undefined,
        })
      } else {
        await addAppointment(storeId, {
          customer_id: form.customer_id || undefined,
          customer_name: form.customer_name.trim(),
          service_id: form.service_id || undefined,
          service_name: form.service_name || undefined,
          staff_id: form.staff_id || undefined,
          staff_name: form.staff_name || undefined,
          date: form.date,
          time_start: form.time_start,
          time_end: timeEnd,
          duration_minutes: form.duration_minutes,
          status: 'scheduled',
          price: form.price || undefined,
          notes: form.notes.trim() || undefined,
          room_number: form.room_number.trim() || undefined,
          guests: form.guests > 0 ? form.guests : undefined,
          destination: form.destination.trim() || undefined,
          passengers: form.passengers > 0 ? form.passengers : undefined,
        })
      }
      setShowAddEditModal(false)
      setForm(emptyForm)
    } catch (err) {
      const msg = err instanceof Error ? err.message : label.error
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (appt: Appointment, newStatus: AppointmentStatus) => {
    await updateAppointment(appt.id, { status: newStatus })
    setSelectedAppointment((prev) => prev ? { ...prev, status: newStatus } : null)
  }

  const handleDelete = async () => {
    if (!selectedAppointment) return
    try {
      await deleteAppointment(selectedAppointment.id)
      setShowDeleteConfirm(false)
      setShowDetailModal(false)
      setSelectedAppointment(null)
    } catch (err) {
      console.error('Delete appointment error:', err)
    }
  }

  const formatDateShort = (dateString: string) => {
    const d = new Date(dateString + 'T00:00:00')
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // ── Styles ────────────────────────────────────────────────────────────

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
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    borderRadius: 16,
    color: '#ffffff',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 24, 28),
    fontWeight: 700,
    margin: 0,
    color: '#ffffff',
  }

  const statsRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 16,
    marginTop: 8,
    fontSize: 13,
    opacity: 0.9,
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 12,
    border: '2px solid rgba(255, 255, 255, 0.4)',
    background: 'rgba(255, 255, 255, 0.2)',
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

  const viewToggleBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 4,
    marginBottom: 16,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 4,
    border: `1px solid ${C.border}`,
    width: 'fit-content',
  }

  const viewBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: active ? C.primary : 'transparent',
    color: active ? '#ffffff' : C.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s',
  })

  const dateNavStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  }

  const navBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    backgroundColor: C.card,
    color: C.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
  }

  const dateDisplayStyle: React.CSSProperties = {
    fontSize: rv(14, 16, 18),
    fontWeight: 600,
    color: C.text,
    textTransform: 'capitalize',
  }

  const todayBtnStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 8,
    border: `1px solid ${C.primary}`,
    backgroundColor: 'transparent',
    color: C.primary,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }

  const dateInputStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 13,
    color: C.text,
    outline: 'none',
    backgroundColor: C.card,
  }

  // Timeline styles
  const timelineRowStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: `1px solid ${C.border}`,
    minHeight: 64,
  }

  const timelineLabelStyle: React.CSSProperties = {
    width: rv(50, 60, 70),
    flexShrink: 0,
    padding: '8px 4px',
    fontSize: 12,
    fontWeight: 600,
    color: C.textSecondary,
    borderRight: `1px solid ${C.border}`,
    textAlign: 'center',
  }

  const timelineContentStyle: React.CSSProperties = {
    flex: 1,
    padding: '4px 8px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'flex-start',
  }

  const appointmentChipStyle = (status: AppointmentStatus): React.CSSProperties => ({
    padding: '6px 10px',
    borderRadius: 8,
    backgroundColor: STATUS_COLORS[status] + '15',
    borderLeft: `3px solid ${STATUS_COLORS[status]}`,
    fontSize: 12,
    color: C.text,
    cursor: 'pointer',
    flex: '1 1 auto',
    maxWidth: '100%',
    transition: 'transform 0.1s',
  })

  const emptySlotStyle: React.CSSProperties = {
    fontSize: 11,
    color: C.textSecondary,
    fontStyle: 'italic',
    padding: '8px 0',
  }

  // Week view styles
  const weekGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(7, 1fr)`,
    gap: 8,
  }

  const weekDayHeaderStyle = (isToday: boolean): React.CSSProperties => ({
    textAlign: 'center',
    padding: '10px 4px',
    backgroundColor: isToday ? C.primary + '10' : C.card,
    borderRadius: 10,
    border: `1px solid ${isToday ? C.primary + '40' : C.border}`,
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  const weekDayNameStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }

  const weekDayNumberStyle = (isToday: boolean): React.CSSProperties => ({
    fontSize: 18,
    fontWeight: 700,
    color: isToday ? C.primary : C.text,
    margin: '4px 0',
  })

  const weekCountStyle: React.CSSProperties = {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 4,
  }

  const weekMiniApptStyle: React.CSSProperties = {
    fontSize: 10,
    color: C.text,
    backgroundColor: C.bg,
    padding: '2px 6px',
    borderRadius: 4,
    marginTop: 3,
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  // List view styles
  const statusTabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    marginBottom: 16,
    overflowX: 'auto',
    paddingBottom: 4,
  }

  const statusTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: 'none',
    backgroundColor: active ? C.primary : C.card,
    color: active ? '#ffffff' : C.textSecondary,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: active ? 'none' : `0 1px 3px rgba(0,0,0,0.06)`,
    transition: 'all 0.15s',
  })

  const listCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: rv(12, 14, 16),
    marginBottom: 10,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'transform 0.1s, box-shadow 0.1s',
  }

  const listCardTopStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  }

  const statusBadgeStyle = (status: AppointmentStatus): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    color: STATUS_COLORS[status],
    backgroundColor: STATUS_COLORS[status] + '15',
    whiteSpace: 'nowrap',
  })

  const listInfoRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 4,
  }

  // Form styles
  const formFieldStyle: React.CSSProperties = { marginBottom: 16 }
  const formLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    marginBottom: 6,
  }
  const formInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
  }
  const formSelectStyle: React.CSSProperties = {
    ...formInputStyle,
    appearance: 'auto' as const,
  }
  const formTextareaStyle: React.CSSProperties = {
    ...formInputStyle,
    minHeight: 70,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  }
  const formErrorStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    color: C.danger,
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 12,
  }
  const formBtnRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  }
  const cancelBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    backgroundColor: '#ffffff',
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  }
  const saveBtnStyle: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: saving ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    opacity: saving ? 0.7 : 1,
  }
  const deleteBtnStyle: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: C.danger,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  }

  const slotChipStyle = (selected: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${selected ? C.primary : C.border}`,
    backgroundColor: selected ? C.primary + '15' : C.card,
    color: selected ? C.primary : C.text,
    fontSize: 13,
    fontWeight: selected ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  const customerDropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    maxHeight: 200,
    overflowY: 'auto',
    zIndex: 10,
  }

  const customerItemStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 13,
    color: C.text,
    cursor: 'pointer',
    borderBottom: `1px solid ${C.border}`,
    transition: 'background-color 0.1s',
  }

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: 60,
    color: C.textSecondary,
  }

  // Detail modal styles
  const detailRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: `1px solid ${C.border}`,
    fontSize: 14,
  }

  const detailLabelStyleDef: React.CSSProperties = {
    color: C.textSecondary,
    fontWeight: 500,
    fontSize: 13,
  }

  const detailValueStyle: React.CSSProperties = {
    color: C.text,
    fontWeight: 600,
    fontSize: 14,
    textAlign: 'right',
  }

  const actionBtnStyle = (bgColor: string): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: bgColor,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'opacity 0.15s',
  })

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          ...pageStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: C.textSecondary, fontSize: 16 }}>{label.loading}</p>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{label.title}</h1>
          <div style={statsRowStyle}>
            <span>{todayAppointments.length} {label.appointmentsToday}</span>
            <span>|</span>
            <span>{todayConfirmed} {label.confirmed}</span>
          </div>
        </div>
        <button
          style={addBtnStyle}
          onClick={openAddModal}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <Plus size={16} /> {label.addNew}
        </button>
      </div>

      {/* ── View Toggle ─────────────────────────────────────────────────── */}
      <div style={viewToggleBarStyle}>
        <button
          style={viewBtnStyle(viewMode === 'day')}
          onClick={() => setViewMode('day')}
        >
          <Calendar size={14} /> {label.day}
        </button>
        <button
          style={viewBtnStyle(viewMode === 'week')}
          onClick={() => setViewMode('week')}
        >
          <CalendarDays size={14} /> {label.week}
        </button>
        <button
          style={viewBtnStyle(viewMode === 'list')}
          onClick={() => setViewMode('list')}
        >
          <List size={14} /> {label.list}
        </button>
      </div>

      {/* ── Date Navigation ─────────────────────────────────────────────── */}
      <div style={dateNavStyle}>
        <button style={navBtnStyle} onClick={() => navigateDate(-1)}>
          <ChevronLeft size={16} />
        </button>
        <span style={dateDisplayStyle}>
          {viewMode === 'week'
            ? `${formatDateShort(toDateStr(weekDays[0]))} - ${formatDateShort(toDateStr(weekDays[6]))}`
            : formatDateDisplay(currentDate)
          }
        </span>
        <button style={navBtnStyle} onClick={() => navigateDate(1)}>
          <ChevronRight size={16} />
        </button>
        <button style={todayBtnStyle} onClick={goToToday}>
          {label.today}
        </button>
        <input
          type="date"
          style={dateInputStyle}
          value={dateStr}
          onChange={(e) => setCurrentDate(new Date(e.target.value + 'T00:00:00'))}
        />
      </div>

      {/* ── Day View ────────────────────────────────────────────────────── */}
      {viewMode === 'day' && (
        <div
          style={{
            backgroundColor: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          {HOURS.map((hour) => {
            const hourStr = String(hour).padStart(2, '0')
            const hourAppts = dayAppointments.filter((a) => {
              const startH = parseInt(a.time_start.split(':')[0], 10)
              return startH === hour
            })
            return (
              <div key={hour} style={timelineRowStyle}>
                <div style={timelineLabelStyle}>{hourStr}:00</div>
                <div style={timelineContentStyle}>
                  {hourAppts.length === 0 ? (
                    <span style={emptySlotStyle}>{label.available}</span>
                  ) : (
                    hourAppts.map((appt) => (
                      <div
                        key={appt.id}
                        style={appointmentChipStyle(appt.status)}
                        onClick={() => openDetailModal(appt)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>
                          {formatTime(appt.time_start)} - {formatTime(appt.time_end)}
                        </div>
                        <div>{appt.customer_name || '---'}</div>
                        {appt.service_name && (
                          <div style={{ fontSize: 11, color: C.textSecondary }}>
                            {appt.service_name}
                          </div>
                        )}
                        {appt.staff_name && (
                          <div style={{ fontSize: 11, color: C.textSecondary }}>
                            <UserIcon size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                            {appt.staff_name}
                          </div>
                        )}
                        <span style={statusBadgeStyle(appt.status)}>
                          {STATUS_LABELS[appt.status]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Week View ───────────────────────────────────────────────────── */}
      {viewMode === 'week' && (
        <div style={weekGridStyle}>
          {weekDays.map((day, idx) => {
            const ds = toDateStr(day)
            const isToday = ds === toDateStr(new Date())
            const dayAppts = weekAppointments[ds] || []
            return (
              <div
                key={ds}
                style={weekDayHeaderStyle(isToday)}
                onClick={() => {
                  setCurrentDate(day)
                  setViewMode('day')
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={weekDayNameStyle}>{DAYS_OF_WEEK[idx]}</div>
                <div style={weekDayNumberStyle(isToday)}>{day.getDate()}</div>
                <div style={weekCountStyle}>
                  {dayAppts.length} rdv
                </div>
                {dayAppts.slice(0, 2).map((a) => (
                  <div key={a.id} style={weekMiniApptStyle}>
                    {formatTime(a.time_start)} {a.customer_name?.split(' ')[0] || '---'}
                  </div>
                ))}
                {dayAppts.length > 2 && (
                  <div style={{ fontSize: 10, color: C.primary, marginTop: 2, fontWeight: 600 }}>
                    +{dayAppts.length - 2} de plus
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── List View ───────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <>
          {/* Status filter tabs */}
          <div style={statusTabsStyle}>
            <button
              style={statusTabStyle(statusFilter === 'all')}
              onClick={() => setStatusFilter('all')}
            >
              {label.all} ({appointments.length})
            </button>
            {(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'] as AppointmentStatus[]).map(
              (s) => {
                const count = appointments.filter((a) => a.status === s).length
                return (
                  <button
                    key={s}
                    style={statusTabStyle(statusFilter === s)}
                    onClick={() => setStatusFilter(s)}
                  >
                    {STATUS_LABELS[s]} ({count})
                  </button>
                )
              }
            )}
          </div>

          {/* List cards */}
          {filteredAppointments.length === 0 ? (
            <div style={emptyStateStyle}>
              <Calendar size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: C.text,
                  margin: '0 0 6px',
                }}
              >
                {label.noAppointments}
              </p>
              <p style={{ fontSize: 13, margin: 0 }}>
                {label.noAppointmentsHint}
              </p>
            </div>
          ) : (
            <div>
              {filteredAppointments.map((appt) => (
                <div
                  key={appt.id}
                  style={listCardStyle}
                  onClick={() => openDetailModal(appt)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={listCardTopStyle}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                        {appt.customer_name || '---'}
                      </div>
                      <div style={listInfoRowStyle}>
                        <Calendar size={12} />
                        {formatDateShort(appt.date)} | {formatTime(appt.time_start)} - {formatTime(appt.time_end)}
                      </div>
                    </div>
                    <span style={statusBadgeStyle(appt.status)}>
                      {STATUS_LABELS[appt.status]}
                    </span>
                  </div>
                  {appt.service_name && (
                    <div style={listInfoRowStyle}>
                      <Clock size={12} /> {appt.service_name} ({appt.duration_minutes} min)
                    </div>
                  )}
                  {appt.staff_name && (
                    <div style={listInfoRowStyle}>
                      <UserIcon size={12} /> {appt.staff_name}
                    </div>
                  )}
                  {appt.price != null && appt.price > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 14,
                        fontWeight: 700,
                        color: C.primary,
                      }}
                    >
                      {formatCurrency(appt.price, currency)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add/Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        title={editingAppointment ? label.editAppointment : label.addAppointment}
        size="lg"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        {/* Customer search */}
        <div style={{ ...formFieldStyle, position: 'relative' }}>
          <label style={formLabelStyle}>{label.customer} *</label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: C.textSecondary,
                pointerEvents: 'none',
              }}
            />
            <input
              style={{ ...formInputStyle, paddingLeft: 36 }}
              type="text"
              placeholder={label.searchCustomer}
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value)
                setShowCustomerDropdown(true)
                if (!e.target.value.trim()) {
                  setForm((prev) => ({ ...prev, customer_id: '', customer_name: '' }))
                } else {
                  setForm((prev) => ({ ...prev, customer_name: e.target.value }))
                }
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
            />
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div style={customerDropdownStyle}>
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    style={customerItemStyle}
                    onMouseDown={() => selectCustomer(c)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = C.bg
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = C.card
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.phone && (
                      <div style={{ fontSize: 11, color: C.textSecondary }}>
                        {c.phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Service dropdown */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.service}</label>
          <select
            style={formSelectStyle}
            value={form.service_id}
            onChange={(e) => {
              const svc = services.find((s) => s.id === e.target.value)
              if (svc) selectService(svc)
            }}
          >
            <option value="">{label.selectService}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration_minutes} min - {formatCurrency(s.price, currency)})
              </option>
            ))}
          </select>
        </div>

        {/* Staff dropdown */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.staff}</label>
          <select
            style={formSelectStyle}
            value={form.staff_id}
            onChange={(e) => {
              const emp = employees.find((u) => u.id === e.target.value)
              if (emp) selectStaff(emp)
            }}
          >
            <option value="">{label.selectStaff}</option>
            {employees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 12,
          }}
        >
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{label.date} *</label>
            <input
              style={formInputStyle}
              type="date"
              value={form.date}
              onChange={(e) => handleDateChange(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{label.duration}</label>
            <input
              style={formInputStyle}
              type="number"
              min={15}
              step={15}
              value={form.duration_minutes}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 60
                setForm((prev) => ({ ...prev, duration_minutes: val }))
                if (form.date && form.staff_id) {
                  loadSlots(form.date, form.staff_id, val)
                }
              }}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>
        </div>

        {/* Available time slots */}
        {availableSlots.length > 0 && (
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{label.selectSlot}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  style={slotChipStyle(form.time_start === slot)}
                  onClick={() => setForm((prev) => ({ ...prev, time_start: slot }))}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual time input (if no slots loaded) */}
        {availableSlots.length === 0 && (
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{label.time} *</label>
            <input
              style={formInputStyle}
              type="time"
              value={form.time_start}
              onChange={(e) => setForm((prev) => ({ ...prev, time_start: e.target.value }))}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>
        )}

        {/* Price */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.price}</label>
          <input
            style={formInputStyle}
            type="number"
            min={0}
            value={form.price}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
            }
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>

        {/* Hotel-specific fields */}
        {(activity === 'hotel') && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 12,
            }}
          >
            <div style={formFieldStyle}>
              <label style={formLabelStyle}>{label.roomNumber}</label>
              <input
                style={formInputStyle}
                type="text"
                placeholder="Ex: 101"
                value={form.room_number}
                onChange={(e) => setForm((prev) => ({ ...prev, room_number: e.target.value }))}
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
            </div>
            <div style={formFieldStyle}>
              <label style={formLabelStyle}>{label.guests}</label>
              <input
                style={formInputStyle}
                type="number"
                min={1}
                value={form.guests}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, guests: parseInt(e.target.value, 10) || 1 }))
                }
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
            </div>
          </div>
        )}

        {/* Travel-specific fields */}
        {(activity === 'travel_agency') && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 12,
            }}
          >
            <div style={formFieldStyle}>
              <label style={formLabelStyle}>{label.destination}</label>
              <input
                style={formInputStyle}
                type="text"
                placeholder="Ex: Paris"
                value={form.destination}
                onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
            </div>
            <div style={formFieldStyle}>
              <label style={formLabelStyle}>{label.passengers}</label>
              <input
                style={formInputStyle}
                type="number"
                min={1}
                value={form.passengers}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    passengers: parseInt(e.target.value, 10) || 1,
                  }))
                }
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.notes}</label>
          <textarea
            style={formTextareaStyle}
            placeholder="Ex: Allergie au latex, preference fenetre..."
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>

        {/* Buttons */}
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowAddEditModal(false)}>
            {label.cancel}
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving ? label.loading : label.save}
          </button>
        </div>
      </Modal>

      {/* ── Detail Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedAppointment(null)
        }}
        title={label.appointmentDetail}
        size="md"
      >
        {selectedAppointment && (
          <>
            {/* Status badge */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span
                style={{
                  ...statusBadgeStyle(selectedAppointment.status),
                  fontSize: 14,
                  padding: '6px 18px',
                }}
              >
                {STATUS_LABELS[selectedAppointment.status]}
              </span>
            </div>

            {/* Info rows */}
            <div style={detailRowStyle}>
              <span style={detailLabelStyleDef}>{label.customer}</span>
              <span style={detailValueStyle}>
                {selectedAppointment.customer_name || '---'}
              </span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailLabelStyleDef}>{label.date}</span>
              <span style={detailValueStyle}>
                {formatDateShort(selectedAppointment.date)}
              </span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailLabelStyleDef}>{label.time}</span>
              <span style={detailValueStyle}>
                {formatTime(selectedAppointment.time_start)} - {formatTime(selectedAppointment.time_end)}
              </span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailLabelStyleDef}>{label.duration}</span>
              <span style={detailValueStyle}>
                {selectedAppointment.duration_minutes} min
              </span>
            </div>
            {selectedAppointment.service_name && (
              <div style={detailRowStyle}>
                <span style={detailLabelStyleDef}>{label.service}</span>
                <span style={detailValueStyle}>{selectedAppointment.service_name}</span>
              </div>
            )}
            {selectedAppointment.staff_name && (
              <div style={detailRowStyle}>
                <span style={detailLabelStyleDef}>{label.staff}</span>
                <span style={detailValueStyle}>{selectedAppointment.staff_name}</span>
              </div>
            )}
            {selectedAppointment.price != null && selectedAppointment.price > 0 && (
              <div style={detailRowStyle}>
                <span style={detailLabelStyleDef}>{label.price}</span>
                <span style={{ ...detailValueStyle, color: C.primary }}>
                  {formatCurrency(selectedAppointment.price, currency)}
                </span>
              </div>
            )}
            {selectedAppointment.room_number && (
              <div style={detailRowStyle}>
                <span style={detailLabelStyleDef}>{label.roomNumber}</span>
                <span style={detailValueStyle}>{selectedAppointment.room_number}</span>
              </div>
            )}
            {selectedAppointment.guests != null && selectedAppointment.guests > 0 && (
              <div style={detailRowStyle}>
                <span style={detailLabelStyleDef}>{label.guests}</span>
                <span style={detailValueStyle}>{selectedAppointment.guests}</span>
              </div>
            )}
            {selectedAppointment.destination && (
              <div style={detailRowStyle}>
                <span style={detailLabelStyleDef}>{label.destination}</span>
                <span style={detailValueStyle}>{selectedAppointment.destination}</span>
              </div>
            )}
            {selectedAppointment.passengers != null && selectedAppointment.passengers > 0 && (
              <div style={detailRowStyle}>
                <span style={detailLabelStyleDef}>{label.passengers}</span>
                <span style={detailValueStyle}>{selectedAppointment.passengers}</span>
              </div>
            )}
            {selectedAppointment.notes && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: '#fffbeb',
                  borderRadius: 10,
                  border: '1px solid #fde68a',
                  fontSize: 13,
                  color: C.text,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12 }}>
                  {label.notes}
                </div>
                {selectedAppointment.notes}
              </div>
            )}

            {/* Status actions */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 20,
                paddingTop: 16,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              {selectedAppointment.status === 'scheduled' && (
                <>
                  <button
                    style={actionBtnStyle(STATUS_COLORS.confirmed)}
                    onClick={() => handleStatusChange(selectedAppointment, 'confirmed')}
                  >
                    <CheckCircle size={14} /> {label.confirm}
                  </button>
                  <button
                    style={actionBtnStyle(STATUS_COLORS.cancelled)}
                    onClick={() => handleStatusChange(selectedAppointment, 'cancelled')}
                  >
                    <XCircle size={14} /> {label.cancel}
                  </button>
                </>
              )}
              {selectedAppointment.status === 'confirmed' && (
                <>
                  <button
                    style={actionBtnStyle(STATUS_COLORS.in_progress)}
                    onClick={() => handleStatusChange(selectedAppointment, 'in_progress')}
                  >
                    <PlayCircle size={14} /> {label.start}
                  </button>
                  <button
                    style={actionBtnStyle(STATUS_COLORS.cancelled)}
                    onClick={() => handleStatusChange(selectedAppointment, 'cancelled')}
                  >
                    <XCircle size={14} /> {label.cancel}
                  </button>
                  <button
                    style={actionBtnStyle(STATUS_COLORS.no_show)}
                    onClick={() => handleStatusChange(selectedAppointment, 'no_show')}
                  >
                    <AlertCircle size={14} /> {label.noShow}
                  </button>
                </>
              )}
              {selectedAppointment.status === 'in_progress' && (
                <button
                  style={actionBtnStyle(STATUS_COLORS.completed)}
                  onClick={() => handleStatusChange(selectedAppointment, 'completed')}
                >
                  <CheckCircle size={14} /> {label.complete}
                </button>
              )}
            </div>

            {/* Edit / Delete actions */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                marginTop: 16,
                paddingTop: 12,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <button
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: `1px solid ${C.danger}`,
                  backgroundColor: '#ffffff',
                  color: C.danger,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} /> {label.delete}
              </button>
              <button
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onClick={() => {
                  setShowDetailModal(false)
                  openEditModal(selectedAppointment)
                }}
              >
                <Eye size={14} /> {label.editAppointment}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={label.delete}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 8px' }}>
          {label.deleteConfirm}
        </p>
        <p
          style={{
            fontSize: 13,
            color: C.textSecondary,
            margin: '0 0 4px',
          }}
        >
          <strong>
            {selectedAppointment?.customer_name} - {selectedAppointment?.date}{' '}
            {selectedAppointment?.time_start && formatTime(selectedAppointment.time_start)}
          </strong>
        </p>
        <p
          style={{
            fontSize: 12,
            color: C.danger,
            margin: 0,
          }}
        >
          {label.deleteWarning}
        </p>
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowDeleteConfirm(false)}>
            {label.cancel}
          </button>
          <button style={deleteBtnStyle} onClick={handleDelete}>
            {label.delete}
          </button>
        </div>
      </Modal>
    </div>
  )
}
