import React, { useState, useMemo } from 'react'
import {
  UtensilsCrossed,
  ShoppingBasket,
  Pill,
  Shirt,
  Smartphone,
  Briefcase,
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
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Zap,
} from 'lucide-react'
import LegalModal from '../components/common/LegalModal'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { goToLanding } from '../utils/navigation'
import { formatCurrency } from '../utils/currency'
import type { Activity, BillingCycle, SubscriptionPlan } from '../types'

// ── Activity icon mapping (same as SetupPage) ───────────────────────────────

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

// ── Ordered activities list (same as SetupPage) ─────────────────────────────

const ALL_ACTIVITIES: Activity[] = [
  'restaurant', 'supermarket', 'pharmacy', 'fashion', 'electronics', 'services',
  'bar', 'bakery', 'hotel', 'hair_salon', 'spa', 'gym',
  'pool', 'car_wash', 'gas_station', 'laundry', 'auto_repair',
  'daycare', 'school', 'home_cleaning', 'florist', 'pet_shop',
  'bookstore', 'printing', 'real_estate', 'travel_agency',
]

// ── Plan pricing ────────────────────────────────────────────────────────────

const PLAN_PRICES: Record<SubscriptionPlan, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 9900, yearly: 8250 },
  pro: { monthly: 29900, yearly: 24917 },
  enterprise: { monthly: 0, yearly: 0 },
  pay_as_you_grow: { monthly: 0, yearly: 0 },
}

function formatPrice(amount: number): string {
  return formatCurrency(amount, 'XAF')
}

// ── Payment methods ─────────────────────────────────────────────────────────

type PaymentOption = {
  id: string
  icon: React.ElementType
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'orange_money', icon: Smartphone },
  { id: 'mtn_money', icon: Smartphone },
  { id: 'carte_bancaire', icon: CreditCard },
]

// ── Types ───────────────────────────────────────────────────────────────────

type RegistrationStep = 1 | 2 | 3 | 4 | 5

// ── Component ───────────────────────────────────────────────────────────────

