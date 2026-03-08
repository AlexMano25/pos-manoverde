import React, { useState, useEffect, useMemo } from 'react'
import { useReturnStore } from '../stores/returnStore'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import Modal from '../components/common/Modal'
import {
  RotateCcw,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  Search,
  AlertTriangle,
  ArrowLeftRight,
  CreditCard,
  Banknote,
  Gift,
  ShoppingBag,
  Clock,
  FileText,
} from 'lucide-react'
import type {
  PosReturn,
  ReturnStatus,
  ReturnReason,
  RefundMethod,
  ReturnItem,
} from '../types'

// ── Color palette ──────────────────────────────────────────────────────────

const C = {
  primary: '#ef4444',
  primaryLight: '#fef2f2',
  primaryDark: '#dc2626',
  primaryHover: '#f87171',
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
  indigo: '#6366f1',
  indigoBg: '#eef2ff',
  amber: '#f59e0b',
  amberBg: '#fffbeb',
} as const

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReturnStatus, { color: string; bg: string; label: string }> = {
  pending:   { color: '#f59e0b', bg: '#fffbeb', label: 'Pending' },
  approved:  { color: '#2563eb', bg: '#eff6ff', label: 'Approved' },
  rejected:  { color: '#dc2626', bg: '#fef2f2', label: 'Rejected' },
  processed: { color: '#6366f1', bg: '#eef2ff', label: 'Processed' },
  refunded:  { color: '#16a34a', bg: '#f0fdf4', label: 'Refunded' },
}

const ALL_STATUSES: ReturnStatus[] = ['pending', 'approved', 'rejected', 'processed', 'refunded']

// ── Reason config ──────────────────────────────────────────────────────────

const REASON_CONFIG: Record<ReturnReason, { label: string; icon: typeof AlertTriangle }> = {
  defective:     { label: 'Defective', icon: AlertTriangle },
  wrong_item:    { label: 'Wrong Item', icon: ArrowLeftRight },
  not_satisfied: { label: 'Not Satisfied', icon: XCircle },
  expired:       { label: 'Expired', icon: Clock },
  damaged:       { label: 'Damaged', icon: Package },
  duplicate:     { label: 'Duplicate', icon: FileText },
  other:         { label: 'Other', icon: RotateCcw },
}

const ALL_REASONS: ReturnReason[] = ['defective', 'wrong_item', 'not_satisfied', 'expired', 'damaged', 'duplicate', 'other']

// ── Refund method config ───────────────────────────────────────────────────

const REFUND_METHOD_CONFIG: Record<RefundMethod, { label: string; icon: typeof CreditCard }> = {
  original_payment: { label: 'Original Payment', icon: CreditCard },
  cash:             { label: 'Cash', icon: Banknote },
  store_credit:     { label: 'Store Credit', icon: DollarSign },
  gift_card:        { label: 'Gift Card', icon: Gift },
  exchange:         { label: 'Exchange', icon: ArrowLeftRight },
}

const ALL_REFUND_METHODS: RefundMethod[] = ['original_payment', 'cash', 'store_credit', 'gift_card', 'exchange']

// ── Condition config ───────────────────────────────────────────────────────

const CONDITION_OPTIONS: { value: ReturnItem['condition']; label: string }[] = [
  { value: 'new', label: 'New / Unopened' },
  { value: 'used', label: 'Used' },
  { value: 'damaged', label: 'Damaged' },
]

// ── Component ──────────────────────────────────────────────────────────────

