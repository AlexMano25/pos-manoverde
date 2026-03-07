import { useState, useEffect, useMemo } from 'react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useCustomerStore } from '../stores/customerStore'
import { useOrderStore } from '../stores/orderStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { Customer } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#22c55e',
  accent: '#10b981',
  bgLight: '#f0fdf4',
  text: '#1e293b',
  textSecondary: '#64748b',
  card: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#d1fae5',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  gold: '#f59e0b',
  gradient: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
} as const

// ── Tag colors ──────────────────────────────────────────────────────────

const TAG_COLORS = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#06b6d4', '#ef4444', '#14b8a6', '#6366f1', '#f97316',
]

function getTagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

// ── Form state ──────────────────────────────────────────────────────────

interface CustomerForm {
  name: string
  phone: string
  email: string
  address: string
  notes: string
  tags: string
}

const emptyForm: CustomerForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  tags: '',
}

// ── Component ───────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, isTablet, rv } = useResponsive()
  const {
    customers,
    loading,
    loadCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomerStore()
  const { orders } = useOrderStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Translation helpers with fallbacks
  const tc = (t as Record<string, any>).customers || {}
  const tCommon = (t as Record<string, any>).common || {}

  const label = {
    title: tc.title || 'Customers',
    addCustomer: tc.addCustomer || 'Add Customer',
    editCustomer: tc.editCustomer || 'Edit Customer',
    searchPlaceholder: tc.searchPlaceholder || 'Search by name, phone, or email...',
    noCustomers: tc.noCustomers || 'No customers yet',
    noCustomersHint: tc.noCustomersHint || 'Add your first customer to get started',
    noResults: tc.noResults || 'No customers match your search',
    name: tCommon.name || 'Name',
    phone: tCommon.phone || 'Phone',
    email: tCommon.email || 'Email',
    address: tc.address || 'Address',
    notes: tc.notes || 'Notes',
    tags: tc.tags || 'Tags',
    tagsHint: tc.tagsHint || 'Comma-separated (e.g. VIP, wholesale)',
    visits: tc.visits || 'Visits',
    totalSpent: tc.totalSpent || 'Total Spent',
    loyaltyPoints: tc.loyaltyPoints || 'Loyalty Points',
    lastVisit: tc.lastVisit || 'Last Visit',
    memberSince: tc.memberSince || 'Member Since',
    orderHistory: tc.orderHistory || 'Order History',
    noOrders: tc.noOrders || 'No orders found for this customer',
    deleteConfirm: tc.deleteConfirm || 'Are you sure you want to delete this customer?',
    deleteWarning: tc.deleteWarning || 'This action cannot be undone.',
    customerProfile: tc.customerProfile || 'Customer Profile',
    vip: tc.vip || 'VIP',
    required: tCommon.required || 'Required',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    edit: tCommon.edit || 'Edit',
    delete: tCommon.delete || 'Delete',
    loading: tCommon.loading || 'Loading...',
    add: tCommon.add || 'Add',
    error: tCommon.error || 'Error',
  }

  // ── Load customers on mount ─────────────────────────────────────────────
  useEffect(() => {
    loadCustomers(storeId)
  }, [storeId, loadCustomers])

  // ── Filtered customers ──────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers
    const q = searchQuery.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone != null && c.phone.toLowerCase().includes(q)) ||
        (c.email != null && c.email.toLowerCase().includes(q))
    )
  }, [customers, searchQuery])

  // ── Customer orders ─────────────────────────────────────────────────────
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return []
    return orders
      .filter((o) => o.customer_id === selectedCustomer.id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  }, [orders, selectedCustomer])

  // ── Handlers ────────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingCustomer(null)
    setForm(emptyForm)
    setFormError('')
    setShowAddEditModal(true)
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
      tags: (customer.tags || []).join(', '),
    })
    setFormError('')
    setShowAddEditModal(true)
  }

  const openDetailModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetailModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(`${label.name} - ${label.required}`)
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          address: form.address.trim() || undefined,
          notes: form.notes.trim() || undefined,
          tags,
        })
      } else {
        await addCustomer(storeId, {
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          address: form.address.trim() || undefined,
          notes: form.notes.trim() || undefined,
          tags,
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

  const handleDelete = async () => {
    if (!selectedCustomer) return
    try {
      await deleteCustomer(selectedCustomer.id)
      setShowDeleteConfirm(false)
      setShowDetailModal(false)
      setSelectedCustomer(null)
    } catch (err) {
      console.error('Delete customer error:', err)
    }
  }

  const updateField = (field: keyof CustomerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFormError('')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isVip = (customer: Customer) => customer.total_spent > 100000

  // ── Styles ──────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(12, 20, 24),
    backgroundColor: C.bgLight,
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
    background: C.gradient,
    borderRadius: 16,
    color: '#ffffff',
  }

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 24, 28),
    fontWeight: 700,
    margin: 0,
    color: '#ffffff',
  }

  const badgeCountStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 20,
    minWidth: 28,
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

  const searchContainerStyle: React.CSSProperties = {
    marginBottom: 20,
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
    fontSize: 18,
    pointerEvents: 'none',
    color: C.textSecondary,
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile
      ? '1fr'
      : isTablet
        ? 'repeat(2, 1fr)'
        : 'repeat(3, 1fr)',
    gap: rv(12, 16, 20),
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 16,
    border: `1px solid ${C.borderLight}`,
    padding: rv(16, 18, 20),
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  }

  const cardNameStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: C.text,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const vipBadgeStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: C.gold,
    backgroundColor: C.gold + '15',
    padding: '2px 8px',
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
  }

  const contactRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 6,
  }

  const statsRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: rv(8, 12, 16),
    marginTop: 12,
    flexWrap: 'wrap',
  }

  const statChipStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    fontWeight: 500,
    color: C.text,
    backgroundColor: C.bgLight,
    padding: '4px 10px',
    borderRadius: 8,
    border: `1px solid ${C.borderLight}`,
  }

  const tagChipStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 500,
    color: color,
    backgroundColor: color + '15',
    padding: '2px 8px',
    borderRadius: 6,
    marginRight: 4,
    marginTop: 4,
  })

  const lastVisitStyle: React.CSSProperties = {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 10,
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
  const formTextareaStyle: React.CSSProperties = {
    ...formInputStyle,
    minHeight: 80,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  }
  const formErrorStyle: React.CSSProperties = {
    backgroundColor: C.dangerLight,
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
    background: C.gradient,
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

  // Detail modal styles
  const detailHeaderStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '0 0 20px',
    borderBottom: `1px solid ${C.border}`,
    marginBottom: 20,
  }

  const detailNameStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: C.text,
    margin: '0 0 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  }

  const detailStatsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 20,
  }

  const detailStatCardStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: 14,
    backgroundColor: C.bgLight,
    borderRadius: 12,
    border: `1px solid ${C.borderLight}`,
  }

  const detailStatValueStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: C.primary,
    margin: 0,
  }

  const detailStatLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: C.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }

  const orderRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginBottom: 8,
    border: `1px solid ${C.border}`,
  }

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: 60,
    color: C.textSecondary,
  }

  // ── Loading ─────────────────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleRowStyle}>
          <h1 style={titleStyle}>{label.title}</h1>
          <span style={badgeCountStyle}>{customers.length}</span>
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
          <span style={{ fontSize: 16 }}>+</span> {label.addCustomer}
        </button>
      </div>

      {/* Search Bar */}
      <div style={searchContainerStyle}>
        <span style={searchIconStyle}>&#128269;</span>
        <input
          style={searchInputStyle}
          type="text"
          placeholder={label.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={(e) => {
            e.target.style.borderColor = C.primary
            e.target.style.boxShadow = `0 0 0 3px ${C.primary}20`
          }}
          onBlur={(e) => {
            e.target.style.borderColor = C.border
            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
          }}
        />
      </div>

      {/* Customer Grid */}
      {filteredCustomers.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {searchQuery ? '&#128269;' : '&#128100;'}
          </div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: C.text,
              margin: '0 0 6px',
            }}
          >
            {searchQuery ? label.noResults : label.noCustomers}
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>
            {!searchQuery && label.noCustomersHint}
          </p>
        </div>
      ) : (
        <div style={gridStyle}>
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              style={cardStyle}
              onClick={() => openDetailModal(customer)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow =
                  '0 8px 24px rgba(34, 197, 94, 0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow =
                  '0 1px 4px rgba(0,0,0,0.04)'
              }}
            >
              {/* Name & VIP */}
              <div style={cardNameStyle}>
                <span>{customer.name}</span>
                {isVip(customer) && (
                  <span style={vipBadgeStyle}>
                    <span>&#11088;</span> {label.vip}
                  </span>
                )}
              </div>

              {/* Contact Info */}
              {customer.phone && (
                <div style={contactRowStyle}>
                  <span>&#128222;</span> {customer.phone}
                </div>
              )}
              {customer.email && (
                <div style={contactRowStyle}>
                  <span>&#9993;&#65039;</span> {customer.email}
                </div>
              )}

              {/* Stats */}
              <div style={statsRowStyle}>
                <span style={statChipStyle}>
                  <span>&#128101;</span> {customer.visit_count} {label.visits}
                </span>
                <span style={statChipStyle}>
                  <span>&#128176;</span>{' '}
                  {formatCurrency(customer.total_spent, currency)}
                </span>
                <span style={statChipStyle}>
                  <span>&#127873;</span> {customer.loyalty_points} pts
                </span>
              </div>

              {/* Tags */}
              {customer.tags && customer.tags.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {customer.tags.map((tag) => (
                    <span key={tag} style={tagChipStyle(getTagColor(tag))}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Last Visit */}
              {customer.last_visit && (
                <div style={lastVisitStyle}>
                  {label.lastVisit}: {formatDate(customer.last_visit)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Customer Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        title={editingCustomer ? label.editCustomer : label.addCustomer}
        size="md"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.name} *</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder="Ex: Marie Dupont"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            autoFocus
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 12,
          }}
        >
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{label.phone}</label>
            <input
              style={formInputStyle}
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{label.email}</label>
            <input
              style={formInputStyle}
              type="email"
              placeholder="marie@example.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.address}</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder="Ex: 123 Rue de la Paix, Douala"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.notes}</label>
          <textarea
            style={formTextareaStyle}
            placeholder="Ex: Allergies, preferences..."
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{label.tags}</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder={label.tagsHint}
            value={form.tags}
            onChange={(e) => updateField('tags', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>

        <div style={formBtnRowStyle}>
          <button
            style={cancelBtnStyle}
            onClick={() => setShowAddEditModal(false)}
          >
            {label.cancel}
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving ? label.loading : editingCustomer ? label.save : label.add}
          </button>
        </div>
      </Modal>

      {/* ── Customer Detail Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedCustomer(null)
        }}
        title={label.customerProfile}
        size="lg"
      >
        {selectedCustomer && (
          <>
            {/* Header */}
            <div style={detailHeaderStyle}>
              <div style={detailNameStyle}>
                <span>{selectedCustomer.name}</span>
                {isVip(selectedCustomer) && (
                  <span style={vipBadgeStyle}>
                    <span>&#11088;</span> {label.vip}
                  </span>
                )}
              </div>
              {selectedCustomer.phone && (
                <div
                  style={{
                    fontSize: 14,
                    color: C.textSecondary,
                    marginTop: 4,
                  }}
                >
                  &#128222; {selectedCustomer.phone}
                  {selectedCustomer.email && (
                    <span style={{ marginLeft: 16 }}>
                      &#9993;&#65039; {selectedCustomer.email}
                    </span>
                  )}
                </div>
              )}
              {!selectedCustomer.phone && selectedCustomer.email && (
                <div
                  style={{
                    fontSize: 14,
                    color: C.textSecondary,
                    marginTop: 4,
                  }}
                >
                  &#9993;&#65039; {selectedCustomer.email}
                </div>
              )}
              {selectedCustomer.address && (
                <div
                  style={{
                    fontSize: 13,
                    color: C.textSecondary,
                    marginTop: 4,
                  }}
                >
                  &#128205; {selectedCustomer.address}
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div style={detailStatsGridStyle}>
              <div style={detailStatCardStyle}>
                <div style={detailStatValueStyle}>
                  {selectedCustomer.visit_count}
                </div>
                <div style={detailStatLabelStyle}>{label.visits}</div>
              </div>
              <div style={detailStatCardStyle}>
                <div style={detailStatValueStyle}>
                  {formatCurrency(selectedCustomer.total_spent, currency)}
                </div>
                <div style={detailStatLabelStyle}>{label.totalSpent}</div>
              </div>
              <div style={detailStatCardStyle}>
                <div style={detailStatValueStyle}>
                  {selectedCustomer.loyalty_points}
                </div>
                <div style={detailStatLabelStyle}>{label.loyaltyPoints}</div>
              </div>
              <div style={detailStatCardStyle}>
                <div style={detailStatValueStyle}>
                  {formatDate(selectedCustomer.created_at)}
                </div>
                <div style={detailStatLabelStyle}>{label.memberSince}</div>
              </div>
            </div>

            {/* Tags */}
            {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 8,
                  }}
                >
                  {label.tags}
                </div>
                {selectedCustomer.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      ...tagChipStyle(getTagColor(tag)),
                      fontSize: 12,
                      padding: '3px 10px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Notes */}
            {selectedCustomer.notes && (
              <div
                style={{
                  marginBottom: 20,
                  padding: 14,
                  backgroundColor: '#fffbeb',
                  borderRadius: 10,
                  border: '1px solid #fde68a',
                  fontSize: 13,
                  color: C.text,
                }}
              >
                <div
                  style={{ fontWeight: 600, marginBottom: 4, fontSize: 12 }}
                >
                  {label.notes}
                </div>
                {selectedCustomer.notes}
              </div>
            )}

            {/* Order History */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                  marginBottom: 10,
                }}
              >
                {label.orderHistory} ({customerOrders.length})
              </div>
              {customerOrders.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 24,
                    color: C.textSecondary,
                    fontSize: 13,
                    backgroundColor: '#f8fafc',
                    borderRadius: 10,
                  }}
                >
                  {label.noOrders}
                </div>
              ) : (
                <div
                  style={{
                    maxHeight: 240,
                    overflowY: 'auto',
                  }}
                >
                  {customerOrders.map((order) => (
                    <div key={order.id} style={orderRowStyle}>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.text,
                          }}
                        >
                          #{order.id.slice(0, 8)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {formatDate(order.created_at)} &middot;{' '}
                          {order.items.length} item
                          {order.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: C.primary,
                          }}
                        >
                          {formatCurrency(order.total, currency)}
                        </span>
                        <div
                          style={{
                            fontSize: 11,
                            color:
                              order.status === 'paid'
                                ? C.primary
                                : order.status === 'cancelled'
                                  ? C.danger
                                  : C.gold,
                            fontWeight: 500,
                            textAlign: 'right',
                            marginTop: 2,
                          }}
                        >
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                borderTop: `1px solid ${C.border}`,
                paddingTop: 16,
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
                &#128465;&#65039; {label.delete}
              </button>
              <button
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: C.gradient,
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
                  openEditModal(selectedCustomer)
                }}
              >
                &#9998;&#65039; {label.edit}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
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
          <strong>{selectedCustomer?.name}</strong>
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
          <button
            style={cancelBtnStyle}
            onClick={() => setShowDeleteConfirm(false)}
          >
            {label.cancel}
          </button>
          <button style={deleteBtnStyle} onClick={handleDelete}>
            {label.delete}
          </button>
        </div>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
