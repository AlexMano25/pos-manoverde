import React, { useEffect, useState } from 'react'
import {
  LogOut,
  Copy,
  Check,
  Share2,
  Users,
  UserCheck,
  Clock,
  DollarSign,
  Award,
  Loader,
  Leaf,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { supabase } from '../services/supabase'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  primaryDark: '#1e293b',
  darkest: '#0f172a',
  accent: '#3b82f6',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#d97706',
  pending: '#eab308',
}

const TIER_COLORS: Record<number, string> = {
  1: '#6b7280',
  2: '#2563eb',
  3: '#7c3aed',
  4: '#d97706',
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  pending: { background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a' },
  approved: { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
  paid: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  active: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  inactive: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
  trial: { background: '#e0e7ff', color: '#3730a3', border: '1px solid #a5b4fc' },
}

// ── Types ────────────────────────────────────────────────────────────────

interface AgentRecord {
  id: string
  name: string
  email: string
  phone: string
  referral_code: string
  auth_id: string
  tier: number
  commission_rate: number
  is_active: boolean
  total_earned_usd: number
  total_paid_usd: number
  created_at: string
  updated_at: string
  [key: string]: any
}

interface Referral {
  id: string
  organization_id: string
  generation?: number
  referred_agent_id?: string
  status: string
  created_at: string
  organizations?: {
    name: string
    owner_name: string
    owner_email: string
  }
  subscriptions?: {
    plan: string
    status: string
  }
  [key: string]: any
}

interface Withdrawal {
  id: string
  agent_id: string
  amount: number
  fee: number
  net_amount: number
  method: string
  phone: string
  status: string
  created_at: string
  processed_at?: string
}

interface Commission {
  id: string
  organization_id: string
  source_type: string
  source_id?: string
  gross_amount_usd: number
  commission_rate: number
  commission_usd: number
  generation?: number
  status: string
  created_at: string
  organizations?: {
    name: string
  }
  [key: string]: any
}

interface TierConfig {
  tier: number
  name_fr: string
  name_en: string
  min_referrals: number
  commission_rate: number
  [key: string]: any
}

// ── Default tiers ────────────────────────────────────────────────────────

const DEFAULT_TIERS: TierConfig[] = [
  { tier: 1, name_fr: 'Débutant', name_en: 'Beginner', min_referrals: 10, commission_rate: 0.05 },
  { tier: 2, name_fr: 'Intermédiaire', name_en: 'Intermediate', min_referrals: 25, commission_rate: 0.10 },
  { tier: 3, name_fr: 'Avancé', name_en: 'Advanced', min_referrals: 50, commission_rate: 0.15 },
  { tier: 4, name_fr: 'Expert', name_en: 'Expert', min_referrals: 100, commission_rate: 0.20 },
]

// ── Component ────────────────────────────────────────────────────────────

export default function AgentDashboardPage() {
  const { t } = useLanguageStore()
  const user = useAuthStore((s) => s.user)

  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<AgentRecord | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [tiers, setTiers] = useState<TierConfig[]>(DEFAULT_TIERS)
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [sponsorName, setSponsorName] = useState<string | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', method: 'mtn_momo', phone: '' })
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Responsive listener ──────────────────────────────────────────────

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // ── Data fetching ────────────────────────────────────────────────────

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    if (!supabase) return
    if (!user?.email) return

    setLoading(true)
    try {
      // Fetch agent record
      const { data: agentData, error: agentErr } = await supabase
        .from('agents')
        .select('*')
        .eq('email', user.email)
        .single()

      if (agentErr) console.warn('[AgentDashboard] Agent fetch error:', agentErr.message)
      if (agentData) setAgent(agentData)

      if (agentData?.id) {
        // Fetch referrals (separate queries to avoid RLS join issues)
        const { data: refData, error: refErr } = await supabase
          .from('agent_referrals')
          .select('*')
          .eq('agent_id', agentData.id)
          .order('created_at', { ascending: false })
        if (refErr) console.warn('[AgentDashboard] Referrals error:', refErr.message)

        // Enrich referrals with org info
        if (refData && refData.length > 0) {
          const orgIds = refData.map((r: any) => r.organization_id)
          const { data: orgs } = await supabase
            .from('organizations')
            .select('id, name, owner_name, owner_email')
            .in('id', orgIds)
          const orgMap: Record<string, any> = {}
          ;(orgs || []).forEach((o: any) => { orgMap[o.id] = o })
          setReferrals(refData.map((r: any) => ({
            ...r,
            organizations: orgMap[r.organization_id] || { name: '-', owner_name: '-', owner_email: '-' },
          })))
        }

        // Fetch commissions (no join)
        const { data: commData, error: commErr } = await supabase
          .from('agent_commissions')
          .select('*')
          .eq('agent_id', agentData.id)
          .order('created_at', { ascending: false })
        if (commErr) console.warn('[AgentDashboard] Commissions error:', commErr.message)
        if (commData) {
          const cOrgIds = [...new Set(commData.map((c: any) => c.organization_id))]
          const { data: cOrgs } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', cOrgIds)
          const cOrgMap: Record<string, any> = {}
          ;(cOrgs || []).forEach((o: any) => { cOrgMap[o.id] = o })
          setCommissions(commData.map((c: any) => ({
            ...c,
            organizations: cOrgMap[c.organization_id] || { name: '-' },
          })))
        }

        // Fetch withdrawals
        const { data: wData } = await supabase
          .from('agent_withdrawals')
          .select('*')
          .eq('agent_id', agentData.id)
          .order('created_at', { ascending: false })
        if (wData) setWithdrawals(wData)

        // Fetch sponsor info
        if (agentData.sponsor_id) {
          const { data: sponsorData } = await supabase
            .from('agents')
            .select('name')
            .eq('id', agentData.sponsor_id)
            .maybeSingle()
          if (sponsorData) setSponsorName(sponsorData.name)
        }
      }

      // Fetch tier config
      const { data: tierData } = await supabase
        .from('agent_tier_config')
        .select('*')
        .order('tier', { ascending: true })

      if (tierData && tierData.length > 0) setTiers(tierData)
    } catch (err) {
      console.error('Agent dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Computed values ──────────────────────────────────────────────────

  const referralLink = `https://pos.manoverde.com/?ref=${agent?.referral_code || ''}`
  const defaultTier = { tier: 1, name_fr: 'Débutant', name_en: 'Beginner', min_referrals: 10, commission_rate: 0.05, name: 'Débutant' }
  const currentTier = tiers.find((t) => t.tier === (agent?.tier || 1)) || tiers[0] || defaultTier
  const nextTier = tiers.find((t) => t.tier === (agent?.tier || 1) + 1)

  const activeClients = referrals.filter((r: any) => r.status === 'active').length
  const totalReferrals = referrals.length
  const totalEarned = Number(agent?.total_earned_usd) || 0

  const pendingCommissions = commissions
    .filter((c: any) => c.status === 'pending')
    .reduce((s: number, c: any) => s + (Number(c.commission_usd) || 0), 0)

  const totalPaid = commissions
    .filter((c: any) => c.status === 'paid')
    .reduce((s: number, c: any) => s + (Number(c.commission_usd) || 0), 0)

  const totalCommissionsEarned = commissions.reduce((s: number, c: any) => s + (Number(c.commission_usd) || 0), 0)
  const balancePending = totalCommissionsEarned - totalPaid

  const pendingBalance = Number(agent?.pending_balance) || 0

  // Per-generation totals
  const genTotals = [1, 2, 3, 4].map(gen =>
    commissions
      .filter((c: any) => (c.generation || 1) === gen)
      .reduce((s: number, c: any) => s + (Number(c.commission_usd) || 0), 0)
  )

  // ── Tier progress ────────────────────────────────────────────────────

  const progressPercent = nextTier
    ? Math.min(100, Math.round((activeClients / nextTier.min_referrals) * 100))
    : 100

  // ── Clipboard ────────────────────────────────────────────────────────

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleWhatsAppShare() {
    const text = encodeURIComponent(
      `${(t as any).agent?.whatsappMessage || 'Rejoignez Mano Verde POS avec mon lien :'} ${referralLink}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function handleLogout() {
    useAuthStore.getState().logout()
  }

  async function handleWithdraw() {
    if (!supabase || !agent) return
    const amount = Number(withdrawForm.amount)
    if (!amount || amount < 5000) {
      setWithdrawMsg({ type: 'error', text: 'Le montant minimum est de 5 000 FCFA.' })
      return
    }
    if (amount > pendingBalance) {
      setWithdrawMsg({ type: 'error', text: 'Solde insuffisant.' })
      return
    }
    if (!withdrawForm.phone.trim()) {
      setWithdrawMsg({ type: 'error', text: 'Veuillez saisir votre numero de telephone.' })
      return
    }
    setWithdrawSubmitting(true)
    setWithdrawMsg(null)
    try {
      const fee = Math.round(amount * 0.03)
      const netAmount = amount - fee
      const { error } = await supabase.from('agent_withdrawals').insert({
        agent_id: agent.id,
        amount,
        fee,
        net_amount: netAmount,
        method: withdrawForm.method,
        phone: withdrawForm.phone.trim(),
        status: 'pending',
      })
      if (error) throw error
      // Debit pending_balance
      await supabase.from('agents').update({
        pending_balance: pendingBalance - amount,
      }).eq('id', agent.id)
      setWithdrawForm({ amount: '', method: 'mtn_momo', phone: '' })
      setWithdrawMsg({ type: 'success', text: `Demande de retrait de ${netAmount.toLocaleString()} FCFA envoyee.` })
      fetchData()
    } catch (err: any) {
      setWithdrawMsg({ type: 'error', text: err.message || 'Erreur, veuillez reessayer.' })
    } finally {
      setWithdrawSubmitting(false)
    }
  }

  // ── Loading state ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg }}>
        <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
      </div>
    )
  }

  if (!agent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, gap: 16 }}>
        <AlertCircle size={48} color="#ef4444" />
        <p style={{ fontSize: 16, color: '#64748b', textAlign: 'center' }}>
          Aucun profil agent trouve pour cet email.<br />
          Veuillez vous connecter avec votre compte agent.
        </p>
        <button onClick={handleLogout} style={{ padding: '10px 24px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Se deconnecter
        </button>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          background: C.darkest,
          color: '#fff',
          padding: isMobile ? '12px 16px' : '14px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Leaf size={24} color="#22c55e" />
          <span style={{ fontWeight: 700, fontSize: isMobile ? 16 : 20 }}>Mano Verde</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14 }}>{agent?.name || user?.name || ''}</span>
          <span
            style={{
              background: TIER_COLORS[agent?.tier || 1],
              color: '#fff',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {currentTier.name_fr || currentTier.name || 'Débutant'}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
            }}
          >
            <LogOut size={16} />
            {!isMobile && ((t as any).agent?.logout || 'Deconnexion')}
          </button>
        </div>
      </div>

      {/* ── Page Content ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px' : '24px 32px' }}>

        {/* ── Referral Link ────────────────────────────────────────────── */}
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            padding: isMobile ? 16 : 20,
            marginBottom: 20,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: C.text }}>
            {(t as any).agent?.referralLink || 'Votre lien de parrainage'}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 10,
              alignItems: isMobile ? 'stretch' : 'center',
            }}
          >
            <div
              style={{
                flex: 1,
                background: C.bg,
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'monospace',
                color: C.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {referralLink}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? C.success : C.primary,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? ((t as any).agent?.copied || 'Copie !') : ((t as any).agent?.copy || 'Copier')}
              </button>
              <button
                onClick={handleWhatsAppShare}
                style={{
                  background: '#25d366',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                <Share2 size={16} />
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats Cards ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <StatCard
            icon={<Users size={20} color={C.primary} />}
            label={(t as any).agent?.totalReferrals || 'Total filleuls'}
            value={totalReferrals}
            color={C.primary}
          />
          <StatCard
            icon={<UserCheck size={20} color={C.success} />}
            label={(t as any).agent?.activeClients || 'Clients actifs'}
            value={activeClients}
            color={C.success}
          />
          <StatCard
            icon={<Clock size={20} color={C.warning} />}
            label={(t as any).agent?.pendingCommissions || 'Commissions en attente'}
            value={`${pendingCommissions.toLocaleString()} $`}
            color={C.warning}
          />
          <StatCard
            icon={<DollarSign size={20} color={C.success} />}
            label={(t as any).agent?.totalEarned || 'Total gagne'}
            value={`${totalEarned.toLocaleString()} $`}
            color={C.success}
          />
        </div>

        {/* ── Pending Balance + Sponsor Info ──────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : sponsorName ? '1fr 1fr' : '1fr',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ background: C.card, borderRadius: 12, padding: isMobile ? 16 : 20, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>Solde disponible pour retrait</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.success }}>{pendingBalance.toLocaleString()} FCFA</div>
          </div>
          {sponsorName && (
            <div style={{ background: C.card, borderRadius: 12, padding: isMobile ? 16 : 20, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>Votre parrain</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.text }}>{sponsorName}</div>
            </div>
          )}
        </div>

        {/* ── Gains par generation ────────────────────────────────────── */}
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            padding: isMobile ? 16 : 20,
            marginBottom: 20,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, color: C.text }}>
            Gains par generation
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: 10,
            }}
          >
            {[
              { label: 'Gen 1 (Direct)', value: genTotals[0], color: '#2563eb' },
              { label: 'Gen 2', value: genTotals[1], color: '#7c3aed' },
              { label: 'Gen 3', value: genTotals[2], color: '#d97706' },
              { label: 'Gen 4', value: genTotals[3], color: '#059669' },
            ].map(g => (
              <div
                key={g.label}
                style={{
                  background: `${g.color}0a`,
                  borderRadius: 10,
                  padding: 14,
                  border: `1px solid ${g.color}30`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>{g.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: g.color }}>{g.value.toLocaleString()} FCFA</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tier Progression ─────────────────────────────────────────── */}
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            padding: isMobile ? 16 : 20,
            marginBottom: 20,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Award size={20} color={TIER_COLORS[agent?.tier || 1]} />
            <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>
              {(t as any).agent?.tierProgression || 'Progression de niveau'}
            </span>
          </div>

          {/* Current tier info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span
              style={{
                background: TIER_COLORS[agent?.tier || 1],
                color: '#fff',
                padding: '3px 12px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {currentTier.name_fr || currentTier.name || 'Débutant'}
            </span>
            <span style={{ fontSize: 13, color: C.textSecondary }}>
              {Math.round((currentTier.commission_rate || 0) * 100)}% {(t as any).agent?.commissionRate || 'de commission'}
            </span>
          </div>

          {/* Progress bar */}
          {nextTier && (
            <>
              <div
                style={{
                  background: '#e2e8f0',
                  borderRadius: 8,
                  height: 10,
                  marginBottom: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: TIER_COLORS[agent?.tier || 1],
                    height: '100%',
                    borderRadius: 8,
                    width: `${progressPercent}%`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>
                {activeClients}/{nextTier.min_referrals} {(t as any).agent?.clientsFor || 'clients pour'}{' '}
                <strong style={{ color: TIER_COLORS[nextTier.tier] }}>{nextTier.name_fr || nextTier.name_en || `Niveau ${nextTier.tier}`}</strong>
              </div>
            </>
          )}

          {/* All tiers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: 10,
            }}
          >
            {tiers.map((tier) => {
              const isActive = tier.tier === (agent?.tier || 1)
              return (
                <div
                  key={tier.tier}
                  style={{
                    background: isActive ? `${TIER_COLORS[tier.tier]}12` : C.bg,
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: isActive ? `2px solid ${TIER_COLORS[tier.tier]}` : `1px solid ${C.border}`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: TIER_COLORS[tier.tier] }}>
                    {tier.name_fr || tier.name || `Niveau ${tier.tier}`}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                    {tier.min_referrals} clients
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 4 }}>
                    {Math.round((tier.commission_rate || 0) * 100)}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Referred Clients Table ──────────────────────────────────── */}
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            padding: isMobile ? 16 : 20,
            marginBottom: 20,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, color: C.text }}>
            {(t as any).agent?.referredClients || 'Clients parraines'}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {[
                    'Gen.',
                    (t as any).agent?.colName || 'Nom',
                    (t as any).agent?.colOwner || 'Proprietaire',
                    (t as any).agent?.colPlan || 'Plan',
                    (t as any).agent?.colStatus || 'Statut',
                    (t as any).agent?.colDate || 'Date inscription',
                  ].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        color: C.textSecondary,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: 20, textAlign: 'center', color: C.textSecondary }}
                    >
                      {(t as any).agent?.noReferrals || 'Aucun filleul pour le moment'}
                    </td>
                  </tr>
                ) : (
                  referrals.map((ref) => (
                    <tr key={ref.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: ref.generation === 1 ? '#dbeafe' : ref.generation === 2 ? '#ede9fe' : ref.generation === 3 ? '#fef3c7' : '#d1fae5',
                          color: ref.generation === 1 ? '#1d4ed8' : ref.generation === 2 ? '#6d28d9' : ref.generation === 3 ? '#92400e' : '#065f46',
                        }}>G{ref.generation || 1}</span>
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 500 }}>
                        {ref.organizations?.name || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', color: C.textSecondary }}>
                        {ref.organizations?.owner_name || '-'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span
                          style={{
                            background: '#e0e7ff',
                            color: '#3730a3',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {ref.subscriptions?.plan || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <StatusBadge status={ref.subscriptions?.status || ref.status} />
                      </td>
                      <td style={{ padding: '8px 10px', color: C.textSecondary }}>
                        {new Date(ref.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Commissions Table ───────────────────────────────────────── */}
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            padding: isMobile ? 16 : 20,
            marginBottom: 20,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, color: C.text }}>
            {(t as any).agent?.commissions || 'Commissions'}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {[
                    'Date',
                    'Client',
                    'Type',
                    'Gen.',
                    (t as any).agent?.grossAmount || 'Montant brut',
                    (t as any).agent?.rate || 'Taux',
                    'Commission',
                    (t as any).agent?.colStatus || 'Statut',
                  ].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        color: C.textSecondary,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ padding: 20, textAlign: 'center', color: C.textSecondary }}
                    >
                      {(t as any).agent?.noCommissions || 'Aucune commission pour le moment'}
                    </td>
                  </tr>
                ) : (
                  commissions.map((comm) => (
                    <tr key={comm.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '8px 10px', color: C.textSecondary }}>
                        {new Date(comm.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 500 }}>
                        {comm.organizations?.name || '-'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span
                          style={{
                            background: '#f0f9ff',
                            color: '#0369a1',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        >
                          {comm.source_type}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span
                          style={{
                            background: (comm.generation || 1) === 1 ? '#dbeafe' : (comm.generation || 1) === 2 ? '#ede9fe' : (comm.generation || 1) === 3 ? '#fef3c7' : '#d1fae5',
                            color: (comm.generation || 1) === 1 ? '#1e40af' : (comm.generation || 1) === 2 ? '#5b21b6' : (comm.generation || 1) === 3 ? '#92400e' : '#065f46',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          G{comm.generation || 1}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {Number(comm.gross_amount_usd || 0).toLocaleString()} $
                      </td>
                      <td style={{ padding: '8px 10px' }}>{Math.round((comm.commission_rate || 0) * 100)}%</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                        {Number(comm.commission_usd || 0).toLocaleString()} $
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <StatusBadge status={comm.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Payout Summary ──────────────────────────────────────────── */}
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            padding: isMobile ? 16 : 20,
            marginBottom: 40,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, color: C.text }}>
            {(t as any).agent?.payoutSummary || 'Resume des paiements'}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            <PayoutCard
              label={(t as any).agent?.totalEarned || 'Total gagne'}
              value={`${totalCommissionsEarned.toLocaleString()} $`}
              color={C.primary}
            />
            <PayoutCard
              label={(t as any).agent?.totalPaid || 'Total paye'}
              value={`${totalPaid.toLocaleString()} $`}
              color={C.success}
            />
            <PayoutCard
              label={(t as any).agent?.pendingBalance || 'Solde en attente'}
              value={`${balancePending.toLocaleString()} $`}
              color={C.warning}
            />
          </div>
        </div>

        {/* ── Withdrawal Form ──────────────────────────────────────────── */}
        <div
          style={{
            background: C.card,
            borderRadius: 12,
            padding: isMobile ? 16 : 20,
            marginBottom: 20,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, color: C.text }}>
            Demande de retrait
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <label style={{ fontSize: 12, color: C.textSecondary, display: 'block', marginBottom: 4 }}>Montant (min 5 000 FCFA)</label>
              <input
                type="number"
                placeholder="10000"
                value={withdrawForm.amount}
                onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textSecondary, display: 'block', marginBottom: 4 }}>Methode de paiement</label>
              <select
                value={withdrawForm.method}
                onChange={e => setWithdrawForm(f => ({ ...f, method: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
              >
                <option value="mtn_momo">MTN MoMo</option>
                <option value="orange_money">Orange Money</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.textSecondary, display: 'block', marginBottom: 4 }}>Numero de telephone</label>
              <input
                type="tel"
                placeholder="6XXXXXXXX"
                value={withdrawForm.phone}
                onChange={e => setWithdrawForm(f => ({ ...f, phone: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Fee display */}
          {Number(withdrawForm.amount) > 0 && (
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: C.textSecondary, marginBottom: 12, flexWrap: 'wrap' }}>
              <span>Frais (3%): <strong style={{ color: C.warning }}>{Math.round(Number(withdrawForm.amount) * 0.03).toLocaleString()} FCFA</strong></span>
              <span>Montant net: <strong style={{ color: C.success }}>{(Number(withdrawForm.amount) - Math.round(Number(withdrawForm.amount) * 0.03)).toLocaleString()} FCFA</strong></span>
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={withdrawSubmitting}
            style={{
              padding: '10px 24px',
              background: C.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: withdrawSubmitting ? 'not-allowed' : 'pointer',
              opacity: withdrawSubmitting ? 0.6 : 1,
            }}
          >
            {withdrawSubmitting ? 'Envoi en cours...' : 'Demander le retrait'}
          </button>

          {withdrawMsg && (
            <div style={{
              marginTop: 10,
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              background: withdrawMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: withdrawMsg.type === 'success' ? '#166534' : '#991b1b',
            }}>
              {withdrawMsg.text}
            </div>
          )}
        </div>

        {/* ── Withdrawal History ────────────────────────────────────────── */}
        {withdrawals.length > 0 && (
          <div
            style={{
              background: C.card,
              borderRadius: 12,
              padding: isMobile ? 16 : 20,
              marginBottom: 40,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, color: C.text }}>
              Historique des retraits
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    {['Date', 'Montant', 'Frais', 'Net', 'Methode', 'Telephone', 'Statut'].map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '8px 10px', color: C.textSecondary, fontWeight: 600, whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(w => (
                    <tr key={w.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '8px 10px', color: C.textSecondary }}>{new Date(w.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{Number(w.amount).toLocaleString()} FCFA</td>
                      <td style={{ padding: '8px 10px' }}>{Number(w.fee).toLocaleString()} FCFA</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: C.success }}>{Number(w.net_amount).toLocaleString()} FCFA</td>
                      <td style={{ padding: '8px 10px' }}>{w.method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}</td>
                      <td style={{ padding: '8px 10px' }}>{w.phone}</td>
                      <td style={{ padding: '8px 10px' }}><StatusBadge status={w.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 12,
        padding: 16,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${color}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span
      style={{
        ...style,
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        display: 'inline-block',
      }}
    >
      {status}
    </span>
  )
}

function PayoutCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: `${color}08`,
        borderRadius: 10,
        padding: 16,
        border: `1px solid ${color}30`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
