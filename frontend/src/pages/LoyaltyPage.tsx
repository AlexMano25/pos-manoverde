import React, { useState, useEffect, useMemo } from 'react'
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Users,
  Star,
  Award,
  TrendingUp,
  Percent,
  DollarSign,
  ShoppingBag,
  Ticket,
  Search,
  Settings,
  Save,
  AlertTriangle,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useLoyaltyStore } from '../stores/loyaltyStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { PointTransactionType, LoyaltyRewardType } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#e11d48',
  primaryDark: '#be123c',
  primaryLight: '#fecdd3',
  primaryBg: '#fff1f2',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#dcfce7',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  indigo: '#6366f1',
  indigoBg: '#e0e7ff',
  purple: '#8b5cf6',
  purpleBg: '#f3e8ff',
  blue: '#3b82f6',
  blueBg: '#dbeafe',
  gray: '#94a3b8',
  grayBg: '#f1f5f9',
} as const

// ── Reward type config ────────────────────────────────────────────────────

const REWARD_TYPE_CONFIG: Record<LoyaltyRewardType, { icon: typeof Percent; label: string; color: string; bg: string }> = {
  discount_pct:   { icon: Percent,      label: 'Discount %',   color: C.purple,  bg: C.purpleBg },
  discount_fixed: { icon: DollarSign,   label: 'Fixed Discount', color: C.success, bg: C.successBg },
  free_product:   { icon: ShoppingBag,  label: 'Free Product', color: C.warning, bg: C.warningBg },
  voucher:        { icon: Ticket,       label: 'Voucher',      color: C.blue,    bg: C.blueBg },
}

// ── Transaction type config ───────────────────────────────────────────────

const TX_TYPE_CONFIG: Record<PointTransactionType, { label: string; color: string; bg: string }> = {
  earn:   { label: 'Earn',   color: '#16a34a', bg: '#dcfce7' },
  redeem: { label: 'Redeem', color: '#dc2626', bg: '#fef2f2' },
  bonus:  { label: 'Bonus',  color: '#8b5cf6', bg: '#f3e8ff' },
  expire: { label: 'Expire', color: '#94a3b8', bg: '#f1f5f9' },
  adjust: { label: 'Adjust', color: '#3b82f6', bg: '#dbeafe' },
}

// ── Tab type ──────────────────────────────────────────────────────────────

type TabKey = 'rewards' | 'transactions' | 'configuration'

// ── Form state ────────────────────────────────────────────────────────────

interface RewardForm {
  name: string
  description: string
  points_required: number
  reward_type: LoyaltyRewardType
  reward_value: number
  is_active: boolean
}

const emptyForm: RewardForm = {
  name: '',
  description: '',
  points_required: 0,
  reward_type: 'discount_pct',
  reward_value: 0,
  is_active: true,
}

// ── Config state ──────────────────────────────────────────────────────────

interface LoyaltyConfig {
  points_per_unit: number
  currency_per_point: number
  tier_bronze: number
  tier_silver: number
  tier_gold: number
  tier_platinum: number
}