export default function ReturnsPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()

  const {
    returns,
    loading,
    filterStatus,
    filterReason,
    loadReturns,
    addReturn,
    updateReturn,
    deleteReturn,
    approveReturn,
    rejectReturn,
    processReturn,
    issueRefund,
    getMonthlyTotal,
    setFilterStatus,
    setFilterReason,
  } = useReturnStore()

  const storeId = currentStore?.id || user?.store_id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''
  const taxRate = currentStore?.tax_rate || 0

  // ── i18n ───────────────────────────────────────────────────────────────

  const rt = (t as any).returns || {}
  const tCommon = (t as any).common || {}

  const L = {
    title: rt.title || 'Returns & Refunds',
    newReturn: rt.newReturn || 'New Return',
    editReturn: rt.editReturn || 'Edit Return',
    viewReturn: rt.viewReturn || 'Return Details',
    totalReturns: rt.totalReturns || 'Total Returns',
    pendingReturns: rt.pendingReturns || 'Pending Returns',
    refundedMonth: rt.refundedMonth || 'Refunded This Month',
    returnRate: rt.returnRate || 'Return Rate',
    returnNumber: rt.returnNumber || 'Return #',
    orderRef: rt.orderRef || 'Order Ref',
    customer: rt.customer || 'Customer',
    itemsCount: rt.itemsCount || 'Items',
    totalRefund: rt.totalRefund || 'Total Refund',
    status: rt.status || 'Status',
    refundMethod: rt.refundMethod || 'Refund Method',
    date: rt.date || 'Date',
    actions: rt.actions || 'Actions',
    reason: rt.reason || 'Reason',
    reasonNotes: rt.reasonNotes || 'Notes',
    orderReference: rt.orderReference || 'Order Reference',
    customerName: rt.customerName || 'Customer Name',
    product: rt.product || 'Product',
    quantity: rt.quantity || 'Qty',
    unitPrice: rt.unitPrice || 'Unit Price',
    condition: rt.condition || 'Condition',
    restock: rt.restock || 'Restock',
    total: rt.total || 'Total',
    addItem: rt.addItem || 'Add Item',
    subtotal: rt.subtotal || 'Subtotal',
    taxRefund: rt.taxRefund || 'Tax Refund',
    noReturns: rt.noReturns || 'No returns yet',
    noReturnsDesc: rt.noReturnsDesc || 'Returns will appear here when customers bring items back.',
    noResults: rt.noResults || 'No returns match your filters',
    noResultsDesc: rt.noResultsDesc || 'Try adjusting the filters or search query.',
    approve: rt.approve || 'Approve',
    reject: rt.reject || 'Reject',
    process: rt.process || 'Process',
    issueRefund: rt.issueRefund || 'Issue Refund',
    delete: rt.delete || 'Delete',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    allStatuses: rt.allStatuses || 'All Statuses',
    allReasons: rt.allReasons || 'All Reasons',
    deleteConfirm: rt.deleteConfirm || 'Are you sure you want to delete this return?',
    timeline: rt.timeline || 'Timeline',
    createdAt: rt.createdAt || 'Created',
    approvedAt: rt.approvedAt || 'Approved',
    processedAt: rt.processedAt || 'Processed',
    refundedAt: rt.refundedAt || 'Refunded',
    approvedBy: rt.approvedBy || 'Approved By',
    processedBy: rt.processedBy || 'Processed By',
    itemDetails: rt.itemDetails || 'Return Items',
    walkIn: rt.walkIn || 'Walk-in',
  }

  const statusLabel = (s: ReturnStatus): string =>
    (rt as any)?.[`st_${s}`] || STATUS_CONFIG[s]?.label || s
  const reasonLabel = (r: ReturnReason): string =>
    (rt as any)?.[`rs_${r}`] || REASON_CONFIG[r]?.label || r
  const methodLabel = (m: RefundMethod): string =>
    (rt as any)?.[`rm_${m}`] || REFUND_METHOD_CONFIG[m]?.label || m

  // ── Local state ────────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingReturn, setEditingReturn] = useState<PosReturn | null>(null)
  const [viewingReturn, setViewingReturn] = useState<PosReturn | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state
  const [formOrderId, setFormOrderId] = useState('')
  const [formOrderNumber, setFormOrderNumber] = useState('')
  const [formCustomerName, setFormCustomerName] = useState('')
  const [formCustomerId, setFormCustomerId] = useState('')
  const [formRefundMethod, setFormRefundMethod] = useState<RefundMethod>('original_payment')
  const [formReasonNotes, setFormReasonNotes] = useState('')
  const [formItems, setFormItems] = useState<ReturnItem[]>([])
  const [formSaving, setFormSaving] = useState(false)

  // ── Load data on mount ─────────────────────────────────────────────────

  useEffect(() => {
    loadReturns(storeId)
  }, [storeId, loadReturns])

  // ── Filtered and searched returns ──────────────────────────────────────

  const filteredReturns = useMemo(() => {
    let result = [...returns]

    if (filterStatus !== 'all') {
      result = result.filter((r) => r.status === filterStatus)
    }
    if (filterReason !== 'all') {
      result = result.filter((r) =>
        r.items.some((item) => item.reason === filterReason)
      )
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.return_number.toLowerCase().includes(q) ||
          (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
          (r.order_number && r.order_number.toLowerCase().includes(q)) ||
          r.order_id.toLowerCase().includes(q)
      )
    }
    return result
  }, [returns, filterStatus, filterReason, searchQuery])

  // ── Stats ──────────────────────────────────────────────────────────────

  const totalReturnsCount = returns.length
  const pendingCount = useMemo(
    () => returns.filter((r) => r.status === 'pending').length,
    [returns]
  )
  const monthlyTotal = getMonthlyTotal(storeId)

  const returnRatePercent = useMemo(() => {
    // Simplified: pending + processed + refunded as fraction of total
    if (totalReturnsCount === 0) return '0'
    const active = returns.filter((r) => r.status !== 'rejected').length
    return ((active / Math.max(totalReturnsCount, 1)) * 100).toFixed(1)
  }, [returns, totalReturnsCount])

  // ── Form helpers ───────────────────────────────────────────────────────

  function resetForm() {
    setFormOrderId('')
    setFormOrderNumber('')
    setFormCustomerName('')
    setFormCustomerId('')
    setFormRefundMethod('original_payment')
    setFormReasonNotes('')
    setFormItems([])
    setEditingReturn(null)
  }

  function openAddModal() {
    resetForm()
    // Start with one blank item
    setFormItems([
      {
        product_id: '',
        product_name: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
        reason: 'defective',
        condition: 'used',
        restock: true,
      },
    ])
    setShowModal(true)
  }

  function openEditModal(ret: PosReturn) {
    setEditingReturn(ret)
    setFormOrderId(ret.order_id)
    setFormOrderNumber(ret.order_number || '')
    setFormCustomerName(ret.customer_name || '')
    setFormCustomerId(ret.customer_id || '')
    setFormRefundMethod(ret.refund_method)
    setFormReasonNotes(ret.reason_notes || '')
    setFormItems([...ret.items])
    setShowModal(true)
  }

  function openViewModal(ret: PosReturn) {
    setViewingReturn(ret)
    setShowViewModal(true)
  }

  function addFormItem() {
    setFormItems((prev) => [
      ...prev,
      {
        product_id: '',
        product_name: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
        reason: 'defective',
        condition: 'used',
        restock: true,
      },
    ])
  }

  function updateFormItem(index: number, updates: Partial<ReturnItem>) {
    setFormItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const merged = { ...item, ...updates }
        merged.total = merged.quantity * merged.unit_price
        return merged
      })
    )
  }

  function removeFormItem(index: number) {
    setFormItems((prev) => prev.filter((_, i) => i !== index))
  }

  const formSubtotal = useMemo(
    () => formItems.reduce((sum, item) => sum + item.total, 0),
    [formItems]
  )

  const formTaxRefund = useMemo(
    () => (taxRate > 0 ? formSubtotal * (taxRate / 100) : 0),
    [formSubtotal, taxRate]
  )

  const formTotalRefund = formSubtotal + formTaxRefund

  async function handleSave() {
    if (!formOrderId.trim() || formItems.length === 0) return

    // Validate that all items have product names
    const validItems = formItems.filter((item) => item.product_name.trim())
    if (validItems.length === 0) return

    setFormSaving(true)
    try {
      const data = {
        order_id: formOrderId.trim(),
        order_number: formOrderNumber.trim() || undefined,
        customer_id: formCustomerId.trim() || undefined,
        customer_name: formCustomerName.trim() || undefined,
        items: validItems,
        subtotal: formSubtotal,
        tax_refund: formTaxRefund,
        total_refund: formTotalRefund,
        refund_method: formRefundMethod,
        status: 'pending' as ReturnStatus,
        reason_notes: formReasonNotes.trim() || undefined,
      }

      if (editingReturn) {
        await updateReturn(editingReturn.id, data)
      } else {
        await addReturn(storeId, data)
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[ReturnsPage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReturn(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[ReturnsPage] Delete error:', error)
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveReturn(id, userId, userName)
    } catch (error) {
      console.error('[ReturnsPage] Approve error:', error)
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectReturn(id)
    } catch (error) {
      console.error('[ReturnsPage] Reject error:', error)
    }
  }

  async function handleProcess(id: string) {
    try {
      await processReturn(id, userId, userName)
    } catch (error) {
      console.error('[ReturnsPage] Process error:', error)
    }
  }

  async function handleIssueRefund(id: string) {
    try {
      await issueRefund(id)
    } catch (error) {
      console.error('[ReturnsPage] Issue refund error:', error)
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

  // ── Styles ─────────────────────────────────────────────────────────────

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
      flexDirection: isMobile ? 'column' as const : 'row' as const,
      gap: 12,
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    titleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    } as React.CSSProperties,

    titleIcon: {
      width: rv(36, 40, 44),
      height: rv(36, 40, 44),
      borderRadius: 12,
      backgroundColor: C.primaryLight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: C.primary,
    } as React.CSSProperties,

    title: {
      margin: 0,
      fontSize: rv(20, 24, 28),
      fontWeight: 700,
      color: C.text,
    } as React.CSSProperties,

    addBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      borderRadius: 10,
      border: 'none',
      backgroundColor: C.primary,
      color: '#fff',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background-color 0.15s, transform 0.1s',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    statsRow: {
      display: 'grid',
      gridTemplateColumns: rv('1fr 1fr', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
      gap: rv(10, 14, 16),
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    statCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      padding: rv(14, 16, 20),
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: `1px solid ${C.border}`,
    } as React.CSSProperties,

    filterBar: {
      display: 'flex',
      flexDirection: isMobile ? 'column' as const : 'row' as const,
      gap: 10,
      marginBottom: rv(16, 20, 24),
      alignItems: isMobile ? 'stretch' : 'center',
    } as React.CSSProperties,

    select: {
      padding: '9px 32px 9px 12px',
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      backgroundColor: C.card,
      fontSize: 13,
      color: C.text,
      appearance: 'none' as const,
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 10px center',
      cursor: 'pointer',
      minWidth: 140,
    } as React.CSSProperties,

    searchInput: {
      flex: 1,
      padding: '9px 12px 9px 36px',
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      backgroundColor: C.card,
      fontSize: 13,
      color: C.text,
      outline: 'none',
      minWidth: 200,
    } as React.CSSProperties,

    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      backgroundColor: C.card,
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: `1px solid ${C.border}`,
    } as React.CSSProperties,

    th: {
      padding: '12px 14px',
      textAlign: 'left' as const,
      fontSize: 12,
      fontWeight: 600,
      color: C.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      borderBottom: `1px solid ${C.border}`,
      backgroundColor: '#f8fafc',
    } as React.CSSProperties,

    td: {
      padding: '12px 14px',
      fontSize: 13,
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
        fontSize: 11,
        fontWeight: 600,
        color,
        backgroundColor: bg,
        whiteSpace: 'nowrap' as const,
      } as React.CSSProperties),

    mobileCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: `1px solid ${C.border}`,
    } as React.CSSProperties,

    actionBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
      borderRadius: 8,
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      transition: 'background-color 0.15s',
    } as React.CSSProperties,

    emptyState: {
      textAlign: 'center' as const,
      padding: rv(40, 60, 80),
      backgroundColor: C.card,
      borderRadius: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      border: `1px solid ${C.border}`,
    } as React.CSSProperties,

    formGroup: {
      marginBottom: 16,
    } as React.CSSProperties,

    label: {
      display: 'block',
      marginBottom: 6,
      fontSize: 13,
      fontWeight: 600,
      color: C.text,
    } as React.CSSProperties,

    input: {
      width: '100%',
      padding: '9px 12px',
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      fontSize: 13,
      color: C.text,
      outline: 'none',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    textarea: {
      width: '100%',
      padding: '9px 12px',
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      fontSize: 13,
      color: C.text,
      outline: 'none',
      resize: 'vertical' as const,
      minHeight: 72,
      boxSizing: 'border-box' as const,
      fontFamily: 'inherit',
    } as React.CSSProperties,
  }

  // ── Helper to render status actions ────────────────────────────────────

  function renderActions(ret: PosReturn) {
    const actions: React.ReactElement[] = []

    // View
    actions.push(
      <button
        key="view"
        title="View"
        style={{ ...s.actionBtn, color: C.info }}
        onClick={() => openViewModal(ret)}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.infoBg)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Eye size={16} />
      </button>
    )

    // Status-dependent actions
    if (ret.status === 'pending') {
      actions.push(
        <button
          key="approve"
          title={L.approve}
          style={{ ...s.actionBtn, color: C.success }}
          onClick={() => handleApprove(ret.id)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.successBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <CheckCircle size={16} />
        </button>,
        <button
          key="reject"
          title={L.reject}
          style={{ ...s.actionBtn, color: C.danger }}
          onClick={() => handleReject(ret.id)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.dangerBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <XCircle size={16} />
        </button>,
        <button
          key="edit"
          title="Edit"
          style={{ ...s.actionBtn, color: C.textSecondary }}
          onClick={() => openEditModal(ret)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Edit3 size={16} />
        </button>
      )
    }

    if (ret.status === 'approved') {
      actions.push(
        <button
          key="process"
          title={L.process}
          style={{ ...s.actionBtn, color: C.indigo }}
          onClick={() => handleProcess(ret.id)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.indigoBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Package size={16} />
        </button>
      )
    }

    if (ret.status === 'processed') {
      actions.push(
        <button
          key="refund"
          title={L.issueRefund}
          style={{ ...s.actionBtn, color: C.success }}
          onClick={() => handleIssueRefund(ret.id)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.successBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <DollarSign size={16} />
        </button>
      )
    }

    // Delete (only if pending or rejected)
    if (ret.status === 'pending' || ret.status === 'rejected') {
      actions.push(
        <button
          key="delete"
          title={L.delete}
          style={{ ...s.actionBtn, color: '#94a3b8' }}
          onClick={() => setDeleteTarget(ret.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = C.dangerBg
            e.currentTarget.style.color = C.danger
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#94a3b8'
          }}
        >
          <Trash2 size={16} />
        </button>
      )
    }

    return <div style={{ display: 'flex', gap: 2 }}>{actions}</div>
  }

  // ── Render: Refund method icon ─────────────────────────────────────────

  function RefundMethodIcon({ method }: { method: RefundMethod }) {
    const Icon = REFUND_METHOD_CONFIG[method]?.icon || CreditCard
    return <Icon size={14} />
  }

  // ── Render: Status badge ───────────────────────────────────────────────

  function StatusBadge({ status }: { status: ReturnStatus }) {
    const cfg = STATUS_CONFIG[status]
    return (
      <span style={s.badge(cfg.color, cfg.bg)}>
        {statusLabel(status)}
      </span>
    )
  }

  // ── Render: Reason badge ───────────────────────────────────────────────

  function ReasonBadge({ reason }: { reason: ReturnReason }) {
    const cfg = REASON_CONFIG[reason]
    const Icon = cfg.icon
    return (
      <span style={s.badge(C.textSecondary, '#f1f5f9')}>
        <Icon size={12} />
        {reasonLabel(reason)}
      </span>
    )
  }

  // ── Render: Timeline ───────────────────────────────────────────────────

  function renderTimeline(ret: PosReturn) {
    const steps: { key: string; label: string; done: boolean; time?: string; by?: string }[] = [
      {
        key: 'created',
        label: L.createdAt,
        done: true,
        time: ret.created_at,
      },
      {
        key: 'approved',
        label: L.approvedAt,
        done: ['approved', 'processed', 'refunded'].includes(ret.status),
        time: ret.approved_by ? ret.updated_at : undefined,
        by: ret.approved_by_name,
      },
      {
        key: 'processed',
        label: L.processedAt,
        done: ['processed', 'refunded'].includes(ret.status),
        time: ret.processed_by ? ret.updated_at : undefined,
        by: ret.processed_by_name,
      },
      {
        key: 'refunded',
        label: L.refundedAt,
        done: ret.status === 'refunded',
        time: ret.status === 'refunded' ? ret.updated_at : undefined,
      },
    ]

    // If rejected, show a different timeline
    if (ret.status === 'rejected') {
      steps.splice(1, 3, {
        key: 'rejected',
        label: 'Rejected',
        done: true,
        time: ret.updated_at,
      })
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 12 }}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1
          const stepColor = step.done
            ? ret.status === 'rejected' && step.key === 'rejected'
              ? C.danger
              : C.primary
            : C.textMuted

          return (
            <div key={step.key} style={{ display: 'flex', gap: 12 }}>
              {/* Line + circle */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 24,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: step.done ? stepColor : 'transparent',
                    border: `2px solid ${stepColor}`,
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 24,
                      backgroundColor: step.done ? stepColor : C.border,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: step.done ? C.text : C.textMuted,
                  }}
                >
                  {step.label}
                </div>
                {step.time && (
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                    {formatDateTime(step.time)}
                  </div>
                )}
                {step.by && (
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 1 }}>
                    {step.by}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── RENDER ─────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={s.titleRow}>
          <div style={s.titleIcon}>
            <RotateCcw size={rv(20, 22, 24)} />
          </div>
          <h1 style={s.title}>{L.title}</h1>
        </div>
        <button
          style={s.addBtn}
          onClick={openAddModal}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryDark)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
        >
          <Plus size={18} />
          {L.newReturn}
        </button>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <div style={s.statsRow}>
        {/* Total Returns */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: C.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.primary,
              }}
            >
              <RotateCcw size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>
                {L.totalReturns}
              </div>
              <div style={{ fontSize: rv(20, 22, 26), fontWeight: 700, color: C.text }}>
                {totalReturnsCount}
              </div>
            </div>
          </div>
        </div>

        {/* Pending */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: C.amberBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.amber,
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>
                {L.pendingReturns}
              </div>
              <div style={{ fontSize: rv(20, 22, 26), fontWeight: 700, color: C.text }}>
                {pendingCount}
              </div>
            </div>
          </div>
        </div>

        {/* Refunded This Month */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: C.successBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.success,
              }}
            >
              <DollarSign size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>
                {L.refundedMonth}
              </div>
              <div style={{ fontSize: rv(16, 18, 22), fontWeight: 700, color: C.text }}>
                {formatCurrency(monthlyTotal, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Return Rate */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: C.indigoBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.indigo,
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>
                {L.returnRate}
              </div>
              <div style={{ fontSize: rv(20, 22, 26), fontWeight: 700, color: C.text }}>
                {returnRatePercent}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div style={s.filterBar}>
        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ReturnStatus | 'all')}
          style={s.select}
        >
          <option value="all">{L.allStatuses}</option>
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>
              {statusLabel(st)}
            </option>
          ))}
        </select>

        {/* Reason filter */}
        <select
          value={filterReason}
          onChange={(e) => setFilterReason(e.target.value as ReturnReason | 'all')}
          style={s.select}
        >
          <option value="all">{L.allReasons}</option>
          {ALL_REASONS.map((r) => (
            <option key={r} value={r}>
              {reasonLabel(r)}
            </option>
          ))}
        </select>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: C.textMuted,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder={`${L.search}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={s.searchInput}
          />
        </div>
      </div>

      {/* ── Returns List ────────────────────────────────────────────────── */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: C.textSecondary,
            fontSize: 14,
          }}
        >
          Loading...
        </div>
      ) : filteredReturns.length === 0 ? (
        <div style={s.emptyState}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: C.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: C.primary,
            }}
          >
            <RotateCcw size={28} />
          </div>
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: 18,
              fontWeight: 600,
              color: C.text,
            }}
          >
            {returns.length === 0 ? L.noReturns : L.noResults}
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: C.textSecondary }}>
            {returns.length === 0 ? L.noReturnsDesc : L.noResultsDesc}
          </p>
        </div>
      ) : isMobile ? (
        /* ── Mobile: Card layout ────────────────────────────────────────── */
        <div>
          {filteredReturns.map((ret) => {
            const primaryReason = ret.items[0]?.reason || 'other'
            return (
              <div key={ret.id} style={s.mobileCard}>
                {/* Top row: Return # + Status */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>
                    {ret.return_number}
                  </span>
                  <StatusBadge status={ret.status} />
                </div>

                {/* Order ref + Customer */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: C.textSecondary }}>
                    {L.orderRef}: {ret.order_number || `#${ret.order_id.slice(0, 8).toUpperCase()}`}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginTop: 2 }}>
                    {ret.customer_name || L.walkIn}
                  </div>
                </div>

                {/* Reason + Items */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginBottom: 8,
                  }}
                >
                  <ReasonBadge reason={primaryReason} />
                  <span style={{ fontSize: 12, color: C.textSecondary }}>
                    {ret.items.length} {L.itemsCount.toLowerCase()}
                  </span>
                </div>

                {/* Bottom: Amount + Date + Method + Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 10,
                    borderTop: `1px solid ${C.border}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                      {formatCurrency(ret.total_refund, currency)}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                      {formatDate(ret.created_at)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: C.textSecondary,
                      }}
                    >
                      <RefundMethodIcon method={ret.refund_method} />
                      {methodLabel(ret.refund_method)}
                    </span>
                  </div>
                </div>

                {/* Actions row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: 8,
                    gap: 2,
                  }}
                >
                  {renderActions(ret)}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Desktop: Table layout ──────────────────────────────────────── */
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>{L.returnNumber}</th>
                <th style={s.th}>{L.orderRef}</th>
                <th style={s.th}>{L.customer}</th>
                <th style={s.th}>{L.itemsCount}</th>
                <th style={s.th}>{L.totalRefund}</th>
                <th style={s.th}>{L.status}</th>
                <th style={s.th}>{L.refundMethod}</th>
                <th style={s.th}>{L.date}</th>
                <th style={{ ...s.th, textAlign: 'right' }}>{L.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((ret) => (
                <tr
                  key={ret.id}
                  style={{ transition: 'background-color 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={s.td}>
                    <span style={{ fontWeight: 600, color: C.primary }}>
                      {ret.return_number}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 12, color: C.textSecondary }}>
                      {ret.order_number || `#${ret.order_id.slice(0, 8).toUpperCase()}`}
                    </span>
                  </td>
                  <td style={s.td}>
                    {ret.customer_name || (
                      <span style={{ color: C.textMuted, fontStyle: 'italic' }}>{L.walkIn}</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: C.primaryLight,
                        color: C.primary,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {ret.items.length}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontWeight: 600 }}>
                      {formatCurrency(ret.total_refund, currency)}
                    </span>
                  </td>
                  <td style={s.td}>
                    <StatusBadge status={ret.status} />
                  </td>
                  <td style={s.td}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        color: C.textSecondary,
                      }}
                    >
                      <RefundMethodIcon method={ret.refund_method} />
                      {methodLabel(ret.refund_method)}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 12, color: C.textSecondary }}>
                      {formatDate(ret.created_at)}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>{renderActions(ret)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={L.delete}
        size="sm"
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
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
              color: C.danger,
            }}
          >
            <Trash2 size={24} />
          </div>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: C.textSecondary }}>
            {L.deleteConfirm}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => setDeleteTarget(null)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.text,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {L.cancel}
            </button>
            <button
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: C.danger,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Add/Edit Return Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingReturn ? L.editReturn : L.newReturn}
        size="lg"
      >
        <div>
          {/* Order Reference + Customer */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={s.label}>{L.orderReference} *</label>
              <input
                type="text"
                value={formOrderId}
                onChange={(e) => setFormOrderId(e.target.value)}
                placeholder="Order ID or reference..."
                style={s.input}
              />
              {formOrderNumber && (
                <div style={{ marginTop: 4, fontSize: 11, color: C.textSecondary }}>
                  {L.orderRef}: {formOrderNumber}
                </div>
              )}
            </div>
            <div>
              <label style={s.label}>{L.customerName}</label>
              <input
                type="text"
                value={formCustomerName}
                onChange={(e) => setFormCustomerName(e.target.value)}
                placeholder={L.walkIn}
                style={s.input}
              />
            </div>
          </div>

          {/* Return Items */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <label style={{ ...s.label, marginBottom: 0 }}>{L.itemDetails}</label>
              <button
                onClick={addFormItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: `1px solid ${C.primary}`,
                  backgroundColor: 'transparent',
                  color: C.primary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryLight)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Plus size={14} />
                {L.addItem}
              </button>
            </div>

            {/* Items */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                overflow: 'hidden',
              }}
            >
              {formItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    borderBottom: idx < formItems.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  {/* Row 1: Product name + Remove */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <input
                      type="text"
                      placeholder={`${L.product} *`}
                      value={item.product_name}
                      onChange={(e) =>
                        updateFormItem(idx, { product_name: e.target.value })
                      }
                      style={{ ...s.input, flex: 1, backgroundColor: '#fff' }}
                    />
                    {formItems.length > 1 && (
                      <button
                        onClick={() => removeFormItem(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: C.dangerBg,
                          color: C.danger,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Row 2: Qty, Unit Price, Reason, Condition */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile
                        ? '1fr 1fr'
                        : '80px 120px 1fr 1fr',
                      gap: 8,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11,
                          color: C.textSecondary,
                          marginBottom: 3,
                        }}
                      >
                        {L.quantity}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateFormItem(idx, {
                            quantity: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        style={{ ...s.input, backgroundColor: '#fff', textAlign: 'center' }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11,
                          color: C.textSecondary,
                          marginBottom: 3,
                        }}
                      >
                        {L.unitPrice}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unit_price || ''}
                        onChange={(e) =>
                          updateFormItem(idx, {
                            unit_price: parseFloat(e.target.value) || 0,
                          })
                        }
                        style={{ ...s.input, backgroundColor: '#fff' }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11,
                          color: C.textSecondary,
                          marginBottom: 3,
                        }}
                      >
                        {L.reason}
                      </label>
                      <select
                        value={item.reason}
                        onChange={(e) =>
                          updateFormItem(idx, {
                            reason: e.target.value as ReturnReason,
                          })
                        }
                        style={{ ...s.select, width: '100%', minWidth: 0, backgroundColor: '#fff' }}
                      >
                        {ALL_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {reasonLabel(r)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 11,
                          color: C.textSecondary,
                          marginBottom: 3,
                        }}
                      >
                        {L.condition}
                      </label>
                      <select
                        value={item.condition}
                        onChange={(e) =>
                          updateFormItem(idx, {
                            condition: e.target.value as ReturnItem['condition'],
                          })
                        }
                        style={{ ...s.select, width: '100%', minWidth: 0, backgroundColor: '#fff' }}
                      >
                        {CONDITION_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Restock + Line total */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: C.textSecondary,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.restock}
                        onChange={(e) =>
                          updateFormItem(idx, { restock: e.target.checked })
                        }
                        style={{ accentColor: C.primary }}
                      />
                      {L.restock}
                    </label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                      {L.total}: {formatCurrency(item.total, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Method */}
          <div style={s.formGroup}>
            <label style={s.label}>{L.refundMethod}</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
                gap: 8,
              }}
            >
              {ALL_REFUND_METHODS.map((method) => {
                const Icon = REFUND_METHOD_CONFIG[method].icon
                const isSelected = formRefundMethod === method
                return (
                  <button
                    key={method}
                    onClick={() => setFormRefundMethod(method)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 8px',
                      borderRadius: 10,
                      border: `2px solid ${isSelected ? C.primary : C.border}`,
                      backgroundColor: isSelected ? C.primaryLight : '#fff',
                      color: isSelected ? C.primary : C.textSecondary,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontSize: 11,
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <Icon size={20} />
                    <span style={{ textAlign: 'center', lineHeight: 1.2 }}>
                      {methodLabel(method)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reason Notes */}
          <div style={s.formGroup}>
            <label style={s.label}>{L.reasonNotes}</label>
            <textarea
              value={formReasonNotes}
              onChange={(e) => setFormReasonNotes(e.target.value)}
              placeholder="Additional notes about this return..."
              style={s.textarea}
            />
          </div>

          {/* Totals Summary */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: 10,
              padding: 16,
              marginBottom: 20,
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 13,
                color: C.textSecondary,
              }}
            >
              <span>{L.subtotal}</span>
              <span>{formatCurrency(formSubtotal, currency)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 10,
                fontSize: 13,
                color: C.textSecondary,
              }}
            >
              <span>{L.taxRefund} ({taxRate}%)</span>
              <span>{formatCurrency(formTaxRefund, currency)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTop: `1px solid ${C.border}`,
                fontSize: 16,
                fontWeight: 700,
                color: C.primary,
              }}
            >
              <span>{L.totalRefund}</span>
              <span>{formatCurrency(formTotalRefund, currency)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.text,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {L.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={formSaving || !formOrderId.trim() || formItems.length === 0}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor:
                  formSaving || !formOrderId.trim() || formItems.length === 0
                    ? '#94a3b8'
                    : C.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor:
                  formSaving || !formOrderId.trim() || formItems.length === 0
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  formSaving || !formOrderId.trim() || formItems.length === 0 ? 0.7 : 1,
              }}
            >
              {formSaving ? 'Saving...' : L.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── View Return Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingReturn(null)
        }}
        title={L.viewReturn}
        size="lg"
      >
        {viewingReturn && (
          <div>
            {/* Header info */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: C.primary,
                    marginBottom: 4,
                  }}
                >
                  {viewingReturn.return_number}
                </div>
                <div style={{ fontSize: 13, color: C.textSecondary }}>
                  {L.orderRef}:{' '}
                  {viewingReturn.order_number ||
                    `#${viewingReturn.order_id.slice(0, 8).toUpperCase()}`}
                </div>
              </div>
              <StatusBadge status={viewingReturn.status} />
            </div>

            {/* Customer & Method */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 16,
                marginBottom: 20,
                padding: 16,
                backgroundColor: '#f8fafc',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: C.textMuted,
                    marginBottom: 4,
                    letterSpacing: '0.05em',
                  }}
                >
                  {L.customer}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                  {viewingReturn.customer_name || L.walkIn}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: C.textMuted,
                    marginBottom: 4,
                    letterSpacing: '0.05em',
                  }}
                >
                  {L.refundMethod}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    color: C.text,
                  }}
                >
                  <RefundMethodIcon method={viewingReturn.refund_method} />
                  {methodLabel(viewingReturn.refund_method)}
                </div>
              </div>
            </div>

            {/* Items table */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  marginBottom: 10,
                }}
              >
                {L.itemDetails} ({viewingReturn.items.length})
              </div>
              <div
                style={{
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  overflow: 'hidden',
                }}
              >
                {viewingReturn.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      borderBottom:
                        idx < viewingReturn.items.length - 1
                          ? `1px solid ${C.border}`
                          : 'none',
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                        {item.product_name}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                        {formatCurrency(item.total, currency)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 12, color: C.textSecondary }}>
                        {item.quantity} x {formatCurrency(item.unit_price, currency)}
                      </span>
                      <ReasonBadge reason={item.reason} />
                      <span
                        style={{
                          fontSize: 11,
                          color: C.textSecondary,
                          textTransform: 'capitalize',
                        }}
                      >
                        {item.condition}
                      </span>
                      {item.restock && (
                        <span
                          style={s.badge(C.success, C.successBg)}
                        >
                          <Package size={10} />
                          {L.restock}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: 10,
                padding: 16,
                marginBottom: 20,
                border: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  fontSize: 13,
                  color: C.textSecondary,
                }}
              >
                <span>{L.subtotal}</span>
                <span>{formatCurrency(viewingReturn.subtotal, currency)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  fontSize: 13,
                  color: C.textSecondary,
                }}
              >
                <span>{L.taxRefund}</span>
                <span>{formatCurrency(viewingReturn.tax_refund, currency)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTop: `1px solid ${C.border}`,
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.primary,
                }}
              >
                <span>{L.totalRefund}</span>
                <span>{formatCurrency(viewingReturn.total_refund, currency)}</span>
              </div>
            </div>

            {/* Reason Notes */}
            {viewingReturn.reason_notes && (
              <div
                style={{
                  marginBottom: 20,
                  padding: 14,
                  backgroundColor: C.amberBg,
                  borderRadius: 10,
                  border: `1px solid #fde68a`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.amber,
                  }}
                >
                  <FileText size={14} />
                  {L.reasonNotes}
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                  {viewingReturn.reason_notes}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  marginBottom: 6,
                }}
              >
                {L.timeline}
              </div>
              {renderTimeline(viewingReturn)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
