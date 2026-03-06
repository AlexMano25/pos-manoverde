import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useLayoutMode } from '../../hooks/useLayoutMode'
import { useAppStore } from '../../stores/appStore'
import { ACTIVITY_WALLPAPERS } from '../../data/activityThemes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  /** Optional action buttons rendered in the Topbar right section */
  actions?: React.ReactNode
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const colors = {
  background: '#f1f5f9',
} as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const layoutMode = useLayoutMode()
  const { currentStore, activity } = useAppStore()
  const currentActivity = activity || currentStore?.activity
  const wallpaperUrl = currentActivity ? ACTIVITY_WALLPAPERS[currentActivity] : undefined

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: layoutMode === 'mobile' ? 'column' : 'row',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: colors.background,
        position: 'relative',
      }}
    >
      {/* Activity wallpaper — subtle background */}
      {wallpaperUrl && (
        <div
          style={{
            backgroundImage: `url(${wallpaperUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'absolute',
            inset: 0,
            opacity: 0.07,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Sidebar (desktop: left column, mobile: fixed bottom bar) */}
      <Sidebar />

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,    // prevent flex overflow on x-axis
          minHeight: 0,   // allow flex child to shrink for scroll
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          ...(layoutMode === 'tablet' ? { marginLeft: 64 } : {}),
          ...(layoutMode === 'mobile' ? { paddingBottom: 72 } : {}),
        }}
      >
        {/* Topbar */}
        <Topbar title={title} subtitle={subtitle}>
          {actions}
        </Topbar>

        {/* Scrollable content — vertical & horizontal */}
        <main
          style={{
            flex: 1,
            minHeight: 0,  // critical: allow flex child to scroll
            padding: layoutMode === 'mobile' ? '16px 12px 80px' : '24px',
            overflowY: 'auto',
            overflowX: 'auto',
            backgroundColor: colors.background,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
