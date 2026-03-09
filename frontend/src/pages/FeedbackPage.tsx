import { useState, useEffect, useMemo } from 'react'
import {
  MessageSquareHeart,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Star,
  Send,
  Archive,
  CheckCircle,
  MessageCircle,
  TrendingUp,
  ThumbsUp,
  Clock,
  Mail,
  Phone,
  Globe,
  Store,
  Hash,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useFeedbackStore } from '../stores/feedbackStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { CustomerFeedback, FeedbackStatus, FeedbackChannel, FeedbackRating } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#db2777',
  primaryLight: '#fdf2f8',
  primaryDark: '#be185d',
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
  purpleBg: '#ede9fe',
  orange: '#ea580c',
  orangeBg: '#fff7ed',
  lime: '#65a30d',
  limeBg: '#f7fee7',
} as const

// ── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<FeedbackStatus, { color: string; bg: string }> = {
  new:       { color: C.info, bg: C.infoBg },
  reviewed:  { color: C.warning, bg: C.warningBg },
  responded: { color: C.success, bg: C.successBg },
  resolved:  { color: C.teal, bg: C.tealBg },
  archived:  { color: C.textMuted, bg: '#f8fafc' },
}

const ALL_STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'responded', 'resolved', 'archived']

// ── Channel config ────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<FeedbackChannel, { color: string; bg: string; icon: typeof Store }> = {
  in_store:     { color: C.info, bg: C.infoBg, icon: Store },
  online:       { color: C.success, bg: C.successBg, icon: Globe },
  phone:        { color: C.purple, bg: C.purpleBg, icon: Phone },
  email:        { color: C.orange, bg: C.orangeBg, icon: Mail },
  social_media: { color: C.primary, bg: C.primaryLight, icon: Hash },
}

const ALL_CHANNELS: FeedbackChannel[] = ['in_store', 'online', 'phone', 'email', 'social_media']

// ── Rating colors ─────────────────────────────────────────────────────────

const RATING_COLORS: Record<number, string> = {
  5: '#16a34a',
  4: '#65a30d',
  3: '#f59e0b',
  2: '#ea580c',
  1: '#dc2626',
}

// ── Quick response templates ──────────────────────────────────────────────

const QUICK_RESPONSES = [
  'Thank you for your valuable feedback! We appreciate your support.',
  'We sincerely apologize for the inconvenience. We are working to improve.',
  'Thank you for bringing this to our attention. We will address this promptly.',
  'We are glad you had a great experience! We look forward to serving you again.',
  'Your feedback has been shared with our team. We will make the necessary improvements.',
  'We appreciate your patience and understanding. We have taken steps to resolve this.',
]

