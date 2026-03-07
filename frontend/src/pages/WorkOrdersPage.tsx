import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Loader2,
  ChevronRight,
  Calendar,
  Phone,
  FileText,
  Wrench,
  Trash2,
  X,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useWorkOrderStore } from '../stores/workOrderStore'
import { useCustomerStore } from '../stores/customerStore'
import { useProductStore } from '../stores/productStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { generateUUID } from '../utils/uuid'
import type { WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderItem } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#ea580c',
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

const STATUS_CONFIG: Record<WorkOrderStatus, { color: string; bg: string }> = {
  received:    { color: '#3b82f6', bg: '#eff6ff' },
  diagnosed:   { color: '#8b5cf6', bg: '#f5f3ff' },
  quoted:      { color: '#a855f7', bg: '#faf5ff' },
  approved:    { color: '#06b6d4', bg: '#ecfeff' },
  in_progress: { color: '#f59e0b', bg: '#fffbeb' },
  completed:   { color: '#16a34a', bg: '#f0fdf4' },
  delivered:   { color: '#10b981', bg: '#ecfdf5' },
  cancelled:   { color: '#ef4444', bg: '#fef2f2' },
}

const PIPELINE_STATUSES: WorkOrderStatus[] = [
  'received', 'diagnosed', 'quoted', 'approved', 'in_progress', 'completed', 'delivered',
]

const PRIORITY_CONFIG: Record<WorkOrderPriority, { emoji: string; label: string; color: string }> = {
  low:    { emoji: '\uD83D\uDFE2', label: 'Bas', color: '#16a34a' },
  normal: { emoji: '\uD83D\uDFE1', label: 'Normal', color: '#f59e0b' },
  high:   { emoji: '\uD83D\uDFE0', label: 'Haut', color: '#ea580c' },
  urgent: { emoji: '\uD83D\uDD34', label: 'Urgent', color: '#dc2626' },
}

const NEXT_STATUS: Partial<Record<WorkOrderStatus, { next: WorkOrderStatus; label: string }>> = {
  received:    { next: 'diagnosed', label: 'Diagnostiquer' },
  diagnosed:   { next: 'quoted', label: 'Devis' },
  quoted:      { next: 'approved', label: 'Approuver' },
  approved:    { next: 'in_progress', label: 'Commencer' },
  in_progress: { next: 'completed', label: 'Terminer' },
  completed:   { next: 'delivered', label: 'Livrer' },
}

// ── Form state ───────────────────────────────────────────────────────────

interface WOForm {
  customer_id: string
  customer_name: string
  customer_phone: string
  item_description: string
  item_identifier: string
  priority: WorkOrderPriority
  diagnosis: string
  estimated_completion: string
  notes: string
  items: WorkOrderItem[]
}

const emptyItem: WorkOrderItem = {
  description: '',
  type: 'labor',
  quantity: 1,
  unit_price: 0,
  total: 0,
}

const emptyForm: WOForm = {
  customer_id: '',
  customer_name: '',
  customer_phone: '',
  item_description: '',
  item_identifier: '',
  priority: 'normal',
  diagnosis: '',
  estimated_completion: '',
  notes: '',
  items: [{ ...emptyItem, description: '', type: 'labor', quantity: 1, unit_price: 0, total: 0 }],
}

// ── Component ────────────────────────────────────────────────────────────

