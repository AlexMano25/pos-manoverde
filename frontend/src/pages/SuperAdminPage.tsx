import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield, Building2, CreditCard, Key, BarChart3, Search, RefreshCw,
  Copy, CheckCircle2, AlertTriangle, Loader2, ChevronDown, ChevronUp,
  Package, ShoppingCart, Users, Edit3, Lock, Unlock,
  Mail, Store, Eye, EyeOff, Save, X,
  UserCheck, UserX, KeyRound, DollarSign, Clock, XCircle,
  FileText, Globe, Upload, Trash2, MessageSquare,
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

type TabId = 'organizations' | 'users' | 'plans' | 'licenses' | 'analytics' | 'agents' | 'ai_sources'

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

  // ── Agents state ────────────────────────────────────────────────────
  const [agents, setAgents] = useState<any[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [agentForm, setAgentForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [agentCreating, setAgentCreating] = useState(false)
  const [agentMsg, setAgentMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pendingAgents, setPendingAgents] = useState<any[]>([])
  const [agentFilter, setAgentFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all')
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [agentReferrals, setAgentReferrals] = useState<Record<string, any[]>>({})
  const [agentReferralCounts, setAgentReferralCounts] = useState<Record<string, number>>({})
  const [pendingCommissions, setPendingCommissions] = useState<any[]>([])
  const [commissionsLoading, setCommissionsLoading] = useState(false)
  const [tierConfigs, setTierConfigs] = useState<any[]>([])
  const [tierEdits, setTierEdits] = useState<Record<string, any>>({})
  const [tierSaving, setTierSaving] = useState(false)
  const [agentWithdrawals, setAgentWithdrawals] = useState<any[]>([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)

  // ── AI Sources state ────────────────────────────────────────────────
  const [aiSources, setAiSources] = useState<any[]>([])
  const [aiSourcesLoading, setAiSourcesLoading] = useState(false)
  const [aiNewUrl, setAiNewUrl] = useState('')
  const [aiNewText, setAiNewText] = useState('')
  const [aiNewTitle, setAiNewTitle] = useState('')
  const [aiAddType, setAiAddType] = useState<'url' | 'text' | 'file'>('url')
  const [aiUploading, setAiUploading] = useState(false)
  const [aiMsg, setAiMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const fetchAgents = useCallback(async () => {
    if (!supabase) return
    setAgentsLoading(true)
    try {
      const { data } = await supabase.from('agents').select('*').order('created_at', { ascending: false })
      const agentsList = data || []
      setAgents(agentsList)
      setPendingAgents(agentsList.filter((a: any) => !a.is_active && !a.auth_id))

      // Fetch referral counts per agent
      const counts: Record<string, number> = {}
      for (const ag of agentsList.filter((a: any) => a.is_active)) {
        const { count } = await supabase.from('agent_referrals').select('*', { count: 'exact', head: true }).eq('agent_id', ag.id)
        counts[ag.id] = count || 0
      }
      setAgentReferralCounts(counts)
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    } finally {
      setAgentsLoading(false)
    }
  }, [])

  const fetchAgentReferrals = useCallback(async (agentId: string) => {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('agent_referrals')
        .select('*, organizations(name, owner_name, owner_email)')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
      setAgentReferrals(prev => ({ ...prev, [agentId]: data || [] }))
    } catch (err) {
      console.error('Failed to fetch agent referrals:', err)
    }
  }, [])

  const fetchPendingCommissions = useCallback(async () => {
    if (!supabase) return
    setCommissionsLoading(true)
    try {
      const { data } = await supabase
        .from('agent_commissions')
        .select('*, agents(name), organizations(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      setPendingCommissions(data || [])
    } catch (err) {
      console.error('Failed to fetch commissions:', err)
    } finally {
      setCommissionsLoading(false)
    }
  }, [])

  const fetchTierConfigs = useCallback(async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.from('agent_tier_config').select('*').order('min_referrals', { ascending: true })
      setTierConfigs(data || [])
    } catch (err) {
      console.error('Failed to fetch tier configs:', err)
    }
  }, [])

  const fetchWithdrawals = useCallback(async () => {
    if (!supabase) return
    setWithdrawalsLoading(true)
    try {
      const { data } = await supabase
        .from('agent_withdrawals')
        .select('*, agents(name, email)')
        .order('created_at', { ascending: false })
      setAgentWithdrawals(data || [])
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err)
    } finally {
      setWithdrawalsLoading(false)
    }
  }, [])

  const fetchAiSources = useCallback(async () => {
    if (!supabase) return
    setAiSourcesLoading(true)
    try {
      const { data } = await supabase.from('chatbot_sources').select('*').order('created_at', { ascending: false })
      if (data) setAiSources(data)
    } catch (err) { console.error('Failed to fetch AI sources:', err) }
    finally { setAiSourcesLoading(false) }
  }, [])

  useEffect(() => {
    if (activeTab === 'organizations' || activeTab === 'analytics') fetchOrganizations()
    if (activeTab === 'users') { fetchAllUsers(); if (orgs.length === 0) fetchOrganizations() }
    if (activeTab === 'plans') fetchPlanConfigs()
    if (activeTab === 'licenses') {
      fetchLicenseHistory()
      if (orgs.length === 0) fetchOrganizations()
    }
    if (activeTab === 'agents') {
      fetchAgents()
      fetchPendingCommissions()
      fetchTierConfigs()
      fetchWithdrawals()
    }
    if (activeTab === 'ai_sources') fetchAiSources()
  }, [activeTab, fetchOrganizations, fetchPlanConfigs, fetchLicenseHistory, fetchAllUsers, fetchAgents, fetchPendingCommissions, fetchTierConfigs, fetchWithdrawals, fetchAiSources])

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
    { id: 'agents', label: 'Agents', icon: <Users size={rv(14, 16, 16)} />, count: agents.length },
    { id: 'ai_sources', label: 'Sources IA', icon: <MessageSquare size={rv(14, 16, 16)} /> },
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

  // ── Agents helpers ─────────────────────────────────────────────────

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'AGT-'
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let pwd = ''
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    return pwd
  }

  const callCreateAgentEdge = async (payload: any) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('Session expirée, reconnectez-vous')

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vnxrspaeptbspoxpzxbn.supabase.co'
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const resp = await fetch(`${supabaseUrl}/functions/v1/create-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': anonKey,
      },
      body: JSON.stringify(payload),
    })

    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || `Erreur ${resp.status}`)
    return data
  }

  const handleCreateAgent = async () => {
    if (!supabase || !agentForm.name || !agentForm.email) return
    setAgentCreating(true)
    setAgentMsg(null)
    const password = agentForm.password || generatePassword()
    const refCode = generateReferralCode()
    try {
      await callCreateAgentEdge({
        email: agentForm.email,
        password,
        name: agentForm.name,
        phone: agentForm.phone || null,
        referral_code: refCode,
      })

      setAgentForm({ name: '', email: '', phone: '', password: '' })
      setAgentMsg({ type: 'success', text: `Agent cree! Code: ${refCode} | Mot de passe: ${password}` })
      fetchAgents()

      // Open WhatsApp with agent credentials
      if (agentForm.phone) {
        const phone = agentForm.phone.replace(/[^0-9]/g, '')
        const waPhone = phone.startsWith('237') ? phone : `237${phone}`
        const msg = encodeURIComponent(
          `Bonjour ${agentForm.name},\n\n` +
          `Bienvenue dans le programme partenaire POS Mano Verde!\n\n` +
          `Vos identifiants:\n` +
          `Email: ${agentForm.email}\n` +
          `Mot de passe: ${password}\n` +
          `Code parrainage: ${refCode}\n\n` +
          `Lien parrainage: https://pos.manovende.com/?ref=${refCode}\n\n` +
          `Connexion: https://pos.manoverde.com\n` +
          `Merci et bon partenariat!`
        )
        window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank')
      }
    } catch (err: any) {
      setAgentMsg({ type: 'error', text: err.message || 'Erreur lors de la creation' })
    } finally {
      setAgentCreating(false)
    }
  }

  const handleApproveAgent = async (agent: any) => {
    if (!supabase) return
    setAgentCreating(true)
    setAgentMsg(null)
    const password = generatePassword()
    try {
      const refCode = agent.referral_code || generateReferralCode()
      await callCreateAgentEdge({
        email: agent.email,
        password,
        name: agent.name,
        phone: agent.phone || null,
        referral_code: refCode,
        agent_id: agent.id,
      })

      setAgentMsg({ type: 'success', text: `Agent ${agent.name} approuve! Mot de passe: ${password}` })
      fetchAgents()

      // Open WhatsApp
      if (agent.phone) {
        const phone = agent.phone.replace(/[^0-9]/g, '')
        const waPhone = phone.startsWith('237') ? phone : `237${phone}`
        const msg = encodeURIComponent(
          `Bonjour ${agent.name},\n\n` +
          `Votre candidature au programme partenaire POS Mano Verde a ete approuvee!\n\n` +
          `Vos identifiants:\n` +
          `Email: ${agent.email}\n` +
          `Mot de passe: ${password}\n` +
          `Code parrainage: ${refCode}\n\n` +
          `Lien parrainage: https://pos.manovende.com/?ref=${refCode}\n\n` +
          `Connexion: https://pos.manoverde.com\n` +
          `Merci et bon partenariat!`
        )
        window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank')
      }
    } catch (err: any) {
      setAgentMsg({ type: 'error', text: err.message || 'Erreur lors de l\'approbation' })
    } finally {
      setAgentCreating(false)
    }
  }

  const handleRejectAgent = async (agentId: string) => {
    if (!supabase) return
    try {
      await supabase.from('agents').delete().eq('id', agentId)
      setAgentMsg({ type: 'success', text: 'Candidature rejetee' })
      fetchAgents()
    } catch (err: any) {
      setAgentMsg({ type: 'error', text: err.message })
    }
  }

  const handleToggleAgent = async (agentId: string, currentlyActive: boolean) => {
    if (!supabase) return
    try {
      await supabase.from('agents').update({ is_active: !currentlyActive }).eq('id', agentId)
      fetchAgents()
    } catch (err) {
      console.error('Failed to toggle agent:', err)
    }
  }

  const handleApproveCommission = async (commissionId: string) => {
    if (!supabase) return
    try {
      await supabase.from('agent_commissions').update({ status: 'approved' }).eq('id', commissionId)
      fetchPendingCommissions()
    } catch (err) {
      console.error('Failed to approve commission:', err)
    }
  }

  const handleMarkPaid = async (commissionId: string) => {
    if (!supabase) return
    try {
      await supabase.from('agent_commissions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', commissionId)
      fetchPendingCommissions()
    } catch (err) {
      console.error('Failed to mark commission paid:', err)
    }
  }

  const handleSendWelcomeEmail = async (agent: any) => {
    if (!supabase) return
    setAgentMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Session expirée')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vnxrspaeptbspoxpzxbn.supabase.co'
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          to: agent.email,
          subject: 'Bienvenue dans le programme partenaire POS Mano Verde',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:30px;border-radius:12px 12px 0 0;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:24px">POS Mano Verde</h1>
                <p style="color:#93c5fd;margin:8px 0 0;font-size:14px">Programme Partenaire</p>
              </div>
              <div style="background:#fff;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
                <h2 style="color:#1e293b;margin:0 0 16px">Bonjour ${agent.name},</h2>
                <p style="color:#475569;line-height:1.6">Bienvenue dans le programme partenaire POS Mano Verde !</p>
                <div style="background:#eff6ff;border-radius:8px;padding:16px;margin:20px 0">
                  <p style="margin:0;font-size:13px;color:#1e40af"><strong>Votre code parrainage :</strong> ${agent.referral_code}</p>
                  <p style="margin:8px 0 0;font-size:13px"><strong>Lien :</strong> <a href="https://pos.manovende.com/?ref=${agent.referral_code}" style="color:#2563eb">https://pos.manovende.com/?ref=${agent.referral_code}</a></p>
                </div>
                <p style="color:#475569;line-height:1.6">Connectez-vous sur <a href="https://pos.manovende.com" style="color:#2563eb">pos.manovende.com</a> avec votre email pour acceder a votre tableau de bord agent.</p>
                <div style="text-align:center;margin:24px 0">
                  <a href="https://pos.manovende.com" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">Acceder au tableau de bord</a>
                </div>
              </div>
              <p style="text-align:center;color:#94a3b8;font-size:11px;margin:16px 0 0">Team TERRASOCIAL - POS Mano Verde</p>
            </div>
          `,
        }),
      })

      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || `Erreur ${resp.status}`)
      setAgentMsg({ type: 'success', text: `Email de bienvenue envoye a ${agent.email}` })
    } catch (err: any) {
      setAgentMsg({ type: 'error', text: `Echec envoi email: ${err.message}` })
    }
  }

  const handleSaveTierConfigs = async () => {
    if (!supabase) return
    setTierSaving(true)
    try {
      for (const tier of tierConfigs) {
        const edits = tierEdits[tier.tier]
        if (edits) {
          await supabase.from('agent_tier_config').update({
            name_fr: edits.name_fr ?? tier.name_fr,
            min_referrals: edits.min_referrals ?? tier.min_referrals,
            commission_rate: edits.commission_rate ?? tier.commission_rate,
            commission_gen1: edits.commission_gen1 ?? tier.commission_gen1,
            commission_gen2: edits.commission_gen2 ?? tier.commission_gen2,
            commission_gen3: edits.commission_gen3 ?? tier.commission_gen3,
            commission_gen4: edits.commission_gen4 ?? tier.commission_gen4,
          }).eq('tier', tier.tier)
        }
      }
      setTierEdits({})
      fetchTierConfigs()
    } catch (err) {
      console.error('Failed to save tier configs:', err)
    } finally {
      setTierSaving(false)
    }
  }

  const renderAgentsTab = () => {
    const filtered = agentFilter === 'all' ? agents
      : agentFilter === 'active' ? agents.filter(a => a.is_active)
      : agentFilter === 'pending' ? agents.filter(a => !a.is_active && !a.auth_id)
      : agents.filter(a => !a.is_active && a.auth_id)

    return (
    <div>
      {/* ── Pending Applications ───────────────────────────────────────── */}
      {pendingAgents.length > 0 && (
        <div style={{ background: '#fffbeb', borderRadius: 12, padding: rv(14, 18, 24), boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #fbbf24', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} /> Candidatures en attente ({pendingAgents.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingAgents.map((pa: any) => (
              <div key={pa.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #fde68a', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{pa.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{pa.email}</div>
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{pa.phone || '-'}</div>
                {pa.motivation && <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', flex: '0 0 100%', marginTop: 4 }}>"{pa.motivation}"</div>}
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(pa.created_at).toLocaleDateString('fr-FR')}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ ...btnPrimary, height: 32, fontSize: 12, background: '#16a34a' }} onClick={() => handleApproveAgent(pa)}>
                    <UserCheck size={13} /> Approuver
                  </button>
                  <button style={{ ...btnOutline, height: 32, fontSize: 12, color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => handleRejectAgent(pa.id)}>
                    <XCircle size={13} /> Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create Agent Form ──────────────────────────────────────────── */}
      <div style={{ background: C.card, borderRadius: 12, padding: rv(14, 18, 24), boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}`, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={16} /> Creer un agent
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr 1fr 1fr'), gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, display: 'block', marginBottom: 4 }}>Nom *</label>
            <input style={inputStyle} placeholder="Nom complet" value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, display: 'block', marginBottom: 4 }}>Email *</label>
            <input style={inputStyle} placeholder="email@example.com" type="email" value={agentForm.email} onChange={e => setAgentForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, display: 'block', marginBottom: 4 }}>WhatsApp *</label>
            <input style={inputStyle} placeholder="6XXXXXXXX" value={agentForm.phone} onChange={e => setAgentForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, display: 'block', marginBottom: 4 }}>Mot de passe (auto)</label>
            <input style={inputStyle} placeholder="Auto-genere si vide" value={agentForm.password} onChange={e => setAgentForm(f => ({ ...f, password: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button style={{ ...btnPrimary, height: 38 }} onClick={handleCreateAgent} disabled={agentCreating || !agentForm.name || !agentForm.email || !agentForm.phone}>
            {agentCreating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserCheck size={14} />}
            Creer et notifier via WhatsApp
          </button>
        </div>
        {agentMsg && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 6, fontSize: 13,
            background: agentMsg.type === 'success' ? C.successLight : C.errorLight,
            color: agentMsg.type === 'success' ? C.success : C.error,
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          }}>
            {agentMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span style={{ wordBreak: 'break-all' }}>{agentMsg.text}</span>
          </div>
        )}
      </div>

      {/* ── Agents List ────────────────────────────────────────────────── */}
      <div style={{ background: C.card, borderRadius: 12, padding: rv(14, 18, 24), boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}`, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={16} /> Agents ({filtered.length})
          </h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'active', 'pending', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setAgentFilter(f)} style={{
                padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${agentFilter === f ? '#3b82f6' : C.border}`,
                background: agentFilter === f ? '#eff6ff' : 'transparent',
                color: agentFilter === f ? '#3b82f6' : C.textSecondary,
              }}>
                {f === 'all' ? `Tous (${agents.length})` : f === 'active' ? `Actifs (${agents.filter(a => a.is_active).length})` : f === 'pending' ? `En attente (${pendingAgents.length})` : `Inactifs (${agents.filter(a => !a.is_active && a.auth_id).length})`}
              </button>
            ))}
          </div>
          <button style={btnOutline} onClick={fetchAgents}>
            <RefreshCw size={12} /> Actualiser
          </button>
        </div>

        {agentsLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={28} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.textSecondary, fontSize: 14 }}>
            Aucun agent enregistre
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${C.headerStart}, ${C.headerEnd})` }}>
                  {['Nom', 'Email', 'Telephone', 'Niveau', 'Code', 'Clients', 'Total gagne', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontSize: 12, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ag, i) => (
                  <React.Fragment key={ag.id}>
                    <tr
                      style={{ background: i % 2 ? C.stripe : C.card, cursor: 'pointer' }}
                      onClick={() => {
                        const newId = expandedAgent === ag.id ? null : ag.id
                        setExpandedAgent(newId)
                        if (newId && !agentReferrals[ag.id]) fetchAgentReferrals(ag.id)
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {expandedAgent === ag.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {ag.name}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: C.textSecondary }}>{ag.email}</td>
                      <td style={{ padding: '10px 12px', color: C.textSecondary }}>{ag.phone || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                          background: ag.tier >= 4 ? C.warningLight : ag.tier >= 3 ? '#E2E8F0' : '#FED7AA',
                          color: ag.tier >= 4 ? '#92400E' : ag.tier >= 3 ? '#475569' : '#9A3412',
                        }}>
                          {ag.tier === 1 ? 'Débutant' : ag.tier === 2 ? 'Intermédiaire' : ag.tier === 3 ? 'Avancé' : ag.tier === 4 ? 'Expert' : `Niveau ${ag.tier || 0}`}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, background: C.primaryLight, padding: '2px 6px', borderRadius: 4, color: C.primary }}>
                          {ag.referral_code}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{agentReferralCounts[ag.id] ?? '—'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{Number(ag.total_earned_usd || 0).toLocaleString()} $</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                          background: ag.is_active ? C.successLight : C.errorLight,
                          color: ag.is_active ? C.success : C.error,
                        }}>
                          {ag.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button
                          style={{ ...btnOutline, fontSize: 11, padding: '4px 8px' }}
                          onClick={e => { e.stopPropagation(); handleToggleAgent(ag.id, ag.is_active) }}
                        >
                          {ag.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                          {ag.is_active ? 'Desactiver' : 'Activer'}
                        </button>
                        {ag.is_active && ag.auth_id && (
                          <button
                            style={{ ...btnOutline, fontSize: 11, padding: '4px 8px', color: '#2563eb', borderColor: '#93c5fd' }}
                            onClick={e => { e.stopPropagation(); handleSendWelcomeEmail(ag) }}
                          >
                            <Mail size={12} /> Email
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded referrals row */}
                    {expandedAgent === ag.id && (
                      <tr>
                        <td colSpan={9} style={{ padding: '0 12px 12px', background: C.stripe }}>
                          <div style={{ padding: 14, background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
                            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: C.text }}>
                              Clients parraines par {ag.name}
                            </h4>
                            {!agentReferrals[ag.id] ? (
                              <Loader2 size={16} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : agentReferrals[ag.id].length === 0 ? (
                              <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>Aucun parrainage</p>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                  <tr>
                                    {['Organisation', 'Proprietaire', 'Email', 'Date'].map(h => (
                                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.textSecondary }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {agentReferrals[ag.id].map((ref: any) => (
                                    <tr key={ref.id}>
                                      <td style={{ padding: '6px 10px' }}>{ref.organizations?.name || '—'}</td>
                                      <td style={{ padding: '6px 10px' }}>{ref.organizations?.owner_name || '—'}</td>
                                      <td style={{ padding: '6px 10px', color: C.textSecondary }}>{ref.organizations?.owner_email || '—'}</td>
                                      <td style={{ padding: '6px 10px', color: C.textSecondary }}>{new Date(ref.created_at).toLocaleDateString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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
      </div>

      {/* ── Commission Management ──────────────────────────────────────── */}
      <div style={{ background: C.card, borderRadius: 12, padding: rv(14, 18, 24), boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}`, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={16} /> Commissions en attente ({pendingCommissions.length})
          </h3>
          <button style={btnOutline} onClick={fetchPendingCommissions}>
            <RefreshCw size={12} /> Actualiser
          </button>
        </div>

        {commissionsLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={28} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : pendingCommissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.textSecondary, fontSize: 14 }}>
            Aucune commission en attente
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${C.headerStart}, ${C.headerEnd})` }}>
                  {['Agent', 'Organisation', 'Montant', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontSize: 12, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingCommissions.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 ? C.stripe : C.card }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.agents?.name || '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.textSecondary }}>{c.organizations?.name || '—'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{(c.amount || 0).toLocaleString()} FCFA</td>
                    <td style={{ padding: '10px 12px', color: C.textSecondary }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
                      <button style={{ ...btnOutline, fontSize: 11, padding: '4px 8px', color: C.success, borderColor: C.success }} onClick={() => handleApproveCommission(c.id)}>
                        <CheckCircle2 size={12} /> Approuver
                      </button>
                      <button style={{ ...btnOutline, fontSize: 11, padding: '4px 8px', color: C.primary, borderColor: C.primary }} onClick={() => handleMarkPaid(c.id)}>
                        <DollarSign size={12} /> Marquer paye
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Tier Configuration ─────────────────────────────────────────── */}
      <div style={{ background: C.card, borderRadius: 12, padding: rv(14, 18, 24), boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={16} /> Configuration des niveaux
          </h3>
          <button
            style={{ ...btnPrimary, opacity: tierSaving || Object.keys(tierEdits).length === 0 ? 0.5 : 1 }}
            onClick={handleSaveTierConfigs}
            disabled={tierSaving || Object.keys(tierEdits).length === 0}
          >
            {tierSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            Enregistrer
          </button>
        </div>

        {tierConfigs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.textSecondary, fontSize: 14 }}>
            Aucune configuration de niveaux
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${C.headerStart}, ${C.headerEnd})` }}>
                  {['Niveau', 'Parr. min.', 'Taux (%)', 'Gen 1 (%)', 'Gen 2 (%)', 'Gen 3 (%)', 'Gen 4 (%)'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontSize: 12, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tierConfigs.map((tier, i) => {
                  const key = tier.tier
                  return (
                  <tr key={key} style={{ background: i % 2 ? C.stripe : C.card }}>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        style={{ ...inputStyle, width: 120 }}
                        value={tierEdits[key]?.name_fr ?? tier.name_fr}
                        onChange={e => setTierEdits(prev => ({ ...prev, [key]: { ...prev[key], name_fr: e.target.value } }))}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        style={{ ...inputStyle, width: 70 }}
                        type="number"
                        value={tierEdits[key]?.min_referrals ?? tier.min_referrals}
                        onChange={e => setTierEdits(prev => ({ ...prev, [key]: { ...prev[key], min_referrals: parseInt(e.target.value) || 0 } }))}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        style={{ ...inputStyle, width: 70 }}
                        type="number"
                        step="0.01"
                        value={tierEdits[key]?.commission_rate ?? tier.commission_rate}
                        onChange={e => setTierEdits(prev => ({ ...prev, [key]: { ...prev[key], commission_rate: parseFloat(e.target.value) || 0 } }))}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        style={{ ...inputStyle, width: 70 }}
                        type="number"
                        step="0.01"
                        value={tierEdits[key]?.commission_gen1 ?? tier.commission_gen1 ?? 0}
                        onChange={e => setTierEdits(prev => ({ ...prev, [key]: { ...prev[key], commission_gen1: parseFloat(e.target.value) || 0 } }))}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        style={{ ...inputStyle, width: 70 }}
                        type="number"
                        step="0.01"
                        value={tierEdits[key]?.commission_gen2 ?? tier.commission_gen2 ?? 0}
                        onChange={e => setTierEdits(prev => ({ ...prev, [key]: { ...prev[key], commission_gen2: parseFloat(e.target.value) || 0 } }))}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        style={{ ...inputStyle, width: 70 }}
                        type="number"
                        step="0.01"
                        value={tierEdits[key]?.commission_gen3 ?? tier.commission_gen3 ?? 0}
                        onChange={e => setTierEdits(prev => ({ ...prev, [key]: { ...prev[key], commission_gen3: parseFloat(e.target.value) || 0 } }))}
                      />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        style={{ ...inputStyle, width: 70 }}
                        type="number"
                        step="0.01"
                        value={tierEdits[key]?.commission_gen4 ?? tier.commission_gen4 ?? 0}
                        onChange={e => setTierEdits(prev => ({ ...prev, [key]: { ...prev[key], commission_gen4: parseFloat(e.target.value) || 0 } }))}
                      />
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Withdrawals Management ─────────────────────────────────────── */}
      <div style={{ background: C.card, borderRadius: 12, padding: rv(14, 18, 24), boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${C.border}`, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={16} /> Retraits agents
          </h3>
          <button style={btnPrimary} onClick={fetchWithdrawals}>
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>

        {withdrawalsLoading ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
          </div>
        ) : agentWithdrawals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.textSecondary, fontSize: 14 }}>
            Aucune demande de retrait
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${C.headerStart}, ${C.headerEnd})` }}>
                  {['Agent', 'Montant', 'Frais', 'Net', 'Methode', 'Telephone', 'Date', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontSize: 12, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agentWithdrawals.map((w: any, i: number) => (
                  <tr key={w.id} style={{ background: i % 2 ? C.stripe : C.card, borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                      {w.agents?.name || '-'}
                      <div style={{ fontSize: 11, color: C.textSecondary }}>{w.agents?.email || ''}</div>
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{Number(w.amount).toLocaleString()} FCFA</td>
                    <td style={{ padding: '8px 12px' }}>{Number(w.fee).toLocaleString()} FCFA</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: C.success }}>{Number(w.net_amount).toLocaleString()} FCFA</td>
                    <td style={{ padding: '8px 12px' }}>{w.method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}</td>
                    <td style={{ padding: '8px 12px' }}>{w.phone}</td>
                    <td style={{ padding: '8px 12px', color: C.textSecondary }}>{new Date(w.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, display: 'inline-block',
                        background: w.status === 'paid' ? C.successLight : w.status === 'approved' ? '#dbeafe' : w.status === 'rejected' ? C.errorLight : C.warningLight,
                        color: w.status === 'paid' ? C.success : w.status === 'approved' ? C.primary : w.status === 'rejected' ? C.error : '#92400e',
                      }}>
                        {w.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {w.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <button
                            style={{ ...btnOutline, fontSize: 11, padding: '4px 8px', color: C.success, borderColor: C.success }}
                            onClick={async () => {
                              if (!supabase) return
                              await supabase.from('agent_withdrawals').update({ status: 'approved' }).eq('id', w.id)
                              fetchWithdrawals()
                            }}
                          >
                            <CheckCircle2 size={12} /> Approuver
                          </button>
                          <button
                            style={{ ...btnOutline, fontSize: 11, padding: '4px 8px', color: C.error, borderColor: C.error }}
                            onClick={async () => {
                              if (!supabase) return
                              await supabase.from('agent_withdrawals').update({ status: 'rejected' }).eq('id', w.id)
                              // Re-credit agent pending_balance
                              const { data: agentData } = await supabase.from('agents').select('pending_balance').eq('id', w.agent_id).single()
                              if (agentData) {
                                await supabase.from('agents').update({
                                  pending_balance: (Number(agentData.pending_balance) || 0) + Number(w.amount),
                                }).eq('id', w.agent_id)
                              }
                              fetchWithdrawals()
                            }}
                          >
                            <XCircle size={12} /> Rejeter
                          </button>
                        </div>
                      )}
                      {w.status === 'approved' && (
                        <button
                          style={{ ...btnOutline, fontSize: 11, padding: '4px 8px', color: C.primary, borderColor: C.primary }}
                          onClick={async () => {
                            if (!supabase) return
                            await supabase.from('agent_withdrawals').update({ status: 'paid', processed_at: new Date().toISOString() }).eq('id', w.id)
                            fetchWithdrawals()
                          }}
                        >
                          <DollarSign size={12} /> Marquer paye
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
  }

  // ── AI Sources Tab ─────────────────────────────────────────────────
  const handleAddAiSource = async () => {
    if (!supabase) return
    setAiUploading(true)
    setAiMsg(null)
    try {
      if (aiAddType === 'url') {
        if (!aiNewUrl.trim()) { setAiMsg({ type: 'error', text: 'URL requise' }); setAiUploading(false); return }
        const title = aiNewTitle.trim() || new URL(aiNewUrl).hostname
        const { error } = await supabase.from('chatbot_sources').insert({ type: 'url', title, url: aiNewUrl.trim(), status: 'active' })
        if (error) throw error
        setAiNewUrl('')
        setAiNewTitle('')
        setAiMsg({ type: 'success', text: 'URL ajoutee avec succes' })
      } else if (aiAddType === 'text') {
        if (!aiNewText.trim()) { setAiMsg({ type: 'error', text: 'Contenu requis' }); setAiUploading(false); return }
        const title = aiNewTitle.trim() || 'Note ' + new Date().toLocaleDateString()
        const { error } = await supabase.from('chatbot_sources').insert({ type: 'text', title, content: aiNewText.trim(), status: 'active' })
        if (error) throw error
        setAiNewText('')
        setAiNewTitle('')
        setAiMsg({ type: 'success', text: 'Contenu ajoute avec succes' })
      } else if (aiAddType === 'file') {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.pdf,.docx,.doc,.xlsx,.xls,.csv,.txt'
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0]
          if (!file) { setAiUploading(false); return }
          const ext = file.name.split('.').pop()?.toLowerCase() || 'txt'
          const fileType = ['pdf'].includes(ext) ? 'pdf' : ['docx', 'doc'].includes(ext) ? 'docx' : ['xlsx', 'xls', 'csv'].includes(ext) ? 'xlsx' : 'text'
          const filePath = `sources/${Date.now()}_${file.name}`
          const { error: uploadErr } = await supabase!.storage.from('chatbot-sources').upload(filePath, file)
          if (uploadErr) { setAiMsg({ type: 'error', text: 'Erreur upload: ' + uploadErr.message }); setAiUploading(false); return }
          const { error } = await supabase!.from('chatbot_sources').insert({
            type: fileType, title: aiNewTitle.trim() || file.name, file_path: filePath,
            status: 'active', metadata: { size: file.size, originalName: file.name },
          })
          if (error) throw error
          setAiNewTitle('')
          setAiMsg({ type: 'success', text: `Fichier "${file.name}" charge avec succes` })
          fetchAiSources()
          setAiUploading(false)
        }
        input.click()
        return // async file picker
      }
      fetchAiSources()
    } catch (err: any) {
      setAiMsg({ type: 'error', text: err.message || 'Erreur' })
    } finally {
      setAiUploading(false)
    }
  }

  const handleDeleteAiSource = async (id: string) => {
    if (!supabase) return
    const src = aiSources.find(s => s.id === id)
    if (src?.file_path) {
      await supabase.storage.from('chatbot-sources').remove([src.file_path])
    }
    await supabase.from('chatbot_sources').delete().eq('id', id)
    setAiSources(prev => prev.filter(s => s.id !== id))
  }

  const handleToggleAiSource = async (id: string, currentStatus: string) => {
    if (!supabase) return
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await supabase.from('chatbot_sources').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setAiSources(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
  }

  const renderAiSourcesTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: rv(16, 18, 20), fontWeight: 700, margin: 0, color: C.text }}>Sources de connaissances IA</h2>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 0' }}>
            Documents et URLs utilises par le chatbot pour repondre aux questions
          </p>
        </div>
      </div>

      {aiMsg && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
          background: aiMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: aiMsg.type === 'success' ? '#166534' : '#991b1b',
        }}>
          {aiMsg.text}
        </div>
      )}

      {/* Add source form */}
      <div style={{ background: C.card, borderRadius: 12, padding: rv(14, 18, 20), marginBottom: 20, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {([
            { id: 'url' as const, label: 'URL', icon: <Globe size={14} /> },
            { id: 'file' as const, label: 'Fichier', icon: <Upload size={14} /> },
            { id: 'text' as const, label: 'Texte', icon: <FileText size={14} /> },
          ]).map(t => (
            <button key={t.id} onClick={() => setAiAddType(t.id)} style={{
              ...btnOutline, background: aiAddType === t.id ? C.primaryLight : C.card,
              color: aiAddType === t.id ? C.primary : C.text,
              borderColor: aiAddType === t.id ? C.primary : C.border,
              fontWeight: aiAddType === t.id ? 700 : 500,
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="Titre (optionnel)"
            value={aiNewTitle}
            onChange={e => setAiNewTitle(e.target.value)}
            style={{ flex: '0 0 200px', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: C.bg, color: C.text }}
          />
          {aiAddType === 'url' && (
            <input
              placeholder="https://example.com/documentation"
              value={aiNewUrl}
              onChange={e => setAiNewUrl(e.target.value)}
              style={{ flex: 1, minWidth: 250, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: C.bg, color: C.text }}
            />
          )}
          {aiAddType === 'text' && (
            <textarea
              placeholder="Collez ici le contenu texte (FAQ, descriptions, reponses type...)"
              value={aiNewText}
              onChange={e => setAiNewText(e.target.value)}
              rows={3}
              style={{ flex: 1, minWidth: 250, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: C.bg, color: C.text, resize: 'vertical' }}
            />
          )}
          {aiAddType === 'file' && (
            <div style={{ flex: 1, minWidth: 250, padding: '16px', borderRadius: 6, border: `2px dashed ${C.border}`, textAlign: 'center', color: C.textSecondary, fontSize: 13 }}>
              <Upload size={24} style={{ marginBottom: 4 }} /><br />
              PDF, Word (.docx), Excel (.xlsx), CSV, TXT
            </div>
          )}
          <button
            onClick={handleAddAiSource}
            disabled={aiUploading}
            style={{
              ...btnOutline, background: C.primary, color: '#fff', borderColor: C.primary,
              opacity: aiUploading ? 0.6 : 1, fontWeight: 600,
            }}
          >
            {aiUploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
            Ajouter
          </button>
        </div>
      </div>

      {/* Sources list */}
      {aiSourcesLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
        </div>
      ) : aiSources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textSecondary }}>
          <MessageSquare size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
          <p>Aucune source configuree</p>
          <p style={{ fontSize: 12 }}>Ajoutez des URLs, fichiers ou textes pour enrichir les reponses du chatbot</p>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.stripe }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: C.textSecondary }}>TYPE</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: C.textSecondary }}>TITRE</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: C.textSecondary }}>SOURCE</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: C.textSecondary }}>STATUT</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: C.textSecondary }}>DATE</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: C.textSecondary }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {aiSources.map(src => (
                <tr key={src.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
                      borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: src.type === 'url' ? '#dbeafe' : src.type === 'pdf' ? '#fee2e2' : src.type === 'docx' ? '#e0e7ff' : src.type === 'xlsx' ? '#dcfce7' : '#f3f4f6',
                      color: src.type === 'url' ? '#1d4ed8' : src.type === 'pdf' ? '#991b1b' : src.type === 'docx' ? '#4338ca' : src.type === 'xlsx' ? '#166534' : '#374151',
                    }}>
                      {src.type === 'url' ? <Globe size={12} /> : <FileText size={12} />}
                      {src.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: C.text }}>{src.title}</td>
                  <td style={{ padding: '10px 14px', color: C.textSecondary, fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {src.url || src.file_path || (src.content?.substring(0, 60) + '...') || '-'}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <button onClick={() => handleToggleAiSource(src.id, src.status)} style={{
                      ...btnOutline, padding: '3px 10px', fontSize: 11, border: 'none',
                      background: src.status === 'active' ? '#dcfce7' : '#fee2e2',
                      color: src.status === 'active' ? '#166534' : '#991b1b', cursor: 'pointer',
                    }}>
                      {src.status === 'active' ? <Eye size={11} /> : <EyeOff size={11} />}
                      {src.status === 'active' ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: C.textSecondary, fontSize: 12 }}>
                    {new Date(src.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <button onClick={() => handleDeleteAiSource(src.id)} style={{ ...btnOutline, padding: '3px 8px', color: '#dc2626', borderColor: '#fca5a5' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
        {activeTab === 'agents' && renderAgentsTab()}
        {activeTab === 'ai_sources' && renderAiSourcesTab()}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
