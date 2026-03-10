/**
 * DashboardCustomizer — Panel for toggling/reordering dashboard widgets
 * Opens as a slide-out panel on the right
 */
import { useState } from 'react'
import {
  Settings,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  X,
  Columns,
} from 'lucide-react'
import { useDashboardCustomStore } from '../../stores/dashboardCustomStore'
import type { DashboardWidget } from '../../stores/dashboardCustomStore'
import { useResponsive } from '../../hooks/useLayoutMode'

const C = {
  primary: '#2563eb',
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  danger: '#dc2626',
}

interface Props {
  storeId: string
  userId: string
  labels: Record<string, string>
}

export default function DashboardCustomizer({ storeId, userId, labels }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const { rv } = useResponsive()

  const {
    getLayout,
    toggleWidgetVisibility,
    moveWidget,
    updateWidgetWidth,
    resetLayout,
  } = useDashboardCustomStore()

  const layout = getLayout(storeId, userId)
  const sortedWidgets = [...layout.widgets].sort((a, b) => a.order - b.order)

  const widthLabel = (w: string) => {
    if (w === 'full') return '100%'
    if (w === 'half') return '50%'
    return '33%'
  }

  const nextWidth = (w: string): 'full' | 'half' | 'third' => {
    if (w === 'full') return 'half'
    if (w === 'half') return 'third'
    return 'full'
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 14px',
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          backgroundColor: C.card,
          color: C.textSecondary,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        title={labels.customizeDashboard || 'Customize Dashboard'}
      >
        <Settings size={14} />
        {!rv(false, false, true) ? '' : (labels.customize || 'Customize')}
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 900,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: rv(300, 340, 380),
        backgroundColor: C.bg,
        zIndex: 901,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: C.card,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} color={C.primary} />
            {labels.customizeDashboard || 'Customize Dashboard'}
          </h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => { resetLayout(storeId, userId) }}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.textSecondary,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={labels.resetLayout || 'Reset'}
            >
              <RotateCcw size={12} /> {labels.reset || 'Reset'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: C.textSecondary,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Widget list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {sortedWidgets.map((widget, idx) => (
            <WidgetItem
              key={widget.id}
              widget={widget}
              index={idx}
              total={sortedWidgets.length}
              onToggle={() => toggleWidgetVisibility(storeId, userId, widget.id)}
              onMoveUp={() => moveWidget(storeId, userId, widget.id, 'up')}
              onMoveDown={() => moveWidget(storeId, userId, widget.id, 'down')}
              onChangeWidth={() => updateWidgetWidth(storeId, userId, widget.id, nextWidth(widget.width))}
              widthLabel={widthLabel(widget.width)}
              labels={labels}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ── Widget Item ──────────────────────────────────────────────────
function WidgetItem({
  widget,
  index,
  total,
  onToggle,
  onMoveUp,
  onMoveDown,
  onChangeWidth,
  widthLabel,
  labels,
}: {
  widget: DashboardWidget
  index: number
  total: number
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onChangeWidth: () => void
  widthLabel: string
  labels: Record<string, string>
}) {
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      backgroundColor: C.card,
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      opacity: widget.visible ? 1 : 0.5,
    }}>
      {/* Visibility toggle */}
      <button
        onClick={onToggle}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          color: widget.visible ? C.success : C.textSecondary,
        }}
        title={widget.visible ? (labels.hide || 'Hide') : (labels.show || 'Show')}
      >
        {widget.visible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>

      {/* Title */}
      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.text }}>
        {(labels as Record<string, string>)[`widget_${widget.type}`] || widget.title}
      </div>

      {/* Width toggle */}
      <button
        onClick={onChangeWidth}
        style={{
          padding: '2px 6px',
          borderRadius: 4,
          border: `1px solid ${C.border}`,
          backgroundColor: '#f1f5f9',
          color: C.textSecondary,
          fontSize: 10,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
        title={labels.changeWidth || 'Change width'}
      >
        <Columns size={10} /> {widthLabel}
      </button>

      {/* Move buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          style={{
            background: 'none',
            border: 'none',
            cursor: index === 0 ? 'default' : 'pointer',
            padding: 1,
            color: index === 0 ? '#e2e8f0' : C.textSecondary,
          }}
        >
          <ChevronUp size={12} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          style={{
            background: 'none',
            border: 'none',
            cursor: index === total - 1 ? 'default' : 'pointer',
            padding: 1,
            color: index === total - 1 ? '#e2e8f0' : C.textSecondary,
          }}
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  )
}
