import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeftRight,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  ArrowRight,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useTransferStore } from '../stores/transferStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { StockTransfer, TransferStatus, TransferItem } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#0d9488',
  primaryLight: '#ccfbf1',
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

const STATUS_CONFIG: Record<TransferStatus, { color: string; bg: string }> = {
  draft:      { color: '#64748b', bg: '#f8fafc' },
  pending:    { color: '#f59e0b', bg: '#fffbeb' },
  in_transit: { color: '#2563eb', bg: '#eff6ff' },
  received:   { color: '#16a34a', bg: '#f0fdf4' },
  cancelled:  { color: '#dc2626', bg: '#fef2f2' },
}

const ALL_STATUSES: TransferStatus[] = ['draft', 'pending', 'in_transit', 'received', 'cancelled']

// ── Timeline step order ──────────────────────────────────────────────────

const TIMELINE_STEPS: { key: TransferStatus; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'received', label: 'Received' },
]

// ── Component ─────────────────────────────────────────────────────────────

export default function TransfersPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    transfers,
    loading,
    filterStatus,
    loadTransfers,
    addTransfer,
    updateTransfer,
    deleteTransfer,
    approveTransfer,
    shipTransfer,
    receiveTransfer,
    cancelTransfer,
    getMonthlyValue,
    setFilterStatus,
  } = useTransferStore()

  const storeId = currentStore?.id || 'default-store'
  const storeName = currentStore?.name || 'Current Store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n
  const tr = (t as Record<string, any>).transfers || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: tr.title || 'Stock Transfers',
    addTransfer: tr.addTransfer || 'New Transfer',
    editTransfer: tr.editTransfer || 'Edit Transfer',
    viewTransfer: tr.viewTransfer || 'Transfer Details',
    totalTransfers: tr.totalTransfers || 'Total Transfers',
    pendingTransfers: tr.pendingTransfers || 'Pending',
    inTransit: tr.inTransit || 'In Transit',
    monthlyValue: tr.monthlyValue || 'Monthly Value',
    transferNumber: tr.transferNumber || 'Transfer #',
    fromStore: tr.fromStore || 'From Store',
    toStore: tr.toStore || 'To Store',
    items: tr.items || 'Items',
    totalValue: tr.totalValue || 'Total Value',
    status: tr.status || 'Status',
    date: tr.date || 'Date',
    actions: tr.actions || 'Actions',
    productName: tr.productName || 'Product Name',
    quantitySent: tr.quantitySent || 'Qty Sent',
    quantityReceived: tr.quantityReceived || 'Qty Received',
    unitCost: tr.unitCost || 'Unit Cost',
    total: tr.total || 'Total',
    notes: tr.notes || 'Notes',
    requestedBy: tr.requestedBy || 'Requested By',
    approvedBy: tr.approvedBy || 'Approved By',
    receivedBy: tr.receivedBy || 'Received By',
    shippedAt: tr.shippedAt || 'Shipped At',
    receivedAt: tr.receivedAt || 'Received At',
    addItem: tr.addItem || 'Add Item',
    removeItem: tr.removeItem || 'Remove',
    allStatuses: tr.allStatuses || 'All Statuses',
    noTransfers: tr.noTransfers || 'No transfers recorded yet',
    noTransfersDesc: tr.noTransfersDesc || 'Start managing stock transfers between your stores.',
    noResults: tr.noResults || 'No transfers match your filters',
    noResultsDesc: tr.noResultsDesc || 'Try adjusting the filters or search query.',
    approve: tr.approve || 'Approve',
    ship: tr.ship || 'Ship',
    receive: tr.receive || 'Receive',
    cancel: tr.cancel || 'Cancel',
    delete: tr.delete || 'Delete',
    save: tCommon.save || 'Save',
    cancelBtn: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    transfersCount: tr.transfersCount || 'transfers',
    deleteConfirm: tr.deleteConfirm || 'Are you sure you want to delete this transfer?',
    timeline: tr.timeline || 'Timeline',
    // Status labels
    st_draft: tr.st_draft || 'Draft',
    st_pending: tr.st_pending || 'Pending',
    st_in_transit: tr.st_in_transit || 'In Transit',
    st_received: tr.st_received || 'Received',
    st_cancelled: tr.st_cancelled || 'Cancelled',
  }

  const statusLabel = (s: TransferStatus): string => (L as any)[`st_${s}`] || s

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null)
  const [viewingTransfer, setViewingTransfer] = useState<StockTransfer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state
  const [formToStore, setFormToStore] = useState('')
  const [formItems, setFormItems] = useState<TransferItem[]>([])
  const [formNotes, setFormNotes] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // ── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    loadTransfers(storeId)
  }, [storeId, loadTransfers])

  // ── Filtered and searched transfers ────────────────────────────────────

  const filteredTransfers = useMemo(() => {
    let result = [...transfers]

    if (filterStatus !== 'all') {
      result = result.filter((tr) => tr.status === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (tr) =>
          tr.transfer_number.toLowerCase().includes(q) ||
          tr.from_store_name.toLowerCase().includes(q) ||
          tr.to_store_name.toLowerCase().includes(q) ||
          tr.requested_by_name.toLowerCase().includes(q) ||
          (tr.notes && tr.notes.toLowerCase().includes(q))
      )
    }

    return result
  }, [transfers, filterStatus, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const monthlyValue = getMonthlyValue(storeId)

  const pendingCount = useMemo(
    () => transfers.filter((tr) => tr.status === 'pending').length,
    [transfers]
  )

  const inTransitCount = useMemo(
    () => transfers.filter((tr) => tr.status === 'in_transit').length,
    [transfers]
  )

  // ── Form helpers ──────────────────────────────────────────────────────

  function resetForm() {
    setFormToStore('')
    setFormItems([])
    setFormNotes('')
    setEditingTransfer(null)
  }

  function openAddModal() {
    resetForm()
    setFormItems([
      { product_id: '', product_name: '', quantity_sent: 1, quantity_received: 0, unit_cost: 0, total: 0 },
    ])
    setShowModal(true)
  }

  function openEditModal(transfer: StockTransfer) {
    setEditingTransfer(transfer)
    setFormToStore(transfer.to_store_name)
    setFormItems(transfer.items.map((item) => ({ ...item })))
    setFormNotes(transfer.notes || '')
    setShowModal(true)
  }

  function addItemRow() {
    setFormItems([
      ...formItems,
      { product_id: '', product_name: '', quantity_sent: 1, quantity_received: 0, unit_cost: 0, total: 0 },
    ])
  }

  function removeItemRow(index: number) {
    setFormItems(formItems.filter((_, i) => i !== index))
  }

  function updateItemField(index: number, field: keyof TransferItem, value: string | number) {
    setFormItems(
      formItems.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        // Recalculate total when quantity or cost changes
        if (field === 'quantity_sent' || field === 'unit_cost') {
          const qty = field === 'quantity_sent' ? Number(value) : item.quantity_sent
          const cost = field === 'unit_cost' ? Number(value) : item.unit_cost
          updated.total = qty * cost
        }
        return updated
      })
    )
  }

  const formTotalValue = useMemo(
    () => formItems.reduce((sum, item) => sum + (item.quantity_sent * item.unit_cost), 0),
    [formItems]
  )

  async function handleSave() {
    if (!formToStore.trim() || formItems.length === 0) return
    const validItems = formItems.filter((item) => item.product_name.trim())
    if (validItems.length === 0) return

    setFormSaving(true)
    try {
      const computedItems = validItems.map((item) => ({
        ...item,
        product_id: item.product_id || item.product_name.toLowerCase().replace(/\s+/g, '-'),
        total: item.quantity_sent * item.unit_cost,
      }))

      const totalValue = computedItems.reduce((sum, item) => sum + item.total, 0)

      if (editingTransfer) {
        await updateTransfer(editingTransfer.id, {
          to_store_name: formToStore.trim(),
          items: computedItems,
          total_items: computedItems.length,
          total_value: totalValue,
          notes: formNotes.trim() || undefined,
        })
      } else {
        await addTransfer(storeId, {
          from_store_id: storeId,
          from_store_name: storeName,
          to_store_id: formToStore.trim().toLowerCase().replace(/\s+/g, '-'),
          to_store_name: formToStore.trim(),
          items: computedItems,
          total_items: computedItems.length,
          total_value: totalValue,
          status: 'draft' as TransferStatus,
          requested_by: userId,
          requested_by_name: userName,
          notes: formNotes.trim() || undefined,
        })
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[TransfersPage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTransfer(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[TransfersPage] Delete error:', error)
    }
  }

  async function handleApprove(transfer: StockTransfer) {
    try {
      await approveTransfer(transfer.id, userId, userName)
    } catch (error) {
      console.error('[TransfersPage] Approve error:', error)
    }
  }

  async function handleShip(id: string) {
    try {
      await shipTransfer(id)
    } catch (error) {
      console.error('[TransfersPage] Ship error:', error)
    }
  }

  async function handleReceive(transfer: StockTransfer) {
    try {
      await receiveTransfer(transfer.id, userId, userName)
    } catch (error) {
      console.error('[TransfersPage] Receive error:', error)
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelTransfer(id)
    } catch (error) {
      console.error('[TransfersPage] Cancel error:', error)
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

  // ── Timeline helper ────────────────────────────────────────────────────

  function getTimelineIndex(status: TransferStatus): number {
    if (status === 'cancelled') return -1
    const idx = TIMELINE_STEPS.findIndex((step) => step.key === status)
    return idx
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

    title: {
      margin: 0,
      fontSize: rv(20, 24, 28),
      fontWeight: 700,
      color: C.text,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
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

  if (loading && transfers.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <ArrowLeftRight size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading transfers...</div>
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
        <h1 style={s.title}>
          <ArrowLeftRight size={rv(22, 26, 28)} color={C.primary} />
          {L.title}
        </h1>
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
          {L.addTransfer}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total transfers */}
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
              <Package size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalTransfers}</span>
          </div>
          <div style={s.statValue}>{transfers.length}</div>
        </div>

        {/* Pending */}
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
              <CheckCircle size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.pendingTransfers}</span>
          </div>
          <div style={s.statValue}>{pendingCount}</div>
        </div>

        {/* In Transit */}
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
              <Truck size={18} color={C.info} />
            </div>
            <span style={s.statLabel}>{L.inTransit}</span>
          </div>
          <div style={s.statValue}>{inTransitCount}</div>
        </div>

        {/* Monthly value */}
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
              <ArrowLeftRight size={18} color={C.success} />
            </div>
            <span style={s.statLabel}>{L.monthlyValue}</span>
          </div>
          <div style={s.statValue}>{formatCurrency(monthlyValue, currency)}</div>
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
          onChange={(e) => setFilterStatus(e.target.value as TransferStatus | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allStatuses}</option>
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>
              {statusLabel(st)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Transfer list ────────────────────────────────────────────────── */}
      {transfers.length === 0 ? (
        /* Empty state - no transfers at all */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <ArrowLeftRight size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noTransfers}</h3>
          <p style={s.emptyDesc}>{L.noTransfersDesc}</p>
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
            {L.addTransfer}
          </button>
        </div>
      ) : filteredTransfers.length === 0 ? (
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
            {filteredTransfers.length} {L.transfersCount}
          </div>
          {filteredTransfers.map((transfer) => {
            const stCfg = STATUS_CONFIG[transfer.status]

            return (
              <div key={transfer.id} style={s.mobileCard}>
                {/* Top row: transfer number + value */}
                <div style={s.mobileCardRow}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                    {transfer.transfer_number}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                    {formatCurrency(transfer.total_value, currency)}
                  </span>
                </div>

                {/* From → To */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: C.text,
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{transfer.from_store_name}</span>
                  <ArrowRight size={14} color={C.textMuted} />
                  <span>{transfer.to_store_name}</span>
                </div>

                {/* Items count & date */}
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
                  <span>{transfer.total_items} {L.items}</span>
                  <span>{formatDate(transfer.created_at)}</span>
                </div>

                {/* Status + requested by */}
                <div style={{ ...s.mobileCardRow, marginBottom: 0 }}>
                  <span style={s.badge(stCfg.color, stCfg.bg)}>
                    {statusLabel(transfer.status)}
                  </span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>
                    {transfer.requested_by_name}
                  </span>
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
                    onClick={() => setViewingTransfer(transfer)}
                    style={{
                      ...s.actionBtn(C.primary),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                    }}
                    title={L.viewTransfer}
                  >
                    <Eye size={13} />
                  </button>

                  {(transfer.status === 'draft' || transfer.status === 'pending') && (
                    <button
                      onClick={() => openEditModal(transfer)}
                      style={{
                        ...s.actionBtn(C.info),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.editTransfer}
                    >
                      <Edit size={13} />
                    </button>
                  )}

                  {transfer.status === 'draft' && (
                    <button
                      onClick={() => handleApprove(transfer)}
                      style={{
                        ...s.actionBtn(C.warning),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.approve}
                    >
                      <CheckCircle size={13} />
                    </button>
                  )}

                  {transfer.status === 'pending' && (
                    <button
                      onClick={() => handleShip(transfer.id)}
                      style={{
                        ...s.actionBtn(C.info),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.ship}
                    >
                      <Truck size={13} />
                    </button>
                  )}

                  {transfer.status === 'in_transit' && (
                    <button
                      onClick={() => handleReceive(transfer)}
                      style={{
                        ...s.actionBtn(C.success),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.receive}
                    >
                      <Package size={13} />
                    </button>
                  )}

                  {(transfer.status === 'draft' || transfer.status === 'pending') && (
                    <button
                      onClick={() => handleCancel(transfer.id)}
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

                  {(transfer.status === 'draft' || transfer.status === 'cancelled') && (
                    <button
                      onClick={() => setDeleteTarget(transfer.id)}
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
            {filteredTransfers.length} {L.transfersCount}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{L.transferNumber}</th>
                  <th style={s.th}>{L.fromStore} / {L.toStore}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.items}</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>{L.totalValue}</th>
                  <th style={s.th}>{L.status}</th>
                  <th style={s.th}>{L.date}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((transfer) => {
                  const stCfg = STATUS_CONFIG[transfer.status]

                  return (
                    <tr
                      key={transfer.id}
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
                          {transfer.transfer_number}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 500 }}>{transfer.from_store_name}</span>
                          <ArrowRight size={14} color={C.textMuted} />
                          <span style={{ fontWeight: 500 }}>{transfer.to_store_name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                          {transfer.requested_by_name}
                        </div>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center', fontWeight: 600 }}>
                        {transfer.total_items}
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatCurrency(transfer.total_value, currency)}
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(stCfg.color, stCfg.bg)}>
                          {statusLabel(transfer.status)}
                        </span>
                      </td>
                      <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: 13, color: C.textSecondary }}>
                        {formatDate(transfer.created_at)}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          {/* View */}
                          <button
                            onClick={() => setViewingTransfer(transfer)}
                            style={s.actionBtn(C.primary)}
                            title={L.viewTransfer}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.primaryLight
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit (draft/pending only) */}
                          {(transfer.status === 'draft' || transfer.status === 'pending') && (
                            <button
                              onClick={() => openEditModal(transfer)}
                              style={s.actionBtn(C.info)}
                              title={L.editTransfer}
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

                          {/* Approve (draft → pending) */}
                          {transfer.status === 'draft' && (
                            <button
                              onClick={() => handleApprove(transfer)}
                              style={s.actionBtn(C.warning)}
                              title={L.approve}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.warningBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}

                          {/* Ship (pending → in_transit) */}
                          {transfer.status === 'pending' && (
                            <button
                              onClick={() => handleShip(transfer.id)}
                              style={s.actionBtn(C.info)}
                              title={L.ship}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.infoBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Truck size={15} />
                            </button>
                          )}

                          {/* Receive (in_transit → received) */}
                          {transfer.status === 'in_transit' && (
                            <button
                              onClick={() => handleReceive(transfer)}
                              style={s.actionBtn(C.success)}
                              title={L.receive}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.successBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Package size={15} />
                            </button>
                          )}

                          {/* Cancel (draft/pending only) */}
                          {(transfer.status === 'draft' || transfer.status === 'pending') && (
                            <button
                              onClick={() => handleCancel(transfer.id)}
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
                          {(transfer.status === 'draft' || transfer.status === 'cancelled') && (
                            <button
                              onClick={() => setDeleteTarget(transfer.id)}
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

      {/* ── Add / Edit Transfer Modal ────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingTransfer ? L.editTransfer : L.addTransfer}
        size="lg"
      >
        {/* From Store (read-only) */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.fromStore}</label>
          <input
            type="text"
            value={storeName}
            readOnly
            style={{
              ...s.formInput,
              backgroundColor: '#f8fafc',
              color: C.textSecondary,
              cursor: 'not-allowed',
            }}
          />
        </div>

        {/* To Store */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.toStore} *</label>
          <input
            type="text"
            value={formToStore}
            onChange={(e) => setFormToStore(e.target.value)}
            placeholder={L.toStore + '...'}
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
            <label style={{ ...s.formLabel, marginBottom: 0 }}>{L.items} *</label>
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
                {L.quantitySent}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase' }}>
                {L.unitCost}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', textAlign: 'right' }}>
                {L.total}
              </span>
              <span style={{ width: 30 }} />
            </div>
          )}

          {/* Item rows */}
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
                onChange={(e) => updateItemField(index, 'product_name', e.target.value)}
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
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>{L.quantitySent}</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity_sent}
                      onChange={(e) => updateItemField(index, 'quantity_sent', parseInt(e.target.value) || 0)}
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
                      onChange={(e) => updateItemField(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      style={{ ...s.formInput, padding: '8px 10px', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>{L.total}</label>
                    <div style={{ padding: '10px 10px', fontSize: 13, fontWeight: 600, color: C.text }}>
                      {formatCurrency(item.quantity_sent * item.unit_cost, currency)}
                    </div>
                  </div>
                </div>
              )}

              {!isMobile && (
                <>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity_sent}
                    onChange={(e) => updateItemField(index, 'quantity_sent', parseInt(e.target.value) || 0)}
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
                    onChange={(e) => updateItemField(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                    style={{ ...s.formInput, padding: '8px 10px', fontSize: 13 }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border
                    }}
                  />
                  <div
                    style={{
                      padding: '8px 10px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.text,
                      textAlign: 'right',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {formatCurrency(item.quantity_sent * item.unit_cost, currency)}
                  </div>
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

          {/* Total line */}
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
              <span style={{ fontSize: 14, fontWeight: 600, color: C.textSecondary }}>{L.totalValue}:</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>
                {formatCurrency(formTotalValue, currency)}
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
            style={s.cancelBtn}
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
            disabled={formSaving || !formToStore.trim() || formItems.filter((i) => i.product_name.trim()).length === 0}
          >
            {formSaving ? 'Saving...' : L.save}
          </button>
        </div>
      </Modal>

      {/* ── View Transfer Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={viewingTransfer !== null}
        onClose={() => setViewingTransfer(null)}
        title={L.viewTransfer}
        size="lg"
      >
        {viewingTransfer && (
          <div>
            {/* Transfer header info */}
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
                  {viewingTransfer.transfer_number}
                </div>
                <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
                  {formatDateTime(viewingTransfer.created_at)}
                </div>
              </div>
              <span style={s.badge(STATUS_CONFIG[viewingTransfer.status].color, STATUS_CONFIG[viewingTransfer.status].bg)}>
                {statusLabel(viewingTransfer.status)}
              </span>
            </div>

            {/* From → To */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: rv(10, 16, 20),
                marginBottom: 24,
                padding: rv(14, 18, 20),
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                  {L.fromStore}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                  {viewingTransfer.from_store_name}
                </div>
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: C.primaryLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ArrowRight size={20} color={C.primary} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                  {L.toStore}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                  {viewingTransfer.to_store_name}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>
                {L.timeline}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {TIMELINE_STEPS.map((step, idx) => {
                  const currentIdx = getTimelineIndex(viewingTransfer.status)
                  const isCancelled = viewingTransfer.status === 'cancelled'
                  const isActive = !isCancelled && idx <= currentIdx
                  const isCurrentStep = !isCancelled && idx === currentIdx
                  const stepColor = isActive ? C.primary : C.border
                  const stepBg = isActive ? C.primaryLight : '#f8fafc'

                  return (
                    <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: idx < TIMELINE_STEPS.length - 1 ? 1 : 'none' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: rv(50, 60, 70) }}>
                        <div
                          style={{
                            width: rv(28, 32, 36),
                            height: rv(28, 32, 36),
                            borderRadius: '50%',
                            backgroundColor: stepBg,
                            border: `2px solid ${stepColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s',
                          }}
                        >
                          {isCurrentStep && <CheckCircle size={rv(14, 16, 18)} color={C.primary} />}
                          {isActive && !isCurrentStep && (
                            <div
                              style={{
                                width: rv(8, 10, 12),
                                height: rv(8, 10, 12),
                                borderRadius: '50%',
                                backgroundColor: C.primary,
                              }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: rv(9, 10, 11),
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? C.primary : C.textMuted,
                            marginTop: 4,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {statusLabel(step.key)}
                        </span>
                      </div>
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            backgroundColor: (isActive && idx < currentIdx) ? C.primary : C.border,
                            marginBottom: 20,
                            transition: 'background-color 0.3s',
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              {viewingTransfer.status === 'cancelled' && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '8px 14px',
                    backgroundColor: C.dangerBg,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.danger,
                    textAlign: 'center',
                  }}
                >
                  {statusLabel('cancelled')}
                </div>
              )}
            </div>

            {/* Items table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                {L.items} ({viewingTransfer.total_items})
              </div>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  overflow: 'hidden',
                }}
              >
                {!isMobile && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
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
                      {L.quantitySent}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', textAlign: 'right' }}>
                      {L.unitCost}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', textAlign: 'right' }}>
                      {L.total}
                    </span>
                  </div>
                )}
                {viewingTransfer.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: isMobile ? 'flex' : 'grid',
                      gridTemplateColumns: isMobile ? undefined : '2fr 1fr 1fr 1fr',
                      flexDirection: isMobile ? 'column' : undefined,
                      gap: isMobile ? 4 : 8,
                      padding: isMobile ? '10px 14px' : '10px 14px',
                      borderBottom: idx < viewingTransfer.items.length - 1 ? `1px solid ${C.border}` : 'none',
                      backgroundColor: C.card,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: C.text, fontSize: 14 }}>
                      {item.product_name}
                    </span>
                    {isMobile ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.textSecondary }}>
                        <span>{L.quantitySent}: {item.quantity_sent}</span>
                        <span>{formatCurrency(item.unit_cost, currency)}</span>
                        <span style={{ fontWeight: 600, color: C.text }}>{formatCurrency(item.total, currency)}</span>
                      </div>
                    ) : (
                      <>
                        <span style={{ textAlign: 'center', fontWeight: 500, color: C.text }}>{item.quantity_sent}</span>
                        <span style={{ textAlign: 'right', color: C.textSecondary }}>{formatCurrency(item.unit_cost, currency)}</span>
                        <span style={{ textAlign: 'right', fontWeight: 600, color: C.text }}>{formatCurrency(item.total, currency)}</span>
                      </>
                    )}
                  </div>
                ))}
                {/* Total row */}
                <div
                  style={{
                    display: isMobile ? 'flex' : 'grid',
                    gridTemplateColumns: isMobile ? undefined : '2fr 1fr 1fr 1fr',
                    justifyContent: isMobile ? 'space-between' : undefined,
                    gap: 8,
                    padding: '12px 14px',
                    borderTop: `2px solid ${C.border}`,
                    backgroundColor: '#f1f5f9',
                  }}
                >
                  <span style={{ fontWeight: 700, color: C.text }}>{L.totalValue}</span>
                  {!isMobile && <span />}
                  {!isMobile && <span />}
                  <span style={{ textAlign: 'right', fontWeight: 700, color: C.primary, fontSize: 16 }}>
                    {formatCurrency(viewingTransfer.total_value, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Details section */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
                gap: 12,
                marginBottom: viewingTransfer.notes ? 16 : 0,
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                  {L.requestedBy}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                  {viewingTransfer.requested_by_name}
                </div>
              </div>
              {viewingTransfer.approved_by_name && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                    {L.approvedBy}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                    {viewingTransfer.approved_by_name}
                  </div>
                </div>
              )}
              {viewingTransfer.shipped_at && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                    {L.shippedAt}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                    {formatDateTime(viewingTransfer.shipped_at)}
                  </div>
                </div>
              )}
              {viewingTransfer.received_by_name && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                    {L.receivedBy}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                    {viewingTransfer.received_by_name}
                  </div>
                </div>
              )}
              {viewingTransfer.received_at && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4 }}>
                    {L.receivedAt}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                    {formatDateTime(viewingTransfer.received_at)}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {viewingTransfer.notes && (
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
                  {viewingTransfer.notes}
                </div>
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
              {viewingTransfer.status === 'draft' && (
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    backgroundColor: C.warningBg,
                    color: C.warning,
                    border: `1px solid ${C.warning}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    handleApprove(viewingTransfer)
                    setViewingTransfer(null)
                  }}
                >
                  <CheckCircle size={14} />
                  {L.approve}
                </button>
              )}

              {viewingTransfer.status === 'pending' && (
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
                    handleShip(viewingTransfer.id)
                    setViewingTransfer(null)
                  }}
                >
                  <Truck size={14} />
                  {L.ship}
                </button>
              )}

              {viewingTransfer.status === 'in_transit' && (
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
                    handleReceive(viewingTransfer)
                    setViewingTransfer(null)
                  }}
                >
                  <Package size={14} />
                  {L.receive}
                </button>
              )}

              <button
                style={s.cancelBtn}
                onClick={() => setViewingTransfer(null)}
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
              style={s.cancelBtn}
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
