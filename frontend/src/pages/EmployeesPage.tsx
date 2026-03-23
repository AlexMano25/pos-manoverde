import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Loader2,
  UserCheck,
  UserX,
  Store as StoreIcon,
  BarChart3,
  List,
  TrendingUp,
  Clock,
  DollarSign,
  Award,
  FileText,
  Share2,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import MiniBarChart from '../components/charts/MiniBarChart'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useOrderStore } from '../stores/orderStore'
import { useTimeAttendanceStore } from '../stores/timeAttendanceStore'
import { db } from '../db/dexie'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import type { User, UserRole } from '../types'
import { generateUUID } from '../utils/uuid'
import { useResponsive } from '../hooks/useLayoutMode'
import { getSidebarItems } from '../data/sidebarConfig'
import { formatCurrency } from '../utils/currency'
import { computeEmployeePerformance, computeTeamSummary } from '../utils/payrollCalculation'
import { exportPayslip } from '../utils/pdfExport'

// ── Edge Function helpers ────────────────────────────────────────────────

/** Extract actual error message from supabase.functions.invoke() response */
function extractEdgeError(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error)
  const err = error as Record<string, unknown>
  // FunctionsHttpError stores the response body in .context
  if (err.context && typeof err.context === 'object') {
    const ctx = err.context as Record<string, unknown>
    if (typeof ctx.error === 'string') return ctx.error
  }
  // Fallback to .message
  if (typeof err.message === 'string') return err.message
  return String(error)
}

// ── Error translation ────────────────────────────────────────────────────
// Maps raw English Edge Function / Supabase errors to user-friendly i18n keys

function translateError(msg: string, t: Record<string, any>): string {
  const low = msg.toLowerCase()

  // Network / CORS errors
  if (low.includes('failed to send a request') || low.includes('failed to fetch') || low.includes('networkerror'))
    return t.employees?.networkError ?? 'Erreur de connexion au serveur. Vérifiez votre connexion internet et réessayez.'

  // Generic Edge Function wrapper (when actual error couldn't be extracted)
  if (low.includes('non-2xx status code') || low.includes('edge function'))
    return t.employees?.serverError ?? 'Erreur serveur. Veuillez réessayer dans quelques instants.'

  // Email already used
  if (low.includes('already been registered') || low.includes('already in use') || low.includes('email already'))
    return t.employees?.emailInUse ?? 'Cette adresse e-mail est déjà utilisée par un autre compte.'

  // PIN already used
  if (low.includes('pin already'))
    return t.employees?.pinInUse ?? 'Ce code PIN est déjà utilisé par un autre employé.'

  // Permission denied
  if (low.includes('permission denied') || low.includes('only admin'))
    return t.employees?.permissionDenied ?? 'Vous n\'avez pas les droits pour effectuer cette action.'

  // Unauthorized / session expired
  if (low.includes('unauthorized') || low.includes('missing authorization') || low.includes('jwt'))
    return t.employees?.sessionExpired ?? 'Votre session a expiré. Veuillez vous reconnecter.'

  // Password too short
  if (low.includes('password must be at least') || low.includes('password_too_short'))
    return t.employees?.passwordHint ?? 'Le mot de passe doit contenir au moins 6 caractères.'

  // Invalid role
  if (low.includes('invalid role'))
    return t.employees?.invalidRole ?? 'Rôle invalide sélectionné.'

  // Missing required fields
  if (low.includes('missing required'))
    return t.employees?.missingFields ?? 'Veuillez remplir tous les champs obligatoires.'

  // Employee not found
  if (low.includes('employee not found') || low.includes('not found'))
    return t.employees?.employeeNotFound ?? 'Employé introuvable.'

  // Different store
  if (low.includes('different store'))
    return t.employees?.differentStore ?? 'Impossible de modifier un employé d\'une autre boutique.'

  // Profile creation failed
  if (low.includes('failed to create user profile'))
    return t.employees?.profileCreateFailed ?? 'Erreur lors de la création du profil. Veuillez réessayer.'

  // Generic server error
  if (low.includes('internal server error') || low.includes('500'))
    return t.employees?.serverError ?? 'Erreur serveur. Veuillez réessayer dans quelques instants.'

  // Return as-is if no match (shouldn't happen in practice)
  return msg
}

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
} as const

