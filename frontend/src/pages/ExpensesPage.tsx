import { useState, useEffect, useMemo } from 'react'
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  PieChart,
  Calendar,
  Clock,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useExpenseStore } from '../stores/expenseStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseRecurrence,
  PaymentMethod,
} from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#0d9488',
  primaryLight: '#ccfbf1',
  primaryDark: '#0f766e',
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

const STATUS_CONFIG: Record<ExpenseStatus, { color: string; bg: string }> = {
  pending:  { color: '#f59e0b', bg: '#fffbeb' },
  approved: { color: '#16a34a', bg: '#f0fdf4' },
  rejected: { color: '#dc2626', bg: '#fef2f2' },
  paid:     { color: '#2563eb', bg: '#eff6ff' },
}

// ── Category config ───────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ExpenseCategory, { color: string; bg: string; icon: string }> = {
  rent:        { color: '#2563eb', bg: '#eff6ff', icon: '🏢' },
  utilities:   { color: '#f59e0b', bg: '#fffbeb', icon: '⚡' },
  salaries:    { color: '#16a34a', bg: '#f0fdf4', icon: '👥' },
  supplies:    { color: '#8b5cf6', bg: '#f5f3ff', icon: '📦' },
  marketing:   { color: '#ec4899', bg: '#fdf2f8', icon: '📢' },
  maintenance: { color: '#64748b', bg: '#f8fafc', icon: '🔧' },
  transport:   { color: '#06b6d4', bg: '#ecfeff', icon: '🚗' },
  taxes:       { color: '#dc2626', bg: '#fef2f2', icon: '📋' },
  insurance:   { color: '#0d9488', bg: '#f0fdfa', icon: '🛡' },
  food_cost:   { color: '#ea580c', bg: '#fff7ed', icon: '🍽' },
  equipment:   { color: '#4f46e5', bg: '#eef2ff', icon: '🖥' },
  other:       { color: '#94a3b8', bg: '#f8fafc', icon: '📎' },
}

const ALL_CATEGORIES: ExpenseCategory[] = [
  'rent', 'utilities', 'salaries', 'supplies', 'marketing',
  'maintenance', 'transport', 'taxes', 'insurance', 'food_cost',
  'equipment', 'other',
]

const ALL_STATUSES: ExpenseStatus[] = ['pending', 'approved', 'rejected', 'paid']
const ALL_RECURRENCES: ExpenseRecurrence[] = ['none', 'daily', 'weekly', 'monthly', 'yearly']
const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  'cash', 'card', 'momo', 'transfer', 'orange_money', 'mtn_money', 'carte_bancaire', 'paypal',
]

