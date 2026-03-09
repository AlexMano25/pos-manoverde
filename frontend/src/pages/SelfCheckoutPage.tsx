import { useState, useEffect, useMemo } from 'react'
import {
  Monitor,
  Plus,
  Search,
  Trash2,
  Edit2,
  Eye,
  Play,
  Square,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Banknote,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Users,
  DollarSign,
  Hash,
  Timer,
  Power,
  PowerOff,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useSelfCheckoutStore } from '../stores/selfCheckoutStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { generateUUID } from '../utils/uuid'
import type { KioskSession, KioskSessionStatus, KioskTerminal, KioskCartItem } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#059669',
  primaryLight: '#d1fae5',
  primaryDark: '#047857',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#2563eb',
  infoBg: '#eff6ff',
  orange: '#ea580c',
  orangeBg: '#fff7ed',
} as const

// ── Status config ─────────────────────────────────────────────────────────

const SESSION_STATUS_CONFIG: Record<KioskSessionStatus, { color: string; bg: string }> = {
  active:    { color: '#16a34a', bg: '#f0fdf4' },
  completed: { color: '#2563eb', bg: '#eff6ff' },
  abandoned: { color: '#ea580c', bg: '#fff7ed' },
  cancelled: { color: '#dc2626', bg: '#fef2f2' },
}

const ALL_SESSION_STATUSES: KioskSessionStatus[] = ['active', 'completed', 'abandoned', 'cancelled']

// ── Tab type ──────────────────────────────────────────────────────────────

type TabKey = 'terminals' | 'sessions'

// ── Component ─────────────────────────────────────────────────────────────

