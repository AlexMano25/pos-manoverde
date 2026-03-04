import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe,
  UtensilsCrossed,
  Briefcase,
  CalendarCheck,
  BedDouble,
  Receipt,
  Home,
  FileText,
  GraduationCap,
  BookOpen,
  Plane,
  Map,
  Heart,
  Sparkles,
  UserCheck,
  Wrench,
  Cog,
  Calendar,
  MoreHorizontal,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useAuthStore } from '../../stores/authStore'
import { useSyncStore } from '../../stores/syncStore'
import { useLanguageStore } from '../../stores/languageStore'
import { goToLanding } from '../../utils/navigation'
import { SIDEBAR_CONFIG } from '../../data/sidebarConfig'
import { useLayoutMode } from '../../hooks/useLayoutMode'
import { resolveI18nKey } from '../../utils/i18nResolve'
import LanguageSelector from '../common/LanguageSelector'
import StoreSwitcher from './StoreSwitcher'

import type { SidebarItemConfig, Activity } from '../../types'

// ---------------------------------------------------------------------------
// Icon map: string name -> Lucide component
// ---------------------------------------------------------------------------

const SIDEBAR_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  UtensilsCrossed,
  Briefcase,
  CalendarCheck,
  BedDouble,
  Receipt,
  Home,
  FileText,
  GraduationCap,
  BookOpen,
  Plane,
  Globe,
  Map,
  Heart,
  Sparkles,
  UserCheck,
  Wrench,
  Cog,
  Calendar,
  MoreHorizontal,
}

// ---------------------------------------------------------------------------
// Helper: get sidebar items for an activity (with fallback)
// ---------------------------------------------------------------------------

function getSidebarItems(activity: Activity | null | undefined): SidebarItemConfig[] {
  if (!activity) return SIDEBAR_CONFIG.supermarket // safe default
  return SIDEBAR_CONFIG[activity] ?? SIDEBAR_CONFIG.supermarket
}

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
// Constants
// ---------------------------------------------------------------------------

