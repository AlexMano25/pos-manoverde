import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuditStore } from '../stores/auditStore'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import Modal from '../components/common/Modal'
import {
  Shield,
  FileSearch,
  User,
  Clock,
  Filter,
  Download,
  Activity,
  LogIn,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Printer,
  CheckCircle,
  XCircle,
  RotateCcw,
  Ban,
  Settings,
  AlertTriangle,
  ChevronDown,
  Eye,
  Search,
} from 'lucide-react'
import type { AuditLog, AuditAction, AuditModule } from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#64748b',
  primaryLight: '#f1f5f9',
  primaryDark: '#475569',
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
  indigo: '#6366f1',
  indigoBg: '#eef2ff',
  emerald: '#059669',
  emeraldBg: '#ecfdf5',
  amber: '#d97706',
  amberBg: '#fffbeb',
  violet: '#7c3aed',
  violetBg: '#f5f3ff',
  rose: '#e11d48',
  roseBg: '#fff1f2',
  cyan: '#0891b2',
  cyanBg: '#ecfeff',
  teal: '#0d9488',
  tealBg: '#f0fdfa',
  orange: '#ea580c',
  orangeBg: '#fff7ed',
  pink: '#db2777',
  pinkBg: '#fdf2f8',
  rowAlt: '#f8fafc',
} as const

// ── Action config ─────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<AuditAction, { color: string; bg: string; icon: typeof Plus; label: string }> = {
  create:          { color: C.success,  bg: C.successBg,  icon: Plus,        label: 'Create' },
  update:          { color: C.info,     bg: C.infoBg,     icon: Edit3,       label: 'Update' },
  delete:          { color: C.danger,   bg: C.dangerBg,   icon: Trash2,      label: 'Delete' },
  login:           { color: C.indigo,   bg: C.indigoBg,   icon: LogIn,       label: 'Login' },
  logout:          { color: C.textMuted,bg: C.borderLight, icon: LogOut,     label: 'Logout' },
  export:          { color: C.cyan,     bg: C.cyanBg,     icon: Download,    label: 'Export' },
  print:           { color: C.primaryDark, bg: C.primaryLight, icon: Printer, label: 'Print' },
  approve:         { color: C.emerald,  bg: C.emeraldBg,  icon: CheckCircle, label: 'Approve' },
  reject:          { color: C.rose,     bg: C.roseBg,     icon: XCircle,     label: 'Reject' },
  refund:          { color: C.amber,    bg: C.amberBg,    icon: RotateCcw,   label: 'Refund' },
  void:            { color: C.danger,   bg: C.dangerBg,   icon: Ban,         label: 'Void' },
  clock_in:        { color: C.teal,     bg: C.tealBg,     icon: LogIn,       label: 'Clock In' },
  clock_out:       { color: C.orange,   bg: C.orangeBg,   icon: LogOut,      label: 'Clock Out' },
  settings_change: { color: C.violet,   bg: C.violetBg,   icon: Settings,    label: 'Settings' },
}

// ── Module config ─────────────────────────────────────────────────────────

const MODULE_CONFIG: Record<AuditModule, { color: string; bg: string; label: string }> = {
  pos:           { color: '#2563eb', bg: '#eff6ff', label: 'POS' },
  products:      { color: '#16a34a', bg: '#f0fdf4', label: 'Products' },
  orders:        { color: '#d97706', bg: '#fffbeb', label: 'Orders' },
  stock:         { color: '#0891b2', bg: '#ecfeff', label: 'Stock' },
  employees:     { color: '#7c3aed', bg: '#f5f3ff', label: 'Employees' },
  customers:     { color: '#db2777', bg: '#fdf2f8', label: 'Customers' },
  settings:      { color: '#64748b', bg: '#f1f5f9', label: 'Settings' },
  cash_register: { color: '#059669', bg: '#ecfdf5', label: 'Cash Register' },
  suppliers:     { color: '#ea580c', bg: '#fff7ed', label: 'Suppliers' },
  invoices:      { color: '#4f46e5', bg: '#eef2ff', label: 'Invoices' },
  deliveries:    { color: '#0d9488', bg: '#f0fdfa', label: 'Deliveries' },
  loyalty:       { color: '#e11d48', bg: '#fff1f2', label: 'Loyalty' },
  gift_cards:    { color: '#c026d3', bg: '#fdf4ff', label: 'Gift Cards' },
  expenses:      { color: '#dc2626', bg: '#fef2f2', label: 'Expenses' },
  campaigns:     { color: '#6366f1', bg: '#eef2ff', label: 'Campaigns' },
  payroll:       { color: '#0284c7', bg: '#f0f9ff', label: 'Payroll' },
  returns:       { color: '#f59e0b', bg: '#fffbeb', label: 'Returns' },
  auth:          { color: '#475569', bg: '#f8fafc', label: 'Auth' },
  system:        { color: '#334155', bg: '#f8fafc', label: 'System' },
}