export default function WorkOrdersPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    workOrders,
    loading,
    loadWorkOrders,
    addWorkOrder,
    updateWorkOrder,
    setStatus,
  } = useWorkOrderStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { products, loadProducts } = useProductStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const activity = currentStore?.activity || 'auto_repair'

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)
  const [form, setForm] = useState<WOForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState<number | null>(null)

  // i18n
  const tw = (t as Record<string, any>).workOrders || {}
  const tCommon = (t as Record<string, any>).common || {}

  // Activity-adaptive labels
  const getTitle = () => {
    switch (activity) {
      case 'auto_repair': return tw.title || 'Atelier'
      case 'electronics': return tw.titleRepairs || 'Repairs'
      case 'laundry': return tw.titleServices || 'Services'
      case 'home_cleaning': return tw.titleInterventions || 'Interventions'
      default: return tw.title || 'Work Orders'
    }
  }

  const getItemPlaceholder = () => {
    switch (activity) {
      case 'auto_repair': return tw.vehiclePlaceholder || 'Vehicle (e.g. Toyota Corolla 2019)'
      case 'electronics': return tw.devicePlaceholder || 'Device (e.g. iPhone 14 Pro)'
      case 'laundry': return tw.articlesPlaceholder || 'Articles (e.g. 3 suits, 5 shirts)'
      default: return tw.itemPlaceholder || 'Item description'
    }
  }

  const getIdPlaceholder = () => {
    switch (activity) {
      case 'auto_repair': return tw.platePlaceholder || 'License plate (e.g. AB-123-CD)'
      case 'electronics': return tw.serialPlaceholder || 'Serial number'
      default: return tw.tagPlaceholder || 'Tag / Reference number'
    }
  }

  const label = {
    title: getTitle(),
    addWorkOrder: tw.addWorkOrder || 'New Work Order',
    active: tw.active || 'active',
    pendingDiag: tw.pendingDiag || 'pending diagnosis',
    readyDelivery: tw.readyDelivery || 'ready for delivery',
    received: tw.received || 'Received',
    diagnosed: tw.diagnosed || 'Diagnosed',
    quoted: tw.quoted || 'Quoted',
    approved: tw.approved || 'Approved',
    inProgress: tw.inProgress || 'In Progress',
    completed: tw.completed || 'Completed',
    delivered: tw.delivered || 'Delivered',
    cancelled: tw.cancelled || 'Cancelled',
    searchPlaceholder: tw.searchPlaceholder || 'Search by order number, customer...',
    customer: tw.customer || 'Customer',
    searchCustomer: tw.searchCustomer || 'Search customer...',
    itemDescription: tw.itemDescription || 'Item Description',
    itemIdentifier: tw.itemIdentifier || 'Identifier',
    priority: tw.priority || 'Priority',
    diagnosis: tw.diagnosis || 'Diagnosis',
    lineItems: tw.lineItems || 'Line Items',
    type: tw.type || 'Type',
    description: tw.description || 'Description',
    qty: tw.qty || 'Qty',
    unitPrice: tw.unitPrice || 'Unit Price',
    total: tw.total || 'Total',
    addLine: tw.addLine || '+ Add Line',
    labor: tw.labor || 'Labor',
    part: tw.part || 'Part',
    service: tw.service || 'Service',
    estCompletion: tw.estCompletion || 'Estimated Completion',
    notes: tw.notes || 'Notes',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    noWorkOrders: tw.noWorkOrders || 'No work orders yet',
    noResults: tw.noResults || 'No matching work orders',
    generateInvoice: tw.generateInvoice || 'Generate Invoice',
    laborTotal: tw.laborTotal || 'Labor',
    partsTotal: tw.partsTotal || 'Parts',
    estimatedTotal: tw.estimatedTotal || 'Estimated Total',
    all: tCommon.all || 'All',
    searchProducts: tw.searchProducts || 'Search product...',
    orderDetail: tw.orderDetail || 'Work Order Detail',
    statusReceived: tw.statusReceived || 'Received',
    noCustomerFound: tw.noCustomerFound || 'No customer found',
  }

  const statusLabels: Record<WorkOrderStatus, string> = {
    received: label.received,
    diagnosed: label.diagnosed,
    quoted: label.quoted,
    approved: label.approved,
    in_progress: label.inProgress,
    completed: label.completed,
    delivered: label.delivered,
    cancelled: label.cancelled,
  }

  // ── Load data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    loadWorkOrders(storeId)
    loadCustomers(storeId)
    loadProducts(storeId)
  }, [storeId, loadWorkOrders, loadCustomers, loadProducts])

  // ── Stats ──────────────────────────────────────────────────────────────
  const activeCount = useMemo(() =>
    workOrders.filter((w) =>
      !['delivered', 'cancelled'].includes(w.status)
    ).length,
  [workOrders])

  const pendingDiagCount = useMemo(() =>
    workOrders.filter((w) => w.status === 'received').length,
  [workOrders])

  const readyDeliveryCount = useMemo(() =>
    workOrders.filter((w) => w.status === 'completed').length,
  [workOrders])

  // ── Status counts ──────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: workOrders.length }
    for (const s of PIPELINE_STATUSES) {
      counts[s] = workOrders.filter((w) => w.status === s).length
    }
    return counts
  }, [workOrders])

  // ── Filtered work orders ───────────────────────────────────────────────
  const filteredWOs = useMemo(() => {
    let result = workOrders
    if (statusFilter !== 'all') {
      result = result.filter((w) => w.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((w) =>
        w.order_number.toLowerCase().includes(q) ||
        (w.customer_name || '').toLowerCase().includes(q) ||
        w.item_description.toLowerCase().includes(q) ||
        (w.item_identifier || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [workOrders, statusFilter, searchQuery])

  // ── Customer search results ────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 10)
    const q = customerSearch.toLowerCase()
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    ).slice(0, 10)
  }, [customers, customerSearch])

  // ── Product search results ─────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 10)
    const q = productSearch.toLowerCase()
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    ).slice(0, 10)
  }, [products, productSearch])

  // ── Handlers ───────────────────────────────────────────────────────────

  const openAddModal = () => {
    setForm({ ...emptyForm, items: [{ ...emptyItem }] })
    setFormError('')
    setCustomerSearch('')
    setProductSearch('')
    setShowCustomerDropdown(false)
    setShowProductDropdown(null)
    setShowAddModal(true)
  }

  const openDetailModal = (wo: WorkOrder) => {
    setSelectedWO(wo)
    setShowDetailModal(true)
  }

  const handleAddLine = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }))
  }

  const handleRemoveLine = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }))
  }

  const handleItemChange = (idx: number, field: keyof WorkOrderItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items]
      const item = { ...items[idx] }

      if (field === 'type') {
        item.type = value as WorkOrderItem['type']
      } else if (field === 'description') {
        item.description = value as string
      } else if (field === 'product_id') {
        item.product_id = value as string
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0
        item.total = item.quantity * item.unit_price
      } else if (field === 'unit_price') {
        item.unit_price = Number(value) || 0
        item.total = item.quantity * item.unit_price
      }

      items[idx] = item
      return { ...prev, items }
    })
  }

  const selectProductForItem = (idx: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setForm((prev) => {
      const items = [...prev.items]
      const item = { ...items[idx] }
      item.product_id = product.id
      item.description = product.name
      item.unit_price = product.price
      item.total = item.quantity * product.price
      items[idx] = item
      return { ...prev, items }
    })
    setShowProductDropdown(null)
    setProductSearch('')
  }

  const computeFormTotals = () => {
    let laborTotal = 0
    let partsTotal = 0
    for (const item of form.items) {
      const lineTotal = item.quantity * item.unit_price
      if (item.type === 'labor' || item.type === 'service') {
        laborTotal += lineTotal
      } else {
        partsTotal += lineTotal
      }
    }
    return { laborTotal, partsTotal, estimatedTotal: laborTotal + partsTotal }
  }

  const handleSave = async () => {
    if (!form.item_description.trim()) {
      setFormError(label.itemDescription + ' required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const items = form.items.map((item) => ({
        ...item,
        total: item.quantity * item.unit_price,
      }))
      let laborTotal = 0
      let partsTotal = 0
      for (const item of items) {
        if (item.type === 'labor' || item.type === 'service') laborTotal += item.total
        else partsTotal += item.total
      }

      await addWorkOrder(storeId, {
        customer_id: form.customer_id || undefined,
        customer_name: form.customer_name || undefined,
        customer_phone: form.customer_phone || undefined,
        status: 'received',
        priority: form.priority,
        item_description: form.item_description.trim(),
        item_identifier: form.item_identifier.trim() || undefined,
        diagnosis: form.diagnosis.trim() || undefined,
        items,
        labor_total: laborTotal,
        parts_total: partsTotal,
        estimated_total: laborTotal + partsTotal,
        received_at: new Date().toISOString(),
        estimated_completion: form.estimated_completion || undefined,
        notes: form.notes.trim() || undefined,
      })
      setShowAddModal(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (wo: WorkOrder, newStatus: WorkOrderStatus) => {
    await setStatus(wo.id, newStatus)
    setSelectedWO((prev) => prev ? { ...prev, status: newStatus } : null)
  }

  const handleUpdateDetailItems = async (wo: WorkOrder, updatedItems: WorkOrderItem[]) => {
    let laborTotal = 0
    let partsTotal = 0
    for (const item of updatedItems) {
      if (item.type === 'labor' || item.type === 'service') laborTotal += item.total
      else partsTotal += item.total
    }
    await updateWorkOrder(wo.id, {
      items: updatedItems,
      labor_total: laborTotal,
      parts_total: partsTotal,
      estimated_total: laborTotal + partsTotal,
    })
    setSelectedWO((prev) => prev ? {
      ...prev,
      items: updatedItems,
      labor_total: laborTotal,
      parts_total: partsTotal,
      estimated_total: laborTotal + partsTotal,
    } : null)
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const totals = computeFormTotals()

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
    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
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

  const pipelineStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    padding: '12px 0',
    marginBottom: 16,
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
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s',
  }

  const orderNumStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: C.text,
    fontFamily: '"SF Mono", "Fira Code", monospace',
  }

  const statusBadge = (status: WorkOrderStatus): React.CSSProperties => ({
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
    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    opacity: saving ? 0.7 : 1,
  }
  const actionBtnStyle = (color: string): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 10, border: 'none',
    backgroundColor: color, color: '#ffffff', fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  })
  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
    backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto',
  }
  const dropdownItemStyle: React.CSSProperties = {
    padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
  }

  // ── Render: Empty state ─────────────────────────────────────────────
  const renderEmpty = () => (
    <div style={{ textAlign: 'center', padding: 60, color: C.textSecondary }}>
      <Wrench size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
      <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
        {filteredWOs.length === 0 && workOrders.length > 0 ? label.noResults : label.noWorkOrders}
      </p>
    </div>
  )

  // ── Render: Pipeline bar ────────────────────────────────────────────
  const renderPipeline = () => (
    <div style={pipelineStyle}>
      <div
        style={pillStyle(statusFilter === 'all', C.primary)}
        onClick={() => setStatusFilter('all')}
      >
        {label.all} ({statusCounts.all})
      </div>
      {PIPELINE_STATUSES.map((s) => (
        <div
          key={s}
          style={pillStyle(statusFilter === s, STATUS_CONFIG[s].color)}
          onClick={() => setStatusFilter(s)}
        >
          {statusLabels[s]} ({statusCounts[s] || 0})
          {s !== 'delivered' && <ChevronRight size={12} />}
        </div>
      ))}
    </div>
  )

  // ── Render: Work order cards ─────────────────────────────────────────
  const renderCard = (wo: WorkOrder) => {
    const prio = PRIORITY_CONFIG[wo.priority]
    return (
      <div key={wo.id} style={cardStyle} onClick={() => openDetailModal(wo)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={orderNumStyle}>{wo.order_number}</span>
              <span style={statusBadge(wo.status)}>{statusLabels[wo.status]}</span>
              <span style={{ fontSize: 14 }} title={prio.label}>{prio.emoji}</span>
            </div>
            {wo.customer_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
                <span style={{ fontWeight: 500, color: C.text }}>{wo.customer_name}</span>
                {wo.customer_phone && (
                  <>
                    <Phone size={12} />
                    <span>{wo.customer_phone}</span>
                  </>
                )}
              </div>
            )}
            <div style={{ fontSize: 13, color: C.text, marginTop: 6 }}>
              {wo.item_description}
              {wo.item_identifier && (
                <span style={{ color: C.textSecondary, marginLeft: 6 }}>
                  — {wo.item_identifier}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>
              {formatCurrency(wo.estimated_total, currency)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: C.textSecondary }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} />
            {formatDate(wo.received_at)}
          </span>
          {wo.estimated_completion && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} />
              Est: {formatDate(wo.estimated_completion)}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── Render: Priority selector ────────────────────────────────────────
  const renderPrioritySelector = () => (
    <div style={formFieldStyle}>
      <label style={formLabelStyle}>{label.priority}</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(Object.keys(PRIORITY_CONFIG) as WorkOrderPriority[]).map((p) => {
          const cfg = PRIORITY_CONFIG[p]
          const isSelected = form.priority === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: isSelected ? `2px solid ${cfg.color}` : `1px solid ${C.border}`,
                backgroundColor: isSelected ? cfg.color + '15' : '#fff',
                color: cfg.color,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {cfg.emoji} {cfg.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  // ── Render: Line items editor ────────────────────────────────────────
  const renderLineItems = () => (
    <div style={formFieldStyle}>
      <label style={formLabelStyle}>{label.lineItems}</label>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '80px 1fr 50px 70px 40px' : '100px 1fr 60px 100px 80px 40px',
          gap: 0,
          padding: '8px 10px',
          backgroundColor: '#f8fafc',
          fontSize: 11,
          fontWeight: 600,
          color: C.textSecondary,
          textTransform: 'uppercase',
        }}>
          <span>{label.type}</span>
          <span>{label.description}</span>
          <span>{label.qty}</span>
          <span>{label.unitPrice}</span>
          {!isMobile && <span>{label.total}</span>}
          <span />
        </div>
        {/* Rows */}
        {form.items.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '80px 1fr 50px 70px 40px' : '100px 1fr 60px 100px 80px 40px',
            gap: 0,
            padding: '6px 10px',
            borderTop: `1px solid ${C.border}`,
            alignItems: 'center',
          }}>
            <select
              value={item.type}
              onChange={(e) => handleItemChange(idx, 'type', e.target.value)}
              style={{ ...formInputStyle, padding: '6px 4px', fontSize: 12 }}
            >
              <option value="labor">{label.labor}</option>
              <option value="part">{label.part}</option>
              <option value="service">{label.service}</option>
            </select>
            <div style={{ position: 'relative' }}>
              <input
                value={item.description}
                onChange={(e) => {
                  handleItemChange(idx, 'description', e.target.value)
                  if (item.type === 'part') {
                    setProductSearch(e.target.value)
                    setShowProductDropdown(idx)
                  }
                }}
                placeholder={item.type === 'part' ? label.searchProducts : label.description}
                style={{ ...formInputStyle, padding: '6px 8px', fontSize: 13 }}
              />
              {showProductDropdown === idx && item.type === 'part' && filteredProducts.length > 0 && (
                <div style={dropdownStyle}>
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      style={dropdownItemStyle}
                      onClick={() => selectProductForItem(idx, p.id)}
                    >
                      {p.name} — {formatCurrency(p.price, currency)}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
              style={{ ...formInputStyle, padding: '6px 4px', fontSize: 13, textAlign: 'center' }}
            />
            <input
              type="number"
              min={0}
              value={item.unit_price}
              onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
              style={{ ...formInputStyle, padding: '6px 4px', fontSize: 13, textAlign: 'right' }}
            />
            {!isMobile && (
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right', paddingRight: 4 }}>
                {formatCurrency(item.quantity * item.unit_price, currency)}
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemoveLine(idx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.danger }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {/* Add line button */}
        <div style={{ padding: '8px 10px', borderTop: `1px solid ${C.border}` }}>
          <button
            type="button"
            onClick={handleAddLine}
            style={{ background: 'none', border: 'none', color: C.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {label.addLine}
          </button>
        </div>
      </div>
      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginTop: 10, fontSize: 13 }}>
        <span>{label.laborTotal}: <strong>{formatCurrency(totals.laborTotal, currency)}</strong></span>
        <span>{label.partsTotal}: <strong>{formatCurrency(totals.partsTotal, currency)}</strong></span>
        <span style={{ color: C.primary, fontWeight: 700, fontSize: 15 }}>
          {label.estimatedTotal}: {formatCurrency(totals.estimatedTotal, currency)}
        </span>
      </div>
    </div>
  )

  // ── Render: Status progression bar (detail modal) ────────────────────
  const renderStatusBar = (wo: WorkOrder) => {
    const currentIdx = PIPELINE_STATUSES.indexOf(wo.status)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20, overflowX: 'auto' }}>
        {PIPELINE_STATUSES.map((s, idx) => {
          const isDone = idx <= currentIdx
          const isCurrent = idx === currentIdx
          const cfg = STATUS_CONFIG[s]
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: isCurrent ? 700 : 500,
                backgroundColor: isDone ? cfg.color : '#f1f5f9',
                color: isDone ? '#fff' : C.textSecondary,
                whiteSpace: 'nowrap',
                border: isCurrent ? `2px solid ${cfg.color}` : 'none',
              }}>
                {statusLabels[s]}
              </div>
              {idx < PIPELINE_STATUSES.length - 1 && (
                <ChevronRight size={14} style={{ color: isDone ? cfg.color : C.border, margin: '0 2px', flexShrink: 0 }} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Render: Detail modal content ────────────────────────────────────
  const renderDetailContent = () => {
    if (!selectedWO) return null
    const wo = selectedWO
    const nextAction = NEXT_STATUS[wo.status]
    const prio = PRIORITY_CONFIG[wo.priority]

    return (
      <div>
        {renderStatusBar(wo)}

        {/* Info section */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>{label.customer}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{wo.customer_name || '-'}</div>
            {wo.customer_phone && (
              <div style={{ fontSize: 13, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Phone size={12} /> {wo.customer_phone}
              </div>
            )}
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>{label.itemDescription}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{wo.item_description}</div>
            {wo.item_identifier && (
              <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>{wo.item_identifier}</div>
            )}
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 14 }}>{prio.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: prio.color }}>{prio.label}</span>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        {wo.diagnosis && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>{label.diagnosis}</div>
            <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              {wo.diagnosis}
            </div>
          </div>
        )}

        {/* Line items table */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>{label.lineItems}</div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 50px 70px' : '80px 1fr 60px 90px 90px',
              padding: '8px 10px',
              backgroundColor: '#f8fafc',
              fontSize: 11,
              fontWeight: 600,
              color: C.textSecondary,
              textTransform: 'uppercase',
            }}>
              {!isMobile && <span>{label.type}</span>}
              <span>{label.description}</span>
              <span>{label.qty}</span>
              {!isMobile && <span>{label.unitPrice}</span>}
              <span style={{ textAlign: 'right' }}>{label.total}</span>
            </div>
            {wo.items.map((item, idx) => (
              <div key={idx} style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 50px 70px' : '80px 1fr 60px 90px 90px',
                padding: '8px 10px',
                borderTop: `1px solid ${C.border}`,
                fontSize: 13,
              }}>
                {!isMobile && (
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: item.type === 'labor' ? '#3b82f6' : item.type === 'part' ? '#f59e0b' : '#8b5cf6',
                  }}>
                    {item.type === 'labor' ? label.labor : item.type === 'part' ? label.part : label.service}
                  </span>
                )}
                <span style={{ color: C.text }}>{item.description}</span>
                <span style={{ color: C.textSecondary, textAlign: 'center' }}>{item.quantity}</span>
                {!isMobile && <span style={{ color: C.textSecondary }}>{formatCurrency(item.unit_price, currency)}</span>}
                <span style={{ fontWeight: 600, color: C.text, textAlign: 'right' }}>{formatCurrency(item.total, currency)}</span>
              </div>
            ))}
          </div>
          {/* Totals summary */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginTop: 10, fontSize: 13 }}>
            <span>{label.laborTotal}: <strong>{formatCurrency(wo.labor_total, currency)}</strong></span>
            <span>{label.partsTotal}: <strong>{formatCurrency(wo.parts_total, currency)}</strong></span>
            <span style={{ fontSize: 17, fontWeight: 700, color: C.primary, marginTop: 4 }}>
              {label.estimatedTotal}: {formatCurrency(wo.estimated_total, currency)}
            </span>
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: C.textSecondary, marginBottom: 16 }}>
          <span><Calendar size={12} style={{ marginRight: 4 }} /> {label.statusReceived}: {formatDate(wo.received_at)}</span>
          {wo.estimated_completion && <span><Calendar size={12} style={{ marginRight: 4 }} /> Est: {formatDate(wo.estimated_completion)}</span>}
          {wo.completed_at && <span>{label.completed}: {formatDate(wo.completed_at)}</span>}
          {wo.delivered_at && <span>{label.delivered}: {formatDate(wo.delivered_at)}</span>}
        </div>

        {/* Notes */}
        {wo.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>{label.notes}</div>
            <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 13, color: C.text }}>
              {wo.notes}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          {nextAction && wo.status !== 'cancelled' && (
            <button
              style={actionBtnStyle(STATUS_CONFIG[nextAction.next].color)}
              onClick={() => handleStatusChange(wo, nextAction.next)}
            >
              {nextAction.label}
            </button>
          )}
          {wo.status === 'completed' && (
            <button style={actionBtnStyle('#3b82f6')} onClick={() => void 0}>
              <FileText size={14} style={{ marginRight: 4 }} />
              {label.generateInvoice}
            </button>
          )}
          {wo.status !== 'cancelled' && wo.status !== 'delivered' && (
            <button
              style={actionBtnStyle(C.danger)}
              onClick={() => handleStatusChange(wo, 'cancelled')}
            >
              <X size={14} style={{ marginRight: 4 }} />
              {label.cancelled}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Suppress unused var warnings for items used in conditional rendering
  void handleUpdateDetailItems
  void generateUUID

  // ── Main render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <Wrench size={rv(22, 26, 28)} />
            {label.title}
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={statBadgeStyle}>{activeCount} {label.active}</span>
            <span style={statBadgeStyle}>{pendingDiagCount} {label.pendingDiag}</span>
            <span style={statBadgeStyle}>{readyDeliveryCount} {label.readyDelivery}</span>
          </div>
        </div>
        <button style={addBtnStyle} onClick={openAddModal}>
          <Plus size={16} />
          {label.addWorkOrder}
        </button>
      </div>

      {/* Pipeline */}
      {renderPipeline()}

      {/* Search */}
      <div style={searchContainerStyle}>
        <Search size={18} style={searchIconStyle} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={label.searchPlaceholder}
          style={searchInputStyle}
        />
      </div>

      {/* Cards */}
      {filteredWOs.length === 0 ? renderEmpty() : (
        <div>{filteredWOs.map(renderCard)}</div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={label.addWorkOrder}
        size="lg"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        {/* Customer search */}
        <div style={{ ...formFieldStyle, position: 'relative' }}>
          <label style={formLabelStyle}>{label.customer}</label>
          <input
            value={form.customer_name || customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value)
              setForm((prev) => ({ ...prev, customer_name: e.target.value, customer_id: '' }))
              setShowCustomerDropdown(true)
            }}
            onFocus={() => setShowCustomerDropdown(true)}
            placeholder={label.searchCustomer}
            style={formInputStyle}
          />
          {showCustomerDropdown && filteredCustomers.length > 0 && (
            <div style={dropdownStyle}>
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  style={dropdownItemStyle}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      customer_id: c.id,
                      customer_name: c.name,
                      customer_phone: c.phone || '',
                    }))
                    setCustomerSearch('')
                    setShowCustomerDropdown(false)
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  {c.phone && <span style={{ color: C.textSecondary, marginLeft: 8 }}>{c.phone}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Item description */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.itemDescription} *</label>
          <input
            value={form.item_description}
            onChange={(e) => setForm((prev) => ({ ...prev, item_description: e.target.value }))}
            placeholder={getItemPlaceholder()}
            style={formInputStyle}
          />
        </div>

        {/* Item identifier */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.itemIdentifier}</label>
          <input
            value={form.item_identifier}
            onChange={(e) => setForm((prev) => ({ ...prev, item_identifier: e.target.value }))}
            placeholder={getIdPlaceholder()}
            style={formInputStyle}
          />
        </div>

        {/* Priority */}
        {renderPrioritySelector()}

        {/* Diagnosis */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.diagnosis}</label>
          <textarea
            value={form.diagnosis}
            onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
            style={formTextareaStyle}
          />
        </div>

        {/* Line items */}
        {renderLineItems()}

        {/* Estimated completion */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.estCompletion}</label>
          <input
            type="date"
            value={form.estimated_completion}
            onChange={(e) => setForm((prev) => ({ ...prev, estimated_completion: e.target.value }))}
            style={formInputStyle}
          />
        </div>

        {/* Notes */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.notes}</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            style={formTextareaStyle}
          />
        </div>

        {/* Buttons */}
        <div style={btnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowAddModal(false)}>{label.cancel}</button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : label.save}
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedWO(null) }}
        title={selectedWO ? `${selectedWO.order_number} — ${label.orderDetail}` : label.orderDetail}
        size="lg"
      >
        {renderDetailContent()}
      </Modal>
    </div>
  )
}
