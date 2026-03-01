import React, { useCallback, useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useAuthStore } from '../../stores/authStore'
import { useSyncStore } from '../../stores/syncStore'
import { useLanguageStore } from '../../stores/languageStore'
import { goToLanding } from '../../utils/navigation'
import LanguageSelector from '../common/LanguageSelector'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavItemDef = {
  key: string
  icon: React.ElementType
  serverOnly?: boolean
}

// ---------------------------------------------------------------------------
// Navigation definition (labels come from translations)
// ---------------------------------------------------------------------------

const NAV_ITEM_DEFS: NavItemDef[] = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'pos', icon: ShoppingCart },
  { key: 'products', icon: Package },
  { key: 'orders', icon: ClipboardList },
  { key: 'stock', icon: BarChart3 },
  { key: 'employees', icon: Users, serverOnly: true },
  { key: 'settings', icon: Settings, serverOnly: true },
]

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const colors = {
  sidebarBg: '#0f172a',
  sidebarText: '#e2e8f0',
  sidebarActive: '#1e293b',
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  textMuted: '#94a3b8',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  white: '#ffffff',
  border: '#e2e8f0',
} as const

// ---------------------------------------------------------------------------
// Connection status dot color
// ---------------------------------------------------------------------------

function connectionDotColor(status: string): string {
  switch (status) {
    case 'online':
      return colors.success
    case 'local-only':
      return colors.warning
    default:
      return colors.danger
  }
}

// ---------------------------------------------------------------------------
// Role badge color
// ---------------------------------------------------------------------------

function roleBadgeBg(role: string): string {
  switch (role) {
    case 'admin':
      return '#7c3aed'
    case 'manager':
      return colors.primary
    case 'cashier':
      return colors.success
    case 'stock':
      return colors.warning
    default:
      return colors.textMuted
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Sidebar: React.FC = () => {
  const { section, setSection, mode, connectionStatus } = useAppStore()
  const { user, logout } = useAuthStore()
  const { pendingCount, isSyncing, syncToServer, countPending } = useSyncStore()
  const { t } = useLanguageStore()
  const [isMobile, setIsMobile] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // ── Responsive check ────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Count pending on mount ──────────────────────────────────────────────
  useEffect(() => {
    countPending()
  }, [countPending])

  // ── Sync handler ────────────────────────────────────────────────────────
  const handleSync = useCallback(() => {
    if (!isSyncing) {
      syncToServer()
    }
  }, [isSyncing, syncToServer])

  // ── Nav labels from translations ────────────────────────────────────────
  const navLabels: Record<string, string> = {
    dashboard: t.nav.dashboard,
    pos: t.nav.pos,
    products: t.nav.products,
    orders: t.nav.orders,
    stock: t.nav.stock,
    employees: t.nav.employees,
    settings: t.nav.settings,
  }

  // ── Connection label ───────────────────────────────────────────────────
  const connectionLabel = (): string => {
    switch (connectionStatus) {
      case 'online':
        return t.sidebar.online
      case 'local-only':
        return t.sidebar.localOnly
      default:
        return t.sidebar.offline
    }
  }

  // ── Filter nav items by mode ────────────────────────────────────────────
  const visibleItems = NAV_ITEM_DEFS.filter(
    (item) => !item.serverOnly || mode !== 'client'
  )

  // =======================================================================
  // Mobile: horizontal bottom bar
  // =======================================================================
  if (isMobile) {
    return (
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: colors.sidebarBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 1000,
          borderTop: `1px solid ${colors.sidebarActive}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = section === item.key
          return (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? colors.primary : colors.textMuted,
                padding: '8px 4px',
                minWidth: 44,
                position: 'relative',
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 10, lineHeight: 1 }}>{navLabels[item.key] || item.key}</span>
              {item.key === 'dashboard' && pendingCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: colors.warning,
                    color: colors.white,
                    fontSize: 9,
                    fontWeight: 700,
                    borderRadius: 10,
                    minWidth: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    )
  }

  // =======================================================================
  // Desktop: vertical sidebar
  // =======================================================================
  return (
    <aside
      style={{
        width: 260,
        minHeight: '100vh',
        backgroundColor: colors.sidebarBg,
        display: 'flex',
        flexDirection: 'column',
        color: colors.sidebarText,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* ── Brand logo ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '24px 20px 16px',
          borderBottom: `1px solid ${colors.sidebarActive}`,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: colors.primary,
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          POS
        </div>
        <div
          style={{
            fontSize: 13,
            color: colors.textMuted,
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          Mano Verde
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = section === item.key
          const isHovered = hoveredItem === item.key
          return (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              onMouseEnter={() => setHoveredItem(item.key)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? colors.white : colors.sidebarText,
                backgroundColor: isActive
                  ? colors.sidebarActive
                  : isHovered
                    ? 'rgba(255,255,255,0.04)'
                    : 'transparent',
                border: 'none',
                borderLeft: isActive
                  ? `3px solid ${colors.primary}`
                  : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s, color 0.15s',
                borderRadius: 0,
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{navLabels[item.key] || item.key}</span>
            </button>
          )
        })}
      </nav>

      {/* ── Sync indicator ──────────────────────────────────────────────── */}
      <div
        style={{
          padding: '8px 20px',
          borderTop: `1px solid ${colors.sidebarActive}`,
        }}
      >
        <button
          onClick={handleSync}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px 0',
            background: 'none',
            border: 'none',
            cursor: isSyncing ? 'wait' : 'pointer',
            color: colors.sidebarText,
            fontSize: 13,
          }}
        >
          <RefreshCw
            size={16}
            style={{
              animation: isSyncing ? 'spin 1s linear infinite' : 'none',
            }}
          />
          <span>{t.sidebar.synchronize}</span>
          {pendingCount > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                backgroundColor: colors.warning,
                color: colors.sidebarBg,
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Connection status ───────────────────────────────────────────── */}
      <div
        style={{
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: colors.textMuted,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: connectionDotColor(connectionStatus),
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span>{connectionLabel()}</span>
        {connectionStatus === 'online' ? (
          <Wifi size={14} style={{ marginLeft: 'auto' }} />
        ) : (
          <WifiOff size={14} style={{ marginLeft: 'auto' }} />
        )}
      </div>

      {/* ── Back to website ──────────────────────────────────────────── */}
      <div style={{ padding: '4px 20px 8px' }}>
        <button
          onClick={goToLanding}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '8px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            fontSize: 12,
          }}
        >
          <Globe size={14} />
          <span>{t.sidebar.backToWebsite}</span>
        </button>
      </div>

      {/* ── Language selector ─────────────────────────────────────────── */}
      <div style={{ padding: '8px 20px' }}>
        <LanguageSelector />
      </div>

      {/* ── User info + Logout ──────────────────────────────────────────── */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.sidebarActive}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Avatar circle */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: colors.sidebarActive,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: colors.primary,
            flexShrink: 0,
          }}
        >
          {user?.name
            ? user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            : '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.white,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.name ?? t.common.welcome}
          </div>
          {user?.role && (
            <span
              style={{
                display: 'inline-block',
                marginTop: 2,
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: colors.white,
                backgroundColor: roleBadgeBg(user.role),
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              {user.role}
            </span>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          title={t.sidebar.disconnect}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            padding: 4,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = colors.danger)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = colors.textMuted)
          }
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* ── CSS keyframes for spinner (injected once) ───────────────────── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </aside>
  )
}

export default Sidebar
