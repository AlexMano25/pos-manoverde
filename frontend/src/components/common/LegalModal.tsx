import { useEffect } from 'react'
import { X } from 'lucide-react'
import { LEGAL_DOCUMENTS, type LegalDocType } from '../../data/legalDocuments'

interface LegalModalProps {
  documentType: LegalDocType
  onClose: () => void
  onAccept?: () => void
}

export default function LegalModal({ documentType, onClose, onAccept }: LegalModalProps) {
  const doc = LEGAL_DOCUMENTS[documentType]

  // Prevent body scroll when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          maxWidth: 700,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 16,
          padding: 32,
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.3,
              }}
            >
              {doc.title}
            </h2>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: '#94a3b8',
              }}
            >
              Derniere mise a jour : {doc.lastUpdated}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              transition: 'background-color 0.2s, color 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9'
              e.currentTarget.style.color = '#0f172a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: '#e2e8f0',
            marginBottom: 24,
          }}
        />

        {/* Sections */}
        {doc.sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 28 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#1e293b',
                margin: '0 0 12px',
              }}
            >
              {section.title}
            </h3>
            {section.content.map((paragraph, pIdx) => (
              <p
                key={pIdx}
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: '#475569',
                  margin: '0 0 10px',
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        ))}

        {/* Footer buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: onAccept ? 'space-between' : 'flex-end',
            alignItems: 'center',
            marginTop: 32,
            paddingTop: 20,
            borderTop: '1px solid #e2e8f0',
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc'
              e.currentTarget.style.borderColor = '#cbd5e1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.borderColor = '#e2e8f0'
            }}
          >
            Fermer
          </button>
          {onAccept && (
            <button
              onClick={onAccept}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#15803d'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#16a34a'
              }}
            >
              J'accepte
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
