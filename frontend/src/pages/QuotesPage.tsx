import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Loader2,
  Copy,
  Eye,
  FileText,
  Trash2,
  Send,
  Check,
  X,
  ShoppingCart,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useQuoteStore } from '../stores/quoteStore'
import { useCustomerStore } from '../stores/customerStore'
import { useProductStore } from '../stores/productStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { generateUUID } from '../utils/uuid'
import type { Quote, QuoteStatus, QuoteItem } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#7c3aed',
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

const STATUS_CONFIG: Record<QuoteStatus, { color: string; bg: string; label: string }> = {
  draft:     { color: '#94a3b8', bg: '#f1f5f9', label: 'Brouillon' },
  sent:      { color: '#3b82f6', bg: '#eff6ff', label: 'Envoy\u00e9' },
  accepted:  { color: '#16a34a', bg: '#f0fdf4', label: 'Accept\u00e9' },
  rejected:  { color: '#ef4444', bg: '#fef2f2', label: 'Rejet\u00e9' },
  expired:   { color: '#f59e0b', bg: '#fffbeb', label: 'Expir\u00e9' },
  converted: { color: '#7c3aed', bg: '#f5f3ff', label: 'Converti' },
}

const FILTER_TABS: Array<{ key: QuoteStatus | 'all'; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'draft', label: 'Brouillon' },
  { key: 'sent', label: 'Envoy\u00e9' },
  { key: 'accepted', label: 'Accept\u00e9' },
  { key: 'rejected', label: 'Rejet\u00e9' },
  { key: 'expired', label: 'Expir\u00e9' },
]

// ── Form state ───────────────────────────────────────────────────────────

interface QuoteForm {
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  title: string
  valid_until: string
  notes: string
  terms: string
  items: QuoteItem[]
}

const emptyItem: QuoteItem = {
  description: '',
  quantity: 1,
  unit_price: 0,
  discount: 0,
  total: 0,
}

const emptyForm: QuoteForm = {
  customer_id: '',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  title: '',
  valid_until: '',
  notes: '',
  terms: '',
  items: [{ ...emptyItem }],
}

// ── Component ────────────────────────────────────────────────────────────