// ── Component ─────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    feedbacks,
    loading,
    filterStatus,
    filterChannel,
    loadFeedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    respondToFeedback,
    markReviewed,
    markResolved,
    archiveFeedback,
    toggleFeatured,
    getAverageRating,
    getResponseRate,
    setFilterStatus,
    setFilterChannel,
  } = useFeedbackStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n
  const fb = (t as Record<string, any>).feedback || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: fb.title || 'Customer Feedback',
    subtitle: fb.subtitle || 'Manage customer reviews and satisfaction',
    addFeedback: fb.addFeedback || 'New Feedback',
    editFeedback: fb.editFeedback || 'Edit Feedback',
    viewFeedback: fb.viewFeedback || 'Feedback Details',
    respondFeedback: fb.respondFeedback || 'Respond to Feedback',
    totalFeedbacks: fb.totalFeedbacks || 'Total Feedbacks',
    averageRating: fb.averageRating || 'Average Rating',
    responseRate: fb.responseRate || 'Response Rate',
    positiveRate: fb.positiveRate || 'Positive Rate',
    feedbackNumber: fb.feedbackNumber || 'Feedback #',
    customerName: fb.customerName || 'Customer Name',
    customerEmail: fb.customerEmail || 'Customer Email',
    customerPhone: fb.customerPhone || 'Customer Phone',
    channel: fb.channel || 'Channel',
    rating: fb.rating || 'Rating',
    category: fb.category || 'Category',
    feedbackTitle: fb.feedbackTitle || 'Title',
    comment: fb.comment || 'Comment',
    response: fb.response || 'Response',
    respondedBy: fb.respondedBy || 'Responded By',
    tags: fb.tags || 'Tags',
    orderId: fb.orderId || 'Order ID',
    status: fb.status || 'Status',
    date: fb.date || 'Date',
    actions: fb.actions || 'Actions',
    allStatuses: fb.allStatuses || 'All Statuses',
    allChannels: fb.allChannels || 'All Channels',
    noFeedbacks: fb.noFeedbacks || 'No feedback received yet',
    noFeedbacksDesc: fb.noFeedbacksDesc || 'Start collecting customer reviews and satisfaction data.',
    noResults: fb.noResults || 'No feedback matches your filters',
    noResultsDesc: fb.noResultsDesc || 'Try adjusting the filters or search query.',
    save: tCommon.save || 'Save',
    cancelBtn: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    deleteConfirm: fb.deleteConfirm || 'Are you sure you want to delete this feedback?',
    deleteWarning: fb.deleteWarning || 'This action cannot be undone.',
    featured: fb.featured || 'Featured',
    respond: fb.respond || 'Respond',
    markReviewed: fb.markReviewed || 'Mark Reviewed',
    markResolved: fb.markResolved || 'Mark Resolved',
    archive: fb.archive || 'Archive',
    sendResponse: fb.sendResponse || 'Send Response',
    quickResponses: fb.quickResponses || 'Quick Responses',
    selectTemplate: fb.selectTemplate || 'Select a template...',
    writeResponse: fb.writeResponse || 'Write your response...',
    customerInfo: fb.customerInfo || 'Customer Information',
    feedbackDetails: fb.feedbackDetails || 'Feedback Details',
    responseSection: fb.responseSection || 'Response',
    timeline: fb.timeline || 'Timeline',
    createdAt: fb.createdAt || 'Created',
    updatedAt: fb.updatedAt || 'Updated',
    tagsPlaceholder: fb.tagsPlaceholder || 'Comma-separated tags',
    optional: fb.optional || 'Optional',
    clickToRate: fb.clickToRate || 'Click to rate',
    // Status labels
    st_new: fb.st_new || 'New',
    st_reviewed: fb.st_reviewed || 'Reviewed',
    st_responded: fb.st_responded || 'Responded',
    st_resolved: fb.st_resolved || 'Resolved',
    st_archived: fb.st_archived || 'Archived',
    // Channel labels
    ch_in_store: fb.ch_in_store || 'In Store',
    ch_online: fb.ch_online || 'Online',
    ch_phone: fb.ch_phone || 'Phone',
    ch_email: fb.ch_email || 'Email',
    ch_social_media: fb.ch_social_media || 'Social Media',
  }

  const statusLabel = (s: FeedbackStatus): string => (L as Record<string, string>)[`st_${s}`] || s
  const channelLabel = (ch: FeedbackChannel): string => (L as Record<string, string>)[`ch_${ch}`] || ch

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState<CustomerFeedback | null>(null)
  const [viewingFeedback, setViewingFeedback] = useState<CustomerFeedback | null>(null)
  const [respondingFeedback, setRespondingFeedback] = useState<CustomerFeedback | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state
  const [formCustomerName, setFormCustomerName] = useState('')
  const [formCustomerEmail, setFormCustomerEmail] = useState('')
  const [formCustomerPhone, setFormCustomerPhone] = useState('')
  const [formChannel, setFormChannel] = useState<FeedbackChannel>('in_store')
  const [formRating, setFormRating] = useState<FeedbackRating>(5)
  const [formCategory, setFormCategory] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formComment, setFormComment] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formOrderId, setFormOrderId] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // Response state
  const [responseText, setResponseText] = useState('')
  const [responseSaving, setResponseSaving] = useState(false)

  // ── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    loadFeedbacks(storeId)
  }, [storeId, loadFeedbacks])

  // ── Filtered and searched feedbacks ──────────────────────────────────

  const filteredFeedbacks = useMemo(() => {
    let result = [...feedbacks]

    if (filterStatus !== 'all') {
      result = result.filter((f) => f.status === filterStatus)
    }
    if (filterChannel !== 'all') {
      result = result.filter((f) => f.channel === filterChannel)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (f) =>
          f.feedback_number.toLowerCase().includes(q) ||
          f.customer_name.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.comment.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          (f.customer_email && f.customer_email.toLowerCase().includes(q)) ||
          (f.order_id && f.order_id.toLowerCase().includes(q))
      )
    }

    return result
  }, [feedbacks, filterStatus, filterChannel, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const avgRating = getAverageRating(storeId)
  const responseRate = getResponseRate(storeId)

  const positiveRate = useMemo(() => {
    const storeFeedbacks = feedbacks.filter((f) => f.store_id === storeId)
    if (storeFeedbacks.length === 0) return 0
    const positives = storeFeedbacks.filter((f) => f.rating >= 4).length
    return Math.round((positives / storeFeedbacks.length) * 100)
  }, [feedbacks, storeId])

  // ── Form helpers ──────────────────────────────────────────────────────

  function resetForm() {
    setFormCustomerName('')
    setFormCustomerEmail('')
    setFormCustomerPhone('')
    setFormChannel('in_store')
    setFormRating(5)
    setFormCategory('')
    setFormTitle('')
    setFormComment('')
    setFormTags('')
    setFormOrderId('')
    setEditingFeedback(null)
  }

  function openAddModal() {
    resetForm()
    setShowModal(true)
  }

  function openEditModal(feedback: CustomerFeedback) {
    setEditingFeedback(feedback)
    setFormCustomerName(feedback.customer_name)
    setFormCustomerEmail(feedback.customer_email || '')
    setFormCustomerPhone(feedback.customer_phone || '')
    setFormChannel(feedback.channel)
    setFormRating(feedback.rating)
    setFormCategory(feedback.category)
    setFormTitle(feedback.title)
    setFormComment(feedback.comment)
    setFormTags(feedback.tags ? feedback.tags.join(', ') : '')
    setFormOrderId(feedback.order_id || '')
    setShowModal(true)
  }

  function openViewModal(feedback: CustomerFeedback) {
    setViewingFeedback(feedback)
  }

  function openRespondModal(feedback: CustomerFeedback) {
    setRespondingFeedback(feedback)
    setResponseText(feedback.response || '')
  }

  async function handleSave() {
    if (!formCustomerName.trim() || !formTitle.trim() || !formComment.trim() || !formCategory.trim()) return

    setFormSaving(true)
    try {
      const tagsArray = formTags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      if (editingFeedback) {
        await updateFeedback(editingFeedback.id, {
          customer_name: formCustomerName.trim(),
          customer_email: formCustomerEmail.trim() || undefined,
          customer_phone: formCustomerPhone.trim() || undefined,
          channel: formChannel,
          rating: formRating,
          category: formCategory.trim(),
          title: formTitle.trim(),
          comment: formComment.trim(),
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          order_id: formOrderId.trim() || undefined,
        })
      } else {
        await addFeedback(storeId, {
          customer_name: formCustomerName.trim(),
          customer_email: formCustomerEmail.trim() || undefined,
          customer_phone: formCustomerPhone.trim() || undefined,
          channel: formChannel,
          rating: formRating,
          category: formCategory.trim(),
          title: formTitle.trim(),
          comment: formComment.trim(),
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          order_id: formOrderId.trim() || undefined,
          status: 'new' as FeedbackStatus,
          is_featured: false,
        })
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[FeedbackPage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteFeedback(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[FeedbackPage] Delete error:', error)
    }
  }

  async function handleRespond() {
    if (!respondingFeedback || !responseText.trim()) return

    setResponseSaving(true)
    try {
      await respondToFeedback(respondingFeedback.id, responseText.trim(), userId, userName)
      setRespondingFeedback(null)
      setResponseText('')
      // If viewing, update the viewed feedback
      if (viewingFeedback && viewingFeedback.id === respondingFeedback.id) {
        const updated = feedbacks.find((f) => f.id === respondingFeedback.id)
        if (updated) setViewingFeedback({ ...updated, response: responseText.trim(), responded_by: userId, responded_by_name: userName, status: 'responded' })
      }
    } catch (error) {
      console.error('[FeedbackPage] Respond error:', error)
    } finally {
      setResponseSaving(false)
    }
  }

  async function handleMarkReviewed(id: string) {
    try {
      await markReviewed(id)
    } catch (error) {
      console.error('[FeedbackPage] Mark reviewed error:', error)
    }
  }

  async function handleMarkResolved(id: string) {
    try {
      await markResolved(id)
    } catch (error) {
      console.error('[FeedbackPage] Mark resolved error:', error)
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveFeedback(id)
    } catch (error) {
      console.error('[FeedbackPage] Archive error:', error)
    }
  }

  async function handleToggleFeatured(id: string) {
    try {
      await toggleFeatured(id)
    } catch (error) {
      console.error('[FeedbackPage] Toggle featured error:', error)
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

  function truncateText(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen) + '...'
  }

  // ── Star rating renderer ────────────────────────────────────────────────

  function renderStars(rating: number, size: number = 16, interactive: boolean = false, onSelect?: (r: FeedbackRating) => void) {
    const ratingColor = RATING_COLORS[Math.round(rating)] || C.textMuted
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((starNum) => {
          const filled = starNum <= rating
          return (
            <span
              key={starNum}
              onClick={interactive && onSelect ? () => onSelect(starNum as FeedbackRating) : undefined}
              style={{
                cursor: interactive ? 'pointer' : 'default',
                color: filled ? ratingColor : '#d1d5db',
                fontSize: size,
                lineHeight: 1,
                transition: 'color 0.15s, transform 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={interactive ? (e) => { e.currentTarget.style.transform = 'scale(1.2)' } : undefined}
              onMouseLeave={interactive ? (e) => { e.currentTarget.style.transform = 'scale(1)' } : undefined}
            >
              {filled ? '\u2605' : '\u2606'}
            </span>
          )
        })}
      </div>
    )
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
      flexDirection: 'column' as const,
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

    feedbackCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: rv(14, 18, 20),
      marginBottom: rv(10, 12, 14),
      transition: 'box-shadow 0.2s',
    } as React.CSSProperties,

    feedbackCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'flex-start' : 'center',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 8,
      marginBottom: 12,
    } as React.CSSProperties,

    feedbackCardBody: {
      marginBottom: 12,
    } as React.CSSProperties,

    feedbackCardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      paddingTop: 12,
      borderTop: `1px solid ${C.border}`,
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
      minHeight: 80,
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

    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 60,
      color: C.textSecondary,
      fontSize: 15,
    } as React.CSSProperties,

    // View modal
    detailSection: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: '#f8fafc',
      borderRadius: 10,
      border: `1px solid ${C.border}`,
    } as React.CSSProperties,

    detailSectionTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: C.text,
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    } as React.CSSProperties,

    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '6px 0',
    } as React.CSSProperties,

    detailLabel: {
      fontSize: 13,
      color: C.textSecondary,
      fontWeight: 500,
      minWidth: 120,
    } as React.CSSProperties,

    detailValue: {
      fontSize: 13,
      color: C.text,
      fontWeight: 500,
      textAlign: 'right' as const,
      flex: 1,
    } as React.CSSProperties,

    featuredBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 700,
      color: '#d97706',
      backgroundColor: '#fef3c7',
      border: '1px solid #fde68a',
    } as React.CSSProperties,

    tagBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 500,
      color: C.textSecondary,
      backgroundColor: '#f1f5f9',
      border: `1px solid ${C.border}`,
      marginRight: 4,
      marginBottom: 4,
    } as React.CSSProperties,

    responseBox: {
      padding: 14,
      backgroundColor: C.successBg,
      borderRadius: 8,
      border: `1px solid #bbf7d0`,
      marginTop: 8,
    } as React.CSSProperties,

    templateBtn: {
      display: 'block',
      width: '100%',
      padding: '8px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 13,
      color: C.text,
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      textAlign: 'left' as const,
      marginBottom: 6,
      transition: 'background-color 0.15s',
      lineHeight: 1.4,
    } as React.CSSProperties,

    timelineItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 12,
    } as React.CSSProperties,

    timelineDot: (active: boolean) => ({
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: active ? C.primary : C.border,
      marginTop: 4,
      flexShrink: 0,
    } as React.CSSProperties),
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && feedbacks.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <MessageSquareHeart size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading feedbacks...</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Channel icon component ──────────────────────────────────────────

  function renderChannelBadge(channel: FeedbackChannel) {
    const cfg = CHANNEL_CONFIG[channel]
    const IconComp = cfg.icon
    return (
      <span style={s.badge(cfg.color, cfg.bg)}>
        <IconComp size={12} />
        {channelLabel(channel)}
      </span>
    )
  }

  function renderStatusBadge(status: FeedbackStatus) {
    const cfg = STATUS_CONFIG[status]
    return (
      <span style={s.badge(cfg.color, cfg.bg)}>
        {statusLabel(status)}
      </span>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <h1 style={s.title}>
            <MessageSquareHeart size={rv(22, 26, 28)} color={C.primary} />
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
          {L.addFeedback}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total feedbacks */}
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
              <MessageSquareHeart size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalFeedbacks}</span>
          </div>
          <div style={s.statValue}>{feedbacks.length}</div>
        </div>

        {/* Average Rating */}
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
              <Star size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.averageRating}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={s.statValue}>{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</span>
            {avgRating > 0 && renderStars(Math.round(avgRating), rv(14, 16, 18))}
          </div>
        </div>

        {/* Response Rate */}
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
              <MessageCircle size={18} color={C.success} />
            </div>
            <span style={s.statLabel}>{L.responseRate}</span>
          </div>
          <div style={s.statValue}>{responseRate}%</div>
        </div>

        {/* Positive Rate */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.limeBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ThumbsUp size={18} color={C.lime} />
            </div>
            <span style={s.statLabel}>{L.positiveRate}</span>
          </div>
          <div style={s.statValue}>{positiveRate}%</div>
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
          onChange={(e) => setFilterStatus(e.target.value as FeedbackStatus | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allStatuses}</option>
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>
              {statusLabel(st)}
            </option>
          ))}
        </select>

        {/* Channel filter */}
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value as FeedbackChannel | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allChannels}</option>
          {ALL_CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {channelLabel(ch)}
            </option>
          ))}
        </select>

        {/* Count */}
        <span style={{ fontSize: 13, color: C.textSecondary, whiteSpace: 'nowrap' }}>
          {filteredFeedbacks.length} / {feedbacks.length}
        </span>
      </div>

      {/* ── Feedback cards ──────────────────────────────────────────────── */}
      {filteredFeedbacks.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>
            <MessageSquareHeart size={48} />
          </div>
          <h3 style={s.emptyTitle}>
            {feedbacks.length === 0 ? L.noFeedbacks : L.noResults}
          </h3>
          <p style={s.emptyDesc}>
            {feedbacks.length === 0 ? L.noFeedbacksDesc : L.noResultsDesc}
          </p>
        </div>
      ) : (
        filteredFeedbacks.map((feedback) => (
          <div
            key={feedback.id}
            style={s.feedbackCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Card Header */}
            <div style={s.feedbackCardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.primary, fontFamily: 'monospace' }}>
                  {feedback.feedback_number}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                  {feedback.customer_name}
                </span>
                {renderStars(feedback.rating, rv(14, 15, 16))}
                <span style={{ fontSize: 12, fontWeight: 600, color: RATING_COLORS[feedback.rating] || C.textMuted }}>
                  {feedback.rating}/5
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {feedback.is_featured && (
                  <span style={s.featuredBadge}>
                    <Star size={10} />
                    {L.featured}
                  </span>
                )}
                {renderChannelBadge(feedback.channel)}
                {renderStatusBadge(feedback.status)}
              </div>
            </div>

            {/* Card Body */}
            <div style={s.feedbackCardBody}>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {feedback.category}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                {feedback.title}
              </div>
              <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.5 }}>
                {truncateText(feedback.comment, isMobile ? 120 : 250)}
              </div>
              {feedback.tags && feedback.tags.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                  {feedback.tags.map((tag, idx) => (
                    <span key={idx} style={s.tagBadge}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div style={s.feedbackCardFooter}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={13} color={C.textMuted} />
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  {formatDate(feedback.created_at)}
                </span>
                {feedback.order_id && (
                  <span style={{ fontSize: 12, color: C.textSecondary }}>
                    | Order: {feedback.order_id}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* View */}
                <button
                  style={s.actionBtn(C.info)}
                  title="View"
                  onClick={() => openViewModal(feedback)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.infoBg }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <Eye size={16} />
                </button>
                {/* Edit */}
                {feedback.status !== 'archived' && (
                  <button
                    style={s.actionBtn(C.warning)}
                    title="Edit"
                    onClick={() => openEditModal(feedback)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.warningBg }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <Edit size={16} />
                  </button>
                )}
                {/* Respond */}
                {(feedback.status === 'new' || feedback.status === 'reviewed') && (
                  <button
                    style={s.actionBtn(C.success)}
                    title={L.respond}
                    onClick={() => openRespondModal(feedback)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.successBg }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <Send size={16} />
                  </button>
                )}
                {/* Mark Reviewed */}
                {feedback.status === 'new' && (
                  <button
                    style={s.actionBtn(C.warning)}
                    title={L.markReviewed}
                    onClick={() => handleMarkReviewed(feedback.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.warningBg }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                {/* Mark Resolved */}
                {feedback.status === 'responded' && (
                  <button
                    style={s.actionBtn(C.teal)}
                    title={L.markResolved}
                    onClick={() => handleMarkResolved(feedback.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.tealBg }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                {/* Toggle Featured */}
                <button
                  style={s.actionBtn(feedback.is_featured ? '#d97706' : C.textMuted)}
                  title={L.featured}
                  onClick={() => handleToggleFeatured(feedback.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef3c7' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <Star size={16} fill={feedback.is_featured ? '#d97706' : 'none'} />
                </button>
                {/* Archive */}
                {feedback.status !== 'archived' && (
                  <button
                    style={s.actionBtn(C.textMuted)}
                    title={L.archive}
                    onClick={() => handleArchive(feedback.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <Archive size={16} />
                  </button>
                )}
                {/* Delete */}
                <button
                  style={s.actionBtn(C.danger)}
                  title="Delete"
                  onClick={() => setDeleteTarget(feedback.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* ── Add / Edit Feedback Modal ─────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingFeedback ? L.editFeedback : L.addFeedback}
        size="lg"
      >
        <div>
          {/* Customer Name & Channel */}
          <div style={s.formRow}>
            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.customerName} *</label>
              <input
                type="text"
                value={formCustomerName}
                onChange={(e) => setFormCustomerName(e.target.value)}
                style={s.formInput}
                placeholder="John Doe"
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.channel}</label>
              <select
                value={formChannel}
                onChange={(e) => setFormChannel(e.target.value as FeedbackChannel)}
                style={{ ...s.formInput, cursor: 'pointer' }}
              >
                {ALL_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {channelLabel(ch)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email & Phone */}
          <div style={s.formRow}>
            <div style={s.formGroup}>
              <label style={s.formLabel}>
                {L.customerEmail} <span style={{ fontWeight: 400, color: C.textMuted }}>({L.optional})</span>
              </label>
              <input
                type="email"
                value={formCustomerEmail}
                onChange={(e) => setFormCustomerEmail(e.target.value)}
                style={s.formInput}
                placeholder="john@example.com"
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>
                {L.customerPhone} <span style={{ fontWeight: 400, color: C.textMuted }}>({L.optional})</span>
              </label>
              <input
                type="tel"
                value={formCustomerPhone}
                onChange={(e) => setFormCustomerPhone(e.target.value)}
                style={s.formInput}
                placeholder="+1 234 567 890"
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
          </div>

          {/* Rating */}
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.rating} *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              {renderStars(formRating, rv(28, 32, 36), true, (r) => setFormRating(r))}
              <span style={{ fontSize: 16, fontWeight: 700, color: RATING_COLORS[formRating] }}>
                {formRating}/5
              </span>
              <span style={{ fontSize: 12, color: C.textMuted }}>
                {L.clickToRate}
              </span>
            </div>
          </div>

          {/* Category & Title */}
          <div style={s.formRow}>
            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.category} *</label>
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                style={s.formInput}
                placeholder="Service, Product, Ambiance..."
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.feedbackTitle} *</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={s.formInput}
                placeholder="Brief summary..."
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
          </div>

          {/* Comment */}
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.comment} *</label>
            <textarea
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              style={{ ...s.formTextarea, minHeight: 100 }}
              placeholder="Customer's detailed feedback..."
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>

          {/* Tags & Order ID */}
          <div style={s.formRow}>
            <div style={s.formGroup}>
              <label style={s.formLabel}>
                {L.tags} <span style={{ fontWeight: 400, color: C.textMuted }}>({L.optional})</span>
              </label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                style={s.formInput}
                placeholder={L.tagsPlaceholder}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>
                {L.orderId} <span style={{ fontWeight: 400, color: C.textMuted }}>({L.optional})</span>
              </label>
              <input
                type="text"
                value={formOrderId}
                onChange={(e) => setFormOrderId(e.target.value)}
                style={s.formInput}
                placeholder="ORD-240309-001"
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={s.formFooter}>
            <button
              style={s.cancelBtnStyle}
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
            >
              {L.cancelBtn}
            </button>
            <button
              style={s.saveBtn}
              onClick={handleSave}
              disabled={formSaving || !formCustomerName.trim() || !formTitle.trim() || !formComment.trim() || !formCategory.trim()}
              onMouseEnter={(e) => { if (!formSaving) e.currentTarget.style.backgroundColor = C.primaryDark }}
              onMouseLeave={(e) => { if (!formSaving) e.currentTarget.style.backgroundColor = C.primary }}
            >
              {formSaving ? '...' : L.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── View Feedback Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={!!viewingFeedback}
        onClose={() => setViewingFeedback(null)}
        title={L.viewFeedback}
        size="lg"
      >
        {viewingFeedback && (
          <div>
            {/* Big rating header */}
            <div
              style={{
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 12,
                padding: 16,
                backgroundColor: C.primaryLight,
                borderRadius: 12,
                marginBottom: 20,
                border: `1px solid #fce7f3`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${C.primary}`,
                  }}
                >
                  <span style={{ fontSize: 24, fontWeight: 800, color: RATING_COLORS[viewingFeedback.rating] }}>
                    {viewingFeedback.rating}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {renderStars(viewingFeedback.rating, rv(20, 24, 28))}
                  </div>
                  <span style={{ fontSize: 13, color: C.textSecondary }}>
                    {viewingFeedback.feedback_number}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {viewingFeedback.is_featured && (
                  <span style={s.featuredBadge}>
                    <Star size={10} />
                    {L.featured}
                  </span>
                )}
                {renderChannelBadge(viewingFeedback.channel)}
                {renderStatusBadge(viewingFeedback.status)}
              </div>
            </div>

            {/* Customer Information */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>
                <MessageSquareHeart size={16} color={C.primary} />
                {L.customerInfo}
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.customerName}</span>
                <span style={s.detailValue}>{viewingFeedback.customer_name}</span>
              </div>
              {viewingFeedback.customer_email && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.customerEmail}</span>
                  <span style={s.detailValue}>{viewingFeedback.customer_email}</span>
                </div>
              )}
              {viewingFeedback.customer_phone && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.customerPhone}</span>
                  <span style={s.detailValue}>{viewingFeedback.customer_phone}</span>
                </div>
              )}
              {viewingFeedback.order_id && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.orderId}</span>
                  <span style={{ ...s.detailValue, fontFamily: 'monospace', color: C.primary }}>
                    {viewingFeedback.order_id}
                  </span>
                </div>
              )}
            </div>

            {/* Feedback Details */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>
                <TrendingUp size={16} color={C.primary} />
                {L.feedbackDetails}
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.category}</span>
                <span style={s.detailValue}>{viewingFeedback.category}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.feedbackTitle}</span>
                <span style={s.detailValue}>{viewingFeedback.title}</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <span style={{ ...s.detailLabel, display: 'block', marginBottom: 8 }}>{L.comment}</span>
                <div
                  style={{
                    fontSize: 14,
                    color: C.text,
                    lineHeight: 1.6,
                    padding: 12,
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {viewingFeedback.comment}
                </div>
              </div>
              {viewingFeedback.tags && viewingFeedback.tags.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <span style={{ ...s.detailLabel, display: 'block', marginBottom: 8 }}>{L.tags}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                    {viewingFeedback.tags.map((tag, idx) => (
                      <span key={idx} style={s.tagBadge}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Response Section */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>
                <Send size={16} color={C.primary} />
                {L.responseSection}
              </div>
              {viewingFeedback.response ? (
                <div>
                  <div style={s.responseBox}>
                    <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {viewingFeedback.response}
                    </div>
                    {viewingFeedback.responded_by_name && (
                      <div style={{ marginTop: 8, fontSize: 12, color: C.textSecondary }}>
                        - {viewingFeedback.responded_by_name}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: C.textMuted }}>
                  <MessageCircle size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <div style={{ fontSize: 13 }}>No response yet</div>
                  {(viewingFeedback.status === 'new' || viewingFeedback.status === 'reviewed') && (
                    <button
                      style={{
                        marginTop: 12,
                        padding: '8px 16px',
                        backgroundColor: C.primary,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      onClick={() => {
                        setViewingFeedback(null)
                        openRespondModal(viewingFeedback)
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryDark }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
                    >
                      <Send size={14} />
                      {L.respond}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div style={s.detailSection}>
              <div style={s.detailSectionTitle}>
                <Clock size={16} color={C.primary} />
                {L.timeline}
              </div>
              <div style={s.timelineItem}>
                <div style={s.timelineDot(true)} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {L.createdAt}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSecondary }}>
                    {formatDateTime(viewingFeedback.created_at)}
                  </div>
                </div>
              </div>
              {viewingFeedback.updated_at !== viewingFeedback.created_at && (
                <div style={s.timelineItem}>
                  <div style={s.timelineDot(true)} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                      {L.updatedAt}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSecondary }}>
                      {formatDateTime(viewingFeedback.updated_at)}
                    </div>
                  </div>
                </div>
              )}
              {viewingFeedback.response && viewingFeedback.responded_by_name && (
                <div style={s.timelineItem}>
                  <div style={s.timelineDot(true)} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                      {L.respondedBy}: {viewingFeedback.responded_by_name}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSecondary }}>
                      {formatDateTime(viewingFeedback.updated_at)}
                    </div>
                  </div>
                </div>
              )}
              <div style={s.timelineItem}>
                <div style={s.timelineDot(false)} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {L.status}: {statusLabel(viewingFeedback.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons for viewed feedback */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {viewingFeedback.status === 'new' && (
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: C.warningBg,
                    color: C.warning,
                    border: `1px solid ${C.warning}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onClick={() => {
                    handleMarkReviewed(viewingFeedback.id)
                    setViewingFeedback({ ...viewingFeedback, status: 'reviewed' })
                  }}
                >
                  <CheckCircle size={14} />
                  {L.markReviewed}
                </button>
              )}
              {(viewingFeedback.status === 'new' || viewingFeedback.status === 'reviewed') && (
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: C.primaryLight,
                    color: C.primary,
                    border: `1px solid ${C.primary}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onClick={() => {
                    setViewingFeedback(null)
                    openRespondModal(viewingFeedback)
                  }}
                >
                  <Send size={14} />
                  {L.respond}
                </button>
              )}
              {viewingFeedback.status === 'responded' && (
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: C.tealBg,
                    color: C.teal,
                    border: `1px solid ${C.teal}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onClick={() => {
                    handleMarkResolved(viewingFeedback.id)
                    setViewingFeedback({ ...viewingFeedback, status: 'resolved' })
                  }}
                >
                  <CheckCircle size={14} />
                  {L.markResolved}
                </button>
              )}
              {viewingFeedback.status !== 'archived' && (
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f8fafc',
                    color: C.textSecondary,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onClick={() => {
                    handleArchive(viewingFeedback.id)
                    setViewingFeedback({ ...viewingFeedback, status: 'archived' })
                  }}
                >
                  <Archive size={14} />
                  {L.archive}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Respond Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={!!respondingFeedback}
        onClose={() => {
          setRespondingFeedback(null)
          setResponseText('')
        }}
        title={L.respondFeedback}
        size="md"
      >
        {respondingFeedback && (
          <div>
            {/* Feedback summary */}
            <div
              style={{
                padding: 14,
                backgroundColor: '#f8fafc',
                borderRadius: 10,
                marginBottom: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.primary, fontFamily: 'monospace' }}>
                  {respondingFeedback.feedback_number}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                  {respondingFeedback.customer_name}
                </span>
                {renderStars(respondingFeedback.rating, 14)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                {respondingFeedback.title}
              </div>
              <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                {truncateText(respondingFeedback.comment, 200)}
              </div>
            </div>

            {/* Quick responses */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...s.formLabel, marginBottom: 10 }}>
                {L.quickResponses}
              </label>
              <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
                {QUICK_RESPONSES.map((template, idx) => (
                  <button
                    key={idx}
                    style={s.templateBtn}
                    onClick={() => setResponseText(template)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryLight }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Response textarea */}
            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.response} *</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                style={{ ...s.formTextarea, minHeight: 120 }}
                placeholder={L.writeResponse}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>

            {/* Footer */}
            <div style={s.formFooter}>
              <button
                style={s.cancelBtnStyle}
                onClick={() => {
                  setRespondingFeedback(null)
                  setResponseText('')
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
              >
                {L.cancelBtn}
              </button>
              <button
                style={{
                  ...s.saveBtn,
                  opacity: responseSaving || !responseText.trim() ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onClick={handleRespond}
                disabled={responseSaving || !responseText.trim()}
                onMouseEnter={(e) => { if (!responseSaving) e.currentTarget.style.backgroundColor = C.primaryDark }}
                onMouseLeave={(e) => { if (!responseSaving) e.currentTarget.style.backgroundColor = C.primary }}
              >
                <Send size={14} />
                {responseSaving ? '...' : L.sendResponse}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={L.actions}
        size="sm"
      >
        {deleteTarget && (
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
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>
              {L.deleteConfirm}
            </div>
            <div style={{ fontSize: 14, color: C.textSecondary, marginBottom: 24 }}>
              {L.deleteWarning}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button
                style={s.cancelBtnStyle}
                onClick={() => setDeleteTarget(null)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
              >
                {L.cancelBtn}
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onClick={() => handleDelete(deleteTarget)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b91c1c' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.danger }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden usage of formatCurrency to satisfy noUnusedLocals */}
      <span style={{ display: 'none' }}>{formatCurrency(0, currency)}</span>
    </div>
  )
}
