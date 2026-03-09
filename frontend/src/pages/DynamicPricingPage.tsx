import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Play,
  Pause,
  Clock,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Zap,
  Package,
  Users,
  Gift,
  Sun,
  Filter,
  Hash,
  ShoppingCart,
  Layers,
  Star,
  CheckCircle,
  Info,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useDynamicPricingStore } from '../stores/dynamicPricingStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { PricingRule, PricingRuleStatus, PricingRuleType, DiscountType } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#c026d3',
  primaryLight: '#fdf4ff',
  primaryDark: '#a21caf',
  primaryMid: '#d946ef',
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

const STATUS_CONFIG: Record<PricingRuleStatus, { color: string; bg: string }> = {
  active:    { color: '#16a34a', bg: '#f0fdf4' },
  scheduled: { color: '#2563eb', bg: '#eff6ff' },
  paused:    { color: '#f59e0b', bg: '#fffbeb' },
  expired:   { color: '#dc2626', bg: '#fef2f2' },
  draft:     { color: '#64748b', bg: '#f8fafc' },
}

const ALL_STATUSES: PricingRuleStatus[] = ['active', 'scheduled', 'paused', 'expired', 'draft']

// ── Type config ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<PricingRuleType, { color: string; bg: string; label: string }> = {
  time_based:    { color: '#4f46e5', bg: '#eef2ff', label: 'Time-Based' },
  volume_based:  { color: '#0d9488', bg: '#f0fdfa', label: 'Volume-Based' },
  customer_tier: { color: '#9333ea', bg: '#faf5ff', label: 'Customer Tier' },
  bundle:        { color: '#ec4899', bg: '#fdf2f8', label: 'Bundle' },
  seasonal:      { color: '#ea580c', bg: '#fff7ed', label: 'Seasonal' },
  flash_sale:    { color: '#dc2626', bg: '#fef2f2', label: 'Flash Sale' },
}

const ALL_TYPES: PricingRuleType[] = ['time_based', 'volume_based', 'customer_tier', 'bundle', 'seasonal', 'flash_sale']

// ── Discount type labels ─────────────────────────────────────────────────

const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage',
  fixed_amount: 'Fixed Amount',
  new_price: 'New Price',
}

// ── Apply-to labels ──────────────────────────────────────────────────────

type ApplyTo = 'all_products' | 'category' | 'specific_products'
const APPLY_TO_LABELS: Record<ApplyTo, string> = {
  all_products: 'All Products',
  category: 'By Category',
  specific_products: 'Specific Products',
}

// ── Day-of-week helpers ──────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Type → icon helper ──────────────────────────────────────────────────

function ruleTypeIcon(type: PricingRuleType, size: number) {
  switch (type) {
    case 'time_based':    return <Clock size={size} />
    case 'volume_based':  return <Package size={size} />
    case 'customer_tier': return <Users size={size} />
    case 'bundle':        return <Gift size={size} />
    case 'seasonal':      return <Sun size={size} />
    case 'flash_sale':    return <Zap size={size} />
  }
}

// ── Component ─────────────────────────────────────────────────────────────

