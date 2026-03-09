import { useState, useEffect, useMemo } from 'react'
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Percent,
  Layers,
  Calendar,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useTaxStore } from '../stores/taxStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { TaxRate, TaxType, TaxRateStatus } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#475569',
  primaryLight: '#f1f5f9',
  primaryDark: '#334155',
  bg: '#f8fafc',
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
  purple: '#7c3aed',
  purpleBg: '#f5f3ff',
  orange: '#ea580c',
  orangeBg: '#fff7ed',
} as const

// ── Type badge config ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<TaxType, { color: string; bg: string; label: string }> = {
  vat:         { color: '#2563eb', bg: '#eff6ff', label: 'VAT' },
  sales_tax:   { color: '#16a34a', bg: '#f0fdf4', label: 'Sales Tax' },
  gst:         { color: '#7c3aed', bg: '#f5f3ff', label: 'GST' },
  service_tax: { color: '#ea580c', bg: '#fff7ed', label: 'Service Tax' },
  excise:      { color: '#dc2626', bg: '#fef2f2', label: 'Excise' },
  custom:      { color: '#64748b', bg: '#f8fafc', label: 'Custom' },
}

// ── Status badge config ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaxRateStatus, { color: string; bg: string }> = {
  active:    { color: '#16a34a', bg: '#f0fdf4' },
  inactive:  { color: '#64748b', bg: '#f8fafc' },
  scheduled: { color: '#2563eb', bg: '#eff6ff' },
}

// ── Constants ─────────────────────────────────────────────────────────────

const ALL_STATUSES: TaxRateStatus[] = ['active', 'inactive', 'scheduled']
const ALL_TYPES: TaxType[] = ['vat', 'sales_tax', 'gst', 'service_tax', 'excise', 'custom']
const ALL_APPLY_TO: Array<TaxRate['apply_to']> = ['all_products', 'category', 'specific_products']

// ── Component ─────────────────────────────────────────────────────────────

