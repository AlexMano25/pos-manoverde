import { useState, useEffect, useCallback } from 'react'
import type { ElementType } from 'react'
import type { ContractTemplate } from '../../types'
import { generateContractPdf } from '../../utils/contractPdfExport'
import {
  X,
  Download,
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

type ContractModalProps = {
  isOpen: boolean
  onClose: () => void
  template: ContractTemplate | null
  storeName: string
  storeAddress?: string
  storePhone?: string
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
  textSecondary: '#64748b',
  border: '#e2e8f0',
  danger: '#dc2626',
} as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ContractModal = ({
  isOpen,
  onClose,
  template,
  storeName,
  storeAddress,
  storePhone,
}: ContractModalProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({})

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      const initial: Record<string, string> = {}
      template.fields.forEach(f => {
        initial[f.key] = ''
      })
      setFormData(initial)
    }
  }, [template])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen || !template) return null

  const IconComp = ICON_MAP[template.icon]

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    generateContractPdf(template, formData, storeName, storeAddress, storePhone)
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 14,
    color: colors.text,
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {IconComp && <IconComp size={20} color={colors.primary} />}
            <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
              {template.i18nKey}
            </span>
          </div>
          <button
            onClick={onClose}
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
              color: colors.textSecondary,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {template.fields.map(field => (
            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>
                {field.i18nKey}
                {field.required && (
                  <span style={{ color: colors.danger, marginLeft: 2 }}>*</span>
                )}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={formData[field.key] ?? ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  required={field.required}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[field.key] ?? ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  required={field.required}
                  style={inputStyle}
                >
                  <option value="">—</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.key] ?? ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  required={field.required}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: colors.primary,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={16} />
            {`G\u00e9n\u00e9rer le PDF`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContractModal
