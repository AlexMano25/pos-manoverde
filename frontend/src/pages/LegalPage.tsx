import { useEffect } from 'react'
import { getLegalDocuments, type LegalDocType } from '../data/legalDocuments'
import { useLanguageStore } from '../stores/languageStore'

/**
 * Public legal page accessible without authentication.
 * Routes: /privacy (RGPD), /terms (CGV+Terms)
 */
export default function LegalPage({ type }: { type: 'privacy' | 'terms' }) {
  const { language } = useLanguageStore()
  const docs = getLegalDocuments(language)

  // Map URL type to legal doc type
  const docType: LegalDocType = type === 'privacy' ? 'rgpd' : 'terms'
  const doc = docs[docType]

  // Also show CGV on terms page
  const cgvDoc = type === 'terms' ? docs['cgv'] : null

  useEffect(() => {
    document.title = `${doc.title} - POS Mano Verde`
    window.scrollTo(0, 0)
  }, [doc.title])

  const renderDoc = (d: typeof doc) => (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
        {d.title}
      </h1>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 32px' }}>
        Derniere mise a jour : {d.lastUpdated}
      </p>
      {d.sections.map((section, idx) => (
        <div key={idx} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>
            {section.title}
          </h2>
          {section.content.map((paragraph, pIdx) => (
            <p
              key={pIdx}
              style={{
                fontSize: 15,
                lineHeight: 1.8,
                color: '#475569',
                margin: '0 0 10px',
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      ))}
    </>
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '40px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: '40px 32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header with logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            MV
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>POS Mano Verde</span>
        </div>

        {renderDoc(doc)}

        {cgvDoc && (
          <>
            <div style={{ height: 2, backgroundColor: '#e2e8f0', margin: '40px 0' }} />
            {renderDoc(cgvDoc)}
          </>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Mano Verde SA - Douala, Cameroun
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <a
              href="/privacy"
              style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}
            >
              Politique de confidentialite
            </a>
            <a
              href="/terms"
              style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}
            >
              Conditions d'utilisation
            </a>
            <a
              href="/"
              style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}
            >
              Accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
