import { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Plus,
  Search,
  AlertTriangle,
  Send,
  Check,
  CreditCard,
  Trash2,
  Eye,
  X,
  Loader2,
  Clock,
  Calendar,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useInvoiceStore } from '../stores/invoiceStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { generateUUID } from '../utils/uuid'
import type { PosInvoice, PosInvoiceStatus, PosInvoiceItem, PosInvoicePayment, PaymentMethod } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#dc2626',
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

const STATUS_CONFIG: Record<PosInvoiceStatus, { color: string; bg: string; label: string }> = {
  draft:     { color: '#94a3b8', bg: '#f1f5f9', label: 'Draft' },
  sent:      { color: '#3b82f6', bg: '#eff6ff', label: 'Sent' },
  paid:      { color: '#16a34a', bg: '#f0fdf4', label: 'Paid' },
  overdue:   { color: '#ef4444', bg: '#fef2f2', label: 'Overdue' },
  cancelled: { color: '#6b7280', bg: '#f3f4f6', label: 'Cancelled' },
}

const FILTER_TABS: Array<{ key: PosInvoiceStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'cancelled', label: 'Cancelled' },
]

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'momo', label: 'Mobile Money' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'mtn_money', label: 'MTN Money' },
  { value: 'carte_bancaire', label: 'Carte Bancaire' },
  { value: 'paypal', label: 'PayPal' },
]

// ── Form state ───────────────────────────────────────────────────────────

interface InvoiceForm {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  due_date: string
  notes: string
  terms: string
  items: PosInvoiceItem[]
}

const emptyItem: PosInvoiceItem = {
  description: '',
  quantity: 1,
  unit_price: 0,
  tax_rate: 0,
  discount: 0,
  total: 0,
}

const emptyForm: InvoiceForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  customer_address: '',
  due_date: '',
  notes: '',
  terms: '',
  items: [{ ...emptyItem }],
}

interface PaymentForm {
  amount: number
  payment_method: PaymentMethod
  note: string
}

