import React, { useState, useEffect, useMemo } from 'react'
import {
  Megaphone,
  Plus,
  Search,
  Trash2,
  Edit,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  MessageSquare,
  Smartphone,
  Copy,
  Eye,
  BarChart3,
  Users,
  Target,
  Loader2,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useCampaignStore } from '../stores/campaignStore'
import { useResponsive } from '../hooks/useLayoutMode'
import type { Campaign, CampaignType, CampaignStatus, CampaignAudience } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#c026d3',
  primaryDark: '#a21caf',
  primaryLight: '#f0abfc',
  primaryBg: '#fdf4ff',
  primaryBgDeep: '#fae8ff',
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  // Status colors
  success: '#16a34a',
  successBg: '#dcfce7',
  info: '#2563eb',
  infoBg: '#dbeafe',
  warning: '#d97706',
  warningBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  grayBg: '#f1f5f9',
  grayDark: '#475569',

  // Type colors
  smsColor: '#2563eb',
  smsBg: '#dbeafe',
  emailColor: '#16a34a',
  emailBg: '#dcfce7',
  pushColor: '#ea580c',
  pushBg: '#fff7ed',
  whatsappColor: '#15803d',
  whatsappBg: '#dcfce7',
} as const

// ── Type configuration ──────────────────────────────────────────────────

const TYPE_CONFIG: Record<CampaignType, {
  label: string
  color: string
  bg: string
  Icon: typeof Mail
}> = {
  email:    { label: 'Email',    color: C.emailColor,    bg: C.emailBg,    Icon: Mail },
  sms:      { label: 'SMS',      color: C.smsColor,      bg: C.smsBg,      Icon: MessageSquare },
  push:     { label: 'Push',     color: C.pushColor,     bg: C.pushBg,     Icon: Smartphone },
  whatsapp: { label: 'WhatsApp', color: C.whatsappColor, bg: C.whatsappBg, Icon: MessageSquare },
}

// ── Status configuration ────────────────────────────────────────────────

const STATUS_CONFIG: Record<CampaignStatus, {
  label: string
  color: string
  bg: string
  Icon: typeof Clock
}> = {
  draft:     { label: 'Draft',     color: C.grayDark, bg: C.grayBg,    Icon: Edit },
  scheduled: { label: 'Scheduled', color: C.info,     bg: C.infoBg,    Icon: Clock },
  sending:   { label: 'Sending',   color: C.warning,  bg: C.warningBg, Icon: Send },
  sent:      { label: 'Sent',      color: C.success,  bg: C.successBg, Icon: CheckCircle },
  failed:    { label: 'Failed',    color: C.danger,   bg: C.dangerBg,  Icon: XCircle },
  cancelled: { label: 'Cancelled', color: C.grayDark, bg: C.grayBg,    Icon: XCircle },
}

// ── Audience labels ─────────────────────────────────────────────────────

const AUDIENCE_LABELS: Record<CampaignAudience, string> = {
  all_customers: 'All Customers',
  vip: 'VIP Customers',
  inactive: 'Inactive Customers',
  birthday: 'Birthday This Month',
  loyalty_tier: 'Loyalty Tier',
  custom: 'Custom Segment',
}

// ── Form state ──────────────────────────────────────────────────────────

interface CampaignForm {
  name: string
  type: CampaignType
  audience: CampaignAudience
  subject: string
  message: string
  scheduled_at: string
  promotion_id: string
  notes: string
}

