import React, { useState, useEffect, useMemo } from 'react'
import {
  Banknote,
  Plus,
  Search,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Percent,
  Clock,
  FileText,
  Loader2,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { usePayrollStore } from '../stores/payrollStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { db } from '../db/dexie'
import type { PayrollEntry, PayrollStatus, CommissionRule, CommissionType, PaymentMethod, User } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#0284c7',
  primaryLight: '#38bdf8',
  primaryDark: '#0369a1',
  primaryBg: '#e0f2fe',
  primaryBgHover: '#bae6fd',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  draftBg: '#f1f5f9',
  draftText: '#64748b',
  approvedBg: '#dcfce7',
  approvedText: '#16a34a',
  paidBg: '#e0f2fe',
  paidText: '#0284c7',
} as const

// ── Tabs ────────────────────────────────────────────────────────────────

type Tab = 'payroll' | 'commissions'

// ── i18n labels ─────────────────────────────────────────────────────────

function useLabels() {
  const { t } = useLanguageStore()
  const pt = (t as Record<string, any>).payroll || {}
  return {
    title: pt.title || 'Payroll & Commissions',
    totalPayroll: pt.totalPayroll || 'Total Payroll This Month',
    pendingPayments: pt.pendingPayments || 'Pending Payments',
    paidThisMonth: pt.paidThisMonth || 'Paid This Month',
    averageNetPay: pt.averageNetPay || 'Average Net Pay',
    payroll: pt.payroll || 'Payroll',
    commissions: pt.commissions || 'Commissions',
    all: pt.all || 'All',
    draft: pt.draft || 'Draft',
    approved: pt.approved || 'Approved',
    paid: pt.paid || 'Paid',
    employee: pt.employee || 'Employee',
    period: pt.period || 'Period',
    baseSalary: pt.baseSalary || 'Base Salary',
    overtime: pt.overtime || 'Overtime',
    commissionCol: pt.commissionCol || 'Commission',
    tips: pt.tips || 'Tips',
    bonuses: pt.bonuses || 'Bonuses',
    deductions: pt.deductions || 'Deductions',
    netPay: pt.netPay || 'Net Pay',
    status: pt.status || 'Status',
    actions: pt.actions || 'Actions',
    edit: pt.edit || 'Edit',
    approve: pt.approve || 'Approve',
    markPaid: pt.markPaid || 'Mark Paid',
    generatePayslip: pt.generatePayslip || 'Generate Payslip',
    delete: pt.delete || 'Delete',
    addPayroll: pt.addPayroll || 'Add Payroll Entry',
    editPayroll: pt.editPayroll || 'Edit Payroll Entry',
    addCommission: pt.addCommission || 'Add Commission Rule',
    editCommission: pt.editCommission || 'Edit Commission Rule',
    name: pt.name || 'Name',
    type: pt.type || 'Type',
    value: pt.value || 'Value',
    minSales: pt.minSales || 'Min Sales',
    categories: pt.categories || 'Categories',
    active: pt.active || 'Active',
    inactive: pt.inactive || 'Inactive',
    percentage: pt.percentage || 'Percentage',
    fixedPerSale: pt.fixedPerSale || 'Fixed Per Sale',
    tiered: pt.tiered || 'Tiered',
    save: pt.save || 'Save',
    cancel: pt.cancel || 'Cancel',
    noEntries: pt.noEntries || 'No payroll entries found',
    noRules: pt.noRules || 'No commission rules found',
    periodStart: pt.periodStart || 'Period Start',
    periodEnd: pt.periodEnd || 'Period End',
    hoursWorked: pt.hoursWorked || 'Hours Worked',
    overtimeHours: pt.overtimeHours || 'Overtime Hours',
    overtimePay: pt.overtimePay || 'Overtime Pay',
    commissionTotal: pt.commissionTotal || 'Commission Total',
    tipsTotal: pt.tipsTotal || 'Tips Total',
    paymentMethod: pt.paymentMethod || 'Payment Method',
    notes: pt.notes || 'Notes',
    productCategories: pt.productCategories || 'Product Categories',
    isActive: pt.isActive || 'Active',
    search: pt.search || 'Search...',
    allEmployees: pt.allEmployees || 'All Employees',
    confirmDelete: pt.confirmDelete || 'Are you sure you want to delete this entry?',
    confirmDeleteRule: pt.confirmDeleteRule || 'Are you sure you want to delete this rule?',
    loading: pt.loading || 'Loading...',
    cash: pt.cash || 'Cash',
    card: pt.card || 'Card',
    momo: pt.momo || 'Mobile Money',
    transfer: pt.transfer || 'Transfer',
    orangeMoney: pt.orangeMoney || 'Orange Money',
    mtnMoney: pt.mtnMoney || 'MTN Money',
    carteBancaire: pt.carteBancaire || 'Bank Card',
    paypal: pt.paypal || 'PayPal',
    selectEmployee: pt.selectEmployee || 'Select Employee',
    selectPaymentMethod: pt.selectPaymentMethod || 'Select Payment Method',
    selectType: pt.selectType || 'Select Type',
    categoriesHint: pt.categoriesHint || 'Comma-separated category names',
  }
}