// ── Component ────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    invoices,
    loading,
    loadInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    setStatus,
    addPayment,
    checkOverdue,
    getOverdueInvoices,
  } = useInvoiceStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const taxRate = currentStore?.tax_rate || 0

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PosInvoiceStatus | 'all'>('all')
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<PosInvoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<PosInvoice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PosInvoice | null>(null)
  const [form, setForm] = useState<InvoiceForm>(emptyForm)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({ amount: 0, payment_method: 'cash', note: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // i18n
  const label = (t as Record<string, any>).invoices || {}
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: label.title || 'Invoices',
    addInvoice: label.addInvoice || 'New Invoice',
    editInvoice: label.editInvoice || 'Edit Invoice',
    totalInvoiced: label.totalInvoiced || 'Total Invoiced',
    totalReceived: label.totalReceived || 'Total Received',
    outstandingBalance: label.outstandingBalance || 'Outstanding',
    overdueCount: label.overdueCount || 'Overdue',
    overdueAlert: label.overdueAlert || 'overdue invoice(s) need attention',
    searchPlaceholder: label.searchPlaceholder || 'Search by customer, invoice number...',
    customer: label.customer || 'Customer',
    customerName: label.customerName || 'Customer Name',
    customerEmail: label.customerEmail || 'Email',
    customerPhone: label.customerPhone || 'Phone',
    customerAddress: label.customerAddress || 'Address',
    lineItems: label.lineItems || 'Line Items',
    description: label.description || 'Description',
    qty: label.qty || 'Qty',
    unitPrice: label.unitPrice || 'Unit Price',
    taxRate: label.taxRate || 'Tax %',
    discount: label.discount || 'Discount',
    total: label.total || 'Total',
    addLine: label.addLine || '+ Add Line',
    subtotal: label.subtotal || 'Subtotal',
    discountTotal: label.discountTotal || 'Discount',
    tax: label.tax || 'Tax',
    grandTotal: label.grandTotal || 'Grand Total',
    dueDate: label.dueDate || 'Due Date',
    notes: label.notes || 'Notes',
    terms: label.terms || 'Terms & Conditions',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    noInvoices: label.noInvoices || 'No invoices yet',
    noResults: label.noResults || 'No matching invoices',
    view: label.view || 'View',
    send: label.send || 'Send',
    markPaid: label.markPaid || 'Mark Paid',
    addPayment: label.addPayment || 'Add Payment',
    deleteInvoice: label.deleteInvoice || 'Delete',
    deleteConfirm: label.deleteConfirm || 'Are you sure you want to delete this invoice?',
    deleteWarning: label.deleteWarning || 'This action cannot be undone.',
    confirmDelete: label.confirmDelete || 'Delete',
    invoiceDetail: label.invoiceDetail || 'Invoice Detail',
    paymentHistory: label.paymentHistory || 'Payment History',
    paymentDate: label.paymentDate || 'Date',
    paymentAmount: label.paymentAmount || 'Amount',
    paymentMethod: label.paymentMethod || 'Method',
    paymentNote: label.paymentNote || 'Note',
    noPayments: label.noPayments || 'No payments recorded',
    recordPayment: label.recordPayment || 'Record Payment',
    amount: label.amount || 'Amount',
    method: label.method || 'Payment Method',
    confirm: label.confirm || 'Confirm Payment',
    balanceDue: label.balanceDue || 'Balance Due',
    amountPaid: label.amountPaid || 'Amount Paid',
    issuedAt: label.issuedAt || 'Issued',
    paidAt: label.paidAt || 'Paid At',
    all: tCommon.all || 'All',
    cancelInvoice: label.cancelInvoice || 'Cancel Invoice',
  }

  // Suppress unused var warnings
  void generateUUID

  // ── Load data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    loadInvoices(storeId)
  }, [storeId, loadInvoices])

  // Check overdue on load
  useEffect(() => {
    if (invoices.length > 0) {
      checkOverdue(storeId)
    }
  }, [invoices.length, storeId, checkOverdue])

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalInvoiced = useMemo(() =>
    invoices.reduce((sum, inv) => sum + inv.total, 0),
  [invoices])

  const totalReceived = useMemo(() =>
    invoices.reduce((sum, inv) => sum + inv.amount_paid, 0),
  [invoices])

  const outstandingBalance = useMemo(() =>
    invoices
      .filter((inv) => inv.status !== 'cancelled' && inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.balance_due, 0),
  [invoices])

  const overdueInvoices = useMemo(() =>
    getOverdueInvoices(storeId),
  [invoices, storeId, getOverdueInvoices])

  // ── Filtered invoices ─────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    let result = invoices
    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const sq = searchQuery.toLowerCase()
      result = result.filter((inv) =>
        inv.invoice_number.toLowerCase().includes(sq) ||
        (inv.customer_name || '').toLowerCase().includes(sq) ||
        (inv.customer_email || '').toLowerCase().includes(sq)
      )
    }
    return result
  }, [invoices, statusFilter, searchQuery])

  // ── Compute form totals ───────────────────────────────────────────────
  const computeFormTotals = () => {
    let subtotal = 0
    let discountTotal = 0
    let taxTotal = 0
    for (const item of form.items) {
      const lineGross = item.quantity * item.unit_price
      const lineDiscount = item.discount || 0
      const lineTax = Math.round((lineGross - lineDiscount) * (item.tax_rate || 0) / 100)
      subtotal += lineGross
      discountTotal += lineDiscount
      taxTotal += lineTax
    }
    const grandTotal = subtotal - discountTotal + taxTotal
    return { subtotal, discountTotal, taxTotal, grandTotal }
  }

  // ── Handlers ───────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingInvoice(null)
    const defaultDueDate = new Date()
    defaultDueDate.setDate(defaultDueDate.getDate() + 30)
    setForm({
      ...emptyForm,
      due_date: defaultDueDate.toISOString().slice(0, 10),
      items: [{ ...emptyItem, tax_rate: taxRate }],
    })
    setFormError('')
    setShowInvoiceModal(true)
  }

  const openEditModal = (invoice: PosInvoice) => {
    setEditingInvoice(invoice)
    setForm({
      customer_name: invoice.customer_name || '',
      customer_email: invoice.customer_email || '',
      customer_phone: invoice.customer_phone || '',
      customer_address: invoice.customer_address || '',
      due_date: invoice.due_date || '',
      notes: invoice.notes || '',
      terms: invoice.terms || '',
      items: invoice.items.length > 0 ? [...invoice.items] : [{ ...emptyItem, tax_rate: taxRate }],
    })
    setFormError('')
    setShowInvoiceModal(true)
  }

  const openDetailModal = (invoice: PosInvoice) => {
    setSelectedInvoice(invoice)
    setShowDetailModal(true)
  }

  const openPaymentModal = (invoice: PosInvoice) => {
    setSelectedInvoice(invoice)
    setPaymentForm({
      amount: invoice.balance_due,
      payment_method: 'cash',
      note: '',
    })
    setShowPaymentModal(true)
  }

  const openDeleteModal = (invoice: PosInvoice) => {
    setDeleteTarget(invoice)
    setShowDeleteModal(true)
  }

  const handleAddLine = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem, tax_rate: taxRate }],
    }))
  }

  const handleRemoveLine = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }))
  }

  const handleItemChange = (idx: number, field: keyof PosInvoiceItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items]
      const item = { ...items[idx] }

      if (field === 'description') {
        item.description = value as string
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0
      } else if (field === 'unit_price') {
        item.unit_price = Number(value) || 0
      } else if (field === 'tax_rate') {
        item.tax_rate = Number(value) || 0
      } else if (field === 'discount') {
        item.discount = Number(value) || 0
      }

      const lineGross = item.quantity * item.unit_price
      const lineTax = Math.round((lineGross - (item.discount || 0)) * (item.tax_rate || 0) / 100)
      item.total = lineGross - (item.discount || 0) + lineTax

      items[idx] = item
      return { ...prev, items }
    })
  }

  const handleSave = async () => {
    if (!form.customer_name.trim()) {
      setFormError(L.customerName + ' required')
      return
    }
    if (form.items.length === 0 || !form.items.some((it) => it.description.trim())) {
      setFormError(L.description + ' required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const items = form.items.map((item) => {
        const lineGross = item.quantity * item.unit_price
        const lineTax = Math.round((lineGross - (item.discount || 0)) * (item.tax_rate || 0) / 100)
        return {
          ...item,
          total: lineGross - (item.discount || 0) + lineTax,
        }
      })
      const totals = computeFormTotals()

      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, {
          customer_name: form.customer_name.trim() || undefined,
          customer_email: form.customer_email.trim() || undefined,
          customer_phone: form.customer_phone.trim() || undefined,
          customer_address: form.customer_address.trim() || undefined,
          items,
          subtotal: totals.subtotal,
          discount: totals.discountTotal,
          tax: totals.taxTotal,
          total: totals.grandTotal,
          due_date: form.due_date || undefined,
          notes: form.notes.trim() || undefined,
          terms: form.terms.trim() || undefined,
        })
      } else {
        await addInvoice(storeId, {
          customer_name: form.customer_name.trim() || undefined,
          customer_email: form.customer_email.trim() || undefined,
          customer_phone: form.customer_phone.trim() || undefined,
          customer_address: form.customer_address.trim() || undefined,
          status: 'draft',
          items,
          subtotal: totals.subtotal,
          discount: totals.discountTotal,
          tax: totals.taxTotal,
          total: totals.grandTotal,
          amount_paid: 0,
          balance_due: totals.grandTotal,
          payments: [],
          issued_at: new Date().toISOString(),
          due_date: form.due_date || undefined,
          notes: form.notes.trim() || undefined,
          terms: form.terms.trim() || undefined,
        })
      }
      setShowInvoiceModal(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (invoice: PosInvoice, newStatus: PosInvoiceStatus) => {
    await setStatus(invoice.id, newStatus)
    setSelectedInvoice((prev) => prev ? { ...prev, status: newStatus } : null)
  }

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice) return
    if (paymentForm.amount <= 0) return
    setSaving(true)
    try {
      await addPayment(
        selectedInvoice.id,
        paymentForm.amount,
        paymentForm.payment_method,
        paymentForm.note.trim() || undefined
      )
      // Refresh selected invoice from store
      const updated = useInvoiceStore.getState().invoices.find((inv) => inv.id === selectedInvoice.id)
      if (updated) setSelectedInvoice(updated)
      setShowPaymentModal(false)
    } catch (err) {
      console.error('[InvoicesPage] Payment error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteInvoice(deleteTarget.id)
      setShowDeleteModal(false)
      setShowDetailModal(false)
      setDeleteTarget(null)
    } catch (err) {
      console.error('[InvoicesPage] Delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const getDaysUntilDue = (dueDate: string | undefined): number | null => {
    if (!dueDate) return null
    const now = new Date()
    const due = new Date(dueDate)
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const formTotals = computeFormTotals()

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
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
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

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: rv(10, 14, 16),
    marginBottom: 16,
  }

  const statCardStyle = (accent: string): React.CSSProperties => ({
    backgroundColor: C.card,
    borderRadius: 14,
    padding: rv(12, 16, 18),
    border: `1px solid ${C.border}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    borderLeft: `4px solid ${accent}`,
  })

  const statLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: C.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  }

  const statValueStyle = (color: string): React.CSSProperties => ({
    fontSize: rv(18, 22, 24),
    fontWeight: 700,
    color,
  })

  const alertBannerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 12,
    marginBottom: 16,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 600,
  }

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    padding: '8px 0',
    marginBottom: 16,
  }

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '7px 16px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    backgroundColor: isActive ? C.primary : '#f8fafc',
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

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: rv(12, 16, 20),
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    padding: rv(14, 16, 20),
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }

  const invoiceNumStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: C.text,
    fontFamily: '"SF Mono", "Fira Code", monospace',
  }

  const statusBadge = (status: PosInvoiceStatus): React.CSSProperties => ({
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
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    opacity: saving ? 0.7 : 1,
  }
  const actionBtnStyle = (color: string): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 10, border: 'none',
    backgroundColor: color, color: '#ffffff', fontSize: 13,
    fontWeight: 600, cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', gap: 4,
  })
  const smallBtnStyle = (color: string): React.CSSProperties => ({
    padding: '5px 10px', borderRadius: 8, border: 'none',
    backgroundColor: color + '15', color: color, fontSize: 12,
    fontWeight: 600, cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', gap: 3,
  })

  // ── Render: Empty state ─────────────────────────────────────────────

  const renderEmpty = () => (
    <div style={{ textAlign: 'center', padding: 60, color: C.textSecondary }}>
      <FileText size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
      <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
        {filteredInvoices.length === 0 && invoices.length > 0 ? L.noResults : L.noInvoices}
      </p>
    </div>
  )

  // ── Render: Stats row ─────────────────────────────────────────────────

  const renderStats = () => (
    <div style={statsGridStyle}>
      <div style={statCardStyle(C.primary)}>
        <div style={statLabelStyle}>{L.totalInvoiced}</div>
        <div style={statValueStyle(C.text)}>{formatCurrency(totalInvoiced, currency)}</div>
      </div>
      <div style={statCardStyle(C.success)}>
        <div style={statLabelStyle}>{L.totalReceived}</div>
        <div style={statValueStyle(C.success)}>{formatCurrency(totalReceived, currency)}</div>
      </div>
      <div style={statCardStyle(C.warning)}>
        <div style={statLabelStyle}>{L.outstandingBalance}</div>
        <div style={statValueStyle(C.warning)}>{formatCurrency(outstandingBalance, currency)}</div>
      </div>
      <div style={statCardStyle(overdueInvoices.length > 0 ? C.danger : C.textSecondary)}>
        <div style={statLabelStyle}>{L.overdueCount}</div>
        <div style={statValueStyle(overdueInvoices.length > 0 ? C.danger : C.text)}>
          {overdueInvoices.length}
        </div>
      </div>
    </div>
  )

  // ── Render: Invoice cards ──────────────────────────────────────────────

  const renderCard = (invoice: PosInvoice) => {
    const daysLeft = getDaysUntilDue(invoice.due_date)
    const isOverdue = invoice.status === 'overdue'

    return (
      <div key={invoice.id} style={cardStyle} onClick={() => openDetailModal(invoice)}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={invoiceNumStyle}>{invoice.invoice_number}</span>
            <span style={statusBadge(invoice.status)}>{STATUS_CONFIG[invoice.status].label}</span>
          </div>
          {invoice.customer_name && (
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>
              {invoice.customer_name}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={12} /> {formatDate(invoice.issued_at)}
            </span>
            {invoice.due_date && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 3,
                color: isOverdue ? C.danger : daysLeft !== null && daysLeft <= 7 ? C.warning : C.textSecondary,
              }}>
                <Clock size={12} /> {formatDate(invoice.due_date)}
              </span>
            )}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>
                {formatCurrency(invoice.total, currency)}
              </div>
              {invoice.balance_due > 0 && invoice.status !== 'draft' && (
                <div style={{ fontSize: 12, color: C.warning, fontWeight: 600 }}>
                  {L.balanceDue}: {formatCurrency(invoice.balance_due, currency)}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
            <button style={smallBtnStyle('#3b82f6')} onClick={() => openDetailModal(invoice)}>
              <Eye size={12} /> {L.view}
            </button>
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button style={smallBtnStyle(C.success)} onClick={() => openPaymentModal(invoice)}>
                <CreditCard size={12} /> {L.addPayment}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Line items editor ──────────────────────────────────────

  const renderLineItems = () => (
    <div style={formFieldStyle}>
      <label style={formLabelStyle}>{L.lineItems}</label>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 50px 70px 40px' : '1fr 60px 90px 60px 70px 90px 40px',
          gap: 0,
          padding: '8px 10px',
          backgroundColor: '#f8fafc',
          fontSize: 11,
          fontWeight: 600,
          color: C.textSecondary,
          textTransform: 'uppercase',
        }}>
          <span>{L.description}</span>
          <span>{L.qty}</span>
          {!isMobile && <span>{L.unitPrice}</span>}
          {!isMobile && <span>{L.taxRate}</span>}
          {!isMobile && <span>{L.discount}</span>}
          <span style={{ textAlign: 'right' }}>{L.total}</span>
          <span />
        </div>
        {/* Rows */}
        {form.items.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 50px 70px 40px' : '1fr 60px 90px 60px 70px 90px 40px',
            gap: 0,
            padding: '6px 10px',
            borderTop: `1px solid ${C.border}`,
            alignItems: 'center',
          }}>
            <input
              value={item.description}
              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
              placeholder={L.description}
              style={{ ...formInputStyle, padding: '6px 8px', fontSize: 13 }}
            />
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
              style={{ ...formInputStyle, padding: '6px 4px', fontSize: 13, textAlign: 'center' }}
            />
            {!isMobile && (
              <input
                type="number"
                min={0}
                value={item.unit_price}
                onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                style={{ ...formInputStyle, padding: '6px 4px', fontSize: 13, textAlign: 'right' }}
              />
            )}
            {!isMobile && (
              <input
                type="number"
                min={0}
                value={item.tax_rate}
                onChange={(e) => handleItemChange(idx, 'tax_rate', e.target.value)}
                style={{ ...formInputStyle, padding: '6px 4px', fontSize: 13, textAlign: 'center' }}
              />
            )}
            {!isMobile && (
              <input
                type="number"
                min={0}
                value={item.discount || 0}
                onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                style={{ ...formInputStyle, padding: '6px 4px', fontSize: 13, textAlign: 'right' }}
              />
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right', paddingRight: 4 }}>
              {formatCurrency(
                (item.quantity * item.unit_price) - (item.discount || 0) +
                Math.round(((item.quantity * item.unit_price) - (item.discount || 0)) * (item.tax_rate || 0) / 100),
                currency
              )}
            </span>
            <button
              type="button"
              onClick={() => handleRemoveLine(idx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.danger }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {/* Add line */}
        <div style={{ padding: '8px 10px', borderTop: `1px solid ${C.border}` }}>
          <button
            type="button"
            onClick={handleAddLine}
            style={{ background: 'none', border: 'none', color: C.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {L.addLine}
          </button>
        </div>
      </div>
      {/* Totals */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginTop: 10, fontSize: 13 }}>
        <span>{L.subtotal}: <strong>{formatCurrency(formTotals.subtotal, currency)}</strong></span>
        {formTotals.discountTotal > 0 && (
          <span style={{ color: C.danger }}>-{L.discountTotal}: <strong>{formatCurrency(formTotals.discountTotal, currency)}</strong></span>
        )}
        {formTotals.taxTotal > 0 && (
          <span>{L.tax}: <strong>{formatCurrency(formTotals.taxTotal, currency)}</strong></span>
        )}
        <span style={{ fontSize: 17, fontWeight: 700, color: C.primary, marginTop: 4 }}>
          {L.grandTotal}: {formatCurrency(formTotals.grandTotal, currency)}
        </span>
      </div>
    </div>
  )

  // ── Render: Detail modal content ────────────────────────────────────

  const renderDetailContent = () => {
    if (!selectedInvoice) return null
    const invoice = selectedInvoice
    const daysLeft = getDaysUntilDue(invoice.due_date)

    return (
      <div>
        {/* Header info */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>{L.customer}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{invoice.customer_name || '-'}</div>
            {invoice.customer_email && (
              <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>{invoice.customer_email}</div>
            )}
            {invoice.customer_phone && (
              <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>{invoice.customer_phone}</div>
            )}
            {invoice.customer_address && (
              <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>{invoice.customer_address}</div>
            )}
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>{L.invoiceDetail}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: '"SF Mono", "Fira Code", monospace' }}>
              {invoice.invoice_number}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={statusBadge(invoice.status)}>{STATUS_CONFIG[invoice.status].label}</span>
              {invoice.due_date && daysLeft !== null && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: invoice.status === 'overdue' ? C.danger : daysLeft <= 7 ? C.warning : C.textSecondary,
                }}>
                  {invoice.status === 'overdue' ? 'Overdue' : daysLeft <= 0 ? 'Due today' : `Due in ${daysLeft} days`}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 6 }}>
              {L.issuedAt}: {formatDate(invoice.issued_at)}
            </div>
            {invoice.due_date && (
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                {L.dueDate}: {formatDate(invoice.due_date)}
              </div>
            )}
            {invoice.paid_at && (
              <div style={{ fontSize: 12, color: C.success, marginTop: 2, fontWeight: 600 }}>
                {L.paidAt}: {formatDate(invoice.paid_at)}
              </div>
            )}
          </div>
        </div>

        {/* Financial summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 20,
          padding: 14,
          backgroundColor: '#f8fafc',
          borderRadius: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase' }}>{L.grandTotal}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{formatCurrency(invoice.total, currency)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase' }}>{L.amountPaid}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.success }}>{formatCurrency(invoice.amount_paid, currency)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase' }}>{L.balanceDue}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: invoice.balance_due > 0 ? C.danger : C.success }}>
              {formatCurrency(invoice.balance_due, currency)}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>{L.lineItems}</div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 50px 70px' : '1fr 60px 90px 60px 70px 90px',
              padding: '8px 10px',
              backgroundColor: '#f8fafc',
              fontSize: 11,
              fontWeight: 600,
              color: C.textSecondary,
              textTransform: 'uppercase',
            }}>
              <span>{L.description}</span>
              <span>{L.qty}</span>
              {!isMobile && <span>{L.unitPrice}</span>}
              {!isMobile && <span>{L.taxRate}</span>}
              {!isMobile && <span>{L.discount}</span>}
              <span style={{ textAlign: 'right' }}>{L.total}</span>
            </div>
            {invoice.items.map((item, idx) => (
              <div key={idx} style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 50px 70px' : '1fr 60px 90px 60px 70px 90px',
                padding: '8px 10px',
                borderTop: `1px solid ${C.border}`,
                fontSize: 13,
              }}>
                <span style={{ color: C.text }}>{item.description}</span>
                <span style={{ color: C.textSecondary, textAlign: 'center' }}>{item.quantity}</span>
                {!isMobile && <span style={{ color: C.textSecondary }}>{formatCurrency(item.unit_price, currency)}</span>}
                {!isMobile && <span style={{ color: C.textSecondary }}>{item.tax_rate}%</span>}
                {!isMobile && <span style={{ color: item.discount ? C.danger : C.textSecondary }}>{item.discount ? `-${formatCurrency(item.discount, currency)}` : '-'}</span>}
                <span style={{ fontWeight: 600, color: C.text, textAlign: 'right' }}>{formatCurrency(item.total, currency)}</span>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginTop: 10, fontSize: 13 }}>
            <span>{L.subtotal}: <strong>{formatCurrency(invoice.subtotal, currency)}</strong></span>
            {invoice.discount > 0 && (
              <span style={{ color: C.danger }}>-{L.discountTotal}: <strong>{formatCurrency(invoice.discount, currency)}</strong></span>
            )}
            {invoice.tax > 0 && (
              <span>{L.tax}: <strong>{formatCurrency(invoice.tax, currency)}</strong></span>
            )}
            <span style={{ fontSize: 19, fontWeight: 700, color: C.primary, marginTop: 4 }}>
              {L.grandTotal}: {formatCurrency(invoice.total, currency)}
            </span>
          </div>
        </div>

        {/* Payment history */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>{L.paymentHistory}</div>
          {invoice.payments.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: C.textSecondary, fontSize: 13, backgroundColor: '#f8fafc', borderRadius: 10 }}>
              {L.noPayments}
            </div>
          ) : (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 80px 70px' : '1fr 120px 100px 1fr',
                padding: '8px 10px',
                backgroundColor: '#f8fafc',
                fontSize: 11,
                fontWeight: 600,
                color: C.textSecondary,
                textTransform: 'uppercase',
              }}>
                <span>{L.paymentDate}</span>
                <span>{L.paymentAmount}</span>
                <span>{L.paymentMethod}</span>
                {!isMobile && <span>{L.paymentNote}</span>}
              </div>
              {invoice.payments.map((payment: PosInvoicePayment) => (
                <div key={payment.id} style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 80px 70px' : '1fr 120px 100px 1fr',
                  padding: '8px 10px',
                  borderTop: `1px solid ${C.border}`,
                  fontSize: 13,
                }}>
                  <span style={{ color: C.text }}>{formatDate(payment.paid_at)}</span>
                  <span style={{ fontWeight: 600, color: C.success }}>{formatCurrency(payment.amount, currency)}</span>
                  <span style={{ color: C.textSecondary, textTransform: 'capitalize' }}>
                    {payment.payment_method.replace(/_/g, ' ')}
                  </span>
                  {!isMobile && <span style={{ color: C.textSecondary }}>{payment.note || '-'}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>{L.notes}</div>
            <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              {invoice.notes}
            </div>
          </div>
        )}

        {/* Terms */}
        {invoice.terms && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>{L.terms}</div>
            <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              {invoice.terms}
            </div>
          </div>
        )}

        {/* Dates */}
        <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 16 }}>
          Created: {formatDate(invoice.created_at)}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          {invoice.status === 'draft' && (
            <>
              <button
                style={actionBtnStyle('#3b82f6')}
                onClick={() => handleStatusChange(invoice, 'sent')}
              >
                <Send size={14} /> {L.send}
              </button>
              <button
                style={actionBtnStyle(C.textSecondary)}
                onClick={() => {
                  setShowDetailModal(false)
                  openEditModal(invoice)
                }}
              >
                {L.editInvoice}
              </button>
            </>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <button
              style={actionBtnStyle(C.success)}
              onClick={() => openPaymentModal(invoice)}
            >
              <CreditCard size={14} /> {L.addPayment}
            </button>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <button
              style={actionBtnStyle('#6b7280')}
              onClick={() => handleStatusChange(invoice, 'cancelled')}
            >
              <X size={14} /> {L.cancelInvoice}
            </button>
          )}
          <button
            style={actionBtnStyle(C.danger)}
            onClick={() => openDeleteModal(invoice)}
          >
            <Trash2 size={14} /> {L.deleteInvoice}
          </button>
        </div>
      </div>
    )
  }

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
            <FileText size={rv(22, 26, 28)} />
            {L.title}
          </h1>
        </div>
        <button style={addBtnStyle} onClick={openAddModal}>
          <Plus size={16} />
          {L.addInvoice}
        </button>
      </div>

      {/* Stats row */}
      {renderStats()}

      {/* Overdue alert banner */}
      {overdueInvoices.length > 0 && (
        <div style={alertBannerStyle}>
          <AlertTriangle size={18} />
          <span>{overdueInvoices.length} {L.overdueAlert}</span>
        </div>
      )}

      {/* Filter tabs */}
      <div style={tabBarStyle}>
        {FILTER_TABS.map((tab) => (
          <div
            key={tab.key}
            style={tabStyle(statusFilter === tab.key)}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

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

      {/* Cards grid */}
      {filteredInvoices.length === 0 ? renderEmpty() : (
        <div style={gridStyle}>
          {filteredInvoices.map(renderCard)}
        </div>
      )}

      {/* Add/Edit Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title={editingInvoice ? L.editInvoice : L.addInvoice}
        size="lg"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        {/* Customer fields */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.customerName} *</label>
            <input
              value={form.customer_name}
              onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
              placeholder={L.customerName}
              style={formInputStyle}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.customerEmail}</label>
            <input
              value={form.customer_email}
              onChange={(e) => setForm((prev) => ({ ...prev, customer_email: e.target.value }))}
              placeholder={L.customerEmail}
              style={formInputStyle}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.customerPhone}</label>
            <input
              value={form.customer_phone}
              onChange={(e) => setForm((prev) => ({ ...prev, customer_phone: e.target.value }))}
              placeholder={L.customerPhone}
              style={formInputStyle}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.customerAddress}</label>
            <input
              value={form.customer_address}
              onChange={(e) => setForm((prev) => ({ ...prev, customer_address: e.target.value }))}
              placeholder={L.customerAddress}
              style={formInputStyle}
            />
          </div>
        </div>

        {/* Line items */}
        {renderLineItems()}

        {/* Due date */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.dueDate}</label>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
            style={formInputStyle}
          />
        </div>

        {/* Terms */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.terms}</label>
          <textarea
            value={form.terms}
            onChange={(e) => setForm((prev) => ({ ...prev, terms: e.target.value }))}
            placeholder={L.terms}
            style={formTextareaStyle}
          />
        </div>

        {/* Notes */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.notes}</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder={L.notes}
            style={formTextareaStyle}
          />
        </div>

        {/* Buttons */}
        <div style={btnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowInvoiceModal(false)}>
            {L.cancel}
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {L.save}
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={L.invoiceDetail}
        size="lg"
      >
        {renderDetailContent()}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={L.recordPayment}
      >
        {selectedInvoice && (
          <div>
            <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: C.textSecondary }}>{L.grandTotal}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{formatCurrency(selectedInvoice.total, currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: C.textSecondary }}>{L.amountPaid}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.success }}>{formatCurrency(selectedInvoice.amount_paid, currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.danger }}>{L.balanceDue}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.danger }}>{formatCurrency(selectedInvoice.balance_due, currency)}</span>
              </div>
            </div>

            <div style={formFieldStyle}>
              <label style={formLabelStyle}>{L.amount}</label>
              <input
                type="number"
                min={0}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: Number(e.target.value) || 0 }))}
                style={formInputStyle}
              />
            </div>

            <div style={formFieldStyle}>
              <label style={formLabelStyle}>{L.method}</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_method: e.target.value as PaymentMethod }))}
                style={formInputStyle}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>{pm.label}</option>
                ))}
              </select>
            </div>

            <div style={formFieldStyle}>
              <label style={formLabelStyle}>{L.paymentNote}</label>
              <input
                value={paymentForm.note}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder={L.paymentNote}
                style={formInputStyle}
              />
            </div>

            <div style={btnRowStyle}>
              <button style={cancelBtnStyle} onClick={() => setShowPaymentModal(false)}>
                {L.cancel}
              </button>
              <button
                style={saveBtnStyle}
                onClick={handlePaymentSubmit}
                disabled={saving || paymentForm.amount <= 0}
              >
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                {L.confirm}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={L.deleteInvoice}
      >
        <div style={{ textAlign: 'center', padding: 20 }}>
          <AlertTriangle size={48} style={{ color: C.danger, marginBottom: 16 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>
            {L.deleteConfirm}
          </p>
          <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>
            {deleteTarget?.invoice_number}
          </p>
          <p style={{ fontSize: 12, color: C.warning }}>
            {L.deleteWarning}
          </p>
          <div style={{ ...btnRowStyle, justifyContent: 'center' }}>
            <button style={cancelBtnStyle} onClick={() => setShowDeleteModal(false)}>
              {L.cancel}
            </button>
            <button
              style={{ ...saveBtnStyle, background: C.danger }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
              {L.confirmDelete}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