const emptyForm: CampaignForm = {
  name: '',
  type: 'email',
  audience: 'all_customers',
  subject: '',
  message: '',
  scheduled_at: '',
  promotion_id: '',
  notes: '',
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function calcRate(numerator: number, denominator: number): string {
  if (denominator === 0) return '0%'
  return ((numerator / denominator) * 100).toFixed(1) + '%'
}

// ── Component ───────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    campaigns,
    loading,
    filterType,
    filterStatus,
    loadCampaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    scheduleCampaign,
    cancelCampaign,
    duplicateCampaign,
    setFilterType,
    setFilterStatus,
  } = useCampaignStore()

  const ct = (t as Record<string, any>).campaigns || {}
  const tCommon = (t as Record<string, any>).common || {}

  const storeId = currentStore?.id || 'default-store'

  // ── Local state ─────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null)
  const [schedulingCampaign, setSchedulingCampaign] = useState<Campaign | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [form, setForm] = useState<CampaignForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Load campaigns on mount ─────────────────────────────────────────

  useEffect(() => {
    loadCampaigns(storeId)
  }, [storeId, loadCampaigns])

  // ── Filtered campaigns ──────────────────────────────────────────────

  const filteredCampaigns = useMemo(() => {
    let list = [...campaigns]

    if (filterType !== 'all') {
      list = list.filter((c) => c.type === filterType)
    }

    if (filterStatus !== 'all') {
      list = list.filter((c) => c.status === filterStatus)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.message.toLowerCase().includes(q) ||
          (c.subject && c.subject.toLowerCase().includes(q))
      )
    }

    return list
  }, [campaigns, filterType, filterStatus, searchQuery])

  // ── Stats computation ───────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = campaigns.length
    const now = new Date()
    const thisMonth = campaigns.filter((c) => {
      if (c.status !== 'sent' || !c.sent_at) return false
      const sentDate = new Date(c.sent_at)
      return (
        sentDate.getMonth() === now.getMonth() &&
        sentDate.getFullYear() === now.getFullYear()
      )
    })
    const sentThisMonth = thisMonth.length

    const sentCampaigns = campaigns.filter((c) => c.status === 'sent' && c.recipients_count > 0)
    const avgOpenRate =
      sentCampaigns.length > 0
        ? sentCampaigns.reduce((sum, c) => sum + (c.opened_count / c.recipients_count) * 100, 0) /
          sentCampaigns.length
        : 0
    const avgClickRate =
      sentCampaigns.length > 0
        ? sentCampaigns.reduce((sum, c) => sum + (c.clicked_count / c.recipients_count) * 100, 0) /
          sentCampaigns.length
        : 0

    return { total, sentThisMonth, avgOpenRate, avgClickRate }
  }, [campaigns])

  // ── Translation helper ──────────────────────────────────────────────

  const tx = (key: string, fallback: string): string => {
    if (ct && typeof ct === 'object' && typeof ct[key] === 'string') return ct[key]
    return fallback
  }
  const tc = (key: string, fallback: string): string => {
    if (tCommon && typeof tCommon === 'object' && typeof tCommon[key] === 'string') return tCommon[key]
    return fallback
  }

  // ── Modal actions ───────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingCampaign(null)
    setForm(emptyForm)
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setForm({
      name: campaign.name,
      type: campaign.type,
      audience: campaign.audience,
      subject: campaign.subject || '',
      message: campaign.message,
      scheduled_at: campaign.scheduled_at || '',
      promotion_id: campaign.promotion_id || '',
      notes: campaign.notes || '',
    })
    setFormError('')
    setShowCreateModal(true)
  }

  const openPreviewModal = (campaign: Campaign) => {
    setPreviewCampaign(campaign)
    setShowPreviewModal(true)
  }

  const openDeleteModal = (campaign: Campaign) => {
    setDeletingCampaign(campaign)
    setShowDeleteModal(true)
  }

  const openScheduleModal = (campaign: Campaign) => {
    setSchedulingCampaign(campaign)
    setScheduleDate(campaign.scheduled_at || '')
    setShowScheduleModal(true)
  }

  // ── Save handler ────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(tx('nameRequired', 'Campaign name is required'))
      return
    }
    if (!form.message.trim()) {
      setFormError(tx('messageRequired', 'Message content is required'))
      return
    }
    if (form.type === 'email' && !form.subject.trim()) {
      setFormError(tx('subjectRequired', 'Email subject is required'))
      return
    }

    setSaving(true)
    setFormError('')

    try {
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, {
          name: form.name.trim(),
          type: form.type,
          audience: form.audience,
          subject: form.subject.trim() || undefined,
          message: form.message.trim(),
          scheduled_at: form.scheduled_at || undefined,
          promotion_id: form.promotion_id || undefined,
          notes: form.notes.trim() || undefined,
        })
      } else {
        await addCampaign(storeId, {
          name: form.name.trim(),
          type: form.type,
          audience: form.audience,
          subject: form.subject.trim() || undefined,
          message: form.message.trim(),
          scheduled_at: form.scheduled_at || undefined,
          promotion_id: form.promotion_id || undefined,
          notes: form.notes.trim() || undefined,
          status: 'draft',
          recipients_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          failed_count: 0,
        })
      }
      setShowCreateModal(false)
      setForm(emptyForm)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Action handlers ─────────────────────────────────────────────────

  const handleSendNow = async (campaign: Campaign) => {
    try {
      await sendCampaign(campaign.id)
    } catch (err) {
      console.error('Send campaign error:', err)
    }
  }

  const handleSchedule = async () => {
    if (!schedulingCampaign || !scheduleDate) return
    try {
      await scheduleCampaign(schedulingCampaign.id, scheduleDate)
      setShowScheduleModal(false)
      setSchedulingCampaign(null)
    } catch (err) {
      console.error('Schedule campaign error:', err)
    }
  }

  const handleDuplicate = async (campaign: Campaign) => {
    try {
      await duplicateCampaign(storeId, campaign.id)
    } catch (err) {
      console.error('Duplicate campaign error:', err)
    }
  }

  const handleDelete = async () => {
    if (!deletingCampaign) return
    try {
      await deleteCampaign(deletingCampaign.id)
      setShowDeleteModal(false)
      setDeletingCampaign(null)
    } catch (err) {
      console.error('Delete campaign error:', err)
    }
  }

  const handleCancel = async (campaign: Campaign) => {
    try {
      await cancelCampaign(campaign.id)
    } catch (err) {
      console.error('Cancel campaign error:', err)
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(12, 20, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? 12 : 0,
    marginBottom: 20,
  }

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 22, 24),
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const createBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(192, 38, 211, 0.3)',
  }

  // ── Stats card styles ───────────────────────────────────────────────

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
    gap: rv(10, 14, 16),
    marginBottom: 20,
  }

  const statCardStyle = (accent: string, _accentBg: string): React.CSSProperties => ({
    backgroundColor: C.card,
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    padding: rv(14, 16, 18),
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    borderLeft: `4px solid ${accent}`,
  })

  const statIconBoxStyle = (accentBg: string): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: accentBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  })

  const statValueStyle: React.CSSProperties = {
    fontSize: rv(18, 20, 22),
    fontWeight: 800,
    color: C.text,
    lineHeight: 1.2,
  }

  const statLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: 500,
    marginTop: 2,
  }

  // ── Filter bar styles ───────────────────────────────────────────────

  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: 10,
    marginBottom: 20,
    alignItems: isMobile ? 'stretch' : 'center',
  }

  const searchBoxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '8px 14px',
    flex: isMobile ? undefined : 1,
    maxWidth: isMobile ? undefined : 320,
  }

  const searchInputStyle: React.CSSProperties = {
    border: 'none',
    outline: 'none',
    fontSize: 14,
    color: C.text,
    backgroundColor: 'transparent',
    flex: 1,
    width: '100%',
  }

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    backgroundColor: C.card,
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    cursor: 'pointer',
    outline: 'none',
    minWidth: 120,
  }

  // ── Campaign card styles ────────────────────────────────────────────

  const campaignCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    padding: rv(14, 18, 20),
    marginBottom: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s, transform 0.15s',
  }

  const typeBadgeStyle = (type: CampaignType): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    color: TYPE_CONFIG[type].color,
    backgroundColor: TYPE_CONFIG[type].bg,
  })

  const statusBadgeStyle = (status: CampaignStatus): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color: STATUS_CONFIG[status].color,
    backgroundColor: STATUS_CONFIG[status].bg,
  })

  const metricItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  }

  const metricValueStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: C.text,
  }

  const metricLabelStyle: React.CSSProperties = {
    fontSize: 10,
    color: C.textSecondary,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  }

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color,
    padding: 6,
    borderRadius: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s',
  })

  // ── Performance bar styles ──────────────────────────────────────────

  const perfBarContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: rv(10, 16, 20),
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${C.borderLight}`,
    flexWrap: 'wrap',
  }

  const perfBarItemStyle: React.CSSProperties = {
    flex: 1,
    minWidth: rv(80, 100, 120),
  }

  const perfBarLabelStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: C.textSecondary,
    marginBottom: 4,
    fontWeight: 500,
  }

  const perfBarTrackStyle: React.CSSProperties = {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.grayBg,
    overflow: 'hidden',
  }

  const perfBarFillStyle = (pct: number, color: string): React.CSSProperties => ({
    height: '100%',
    borderRadius: 3,
    backgroundColor: color,
    width: `${Math.min(pct, 100)}%`,
    transition: 'width 0.5s ease-out',
  })

  // ── Form styles ─────────────────────────────────────────────────────

  const formFieldStyle: React.CSSProperties = { marginBottom: 16 }

  const formLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    marginBottom: 6,
  }

  const formInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const formTextareaStyle: React.CSSProperties = {
    ...formInputStyle,
    minHeight: 120,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  }

  const formSelectStyle: React.CSSProperties = {
    ...formInputStyle,
    cursor: 'pointer',
    backgroundColor: C.card,
  }

  const formRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: 12,
  }

  const formErrorStyle: React.CSSProperties = {
    backgroundColor: C.dangerBg,
    color: C.danger,
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 12,
  }

  const formBtnRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  }

  const cancelBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    backgroundColor: '#ffffff',
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  }

  const saveBtnStyle: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: saving ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    opacity: saving ? 0.7 : 1,
  }

  const deleteBtnStyle: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: C.danger,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  }

  // ── Preview modal styles ────────────────────────────────────────────

  const previewContainerStyle: React.CSSProperties = {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }

  const previewPhoneStyle: React.CSSProperties = {
    width: 280,
    backgroundColor: C.card,
    borderRadius: 24,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    border: '8px solid #1e293b',
  }

  const previewHeaderStyle: React.CSSProperties = {
    backgroundColor: C.primary,
    color: '#ffffff',
    padding: '14px 16px',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const previewBodyStyle: React.CSSProperties = {
    padding: 16,
    fontSize: 13,
    color: C.text,
    lineHeight: 1.6,
    minHeight: 200,
  }

  // ── Loading state ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          ...pageStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Loader2
            size={32}
            color={C.primary}
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 12 }}>
            {tc('loading', 'Loading...')}
          </p>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={headerStyle}>
        <div style={titleRowStyle}>
          <Megaphone size={rv(22, 24, 26)} color={C.primary} />
          <h1 style={titleStyle}>{tx('title', 'Marketing Campaigns')}</h1>
        </div>
        <button style={createBtnStyle} onClick={openCreateModal}>
          <Plus size={16} /> {tx('createCampaign', 'New Campaign')}
        </button>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div style={statsGridStyle}>
        {/* Total Campaigns */}
        <div style={statCardStyle(C.primary, C.primaryBg)}>
          <div style={statIconBoxStyle(C.primaryBgDeep)}>
            <Megaphone size={20} color={C.primary} />
          </div>
          <div>
            <div style={statValueStyle}>{stats.total}</div>
            <div style={statLabelStyle}>{tx('totalCampaigns', 'Total Campaigns')}</div>
          </div>
        </div>

        {/* Sent This Month */}
        <div style={statCardStyle(C.success, C.successBg)}>
          <div style={statIconBoxStyle(C.successBg)}>
            <Send size={20} color={C.success} />
          </div>
          <div>
            <div style={statValueStyle}>{stats.sentThisMonth}</div>
            <div style={statLabelStyle}>{tx('sentThisMonth', 'Sent This Month')}</div>
          </div>
        </div>

        {/* Avg Open Rate */}
        <div style={statCardStyle(C.info, C.infoBg)}>
          <div style={statIconBoxStyle(C.infoBg)}>
            <Eye size={20} color={C.info} />
          </div>
          <div>
            <div style={statValueStyle}>{stats.avgOpenRate.toFixed(1)}%</div>
            <div style={statLabelStyle}>{tx('avgOpenRate', 'Avg Open Rate')}</div>
          </div>
        </div>

        {/* Avg Click Rate */}
        <div style={statCardStyle(C.warning, C.warningBg)}>
          <div style={statIconBoxStyle(C.warningBg)}>
            <Target size={20} color={C.warning} />
          </div>
          <div>
            <div style={statValueStyle}>{stats.avgClickRate.toFixed(1)}%</div>
            <div style={statLabelStyle}>{tx('avgClickRate', 'Avg Click Rate')}</div>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ────────────────────────────────────────────────── */}
      <div style={filterBarStyle}>
        <div style={searchBoxStyle}>
          <Search size={16} color={C.textMuted} />
          <input
            style={searchInputStyle}
            type="text"
            placeholder={tx('searchPlaceholder', 'Search campaigns...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          style={selectStyle}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as CampaignType | 'all')}
        >
          <option value="all">{tx('allTypes', 'All Types')}</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="push">Push</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <select
          style={selectStyle}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as CampaignStatus | 'all')}
        >
          <option value="all">{tx('allStatuses', 'All Statuses')}</option>
          <option value="draft">{tx('draft', 'Draft')}</option>
          <option value="scheduled">{tx('scheduled', 'Scheduled')}</option>
          <option value="sending">{tx('sending', 'Sending')}</option>
          <option value="sent">{tx('sent', 'Sent')}</option>
          <option value="failed">{tx('failed', 'Failed')}</option>
          <option value="cancelled">{tx('cancelled', 'Cancelled')}</option>
        </select>
      </div>

      {/* ── Campaign List ──────────────────────────────────────────────── */}
      {filteredCampaigns.length === 0 ? (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            backgroundColor: C.card,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
          }}
        >
          <Megaphone
            size={48}
            color={C.primaryLight}
            style={{ marginBottom: 12 }}
          />
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: C.text,
              margin: '0 0 6px',
            }}
          >
            {campaigns.length === 0
              ? tx('noCampaigns', 'No campaigns yet')
              : tx('noResults', 'No campaigns match your filters')}
          </p>
          <p
            style={{
              fontSize: 13,
              color: C.textSecondary,
              margin: 0,
            }}
          >
            {campaigns.length === 0
              ? tx('createFirst', 'Create your first campaign to reach your customers')
              : tx('adjustFilters', 'Try adjusting the type or status filters')}
          </p>
        </div>
      ) : (
        filteredCampaigns.map((campaign) => {
          const typeConf = TYPE_CONFIG[campaign.type]
          const statusConf = STATUS_CONFIG[campaign.status]
          const TypeIcon = typeConf.Icon
          const StatusIcon = statusConf.Icon
          const isSent = campaign.status === 'sent'
          const isDraft = campaign.status === 'draft'
          const isScheduled = campaign.status === 'scheduled'

          const deliveryRate =
            campaign.recipients_count > 0
              ? (campaign.delivered_count / campaign.recipients_count) * 100
              : 0
          const openRate =
            campaign.recipients_count > 0
              ? (campaign.opened_count / campaign.recipients_count) * 100
              : 0
          const clickRate =
            campaign.recipients_count > 0
              ? (campaign.clicked_count / campaign.recipients_count) * 100
              : 0

          return (
            <div
              key={campaign.id}
              style={campaignCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(192, 38, 211, 0.1)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* ── Top row: name, badges, actions ──────────────────────── */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  gap: isMobile ? 12 : 16,
                }}
              >
                {/* Left: Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Row 1: Name + Badges */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: rv(15, 16, 16),
                        fontWeight: 700,
                        color: C.text,
                      }}
                    >
                      {campaign.name}
                    </span>
                    <span style={typeBadgeStyle(campaign.type)}>
                      <TypeIcon size={12} />
                      {typeConf.label}
                    </span>
                    <span style={statusBadgeStyle(campaign.status)}>
                      <StatusIcon size={12} />
                      {statusConf.label}
                    </span>
                  </div>

                  {/* Row 2: Audience + Date */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      flexWrap: 'wrap',
                      fontSize: 13,
                      color: C.textSecondary,
                      marginBottom: isSent ? 0 : 0,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Users size={13} color={C.textMuted} />
                      {AUDIENCE_LABELS[campaign.audience] ||
                        campaign.audience}
                    </span>

                    {campaign.sent_at && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <CheckCircle size={13} color={C.success} />
                        {tx('sentOn', 'Sent')} {formatDateTime(campaign.sent_at)}
                      </span>
                    )}

                    {campaign.scheduled_at && campaign.status === 'scheduled' && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Clock size={13} color={C.info} />
                        {tx('scheduledFor', 'Scheduled')} {formatDateTime(campaign.scheduled_at)}
                      </span>
                    )}

                    {!campaign.sent_at && !campaign.scheduled_at && (
                      <span>
                        {tx('created', 'Created')} {formatDate(campaign.created_at)}
                      </span>
                    )}
                  </div>

                  {/* Row 3: Metrics (for sent campaigns) */}
                  {isSent && campaign.recipients_count > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: rv(12, 20, 24),
                        marginTop: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={metricItemStyle}>
                        <span style={metricValueStyle}>
                          {campaign.recipients_count.toLocaleString()}
                        </span>
                        <span style={metricLabelStyle}>{tx('recipients', 'Recipients')}</span>
                      </div>
                      <div style={metricItemStyle}>
                        <span style={metricValueStyle}>
                          {campaign.delivered_count.toLocaleString()}
                        </span>
                        <span style={metricLabelStyle}>{tx('delivered', 'Delivered')}</span>
                      </div>
                      <div style={metricItemStyle}>
                        <span style={metricValueStyle}>
                          {campaign.opened_count.toLocaleString()}
                        </span>
                        <span style={metricLabelStyle}>{tx('opened', 'Opened')}</span>
                      </div>
                      <div style={metricItemStyle}>
                        <span style={metricValueStyle}>
                          {campaign.clicked_count.toLocaleString()}
                        </span>
                        <span style={metricLabelStyle}>{tx('clicked', 'Clicked')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    alignItems: isMobile ? 'center' : 'flex-end',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {/* Preview */}
                    <button
                      style={actionBtnStyle(C.primary)}
                      onClick={() => openPreviewModal(campaign)}
                      title={tx('preview', 'Preview')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.primaryBg
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Eye size={16} />
                    </button>

                    {/* Edit (only for draft/scheduled) */}
                    {(isDraft || isScheduled) && (
                      <button
                        style={actionBtnStyle(C.info)}
                        onClick={() => openEditModal(campaign)}
                        title={tc('edit', 'Edit')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = C.infoBg
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <Edit size={16} />
                      </button>
                    )}

                    {/* Send Now (only for draft) */}
                    {isDraft && (
                      <button
                        style={actionBtnStyle(C.success)}
                        onClick={() => handleSendNow(campaign)}
                        title={tx('sendNow', 'Send Now')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = C.successBg
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <Send size={16} />
                      </button>
                    )}

                    {/* Schedule (only for draft) */}
                    {isDraft && (
                      <button
                        style={actionBtnStyle(C.info)}
                        onClick={() => openScheduleModal(campaign)}
                        title={tx('schedule', 'Schedule')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = C.infoBg
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <Clock size={16} />
                      </button>
                    )}

                    {/* Cancel (only for scheduled) */}
                    {isScheduled && (
                      <button
                        style={actionBtnStyle(C.warning)}
                        onClick={() => handleCancel(campaign)}
                        title={tx('cancelCampaign', 'Cancel')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = C.warningBg
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <XCircle size={16} />
                      </button>
                    )}

                    {/* Duplicate */}
                    <button
                      style={actionBtnStyle(C.textSecondary)}
                      onClick={() => handleDuplicate(campaign)}
                      title={tx('duplicate', 'Duplicate')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = C.grayBg
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Copy size={16} />
                    </button>

                    {/* Delete (only for draft/cancelled/failed) */}
                    {(isDraft || campaign.status === 'cancelled' || campaign.status === 'failed') && (
                      <button
                        style={actionBtnStyle(C.danger)}
                        onClick={() => openDeleteModal(campaign)}
                        title={tc('delete', 'Delete')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = C.dangerBg
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Stats badge for sent campaigns */}
                  {isSent && campaign.recipients_count > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 8,
                        backgroundColor: C.primaryBg,
                        fontSize: 11,
                        fontWeight: 600,
                        color: C.primary,
                        marginTop: isMobile ? 0 : 4,
                      }}
                    >
                      <BarChart3 size={12} />
                      {calcRate(campaign.opened_count, campaign.recipients_count)} {tx('openRate', 'open rate')}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Performance bars (for sent campaigns) ──────────────── */}
              {isSent && campaign.recipients_count > 0 && (
                <div style={perfBarContainerStyle}>
                  {/* Delivery Rate */}
                  <div style={perfBarItemStyle}>
                    <div style={perfBarLabelStyle}>
                      <span>{tx('deliveryRate', 'Delivery Rate')}</span>
                      <span style={{ fontWeight: 600 }}>
                        {calcRate(campaign.delivered_count, campaign.recipients_count)}
                      </span>
                    </div>
                    <div style={perfBarTrackStyle}>
                      <div style={perfBarFillStyle(deliveryRate, C.success)} />
                    </div>
                  </div>

                  {/* Open Rate */}
                  <div style={perfBarItemStyle}>
                    <div style={perfBarLabelStyle}>
                      <span>{tx('openRateLabel', 'Open Rate')}</span>
                      <span style={{ fontWeight: 600 }}>
                        {calcRate(campaign.opened_count, campaign.recipients_count)}
                      </span>
                    </div>
                    <div style={perfBarTrackStyle}>
                      <div style={perfBarFillStyle(openRate, C.info)} />
                    </div>
                  </div>

                  {/* Click Rate */}
                  <div style={perfBarItemStyle}>
                    <div style={perfBarLabelStyle}>
                      <span>{tx('clickRateLabel', 'Click Rate')}</span>
                      <span style={{ fontWeight: 600 }}>
                        {calcRate(campaign.clicked_count, campaign.recipients_count)}
                      </span>
                    </div>
                    <div style={perfBarTrackStyle}>
                      <div style={perfBarFillStyle(clickRate, C.warning)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {/* ── Create/Edit Campaign Modal ─────────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={
          editingCampaign
            ? tx('editCampaign', 'Edit Campaign')
            : tx('createCampaign', 'New Campaign')
        }
        size="lg"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        {/* Name */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tx('campaignName', 'Campaign Name')} *</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder={tx('campaignNamePlaceholder', 'e.g. Spring Sale Announcement')}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            onFocus={(e) => { e.target.style.borderColor = C.primary }}
            onBlur={(e) => { e.target.style.borderColor = C.border }}
            autoFocus
          />
        </div>

        {/* Type + Audience */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tx('type', 'Type')} *</label>
            <select
              style={formSelectStyle}
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value as CampaignType }))
              }
              onFocus={(e) => { e.target.style.borderColor = C.primary }}
              onBlur={(e) => { e.target.style.borderColor = C.border }}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push Notification</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tx('audience', 'Audience')} *</label>
            <select
              style={formSelectStyle}
              value={form.audience}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  audience: e.target.value as CampaignAudience,
                }))
              }
              onFocus={(e) => { e.target.style.borderColor = C.primary }}
              onBlur={(e) => { e.target.style.borderColor = C.border }}
            >
              <option value="all_customers">{tx('allCustomers', 'All Customers')}</option>
              <option value="vip">{tx('vipCustomers', 'VIP Customers')}</option>
              <option value="inactive">{tx('inactiveCustomers', 'Inactive Customers')}</option>
              <option value="birthday">{tx('birthdayThisMonth', 'Birthday This Month')}</option>
              <option value="loyalty_tier">{tx('loyaltyTier', 'Loyalty Tier')}</option>
              <option value="custom">{tx('customSegment', 'Custom Segment')}</option>
            </select>
          </div>
        </div>

        {/* Subject (for email) */}
        {form.type === 'email' && (
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tx('subject', 'Subject')} *</label>
            <input
              style={formInputStyle}
              type="text"
              placeholder={tx('subjectPlaceholder', 'e.g. Exclusive offer just for you!')}
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              onFocus={(e) => { e.target.style.borderColor = C.primary }}
              onBlur={(e) => { e.target.style.borderColor = C.border }}
            />
          </div>
        )}

        {/* Message */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tx('message', 'Message')} *</label>
          <textarea
            style={formTextareaStyle}
            placeholder={tx(
              'messagePlaceholder',
              'Write your campaign message here...'
            )}
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            onFocus={(e) => { e.target.style.borderColor = C.primary }}
            onBlur={(e) => { e.target.style.borderColor = C.border }}
          />
          <div
            style={{
              fontSize: 11,
              color: C.textMuted,
              textAlign: 'right' as const,
              marginTop: 4,
            }}
          >
            {form.message.length} {tx('characters', 'characters')}
            {form.type === 'sms' && (
              <span>
                {' '}
                ({Math.ceil(Math.max(form.message.length, 1) / 160)}{' '}
                {tx('smsSegments', 'SMS segment(s)')})
              </span>
            )}
          </div>
        </div>

        {/* Scheduled At */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>
            {tx('scheduledAt', 'Schedule Date & Time')} ({tx('optional', 'optional')})
          </label>
          <input
            style={formInputStyle}
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
            onFocus={(e) => { e.target.style.borderColor = C.primary }}
            onBlur={(e) => { e.target.style.borderColor = C.border }}
          />
        </div>

        {/* Linked Promotion */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>
            {tx('linkedPromotion', 'Linked Promotion')} ({tx('optional', 'optional')})
          </label>
          <input
            style={formInputStyle}
            type="text"
            placeholder={tx('promotionIdPlaceholder', 'Promotion ID (optional)')}
            value={form.promotion_id}
            onChange={(e) => setForm((prev) => ({ ...prev, promotion_id: e.target.value }))}
            onFocus={(e) => { e.target.style.borderColor = C.primary }}
            onBlur={(e) => { e.target.style.borderColor = C.border }}
          />
        </div>

        {/* Notes */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>
            {tx('notes', 'Notes')} ({tx('optional', 'optional')})
          </label>
          <textarea
            style={{ ...formTextareaStyle, minHeight: 60 }}
            placeholder={tx('notesPlaceholder', 'Internal notes about this campaign...')}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            onFocus={(e) => { e.target.style.borderColor = C.primary }}
            onBlur={(e) => { e.target.style.borderColor = C.border }}
          />
        </div>

        {/* Action buttons */}
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowCreateModal(false)}>
            {tc('cancel', 'Cancel')}
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving && (
              <Loader2
                size={16}
                style={{ animation: 'spin 1s linear infinite' }}
              />
            )}
            {saving
              ? tc('loading', 'Loading...')
              : editingCampaign
                ? tc('save', 'Save')
                : tx('create', 'Create')}
          </button>
        </div>
      </Modal>

      {/* ── Campaign Preview Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={tx('previewTitle', 'Campaign Preview')}
        size="md"
      >
        {previewCampaign && (
          <div>
            {/* Preview info */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              <span style={typeBadgeStyle(previewCampaign.type)}>
                {React.createElement(TYPE_CONFIG[previewCampaign.type].Icon, { size: 12 })}
                {TYPE_CONFIG[previewCampaign.type].label}
              </span>
              <span style={statusBadgeStyle(previewCampaign.status)}>
                {React.createElement(STATUS_CONFIG[previewCampaign.status].Icon, { size: 12 })}
                {STATUS_CONFIG[previewCampaign.status].label}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.textSecondary,
                  backgroundColor: C.grayBg,
                }}
              >
                <Users size={12} />
                {AUDIENCE_LABELS[previewCampaign.audience]}
              </span>
            </div>

            {/* Phone preview */}
            <div style={previewContainerStyle}>
              <div style={previewPhoneStyle}>
                {/* Phone header */}
                <div style={previewHeaderStyle}>
                  {React.createElement(TYPE_CONFIG[previewCampaign.type].Icon, {
                    size: 14,
                    color: '#ffffff',
                  })}
                  <span>
                    {previewCampaign.type === 'email'
                      ? previewCampaign.subject || previewCampaign.name
                      : previewCampaign.name}
                  </span>
                </div>

                {/* Phone body */}
                <div style={previewBodyStyle}>
                  {previewCampaign.type === 'email' && previewCampaign.subject && (
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.text,
                        marginBottom: 12,
                        paddingBottom: 10,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {previewCampaign.subject}
                    </div>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {previewCampaign.message}
                  </div>
                </div>

                {/* Phone footer */}
                <div
                  style={{
                    padding: '10px 16px',
                    borderTop: `1px solid ${C.border}`,
                    fontSize: 10,
                    color: C.textMuted,
                    textAlign: 'center' as const,
                  }}
                >
                  {tx('previewFooter', 'Preview - Actual rendering may vary')}
                </div>
              </div>
            </div>

            {/* Campaign metadata */}
            {previewCampaign.notes && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: C.grayBg,
                  fontSize: 13,
                  color: C.textSecondary,
                }}
              >
                <strong style={{ color: C.text }}>{tx('notes', 'Notes')}:</strong>{' '}
                {previewCampaign.notes}
              </div>
            )}

            {/* Performance stats (for sent campaigns) */}
            {previewCampaign.status === 'sent' && previewCampaign.recipients_count > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: C.primaryBg,
                  border: `1px solid ${C.primaryLight}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.primary,
                  }}
                >
                  <BarChart3 size={16} />
                  {tx('performanceStats', 'Performance Stats')}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 2 }}>
                      {tx('recipients', 'Recipients')}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                      {previewCampaign.recipients_count.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 2 }}>
                      {tx('delivered', 'Delivered')}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.success }}>
                      {calcRate(previewCampaign.delivered_count, previewCampaign.recipients_count)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 2 }}>
                      {tx('opened', 'Opened')}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.info }}>
                      {calcRate(previewCampaign.opened_count, previewCampaign.recipients_count)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 2 }}>
                      {tx('clicked', 'Clicked')}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.warning }}>
                      {calcRate(previewCampaign.clicked_count, previewCampaign.recipients_count)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={tx('deleteCampaign', 'Delete Campaign')}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 8px' }}>
          {tx('deleteConfirm', 'Are you sure you want to delete this campaign?')}
        </p>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 4px' }}>
          <strong>{deletingCampaign?.name}</strong>
        </p>
        <p style={{ fontSize: 12, color: C.danger, margin: 0 }}>
          {tx('deleteWarning', 'This action cannot be undone.')}
        </p>
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowDeleteModal(false)}>
            {tc('cancel', 'Cancel')}
          </button>
          <button style={deleteBtnStyle} onClick={handleDelete}>
            {tc('delete', 'Delete')}
          </button>
        </div>
      </Modal>

      {/* ── Schedule Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title={tx('scheduleCampaign', 'Schedule Campaign')}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 12px' }}>
          {tx('scheduleMessage', 'Choose when to send this campaign:')}
        </p>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 12px' }}>
          {schedulingCampaign?.name}
        </p>
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tx('dateAndTime', 'Date & Time')} *</label>
          <input
            style={formInputStyle}
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            onFocus={(e) => { e.target.style.borderColor = C.primary }}
            onBlur={(e) => { e.target.style.borderColor = C.border }}
          />
        </div>
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowScheduleModal(false)}>
            {tc('cancel', 'Cancel')}
          </button>
          <button
            style={{
              ...saveBtnStyle,
              opacity: !scheduleDate ? 0.5 : 1,
              cursor: !scheduleDate ? 'not-allowed' : 'pointer',
            }}
            onClick={handleSchedule}
            disabled={!scheduleDate}
          >
            <Clock size={16} />
            {tx('scheduleBtn', 'Schedule')}
          </button>
        </div>
      </Modal>

      {/* ── CSS keyframes ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
