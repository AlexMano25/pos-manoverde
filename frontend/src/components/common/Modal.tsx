import React, { useCallback, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const colors = {
  cardBg: '#ffffff',
  textPrimary: '#1e293b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  background: '#f1f5f9',
} as const

// ---------------------------------------------------------------------------
// Size map (max-width)
// ---------------------------------------------------------------------------

const sizeMap: Record<NonNullable<ModalProps['size']>, number> = {
  sm: 400,
  md: 560,
  lg: 760,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // ── Close on Escape ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll while modal is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // ── Focus trap ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !contentRef.current) return

    const focusableSelectors =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const focusableElements = contentRef.current.querySelectorAll(
      focusableSelectors
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length === 0) return

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Auto-focus the first focusable element
    firstFocusable.focus()

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    document.addEventListener('keydown', trapFocus)
    return () => document.removeEventListener('keydown', trapFocus)
  }, [isOpen])

  // ── Close on backdrop click ─────────────────────────────────────────────
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        animation: 'modalFadeIn 0.2s ease-out',
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          width: '100%',
          maxWidth: sizeMap[size],
          maxHeight: 'calc(100vh - 32px)',
          backgroundColor: colors.cardBg,
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.25s ease-out',
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          <h2
            id="modal-title"
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: colors.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: colors.textMuted,
              flexShrink: 0,
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background
              e.currentTarget.style.color = colors.textPrimary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = colors.textMuted
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
          }}
        >
          {children}
        </div>
      </div>

      {/* ── CSS keyframes ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (max-width: 767px) {
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      `}</style>
    </div>
  )
}

export default Modal