// ── Payment method labels ───────────────────────────────────────────────

const PAYMENT_METHODS: { value: PaymentMethod; key: string }[] = [
  { value: 'cash', key: 'cash' },
  { value: 'card', key: 'card' },
  { value: 'momo', key: 'momo' },
  { value: 'transfer', key: 'transfer' },
  { value: 'orange_money', key: 'orangeMoney' },
  { value: 'mtn_money', key: 'mtnMoney' },
  { value: 'carte_bancaire', key: 'carteBancaire' },
  { value: 'paypal', key: 'paypal' },
]

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

// ── Empty state payroll entry ───────────────────────────────────────────

function emptyPayrollForm(): Omit<PayrollEntry, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'> {
  const range = getCurrentMonthRange()
  return {
    user_id: '',
    user_name: '',
    period_start: range.start,
    period_end: range.end,
    base_salary: 0,
    hours_worked: 0,
    overtime_hours: 0,
    overtime_pay: 0,
    commission_total: 0,
    tips_total: 0,
    bonuses: 0,
    deductions: 0,
    net_pay: 0,
    status: 'draft',
    payment_method: undefined,
    notes: '',
  }
}

// ── Empty commission rule ───────────────────────────────────────────────

function emptyCommissionForm(): Omit<CommissionRule, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'> {
  return {
    name: '',
    type: 'percentage',
    value: 0,
    min_sales: 0,
    product_categories: [],
    is_active: true,
  }
}

// ── Component ───────────────────────────────────────────────────────────

