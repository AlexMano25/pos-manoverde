import React, { useState, useMemo } from 'react'
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
  Search,
  Beer,
  Croissant,
  Hotel,
  Scissors,
  Sparkles,
  Dumbbell,
  Waves,
  Car,
  Fuel,
  WashingMachine,
  Wrench,
  Baby,
  GraduationCap,
  Home,
  Flower2,
  PawPrint,
  BookOpen,
  Printer as PrinterIcon,
  Building2,
  Plane,
  Globe,
  MonitorSmartphone,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import type { Activity, Mode } from '../types'
import { generateUUID } from '../utils/uuid'
import { goToLanding } from '../utils/navigation'

type Step = 1 | 2 | 3

// ── Activity icon mapping ────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<Activity, React.ElementType> = {
  restaurant: UtensilsCrossed,
  supermarket: ShoppingBasket,
  pharmacy: Pill,
  fashion: Shirt,
  electronics: Smartphone,
  services: Briefcase,
  bar: Beer,
  bakery: Croissant,
  hotel: Hotel,
  hair_salon: Scissors,
  spa: Sparkles,
  gym: Dumbbell,
  pool: Waves,
  car_wash: Car,
  gas_station: Fuel,
  laundry: WashingMachine,
  auto_repair: Wrench,
  daycare: Baby,
  school: GraduationCap,
  home_cleaning: Home,
  florist: Flower2,
  pet_shop: PawPrint,
  bookstore: BookOpen,
  printing: PrinterIcon,
  real_estate: Building2,
  travel_agency: Plane,
}

// ── Ordered activities list ──────────────────────────────────────────────────

const ALL_ACTIVITIES: Activity[] = [
  'restaurant', 'supermarket', 'pharmacy', 'fashion', 'electronics', 'services',
  'bar', 'bakery', 'hotel', 'hair_salon', 'spa', 'gym',
  'pool', 'car_wash', 'gas_station', 'laundry', 'auto_repair',
  'daycare', 'school', 'home_cleaning', 'florist', 'pet_shop',
  'bookstore', 'printing', 'real_estate', 'travel_agency',
]

