import React, { useCallback, useEffect, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import HelpPanel from './HelpPanel'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HelpButtonProps {
  /** Key identifying the current page (e.g. 'pos', 'dashboard', 'products') */
  pageKey: string
  /** Optional: current user's role to filter help content */
  userRole?: 'admin' | 'manager' | 'cashier' | 'stock' | 'super_admin'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HELP_SEEN_KEY = 'pos_help_button_seen'
const BUTTON_SIZE = 48

const colors = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#eff6ff',
  white: '#ffffff',
  shadow: 'rgba(37, 99, 235, 0.35)',
  shadowHover: 'rgba(37, 99, 235, 0.5)',
} as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HelpButton: React.FC<HelpButtonProps> = ({ pageKey, userRole }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [shouldPulse, setShouldPulse] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // ── First-visit pulse animation ─────────────────────────────────────────
  useEffect(() => {
    try {
      const seen = localStorage.getItem(HELP_SEEN_KEY)
      if (!seen) {
        setShouldPulse(true)
      }
    } catch {
      // localStorage not available, skip pulse
    }
  }, [])

  const markAsSeen = useCallback(() => {
    try {
      localStorage.setItem(HELP_SEEN_KEY, 'true')
    } catch {
      // Silently fail
    }
    setShouldPulse(false)
  }, [])

  // ── Responsive check ────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Open / Close handlers ───────────────────────────────────────────────
  const handleOpen = useCallback(() => {
    setIsPanelOpen(true)
    markAsSeen()
  }, [markAsSeen])

  const handleClose = useCallback(() => {
    setIsPanelOpen(false)
  }, [])

  // ── Position: above mobile nav (64px) on small screens ──────────────────
  const bottomOffset = isMobile ? 64 + 16 : 24

  return (
    <>
      {/* ── Floating Button ──────────────────────────────────────────── */}
      <button
        onClick={handleOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Ouvrir l'aide contextuelle"
        title="Aide"
        style={{
          position: 'fixed',
          bottom: bottomOffset,
          right: 24,
          zIndex: 9000,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isHovered ? colors.primaryHover : colors.primary,
          color: colors.white,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isHovered
            ? `0 6px 20px ${colors.shadowHover}`
            : `0 4px 14px ${colors.shadow}`,
          transition: 'background-color 0.2s, box-shadow 0.2s, transform 0.2s',
          transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          animation: shouldPulse ? 'helpButtonPulse 2s ease-in-out infinite' : 'none',
          // Prevent overlap with safe area on iOS
          marginBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
        }}
      >
        <HelpCircle size={22} strokeWidth={2.2} />
      </button>

      {/* ── Pulse ring (first visit only) ────────────────────────────── */}
      {shouldPulse && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            bottom: bottomOffset,
            right: 24,
            zIndex: 8999,
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: '50%',
            border: `2px solid ${colors.primary}`,
            animation: 'helpButtonRing 2s ease-in-out infinite',
            pointerEvents: 'none',
            marginBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
          }}
        />
      )}

      {/* ── Help Panel ───────────────────────────────────────────────── */}
      <HelpPanel
        isOpen={isPanelOpen}
        onClose={handleClose}
        pageKey={pageKey}
        userRole={userRole}
      />

      {/* ── CSS keyframes ────────────────────────────────────────────── */}
      <style>{`
        @keyframes helpButtonPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }
        @keyframes helpButtonRing {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}

export default HelpButton