export default function SelfCheckoutPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    sessions,
    loading,
    filterStatus,
    loadSessions,
    addSession,
    deleteSession,
    completeSession,
    abandonSession,
    cancelSession,
    getTodayRevenue,
    getActiveCount,
    setFilterStatus,
  } = useSelfCheckoutStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'

  // i18n
  const sc = (t as Record<string, any>).selfCheckout || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: sc.title || 'Self-Checkout / Kiosk',
    subtitle: sc.subtitle || 'Manage kiosk terminals and self-checkout sessions',
    addTerminal: sc.addTerminal || 'Add Terminal',
    editTerminal: sc.editTerminal || 'Edit Terminal',
    viewSession: sc.viewSession || 'Session Details',
    totalSessions: sc.totalSessions || 'Total Sessions',
    activeSessions: sc.activeSessions || 'Active Sessions',
    todayRevenue: sc.todayRevenue || 'Today Revenue',
    avgBasket: sc.avgBasket || 'Average Basket',
    terminals: sc.terminals || 'Terminals',
    sessionsTab: sc.sessionsTab || 'Sessions',
    terminalName: sc.terminalName || 'Terminal Name',
    location: sc.location || 'Location',
    welcomeMessage: sc.welcomeMessage || 'Welcome Message',
    paymentOptions: sc.paymentOptions || 'Payment Options',
    allowCash: sc.allowCash || 'Cash',
    allowCard: sc.allowCard || 'Card',
    allowMobile: sc.allowMobile || 'Mobile Money',
    idleTimeout: sc.idleTimeout || 'Idle Timeout (sec)',
    isActive: sc.isActive || 'Active',
    sessionNumber: sc.sessionNumber || 'Session #',
    terminal: sc.terminal || 'Terminal',
    status: sc.status || 'Status',
    items: sc.items || 'Items',
    total: sc.total || 'Total',
    payment: sc.payment || 'Payment',
    duration: sc.duration || 'Duration',
    startedAt: sc.startedAt || 'Started',
    completedAt: sc.completedAt || 'Completed',
    customer: sc.customer || 'Customer',
    subtotal: sc.subtotal || 'Subtotal',
    tax: sc.tax || 'Tax',
    discount: sc.discount || 'Discount',
    paymentMethod: sc.paymentMethod || 'Payment Method',
    paymentStatus: sc.paymentStatus || 'Payment Status',
    orderId: sc.orderId || 'Order ID',
    language: sc.language || 'Language',
    notes: sc.notes || 'Notes',
    itemsList: sc.itemsList || 'Items List',
    product: sc.product || 'Product',
    qty: sc.qty || 'Qty',
    unitPrice: sc.unitPrice || 'Unit Price',
    lineTotal: sc.lineTotal || 'Line Total',
    noTerminals: sc.noTerminals || 'No terminals configured',
    noTerminalsDesc: sc.noTerminalsDesc || 'Add a self-checkout terminal to get started.',
    noSessions: sc.noSessions || 'No kiosk sessions yet',
    noSessionsDesc: sc.noSessionsDesc || 'Sessions will appear here when customers use kiosks.',
    noResults: sc.noResults || 'No results match your filters',
    noResultsDesc: sc.noResultsDesc || 'Try adjusting the filters or search query.',
    allStatuses: sc.allStatuses || 'All Statuses',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    delete: sc.delete || 'Delete',
    deleteConfirm: sc.deleteConfirm || 'Are you sure you want to delete this?',
    deleteTerminalConfirm: sc.deleteTerminalConfirm || 'Are you sure you want to delete this terminal?',
    deleteSessionConfirm: sc.deleteSessionConfirm || 'Are you sure you want to delete this session?',
    markCompleted: sc.markCompleted || 'Complete',
    markAbandoned: sc.markAbandoned || 'Abandon',
    markCancelled: sc.markCancelled || 'Cancel Session',
    activate: sc.activate || 'Activate',
    deactivate: sc.deactivate || 'Deactivate',
    sessionsCount: sc.sessionsCount || 'sessions',
    terminalsCount: sc.terminalsCount || 'terminals',
    // Status labels
    st_active: sc.st_active || 'Active',
    st_completed: sc.st_completed || 'Completed',
    st_abandoned: sc.st_abandoned || 'Abandoned',
    st_cancelled: sc.st_cancelled || 'Cancelled',
    // Payment status labels
    ps_pending: sc.ps_pending || 'Pending',
    ps_paid: sc.ps_paid || 'Paid',
    ps_failed: sc.ps_failed || 'Failed',
  }

  const sessionStatusLabel = (s: KioskSessionStatus): string =>
    (L as Record<string, string>)[`st_${s}`] || s

  // ── Tabs ────────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<TabKey>('terminals')

  // ── Local terminals state (managed locally since no store for terminals) ──

  const [terminals, setTerminals] = useState<KioskTerminal[]>([])

  // Load terminals from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kiosk_terminals_${storeId}`)
      if (saved) {
        setTerminals(JSON.parse(saved))
      }
    } catch {
      // ignore
    }
  }, [storeId])

  // Save terminals to localStorage
  function persistTerminals(updated: KioskTerminal[]) {
    setTerminals(updated)
    try {
      localStorage.setItem(`kiosk_terminals_${storeId}`, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showTerminalModal, setShowTerminalModal] = useState(false)
  const [editingTerminal, setEditingTerminal] = useState<KioskTerminal | null>(null)
  const [viewingSession, setViewingSession] = useState<KioskSession | null>(null)
  const [deleteTerminalTarget, setDeleteTerminalTarget] = useState<string | null>(null)
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<string | null>(null)

  // Terminal form state
  const [formName, setFormName] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formWelcome, setFormWelcome] = useState('')
  const [formAllowCash, setFormAllowCash] = useState(true)
  const [formAllowCard, setFormAllowCard] = useState(true)
  const [formAllowMobile, setFormAllowMobile] = useState(false)
  const [formIdleTimeout, setFormIdleTimeout] = useState('120')
  const [formSaving, setFormSaving] = useState(false)

  // ── Load sessions on mount ─────────────────────────────────────────────

  useEffect(() => {
    loadSessions(storeId)
  }, [storeId, loadSessions])

  // ── Filtered sessions ──────────────────────────────────────────────────

  const filteredSessions = useMemo(() => {
    let result = [...sessions]

    if (filterStatus !== 'all') {
      result = result.filter((s) => s.status === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.session_number.toLowerCase().includes(q) ||
          s.terminal_name.toLowerCase().includes(q) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q))
      )
    }

    return result
  }, [sessions, filterStatus, searchQuery])

  // ── Filtered terminals ─────────────────────────────────────────────────

  const filteredTerminals = useMemo(() => {
    if (!searchQuery.trim()) return terminals

    const q = searchQuery.toLowerCase()
    return terminals.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.welcome_message && t.welcome_message.toLowerCase().includes(q))
    )
  }, [terminals, searchQuery])

  // ── Stats ──────────────────────────────────────────────────────────────

  const todayRevenue = getTodayRevenue()
  const activeCount = getActiveCount()

  const avgBasket = useMemo(() => {
    const completed = sessions.filter((s) => s.status === 'completed')
    if (completed.length === 0) return 0
    return completed.reduce((sum, s) => sum + s.total, 0) / completed.length
  }, [sessions])

  // ── Terminal form helpers ──────────────────────────────────────────────

  function resetTerminalForm() {
    setFormName('')
    setFormLocation('')
    setFormWelcome('')
    setFormAllowCash(true)
    setFormAllowCard(true)
    setFormAllowMobile(false)
    setFormIdleTimeout('120')
    setEditingTerminal(null)
  }

  function openAddTerminalModal() {
    resetTerminalForm()
    setShowTerminalModal(true)
  }

  function openEditTerminalModal(terminal: KioskTerminal) {
    setEditingTerminal(terminal)
    setFormName(terminal.name)
    setFormLocation(terminal.location || '')
    setFormWelcome(terminal.welcome_message || '')
    setFormAllowCash(terminal.allow_cash)
    setFormAllowCard(terminal.allow_card)
    setFormAllowMobile(terminal.allow_mobile)
    setFormIdleTimeout(String(terminal.idle_timeout_seconds))
    setShowTerminalModal(true)
  }

  async function handleSaveTerminal() {
    if (!formName.trim()) return

    setFormSaving(true)
    try {
      const now = new Date().toISOString()
      const timeout = parseInt(formIdleTimeout, 10) || 120

      if (editingTerminal) {
        const updated: KioskTerminal = {
          ...editingTerminal,
          name: formName.trim(),
          location: formLocation.trim() || undefined,
          welcome_message: formWelcome.trim() || undefined,
          allow_cash: formAllowCash,
          allow_card: formAllowCard,
          allow_mobile: formAllowMobile,
          idle_timeout_seconds: timeout,
          updated_at: now,
        }
        persistTerminals(
          terminals.map((t) => (t.id === editingTerminal.id ? updated : t))
        )
      } else {
        const newTerminal: KioskTerminal = {
          id: generateUUID(),
          store_id: storeId,
          name: formName.trim(),
          location: formLocation.trim() || undefined,
          is_active: true,
          welcome_message: formWelcome.trim() || undefined,
          allow_cash: formAllowCash,
          allow_card: formAllowCard,
          allow_mobile: formAllowMobile,
          idle_timeout_seconds: timeout,
          created_at: now,
          updated_at: now,
        }
        persistTerminals([...terminals, newTerminal])
      }

      setShowTerminalModal(false)
      resetTerminalForm()
    } catch (error) {
      console.error('[SelfCheckoutPage] Save terminal error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  function handleDeleteTerminal(id: string) {
    persistTerminals(terminals.filter((t) => t.id !== id))
    setDeleteTerminalTarget(null)
  }

  function toggleTerminalActive(terminal: KioskTerminal) {
    const updated: KioskTerminal = {
      ...terminal,
      is_active: !terminal.is_active,
      updated_at: new Date().toISOString(),
    }
    persistTerminals(
      terminals.map((t) => (t.id === terminal.id ? updated : t))
    )
  }

  // ── Session action helpers ─────────────────────────────────────────────

  async function handleCompleteSession(id: string) {
    try {
      await completeSession(id)
    } catch (error) {
      console.error('[SelfCheckoutPage] Complete session error:', error)
    }
  }

  async function handleAbandonSession(id: string) {
    try {
      await abandonSession(id)
    } catch (error) {
      console.error('[SelfCheckoutPage] Abandon session error:', error)
    }
  }

  async function handleCancelSession(id: string) {
    try {
      await cancelSession(id)
    } catch (error) {
      console.error('[SelfCheckoutPage] Cancel session error:', error)
    }
  }

  async function handleDeleteSession(id: string) {
    try {
      await deleteSession(id)
      setDeleteSessionTarget(null)
    } catch (error) {
      console.error('[SelfCheckoutPage] Delete session error:', error)
    }
  }

  // ── Demo: start a new kiosk session ────────────────────────────────────

  async function handleStartSession(terminal: KioskTerminal) {
    const demoItems: KioskCartItem[] = [
      {
        product_id: generateUUID(),
        product_name: 'Sample Item',
        quantity: 1,
        unit_price: 500,
        total: 500,
      },
    ]
    try {
      await addSession(storeId, {
        terminal_id: terminal.id,
        terminal_name: terminal.name,
        items: demoItems,
        subtotal: 500,
        tax: 0,
        discount: 0,
        total: 500,
        payment_status: 'pending',
        status: 'active',
        language: 'fr',
        started_at: new Date().toISOString(),
      })
      setActiveTab('sessions')
    } catch (error) {
      console.error('[SelfCheckoutPage] Start session error:', error)
    }
  }

  // ── Formatting helpers ─────────────────────────────────────────────────

  function formatDateTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso.slice(0, 16)
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return iso.slice(0, 10)
    }
  }

  function formatDuration(startIso: string, endIso?: string): string {
    const start = new Date(startIso).getTime()
    const end = endIso ? new Date(endIso).getTime() : Date.now()
    const diffMs = Math.max(0, end - start)
    const totalSec = Math.floor(diffMs / 1000)
    const hrs = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60

    if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, '0')}m`
    if (mins > 0) return `${mins}m ${String(secs).padStart(2, '0')}s`
    return `${secs}s`
  }

  // ── Styles ────────────────────────────────────────────────────────────

  const s = {
    page: {
      padding: rv(12, 20, 24),
      backgroundColor: C.bg,
      minHeight: '100vh',
    } as React.CSSProperties,

    header: {
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 12,
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    headerLeft: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 4,
    } as React.CSSProperties,

    title: {
      margin: 0,
      fontSize: rv(20, 24, 28),
      fontWeight: 700,
      color: C.text,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as React.CSSProperties,

    subtitle: {
      margin: 0,
      fontSize: rv(12, 13, 14),
      color: C.textSecondary,
      fontWeight: 400,
    } as React.CSSProperties,

    addBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      backgroundColor: C.primary,
      color: '#ffffff',
      border: 'none',
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      whiteSpace: 'nowrap',
    } as React.CSSProperties,

    statsGrid: {
      display: 'grid',
      gridTemplateColumns: rv('1fr 1fr', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
      gap: rv(10, 14, 16),
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    statCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      padding: rv(14, 18, 20),
      border: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    } as React.CSSProperties,

    statLabel: {
      fontSize: rv(11, 12, 13),
      fontWeight: 500,
      color: C.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    } as React.CSSProperties,

    statValue: {
      fontSize: rv(18, 22, 26),
      fontWeight: 700,
      color: C.text,
    } as React.CSSProperties,

    statIcon: (bgColor: string) =>
      ({
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      } as React.CSSProperties),

    tabBar: {
      display: 'flex',
      gap: 0,
      marginBottom: rv(16, 20, 24),
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
    } as React.CSSProperties,

    tabBtn: (isActive: boolean) =>
      ({
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: rv('12px 16px', '14px 24px', '14px 28px'),
        border: 'none',
        backgroundColor: isActive ? C.primary : 'transparent',
        color: isActive ? '#ffffff' : C.textSecondary,
        fontSize: rv(13, 14, 15),
        fontWeight: isActive ? 600 : 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderRight: `1px solid ${C.border}`,
      } as React.CSSProperties),

    filterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: rv(8, 10, 12),
      alignItems: 'center',
      marginBottom: rv(16, 20, 24),
      backgroundColor: C.card,
      padding: rv(12, 14, 16),
      borderRadius: 12,
      border: `1px solid ${C.border}`,
    } as React.CSSProperties,

    searchInput: {
      flex: 1,
      minWidth: rv(140, 180, 220),
      padding: '9px 12px 9px 36px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: C.bg,
      outline: 'none',
    } as React.CSSProperties,

    selectInput: {
      padding: '9px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: C.bg,
      outline: 'none',
      cursor: 'pointer',
      minWidth: rv(100, 130, 150),
    } as React.CSSProperties,

    // Terminal grid
    terminalGrid: {
      display: 'grid',
      gridTemplateColumns: rv('1fr', '1fr 1fr', 'repeat(3, 1fr)'),
      gap: rv(12, 16, 20),
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    terminalCard: (isActive: boolean) =>
      ({
        backgroundColor: C.card,
        borderRadius: 14,
        border: `2px solid ${isActive ? C.primary : C.border}`,
        padding: rv(16, 18, 22),
        position: 'relative',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: isActive
          ? '0 4px 20px rgba(5, 150, 105, 0.12)'
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
      } as React.CSSProperties),

    terminalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    } as React.CSSProperties,

    terminalName: {
      fontSize: rv(15, 16, 17),
      fontWeight: 700,
      color: C.text,
      margin: 0,
      lineHeight: 1.3,
    } as React.CSSProperties,

    terminalLocation: {
      fontSize: 12,
      color: C.textSecondary,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    } as React.CSSProperties,

    terminalBadge: (active: boolean) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        color: active ? C.success : C.textMuted,
        backgroundColor: active ? C.successBg : '#f8fafc',
        whiteSpace: 'nowrap',
      } as React.CSSProperties),

    terminalPayments: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginTop: 12,
      marginBottom: 12,
    } as React.CSSProperties,

    paymentChip: (enabled: boolean) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        color: enabled ? C.primary : C.textMuted,
        backgroundColor: enabled ? C.primaryLight : '#f8fafc',
        border: `1px solid ${enabled ? '#a7f3d0' : C.border}`,
      } as React.CSSProperties),

    terminalTimeout: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 12,
      color: C.textSecondary,
      marginBottom: 14,
    } as React.CSSProperties,

    terminalActions: {
      display: 'flex',
      gap: 6,
      paddingTop: 14,
      borderTop: `1px solid ${C.border}`,
      flexWrap: 'wrap',
    } as React.CSSProperties,

    terminalActionBtn: (color: string, bgColor: string) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '6px 12px',
        border: 'none',
        borderRadius: 7,
        fontSize: 12,
        fontWeight: 500,
        color,
        backgroundColor: bgColor,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      } as React.CSSProperties),

    // Sessions table
    tableWrapper: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    } as React.CSSProperties,

    th: {
      padding: '12px 16px',
      textAlign: 'left' as const,
      fontSize: 12,
      fontWeight: 600,
      color: C.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      borderBottom: `2px solid ${C.border}`,
      backgroundColor: '#f8fafc',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    td: {
      padding: '12px 16px',
      fontSize: 14,
      color: C.text,
      borderBottom: `1px solid ${C.border}`,
      verticalAlign: 'middle' as const,
    } as React.CSSProperties,

    badge: (color: string, bg: string) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color,
        backgroundColor: bg,
        whiteSpace: 'nowrap',
      } as React.CSSProperties),

    actionBtn: (color: string) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        border: 'none',
        borderRadius: 6,
        backgroundColor: 'transparent',
        color,
        cursor: 'pointer',
        transition: 'background-color 0.15s',
      } as React.CSSProperties),

    // Mobile card layout
    mobileCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: 14,
      marginBottom: 10,
    } as React.CSSProperties,

    mobileCardRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    } as React.CSSProperties,

    // Form styles
    formGroup: {
      marginBottom: 16,
    } as React.CSSProperties,

    formLabel: {
      display: 'block',
      marginBottom: 6,
      fontSize: 13,
      fontWeight: 600,
      color: C.text,
    } as React.CSSProperties,

    formInput: {
      width: '100%',
      padding: '10px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    formTextarea: {
      width: '100%',
      padding: '10px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box' as const,
      resize: 'vertical' as const,
      minHeight: 70,
      fontFamily: 'inherit',
    } as React.CSSProperties,

    formRow: {
      display: 'grid',
      gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
      gap: 12,
    } as React.CSSProperties,

    formFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 20,
      paddingTop: 16,
      borderTop: `1px solid ${C.border}`,
    } as React.CSSProperties,

    cancelBtn: {
      padding: '10px 20px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      color: C.textSecondary,
      backgroundColor: '#ffffff',
      cursor: 'pointer',
    } as React.CSSProperties,

    saveBtn: {
      padding: '10px 24px',
      border: 'none',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: C.primary,
      cursor: 'pointer',
      opacity: formSaving ? 0.7 : 1,
    } as React.CSSProperties,

    checkboxRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
      cursor: 'pointer',
    } as React.CSSProperties,

    checkbox: (checked: boolean) =>
      ({
        width: 20,
        height: 20,
        borderRadius: 5,
        border: `2px solid ${checked ? C.primary : C.border}`,
        backgroundColor: checked ? C.primary : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
      } as React.CSSProperties),

    checkboxLabel: {
      fontSize: 14,
      color: C.text,
      cursor: 'pointer',
    } as React.CSSProperties,

    // Detail row for view modal
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '10px 0',
      borderBottom: `1px solid ${C.border}`,
      gap: 12,
    } as React.CSSProperties,

    detailLabel: {
      fontSize: 13,
      fontWeight: 600,
      color: C.textSecondary,
      minWidth: 120,
      flexShrink: 0,
    } as React.CSSProperties,

    detailValue: {
      fontSize: 14,
      color: C.text,
      textAlign: 'right' as const,
      wordBreak: 'break-word' as const,
    } as React.CSSProperties,

    // Items table in session detail
    itemsTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: 8,
    } as React.CSSProperties,

    itemsTh: {
      padding: '8px 10px',
      textAlign: 'left' as const,
      fontSize: 11,
      fontWeight: 600,
      color: C.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      borderBottom: `2px solid ${C.border}`,
      backgroundColor: '#f8fafc',
    } as React.CSSProperties,

    itemsTd: {
      padding: '8px 10px',
      fontSize: 13,
      color: C.text,
      borderBottom: `1px solid ${C.border}`,
    } as React.CSSProperties,

    // Empty state
    emptyState: {
      textAlign: 'center' as const,
      padding: rv(40, 60, 80),
      color: C.textSecondary,
    } as React.CSSProperties,

    emptyIcon: {
      marginBottom: 16,
      color: C.textMuted,
    } as React.CSSProperties,

    emptyTitle: {
      fontSize: 18,
      fontWeight: 600,
      color: C.text,
      margin: '0 0 8px',
    } as React.CSSProperties,

    emptyDesc: {
      fontSize: 14,
      color: C.textSecondary,
      margin: 0,
    } as React.CSSProperties,

    // Loading
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 60,
      color: C.textSecondary,
      fontSize: 15,
    } as React.CSSProperties,

    // Confirm dialog overlay
    confirmOverlay: {
      position: 'fixed' as const,
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
    } as React.CSSProperties,

    confirmBox: {
      backgroundColor: C.card,
      borderRadius: 14,
      padding: rv(20, 24, 28),
      maxWidth: 400,
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    } as React.CSSProperties,

    confirmTitle: {
      margin: '0 0 12px',
      fontSize: 16,
      fontWeight: 600,
      color: C.text,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    } as React.CSSProperties,

    confirmText: {
      margin: '0 0 20px',
      fontSize: 14,
      color: C.textSecondary,
      lineHeight: 1.5,
    } as React.CSSProperties,

    confirmActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
    } as React.CSSProperties,

    confirmCancelBtn: {
      padding: '8px 18px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      color: C.textSecondary,
      backgroundColor: '#ffffff',
      cursor: 'pointer',
    } as React.CSSProperties,

    confirmDeleteBtn: {
      padding: '8px 18px',
      border: 'none',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: C.danger,
      cursor: 'pointer',
    } as React.CSSProperties,
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && sessions.length === 0 && terminals.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <Monitor size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading self-checkout data...</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <h1 style={s.title}>
            <Monitor size={rv(22, 26, 28)} color={C.primary} />
            {L.title}
          </h1>
          <p style={s.subtitle}>{L.subtitle}</p>
        </div>
        <button
          style={s.addBtn}
          onClick={openAddTerminalModal}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = C.primaryDark
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = C.primary
          }}
        >
          <Plus size={18} />
          {L.addTerminal}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total Sessions */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={s.statIcon(C.primaryLight)}>
              <BarChart3 size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalSessions}</span>
          </div>
          <div style={s.statValue}>{sessions.length}</div>
        </div>

        {/* Active Sessions */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={s.statIcon(C.successBg)}>
              <Users size={18} color={C.success} />
            </div>
            <span style={s.statLabel}>{L.activeSessions}</span>
          </div>
          <div style={{ ...s.statValue, color: activeCount > 0 ? C.success : C.text }}>
            {activeCount}
          </div>
        </div>

        {/* Today Revenue */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={s.statIcon(C.warningBg)}>
              <DollarSign size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.todayRevenue}</span>
          </div>
          <div style={s.statValue}>{formatCurrency(todayRevenue, currency)}</div>
        </div>

        {/* Average Basket */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={s.statIcon(C.infoBg)}>
              <ShoppingCart size={18} color={C.info} />
            </div>
            <span style={s.statLabel}>{L.avgBasket}</span>
          </div>
          <div style={s.statValue}>{formatCurrency(avgBasket, currency)}</div>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div style={s.tabBar}>
        <button
          style={s.tabBtn(activeTab === 'terminals')}
          onClick={() => setActiveTab('terminals')}
          onMouseEnter={(e) => {
            if (activeTab !== 'terminals') e.currentTarget.style.backgroundColor = '#f8fafc'
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'terminals') e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <Monitor size={rv(14, 16, 16)} />
          {L.terminals}
          <span
            style={{
              backgroundColor: activeTab === 'terminals' ? 'rgba(255,255,255,0.25)' : C.bg,
              color: activeTab === 'terminals' ? '#ffffff' : C.textSecondary,
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {terminals.length}
          </span>
        </button>
        <button
          style={{ ...s.tabBtn(activeTab === 'sessions'), borderRight: 'none' }}
          onClick={() => setActiveTab('sessions')}
          onMouseEnter={(e) => {
            if (activeTab !== 'sessions') e.currentTarget.style.backgroundColor = '#f8fafc'
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'sessions') e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <ShoppingCart size={rv(14, 16, 16)} />
          {L.sessionsTab}
          <span
            style={{
              backgroundColor: activeTab === 'sessions' ? 'rgba(255,255,255,0.25)' : C.bg,
              color: activeTab === 'sessions' ? '#ffffff' : C.textSecondary,
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {sessions.length}
          </span>
        </button>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div style={s.filterBar}>
        <div style={{ position: 'relative', flex: 1, minWidth: rv(140, 180, 220) }}>
          <Search
            size={16}
            color={C.textMuted}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder={L.search + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={s.searchInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {activeTab === 'sessions' && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as KioskSessionStatus | 'all')}
            style={s.selectInput}
          >
            <option value="all">{L.allStatuses}</option>
            {ALL_SESSION_STATUSES.map((st) => (
              <option key={st} value={st}>
                {sessionStatusLabel(st)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB: TERMINALS ─────────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {activeTab === 'terminals' && (
        <>
          {terminals.length === 0 ? (
            <div style={{ ...s.tableWrapper, ...s.emptyState }}>
              <div style={s.emptyIcon}>
                <Monitor size={48} />
              </div>
              <h3 style={s.emptyTitle}>{L.noTerminals}</h3>
              <p style={s.emptyDesc}>{L.noTerminalsDesc}</p>
              <button
                style={{ ...s.addBtn, marginTop: 20 }}
                onClick={openAddTerminalModal}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = C.primaryDark
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = C.primary
                }}
              >
                <Plus size={18} />
                {L.addTerminal}
              </button>
            </div>
          ) : filteredTerminals.length === 0 ? (
            <div style={{ ...s.tableWrapper, ...s.emptyState }}>
              <div style={s.emptyIcon}>
                <Search size={48} />
              </div>
              <h3 style={s.emptyTitle}>{L.noResults}</h3>
              <p style={s.emptyDesc}>{L.noResultsDesc}</p>
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: C.textSecondary,
                  marginBottom: 12,
                  fontWeight: 500,
                }}
              >
                {filteredTerminals.length} {L.terminalsCount}
              </div>

              <div style={s.terminalGrid}>
                {filteredTerminals.map((terminal) => (
                  <div
                    key={terminal.id}
                    style={s.terminalCard(terminal.is_active)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(5, 150, 105, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = terminal.is_active
                        ? '0 4px 20px rgba(5, 150, 105, 0.12)'
                        : '0 2px 8px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    {/* Terminal header */}
                    <div style={s.terminalHeader}>
                      <div>
                        <h3 style={s.terminalName}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Monitor size={16} color={terminal.is_active ? C.primary : C.textMuted} />
                            {terminal.name}
                          </span>
                        </h3>
                        {terminal.location && (
                          <div style={s.terminalLocation}>
                            <MapPin size={12} />
                            {terminal.location}
                          </div>
                        )}
                      </div>
                      <span style={s.terminalBadge(terminal.is_active)}>
                        {terminal.is_active ? (
                          <>
                            <CheckCircle size={12} />
                            {L.st_active}
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>

                    {/* Welcome message */}
                    {terminal.welcome_message && (
                      <div
                        style={{
                          fontSize: 12,
                          color: C.textSecondary,
                          fontStyle: 'italic',
                          marginBottom: 10,
                          padding: '8px 10px',
                          backgroundColor: '#f8fafc',
                          borderRadius: 6,
                          borderLeft: `3px solid ${C.primary}`,
                          lineHeight: 1.4,
                        }}
                      >
                        &ldquo;{terminal.welcome_message}&rdquo;
                      </div>
                    )}

                    {/* Payment methods */}
                    <div style={s.terminalPayments}>
                      <span style={s.paymentChip(terminal.allow_cash)}>
                        <Banknote size={12} />
                        {L.allowCash}
                      </span>
                      <span style={s.paymentChip(terminal.allow_card)}>
                        <CreditCard size={12} />
                        {L.allowCard}
                      </span>
                      <span style={s.paymentChip(terminal.allow_mobile)}>
                        <Smartphone size={12} />
                        {L.allowMobile}
                      </span>
                    </div>

                    {/* Idle timeout */}
                    <div style={s.terminalTimeout}>
                      <Timer size={13} color={C.textMuted} />
                      {L.idleTimeout}: {terminal.idle_timeout_seconds}s
                    </div>

                    {/* Created date */}
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>
                      {formatDate(terminal.created_at)}
                    </div>

                    {/* Actions */}
                    <div style={s.terminalActions}>
                      <button
                        style={s.terminalActionBtn(C.info, C.infoBg)}
                        onClick={() => openEditTerminalModal(terminal)}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                        title={L.editTerminal}
                      >
                        <Edit2 size={13} />
                        {!isMobile && L.editTerminal}
                      </button>

                      {terminal.is_active && (
                        <button
                          style={s.terminalActionBtn('#ffffff', C.primary)}
                          onClick={() => handleStartSession(terminal)}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                          title="Start Session"
                        >
                          <Play size={13} />
                          {!isMobile && 'Start'}
                        </button>
                      )}

                      <button
                        style={s.terminalActionBtn(
                          terminal.is_active ? C.warning : C.success,
                          terminal.is_active ? C.warningBg : C.successBg
                        )}
                        onClick={() => toggleTerminalActive(terminal)}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                        title={terminal.is_active ? L.deactivate : L.activate}
                      >
                        {terminal.is_active ? <PowerOff size={13} /> : <Power size={13} />}
                        {!isMobile && (terminal.is_active ? L.deactivate : L.activate)}
                      </button>

                      <button
                        style={{
                          ...s.terminalActionBtn(C.danger, C.dangerBg),
                          marginLeft: 'auto',
                        }}
                        onClick={() => setDeleteTerminalTarget(terminal.id)}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                        title={L.delete}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB: SESSIONS ──────────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {activeTab === 'sessions' && (
        <>
          {sessions.length === 0 ? (
            <div style={{ ...s.tableWrapper, ...s.emptyState }}>
              <div style={s.emptyIcon}>
                <ShoppingCart size={48} />
              </div>
              <h3 style={s.emptyTitle}>{L.noSessions}</h3>
              <p style={s.emptyDesc}>{L.noSessionsDesc}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div style={{ ...s.tableWrapper, ...s.emptyState }}>
              <div style={s.emptyIcon}>
                <Search size={48} />
              </div>
              <h3 style={s.emptyTitle}>{L.noResults}</h3>
              <p style={s.emptyDesc}>{L.noResultsDesc}</p>
            </div>
          ) : isMobile ? (
            /* ── Mobile session cards ──────────────────────────────────── */
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: C.textSecondary,
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                {filteredSessions.length} {L.sessionsCount}
              </div>

              {filteredSessions.map((session) => {
                const stCfg = SESSION_STATUS_CONFIG[session.status]

                return (
                  <div key={session.id} style={s.mobileCard}>
                    {/* Top: session number + status */}
                    <div style={s.mobileCardRow}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>
                        <Hash size={11} style={{ marginRight: 2 }} />
                        {session.session_number}
                      </span>
                      <span style={s.badge(stCfg.color, stCfg.bg)}>
                        {sessionStatusLabel(session.status)}
                      </span>
                    </div>

                    {/* Terminal name */}
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: C.text,
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Monitor size={13} color={C.primary} />
                      {session.terminal_name}
                    </div>

                    {/* Customer */}
                    {session.customer_name && (
                      <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
                        {L.customer}: {session.customer_name}
                      </div>
                    )}

                    {/* Items, total, duration row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 6,
                        marginBottom: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: C.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <ShoppingCart size={11} />
                        {session.items.length} {L.items}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>
                        {formatCurrency(session.total, currency)}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: C.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Clock size={11} />
                        {formatDuration(session.started_at, session.completed_at)}
                      </span>
                    </div>

                    {/* Payment status */}
                    <div style={{ marginBottom: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {session.payment_method && (
                        <span
                          style={s.badge(C.info, C.infoBg)}
                        >
                          <CreditCard size={10} />
                          {session.payment_method}
                        </span>
                      )}
                      <span
                        style={s.badge(
                          session.payment_status === 'paid'
                            ? C.success
                            : session.payment_status === 'failed'
                              ? C.danger
                              : C.warning,
                          session.payment_status === 'paid'
                            ? C.successBg
                            : session.payment_status === 'failed'
                              ? C.dangerBg
                              : C.warningBg
                        )}
                      >
                        {(L as Record<string, string>)[`ps_${session.payment_status}`] ||
                          session.payment_status}
                      </span>
                    </div>

                    {/* Started time */}
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
                      {formatDateTime(session.started_at)}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        paddingTop: 10,
                        borderTop: `1px solid ${C.border}`,
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        onClick={() => setViewingSession(session)}
                        style={{
                          ...s.actionBtn(C.info),
                          width: 'auto',
                          padding: '5px 10px',
                          fontSize: 12,
                        }}
                        title={L.viewSession}
                      >
                        <Eye size={13} />
                      </button>

                      {session.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleCompleteSession(session.id)}
                            style={{
                              ...s.actionBtn(C.success),
                              width: 'auto',
                              padding: '5px 10px',
                              fontSize: 12,
                            }}
                            title={L.markCompleted}
                          >
                            <CheckCircle size={13} />
                          </button>
                          <button
                            onClick={() => handleAbandonSession(session.id)}
                            style={{
                              ...s.actionBtn(C.orange),
                              width: 'auto',
                              padding: '5px 10px',
                              fontSize: 12,
                            }}
                            title={L.markAbandoned}
                          >
                            <AlertTriangle size={13} />
                          </button>
                          <button
                            onClick={() => handleCancelSession(session.id)}
                            style={{
                              ...s.actionBtn(C.danger),
                              width: 'auto',
                              padding: '5px 10px',
                              fontSize: 12,
                            }}
                            title={L.markCancelled}
                          >
                            <Square size={13} />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setDeleteSessionTarget(session.id)}
                        style={{
                          ...s.actionBtn(C.danger),
                          width: 'auto',
                          padding: '5px 10px',
                          fontSize: 12,
                          marginLeft: 'auto',
                        }}
                        title={L.delete}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* ── Desktop/tablet sessions table ──────────────────────── */
            <div style={s.tableWrapper}>
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: `1px solid ${C.border}`,
                  fontSize: 12,
                  color: C.textSecondary,
                  fontWeight: 500,
                }}
              >
                {filteredSessions.length} {L.sessionsCount}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>{L.sessionNumber}</th>
                      <th style={s.th}>{L.terminal}</th>
                      <th style={s.th}>{L.status}</th>
                      <th style={s.th}>{L.items}</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>{L.total}</th>
                      <th style={s.th}>{L.payment}</th>
                      <th style={s.th}>{L.duration}</th>
                      <th style={s.th}>{L.startedAt}</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => {
                      const stCfg = SESSION_STATUS_CONFIG[session.status]

                      return (
                        <tr
                          key={session.id}
                          style={{ transition: 'background-color 0.15s' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = ''
                          }}
                        >
                          <td style={s.td}>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: C.textMuted,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <Hash size={12} />
                              {session.session_number}
                            </span>
                          </td>
                          <td style={s.td}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                fontWeight: 500,
                              }}
                            >
                              <Monitor size={14} color={C.primary} />
                              {session.terminal_name}
                            </div>
                            {session.customer_name && (
                              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                                {session.customer_name}
                              </div>
                            )}
                          </td>
                          <td style={s.td}>
                            <span style={s.badge(stCfg.color, stCfg.bg)}>
                              {sessionStatusLabel(session.status)}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <ShoppingCart size={13} color={C.textMuted} />
                              {session.items.length}
                            </span>
                          </td>
                          <td
                            style={{
                              ...s.td,
                              textAlign: 'right',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              color: C.primary,
                            }}
                          >
                            {formatCurrency(session.total, currency)}
                          </td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {session.payment_method && (
                                <span style={s.badge(C.info, C.infoBg)}>
                                  <CreditCard size={10} />
                                  {session.payment_method}
                                </span>
                              )}
                              <span
                                style={s.badge(
                                  session.payment_status === 'paid'
                                    ? C.success
                                    : session.payment_status === 'failed'
                                      ? C.danger
                                      : C.warning,
                                  session.payment_status === 'paid'
                                    ? C.successBg
                                    : session.payment_status === 'failed'
                                      ? C.dangerBg
                                      : C.warningBg
                                )}
                              >
                                {(L as Record<string, string>)[`ps_${session.payment_status}`] ||
                                  session.payment_status}
                              </span>
                            </div>
                          </td>
                          <td style={s.td}>
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                whiteSpace: 'nowrap',
                                fontSize: 13,
                              }}
                            >
                              <Clock size={13} color={C.textMuted} />
                              {formatDuration(session.started_at, session.completed_at)}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                              {formatDateTime(session.started_at)}
                            </span>
                          </td>
                          <td style={{ ...s.td, textAlign: 'center' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                              }}
                            >
                              <button
                                onClick={() => setViewingSession(session)}
                                style={s.actionBtn(C.info)}
                                title={L.viewSession}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = C.infoBg
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <Eye size={15} />
                              </button>

                              {session.status === 'active' && (
                                <>
                                  <button
                                    onClick={() => handleCompleteSession(session.id)}
                                    style={s.actionBtn(C.success)}
                                    title={L.markCompleted}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = C.successBg
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <CheckCircle size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleAbandonSession(session.id)}
                                    style={s.actionBtn(C.orange)}
                                    title={L.markAbandoned}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = C.orangeBg
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <AlertTriangle size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleCancelSession(session.id)}
                                    style={s.actionBtn(C.danger)}
                                    title={L.markCancelled}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = C.dangerBg
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <Square size={15} />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => setDeleteSessionTarget(session.id)}
                                style={s.actionBtn(C.danger)}
                                title={L.delete}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = C.dangerBg
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── Add / Edit Terminal Modal ──────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      <Modal
        isOpen={showTerminalModal}
        onClose={() => {
          setShowTerminalModal(false)
          resetTerminalForm()
        }}
        title={editingTerminal ? L.editTerminal : L.addTerminal}
        size="md"
      >
        {/* Name & Location */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.terminalName} *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={L.terminalName + '...'}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.location}</label>
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder={L.location + '...'}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        </div>

        {/* Welcome Message */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.welcomeMessage}</label>
          <textarea
            value={formWelcome}
            onChange={(e) => setFormWelcome(e.target.value)}
            placeholder={L.welcomeMessage + '...'}
            style={s.formTextarea}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Payment Options */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.paymentOptions}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={s.checkboxRow}
              onClick={() => setFormAllowCash(!formAllowCash)}
            >
              <div style={s.checkbox(formAllowCash)}>
                {formAllowCash && <CheckCircle size={12} color="#ffffff" />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Banknote size={16} color={formAllowCash ? C.primary : C.textMuted} />
                <span style={s.checkboxLabel}>{L.allowCash}</span>
              </div>
            </div>

            <div
              style={s.checkboxRow}
              onClick={() => setFormAllowCard(!formAllowCard)}
            >
              <div style={s.checkbox(formAllowCard)}>
                {formAllowCard && <CheckCircle size={12} color="#ffffff" />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard size={16} color={formAllowCard ? C.primary : C.textMuted} />
                <span style={s.checkboxLabel}>{L.allowCard}</span>
              </div>
            </div>

            <div
              style={s.checkboxRow}
              onClick={() => setFormAllowMobile(!formAllowMobile)}
            >
              <div style={s.checkbox(formAllowMobile)}>
                {formAllowMobile && <CheckCircle size={12} color="#ffffff" />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Smartphone size={16} color={formAllowMobile ? C.primary : C.textMuted} />
                <span style={s.checkboxLabel}>{L.allowMobile}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Idle Timeout */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.idleTimeout}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              value={formIdleTimeout}
              onChange={(e) => setFormIdleTimeout(e.target.value)}
              min="30"
              max="900"
              step="10"
              style={{ ...s.formInput, width: 120, flex: 'none' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
            <span style={{ fontSize: 13, color: C.textSecondary }}>
              ({Math.floor((parseInt(formIdleTimeout, 10) || 120) / 60)} min{' '}
              {(parseInt(formIdleTimeout, 10) || 120) % 60}s)
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={s.formFooter}>
          <button
            style={s.cancelBtn}
            onClick={() => {
              setShowTerminalModal(false)
              resetTerminalForm()
            }}
          >
            {L.cancel}
          </button>
          <button
            style={s.saveBtn}
            onClick={handleSaveTerminal}
            disabled={formSaving || !formName.trim()}
          >
            {formSaving ? '...' : L.save}
          </button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── View Session Modal ─────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      <Modal
        isOpen={!!viewingSession}
        onClose={() => setViewingSession(null)}
        title={L.viewSession}
        size="lg"
      >
        {viewingSession && (
          <div>
            {/* Session header summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Hash size={16} color={C.primary} />
                <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                  {viewingSession.session_number}
                </span>
              </div>
              <span
                style={s.badge(
                  SESSION_STATUS_CONFIG[viewingSession.status].color,
                  SESSION_STATUS_CONFIG[viewingSession.status].bg
                )}
              >
                {sessionStatusLabel(viewingSession.status)}
              </span>
            </div>

            {/* Detail rows */}
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.terminal}</span>
              <span style={s.detailValue}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                  <Monitor size={14} color={C.primary} />
                  {viewingSession.terminal_name}
                </span>
              </span>
            </div>

            {viewingSession.customer_name && (
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.customer}</span>
                <span style={s.detailValue}>
                  {viewingSession.customer_name}
                  {viewingSession.customer_phone && (
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                      {viewingSession.customer_phone}
                    </div>
                  )}
                </span>
              </div>
            )}

            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.subtotal}</span>
              <span style={{ ...s.detailValue, fontWeight: 500 }}>
                {formatCurrency(viewingSession.subtotal, currency)}
              </span>
            </div>

            {viewingSession.tax > 0 && (
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.tax}</span>
                <span style={s.detailValue}>
                  {formatCurrency(viewingSession.tax, currency)}
                </span>
              </div>
            )}

            {viewingSession.discount > 0 && (
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.discount}</span>
                <span style={{ ...s.detailValue, color: C.danger }}>
                  -{formatCurrency(viewingSession.discount, currency)}
                </span>
              </div>
            )}

            <div style={s.detailRow}>
              <span style={{ ...s.detailLabel, fontWeight: 700, color: C.text }}>{L.total}</span>
              <span
                style={{
                  ...s.detailValue,
                  fontWeight: 700,
                  fontSize: 18,
                  color: C.primary,
                }}
              >
                {formatCurrency(viewingSession.total, currency)}
              </span>
            </div>

            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.paymentMethod}</span>
              <span style={s.detailValue}>
                {viewingSession.payment_method ? (
                  <span style={s.badge(C.info, C.infoBg)}>
                    <CreditCard size={11} />
                    {viewingSession.payment_method}
                  </span>
                ) : (
                  <span style={{ color: C.textMuted }}>--</span>
                )}
              </span>
            </div>

            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.paymentStatus}</span>
              <span style={s.detailValue}>
                <span
                  style={s.badge(
                    viewingSession.payment_status === 'paid'
                      ? C.success
                      : viewingSession.payment_status === 'failed'
                        ? C.danger
                        : C.warning,
                    viewingSession.payment_status === 'paid'
                      ? C.successBg
                      : viewingSession.payment_status === 'failed'
                        ? C.dangerBg
                        : C.warningBg
                  )}
                >
                  {(L as Record<string, string>)[`ps_${viewingSession.payment_status}`] ||
                    viewingSession.payment_status}
                </span>
              </span>
            </div>

            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.duration}</span>
              <span style={s.detailValue}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <Clock size={13} color={C.textMuted} />
                  {formatDuration(viewingSession.started_at, viewingSession.completed_at)}
                </span>
              </span>
            </div>

            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.startedAt}</span>
              <span style={s.detailValue}>{formatDateTime(viewingSession.started_at)}</span>
            </div>

            {viewingSession.completed_at && (
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.completedAt}</span>
                <span style={s.detailValue}>{formatDateTime(viewingSession.completed_at)}</span>
              </div>
            )}

            {viewingSession.order_id && (
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.orderId}</span>
                <span
                  style={{
                    ...s.detailValue,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: C.textMuted,
                  }}
                >
                  {viewingSession.order_id}
                </span>
              </div>
            )}

            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.language}</span>
              <span style={s.detailValue}>
                {viewingSession.language.toUpperCase()}
              </span>
            </div>

            {viewingSession.notes && (
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.notes}</span>
                <span style={{ ...s.detailValue, fontStyle: 'italic', color: C.textSecondary }}>
                  {viewingSession.notes}
                </span>
              </div>
            )}

            {/* ── Items list ─────────────────────────────────────────────── */}
            <div style={{ marginTop: 20 }}>
              <h3
                style={{
                  margin: '0 0 10px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ShoppingCart size={16} color={C.primary} />
                {L.itemsList} ({viewingSession.items.length})
              </h3>

              {viewingSession.items.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: 'center',
                    color: C.textMuted,
                    fontSize: 13,
                    backgroundColor: '#f8fafc',
                    borderRadius: 8,
                  }}
                >
                  No items
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <table style={s.itemsTable}>
                    <thead>
                      <tr>
                        <th style={s.itemsTh}>{L.product}</th>
                        <th style={{ ...s.itemsTh, textAlign: 'center' }}>{L.qty}</th>
                        <th style={{ ...s.itemsTh, textAlign: 'right' }}>{L.unitPrice}</th>
                        <th style={{ ...s.itemsTh, textAlign: 'right' }}>{L.lineTotal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingSession.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={s.itemsTd}>
                            <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                          </td>
                          <td style={{ ...s.itemsTd, textAlign: 'center' }}>
                            {item.quantity}
                          </td>
                          <td style={{ ...s.itemsTd, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {formatCurrency(item.unit_price, currency)}
                          </td>
                          <td
                            style={{
                              ...s.itemsTd,
                              textAlign: 'right',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatCurrency(item.total, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            ...s.itemsTd,
                            textAlign: 'right',
                            fontWeight: 700,
                            borderBottom: 'none',
                            fontSize: 14,
                          }}
                        >
                          {L.total}:
                        </td>
                        <td
                          style={{
                            ...s.itemsTd,
                            textAlign: 'right',
                            fontWeight: 700,
                            borderBottom: 'none',
                            fontSize: 14,
                            color: C.primary,
                          }}
                        >
                          {formatCurrency(viewingSession.total, currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Session action buttons */}
            {viewingSession.status === 'active' && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: `1px solid ${C.border}`,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: C.success,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    handleCompleteSession(viewingSession.id)
                    setViewingSession(null)
                  }}
                >
                  <CheckCircle size={14} />
                  {L.markCompleted}
                </button>
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: C.orange,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    handleAbandonSession(viewingSession.id)
                    setViewingSession(null)
                  }}
                >
                  <AlertTriangle size={14} />
                  {L.markAbandoned}
                </button>
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: C.danger,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    handleCancelSession(viewingSession.id)
                    setViewingSession(null)
                  }}
                >
                  <Square size={14} />
                  {L.markCancelled}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── Delete Terminal Confirm ─────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {deleteTerminalTarget && (
        <div style={s.confirmOverlay} onClick={() => setDeleteTerminalTarget(null)}>
          <div
            style={s.confirmBox}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={s.confirmTitle}>
              <AlertTriangle size={18} color={C.danger} />
              {L.delete}
            </h3>
            <p style={s.confirmText}>{L.deleteTerminalConfirm}</p>
            <div style={s.confirmActions}>
              <button
                style={s.confirmCancelBtn}
                onClick={() => setDeleteTerminalTarget(null)}
              >
                {L.cancel}
              </button>
              <button
                style={s.confirmDeleteBtn}
                onClick={() => handleDeleteTerminal(deleteTerminalTarget)}
              >
                {L.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── Delete Session Confirm ─────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {deleteSessionTarget && (
        <div style={s.confirmOverlay} onClick={() => setDeleteSessionTarget(null)}>
          <div
            style={s.confirmBox}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={s.confirmTitle}>
              <AlertTriangle size={18} color={C.danger} />
              {L.delete}
            </h3>
            <p style={s.confirmText}>{L.deleteSessionConfirm}</p>
            <div style={s.confirmActions}>
              <button
                style={s.confirmCancelBtn}
                onClick={() => setDeleteSessionTarget(null)}
              >
                {L.cancel}
              </button>
              <button
                style={s.confirmDeleteBtn}
                onClick={() => handleDeleteSession(deleteSessionTarget)}
              >
                {L.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
