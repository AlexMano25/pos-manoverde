import { useState } from 'react'
import {
  ShoppingCart,
  Plus,
  ClipboardList,
  AlertTriangle,
  Search,
  FileText,
  Calendar,
  CheckSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuickActionsProps = {
  actions: Array<{ label: string; icon: string; targetSection: string }>
  onNavigate: (section: string) => void
  title?: string
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const colors = {
  primary: '#2563eb',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
} as const

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const iconMap: Record<string, LucideIcon> = {
  ShoppingCart,
  Plus,
  ClipboardList,
  AlertTriangle,
  Search,
  FileText,
  Calendar,
  CheckSquare,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const QuickActions = ({ actions, onNavigate, title }: QuickActionsProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        {title || 'Actions rapides'}
      </span>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {actions.map((action, idx) => {
          const IconComponent = iconMap[action.icon]
          const isHovered = hoveredIdx === idx

          return (
            <button
              key={action.targetSection}
              onClick={() => onNavigate(action.targetSection)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                backgroundColor: isHovered ? '#f8fafc' : colors.card,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {IconComponent && (
                <IconComponent size={16} color={colors.primary} />
              )}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: colors.text,
                  whiteSpace: 'nowrap',
                }}
              >
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActions
