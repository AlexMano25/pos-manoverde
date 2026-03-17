import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { getHelpForPage } from '../../data/helpContent'
import type { HelpSection, PageHelp } from '../../data/helpContent'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HelpPanelProps {
  isOpen: boolean
  onClose: () => void
  pageKey: string
  /** Optional: filter content by the current user's role */
  userRole?: 'admin' | 'manager' | 'cashier' | 'stock' | 'super_admin' | 'agent'
}

// ---------------------------------------------------------------------------
// Color palette (consistent with project design system)
// ---------------------------------------------------------------------------

const colors = {
  primary: '#2563eb',
  primaryLight: '#eff6ff',
  primaryDark: '#1d4ed8',
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  cardBg: '#ffffff',
  background: '#f8fafc',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  backdrop: 'rgba(15, 23, 42, 0.45)',
} as const

// ---------------------------------------------------------------------------
// Role label helper
// ---------------------------------------------------------------------------

function roleLabel(role: string): string {
  switch (role) {
    case 'admin':
      return 'Administrateur'
    case 'manager':
      return 'Manager'
    case 'cashier':
      return 'Caissier'
    case 'stock':
      return 'Gestionnaire stock'
    default:
      return 'Tous'
  }
}

function roleBadgeColor(role: string): { bg: string; text: string } {
  switch (role) {
    case 'admin':
      return { bg: '#ede9fe', text: '#7c3aed' }
    case 'manager':
      return { bg: colors.primaryLight, text: colors.primary }
    case 'cashier':
      return { bg: colors.successBg, text: colors.success }
    default:
      return { bg: colors.borderLight, text: colors.textSecondary }
  }
}

// ---------------------------------------------------------------------------
// Subcomponent: Collapsible Section
// ---------------------------------------------------------------------------