export default function QuotesPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    quotes,
    loading,
    loadQuotes,
    addQuote,
    updateQuote,
    setStatus,
    duplicateQuote,
  } = useQuoteStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { products, loadProducts } = useProductStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const taxRate = currentStore?.tax_rate || 0

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [form, setForm] = useState<QuoteForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState<number | null>(null)

  // i18n
  const tq = (t as Record<string, any>).quotes || {}
  const tCommon = (t as Record<string, any>).common || {}

  const label = {
    title: tq.title || 'Devis',
    addQuote: tq.addQuote || 'Nouveau Devis',
    editQuote: tq.editQuote || 'Modifier Devis',
    thisMonth: tq.thisMonth || 'this month',
    pending: tq.pending || 'pending',
    conversionRate: tq.conversionRate || 'conversion',
    searchPlaceholder: tq.searchPlaceholder || 'Search by customer, quote number, title...',
    customer: tq.customer || 'Customer',
    searchCustomer: tq.searchCustomer || 'Search customer...',
    quoteTitle: tq.quoteTitle || 'Title',
    lineItems: tq.lineItems || 'Line Items',
    description: tq.description || 'Description',
    product: tq.product || 'Product',
    qty: tq.qty || 'Qty',
    unitPrice: tq.unitPrice || 'Unit Price',
    discount: tq.discount || 'Discount',
    total: tq.total || 'Total',
    addLine: tq.addLine || '+ Add Line',
    subtotal: tq.subtotal || 'Subtotal',
    discountTotal: tq.discountTotal || 'Discount',
    tax: tq.tax || 'Tax',
    grandTotal: tq.grandTotal || 'Grand Total',
    validUntil: tq.validUntil || 'Valid Until',
    notes: tq.notes || 'Notes',
    terms: tq.terms || 'Terms & Conditions',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    noQuotes: tq.noQuotes || 'No quotes yet',
    noResults: tq.noResults || 'No matching quotes',
    duplicate: tq.duplicate || 'Duplicate',
    view: tq.view || 'View',
    send: tq.send || 'Send',
    accept: tq.accept || 'Accept',
    reject: tq.reject || 'Reject',
    convertToOrder: tq.convertToOrder || 'Convert to Order',
    expiresIn: tq.expiresIn || 'Expires in',
    days: tq.days || 'days',
    expired: tq.expired || 'Expired',
    quoteDetail: tq.quoteDetail || 'Quote Detail',
    searchProducts: tq.searchProducts || 'Search product...',
    all: tCommon.all || 'All',
  }

  // ── Load data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    loadQuotes(storeId)
    loadCustomers(storeId)
    loadProducts(storeId)
  }, [storeId, loadQuotes, loadCustomers, loadProducts])

  // ── Stats ──────────────────────────────────────────────────────────────
  const thisMonthCount = useMemo(() => {
    const now = new Date()
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return quotes.filter((q) => q.created_at.startsWith(monthPrefix)).length
  }, [quotes])

  const pendingCount = useMemo(() =>
    quotes.filter((q) => q.status === 'sent' || q.status === 'draft').length,
  [quotes])

  const conversionRate = useMemo(() => {
    const total = quotes.filter((q) => q.status !== 'draft').length
    if (total === 0) return 0
    const converted = quotes.filter((q) => q.status === 'accepted' || q.status === 'converted').length
    return Math.round((converted / total) * 100)
  }, [quotes])

  // ── Filtered quotes ────────────────────────────────────────────────────
  const filteredQuotes = useMemo(() => {
    let result = quotes
    if (statusFilter !== 'all') {
      result = result.filter((q) => q.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const sq = searchQuery.toLowerCase()
      result = result.filter((q) =>
        q.quote_number.toLowerCase().includes(sq) ||
        (q.customer_name || '').toLowerCase().includes(sq) ||
        q.title.toLowerCase().includes(sq)
      )
    }
    return result
  }, [quotes, statusFilter, searchQuery])

  // ── Customer search results ────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 10)
    const q = customerSearch.toLowerCase()
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
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

  // ── Compute form totals ─────────────────────────────────────────────
  const computeFormTotals = () => {
    let subtotal = 0
    let discountTotal = 0
    for (const item of form.items) {
      const lineGross = item.quantity * item.unit_price
      const lineDiscount = item.discount || 0
      subtotal += lineGross
      discountTotal += lineDiscount
    }
    const taxAmount = Math.round((subtotal - discountTotal) * taxRate / 100)
    const grandTotal = subtotal - discountTotal + taxAmount
    return { subtotal, discountTotal, taxAmount, grandTotal }
  }

  // ── Days until expiry ──────────────────────────────────────────────────
  const getDaysUntilExpiry = (validUntil: string): number => {
    const now = new Date()
    const expiry = new Date(validUntil)
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // ── Handlers ───────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingQuote(null)
    const defaultValidUntil = new Date()
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 30)
    setForm({
      ...emptyForm,
      valid_until: defaultValidUntil.toISOString().slice(0, 10),
      items: [{ ...emptyItem }],
    })
    setFormError('')
    setCustomerSearch('')
    setProductSearch('')
    setShowCustomerDropdown(false)
    setShowProductDropdown(null)
    setShowAddModal(true)
  }

  const openEditModal = (quote: Quote) => {
    setEditingQuote(quote)
    setForm({
      customer_id: quote.customer_id || '',
      customer_name: quote.customer_name || '',
      customer_email: quote.customer_email || '',
      customer_phone: quote.customer_phone || '',
      title: quote.title,
      valid_until: quote.valid_until,
      notes: quote.notes || '',
      terms: quote.terms || '',
      items: quote.items.length > 0 ? [...quote.items] : [{ ...emptyItem }],
    })
    setFormError('')
    setShowAddModal(true)
  }

  const openDetailModal = (quote: Quote) => {
    setSelectedQuote(quote)
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

  const handleItemChange = (idx: number, field: keyof QuoteItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items]
      const item = { ...items[idx] }

      if (field === 'description') {
        item.description = value as string
      } else if (field === 'product_id') {
        item.product_id = value as string
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0
        item.total = item.quantity * item.unit_price - (item.discount || 0)
      } else if (field === 'unit_price') {
        item.unit_price = Number(value) || 0
        item.total = item.quantity * item.unit_price - (item.discount || 0)
      } else if (field === 'discount') {
        item.discount = Number(value) || 0
        item.total = item.quantity * item.unit_price - item.discount
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
      item.total = item.quantity * product.price - (item.discount || 0)
      items[idx] = item
      return { ...prev, items }
    })
    setShowProductDropdown(null)
    setProductSearch('')
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError(label.quoteTitle + ' required')
      return
    }
    if (!form.valid_until) {
      setFormError(label.validUntil + ' required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const items = form.items.map((item) => ({
        ...item,
        total: item.quantity * item.unit_price - (item.discount || 0),
      }))
      const formTotals = computeFormTotals()

      if (editingQuote) {
        await updateQuote(editingQuote.id, {
          customer_id: form.customer_id || undefined,
          customer_name: form.customer_name || undefined,
          customer_email: form.customer_email || undefined,
          customer_phone: form.customer_phone || undefined,
          title: form.title.trim(),
          items,
          subtotal: formTotals.subtotal,
          discount: formTotals.discountTotal,
          tax: formTotals.taxAmount,
          total: formTotals.grandTotal,
          valid_until: form.valid_until,
          notes: form.notes.trim() || undefined,
          terms: form.terms.trim() || undefined,
        })
      } else {
        await addQuote(storeId, {
          customer_id: form.customer_id || undefined,
          customer_name: form.customer_name || undefined,
          customer_email: form.customer_email || undefined,
          customer_phone: form.customer_phone || undefined,
          status: 'draft',
          title: form.title.trim(),
          items,
          subtotal: formTotals.subtotal,
          discount: formTotals.discountTotal,
          tax: formTotals.taxAmount,
          total: formTotals.grandTotal,
          valid_until: form.valid_until,
          notes: form.notes.trim() || undefined,
          terms: form.terms.trim() || undefined,
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

  const handleStatusChange = async (quote: Quote, newStatus: QuoteStatus) => {
    await setStatus(quote.id, newStatus)
    setSelectedQuote((prev) => prev ? { ...prev, status: newStatus } : null)
  }

  const handleDuplicate = async (quoteId: string) => {
    await duplicateQuote(quoteId)
    setShowDetailModal(false)
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const formTotals = computeFormTotals()

  // Suppress unused var warnings
  void generateUUID

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
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
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

  const quoteNumStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: C.text,
    fontFamily: '"SF Mono", "Fira Code", monospace',
  }

  const statusBadge = (status: QuoteStatus): React.CSSProperties => ({
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
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
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
      <FileText size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
      <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
        {filteredQuotes.length === 0 && quotes.length > 0 ? label.noResults : label.noQuotes}
      </p>
    </div>
  )

  // ── Render: Quote cards ──────────────────────────────────────────────
  const renderCard = (quote: Quote) => {
    const daysLeft = getDaysUntilExpiry(quote.valid_until)
    const isExpired = daysLeft <= 0 && quote.status !== 'accepted' && quote.status !== 'converted'

    return (
      <div key={quote.id} style={cardStyle} onClick={() => openDetailModal(quote)}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={quoteNumStyle}>{quote.quote_number}</span>
            <span style={statusBadge(quote.status)}>{STATUS_CONFIG[quote.status].label}</span>
          </div>
          {quote.customer_name && (
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>
              {quote.customer_name}
            </div>
          )}
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 10 }}>
            {quote.title}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.primary, marginBottom: 8 }}>
            {formatCurrency(quote.total, currency)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: isExpired ? C.danger : daysLeft <= 7 ? C.warning : C.textSecondary,
            }}>
              {isExpired
                ? label.expired
                : `${label.expiresIn} ${daysLeft} ${label.days}`
              }
            </span>
            <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <button
                style={smallBtnStyle('#3b82f6')}
                onClick={() => openDetailModal(quote)}
              >
                <Eye size={12} /> {label.view}
              </button>
              <button
                style={smallBtnStyle(C.primary)}
                onClick={() => handleDuplicate(quote.id)}
              >
                <Copy size={12} /> {label.duplicate}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Line items editor ──────────────────────────────────────
  const renderLineItems = () => (
    <div style={formFieldStyle}>
      <label style={formLabelStyle}>{label.lineItems}</label>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 50px 70px 40px' : '1fr 90px 60px 90px 70px 80px 40px',
          gap: 0,
          padding: '8px 10px',
          backgroundColor: '#f8fafc',
          fontSize: 11,
          fontWeight: 600,
          color: C.textSecondary,
          textTransform: 'uppercase',
        }}>
          <span>{label.description}</span>
          {!isMobile && <span>{label.product}</span>}
          <span>{label.qty}</span>
          {!isMobile && <span>{label.unitPrice}</span>}
          {!isMobile && <span>{label.discount}</span>}
          <span style={{ textAlign: 'right' }}>{label.total}</span>
          <span />
        </div>
        {/* Rows */}
        {form.items.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 50px 70px 40px' : '1fr 90px 60px 90px 70px 80px 40px',
            gap: 0,
            padding: '6px 10px',
            borderTop: `1px solid ${C.border}`,
            alignItems: 'center',
          }}>
            <input
              value={item.description}
              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
              placeholder={label.description}
              style={{ ...formInputStyle, padding: '6px 8px', fontSize: 13 }}
            />
            {!isMobile && (
              <div style={{ position: 'relative' }}>
                <input
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    setShowProductDropdown(idx)
                  }}
                  onFocus={() => setShowProductDropdown(idx)}
                  placeholder={label.searchProducts}
                  style={{ ...formInputStyle, padding: '6px 4px', fontSize: 11 }}
                />
                {showProductDropdown === idx && filteredProducts.length > 0 && (
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
            )}
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
                value={item.discount || 0}
                onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                style={{ ...formInputStyle, padding: '6px 4px', fontSize: 13, textAlign: 'right' }}
              />
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right', paddingRight: 4 }}>
              {formatCurrency(item.quantity * item.unit_price - (item.discount || 0), currency)}
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
            {label.addLine}
          </button>
        </div>
      </div>
      {/* Totals */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginTop: 10, fontSize: 13 }}>
        <span>{label.subtotal}: <strong>{formatCurrency(formTotals.subtotal, currency)}</strong></span>
        {formTotals.discountTotal > 0 && (
          <span style={{ color: C.danger }}>-{label.discountTotal}: <strong>{formatCurrency(formTotals.discountTotal, currency)}</strong></span>
        )}
        {taxRate > 0 && (
          <span>{label.tax} ({taxRate}%): <strong>{formatCurrency(formTotals.taxAmount, currency)}</strong></span>
        )}
        <span style={{ fontSize: 17, fontWeight: 700, color: C.primary, marginTop: 4 }}>
          {label.grandTotal}: {formatCurrency(formTotals.grandTotal, currency)}
        </span>
      </div>
    </div>
  )

  // ── Render: Detail modal content ────────────────────────────────────
  const renderDetailContent = () => {
    if (!selectedQuote) return null
    const quote = selectedQuote
    const daysLeft = getDaysUntilExpiry(quote.valid_until)
    const isExpired = daysLeft <= 0 && quote.status !== 'accepted' && quote.status !== 'converted'

    return (
      <div>
        {/* Header info */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>{label.customer}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{quote.customer_name || '-'}</div>
            {quote.customer_email && (
              <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>{quote.customer_email}</div>
            )}
            {quote.customer_phone && (
              <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>{quote.customer_phone}</div>
            )}
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>{label.quoteTitle}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{quote.title}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={statusBadge(quote.status)}>{STATUS_CONFIG[quote.status].label}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: isExpired ? C.danger : daysLeft <= 7 ? C.warning : C.textSecondary,
              }}>
                {isExpired ? label.expired : `${label.expiresIn} ${daysLeft} ${label.days}`}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 6 }}>
              {label.validUntil}: {formatDate(quote.valid_until)}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>{label.lineItems}</div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 50px 70px' : '1fr 60px 90px 70px 90px',
              padding: '8px 10px',
              backgroundColor: '#f8fafc',
              fontSize: 11,
              fontWeight: 600,
              color: C.textSecondary,
              textTransform: 'uppercase',
            }}>
              <span>{label.description}</span>
              <span>{label.qty}</span>
              {!isMobile && <span>{label.unitPrice}</span>}
              {!isMobile && <span>{label.discount}</span>}
              <span style={{ textAlign: 'right' }}>{label.total}</span>
            </div>
            {quote.items.map((item, idx) => (
              <div key={idx} style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 50px 70px' : '1fr 60px 90px 70px 90px',
                padding: '8px 10px',
                borderTop: `1px solid ${C.border}`,
                fontSize: 13,
              }}>
                <span style={{ color: C.text }}>{item.description}</span>
                <span style={{ color: C.textSecondary, textAlign: 'center' }}>{item.quantity}</span>
                {!isMobile && <span style={{ color: C.textSecondary }}>{formatCurrency(item.unit_price, currency)}</span>}
                {!isMobile && <span style={{ color: item.discount ? C.danger : C.textSecondary }}>{item.discount ? `-${formatCurrency(item.discount, currency)}` : '-'}</span>}
                <span style={{ fontWeight: 600, color: C.text, textAlign: 'right' }}>{formatCurrency(item.total, currency)}</span>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginTop: 10, fontSize: 13 }}>
            <span>{label.subtotal}: <strong>{formatCurrency(quote.subtotal, currency)}</strong></span>
            {quote.discount > 0 && (
              <span style={{ color: C.danger }}>-{label.discountTotal}: <strong>{formatCurrency(quote.discount, currency)}</strong></span>
            )}
            {quote.tax > 0 && (
              <span>{label.tax}: <strong>{formatCurrency(quote.tax, currency)}</strong></span>
            )}
            <span style={{ fontSize: 19, fontWeight: 700, color: C.primary, marginTop: 4 }}>
              {label.grandTotal}: {formatCurrency(quote.total, currency)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>{label.notes}</div>
            <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              {quote.notes}
            </div>
          </div>
        )}

        {/* Terms */}
        {quote.terms && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>{label.terms}</div>
            <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              {quote.terms}
            </div>
          </div>
        )}

        {/* Dates */}
        <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 16 }}>
          Created: {formatDate(quote.created_at)}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          {quote.status === 'draft' && (
            <>
              <button
                style={actionBtnStyle('#3b82f6')}
                onClick={() => handleStatusChange(quote, 'sent')}
              >
                <Send size={14} /> {label.send}
              </button>
              <button
                style={actionBtnStyle(C.textSecondary)}
                onClick={() => openEditModal(quote)}
              >
                {label.editQuote}
              </button>
            </>
          )}
          {quote.status === 'sent' && (
            <>
              <button
                style={actionBtnStyle(C.success)}
                onClick={() => handleStatusChange(quote, 'accepted')}
              >
                <Check size={14} /> {label.accept}
              </button>
              <button
                style={actionBtnStyle(C.danger)}
                onClick={() => handleStatusChange(quote, 'rejected')}
              >
                <X size={14} /> {label.reject}
              </button>
            </>
          )}
          {quote.status === 'accepted' && (
            <button
              style={actionBtnStyle(C.primary)}
              onClick={() => handleStatusChange(quote, 'converted')}
            >
              <ShoppingCart size={14} /> {label.convertToOrder}
            </button>
          )}
          <button
            style={actionBtnStyle('#6366f1')}
            onClick={() => handleDuplicate(quote.id)}
          >
            <Copy size={14} /> {label.duplicate}
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
            {label.title}
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={statBadgeStyle}>{thisMonthCount} {label.thisMonth}</span>
            <span style={statBadgeStyle}>{pendingCount} {label.pending}</span>
            <span style={statBadgeStyle}>{conversionRate}% {label.conversionRate}</span>
          </div>
        </div>
        <button style={addBtnStyle} onClick={openAddModal}>
          <Plus size={16} />
          {label.addQuote}
        </button>
      </div>

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
          placeholder={label.searchPlaceholder}
          style={searchInputStyle}
        />
      </div>

      {/* Cards grid */}
      {filteredQuotes.length === 0 ? renderEmpty() : (
        <div style={gridStyle}>
          {filteredQuotes.map(renderCard)}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingQuote ? label.editQuote : label.addQuote}
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
                      customer_email: c.email || '',
                      customer_phone: c.phone || '',
                    }))
                    setCustomerSearch('')
                    setShowCustomerDropdown(false)
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  {c.phone && <span style={{ color: C.textSecondary, marginLeft: 8 }}>{c.phone}</span>}
                  {c.email && <span style={{ color: C.textSecondary, marginLeft: 8 }}>{c.email}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.quoteTitle} *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            style={formInputStyle}
          />
        </div>

        {/* Line items */}
        {renderLineItems()}

        {/* Valid until */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.validUntil} *</label>
          <input
            type="date"
            value={form.valid_until}
            onChange={(e) => setForm((prev) => ({ ...prev, valid_until: e.target.value }))}
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

        {/* Terms */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.terms}</label>
          <textarea
            value={form.terms}
            onChange={(e) => setForm((prev) => ({ ...prev, terms: e.target.value }))}
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
        onClose={() => { setShowDetailModal(false); setSelectedQuote(null) }}
        title={selectedQuote ? `${selectedQuote.quote_number} — ${label.quoteDetail}` : label.quoteDetail}
        size="lg"
      >
        {renderDetailContent()}
      </Modal>
    </div>
  )
}
