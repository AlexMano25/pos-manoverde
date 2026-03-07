import { useState, useEffect, useMemo } from 'react'
import {
  Bike,
  Plus,
  Search,
  User,
  MapPin,
  Phone,
  Clock,
  Package,
  Truck,
  Check,
  X,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Trash2,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useDeliveryStore } from '../stores/deliveryStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { db } from '../db/dexie'
import type { Delivery, DeliveryStatus, DeliveryFeeType, User as UserType } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#d97706',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
} as const

// ── Status config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DeliveryStatus, { color: string; bg: string; label: string }> = {
  pending:    { color: '#94a3b8', bg: '#f1f5f9', label: 'Pending' },
  assigned:   { color: '#3b82f6', bg: '#eff6ff', label: 'Assigned' },
  picked_up:  { color: '#0891b2', bg: '#ecfeff', label: 'Picked Up' },
  in_transit:  { color: '#d97706', bg: '#fffbeb', label: 'In Transit' },
  delivered:  { color: '#16a34a', bg: '#f0fdf4', label: 'Delivered' },
  failed:     { color: '#ef4444', bg: '#fef2f2', label: 'Failed' },
}

const PIPELINE_STATUSES: DeliveryStatus[] = [
  'pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed',
]

const FILTER_TABS: Array<{ key: DeliveryStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'failed', label: 'Failed' },
]

// ── Form state ───────────────────────────────────────────────────────────

interface DeliveryForm {
  order_id: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  delivery_notes: string
  fee: number
  fee_type: DeliveryFeeType
  zone: string
  estimated_time: string
  notes: string
}

const emptyForm: DeliveryForm = {
  order_id: '',
  customer_name: '',
  customer_phone: '',
  delivery_address: '',
  delivery_notes: '',
  fee: 0,
  fee_type: 'flat',
  zone: '',
  estimated_time: '',
  notes: '',
}

// ── Component ────────────────────────────────────────────────────────────

