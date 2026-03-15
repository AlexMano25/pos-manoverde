import React, { useState } from 'react'
import { Delete, X, ToggleLeft } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useLayoutMode } from '../../hooks/useLayoutMode'
import type { VKMode } from '../../hooks/useVirtualKeyboard'

// ---------------------------------------------------------------------------
// VirtualKeyboard — Touch-friendly on-screen keyboard for POS page
// Two modes: numeric (quantities/prices) and alphanumeric (search)
// ---------------------------------------------------------------------------

interface VirtualKeyboardProps {
  mode: VKMode
  visible: boolean
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
  onConfirm: () => void
  onClose: () => void
  onToggleMode: () => void
}

// Prevent default to keep input focus when pressing keyboard buttons
const pd = (e: React.MouseEvent | React.TouchEvent) => e.preventDefault()

export default function VirtualKeyboard({
  mode,
  visible,
  onKeyPress,
  onBackspace,
  onClear,
  onConfirm,
  onClose,
  onToggleMode,
}: VirtualKeyboardProps) {
  const [shifted, setShifted] = useState(false)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const layoutMode = useLayoutMode()

  const sidebarOffset =
    layoutMode === 'desktop' ? (sidebarCollapsed ? 64 : 260) : layoutMode === 'tablet' ? 64 : 0

  // ── Colors ──────────────────────────────────────────────────────────────
  const C = {
    bg: '#f8fafc',
    keyBg: '#ffffff',
    keyBgAction: '#e2e8f0',
    keyBgPrimary: '#2563eb',
    keyText: '#1e293b',
    keyTextAction: '#475569',
    keyTextPrimary: '#ffffff',
    border: '#cbd5e1',
    shadow: '0 1px 3px rgba(0,0,0,0.08)',
  }

  // ── Key style builder ───────────────────────────────────────────────────
  const keyStyle = (
    variant: 'normal' | 'action' | 'primary' | 'danger' = 'normal',
    flex = 1
  ): React.CSSProperties => ({
    flex,
    minHeight: 48,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    backgroundColor:
      variant === 'primary'
        ? C.keyBgPrimary
        : variant === 'danger'
          ? '#ef4444'
          : variant === 'action'
            ? C.keyBgAction
            : C.keyBg,
    color:
      variant === 'primary' || variant === 'danger'
        ? C.keyTextPrimary
        : variant === 'action'
          ? C.keyTextAction
          : C.keyText,
    fontSize: variant === 'action' ? 13 : 18,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: C.shadow,
    transition: 'background-color 0.1s, transform 0.1s',
  })

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    marginBottom: 6,
  }

  // ── Numeric layout ──────────────────────────────────────────────────────
  const renderNumeric = () => (
    <>
      <div style={rowStyle}>
        <button style={keyStyle()} onMouseDown={pd} onClick={() => onKeyPress('7')}>7</button>
        <button style={keyStyle()} onMouseDown={pd} onClick={() => onKeyPress('8')}>8</button>
        <button style={keyStyle()} onMouseDown={pd} onClick={() => onKeyPress('9')}>9</button>
        <button style={keyStyle('action')} onMouseDown={pd} onClick={onBackspace}><Delete size={20} /></button>
      </div>
      <div style={rowStyle}>
        <button style={keyStyle()} onMouseDown={pd} onClick={() => onKeyPress('4')}>4</button>
        <button style={keyStyle()} onMouseDown={pd} onClick={() => onKeyPress('5')}>5</button>
        <button style={keyStyle()} onMouseDown={pd} onClick={() => onKeyPress('6')}>6</button>
        <button style={keyStyle('action')} onMouseDown={pd} onClick={() => onKeyPress('.')}>.</button>
      </div>
      <div style={rowStyle}>
        <button style={keyStyle()} onMouseDown={pd} onClick={() => onKeyPress('1')}>1</button>
        <button style={keyStyle()} onMouseDown={pd} onClick={() => onKeyPress('2')}>2</button>
        <button style={keyStyle()} onMouseDown={pd} onClick={() => onKeyPress('3')}>3</button>
        <button style={keyStyle('danger')} onMouseDown={pd} onClick={onClear}>C</button>
      </div>
      <div style={rowStyle}>
        <button style={{ ...keyStyle(), flex: 2 }} onMouseDown={pd} onClick={() => onKeyPress('0')}>0</button>
        <button style={keyStyle()} onMouseDown={pd} onClick={() => onKeyPress('00')}>00</button>
        <button style={keyStyle('primary')} onMouseDown={pd} onClick={onConfirm}>OK</button>
      </div>
    </>
  )

  // ── Alpha layout ────────────────────────────────────────────────────────
  const alphaRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ]

  const renderAlphanumeric = () => (
    <>
      {alphaRows.map((row, ri) => (
        <div key={ri} style={{ ...rowStyle, justifyContent: ri === 1 ? 'center' : 'stretch' }}>
          {ri === 2 && (
            <button
              style={{ ...keyStyle(shifted ? 'primary' : 'action'), flex: 1.3 }}
              onMouseDown={pd}
              onClick={() => setShifted(!shifted)}
            >
              {shifted ? 'ABC' : 'abc'}
            </button>
          )}
          {row.map((key) => (
            <button
              key={key}
              style={keyStyle()}
              onMouseDown={pd}
              onClick={() => onKeyPress(shifted ? key : key.toLowerCase())}
            >
              {shifted ? key : key.toLowerCase()}
            </button>
          ))}
          {ri === 2 && (
            <button style={{ ...keyStyle('action'), flex: 1.3 }} onMouseDown={pd} onClick={onBackspace}>
              <Delete size={18} />
            </button>
          )}
        </div>
      ))}
      <div style={rowStyle}>
        <button style={{ ...keyStyle('action'), flex: 1.2 }} onMouseDown={pd} onClick={onToggleMode}>
          123
        </button>
        <button style={{ ...keyStyle(), flex: 4 }} onMouseDown={pd} onClick={() => onKeyPress(' ')}>
          espace
        </button>
        <button style={keyStyle('action')} onMouseDown={pd} onClick={() => onKeyPress('.')}>.</button>
        <button style={{ ...keyStyle('primary'), flex: 1.2 }} onMouseDown={pd} onClick={onConfirm}>
          OK
        </button>
      </div>
    </>
  )

  // ── Container ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: sidebarOffset,
        right: 0,
        backgroundColor: C.bg,
        borderTop: '2px solid #e2e8f0',
        padding: '8px 12px 12px',
        zIndex: 100,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.25s ease, left 0.2s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          padding: '0 4px',
        }}
      >
        <button
          onMouseDown={pd}
          onClick={onToggleMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            color: C.keyTextAction,
            cursor: 'pointer',
          }}
        >
          <ToggleLeft size={14} />
          {mode === 'numeric' ? '123' : 'ABC'}
        </button>
        <button
          onMouseDown={pd}
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: C.keyTextAction,
            padding: 4,
            borderRadius: 4,
            display: 'flex',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Keyboard body */}
      <div style={{ maxWidth: mode === 'numeric' ? 320 : '100%', margin: mode === 'numeric' ? '0 auto' : undefined }}>
        {mode === 'numeric' ? renderNumeric() : renderAlphanumeric()}
      </div>
    </div>
  )
}