const defaultConfig: LoyaltyConfig = {
  points_per_unit: 1,
  currency_per_point: 10,
  tier_bronze: 0,
  tier_silver: 500,
  tier_gold: 2000,
  tier_platinum: 5000,
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Component ─────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    rewards,
    transactions,
    loading,
    filterType,
    loadRewards,
    loadTransactions,
    addReward,
    updateReward,
    deleteReward,
    setFilterType,
  } = useLoyaltyStore()

  // ── i18n fallback ───────────────────────────────────────────────────────
  const label = (t as Record<string, unknown>).loyalty || {} as Record<string, string>
  const lbl = label as Record<string, string>
  const L = {
    title: lbl.title || 'Loyalty & Rewards',
    addReward: lbl.addReward || 'Add Reward',
    editReward: lbl.editReward || 'Edit Reward',
    deleteReward: lbl.deleteReward || 'Delete Reward',
    deleteConfirm: lbl.deleteConfirm || 'Are you sure you want to delete this reward? This action cannot be undone.',
    rewards: lbl.rewards || 'Rewards',
    transactions: lbl.transactions || 'Transactions',
    configuration: lbl.configuration || 'Configuration',
    totalMembers: lbl.totalMembers || 'Total Members',
    pointsDistributed: lbl.pointsDistributed || 'Points Distributed',
    rewardsRedeemed: lbl.rewardsRedeemed || 'Rewards Redeemed',
    loyaltyRevenue: lbl.loyaltyRevenue || 'Loyalty Revenue',
    name: lbl.name || 'Name',
    description: lbl.description || 'Description',
    pointsRequired: lbl.pointsRequired || 'Points Required',
    rewardType: lbl.rewardType || 'Reward Type',
    rewardValue: lbl.rewardValue || 'Reward Value',
    active: lbl.active || 'Active',
    inactive: lbl.inactive || 'Inactive',
    save: lbl.save || 'Save',
    cancel: lbl.cancel || 'Cancel',
    delete: lbl.delete || 'Delete',
    noRewards: lbl.noRewards || 'No rewards yet',
    noRewardsDesc: lbl.noRewardsDesc || 'Create your first loyalty reward to get started.',
    noTransactions: lbl.noTransactions || 'No transactions yet',
    noTransactionsDesc: lbl.noTransactionsDesc || 'Point transactions will appear here.',
    all: lbl.all || 'All',
    pointsPerUnit: lbl.pointsPerUnit || 'Points per currency unit',
    currencyPerPoint: lbl.currencyPerPoint || 'Currency per point',
    tierThresholds: lbl.tierThresholds || 'Tier Thresholds',
    configSaved: lbl.configSaved || 'Configuration saved',
    redemptions: lbl.redemptions || 'redemptions',
    points: lbl.points || 'pts',
    search: lbl.search || 'Search transactions...',
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'

  // ── Local state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>('rewards')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<RewardForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [txSearch, setTxSearch] = useState('')
  const [config, setConfig] = useState<LoyaltyConfig>(defaultConfig)
  const [configSaved, setConfigSaved] = useState(false)

  // ── Load data ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadRewards(storeId)
    loadTransactions(storeId)
  }, [storeId, loadRewards, loadTransactions])

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const uniqueCustomers = new Set(transactions.map((tx) => tx.customer_id))
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthlyPoints = transactions
      .filter((tx) => tx.type === 'earn' && tx.created_at >= monthStart)
      .reduce((sum, tx) => sum + tx.points, 0)
    const redeemCount = transactions.filter((tx) => tx.type === 'redeem').length
    const totalEarned = transactions
      .filter((tx) => tx.type === 'earn')
      .reduce((sum, tx) => sum + tx.points, 0)

    return {
      totalMembers: uniqueCustomers.size,
      monthlyPoints,
      redeemCount,
      totalEarned,
    }
  }, [transactions])

  // ── Filtered transactions ───────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    let list = transactions
    if (filterType !== 'all') {
      list = list.filter((tx) => tx.type === filterType)
    }
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase()
      list = list.filter(
        (tx) =>
          tx.customer_name.toLowerCase().includes(q) ||
          (tx.description && tx.description.toLowerCase().includes(q))
      )
    }
    return list
  }, [transactions, filterType, txSearch])

  // ── Form handlers ─────────────────────────────────────────────────────
  function openAddModal() {
    setForm(emptyForm)
    setEditingId(null)
    setShowAddModal(true)
  }

  function openEditModal(rewardId: string) {
    const reward = rewards.find((r) => r.id === rewardId)
    if (!reward) return
    setForm({
      name: reward.name,
      description: reward.description || '',
      points_required: reward.points_required,
      reward_type: reward.reward_type,
      reward_value: reward.reward_value,
      is_active: reward.is_active,
    })
    setEditingId(rewardId)
    setShowAddModal(true)
  }

  function openDeleteModal(rewardId: string) {
    setDeleteId(rewardId)
    setShowDeleteModal(true)
  }

  async function handleSaveReward() {
    if (!form.name.trim() || form.points_required <= 0) return
    setSaving(true)
    try {
      if (editingId) {
        await updateReward(editingId, {
          name: form.name,
          description: form.description || undefined,
          points_required: form.points_required,
          reward_type: form.reward_type,
          reward_value: form.reward_value,
          is_active: form.is_active,
        })
      } else {
        await addReward(storeId, {
          name: form.name,
          description: form.description || undefined,
          points_required: form.points_required,
          reward_type: form.reward_type,
          reward_value: form.reward_value,
          is_active: form.is_active,
        })
      }
      setShowAddModal(false)
      setEditingId(null)
    } catch (err) {
      console.error('[LoyaltyPage] Save reward error:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteReward() {
    if (!deleteId) return
    setSaving(true)
    try {
      await deleteReward(deleteId)
      setShowDeleteModal(false)
      setDeleteId(null)
    } catch (err) {
      console.error('[LoyaltyPage] Delete reward error:', err)
    } finally {
      setSaving(false)
    }
  }

  function handleSaveConfig() {
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }

  // ── Reward type label ───────────────────────────────────────────────────
  function rewardValueLabel(type: LoyaltyRewardType, value: number): string {
    switch (type) {
      case 'discount_pct':
        return `${value}% off`
      case 'discount_fixed':
        return formatCurrency(value, currency) + ' off'
      case 'free_product':
        return 'Free item'
      case 'voucher':
        return formatCurrency(value, currency) + ' voucher'
      default:
        return String(value)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      {/* CSS keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
          padding: rv('20px 16px', '28px 32px', '32px 40px'),
          color: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 16 : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Gift size={26} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: rv(22, 26, 28), fontWeight: 800 }}>
                {L.title}
              </h1>
              <div style={{ fontSize: 14, opacity: 0.85, marginTop: 2 }}>
                {rewards.length} {L.rewards.toLowerCase()} &middot;{' '}
                {stats.totalMembers} {L.totalMembers.toLowerCase()}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              backgroundColor: '#ffffff',
              color: C.primary,
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            <Plus size={18} />
            {L.addReward}
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ padding: rv('16px', '24px 32px', '28px 40px'), maxWidth: 1200, margin: '0 auto' }}>
        {/* ── Stats Row ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: rv('1fr 1fr', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
            gap: rv(10, 14, 16),
            marginBottom: rv(20, 24, 28),
          }}
        >
          {/* Total Members */}
          <StatCard
            icon={<Users size={20} />}
            label={L.totalMembers}
            value={String(stats.totalMembers)}
            color={C.primary}
            bg={C.primaryBg}
          />
          {/* Points This Month */}
          <StatCard
            icon={<Star size={20} />}
            label={L.pointsDistributed}
            value={stats.monthlyPoints.toLocaleString()}
            color={C.indigo}
            bg={C.indigoBg}
          />
          {/* Rewards Redeemed */}
          <StatCard
            icon={<Award size={20} />}
            label={L.rewardsRedeemed}
            value={String(stats.redeemCount)}
            color={C.success}
            bg={C.successBg}
          />
          {/* Loyalty Revenue */}
          <StatCard
            icon={<TrendingUp size={20} />}
            label={L.loyaltyRevenue}
            value={stats.totalEarned.toLocaleString()}
            color={C.warning}
            bg={C.warningBg}
          />
        </div>

        {/* ── Tab Navigation ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            backgroundColor: C.card,
            borderRadius: 12,
            padding: 4,
            marginBottom: rv(16, 20, 24),
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            overflow: 'auto',
          }}
        >
          {(['rewards', 'transactions', 'configuration'] as TabKey[]).map((tab) => {
            const isActive = activeTab === tab
            const tabLabels: Record<TabKey, string> = {
              rewards: L.rewards,
              transactions: L.transactions,
              configuration: L.configuration,
            }
            const tabIcons: Record<TabKey, React.ReactNode> = {
              rewards: <Gift size={16} />,
              transactions: <TrendingUp size={16} />,
              configuration: <Settings size={16} />,
            }
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: rv(13, 14, 14),
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? C.primary : 'transparent',
                  color: isActive ? '#ffffff' : C.textSecondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {tabIcons[tab]}
                {tabLabels[tab]}
              </button>
            )
          })}
        </div>

        {/* ── Loading ────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2
              size={32}
              color={C.primary}
              style={{ animation: 'spin 1s linear infinite' }}
            />
          </div>
        )}

        {/* ── Rewards Tab ────────────────────────────────────────────── */}
        {!loading && activeTab === 'rewards' && (
          <div>
            {rewards.length === 0 ? (
              <EmptyState
                icon={<Gift size={48} color={C.primaryLight} />}
                title={L.noRewards}
                description={L.noRewardsDesc}
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
                  gap: rv(12, 14, 16),
                }}
              >
                {rewards.map((reward, idx) => {
                  const typeConf = REWARD_TYPE_CONFIG[reward.reward_type]
                  const IconComp = typeConf.icon
                  return (
                    <div
                      key={reward.id}
                      style={{
                        backgroundColor: C.card,
                        borderRadius: 14,
                        padding: rv('16px', '20px', '22px'),
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        border: `1px solid ${C.border}`,
                        animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        transition: 'box-shadow 0.2s, transform 0.2s',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      {/* Top row: icon, name, status badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              backgroundColor: typeConf.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <IconComp size={20} color={typeConf.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: C.text,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {reward.name}
                            </div>
                            {reward.description && (
                              <div
                                style={{
                                  fontSize: 13,
                                  color: C.textSecondary,
                                  marginTop: 2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {reward.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            backgroundColor: reward.is_active ? C.successBg : C.grayBg,
                            color: reward.is_active ? C.success : C.gray,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            flexShrink: 0,
                            marginLeft: 8,
                          }}
                        >
                          {reward.is_active ? L.active : L.inactive}
                        </span>
                      </div>

                      {/* Points badge + value */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 20,
                            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                            color: '#ffffff',
                            fontSize: 15,
                            fontWeight: 800,
                          }}
                        >
                          <Star size={14} />
                          {reward.points_required.toLocaleString()} {L.points}
                        </div>
                        <div style={{ fontSize: 14, color: typeConf.color, fontWeight: 600 }}>
                          {rewardValueLabel(reward.reward_type, reward.reward_value)}
                        </div>
                      </div>

                      {/* Bottom row: redemption count + actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: `1px solid ${C.border}`,
                          paddingTop: 10,
                          marginTop: 2,
                        }}
                      >
                        <div style={{ fontSize: 13, color: C.textSecondary }}>
                          {reward.redemption_count} {L.redemptions} &middot; {formatDate(reward.created_at)}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <IconButton
                            icon={<Edit2 size={15} />}
                            color={C.blue}
                            bg={C.blueBg}
                            onClick={() => openEditModal(reward.id)}
                          />
                          <IconButton
                            icon={<Trash2 size={15} />}
                            color={C.danger}
                            bg={C.dangerBg}
                            onClick={() => openDeleteModal(reward.id)}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Transactions Tab ───────────────────────────────────────── */}
        {!loading && activeTab === 'transactions' && (
          <div>
            {/* Filter pills */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {(['all', 'earn', 'redeem', 'bonus', 'expire', 'adjust'] as const).map((type) => {
                const isActive = filterType === type
                const conf = type === 'all' ? null : TX_TYPE_CONFIG[type]
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: `1.5px solid ${isActive ? (conf ? conf.color : C.primary) : C.border}`,
                      backgroundColor: isActive ? (conf ? conf.bg : C.primaryBg) : C.card,
                      color: isActive ? (conf ? conf.color : C.primary) : C.textSecondary,
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {type === 'all' ? L.all : (conf ? conf.label : type)}
                  </button>
                )
              })}
            </div>

            {/* Search bar */}
            <div
              style={{
                position: 'relative',
                marginBottom: 16,
              }}
            >
              <Search
                size={18}
                color={C.textSecondary}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder={L.search}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: 10,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 14,
                  color: C.text,
                  backgroundColor: C.card,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>

            {filteredTransactions.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={48} color={C.primaryLight} />}
                title={L.noTransactions}
                description={L.noTransactionsDesc}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: rv(8, 10, 10) }}>
                {filteredTransactions.map((tx, idx) => {
                  const conf = TX_TYPE_CONFIG[tx.type]
                  const isPositive = tx.points > 0
                  return (
                    <div
                      key={tx.id}
                      style={{
                        backgroundColor: C.card,
                        borderRadius: 12,
                        padding: rv('14px 16px', '16px 20px', '16px 22px'),
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        border: `1px solid ${C.border}`,
                        display: 'flex',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexDirection: isMobile ? 'column' : 'row',
                        animation: `fadeInUp 0.25s ease-out ${idx * 0.03}s both`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        {/* Type badge */}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 6,
                            backgroundColor: conf.bg,
                            color: conf.color,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            flexShrink: 0,
                          }}
                        >
                          {conf.label}
                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: C.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tx.customer_name}
                          </div>
                          {tx.description && (
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
                              {tx.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: rv(12, 20, 24),
                          flexShrink: 0,
                          width: isMobile ? '100%' : 'auto',
                          justifyContent: isMobile ? 'space-between' : 'flex-end',
                        }}
                      >
                        {/* Points */}
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: isPositive ? C.success : C.danger,
                          }}
                        >
                          {isPositive ? '+' : ''}{tx.points.toLocaleString()} {L.points}
                        </div>

                        {/* Balance after */}
                        <div
                          style={{
                            fontSize: 13,
                            color: C.textSecondary,
                            backgroundColor: C.grayBg,
                            padding: '4px 10px',
                            borderRadius: 6,
                          }}
                        >
                          = {tx.balance_after.toLocaleString()}
                        </div>

                        {/* Date */}
                        <div style={{ fontSize: 12, color: C.gray, minWidth: 80, textAlign: 'right' }}>
                          {formatDateTime(tx.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Configuration Tab ──────────────────────────────────────── */}
        {!loading && activeTab === 'configuration' && (
          <div
            style={{
              backgroundColor: C.card,
              borderRadius: 14,
              padding: rv('20px', '28px', '32px'),
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: `1px solid ${C.border}`,
              maxWidth: 640,
            }}
          >
            <h3 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: C.text }}>
              <Settings size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              {L.configuration}
            </h3>

            {/* Points per unit */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                  marginBottom: 6,
                }}
              >
                {L.pointsPerUnit}
              </label>
              <input
                type="number"
                min={0}
                value={config.points_per_unit}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, points_per_unit: Number(e.target.value) || 0 }))
                }
                style={inputStyle()}
              />
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                How many points a customer earns per 1 {currency} spent.
              </div>
            </div>

            {/* Currency per point */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                  marginBottom: 6,
                }}
              >
                {L.currencyPerPoint}
              </label>
              <input
                type="number"
                min={0}
                value={config.currency_per_point}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, currency_per_point: Number(e.target.value) || 0 }))
                }
                style={inputStyle()}
              />
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                Value in {currency} of 1 loyalty point when redeemed.
              </div>
            </div>

            {/* Tier thresholds */}
            <h4
              style={{
                margin: '0 0 16px',
                fontSize: 15,
                fontWeight: 700,
                color: C.text,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Award size={16} color={C.primary} />
              {L.tierThresholds}
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
                gap: 12,
                marginBottom: 28,
              }}
            >
              <TierInput
                label="Bronze"
                color="#cd7f32"
                bg="#fdf2e9"
                value={config.tier_bronze}
                onChange={(v) => setConfig((c) => ({ ...c, tier_bronze: v }))}
              />
              <TierInput
                label="Silver"
                color="#94a3b8"
                bg="#f1f5f9"
                value={config.tier_silver}
                onChange={(v) => setConfig((c) => ({ ...c, tier_silver: v }))}
              />
              <TierInput
                label="Gold"
                color="#d97706"
                bg="#fef3c7"
                value={config.tier_gold}
                onChange={(v) => setConfig((c) => ({ ...c, tier_gold: v }))}
              />
              <TierInput
                label="Platinum"
                color="#6366f1"
                bg="#e0e7ff"
                value={config.tier_platinum}
                onChange={(v) => setConfig((c) => ({ ...c, tier_platinum: v }))}
              />
            </div>

            {/* Save button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={handleSaveConfig}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  backgroundColor: C.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryDark }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
              >
                <Save size={16} />
                {L.save}
              </button>
              {configSaved && (
                <span style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>
                  {L.configSaved}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Reward Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingId(null) }}
        title={editingId ? L.editReward : L.addReward}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>{L.name} *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. 10% Birthday Discount"
              style={inputStyle()}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>{L.description}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description..."
              rows={3}
              style={{
                ...inputStyle(),
                resize: 'vertical' as const,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Points required */}
          <div>
            <label style={labelStyle}>{L.pointsRequired} *</label>
            <input
              type="number"
              min={1}
              value={form.points_required || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, points_required: Number(e.target.value) || 0 }))
              }
              placeholder="e.g. 500"
              style={inputStyle()}
            />
          </div>

          {/* Reward type */}
          <div>
            <label style={labelStyle}>{L.rewardType}</label>
            <select
              value={form.reward_type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  reward_type: e.target.value as LoyaltyRewardType,
                }))
              }
              style={inputStyle()}
            >
              <option value="discount_pct">Discount % (percentage off)</option>
              <option value="discount_fixed">Fixed Discount (fixed amount off)</option>
              <option value="free_product">Free Product</option>
              <option value="voucher">Voucher (store credit)</option>
            </select>
          </div>

          {/* Reward value */}
          <div>
            <label style={labelStyle}>
              {L.rewardValue}{' '}
              {form.reward_type === 'discount_pct' ? '(%)' : `(${currency})`}
            </label>
            <input
              type="number"
              min={0}
              value={form.reward_value || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, reward_value: Number(e.target.value) || 0 }))
              }
              placeholder={form.reward_type === 'discount_pct' ? 'e.g. 10' : 'e.g. 5000'}
              style={inputStyle()}
            />
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              style={{
                width: 48,
                height: 26,
                borderRadius: 13,
                border: 'none',
                backgroundColor: form.is_active ? C.primary : C.border,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  top: 3,
                  left: form.is_active ? 25 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
              {form.is_active ? L.active : L.inactive}
            </span>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              borderTop: `1px solid ${C.border}`,
              paddingTop: 16,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={() => { setShowAddModal(false); setEditingId(null) }}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: `1.5px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.textSecondary,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.textSecondary }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border }}
            >
              {L.cancel}
            </button>
            <button
              type="button"
              onClick={handleSaveReward}
              disabled={saving || !form.name.trim() || form.points_required <= 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                backgroundColor:
                  saving || !form.name.trim() || form.points_required <= 0
                    ? C.border
                    : C.primary,
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                cursor:
                  saving || !form.name.trim() || form.points_required <= 0
                    ? 'not-allowed'
                    : 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!saving && form.name.trim() && form.points_required > 0) {
                  e.currentTarget.style.backgroundColor = C.primaryDark
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && form.name.trim() && form.points_required > 0) {
                  e.currentTarget.style.backgroundColor = C.primary
                }
              }}
            >
              {saving ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Save size={16} />
              )}
              {L.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ────────────────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteId(null) }}
        title={L.deleteReward}
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: C.dangerBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} color={C.danger} />
            </div>
            <p style={{ margin: 0, fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>
              {L.deleteConfirm}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setShowDeleteModal(false); setDeleteId(null) }}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: `1.5px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.textSecondary,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {L.cancel}
            </button>
            <button
              type="button"
              onClick={handleDeleteReward}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: saving ? C.border : C.danger,
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {saving ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Trash2 size={16} />
              )}
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bg: string
}) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: '16px 18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          backgroundColor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#1e293b',
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#64748b',
            fontWeight: 500,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}

function IconButton({
  icon,
  color,
  bg,
  onClick,
}: {
  icon: React.ReactNode
  color: string
  bg: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: 'none',
        backgroundColor: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {icon}
    </button>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: '#64748b' }}>{description}</div>
    </div>
  )
}

function TierInput({
  label,
  color,
  bg,
  value,
  onChange,
}: {
  label: string
  color: string
  bg: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        backgroundColor: bg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <Award size={16} color={color} />
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{label}</span>
      </div>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: `1.5px solid ${color}33`,
          fontSize: 14,
          fontWeight: 600,
          color: '#1e293b',
          backgroundColor: '#ffffff',
          outline: 'none',
          boxSizing: 'border-box' as const,
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = color }}
        onBlur={(e) => { e.currentTarget.style.borderColor = `${color}33` }}
      />
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
        Minimum points to reach this tier
      </div>
    </div>
  )
}

// ── Shared styles ───────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: '#1e293b',
  marginBottom: 6,
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #e2e8f0',
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }
}