export default function PayrollPage() {
  const { currentStore } = useAppStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const L = useLabels()

  const {
    entries,
    commissionRules,
    loading,
    filterStatus,
    loadEntries,
    loadCommissionRules,
    addEntry,
    updateEntry,
    deleteEntry,
    approveEntry,
    markPaid,
    addCommissionRule,
    updateCommissionRule,
    deleteCommissionRule,
    setFilterStatus,
  } = usePayrollStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'

  // ── Local state ─────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<Tab>('payroll')
  const [searchQuery, setSearchQuery] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [employees, setEmployees] = useState<User[]>([])

  // Payroll modal
  const [showPayrollModal, setShowPayrollModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null)
  const [payrollForm, setPayrollForm] = useState(emptyPayrollForm())

  // Commission modal
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null)
  const [commissionForm, setCommissionForm] = useState(emptyCommissionForm())
  const [categoriesInput, setCategoriesInput] = useState('')

  // Mark paid modal
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false)
  const [markPaidEntryId, setMarkPaidEntryId] = useState<string | null>(null)
  const [markPaidMethod, setMarkPaidMethod] = useState<PaymentMethod>('cash')

  // ── Load data on mount ──────────────────────────────────────────────

  useEffect(() => {
    loadEntries(storeId)
    loadCommissionRules(storeId)
  }, [storeId, loadEntries, loadCommissionRules])

  // Load employees list
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const users = await db.users.where('store_id').equals(storeId).toArray()
        setEmployees(users.filter((u) => u.is_active))
      } catch {
        setEmployees([])
      }
    }
    fetchEmployees()
  }, [storeId])

  // ── Auto-calculate net pay ──────────────────────────────────────────

  useEffect(() => {
    const net =
      payrollForm.base_salary +
      payrollForm.overtime_pay +
      payrollForm.commission_total +
      payrollForm.tips_total +
      payrollForm.bonuses -
      payrollForm.deductions
    setPayrollForm((prev) => ({ ...prev, net_pay: Math.max(0, net) }))
  }, [
    payrollForm.base_salary,
    payrollForm.overtime_pay,
    payrollForm.commission_total,
    payrollForm.tips_total,
    payrollForm.bonuses,
    payrollForm.deductions,
  ])

  // ── Stats ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const monthRange = getCurrentMonthRange()
    const monthEntries = entries.filter(
      (e) => e.period_start >= monthRange.start && e.period_start <= monthRange.end
    )

    const totalPayroll = monthEntries.reduce((sum, e) => sum + e.net_pay, 0)
    const pendingCount = entries.filter((e) => e.status === 'draft' || e.status === 'approved').length
    const paidThisMonth = monthEntries
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + e.net_pay, 0)
    const avgNetPay = monthEntries.length > 0 ? totalPayroll / monthEntries.length : 0

    return { totalPayroll, pendingCount, paidThisMonth, avgNetPay }
  }, [entries])

  // ── Filtered entries ────────────────────────────────────────────────

  const filteredEntries = useMemo(() => {
    let result = entries

    if (filterStatus !== 'all') {
      result = result.filter((e) => e.status === filterStatus)
    }

    if (employeeFilter !== 'all') {
      result = result.filter((e) => e.user_id === employeeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.user_name.toLowerCase().includes(q) ||
          (e.notes || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [entries, filterStatus, employeeFilter, searchQuery])

  // ── Filtered commission rules ───────────────────────────────────────

  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return commissionRules
    const q = searchQuery.toLowerCase()
    return commissionRules.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
    )
  }, [commissionRules, searchQuery])

  // ── Handlers: Payroll ───────────────────────────────────────────────

  function openAddPayroll() {
    setEditingEntry(null)
    setPayrollForm(emptyPayrollForm())
    setShowPayrollModal(true)
  }

  function openEditPayroll(entry: PayrollEntry) {
    setEditingEntry(entry)
    setPayrollForm({
      user_id: entry.user_id,
      user_name: entry.user_name,
      period_start: entry.period_start,
      period_end: entry.period_end,
      base_salary: entry.base_salary,
      hours_worked: entry.hours_worked,
      overtime_hours: entry.overtime_hours,
      overtime_pay: entry.overtime_pay,
      commission_total: entry.commission_total,
      tips_total: entry.tips_total,
      bonuses: entry.bonuses,
      deductions: entry.deductions,
      net_pay: entry.net_pay,
      status: entry.status,
      payment_method: entry.payment_method,
      notes: entry.notes || '',
    })
    setShowPayrollModal(true)
  }

  async function handleSavePayroll() {
    if (!payrollForm.user_id) return

    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, {
          ...payrollForm,
        })
      } else {
        await addEntry(storeId, payrollForm)
      }
      setShowPayrollModal(false)
      setEditingEntry(null)
    } catch (err) {
      console.error('Failed to save payroll entry:', err)
    }
  }

  async function handleDeletePayroll(id: string) {
    if (!window.confirm(L.confirmDelete)) return
    try {
      await deleteEntry(id)
    } catch (err) {
      console.error('Failed to delete payroll entry:', err)
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveEntry(id, user?.name || 'Admin')
    } catch (err) {
      console.error('Failed to approve entry:', err)
    }
  }

  function openMarkPaid(id: string) {
    setMarkPaidEntryId(id)
    setMarkPaidMethod('cash')
    setShowMarkPaidModal(true)
  }

  async function handleMarkPaid() {
    if (!markPaidEntryId) return
    try {
      await markPaid(markPaidEntryId, markPaidMethod)
      setShowMarkPaidModal(false)
      setMarkPaidEntryId(null)
    } catch (err) {
      console.error('Failed to mark entry as paid:', err)
    }
  }

  function handleGeneratePayslip(entry: PayrollEntry) {
    // Placeholder for payslip generation
    const data = [
      `Payslip - ${entry.user_name}`,
      `Period: ${formatDate(entry.period_start)} - ${formatDate(entry.period_end)}`,
      `Base Salary: ${formatCurrency(entry.base_salary, currency)}`,
      `Overtime: ${formatCurrency(entry.overtime_pay, currency)}`,
      `Commission: ${formatCurrency(entry.commission_total, currency)}`,
      `Tips: ${formatCurrency(entry.tips_total, currency)}`,
      `Bonuses: ${formatCurrency(entry.bonuses, currency)}`,
      `Deductions: -${formatCurrency(entry.deductions, currency)}`,
      `---`,
      `Net Pay: ${formatCurrency(entry.net_pay, currency)}`,
      `Status: ${entry.status.toUpperCase()}`,
    ].join('\n')

    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payslip_${entry.user_name.replace(/\s+/g, '_')}_${entry.period_start}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Handlers: Commissions ───────────────────────────────────────────

  function openAddCommission() {
    setEditingRule(null)
    setCommissionForm(emptyCommissionForm())
    setCategoriesInput('')
    setShowCommissionModal(true)
  }

  function openEditCommission(rule: CommissionRule) {
    setEditingRule(rule)
    setCommissionForm({
      name: rule.name,
      type: rule.type,
      value: rule.value,
      min_sales: rule.min_sales || 0,
      product_categories: rule.product_categories || [],
      is_active: rule.is_active,
    })
    setCategoriesInput((rule.product_categories || []).join(', '))
    setShowCommissionModal(true)
  }

  async function handleSaveCommission() {
    if (!commissionForm.name.trim()) return

    const cats = categoriesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    const data = { ...commissionForm, product_categories: cats }

    try {
      if (editingRule) {
        await updateCommissionRule(editingRule.id, data)
      } else {
        await addCommissionRule(storeId, data)
      }
      setShowCommissionModal(false)
      setEditingRule(null)
    } catch (err) {
      console.error('Failed to save commission rule:', err)
    }
  }

  async function handleDeleteRule(id: string) {
    if (!window.confirm(L.confirmDeleteRule)) return
    try {
      await deleteCommissionRule(id)
    } catch (err) {
      console.error('Failed to delete commission rule:', err)
    }
  }

  async function handleToggleRuleActive(rule: CommissionRule) {
    try {
      await updateCommissionRule(rule.id, { is_active: !rule.is_active })
    } catch (err) {
      console.error('Failed to toggle rule:', err)
    }
  }

  // ── Employee select handler ─────────────────────────────────────────

  function handleEmployeeSelect(userId: string) {
    const emp = employees.find((e) => e.id === userId)
    setPayrollForm((prev) => ({
      ...prev,
      user_id: userId,
      user_name: emp?.name || '',
    }))
  }

  // ── Status badge styles ─────────────────────────────────────────────

  function statusBadgeStyle(status: PayrollStatus): React.CSSProperties {
    const map: Record<PayrollStatus, { bg: string; color: string }> = {
      draft: { bg: C.draftBg, color: C.draftText },
      approved: { bg: C.approvedBg, color: C.approvedText },
      paid: { bg: C.paidBg, color: C.paidText },
    }
    const s = map[status]
    return {
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.color,
      textTransform: 'capitalize',
    }
  }

  function commissionTypeBadgeStyle(type: CommissionType): React.CSSProperties {
    const map: Record<CommissionType, { bg: string; color: string }> = {
      percentage: { bg: '#e0f2fe', color: '#0284c7' },
      fixed_per_sale: { bg: '#fef3c7', color: '#d97706' },
      tiered: { bg: '#ede9fe', color: '#7c3aed' },
    }
    const s = map[type]
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: s.bg,
      color: s.color,
    }
  }

  // ── Commission type label ───────────────────────────────────────────

  function commissionTypeLabel(type: CommissionType): string {
    const map: Record<CommissionType, string> = {
      percentage: L.percentage,
      fixed_per_sale: L.fixedPerSale,
      tiered: L.tiered,
    }
    return map[type] || type
  }

  // ── Commission type icon ────────────────────────────────────────────

  function CommissionTypeIcon({ type }: { type: CommissionType }) {
    if (type === 'percentage') return <Percent size={13} />
    if (type === 'fixed_per_sale') return <DollarSign size={13} />
    return <TrendingUp size={13} />
  }

  // ── Payment method label (kept for future payslip generation) ──────

  // ── Shared styles ──────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    backgroundColor: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 32,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: C.textSecondary,
    marginBottom: 4,
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.primary,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }

  const btnSecondary: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 18px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    backgroundColor: '#fff',
    color: C.text,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }

  const iconBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: C.textSecondary,
    transition: 'background-color 0.15s, color 0.15s',
  }

  // ── Loading state ──────────────────────────────────────────────────

  if (loading && entries.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Loader2 size={36} style={{ color: C.primary, animation: 'spin 1s linear infinite' }} />
        <span style={{ color: C.textSecondary, fontSize: 15 }}>{L.loading}</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div style={{ padding: rv(12, 20, 24), maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: C.primaryBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Banknote size={22} color={C.primary} />
          </div>
          <h1 style={{ margin: 0, fontSize: rv(20, 24, 26), fontWeight: 700, color: C.text }}>
            {L.title}
          </h1>
        </div>

        <button
          style={btnPrimary}
          onClick={activeTab === 'payroll' ? openAddPayroll : openAddCommission}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryDark)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
        >
          <Plus size={16} />
          {activeTab === 'payroll' ? L.addPayroll : L.addCommission}
        </button>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: rv('1fr 1fr', '1fr 1fr', 'repeat(4, 1fr)'),
          gap: rv(10, 14, 16),
          marginBottom: 20,
        }}
      >
        {[
          { label: L.totalPayroll, value: formatCurrency(stats.totalPayroll, currency), icon: <DollarSign size={20} />, color: C.primary, bg: C.primaryBg },
          { label: L.pendingPayments, value: String(stats.pendingCount), icon: <Clock size={20} />, color: C.warning, bg: C.warningLight },
          { label: L.paidThisMonth, value: formatCurrency(stats.paidThisMonth, currency), icon: <CheckCircle size={20} />, color: C.success, bg: C.successLight },
          { label: L.averageNetPay, value: formatCurrency(stats.avgNetPay, currency), icon: <TrendingUp size={20} />, color: '#7c3aed', bg: '#ede9fe' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: C.card,
              borderRadius: 12,
              padding: rv(14, 16, 18),
              border: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: stat.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color,
                flexShrink: 0,
              }}
            >
              {stat.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: rv(16, 18, 20), fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 16,
          borderBottom: `2px solid ${C.border}`,
        }}
      >
        {(['payroll', 'commissions'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSearchQuery('')
            }}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === tab ? C.primary : C.textSecondary,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${C.primary}` : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
              transition: 'color 0.2s, border-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab === 'payroll' ? <Banknote size={16} /> : <Percent size={16} />}
            {tab === 'payroll' ? L.payroll : L.commissions}
          </button>
        ))}
      </div>

      {/* ── Payroll Tab ──────────────────────────────────────────────── */}
      {activeTab === 'payroll' && (
        <>
          {/* Filters */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            {/* Search */}
            <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '0 1 260px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }}
              />
              <input
                type="text"
                placeholder={L.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 34 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
            </div>

            {/* Status filter */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'draft', 'approved', 'paid'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: `1px solid ${filterStatus === s ? C.primary : C.border}`,
                    backgroundColor: filterStatus === s ? C.primaryBg : '#fff',
                    color: filterStatus === s ? C.primary : C.textSecondary,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {s === 'all' ? L.all : s === 'draft' ? L.draft : s === 'approved' ? L.approved : L.paid}
                </button>
              ))}
            </div>

            {/* Employee filter */}
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              style={{ ...selectStyle, width: 'auto', minWidth: 160 }}
            >
              <option value="all">{L.allEmployees}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payroll list */}
          {filteredEntries.length === 0 ? (
            <div
              style={{
                backgroundColor: C.card,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: 40,
                textAlign: 'center',
              }}
            >
              <Users size={40} color={C.textMuted} style={{ marginBottom: 12 }} />
              <p style={{ color: C.textSecondary, fontSize: 15, margin: 0 }}>{L.noEntries}</p>
              <button
                style={{ ...btnPrimary, marginTop: 16 }}
                onClick={openAddPayroll}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryDark)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
              >
                <Plus size={16} />
                {L.addPayroll}
              </button>
            </div>
          ) : isMobile ? (
            /* ── Mobile card layout ─────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: 14,
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{entry.user_name}</div>
                      <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                        <Calendar size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {formatDate(entry.period_start)} - {formatDate(entry.period_end)}
                      </div>
                    </div>
                    <span style={statusBadgeStyle(entry.status)}>
                      {entry.status === 'draft' ? L.draft : entry.status === 'approved' ? L.approved : L.paid}
                    </span>
                  </div>

                  {/* Amounts grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, color: C.textMuted }}>{L.baseSalary}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{formatCurrency(entry.base_salary, currency)}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: C.textMuted }}>{L.overtime}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{formatCurrency(entry.overtime_pay, currency)}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: C.textMuted }}>{L.commissionCol}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{formatCurrency(entry.commission_total, currency)}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: C.textMuted }}>{L.deductions}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.danger }}>-{formatCurrency(entry.deductions, currency)}</div>
                    </div>
                  </div>

                  {/* Net pay */}
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      backgroundColor: C.primaryBg,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>{L.netPay}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>{formatCurrency(entry.net_pay, currency)}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {entry.status === 'draft' && (
                      <>
                        <button
                          style={{ ...iconBtnStyle, backgroundColor: C.primaryBg, color: C.primary }}
                          title={L.edit}
                          onClick={() => openEditPayroll(entry)}
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          style={{ ...iconBtnStyle, backgroundColor: C.successLight, color: C.success }}
                          title={L.approve}
                          onClick={() => handleApprove(entry.id)}
                        >
                          <CheckCircle size={15} />
                        </button>
                      </>
                    )}
                    {entry.status === 'approved' && (
                      <button
                        style={{ ...iconBtnStyle, backgroundColor: C.primaryBg, color: C.primary }}
                        title={L.markPaid}
                        onClick={() => openMarkPaid(entry.id)}
                      >
                        <DollarSign size={15} />
                      </button>
                    )}
                    <button
                      style={{ ...iconBtnStyle, backgroundColor: '#f0fdf4', color: '#166534' }}
                      title={L.generatePayslip}
                      onClick={() => handleGeneratePayslip(entry)}
                    >
                      <FileText size={15} />
                    </button>
                    {entry.status === 'draft' && (
                      <button
                        style={{ ...iconBtnStyle, backgroundColor: C.dangerLight, color: C.danger }}
                        title={L.delete}
                        onClick={() => handleDeletePayroll(entry.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Desktop table layout ───────────────────────────────── */
            <div
              style={{
                backgroundColor: C.card,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                overflow: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {[L.employee, L.period, L.baseSalary, L.overtime, L.commissionCol, L.tips, L.bonuses, L.deductions, L.netPay, L.status, L.actions].map(
                      (h, i) => (
                        <th
                          key={i}
                          style={{
                            textAlign: 'left',
                            padding: '12px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.textSecondary,
                            whiteSpace: 'nowrap',
                            borderBottom: `1px solid ${C.border}`,
                            backgroundColor: '#f8fafc',
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: `1px solid ${C.border}`, transition: 'background-color 0.1s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px', fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>
                        {entry.user_name}
                      </td>
                      <td style={{ padding: '10px', color: C.textSecondary, whiteSpace: 'nowrap', fontSize: 12 }}>
                        {formatDate(entry.period_start)} - {formatDate(entry.period_end)}
                      </td>
                      <td style={{ padding: '10px', color: C.text, whiteSpace: 'nowrap' }}>
                        {formatCurrency(entry.base_salary, currency)}
                      </td>
                      <td style={{ padding: '10px', color: C.text, whiteSpace: 'nowrap' }}>
                        {formatCurrency(entry.overtime_pay, currency)}
                      </td>
                      <td style={{ padding: '10px', color: C.text, whiteSpace: 'nowrap' }}>
                        {formatCurrency(entry.commission_total, currency)}
                      </td>
                      <td style={{ padding: '10px', color: C.text, whiteSpace: 'nowrap' }}>
                        {formatCurrency(entry.tips_total, currency)}
                      </td>
                      <td style={{ padding: '10px', color: C.text, whiteSpace: 'nowrap' }}>
                        {formatCurrency(entry.bonuses, currency)}
                      </td>
                      <td style={{ padding: '10px', color: C.danger, whiteSpace: 'nowrap' }}>
                        -{formatCurrency(entry.deductions, currency)}
                      </td>
                      <td style={{ padding: '10px', fontWeight: 700, color: C.primary, whiteSpace: 'nowrap' }}>
                        {formatCurrency(entry.net_pay, currency)}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={statusBadgeStyle(entry.status)}>
                          {entry.status === 'draft' ? L.draft : entry.status === 'approved' ? L.approved : L.paid}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {entry.status === 'draft' && (
                            <>
                              <button
                                style={iconBtnStyle}
                                title={L.edit}
                                onClick={() => openEditPayroll(entry)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = C.primaryBg
                                  e.currentTarget.style.color = C.primary
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = C.textSecondary
                                }}
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                style={iconBtnStyle}
                                title={L.approve}
                                onClick={() => handleApprove(entry.id)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = C.successLight
                                  e.currentTarget.style.color = C.success
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = C.textSecondary
                                }}
                              >
                                <CheckCircle size={15} />
                              </button>
                            </>
                          )}
                          {entry.status === 'approved' && (
                            <button
                              style={iconBtnStyle}
                              title={L.markPaid}
                              onClick={() => openMarkPaid(entry.id)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.primaryBg
                                e.currentTarget.style.color = C.primary
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.color = C.textSecondary
                              }}
                            >
                              <DollarSign size={15} />
                            </button>
                          )}
                          <button
                            style={iconBtnStyle}
                            title={L.generatePayslip}
                            onClick={() => handleGeneratePayslip(entry)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0fdf4'
                              e.currentTarget.style.color = '#166534'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = C.textSecondary
                            }}
                          >
                            <FileText size={15} />
                          </button>
                          {entry.status === 'draft' && (
                            <button
                              style={iconBtnStyle}
                              title={L.delete}
                              onClick={() => handleDeletePayroll(entry.id)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.dangerLight
                                e.currentTarget.style.color = C.danger
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.color = C.textSecondary
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Commissions Tab ──────────────────────────────────────────── */}
      {activeTab === 'commissions' && (
        <>
          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative', maxWidth: 320 }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }}
              />
              <input
                type="text"
                placeholder={L.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 34 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
            </div>
          </div>

          {/* Commission rules list */}
          {filteredRules.length === 0 ? (
            <div
              style={{
                backgroundColor: C.card,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: 40,
                textAlign: 'center',
              }}
            >
              <Percent size={40} color={C.textMuted} style={{ marginBottom: 12 }} />
              <p style={{ color: C.textSecondary, fontSize: 15, margin: 0 }}>{L.noRules}</p>
              <button
                style={{ ...btnPrimary, marginTop: 16 }}
                onClick={openAddCommission}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryDark)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
              >
                <Plus size={16} />
                {L.addCommission}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    padding: rv(14, 16, 18),
                    display: 'flex',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: rv(10, 14, 16),
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  {/* Rule info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{rule.name}</span>
                      <span style={commissionTypeBadgeStyle(rule.type)}>
                        <CommissionTypeIcon type={rule.type} />
                        {commissionTypeLabel(rule.type)}
                      </span>
                      <span
                        style={{
                          ...statusBadgeStyle(rule.is_active ? 'approved' : 'draft'),
                          fontSize: 11,
                        }}
                      >
                        {rule.is_active ? L.active : L.inactive}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: C.textSecondary }}>
                      <span>
                        <strong style={{ color: C.text }}>
                          {rule.type === 'percentage'
                            ? `${rule.value}%`
                            : formatCurrency(rule.value, currency)}
                        </strong>
                      </span>
                      {rule.min_sales !== undefined && rule.min_sales > 0 && (
                        <span>
                          {L.minSales}: <strong style={{ color: C.text }}>{formatCurrency(rule.min_sales, currency)}</strong>
                        </span>
                      )}
                      {rule.product_categories && rule.product_categories.length > 0 && (
                        <span>
                          {L.categories}: <strong style={{ color: C.text }}>{rule.product_categories.join(', ')}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleRuleActive(rule)}
                      style={{
                        ...iconBtnStyle,
                        width: 36,
                        height: 36,
                      }}
                      title={rule.is_active ? L.inactive : L.active}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = rule.is_active ? C.warningLight : C.successLight
                        e.currentTarget.style.color = rule.is_active ? C.warning : C.success
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = C.textSecondary
                      }}
                    >
                      {rule.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    </button>

                    <button
                      onClick={() => openEditCommission(rule)}
                      style={{ ...iconBtnStyle, width: 36, height: 36 }}
                      title={L.edit}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.primaryBg
                        e.currentTarget.style.color = C.primary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = C.textSecondary
                      }}
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      style={{ ...iconBtnStyle, width: 36, height: 36 }}
                      title={L.delete}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.dangerLight
                        e.currentTarget.style.color = C.danger
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = C.textSecondary
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add/Edit Payroll Modal ────────────────────────────────────── */}
      <Modal
        isOpen={showPayrollModal}
        onClose={() => {
          setShowPayrollModal(false)
          setEditingEntry(null)
        }}
        title={editingEntry ? L.editPayroll : L.addPayroll}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Employee */}
          <div>
            <label style={labelStyle}>{L.employee} *</label>
            <select
              value={payrollForm.user_id}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              style={selectStyle}
            >
              <option value="">{L.selectEmployee}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.periodStart}</label>
              <input
                type="date"
                value={payrollForm.period_start}
                onChange={(e) => setPayrollForm((prev) => ({ ...prev, period_start: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{L.periodEnd}</label>
              <input
                type="date"
                value={payrollForm.period_end}
                onChange={(e) => setPayrollForm((prev) => ({ ...prev, period_end: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Base salary + hours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.baseSalary}</label>
              <input
                type="number"
                min={0}
                value={payrollForm.base_salary || ''}
                onChange={(e) => setPayrollForm((prev) => ({ ...prev, base_salary: parseFloat(e.target.value) || 0 }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{L.hoursWorked}</label>
              <input
                type="number"
                min={0}
                value={payrollForm.hours_worked || ''}
                onChange={(e) => setPayrollForm((prev) => ({ ...prev, hours_worked: parseFloat(e.target.value) || 0 }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Overtime */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.overtimeHours}</label>
              <input
                type="number"
                min={0}
                value={payrollForm.overtime_hours || ''}
                onChange={(e) => setPayrollForm((prev) => ({ ...prev, overtime_hours: parseFloat(e.target.value) || 0 }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{L.overtimePay}</label>
              <input
                type="number"
                min={0}
                value={payrollForm.overtime_pay || ''}
                onChange={(e) => setPayrollForm((prev) => ({ ...prev, overtime_pay: parseFloat(e.target.value) || 0 }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Commission + Tips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.commissionTotal}</label>
              <input
                type="number"
                min={0}
                value={payrollForm.commission_total || ''}
                onChange={(e) => setPayrollForm((prev) => ({ ...prev, commission_total: parseFloat(e.target.value) || 0 }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{L.tipsTotal}</label>
              <input
                type="number"
                min={0}
                value={payrollForm.tips_total || ''}
                onChange={(e) => setPayrollForm((prev) => ({ ...prev, tips_total: parseFloat(e.target.value) || 0 }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Bonuses + Deductions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.bonuses}</label>
              <input
                type="number"
                min={0}
                value={payrollForm.bonuses || ''}
                onChange={(e) => setPayrollForm((prev) => ({ ...prev, bonuses: parseFloat(e.target.value) || 0 }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{L.deductions}</label>
              <input
                type="number"
                min={0}
                value={payrollForm.deductions || ''}
                onChange={(e) => setPayrollForm((prev) => ({ ...prev, deductions: parseFloat(e.target.value) || 0 }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Net pay display */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              backgroundColor: C.primaryBg,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>{L.netPay}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>
              {formatCurrency(payrollForm.net_pay, currency)}
            </span>
          </div>

          {/* Payment method */}
          <div>
            <label style={labelStyle}>{L.paymentMethod}</label>
            <select
              value={payrollForm.payment_method || ''}
              onChange={(e) =>
                setPayrollForm((prev) => ({
                  ...prev,
                  payment_method: (e.target.value || undefined) as PaymentMethod | undefined,
                }))
              }
              style={selectStyle}
            >
              <option value="">{L.selectPaymentMethod}</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {(L as Record<string, string>)[m.key] || m.value}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>{L.notes}</label>
            <textarea
              value={payrollForm.notes || ''}
              onChange={(e) => setPayrollForm((prev) => ({ ...prev, notes: e.target.value }))}
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button
              style={btnSecondary}
              onClick={() => {
                setShowPayrollModal(false)
                setEditingEntry(null)
              }}
            >
              {L.cancel}
            </button>
            <button
              style={{
                ...btnPrimary,
                opacity: payrollForm.user_id ? 1 : 0.5,
                pointerEvents: payrollForm.user_id ? 'auto' : 'none',
              }}
              onClick={handleSavePayroll}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryDark)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
            >
              {L.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Mark Paid Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={showMarkPaidModal}
        onClose={() => {
          setShowMarkPaidModal(false)
          setMarkPaidEntryId(null)
        }}
        title={L.markPaid}
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>{L.paymentMethod}</label>
            <select
              value={markPaidMethod}
              onChange={(e) => setMarkPaidMethod(e.target.value as PaymentMethod)}
              style={selectStyle}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {(L as Record<string, string>)[m.key] || m.value}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              style={btnSecondary}
              onClick={() => {
                setShowMarkPaidModal(false)
                setMarkPaidEntryId(null)
              }}
            >
              {L.cancel}
            </button>
            <button
              style={btnPrimary}
              onClick={handleMarkPaid}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryDark)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
            >
              <CheckCircle size={16} />
              {L.markPaid}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Add/Edit Commission Rule Modal ───────────────────────────── */}
      <Modal
        isOpen={showCommissionModal}
        onClose={() => {
          setShowCommissionModal(false)
          setEditingRule(null)
        }}
        title={editingRule ? L.editCommission : L.addCommission}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>{L.name} *</label>
            <input
              type="text"
              value={commissionForm.name}
              onChange={(e) => setCommissionForm((prev) => ({ ...prev, name: e.target.value }))}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          {/* Type */}
          <div>
            <label style={labelStyle}>{L.type}</label>
            <select
              value={commissionForm.type}
              onChange={(e) => setCommissionForm((prev) => ({ ...prev, type: e.target.value as CommissionType }))}
              style={selectStyle}
            >
              <option value="percentage">{L.percentage}</option>
              <option value="fixed_per_sale">{L.fixedPerSale}</option>
              <option value="tiered">{L.tiered}</option>
            </select>
          </div>

          {/* Value */}
          <div>
            <label style={labelStyle}>
              {L.value} {commissionForm.type === 'percentage' ? '(%)' : `(${currency})`}
            </label>
            <input
              type="number"
              min={0}
              step={commissionForm.type === 'percentage' ? 0.5 : 1}
              value={commissionForm.value || ''}
              onChange={(e) => setCommissionForm((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          {/* Min sales */}
          <div>
            <label style={labelStyle}>{L.minSales}</label>
            <input
              type="number"
              min={0}
              value={commissionForm.min_sales || ''}
              onChange={(e) => setCommissionForm((prev) => ({ ...prev, min_sales: parseFloat(e.target.value) || 0 }))}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          {/* Product categories */}
          <div>
            <label style={labelStyle}>{L.productCategories}</label>
            <input
              type="text"
              value={categoriesInput}
              onChange={(e) => setCategoriesInput(e.target.value)}
              placeholder={L.categoriesHint}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>{L.isActive}</label>
            <button
              onClick={() => setCommissionForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                backgroundColor: commissionForm.is_active ? C.success : C.border,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: commissionForm.is_active ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button
              style={btnSecondary}
              onClick={() => {
                setShowCommissionModal(false)
                setEditingRule(null)
              }}
            >
              {L.cancel}
            </button>
            <button
              style={{
                ...btnPrimary,
                opacity: commissionForm.name.trim() ? 1 : 0.5,
                pointerEvents: commissionForm.name.trim() ? 'auto' : 'none',
              }}
              onClick={handleSaveCommission}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryDark)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
            >
              {L.save}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