const ALL_ACTIONS: AuditAction[] = [
  'create', 'update', 'delete', 'login', 'logout', 'export', 'print',
  'approve', 'reject', 'refund', 'void', 'clock_in', 'clock_out', 'settings_change',
]

const ALL_MODULES: AuditModule[] = [
  'pos', 'products', 'orders', 'stock', 'employees', 'customers', 'settings',
  'cash_register', 'suppliers', 'invoices', 'deliveries', 'loyalty', 'gift_cards',
  'expenses', 'campaigns', 'payroll', 'returns', 'auth', 'system',
]

const CRITICAL_ACTIONS: AuditAction[] = ['delete', 'void', 'refund', 'settings_change']

// ── Helpers ───────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatJsonPretty(jsonStr: string | undefined): string {
  if (!jsonStr) return ''
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2)
  } catch {
    return jsonStr
  }
}

// ── Component ─────────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    logs,
    loading,
    filterAction,
    filterModule,
    filterUser,
    loadLogs,
    getTodayStats,
    setFilterAction,
    setFilterModule,
    setFilterUser,
  } = useAuditStore()

  const storeId = currentStore?.id || user?.store_id || 'default-store'

  // i18n
  const at = (t as any).auditTrail || {}
  const tCommon = (t as any).common || {}

  const L = {
    title: at.title || 'Audit Trail',
    subtitle: at.subtitle || 'Activity log & security monitoring',
    totalActions: at.totalActions || 'Total Actions',
    todayActions: at.todayActions || "Today's Actions",
    activeUsers: at.activeUsers || 'Active Users',
    criticalActions: at.criticalActions || 'Critical Actions',
    allActions: at.allActions || 'All Actions',
    allModules: at.allModules || 'All Modules',
    allUsers: at.allUsers || 'All Users',
    from: at.from || 'From',
    to: at.to || 'To',
    search: tCommon.search || at.search || 'Search',
    searchPlaceholder: at.searchPlaceholder || 'Search logs...',
    timestamp: at.timestamp || 'Timestamp',
    user: at.user || 'User',
    action: at.action || 'Action',
    module: at.module || 'Module',
    description: at.description || 'Description',
    details: at.details || 'Details',
    logDetails: at.logDetails || 'Log Details',
    oldValue: at.oldValue || 'Previous Value',
    newValue: at.newValue || 'New Value',
    entityType: at.entityType || 'Entity Type',
    entityId: at.entityId || 'Entity ID',
    ipAddress: at.ipAddress || 'IP Address',
    deviceInfo: at.deviceInfo || 'Device Info',
    export: at.export || 'Export',
    noLogs: at.noLogs || 'No audit logs yet',
    noLogsDesc: at.noLogsDesc || 'Activity will appear here as actions are performed in the system.',
    noResults: at.noResults || 'No logs match your filters',
    noResultsDesc: at.noResultsDesc || 'Try adjusting your filters or search query.',
    showing: at.showing || 'Showing',
    of: at.of || 'of',
    logs: at.logs || 'logs',
    changes: at.changes || 'Changes',
  }

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // ── Load data on mount ──────────────────────────────────────────────

  useEffect(() => {
    loadLogs(storeId)
  }, [storeId, loadLogs])

  // ── Debounce search ─────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ── Unique users from logs ──────────────────────────────────────────

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>()
    logs.forEach((l) => map.set(l.user_id, l.user_name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [logs])

  // ── Filtered logs ───────────────────────────────────────────────────

  const filteredLogs = useMemo(() => {
    let result = [...logs]

    if (filterAction !== 'all') {
      result = result.filter((l) => l.action === filterAction)
    }
    if (filterModule !== 'all') {
      result = result.filter((l) => l.module === filterModule)
    }
    if (filterUser !== 'all') {
      result = result.filter((l) => l.user_id === filterUser)
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom).toISOString()
      result = result.filter((l) => l.created_at >= fromDate)
    }
    if (dateTo) {
      const toDate = new Date(dateTo + 'T23:59:59.999Z').toISOString()
      result = result.filter((l) => l.created_at <= toDate)
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (l) =>
          l.description.toLowerCase().includes(q) ||
          l.user_name.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.module.toLowerCase().includes(q) ||
          (l.entity_type && l.entity_type.toLowerCase().includes(q)) ||
          (l.entity_id && l.entity_id.toLowerCase().includes(q))
      )
    }

    return result
  }, [logs, filterAction, filterModule, filterUser, dateFrom, dateTo, debouncedSearch])

  // ── Stats ───────────────────────────────────────────────────────────

  const todayStats = getTodayStats(storeId)
  const totalActions = logs.length

  const criticalTotal = useMemo(
    () => logs.filter((l) => CRITICAL_ACTIONS.includes(l.action)).length,
    [logs]
  )

  // ── Export handler ──────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const headers = ['Timestamp', 'User', 'Action', 'Module', 'Description', 'Entity Type', 'Entity ID']
    const rows = filteredLogs.map((l) => [
      l.created_at,
      l.user_name,
      l.action,
      l.module,
      l.description,
      l.entity_type || '',
      l.entity_id || '',
    ])
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredLogs])

  // ── Shared styles ──────────────────────────────────────────────────

  const selectStyle: React.CSSProperties = {
    padding: '8px 32px 8px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    backgroundColor: C.card,
    color: C.text,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    minWidth: 0,
    flex: isMobile ? '1 1 calc(50% - 6px)' : undefined,
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    backgroundColor: C.card,
    color: C.text,
    fontSize: 13,
    fontWeight: 500,
    outline: 'none',
    minWidth: 0,
    flex: isMobile ? '1 1 calc(50% - 6px)' : undefined,
  }

  // ── Render helpers ──────────────────────────────────────────────────

  function ActionBadge({ action }: { action: AuditAction }) {
    const cfg = ACTION_CONFIG[action]
    const IconComp = cfg.icon
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          borderRadius: 20,
          backgroundColor: cfg.bg,
          color: cfg.color,
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
        }}
      >
        <IconComp size={12} />
        {cfg.label}
      </span>
    )
  }

  function ModuleBadge({ module }: { module: AuditModule }) {
    const cfg = MODULE_CONFIG[module]
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 10px',
          borderRadius: 20,
          backgroundColor: cfg.bg,
          color: cfg.color,
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
        }}
      >
        {cfg.label}
      </span>
    )
  }

  function StatCard({
    icon: IconComp,
    label,
    value,
    color,
    bg,
  }: {
    icon: typeof Activity
    label: string
    value: number
    color: string
    bg: string
  }) {
    return (
      <div
        style={{
          flex: '1 1 0',
          minWidth: isMobile ? 'calc(50% - 8px)' : 180,
          backgroundColor: C.card,
          borderRadius: 12,
          padding: rv(14, 16, 20),
          display: 'flex',
          alignItems: 'center',
          gap: rv(10, 12, 14),
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            width: rv(38, 42, 46),
            height: rv(38, 42, 46),
            borderRadius: 12,
            backgroundColor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconComp size={rv(18, 20, 22)} color={color} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: rv(20, 22, 26),
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.2,
            }}
          >
            {value.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: rv(11, 12, 13),
              color: C.textMuted,
              fontWeight: 500,
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
  }

  // ── Desktop table row ───────────────────────────────────────────────

  function LogRow({ log, index }: { log: AuditLog; index: number }) {
    const isCritical = CRITICAL_ACTIONS.includes(log.action)
    return (
      <tr
        style={{
          backgroundColor: index % 2 === 0 ? C.card : C.rowAlt,
          transition: 'background-color 0.15s',
          borderLeft: isCritical ? `3px solid ${C.danger}` : '3px solid transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f4ff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = index % 2 === 0 ? C.card : C.rowAlt
        }}
      >
        <td style={{ padding: '12px 16px', fontSize: 13, color: C.textSecondary, whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={13} color={C.textMuted} />
            {formatDateShort(log.created_at)}
          </div>
        </td>
        <td style={{ padding: '12px 16px', fontSize: 13, color: C.text, fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: C.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={13} color={C.primary} />
            </div>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
              {log.user_name}
            </span>
          </div>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <ActionBadge action={log.action} />
        </td>
        <td style={{ padding: '12px 16px' }}>
          <ModuleBadge module={log.module} />
        </td>
        <td
          style={{
            padding: '12px 16px',
            fontSize: 13,
            color: C.textSecondary,
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {log.description}
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
          <button
            onClick={() => setDetailLog(log)}
            title={L.details}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: C.textMuted,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = C.primaryLight
              e.currentTarget.style.color = C.primary
              e.currentTarget.style.borderColor = C.primary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = C.textMuted
              e.currentTarget.style.borderColor = C.border
            }}
          >
            <Eye size={15} />
          </button>
        </td>
      </tr>
    )
  }

  // ── Mobile card ─────────────────────────────────────────────────────

  function LogCard({ log }: { log: AuditLog }) {
    const isCritical = CRITICAL_ACTIONS.includes(log.action)
    return (
      <div
        style={{
          backgroundColor: C.card,
          borderRadius: 12,
          padding: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          border: `1px solid ${C.border}`,
          borderLeft: isCritical ? `3px solid ${C.danger}` : `1px solid ${C.border}`,
        }}
      >
        {/* Top row: user + timestamp */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: C.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={13} color={C.primary} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              {log.user_name}
            </span>
          </div>
          <span style={{ fontSize: 11, color: C.textMuted }}>
            {formatDateShort(log.created_at)}
          </span>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <ActionBadge action={log.action} />
          <ModuleBadge module={log.module} />
        </div>

        {/* Description */}
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: C.textSecondary,
            lineHeight: 1.5,
            marginBottom: 10,
          }}
        >
          {log.description}
        </p>

        {/* Detail button */}
        <button
          onClick={() => setDetailLog(log)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: C.primary,
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = C.primaryLight
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <Eye size={13} />
          {L.details}
        </button>
      </div>
    )
  }

  // ── Detail modal content ────────────────────────────────────────────

  function DetailContent({ log }: { log: AuditLog }) {
    const isCritical = CRITICAL_ACTIONS.includes(log.action)
    const detailRowStyle: React.CSSProperties = {
      display: 'flex',
      padding: '10px 0',
      borderBottom: `1px solid ${C.borderLight}`,
      gap: 12,
    }
    const detailLabelStyle: React.CSSProperties = {
      fontSize: 12,
      fontWeight: 600,
      color: C.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      minWidth: 100,
      flexShrink: 0,
    }
    const detailValueStyle: React.CSSProperties = {
      fontSize: 13,
      color: C.text,
      fontWeight: 500,
      wordBreak: 'break-all' as const,
    }
    const jsonBlockStyle: React.CSSProperties = {
      backgroundColor: '#f8fafc',
      borderRadius: 8,
      padding: 12,
      fontSize: 12,
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      color: C.text,
      lineHeight: 1.6,
      overflowX: 'auto' as const,
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-all' as const,
      border: `1px solid ${C.border}`,
      maxHeight: 250,
      overflowY: 'auto' as const,
    }

    return (
      <div>
        {/* Critical warning */}
        {isCritical && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              borderRadius: 8,
              marginBottom: 16,
              border: '1px solid #fecaca',
            }}
          >
            <AlertTriangle size={16} color={C.danger} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.danger }}>
              Critical Action
            </span>
          </div>
        )}

        {/* Badges at top */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <ActionBadge action={log.action} />
          <ModuleBadge module={log.module} />
        </div>

        {/* Info rows */}
        <div style={detailRowStyle}>
          <span style={detailLabelStyle}>{L.timestamp}</span>
          <span style={detailValueStyle}>{formatTimestamp(log.created_at)}</span>
        </div>
        <div style={detailRowStyle}>
          <span style={detailLabelStyle}>{L.user}</span>
          <span style={detailValueStyle}>{log.user_name} ({log.user_id})</span>
        </div>
        <div style={detailRowStyle}>
          <span style={detailLabelStyle}>{L.description}</span>
          <span style={detailValueStyle}>{log.description}</span>
        </div>
        {log.entity_type && (
          <div style={detailRowStyle}>
            <span style={detailLabelStyle}>{L.entityType}</span>
            <span style={detailValueStyle}>{log.entity_type}</span>
          </div>
        )}
        {log.entity_id && (
          <div style={detailRowStyle}>
            <span style={detailLabelStyle}>{L.entityId}</span>
            <span style={{ ...detailValueStyle, fontFamily: 'monospace', fontSize: 12 }}>
              {log.entity_id}
            </span>
          </div>
        )}
        {log.ip_address && (
          <div style={detailRowStyle}>
            <span style={detailLabelStyle}>{L.ipAddress}</span>
            <span style={{ ...detailValueStyle, fontFamily: 'monospace', fontSize: 12 }}>
              {log.ip_address}
            </span>
          </div>
        )}
        {log.device_info && (
          <div style={detailRowStyle}>
            <span style={detailLabelStyle}>{L.deviceInfo}</span>
            <span style={detailValueStyle}>{log.device_info}</span>
          </div>
        )}

        {/* Old / New values diff */}
        {(log.old_value || log.new_value) && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.text,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FileSearch size={15} color={C.primary} />
              {L.changes}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12,
              }}
            >
              {log.old_value && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.danger,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <XCircle size={12} />
                    {L.oldValue}
                  </div>
                  <div style={{ ...jsonBlockStyle, borderColor: '#fecaca' }}>
                    {formatJsonPretty(log.old_value)}
                  </div>
                </div>
              )}
              {log.new_value && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.success,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle size={12} />
                    {L.newValue}
                  </div>
                  <div style={{ ...jsonBlockStyle, borderColor: '#bbf7d0' }}>
                    {formatJsonPretty(log.new_value)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Loading state ───────────────────────────────────────────────────

  if (loading && logs.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 16,
          color: C.textMuted,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: `3px solid ${C.border}`,
            borderTopColor: C.primary,
            borderRadius: '50%',
            animation: 'auditSpin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 14, fontWeight: 500 }}>Loading audit logs...</span>
        <style>{`@keyframes auditSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Main render ─────────────────────────────────────────────────────

  return (
    <div
      style={{
        padding: rv(16, 20, 28),
        backgroundColor: C.bg,
        minHeight: '100vh',
        maxWidth: 1400,
        margin: '0 auto',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 0,
          marginBottom: rv(16, 20, 24),
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: rv(36, 40, 44),
                height: rv(36, 40, 44),
                borderRadius: 12,
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={rv(18, 20, 22)} color="#ffffff" />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: rv(20, 24, 28),
                  fontWeight: 800,
                  color: C.text,
                  letterSpacing: -0.5,
                }}
              >
                {L.title}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: rv(12, 13, 14),
                  color: C.textMuted,
                  fontWeight: 500,
                }}
              >
                {L.subtitle}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredLogs.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: filteredLogs.length === 0
              ? C.border
              : `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            cursor: filteredLogs.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: filteredLogs.length === 0
              ? 'none'
              : '0 2px 8px rgba(100, 116, 139, 0.3)',
          }}
          onMouseEnter={(e) => {
            if (filteredLogs.length > 0) {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 116, 139, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = filteredLogs.length === 0
              ? 'none'
              : '0 2px 8px rgba(100, 116, 139, 0.3)'
          }}
        >
          <Download size={16} />
          {L.export}
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: rv(10, 12, 16),
          marginBottom: rv(16, 20, 24),
        }}
      >
        <StatCard
          icon={Activity}
          label={L.totalActions}
          value={totalActions}
          color={C.primary}
          bg={C.primaryLight}
        />
        <StatCard
          icon={Clock}
          label={L.todayActions}
          value={todayStats.totalActions}
          color={C.info}
          bg={C.infoBg}
        />
        <StatCard
          icon={User}
          label={L.activeUsers}
          value={todayStats.uniqueUsers}
          color={C.emerald}
          bg={C.emeraldBg}
        />
        <StatCard
          icon={AlertTriangle}
          label={L.criticalActions}
          value={criticalTotal}
          color={C.danger}
          bg={C.dangerBg}
        />
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: C.card,
          borderRadius: 12,
          padding: rv(12, 14, 18),
          marginBottom: rv(16, 20, 24),
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Filter header (mobile toggle) */}
        {isMobile && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '6px 0',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: C.text,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: showFilters ? 12 : 0,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} color={C.primary} />
              Filters
            </span>
            <ChevronDown
              size={16}
              color={C.textMuted}
              style={{
                transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        )}

        {/* Filter controls */}
        {(!isMobile || showFilters) && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: rv(8, 10, 12),
              alignItems: 'center',
            }}
          >
            {/* Action filter */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as AuditAction | 'all')}
              style={selectStyle}
            >
              <option value="all">{L.allActions}</option>
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACTION_CONFIG[a].label}
                </option>
              ))}
            </select>

            {/* Module filter */}
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value as AuditModule | 'all')}
              style={selectStyle}
            >
              <option value="all">{L.allModules}</option>
              {ALL_MODULES.map((m) => (
                <option key={m} value={m}>
                  {MODULE_CONFIG[m].label}
                </option>
              ))}
            </select>

            {/* User filter */}
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              style={selectStyle}
            >
              <option value="all">{L.allUsers}</option>
              {uniqueUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Date range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{L.from}</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{L.to}</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Search */}
            <div
              style={{
                position: 'relative',
                flex: isMobile ? '1 1 100%' : '1 1 200px',
                maxWidth: isMobile ? '100%' : 280,
              }}
            >
              <Search
                size={15}
                color={C.textMuted}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={L.searchPlaceholder}
                style={{
                  ...inputStyle,
                  paddingLeft: 34,
                  width: '100%',
                  flex: undefined,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Results count ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          paddingLeft: 4,
          paddingRight: 4,
        }}
      >
        <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>
          {L.showing}{' '}
          <span style={{ color: C.text, fontWeight: 700 }}>{filteredLogs.length}</span>{' '}
          {L.of}{' '}
          <span style={{ color: C.text, fontWeight: 700 }}>{totalActions}</span>{' '}
          {L.logs}
        </span>
        {loading && (
          <span style={{ fontSize: 12, color: C.primary, fontWeight: 500 }}>
            Refreshing...
          </span>
        )}
      </div>

      {/* ── Log table / list ───────────────────────────────────────────── */}
      {filteredLogs.length === 0 ? (
        /* Empty state */
        <div
          style={{
            backgroundColor: C.card,
            borderRadius: 12,
            padding: rv(40, 50, 60),
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: C.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FileSearch size={28} color={C.primary} />
          </div>
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: 18,
              fontWeight: 700,
              color: C.text,
            }}
          >
            {logs.length === 0 ? L.noLogs : L.noResults}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: C.textMuted,
              maxWidth: 360,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.5,
            }}
          >
            {logs.length === 0 ? L.noLogsDesc : L.noResultsDesc}
          </p>
        </div>
      ) : isMobile ? (
        /* Mobile card list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredLogs.map((log) => (
            <LogCard key={log.id} log={log} />
          ))}
        </div>
      ) : (
        /* Desktop table */
        <div
          style={{
            backgroundColor: C.card,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 800,
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: `2px solid ${C.border}`,
                  }}
                >
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {L.timestamp}
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {L.user}
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {L.action}
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {L.module}
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {L.description}
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      width: 60,
                    }}
                  >
                    {L.details}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => (
                  <LogRow key={log.id} log={log} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={!!detailLog}
        onClose={() => setDetailLog(null)}
        title={L.logDetails}
        size="lg"
      >
        {detailLog && <DetailContent log={detailLog} />}
      </Modal>
    </div>
  )
}