const DESKTOP_WIDTH = 260
const TABLET_COLLAPSED = 64
const TABLET_EXPANDED = 240
const MOBILE_BAR_HEIGHT = 64
const MOBILE_MAX_ITEMS = 4
const TRANSITION_SPEED = '0.2s'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Sidebar: React.FC = () => {
  const { section, setSection, mode, activity, currentStore, connectionStatus } = useAppStore()
  const { user, logout } = useAuthStore()
  const { pendingCount, isSyncing, syncToServer, countPending } = useSyncStore()
  const { t } = useLanguageStore()

  const layoutMode = useLayoutMode()

  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [tabletExpanded, setTabletExpanded] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  // ── Count pending on mount ──────────────────────────────────────────────
  useEffect(() => {
    countPending()
  }, [countPending])

  // ── Close mobile "more" panel when switching to a non-mobile layout ─────
  useEffect(() => {
    if (layoutMode !== 'mobile') setMoreOpen(false)
  }, [layoutMode])

  // ── Sync handler ────────────────────────────────────────────────────────
  const handleSync = useCallback(() => {
    if (!isSyncing) syncToServer()
  }, [isSyncing, syncToServer])

  // ── RBAC + mode filtering ──────────────────────────────────────────────
  const visibleItems = useMemo(() => {
    const items = getSidebarItems(activity || currentStore?.activity)
    return items.filter((item) => {
      // Client mode: only show POS-like sections (cashier-accessible)
      if (mode === 'client') return item.allowedRoles?.includes('cashier') ?? false
      // Server-only items hidden in non-server modes
      if (item.serverOnly && mode !== 'server' && mode !== 'all_in_one') return false
      // Role filter
      if (item.allowedRoles && user?.role) {
        return item.allowedRoles.includes(user.role)
      }
      return true // no role restriction = everyone sees it
    })
  }, [activity, currentStore?.activity, mode, user?.role])

  // ── Section validation on activity change ──────────────────────────────
  useEffect(() => {
    const currentActivity = activity || currentStore?.activity
    if (!currentActivity) return
    const sectionExists = visibleItems.some((item) => item.section === section)
    if (!sectionExists) {
      setSection('dashboard')
    }
  }, [activity, currentStore?.activity, visibleItems, section, setSection])

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

  // ── Resolve label from i18nKey ──────────────────────────────────────────
  const getLabel = (item: SidebarItemConfig): string => {
    return resolveI18nKey(t as unknown as Record<string, unknown>, item.i18nKey)
  }

  // ── Resolve icon component from string name ────────────────────────────
  const getIcon = (item: SidebarItemConfig): React.ElementType => {
    return SIDEBAR_ICONS[item.icon] || LayoutDashboard
  }

  // ── Handle nav click ───────────────────────────────────────────────────
  const handleNavClick = (sectionKey: string) => {
    setSection(sectionKey)
    setMoreOpen(false)
  }

  // =====================================================================
  // MOBILE: Bottom navigation bar
  // =====================================================================
  if (layoutMode === 'mobile') {
    const priorityItems = visibleItems.slice(0, MOBILE_MAX_ITEMS)
    const overflowItems = visibleItems.slice(MOBILE_MAX_ITEMS)
    const hasOverflow = overflowItems.length > 0

    return (
      <>
        {/* ── "More" overlay panel ─────────────────────────────────────── */}
        {moreOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setMoreOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1100,
                transition: `opacity ${TRANSITION_SPEED}`,
              }}
            />
            {/* Slide-up panel */}
            <div
              style={{
                position: 'fixed',
                bottom: MOBILE_BAR_HEIGHT,
                left: 0,
                right: 0,
                backgroundColor: colors.sidebarBg,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: '20px 16px',
                zIndex: 1200,
                animation: 'slideUp 0.25s ease-out',
                maxHeight: '60vh',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                {overflowItems.map((item) => {
                  const Icon = getIcon(item)
                  const isActive = section === item.section
                  return (
                    <button
                      key={item.section}
                      onClick={() => handleNavClick(item.section)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: isActive ? colors.sidebarActive : 'transparent',
                        border: isActive ? `1px solid ${colors.primary}` : '1px solid transparent',
                        borderRadius: 12,
                        cursor: 'pointer',
                        color: isActive ? colors.white : colors.sidebarText,
                        padding: '14px 8px',
                        minHeight: 72,
                      }}
                    >
                      <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                      <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, lineHeight: 1.2, textAlign: 'center' }}>
                        {getLabel(item)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Bottom bar ───────────────────────────────────────────────── */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: MOBILE_BAR_HEIGHT,
            backgroundColor: colors.sidebarBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 1000,
            borderTop: `1px solid ${colors.sidebarActive}`,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {priorityItems.map((item) => {
            const Icon = getIcon(item)
            const isActive = section === item.section
            return (
              <button
                key={item.section}
                onClick={() => handleNavClick(item.section)}
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
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                <span style={{ fontSize: 10, lineHeight: 1, fontWeight: isActive ? 600 : 400 }}>
                  {getLabel(item)}
                </span>
                {item.section === 'dashboard' && pendingCount > 0 && (
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

          {/* "More" button */}
          {hasOverflow && (
            <button
              onClick={() => setMoreOpen((v) => !v)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: moreOpen ? colors.primary : colors.textMuted,
                padding: '8px 4px',
                minWidth: 44,
              }}
            >
              <MoreHorizontal size={20} />
              <span style={{ fontSize: 10, lineHeight: 1 }}>
                {resolveI18nKey(t as unknown as Record<string, unknown>, 'nav.more') !== 'nav.more'
                  ? resolveI18nKey(t as unknown as Record<string, unknown>, 'nav.more')
                  : 'More'}
              </span>
            </button>
          )}
        </nav>

        {/* ── CSS keyframes ───────────────────────────────────────────── */}
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </>
    )
  }

  // =====================================================================
  // TABLET: Collapsed 64px sidebar, expands to 240px on hover
  // =====================================================================
  if (layoutMode === 'tablet') {
    const sidebarWidth = tabletExpanded ? TABLET_EXPANDED : TABLET_COLLAPSED
    const showLabels = tabletExpanded

    return (
      <aside
        onMouseEnter={() => setTabletExpanded(true)}
        onMouseLeave={() => setTabletExpanded(false)}
        style={{
          width: sidebarWidth,
          minHeight: '100vh',
          backgroundColor: colors.sidebarBg,
          display: 'flex',
          flexDirection: 'column',
          color: colors.sidebarText,
          userSelect: 'none',
          flexShrink: 0,
          transition: `width ${TRANSITION_SPEED} ease`,
          overflow: 'hidden',
        }}
      >
        {/* ── Brand logo ──────────────────────────────────────────────── */}
        <div
          style={{
            padding: showLabels ? '24px 20px 16px' : '24px 0 16px',
            borderBottom: `1px solid ${colors.sidebarActive}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: showLabels ? 'flex-start' : 'center',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontSize: showLabels ? 28 : 20,
              fontWeight: 800,
              color: colors.primary,
              letterSpacing: -0.5,
              lineHeight: 1,
              transition: `font-size ${TRANSITION_SPEED}`,
            }}
          >
            POS
          </div>
          {showLabels && (
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
          )}
        </div>

        {/* ── Store switcher ──────────────────────────────────────────── */}
        {showLabels && (
          <div style={{ padding: '12px 12px 0' }}>
            <StoreSwitcher />
          </div>
        )}

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {visibleItems.map((item) => {
            const Icon = getIcon(item)
            const isActive = section === item.section
            const isHovered = hoveredItem === item.section
            return (
              <button
                key={item.section}
                onClick={() => handleNavClick(item.section)}
                onMouseEnter={() => setHoveredItem(item.section)}
                onMouseLeave={() => setHoveredItem(null)}
                title={!showLabels ? getLabel(item) : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: showLabels ? '10px 20px' : '10px 0',
                  justifyContent: showLabels ? 'flex-start' : 'center',
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
                  transition: `background-color 0.15s, color 0.15s, padding ${TRANSITION_SPEED}`,
                  borderRadius: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                {showLabels && <span>{getLabel(item)}</span>}
              </button>
            )
          })}
        </nav>

        {/* ── Sync indicator ──────────────────────────────────────────── */}
        <div
          style={{
            padding: showLabels ? '8px 20px' : '8px 0',
            borderTop: `1px solid ${colors.sidebarActive}`,
          }}
        >
          <button
            onClick={handleSync}
            title={!showLabels ? t.sidebar.synchronize : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 0',
              justifyContent: showLabels ? 'flex-start' : 'center',
              background: 'none',
              border: 'none',
              cursor: isSyncing ? 'wait' : 'pointer',
              color: colors.sidebarText,
              fontSize: 13,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            <RefreshCw
              size={16}
              style={{
                animation: isSyncing ? 'spin 1s linear infinite' : 'none',
                flexShrink: 0,
              }}
            />
            {showLabels && <span>{t.sidebar.synchronize}</span>}
            {showLabels && pendingCount > 0 && (
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
            {!showLabels && pendingCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: 8,
                  backgroundColor: colors.warning,
                  color: colors.sidebarBg,
                  fontSize: 9,
                  fontWeight: 700,
                  borderRadius: 10,
                  minWidth: 16,
                  height: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Connection status ─────────────────────────────────────── */}
        <div
          style={{
            padding: showLabels ? '8px 20px' : '8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: showLabels ? 'flex-start' : 'center',
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
          {showLabels && <span>{connectionLabel()}</span>}
          {showLabels &&
            (connectionStatus === 'online' ? (
              <Wifi size={14} style={{ marginLeft: 'auto' }} />
            ) : (
              <WifiOff size={14} style={{ marginLeft: 'auto' }} />
            ))}
        </div>

        {/* ── Back to website ──────────────────────────────────────── */}
        {showLabels && (
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
        )}

        {/* ── Language selector ─────────────────────────────────────── */}
        {showLabels && (
          <div style={{ padding: '8px 20px' }}>
            <LanguageSelector />
          </div>
        )}

        {/* ── User info + Logout ──────────────────────────────────── */}
        <div
          style={{
            padding: showLabels ? '16px 20px' : '16px 0',
            borderTop: `1px solid ${colors.sidebarActive}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: showLabels ? 'flex-start' : 'center',
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

          {showLabels && (
            <>
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
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.danger)}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>

        {/* ── CSS keyframes ───────────────────────────────────────────── */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </aside>
    )
  }

  // =====================================================================
  // DESKTOP: Full 260px sidebar with icons + text labels
  // =====================================================================
  return (
    <aside
      style={{
        width: DESKTOP_WIDTH,
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

      {/* ── Store switcher ──────────────────────────────────────────────── */}
      <div style={{ padding: '12px 12px 0' }}>
        <StoreSwitcher />
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {visibleItems.map((item) => {
          const Icon = getIcon(item)
          const isActive = section === item.section
          const isHovered = hoveredItem === item.section
          return (
            <button
              key={item.section}
              onClick={() => handleNavClick(item.section)}
              onMouseEnter={() => setHoveredItem(item.section)}
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
              <span>{getLabel(item)}</span>
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

      {/* ── Back to website ────────────────────────────────────────────── */}
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

      {/* ── Language selector ───────────────────────────────────────────── */}
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
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.danger)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
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
