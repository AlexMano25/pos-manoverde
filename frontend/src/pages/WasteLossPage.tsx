import { useState, useEffect, useMemo } from 'react'
import {
  Trash2,
  Plus,
  Search,
  Edit,
  Eye,
  CheckCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ClipboardList,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useWasteLossStore } from '../stores/wasteLossStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { WasteCategory, WasteEntry } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#dc2626',
  primaryLight: '#fef2f2',
  primaryDark: '#b91c1c',
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
} as const

// ── Category config ──────────────────────────────────────────────────────

const ALL_CATEGORIES: WasteCategory[] = [
  'food_waste',
  'spoilage',
  'breakage',
  'theft',
  'spillage',
  'expired',
  'damaged',
  'other',
]

const CATEGORY_CONFIG: Record<WasteCategory, { color: string; bg: string }> = {
  food_waste: { color: '#ea580c', bg: '#fff7ed' },
  spoilage:   { color: '#ca8a04', bg: '#fefce8' },
  breakage:   { color: '#dc2626', bg: '#fef2f2' },
  theft:      { color: '#9333ea', bg: '#faf5ff' },
  spillage:   { color: '#2563eb', bg: '#eff6ff' },
  expired:    { color: '#64748b', bg: '#f8fafc' },
  damaged:    { color: '#db2777', bg: '#fdf2f8' },
  other:      { color: '#475569', bg: '#f1f5f9' },
}

// ── Component ─────────────────────────────────────────────────────────────

