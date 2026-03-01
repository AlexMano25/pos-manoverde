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
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useAuthStore } from '../../stores/authStore'
import { useSyncStore } from '../../stores/syncStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavItem = {
  key: string
  label: string
  icon: React.ElementType
  serverOnly?: boolean // hidden when mode === 'client'
}

// ---------------------------------------------------------------------------
// Navigation definition
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'pos', label: 'Caisse', icon: ShoppingCart },
  { key: 'products', label: 'Produits', icon: Package },
  { key: 'orders', label: 'Commandes', icon: ClipboardList },
  { key: 'stock', label: 'Stock', icon: BarChart3 },
  { key: 'employees', label: 'Employes', icon: Users, serverOnly: true },
  { key: 'settings', label: 'Parametres', icon: Settings, serverOnly: true },
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
      return '#7c3aed' // purple-600
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

  // ── Filter nav items by mode ────────────────────────────────────────────
  const visibleItems = NAV_ITEMS.filter(
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
              <span style={{ fontSize: 10, lineHeight: 1 }}>{item.label}</span>
              {/* Sync badge on the sync-related section or first icon */}
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
              <span>{item.label}</span>
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
          <span>Synchroniser</span>
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
        <span>
          {connectionStatus === 'online'
            ? 'En ligne'
            : connectionStatus === 'local-only'
              ? 'Local uniquement'
              : 'Hors ligne'}
        </span>
        {connectionStatus === 'online' ? (
          <Wifi size={14} style={{ marginLeft: 'auto' }} />
        ) : (
          <WifiOff size={14} style={{ marginLeft: 'auto' }} />
        )}
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
            {user?.name ?? 'Utilisateur'}
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
          title="Deconnexion"
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
