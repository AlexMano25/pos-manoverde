import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useLayoutMode } from '../../hooks/useLayoutMode'

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: layoutMode === 'mobile' ? 'column' : 'row',
        minHeight: '100vh',
        backgroundColor: colors.background,
      }}
    >
      {/* Sidebar (desktop: left column, mobile: fixed bottom bar) */}
      <Sidebar />

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0, // prevent flex overflow
          ...(layoutMode === 'tablet' ? { marginLeft: 64 } : {}),
          ...(layoutMode === 'mobile' ? { paddingBottom: 72 } : {}),
        }}
      >
        {/* Topbar */}
        <Topbar title={title} subtitle={subtitle}>
          {actions}
        </Topbar>

        {/* Scrollable content */}
        <main
          style={{
            flex: 1,
            padding: layoutMode === 'mobile' ? '16px 12px 80px' : '24px',
            overflowY: 'auto',
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
