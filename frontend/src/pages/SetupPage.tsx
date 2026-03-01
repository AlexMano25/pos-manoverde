import React, { useState } from 'react'
import {
  UtensilsCrossed,
  ShoppingBasket,
  Pill,
  Shirt,
  Smartphone,
  Briefcase,
  Server,
  Monitor,
  ArrowLeft,
  ArrowRight,
  Check,
  Store,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import type { Activity, Mode } from '../types'

type Step = 1 | 2 | 3

const activities: { key: Activity; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'restaurant', label: 'Restaurant', icon: <UtensilsCrossed size={28} />, desc: 'Restaurants, bars, cafes' },
  { key: 'supermarket', label: 'Supermarche', icon: <ShoppingBasket size={28} />, desc: 'Epiceries, superettes' },
  { key: 'pharmacy', label: 'Pharmacie', icon: <Pill size={28} />, desc: 'Pharmacies, parapharmacies' },
  { key: 'fashion', label: 'Mode', icon: <Shirt size={28} />, desc: 'Vetements, accessoires' },
  { key: 'electronics', label: 'Electronique', icon: <Smartphone size={28} />, desc: 'High-tech, telephonie' },
  { key: 'services', label: 'Services', icon: <Briefcase size={28} />, desc: 'Prestations de services' },
]

const modes: { key: Mode; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    key: 'server',
    label: 'Mode Serveur',
    icon: <Server size={28} />,
    desc: 'Terminal principal. Gere les produits, employes et la base de donnees locale. Ideal pour le poste principal.',
  },
  {
    key: 'client',
    label: 'Mode Client',
    icon: <Monitor size={28} />,
    desc: 'Terminal de caisse. Se connecte a un serveur sur le reseau local pour synchroniser les donnees. Ideal pour les postes secondaires.',
  },
]