export default function RegistrationPage() {
  const [step, setStep] = useState<RegistrationStep>(1)

  // Step 1: Plan
  const { selectedPlan, setMode, setRegistrationMode, setShowLogin } = useAppStore()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

  // Step 2: Organization
  const [orgName, setOrgName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')

  // Step 3: Activity & Store
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activitySearch, setActivitySearch] = useState('')
  const [storeName, setStoreName] = useState('')
  const [selectedMode, setSelectedMode] = useState<'server' | 'client' | 'all_in_one'>('all_in_one')

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<string>('')

  // Step 5: Account
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [legalModal, setLegalModal] = useState<'cgv' | 'rgpd' | 'terms' | null>(null)

  // Global
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register } = useAuthStore()
  const { t } = useLanguageStore()

  const plan = selectedPlan || 'free'
  const prices = PLAN_PRICES[plan]
  const currentPrice = billingCycle === 'monthly' ? prices.monthly : prices.yearly

  // ── Filter activities ───────────────────────────────────────────────────

  const filteredActivities = useMemo(() => {
    if (!activitySearch.trim()) return ALL_ACTIVITIES
    const q = activitySearch.toLowerCase()
    return ALL_ACTIVITIES.filter((a) => {
      const label = (t.setup[a as keyof typeof t.setup] || a).toLowerCase()
      const desc = (t.setup[`${a}Desc` as keyof typeof t.setup] || '').toLowerCase()
      return label.includes(q) || desc.includes(q) || a.includes(q)
    })
  }, [activitySearch, t.setup])

  // ── Validation ──────────────────────────────────────────────────────────

  const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const canGoNext = (): boolean => {
    if (step === 1) return true
    if (step === 2) {
      return (
        orgName.trim().length > 0 &&
        ownerName.trim().length > 0 &&
        ownerEmail.trim().length > 0 &&
        isValidEmail(ownerEmail) &&
        ownerPhone.trim().length > 0
      )
    }
    if (step === 3) return selectedActivity !== null && storeName.trim().length > 0
    if (step === 4) return plan === 'free' || plan === 'pay_as_you_grow' || paymentMethod.length > 0
    if (step === 5) {
      return (
        password.length >= 6 &&
        password === confirmPassword &&
        termsAccepted
      )
    }
    return false
  }

  // ── Plan name helper ────────────────────────────────────────────────────

  const getPlanName = (): string => {
    const landing = t.landing as Record<string, string>
    if (plan === 'free') return landing.planFreeName || 'Decouverte'
    if (plan === 'starter') return landing.planStarterName || 'Essentiel'
    if (plan === 'pro') return landing.planProName || 'Professionnel'
    if (plan === 'pay_as_you_grow') return 'Pay as you grow'
    return landing.planEnterpriseName || 'Entreprise'
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canGoNext() || !selectedActivity) return
    setLoading(true)
    setError(null)

    try {
      await register({
        orgName,
        ownerName,
        ownerEmail,
        ownerPhone,
        ownerAddress,
        plan,
        billingCycle,
        paymentMethod: (plan === 'free' || plan === 'pay_as_you_grow') ? 'none' : paymentMethod,
        storeName,
        activity: selectedActivity,
        password,
        termsAcceptedAt: new Date().toISOString(),
      })
      setMode(selectedMode)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step title/desc ─────────────────────────────────────────────────────

  const reg = t.registration as Record<string, string>
  const billing = t.billing as Record<string, string>

  const getStepTitle = (): string => {
    if (step === 1) return reg.step1Title || 'Votre forfait'
    if (step === 2) return reg.step2Title || 'Votre organisation'
    if (step === 3) return reg.step3Title || 'Activite et boutique'
    if (step === 4) return reg.step4Title || 'Moyen de paiement'
    return reg.step5Title || 'Creer votre compte'
  }

  const getStepDesc = (): string => {
    if (step === 1) return reg.step1Desc || ''
    if (step === 2) return reg.step2Desc || ''
    if (step === 3) return reg.step3Desc || ''
    if (step === 4) return reg.step4Desc || ''
    return reg.step5Desc || ''
  }

  // ── Styles ──────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: 700,
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

  const progressContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    padding: '20px 0',
  }

  const stepDot = (s: number): React.CSSProperties => {
    const isComplete = s < step
    const isActive = s === step
    return {
      width: isActive ? 32 : 10,
      height: 10,
      borderRadius: isActive ? 5 : '50%',
      backgroundColor: isComplete ? '#16a34a' : isActive ? '#2563eb' : '#e2e8f0',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }

  const contentStyle: React.CSSProperties = {
    padding: '0 24px 24px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: '#1e293b',
    marginBottom: 4,
  }

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: 16,
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: 10,
    maxHeight: 340,
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

  const paymentCardStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '20px',
    borderRadius: 12,
    border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  })

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
    padding: '12px 24px',
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

  const toggleContainerStyle: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  }

  const toggleBtnStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 16px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    color: isActive ? '#1e293b' : '#64748b',
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    transition: 'all 0.2s',
  })

  const infoCardStyle: React.CSSProperties = {
    background: '#f8fafc',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #e2e8f0',
  }

  const errorBoxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
  }

  // ── Render helpers ──────────────────────────────────────────────────────

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#2563eb'
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#d1d5db'
  }

  const clearError = () => {
    if (error) setError(null)
  }

  // ── Step 1: Plan Confirmation ───────────────────────────────────────────

  const renderStep1 = () => (
    <div>
      {/* Billing cycle toggle (hidden for pay_as_you_grow) */}
      {plan !== 'pay_as_you_grow' && (
        <div style={toggleContainerStyle}>
          <button
            style={toggleBtnStyle(billingCycle === 'monthly')}
            onClick={() => setBillingCycle('monthly')}
          >
            {reg.monthlyBilling || 'Facturation mensuelle'}
          </button>
          <button
            style={toggleBtnStyle(billingCycle === 'yearly')}
            onClick={() => setBillingCycle('yearly')}
          >
            {reg.yearlyBilling || 'Facturation annuelle'}
          </button>
        </div>
      )}

      {/* Plan info card */}
      <div style={infoCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
              {reg.planSelected || 'Forfait selectionne'}
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              {getPlanName()}
            </p>
          </div>
          <div style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
          }}>
            {plan === 'free' ? 'Gratuit' : plan === 'pay_as_you_grow' ? '$0.02 / ticket' : formatPrice(currentPrice)}
            {plan !== 'free' && plan !== 'pay_as_you_grow' && (
              <span style={{ fontWeight: 400, fontSize: 12 }}>
                {billingCycle === 'monthly'
                  ? ((t.landing as Record<string, string>).pricingPerMonth || '/mois')
                  : ((t.landing as Record<string, string>).pricingPerMonth || '/mois')}
              </span>
            )}
          </div>
        </div>

        {/* Pay as you grow bonus badge */}
        {plan === 'pay_as_you_grow' && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Check size={16} color="#16a34a" />
            <span style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>
              10 $ offerts
            </span>
          </div>
        )}

        {/* Pay as you grow description */}
        {plan === 'pay_as_you_grow' && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Toutes les fonctions, payez a l'usage
            </p>
          </div>
        )}

        {/* Yearly savings note */}
        {plan !== 'free' && plan !== 'pay_as_you_grow' && billingCycle === 'yearly' && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Check size={16} color="#16a34a" />
            <span style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>
              {(t.landing as Record<string, string>).pricingYearlySave || '2 mois offerts'}
            </span>
          </div>
        )}

        {/* Total display */}
        {plan !== 'free' && plan !== 'pay_as_you_grow' && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#64748b' }}>
                {billingCycle === 'monthly'
                  ? (reg.totalPerMonth || 'Total par mois')
                  : (reg.totalPerYear || 'Total par an')}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                {billingCycle === 'monthly'
                  ? formatPrice(currentPrice)
                  : formatPrice(currentPrice * 12)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ── Step 2: Organization Info ───────────────────────────────────────────

  const renderStep2 = () => (
    <div>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>{reg.orgName || 'Nom de l\'organisation'} *</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Ex: Mano Verde SA"
          value={orgName}
          onChange={(e) => { setOrgName(e.target.value); clearError() }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>{reg.ownerName || 'Nom complet du proprietaire'} *</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Ex: Jean Dupont"
          value={ownerName}
          onChange={(e) => { setOwnerName(e.target.value); clearError() }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>{reg.ownerEmail || 'Adresse e-mail'} *</label>
        <input
          style={{
            ...inputStyle,
            borderColor: ownerEmail && !isValidEmail(ownerEmail) ? '#dc2626' : '#d1d5db',
          }}
          type="email"
          placeholder="jean@example.com"
          value={ownerEmail}
          onChange={(e) => { setOwnerEmail(e.target.value); clearError() }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        {ownerEmail && !isValidEmail(ownerEmail) && (
          <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>
            Format e-mail invalide
          </p>
        )}
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>{reg.ownerPhone || 'Numero de telephone'} *</label>
        <input
          style={inputStyle}
          type="tel"
          placeholder="+237 6XX XXX XXX"
          value={ownerPhone}
          onChange={(e) => { setOwnerPhone(e.target.value); clearError() }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>{reg.ownerAddress || 'Adresse postale'}</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Ex: Rue de la Joie, Douala"
          value={ownerAddress}
          onChange={(e) => { setOwnerAddress(e.target.value); clearError() }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>
    </div>
  )

  // ── Step 3: Activity & Store ────────────────────────────────────────────

  const renderStep3 = () => (
    <div>
      {/* Activity search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
        <input
          style={searchInputStyle}
          type="text"
          placeholder={t.setup.searchActivities}
          value={activitySearch}
          onChange={(e) => setActivitySearch(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
        />
      </div>

      {/* Activity grid */}
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

      {/* Store name input */}
      <div style={{ marginTop: 20 }}>
        <label style={labelStyle}>{reg.storeName || 'Nom de la boutique'} *</label>
        <input
          style={{ ...inputStyle, marginTop: 4 }}
          type="text"
          placeholder="Ex: Mano Verde Douala"
          value={storeName}
          onChange={(e) => { setStoreName(e.target.value); clearError() }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>

            {/* Mode selection */}
            <div style={{ marginTop: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
                {t.registration.modeSelection || 'Mode de fonctionnement'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {([
                  { value: 'server' as const, label: t.registration.modeServer || 'Serveur', desc: t.registration.modeServerDesc || 'Terminal manager avec acces complet' },
                  { value: 'client' as const, label: t.registration.modeClient || 'Client', desc: t.registration.modeClientDesc || 'Terminal caisse (ventes uniquement)' },
                  { value: 'all_in_one' as const, label: t.registration.modeAllInOne || 'All-in-One', desc: t.registration.modeAllInOneDesc || 'Appareil autonome, toutes les fonctions' },
                ] as const).map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSelectedMode(m.value)}
                    style={{
                      padding: '16px',
                      border: `2px solid ${selectedMode === m.value ? '#2563eb' : '#e2e8f0'}`,
                      borderRadius: 12,
                      backgroundColor: selectedMode === m.value ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
    </div>
  )

  // ── Step 4: Payment Method ──────────────────────────────────────────────

  const renderStep4 = () => {
    if (plan === 'free' || plan === 'pay_as_you_grow') {
      const isPayGrow = plan === 'pay_as_you_grow'
      return (
        <div style={infoCardStyle}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: isPayGrow ? '#fffbeb' : '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              {isPayGrow
                ? <Zap size={28} color="#f59e0b" />
                : <Check size={28} color="#16a34a" />
              }
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>
              {getPlanName()}
            </p>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              {isPayGrow
                ? (billing.payAsYouGrowDesc || '$0.02 par ticket. Toutes les fonctions incluses. 10 $ de credit offerts a l\'inscription.')
                : (reg.freePlanNote || 'Le forfait Decouverte est gratuit, aucun paiement requis.')
              }
            </p>
          </div>
        </div>
      )
    }

    const paymentLabels: Record<string, { name: string; desc: string }> = {
      orange_money: {
        name: reg.orangeMoney || 'Orange Money',
        desc: reg.orangeMoneyDesc || 'Paiement via votre compte Orange Money',
      },
      mtn_money: {
        name: reg.mtnMoney || 'MTN Money',
        desc: reg.mtnMoneyDesc || 'Paiement via votre compte MTN Mobile Money',
      },
      carte_bancaire: {
        name: reg.carteBancaire || 'Carte bancaire',
        desc: reg.carteBancaireDesc || 'Paiement par carte Visa ou Mastercard',
      },
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PAYMENT_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const info = paymentLabels[opt.id]
          const isSelected = paymentMethod === opt.id
          return (
            <div
              key={opt.id}
              style={paymentCardStyle(isSelected)}
              onClick={() => setPaymentMethod(opt.id)}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={24} color={isSelected ? '#2563eb' : '#64748b'} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: isSelected ? '#2563eb' : '#1e293b', margin: '0 0 2px' }}>
                  {info.name}
                </p>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  {info.desc}
                </p>
              </div>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: `2px solid ${isSelected ? '#2563eb' : '#d1d5db'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {isSelected && (
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                  }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Step 5: Create Account ──────────────────────────────────────────────

  const renderStep5 = () => (
    <div>
      {error && (
        <div style={errorBoxStyle}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>{t.auth.passwordLabel} *</label>
        <div style={{ position: 'relative' }}>
          <input
            style={inputStyle}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError() }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {password.length > 0 && password.length < 6 && (
          <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>
            6 caracteres minimum
          </p>
        )}
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>{t.auth.confirmPassword} *</label>
        <div style={{ position: 'relative' }}>
          <input
            style={{
              ...inputStyle,
              borderColor: confirmPassword && password !== confirmPassword ? '#dc2626' : '#d1d5db',
            }}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearError() }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>
            {t.auth.passwordMismatch}
          </p>
        )}
      </div>

      {/* Summary before submit */}
      <div style={{
        ...infoCardStyle,
        marginTop: 8,
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Recapitulatif
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: reg.planSelected || 'Forfait', value: getPlanName() },
            { label: reg.orgName || 'Organisation', value: orgName },
            { label: reg.ownerEmail || 'E-mail', value: ownerEmail },
            { label: reg.storeName || 'Boutique', value: storeName },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>{row.label}</span>
              <span style={{ color: '#1e293b', fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Terms acceptance */}
      <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            style={{ marginTop: 4, width: 20, height: 20, accentColor: '#2563eb', flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
            {t.legal.acceptTermsIntro}{' '}
            <button type="button" onClick={() => setLegalModal('cgv')} style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>
              {t.legal.cgvLabel}
            </button>
            ,{' '}
            <button type="button" onClick={() => setLegalModal('rgpd')} style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>
              {t.legal.privacyLabel}
            </button>
            {' '}{t.legal.andThe}{' '}
            <button type="button" onClick={() => setLegalModal('terms')} style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>
              {t.legal.termsLabel}
            </button>
            .
          </span>
        </label>
      </div>

      {legalModal && (
        <LegalModal documentType={legalModal} onClose={() => setLegalModal(null)} />
      )}
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Back to website link + Already have account */}
        <div style={{ padding: '12px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <button
            onClick={() => { setRegistrationMode(false); setShowLogin(true) }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#2563eb',
              fontSize: 13,
              fontWeight: 600,
              padding: 0,
            }}
          >
            {t.auth.alreadyHaveAccount} {t.auth.loginButton}
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

        {/* Step progress indicator */}
        <div style={progressContainerStyle}>
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} style={stepDot(s)}>
              {s < step && <Check size={8} color="#fff" />}
            </div>
          ))}
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>
            {t.setup.step} {step} {t.setup.of} 5
          </span>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>

        {/* Footer navigation */}
        <div style={footerStyle}>
          <button
            style={{
              ...backButtonStyle,
              visibility: step === 1 ? 'hidden' : 'visible',
            }}
            onClick={() => setStep((s) => (s > 1 ? (s - 1) as RegistrationStep : s))}
          >
            <ArrowLeft size={16} /> {t.common.back}
          </button>

          {step < 5 ? (
            <button
              style={nextButtonStyle}
              onClick={() => canGoNext() && setStep((s) => ((s + 1) as RegistrationStep))}
              disabled={!canGoNext()}
            >
              {t.common.next} <ArrowRight size={16} />
            </button>
          ) : (
            <button
              style={{
                ...nextButtonStyle,
                backgroundColor: loading ? '#94a3b8' : canGoNext() ? '#16a34a' : '#94a3b8',
                cursor: loading || !canGoNext() ? 'not-allowed' : 'pointer',
                minWidth: 180,
                justifyContent: 'center',
              }}
              onClick={() => !loading && canGoNext() && handleSubmit()}
              disabled={loading || !canGoNext()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  {reg.processing || 'Creation en cours...'}
                </>
              ) : (
                <>
                  <Check size={16} />
                  {reg.createMyAccount || 'Creer mon compte'}
                </>
              )}
            </button>
          )}
        </div>

        {/* Spinner keyframes (injected once) */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}
