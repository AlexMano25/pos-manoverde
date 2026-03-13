import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield, Building2, CreditCard, Key, BarChart3, Search, RefreshCw,
  Copy, CheckCircle2, AlertTriangle, Loader2, ChevronDown, ChevronUp,
  Package, ShoppingCart, Users, Edit3, Lock, Unlock,
  Mail, Store, Eye, EyeOff, Save, X,
  UserCheck, UserX, KeyRound, DollarSign,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { generateLicenseCode } from '../utils/licenseManager'
import type { OrgSummary, LicenseCode, SubscriptionPlan } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  bg: '#F9FAFB',
  card: '#ffffff',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#059669',
  successLight: '#D1FAE5',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  headerStart: '#1E293B',
  headerEnd: '#334155',
  stripe: '#F8FAFC',
  hoverRow: '#F1F5F9',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
} as const

const PLANS: SubscriptionPlan[] = ['free', 'starter', 'pro', 'enterprise', 'pay_as_you_grow']

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: 'Decouverte',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
  pay_as_you_grow: 'Pay-as-you-grow',
}

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  free: '#94A3B8',
  starter: '#2563EB',
  pro: '#7C3AED',
  enterprise: '#059669',
  pay_as_you_grow: '#F59E0B',
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  manager: 'Gerant',
  cashier: 'Caissier',
  stock: 'Gestionnaire Stock',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#DC2626',
  admin: '#2563EB',
  manager: '#7C3AED',
  cashier: '#059669',
  stock: '#F59E0B',
}

type TabId = 'organizations' | 'users' | 'plans' | 'licenses' | 'analytics'

// ── Plan config type ────────────────────────────────────────────────────

interface PlanConfig {
  plan: SubscriptionPlan
  max_products: number | null
  max_orders_per_day: number | null
  max_stores: number | null
  max_employees: number | null
  price_monthly?: number | null
  price_yearly?: number | null
}

// ── User type for admin management ──────────────────────────────────────

interface AdminUser {
  id: string
  store_id: string
  name: string
  email: string
  role: string
  phone: string
  is_active: boolean
  pin: string
  auth_id: string | null
  created_at: string
  updated_at: string
  store_name?: string
  org_name?: string
  org_id?: string
}

// ── Shared styles ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: `1px solid ${C.border}`, fontSize: 14, boxSizing: 'border-box',
  outline: 'none',
}

const btnPrimary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
  borderRadius: 8, border: 'none', background: C.primary, color: '#fff',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
}

const btnOutline: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
  borderRadius: 6, border: `1px solid ${C.border}`, background: C.card,
  fontSize: 12, cursor: 'pointer', color: C.text,
}