export default function SetupPage() {
  const [step, setStep] = useState<Step>(1)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)
  const [serverUrlInput, setServerUrlInput] = useState('')
  const [storeNameInput, setStoreNameInput] = useState('')

  const { setActivity, setMode, setServerUrl, setCurrentStore, setSection } = useAppStore()

  const handleFinish = () => {
    if (!selectedActivity || !selectedMode) return

    setActivity(selectedActivity)
    setMode(selectedMode)

    if (selectedMode === 'client' && serverUrlInput) {
      setServerUrl(serverUrlInput.replace(/\/+$/, ''))
    }

    if (selectedMode === 'server' && storeNameInput) {
      const store = {
        id: crypto.randomUUID(),
        name: storeNameInput,
        address: '',
        phone: '',
        activity: selectedActivity,
        currency: 'XAF',
        tax_rate: 19.25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setCurrentStore(store)
    }

    setSection('login')
  }

  const canGoNext = (): boolean => {
    if (step === 1) return selectedActivity !== null
    if (step === 2) return selectedMode !== null
    if (step === 3) {
      if (selectedMode === 'client') return serverUrlInput.trim().length > 0
      return storeNameInput.trim().length > 0
    }
    return false
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: 640,
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '32px 24px 0',
  }

  const logoContainerStyle: React.CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  }

  const stepTitleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 4px',
  }

  const stepDescStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  }

  // Step dots
  const dotsContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    padding: '20px 0',
  }

  const dotStyle = (isActive: boolean, isComplete: boolean): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: isComplete ? '#16a34a' : isActive ? '#2563eb' : '#e2e8f0',
    transition: 'background-color 0.2s',
  })

  const contentStyle: React.CSSProperties = {
    padding: '0 24px 24px',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
  }

  const tileStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '20px 16px',
    borderRadius: 12,
    border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  })

  const tileIconStyle = (isSelected: boolean): React.CSSProperties => ({
    color: isSelected ? '#2563eb' : '#64748b',
  })

  const tileLabelStyle = (isSelected: boolean): React.CSSProperties => ({
    fontSize: 14,
    fontWeight: 600,
    color: isSelected ? '#2563eb' : '#1e293b',
    margin: 0,
  })

  const tileDescStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#94a3b8',
    margin: 0,
  }

  const modeGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  }

  const modeTileStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '24px 20px',
    borderRadius: 12,
    border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  })

  const modeDescStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    marginTop: 8,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: '#1e293b',
  }

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
  }

  const backButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#64748b',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    visibility: step === 1 ? 'hidden' : 'visible',
  }

  const nextButtonStyle: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: canGoNext() ? '#2563eb' : '#94a3b8',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: canGoNext() ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'background-color 0.2s',
  }

  const getStepTitle = (): string => {
    if (step === 1) return 'Type d\'activite'
    if (step === 2) return 'Mode de fonctionnement'
    return 'Configuration'
  }

  const getStepDesc = (): string => {
    if (step === 1) return 'Choisissez votre secteur d\'activite'
    if (step === 2) return 'Comment souhaitez-vous utiliser ce terminal ?'
    if (selectedMode === 'client') return 'Configurez la connexion au serveur'
    return 'Donnez un nom a votre magasin'
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={logoContainerStyle}>
            <Store size={28} color="#ffffff" />
          </div>
          <h2 style={stepTitleStyle}>{getStepTitle()}</h2>
          <p style={stepDescStyle}>{getStepDesc()}</p>
        </div>

        {/* Step Dots */}
        <div style={dotsContainerStyle}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={dotStyle(s === step, s < step)} />
          ))}
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {/* Step 1: Activity */}
          {step === 1 && (
            <div style={gridStyle}>
              {activities.map((a) => (
                <div
                  key={a.key}
                  style={tileStyle(selectedActivity === a.key)}
                  onClick={() => setSelectedActivity(a.key)}
                >
                  <div style={tileIconStyle(selectedActivity === a.key)}>{a.icon}</div>
                  <p style={tileLabelStyle(selectedActivity === a.key)}>{a.label}</p>
                  <p style={tileDescStyle}>{a.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Mode */}
          {step === 2 && (
            <div style={modeGridStyle}>
              {modes.map((m) => (
                <div
                  key={m.key}
                  style={modeTileStyle(selectedMode === m.key)}
                  onClick={() => setSelectedMode(m.key)}
                >
                  <div style={tileIconStyle(selectedMode === m.key)}>{m.icon}</div>
                  <p style={tileLabelStyle(selectedMode === m.key)}>{m.label}</p>
                  <p style={modeDescStyle}>{m.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Configure */}
          {step === 3 && (
            <div>
              {selectedMode === 'client' ? (
                <div>
                  <label style={labelStyle}>URL du serveur</label>
                  <input
                    style={inputStyle}
                    type="url"
                    placeholder="http://192.168.1.100:3000/api"
                    value={serverUrlInput}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                    autoFocus
                  />
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                    Entrez l'adresse IP et le port du serveur POS sur votre reseau local.
                  </p>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Nom du magasin</label>
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="Ex: Mano Verde Douala"
                    value={storeNameInput}
                    onChange={(e) => setStoreNameInput(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                    autoFocus
                  />
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                    Ce nom apparaitra sur les reçus et dans l'application.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button
            style={backButtonStyle}
            onClick={() => setStep((s) => (s > 1 ? (s - 1) as Step : s))}
          >
            <ArrowLeft size={16} /> Retour
          </button>

          {step < 3 ? (
            <button
              style={nextButtonStyle}
              onClick={() => canGoNext() && setStep((s) => (s + 1) as Step)}
              disabled={!canGoNext()}
            >
              Suivant <ArrowRight size={16} />
            </button>
          ) : (
            <button
              style={{ ...nextButtonStyle, backgroundColor: canGoNext() ? '#16a34a' : '#94a3b8' }}
              onClick={() => canGoNext() && handleFinish()}
              disabled={!canGoNext()}
            >
              <Check size={16} /> Terminer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