const HelpSectionBlock: React.FC<{
  section: HelpSection
  defaultOpen?: boolean
}> = ({ section, defaultOpen = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultOpen)
  const Chevron = isExpanded ? ChevronDown : ChevronRight

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.cardBg,
        overflow: 'hidden',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Section header */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '12px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 14,
          fontWeight: 600,
          color: colors.textPrimary,
          lineHeight: 1.4,
        }}
      >
        {section.icon && (
          <span style={{ fontSize: 16, flexShrink: 0 }}>{section.icon}</span>
        )}
        <span style={{ flex: 1 }}>{section.title}</span>

        {/* Role badge */}
        {section.role && section.role !== 'all' && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: roleBadgeColor(section.role).bg,
              color: roleBadgeColor(section.role).text,
              flexShrink: 0,
            }}
          >
            {roleLabel(section.role)}
          </span>
        )}

        <Chevron
          size={16}
          style={{
            color: colors.textMuted,
            flexShrink: 0,
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {/* Section content */}
      {isExpanded && (
        <div
          style={{
            padding: '0 14px 14px',
            fontSize: 13,
            lineHeight: 1.7,
            color: colors.textSecondary,
            whiteSpace: 'pre-line',
            borderTop: `1px solid ${colors.borderLight}`,
            paddingTop: 12,
          }}
        >
          {section.content}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subcomponent: FAQ Accordion
// ---------------------------------------------------------------------------

const FAQItem: React.FC<{
  question: string
  answer: string
}> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      style={{
        borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          width: '100%',
          padding: '10px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 13,
          fontWeight: 600,
          color: colors.textPrimary,
          lineHeight: 1.5,
        }}
      >
        <span
          style={{
            color: colors.primary,
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
            marginTop: -1,
          }}
        >
          Q
        </span>
        <span style={{ flex: 1 }}>{question}</span>
        {isOpen ? (
          <ChevronDown size={14} style={{ color: colors.textMuted, flexShrink: 0, marginTop: 2 }} />
        ) : (
          <ChevronRight size={14} style={{ color: colors.textMuted, flexShrink: 0, marginTop: 2 }} />
        )}
      </button>

      {isOpen && (
        <div
          style={{
            paddingLeft: 22,
            paddingBottom: 10,
            fontSize: 13,
            lineHeight: 1.6,
            color: colors.textSecondary,
          }}
        >
          {answer}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component: HelpPanel
// ---------------------------------------------------------------------------

const HelpPanel: React.FC<HelpPanelProps> = ({
  isOpen,
  onClose,
  pageKey,
  userRole,
}) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // ── Load help content ───────────────────────────────────────────────────
  const helpData: PageHelp = getHelpForPage(pageKey)

  // ── Filter sections by role ─────────────────────────────────────────────
  const filteredSections = helpData.sections.filter((section) => {
    if (!userRole) return true
    if (!section.role || section.role === 'all') return true
    // Admin sees everything
    if (userRole === 'admin') return true
    // Manager sees manager content
    if (userRole === 'manager') return section.role === 'manager'
    // Others see only their own role
    return section.role === userRole
  })

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
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // ── Close on backdrop click ─────────────────────────────────────────────
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose()
    }
  }

  // ── Determine active tab ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'guide' | 'tips' | 'faq'>('guide')

  // Reset to guide tab when page changes
  useEffect(() => {
    setActiveTab('guide')
  }, [pageKey])

  if (!isOpen) return null

  // ── Tab rendering logic ─────────────────────────────────────────────────
  const tabs: { key: 'guide' | 'tips' | 'faq'; label: string; count?: number }[] = [
    { key: 'guide', label: 'Guide' },
    { key: 'tips', label: 'Astuces', count: helpData.tips.length },
    { key: 'faq', label: 'FAQ', count: helpData.faq.length },
  ]

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: colors.backdrop,
        animation: 'helpBackdropFadeIn 0.2s ease-out',
      }}
    >
      {/* ── Panel ────────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-panel-title"
        style={{
          width: '100%',
          maxWidth: 420,
          height: '100%',
          backgroundColor: colors.background,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.12)',
          animation: 'helpPanelSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            backgroundColor: colors.cardBg,
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          {/* Help icon circle */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: colors.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary,
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ?
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="help-panel-title"
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: colors.textPrimary,
                lineHeight: 1.3,
              }}
            >
              Aide
            </h2>
            <div
              style={{
                fontSize: 12,
                color: colors.textMuted,
                marginTop: 1,
                fontWeight: 500,
              }}
            >
              {helpData.pageTitle}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer l'aide"
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
              e.currentTarget.style.backgroundColor = colors.borderLight
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

        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            padding: '0 20px',
            backgroundColor: colors.cardBg,
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? colors.primary : colors.textSecondary,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: isActive
                    ? `2px solid ${colors.primary}`
                    : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'color 0.15s, border-color 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      backgroundColor: isActive
                        ? colors.primaryLight
                        : colors.borderLight,
                      color: isActive ? colors.primary : colors.textMuted,
                      borderRadius: 10,
                      padding: '1px 6px',
                      minWidth: 18,
                      textAlign: 'center',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Scrollable content ──────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
          }}
        >
          {/* ── TAB: Guide ────────────────────────────────────────────── */}
          {activeTab === 'guide' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Overview */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: colors.primaryLight,
                  border: `1px solid ${colors.primary}20`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.primary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  Apercu
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: colors.textPrimary,
                  }}
                >
                  {helpData.overview}
                </div>
              </div>

              {/* Sections */}
              {filteredSections.map((section, idx) => (
                <HelpSectionBlock
                  key={idx}
                  section={section}
                  defaultOpen={idx === 0}
                />
              ))}
            </div>
          )}

          {/* ── TAB: Tips ─────────────────────────────────────────────── */}
          {activeTab === 'tips' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                Astuces et bonnes pratiques
              </div>
              {helpData.tips.map((tip, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: colors.warningBg,
                      color: colors.warning,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: colors.textSecondary,
                    }}
                  >
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB: FAQ ──────────────────────────────────────────────── */}
          {activeTab === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: 12,
                }}
              >
                Questions frequentes
              </div>
              {helpData.faq.map((item, idx) => (
                <FAQItem
                  key={idx}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${colors.border}`,
            backgroundColor: colors.cardBg,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: colors.textMuted,
            }}
          >
            POS Mano Verde - Aide v1.0
          </span>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: colors.primary,
              backgroundColor: colors.primaryLight,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dbeafe'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryLight
            }}
          >
            Fermer
          </button>
        </div>
      </div>

      {/* ── CSS keyframes ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes helpBackdropFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes helpPanelSlideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @media (max-width: 480px) {
          /* Full width on small mobile */
        }
      `}</style>
    </div>
  )
}

export default HelpPanel