// ── Component ─────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    expenses,
    loading,
    filterCategory,
    filterStatus,
    loadExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    rejectExpense,
    markPaid,
    getMonthlyTotal,
    getCategoryBreakdown,
    setFilterCategory,
    setFilterStatus,
  } = useExpenseStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n
  const et = (t as Record<string, any>).expenses || {}
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: et.title || 'Expense Tracking',
    addExpense: et.addExpense || 'Add Expense',
    editExpense: et.editExpense || 'Edit Expense',
    totalThisMonth: et.totalThisMonth || 'Total This Month',
    pendingApproval: et.pendingApproval || 'Pending Approval',
    monthlyBudget: et.monthlyBudget || 'Monthly Budget',
    topCategory: et.topCategory || 'Top Category',
    category: et.category || 'Category',
    description: et.description || 'Description',
    amount: et.amount || 'Amount',
    vendor: et.vendor || 'Vendor',
    status: et.status || 'Status',
    date: et.date || 'Date',
    submittedBy: et.submittedBy || 'Submitted By',
    actions: et.actions || 'Actions',
    paymentMethod: et.paymentMethod || 'Payment Method',
    recurrence: et.recurrence || 'Recurrence',
    notes: et.notes || 'Notes',
    tags: et.tags || 'Tags',
    expenseDate: et.expenseDate || 'Expense Date',
    allCategories: et.allCategories || 'All Categories',
    allStatuses: et.allStatuses || 'All Statuses',
    noExpenses: et.noExpenses || 'No expenses recorded yet',
    noExpensesDesc: et.noExpensesDesc || 'Start tracking your expenses by adding a new one.',
    noResults: et.noResults || 'No expenses match your filters',
    noResultsDesc: et.noResultsDesc || 'Try adjusting the filters or search query.',
    approve: et.approve || 'Approve',
    reject: et.reject || 'Reject',
    markPaid: et.markPaid || 'Mark Paid',
    delete: et.delete || 'Delete',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    categoryBreakdown: et.categoryBreakdown || 'Category Breakdown',
    noBudgetSet: et.noBudgetSet || 'Not set',
    expensesCount: et.expensesCount || 'expenses',
    deleteConfirm: et.deleteConfirm || 'Are you sure you want to delete this expense?',
    // Category labels
    cat_rent: et.cat_rent || 'Rent',
    cat_utilities: et.cat_utilities || 'Utilities',
    cat_salaries: et.cat_salaries || 'Salaries',
    cat_supplies: et.cat_supplies || 'Supplies',
    cat_marketing: et.cat_marketing || 'Marketing',
    cat_maintenance: et.cat_maintenance || 'Maintenance',
    cat_transport: et.cat_transport || 'Transport',
    cat_taxes: et.cat_taxes || 'Taxes',
    cat_insurance: et.cat_insurance || 'Insurance',
    cat_food_cost: et.cat_food_cost || 'Food Cost',
    cat_equipment: et.cat_equipment || 'Equipment',
    cat_other: et.cat_other || 'Other',
    // Status labels
    st_pending: et.st_pending || 'Pending',
    st_approved: et.st_approved || 'Approved',
    st_rejected: et.st_rejected || 'Rejected',
    st_paid: et.st_paid || 'Paid',
    // Recurrence labels
    rec_none: et.rec_none || 'None',
    rec_daily: et.rec_daily || 'Daily',
    rec_weekly: et.rec_weekly || 'Weekly',
    rec_monthly: et.rec_monthly || 'Monthly',
    rec_yearly: et.rec_yearly || 'Yearly',
    // Payment method labels
    pm_cash: et.pm_cash || 'Cash',
    pm_card: et.pm_card || 'Card',
    pm_momo: et.pm_momo || 'Mobile Money',
    pm_transfer: et.pm_transfer || 'Bank Transfer',
    pm_orange_money: et.pm_orange_money || 'Orange Money',
    pm_mtn_money: et.pm_mtn_money || 'MTN Money',
    pm_carte_bancaire: et.pm_carte_bancaire || 'Bank Card',
    pm_paypal: et.pm_paypal || 'PayPal',
  }

  const catLabel = (c: ExpenseCategory): string => (L as any)[`cat_${c}`] || c
  const statusLabel = (s: ExpenseStatus): string => (L as any)[`st_${s}`] || s
  const recLabel = (r: ExpenseRecurrence): string => (L as any)[`rec_${r}`] || r
  const pmLabel = (p: PaymentMethod): string => (L as any)[`pm_${p}`] || p

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showChart, setShowChart] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('supplies')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('cash')
  const [formVendor, setFormVendor] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))
  const [formRecurrence, setFormRecurrence] = useState<ExpenseRecurrence>('none')
  const [formNotes, setFormNotes] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // ── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    loadExpenses(storeId)
  }, [storeId, loadExpenses])

  // ── Filtered and searched expenses ────────────────────────────────────

  const filteredExpenses = useMemo(() => {
    let result = [...expenses]

    if (filterCategory !== 'all') {
      result = result.filter((e) => e.category === filterCategory)
    }
    if (filterStatus !== 'all') {
      result = result.filter((e) => e.status === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.vendor && e.vendor.toLowerCase().includes(q)) ||
          e.user_name.toLowerCase().includes(q) ||
          (e.tags && e.tags.some((tag) => tag.toLowerCase().includes(q)))
      )
    }

    return result
  }, [expenses, filterCategory, filterStatus, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const monthlyTotal = getMonthlyTotal(storeId)
  const categoryBreakdown = getCategoryBreakdown(storeId)

  const pendingCount = useMemo(
    () => expenses.filter((e) => e.status === 'pending').length,
    [expenses]
  )

  const topCategory = useMemo(() => {
    let maxCat: ExpenseCategory = 'other'
    let maxVal = 0
    for (const [cat, val] of Object.entries(categoryBreakdown)) {
      if (val > maxVal) {
        maxVal = val
        maxCat = cat as ExpenseCategory
      }
    }
    return { category: maxCat, amount: maxVal }
  }, [categoryBreakdown])

  const maxCategoryAmount = useMemo(() => {
    return Math.max(...Object.values(categoryBreakdown), 1)
  }, [categoryBreakdown])

  // ── Form helpers ──────────────────────────────────────────────────────

  function resetForm() {
    setFormCategory('supplies')
    setFormDescription('')
    setFormAmount('')
    setFormPaymentMethod('cash')
    setFormVendor('')
    setFormDate(new Date().toISOString().slice(0, 10))
    setFormRecurrence('none')
    setFormNotes('')
    setFormTags('')
    setEditingExpense(null)
  }

  function openAddModal() {
    resetForm()
    setShowModal(true)
  }

  function openEditModal(expense: Expense) {
    setEditingExpense(expense)
    setFormCategory(expense.category)
    setFormDescription(expense.description)
    setFormAmount(expense.amount.toString())
    setFormPaymentMethod(expense.payment_method || 'cash')
    setFormVendor(expense.vendor || '')
    setFormDate(expense.expense_date.slice(0, 10))
    setFormRecurrence(expense.recurrence)
    setFormNotes(expense.notes || '')
    setFormTags(expense.tags ? expense.tags.join(', ') : '')
    setShowModal(true)
  }

  async function handleSave() {
    if (!formDescription.trim() || !formAmount.trim()) return

    setFormSaving(true)
    try {
      const parsedTags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const data = {
        category: formCategory,
        description: formDescription.trim(),
        amount: parseFloat(formAmount),
        payment_method: formPaymentMethod,
        vendor: formVendor.trim() || undefined,
        status: 'pending' as ExpenseStatus,
        user_id: userId,
        user_name: userName,
        recurrence: formRecurrence,
        expense_date: new Date(formDate).toISOString(),
        notes: formNotes.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      }

      if (editingExpense) {
        await updateExpense(editingExpense.id, data)
      } else {
        await addExpense(storeId, data)
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[ExpensesPage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[ExpensesPage] Delete error:', error)
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveExpense(id, userName)
    } catch (error) {
      console.error('[ExpensesPage] Approve error:', error)
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectExpense(id)
    } catch (error) {
      console.error('[ExpensesPage] Reject error:', error)
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      await markPaid(id)
    } catch (error) {
      console.error('[ExpensesPage] Mark paid error:', error)
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

    title: {
      margin: 0,
      fontSize: rv(20, 24, 28),
      fontWeight: 700,
      color: C.text,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
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

    // Chart styles
    chartSection: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: rv(14, 18, 20),
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    chartHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    } as React.CSSProperties,

    chartTitle: {
      fontSize: 16,
      fontWeight: 700,
      color: C.text,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: 0,
    } as React.CSSProperties,

    barRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    } as React.CSSProperties,

    barLabel: {
      width: rv(70, 90, 100),
      fontSize: rv(11, 12, 13),
      fontWeight: 500,
      color: C.textSecondary,
      textAlign: 'right' as const,
      flexShrink: 0,
    } as React.CSSProperties,

    barTrack: {
      flex: 1,
      height: rv(18, 22, 24),
      backgroundColor: C.bg,
      borderRadius: 6,
      overflow: 'hidden',
      position: 'relative' as const,
    } as React.CSSProperties,

    barAmount: {
      fontSize: rv(11, 12, 12),
      fontWeight: 600,
      color: C.textSecondary,
      minWidth: rv(60, 80, 90),
      textAlign: 'right' as const,
      flexShrink: 0,
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
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && expenses.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <Receipt size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading expenses...</div>
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
        <h1 style={s.title}>
          <Receipt size={rv(22, 26, 28)} color={C.primary} />
          {L.title}
        </h1>
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
          {L.addExpense}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total this month */}
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
              <DollarSign size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalThisMonth}</span>
          </div>
          <div style={s.statValue}>{formatCurrency(monthlyTotal, currency)}</div>
        </div>

        {/* Pending approval */}
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
              <Clock size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.pendingApproval}</span>
          </div>
          <div style={s.statValue}>{pendingCount}</div>
        </div>

        {/* Monthly budget */}
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
              <TrendingUp size={18} color={C.info} />
            </div>
            <span style={s.statLabel}>{L.monthlyBudget}</span>
          </div>
          <div style={{ ...s.statValue, fontSize: rv(14, 16, 18) }}>{L.noBudgetSet}</div>
        </div>

        {/* Top category */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: topCategory.amount > 0
                  ? CATEGORY_CONFIG[topCategory.category].bg
                  : '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingDown size={18} color={topCategory.amount > 0 ? CATEGORY_CONFIG[topCategory.category].color : C.textMuted} />
            </div>
            <span style={s.statLabel}>{L.topCategory}</span>
          </div>
          <div style={s.statValue}>
            {topCategory.amount > 0 ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={s.badge(
                    CATEGORY_CONFIG[topCategory.category].color,
                    CATEGORY_CONFIG[topCategory.category].bg
                  )}
                >
                  {CATEGORY_CONFIG[topCategory.category].icon}{' '}
                  {catLabel(topCategory.category)}
                </span>
              </span>
            ) : (
              <span style={{ fontSize: rv(14, 16, 18), color: C.textMuted }}>--</span>
            )}
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

        {/* Category filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} color={C.textMuted} />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
            style={s.selectInput}
          >
            <option value="all">{L.allCategories}</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].icon} {catLabel(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ExpenseStatus | 'all')}
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

      {/* ── Category breakdown chart ────────────────────────────────────── */}
      {showChart && expenses.length > 0 && (
        <div style={s.chartSection}>
          <div style={s.chartHeader}>
            <h3 style={s.chartTitle}>
              <PieChart size={18} color={C.primary} />
              {L.categoryBreakdown}
            </h3>
            <button
              onClick={() => setShowChart(false)}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: C.textMuted,
                fontSize: 12,
              }}
            >
              Hide
            </button>
          </div>

          {ALL_CATEGORIES.map((cat) => {
            const amount = categoryBreakdown[cat] || 0
            if (amount === 0) return null
            const pct = (amount / maxCategoryAmount) * 100
            const cfg = CATEGORY_CONFIG[cat]

            return (
              <div key={cat} style={s.barRow}>
                <div style={s.barLabel}>
                  {cfg.icon} {catLabel(cat)}
                </div>
                <div style={s.barTrack}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: cfg.color,
                      borderRadius: 6,
                      transition: 'width 0.4s ease',
                      minWidth: 4,
                      opacity: 0.8,
                    }}
                  />
                </div>
                <div style={s.barAmount}>{formatCurrency(amount, currency)}</div>
              </div>
            )
          })}

          {Object.values(categoryBreakdown).every((v) => v === 0) && (
            <div style={{ textAlign: 'center', padding: 20, color: C.textMuted, fontSize: 13 }}>
              No data for this month
            </div>
          )}
        </div>
      )}

      {!showChart && expenses.length > 0 && (
        <button
          onClick={() => setShowChart(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            backgroundColor: C.card,
            color: C.textSecondary,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          <PieChart size={14} />
          {L.categoryBreakdown}
        </button>
      )}

      {/* ── Expense list ────────────────────────────────────────────────── */}
      {expenses.length === 0 ? (
        /* Empty state - no expenses at all */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <Receipt size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noExpenses}</h3>
          <p style={s.emptyDesc}>{L.noExpensesDesc}</p>
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
            {L.addExpense}
          </button>
        </div>
      ) : filteredExpenses.length === 0 ? (
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
            {filteredExpenses.length} {L.expensesCount}
          </div>
          {filteredExpenses.map((expense) => {
            const catCfg = CATEGORY_CONFIG[expense.category]
            const stCfg = STATUS_CONFIG[expense.status]

            return (
              <div key={expense.id} style={s.mobileCard}>
                {/* Top row: category + amount */}
                <div style={s.mobileCardRow}>
                  <span style={s.badge(catCfg.color, catCfg.bg)}>
                    {catCfg.icon} {catLabel(expense.category)}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                    {formatCurrency(expense.amount, currency)}
                  </span>
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {expense.description}
                </div>

                {/* Vendor & date */}
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
                  {expense.vendor && <span>{expense.vendor}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Calendar size={11} />
                    {formatDate(expense.expense_date)}
                  </span>
                </div>

                {/* Status + submitted by */}
                <div style={{ ...s.mobileCardRow, marginBottom: 0 }}>
                  <span style={s.badge(stCfg.color, stCfg.bg)}>
                    {statusLabel(expense.status)}
                  </span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>
                    {expense.user_name}
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
                    onClick={() => openEditModal(expense)}
                    style={{
                      ...s.actionBtn(C.info),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                      gap: 4,
                      display: 'inline-flex',
                    }}
                    title={L.editExpense}
                  >
                    <Edit size={13} />
                  </button>

                  {expense.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(expense.id)}
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
                        onClick={() => handleReject(expense.id)}
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

                  {expense.status === 'approved' && (
                    <button
                      onClick={() => handleMarkPaid(expense.id)}
                      style={{
                        ...s.actionBtn(C.info),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.markPaid}
                    >
                      <DollarSign size={13} />
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTarget(expense.id)}
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
            {filteredExpenses.length} {L.expensesCount}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{L.date}</th>
                  <th style={s.th}>{L.category}</th>
                  <th style={s.th}>{L.description}</th>
                  <th style={s.th}>{L.vendor}</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>{L.amount}</th>
                  <th style={s.th}>{L.status}</th>
                  <th style={s.th}>{L.submittedBy}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const catCfg = CATEGORY_CONFIG[expense.category]
                  const stCfg = STATUS_CONFIG[expense.status]

                  return (
                    <tr
                      key={expense.id}
                      style={{ transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = ''
                      }}
                    >
                      <td style={s.td}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                          <Calendar size={13} color={C.textMuted} />
                          {formatDate(expense.expense_date)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(catCfg.color, catCfg.bg)}>
                          {catCfg.icon} {catLabel(expense.category)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {expense.description}
                        </div>
                        {expense.recurrence !== 'none' && (
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                            {recLabel(expense.recurrence)}
                          </div>
                        )}
                      </td>
                      <td style={{ ...s.td, color: C.textSecondary }}>
                        {expense.vendor || '--'}
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatCurrency(expense.amount, currency)}
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(stCfg.color, stCfg.bg)}>
                          {statusLabel(expense.status)}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontSize: 13, color: C.textSecondary }}>
                        {expense.user_name}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <button
                            onClick={() => openEditModal(expense)}
                            style={s.actionBtn(C.info)}
                            title={L.editExpense}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.infoBg
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Edit size={15} />
                          </button>

                          {expense.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(expense.id)}
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
                              <button
                                onClick={() => handleReject(expense.id)}
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
                            </>
                          )}

                          {expense.status === 'approved' && (
                            <button
                              onClick={() => handleMarkPaid(expense.id)}
                              style={s.actionBtn(C.info)}
                              title={L.markPaid}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.infoBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <DollarSign size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteTarget(expense.id)}
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

      {/* ── Add / Edit Expense Modal ────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingExpense ? L.editExpense : L.addExpense}
        size="lg"
      >
        {/* Category & Amount */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.category} *</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat].icon} {catLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.amount} *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
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
        </div>

        {/* Description */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.description} *</label>
          <input
            type="text"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder={L.description + '...'}
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Payment method & Vendor */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.paymentMethod}</label>
            <select
              value={formPaymentMethod}
              onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pmLabel(pm)}
                </option>
              ))}
            </select>
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.vendor}</label>
            <input
              type="text"
              value={formVendor}
              onChange={(e) => setFormVendor(e.target.value)}
              placeholder={L.vendor + '...'}
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

        {/* Expense date & Recurrence */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.expenseDate}</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
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
            <label style={s.formLabel}>{L.recurrence}</label>
            <select
              value={formRecurrence}
              onChange={(e) => setFormRecurrence(e.target.value as ExpenseRecurrence)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_RECURRENCES.map((rec) => (
                <option key={rec} value={rec}>
                  {recLabel(rec)}
                </option>
              ))}
            </select>
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

        {/* Tags */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>
            {L.tags}
            <span style={{ fontWeight: 400, color: C.textMuted, fontSize: 11, marginLeft: 6 }}>
              (comma-separated)
            </span>
          </label>
          <input
            type="text"
            value={formTags}
            onChange={(e) => setFormTags(e.target.value)}
            placeholder="office, monthly, recurring..."
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
          {formTags.trim() && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {formTags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 500,
                      backgroundColor: C.primaryLight,
                      color: C.primary,
                    }}
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
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
            disabled={formSaving || !formDescription.trim() || !formAmount.trim()}
          >
            {formSaving ? 'Saving...' : L.save}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={L.delete}
        size="sm"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
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
            }}
          >
            <Trash2 size={24} color={C.danger} />
          </div>
          <p style={{ fontSize: 15, color: C.text, margin: '0 0 24px', lineHeight: 1.5 }}>
            {L.deleteConfirm}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              style={s.cancelBtn}
              onClick={() => setDeleteTarget(null)}
            >
              {L.cancel}
            </button>
            <button
              style={{
                ...s.saveBtn,
                backgroundColor: C.danger,
              }}
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