export default function WasteLossPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    entries,
    loading,
    filterCategory,
    loadEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    approveEntry,
    getMonthlyTotal,
    getTodayTotal,
    getTopCategory,
    setFilterCategory,
  } = useWasteLossStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n
  const wl = (t as Record<string, any>).wasteLoss || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: wl.title || 'Waste & Loss Tracking',
    subtitle: wl.subtitle || 'Track waste, shrinkage, breakage, and other losses',
    addEntry: wl.addEntry || 'New Entry',
    editEntry: wl.editEntry || 'Edit Entry',
    viewEntry: wl.viewEntry || 'Entry Details',
    totalEntries: wl.totalEntries || 'Total Entries',
    monthlyLoss: wl.monthlyLoss || 'Monthly Loss',
    todayLoss: wl.todayLoss || "Today's Loss",
    topCategory: wl.topCategory || 'Top Category',
    entryNumber: wl.entryNumber || 'Entry #',
    product: wl.product || 'Product',
    category: wl.category || 'Category',
    quantity: wl.quantity || 'Quantity',
    unitCost: wl.unitCost || 'Unit Cost',
    totalCost: wl.totalCost || 'Total Cost',
    reason: wl.reason || 'Reason',
    notes: wl.notes || 'Notes',
    wasteDate: wl.wasteDate || 'Date',
    reportedBy: wl.reportedBy || 'Reported By',
    approvedBy: wl.approvedBy || 'Approved By',
    approved: wl.approved || 'Approved',
    pending: wl.pending || 'Pending',
    approvalStatus: wl.approvalStatus || 'Status',
    actions: wl.actions || 'Actions',
    productName: wl.productName || 'Product Name',
    allCategories: wl.allCategories || 'All Categories',
    noEntries: wl.noEntries || 'No waste entries recorded yet',
    noEntriesDesc: wl.noEntriesDesc || 'Start tracking waste and losses to monitor shrinkage.',
    noResults: wl.noResults || 'No entries match your filters',
    noResultsDesc: wl.noResultsDesc || 'Try adjusting the filters or search query.',
    approve: wl.approve || 'Approve',
    delete: wl.delete || 'Delete',
    save: tCommon.save || 'Save',
    cancelBtn: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    entriesCount: wl.entriesCount || 'entries',
    deleteConfirm: wl.deleteConfirm || 'Are you sure you want to delete this waste entry? This action cannot be undone.',
    deleteTitle: wl.deleteTitle || 'Delete Entry',
    approveConfirm: wl.approveConfirm || 'Are you sure you want to approve this waste entry?',
    approveTitle: wl.approveTitle || 'Approve Entry',
    createdAt: wl.createdAt || 'Created At',
    updatedAt: wl.updatedAt || 'Updated At',
    entryInfo: wl.entryInfo || 'Entry Information',
    costDetails: wl.costDetails || 'Cost Details',
    none: wl.none || 'None',
    saving: wl.saving || 'Saving...',
    // Category labels
    cat_food_waste: wl.cat_food_waste || 'Food Waste',
    cat_spoilage: wl.cat_spoilage || 'Spoilage',
    cat_breakage: wl.cat_breakage || 'Breakage',
    cat_theft: wl.cat_theft || 'Theft',
    cat_spillage: wl.cat_spillage || 'Spillage',
    cat_expired: wl.cat_expired || 'Expired',
    cat_damaged: wl.cat_damaged || 'Damaged',
    cat_other: wl.cat_other || 'Other',
  }

  const categoryLabel = (cat: WasteCategory): string => (L as Record<string, string>)[`cat_${cat}`] || cat

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WasteEntry | null>(null)
  const [viewingEntry, setViewingEntry] = useState<WasteEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [approveTarget, setApproveTarget] = useState<WasteEntry | null>(null)

  // Form state
  const [formProductName, setFormProductName] = useState('')
  const [formCategory, setFormCategory] = useState<WasteCategory>('food_waste')
  const [formQuantity, setFormQuantity] = useState<number>(1)
  const [formUnitCost, setFormUnitCost] = useState<number>(0)
  const [formReason, setFormReason] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formWasteDate, setFormWasteDate] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // ── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    loadEntries(storeId)
  }, [storeId, loadEntries])

  // ── Filtered and searched entries ─────────────────────────────────────

  const filteredEntries = useMemo(() => {
    let result = [...entries]

    if (filterCategory !== 'all') {
      result = result.filter((e) => e.category === filterCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.entry_number.toLowerCase().includes(q) ||
          e.product_name.toLowerCase().includes(q) ||
          e.reported_by_name.toLowerCase().includes(q) ||
          e.reason.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      )
    }

    return result
  }, [entries, filterCategory, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const monthlyLoss = getMonthlyTotal(storeId)
  const todayLoss = getTodayTotal(storeId)
  const topCat = getTopCategory(storeId)

  // ── Form helpers ──────────────────────────────────────────────────────

  function getTodayISO(): string {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function resetForm() {
    setFormProductName('')
    setFormCategory('food_waste')
    setFormQuantity(1)
    setFormUnitCost(0)
    setFormReason('')
    setFormNotes('')
    setFormWasteDate(getTodayISO())
    setEditingEntry(null)
  }

  function openAddModal() {
    resetForm()
    setFormWasteDate(getTodayISO())
    setShowModal(true)
  }

  function openEditModal(entry: WasteEntry) {
    setEditingEntry(entry)
    setFormProductName(entry.product_name)
    setFormCategory(entry.category)
    setFormQuantity(entry.quantity)
    setFormUnitCost(entry.unit_cost)
    setFormReason(entry.reason)
    setFormNotes(entry.notes || '')
    setFormWasteDate(entry.waste_date.slice(0, 10))
    setShowModal(true)
  }

  const formTotalCost = useMemo(
    () => formQuantity * formUnitCost,
    [formQuantity, formUnitCost]
  )

  async function handleSave() {
    if (!formProductName.trim() || !formReason.trim()) return

    setFormSaving(true)
    try {
      const wasteDateISO = new Date(formWasteDate + 'T00:00:00').toISOString()

      if (editingEntry) {
        await updateEntry(editingEntry.id, {
          product_name: formProductName.trim(),
          category: formCategory,
          quantity: formQuantity,
          unit_cost: formUnitCost,
          total_cost: formQuantity * formUnitCost,
          reason: formReason.trim(),
          notes: formNotes.trim() || undefined,
          waste_date: wasteDateISO,
        })
      } else {
        await addEntry(storeId, {
          product_name: formProductName.trim(),
          product_id: formProductName.trim().toLowerCase().replace(/\s+/g, '-'),
          category: formCategory,
          quantity: formQuantity,
          unit_cost: formUnitCost,
          total_cost: formQuantity * formUnitCost,
          reason: formReason.trim(),
          notes: formNotes.trim() || undefined,
          reported_by: userId,
          reported_by_name: userName,
          waste_date: wasteDateISO,
        })
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[WasteLossPage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEntry(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[WasteLossPage] Delete error:', error)
    }
  }

  async function handleApprove(entry: WasteEntry) {
    try {
      await approveEntry(entry.id, userId, userName)
      setApproveTarget(null)
    } catch (error) {
      console.error('[WasteLossPage] Approve error:', error)
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
      flexDirection: 'column',
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

    cancelBtnStyle: {
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

    // Detail row in view modal
    detailRow: {
      display: 'grid',
      gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
      gap: 12,
      marginBottom: 16,
    } as React.CSSProperties,

    detailLabel: {
      fontSize: 11,
      fontWeight: 600,
      color: C.textSecondary,
      textTransform: 'uppercase' as const,
      marginBottom: 4,
    } as React.CSSProperties,

    detailValue: {
      fontSize: 14,
      fontWeight: 500,
      color: C.text,
    } as React.CSSProperties,
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && entries.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <Trash2 size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading waste entries...</div>
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
            <Trash2 size={rv(22, 26, 28)} color={C.primary} />
            {L.title}
          </h1>
          <p style={s.subtitle}>{L.subtitle}</p>
        </div>
        <button
          style={s.addBtn}
          onClick={openAddModal}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = C.primaryDark
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = C.primary
          }}
        >
          <Plus size={18} />
          {L.addEntry}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total entries */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ClipboardList size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalEntries}</span>
          </div>
          <div style={s.statValue}>{entries.length}</div>
        </div>

        {/* Monthly loss */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.dangerBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} color={C.danger} />
            </div>
            <span style={s.statLabel}>{L.monthlyLoss}</span>
          </div>
          <div style={s.statValue}>{formatCurrency(monthlyLoss, currency)}</div>
        </div>

        {/* Today's loss */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.warningBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.todayLoss}</span>
          </div>
          <div style={s.statValue}>{formatCurrency(todayLoss, currency)}</div>
        </div>

        {/* Top category */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: topCat ? CATEGORY_CONFIG[topCat].bg : '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} color={topCat ? CATEGORY_CONFIG[topCat].color : C.textMuted} />
            </div>
            <span style={s.statLabel}>{L.topCategory}</span>
          </div>
          <div style={s.statValue}>
            {topCat ? (
              <span
                style={s.badge(
                  CATEGORY_CONFIG[topCat].color,
                  CATEGORY_CONFIG[topCat].bg
                )}
              >
                {categoryLabel(topCat)}
              </span>
            ) : (
              <span style={{ fontSize: rv(14, 16, 18), color: C.textMuted }}>{L.none}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters bar ─────────────────────────────────────────────────── */}
      <div style={s.filterBar}>
        {/* Search */}
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

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as WasteCategory | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allCategories}</option>
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {categoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Entry list ────────────────────────────────────────────────────── */}
      {entries.length === 0 ? (
        /* Empty state - no entries at all */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <Trash2 size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noEntries}</h3>
          <p style={s.emptyDesc}>{L.noEntriesDesc}</p>
          <button
            style={{ ...s.addBtn, marginTop: 20 }}
            onClick={openAddModal}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = C.primaryDark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = C.primary
            }}
          >
            <Plus size={18} />
            {L.addEntry}
          </button>
        </div>
      ) : filteredEntries.length === 0 ? (
        /* Empty state - filters returned nothing */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <Search size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noResults}</h3>
          <p style={s.emptyDesc}>{L.noResultsDesc}</p>
        </div>
      ) : isMobile ? (
        /* ── Mobile cards ──────────────────────────────────────────────── */
        <div>
          <div
            style={{
              fontSize: 12,
              color: C.textSecondary,
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            {filteredEntries.length} {L.entriesCount}
          </div>
          {filteredEntries.map((entry) => {
            const catCfg = CATEGORY_CONFIG[entry.category]
            const isApproved = !!entry.approved_by

            return (
              <div key={entry.id} style={s.mobileCard}>
                {/* Top row: entry number + total cost */}
                <div style={s.mobileCardRow}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                    {entry.entry_number}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                    {formatCurrency(entry.total_cost, currency)}
                  </span>
                </div>

                {/* Product name */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: C.text,
                    marginBottom: 6,
                  }}
                >
                  {entry.product_name}
                </div>

                {/* Quantity & date */}
                <div
                  style={{
                    fontSize: 12,
                    color: C.textSecondary,
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{L.quantity}: {entry.quantity}</span>
                  <span>{formatDate(entry.waste_date)}</span>
                </div>

                {/* Category + approval status */}
                <div style={{ ...s.mobileCardRow, marginBottom: 0 }}>
                  <span style={s.badge(catCfg.color, catCfg.bg)}>
                    {categoryLabel(entry.category)}
                  </span>
                  <span
                    style={s.badge(
                      isApproved ? C.success : C.warning,
                      isApproved ? C.successBg : C.warningBg
                    )}
                  >
                    {isApproved ? L.approved : L.pending}
                  </span>
                </div>

                {/* Reported by */}
                <div
                  style={{
                    fontSize: 11,
                    color: C.textMuted,
                    marginTop: 6,
                  }}
                >
                  {L.reportedBy}: {entry.reported_by_name}
                </div>

                {/* Action buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${C.border}`,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => setViewingEntry(entry)}
                    style={{
                      ...s.actionBtn(C.primary),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                    }}
                    title={L.viewEntry}
                  >
                    <Eye size={13} />
                  </button>

                  {!isApproved && (
                    <button
                      onClick={() => openEditModal(entry)}
                      style={{
                        ...s.actionBtn(C.info),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.editEntry}
                    >
                      <Edit size={13} />
                    </button>
                  )}

                  {!isApproved && (
                    <button
                      onClick={() => setApproveTarget(entry)}
                      style={{
                        ...s.actionBtn(C.success),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.approve}
                    >
                      <CheckCircle size={13} />
                    </button>
                  )}

                  {!isApproved && (
                    <button
                      onClick={() => setDeleteTarget(entry.id)}
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
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Desktop/tablet table ──────────────────────────────────────── */
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
            {filteredEntries.length} {L.entriesCount}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{L.entryNumber}</th>
                  <th style={s.th}>{L.product}</th>
                  <th style={s.th}>{L.category}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.quantity}</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>{L.unitCost}</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>{L.totalCost}</th>
                  <th style={s.th}>{L.wasteDate}</th>
                  <th style={s.th}>{L.reportedBy}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.approvalStatus}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const catCfg = CATEGORY_CONFIG[entry.category]
                  const isApproved = !!entry.approved_by

                  return (
                    <tr
                      key={entry.id}
                      style={{ transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = ''
                      }}
                    >
                      <td style={s.td}>
                        <span style={{ fontWeight: 700, color: C.primary, fontSize: 13 }}>
                          {entry.entry_number}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ fontWeight: 500 }}>{entry.product_name}</span>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(catCfg.color, catCfg.bg)}>
                          {categoryLabel(entry.category)}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center', fontWeight: 600 }}>
                        {entry.quantity}
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', whiteSpace: 'nowrap', color: C.textSecondary }}>
                        {formatCurrency(entry.unit_cost, currency)}
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatCurrency(entry.total_cost, currency)}
                      </td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: 13, color: C.textSecondary }}>
                        {formatDate(entry.waste_date)}
                      </td>
                      <td style={s.td}>
                        <div style={{ fontSize: 13, color: C.text }}>{entry.reported_by_name}</div>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <span
                          style={s.badge(
                            isApproved ? C.success : C.warning,
                            isApproved ? C.successBg : C.warningBg
                          )}
                        >
                          {isApproved ? L.approved : L.pending}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          {/* View */}
                          <button
                            onClick={() => setViewingEntry(entry)}
                            style={s.actionBtn(C.primary)}
                            title={L.viewEntry}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.primaryLight
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit (unapproved only) */}
                          {!isApproved && (
                            <button
                              onClick={() => openEditModal(entry)}
                              style={s.actionBtn(C.info)}
                              title={L.editEntry}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.infoBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Edit size={15} />
                            </button>
                          )}

                          {/* Approve (unapproved only) */}
                          {!isApproved && (
                            <button
                              onClick={() => setApproveTarget(entry)}
                              style={s.actionBtn(C.success)}
                              title={L.approve}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.successBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}

                          {/* Delete (unapproved only) */}
                          {!isApproved && (
                            <button
                              onClick={() => setDeleteTarget(entry.id)}
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
                          )}
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

      {/* ── Add / Edit Entry Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingEntry ? L.editEntry : L.addEntry}
        size="md"
      >
        {/* Product name */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.productName} *</label>
          <input
            type="text"
            value={formProductName}
            onChange={(e) => setFormProductName(e.target.value)}
            placeholder={L.productName + '...'}
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Category */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.category} *</label>
          <select
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value as WasteCategory)}
            style={{ ...s.formInput, cursor: 'pointer' }}
          >
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {categoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity + Unit cost */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.quantity} *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={formQuantity}
              onChange={(e) => setFormQuantity(parseInt(e.target.value) || 0)}
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
            <label style={s.formLabel}>{L.unitCost} *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formUnitCost}
              onChange={(e) => setFormUnitCost(parseFloat(e.target.value) || 0)}
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

        {/* Auto-calc total */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.totalCost}</label>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 16,
              fontWeight: 700,
              color: C.primary,
            }}
          >
            {formatCurrency(formTotalCost, currency)}
          </div>
        </div>

        {/* Reason */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.reason} *</label>
          <textarea
            value={formReason}
            onChange={(e) => setFormReason(e.target.value)}
            placeholder={L.reason + '...'}
            style={s.formTextarea}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Waste date */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.wasteDate} *</label>
          <input
            type="date"
            value={formWasteDate}
            onChange={(e) => setFormWasteDate(e.target.value)}
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Notes */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.notes}</label>
          <textarea
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder={L.notes + '...'}
            style={s.formTextarea}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Form footer */}
        <div style={s.formFooter}>
          <button
            style={s.cancelBtnStyle}
            onClick={() => {
              setShowModal(false)
              resetForm()
            }}
          >
            {L.cancelBtn}
          </button>
          <button
            style={s.saveBtn}
            onClick={handleSave}
            disabled={formSaving || !formProductName.trim() || !formReason.trim() || formQuantity <= 0}
          >
            {formSaving ? L.saving : L.save}
          </button>
        </div>
      </Modal>

      {/* ── View Entry Details Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={viewingEntry !== null}
        onClose={() => setViewingEntry(null)}
        title={L.viewEntry}
        size="lg"
      >
        {viewingEntry && (
          <div>
            {/* Entry header info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>
                  {viewingEntry.entry_number}
                </div>
                <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
                  {formatDateTime(viewingEntry.created_at)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={s.badge(
                    CATEGORY_CONFIG[viewingEntry.category].color,
                    CATEGORY_CONFIG[viewingEntry.category].bg
                  )}
                >
                  {categoryLabel(viewingEntry.category)}
                </span>
                <span
                  style={s.badge(
                    viewingEntry.approved_by ? C.success : C.warning,
                    viewingEntry.approved_by ? C.successBg : C.warningBg
                  )}
                >
                  {viewingEntry.approved_by ? L.approved : L.pending}
                </span>
              </div>
            </div>

            {/* Entry information section */}
            <div
              style={{
                marginBottom: 20,
                padding: rv(14, 18, 20),
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>
                {L.entryInfo}
              </div>

              <div style={s.detailRow}>
                <div>
                  <div style={s.detailLabel}>{L.product}</div>
                  <div style={s.detailValue}>{viewingEntry.product_name}</div>
                </div>
                <div>
                  <div style={s.detailLabel}>{L.category}</div>
                  <div style={s.detailValue}>
                    <span
                      style={s.badge(
                        CATEGORY_CONFIG[viewingEntry.category].color,
                        CATEGORY_CONFIG[viewingEntry.category].bg
                      )}
                    >
                      {categoryLabel(viewingEntry.category)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={s.detailRow}>
                <div>
                  <div style={s.detailLabel}>{L.wasteDate}</div>
                  <div style={s.detailValue}>{formatDate(viewingEntry.waste_date)}</div>
                </div>
                <div>
                  <div style={s.detailLabel}>{L.reportedBy}</div>
                  <div style={s.detailValue}>{viewingEntry.reported_by_name}</div>
                </div>
              </div>

              {viewingEntry.approved_by_name && (
                <div style={s.detailRow}>
                  <div>
                    <div style={s.detailLabel}>{L.approvedBy}</div>
                    <div style={s.detailValue}>{viewingEntry.approved_by_name}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Cost details section */}
            <div
              style={{
                marginBottom: 20,
                padding: rv(14, 18, 20),
                backgroundColor: C.primaryLight,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>
                {L.costDetails}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: rv('1fr', '1fr 1fr 1fr', '1fr 1fr 1fr'),
                  gap: 16,
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={s.detailLabel}>{L.quantity}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{viewingEntry.quantity}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={s.detailLabel}>{L.unitCost}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.textSecondary }}>
                    {formatCurrency(viewingEntry.unit_cost, currency)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={s.detailLabel}>{L.totalCost}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.primary }}>
                    {formatCurrency(viewingEntry.total_cost, currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div
              style={{
                marginBottom: viewingEntry.notes ? 16 : 0,
                padding: 14,
                backgroundColor: '#f8fafc',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                {L.reason}
              </div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {viewingEntry.reason}
              </div>
            </div>

            {/* Notes */}
            {viewingEntry.notes && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                  {L.notes}
                </div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {viewingEntry.notes}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
                gap: 12,
                marginTop: 16,
                padding: 14,
                backgroundColor: '#f8fafc',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
              }}
            >
              <div>
                <div style={s.detailLabel}>{L.createdAt}</div>
                <div style={{ fontSize: 13, color: C.textSecondary }}>{formatDateTime(viewingEntry.created_at)}</div>
              </div>
              <div>
                <div style={s.detailLabel}>{L.updatedAt}</div>
                <div style={{ fontSize: 13, color: C.textSecondary }}>{formatDateTime(viewingEntry.updated_at)}</div>
              </div>
            </div>

            {/* Action buttons in view modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 20,
                paddingTop: 16,
                borderTop: `1px solid ${C.border}`,
                flexWrap: 'wrap',
              }}
            >
              {!viewingEntry.approved_by && (
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    backgroundColor: C.successBg,
                    color: C.success,
                    border: `1px solid ${C.success}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    handleApprove(viewingEntry)
                    setViewingEntry(null)
                  }}
                >
                  <CheckCircle size={14} />
                  {L.approve}
                </button>
              )}

              {!viewingEntry.approved_by && (
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    backgroundColor: C.infoBg,
                    color: C.info,
                    border: `1px solid ${C.info}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    openEditModal(viewingEntry)
                    setViewingEntry(null)
                  }}
                >
                  <Edit size={14} />
                  {L.editEntry}
                </button>
              )}

              <button
                style={s.cancelBtnStyle}
                onClick={() => setViewingEntry(null)}
              >
                {L.cancelBtn}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Approve Entry Confirmation Modal ──────────────────────────────── */}
      <Modal
        isOpen={approveTarget !== null}
        onClose={() => setApproveTarget(null)}
        title={L.approveTitle}
        size="sm"
      >
        {approveTarget && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: C.successBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={28} color={C.success} />
              </div>
            </div>

            <p
              style={{
                textAlign: 'center',
                fontSize: 14,
                color: C.text,
                lineHeight: 1.5,
                margin: '0 0 8px',
              }}
            >
              {L.approveConfirm}
            </p>

            <div
              style={{
                textAlign: 'center',
                marginBottom: 20,
                padding: 12,
                backgroundColor: '#f8fafc',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4 }}>
                {approveTarget.entry_number}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>
                {approveTarget.product_name}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.danger }}>
                {formatCurrency(approveTarget.total_cost, currency)}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                paddingTop: 16,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <button
                style={s.cancelBtnStyle}
                onClick={() => setApproveTarget(null)}
              >
                {L.cancelBtn}
              </button>
              <button
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: C.success,
                  cursor: 'pointer',
                }}
                onClick={() => handleApprove(approveTarget)}
              >
                {L.approve}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={L.deleteTitle}
        size="sm"
      >
        {deleteTarget && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: C.dangerBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={28} color={C.danger} />
              </div>
            </div>

            <p
              style={{
                textAlign: 'center',
                fontSize: 14,
                color: C.text,
                lineHeight: 1.5,
                margin: '0 0 20px',
              }}
            >
              {L.deleteConfirm}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                paddingTop: 16,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <button
                style={s.cancelBtnStyle}
                onClick={() => setDeleteTarget(null)}
              >
                {L.cancelBtn}
              </button>
              <button
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: C.danger,
                  cursor: 'pointer',
                }}
                onClick={() => handleDelete(deleteTarget)}
              >
                {L.delete}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