export default function DeliveriesPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    deliveries,
    loading,
    loadDeliveries,
    addDelivery,
    updateDelivery,
    deleteDelivery,
    assignDriver,
    advanceStatus,
  } = useDeliveryStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showFailedModal, setShowFailedModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [form, setForm] = useState<DeliveryForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [failedReason, setFailedReason] = useState('')
  const [drivers, setDrivers] = useState<UserType[]>([])
  const [driversLoading, setDriversLoading] = useState(false)

  // i18n
  const label = (t as Record<string, any>).deliveries || {}

  const L = {
    title: label.title || 'Deliveries',
    addDelivery: label.addDelivery || 'New Delivery',
    editDelivery: label.editDelivery || 'Edit Delivery',
    todaysDeliveries: label.todaysDeliveries || "Today's Deliveries",
    pending: label.pending || 'Pending',
    inProgress: label.inProgress || 'In Progress',
    deliveredToday: label.deliveredToday || 'Delivered',
    searchPlaceholder: label.searchPlaceholder || 'Search by customer, address, order...',
    customerName: label.customerName || 'Customer Name',
    customerPhone: label.customerPhone || 'Phone',
    deliveryAddress: label.deliveryAddress || 'Delivery Address',
    deliveryNotes: label.deliveryNotes || 'Delivery Notes',
    orderRef: label.orderRef || 'Order Ref',
    feeAmount: label.feeAmount || 'Fee Amount',
    feeType: label.feeType || 'Fee Type',
    flat: label.flat || 'Flat',
    zone: label.zone || 'Zone',
    zoneName: label.zoneName || 'Zone Name',
    estimatedTime: label.estimatedTime || 'Estimated Time',
    notes: label.notes || 'Notes',
    save: label.save || 'Save',
    cancel: label.cancel || 'Cancel',
    noDeliveries: label.noDeliveries || 'No deliveries yet',
    noResults: label.noResults || 'No matching deliveries',
    assignDriver: label.assignDriver || 'Assign Driver',
    markPickedUp: label.markPickedUp || 'Mark Picked Up',
    markInTransit: label.markInTransit || 'Mark In Transit',
    markDelivered: label.markDelivered || 'Mark Delivered',
    markFailed: label.markFailed || 'Mark Failed',
    unassigned: label.unassigned || 'Unassigned',
    driver: label.driver || 'Driver',
    selectDriver: label.selectDriver || 'Select a Driver',
    noDrivers: label.noDrivers || 'No employees found',
    failedReason: label.failedReason || 'Reason for failure',
    confirmFailed: label.confirmFailed || 'Confirm Failed',
    deleteConfirmTitle: label.deleteConfirmTitle || 'Delete Delivery',
    deleteConfirmMsg: label.deleteConfirmMsg || 'Are you sure you want to delete this delivery?',
    delete: label.delete || 'Delete',
    all: label.all || 'All',
  }

  // ── Load data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    loadDeliveries(storeId)
  }, [storeId, loadDeliveries])

  // ── Stats ──────────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().slice(0, 10)

  const todaysCount = useMemo(() =>
    deliveries.filter((d) => d.created_at.startsWith(todayStr)).length,
  [deliveries, todayStr])

  const pendingCount = useMemo(() =>
    deliveries.filter((d) => d.status === 'pending').length,
  [deliveries])

  const inProgressCount = useMemo(() =>
    deliveries.filter((d) =>
      d.status === 'assigned' || d.status === 'picked_up' || d.status === 'in_transit'
    ).length,
  [deliveries])

  const deliveredTodayCount = useMemo(() =>
    deliveries.filter((d) =>
      d.status === 'delivered' && d.delivered_at && d.delivered_at.startsWith(todayStr)
    ).length,
  [deliveries, todayStr])

  // ── Status counts ──────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: deliveries.length }
    for (const s of PIPELINE_STATUSES) {
      counts[s] = deliveries.filter((d) => d.status === s).length
    }
    return counts
  }, [deliveries])

  // ── Filtered deliveries ───────────────────────────────────────────────
  const filteredDeliveries = useMemo(() => {
    let result = deliveries
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((d) =>
        (d.customer_name || '').toLowerCase().includes(q) ||
        (d.delivery_address || '').toLowerCase().includes(q) ||
        (d.order_id || '').toLowerCase().includes(q) ||
        (d.driver_name || '').toLowerCase().includes(q) ||
        (d.customer_phone || '').includes(q)
      )
    }
    return result
  }, [deliveries, statusFilter, searchQuery])

  // ── Load drivers for assign modal ──────────────────────────────────────
  const loadDrivers = async () => {
    setDriversLoading(true)
    try {
      const users = await db.users
        .where('store_id')
        .equals(storeId)
        .filter((u) => u.is_active)
        .toArray()
      setDrivers(users)
    } catch (error) {
      console.error('[DeliveriesPage] Failed to load drivers:', error)
    } finally {
      setDriversLoading(false)
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingDelivery(null)
    setForm({ ...emptyForm })
    setFormError('')
    setShowAddModal(true)
  }

  const openAssignModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery)
    loadDrivers()
    setShowAssignModal(true)
  }

  const openFailedModal = (delivery: Delivery) => {
    setSelectedDelivery(delivery)
    setFailedReason('')
    setShowFailedModal(true)
  }

  const openDeleteConfirm = (delivery: Delivery) => {
    setSelectedDelivery(delivery)
    setShowDeleteConfirm(true)
  }

  const handleSave = async () => {
    if (!form.customer_name.trim()) {
      setFormError(L.customerName + ' required')
      return
    }
    if (!form.delivery_address.trim()) {
      setFormError(L.deliveryAddress + ' required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editingDelivery) {
        await updateDelivery(editingDelivery.id, {
          order_id: form.order_id.trim() || undefined,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim() || undefined,
          delivery_address: form.delivery_address.trim(),
          delivery_notes: form.delivery_notes.trim() || undefined,
          fee: form.fee,
          fee_type: form.fee_type,
          zone: form.fee_type === 'zone' ? form.zone.trim() || undefined : undefined,
          estimated_time: form.estimated_time.trim() || undefined,
        })
      } else {
        await addDelivery(storeId, {
          order_id: form.order_id.trim() || undefined,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim() || undefined,
          delivery_address: form.delivery_address.trim(),
          delivery_notes: form.delivery_notes.trim() || undefined,
          status: 'pending',
          fee: form.fee,
          fee_type: form.fee_type,
          zone: form.fee_type === 'zone' ? form.zone.trim() || undefined : undefined,
          estimated_time: form.estimated_time.trim() || undefined,
        })
      }
      setShowAddModal(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async (driver: UserType) => {
    if (!selectedDelivery) return
    await assignDriver(selectedDelivery.id, driver.id, driver.name)
    setShowAssignModal(false)
  }

  const handleAdvance = async (delivery: Delivery, newStatus: DeliveryStatus) => {
    await advanceStatus(delivery.id, newStatus)
  }

  const handleFailed = async () => {
    if (!selectedDelivery) return
    await advanceStatus(selectedDelivery.id, 'failed', {
      failed_reason: failedReason.trim(),
    })
    setShowFailedModal(false)
  }

  const handleDelete = async () => {
    if (!selectedDelivery) return
    await deleteDelivery(selectedDelivery.id)
    setShowDeleteConfirm(false)
  }

  const truncate = (str: string, maxLen: number) => {
    if (str.length <= maxLen) return str
    return str.slice(0, maxLen) + '...'
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
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 12 : 0,
    marginBottom: 20,
    padding: rv(16, 20, 24),
    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    borderRadius: 16,
    color: '#ffffff',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 24, 28),
    fontWeight: 700,
    margin: 0,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const statBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    marginRight: 8,
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 12,
    border: '2px solid rgba(255,255,255,0.4)',
    background: 'rgba(255,255,255,0.2)',
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

  const statsRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
    gap: rv(8, 12, 14),
    marginBottom: 20,
  }

  const statCardStyle = (accent: string): React.CSSProperties => ({
    backgroundColor: C.card,
    borderRadius: 14,
    padding: rv(12, 16, 18),
    border: `1px solid ${C.border}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    borderLeft: `4px solid ${accent}`,
  })

  const statValueStyle: React.CSSProperties = {
    fontSize: rv(22, 26, 30),
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const statLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: 500,
    marginTop: 2,
  }

  const pipelineStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    padding: '12px 0',
    marginBottom: 16,
    alignItems: 'center',
  }

  const pillStyle = (isActive: boolean, color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    backgroundColor: isActive ? color : '#f8fafc',
    color: isActive ? '#ffffff' : C.textSecondary,
    border: isActive ? 'none' : `1px solid ${C.border}`,
    transition: 'all 0.15s',
  })

  const searchContainerStyle: React.CSSProperties = {
    marginBottom: 16,
    position: 'relative',
  }

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px 12px 44px',
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.card,
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  }

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: C.textSecondary,
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    padding: rv(14, 16, 20),
    marginBottom: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s',
  }

  const statusBadge = (status: DeliveryStatus): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 10,
    backgroundColor: STATUS_CONFIG[status].bg,
    color: STATUS_CONFIG[status].color,
  })

  const formFieldStyle: React.CSSProperties = { marginBottom: 14 }
  const formLabelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 5,
  }
  const formInputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: `1px solid ${C.border}`, fontSize: 14, color: C.text,
    outline: 'none', boxSizing: 'border-box',
  }
  const formTextareaStyle: React.CSSProperties = {
    ...formInputStyle, minHeight: 70, resize: 'vertical' as const, fontFamily: 'inherit',
  }
  const formErrorStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2', color: C.danger, padding: '8px 12px',
    borderRadius: 8, fontSize: 13, marginBottom: 12,
  }
  const btnRowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16,
  }
  const cancelBtnStyle: React.CSSProperties = {
    padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`,
    backgroundColor: '#ffffff', color: C.textSecondary, fontSize: 14,
    fontWeight: 500, cursor: 'pointer',
  }
  const saveBtnStyle: React.CSSProperties = {
    padding: '10px 24px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    opacity: saving ? 0.7 : 1,
  }
  const actionBtnStyle = (color: string): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 10, border: 'none',
    backgroundColor: color, color: '#ffffff', fontSize: 12,
    fontWeight: 600, cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', gap: 4,
  })

  // ── Render: Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
      </div>
    )
  }

  // ── Render: Stats row ─────────────────────────────────────────────────
  const renderStats = () => (
    <div style={statsRowStyle}>
      <div style={statCardStyle(C.primary)}>
        <div style={statValueStyle}>{todaysCount}</div>
        <div style={statLabelStyle}>{L.todaysDeliveries}</div>
      </div>
      <div style={statCardStyle('#94a3b8')}>
        <div style={statValueStyle}>{pendingCount}</div>
        <div style={statLabelStyle}>{L.pending}</div>
      </div>
      <div style={statCardStyle('#3b82f6')}>
        <div style={statValueStyle}>{inProgressCount}</div>
        <div style={statLabelStyle}>{L.inProgress}</div>
      </div>
      <div style={statCardStyle(C.success)}>
        <div style={statValueStyle}>{deliveredTodayCount}</div>
        <div style={statLabelStyle}>{L.deliveredToday}</div>
      </div>
    </div>
  )

  // ── Render: Pipeline ──────────────────────────────────────────────────
  const renderPipeline = () => (
    <div style={pipelineStyle}>
      {PIPELINE_STATUSES.map((s, idx) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              padding: '5px 12px',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: STATUS_CONFIG[s].bg,
              color: STATUS_CONFIG[s].color,
              border: `1px solid ${STATUS_CONFIG[s].color}20`,
              whiteSpace: 'nowrap',
            }}
          >
            {STATUS_CONFIG[s].label}: {statusCounts[s] || 0}
          </div>
          {idx < PIPELINE_STATUSES.length - 1 && s !== 'delivered' && (
            <ArrowRight size={14} style={{ color: C.textSecondary, flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  )

  // ── Render: Filter tabs ───────────────────────────────────────────────
  const renderFilterTabs = () => (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16 }}>
      {FILTER_TABS.map((tab) => (
        <div
          key={tab.key}
          style={pillStyle(
            statusFilter === tab.key,
            tab.key === 'all' ? C.primary : STATUS_CONFIG[tab.key as DeliveryStatus]?.color || C.primary,
          )}
          onClick={() => setStatusFilter(tab.key as DeliveryStatus | 'all')}
        >
          {tab.label} ({statusCounts[tab.key] ?? deliveries.length})
        </div>
      ))}
    </div>
  )

  // ── Render: Empty state ───────────────────────────────────────────────
  const renderEmpty = () => (
    <div style={{ textAlign: 'center', padding: 60, color: C.textSecondary }}>
      <Bike size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
      <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
        {filteredDeliveries.length === 0 && deliveries.length > 0 ? L.noResults : L.noDeliveries}
      </p>
    </div>
  )

  // ── Render: Action buttons per status ─────────────────────────────────
  const renderActions = (delivery: Delivery) => {
    const actions: React.ReactNode[] = []

    switch (delivery.status) {
      case 'pending':
        actions.push(
          <button
            key="assign"
            style={actionBtnStyle('#3b82f6')}
            onClick={(e) => { e.stopPropagation(); openAssignModal(delivery) }}
          >
            <User size={12} /> {L.assignDriver}
          </button>
        )
        break
      case 'assigned':
        actions.push(
          <button
            key="picked"
            style={actionBtnStyle('#0891b2')}
            onClick={(e) => { e.stopPropagation(); handleAdvance(delivery, 'picked_up') }}
          >
            <Package size={12} /> {L.markPickedUp}
          </button>
        )
        break
      case 'picked_up':
        actions.push(
          <button
            key="transit"
            style={actionBtnStyle('#d97706')}
            onClick={(e) => { e.stopPropagation(); handleAdvance(delivery, 'in_transit') }}
          >
            <Truck size={12} /> {L.markInTransit}
          </button>
        )
        break
      case 'in_transit':
        actions.push(
          <button
            key="delivered"
            style={actionBtnStyle('#16a34a')}
            onClick={(e) => { e.stopPropagation(); handleAdvance(delivery, 'delivered') }}
          >
            <Check size={12} /> {L.markDelivered}
          </button>,
          <button
            key="failed"
            style={actionBtnStyle('#ef4444')}
            onClick={(e) => { e.stopPropagation(); openFailedModal(delivery) }}
          >
            <X size={12} /> {L.markFailed}
          </button>
        )
        break
      // delivered/failed: no action buttons
    }

    // Delete button for pending/assigned
    if (delivery.status === 'pending' || delivery.status === 'assigned') {
      actions.push(
        <button
          key="delete"
          style={{ ...actionBtnStyle('transparent'), color: C.danger, padding: '6px 8px' }}
          onClick={(e) => { e.stopPropagation(); openDeleteConfirm(delivery) }}
        >
          <Trash2 size={14} />
        </button>
      )
    }

    return actions.length > 0 ? (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {actions}
      </div>
    ) : null
  }

  // ── Render: Delivery cards ────────────────────────────────────────────
  const renderCard = (delivery: Delivery) => (
    <div key={delivery.id} style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Customer name and status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
              {delivery.customer_name || '-'}
            </span>
            <span style={statusBadge(delivery.status)}>
              {STATUS_CONFIG[delivery.status].label}
            </span>
          </div>

          {/* Phone */}
          {delivery.customer_phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.textSecondary, marginTop: 3 }}>
              <Phone size={12} />
              <span>{delivery.customer_phone}</span>
            </div>
          )}

          {/* Address */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.text, marginTop: 4 }}>
            <MapPin size={12} style={{ flexShrink: 0, color: C.textSecondary }} />
            <span>{truncate(delivery.delivery_address, 50)}</span>
          </div>

          {/* Driver */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, marginTop: 4 }}>
            <User size={12} style={{ color: C.textSecondary }} />
            <span style={{
              color: delivery.driver_name ? C.text : C.textSecondary,
              fontWeight: delivery.driver_name ? 500 : 400,
              fontStyle: delivery.driver_name ? 'normal' : 'italic',
            }}>
              {delivery.driver_name || L.unassigned}
            </span>
          </div>

          {/* Order ref, estimated time */}
          <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: C.textSecondary }}>
            {delivery.order_id && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Package size={11} />
                {delivery.order_id}
              </span>
            )}
            {delivery.estimated_time && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                {delivery.estimated_time}
              </span>
            )}
          </div>

          {/* Failed reason */}
          {delivery.status === 'failed' && delivery.failed_reason && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 5,
              marginTop: 6, padding: '6px 10px', borderRadius: 8,
              backgroundColor: '#fef2f2', fontSize: 12, color: '#dc2626',
            }}>
              <AlertTriangle size={13} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{delivery.failed_reason}</span>
            </div>
          )}
        </div>

        {/* Fee */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>
            {formatCurrency(delivery.fee, currency)}
          </div>
          {delivery.fee_type === 'zone' && delivery.zone && (
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
              {delivery.zone}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {renderActions(delivery)}
    </div>
  )

  // ── Render: Delivery modal (add/edit) ─────────────────────────────────
  const renderDeliveryModal = () => (
    <Modal
      isOpen={showAddModal}
      onClose={() => setShowAddModal(false)}
      title={editingDelivery ? L.editDelivery : L.addDelivery}
      size="md"
    >
      <div>
        {formError && <div style={formErrorStyle}>{formError}</div>}

        {/* Order Ref */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.orderRef}</label>
          <input
            value={form.order_id}
            onChange={(e) => setForm((prev) => ({ ...prev, order_id: e.target.value }))}
            placeholder={L.orderRef}
            style={formInputStyle}
          />
        </div>

        {/* Customer Name */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.customerName} *</label>
          <input
            value={form.customer_name}
            onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
            placeholder={L.customerName}
            style={formInputStyle}
          />
        </div>

        {/* Phone */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.customerPhone}</label>
          <input
            value={form.customer_phone}
            onChange={(e) => setForm((prev) => ({ ...prev, customer_phone: e.target.value }))}
            placeholder={L.customerPhone}
            style={formInputStyle}
          />
        </div>

        {/* Address */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.deliveryAddress} *</label>
          <textarea
            value={form.delivery_address}
            onChange={(e) => setForm((prev) => ({ ...prev, delivery_address: e.target.value }))}
            placeholder={L.deliveryAddress}
            style={formTextareaStyle}
          />
        </div>

        {/* Delivery Notes */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.deliveryNotes}</label>
          <textarea
            value={form.delivery_notes}
            onChange={(e) => setForm((prev) => ({ ...prev, delivery_notes: e.target.value }))}
            placeholder={L.deliveryNotes}
            style={{ ...formTextareaStyle, minHeight: 50 }}
          />
        </div>

        {/* Fee Amount */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.feeAmount}</label>
            <input
              type="number"
              min={0}
              value={form.fee}
              onChange={(e) => setForm((prev) => ({ ...prev, fee: Number(e.target.value) || 0 }))}
              style={formInputStyle}
            />
          </div>

          {/* Fee Type */}
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.feeType}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['flat', 'zone'] as DeliveryFeeType[]).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, fee_type: ft }))}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 10,
                    border: form.fee_type === ft
                      ? `2px solid ${C.primary}`
                      : `1px solid ${C.border}`,
                    backgroundColor: form.fee_type === ft ? C.primary + '15' : '#fff',
                    color: form.fee_type === ft ? C.primary : C.textSecondary,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {ft === 'flat' ? L.flat : L.zone}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zone Name (conditional) */}
        {form.fee_type === 'zone' && (
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.zoneName}</label>
            <input
              value={form.zone}
              onChange={(e) => setForm((prev) => ({ ...prev, zone: e.target.value }))}
              placeholder={L.zoneName}
              style={formInputStyle}
            />
          </div>
        )}

        {/* Estimated Time */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.estimatedTime}</label>
          <input
            value={form.estimated_time}
            onChange={(e) => setForm((prev) => ({ ...prev, estimated_time: e.target.value }))}
            placeholder="e.g. 30 min, 14:00"
            style={formInputStyle}
          />
        </div>

        {/* Notes */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.notes}</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder={L.notes}
            style={{ ...formTextareaStyle, minHeight: 50 }}
          />
        </div>

        {/* Buttons */}
        <div style={btnRowStyle}>
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            style={cancelBtnStyle}
          >
            {L.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={saveBtnStyle}
          >
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : L.save}
          </button>
        </div>
      </div>
    </Modal>
  )

  // ── Render: Assign driver modal ───────────────────────────────────────
  const renderAssignModal = () => (
    <Modal
      isOpen={showAssignModal}
      onClose={() => setShowAssignModal(false)}
      title={L.selectDriver}
      size="sm"
    >
      <div>
        {driversLoading ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
          </div>
        ) : drivers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: C.textSecondary }}>
            <User size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 14, margin: 0 }}>{L.noDrivers}</p>
          </div>
        ) : (
          <div>
            {drivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                onSelect={() => handleAssign(driver)}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )

  // ── Render: Failed reason modal ───────────────────────────────────────
  const renderFailedModal = () => (
    <Modal
      isOpen={showFailedModal}
      onClose={() => setShowFailedModal(false)}
      title={L.markFailed}
      size="sm"
    >
      <div>
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.failedReason}</label>
          <textarea
            value={failedReason}
            onChange={(e) => setFailedReason(e.target.value)}
            placeholder={L.failedReason}
            style={formTextareaStyle}
            autoFocus
          />
        </div>
        <div style={btnRowStyle}>
          <button
            type="button"
            onClick={() => setShowFailedModal(false)}
            style={cancelBtnStyle}
          >
            {L.cancel}
          </button>
          <button
            type="button"
            onClick={handleFailed}
            style={{ ...saveBtnStyle, background: '#ef4444' }}
          >
            <AlertTriangle size={14} style={{ marginRight: 4 }} />
            {L.confirmFailed}
          </button>
        </div>
      </div>
    </Modal>
  )

  // ── Render: Delete confirmation ───────────────────────────────────────
  const renderDeleteConfirm = () => (
    <Modal
      isOpen={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      title={L.deleteConfirmTitle}
      size="sm"
    >
      <div>
        <p style={{ fontSize: 14, color: C.text, marginBottom: 20 }}>
          {L.deleteConfirmMsg}
        </p>
        <div style={btnRowStyle}>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            style={cancelBtnStyle}
          >
            {L.cancel}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            style={{ ...saveBtnStyle, background: '#ef4444' }}
          >
            <Trash2 size={14} style={{ marginRight: 4 }} />
            {L.delete}
          </button>
        </div>
      </div>
    </Modal>
  )

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* CSS keyframes for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <Bike size={rv(22, 26, 28)} />
            {L.title}
          </h1>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap' }}>
            <span style={statBadgeStyle}>{todaysCount} {L.todaysDeliveries.toLowerCase()}</span>
            <span style={statBadgeStyle}>{pendingCount} {L.pending.toLowerCase()}</span>
            <span style={statBadgeStyle}>{inProgressCount} {L.inProgress.toLowerCase()}</span>
          </div>
        </div>
        <button style={addBtnStyle} onClick={openAddModal}>
          <Plus size={18} /> {L.addDelivery}
        </button>
      </div>

      {/* Stats row */}
      {renderStats()}

      {/* Visual pipeline */}
      {renderPipeline()}

      {/* Filter tabs */}
      {renderFilterTabs()}

      {/* Search */}
      <div style={searchContainerStyle}>
        <Search size={18} style={searchIconStyle} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={L.searchPlaceholder}
          style={searchInputStyle}
        />
      </div>

      {/* Delivery cards */}
      {filteredDeliveries.length === 0 ? renderEmpty() : (
        <div>
          {filteredDeliveries.map((delivery) => renderCard(delivery))}
        </div>
      )}

      {/* Modals */}
      {renderDeliveryModal()}
      {renderAssignModal()}
      {renderFailedModal()}
      {renderDeleteConfirm()}
    </div>
  )
}

// ── Driver card sub-component ─────────────────────────────────────────────

function DriverCard({ driver, onSelect }: { driver: UserType; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        border: `1px solid #e2e8f0`,
        backgroundColor: hovered ? '#fffbeb' : '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
        transition: 'background-color 0.15s',
      }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        backgroundColor: '#d97706' + '20', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <User size={18} style={{ color: '#d97706' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
          {driver.name}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>
          {driver.role}
        </div>
      </div>
      <ArrowRight size={16} style={{ color: '#64748b' }} />
    </div>
  )
}