// ── Component ────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  useAppStore()
  useLanguageStore()
  const { rv } = useResponsive()

  const [activeTab, setActiveTab] = useState<TabId>('organizations')

  // ── Organizations state ──────────────────────────────────────────────
  const [orgs, setOrgs] = useState<OrgSummary[]>([])
  const [orgSearch, setOrgSearch] = useState('')
  const [orgPlanFilter, setOrgPlanFilter] = useState<string>('all')
  const [orgStatusFilter, setOrgStatusFilter] = useState<string>('all')
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [changePlanOrg, setChangePlanOrg] = useState<Record<string, SubscriptionPlan>>({})
  const [orgLoading, setOrgLoading] = useState(false)
  const [orgStores, setOrgStores] = useState<Record<string, any[]>>({})

  // ── Users state ────────────────────────────────────────────────────
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')
  const [userOrgFilter, setUserOrgFilter] = useState<string>('all')
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all')
  const [usersLoading, setUsersLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<Partial<AdminUser>>({})
  const [resetPwdUser, setResetPwdUser] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [userSaving, setUserSaving] = useState(false)
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Plans state ──────────────────────────────────────────────────────
  const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([])
  const [planEdits, setPlanEdits] = useState<Record<SubscriptionPlan, Partial<PlanConfig>>>({} as any)
  const [planLoading, setPlanLoading] = useState(false)
  const [planSaving, setPlanSaving] = useState<SubscriptionPlan | null>(null)

  // ── Licenses state ───────────────────────────────────────────────────
  const [licenseOrgId, setLicenseOrgId] = useState('')
  const [licensePlan, setLicensePlan] = useState<SubscriptionPlan>('starter')
  const [licenseDays, setLicenseDays] = useState(30)
  const [generatedCode, setGeneratedCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [licenseHistory, setLicenseHistory] = useState<LicenseCode[]>([])
  const [licenseLoading, setLicenseLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // ── Data fetching ────────────────────────────────────────────────────

  const fetchOrganizations = useCallback(async () => {
    if (!supabase) return
    setOrgLoading(true)
    try {
      const { data: orgRows } = await supabase.from('organizations').select('*')
      const { data: subRows } = await supabase.from('subscriptions').select('*')
      const { data: storeRows } = await supabase.from('stores').select('id, name, organization_id, activity, currency')
      const { data: userRows } = await supabase.from('users').select('id, store_id')

      const subsMap: Record<string, { plan: SubscriptionPlan; status: string; period_end: string | null }> = {}
      ;(subRows || []).forEach((s: any) => {
        subsMap[s.organization_id] = { plan: s.plan, status: s.status, period_end: s.current_period_end || null }
      })

      const storeCountMap: Record<string, number> = {}
      const storesByOrg: Record<string, any[]> = {}
      ;(storeRows || []).forEach((s: any) => {
        storeCountMap[s.organization_id] = (storeCountMap[s.organization_id] || 0) + 1
        if (!storesByOrg[s.organization_id]) storesByOrg[s.organization_id] = []
        storesByOrg[s.organization_id].push(s)
      })
      setOrgStores(storesByOrg)

      // Count users per org
      const userCountMap: Record<string, number> = {}
      const storeToOrg: Record<string, string> = {}
      ;(storeRows || []).forEach((s: any) => { storeToOrg[s.id] = s.organization_id })
      ;(userRows || []).forEach((u: any) => {
        const orgId = storeToOrg[u.store_id]
        if (orgId) userCountMap[orgId] = (userCountMap[orgId] || 0) + 1
      })

      const summaries: OrgSummary[] = (orgRows || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        owner_email: o.owner_email || '',
        plan: subsMap[o.id]?.plan || 'free',
        status: (subsMap[o.id]?.status as any) || 'active',
        activity: storesByOrg[o.id]?.[0]?.activity || 'supermarket',
        stores_count: storeCountMap[o.id] || 0,
        products_count: userCountMap[o.id] || 0, // reuse field for user count
        orders_count: 0,
        created_at: o.created_at,
        period_end: subsMap[o.id]?.period_end || null,
        credit_balance: null,
      }))

      setOrgs(summaries)
    } catch (err) {
      console.error('Failed to fetch organizations:', err)
    } finally {
      setOrgLoading(false)
    }
  }, [])

  const fetchAllUsers = useCallback(async () => {
    if (!supabase) return
    setUsersLoading(true)
    try {
      const { data: userRows } = await supabase.from('users').select('*')
      const { data: storeRows } = await supabase.from('stores').select('id, name, organization_id')
      const { data: orgRows } = await supabase.from('organizations').select('id, name')

      const storeMap: Record<string, { name: string; org_id: string }> = {}
      ;(storeRows || []).forEach((s: any) => { storeMap[s.id] = { name: s.name, org_id: s.organization_id } })

      const orgMap: Record<string, string> = {}
      ;(orgRows || []).forEach((o: any) => { orgMap[o.id] = o.name })

      const users: AdminUser[] = (userRows || []).map((u: any) => ({
        ...u,
        store_name: storeMap[u.store_id]?.name || '—',
        org_name: orgMap[storeMap[u.store_id]?.org_id] || '—',
        org_id: storeMap[u.store_id]?.org_id || '',
      }))

      setAllUsers(users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const fetchPlanConfigs = useCallback(async () => {
    if (!supabase) return
    setPlanLoading(true)
    try {
      const { data } = await supabase.from('plan_config').select('*')
      if (data) setPlanConfigs(data as PlanConfig[])
    } catch (err) {
      console.error('Failed to fetch plan configs:', err)
    } finally {
      setPlanLoading(false)
    }
  }, [])

  const fetchLicenseHistory = useCallback(async () => {
    if (!supabase) return
    setLicenseLoading(true)
    try {
      const { data } = await supabase
        .from('license_codes')
        .select('*')
        .order('generated_at', { ascending: false })
      if (data) setLicenseHistory(data as LicenseCode[])
    } catch (err) {
      console.error('Failed to fetch license codes:', err)
    } finally {
      setLicenseLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'organizations' || activeTab === 'analytics') fetchOrganizations()
    if (activeTab === 'users') { fetchAllUsers(); if (orgs.length === 0) fetchOrganizations() }
    if (activeTab === 'plans') fetchPlanConfigs()
    if (activeTab === 'licenses') {
      fetchLicenseHistory()
      if (orgs.length === 0) fetchOrganizations()
    }
  }, [activeTab, fetchOrganizations, fetchPlanConfigs, fetchLicenseHistory, fetchAllUsers])

  // ── Organizations helpers ────────────────────────────────────────────

  const filteredOrgs = orgs.filter(o => {
    if (orgSearch) {
      const q = orgSearch.toLowerCase()
      if (!o.name.toLowerCase().includes(q) && !o.owner_email.toLowerCase().includes(q)) return false
    }
    if (orgPlanFilter !== 'all' && o.plan !== orgPlanFilter) return false
    if (orgStatusFilter !== 'all' && o.status !== orgStatusFilter) return false
    return true
  })

  const handleChangePlan = async (orgId: string) => {
    if (!supabase || !changePlanOrg[orgId]) return
    try {
      await supabase.from('subscriptions').update({ plan: changePlanOrg[orgId] }).eq('organization_id', orgId)
      await fetchOrganizations()
      setExpandedOrg(null)
    } catch (err) {
      console.error('Failed to change plan:', err)
    }
  }

  // ── Users helpers ──────────────────────────────────────────────────

  const filteredUsers = allUsers.filter(u => {
    if (userSearch) {
      const q = userSearch.toLowerCase()
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.store_name?.toLowerCase().includes(q)) return false
    }
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false
    if (userOrgFilter !== 'all' && u.org_id !== userOrgFilter) return false
    if (userStatusFilter !== 'all') {
      if (userStatusFilter === 'active' && !u.is_active) return false
      if (userStatusFilter === 'inactive' && u.is_active) return false
    }
    return true
  })

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setEditForm({ name: user.name, email: user.email, role: user.role, phone: user.phone, pin: user.pin })
    setUserMsg(null)
  }

  const handleSaveUser = async () => {
    if (!supabase || !editingUser) return
    setUserSaving(true)
    setUserMsg(null)
    try {
      const { error } = await supabase.from('users').update({
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        phone: editForm.phone || '',
        pin: editForm.pin || '',
      }).eq('id', editingUser.id)

      if (error) throw new Error(error.message)
      setUserMsg({ type: 'success', text: 'Utilisateur mis a jour avec succes' })
      await fetchAllUsers()
      setTimeout(() => { setEditingUser(null); setUserMsg(null) }, 1500)
    } catch (err) {
      setUserMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setUserSaving(false)
    }
  }

  const handleToggleActive = async (user: AdminUser) => {
    if (!supabase) return
    try {
      await supabase.from('users').update({ is_active: !user.is_active }).eq('id', user.id)
      await fetchAllUsers()
    } catch (err) {
      console.error('Failed to toggle user:', err)
    }
  }

  const handleResetPassword = async () => {
    if (!supabase || !resetPwdUser || !newPassword) return
    setUserSaving(true)
    setUserMsg(null)
    try {
      // Use Supabase admin API to update password
      const user = allUsers.find(u => u.id === resetPwdUser)
      if (!user?.auth_id) {
        setUserMsg({ type: 'error', text: 'Cet utilisateur n\'a pas de compte auth. Reset impossible.' })
        setUserSaving(false)
        return
      }
      // Update password via admin function
      const { error } = await supabase.rpc('admin_reset_password', {
        p_auth_id: user.auth_id,
        p_new_password: newPassword,
      })
      if (error) {
        // Fallback: update encrypted_password directly
        const { error: directError } = await supabase.from('users').update({
          password: newPassword, // Will be hashed by trigger
        }).eq('id', resetPwdUser)
        if (directError) throw new Error(directError.message)
      }
      setUserMsg({ type: 'success', text: 'Mot de passe reinitialise avec succes' })
      setNewPassword('')
      setTimeout(() => { setResetPwdUser(null); setUserMsg(null) }, 2000)
    } catch (err) {
      setUserMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setUserSaving(false)
    }
  }

  // ── Plans helpers ────────────────────────────────────────────────────

  const handlePlanFieldChange = (plan: SubscriptionPlan, field: keyof PlanConfig, value: number) => {
    setPlanEdits(prev => ({
      ...prev,
      [plan]: { ...prev[plan], [field]: value },
    }))
  }

  const handleSavePlan = async (config: PlanConfig) => {
    if (!supabase) return
    const edits = planEdits[config.plan]
    if (!edits) return
    setPlanSaving(config.plan)
    try {
      await supabase.from('plan_config').update(edits).eq('plan', config.plan)
      await fetchPlanConfigs()
      setPlanEdits(prev => {
        const next = { ...prev }
        delete next[config.plan]
        return next
      })
    } catch (err) {
      console.error('Failed to save plan config:', err)
    } finally {
      setPlanSaving(null)
    }
  }

  // ── Licenses helpers ─────────────────────────────────────────────────

  const handleGenerateCode = async () => {
    if (!licenseOrgId || !supabase) return
    setGenerating(true)
    try {
      const code = await generateLicenseCode(licenseOrgId, licensePlan, licenseDays)
      setGeneratedCode(code)
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id || 'unknown'
      await supabase.from('license_codes').insert({
        organization_id: licenseOrgId, code, plan: licensePlan, days: licenseDays,
        generated_by: userId, generated_at: new Date().toISOString(), is_used: false, used_at: null,
      })
      await fetchLicenseHistory()
    } catch (err) {
      console.error('Failed to generate license:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  // ── Analytics computations ───────────────────────────────────────────

  const planDistribution = PLANS.map(p => ({
    plan: p,
    count: orgs.filter(o => o.plan === p).length,
  }))
  const maxPlanCount = Math.max(1, ...planDistribution.map(d => d.count))

  const PLAN_PRICES: Record<SubscriptionPlan, number> = {
    free: 0, starter: 5000, pro: 15000, enterprise: 50000, pay_as_you_grow: 2000,
  }
  const estimatedRevenue = orgs.reduce((sum, o) => sum + (PLAN_PRICES[o.plan] || 0), 0)

  // ── Tab definitions ──────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'organizations', label: 'Organisations', icon: <Building2 size={rv(14, 16, 16)} />, count: orgs.length },
    { id: 'users', label: 'Utilisateurs', icon: <Users size={rv(14, 16, 16)} />, count: allUsers.length },
    { id: 'plans', label: 'Plans & Tarifs', icon: <CreditCard size={rv(14, 16, 16)} /> },
    { id: 'licenses', label: 'Licences', icon: <Key size={rv(14, 16, 16)} /> },
    { id: 'analytics', label: 'Analyses', icon: <BarChart3 size={rv(14, 16, 16)} /> },
  ]

  // ── Guard ─────────────────────────────────────────────────────────────

  if (!isSupabaseConfigured) {
    return (
      <div style={{ padding: rv(16, 24, 32), textAlign: 'center', color: C.textSecondary }}>
        <AlertTriangle size={48} color={C.warning} style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 16, fontWeight: 600 }}>Supabase non configure. Super Admin necessite une connexion cloud.</p>
      </div>
    )
  }

  // ── Render: Organizations ─────────────────────────────────────────────

  const renderOrganizationsTab = () => (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={16} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: 10 }} />
          <input value={orgSearch} onChange={e => setOrgSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <select value={orgPlanFilter} onChange={e => setOrgPlanFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">Tous les plans</option>
          {PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
        </select>
        <select value={orgStatusFilter} onChange={e => setOrgStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="trial">Essai</option>
          <option value="past_due">Impaye</option>
          <option value="cancelled">Annule</option>
        </select>
        <button onClick={fetchOrganizations} style={btnPrimary}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {orgLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={28} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${C.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: rv(12, 13, 14) }}>
            <thead>
              <tr style={{ background: C.headerStart, color: '#fff' }}>
                {['Organisation', 'Proprietaire', 'Plan', 'Statut', 'Boutiques', 'Utilisateurs', 'Cree le'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
                <th style={{ padding: '10px 12px', width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: C.textSecondary }}>Aucune organisation trouvee</td></tr>
              ) : filteredOrgs.map((org, i) => (
                <React.Fragment key={org.id}>
                  <tr onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                    style={{ background: i % 2 === 0 ? C.card : C.stripe, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.hoverRow)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? C.card : C.stripe)}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={16} color={C.primary} />
                        {org.name}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: C.textSecondary }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} />{org.owner_email}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: PLAN_COLORS[org.plan] || C.textSecondary }}>
                        {PLAN_LABELS[org.plan] || org.plan}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        color: org.status === 'active' ? C.success : org.status === 'past_due' ? C.error : C.warning,
                        background: org.status === 'active' ? C.successLight : org.status === 'past_due' ? C.errorLight : C.warningLight,
                      }}>
                        {org.status === 'active' ? 'Actif' : org.status === 'past_due' ? 'Impaye' : org.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Store size={13} />{org.stores_count}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={13} />{org.products_count}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: C.textSecondary, whiteSpace: 'nowrap' }}>
                      {new Date(org.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {expandedOrg === org.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>
                  {expandedOrg === org.id && (
                    <tr style={{ background: C.primaryLight }}>
                      <td colSpan={8} style={{ padding: rv(12, 16, 20) }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {/* Change plan */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Changer le plan :</span>
                            <select
                              value={changePlanOrg[org.id] || org.plan}
                              onChange={e => setChangePlanOrg(prev => ({ ...prev, [org.id]: e.target.value as SubscriptionPlan }))}
                              style={{ ...inputStyle, width: 'auto' }}>
                              {PLANS.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
                            </select>
                            <button onClick={() => handleChangePlan(org.id)}
                              disabled={!changePlanOrg[org.id] || changePlanOrg[org.id] === org.plan}
                              style={{ ...btnPrimary, opacity: (!changePlanOrg[org.id] || changePlanOrg[org.id] === org.plan) ? 0.5 : 1 }}>
                              <Save size={14} /> Confirmer
                            </button>
                            <span style={{ marginLeft: 'auto', fontSize: 12, color: C.textSecondary }}>
                              ID: {org.id.slice(0, 12)}...
                            </span>
                          </div>
                          {/* Stores list */}
                          {orgStores[org.id] && orgStores[org.id].length > 0 && (
                            <div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6, display: 'block' }}>
                                Boutiques ({orgStores[org.id].length}) :
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {orgStores[org.id].map((s: any) => (
                                  <span key={s.id} style={{
                                    padding: '3px 10px', borderRadius: 6, background: C.card, border: `1px solid ${C.border}`,
                                    fontSize: 12, color: C.text, display: 'flex', alignItems: 'center', gap: 4,
                                  }}>
                                    <Store size={11} /> {s.name}
                                    <span style={{ color: C.textSecondary, fontSize: 10 }}>({s.activity})</span>
                                    <span style={{ color: C.textSecondary, fontSize: 10 }}>{s.currency}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ marginTop: 8, fontSize: 12, color: C.textSecondary }}>
        {filteredOrgs.length} organisation(s) affichee(s)
      </p>
    </div>
  )

  // ── Render: Users ─────────────────────────────────────────────────────

  const renderUsersTab = () => (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={16} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: 10 }} />
          <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
            placeholder="Rechercher nom, email, boutique..."
            style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">Tous les roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={userOrgFilter} onChange={e => setUserOrgFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">Toutes les organisations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <button onClick={fetchAllUsers} style={btnPrimary}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: allUsers.length, color: C.primary, bg: C.primaryLight },
          { label: 'Actifs', value: allUsers.filter(u => u.is_active).length, color: C.success, bg: C.successLight },
          { label: 'Inactifs', value: allUsers.filter(u => !u.is_active).length, color: C.error, bg: C.errorLight },
          { label: 'Admins', value: allUsers.filter(u => u.role === 'admin').length, color: C.primary, bg: C.primaryLight },
          { label: 'Caissiers', value: allUsers.filter(u => u.role === 'cashier').length, color: C.success, bg: C.successLight },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '8px 16px', borderRadius: 8, background: s.bg,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Users table */}
      {usersLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={28} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${C.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: rv(12, 13, 13) }}>
            <thead>
              <tr style={{ background: C.headerStart, color: '#fff' }}>
                {['Nom', 'Email', 'Role', 'Boutique', 'Organisation', 'Statut', 'Cree le', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: C.textSecondary }}>Aucun utilisateur trouve</td></tr>
              ) : filteredUsers.map((user, i) => (
                <tr key={user.id} style={{ background: i % 2 === 0 ? C.card : C.stripe, borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: ROLE_COLORS[user.role] || C.textSecondary,
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: C.textSecondary, fontSize: 12 }}>{user.email}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      color: '#fff', background: ROLE_COLORS[user.role] || C.textSecondary,
                    }}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{user.store_name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: C.textSecondary }}>{user.org_name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {user.is_active ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: C.success, fontSize: 12, fontWeight: 500 }}>
                        <UserCheck size={13} /> Actif
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: C.error, fontSize: 12, fontWeight: 500 }}>
                        <UserX size={13} /> Inactif
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: C.textSecondary, whiteSpace: 'nowrap', fontSize: 12 }}>
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={(e) => { e.stopPropagation(); handleEditUser(user) }} title="Modifier"
                        style={{ ...btnOutline, padding: '4px 8px' }}>
                        <Edit3 size={13} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setResetPwdUser(user.id); setNewPassword(''); setUserMsg(null) }}
                        title="Reset mot de passe" style={{ ...btnOutline, padding: '4px 8px' }}>
                        <KeyRound size={13} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleToggleActive(user) }}
                        title={user.is_active ? 'Desactiver' : 'Activer'}
                        style={{ ...btnOutline, padding: '4px 8px', color: user.is_active ? C.error : C.success }}>
                        {user.is_active ? <Lock size={13} /> : <Unlock size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ marginTop: 8, fontSize: 12, color: C.textSecondary }}>
        {filteredUsers.length} utilisateur(s) affiche(s) sur {allUsers.length} total
      </p>

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setEditingUser(null)}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: 440, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color={C.primary} /> Modifier l'utilisateur
              </h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {['name', 'email', 'phone', 'pin'].map(field => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: C.textSecondary, marginBottom: 4, textTransform: 'capitalize' }}>
                  {field === 'name' ? 'Nom' : field === 'email' ? 'Email' : field === 'phone' ? 'Telephone' : 'Code PIN'}
                </label>
                <input value={(editForm as any)[field] || ''} onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                  style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>Role</label>
              <select value={editForm.role || 'cashier'} onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                style={inputStyle}>
                {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'super_admin').map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {userMsg && (
              <p style={{ fontSize: 13, color: userMsg.type === 'success' ? C.success : C.error, fontWeight: 600, marginBottom: 8 }}>
                {userMsg.text}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingUser(null)} style={btnOutline}>Annuler</button>
              <button onClick={handleSaveUser} disabled={userSaving} style={btnPrimary}>
                {userSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwdUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setResetPwdUser(null)}>
          <div style={{ background: C.card, borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyRound size={18} color={C.warning} /> Reinitialiser le mot de passe
            </h3>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 14px' }}>
              Pour : <strong>{allUsers.find(u => u.id === resetPwdUser)?.email}</strong>
            </p>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input type={showNewPassword ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe"
                style={inputStyle} />
              <button onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary }}>
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {userMsg && (
              <p style={{ fontSize: 13, color: userMsg.type === 'success' ? C.success : C.error, fontWeight: 600, marginBottom: 8 }}>
                {userMsg.text}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setResetPwdUser(null)} style={btnOutline}>Annuler</button>
              <button onClick={handleResetPassword} disabled={!newPassword || userSaving}
                style={{ ...btnPrimary, background: C.warning, opacity: !newPassword ? 0.5 : 1 }}>
                {userSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <KeyRound size={14} />}
                Reinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Render: Plans ─────────────────────────────────────────────────────

  const renderPlansTab = () => (
    <div>
      {planLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={28} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr 1fr'), gap: 16 }}>
          {planConfigs.map(config => {
            const edits = planEdits[config.plan] || {}
            const hasChanges = Object.keys(edits).length > 0
            const fields: { key: keyof PlanConfig; label: string; icon: React.ReactNode }[] = [
              { key: 'max_products', label: 'Max Produits', icon: <Package size={13} /> },
              { key: 'max_orders_per_day', label: 'Max Commandes/Jour', icon: <ShoppingCart size={13} /> },
              { key: 'max_stores', label: 'Max Boutiques', icon: <Store size={13} /> },
              { key: 'max_employees', label: 'Max Employes', icon: <Users size={13} /> },
            ]

            return (
              <div key={config.plan} style={{
                background: C.card, borderRadius: 12, padding: rv(14, 18, 20),
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `2px solid ${PLAN_COLORS[config.plan] || C.border}`,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
                  paddingBottom: 10, borderBottom: `2px solid ${PLAN_COLORS[config.plan] || C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={18} color={PLAN_COLORS[config.plan]} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                      {PLAN_LABELS[config.plan] || config.plan}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 18, fontWeight: 700, color: PLAN_COLORS[config.plan],
                  }}>
                    {PLAN_PRICES[config.plan]?.toLocaleString() || '0'} FCFA
                    <span style={{ fontSize: 11, fontWeight: 400 }}>/mois</span>
                  </span>
                </div>

                {fields.map(f => (
                  <div key={f.key} style={{ marginBottom: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
                      {f.icon} {f.label}
                    </label>
                    <input type="number"
                      value={edits[f.key] !== undefined ? edits[f.key] : ((config as any)[f.key] ?? '')}
                      onChange={e => handlePlanFieldChange(config.plan, f.key, parseInt(e.target.value) || 0)}
                      placeholder={config.plan === 'enterprise' ? 'Illimite' : ''}
                      style={inputStyle} />
                  </div>
                ))}

                <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: C.stripe, fontSize: 12, color: C.textSecondary }}>
                  <strong>{orgs.filter(o => o.plan === config.plan).length}</strong> organisation(s) sur ce plan
                </div>

                <button onClick={() => handleSavePlan(config)} disabled={!hasChanges || planSaving === config.plan}
                  style={{
                    width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                    background: hasChanges ? C.primary : C.border,
                    color: hasChanges ? '#fff' : C.textSecondary,
                    fontSize: 13, fontWeight: 600, cursor: hasChanges ? 'pointer' : 'default',
                    marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  {planSaving === config.plan ? (
                    <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...</>
                  ) : (
                    <><Save size={14} /> Sauvegarder</>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Render: Licenses ──────────────────────────────────────────────────

  const renderLicensesTab = () => (
    <div>
      <div style={{
        background: C.card, borderRadius: 12, padding: rv(14, 18, 20), marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}`,
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Key size={16} /> Generer un code de licence
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>Organisation</label>
            <select value={licenseOrgId} onChange={e => setLicenseOrgId(e.target.value)}
              style={{ ...inputStyle }}>
              <option value="">-- Selectionner --</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <label style={{ display: 'block', fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>Plan</label>
            <select value={licensePlan} onChange={e => setLicensePlan(e.target.value as SubscriptionPlan)}
              style={{ ...inputStyle }}>
              {PLANS.filter(p => p !== 'free').map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 100px' }}>
            <label style={{ display: 'block', fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>Jours</label>
            <input type="number" min={1} max={365} value={licenseDays}
              onChange={e => setLicenseDays(parseInt(e.target.value) || 1)} style={inputStyle} />
          </div>
          <button onClick={handleGenerateCode} disabled={!licenseOrgId || generating}
            style={{ ...btnPrimary, opacity: !licenseOrgId ? 0.5 : 1 }}>
            {generating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={14} />}
            Generer
          </button>
        </div>

        {generatedCode && (
          <div style={{
            marginTop: 14, padding: 12, borderRadius: 8, background: C.successLight,
            border: `1px solid ${C.success}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <code style={{ fontSize: rv(12, 14, 15), fontWeight: 700, letterSpacing: 1, color: C.text, wordBreak: 'break-all' }}>
              {generatedCode}
            </code>
            <button onClick={handleCopyCode}
              style={{ ...btnOutline, color: C.success, borderColor: C.success }}>
              {codeCopied ? <><CheckCircle2 size={14} /> Copie !</> : <><Copy size={14} /> Copier</>}
            </button>
          </div>
        )}
      </div>

      {/* History */}
      <div style={{ background: C.card, borderRadius: 12, padding: rv(14, 18, 20), boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}` }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: C.text }}>Historique des licences</h3>
        {licenseLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Loader2 size={24} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: rv(11, 12, 13) }}>
              <thead>
                <tr style={{ background: C.stripe, borderBottom: `1px solid ${C.border}` }}>
                  {['Code', 'Organisation', 'Plan', 'Jours', 'Genere le', 'Utilise', 'Utilise le'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: C.textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {licenseHistory.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: C.textSecondary }}>Aucune licence generee</td></tr>
                ) : licenseHistory.map((lc, i) => {
                  const orgName = orgs.find(o => o.id === lc.organization_id)?.name || lc.organization_id.slice(0, 8)
                  return (
                    <tr key={lc.id} style={{ background: i % 2 === 0 ? C.card : C.stripe, borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11 }}>{lc.code}</td>
                      <td style={{ padding: '8px 10px' }}>{orgName}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 10, fontSize: 11, fontWeight: 600, color: '#fff', background: PLAN_COLORS[lc.plan] || C.textSecondary }}>
                          {PLAN_LABELS[lc.plan]}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{lc.days}</td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: C.textSecondary }}>{new Date(lc.generated_at).toLocaleString('fr-FR')}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{lc.is_used ? <CheckCircle2 size={14} color={C.success} /> : <span style={{ color: C.textSecondary }}>--</span>}</td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: C.textSecondary }}>{lc.used_at ? new Date(lc.used_at).toLocaleString('fr-FR') : '--'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  // ── Render: Analytics ─────────────────────────────────────────────────

  const renderAnalyticsTab = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: rv('1fr 1fr', '1fr 1fr 1fr', '1fr 1fr 1fr 1fr 1fr'), gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Organisations', value: orgs.length, icon: <Building2 size={22} color={C.primary} />, bg: C.primaryLight },
          { label: 'Abonnements actifs', value: orgs.filter(o => o.status === 'active').length, icon: <CheckCircle2 size={22} color={C.success} />, bg: C.successLight },
          { label: 'Boutiques', value: orgs.reduce((s, o) => s + o.stores_count, 0), icon: <Store size={22} color={C.purple} />, bg: C.purpleLight },
          { label: 'Utilisateurs', value: allUsers.length || orgs.reduce((s, o) => s + o.products_count, 0), icon: <Users size={22} color={'#0891B2'} />, bg: '#CFFAFE' },
          { label: 'Revenu estime/mois', value: estimatedRevenue.toLocaleString() + ' FCFA', icon: <DollarSign size={22} color={C.warning} />, bg: C.warningLight },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: C.card, borderRadius: 12, padding: rv(12, 14, 16),
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textSecondary }}>{kpi.label}</div>
              <div style={{ fontSize: rv(16, 18, 20), fontWeight: 700, color: C.text }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Distribution */}
      <div style={{ background: C.card, borderRadius: 12, padding: rv(14, 18, 24), boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}`, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart3 size={16} /> Repartition des plans
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {planDistribution.map(d => (
            <div key={d.plan} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: rv(80, 100, 120), fontSize: 13, fontWeight: 500, color: C.text, textAlign: 'right', flexShrink: 0 }}>
                {PLAN_LABELS[d.plan]}
              </span>
              <div style={{ flex: 1, height: 28, background: C.stripe, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${maxPlanCount > 0 ? (d.count / maxPlanCount) * 100 : 0}%`,
                  height: '100%', background: PLAN_COLORS[d.plan], borderRadius: 6,
                  transition: 'width 0.4s ease', minWidth: d.count > 0 ? 24 : 0,
                }} />
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: C.text }}>
                  {d.count}
                </span>
              </div>
              <span style={{ fontSize: 12, color: C.textSecondary, width: 60, textAlign: 'right' }}>
                {PLAN_PRICES[d.plan]?.toLocaleString()} F
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by plan */}
      <div style={{ background: C.card, borderRadius: 12, padding: rv(14, 18, 24), boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}` }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          <DollarSign size={16} /> Revenu estime par plan
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr 1fr'), gap: 12 }}>
          {planDistribution.filter(d => d.count > 0).map(d => {
            const revenue = d.count * (PLAN_PRICES[d.plan] || 0)
            return (
              <div key={d.plan} style={{
                padding: 14, borderRadius: 10, border: `1px solid ${PLAN_COLORS[d.plan]}20`,
                background: `${PLAN_COLORS[d.plan]}08`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: PLAN_COLORS[d.plan], marginBottom: 4 }}>
                  {PLAN_LABELS[d.plan]}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                  {revenue.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400 }}>FCFA</span>
                </div>
                <div style={{ fontSize: 12, color: C.textSecondary }}>
                  {d.count} org × {PLAN_PRICES[d.plan]?.toLocaleString()} FCFA
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ── Main render ──────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.headerStart}, ${C.headerEnd})`,
        padding: rv('14px 16px', '18px 24px', '20px 32px'),
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={rv(22, 26, 28)} />
          <div>
            <h1 style={{ margin: 0, fontSize: rv(18, 22, 24), fontWeight: 700 }}>
              Super Administration
            </h1>
            <p style={{ margin: 0, fontSize: rv(12, 13, 14), opacity: 0.8 }}>
              Gestion de la plateforme POS Mano Verde
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', fontSize: 12 }}>
              {orgs.length} org
            </span>
            <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', fontSize: 12 }}>
              {allUsers.length || '—'} users
            </span>
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        display: 'flex', overflowX: 'auto', padding: '0 ' + rv('12px', '20px', '28px'),
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: rv('10px 12px', '12px 18px', '14px 22px'),
              border: 'none', background: 'none',
              color: activeTab === tab.id ? C.primary : C.textSecondary,
              fontSize: rv(12, 13, 14), fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative',
              borderBottom: activeTab === tab.id ? `3px solid ${C.primary}` : '3px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
            }}>
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{
                marginLeft: 4, padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                background: activeTab === tab.id ? C.primaryLight : C.stripe, color: activeTab === tab.id ? C.primary : C.textSecondary,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: rv('14px 12px', '18px 20px', '24px 28px'), maxWidth: 1300, margin: '0 auto' }}>
        {activeTab === 'organizations' && renderOrganizationsTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'plans' && renderPlansTab()}
        {activeTab === 'licenses' && renderLicensesTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
