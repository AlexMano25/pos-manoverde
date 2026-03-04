import { useState } from 'react'
import type { ElementType } from 'react'
import {
  FileText,
  ClipboardCheck,
  Wrench,
  Receipt,
  UserCheck,
  Plane,
  Shield,
  GraduationCap,
  ShieldCheck,
  ShoppingBag,
  Handshake,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContractShortcutsProps = {
  templates: Array<{ key: string; label: string; icon: string }>
  title: string
  onSelectTemplate: (templateKey: string) => void
}

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, ElementType> = {
  ClipboardCheck,
  FileText,
  Wrench,
  Receipt,
  UserCheck,
  Plane,
  Shield,
  GraduationCap,
  ShieldCheck,
  ShoppingBag,
  Handshake,
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const colors = {
  primary: '#2563eb',
  card: '#ffffff',
  text: '#1e293b',
  border: '#e2e8f0',
  hoverBg: '#eff6ff',
} as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ContractShortcuts = ({ templates, title, onSelectTemplate }: ContractShortcutsProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <FileText size={18} color={colors.primary} />
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {templates.map((tpl, idx) => {
          const IconComp = ICON_MAP[tpl.icon]
          const isHovered = hoveredIdx === idx

          return (
            <button
              key={tpl.key}
              onClick={() => onSelectTemplate(tpl.key)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                backgroundColor: isHovered ? colors.hoverBg : colors.card,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {IconComp && <IconComp size={16} color={colors.primary} />}
              <span style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>
                {tpl.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ContractShortcuts
