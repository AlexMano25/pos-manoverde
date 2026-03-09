import { useState, useEffect, useMemo } from 'react'
import {
  ShieldCheck,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  Clock,
  Calendar,
  RefreshCw,
  Package,
  User,
  Phone,
  Mail,
  FileText,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useWarrantyStore } from '../stores/warrantyStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { WarrantyClaim, ClaimStatus, ClaimType, WarrantyStatus } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#d97706',
  primaryLight: '#fffbeb',
  primaryDark: '#b45309',
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
  teal: '#0d9488',
  tealBg: '#ccfbf1',
  purple: '#7c3aed',
  purpleBg: '#f5f3ff',
} as const

// ── Claim Status config ──────────────────────────────────────────────────

const CLAIM_STATUS_CONFIG: Record<ClaimStatus, { color: string; bg: string }> = {
  submitted:    { color: '#2563eb', bg: '#eff6ff' },
  under_review: { color: '#f59e0b', bg: '#fffbeb' },
  approved:     { color: '#16a34a', bg: '#f0fdf4' },
  in_repair:    { color: '#ea580c', bg: '#fff7ed' },
  repaired:     { color: '#0d9488', bg: '#ccfbf1' },
  replaced:     { color: '#7c3aed', bg: '#f5f3ff' },
  rejected:     { color: '#dc2626', bg: '#fef2f2' },
  closed:       { color: '#64748b', bg: '#f8fafc' },
}

const ALL_CLAIM_STATUSES: ClaimStatus[] = [
  'submitted', 'under_review', 'approved', 'in_repair',
  'repaired', 'replaced', 'rejected', 'closed',
]

// ── Warranty Status config ───────────────────────────────────────────────

const WARRANTY_STATUS_CONFIG: Record<WarrantyStatus, { color: string; bg: string }> = {
  active:  { color: '#16a34a', bg: '#f0fdf4' },
  expired: { color: '#dc2626', bg: '#fef2f2' },
  claimed: { color: '#ea580c', bg: '#fff7ed' },
  voided:  { color: '#64748b', bg: '#f8fafc' },
}

const ALL_WARRANTY_STATUSES: WarrantyStatus[] = ['active', 'expired', 'claimed', 'voided']

// ── Claim Type config ────────────────────────────────────────────────────

const CLAIM_TYPE_CONFIG: Record<ClaimType, { color: string; bg: string }> = {
  repair:      { color: '#ea580c', bg: '#fff7ed' },
  replacement: { color: '#7c3aed', bg: '#f5f3ff' },
  refund:      { color: '#2563eb', bg: '#eff6ff' },
  exchange:    { color: '#0d9488', bg: '#ccfbf1' },
}

const ALL_CLAIM_TYPES: ClaimType[] = ['repair', 'replacement', 'refund', 'exchange']

// ── Timeline steps ───────────────────────────────────────────────────────

const TIMELINE_STEPS: { key: ClaimStatus; label: string }[] = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'in_repair', label: 'In Repair' },
  { key: 'repaired', label: 'Repaired' },
  { key: 'closed', label: 'Closed' },
]

// ── Component ─────────────────────────────────────────────────────────────

export default function WarrantyPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    claims,
    loading,
    filterStatus,
    loadClaims,
    addClaim,
    updateClaim,
    deleteClaim,
    approveClaim,
    rejectClaim,
    startRepair,
    completeRepair,
    closeClaim,
    markReplaced,
    getActiveClaims,
    getResolvedThisMonth,
    setFilterStatus,
  } = useWarrantyStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n
  const tr = (t as Record<string, any>).warranty || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: tr.title || 'Warranty & SAV',
    subtitle: tr.subtitle || 'After-Sales Service Management',
    addClaim: tr.addClaim || 'New Claim',
    editClaim: tr.editClaim || 'Edit Claim',
    viewClaim: tr.viewClaim || 'Claim Details',
    activeClaims: tr.activeClaims || 'Active Claims',
    resolvedThisMonth: tr.resolvedThisMonth || 'Resolved This Month',
    avgResolution: tr.avgResolution || 'Avg Resolution Days',
    warrantyRate: tr.warrantyRate || 'Warranty Rate',
    claimNumber: tr.claimNumber || 'Claim #',
    customerName: tr.customerName || 'Customer Name',
    customerPhone: tr.customerPhone || 'Phone',
    customerEmail: tr.customerEmail || 'Email',
    productName: tr.productName || 'Product',
    serialNumber: tr.serialNumber || 'Serial Number',
    purchaseDate: tr.purchaseDate || 'Purchase Date',
    warrantyEndDate: tr.warrantyEndDate || 'Warranty End Date',
    warrantyStatus: tr.warrantyStatus || 'Warranty Status',
    claimType: tr.claimType || 'Claim Type',
    claimStatus: tr.claimStatus || 'Claim Status',
    issueDescription: tr.issueDescription || 'Issue Description',
    diagnosis: tr.diagnosis || 'Diagnosis',
    resolution: tr.resolution || 'Resolution',
    repairCost: tr.repairCost || 'Repair Cost',
    coveredByWarranty: tr.coveredByWarranty || 'Covered by Warranty',
    assignedTo: tr.assignedTo || 'Assigned To',
    receivedAt: tr.receivedAt || 'Received At',
    resolvedAt: tr.resolvedAt || 'Resolved At',
    estimatedCompletion: tr.estimatedCompletion || 'Est. Completion',
    replacementProduct: tr.replacementProduct || 'Replacement Product',
    replacementSerial: tr.replacementSerial || 'Replacement Serial',
    notes: tr.notes || 'Notes',
    actions: tr.actions || 'Actions',
    date: tr.date || 'Date',
    allStatuses: tr.allStatuses || 'All Statuses',
    noClaims: tr.noClaims || 'No warranty claims yet',
    noClaimsDesc: tr.noClaimsDesc || 'Start managing warranty claims by adding a new claim.',
    noResults: tr.noResults || 'No claims match your filters',
    noResultsDesc: tr.noResultsDesc || 'Try adjusting the filters or search query.',
    approve: tr.approve || 'Approve',
    reject: tr.reject || 'Reject',
    startRepairBtn: tr.startRepairBtn || 'Start Repair',
    completeRepairBtn: tr.completeRepairBtn || 'Complete Repair',
    markReplacedBtn: tr.markReplacedBtn || 'Mark Replaced',
    closeBtn: tr.closeBtn || 'Close Claim',
    delete: tr.delete || 'Delete',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    claimsCount: tr.claimsCount || 'claims',
    deleteConfirm: tr.deleteConfirm || 'Are you sure you want to delete this warranty claim?',
    timeline: tr.timeline || 'Claim Timeline',
    yes: tr.yes || 'Yes',
    no: tr.no || 'No',
    days: tr.days || 'days',
    customerInfo: tr.customerInfo || 'Customer Information',
    productInfo: tr.productInfo || 'Product Information',
    warrantyInfo: tr.warrantyInfo || 'Warranty Information',
    claimInfo: tr.claimInfo || 'Claim Information',
    repairInfo: tr.repairInfo || 'Repair Information',
    // Claim status labels
    st_submitted: tr.st_submitted || 'Submitted',
    st_under_review: tr.st_under_review || 'Under Review',
    st_approved: tr.st_approved || 'Approved',
    st_in_repair: tr.st_in_repair || 'In Repair',
    st_repaired: tr.st_repaired || 'Repaired',
    st_replaced: tr.st_replaced || 'Replaced',
    st_rejected: tr.st_rejected || 'Rejected',
    st_closed: tr.st_closed || 'Closed',
    // Warranty status labels
    ws_active: tr.ws_active || 'Active',
    ws_expired: tr.ws_expired || 'Expired',
    ws_claimed: tr.ws_claimed || 'Claimed',
    ws_voided: tr.ws_voided || 'Voided',
    // Claim type labels
    ct_repair: tr.ct_repair || 'Repair',
    ct_replacement: tr.ct_replacement || 'Replacement',
    ct_refund: tr.ct_refund || 'Refund',
    ct_exchange: tr.ct_exchange || 'Exchange',
  }

  const claimStatusLabel = (s: ClaimStatus): string =>
    (L as Record<string, string>)[`st_${s}`] || s
  const warrantyStatusLabel = (s: WarrantyStatus): string =>
    (L as Record<string, string>)[`ws_${s}`] || s
  const claimTypeLabel = (ct: ClaimType): string =>
    (L as Record<string, string>)[`ct_${ct}`] || ct

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClaim, setEditingClaim] = useState<WarrantyClaim | null>(null)
  const [viewingClaim, setViewingClaim] = useState<WarrantyClaim | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Action sub-modals
  const [showRepairModal, setShowRepairModal] = useState<string | null>(null)
  const [repairAssignee, setRepairAssignee] = useState('')
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null)
  const [completeResolution, setCompleteResolution] = useState('')
  const [completeCost, setCompleteCost] = useState('')
  const [showReplaceModal, setShowReplaceModal] = useState<string | null>(null)
  const [replaceProduct, setReplaceProduct] = useState('')
  const [replaceSerial, setReplaceSerial] = useState('')

  // Form state
  const [formCustomerName, setFormCustomerName] = useState('')
  const [formCustomerPhone, setFormCustomerPhone] = useState('')
  const [formCustomerEmail, setFormCustomerEmail] = useState('')
  const [formProductName, setFormProductName] = useState('')
  const [formSerialNumber, setFormSerialNumber] = useState('')
  const [formPurchaseDate, setFormPurchaseDate] = useState('')
  const [formWarrantyEndDate, setFormWarrantyEndDate] = useState('')
  const [formWarrantyStatus, setFormWarrantyStatus] = useState<WarrantyStatus>('active')
  const [formClaimType, setFormClaimType] = useState<ClaimType>('repair')
  const [formIssueDescription, setFormIssueDescription] = useState('')
  const [formCoveredByWarranty, setFormCoveredByWarranty] = useState(true)
  const [formNotes, setFormNotes] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // ── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    loadClaims(storeId)
  }, [storeId, loadClaims])

  // ── Filtered and searched claims ────────────────────────────────────

  const filteredClaims = useMemo(() => {
    let result = [...claims]

    if (filterStatus !== 'all') {
      result = result.filter((c) => c.claim_status === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.claim_number.toLowerCase().includes(q) ||
          c.customer_name.toLowerCase().includes(q) ||
          c.product_name.toLowerCase().includes(q) ||
          (c.serial_number && c.serial_number.toLowerCase().includes(q)) ||
          (c.customer_phone && c.customer_phone.toLowerCase().includes(q)) ||
          (c.customer_email && c.customer_email.toLowerCase().includes(q)) ||
          c.issue_description.toLowerCase().includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      )
    }

    return result
  }, [claims, filterStatus, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const activeClaims = getActiveClaims(storeId)
  const resolvedThisMonth = getResolvedThisMonth(storeId)

  const avgResolutionDays = useMemo(() => {
    const resolved = claims.filter(
      (c) =>
        c.store_id === storeId &&
        c.resolved_at &&
        (c.claim_status === 'repaired' ||
          c.claim_status === 'replaced' ||
          c.claim_status === 'closed')
    )
    if (resolved.length === 0) return 0
    const totalDays = resolved.reduce((sum, c) => {
      const start = new Date(c.received_at).getTime()
      const end = new Date(c.resolved_at!).getTime()
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
      return sum + days
    }, 0)
    return Math.round(totalDays / resolved.length)
  }, [claims, storeId])

  const warrantyRatePercent = useMemo(() => {
    const resolved = claims.filter(
      (c) =>
        c.store_id === storeId &&
        (c.claim_status === 'repaired' ||
          c.claim_status === 'replaced' ||
          c.claim_status === 'closed')
    )
    if (resolved.length === 0) return 0
    const covered = resolved.filter((c) => c.covered_by_warranty).length
    return Math.round((covered / resolved.length) * 100)
  }, [claims, storeId])

  // ── Form helpers ──────────────────────────────────────────────────────

  function resetForm() {
    setFormCustomerName('')
    setFormCustomerPhone('')
    setFormCustomerEmail('')
    setFormProductName('')
    setFormSerialNumber('')
    setFormPurchaseDate('')
    setFormWarrantyEndDate('')
    setFormWarrantyStatus('active')
    setFormClaimType('repair')
    setFormIssueDescription('')
    setFormCoveredByWarranty(true)
    setFormNotes('')
    setEditingClaim(null)
  }

  function openAddModal() {
    resetForm()
    setShowModal(true)
  }

  function openEditModal(claim: WarrantyClaim) {
    setEditingClaim(claim)
    setFormCustomerName(claim.customer_name)
    setFormCustomerPhone(claim.customer_phone || '')
    setFormCustomerEmail(claim.customer_email || '')
    setFormProductName(claim.product_name)
    setFormSerialNumber(claim.serial_number || '')
    setFormPurchaseDate(claim.purchase_date ? claim.purchase_date.slice(0, 10) : '')
    setFormWarrantyEndDate(claim.warranty_end_date ? claim.warranty_end_date.slice(0, 10) : '')
    setFormWarrantyStatus(claim.warranty_status)
    setFormClaimType(claim.claim_type)
    setFormIssueDescription(claim.issue_description)
    setFormCoveredByWarranty(claim.covered_by_warranty)
    setFormNotes(claim.notes || '')
    setShowModal(true)
  }

  async function handleSave() {
    if (!formCustomerName.trim() || !formProductName.trim() || !formIssueDescription.trim()) return

    setFormSaving(true)
    try {
      const data = {
        customer_name: formCustomerName.trim(),
        customer_phone: formCustomerPhone.trim() || undefined,
        customer_email: formCustomerEmail.trim() || undefined,
        product_name: formProductName.trim(),
        serial_number: formSerialNumber.trim() || undefined,
        purchase_date: formPurchaseDate ? new Date(formPurchaseDate).toISOString() : undefined,
        warranty_end_date: formWarrantyEndDate
          ? new Date(formWarrantyEndDate).toISOString()
          : undefined,
        warranty_status: formWarrantyStatus,
        claim_type: formClaimType,
        claim_status: 'submitted' as ClaimStatus,
        issue_description: formIssueDescription.trim(),
        covered_by_warranty: formCoveredByWarranty,
        received_at: new Date().toISOString(),
        notes: formNotes.trim() || undefined,
      }

      if (editingClaim) {
        await updateClaim(editingClaim.id, data)
      } else {
        await addClaim(storeId, data)
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[WarrantyPage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteClaim(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[WarrantyPage] Delete error:', error)
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveClaim(id)
    } catch (error) {
      console.error('[WarrantyPage] Approve error:', error)
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectClaim(id)
    } catch (error) {
      console.error('[WarrantyPage] Reject error:', error)
    }
  }

  async function handleStartRepair(id: string) {
    if (!repairAssignee.trim()) return
    try {
      await startRepair(id, userId, repairAssignee.trim())
      setShowRepairModal(null)
      setRepairAssignee('')
    } catch (error) {
      console.error('[WarrantyPage] Start repair error:', error)
    }
  }

  async function handleCompleteRepair(id: string) {
    if (!completeResolution.trim()) return
    try {
      const costValue = completeCost ? parseFloat(completeCost) : undefined
      await completeRepair(id, completeResolution.trim(), costValue)
      setShowCompleteModal(null)
      setCompleteResolution('')
      setCompleteCost('')
    } catch (error) {
      console.error('[WarrantyPage] Complete repair error:', error)
    }
  }

  async function handleMarkReplaced(id: string) {
    if (!replaceProduct.trim()) return
    try {
      await markReplaced(id, replaceProduct.trim(), replaceSerial.trim() || undefined)
      setShowReplaceModal(null)
      setReplaceProduct('')
      setReplaceSerial('')
    } catch (error) {
      console.error('[WarrantyPage] Mark replaced error:', error)
    }
  }

  async function handleCloseClaim(id: string) {
    try {
      await closeClaim(id)
    } catch (error) {
      console.error('[WarrantyPage] Close claim error:', error)
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

  function getTimelineIndex(status: ClaimStatus): number {
    if (status === 'rejected') return -1
    if (status === 'replaced') return 4 // same visual position as 'repaired'
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

    headerLeft: {
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

    // Detail row for view modal
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

    // Section header in view modal
    sectionHeader: {
      fontSize: 14,
      fontWeight: 700,
      color: C.primary,
      marginTop: 20,
      marginBottom: 8,
      paddingBottom: 6,
      borderBottom: `2px solid ${C.primaryLight}`,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
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

    // Toggle switch
    toggleContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as React.CSSProperties,

    toggleSwitch: (active: boolean) =>
      ({
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: active ? C.primary : '#cbd5e1',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        border: 'none',
        padding: 0,
        flexShrink: 0,
      } as React.CSSProperties),

    toggleKnob: (active: boolean) =>
      ({
        width: 18,
        height: 18,
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        position: 'absolute',
        top: 3,
        left: active ? 23 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      } as React.CSSProperties),

    // Workflow button
    workflowBtn: (bgColor: string, textColor: string) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        backgroundColor: bgColor,
        color: textColor,
        border: 'none',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        whiteSpace: 'nowrap',
      } as React.CSSProperties),
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && claims.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <ShieldCheck size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading warranty claims...</div>
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
            <ShieldCheck size={rv(22, 26, 28)} color={C.primary} />
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
          {L.addClaim}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Active Claims */}
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
              <ShieldCheck size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.activeClaims}</span>
          </div>
          <div style={{ ...s.statValue, color: activeClaims.length > 0 ? C.primary : C.text }}>
            {activeClaims.length}
          </div>
        </div>

        {/* Resolved This Month */}
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
            <span style={s.statLabel}>{L.resolvedThisMonth}</span>
          </div>
          <div style={s.statValue}>{resolvedThisMonth.length}</div>
        </div>

        {/* Avg Resolution Days */}
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
              <Clock size={18} color={C.info} />
            </div>
            <span style={s.statLabel}>{L.avgResolution}</span>
          </div>
          <div style={s.statValue}>
            {avgResolutionDays}
            <span style={{ fontSize: 13, fontWeight: 400, color: C.textSecondary, marginLeft: 4 }}>
              {L.days}
            </span>
          </div>
        </div>

        {/* Warranty Rate */}
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
              <AlertTriangle size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.warrantyRate}</span>
          </div>
          <div style={s.statValue}>
            {warrantyRatePercent}
            <span style={{ fontSize: 16, fontWeight: 500, color: C.textSecondary }}>%</span>
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
          onChange={(e) => setFilterStatus(e.target.value as ClaimStatus | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allStatuses}</option>
          {ALL_CLAIM_STATUSES.map((st) => (
            <option key={st} value={st}>
              {claimStatusLabel(st)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Claims list ────────────────────────────────────────────────── */}
      {claims.length === 0 ? (
        /* Empty state - no claims at all */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <ShieldCheck size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noClaims}</h3>
          <p style={s.emptyDesc}>{L.noClaimsDesc}</p>
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
            {L.addClaim}
          </button>
        </div>
      ) : filteredClaims.length === 0 ? (
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
            {filteredClaims.length} {L.claimsCount}
          </div>
          {filteredClaims.map((claim) => {
            const csCfg = CLAIM_STATUS_CONFIG[claim.claim_status]
            const wsCfg = WARRANTY_STATUS_CONFIG[claim.warranty_status]
            const ctCfg = CLAIM_TYPE_CONFIG[claim.claim_type]

            return (
              <div key={claim.id} style={s.mobileCard}>
                {/* Top row: claim number + claim type */}
                <div style={s.mobileCardRow}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                    {claim.claim_number}
                  </span>
                  <span style={s.badge(ctCfg.color, ctCfg.bg)}>
                    {claimTypeLabel(claim.claim_type)}
                  </span>
                </div>

                {/* Customer name */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 4,
                    lineHeight: 1.3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <User size={13} color={C.textMuted} />
                  {claim.customer_name}
                </div>

                {/* Product & serial */}
                <div
                  style={{
                    fontSize: 12,
                    color: C.textSecondary,
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Package size={11} />
                    {claim.product_name}
                  </span>
                  {claim.serial_number && (
                    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      SN: {claim.serial_number}
                    </span>
                  )}
                </div>

                {/* Status badges */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={s.badge(csCfg.color, csCfg.bg)}>
                    {claimStatusLabel(claim.claim_status)}
                  </span>
                  <span style={s.badge(wsCfg.color, wsCfg.bg)}>
                    {warrantyStatusLabel(claim.warranty_status)}
                  </span>
                </div>

                {/* Date & covered */}
                <div
                  style={{
                    fontSize: 12,
                    color: C.textSecondary,
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Calendar size={11} />
                    {formatDate(claim.received_at)}
                  </span>
                  <span
                    style={{
                      color: claim.covered_by_warranty ? C.success : C.danger,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {claim.covered_by_warranty ? L.coveredByWarranty : 'Not Covered'}
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
                    onClick={() => setViewingClaim(claim)}
                    style={{
                      ...s.actionBtn(C.primary),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                    }}
                    title={L.viewClaim}
                  >
                    <Eye size={13} />
                  </button>

                  {(claim.claim_status === 'submitted' || claim.claim_status === 'under_review') && (
                    <button
                      onClick={() => openEditModal(claim)}
                      style={{
                        ...s.actionBtn(C.info),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.editClaim}
                    >
                      <Edit size={13} />
                    </button>
                  )}

                  {claim.claim_status === 'submitted' && (
                    <>
                      <button
                        onClick={() => handleApprove(claim.id)}
                        style={{
                          ...s.actionBtn(C.success),
                          width: 'auto',
                          padding: '5px 10px',
                          fontSize: 12,
                        }}
                        title={L.approve}
                      >
                        <CheckCircle size={13} />
                      </button>
                      <button
                        onClick={() => handleReject(claim.id)}
                        style={{
                          ...s.actionBtn(C.danger),
                          width: 'auto',
                          padding: '5px 10px',
                          fontSize: 12,
                        }}
                        title={L.reject}
                      >
                        <XCircle size={13} />
                      </button>
                    </>
                  )}

                  {claim.claim_status === 'approved' && (
                    <button
                      onClick={() => {
                        setRepairAssignee(userName)
                        setShowRepairModal(claim.id)
                      }}
                      style={{
                        ...s.actionBtn(C.warning),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.startRepairBtn}
                    >
                      <Wrench size={13} />
                    </button>
                  )}

                  {claim.claim_status === 'in_repair' && (
                    <>
                      <button
                        onClick={() => {
                          setCompleteResolution('')
                          setCompleteCost('')
                          setShowCompleteModal(claim.id)
                        }}
                        style={{
                          ...s.actionBtn(C.teal),
                          width: 'auto',
                          padding: '5px 10px',
                          fontSize: 12,
                        }}
                        title={L.completeRepairBtn}
                      >
                        <CheckCircle size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setReplaceProduct('')
                          setReplaceSerial('')
                          setShowReplaceModal(claim.id)
                        }}
                        style={{
                          ...s.actionBtn(C.purple),
                          width: 'auto',
                          padding: '5px 10px',
                          fontSize: 12,
                        }}
                        title={L.markReplacedBtn}
                      >
                        <RefreshCw size={13} />
                      </button>
                    </>
                  )}

                  {(claim.claim_status === 'repaired' || claim.claim_status === 'replaced') && (
                    <button
                      onClick={() => handleCloseClaim(claim.id)}
                      style={{
                        ...s.actionBtn(C.textSecondary),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.closeBtn}
                    >
                      <FileText size={13} />
                    </button>
                  )}

                  {(claim.claim_status === 'submitted' ||
                    claim.claim_status === 'rejected' ||
                    claim.claim_status === 'closed') && (
                    <button
                      onClick={() => setDeleteTarget(claim.id)}
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
            {filteredClaims.length} {L.claimsCount}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{L.claimNumber}</th>
                  <th style={s.th}>{L.customerName}</th>
                  <th style={s.th}>{L.productName}</th>
                  <th style={s.th}>{L.claimType}</th>
                  <th style={s.th}>{L.claimStatus}</th>
                  <th style={s.th}>{L.warrantyStatus}</th>
                  <th style={s.th}>{L.date}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => {
                  const csCfg = CLAIM_STATUS_CONFIG[claim.claim_status]
                  const wsCfg = WARRANTY_STATUS_CONFIG[claim.warranty_status]
                  const ctCfg = CLAIM_TYPE_CONFIG[claim.claim_type]

                  return (
                    <tr
                      key={claim.id}
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
                          {claim.claim_number}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 500 }}>{claim.customer_name}</div>
                        {claim.customer_phone && (
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                            {claim.customer_phone}
                          </div>
                        )}
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 500 }}>{claim.product_name}</div>
                        {claim.serial_number && (
                          <div
                            style={{
                              fontSize: 11,
                              color: C.textMuted,
                              marginTop: 2,
                              fontFamily: 'monospace',
                            }}
                          >
                            SN: {claim.serial_number}
                          </div>
                        )}
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(ctCfg.color, ctCfg.bg)}>
                          {claimTypeLabel(claim.claim_type)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(csCfg.color, csCfg.bg)}>
                          {claimStatusLabel(claim.claim_status)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(wsCfg.color, wsCfg.bg)}>
                          {warrantyStatusLabel(claim.warranty_status)}
                        </span>
                      </td>
                      <td
                        style={{
                          ...s.td,
                          whiteSpace: 'nowrap',
                          fontSize: 13,
                          color: C.textSecondary,
                        }}
                      >
                        {formatDate(claim.received_at)}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                          }}
                        >
                          {/* View */}
                          <button
                            onClick={() => setViewingClaim(claim)}
                            style={s.actionBtn(C.primary)}
                            title={L.viewClaim}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.primaryLight
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit (submitted/under_review only) */}
                          {(claim.claim_status === 'submitted' ||
                            claim.claim_status === 'under_review') && (
                            <button
                              onClick={() => openEditModal(claim)}
                              style={s.actionBtn(C.info)}
                              title={L.editClaim}
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

                          {/* Approve (submitted) */}
                          {claim.claim_status === 'submitted' && (
                            <button
                              onClick={() => handleApprove(claim.id)}
                              style={s.actionBtn(C.success)}
                              title={L.approve}
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

                          {/* Reject (submitted) */}
                          {claim.claim_status === 'submitted' && (
                            <button
                              onClick={() => handleReject(claim.id)}
                              style={s.actionBtn(C.danger)}
                              title={L.reject}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.dangerBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <XCircle size={15} />
                            </button>
                          )}

                          {/* Start Repair (approved) */}
                          {claim.claim_status === 'approved' && (
                            <button
                              onClick={() => {
                                setRepairAssignee(userName)
                                setShowRepairModal(claim.id)
                              }}
                              style={s.actionBtn(C.warning)}
                              title={L.startRepairBtn}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.warningBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Wrench size={15} />
                            </button>
                          )}

                          {/* Complete Repair (in_repair) */}
                          {claim.claim_status === 'in_repair' && (
                            <button
                              onClick={() => {
                                setCompleteResolution('')
                                setCompleteCost('')
                                setShowCompleteModal(claim.id)
                              }}
                              style={s.actionBtn(C.teal)}
                              title={L.completeRepairBtn}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.tealBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}

                          {/* Mark Replaced (in_repair) */}
                          {claim.claim_status === 'in_repair' && (
                            <button
                              onClick={() => {
                                setReplaceProduct('')
                                setReplaceSerial('')
                                setShowReplaceModal(claim.id)
                              }}
                              style={s.actionBtn(C.purple)}
                              title={L.markReplacedBtn}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.purpleBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}

                          {/* Close Claim (repaired/replaced) */}
                          {(claim.claim_status === 'repaired' ||
                            claim.claim_status === 'replaced') && (
                            <button
                              onClick={() => handleCloseClaim(claim.id)}
                              style={s.actionBtn(C.textSecondary)}
                              title={L.closeBtn}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f1f5f9'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <FileText size={15} />
                            </button>
                          )}

                          {/* Delete (submitted/rejected/closed) */}
                          {(claim.claim_status === 'submitted' ||
                            claim.claim_status === 'rejected' ||
                            claim.claim_status === 'closed') && (
                            <button
                              onClick={() => setDeleteTarget(claim.id)}
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

      {/* ── Add / Edit Claim Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingClaim ? L.editClaim : L.addClaim}
        size="lg"
      >
        {/* Section: Customer Information */}
        <div style={s.sectionHeader}>
          <User size={16} />
          {L.customerInfo}
        </div>

        {/* Customer Name */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.customerName} *</label>
          <input
            type="text"
            value={formCustomerName}
            onChange={(e) => setFormCustomerName(e.target.value)}
            placeholder={L.customerName + '...'}
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Phone & Email */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.customerPhone}</label>
            <input
              type="tel"
              value={formCustomerPhone}
              onChange={(e) => setFormCustomerPhone(e.target.value)}
              placeholder={L.customerPhone + '...'}
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
            <label style={s.formLabel}>{L.customerEmail}</label>
            <input
              type="email"
              value={formCustomerEmail}
              onChange={(e) => setFormCustomerEmail(e.target.value)}
              placeholder={L.customerEmail + '...'}
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

        {/* Section: Product Information */}
        <div style={s.sectionHeader}>
          <Package size={16} />
          {L.productInfo}
        </div>

        {/* Product Name & Serial */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.productName} *</label>
            <input
              type="text"
              value={formProductName}
              onChange={(e) => setFormProductName(e.target.value)}
              placeholder={L.productName + '...'}
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
            <label style={s.formLabel}>{L.serialNumber}</label>
            <input
              type="text"
              value={formSerialNumber}
              onChange={(e) => setFormSerialNumber(e.target.value)}
              placeholder={L.serialNumber + '...'}
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

        {/* Purchase Date & Warranty End Date */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.purchaseDate}</label>
            <input
              type="date"
              value={formPurchaseDate}
              onChange={(e) => setFormPurchaseDate(e.target.value)}
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
            <label style={s.formLabel}>{L.warrantyEndDate}</label>
            <input
              type="date"
              value={formWarrantyEndDate}
              onChange={(e) => setFormWarrantyEndDate(e.target.value)}
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

        {/* Section: Claim Details */}
        <div style={s.sectionHeader}>
          <FileText size={16} />
          {L.claimInfo}
        </div>

        {/* Warranty Status & Claim Type */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.warrantyStatus}</label>
            <select
              value={formWarrantyStatus}
              onChange={(e) => setFormWarrantyStatus(e.target.value as WarrantyStatus)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_WARRANTY_STATUSES.map((ws) => (
                <option key={ws} value={ws}>
                  {warrantyStatusLabel(ws)}
                </option>
              ))}
            </select>
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.claimType}</label>
            <select
              value={formClaimType}
              onChange={(e) => setFormClaimType(e.target.value as ClaimType)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_CLAIM_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {claimTypeLabel(ct)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Issue Description */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.issueDescription} *</label>
          <textarea
            value={formIssueDescription}
            onChange={(e) => setFormIssueDescription(e.target.value)}
            placeholder={L.issueDescription + '...'}
            style={s.formTextarea}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Covered by Warranty toggle */}
        <div style={{ ...s.formGroup, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ ...s.formLabel, marginBottom: 0 }}>{L.coveredByWarranty}</label>
          <div style={s.toggleContainer}>
            <button
              type="button"
              style={s.toggleSwitch(formCoveredByWarranty)}
              onClick={() => setFormCoveredByWarranty(!formCoveredByWarranty)}
            >
              <div style={s.toggleKnob(formCoveredByWarranty)} />
            </button>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: formCoveredByWarranty ? C.success : C.danger,
              }}
            >
              {formCoveredByWarranty ? L.yes : L.no}
            </span>
          </div>
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
            {L.cancel}
          </button>
          <button
            style={s.saveBtn}
            onClick={handleSave}
            disabled={
              formSaving ||
              !formCustomerName.trim() ||
              !formProductName.trim() ||
              !formIssueDescription.trim()
            }
          >
            {formSaving ? 'Saving...' : L.save}
          </button>
        </div>
      </Modal>

      {/* ── View Claim Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={viewingClaim !== null}
        onClose={() => setViewingClaim(null)}
        title={L.viewClaim}
        size="lg"
      >
        {viewingClaim &&
          (() => {
            const vc = viewingClaim
            const vcCS = CLAIM_STATUS_CONFIG[vc.claim_status]
            const vcWS = WARRANTY_STATUS_CONFIG[vc.warranty_status]
            const vcCT = CLAIM_TYPE_CONFIG[vc.claim_type]
            const tlIdx = getTimelineIndex(vc.claim_status)

            return (
              <div>
                {/* Header badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  <span style={s.badge(vcCT.color, vcCT.bg)}>
                    {claimTypeLabel(vc.claim_type)}
                  </span>
                  <span style={s.badge(vcCS.color, vcCS.bg)}>
                    {claimStatusLabel(vc.claim_status)}
                  </span>
                  <span style={s.badge(vcWS.color, vcWS.bg)}>
                    {warrantyStatusLabel(vc.warranty_status)}
                  </span>
                  {vc.covered_by_warranty && (
                    <span style={s.badge(C.success, C.successBg)}>
                      <ShieldCheck size={10} />
                      {L.coveredByWarranty}
                    </span>
                  )}
                </div>

                {/* ── Timeline ──────────────────────────────────────────────── */}
                <div
                  style={{
                    marginBottom: 24,
                    padding: 16,
                    backgroundColor: '#f8fafc',
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.text,
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Clock size={14} color={C.primary} />
                    {L.timeline}
                  </div>

                  {vc.claim_status === 'rejected' ? (
                    /* Rejected timeline */
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: C.info,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CheckCircle size={12} color="#fff" />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.info }}>
                          {L.st_submitted}
                        </span>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          backgroundColor: C.danger,
                          minWidth: 20,
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: C.danger,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <XCircle size={12} color="#fff" />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.danger }}>
                          {L.st_rejected}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Normal timeline */
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0,
                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                      }}
                    >
                      {TIMELINE_STEPS.map((step, i) => {
                        const isCompleted = i <= tlIdx
                        const isCurrent = i === tlIdx
                        const stepColor = isCompleted
                          ? C.primary
                          : C.textMuted

                        return (
                          <div
                            key={step.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              flex: i < TIMELINE_STEPS.length - 1 ? 1 : 'none',
                              minWidth: isMobile ? '30%' : 'auto',
                              marginBottom: isMobile ? 8 : 0,
                            }}
                          >
                            {/* Step circle */}
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <div
                                style={{
                                  width: isCurrent ? 28 : 22,
                                  height: isCurrent ? 28 : 22,
                                  borderRadius: '50%',
                                  backgroundColor: isCompleted ? stepColor : '#e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s',
                                  boxShadow: isCurrent
                                    ? `0 0 0 3px ${C.primaryLight}`
                                    : 'none',
                                }}
                              >
                                {isCompleted ? (
                                  <CheckCircle size={isCurrent ? 14 : 12} color="#fff" />
                                ) : (
                                  <div
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      backgroundColor: '#94a3b8',
                                    }}
                                  />
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: isCurrent ? 700 : 500,
                                  color: isCompleted ? C.text : C.textMuted,
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {step.label}
                              </span>
                            </div>

                            {/* Connector line */}
                            {i < TIMELINE_STEPS.length - 1 && !isMobile && (
                              <div
                                style={{
                                  flex: 1,
                                  height: 2,
                                  backgroundColor: i < tlIdx ? C.primary : '#e2e8f0',
                                  marginLeft: 4,
                                  marginRight: 4,
                                  marginBottom: 18,
                                }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── Claim Info ────────────────────────────────────────────── */}
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.claimNumber}</span>
                  <span style={{ ...s.detailValue, fontWeight: 700, color: C.primary }}>
                    {vc.claim_number}
                  </span>
                </div>

                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.receivedAt}</span>
                  <span style={s.detailValue}>{formatDateTime(vc.received_at)}</span>
                </div>

                {/* ── Customer Info ─────────────────────────────────────────── */}
                <div style={s.sectionHeader}>
                  <User size={16} />
                  {L.customerInfo}
                </div>

                <div style={s.detailRow}>
                  <span style={s.detailLabel}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} />
                      {L.customerName}
                    </span>
                  </span>
                  <span style={s.detailValue}>{vc.customer_name}</span>
                </div>

                {vc.customer_phone && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} />
                        {L.customerPhone}
                      </span>
                    </span>
                    <span style={s.detailValue}>{vc.customer_phone}</span>
                  </div>
                )}

                {vc.customer_email && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} />
                        {L.customerEmail}
                      </span>
                    </span>
                    <span style={s.detailValue}>{vc.customer_email}</span>
                  </div>
                )}

                {/* ── Product Info ──────────────────────────────────────────── */}
                <div style={s.sectionHeader}>
                  <Package size={16} />
                  {L.productInfo}
                </div>

                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.productName}</span>
                  <span style={s.detailValue}>{vc.product_name}</span>
                </div>

                {vc.serial_number && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.serialNumber}</span>
                    <span style={{ ...s.detailValue, fontFamily: 'monospace' }}>
                      {vc.serial_number}
                    </span>
                  </div>
                )}

                {vc.purchase_date && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.purchaseDate}</span>
                    <span style={s.detailValue}>{formatDate(vc.purchase_date)}</span>
                  </div>
                )}

                {/* ── Warranty Info ──────────────────────────────────────────── */}
                <div style={s.sectionHeader}>
                  <ShieldCheck size={16} />
                  {L.warrantyInfo}
                </div>

                {vc.warranty_end_date && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.warrantyEndDate}</span>
                    <span
                      style={{
                        ...s.detailValue,
                        color:
                          new Date(vc.warranty_end_date) < new Date()
                            ? C.danger
                            : C.success,
                        fontWeight: 600,
                      }}
                    >
                      {formatDate(vc.warranty_end_date)}
                    </span>
                  </div>
                )}

                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.warrantyStatus}</span>
                  <span style={s.badge(vcWS.color, vcWS.bg)}>
                    {warrantyStatusLabel(vc.warranty_status)}
                  </span>
                </div>

                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.coveredByWarranty}</span>
                  <span
                    style={{
                      ...s.detailValue,
                      fontWeight: 600,
                      color: vc.covered_by_warranty ? C.success : C.danger,
                    }}
                  >
                    {vc.covered_by_warranty ? L.yes : L.no}
                  </span>
                </div>

                {/* ── Issue & Resolution ─────────────────────────────────────── */}
                <div style={s.sectionHeader}>
                  <Wrench size={16} />
                  {L.repairInfo}
                </div>

                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.issueDescription}</span>
                  <span style={{ ...s.detailValue, textAlign: 'left', flex: 1 }}>
                    {vc.issue_description}
                  </span>
                </div>

                {vc.diagnosis && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.diagnosis}</span>
                    <span style={{ ...s.detailValue, textAlign: 'left', flex: 1 }}>
                      {vc.diagnosis}
                    </span>
                  </div>
                )}

                {vc.resolution && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.resolution}</span>
                    <span style={{ ...s.detailValue, textAlign: 'left', flex: 1 }}>
                      {vc.resolution}
                    </span>
                  </div>
                )}

                {vc.repair_cost !== undefined && vc.repair_cost > 0 && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.repairCost}</span>
                    <span style={{ ...s.detailValue, fontWeight: 700 }}>
                      {formatCurrency(vc.repair_cost, currency)}
                    </span>
                  </div>
                )}

                {vc.assigned_to_name && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.assignedTo}</span>
                    <span style={s.detailValue}>{vc.assigned_to_name}</span>
                  </div>
                )}

                {vc.estimated_completion && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.estimatedCompletion}</span>
                    <span style={s.detailValue}>{formatDate(vc.estimated_completion)}</span>
                  </div>
                )}

                {vc.resolved_at && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.resolvedAt}</span>
                    <span style={s.detailValue}>{formatDateTime(vc.resolved_at)}</span>
                  </div>
                )}

                {vc.replacement_product_id && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.replacementProduct}</span>
                    <span style={s.detailValue}>{vc.replacement_product_id}</span>
                  </div>
                )}

                {vc.replacement_serial && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.replacementSerial}</span>
                    <span style={{ ...s.detailValue, fontFamily: 'monospace' }}>
                      {vc.replacement_serial}
                    </span>
                  </div>
                )}

                {vc.notes && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.notes}</span>
                    <span style={{ ...s.detailValue, textAlign: 'left', flex: 1 }}>
                      {vc.notes}
                    </span>
                  </div>
                )}

                {/* ── Workflow action buttons ─────────────────────────────── */}
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: `2px solid ${C.border}`,
                    flexWrap: 'wrap',
                  }}
                >
                  {vc.claim_status === 'submitted' && (
                    <>
                      <button
                        style={s.workflowBtn(C.successBg, C.success)}
                        onClick={() => {
                          handleApprove(vc.id)
                          setViewingClaim(null)
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1'
                        }}
                      >
                        <CheckCircle size={14} />
                        {L.approve}
                      </button>
                      <button
                        style={s.workflowBtn(C.dangerBg, C.danger)}
                        onClick={() => {
                          handleReject(vc.id)
                          setViewingClaim(null)
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1'
                        }}
                      >
                        <XCircle size={14} />
                        {L.reject}
                      </button>
                    </>
                  )}

                  {vc.claim_status === 'approved' && (
                    <button
                      style={s.workflowBtn(C.warningBg, C.warning)}
                      onClick={() => {
                        setRepairAssignee(userName)
                        setShowRepairModal(vc.id)
                        setViewingClaim(null)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                    >
                      <Wrench size={14} />
                      {L.startRepairBtn}
                    </button>
                  )}

                  {vc.claim_status === 'in_repair' && (
                    <>
                      <button
                        style={s.workflowBtn(C.tealBg, C.teal)}
                        onClick={() => {
                          setCompleteResolution('')
                          setCompleteCost('')
                          setShowCompleteModal(vc.id)
                          setViewingClaim(null)
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1'
                        }}
                      >
                        <CheckCircle size={14} />
                        {L.completeRepairBtn}
                      </button>
                      <button
                        style={s.workflowBtn(C.purpleBg, C.purple)}
                        onClick={() => {
                          setReplaceProduct('')
                          setReplaceSerial('')
                          setShowReplaceModal(vc.id)
                          setViewingClaim(null)
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1'
                        }}
                      >
                        <RefreshCw size={14} />
                        {L.markReplacedBtn}
                      </button>
                    </>
                  )}

                  {(vc.claim_status === 'repaired' || vc.claim_status === 'replaced') && (
                    <button
                      style={s.workflowBtn('#f1f5f9', C.textSecondary)}
                      onClick={() => {
                        handleCloseClaim(vc.id)
                        setViewingClaim(null)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                    >
                      <FileText size={14} />
                      {L.closeBtn}
                    </button>
                  )}
                </div>
              </div>
            )
          })()}
      </Modal>

      {/* ── Start Repair Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={showRepairModal !== null}
        onClose={() => {
          setShowRepairModal(null)
          setRepairAssignee('')
        }}
        title={L.startRepairBtn}
        size="sm"
      >
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.assignedTo} *</label>
          <input
            type="text"
            value={repairAssignee}
            onChange={(e) => setRepairAssignee(e.target.value)}
            placeholder={L.assignedTo + '...'}
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>
        <div style={s.formFooter}>
          <button
            style={s.cancelBtn}
            onClick={() => {
              setShowRepairModal(null)
              setRepairAssignee('')
            }}
          >
            {L.cancel}
          </button>
          <button
            style={{
              ...s.saveBtn,
              backgroundColor: C.warning,
              opacity: !repairAssignee.trim() ? 0.5 : 1,
            }}
            onClick={() => showRepairModal && handleStartRepair(showRepairModal)}
            disabled={!repairAssignee.trim()}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wrench size={14} />
              {L.startRepairBtn}
            </span>
          </button>
        </div>
      </Modal>

      {/* ── Complete Repair Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showCompleteModal !== null}
        onClose={() => {
          setShowCompleteModal(null)
          setCompleteResolution('')
          setCompleteCost('')
        }}
        title={L.completeRepairBtn}
        size="md"
      >
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.resolution} *</label>
          <textarea
            value={completeResolution}
            onChange={(e) => setCompleteResolution(e.target.value)}
            placeholder={L.resolution + '...'}
            style={s.formTextarea}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.repairCost}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={completeCost}
            onChange={(e) => setCompleteCost(e.target.value)}
            placeholder="0.00"
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        <div style={s.formFooter}>
          <button
            style={s.cancelBtn}
            onClick={() => {
              setShowCompleteModal(null)
              setCompleteResolution('')
              setCompleteCost('')
            }}
          >
            {L.cancel}
          </button>
          <button
            style={{
              ...s.saveBtn,
              backgroundColor: C.teal,
              opacity: !completeResolution.trim() ? 0.5 : 1,
            }}
            onClick={() => showCompleteModal && handleCompleteRepair(showCompleteModal)}
            disabled={!completeResolution.trim()}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} />
              {L.completeRepairBtn}
            </span>
          </button>
        </div>
      </Modal>

      {/* ── Mark Replaced Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={showReplaceModal !== null}
        onClose={() => {
          setShowReplaceModal(null)
          setReplaceProduct('')
          setReplaceSerial('')
        }}
        title={L.markReplacedBtn}
        size="md"
      >
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.replacementProduct} *</label>
          <input
            type="text"
            value={replaceProduct}
            onChange={(e) => setReplaceProduct(e.target.value)}
            placeholder={L.replacementProduct + '...'}
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
          <label style={s.formLabel}>{L.replacementSerial}</label>
          <input
            type="text"
            value={replaceSerial}
            onChange={(e) => setReplaceSerial(e.target.value)}
            placeholder={L.replacementSerial + '...'}
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        <div style={s.formFooter}>
          <button
            style={s.cancelBtn}
            onClick={() => {
              setShowReplaceModal(null)
              setReplaceProduct('')
              setReplaceSerial('')
            }}
          >
            {L.cancel}
          </button>
          <button
            style={{
              ...s.saveBtn,
              backgroundColor: C.purple,
              opacity: !replaceProduct.trim() ? 0.5 : 1,
            }}
            onClick={() => showReplaceModal && handleMarkReplaced(showReplaceModal)}
            disabled={!replaceProduct.trim()}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} />
              {L.markReplacedBtn}
            </span>
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={L.delete}
        size="sm"
      >
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <AlertTriangle
            size={40}
            color={C.danger}
            style={{ marginBottom: 12 }}
          />
          <p style={{ fontSize: 15, color: C.text, margin: 0, lineHeight: 1.5 }}>
            {L.deleteConfirm}
          </p>
        </div>
        <div style={s.formFooter}>
          <button style={s.cancelBtn} onClick={() => setDeleteTarget(null)}>
            {L.cancel}
          </button>
          <button
            style={{ ...s.saveBtn, backgroundColor: C.danger }}
            onClick={() => deleteTarget && handleDelete(deleteTarget)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={14} />
              {L.delete}
            </span>
          </button>
        </div>
      </Modal>
    </div>
  )
}
