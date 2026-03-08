import { useState, useEffect, useMemo } from 'react'
import { useNotificationStore } from '../stores/notificationStore'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import Modal from '../components/common/Modal'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  AlertTriangle,
  Package,
  ShoppingCart,
  Calendar,
  Clock,
  Truck,
  RotateCcw,
  Settings,
  Megaphone,
  Info,
  X,
  Eye,
  ChevronRight,
} from 'lucide-react'
import type { PosNotification, NotificationType, NotificationPriority } from '../types'

// ── Color palette ──────────────────────────────────────────────────────────

const C = {
  primary: '#f59e0b',
  primaryLight: '#fef3c7',
  primaryVeryLight: '#fffbeb',
  primaryDark: '#d97706',
  primaryDarker: '#b45309',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#2563eb',
  infoBg: '#eff6ff',
  readBg: '#f9fafb',
  unreadBg: '#ffffff',
  gray: '#6b7280',
  grayBg: '#f3f4f6',
} as const

// ── Notification type config ───────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  low_stock:             { icon: Package,       color: '#ea580c', bg: '#fff7ed' },
  new_order:             { icon: ShoppingCart,   color: '#2563eb', bg: '#eff6ff' },
  payment_due:           { icon: AlertTriangle,  color: '#dc2626', bg: '#fef2f2' },
  appointment_reminder:  { icon: Calendar,       color: '#7c3aed', bg: '#f5f3ff' },
  employee_clock:        { icon: Clock,          color: '#0d9488', bg: '#f0fdfa' },
  delivery_update:       { icon: Truck,          color: '#16a34a', bg: '#f0fdf4' },
  return_request:        { icon: RotateCcw,      color: '#f59e0b', bg: '#fffbeb' },
  system:                { icon: Settings,       color: '#64748b', bg: '#f8fafc' },
  campaign:              { icon: Megaphone,      color: '#ec4899', bg: '#fdf2f8' },
  custom:                { icon: Info,           color: '#2563eb', bg: '#eff6ff' },
}

const PRIORITY_CONFIG: Record<NotificationPriority, { color: string; bg: string; label: string }> = {
  low:    { color: '#6b7280', bg: '#f3f4f6', label: 'Low' },
  medium: { color: '#2563eb', bg: '#eff6ff', label: 'Medium' },
  high:   { color: '#f59e0b', bg: '#fffbeb', label: 'High' },
  urgent: { color: '#dc2626', bg: '#fef2f2', label: 'Urgent' },
}

const ALL_TYPES: NotificationType[] = [
  'low_stock', 'new_order', 'payment_due', 'appointment_reminder',
  'employee_clock', 'delivery_update', 'return_request', 'system',
  'campaign', 'custom',
]

const ALL_PRIORITIES: NotificationPriority[] = ['low', 'medium', 'high', 'urgent']

// ── Relative time formatter ────────────────────────────────────────────────