export default function SetupPage() {
  const [step, setStep] = useState<Step>(1)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null)
  const [serverUrlInput, setServerUrlInput] = useState('')
  const [storeNameInput, setStoreNameInput] = useState('')
  const [activitySearch, setActivitySearch] = useState('')

  const { setActivity, setMode, setServerUrl, setCurrentStore, setSection } = useAppStore()
  const { t } = useLanguageStore()

  // ── Filter activities ──────────────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    if (!activitySearch.trim()) return ALL_ACTIVITIES
    const q = activitySearch.toLowerCase()
    return ALL_ACTIVITIES.filter((a) => {
      const label = (t.setup[a as keyof typeof t.setup] || a).toLowerCase()
      const desc = (t.setup[`${a}Desc` as keyof typeof t.setup] || '').toLowerCase()
      return label.includes(q) || desc.includes(q) || a.includes(q)
    })
  }, [activitySearch, t.setup])

  const handleFinish = () => {
    if (!selectedActivity || !selectedMode) return

    setActivity(selectedActivity)
    setMode(selectedMode)

    if (selectedMode === 'client' && serverUrlInput) {
      setServerUrl(serverUrlInput.replace(/\/+$/, ''))
    }

    if ((selectedMode === 'server' || selectedMode === 'all_in_one') && storeNameInput) {
      const store = {
        id: generateUUID(),
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
      // server and all_in_one both need store name
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
    maxWidth: 720,
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '24px 24px 0',
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

  const dotsContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: 10,
    maxHeight: 420,
    overflowY: 'auto',
    paddingRight: 4,
  }

  const tileStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '16px 12px',
    borderRadius: 12,
    border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  })

  const tileIconStyle = (isSelected: boolean): React.CSSProperties => ({
    color: isSelected ? '#2563eb' : '#64748b',
  })

  const tileLabelStyle = (isSelected: boolean): React.CSSProperties => ({
    fontSize: 13,
    fontWeight: 600,
    color: isSelected ? '#2563eb' : '#1e293b',
    margin: 0,
    lineHeight: 1.3,
  })

  const tileDescStyle: React.CSSProperties = {
    fontSize: 10,
    color: '#94a3b8',
    margin: 0,
    lineHeight: 1.3,
  }

  const modeGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
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

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px 10px 38px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    marginBottom: 12,
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
    if (step === 1) return t.setup.chooseActivity
    if (step === 2) return t.setup.chooseMode
    return t.setup.configure
  }

  const getStepDesc = (): string => {
    if (step === 1) return t.setup.activitySubtitle
    if (step === 2) return t.setup.modeSubtitle
    if (selectedMode === 'client') return t.setup.configureServer
    return t.setup.storeName
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Back to website link */}
        <div style={{ padding: '12px 24px 0', textAlign: 'left' }}>
          <button
            onClick={goToLanding}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: 0,
            }}
          >
            <Globe size={14} />
            {t.setup.backToWebsite}
          </button>
        </div>

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
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>
            {t.setup.step} {step} {t.setup.of} 3
          </span>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {/* Step 1: Activity */}
          {step === 1 && (
            <div>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                <input
                  style={searchInputStyle}
                  type="text"
                  placeholder={t.setup.searchActivities}
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
              <div style={gridStyle}>
                {filteredActivities.map((actKey) => {
                  const Icon = ACTIVITY_ICONS[actKey]
                  const label = t.setup[actKey as keyof typeof t.setup] || actKey
                  const desc = t.setup[`${actKey}Desc` as keyof typeof t.setup] || ''
                  return (
                    <div
                      key={actKey}
                      style={tileStyle(selectedActivity === actKey)}
                      onClick={() => setSelectedActivity(actKey)}
                    >
                      <div style={tileIconStyle(selectedActivity === actKey)}>
                        <Icon size={24} />
                      </div>
                      <p style={tileLabelStyle(selectedActivity === actKey)}>{label}</p>
                      <p style={tileDescStyle}>{desc}</p>
                    </div>
                  )
                })}
                {filteredActivities.length === 0 && (
                  <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: 20 }}>
                    {t.common.noData}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Mode */}
          {step === 2 && (
            <div style={modeGridStyle}>
              <div
                style={modeTileStyle(selectedMode === 'server')}
                onClick={() => setSelectedMode('server')}
              >
                <div style={tileIconStyle(selectedMode === 'server')}><Server size={28} /></div>
                <p style={tileLabelStyle(selectedMode === 'server')}>{t.setup.serverMode}</p>
                <p style={modeDescStyle}>{t.setup.serverModeDesc}</p>
              </div>
              <div
                style={modeTileStyle(selectedMode === 'client')}
                onClick={() => setSelectedMode('client')}
              >
                <div style={tileIconStyle(selectedMode === 'client')}><Monitor size={28} /></div>
                <p style={tileLabelStyle(selectedMode === 'client')}>{t.setup.clientMode}</p>
                <p style={modeDescStyle}>{t.setup.clientModeDesc}</p>
              </div>
              <div
                style={modeTileStyle(selectedMode === 'all_in_one')}
                onClick={() => setSelectedMode('all_in_one')}
              >
                <div style={tileIconStyle(selectedMode === 'all_in_one')}><MonitorSmartphone size={28} /></div>
                <p style={tileLabelStyle(selectedMode === 'all_in_one')}>{t.setup.allInOne}</p>
                <p style={modeDescStyle}>{t.setup.allInOneDesc}</p>
              </div>
            </div>
          )}

          {/* Step 3: Configure */}
          {step === 3 && (
            <div>
              {selectedMode === 'client' ? (
                <div>
                  <label style={labelStyle}>{t.auth.serverUrl}</label>
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
                    {t.setup.serverUrlHint}
                  </p>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>{t.setup.storeName}</label>
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
                    {t.setup.storeNameHint}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button
            style={{
              ...backButtonStyle,
              visibility: step === 1 ? 'hidden' : 'visible',
            }}
            onClick={() => setStep((s) => (s > 1 ? (s - 1) as Step : s))}
          >
            <ArrowLeft size={16} /> {t.common.back}
          </button>

          {step < 3 ? (
            <button
              style={nextButtonStyle}
              onClick={() => canGoNext() && setStep((s) => (s + 1) as Step)}
              disabled={!canGoNext()}
            >
              {t.common.next} <ArrowRight size={16} />
            </button>
          ) : (
            <button
              style={{ ...nextButtonStyle, backgroundColor: canGoNext() ? '#16a34a' : '#94a3b8' }}
              onClick={() => canGoNext() && handleFinish()}
              disabled={!canGoNext()}
            >
              <Check size={16} /> {t.common.finish}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