export default function DynamicPricingPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    rules,
    loading,
    filterStatus,
    filterType,
    loadRules,
    addRule,
    updateRule,
    deleteRule,
    activateRule,
    pauseRule,
    duplicateRule,
    getActiveCount,
    getTotalApplied,
    getTotalDiscountGiven,
    setFilterStatus,
    setFilterType,
  } = useDynamicPricingStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n with fallback
  const dp = (t as Record<string, any>).dynamicPricing || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: dp.title || 'Dynamic Pricing',
    subtitle: dp.subtitle || 'Manage pricing rules, discounts, and promotions',
    addRule: dp.addRule || 'New Rule',
    editRule: dp.editRule || 'Edit Rule',
    viewRule: dp.viewRule || 'Rule Details',
    totalRules: dp.totalRules || 'Total Rules',
    activeRules: dp.activeRules || 'Active Rules',
    timesApplied: dp.timesApplied || 'Times Applied',
    totalSavings: dp.totalSavings || 'Total Savings',
    name: dp.name || 'Name',
    description: dp.description || 'Description',
    type: dp.type || 'Type',
    status: dp.status || 'Status',
    priority: dp.priority || 'Priority',
    discountType: dp.discountType || 'Discount Type',
    discountValue: dp.discountValue || 'Discount Value',
    applyTo: dp.applyTo || 'Apply To',
    categoryFilter: dp.categoryFilter || 'Category',
    productIds: dp.productIds || 'Product IDs',
    minQuantity: dp.minQuantity || 'Min Quantity',
    maxQuantity: dp.maxQuantity || 'Max Quantity',
    minOrderTotal: dp.minOrderTotal || 'Min Order Total',
    customerTier: dp.customerTier || 'Customer Tier',
    startDate: dp.startDate || 'Start Date',
    endDate: dp.endDate || 'End Date',
    timeStart: dp.timeStart || 'Time Start',
    timeEnd: dp.timeEnd || 'Time End',
    daysOfWeek: dp.daysOfWeek || 'Days of Week',
    bundleProducts: dp.bundleProducts || 'Bundle Products',
    bundlePrice: dp.bundlePrice || 'Bundle Price',
    notes: dp.notes || 'Notes',
    createdBy: dp.createdBy || 'Created By',
    createdAt: dp.createdAt || 'Created At',
    updatedAt: dp.updatedAt || 'Updated At',
    scope: dp.scope || 'Scope',
    schedule: dp.schedule || 'Schedule',
    conditions: dp.conditions || 'Conditions',
    basicInfo: dp.basicInfo || 'Basic Info',
    discountInfo: dp.discountInfo || 'Discount',
    bundleConfig: dp.bundleConfig || 'Bundle Configuration',
    allStatuses: dp.allStatuses || 'All Statuses',
    allTypes: dp.allTypes || 'All Types',
    noRules: dp.noRules || 'No pricing rules yet',
    noRulesDesc: dp.noRulesDesc || 'Create your first dynamic pricing rule to get started.',
    noResults: dp.noResults || 'No rules match your filters',
    noResultsDesc: dp.noResultsDesc || 'Try adjusting the filters or search query.',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    delete: dp.delete || 'Delete',
    duplicate: dp.duplicate || 'Duplicate',
    activate: dp.activate || 'Activate',
    pause: dp.pause || 'Pause',
    rulesCount: dp.rulesCount || 'rules',
    deleteConfirm: dp.deleteConfirm || 'Are you sure you want to delete this pricing rule?',
    discountGiven: dp.discountGiven || 'Total Discount Given',
    applied: dp.applied || 'Applied',
    times: dp.times || 'times',
    allProducts: dp.allProducts || 'All Products',
    byCategory: dp.byCategory || 'By Category',
    specificProducts: dp.specificProducts || 'Specific Products',
    happyHour: dp.happyHour || 'Happy Hour',
    off: dp.off || 'off',
    fixedOff: dp.fixedOff || 'off',
    newPriceAt: dp.newPriceAt || 'New price:',
    // Status labels
    st_active: dp.st_active || 'Active',
    st_scheduled: dp.st_scheduled || 'Scheduled',
    st_paused: dp.st_paused || 'Paused',
    st_expired: dp.st_expired || 'Expired',
    st_draft: dp.st_draft || 'Draft',
    // Type labels
    tp_time_based: dp.tp_time_based || 'Time-Based',
    tp_volume_based: dp.tp_volume_based || 'Volume-Based',
    tp_customer_tier: dp.tp_customer_tier || 'Customer Tier',
    tp_bundle: dp.tp_bundle || 'Bundle',
    tp_seasonal: dp.tp_seasonal || 'Seasonal',
    tp_flash_sale: dp.tp_flash_sale || 'Flash Sale',
    // Discount type labels
    dt_percentage: dp.dt_percentage || 'Percentage',
    dt_fixed_amount: dp.dt_fixed_amount || 'Fixed Amount',
    dt_new_price: dp.dt_new_price || 'New Price',
  }

  const statusLabel = (s: PricingRuleStatus): string => (L as Record<string, string>)[`st_${s}`] || s
  const typeLabel = (tp: PricingRuleType): string => (L as Record<string, string>)[`tp_${tp}`] || TYPE_CONFIG[tp]?.label || tp
  const discountTypeLabel = (dt: DiscountType): string => (L as Record<string, string>)[`dt_${dt}`] || DISCOUNT_TYPE_LABELS[dt] || dt

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [viewingRule, setViewingRule] = useState<PricingRule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state — basic
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPriority, setFormPriority] = useState('10')
  const [formType, setFormType] = useState<PricingRuleType>('time_based')
  const [formStatus, setFormStatus] = useState<PricingRuleStatus>('draft')

  // Form state — discount
  const [formDiscountType, setFormDiscountType] = useState<DiscountType>('percentage')
  const [formDiscountValue, setFormDiscountValue] = useState('')

  // Form state — scope
  const [formApplyTo, setFormApplyTo] = useState<ApplyTo>('all_products')
  const [formCategoryFilter, setFormCategoryFilter] = useState('')
  const [formProductIds, setFormProductIds] = useState('')

  // Form state — conditions
  const [formMinQuantity, setFormMinQuantity] = useState('')
  const [formMaxQuantity, setFormMaxQuantity] = useState('')
  const [formMinOrderTotal, setFormMinOrderTotal] = useState('')
  const [formCustomerTier, setFormCustomerTier] = useState('')

  // Form state — schedule
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [formEndDate, setFormEndDate] = useState('')
  const [formTimeStart, setFormTimeStart] = useState('')
  const [formTimeEnd, setFormTimeEnd] = useState('')
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([])

  // Form state — bundle
  const [formBundleProducts, setFormBundleProducts] = useState('')
  const [formBundlePrice, setFormBundlePrice] = useState('')

  // Form state — notes
  const [formNotes, setFormNotes] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // ── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    loadRules(storeId)
  }, [storeId, loadRules])

  // ── Filtered and searched rules ────────────────────────────────────────

  const filteredRules = useMemo(() => {
    let result = [...rules]

    if (filterStatus !== 'all') {
      result = result.filter((r) => r.status === filterStatus)
    }
    if (filterType !== 'all') {
      result = result.filter((r) => r.type === filterType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.category_filter && r.category_filter.toLowerCase().includes(q)) ||
          (r.customer_tier && r.customer_tier.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      )
    }

    return result
  }, [rules, filterStatus, filterType, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const activeCount = getActiveCount()
  const totalApplied = getTotalApplied()
  const totalSavings = getTotalDiscountGiven()

  // ── Form helpers ──────────────────────────────────────────────────────

  function resetForm() {
    setFormName('')
    setFormDescription('')
    setFormPriority('10')
    setFormType('time_based')
    setFormStatus('draft')
    setFormDiscountType('percentage')
    setFormDiscountValue('')
    setFormApplyTo('all_products')
    setFormCategoryFilter('')
    setFormProductIds('')
    setFormMinQuantity('')
    setFormMaxQuantity('')
    setFormMinOrderTotal('')
    setFormCustomerTier('')
    setFormStartDate(new Date().toISOString().slice(0, 10))
    setFormEndDate('')
    setFormTimeStart('')
    setFormTimeEnd('')
    setFormDaysOfWeek([])
    setFormBundleProducts('')
    setFormBundlePrice('')
    setFormNotes('')
    setEditingRule(null)
  }

  function openAddModal() {
    resetForm()
    setShowModal(true)
  }

  function openEditModal(rule: PricingRule) {
    setEditingRule(rule)
    setFormName(rule.name)
    setFormDescription(rule.description || '')
    setFormPriority(rule.priority.toString())
    setFormType(rule.type)
    setFormStatus(rule.status)
    setFormDiscountType(rule.discount_type)
    setFormDiscountValue(rule.discount_value.toString())
    setFormApplyTo(rule.apply_to)
    setFormCategoryFilter(rule.category_filter || '')
    setFormProductIds(rule.product_ids ? rule.product_ids.join(', ') : '')
    setFormMinQuantity(rule.min_quantity !== undefined ? rule.min_quantity.toString() : '')
    setFormMaxQuantity(rule.max_quantity !== undefined ? rule.max_quantity.toString() : '')
    setFormMinOrderTotal(rule.min_order_total !== undefined ? rule.min_order_total.toString() : '')
    setFormCustomerTier(rule.customer_tier || '')
    setFormStartDate(rule.start_date.slice(0, 10))
    setFormEndDate(rule.end_date ? rule.end_date.slice(0, 10) : '')
    setFormTimeStart(rule.time_start || '')
    setFormTimeEnd(rule.time_end || '')
    setFormDaysOfWeek(rule.days_of_week || [])
    setFormBundleProducts(rule.bundle_products ? rule.bundle_products.join(', ') : '')
    setFormBundlePrice(rule.bundle_price !== undefined ? rule.bundle_price.toString() : '')
    setFormNotes(rule.notes || '')
    setShowModal(true)
  }

  async function handleSave() {
    if (!formName.trim()) return

    setFormSaving(true)
    try {
      const parsedProductIds = formProductIds
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)

      const parsedBundleProducts = formBundleProducts
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)

      const data = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        type: formType,
        status: formStatus,
        discount_type: formDiscountType,
        discount_value: parseFloat(formDiscountValue) || 0,
        priority: parseInt(formPriority) || 10,
        apply_to: formApplyTo,
        category_filter: formCategoryFilter.trim() || undefined,
        product_ids: parsedProductIds.length > 0 ? parsedProductIds : undefined,
        min_quantity: formMinQuantity ? parseInt(formMinQuantity) : undefined,
        max_quantity: formMaxQuantity ? parseInt(formMaxQuantity) : undefined,
        min_order_total: formMinOrderTotal ? parseFloat(formMinOrderTotal) : undefined,
        customer_tier: formCustomerTier.trim() || undefined,
        start_date: new Date(formStartDate).toISOString(),
        end_date: formEndDate ? new Date(formEndDate).toISOString() : undefined,
        time_start: formTimeStart || undefined,
        time_end: formTimeEnd || undefined,
        days_of_week: formDaysOfWeek.length > 0 ? formDaysOfWeek : undefined,
        bundle_products: parsedBundleProducts.length > 0 ? parsedBundleProducts : undefined,
        bundle_price: formBundlePrice ? parseFloat(formBundlePrice) : undefined,
        times_applied: 0,
        total_discount_given: 0,
        created_by: userId,
        created_by_name: userName,
        notes: formNotes.trim() || undefined,
      }

      if (editingRule) {
        await updateRule(editingRule.id, data)
      } else {
        await addRule(storeId, data)
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[DynamicPricingPage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRule(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[DynamicPricingPage] Delete error:', error)
    }
  }

  async function handleActivate(id: string) {
    try {
      await activateRule(id)
    } catch (error) {
      console.error('[DynamicPricingPage] Activate error:', error)
    }
  }

  async function handlePause(id: string) {
    try {
      await pauseRule(id)
    } catch (error) {
      console.error('[DynamicPricingPage] Pause error:', error)
    }
  }

  async function handleDuplicate(ruleId: string) {
    try {
      await duplicateRule(storeId, ruleId)
    } catch (error) {
      console.error('[DynamicPricingPage] Duplicate error:', error)
    }
  }

  function toggleDay(day: number) {
    setFormDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
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

  function formatTime(time: string): string {
    if (!time) return ''
    try {
      const [h, m] = time.split(':')
      const hour = parseInt(h)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}:${m} ${ampm}`
    } catch {
      return time
    }
  }

  function discountLabel(rule: PricingRule): string {
    if (rule.discount_type === 'percentage') {
      return `${rule.discount_value}% ${L.off}`
    }
    if (rule.discount_type === 'fixed_amount') {
      return `${formatCurrency(rule.discount_value, currency)} ${L.fixedOff}`
    }
    return `${L.newPriceAt} ${formatCurrency(rule.discount_value, currency)}`
  }

  function scopeLabel(rule: PricingRule): string {
    if (rule.apply_to === 'all_products') return L.allProducts
    if (rule.apply_to === 'category') return rule.category_filter || L.byCategory
    return `${rule.product_ids?.length || 0} ${L.specificProducts.toLowerCase()}`
  }

  function scheduleLabel(rule: PricingRule): string {
    const parts: string[] = []
    if (rule.time_start && rule.time_end) {
      parts.push(`${formatTime(rule.time_start)} - ${formatTime(rule.time_end)}`)
    }
    if (rule.days_of_week && rule.days_of_week.length > 0 && rule.days_of_week.length < 7) {
      parts.push(rule.days_of_week.map((d) => DAY_NAMES[d]).join(', '))
    }
    if (parts.length === 0) {
      return formatDate(rule.start_date) + (rule.end_date ? ' - ' + formatDate(rule.end_date) : ' +')
    }
    return parts.join(' | ')
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
      marginBottom: rv(8, 10, 12),
    } as React.CSSProperties,

    titleWrap: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
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

    ruleCard: {
      backgroundColor: C.card,
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      padding: rv(14, 18, 20),
      marginBottom: rv(10, 12, 14),
      transition: 'box-shadow 0.2s, border-color 0.2s',
      cursor: 'pointer',
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
        width: 32,
        height: 32,
        border: 'none',
        borderRadius: 8,
        backgroundColor: 'transparent',
        color,
        cursor: 'pointer',
        transition: 'background-color 0.15s',
      } as React.CSSProperties),

    // Form styles
    formSection: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: `1px solid ${C.border}`,
    } as React.CSSProperties,

    formSectionTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: C.primary,
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    } as React.CSSProperties,

    formGroup: {
      marginBottom: 14,
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
      minHeight: 60,
      fontFamily: 'inherit',
    } as React.CSSProperties,

    formSelect: {
      width: '100%',
      padding: '10px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box' as const,
      cursor: 'pointer',
    } as React.CSSProperties,

    formRow: {
      display: 'grid',
      gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
      gap: 12,
    } as React.CSSProperties,

    formRow3: {
      display: 'grid',
      gridTemplateColumns: rv('1fr', '1fr 1fr 1fr', '1fr 1fr 1fr'),
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

    dayBtn: (selected: boolean) =>
      ({
        width: 38,
        height: 34,
        border: selected ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: selected ? 700 : 500,
        color: selected ? C.primary : C.textSecondary,
        backgroundColor: selected ? C.primaryLight : '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.15s',
      } as React.CSSProperties),

    // Detail view
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

  if (loading && rules.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <TrendingUp size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading pricing rules...</div>
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
        <div style={s.titleWrap}>
          <h1 style={s.title}>
            <TrendingUp size={rv(22, 26, 28)} color={C.primary} />
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
          {L.addRule}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total Rules */}
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
              <Tag size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalRules}</span>
          </div>
          <div style={s.statValue}>{rules.length}</div>
        </div>

        {/* Active Rules */}
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
              <CheckCircle size={18} color={C.success} />
            </div>
            <span style={s.statLabel}>{L.activeRules}</span>
          </div>
          <div style={{ ...s.statValue, color: activeCount > 0 ? C.success : C.text }}>
            {activeCount}
          </div>
        </div>

        {/* Times Applied */}
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
              <Zap size={18} color={C.info} />
            </div>
            <span style={s.statLabel}>{L.timesApplied}</span>
          </div>
          <div style={s.statValue}>{totalApplied.toLocaleString()}</div>
        </div>

        {/* Total Savings */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#fdf4ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalSavings}</span>
          </div>
          <div style={{ ...s.statValue, color: C.primary }}>
            {formatCurrency(totalSavings, currency)}
          </div>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} color={C.textMuted} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PricingRuleStatus | 'all')}
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

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as PricingRuleType | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allTypes}</option>
          {ALL_TYPES.map((tp) => (
            <option key={tp} value={tp}>
              {typeLabel(tp)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Rules list ────────────────────────────────────────────────── */}
      {rules.length === 0 ? (
        /* Empty state - no rules at all */
        <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <TrendingUp size={52} />
          </div>
          <h3 style={s.emptyTitle}>{L.noRules}</h3>
          <p style={s.emptyDesc}>{L.noRulesDesc}</p>
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
            {L.addRule}
          </button>
        </div>
      ) : filteredRules.length === 0 ? (
        /* Empty state - filters returned nothing */
        <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <Search size={52} />
          </div>
          <h3 style={s.emptyTitle}>{L.noResults}</h3>
          <p style={s.emptyDesc}>{L.noResultsDesc}</p>
        </div>
      ) : (
        <>
          {/* Count label */}
          <div
            style={{
              fontSize: 12,
              color: C.textSecondary,
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            {filteredRules.length} {L.rulesCount}
          </div>

          {/* Rule cards */}
          {filteredRules.map((rule) => {
            const stCfg = STATUS_CONFIG[rule.status]
            const tpCfg = TYPE_CONFIG[rule.type]

            return (
              <div
                key={rule.id}
                style={s.ruleCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(192, 38, 211, 0.1)'
                  e.currentTarget.style.borderColor = '#e9d5ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = C.border
                }}
                onClick={() => setViewingRule(rule)}
              >
                {/* ── Card top row: name + badges ──────────────────────── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    {/* Type icon */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: tpCfg.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: tpCfg.color,
                      }}
                    >
                      {ruleTypeIcon(rule.type, 20)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: rv(14, 15, 16),
                          fontWeight: 700,
                          color: C.text,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rule.name}
                      </div>
                      {rule.description && (
                        <div
                          style={{
                            fontSize: 12,
                            color: C.textSecondary,
                            marginTop: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {rule.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                    <span style={s.badge(tpCfg.color, tpCfg.bg)}>
                      {ruleTypeIcon(rule.type, 10)}
                      {typeLabel(rule.type)}
                    </span>
                    <span style={s.badge(stCfg.color, stCfg.bg)}>
                      {rule.status === 'active' && <CheckCircle size={10} />}
                      {rule.status === 'paused' && <Pause size={10} />}
                      {statusLabel(rule.status)}
                    </span>
                  </div>
                </div>

                {/* ── Card middle: key info grid ───────────────────────── */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: rv('1fr 1fr', 'repeat(4, 1fr)', 'repeat(5, 1fr)'),
                    gap: rv(8, 12, 16),
                    marginBottom: 10,
                    padding: rv(10, 12, 14),
                    backgroundColor: '#fafbfc',
                    borderRadius: 10,
                  }}
                >
                  {/* Discount */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                      {L.discountInfo}
                    </div>
                    <div style={{ fontSize: rv(13, 14, 14), fontWeight: 700, color: C.primary }}>
                      {discountLabel(rule)}
                    </div>
                  </div>

                  {/* Scope */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                      {L.scope}
                    </div>
                    <div style={{ fontSize: rv(12, 13, 13), fontWeight: 500, color: C.text }}>
                      {scopeLabel(rule)}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                      {L.schedule}
                    </div>
                    <div style={{ fontSize: rv(12, 13, 13), fontWeight: 500, color: C.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} color={C.textMuted} />
                      {scheduleLabel(rule)}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                      {L.priority}
                    </div>
                    <div style={{ fontSize: rv(12, 13, 13), fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={11} color={C.warning} />
                      {rule.priority}
                    </div>
                  </div>

                  {/* Times Applied (hidden on mobile) */}
                  {!isMobile && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                        {L.applied}
                      </div>
                      <div style={{ fontSize: rv(12, 13, 13), fontWeight: 500, color: C.text }}>
                        {rule.times_applied.toLocaleString()} {L.times}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Card bottom: stats + actions ─────────────────────── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  {/* Left: applied + savings */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: rv(10, 16, 20), flexWrap: 'wrap' }}>
                    {isMobile && (
                      <span style={{ fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Zap size={11} color={C.info} />
                        {rule.times_applied} {L.times}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <DollarSign size={11} color={C.primary} />
                      {formatCurrency(rule.total_discount_given, currency)}
                    </span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>
                      {formatDate(rule.created_at)}
                    </span>
                  </div>

                  {/* Right: action buttons */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 2 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Toggle active / pause */}
                    {rule.status === 'active' ? (
                      <button
                        style={s.actionBtn(C.warning)}
                        title={L.pause}
                        onClick={() => handlePause(rule.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = C.warningBg
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <Pause size={15} />
                      </button>
                    ) : rule.status !== 'expired' ? (
                      <button
                        style={s.actionBtn(C.success)}
                        title={L.activate}
                        onClick={() => handleActivate(rule.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = C.successBg
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <Play size={15} />
                      </button>
                    ) : null}

                    {/* View */}
                    <button
                      style={s.actionBtn(C.info)}
                      title={L.viewRule}
                      onClick={() => setViewingRule(rule)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.infoBg
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Eye size={15} />
                    </button>

                    {/* Edit */}
                    <button
                      style={s.actionBtn(C.textSecondary)}
                      title={L.editRule}
                      onClick={() => openEditModal(rule)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Edit2 size={15} />
                    </button>

                    {/* Duplicate */}
                    <button
                      style={s.actionBtn(C.primary)}
                      title={L.duplicate}
                      onClick={() => handleDuplicate(rule.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.primaryLight
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Copy size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      style={s.actionBtn(C.danger)}
                      title={L.delete}
                      onClick={() => setDeleteTarget(rule.id)}
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
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           VIEW RULE MODAL
         ══════════════════════════════════════════════════════════════════ */}
      {viewingRule && (
        <Modal
          isOpen={true}
          onClose={() => setViewingRule(null)}
          title={L.viewRule}
          size="lg"
        >
          {(() => {
            const rule = viewingRule
            const stCfg = STATUS_CONFIG[rule.status]
            const tpCfg = TYPE_CONFIG[rule.type]

            return (
              <div>
                {/* Rule name header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: tpCfg.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tpCfg.color,
                      flexShrink: 0,
                    }}
                  >
                    {ruleTypeIcon(rule.type, 24)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{rule.name}</div>
                    {rule.description && (
                      <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>
                        {rule.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span style={s.badge(tpCfg.color, tpCfg.bg)}>{typeLabel(rule.type)}</span>
                    <span style={s.badge(stCfg.color, stCfg.bg)}>{statusLabel(rule.status)}</span>
                  </div>
                </div>

                {/* Discount highlight */}
                <div
                  style={{
                    background: `linear-gradient(135deg, ${C.primaryLight}, #fae8ff)`,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(192, 38, 211, 0.15)',
                    }}
                  >
                    {rule.discount_type === 'percentage' ? (
                      <Percent size={22} color={C.primary} />
                    ) : (
                      <DollarSign size={22} color={C.primary} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>
                      {discountLabel(rule)}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSecondary }}>
                      {discountTypeLabel(rule.discount_type)}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 12,
                      backgroundColor: '#f8fafc',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>
                      {L.priority}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                      {rule.priority}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 12,
                      backgroundColor: '#f8fafc',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>
                      {L.timesApplied}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.info }}>
                      {rule.times_applied.toLocaleString()}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 12,
                      backgroundColor: '#f8fafc',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>
                      {L.discountGiven}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>
                      {formatCurrency(rule.total_discount_given, currency)}
                    </div>
                  </div>
                </div>

                {/* Detail rows */}
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.scope}</span>
                  <span style={s.detailValue}>
                    {APPLY_TO_LABELS[rule.apply_to]}
                    {rule.category_filter && ` (${rule.category_filter})`}
                  </span>
                </div>

                {rule.product_ids && rule.product_ids.length > 0 && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.productIds}</span>
                    <span style={s.detailValue}>{rule.product_ids.length} products</span>
                  </div>
                )}

                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.startDate}</span>
                  <span style={s.detailValue}>{formatDate(rule.start_date)}</span>
                </div>

                {rule.end_date && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.endDate}</span>
                    <span style={s.detailValue}>{formatDate(rule.end_date)}</span>
                  </div>
                )}

                {rule.time_start && rule.time_end && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.happyHour}</span>
                    <span style={s.detailValue}>
                      {formatTime(rule.time_start)} - {formatTime(rule.time_end)}
                    </span>
                  </div>
                )}

                {rule.days_of_week && rule.days_of_week.length > 0 && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.daysOfWeek}</span>
                    <span style={s.detailValue}>
                      {rule.days_of_week.map((d) => DAY_NAMES[d]).join(', ')}
                    </span>
                  </div>
                )}

                {rule.min_quantity !== undefined && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.minQuantity}</span>
                    <span style={s.detailValue}>{rule.min_quantity}</span>
                  </div>
                )}

                {rule.max_quantity !== undefined && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.maxQuantity}</span>
                    <span style={s.detailValue}>{rule.max_quantity}</span>
                  </div>
                )}

                {rule.min_order_total !== undefined && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.minOrderTotal}</span>
                    <span style={s.detailValue}>
                      {formatCurrency(rule.min_order_total, currency)}
                    </span>
                  </div>
                )}

                {rule.customer_tier && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.customerTier}</span>
                    <span style={s.detailValue}>{rule.customer_tier}</span>
                  </div>
                )}

                {rule.bundle_products && rule.bundle_products.length > 0 && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.bundleProducts}</span>
                    <span style={s.detailValue}>{rule.bundle_products.length} products</span>
                  </div>
                )}

                {rule.bundle_price !== undefined && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.bundlePrice}</span>
                    <span style={s.detailValue}>
                      {formatCurrency(rule.bundle_price, currency)}
                    </span>
                  </div>
                )}

                {rule.notes && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.notes}</span>
                    <span style={s.detailValue}>{rule.notes}</span>
                  </div>
                )}

                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.createdBy}</span>
                  <span style={s.detailValue}>{rule.created_by_name || '-'}</span>
                </div>

                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.createdAt}</span>
                  <span style={s.detailValue}>{formatDate(rule.created_at)}</span>
                </div>

                <div style={{ ...s.detailRow, borderBottom: 'none' }}>
                  <span style={s.detailLabel}>{L.updatedAt}</span>
                  <span style={s.detailValue}>{formatDate(rule.updated_at)}</span>
                </div>

                {/* View modal action buttons */}
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
                  {rule.status === 'active' ? (
                    <button
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        border: `1px solid ${C.warning}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.warning,
                        backgroundColor: C.warningBg,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        handlePause(rule.id)
                        setViewingRule(null)
                      }}
                    >
                      <Pause size={14} />
                      {L.pause}
                    </button>
                  ) : rule.status !== 'expired' ? (
                    <button
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        border: `1px solid ${C.success}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.success,
                        backgroundColor: C.successBg,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        handleActivate(rule.id)
                        setViewingRule(null)
                      }}
                    >
                      <Play size={14} />
                      {L.activate}
                    </button>
                  ) : null}

                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.textSecondary,
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setViewingRule(null)
                      openEditModal(rule)
                    }}
                  >
                    <Edit2 size={14} />
                    {L.editRule}
                  </button>

                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      border: `1px solid ${C.primary}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.primary,
                      backgroundColor: C.primaryLight,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      handleDuplicate(rule.id)
                      setViewingRule(null)
                    }}
                  >
                    <Copy size={14} />
                    {L.duplicate}
                  </button>

                  <div style={{ flex: 1 }} />

                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      border: `1px solid ${C.danger}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.danger,
                      backgroundColor: C.dangerBg,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setDeleteTarget(rule.id)
                      setViewingRule(null)
                    }}
                  >
                    <Trash2 size={14} />
                    {L.delete}
                  </button>
                </div>
              </div>
            )
          })()}
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           ADD / EDIT RULE MODAL
         ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingRule ? L.editRule : L.addRule}
        size="lg"
      >
        <div>
          {/* ── Section: Basic Info ─────────────────────────────────────── */}
          <div style={s.formSection}>
            <div style={s.formSectionTitle}>
              <Info size={15} />
              {L.basicInfo}
            </div>

            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.name} *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                style={s.formInput}
                placeholder="e.g. Happy Hour 20% Off"
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.description}</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={s.formTextarea}
                placeholder="Brief description of this pricing rule..."
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>

            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.priority}</label>
                <input
                  type="number"
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  style={s.formInput}
                  placeholder="10"
                  min="1"
                  max="100"
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.status}</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as PricingRuleStatus)}
                  style={s.formSelect}
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {statusLabel(st)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Section: Rule Type ──────────────────────────────────────── */}
          <div style={s.formSection}>
            <div style={s.formSectionTitle}>
              <Layers size={15} />
              {L.type}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(3, 1fr)', 'repeat(3, 1fr)'),
                gap: 8,
              }}
            >
              {ALL_TYPES.map((tp) => {
                const tpCfg = TYPE_CONFIG[tp]
                const selected = formType === tp
                return (
                  <button
                    key={tp}
                    onClick={() => setFormType(tp)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      border: selected ? `2px solid ${tpCfg.color}` : `1px solid ${C.border}`,
                      borderRadius: 10,
                      backgroundColor: selected ? tpCfg.bg : '#ffffff',
                      color: selected ? tpCfg.color : C.textSecondary,
                      fontSize: 13,
                      fontWeight: selected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {ruleTypeIcon(tp, 16)}
                    {typeLabel(tp)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Section: Discount ───────────────────────────────────────── */}
          <div style={s.formSection}>
            <div style={s.formSectionTitle}>
              <Percent size={15} />
              {L.discountInfo}
            </div>

            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.discountType}</label>
                <select
                  value={formDiscountType}
                  onChange={(e) => setFormDiscountType(e.target.value as DiscountType)}
                  style={s.formSelect}
                >
                  <option value="percentage">{discountTypeLabel('percentage')}</option>
                  <option value="fixed_amount">{discountTypeLabel('fixed_amount')}</option>
                  <option value="new_price">{discountTypeLabel('new_price')}</option>
                </select>
              </div>

              <div style={s.formGroup}>
                <label style={s.formLabel}>
                  {L.discountValue}
                  {formDiscountType === 'percentage' ? ' (%)' : ` (${currency})`}
                </label>
                <input
                  type="number"
                  value={formDiscountValue}
                  onChange={(e) => setFormDiscountValue(e.target.value)}
                  style={s.formInput}
                  placeholder={formDiscountType === 'percentage' ? '20' : '500'}
                  min="0"
                  step={formDiscountType === 'percentage' ? '1' : '0.01'}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>
            </div>
          </div>

          {/* ── Section: Scope ──────────────────────────────────────────── */}
          <div style={s.formSection}>
            <div style={s.formSectionTitle}>
              <ShoppingCart size={15} />
              {L.scope}
            </div>

            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.applyTo}</label>
              <select
                value={formApplyTo}
                onChange={(e) => setFormApplyTo(e.target.value as ApplyTo)}
                style={s.formSelect}
              >
                <option value="all_products">{APPLY_TO_LABELS.all_products}</option>
                <option value="category">{APPLY_TO_LABELS.category}</option>
                <option value="specific_products">{APPLY_TO_LABELS.specific_products}</option>
              </select>
            </div>

            {formApplyTo === 'category' && (
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.categoryFilter}</label>
                <input
                  type="text"
                  value={formCategoryFilter}
                  onChange={(e) => setFormCategoryFilter(e.target.value)}
                  style={s.formInput}
                  placeholder="e.g. Beverages, Electronics"
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>
            )}

            {formApplyTo === 'specific_products' && (
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.productIds}</label>
                <textarea
                  value={formProductIds}
                  onChange={(e) => setFormProductIds(e.target.value)}
                  style={{ ...s.formTextarea, minHeight: 50 }}
                  placeholder="Comma-separated product IDs..."
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>
            )}
          </div>

          {/* ── Section: Conditions ─────────────────────────────────────── */}
          <div style={s.formSection}>
            <div style={s.formSectionTitle}>
              <Hash size={15} />
              {L.conditions}
            </div>

            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.minQuantity}</label>
                <input
                  type="number"
                  value={formMinQuantity}
                  onChange={(e) => setFormMinQuantity(e.target.value)}
                  style={s.formInput}
                  placeholder="e.g. 3"
                  min="0"
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.maxQuantity}</label>
                <input
                  type="number"
                  value={formMaxQuantity}
                  onChange={(e) => setFormMaxQuantity(e.target.value)}
                  style={s.formInput}
                  placeholder="e.g. 100"
                  min="0"
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>
            </div>

            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.minOrderTotal}</label>
                <input
                  type="number"
                  value={formMinOrderTotal}
                  onChange={(e) => setFormMinOrderTotal(e.target.value)}
                  style={s.formInput}
                  placeholder="e.g. 5000"
                  min="0"
                  step="0.01"
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.customerTier}</label>
                <input
                  type="text"
                  value={formCustomerTier}
                  onChange={(e) => setFormCustomerTier(e.target.value)}
                  style={s.formInput}
                  placeholder="e.g. Gold, Silver, VIP"
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>
            </div>
          </div>

          {/* ── Section: Schedule ───────────────────────────────────────── */}
          <div style={s.formSection}>
            <div style={s.formSectionTitle}>
              <Calendar size={15} />
              {L.schedule}
            </div>

            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.startDate} *</label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  style={s.formInput}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.endDate}</label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  style={s.formInput}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>
            </div>

            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.timeStart}</label>
                <input
                  type="time"
                  value={formTimeStart}
                  onChange={(e) => setFormTimeStart(e.target.value)}
                  style={s.formInput}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.timeEnd}</label>
                <input
                  type="time"
                  value={formTimeEnd}
                  onChange={(e) => setFormTimeEnd(e.target.value)}
                  style={s.formInput}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>
            </div>

            {/* Days of week */}
            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.daysOfWeek}</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DAY_NAMES.map((name, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    style={s.dayBtn(formDaysOfWeek.includes(idx))}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Section: Bundle (only if type=bundle) ──────────────────── */}
          {formType === 'bundle' && (
            <div style={s.formSection}>
              <div style={s.formSectionTitle}>
                <Gift size={15} />
                {L.bundleConfig}
              </div>

              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.bundleProducts}</label>
                <textarea
                  value={formBundleProducts}
                  onChange={(e) => setFormBundleProducts(e.target.value)}
                  style={{ ...s.formTextarea, minHeight: 50 }}
                  placeholder="Comma-separated product IDs for the bundle..."
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.bundlePrice}</label>
                <input
                  type="number"
                  value={formBundlePrice}
                  onChange={(e) => setFormBundlePrice(e.target.value)}
                  style={s.formInput}
                  placeholder="e.g. 15000"
                  min="0"
                  step="0.01"
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>
            </div>
          )}

          {/* ── Section: Notes ─────────────────────────────────────────── */}
          <div style={{ marginBottom: 0 }}>
            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.notes}</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                style={s.formTextarea}
                placeholder="Additional notes about this rule..."
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
          </div>

          {/* ── Footer buttons ─────────────────────────────────────────── */}
          <div style={s.formFooter}>
            <button
              style={s.cancelBtn}
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
            >
              {L.cancel}
            </button>
            <button
              style={s.saveBtn}
              onClick={handleSave}
              disabled={formSaving || !formName.trim()}
              onMouseEnter={(e) => {
                if (!formSaving) e.currentTarget.style.backgroundColor = C.primaryDark
              }}
              onMouseLeave={(e) => {
                if (!formSaving) e.currentTarget.style.backgroundColor = C.primary
              }}
            >
              {formSaving ? '...' : L.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
           DELETE CONFIRMATION MODAL
         ══════════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title={L.delete}
          size="sm"
        >
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '10px 0',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: C.dangerBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Trash2 size={24} color={C.danger} />
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: C.textSecondary,
                  margin: '0 0 24px',
                  lineHeight: 1.5,
                }}
              >
                {L.deleteConfirm}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                style={s.cancelBtn}
                onClick={() => setDeleteTarget(null)}
              >
                {L.cancel}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = C.danger
                }}
              >
                {L.delete}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