function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`
  return date.toLocaleDateString()
}

// ── Date group classifier ──────────────────────────────────────────────────

type DateGroup = 'today' | 'yesterday' | 'earlier'

function getDateGroup(dateString: string): DateGroup {
  const now = new Date()
  const date = new Date(dateString)

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)

  if (date >= todayStart) return 'today'
  if (date >= yesterdayStart) return 'yesterday'
  return 'earlier'
}

// ── Component ──────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    notifications,
    loading,
    filterType,
    filterPriority,
    loadNotifications,
    markRead,
    markAllRead,
    dismissNotification,
    dismissAll,
    deleteNotification,
    setFilterType,
    setFilterPriority,
  } = useNotificationStore()

  const storeId = currentStore?.id || user?.store_id || 'default-store'

  // i18n fallback
  const nt = (t as any).notifications || {}
  const tCommon = (t as any).common || {}

  const L = {
    title: nt.title || 'Notifications',
    markAllRead: nt.markAllRead || 'Mark All Read',
    dismissAll: nt.dismissAll || 'Dismiss All',
    total: nt.total || 'Total',
    unread: nt.unread || 'Unread',
    urgentAlerts: nt.urgentAlerts || 'Urgent Alerts',
    todayNotifications: nt.todayNotifications || "Today's Notifications",
    allTypes: nt.allTypes || 'All Types',
    allPriorities: nt.allPriorities || 'All Priorities',
    all: nt.all || 'All',
    readFilter: nt.readFilter || 'Read',
    unreadFilter: nt.unreadFilter || 'Unread',
    markRead: nt.markRead || 'Mark Read',
    dismiss: nt.dismiss || 'Dismiss',
    viewDetails: nt.viewDetails || 'View Details',
    delete: nt.delete || 'Delete',
    noNotifications: nt.noNotifications || 'No notifications yet',
    noNotificationsDesc: nt.noNotificationsDesc || "You're all caught up! New notifications will appear here.",
    noResults: nt.noResults || 'No matching notifications',
    noResultsDesc: nt.noResultsDesc || 'Try adjusting your filters to see more notifications.',
    today: nt.today || 'Today',
    yesterday: nt.yesterday || 'Yesterday',
    earlier: nt.earlier || 'Earlier',
    notificationDetails: nt.notificationDetails || 'Notification Details',
    close: tCommon.close || 'Close',
    priority: nt.priority || 'Priority',
    type: nt.type || 'Type',
    created: nt.created || 'Created',
    deleteConfirm: nt.deleteConfirm || 'Are you sure you want to delete this notification?',
    // Type labels
    type_low_stock: nt.type_low_stock || 'Low Stock',
    type_new_order: nt.type_new_order || 'New Order',
    type_payment_due: nt.type_payment_due || 'Payment Due',
    type_appointment_reminder: nt.type_appointment_reminder || 'Appointment',
    type_employee_clock: nt.type_employee_clock || 'Employee Clock',
    type_delivery_update: nt.type_delivery_update || 'Delivery',
    type_return_request: nt.type_return_request || 'Return Request',
    type_system: nt.type_system || 'System',
    type_campaign: nt.type_campaign || 'Campaign',
    type_custom: nt.type_custom || 'Custom',
    // Priority labels
    pri_low: nt.pri_low || 'Low',
    pri_medium: nt.pri_medium || 'Medium',
    pri_high: nt.pri_high || 'High',
    pri_urgent: nt.pri_urgent || 'Urgent',
  }

  const typeLabel = (t: NotificationType): string => (L as any)[`type_${t}`] || t
  const priorityLabel = (p: NotificationPriority): string => (L as any)[`pri_${p}`] || p

  // ── Local state ────────────────────────────────────────────────────────

  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [detailNotification, setDetailNotification] = useState<PosNotification | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  // ── Load data ──────────────────────────────────────────────────────────

  useEffect(() => {
    loadNotifications(storeId)
  }, [storeId, loadNotifications])

  // ── Filtered + active (non-dismissed) notifications ────────────────────

  const activeNotifications = useMemo(
    () => notifications.filter((n) => !n.is_dismissed),
    [notifications]
  )

  const filteredNotifications = useMemo(() => {
    let result = activeNotifications

    if (filterType !== 'all') {
      result = result.filter((n) => n.type === filterType)
    }
    if (filterPriority !== 'all') {
      result = result.filter((n) => n.priority === filterPriority)
    }
    if (readFilter === 'read') {
      result = result.filter((n) => n.is_read)
    } else if (readFilter === 'unread') {
      result = result.filter((n) => !n.is_read)
    }

    return result
  }, [activeNotifications, filterType, filterPriority, readFilter])

  // ── Stats ──────────────────────────────────────────────────────────────

  const totalCount = activeNotifications.length
  const unreadCount = activeNotifications.filter((n) => !n.is_read).length
  const urgentCount = activeNotifications.filter((n) => n.priority === 'urgent').length
  const todayCount = activeNotifications.filter((n) => getDateGroup(n.created_at) === 'today').length

  // ── Grouped by date ────────────────────────────────────────────────────

  const groupedNotifications = useMemo(() => {
    const groups: { label: string; key: DateGroup; items: PosNotification[] }[] = [
      { label: L.today, key: 'today', items: [] },
      { label: L.yesterday, key: 'yesterday', items: [] },
      { label: L.earlier, key: 'earlier', items: [] },
    ]

    for (const n of filteredNotifications) {
      const group = getDateGroup(n.created_at)
      const g = groups.find((g) => g.key === group)
      if (g) g.items.push(n)
    }

    return groups.filter((g) => g.items.length > 0)
  }, [filteredNotifications, L.today, L.yesterday, L.earlier])

  // ── Action handlers ────────────────────────────────────────────────────

  const handleMarkRead = async (id: string) => {
    await markRead(id)
  }

  const handleDismiss = async (id: string) => {
    await dismissNotification(id)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteNotification(deleteTarget)
    setDeleteTarget(null)
  }

  const handleMarkAllRead = async () => {
    await markAllRead(storeId)
  }

  const handleDismissAll = async () => {
    await dismissAll(storeId)
  }

  const handleViewDetails = (n: PosNotification) => {
    if (!n.is_read) markRead(n.id)
    setDetailNotification(n)
  }

  // ── Stat card component ────────────────────────────────────────────────

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    bg,
  }: {
    label: string
    value: number
    icon: typeof Bell
    color: string
    bg: string
  }) => (
    <div
      style={{
        flex: 1,
        minWidth: rv(120, 140, 160),
        backgroundColor: bg,
        borderRadius: 12,
        padding: rv(14, 16, 20),
        display: 'flex',
        alignItems: 'center',
        gap: rv(10, 12, 14),
        border: `1px solid ${C.border}`,
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      <div
        style={{
          width: rv(36, 40, 44),
          height: rv(36, 40, 44),
          borderRadius: 10,
          backgroundColor: color + '18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={rv(18, 20, 22)} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: rv(20, 24, 28),
            fontWeight: 700,
            color: C.text,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: rv(11, 12, 13),
            color: C.textSecondary,
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  )

  // ── Notification card ──────────────────────────────────────────────────

  const NotificationCard = ({ notification: n }: { notification: PosNotification }) => {
    const typeConf = TYPE_CONFIG[n.type] || TYPE_CONFIG.custom
    const priConf = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG.low
    const IconComp = typeConf.icon
    const isHovered = hoveredCard === n.id

    return (
      <div
        style={{
          backgroundColor: n.is_read ? C.readBg : C.unreadBg,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          borderLeft: n.is_read ? `1px solid ${C.border}` : `4px solid ${C.primary}`,
          padding: rv(14, 16, 18),
          display: 'flex',
          gap: rv(10, 12, 14),
          alignItems: 'flex-start',
          transition: 'box-shadow 0.2s, transform 0.15s',
          boxShadow: isHovered ? '0 4px 16px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.03)',
          transform: isHovered ? 'translateY(-1px)' : 'none',
          cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={() => setHoveredCard(n.id)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => handleViewDetails(n)}
      >
        {/* Icon */}
        <div
          style={{
            width: rv(36, 40, 44),
            height: rv(36, 40, 44),
            borderRadius: 10,
            backgroundColor: typeConf.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconComp size={rv(18, 20, 22)} color={typeConf.color} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row: Title + priority badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: rv(13, 14, 15),
                fontWeight: n.is_read ? 500 : 700,
                color: C.text,
                lineHeight: 1.3,
              }}
            >
              {n.title}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: priConf.color,
                backgroundColor: priConf.bg,
                padding: '2px 8px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                whiteSpace: 'nowrap',
                lineHeight: 1.4,
              }}
            >
              {priorityLabel(n.priority)}
            </span>
            {/* Unread dot */}
            {!n.is_read && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: C.primary,
                  flexShrink: 0,
                }}
              />
            )}
          </div>

          {/* Message */}
          <div
            style={{
              fontSize: rv(12, 13, 13),
              color: C.textSecondary,
              lineHeight: 1.5,
              marginBottom: 8,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {n.message}
          </div>

          {/* Bottom row: timestamp + type tag + actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: C.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Clock size={12} color={C.textMuted} />
                {formatRelativeTime(n.created_at)}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: typeConf.color,
                  backgroundColor: typeConf.bg,
                  padding: '2px 6px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                {typeLabel(n.type)}
              </span>
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                opacity: isHovered || isMobile ? 1 : 0,
                transition: 'opacity 0.15s',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {!n.is_read && (
                <button
                  title={L.markRead}
                  onClick={() => handleMarkRead(n.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor:
                      hoveredButton === `read-${n.id}` ? C.primaryVeryLight : 'transparent',
                    cursor: 'pointer',
                    color: hoveredButton === `read-${n.id}` ? C.primary : C.textMuted,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={() => setHoveredButton(`read-${n.id}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  <Check size={15} />
                </button>
              )}
              <button
                title={L.dismiss}
                onClick={() => handleDismiss(n.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor:
                    hoveredButton === `dismiss-${n.id}` ? C.grayBg : 'transparent',
                  cursor: 'pointer',
                  color: hoveredButton === `dismiss-${n.id}` ? C.gray : C.textMuted,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={() => setHoveredButton(`dismiss-${n.id}`)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <X size={15} />
              </button>
              <button
                title={L.delete}
                onClick={() => setDeleteTarget(n.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor:
                    hoveredButton === `del-${n.id}` ? C.dangerBg : 'transparent',
                  cursor: 'pointer',
                  color: hoveredButton === `del-${n.id}` ? C.danger : C.textMuted,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={() => setHoveredButton(`del-${n.id}`)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Chevron for details */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'center',
            color: C.textMuted,
            flexShrink: 0,
            opacity: isHovered ? 1 : 0.3,
            transition: 'opacity 0.15s',
          }}
        >
          <ChevronRight size={18} />
        </div>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────

  const EmptyState = ({ filtered }: { filtered?: boolean }) => (
    <div
      style={{
        textAlign: 'center',
        padding: rv(40, 60, 80),
        backgroundColor: C.card,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: C.primaryVeryLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        {filtered ? (
          <Filter size={28} color={C.primary} />
        ) : (
          <BellOff size={28} color={C.primary} />
        )}
      </div>
      <div
        style={{
          fontSize: rv(16, 18, 20),
          fontWeight: 700,
          color: C.text,
          marginBottom: 8,
        }}
      >
        {filtered ? L.noResults : L.noNotifications}
      </div>
      <div
        style={{
          fontSize: rv(13, 14, 14),
          color: C.textSecondary,
          maxWidth: 360,
          margin: '0 auto',
          lineHeight: 1.5,
        }}
      >
        {filtered ? L.noResultsDesc : L.noNotificationsDesc}
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        padding: rv(16, 20, 28),
        backgroundColor: C.bg,
        minHeight: '100vh',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 0,
          marginBottom: rv(16, 20, 24),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: rv(38, 42, 46),
              height: rv(38, 42, 46),
              borderRadius: 12,
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
            }}
          >
            <Bell size={rv(20, 22, 24)} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: rv(20, 24, 28),
                fontWeight: 800,
                color: C.text,
                lineHeight: 1.2,
              }}
            >
              {L.title}
            </h1>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: rv(11, 12, 13),
                  color: C.textSecondary,
                  marginTop: 2,
                  display: 'block',
                }}
              >
                {unreadCount} {L.unread.toLowerCase()}
              </span>
            )}
          </div>
        </div>

        {/* Header actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: rv('8px 12px', '8px 14px', '10px 18px'),
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.text,
                fontSize: rv(12, 13, 13),
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = C.primaryVeryLight
                e.currentTarget.style.borderColor = C.primaryLight
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = C.card
                e.currentTarget.style.borderColor = C.border
              }}
            >
              <CheckCheck size={15} />
              {!isMobile && L.markAllRead}
            </button>
          )}
          {totalCount > 0 && (
            <button
              onClick={handleDismissAll}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: rv('8px 12px', '8px 14px', '10px 18px'),
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.textSecondary,
                fontSize: rv(12, 13, 13),
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = C.grayBg
                e.currentTarget.style.color = C.text
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = C.card
                e.currentTarget.style.color = C.textSecondary
              }}
            >
              <BellOff size={15} />
              {!isMobile && L.dismissAll}
            </button>
          )}
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: rv(8, 12, 16),
          marginBottom: rv(16, 20, 24),
          flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}
      >
        <StatCard
          label={L.total}
          value={totalCount}
          icon={Bell}
          color={C.primary}
          bg={C.primaryVeryLight}
        />
        <StatCard
          label={L.unread}
          value={unreadCount}
          icon={Eye}
          color={C.info}
          bg={C.infoBg}
        />
        <StatCard
          label={L.urgentAlerts}
          value={urgentCount}
          icon={AlertTriangle}
          color={C.danger}
          bg={C.dangerBg}
        />
        <StatCard
          label={L.todayNotifications}
          value={todayCount}
          icon={Calendar}
          color={C.success}
          bg={C.successBg}
        />
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: rv(8, 10, 12),
          marginBottom: rv(16, 20, 24),
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Type filter */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Filter
            size={14}
            color={C.textMuted}
            style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
            style={{
              appearance: 'none',
              padding: '8px 32px 8px 30px',
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              backgroundColor: C.card,
              fontSize: rv(12, 13, 13),
              fontWeight: 500,
              color: C.text,
              cursor: 'pointer',
              outline: 'none',
              minWidth: rv(120, 140, 160),
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="all">{L.allTypes}</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {typeLabel(t)}
              </option>
            ))}
          </select>
        </div>

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={(e) =>
            setFilterPriority(e.target.value as NotificationPriority | 'all')
          }
          style={{
            appearance: 'none',
            padding: '8px 32px 8px 12px',
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            backgroundColor: C.card,
            fontSize: rv(12, 13, 13),
            fontWeight: 500,
            color: C.text,
            cursor: 'pointer',
            outline: 'none',
            minWidth: rv(100, 120, 140),
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
        >
          <option value="all">{L.allPriorities}</option>
          {ALL_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {priorityLabel(p)}
            </option>
          ))}
        </select>

        {/* Read/Unread toggle */}
        <div
          style={{
            display: 'flex',
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
            backgroundColor: C.card,
          }}
        >
          {(['all', 'unread', 'read'] as const).map((val) => {
            const isActive = readFilter === val
            const label = val === 'all' ? L.all : val === 'unread' ? L.unreadFilter : L.readFilter
            return (
              <button
                key={val}
                onClick={() => setReadFilter(val)}
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  borderRight: val !== 'read' ? `1px solid ${C.border}` : 'none',
                  backgroundColor: isActive ? C.primary : 'transparent',
                  color: isActive ? '#fff' : C.textSecondary,
                  fontSize: rv(11, 12, 13),
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Active filter count indicator */}
        {(filterType !== 'all' || filterPriority !== 'all' || readFilter !== 'all') && (
          <button
            onClick={() => {
              setFilterType('all')
              setFilterPriority('all')
              setReadFilter('all')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: C.dangerBg,
              color: C.danger,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      {/* ── Notification list ───────────────────────────────────────────── */}
      {loading && activeNotifications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            color: C.textMuted,
            fontSize: 14,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: `3px solid ${C.border}`,
              borderTopColor: C.primary,
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'notifSpin 0.8s linear infinite',
            }}
          />
          Loading...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState filtered={activeNotifications.length > 0} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: rv(16, 20, 24) }}>
          {groupedNotifications.map((group) => (
            <div key={group.key}>
              {/* Group header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: rv(10, 12, 14),
                }}
              >
                <span
                  style={{
                    fontSize: rv(12, 13, 14),
                    fontWeight: 700,
                    color: C.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  {group.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textMuted,
                    backgroundColor: C.grayBg,
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}
                >
                  {group.items.length}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: C.border,
                  }}
                />
              </div>

              {/* Notification cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: rv(8, 10, 10) }}>
                {group.items.map((n) => (
                  <NotificationCard key={n.id} notification={n} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!detailNotification}
        onClose={() => setDetailNotification(null)}
        title={L.notificationDetails}
        size="md"
      >
        {detailNotification && (() => {
          const n = detailNotification
          const typeConf = TYPE_CONFIG[n.type] || TYPE_CONFIG.custom
          const priConf = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG.low
          const IconComp = typeConf.icon

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Icon + Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: typeConf.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={24} color={typeConf.color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: C.text,
                      lineHeight: 1.3,
                      marginBottom: 4,
                    }}
                  >
                    {n.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: typeConf.color,
                        backgroundColor: typeConf.bg,
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {typeLabel(n.type)}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: priConf.color,
                        backgroundColor: priConf.bg,
                        padding: '2px 8px',
                        borderRadius: 20,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {priorityLabel(n.priority)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message body */}
              <div
                style={{
                  fontSize: 14,
                  color: C.textSecondary,
                  lineHeight: 1.7,
                  backgroundColor: C.bg,
                  padding: 16,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                }}
              >
                {n.message}
              </div>

              {/* Metadata */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    backgroundColor: C.bg,
                    borderRadius: 8,
                    padding: '10px 14px',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: C.textMuted,
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {L.type}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: typeConf.color,
                    }}
                  >
                    {typeLabel(n.type)}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: C.bg,
                    borderRadius: 8,
                    padding: '10px 14px',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: C.textMuted,
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {L.priority}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: priConf.color,
                    }}
                  >
                    {priorityLabel(n.priority)}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: C.bg,
                    borderRadius: 8,
                    padding: '10px 14px',
                    border: `1px solid ${C.border}`,
                    gridColumn: '1 / -1',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: C.textMuted,
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {L.created}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Clock size={14} color={C.textMuted} />
                    {new Date(n.created_at).toLocaleString()}
                    <span
                      style={{
                        fontSize: 12,
                        color: C.textMuted,
                        fontWeight: 400,
                      }}
                    >
                      ({formatRelativeTime(n.created_at)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'flex-end',
                  paddingTop: 8,
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                {!n.is_read && (
                  <button
                    onClick={() => {
                      handleMarkRead(n.id)
                      setDetailNotification({ ...n, is_read: true })
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 16px',
                      borderRadius: 10,
                      border: `1px solid ${C.primary}`,
                      backgroundColor: 'transparent',
                      color: C.primary,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = C.primaryVeryLight
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Check size={15} />
                    {L.markRead}
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDismiss(n.id)
                    setDetailNotification(null)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: C.grayBg,
                    color: C.textSecondary,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = C.border
                    e.currentTarget.style.color = C.text
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = C.grayBg
                    e.currentTarget.style.color = C.textSecondary
                  }}
                >
                  <X size={15} />
                  {L.dismiss}
                </button>
                <button
                  onClick={() => {
                    setDeleteTarget(n.id)
                    setDetailNotification(null)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: C.dangerBg,
                    color: C.danger,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fecaca'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = C.dangerBg
                  }}
                >
                  <Trash2 size={14} />
                  {L.delete}
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── Delete confirmation modal ───────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={L.delete}
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              textAlign: 'center',
              padding: '10px 0',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: C.dangerBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Trash2 size={22} color={C.danger} />
            </div>
            <div
              style={{
                fontSize: 14,
                color: C.textSecondary,
                lineHeight: 1.6,
              }}
            >
              {L.deleteConfirm}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => setDeleteTarget(null)}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.text,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = C.bg
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = C.card
              }}
            >
              {L.close}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: C.danger,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = C.danger
              }}
            >
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── CSS keyframes for spinner ───────────────────────────────────── */}
      <style>{`
        @keyframes notifSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
