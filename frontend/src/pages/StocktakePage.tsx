import { useState, useEffect, useMemo } from 'react'
import {
  ClipboardCheck,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  PlayCircle,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Hash,
  BarChart3,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useStocktakeStore } from '../stores/stocktakeStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { generateUUID } from '../utils/uuid'
import type { Stocktake, StocktakeStatus, StocktakeItem } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#0d9488',
  primaryLight: '#f0fdfa',
  primaryDark: '#0f766e',
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

// ── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StocktakeStatus, { color: string; bg: string }> = {
  draft:       { color: '#64748b', bg: '#f8fafc' },
  in_progress: { color: '#2563eb', bg: '#eff6ff' },
  completed:   { color: '#16a34a', bg: '#f0fdf4' },
  cancelled:   { color: '#dc2626', bg: '#fef2f2' },
}

const ALL_STATUSES: StocktakeStatus[] = ['draft', 'in_progress', 'completed', 'cancelled']

// ── Component ─────────────────────────────────────────────────────────────

export default function StocktakePage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    counts,
    loading,
    filterStatus,
    loadCounts,
    addCount,
    updateCount,
    deleteCount,
    startCount,
    completeCount,
    cancelCount,
    getOpenCounts,
    getAvgVariance,
    setFilterStatus,
  } = useStocktakeStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n
  const st = (t as Record<string, any>).stocktake || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: st.title || 'Inventory Count',
    subtitle: st.subtitle || 'Physical stock verification',
    addCount: st.addCount || 'New Count',
    editCount: st.editCount || 'Edit Count',
    viewCount: st.viewCount || 'Count Details',
    totalCounts: st.totalCounts || 'Total Counts',
    openCounts: st.openCounts || 'Open Counts',
    avgVariance: st.avgVariance || 'Avg Variance',
    lastCountDate: st.lastCountDate || 'Last Count',
    countNumber: st.countNumber || 'Count #',
    name: st.name || 'Name',
    status: st.status || 'Status',
    totalProducts: st.totalProducts || 'Products',
    countedProducts: st.countedProducts || 'Counted',
    progress: st.progress || 'Progress',
    totalVariance: st.totalVariance || 'Variance',
    varianceCost: st.varianceCost || 'Variance Cost',
    startedAt: st.startedAt || 'Started',
    startedBy: st.startedBy || 'Started By',
    completedAt: st.completedAt || 'Completed',
    completedBy: st.completedBy || 'Completed By',
    categoryFilter: st.categoryFilter || 'Category Filter',
    notes: st.notes || 'Notes',
    actions: st.actions || 'Actions',
    productName: st.productName || 'Product',
    sku: st.sku || 'SKU',
    expected: st.expected || 'Expected',
    counted: st.counted || 'Counted',
    variance: st.variance || 'Variance',
    unitCost: st.unitCost || 'Unit Cost',
    items: st.items || 'Items',
    summary: st.summary || 'Summary',
    allStatuses: st.allStatuses || 'All Statuses',
    noCounts: st.noCounts || 'No inventory counts yet',
    noCountsDesc: st.noCountsDesc || 'Start your first physical inventory count.',
    noResults: st.noResults || 'No counts match your filters',
    noResultsDesc: st.noResultsDesc || 'Try adjusting the filters or search query.',
    start: st.start || 'Start Count',
    complete: st.complete || 'Complete',
    cancel: st.cancel || 'Cancel Count',
    delete: st.delete || 'Delete',
    save: tCommon.save || 'Save',
    cancelBtn: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    countsLabel: st.countsLabel || 'counts',
    deleteConfirm: st.deleteConfirm || 'Are you sure you want to delete this inventory count?',
    addItem: st.addItem || 'Add Item',
    removeItem: st.removeItem || 'Remove',
    noItems: st.noItems || 'No items added yet',
    saving: st.saving || 'Saving...',
    never: st.never || 'Never',
    totalVarianceCostLabel: st.totalVarianceCostLabel || 'Total Variance Cost',
    countedProgress: st.countedProgress || 'Counted Progress',
    // Status labels
    st_draft: st.st_draft || 'Draft',
    st_in_progress: st.st_in_progress || 'In Progress',
    st_completed: st.st_completed || 'Completed',
    st_cancelled: st.st_cancelled || 'Cancelled',
  }

  const statusLabel = (s: StocktakeStatus): string => (L as Record<string, string>)[`st_${s}`] || s

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCount, setEditingCount] = useState<Stocktake | null>(null)
  const [viewingCount, setViewingCount] = useState<Stocktake | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formItems, setFormItems] = useState<StocktakeItem[]>([])
  const [formSaving, setFormSaving] = useState(false)

  // Counting state (in view modal, when in_progress)
  const [countingItems, setCountingItems] = useState<StocktakeItem[]>([])

  // ── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    loadCounts(storeId)
  }, [storeId, loadCounts])

  // ── Filtered and searched counts ────────────────────────────────────

  const filteredCounts = useMemo(() => {
    let result = [...counts]

    if (filterStatus !== 'all') {
      result = result.filter((c) => c.status === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.count_number.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.started_by_name.toLowerCase().includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q)) ||
          (c.category_filter && c.category_filter.toLowerCase().includes(q))
      )
    }

    return result
  }, [counts, filterStatus, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const openCountsTotal = getOpenCounts(storeId).length
  const avgVariance = getAvgVariance(storeId)

  const lastCountDate = useMemo(() => {
    const completed = counts.filter((c) => c.status === 'completed' && c.completed_at)
    if (completed.length === 0) return null
    completed.sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
    return completed[0].completed_at || null
  }, [counts])

  // ── Form helpers ──────────────────────────────────────────────────────

  function resetForm() {
    setFormName('')
    setFormCategory('')
    setFormNotes('')
    setFormItems([])
    setEditingCount(null)
  }

  function openAddModal() {
    resetForm()
    setFormItems([
      {
        product_id: generateUUID(),
        product_name: '',
        sku: '',
        category: '',
        expected_qty: 0,
        counted_qty: 0,
        variance: 0,
        variance_cost: 0,
        unit_cost: 0,
      },
    ])
    setShowModal(true)
  }

  function openEditModal(count: Stocktake) {
    setEditingCount(count)
    setFormName(count.name)
    setFormCategory(count.category_filter || '')
    setFormNotes(count.notes || '')
    setFormItems(count.items.map((item) => ({ ...item })))
    setShowModal(true)
  }

  function addItemRow() {
    setFormItems([
      ...formItems,
      {
        product_id: generateUUID(),
        product_name: '',
        sku: '',
        category: '',
        expected_qty: 0,
        counted_qty: 0,
        variance: 0,
        variance_cost: 0,
        unit_cost: 0,
      },
    ])
  }

  function removeItemRow(index: number) {
    setFormItems(formItems.filter((_, i) => i !== index))
  }

  function updateFormItem(index: number, field: keyof StocktakeItem, value: string | number) {
    setFormItems(
      formItems.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        // Recalculate variance
        if (field === 'expected_qty' || field === 'counted_qty' || field === 'unit_cost') {
          const expected = field === 'expected_qty' ? Number(value) : item.expected_qty
          const counted = field === 'counted_qty' ? Number(value) : item.counted_qty
          const cost = field === 'unit_cost' ? Number(value) : item.unit_cost
          updated.variance = counted - expected
          updated.variance_cost = (counted - expected) * cost
        }
        return updated
      })
    )
  }

  async function handleSave() {
    if (!formName.trim()) return
    const validItems = formItems.filter((item) => item.product_name.trim())

    setFormSaving(true)
    try {
      const computedItems = validItems.map((item) => ({
        ...item,
        product_id: item.product_id || generateUUID(),
        variance: item.counted_qty - item.expected_qty,
        variance_cost: (item.counted_qty - item.expected_qty) * item.unit_cost,
      }))

      const totalVariance = computedItems.reduce((sum, item) => sum + item.variance, 0)
      const totalVarianceCost = computedItems.reduce((sum, item) => sum + item.variance_cost, 0)
      const countedProducts = computedItems.filter((item) => item.counted_qty > 0).length

      if (editingCount) {
        await updateCount(editingCount.id, {
          name: formName.trim(),
          category_filter: formCategory.trim() || undefined,
          items: computedItems,
          total_products: computedItems.length,
          counted_products: countedProducts,
          total_variance: totalVariance,
          total_variance_cost: totalVarianceCost,
          notes: formNotes.trim() || undefined,
        })
      } else {
        await addCount(storeId, {
          name: formName.trim(),
          status: 'draft' as StocktakeStatus,
          category_filter: formCategory.trim() || undefined,
          items: computedItems,
          total_products: computedItems.length,
          counted_products: countedProducts,
          total_variance: totalVariance,
          total_variance_cost: totalVarianceCost,
          started_by: userId,
          started_by_name: userName,
          started_at: new Date().toISOString(),
          notes: formNotes.trim() || undefined,
        })
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[StocktakePage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCount(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[StocktakePage] Delete error:', error)
    }
  }

  async function handleStart(id: string) {
    try {
      await startCount(id)
      // Refresh the viewing count if open
      if (viewingCount && viewingCount.id === id) {
        const updated = counts.find((c) => c.id === id)
        if (updated) {
          setViewingCount({ ...updated, status: 'in_progress', started_at: new Date().toISOString() })
        }
      }
    } catch (error) {
      console.error('[StocktakePage] Start error:', error)
    }
  }

  async function handleComplete(count: Stocktake) {
    try {
      await completeCount(count.id, userId, userName)
      setViewingCount(null)
    } catch (error) {
      console.error('[StocktakePage] Complete error:', error)
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelCount(id)
      if (viewingCount && viewingCount.id === id) {
        setViewingCount(null)
      }
    } catch (error) {
      console.error('[StocktakePage] Cancel error:', error)
    }
  }

  function openViewModal(count: Stocktake) {
    setViewingCount(count)
    setCountingItems(count.items.map((item) => ({ ...item })))
  }

  function updateCountingItem(index: number, countedQty: number) {
    setCountingItems(
      countingItems.map((item, i) => {
        if (i !== index) return item
        const variance = countedQty - item.expected_qty
        return {
          ...item,
          counted_qty: countedQty,
          variance,
          variance_cost: variance * item.unit_cost,
        }
      })
    )
  }

  async function saveCountingItems() {
    if (!viewingCount) return
    setFormSaving(true)
    try {
      const countedProducts = countingItems.filter((item) => item.counted_qty > 0).length
      const totalVariance = countingItems.reduce((sum, item) => sum + item.variance, 0)
      const totalVarianceCost = countingItems.reduce((sum, item) => sum + item.variance_cost, 0)

      await updateCount(viewingCount.id, {
        items: countingItems,
        counted_products: countedProducts,
        total_variance: totalVariance,
        total_variance_cost: totalVarianceCost,
      })

      // Refresh the viewing count
      setViewingCount({
        ...viewingCount,
        items: countingItems,
        counted_products: countedProducts,
        total_variance: totalVariance,
        total_variance_cost: totalVarianceCost,
      })
    } catch (error) {
      console.error('[StocktakePage] Save counting error:', error)
    } finally {
      setFormSaving(false)
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

  function varianceColor(v: number): string {
    if (v === 0) return C.success
    if (v > 0) return C.info
    return C.danger
  }

  function varianceBg(v: number): string {
    if (v === 0) return C.successBg
    if (v > 0) return C.infoBg
    return C.dangerBg
  }

  function progressPercent(counted: number, total: number): number {
    if (total === 0) return 0
    return Math.min(Math.round((counted / total) * 100), 100)
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

    // Progress bar
    progressBarOuter: {
      width: '100%',
      height: 6,
      backgroundColor: C.border,
      borderRadius: 3,
      overflow: 'hidden',
    } as React.CSSProperties,

    progressBarInner: (pct: number) =>
      ({
        width: `${pct}%`,
        height: '100%',
        backgroundColor: pct >= 100 ? C.success : C.primary,
        borderRadius: 3,
        transition: 'width 0.3s ease',
      } as React.CSSProperties),

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
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && counts.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <ClipboardCheck size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading inventory counts...</div>
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
            <ClipboardCheck size={rv(22, 26, 28)} color={C.primary} />
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
          {L.addCount}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total Counts */}
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
              <Hash size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalCounts}</span>
          </div>
          <div style={s.statValue}>{counts.length}</div>
        </div>

        {/* Open Counts */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.infoBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlayCircle size={18} color={C.info} />
            </div>
            <span style={s.statLabel}>{L.openCounts}</span>
          </div>
          <div style={s.statValue}>{openCountsTotal}</div>
        </div>

        {/* Avg Variance */}
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
              <BarChart3 size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.avgVariance}</span>
          </div>
          <div style={s.statValue}>{formatCurrency(avgVariance, currency)}</div>
        </div>

        {/* Last Count Date */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.successBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={18} color={C.success} />
            </div>
            <span style={s.statLabel}>{L.lastCountDate}</span>
          </div>
          <div style={{ ...s.statValue, fontSize: rv(14, 16, 18) }}>
            {lastCountDate ? formatDate(lastCountDate) : L.never}
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

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StocktakeStatus | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allStatuses}</option>
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Count list ────────────────────────────────────────────────── */}
      {counts.length === 0 ? (
        /* Empty state - no counts at all */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <ClipboardCheck size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noCounts}</h3>
          <p style={s.emptyDesc}>{L.noCountsDesc}</p>
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
            {L.addCount}
          </button>
        </div>
      ) : filteredCounts.length === 0 ? (
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
            {filteredCounts.length} {L.countsLabel}
          </div>
          {filteredCounts.map((count) => {
            const stCfg = STATUS_CONFIG[count.status]
            const pct = progressPercent(count.counted_products, count.total_products)

            return (
              <div key={count.id} style={s.mobileCard}>
                {/* Top row: count number + variance */}
                <div style={s.mobileCardRow}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                    {count.count_number}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: varianceColor(count.total_variance),
                    }}
                  >
                    {count.total_variance > 0 ? '+' : ''}{count.total_variance}
                  </span>
                </div>

                {/* Name */}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 6,
                  }}
                >
                  {count.name}
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: C.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    <span>{count.counted_products}/{count.total_products} {L.totalProducts}</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={s.progressBarOuter}>
                    <div style={s.progressBarInner(pct)} />
                  </div>
                </div>

                {/* Date + started by */}
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
                  <span>{formatDate(count.created_at)}</span>
                  <span>{count.started_by_name}</span>
                </div>

                {/* Status badge */}
                <div style={{ ...s.mobileCardRow, marginBottom: 0 }}>
                  <span style={s.badge(stCfg.color, stCfg.bg)}>
                    {statusLabel(count.status)}
                  </span>
                  {count.total_variance_cost !== 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: varianceColor(count.total_variance_cost),
                      }}
                    >
                      {formatCurrency(count.total_variance_cost, currency)}
                    </span>
                  )}
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
                    onClick={() => openViewModal(count)}
                    style={{
                      ...s.actionBtn(C.primary),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                    }}
                    title={L.viewCount}
                  >
                    <Eye size={13} />
                  </button>

                  {count.status === 'draft' && (
                    <button
                      onClick={() => openEditModal(count)}
                      style={{
                        ...s.actionBtn(C.info),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.editCount}
                    >
                      <Edit size={13} />
                    </button>
                  )}

                  {count.status === 'draft' && (
                    <button
                      onClick={() => handleStart(count.id)}
                      style={{
                        ...s.actionBtn(C.success),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.start}
                    >
                      <PlayCircle size={13} />
                    </button>
                  )}

                  {count.status === 'in_progress' && (
                    <button
                      onClick={() => handleComplete(count)}
                      style={{
                        ...s.actionBtn(C.success),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.complete}
                    >
                      <CheckCircle size={13} />
                    </button>
                  )}

                  {(count.status === 'draft' || count.status === 'in_progress') && (
                    <button
                      onClick={() => handleCancel(count.id)}
                      style={{
                        ...s.actionBtn(C.warning),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.cancel}
                    >
                      <XCircle size={13} />
                    </button>
                  )}

                  {(count.status === 'draft' || count.status === 'cancelled') && (
                    <button
                      onClick={() => setDeleteTarget(count.id)}
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
            {filteredCounts.length} {L.countsLabel}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{L.countNumber}</th>
                  <th style={s.th}>{L.name}</th>
                  <th style={s.th}>{L.status}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.progress}</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>{L.totalVariance}</th>
                  <th style={s.th}>{L.startedAt}</th>
                  <th style={s.th}>{L.startedBy}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCounts.map((count) => {
                  const stCfg = STATUS_CONFIG[count.status]
                  const pct = progressPercent(count.counted_products, count.total_products)

                  return (
                    <tr
                      key={count.id}
                      style={{ transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = ''
                      }}
                    >
                      {/* Count number */}
                      <td style={s.td}>
                        <span style={{ fontWeight: 700, color: C.primary, fontSize: 13 }}>
                          {count.count_number}
                        </span>
                      </td>

                      {/* Name + category */}
                      <td style={s.td}>
                        <div style={{ fontWeight: 500 }}>{count.name}</div>
                        {count.category_filter && (
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                            {count.category_filter}
                          </div>
                        )}
                      </td>

                      {/* Status badge */}
                      <td style={s.td}>
                        <span style={s.badge(stCfg.color, stCfg.bg)}>
                          {statusLabel(count.status)}
                        </span>
                      </td>

                      {/* Progress */}
                      <td style={{ ...s.td, textAlign: 'center', minWidth: 120 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary }}>
                            {count.counted_products}/{count.total_products} ({pct}%)
                          </span>
                          <div style={{ ...s.progressBarOuter, width: 80 }}>
                            <div style={s.progressBarInner(pct)} />
                          </div>
                        </div>
                      </td>

                      {/* Variance */}
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 2,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              color: varianceColor(count.total_variance),
                              fontSize: 14,
                            }}
                          >
                            {count.total_variance > 0 ? '+' : ''}{count.total_variance}
                          </span>
                          {count.total_variance_cost !== 0 && (
                            <span
                              style={{
                                fontSize: 11,
                                color: varianceColor(count.total_variance_cost),
                                fontWeight: 500,
                              }}
                            >
                              {formatCurrency(count.total_variance_cost, currency)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Started At */}
                      <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: 13, color: C.textSecondary }}>
                        {count.started_at ? formatDate(count.started_at) : '-'}
                      </td>

                      {/* Started By */}
                      <td style={{ ...s.td, fontSize: 13, color: C.textSecondary }}>
                        {count.started_by_name}
                      </td>

                      {/* Actions */}
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          {/* View */}
                          <button
                            onClick={() => openViewModal(count)}
                            style={s.actionBtn(C.primary)}
                            title={L.viewCount}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.primaryLight
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit (draft only) */}
                          {count.status === 'draft' && (
                            <button
                              onClick={() => openEditModal(count)}
                              style={s.actionBtn(C.info)}
                              title={L.editCount}
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

                          {/* Start (draft → in_progress) */}
                          {count.status === 'draft' && (
                            <button
                              onClick={() => handleStart(count.id)}
                              style={s.actionBtn(C.success)}
                              title={L.start}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.successBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <PlayCircle size={15} />
                            </button>
                          )}

                          {/* Complete (in_progress → completed) */}
                          {count.status === 'in_progress' && (
                            <button
                              onClick={() => handleComplete(count)}
                              style={s.actionBtn(C.success)}
                              title={L.complete}
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

                          {/* Cancel (draft/in_progress) */}
                          {(count.status === 'draft' || count.status === 'in_progress') && (
                            <button
                              onClick={() => handleCancel(count.id)}
                              style={s.actionBtn(C.warning)}
                              title={L.cancel}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.warningBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <XCircle size={15} />
                            </button>
                          )}

                          {/* Delete (draft/cancelled only) */}
                          {(count.status === 'draft' || count.status === 'cancelled') && (
                            <button
                              onClick={() => setDeleteTarget(count.id)}
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

      {/* ── Add / Edit Count Modal ────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingCount ? L.editCount : L.addCount}
        size="md"
      >
        {/* Name */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.name} *</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder={L.name + '...'}
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Category filter */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.categoryFilter}</label>
          <input
            type="text"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            placeholder={L.categoryFilter + '...'}
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Items */}
        <div style={s.formGroup}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ ...s.formLabel, marginBottom: 0 }}>{L.items}</label>
            <button
              onClick={addItemRow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 12px',
                backgroundColor: C.primaryLight,
                color: C.primary,
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              {L.addItem}
            </button>
          </div>

          {/* Items header (desktop only) */}
          {!isMobile && formItems.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                gap: 8,
                marginBottom: 6,
                padding: '0 4px',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase' }}>
                {L.productName}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase' }}>
                {L.expected}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase' }}>
                {L.unitCost}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', textAlign: 'right' }}>
                {L.sku}
              </span>
              <span style={{ width: 30 }} />
            </div>
          )}

          {/* Item rows */}
          {formItems.length === 0 && (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                color: C.textMuted,
                fontSize: 13,
                backgroundColor: '#f8fafc',
                borderRadius: 8,
                border: `1px dashed ${C.border}`,
              }}
            >
              <Package size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <div>{L.noItems}</div>
            </div>
          )}

          {formItems.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr auto',
                gap: 8,
                marginBottom: 8,
                padding: isMobile ? 10 : 4,
                backgroundColor: isMobile ? '#f8fafc' : 'transparent',
                borderRadius: isMobile ? 8 : 0,
                border: isMobile ? `1px solid ${C.border}` : 'none',
              }}
            >
              {isMobile && (
                <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: -4 }}>
                  {L.productName}
                </label>
              )}
              <input
                type="text"
                value={item.product_name}
                onChange={(e) => updateFormItem(index, 'product_name', e.target.value)}
                placeholder={L.productName + '...'}
                style={{
                  ...s.formInput,
                  padding: '8px 10px',
                  fontSize: 13,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.primary
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.border
                }}
              />

              {isMobile && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>{L.expected}</label>
                    <input
                      type="number"
                      min="0"
                      value={item.expected_qty}
                      onChange={(e) => updateFormItem(index, 'expected_qty', parseInt(e.target.value) || 0)}
                      style={{ ...s.formInput, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>{L.unitCost}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) => updateFormItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      style={{ ...s.formInput, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>{L.sku}</label>
                    <input
                      type="text"
                      value={item.sku || ''}
                      onChange={(e) => updateFormItem(index, 'sku', e.target.value)}
                      style={{ ...s.formInput, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                </div>
              )}

              {!isMobile && (
                <>
                  <input
                    type="number"
                    min="0"
                    value={item.expected_qty}
                    onChange={(e) => updateFormItem(index, 'expected_qty', parseInt(e.target.value) || 0)}
                    style={{ ...s.formInput, padding: '8px 10px', fontSize: 13 }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_cost}
                    onChange={(e) => updateFormItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                    style={{ ...s.formInput, padding: '8px 10px', fontSize: 13 }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border
                    }}
                  />
                  <input
                    type="text"
                    value={item.sku || ''}
                    onChange={(e) => updateFormItem(index, 'sku', e.target.value)}
                    placeholder="SKU"
                    style={{
                      ...s.formInput,
                      padding: '8px 10px',
                      fontSize: 13,
                      textAlign: 'right',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border
                    }}
                  />
                </>
              )}

              <button
                onClick={() => removeItemRow(index)}
                style={{
                  ...s.actionBtn(C.danger),
                  alignSelf: isMobile ? 'flex-end' : 'center',
                }}
                title={L.removeItem}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Total items line */}
          {formItems.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 12,
                paddingTop: 10,
                borderTop: `1px solid ${C.border}`,
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: C.textSecondary }}>
                {L.totalProducts}:
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>
                {formItems.filter((i) => i.product_name.trim()).length}
              </span>
            </div>
          )}
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
            disabled={formSaving || !formName.trim()}
          >
            {formSaving ? L.saving : L.save}
          </button>
        </div>
      </Modal>

      {/* ── View Count Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={viewingCount !== null}
        onClose={() => setViewingCount(null)}
        title={L.viewCount}
        size="lg"
      >
        {viewingCount && (
          <div>
            {/* Count header info */}
            <div
              style={{
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 10,
                flexDirection: isMobile ? 'column' : 'row',
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>
                  {viewingCount.count_number}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginTop: 4 }}>
                  {viewingCount.name}
                </div>
                <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
                  {formatDateTime(viewingCount.created_at)}
                </div>
              </div>
              <span
                style={s.badge(
                  STATUS_CONFIG[viewingCount.status].color,
                  STATUS_CONFIG[viewingCount.status].bg
                )}
              >
                {statusLabel(viewingCount.status)}
              </span>
            </div>

            {/* Summary stats row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: rv('1fr 1fr', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
                gap: rv(8, 10, 12),
                marginBottom: 20,
              }}
            >
              {/* Total Products */}
              <div
                style={{
                  padding: rv(10, 12, 14),
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                  {L.totalProducts}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                  {viewingCount.total_products}
                </div>
              </div>

              {/* Counted Products */}
              <div
                style={{
                  padding: rv(10, 12, 14),
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                  {L.countedProducts}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>
                  {viewingCount.counted_products}
                </div>
              </div>

              {/* Total Variance */}
              <div
                style={{
                  padding: rv(10, 12, 14),
                  backgroundColor: varianceBg(viewingCount.total_variance),
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                  {L.totalVariance}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: varianceColor(viewingCount.total_variance),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  {viewingCount.total_variance > 0 && <TrendingUp size={16} />}
                  {viewingCount.total_variance < 0 && <TrendingDown size={16} />}
                  {viewingCount.total_variance > 0 ? '+' : ''}{viewingCount.total_variance}
                </div>
              </div>

              {/* Total Variance Cost */}
              <div
                style={{
                  padding: rv(10, 12, 14),
                  backgroundColor: varianceBg(viewingCount.total_variance_cost),
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                  {L.varianceCost}
                </div>
                <div
                  style={{
                    fontSize: rv(14, 16, 18),
                    fontWeight: 700,
                    color: varianceColor(viewingCount.total_variance_cost),
                  }}
                >
                  {formatCurrency(viewingCount.total_variance_cost, currency)}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: C.textSecondary,
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                <span>{L.countedProgress}</span>
                <span>
                  {viewingCount.counted_products}/{viewingCount.total_products} (
                  {progressPercent(viewingCount.counted_products, viewingCount.total_products)}%)
                </span>
              </div>
              <div style={{ ...s.progressBarOuter, height: 10 }}>
                <div
                  style={s.progressBarInner(
                    progressPercent(viewingCount.counted_products, viewingCount.total_products)
                  )}
                />
              </div>
            </div>

            {/* Items table/editor */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                  {L.items} ({viewingCount.items.length})
                </div>
                {viewingCount.status === 'in_progress' && (
                  <button
                    onClick={saveCountingItems}
                    disabled={formSaving}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 14px',
                      backgroundColor: C.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: formSaving ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = C.primaryDark
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = C.primary
                    }}
                  >
                    <CheckCircle size={14} />
                    {formSaving ? L.saving : L.save}
                  </button>
                )}
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  overflow: 'hidden',
                }}
              >
                {/* Items header (desktop) */}
                {!isMobile && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: viewingCount.status === 'in_progress'
                        ? '2fr 1fr 1fr 1fr 1fr 1fr'
                        : '2fr 1fr 1fr 1fr 1fr 1fr',
                      gap: 8,
                      padding: '10px 14px',
                      borderBottom: `1px solid ${C.border}`,
                      backgroundColor: '#f1f5f9',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase' }}>
                      {L.productName}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', textAlign: 'center' }}>
                      {L.sku}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', textAlign: 'center' }}>
                      {L.expected}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', textAlign: 'center' }}>
                      {L.counted}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', textAlign: 'center' }}>
                      {L.variance}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', textAlign: 'right' }}>
                      {L.varianceCost}
                    </span>
                  </div>
                )}

                {/* Items rows */}
                {(viewingCount.status === 'in_progress' ? countingItems : viewingCount.items).map(
                  (item, idx) => {
                    const isEditable = viewingCount.status === 'in_progress'
                    const itemVariance = item.counted_qty - item.expected_qty
                    const itemVarianceCost = itemVariance * item.unit_cost
                    const itemsList = viewingCount.status === 'in_progress'
                      ? countingItems
                      : viewingCount.items

                    return (
                      <div
                        key={idx}
                        style={{
                          display: isMobile ? 'flex' : 'grid',
                          gridTemplateColumns: isMobile
                            ? undefined
                            : '2fr 1fr 1fr 1fr 1fr 1fr',
                          flexDirection: isMobile ? 'column' : undefined,
                          gap: isMobile ? 6 : 8,
                          padding: isMobile ? '12px 14px' : '10px 14px',
                          borderBottom:
                            idx < itemsList.length - 1
                              ? `1px solid ${C.border}`
                              : 'none',
                          backgroundColor: C.card,
                        }}
                      >
                        {/* Product name */}
                        <div>
                          <span style={{ fontWeight: 500, color: C.text, fontSize: 14 }}>
                            {item.product_name}
                          </span>
                          {item.category && (
                            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                              {item.category}
                            </div>
                          )}
                        </div>

                        {isMobile ? (
                          /* Mobile layout for item details */
                          <div>
                            {/* SKU */}
                            {item.sku && (
                              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
                                SKU: {item.sku}
                              </div>
                            )}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: isEditable ? '1fr 1fr' : '1fr 1fr 1fr',
                                gap: 8,
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 2 }}>
                                  {L.expected}
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                                  {item.expected_qty}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 2 }}>
                                  {L.counted}
                                </div>
                                {isEditable ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.counted_qty}
                                    onChange={(e) =>
                                      updateCountingItem(idx, parseInt(e.target.value) || 0)
                                    }
                                    style={{
                                      ...s.formInput,
                                      padding: '6px 8px',
                                      fontSize: 13,
                                      width: '100%',
                                      backgroundColor: '#fffbeb',
                                      borderColor: C.warning,
                                    }}
                                  />
                                ) : (
                                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                                    {item.counted_qty}
                                  </div>
                                )}
                              </div>
                              {!isEditable && (
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 2 }}>
                                    {L.variance}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: varianceColor(itemVariance),
                                    }}
                                  >
                                    {itemVariance > 0 ? '+' : ''}{itemVariance}
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Variance row on mobile (when editing, show computed) */}
                            {isEditable && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  marginTop: 6,
                                  paddingTop: 6,
                                  borderTop: `1px dashed ${C.border}`,
                                }}
                              >
                                <span style={{ fontSize: 12, color: C.textSecondary }}>
                                  {L.variance}:
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      color: varianceColor(itemVariance),
                                      marginLeft: 4,
                                    }}
                                  >
                                    {itemVariance > 0 ? '+' : ''}{itemVariance}
                                  </span>
                                </span>
                                <span style={{ fontSize: 12, color: C.textSecondary }}>
                                  {L.varianceCost}:
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      color: varianceColor(itemVarianceCost),
                                      marginLeft: 4,
                                    }}
                                  >
                                    {formatCurrency(itemVarianceCost, currency)}
                                  </span>
                                </span>
                              </div>
                            )}
                            {!isEditable && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  marginTop: 4,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: varianceColor(itemVarianceCost),
                                  }}
                                >
                                  {formatCurrency(itemVarianceCost, currency)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Desktop layout */
                          <>
                            {/* SKU */}
                            <span style={{ textAlign: 'center', fontSize: 12, color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {item.sku || '-'}
                            </span>

                            {/* Expected */}
                            <span style={{ textAlign: 'center', fontWeight: 500, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {item.expected_qty}
                            </span>

                            {/* Counted */}
                            {isEditable ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.counted_qty}
                                  onChange={(e) =>
                                    updateCountingItem(idx, parseInt(e.target.value) || 0)
                                  }
                                  style={{
                                    ...s.formInput,
                                    padding: '6px 8px',
                                    fontSize: 13,
                                    width: 70,
                                    textAlign: 'center',
                                    backgroundColor: '#fffbeb',
                                    borderColor: C.warning,
                                  }}
                                />
                              </div>
                            ) : (
                              <span style={{ textAlign: 'center', fontWeight: 500, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.counted_qty}
                              </span>
                            )}

                            {/* Variance */}
                            <span
                              style={{
                                textAlign: 'center',
                                fontWeight: 700,
                                color: varianceColor(itemVariance),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                              }}
                            >
                              <span
                                style={{
                                  ...s.badge(varianceColor(itemVariance), varianceBg(itemVariance)),
                                  fontSize: 12,
                                  padding: '2px 8px',
                                }}
                              >
                                {itemVariance > 0 ? '+' : ''}{itemVariance}
                              </span>
                            </span>

                            {/* Variance Cost */}
                            <span
                              style={{
                                textAlign: 'right',
                                fontWeight: 600,
                                color: varianceColor(itemVarianceCost),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                fontSize: 13,
                              }}
                            >
                              {formatCurrency(itemVarianceCost, currency)}
                            </span>
                          </>
                        )}
                      </div>
                    )
                  }
                )}

                {/* Summary total row */}
                <div
                  style={{
                    display: isMobile ? 'flex' : 'grid',
                    gridTemplateColumns: isMobile
                      ? undefined
                      : '2fr 1fr 1fr 1fr 1fr 1fr',
                    justifyContent: isMobile ? 'space-between' : undefined,
                    gap: 8,
                    padding: '12px 14px',
                    borderTop: `2px solid ${C.border}`,
                    backgroundColor: '#f1f5f9',
                  }}
                >
                  <span style={{ fontWeight: 700, color: C.text }}>{L.summary}</span>
                  {!isMobile && <span />}
                  {!isMobile && (
                    <span style={{ textAlign: 'center', fontWeight: 600, color: C.textSecondary }}>
                      {(viewingCount.status === 'in_progress' ? countingItems : viewingCount.items).reduce(
                        (sum, i) => sum + i.expected_qty,
                        0
                      )}
                    </span>
                  )}
                  {!isMobile && (
                    <span style={{ textAlign: 'center', fontWeight: 600, color: C.textSecondary }}>
                      {(viewingCount.status === 'in_progress' ? countingItems : viewingCount.items).reduce(
                        (sum, i) => sum + i.counted_qty,
                        0
                      )}
                    </span>
                  )}
                  {!isMobile && (
                    <span
                      style={{
                        textAlign: 'center',
                        fontWeight: 700,
                        color: varianceColor(
                          viewingCount.status === 'in_progress'
                            ? countingItems.reduce((sum, i) => sum + (i.counted_qty - i.expected_qty), 0)
                            : viewingCount.total_variance
                        ),
                      }}
                    >
                      {(() => {
                        const v = viewingCount.status === 'in_progress'
                          ? countingItems.reduce((sum, i) => sum + (i.counted_qty - i.expected_qty), 0)
                          : viewingCount.total_variance
                        return (v > 0 ? '+' : '') + v
                      })()}
                    </span>
                  )}
                  <span
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: varianceColor(
                        viewingCount.status === 'in_progress'
                          ? countingItems.reduce((sum, i) => sum + (i.counted_qty - i.expected_qty) * i.unit_cost, 0)
                          : viewingCount.total_variance_cost
                      ),
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(
                      viewingCount.status === 'in_progress'
                        ? countingItems.reduce(
                            (sum, i) => sum + (i.counted_qty - i.expected_qty) * i.unit_cost,
                            0
                          )
                        : viewingCount.total_variance_cost,
                      currency
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Detail fields section */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
                gap: 12,
                marginBottom: 16,
              }}
            >
              {/* Started By */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                  {L.startedBy}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                  {viewingCount.started_by_name}
                </div>
              </div>

              {/* Started At */}
              {viewingCount.started_at && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                    {L.startedAt}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                    {formatDateTime(viewingCount.started_at)}
                  </div>
                </div>
              )}

              {/* Completed By */}
              {viewingCount.completed_by_name && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                    {L.completedBy}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                    {viewingCount.completed_by_name}
                  </div>
                </div>
              )}

              {/* Completed At */}
              {viewingCount.completed_at && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                    {L.completedAt}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                    {formatDateTime(viewingCount.completed_at)}
                  </div>
                </div>
              )}

              {/* Category Filter */}
              {viewingCount.category_filter && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                    {L.categoryFilter}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                    {viewingCount.category_filter}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {viewingCount.notes && (
              <div
                style={{
                  marginTop: 4,
                  padding: 14,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                  {L.notes}
                </div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {viewingCount.notes}
                </div>
              </div>
            )}

            {/* Cancelled warning */}
            {viewingCount.status === 'cancelled' && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 16px',
                  backgroundColor: C.dangerBg,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.danger,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} />
                {statusLabel('cancelled')}
              </div>
            )}

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
              {/* Start (draft) */}
              {viewingCount.status === 'draft' && (
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
                    handleStart(viewingCount.id)
                    // Keep modal open after starting
                  }}
                >
                  <PlayCircle size={14} />
                  {L.start}
                </button>
              )}

              {/* Complete (in_progress) */}
              {viewingCount.status === 'in_progress' && (
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
                    handleComplete(viewingCount)
                  }}
                >
                  <CheckCircle size={14} />
                  {L.complete}
                </button>
              )}

              {/* Cancel (draft/in_progress) */}
              {(viewingCount.status === 'draft' || viewingCount.status === 'in_progress') && (
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    backgroundColor: C.dangerBg,
                    color: C.danger,
                    border: `1px solid ${C.danger}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    handleCancel(viewingCount.id)
                  }}
                >
                  <XCircle size={14} />
                  {L.cancel}
                </button>
              )}

              <button
                style={s.cancelBtnStyle}
                onClick={() => setViewingCount(null)}
              >
                {L.cancelBtn}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={L.delete}
        size="sm"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: C.dangerBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Trash2 size={24} color={C.danger} />
          </div>
          <p style={{ fontSize: 15, color: C.text, margin: '0 0 24px', lineHeight: 1.5 }}>
            {L.deleteConfirm}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              style={s.cancelBtnStyle}
              onClick={() => setDeleteTarget(null)}
            >
              {L.cancelBtn}
            </button>
            <button
              style={{
                ...s.saveBtn,
                backgroundColor: C.danger,
              }}
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