const roleColors: Record<UserRole, string> = {
  admin: '#dc2626',
  manager: '#2563eb',
  cashier: '#16a34a',
  stock: '#f59e0b',
  super_admin: '#7c3aed',
  agent: '#d97706',
}

// ── Employee form state ──────────────────────────────────────────────────

interface EmployeeForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
  phone: string
  pin: string
  allowed_pages: string[]
}

const emptyForm: EmployeeForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'cashier',
  phone: '',
  pin: '',
  allowed_pages: [],
}

// ── Component ────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const { user: currentUser } = useAuthStore()
  const { currentStore, mode } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null)
  const [form, setForm] = useState<EmployeeForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingEmployee, setDeletingEmployee] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'performance'>('list')

  // Stores for performance data
  const { orders } = useOrderStore()
  const { entries: timeEntries, loadEntries: loadTimeEntries } = useTimeAttendanceStore()
  const currency = currentStore?.currency || 'XAF'

  // Load time entries for performance
  useEffect(() => {
    if (currentStore?.id) loadTimeEntries(currentStore.id)
  }, [currentStore?.id, loadTimeEntries])

  // Performance computations
  const employeePerformance = useMemo(() => {
    if (employees.length === 0) return []
    return computeEmployeePerformance(employees, orders, timeEntries, 30)
  }, [employees, orders, timeEntries])

  const teamSummary = useMemo(() => {
    return computeTeamSummary(employeePerformance, timeEntries)
  }, [employeePerformance, timeEntries])

  // Performance labels
  const perfLabel = {
    performanceTab: (t.employees as Record<string, string>)?.performanceTab ?? 'Performance',
    listTab: (t.employees as Record<string, string>)?.listTab ?? 'List',
    teamSummary: (t.employees as Record<string, string>)?.teamSummary ?? 'Team Summary',
    activeToday: (t.employees as Record<string, string>)?.activeToday ?? 'Active Today',
    totalSalesPeriod: (t.employees as Record<string, string>)?.totalSalesPeriod ?? 'Total Sales (30d)',
    topPerformer: (t.employees as Record<string, string>)?.topPerformer ?? 'Top Performer',
    salesPerHour: (t.employees as Record<string, string>)?.salesPerHour ?? 'Sales/Hour',
    avgTicket: (t.employees as Record<string, string>)?.avgTicket ?? 'Avg Ticket',
    ordersCount: (t.employees as Record<string, string>)?.ordersCount ?? 'Orders',
    itemsSold: (t.employees as Record<string, string>)?.itemsSold ?? 'Items Sold',
    topCategory: (t.employees as Record<string, string>)?.topCategory ?? 'Top Category',
    hoursWorked: (t.employees as Record<string, string>)?.hoursWorked ?? 'Hours Worked',
    daysPresent: (t.employees as Record<string, string>)?.daysPresent ?? 'Days Present',
    lateArrivals: (t.employees as Record<string, string>)?.lateArrivals ?? 'Late Arrivals',
    overtimeHours: (t.employees as Record<string, string>)?.overtimeHours ?? 'Overtime',
    noPerformanceData: (t.employees as Record<string, string>)?.noPerformanceData ?? 'No performance data for this period',
    totalSales: (t.employees as Record<string, string>)?.totalSales ?? 'Total Sales',
    employeePerformance: (t.employees as Record<string, string>)?.employeePerformance ?? 'Employee Performance',
    avgSalesEmployee: (t.employees as Record<string, string>)?.avgSalesEmployee ?? 'Avg Sales/Employee',
    totalHoursToday: (t.employees as Record<string, string>)?.totalHoursToday ?? 'Hours Today',
    exportPayslip: (t.employees as Record<string, string>)?.exportPayslip ?? 'Export Payslip',
    salesRanking: (t.employees as Record<string, string>)?.salesRanking ?? 'Sales Ranking',
  }

  const roleLabels: Record<UserRole, string> = {
    admin: t.employees.admin,
    manager: t.employees.manager,
    cashier: t.employees.cashier,
    stock: t.employees.stockRole,
    super_admin: 'Super Admin',
    agent: 'Agent',
  }

  const loadEmployees = useCallback(async () => {
    if (!currentStore?.id) return
    setLoading(true)
    try {
      let users = await db.users
        .where('store_id')
        .equals(currentStore.id)
        .toArray()

      // Never show super_admin in employee list
      users = users.filter((u) => u.role !== 'super_admin' && u.role !== 'agent')

      // Role-based filtering
      if (currentUser?.role === 'manager') {
        users = users.filter((u) => u.role === 'cashier' || u.role === 'stock' || u.id === currentUser.id)
      }

      setEmployees(users)
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, currentUser])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  const openAddModal = () => {
    setEditingEmployee(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = async (emp: User) => {
    // Fetch latest data from Supabase (allowed_pages may have changed)
    let latestEmp = emp
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('users')
          .select('id, store_id, name, email, role, pin, phone, is_active, allowed_pages, created_at, updated_at')
          .eq('id', emp.id)
          .single()
        if (data) latestEmp = data as User
      } catch { /* use local data as fallback */ }
    }
    setEditingEmployee(latestEmp)
    setForm({
      name: latestEmp.name,
      email: latestEmp.email,
      password: '',
      confirmPassword: '',
      role: latestEmp.role,
      phone: latestEmp.phone || '',
      pin: latestEmp.pin || '',
      allowed_pages: latestEmp.allowed_pages || [],
    })
    setFormError('')
    setShowModal(true)
  }

  const openDeleteModal = (emp: User) => {
    setDeletingEmployee(emp)
    setShowDeleteModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(t.common.name + ' - ' + t.common.required)
      return
    }
    if (!form.email.trim()) {
      setFormError(t.common.email + ' - ' + t.common.required)
      return
    }
    if (!currentStore) return

    // Password validation for cloud mode
    if (isSupabaseConfigured && supabase) {
      if (!editingEmployee && !form.password) {
        setFormError(t.employees.passwordRequired)
        return
      }
      if (form.password && form.password.length < 6) {
        setFormError(t.employees.passwordHint)
        return
      }
      if (form.password && form.password !== form.confirmPassword) {
        setFormError(t.employees.passwordMismatch)
        return
      }
    }

    setSaving(true)
    setFormError('')

    try {
      // Helper: save employee locally in IndexedDB
      const saveLocal = async () => {
        const now = new Date().toISOString()
        if (editingEmployee) {
          await db.users.update(editingEmployee.id, {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            phone: form.phone.trim() || undefined,
            pin: form.pin.trim() || undefined,
            allowed_pages: form.allowed_pages.length > 0 ? form.allowed_pages : undefined,
            updated_at: now,
          })
        } else {
          const newUser: User = {
            id: generateUUID(),
            store_id: currentStore.id,
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            phone: form.phone.trim() || undefined,
            pin: form.pin.trim() || undefined,
            allowed_pages: form.allowed_pages.length > 0 ? form.allowed_pages : undefined,
            is_active: true,
            created_at: now,
            updated_at: now,
          }
          await db.users.add(newUser)
        }
      }

      // Cloud mode: try Edge Functions, fallback to local
      if (isSupabaseConfigured && supabase) {
        let cloudSuccess = false

        try {
          if (editingEmployee) {
            // Update via Edge Function
            const updates: Record<string, unknown> = {
              name: form.name.trim(),
              role: form.role,
              phone: form.phone.trim() || null,
              pin: form.pin.trim() || null,
              allowed_pages: form.allowed_pages.length > 0 ? form.allowed_pages : null,
            }
            if (form.email.trim() !== editingEmployee.email) {
              updates.email = form.email.trim()
            }
            if (form.password) {
              updates.password = form.password
            }

            const { data, error } = await supabase.functions.invoke('update-employee', {
              body: { employee_id: editingEmployee.id, updates },
            })

            if (error) throw new Error(extractEdgeError(error))
            if (data?.error) throw new Error(data.error)

            // Update local IndexedDB
            if (data?.user) {
              await db.users.update(editingEmployee.id, data.user)
            }
            cloudSuccess = true
          } else {
            // Create via Edge Function
            const { data, error } = await supabase.functions.invoke('create-employee', {
              body: {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                role: form.role,
                phone: form.phone.trim() || null,
                pin: form.pin.trim() || null,
                allowed_pages: form.allowed_pages.length > 0 ? form.allowed_pages : null,
                store_id: currentStore.id,
              },
            })

            if (error) throw new Error(extractEdgeError(error))
            if (data?.error) throw new Error(data.error)

            // Add to local IndexedDB
            if (data?.user) {
              await db.users.add(data.user as User)
            }
            cloudSuccess = true
          }
        } catch (cloudErr) {
          // Edge Function unavailable or failed → fall back to local storage
          console.warn('[employees] Edge Function failed, falling back to local:', cloudErr)
          cloudSuccess = false
        }

        // Fallback: save locally if cloud failed
        if (!cloudSuccess) {
          await saveLocal()
        }
      } else {
        // Offline / local mode: direct IndexedDB (no auth account)
        await saveLocal()
      }

      setShowModal(false)
      setForm(emptyForm)
      await loadEmployees()
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.common.error
      setFormError(translateError(msg, t))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingEmployee) return
    try {
      const deactivateLocal = async () => {
        await db.users.update(deletingEmployee.id, {
          is_active: false,
          updated_at: new Date().toISOString(),
        })
      }

      if (isSupabaseConfigured && supabase) {
        let cloudSuccess = false
        try {
          const { data, error } = await supabase.functions.invoke('update-employee', {
            body: { employee_id: deletingEmployee.id, updates: { is_active: false } },
          })
          if (error) throw new Error(extractEdgeError(error))
          if (data?.error) throw new Error(data.error)
          if (data?.user) await db.users.update(deletingEmployee.id, data.user)
          cloudSuccess = true
        } catch (cloudErr) {
          console.warn('[employees] Edge Function failed on delete, falling back to local:', cloudErr)
          cloudSuccess = false
        }
        if (!cloudSuccess) {
          await deactivateLocal()
        }
      } else {
        await deactivateLocal()
      }
      setShowDeleteModal(false)
      setDeletingEmployee(null)
      await loadEmployees()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const toggleActive = async (emp: User) => {
    try {
      const toggleLocal = async () => {
        await db.users.update(emp.id, {
          is_active: !emp.is_active,
          updated_at: new Date().toISOString(),
        })
      }

      if (isSupabaseConfigured && supabase) {
        let cloudSuccess = false
        try {
          const { data, error } = await supabase.functions.invoke('update-employee', {
            body: { employee_id: emp.id, updates: { is_active: !emp.is_active } },
          })
          if (error) throw new Error(extractEdgeError(error))
          if (data?.error) throw new Error(data.error)
          if (data?.user) await db.users.update(emp.id, data.user)
          cloudSuccess = true
        } catch (cloudErr) {
          console.warn('[employees] Edge Function failed on toggle, falling back to local:', cloudErr)
          cloudSuccess = false
        }
        if (!cloudSuccess) {
          await toggleLocal()
        }
      } else {
        await toggleLocal()
      }
      await loadEmployees()
    } catch (err) {
      console.error('Toggle active error:', err)
    }
  }

  const updateField = (field: keyof EmployeeForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFormError('')
  }

  // Server mode check
  if (mode === 'client') {
    return (
      <div style={{
        padding: 24,
        backgroundColor: C.bg,
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center', color: C.textSecondary }}>
          <Users size={48} color={C.border} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
            {t.employees.serverModeOnly}
          </h2>
          <p style={{ fontSize: 14, margin: 0 }}>
            {t.employees.serverModeMessage}
          </p>
        </div>
      </div>
    )
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(12, 20, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.primary,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const tableCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `1px solid ${C.border}`,
    backgroundColor: '#f8fafc',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 14,
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
  }

  const badgeStyle = (bgColor: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    color: bgColor,
    backgroundColor: bgColor + '15',
  })

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color,
    padding: 6,
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  // Form styles
  const formFieldStyle: React.CSSProperties = { marginBottom: 16 }
  const formLabelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 6 }
  const formInputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }
  const formSelectStyle: React.CSSProperties = { ...formInputStyle, cursor: 'pointer', backgroundColor: C.card }
  const formRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }
  const formErrorStyle: React.CSSProperties = { backgroundColor: '#fef2f2', color: C.danger, padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }
  const formBtnRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }
  const cancelBtnStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: '#ffffff', color: C.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }
  const saveBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: C.primary, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }
  const deleteBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: C.danger, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textSecondary, fontSize: 16 }}>{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>{t.employees.title}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeTab === 'list' && (
            <button style={addBtnStyle} onClick={openAddModal}>
              <Plus size={16} /> {t.employees.addEmployee}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {([
          { key: 'list' as const, label: perfLabel.listTab, icon: List },
          { key: 'performance' as const, label: perfLabel.performanceTab, icon: BarChart3 },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${activeTab === tab.key ? C.primary : C.border}`,
              backgroundColor: activeTab === tab.key ? C.primary + '10' : C.card,
              color: activeTab === tab.key ? C.primary : C.textSecondary,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Store context indicator for admin managing multi-store orgs */}
      {currentUser?.role === 'admin' && currentStore && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          marginBottom: 16,
          backgroundColor: '#eff6ff',
          borderRadius: 8,
          border: '1px solid #bfdbfe',
          fontSize: 13,
          color: '#1e40af',
        }}>
          <StoreIcon size={16} />
          <span>
            {t.employees.currentStore || 'Boutique actuelle'} : <strong>{currentStore.name}</strong>
          </span>
          <span style={{
            fontSize: 11,
            backgroundColor: '#dbeafe',
            padding: '2px 8px',
            borderRadius: 4,
            marginLeft: 4,
          }}>
            {(t.setup as Record<string, string>)?.[currentStore.activity] || currentStore.activity}
          </span>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <>
          {/* Team Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: rv(8, 12, 16),
            marginBottom: 20,
          }}>
            {[
              { label: perfLabel.activeToday, value: String(teamSummary.activeToday), icon: Users, color: '#2563eb' },
              { label: perfLabel.totalSalesPeriod, value: formatCurrency(teamSummary.totalSalesThisPeriod, currency), icon: DollarSign, color: '#16a34a' },
              { label: perfLabel.avgSalesEmployee, value: formatCurrency(teamSummary.avgSalesPerEmployee, currency), icon: TrendingUp, color: '#7c3aed' },
              { label: perfLabel.totalHoursToday, value: `${teamSummary.totalHoursToday}h`, icon: Clock, color: '#f59e0b' },
            ].map((card, i) => (
              <div key={i} style={{
                backgroundColor: C.card,
                borderRadius: 12,
                padding: rv(12, 16, 16),
                border: `1px solid ${C.border}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: card.color + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <card.icon size={16} color={card.color} />
                  </div>
                </div>
                <div style={{ fontSize: rv(16, 20, 22), fontWeight: 700, color: C.text }}>{card.value}</div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Top Performer Banner */}
          {teamSummary.topPerformer && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              marginBottom: 20,
              backgroundColor: '#fefce8',
              borderRadius: 10,
              border: '1px solid #fde68a',
            }}>
              <Award size={20} color="#f59e0b" />
              <div>
                <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                  {perfLabel.topPerformer}: {teamSummary.topPerformer.name}
                </span>
                <span style={{ fontSize: 12, color: '#a16207', marginLeft: 8 }}>
                  {formatCurrency(teamSummary.topPerformer.sales, currency)}
                </span>
              </div>
            </div>
          )}

          {/* Sales Ranking Chart */}
          {employeePerformance.length > 0 && (
            <div style={{
              backgroundColor: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: rv(12, 16, 20),
              marginBottom: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
                {perfLabel.salesRanking}
              </h3>
              <MiniBarChart
                data={employeePerformance.slice(0, 10).map(p => ({
                  label: p.userName.split(' ')[0],
                  value: p.totalSales,
                }))}
                height={180}
                color="#2563eb"
                currencyCode={currency}
              />
            </div>
          )}

          {/* Employee Performance Cards */}
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
            {perfLabel.employeePerformance}
          </h3>

          {employeePerformance.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              color: C.textSecondary,
              backgroundColor: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
            }}>
              <BarChart3 size={36} color={C.border} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, margin: 0 }}>{perfLabel.noPerformanceData}</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
            }}>
              {employeePerformance.map((perf, idx) => (
                <div key={perf.userId} style={{
                  backgroundColor: C.card,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  {/* Card Header */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        backgroundColor: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : idx === 2 ? '#fef2f2' : '#f8fafc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700,
                        color: idx === 0 ? '#92400e' : idx === 1 ? '#475569' : idx === 2 ? '#9a3412' : C.textSecondary,
                      }}>
                        #{idx + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{perf.userName}</div>
                        <span style={badgeStyle(roleColors[perf.role as UserRole] || C.textSecondary)}>
                          {roleLabels[perf.role as UserRole] || perf.role}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const emp = employees.find(e => e.id === perf.userId)
                        if (emp && currentStore) {
                          exportPayslip(perf, currentStore.name, currency)
                        }
                      }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: C.primary, padding: 6, borderRadius: 6,
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                      }}
                      title={perfLabel.exportPayslip}
                    >
                      <FileText size={14} />
                    </button>
                  </div>

                  {/* Card Metrics */}
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                      {/* Total Sales */}
                      <div>
                        <div style={{ fontSize: 11, color: C.textSecondary }}>{perfLabel.totalSales}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>
                          {formatCurrency(perf.totalSales, currency)}
                        </div>
                      </div>
                      {/* Orders */}
                      <div>
                        <div style={{ fontSize: 11, color: C.textSecondary }}>{perfLabel.ordersCount}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{perf.orderCount}</div>
                      </div>
                      {/* Avg Ticket */}
                      <div>
                        <div style={{ fontSize: 11, color: C.textSecondary }}>{perfLabel.avgTicket}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                          {formatCurrency(perf.avgTicket, currency)}
                        </div>
                      </div>
                      {/* Sales/Hour */}
                      <div>
                        <div style={{ fontSize: 11, color: C.textSecondary }}>{perfLabel.salesPerHour}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                          {formatCurrency(perf.salesPerHour, currency)}
                        </div>
                      </div>
                      {/* Items Sold */}
                      <div>
                        <div style={{ fontSize: 11, color: C.textSecondary }}>{perfLabel.itemsSold}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{perf.itemsSold}</div>
                      </div>
                      {/* Top Category */}
                      <div>
                        <div style={{ fontSize: 11, color: C.textSecondary }}>{perfLabel.topCategory}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{perf.topCategory || '-'}</div>
                      </div>
                    </div>

                    {/* Attendance Section */}
                    <div style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: `1px solid ${C.border}`,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr 1fr',
                      gap: 8,
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{perf.totalHoursWorked}h</div>
                        <div style={{ fontSize: 10, color: C.textSecondary }}>{perfLabel.hoursWorked}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{perf.daysPresent}</div>
                        <div style={{ fontSize: 10, color: C.textSecondary }}>{perfLabel.daysPresent}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: perf.lateArrivals > 3 ? C.danger : perf.lateArrivals > 0 ? C.warning : C.success,
                        }}>
                          {perf.lateArrivals}
                        </div>
                        <div style={{ fontSize: 10, color: C.textSecondary }}>{perfLabel.lateArrivals}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: perf.overtimeHours > 0 ? '#7c3aed' : C.text,
                        }}>
                          {perf.overtimeHours}h
                        </div>
                        <div style={{ fontSize: 10, color: C.textSecondary }}>{perfLabel.overtimeHours}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Table (List Tab) */}
      {activeTab === 'list' && <div style={tableCardStyle}>
        {employees.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.textSecondary }}>
            <Users size={40} color={C.border} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>{t.employees.noEmployees}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t.common.name}</th>
                <th style={thStyle}>{t.employees.role}</th>
                <th style={thStyle}>{t.common.email}</th>
                <th style={thStyle}>{t.common.phone}</th>
                <th style={thStyle}>{t.common.status}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{emp.name}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(roleColors[emp.role])}>
                      {roleLabels[emp.role]}
                    </span>
                  </td>
                  <td style={tdStyle}>{emp.email}</td>
                  <td style={tdStyle}>{emp.phone || '-'}</td>
                  <td style={tdStyle}>
                    <button
                      style={{
                        ...badgeStyle(emp.is_active ? C.success : C.textSecondary),
                        border: 'none',
                        cursor: 'pointer',
                        background: (emp.is_active ? C.success : C.textSecondary) + '15',
                      }}
                      onClick={() => toggleActive(emp)}
                      title={emp.is_active ? t.common.inactive : t.common.active}
                    >
                      {emp.is_active ? (
                        <><UserCheck size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t.common.active}</>
                      ) : (
                        <><UserX size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t.common.inactive}</>
                      )}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      style={actionBtnStyle(C.primary)}
                      onClick={() => openEditModal(emp)}
                      title={t.common.edit}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      style={actionBtnStyle('#25D366')}
                      onClick={() => {
                        const pinParam = emp.pin ? `&pin=${emp.pin}` : ''
                        const loginUrl = `${window.location.origin}?store=${currentStore?.id || ''}&email=${encodeURIComponent(emp.email)}${pinParam}`
                        const msg = `Bonjour ${emp.name},\n\nVotre compte *${currentStore?.name || ''}* est pret.\n\n${emp.pin ? `Utilisez votre code PIN: *${emp.pin}*\n(Onglet "Connexion par PIN")` : `Email: ${emp.email}`}\n\nConnectez-vous ici:\n${loginUrl}`
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                      }}
                      title="Partager via WhatsApp"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      style={actionBtnStyle(C.danger)}
                      onClick={() => openDeleteModal(emp)}
                      title={t.common.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEmployee ? t.employees.editEmployee : t.employees.addEmployee}
        size="md"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{t.common.name} *</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder="Ex: Jean Dupont"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            autoFocus
          />
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{t.common.email} *</label>
          <input
            style={formInputStyle}
            type="email"
            placeholder="jean@manoverde.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>

        {/* Password fields (cloud mode only) */}
        {isSupabaseConfigured && (
          <div style={formRowStyle}>
            <div style={formFieldStyle}>
              <label style={formLabelStyle}>
                {t.employees.password} {!editingEmployee ? '*' : ''}
              </label>
              <input
                style={formInputStyle}
                type="password"
                placeholder={editingEmployee ? t.employees.passwordEditHint : t.employees.passwordHint}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
            </div>
            <div style={formFieldStyle}>
              <label style={formLabelStyle}>
                {t.employees.confirmPassword} {!editingEmployee ? '*' : ''}
              </label>
              <input
                style={formInputStyle}
                type="password"
                placeholder={t.employees.confirmPassword}
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
            </div>
          </div>
        )}

        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{t.employees.role}</label>
            <select
              style={formSelectStyle}
              value={form.role}
              onChange={(e) => updateField('role', e.target.value)}
            >
              {currentUser?.role === 'admin' && <option value="admin">{t.employees.admin}</option>}
              {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                <option value="manager">{t.employees.manager}</option>
              )}
              <option value="cashier">{t.employees.cashier}</option>
              <option value="stock">{t.employees.stockRole}</option>
            </select>
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{t.common.phone}</label>
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
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{t.employees.pin}</label>
          <input
            style={formInputStyle}
            type="password"
            placeholder="Ex: 1234"
            value={form.pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6)
              updateField('pin', val)
            }}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            maxLength={6}
            inputMode="numeric"
          />
        </div>

        {/* ── Page Access Permissions ─────────────────────────────── */}
        <div style={{ ...formFieldStyle, marginTop: 8 }}>
          <label style={{ ...formLabelStyle, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.employees.pageAccess}
            <span style={{ fontSize: 11, color: C.textSecondary, fontWeight: 400 }}>
              {t.employees.pageAccessHint}
            </span>
          </label>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 6, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`,
            backgroundColor: '#f8fafc', maxHeight: 220, overflowY: 'auto',
          }}>
            {getSidebarItems(currentStore?.activity)
              .filter(item => !['super_admin', 'employees', 'billing', 'forecast', 'multi_store', 'webhooks', 'data_exchange'].includes(item.pageComponent))
              .map(item => {
              const pageKey = item.pageComponent
              const checked = form.allowed_pages.includes(pageKey)
              const label = (() => {
                const keys = item.i18nKey.split('.')
                let val: any = t
                for (const k of keys) val = val?.[k]
                return typeof val === 'string' ? val : pageKey
              })()
              return (
                <label key={pageKey} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, color: C.text, cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 6,
                  backgroundColor: checked ? C.primary + '10' : 'transparent',
                }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setForm(prev => ({
                        ...prev,
                        allowed_pages: checked
                          ? prev.allowed_pages.filter(p => p !== pageKey)
                          : [...prev.allowed_pages, pageKey],
                      }))
                    }}
                    style={{ accentColor: C.primary, width: 16, height: 16 }}
                  />
                  {label}
                </label>
              )
            })}
          </div>
          {form.allowed_pages.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setForm(prev => ({
                  ...prev,
                  allowed_pages: getSidebarItems(currentStore?.activity)
                    .filter(i => !['super_admin', 'employees', 'billing', 'forecast', 'multi_store', 'webhooks', 'data_exchange'].includes(i.pageComponent))
                    .map(i => i.pageComponent),
                }))}
                style={{ fontSize: 11, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {t.employees.checkAll}
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, allowed_pages: [] }))}
                style={{ fontSize: 11, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {t.employees.uncheckDefault}
              </button>
            </div>
          )}
        </div>

        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowModal(false)}>
            {t.common.cancel}
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? t.common.loading : editingEmployee ? t.common.edit : t.common.add}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t.products.deleteConfirm}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 8px' }}>
          {t.employees.deleteConfirm}
        </p>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
          <strong>{deletingEmployee?.name}</strong>
        </p>
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowDeleteModal(false)}>
            {t.common.cancel}
          </button>
          <button style={deleteBtnStyle} onClick={handleDelete}>
            {t.common.delete}
          </button>
        </div>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
