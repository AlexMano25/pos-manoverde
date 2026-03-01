import React, { useState, useRef, useEffect } from 'react'
import { Download, Share2, MessageCircle, Mail, ChevronDown, FileText } from 'lucide-react'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
} as const

// ── Types ────────────────────────────────────────────────────────────────

export interface ExportMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  divider?: boolean
}

interface ExportMenuProps {
  items: ExportMenuItem[]
  label?: string
}

// ── Component ────────────────────────────────────────────────────────────

export default function ExportMenu({ items, label = 'Export' }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── Styles ─────────────────────────────────────────────────────────────

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
  }

  const triggerStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    backgroundColor: C.card,
    color: C.text,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    backgroundColor: C.card,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    minWidth: 200,
    zIndex: 50,
    overflow: 'hidden',
    padding: '4px 0',
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    fontSize: 13,
    color: C.text,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s',
  }

  const dividerStyle: React.CSSProperties = {
    height: 1,
    backgroundColor: C.border,
    margin: '4px 0',
  }

  return (
    <div ref={menuRef} style={wrapperStyle}>
      <button style={triggerStyle} onClick={() => setOpen(!open)}>
        <Download size={14} />
        {label}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={dropdownStyle}>
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.divider && <div style={dividerStyle} />}
              <button
                style={itemStyle}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {item.icon || <FileText size={14} color={C.textSecondary} />}
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

// Re-export icons for convenience
export { Download, Share2, MessageCircle, Mail, FileText }