export default function TaxPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const authStore = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    rates,
    loading,
    filterStatus,
    filterType,
    loadRates,
    addRate,
    updateRate,
    deleteRate,
    activateRate,
    deactivateRate,
    getActiveCount,
    getAvgRate,
    setFilterStatus,
    setFilterType,
  } = useTaxStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userName = authStore.user?.name || ''

  // i18n
  const tx = (t as Record<string, any>).tax || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: tx.title || 'Tax Management',
    subtitle: tx.subtitle || 'Configure tax rates, rules, and settings for your store',
    addRate: tx.addRate || 'New Tax Rate',
    editRate: tx.editRate || 'Edit Tax Rate',
    viewRate: tx.viewRate || 'Tax Rate Details',
    deleteRate: tx.deleteRate || 'Delete Tax Rate',
    totalRates: tx.totalRates || 'Total Rates',
    activeRates: tx.activeRates || 'Active Rates',
    averageRate: tx.averageRate || 'Average Rate',
    taxTypesInUse: tx.taxTypesInUse || 'Tax Types in Use',
    name: tx.name || 'Name',
    code: tx.code || 'Code',
    type: tx.type || 'Type',
    rate: tx.rate || 'Rate',
    isCompound: tx.isCompound || 'Compound',
    isInclusive: tx.isInclusive || 'Inclusive',
    applyTo: tx.applyTo || 'Apply To',
    effectiveFrom: tx.effectiveFrom || 'Effective From',
    effectiveUntil: tx.effectiveUntil || 'Effective Until',
    status: tx.status || 'Status',
    actions: tx.actions || 'Actions',
    description: tx.description || 'Description',
    categoryFilter: tx.categoryFilter || 'Category',
    allStatuses: tx.allStatuses || 'All Statuses',
    allTypes: tx.allTypes || 'All Types',
    noRates: tx.noRates || 'No tax rates configured',
    noRatesDesc: tx.noRatesDesc || 'Add tax rates to start managing taxes for your products.',
    noResults: tx.noResults || 'No tax rates match your filters',
    noResultsDesc: tx.noResultsDesc || 'Try adjusting the filters or search query.',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    delete: tCommon.delete || 'Delete',
    activate: tx.activate || 'Activate',
    deactivate: tx.deactivate || 'Deactivate',
    ratesCount: tx.ratesCount || 'rates',
    deleteConfirm: tx.deleteConfirm || 'Are you sure you want to delete this tax rate? This action cannot be undone.',
    deleteConfirmTitle: tx.deleteConfirmTitle || 'Confirm Deletion',
    compoundYes: tx.compoundYes || 'Yes',
    compoundNo: tx.compoundNo || 'No',
    inclusiveYes: tx.inclusiveYes || 'Tax Inclusive',
    inclusiveNo: tx.inclusiveNo || 'Tax Exclusive',
    allProducts: tx.allProducts || 'All Products',
    categoryOnly: tx.categoryOnly || 'Category Only',
    specificProducts: tx.specificProducts || 'Specific Products',
    compoundExplain: tx.compoundExplain || 'Compound tax is calculated on top of other taxes',
    inclusiveExplain: tx.inclusiveExplain || 'Tax inclusive means the price already includes tax',
    createdAt: tx.createdAt || 'Created',
    updatedAt: tx.updatedAt || 'Last Updated',
    rateDisplay: tx.rateDisplay || 'Rate Display',
    generalInfo: tx.generalInfo || 'General Information',
    taxConfig: tx.taxConfig || 'Tax Configuration',
    scheduling: tx.scheduling || 'Scheduling',
    optional: tx.optional || 'Optional',
    required: tx.required || 'Required',
    // Status labels
    st_active: tx.st_active || 'Active',
    st_inactive: tx.st_inactive || 'Inactive',
    st_scheduled: tx.st_scheduled || 'Scheduled',
    // Type labels
    tp_vat: tx.tp_vat || 'VAT',
    tp_sales_tax: tx.tp_sales_tax || 'Sales Tax',
    tp_gst: tx.tp_gst || 'GST',
    tp_service_tax: tx.tp_service_tax || 'Service Tax',
    tp_excise: tx.tp_excise || 'Excise',
    tp_custom: tx.tp_custom || 'Custom',
    // Apply to labels
    ap_all_products: tx.ap_all_products || 'All Products',
    ap_category: tx.ap_category || 'Category',
    ap_specific_products: tx.ap_specific_products || 'Specific Products',
  }

  const statusLabel = (s: TaxRateStatus): string => (L as Record<string, string>)[`st_${s}`] || s
  const typeLabel = (tp: TaxType): string => (L as Record<string, string>)[`tp_${tp}`] || TYPE_CONFIG[tp].label
  const applyToLabel = (ap: TaxRate['apply_to']): string => (L as Record<string, string>)[`ap_${ap}`] || ap

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null)
  const [viewingRate, setViewingRate] = useState<TaxRate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formType, setFormType] = useState<TaxType>('vat')
  const [formRate, setFormRate] = useState<number>(0)
  const [formIsCompound, setFormIsCompound] = useState(false)
  const [formIsInclusive, setFormIsInclusive] = useState(false)
  const [formApplyTo, setFormApplyTo] = useState<TaxRate['apply_to']>('all_products')
  const [formCategoryFilter, setFormCategoryFilter] = useState('')
  const [formEffectiveFrom, setFormEffectiveFrom] = useState('')
  const [formEffectiveUntil, setFormEffectiveUntil] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // ── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    loadRates(storeId)
  }, [storeId, loadRates])

  // ── Filtered and searched rates ───────────────────────────────────────

  const filteredRates = useMemo(() => {
    let result = [...rates]

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
          r.code.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      )
    }

    return result
  }, [rates, filterStatus, filterType, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const activeCount = getActiveCount(storeId)
  const avgRate = getAvgRate(storeId)

  const typesInUse = useMemo(() => {
    const types = new Set(rates.filter((r) => r.status === 'active').map((r) => r.type))
    return types.size
  }, [rates])

  // ── Form helpers ──────────────────────────────────────────────────────

  function resetForm() {
    setFormName('')
    setFormCode('')
    setFormType('vat')
    setFormRate(0)
    setFormIsCompound(false)
    setFormIsInclusive(false)
    setFormApplyTo('all_products')
    setFormCategoryFilter('')
    setFormEffectiveFrom('')
    setFormEffectiveUntil('')
    setFormDescription('')
    setEditingRate(null)
  }

  function openAddModal() {
    resetForm()
    const today = new Date().toISOString().slice(0, 10)
    setFormEffectiveFrom(today)
    setShowModal(true)
  }

  function openEditModal(rate: TaxRate) {
    setEditingRate(rate)
    setFormName(rate.name)
    setFormCode(rate.code)
    setFormType(rate.type)
    setFormRate(rate.rate)
    setFormIsCompound(rate.is_compound)
    setFormIsInclusive(rate.is_inclusive)
    setFormApplyTo(rate.apply_to)
    setFormCategoryFilter(rate.category_filter || '')
    setFormEffectiveFrom(rate.effective_from ? rate.effective_from.slice(0, 10) : '')
    setFormEffectiveUntil(rate.effective_until ? rate.effective_until.slice(0, 10) : '')
    setFormDescription(rate.description || '')
    setShowModal(true)
  }

  async function handleSave() {
    if (!formName.trim() || !formCode.trim() || formRate < 0 || !formEffectiveFrom) return

    setFormSaving(true)
    try {
      const now = new Date()
      const effectiveDate = new Date(formEffectiveFrom)
      let computedStatus: TaxRateStatus = 'active'
      if (effectiveDate > now) {
        computedStatus = 'scheduled'
      }

      const rateData = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        type: formType,
        rate: formRate,
        is_compound: formIsCompound,
        is_inclusive: formIsInclusive,
        apply_to: formApplyTo,
        category_filter: formApplyTo === 'category' ? formCategoryFilter.trim() : undefined,
        product_ids: formApplyTo === 'specific_products' ? [] : undefined,
        effective_from: formEffectiveFrom,
        effective_until: formEffectiveUntil || undefined,
        description: formDescription.trim() || undefined,
        status: computedStatus,
      }

      if (editingRate) {
        await updateRate(editingRate.id, rateData)
      } else {
        await addRate(storeId, rateData)
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[TaxPage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRate(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[TaxPage] Delete error:', error)
    }
  }

  async function handleActivate(id: string) {
    try {
      await activateRate(id)
    } catch (error) {
      console.error('[TaxPage] Activate error:', error)
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivateRate(id)
    } catch (error) {
      console.error('[TaxPage] Deactivate error:', error)
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

    // Checkbox styles
    checkboxWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      cursor: 'pointer',
    } as React.CSSProperties,

    checkboxInput: {
      width: 18,
      height: 18,
      accentColor: C.primary,
      cursor: 'pointer',
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

    // View detail section
    detailSection: {
      marginBottom: 20,
    } as React.CSSProperties,

    detailSectionTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: C.text,
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    } as React.CSSProperties,

    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: `1px dashed ${C.border}`,
    } as React.CSSProperties,

    detailLabel: {
      fontSize: 13,
      fontWeight: 500,
      color: C.textSecondary,
    } as React.CSSProperties,

    detailValue: {
      fontSize: 14,
      fontWeight: 600,
      color: C.text,
    } as React.CSSProperties,

    // Visual rate display
    rateCircle: {
      width: rv(80, 100, 120),
      height: rv(80, 100, 120),
      borderRadius: '50%',
      border: `4px solid ${C.primary}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      backgroundColor: C.primaryLight,
    } as React.CSSProperties,

    // Section hint
    sectionHint: {
      fontSize: 12,
      color: C.textMuted,
      marginTop: 4,
      fontStyle: 'italic' as const,
    } as React.CSSProperties,

    // Delete modal
    deleteModalBody: {
      textAlign: 'center' as const,
      padding: '10px 0',
    } as React.CSSProperties,

    deleteIcon: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      backgroundColor: C.dangerBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
    } as React.CSSProperties,
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && rates.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <Receipt size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading tax rates...</div>
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
            <Receipt size={rv(22, 26, 28)} color={C.primary} />
            {L.title}
          </h1>
          <p style={s.subtitle}>{L.subtitle}{userName ? ` - ${userName}` : ''}</p>
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
          {L.addRate}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total Rates */}
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
              <Receipt size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalRates}</span>
          </div>
          <div style={s.statValue}>{rates.length}</div>
        </div>

        {/* Active Rates */}
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
            <span style={s.statLabel}>{L.activeRates}</span>
          </div>
          <div style={s.statValue}>{activeCount}</div>
        </div>

        {/* Average Rate */}
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
              <Percent size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.averageRate}</span>
          </div>
          <div style={s.statValue}>{avgRate.toFixed(1)}%</div>
        </div>

        {/* Tax Types in Use */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.purpleBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} color={C.purple} />
            </div>
            <span style={s.statLabel}>{L.taxTypesInUse}</span>
          </div>
          <div style={s.statValue}>{typesInUse}</div>
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
          onChange={(e) => setFilterStatus(e.target.value as TaxRateStatus | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allStatuses}</option>
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>
              {statusLabel(st)}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TaxType | 'all')}
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

      {/* ── Rate list ────────────────────────────────────────────────────── */}
      {rates.length === 0 ? (
        /* Empty state - no rates at all */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <Receipt size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noRates}</h3>
          <p style={s.emptyDesc}>{L.noRatesDesc}</p>
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
            {L.addRate}
          </button>
        </div>
      ) : filteredRates.length === 0 ? (
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
            {filteredRates.length} {L.ratesCount}
          </div>
          {filteredRates.map((rate) => {
            const stCfg = STATUS_CONFIG[rate.status]
            const tpCfg = TYPE_CONFIG[rate.type]

            return (
              <div key={rate.id} style={s.mobileCard}>
                {/* Top row: name + rate% */}
                <div style={s.mobileCardRow}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    {rate.name}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>
                    {rate.rate}%
                  </span>
                </div>

                {/* Code + type badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.primary,
                      backgroundColor: C.primaryLight,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                    }}
                  >
                    {rate.code}
                  </span>
                  <span style={s.badge(tpCfg.color, tpCfg.bg)}>
                    {typeLabel(rate.type)}
                  </span>
                </div>

                {/* Compound + Inclusive tags */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginBottom: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  {rate.is_compound && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: C.orange,
                        backgroundColor: C.orangeBg,
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {L.isCompound}
                    </span>
                  )}
                  {rate.is_inclusive && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: C.purple,
                        backgroundColor: C.purpleBg,
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {L.isInclusive}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: C.textSecondary,
                      backgroundColor: '#f1f5f9',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {applyToLabel(rate.apply_to)}
                  </span>
                </div>

                {/* Dates */}
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
                  <span>{formatDate(rate.effective_from)}</span>
                  {rate.effective_until && (
                    <span>- {formatDate(rate.effective_until)}</span>
                  )}
                </div>

                {/* Status */}
                <div style={{ ...s.mobileCardRow, marginBottom: 0 }}>
                  <span style={s.badge(stCfg.color, stCfg.bg)}>
                    {statusLabel(rate.status)}
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
                    onClick={() => setViewingRate(rate)}
                    style={{
                      ...s.actionBtn(C.primary),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                    }}
                    title={L.viewRate}
                  >
                    <Eye size={13} />
                  </button>

                  <button
                    onClick={() => openEditModal(rate)}
                    style={{
                      ...s.actionBtn(C.info),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                    }}
                    title={L.editRate}
                  >
                    <Edit size={13} />
                  </button>

                  {rate.status === 'inactive' || rate.status === 'scheduled' ? (
                    <button
                      onClick={() => handleActivate(rate.id)}
                      style={{
                        ...s.actionBtn(C.success),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.activate}
                    >
                      <CheckCircle size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeactivate(rate.id)}
                      style={{
                        ...s.actionBtn(C.warning),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.deactivate}
                    >
                      <XCircle size={13} />
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTarget(rate.id)}
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
            {filteredRates.length} {L.ratesCount}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{L.name}</th>
                  <th style={s.th}>{L.code}</th>
                  <th style={s.th}>{L.type}</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>{L.rate}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.isCompound}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.isInclusive}</th>
                  <th style={s.th}>{L.applyTo}</th>
                  <th style={s.th}>{L.effectiveFrom}</th>
                  <th style={s.th}>{L.status}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((rate) => {
                  const stCfg = STATUS_CONFIG[rate.status]
                  const tpCfg = TYPE_CONFIG[rate.type]

                  return (
                    <tr
                      key={rate.id}
                      style={{ transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = ''
                      }}
                    >
                      {/* Name */}
                      <td style={s.td}>
                        <div style={{ fontWeight: 600, color: C.text }}>{rate.name}</div>
                        {rate.description && (
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rate.description}
                          </div>
                        )}
                      </td>

                      {/* Code */}
                      <td style={s.td}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.primary,
                            backgroundColor: C.primaryLight,
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontFamily: 'monospace',
                          }}
                        >
                          {rate.code}
                        </span>
                      </td>

                      {/* Type */}
                      <td style={s.td}>
                        <span style={s.badge(tpCfg.color, tpCfg.bg)}>
                          {typeLabel(rate.type)}
                        </span>
                      </td>

                      {/* Rate */}
                      <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>
                        {rate.rate}%
                      </td>

                      {/* Compound */}
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        {rate.is_compound ? (
                          <CheckCircle size={16} color={C.success} />
                        ) : (
                          <XCircle size={16} color={C.textMuted} />
                        )}
                      </td>

                      {/* Inclusive */}
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        {rate.is_inclusive ? (
                          <CheckCircle size={16} color={C.success} />
                        ) : (
                          <XCircle size={16} color={C.textMuted} />
                        )}
                      </td>

                      {/* Apply To */}
                      <td style={s.td}>
                        <span style={{ fontSize: 13, color: C.textSecondary }}>
                          {applyToLabel(rate.apply_to)}
                        </span>
                      </td>

                      {/* Effective From */}
                      <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: 13, color: C.textSecondary }}>
                        <div>{formatDate(rate.effective_from)}</div>
                        {rate.effective_until && (
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                            to {formatDate(rate.effective_until)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={s.td}>
                        <span style={s.badge(stCfg.color, stCfg.bg)}>
                          {statusLabel(rate.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          {/* View */}
                          <button
                            onClick={() => setViewingRate(rate)}
                            style={s.actionBtn(C.primary)}
                            title={L.viewRate}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.primaryLight
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(rate)}
                            style={s.actionBtn(C.info)}
                            title={L.editRate}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.infoBg
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Edit size={15} />
                          </button>

                          {/* Activate / Deactivate */}
                          {rate.status === 'inactive' || rate.status === 'scheduled' ? (
                            <button
                              onClick={() => handleActivate(rate.id)}
                              style={s.actionBtn(C.success)}
                              title={L.activate}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.successBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <CheckCircle size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeactivate(rate.id)}
                              style={s.actionBtn(C.warning)}
                              title={L.deactivate}
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

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(rate.id)}
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

      {/* ── Add / Edit Rate Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingRate ? L.editRate : L.addRate}
        size="lg"
      >
        {/* Section: General Information */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.primary,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            <Receipt size={14} color={C.primary} />
            {L.generalInfo}
          </div>
        </div>

        {/* Name + Code */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.name} *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Standard VAT"
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
            <label style={s.formLabel}>{L.code} *</label>
            <input
              type="text"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              placeholder="e.g. VAT20"
              style={{ ...s.formInput, fontFamily: 'monospace', textTransform: 'uppercase' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        </div>

        {/* Type + Rate */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.type} *</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as TaxType)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {typeLabel(tp)}
                </option>
              ))}
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.rate} (%) *</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formRate}
              onChange={(e) => setFormRate(parseFloat(e.target.value) || 0)}
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

        {/* Section: Tax Configuration */}
        <div style={{ marginBottom: 8, marginTop: 8 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.primary,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            <BarChart3 size={14} color={C.primary} />
            {L.taxConfig}
          </div>
        </div>

        {/* Compound + Inclusive */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.isCompound}</label>
            <div
              style={s.checkboxWrap}
              onClick={() => setFormIsCompound(!formIsCompound)}
            >
              <input
                type="checkbox"
                checked={formIsCompound}
                onChange={(e) => setFormIsCompound(e.target.checked)}
                style={s.checkboxInput}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                  {formIsCompound ? L.compoundYes : L.compoundNo}
                </div>
                <div style={s.sectionHint}>{L.compoundExplain}</div>
              </div>
            </div>
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.isInclusive}</label>
            <div
              style={s.checkboxWrap}
              onClick={() => setFormIsInclusive(!formIsInclusive)}
            >
              <input
                type="checkbox"
                checked={formIsInclusive}
                onChange={(e) => setFormIsInclusive(e.target.checked)}
                style={s.checkboxInput}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                  {formIsInclusive ? L.inclusiveYes : L.inclusiveNo}
                </div>
                <div style={s.sectionHint}>{L.inclusiveExplain}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Apply To */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.applyTo} *</label>
          <select
            value={formApplyTo}
            onChange={(e) => setFormApplyTo(e.target.value as TaxRate['apply_to'])}
            style={{ ...s.formInput, cursor: 'pointer' }}
          >
            {ALL_APPLY_TO.map((ap) => (
              <option key={ap} value={ap}>
                {applyToLabel(ap)}
              </option>
            ))}
          </select>
        </div>

        {/* Category filter (shown only when apply_to === 'category') */}
        {formApplyTo === 'category' && (
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.categoryFilter}</label>
            <input
              type="text"
              value={formCategoryFilter}
              onChange={(e) => setFormCategoryFilter(e.target.value)}
              placeholder="e.g. Food & Beverages"
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        )}

        {/* Section: Scheduling */}
        <div style={{ marginBottom: 8, marginTop: 8 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.primary,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            <Calendar size={14} color={C.primary} />
            {L.scheduling}
          </div>
        </div>

        {/* Effective From + Until */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>
              {L.effectiveFrom} *
            </label>
            <input
              type="date"
              value={formEffectiveFrom}
              onChange={(e) => setFormEffectiveFrom(e.target.value)}
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
            <label style={s.formLabel}>
              {L.effectiveUntil}{' '}
              <span style={{ fontWeight: 400, color: C.textMuted, fontSize: 11 }}>({L.optional})</span>
            </label>
            <input
              type="date"
              value={formEffectiveUntil}
              onChange={(e) => setFormEffectiveUntil(e.target.value)}
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

        {/* Description */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>
            {L.description}{' '}
            <span style={{ fontWeight: 400, color: C.textMuted, fontSize: 11 }}>({L.optional})</span>
          </label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder={L.description + '...'}
            style={s.formTextarea}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Preview card */}
        {formName && formRate > 0 && (
          <div
            style={{
              backgroundColor: C.primaryLight,
              borderRadius: 10,
              padding: rv(12, 14, 16),
              border: `1px solid ${C.border}`,
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Preview
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{formName}</div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                  {formCode && <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{formCode}</span>}
                  {typeLabel(formType)}
                  {formIsCompound && ' | Compound'}
                  {formIsInclusive && ' | Inclusive'}
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.primary }}>{formRate}%</div>
            </div>
            {/* Example calculation */}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
                Example on {formatCurrency(100, currency)}:
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: 12, color: C.textSecondary }}>Tax: </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {formatCurrency(100 * formRate / 100, currency)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: C.textSecondary }}>Total: </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {formIsInclusive
                      ? formatCurrency(100, currency)
                      : formatCurrency(100 + 100 * formRate / 100, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form footer */}
        <div style={s.formFooter}>
          <button
            style={s.cancelBtnStyle}
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
            disabled={formSaving || !formName.trim() || !formCode.trim() || formRate < 0 || !formEffectiveFrom}
          >
            {formSaving ? 'Saving...' : L.save}
          </button>
        </div>
      </Modal>

      {/* ── View Rate Details Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={viewingRate !== null}
        onClose={() => setViewingRate(null)}
        title={L.viewRate}
        size="lg"
      >
        {viewingRate && (
          <div>
            {/* Visual rate display */}
            <div style={s.rateCircle}>
              <div style={{ fontSize: rv(24, 30, 36), fontWeight: 700, color: C.primary, lineHeight: 1 }}>
                {viewingRate.rate}%
              </div>
              <div style={{ fontSize: rv(10, 11, 12), fontWeight: 500, color: C.textSecondary, marginTop: 4 }}>
                {typeLabel(viewingRate.type)}
              </div>
            </div>

            {/* Header info */}
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
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                  {viewingRate.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.primary,
                      backgroundColor: C.primaryLight,
                      padding: '2px 10px',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                    }}
                  >
                    {viewingRate.code}
                  </span>
                  <span style={s.badge(TYPE_CONFIG[viewingRate.type].color, TYPE_CONFIG[viewingRate.type].bg)}>
                    {typeLabel(viewingRate.type)}
                  </span>
                  <span style={s.badge(STATUS_CONFIG[viewingRate.status].color, STATUS_CONFIG[viewingRate.status].bg)}>
                    {statusLabel(viewingRate.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* General Information Section */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>
                <Receipt size={16} color={C.primary} />
                {L.generalInfo}
              </div>

              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.name}</span>
                <span style={s.detailValue}>{viewingRate.name}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.code}</span>
                <span style={{ ...s.detailValue, fontFamily: 'monospace' }}>{viewingRate.code}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.type}</span>
                <span style={s.badge(TYPE_CONFIG[viewingRate.type].color, TYPE_CONFIG[viewingRate.type].bg)}>
                  {typeLabel(viewingRate.type)}
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.rate}</span>
                <span style={{ ...s.detailValue, fontSize: 16, color: C.primary }}>{viewingRate.rate}%</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.status}</span>
                <span style={s.badge(STATUS_CONFIG[viewingRate.status].color, STATUS_CONFIG[viewingRate.status].bg)}>
                  {statusLabel(viewingRate.status)}
                </span>
              </div>
              {viewingRate.description && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.description}</span>
                  <span style={{ ...s.detailValue, fontWeight: 400, maxWidth: '60%', textAlign: 'right' }}>
                    {viewingRate.description}
                  </span>
                </div>
              )}
            </div>

            {/* Tax Configuration Section */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>
                <BarChart3 size={16} color={C.primary} />
                {L.taxConfig}
              </div>

              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.isCompound}</span>
                <span style={s.detailValue}>
                  {viewingRate.is_compound ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: C.success }}>
                      <CheckCircle size={14} /> {L.compoundYes}
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: C.textMuted }}>
                      <XCircle size={14} /> {L.compoundNo}
                    </span>
                  )}
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.isInclusive}</span>
                <span style={s.detailValue}>
                  {viewingRate.is_inclusive ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: C.success }}>
                      <CheckCircle size={14} /> {L.inclusiveYes}
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: C.textMuted }}>
                      <XCircle size={14} /> {L.inclusiveNo}
                    </span>
                  )}
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.applyTo}</span>
                <span style={s.detailValue}>{applyToLabel(viewingRate.apply_to)}</span>
              </div>
              {viewingRate.apply_to === 'category' && viewingRate.category_filter && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.categoryFilter}</span>
                  <span style={s.detailValue}>{viewingRate.category_filter}</span>
                </div>
              )}
            </div>

            {/* Scheduling Section */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>
                <Calendar size={16} color={C.primary} />
                {L.scheduling}
              </div>

              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.effectiveFrom}</span>
                <span style={s.detailValue}>{formatDate(viewingRate.effective_from)}</span>
              </div>
              {viewingRate.effective_until && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.effectiveUntil}</span>
                  <span style={s.detailValue}>{formatDate(viewingRate.effective_until)}</span>
                </div>
              )}
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.createdAt}</span>
                <span style={{ ...s.detailValue, fontWeight: 400, fontSize: 13 }}>
                  {formatDateTime(viewingRate.created_at)}
                </span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.updatedAt}</span>
                <span style={{ ...s.detailValue, fontWeight: 400, fontSize: 13 }}>
                  {formatDateTime(viewingRate.updated_at)}
                </span>
              </div>
            </div>

            {/* Example calculation box */}
            <div
              style={{
                backgroundColor: C.primaryLight,
                borderRadius: 10,
                padding: rv(14, 16, 20),
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
                {L.rateDisplay}
              </div>

              {/* Examples at multiple price points */}
              <div style={{ display: 'grid', gridTemplateColumns: rv('1fr', '1fr 1fr 1fr', '1fr 1fr 1fr 1fr'), gap: 10 }}>
                {[100, 500, 1000, 5000].map((amount) => {
                  const taxAmount = amount * viewingRate.rate / 100
                  const totalAmount = viewingRate.is_inclusive ? amount : amount + taxAmount
                  return (
                    <div
                      key={amount}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 8,
                        padding: 12,
                        border: `1px solid ${C.border}`,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>
                        {formatCurrency(amount, currency)}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 2 }}>
                        Tax: {formatCurrency(taxAmount, currency)}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>
                        {formatCurrency(totalAmount, currency)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Close footer */}
            <div style={{ ...s.formFooter, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{
                    ...s.addBtn,
                    backgroundColor: C.info,
                    padding: '8px 16px',
                    fontSize: 13,
                  }}
                  onClick={() => {
                    setViewingRate(null)
                    openEditModal(viewingRate)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  <Edit size={14} />
                  {L.editRate}
                </button>
                {viewingRate.status === 'active' ? (
                  <button
                    style={{
                      ...s.addBtn,
                      backgroundColor: C.warning,
                      padding: '8px 16px',
                      fontSize: 13,
                    }}
                    onClick={() => {
                      handleDeactivate(viewingRate.id)
                      setViewingRate(null)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    <XCircle size={14} />
                    {L.deactivate}
                  </button>
                ) : (
                  <button
                    style={{
                      ...s.addBtn,
                      backgroundColor: C.success,
                      padding: '8px 16px',
                      fontSize: 13,
                    }}
                    onClick={() => {
                      handleActivate(viewingRate.id)
                      setViewingRate(null)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    <CheckCircle size={14} />
                    {L.activate}
                  </button>
                )}
              </div>
              <button
                style={s.cancelBtnStyle}
                onClick={() => setViewingRate(null)}
              >
                {L.cancel}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={L.deleteConfirmTitle}
        size="sm"
      >
        <div style={s.deleteModalBody}>
          <div style={s.deleteIcon}>
            <AlertTriangle size={28} color={C.danger} />
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: C.text,
              marginBottom: 8,
            }}
          >
            {L.deleteRate}
          </div>
          <p
            style={{
              fontSize: 14,
              color: C.textSecondary,
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}
          >
            {L.deleteConfirm}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <button
              style={s.cancelBtnStyle}
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
              onClick={() => {
                if (deleteTarget) {
                  handleDelete(deleteTarget)
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={14} />
                {L.delete}
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
