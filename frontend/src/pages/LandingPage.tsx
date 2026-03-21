import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguageStore } from '../stores/languageStore'
import { useAppStore } from '../stores/appStore'
import { languages } from '../i18n/types'
import type { Language } from '../i18n/types'
import type { Activity } from '../types'
import LegalModal from '../components/common/LegalModal'
import { supabase } from '../services/supabase'
import { ACTIVITY_ICONS, ALL_ACTIVITIES, ACTIVITY_COLORS } from '../data/activityIcons'
import { ACTIVITY_WALLPAPERS } from '../data/activityThemes'
import { updatePageMeta } from '../utils/seo'

// ============================================================================
// POS Mano Verde - Landing / Marketing Page
// A complete, conversion-optimized commercial page for pos.manoverde.com
// ============================================================================

// ---------------------------------------------------------------------------
// Inline SVG Icon Components (no external dependencies)
// ---------------------------------------------------------------------------

const IconWifiOff = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
)

const IconStore = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconPrinter = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)

const IconRefresh = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const IconGlobe = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const IconZap = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const IconCheck = ({ size = 18, color = '#16a34a' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconX = ({ size = 18, color = '#cbd5e1' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconChevronDown = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconStar = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const IconArrowRight = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const IconPlay = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const IconXClose = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const LogoIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconArrowUp = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
)

const IconMail = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 7L2 7" />
  </svg>
)


// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------
function useCountUp(target: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!startOnView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = Date.now()
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration, startOnView])

  return { count, ref }
}


// ---------------------------------------------------------------------------
// FAQ Accordion Item
// ---------------------------------------------------------------------------
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        borderBottom: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 16,
          fontWeight: 600,
          color: '#0f172a',
          fontFamily: 'inherit',
          gap: 16,
        }}
      >
        <span>{question}</span>
        <span
          style={{
            flexShrink: 0,
            transition: 'transform 0.3s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: '#64748b',
          }}
        >
          <IconChevronDown size={20} />
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? 300 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, padding 0.3s ease',
          paddingBottom: open ? 20 : 0,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.7,
            color: '#475569',
          }}
        >
          {answer}
        </p>
      </div>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Landing Page Language Selector (light-aware variant)
// ---------------------------------------------------------------------------
function LandingLanguageSelector({ scrolled }: { scrolled: boolean }) {
  const { language, setLanguage } = useLanguageStore()
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find((l) => l.code === language) ?? languages[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const selectLanguage = useCallback((lang: Language) => {
    setLanguage(lang)
    setIsOpen(false)
  }, [setLanguage])

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Language: ${currentLang.nativeName}`}
        className="landing-lang-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: scrolled ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
          border: scrolled ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8,
          cursor: 'pointer',
          color: scrolled ? '#334155' : 'rgba(255,255,255,0.9)',
          fontSize: 13,
          fontWeight: 500,
          transition: 'all 0.2s ease',
          outline: 'none',
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>{currentLang.flag}</span>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11, fontWeight: 600 }}>
          {currentLang.code}
        </span>
        <span style={{
          fontSize: 10,
          opacity: 0.6,
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          &#9660;
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select language"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 200,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            zIndex: 9999,
            padding: 4,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {languages.map((lang, index) => {
            const isActive = lang.code === language
            const isHovered = hoveredIndex === index

            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => selectLanguage(lang.code)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: 6,
                  transition: 'background 0.15s ease',
                  border: 'none',
                  background: isActive ? 'rgba(37,99,235,0.08)' : isHovered ? 'rgba(0,0,0,0.04)' : 'transparent',
                  width: '100%',
                  textAlign: 'left',
                  color: isActive ? '#2563eb' : '#334155',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{lang.flag}</span>
                <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.3 }}>{lang.nativeName}</span>
                  <span style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lang.code}</span>
                </span>
                {isActive && <span style={{ fontSize: 14, color: '#2563eb', flexShrink: 0 }}>&#10003;</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ---------------------------------------------------------------------------
// Main Landing Page Component
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingYearly, setBillingYearly] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [legalModal, setLegalModal] = useState<'cgv' | 'rgpd' | 'terms' | null>(null)
  const [infoPage, setInfoPage] = useState<'docs' | 'api' | 'changelog' | null>(null)
  const [showcaseTab, setShowcaseTab] = useState(0)
  const [sectorModal, setSectorModal] = useState<Activity | null>(null)
  const [sectorTab, setSectorTab] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')
  // Partner application form
  const [partnerForm, setPartnerForm] = useState({ name: '', email: '', phone: '', city: '', motivation: '' })
  const [partnerSubmitting, setPartnerSubmitting] = useState(false)
  const [partnerResult, setPartnerResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { t } = useLanguageStore()

  // SEO: update page meta
  useEffect(() => {
    updatePageMeta(
      'Logiciel de caisse et gestion des ventes pour commerces',
      'POS Mano Verde est un logiciel de caisse et de gestion commerciale pour restaurants, boutiques, pharmacies et tous types de commerces. Gerez vos ventes, stocks, clients et employes depuis une interface simple, meme sans internet.'
    )
  }, [])

  // Animated counters for hero stats
  const stat1 = useCountUp(2500, 2000)
  const stat2 = useCountUp(27, 1500)

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20)
      setShowScrollTop(window.scrollY > 600)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePartnerSubmit = async () => {
    if (!partnerForm.name || !partnerForm.email || !partnerForm.phone) return
    if (!supabase) {
      setPartnerResult({ type: 'error', text: 'Service indisponible' })
      return
    }
    setPartnerSubmitting(true)
    setPartnerResult(null)
    try {
      // Check if email already exists
      const { data: existing } = await supabase.from('agents').select('id').eq('email', partnerForm.email).maybeSingle()
      if (existing) {
        setPartnerResult({ type: 'error', text: 'Cette adresse email est deja enregistree.' })
        return
      }
      // Insert as pending agent (no auth_id = pending)
      const { error } = await supabase.from('agents').insert({
        name: partnerForm.name,
        email: partnerForm.email,
        phone: partnerForm.phone,
        motivation: partnerForm.motivation || partnerForm.city || null,
        is_active: false,
        tier: 1,
        commission_rate: 0,
        referral_code: 'PENDING-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
      })
      if (error) throw error
      setPartnerForm({ name: '', email: '', phone: '', city: '', motivation: '' })
      setPartnerResult({ type: 'success', text: 'Candidature envoyee! Vous recevrez une notification WhatsApp apres validation.' })
    } catch (err: any) {
      setPartnerResult({ type: 'error', text: err.message || 'Erreur, veuillez reessayer.' })
    } finally {
      setPartnerSubmitting(false)
    }
  }

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleGoToLogin = () => {
    const appStore = useAppStore.getState()
    appStore.setShowLogin(true)
    document.documentElement.classList.remove('app-mode')
    localStorage.setItem('pos-app-store', JSON.stringify({
      state: { mode: 'all_in_one', activity: null, serverUrl: '', selectedPlan: null, registrationMode: false, showLogin: true },
      version: 0,
    }))
    window.location.reload()
  }

  const handleStartApp = () => {
    const appStore = useAppStore.getState()
    appStore.setSelectedPlan('free')
    appStore.setRegistrationMode(true)
    document.documentElement.classList.remove('app-mode')
    localStorage.setItem('pos-app-store', JSON.stringify({
      state: { mode: 'all_in_one', activity: null, serverUrl: '', selectedPlan: 'free', registrationMode: true },
      version: 0,
    }))
    window.location.reload()
  }

  const handleContact = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  const handlePlanSelect = (plan: 'starter' | 'pro' | 'pay_as_you_grow') => {
    const appStore = useAppStore.getState()
    appStore.setSelectedPlan(plan)
    appStore.setRegistrationMode(true)
    // Remove body app-mode if present
    document.documentElement.classList.remove('app-mode')
    // Trigger the app flow
    localStorage.setItem('pos-app-store', JSON.stringify({
      state: { mode: 'all_in_one', activity: null, serverUrl: '', selectedPlan: plan, registrationMode: true },
      version: 0,
    }))
    window.location.reload()
  }

  const handlePlanCTA = (planId: string) => {
    if (planId === 'enterprise') {
      handleContact('direction@manovende.com')
    } else if (planId === 'starter') {
      handlePlanSelect('starter')
    } else if (planId === 'pro') {
      handlePlanSelect('pro')
    } else if (planId === 'pay_as_you_grow') {
      handlePlanSelect('pay_as_you_grow')
    } else {
      handleStartApp()
    }
  }

  const formatPrice = (price: number) => {
    if (price === -1) return t.landing.pricingCustom
    if (price === 0) return '0'
    if (Number.isInteger(price)) return price.toString()
    return price.toFixed(2)
  }

  // ── Translated data arrays ─────────────────────────────────────────────────

  const FEATURES = [
    { icon: <IconWifiOff />, title: t.landing.feature1Title, description: t.landing.feature1Desc },
    { icon: <IconStore />, title: t.landing.feature2Title, description: t.landing.feature2Desc },
    { icon: <IconPrinter />, title: t.landing.feature3Title, description: t.landing.feature3Desc },
    { icon: <IconRefresh />, title: t.landing.feature4Title, description: t.landing.feature4Desc },
    { icon: <IconGlobe />, title: t.landing.feature5Title, description: t.landing.feature5Desc },
    { icon: <IconZap />, title: t.landing.feature6Title, description: t.landing.feature6Desc },
  ]

  const PLANS = [
    {
      id: 'free',
      name: t.landing.planFreeName,
      tagline: 'FREE',
      price: 0,
      priceYearly: 0,
      currency: 'USD',
      description: t.landing.planFreeDesc,
      badge: null,
      badgeColor: null,
      features: [
        { text: t.landing.planFeature1, included: true },
        { text: t.landing.planFeature2, included: true },
        { text: t.landing.planFeature3, included: true },
        { text: t.landing.planFeature4, included: true },
        { text: t.landing.planFeature5, included: true },
        { text: t.landing.planFeature9, included: false },
        { text: t.landing.planFeature10, included: false },
        { text: t.landing.planFeature15, included: false },
        { text: t.landing.planFeature16, included: false },
      ],
      cta: t.landing.planFreeCTA,
      ctaVariant: 'outline' as const,
      highlight: false,
    },
    {
      id: 'pay_as_you_grow',
      name: 'Flexible',
      tagline: 'FLEXIBLE',
      price: -2,
      priceYearly: -2,
      currency: 'USD',
      description: t.billing.payAsYouGrowDesc || 'Payez uniquement ce que vous utilisez. Toutes les fonctions incluses.',
      badge: t.billing.initialCredit || '10 $ offerts',
      badgeColor: '#f59e0b',
      features: [
        { text: '$0.02 USD / ticket', included: true },
        { text: t.landing.planFeature13, included: true },
        { text: t.landing.planFeature8, included: true },
        { text: t.landing.planFeature14, included: true },
        { text: t.landing.planFeature9, included: true },
        { text: t.landing.planFeature10, included: true },
        { text: t.landing.planFeature15, included: false },
        { text: t.landing.planFeature16, included: false },
      ],
      cta: t.landing.planFreeCTA,
      ctaVariant: 'outline' as const,
      highlight: false,
    },
    {
      id: 'starter',
      name: t.landing.planStarterName,
      tagline: 'ESSENTIEL',
      price: 2,
      priceYearly: 1.5,
      currency: 'USD',
      description: t.landing.planStarterDesc,
      badge: null,
      badgeColor: null,
      features: [
        { text: t.landing.planFeature6, included: true },
        { text: t.landing.planFeature7, included: true },
        { text: t.landing.planFeature8, included: true },
        { text: t.landing.planFeature9, included: true },
        { text: t.landing.planFeature10, included: true },
        { text: t.landing.planFeature11, included: true },
        { text: t.landing.planFeature15, included: false },
        { text: t.landing.planFeature16, included: false },
        { text: t.landing.planFeature20, included: false },
      ],
      cta: t.landing.planStarterCTA,
      ctaVariant: 'outline' as const,
      highlight: false,
    },
    {
      id: 'pro',
      name: t.landing.planProName,
      tagline: 'PRO',
      price: 5,
      priceYearly: 4,
      currency: 'USD',
      description: t.landing.planProDesc,
      badge: t.landing.planBadgePopular,
      badgeColor: '#16a34a',
      features: [
        { text: t.landing.planFeature12, included: true },
        { text: t.landing.planFeature13, included: true },
        { text: t.landing.planFeature8, included: true },
        { text: t.landing.planFeature14, included: true },
        { text: t.landing.planFeature15, included: true },
        { text: t.landing.planFeature16, included: true },
        { text: t.landing.planFeature17, included: true },
        { text: t.landing.planFeature10, included: true },
        { text: t.landing.planFeature20, included: false },
      ],
      cta: t.landing.planProCTA,
      ctaVariant: 'solid' as const,
      highlight: true,
    },
    {
      id: 'enterprise',
      name: t.landing.planEnterpriseName,
      tagline: 'ENTERPRISE',
      price: -1,
      priceYearly: -1,
      currency: '',
      description: t.landing.planEnterpriseDesc,
      badge: null,
      badgeColor: null,
      features: [
        { text: t.landing.planFeature18, included: true },
        { text: t.landing.planFeature19, included: true },
        { text: t.landing.planFeature13, included: true },
        { text: t.landing.planFeature20, included: true },
        { text: t.landing.planFeature17, included: true },
        { text: t.landing.planFeature16, included: true },
        { text: t.landing.planFeature15, included: true },
        { text: t.landing.planFeature14, included: true },
        { text: t.landing.planFeature10, included: true },
      ],
      cta: t.landing.planEnterpriseCTA,
      ctaVariant: 'outline' as const,
      highlight: false,
    },
  ]

  const TESTIMONIALS = [
    {
      name: t.landing.testimonial1Name,
      role: t.landing.testimonial1Role,
      avatar: 'AN',
      avatarBg: '#2563eb',
      text: t.landing.testimonial1Text,
      rating: 5,
    },
    {
      name: t.landing.testimonial2Name,
      role: t.landing.testimonial2Role,
      avatar: 'FD',
      avatarBg: '#16a34a',
      text: t.landing.testimonial2Text,
      rating: 5,
    },
    {
      name: t.landing.testimonial3Name,
      role: t.landing.testimonial3Role,
      avatar: 'MS',
      avatarBg: '#9333ea',
      text: t.landing.testimonial3Text,
      rating: 5,
    },
    {
      name: t.landing.testimonial4Name,
      role: t.landing.testimonial4Role,
      avatar: 'GM',
      avatarBg: '#e11d48',
      text: t.landing.testimonial4Text,
      rating: 4,
    },
    {
      name: t.landing.testimonial5Name,
      role: t.landing.testimonial5Role,
      avatar: 'KA',
      avatarBg: '#0891b2',
      text: t.landing.testimonial5Text,
      rating: 4,
    },
  ]

  const FAQ_ITEMS = [
    { question: t.landing.faqQ9, answer: t.landing.faqA9 },
    { question: t.landing.faqQ1, answer: t.landing.faqA1 },
    { question: t.landing.faqQ2, answer: t.landing.faqA2 },
    { question: t.landing.faqQ3, answer: t.landing.faqA3 },
    { question: t.landing.faqQ4, answer: t.landing.faqA4 },
    { question: t.landing.faqQ5, answer: t.landing.faqA5 },
    { question: t.landing.faqQ6, answer: t.landing.faqA6 },
    { question: t.landing.faqQ7, answer: t.landing.faqA7 },
    { question: t.landing.faqQ8, answer: t.landing.faqA8 },
  ]

  // ── Featured sectors (16 most popular) with mockup data for interactive modal ──
  const FEATURED_SECTORS: { activity: Activity; color: string; stats: { v: string; c: string }[]; stat3Label: string; bars: number[]; sidebar: string[]; categories: string[]; products: { n: string; p: string; bg: string; badge: string }[]; cart: string[]; total: string }[] = [
    { activity: 'restaurant', color: '#ef4444',
      stats: [{ v: '185,000', c: '#ef4444' }, { v: '42', c: '#16a34a' }, { v: '4,400', c: '#f59e0b' }], stat3Label: 'Ticket moyen',
      bars: [30,50,70,45,85,60,95,50,80,65,90,75],
      sidebar: ['Caisse','Menu','Commandes','Stock','Employes'],
      categories: ['Plats','Desserts','Boissons'],
      products: [{ n:'Ndole', p:'3,000', bg:'#fef2f2', badge:'\u23F1 30min' },{ n:'Jollof Rice', p:'2,500', bg:'#dcfce7', badge:'\u23F1 25min' },{ n:'Pizza Margherita', p:'4,000', bg:'#fef3c7', badge:'\u23F1 15min' },{ n:'Pad Thai', p:'3,500', bg:'#fce7f3', badge:'\u23F1 20min' },{ n:'Burger Deluxe', p:'3,500', bg:'#e0e7ff', badge:'\u23F1 12min' },{ n:'Crepe Nutella', p:'1,500', bg:'#f1f5f9', badge:'\u23F1 8min' }],
      cart: ['Ndole x2','Jollof Rice x1','Jus frais x3'], total: '9,500' },
    { activity: 'supermarket', color: '#16a34a',
      stats: [{ v: '540,000', c: '#16a34a' }, { v: '215', c: '#2563eb' }, { v: '12', c: '#ef4444' }], stat3Label: 'Stock faible',
      bars: [80,70,90,85,60,95,75,88,65,92,78,86],
      sidebar: ['Caisse','Produits','Stock','Rapports','Employes'],
      categories: ['Alimentaire','Boissons','Menage'],
      products: [{ n:'Riz 5kg', p:'4,500', bg:'#dcfce7', badge:'\u2696 5kg' },{ n:'Huile palme 1L', p:'1,800', bg:'#fef3c7', badge:'\u2696 1L' },{ n:'Lait concentre', p:'900', bg:'#dbeafe', badge:'\uD83D\uDCC5 11/26' },{ n:'Sucre 1kg', p:'800', bg:'#fef2f2', badge:'\u2696 1kg' },{ n:'Eau minerale 1.5L', p:'500', bg:'#f1f5f9', badge:'\u2696 1.5L' },{ n:'Savon Marseille', p:'650', bg:'#e0e7ff', badge:'' }],
      cart: ['Riz 5kg x2','Huile 1L x3','Lait x6'], total: '19,800' },
    { activity: 'pharmacy', color: '#2563eb',
      stats: [{ v: '320,000', c: '#2563eb' }, { v: '86', c: '#16a34a' }, { v: '5', c: '#ef4444' }], stat3Label: 'Peremptions',
      bars: [60,45,80,55,70,90,65,85,50,75,88,92],
      sidebar: ['Caisse','Produits','Stock','Alertes','Ordonnances'],
      categories: ['Medicaments','Hygiene','Materiel'],
      products: [{ n:'Paracetamol 500mg', p:'500', bg:'#dbeafe', badge:'\uD83D\uDCC5 09/27' },{ n:'Amoxicilline', p:'1,500', bg:'#dcfce7', badge:'\uD83D\uDCC5 12/26' },{ n:'Ibuprofene 400mg', p:'800', bg:'#fef3c7', badge:'\uD83D\uDCC5 03/28' },{ n:'Vitamine C 1000mg', p:'2,500', bg:'#fce7f3', badge:'\uD83D\uDCC5 06/27' },{ n:'Pansement sterile', p:'750', bg:'#e0e7ff', badge:'' },{ n:'Sirop toux', p:'2,000', bg:'#f1f5f9', badge:'\uD83D\uDCC5 01/27' }],
      cart: ['Paracetamol x4','Vitamine C x1','Pansement x2'], total: '6,250' },
    { activity: 'fashion', color: '#e11d48',
      stats: [{ v: '280,000', c: '#e11d48' }, { v: '65', c: '#16a34a' }, { v: '12', c: '#9333ea' }], stat3Label: 'Collections',
      bars: [50,65,80,70,90,75,85,60,78,88,72,95],
      sidebar: ['Caisse','Produits','Stock','Collections','Employes'],
      categories: ['Vetements','Chaussures','Accessoires'],
      products: [{ n:'Robe Wax', p:'15,000', bg:'#fce7f3', badge:'\uD83D\uDCCF M/Rouge' },{ n:'Pantalon Chino', p:'8,000', bg:'#dbeafe', badge:'\uD83D\uDCCF L/Bleu' },{ n:'Polo Sport', p:'5,000', bg:'#dcfce7', badge:'\uD83D\uDCCF M/Vert' },{ n:'Sac a main cuir', p:'12,000', bg:'#fef3c7', badge:'\uD83D\uDCCF Unique' },{ n:'Chaussures Derby', p:'18,000', bg:'#f3e8ff', badge:'\uD83D\uDCCF 42/Noir' },{ n:'Ceinture cuir', p:'3,500', bg:'#f1f5f9', badge:'\uD83D\uDCCF L/Marron' }],
      cart: ['Robe Wax x1','Polo Sport x2','Ceinture x1'], total: '28,500' },
    { activity: 'bakery', color: '#f59e0b',
      stats: [{ v: '95,000', c: '#f59e0b' }, { v: '180', c: '#16a34a' }, { v: '24', c: '#2563eb' }], stat3Label: 'Production',
      bars: [90,85,70,95,80,60,88,75,92,65,85,78],
      sidebar: ['Caisse','Menu','Commandes','Production','Employes'],
      categories: ['Pains','Viennoiseries','Patisseries'],
      products: [{ n:'Baguette tradition', p:'200', bg:'#fef3c7', badge:'\uD83C\uDF3F Frais' },{ n:'Croissant beurre', p:'350', bg:'#fef2f2', badge:'\uD83C\uDF3F Frais' },{ n:'Pain au chocolat', p:'400', bg:'#e0e7ff', badge:'\uD83C\uDF3F Frais' },{ n:'Gateau anniversaire', p:'5,000', bg:'#fce7f3', badge:'\uD83D\uDCC5 Cmd' },{ n:'Tarte aux fruits', p:'3,500', bg:'#dcfce7', badge:'\uD83C\uDF3F Du jour' },{ n:'Macaron x6', p:'500', bg:'#dbeafe', badge:'\uD83C\uDF3F Frais' }],
      cart: ['Baguette x10','Croissant x5','Pain choco x3'], total: '4,950' },
    { activity: 'bar', color: '#8b5cf6',
      stats: [{ v: '145,000', c: '#8b5cf6' }, { v: '58', c: '#16a34a' }, { v: '6,200', c: '#f59e0b' }], stat3Label: 'Ticket moyen',
      bars: [40,55,65,50,80,90,95,85,70,60,75,88],
      sidebar: ['Caisse','Menu','Commandes','Stock','Employes'],
      categories: ['Cocktails','Bieres','Softs'],
      products: [{ n:'Mojito', p:'4,000', bg:'#f3e8ff', badge:'\uD83C\uDF78 Classic' },{ n:'Pina Colada', p:'4,500', bg:'#fef3c7', badge:'\uD83C\uDF78 Tropical' },{ n:'Biere locale', p:'1,500', bg:'#dcfce7', badge:'\uD83C\uDF7A 33cl' },{ n:'Whisky Sour', p:'5,000', bg:'#fef2f2', badge:'\uD83C\uDF78 Premium' },{ n:'Jus naturel', p:'1,000', bg:'#dbeafe', badge:'' },{ n:'Assiette tapas', p:'3,500', bg:'#f1f5f9', badge:'\uD83C\uDF7D Snack' }],
      cart: ['Mojito x2','Biere x3','Tapas x1'], total: '16,000' },
    { activity: 'hair_salon', color: '#ec4899',
      stats: [{ v: '210,000', c: '#ec4899' }, { v: '95', c: '#16a34a' }, { v: '35min', c: '#2563eb' }], stat3Label: 'Duree moy.',
      bars: [60,70,75,65,80,85,90,88,72,68,82,78],
      sidebar: ['Caisse','Services','RDV','Produits','Employes'],
      categories: ['Coiffure','Barbe','Soins'],
      products: [{ n:'Coupe Homme', p:'3,000', bg:'#fce7f3', badge:'\u2702 30min' },{ n:'Coupe Femme', p:'5,000', bg:'#f3e8ff', badge:'\u2702 45min' },{ n:'Coloration', p:'8,000', bg:'#fef3c7', badge:'\u2702 60min' },{ n:'Tresse africaine', p:'10,000', bg:'#dcfce7', badge:'\u2702 90min' },{ n:'Barbe complete', p:'2,000', bg:'#dbeafe', badge:'\u2702 20min' },{ n:'Soin capillaire', p:'4,000', bg:'#f1f5f9', badge:'\uD83D\uDC86 30min' }],
      cart: ['Coupe Femme x1','Coloration x1','Soin x1'], total: '17,000' },
    { activity: 'hotel', color: '#9333ea',
      stats: [{ v: '1,200,000', c: '#9333ea' }, { v: '28', c: '#16a34a' }, { v: '78%', c: '#2563eb' }], stat3Label: 'Occupation',
      bars: [70,75,80,85,90,88,92,85,80,78,82,88],
      sidebar: ['Reservations','Chambres','Factures','Services','Employes'],
      categories: ['Chambres','Restauration','Services'],
      products: [{ n:'Ch. Double Deluxe', p:'35,000', bg:'#f3e8ff', badge:'\uD83D\uDECF Double' },{ n:'Ch. Simple Std', p:'25,000', bg:'#dbeafe', badge:'\uD83D\uDECF Simple' },{ n:'Suite Presidentielle', p:'65,000', bg:'#fef3c7', badge:'\uD83D\uDECF Suite' },{ n:'Petit-dejeuner buffet', p:'5,000', bg:'#dcfce7', badge:'' },{ n:'Spa & Massage', p:'15,000', bg:'#fce7f3', badge:'\u23F1 60min' },{ n:'Parking 24h', p:'2,000', bg:'#f1f5f9', badge:'' }],
      cart: ['Ch. Double x1','Petit-dej x2','Parking x1'], total: '47,000' },
    { activity: 'electronics', color: '#0891b2',
      stats: [{ v: '420,000', c: '#0891b2' }, { v: '78', c: '#16a34a' }, { v: '15', c: '#ef4444' }], stat3Label: 'Stock faible',
      bars: [55,70,85,60,90,75,80,65,88,72,95,82],
      sidebar: ['Caisse','Produits','Stock','SAV','Employes'],
      categories: ['Telephones','Ordinateurs','Accessoires'],
      products: [{ n:'iPhone 15 Pro', p:'750,000', bg:'#ecfeff', badge:'📱 Apple' },{ n:'Samsung Galaxy S24', p:'550,000', bg:'#dbeafe', badge:'📱 Samsung' },{ n:'MacBook Air M3', p:'900,000', bg:'#f1f5f9', badge:'💻 Apple' },{ n:'Ecouteurs AirPods', p:'120,000', bg:'#dcfce7', badge:'🎧 Apple' },{ n:'Chargeur USB-C', p:'8,000', bg:'#fef3c7', badge:'' },{ n:'Coque silicone', p:'5,000', bg:'#fce7f3', badge:'' }],
      cart: ['iPhone 15 Pro x1','Coque x1','Chargeur x2'], total: '771,000' },
    { activity: 'gym', color: '#f97316',
      stats: [{ v: '180,000', c: '#f97316' }, { v: '120', c: '#16a34a' }, { v: '85%', c: '#2563eb' }], stat3Label: 'Taux renouv.',
      bars: [80,75,85,90,70,65,88,92,78,82,86,94],
      sidebar: ['Caisse','Abonnements','Planning','Clients','Employes'],
      categories: ['Abonnements','Coaching','Supplements'],
      products: [{ n:'Abo Mensuel', p:'25,000', bg:'#fff7ed', badge:'🏋️ 30j' },{ n:'Abo Annuel', p:'250,000', bg:'#dcfce7', badge:'🏋️ 365j' },{ n:'Coach Perso x10', p:'80,000', bg:'#fef3c7', badge:'👤 10 seances' },{ n:'Pass Journee', p:'3,000', bg:'#dbeafe', badge:'🏋️ 1j' },{ n:'Whey Protein 1kg', p:'15,000', bg:'#fce7f3', badge:'⚡ 1kg' },{ n:'Serviette sport', p:'5,000', bg:'#f1f5f9', badge:'' }],
      cart: ['Abo Mensuel x1','Coach x10','Whey x1'], total: '120,000' },
    { activity: 'spa', color: '#14b8a6',
      stats: [{ v: '310,000', c: '#14b8a6' }, { v: '65', c: '#16a34a' }, { v: '50min', c: '#2563eb' }], stat3Label: 'Duree moy.',
      bars: [60,65,75,80,85,90,88,82,78,70,85,92],
      sidebar: ['Caisse','Soins','RDV','Produits','Employes'],
      categories: ['Massages','Visage','Corps'],
      products: [{ n:'Massage Relaxant', p:'20,000', bg:'#f0fdfa', badge:'💆 60min' },{ n:'Soin Visage Premium', p:'25,000', bg:'#dcfce7', badge:'💆 45min' },{ n:'Gommage Corps', p:'15,000', bg:'#fef3c7', badge:'💆 30min' },{ n:'Massage Pierres', p:'30,000', bg:'#fce7f3', badge:'💆 75min' },{ n:'Manucure Gel', p:'8,000', bg:'#dbeafe', badge:'💅 40min' },{ n:'Epilation cire', p:'5,000', bg:'#f1f5f9', badge:'⏱ 20min' }],
      cart: ['Massage Relaxant x1','Soin Visage x1','Manucure x1'], total: '53,000' },
    { activity: 'auto_repair', color: '#78716c',
      stats: [{ v: '480,000', c: '#78716c' }, { v: '35', c: '#16a34a' }, { v: '2.5h', c: '#f59e0b' }], stat3Label: 'Temps moy.',
      bars: [70,60,80,75,65,90,85,55,78,88,72,82],
      sidebar: ['Caisse','Reparations','Stock','Vehicules','Factures'],
      categories: ['Mecanique','Electricite','Carrosserie'],
      products: [{ n:'Vidange complete', p:'25,000', bg:'#f5f5f4', badge:'🔧 45min' },{ n:'Freins avant', p:'45,000', bg:'#fef2f2', badge:'🔧 90min' },{ n:'Pneu 205/55R16', p:'35,000', bg:'#dbeafe', badge:'🔧 30min' },{ n:'Batterie 12V', p:'40,000', bg:'#fef3c7', badge:'⚡ 12V' },{ n:'Diagnostic elec.', p:'15,000', bg:'#dcfce7', badge:'🔧 60min' },{ n:'Climatisation', p:'30,000', bg:'#f1f5f9', badge:'❄️ 120min' }],
      cart: ['Vidange x1','Freins avant x1','Diagnostic x1'], total: '85,000' },
    { activity: 'travel_agency', color: '#06b6d4',
      stats: [{ v: '2,500,000', c: '#06b6d4' }, { v: '18', c: '#16a34a' }, { v: '92%', c: '#2563eb' }], stat3Label: 'Satisfaction',
      bars: [50,65,80,70,95,85,90,88,75,60,82,78],
      sidebar: ['Caisse','Voyages','Reservations','Clients','Factures'],
      categories: ['Vols','Hotels','Packages'],
      products: [{ n:'Vol Douala-Paris', p:'450,000', bg:'#ecfeff', badge:'✈️ Aller' },{ n:'Visa Schengen', p:'75,000', bg:'#dbeafe', badge:'📋 15j' },{ n:'Hotel 3* x5 nuits', p:'175,000', bg:'#dcfce7', badge:'🏨 5N' },{ n:'Assurance voyage', p:'25,000', bg:'#fef3c7', badge:'🛡 30j' },{ n:'Transfer aeroport', p:'20,000', bg:'#fce7f3', badge:'🚗 A/R' },{ n:'Package Dubaï 7j', p:'800,000', bg:'#f3e8ff', badge:'✈️ All incl.' }],
      cart: ['Vol DLA-CDG x2','Hotel 3* x1','Assurance x2'], total: '1,175,000' },
    { activity: 'school', color: '#059669',
      stats: [{ v: '850,000', c: '#059669' }, { v: '245', c: '#16a34a' }, { v: '32', c: '#2563eb' }], stat3Label: 'Classes',
      bars: [90,88,85,92,80,75,82,78,86,90,84,88],
      sidebar: ['Caisse','Inscriptions','Eleves','Classes','Rapports'],
      categories: ['Frais scol.','Fournitures','Cantine'],
      products: [{ n:'Inscription annuelle', p:'150,000', bg:'#dcfce7', badge:'📚 2025/26' },{ n:'Frais examen', p:'25,000', bg:'#dbeafe', badge:'📋 Trim.' },{ n:'Uniforme complet', p:'15,000', bg:'#fef3c7', badge:'👔 S/M/L' },{ n:'Manuels scolaires', p:'20,000', bg:'#fce7f3', badge:'📖 Lot' },{ n:'Cantine mensuelle', p:'12,000', bg:'#f1f5f9', badge:'🍽 30j' },{ n:'Transport scolaire', p:'10,000', bg:'#f3e8ff', badge:'🚌 Mensuel' }],
      cart: ['Inscription x1','Uniforme x1','Cantine x3'], total: '201,000' },
    { activity: 'pet_shop', color: '#d97706',
      stats: [{ v: '165,000', c: '#d97706' }, { v: '92', c: '#16a34a' }, { v: '8', c: '#ef4444' }], stat3Label: 'Stock faible',
      bars: [65,70,80,75,85,60,90,72,88,68,82,78],
      sidebar: ['Caisse','Produits','Stock','Clients','Employes'],
      categories: ['Alimentation','Accessoires','Hygiene'],
      products: [{ n:'Croquettes chien 10kg', p:'18,000', bg:'#fef3c7', badge:'🐕 10kg' },{ n:'Croquettes chat 5kg', p:'12,000', bg:'#dcfce7', badge:'🐱 5kg' },{ n:'Laisse cuir L', p:'5,000', bg:'#dbeafe', badge:'🐕 L' },{ n:'Litiere 10L', p:'4,500', bg:'#f1f5f9', badge:'🐱 10L' },{ n:'Jouet balle', p:'2,000', bg:'#fce7f3', badge:'' },{ n:'Shampooing animal', p:'3,500', bg:'#f3e8ff', badge:'🧴 250ml' }],
      cart: ['Croquettes chien x2','Litiere x1','Laisse x1'], total: '45,500' },
    { activity: 'btp', color: '#92400e',
      stats: [{ v: '12,500,000', c: '#92400e' }, { v: '8', c: '#16a34a' }, { v: '3', c: '#2563eb' }], stat3Label: 'Chantiers',
      bars: [45,55,70,80,90,85,75,88,65,78,82,60],
      sidebar: ['Caisse','Devis','Stock','Fournisseurs','Factures'],
      categories: ['Materiaux','Equipement','Main d\'oeuvre'],
      products: [{ n:'Ciment CPA 50kg', p:'5,500', bg:'#fef3c7', badge:'⚖ 50kg' },{ n:'Fer a beton 12mm', p:'4,800', bg:'#f5f5f4', badge:'⚖ 12m' },{ n:'Gravier 1m³', p:'15,000', bg:'#e0e7ff', badge:'⚖ 1m³' },{ n:'Sable 1m³', p:'8,000', bg:'#fef2f2', badge:'⚖ 1m³' },{ n:'Location betonniere', p:'25,000', bg:'#dbeafe', badge:'🔧 /jour' },{ n:'Maconnerie m²', p:'8,000', bg:'#dcfce7', badge:'👷 /m²' }],
      cart: ['Ciment x100','Fer 12mm x50','Gravier x5'], total: '865,000' },
  ]

  const FEATURED_KEYS = new Set(FEATURED_SECTORS.map(s => s.activity))

  // ── Activity categories for the "all sectors" filter tabs ──
  const ACTIVITY_CATEGORIES: { key: string; i18nKey: keyof typeof t.landing; activities: Activity[] }[] = [
    { key: 'all', i18nKey: 'sectorsCategoryAll', activities: ALL_ACTIVITIES },
    { key: 'food', i18nKey: 'sectorsCategoryFood', activities: ['restaurant', 'bar', 'bakery', 'supermarket'] },
    { key: 'retail', i18nKey: 'sectorsCategoryRetail', activities: ['pharmacy', 'fashion', 'electronics', 'florist', 'pet_shop', 'bookstore', 'gas_station'] },
    { key: 'services', i18nKey: 'sectorsCategoryServices', activities: ['services', 'laundry', 'printing', 'home_cleaning', 'car_wash', 'auto_repair', 'hair_salon'] },
    { key: 'wellness', i18nKey: 'sectorsCategoryWellness', activities: ['gym', 'spa', 'pool', 'hotel', 'travel_agency'] },
    { key: 'education', i18nKey: 'sectorsCategoryEducation', activities: ['school', 'daycare', 'real_estate'] },
    { key: 'construction', i18nKey: 'sectorsCategoryConstruction', activities: ['btp'] },
  ]

  const filteredActivities = ACTIVITY_CATEGORIES.find(c => c.key === activeCategory)?.activities || ALL_ACTIVITIES

  const NAV_SECTIONS = [
    { id: 'features', label: t.landing.navFeatures },
    { id: 'sectors', label: t.landing.navSectors },
    { id: 'pricing', label: t.landing.navPricing },
    { id: 'install', label: t.landing.navInstall },
    { id: 'testimonials', label: t.landing.navTestimonials },
    { id: 'partner', label: (t.landing as any)?.navPartner || 'Partenaires' },
    { id: 'faq', label: t.landing.navFaq },
  ]

  const HOW_STEPS = [
    { step: '01', title: t.landing.howStep1Title, description: t.landing.howStep1Desc, color: '#2563eb' },
    { step: '02', title: t.landing.howStep2Title, description: t.landing.howStep2Desc, color: '#16a34a' },
    { step: '03', title: t.landing.howStep3Title, description: t.landing.howStep3Desc, color: '#9333ea' },
  ]

  // ========================================================================
  // STYLES
  // ========================================================================

  const pageFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

  // -- Header / Navbar
  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: headerScrolled ? '12px 0' : '16px 0',
    backgroundColor: headerScrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
    backdropFilter: headerScrolled ? 'blur(12px)' : 'none',
    boxShadow: headerScrolled ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.3s ease',
  }

  const navContainerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const logoIconContainerStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const navLinksStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 32,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  }

  const navLinkStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: headerScrolled ? '#475569' : '#ffffff',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s',
    background: 'none',
    border: 'none',
    fontFamily: pageFont,
    padding: 0,
  }

  const navCTAStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    fontFamily: pageFont,
  }

  // -- Section container
  const sectionStyle = (bg?: string): React.CSSProperties => ({
    padding: '96px 24px',
    backgroundColor: bg || 'transparent',
  })

  const containerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 'clamp(28px, 4vw, 40px)',
    fontWeight: 800,
    color: '#0f172a',
    textAlign: 'center',
    margin: '0 0 16px',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  }

  const sectionSubtitleStyle: React.CSSProperties = {
    fontSize: 'clamp(16px, 2vw, 18px)',
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 640,
    margin: '0 auto 64px',
    lineHeight: 1.6,
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div style={{ fontFamily: pageFont, color: '#0f172a', overflowX: 'hidden' }}>

      {/* ================================================================
          KEYFRAME ANIMATIONS + RESPONSIVE CSS
          ================================================================ */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }

        /* ---- Focus-visible for all interactive elements ---- */
        .landing-page-root button:focus-visible,
        .landing-page-root a:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
          border-radius: 4px;
        }

        .landing-lang-btn:hover {
          opacity: 0.85;
        }

        /* ---- Mobile-first responsive ---- */
        .landing-nav-links { display: none !important; }
        .landing-nav-cta-desktop { display: none !important; }
        .landing-mobile-toggle { display: flex !important; }

        .landing-hero-inner { flex-direction: column !important; }
        .landing-hero-left { max-width: 100% !important; }
        .landing-hero-right { display: none !important; }
        .landing-hero-content { text-align: center !important; }
        .landing-hero-buttons { justify-content: center !important; }
        .landing-hero-stats { flex-direction: column !important; gap: 16px !important; align-items: center !important; }
        .landing-hero-stats-divider { display: none !important; }

        .landing-features-grid { grid-template-columns: 1fr !important; }
        .landing-steps-grid { grid-template-columns: 1fr !important; }
        .landing-step-connector { display: none !important; }
        .landing-pricing-grid { grid-template-columns: 1fr !important; }
        .landing-testimonials-grid { grid-template-columns: 1fr !important; }
        .landing-sectors-featured { grid-template-columns: 1fr !important; }
        .landing-sectors-all-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .landing-sector-stats { grid-template-columns: 1fr !important; }
        .landing-sector-products { grid-template-columns: repeat(2, 1fr) !important; }
        .landing-trust-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .landing-footer-grid { grid-template-columns: 1fr !important; text-align: center; }
        .landing-footer-bottom { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
        .landing-social-links { justify-content: center !important; }
        .landing-billing-toggle-container { flex-direction: column !important; align-items: center !important; }
        .landing-hero-trust-badge-text { font-size: 12px !important; }
        .landing-section-padding { padding: 64px 16px !important; }

        /* ---- Tablet: min-width 600px ---- */
        @media (min-width: 600px) {
          .landing-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-testimonials-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-sectors-featured { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-sectors-all-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .landing-trust-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-footer-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-section-padding { padding: 80px 24px !important; }
          .landing-billing-toggle-container { flex-direction: row !important; }
          .landing-hero-stats { flex-direction: row !important; gap: 32px !important; align-items: center !important; }
          .landing-hero-stats-divider { display: block !important; }
        }

        /* ---- Desktop: min-width 1024px ---- */
        @media (min-width: 1024px) {
          .landing-nav-links { display: flex !important; }
          .landing-nav-cta-desktop { display: flex !important; }
          .landing-mobile-toggle { display: none !important; }

          .landing-hero-inner { flex-direction: row !important; }
          .landing-hero-left { max-width: 640px !important; }
          .landing-hero-right { display: flex !important; }
          .landing-hero-content { text-align: left !important; }
          .landing-hero-buttons { justify-content: flex-start !important; }
          .landing-hero-stats { flex-direction: row !important; justify-content: flex-start !important; }

          .landing-features-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .landing-steps-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .landing-step-connector { display: block !important; }
          .landing-pricing-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .landing-testimonials-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .landing-sectors-featured { grid-template-columns: repeat(4, 1fr) !important; }
          .landing-sectors-all-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .landing-trust-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .landing-footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr !important; text-align: left; }
          .landing-footer-bottom { flex-direction: row !important; text-align: left !important; }
          .landing-social-links { justify-content: flex-start !important; }
          .landing-section-padding { padding: 96px 24px !important; }
        }

        /* ---- Scroll-to-top button ---- */
        .landing-scroll-top {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 999;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: none;
          background: #2563eb;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(20px);
          pointer-events: none;
        }
        .landing-scroll-top.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .landing-scroll-top:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(37,99,235,0.45);
        }
        .landing-scroll-top.visible:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 599px) {
          .landing-scroll-top {
            bottom: 20px;
            right: 20px;
            width: 44px;
            height: 44px;
          }
        }
      `}</style>

      <div className="landing-page-root">

      {/* ================================================================
          HEADER / NAVBAR
          ================================================================ */}
      <header style={headerStyle}>
        <nav style={navContainerStyle} aria-label="Main navigation">
          {/* Logo */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              scrollToTop()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            aria-label="POS Mano Verde"
          >
            <div style={logoIconContainerStyle}>
              <LogoIcon size={20} />
            </div>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              color: headerScrolled ? '#0f172a' : '#ffffff',
              transition: 'color 0.3s',
            }}>
              POS Mano Verde
            </span>
          </a>

          {/* Desktop nav links */}
          <ul className="landing-nav-links" style={navLinksStyle}>
            {NAV_SECTIONS.map((nav) => (
              <li key={nav.id}>
                <button style={navLinkStyle} onClick={() => scrollToSection(nav.id)}>
                  {nav.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop CTA + Language Selector */}
          <div className="landing-nav-cta-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LandingLanguageSelector scrolled={headerScrolled} />
            <button
              style={{
                ...navLinkStyle,
                color: headerScrolled ? '#2563eb' : '#ffffff',
                fontWeight: 600,
              }}
              onClick={handleGoToLogin}
            >
              {t.landing.navLogin}
            </button>
            <button
              style={navCTAStyle}
              onClick={handleStartApp}
            >
              {t.landing.navStart}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="landing-mobile-toggle"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: headerScrolled ? '#0f172a' : '#ffffff',
              padding: 4,
            }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <IconXClose /> : <IconMenu />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '16px 24px 24px',
            animation: 'fadeIn 0.2s ease',
          }}>
            {/* Mobile language selector at top */}
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <LandingLanguageSelector scrolled={true} />
            </div>

            {NAV_SECTIONS.map((nav) => (
              <button
                key={nav.id}
                onClick={() => scrollToSection(nav.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontFamily: pageFont,
                }}
              >
                {nav.label}
              </button>
            ))}

            {/* Mobile Connexion button */}
            <button
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 20px',
                marginTop: 12,
                borderRadius: 8,
                border: '2px solid #2563eb',
                backgroundColor: 'transparent',
                color: '#2563eb',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: pageFont,
              }}
              onClick={() => {
                setMobileMenuOpen(false)
                handleGoToLogin()
              }}
            >
              {t.landing.navLogin}
            </button>

            {/* Mobile Commencer button */}
            <button
              style={{
                ...navCTAStyle,
                width: '100%',
                marginTop: 8,
                padding: '14px 20px',
                fontSize: 15,
                textAlign: 'center',
                display: 'block',
              }}
              onClick={() => {
                setMobileMenuOpen(false)
                handleStartApp()
              }}
            >
              {t.landing.heroCTA1}
            </button>
          </div>
        )}
      </header>

      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section id="top" style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #1e40af 60%, #2563eb 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientMove 12s ease infinite',
        display: 'flex',
        alignItems: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration circles */}
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          top: -200, right: -200, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.1) 0%, transparent 70%)',
          bottom: -100, left: -100, pointerEvents: 'none',
        }} />
        {/* Small floating dots */}
        {[
          { top: '15%', left: '10%', size: 6, delay: '0s' },
          { top: '25%', right: '15%', size: 4, delay: '1s' },
          { top: '60%', left: '5%', size: 5, delay: '0.5s' },
          { top: '70%', right: '8%', size: 3, delay: '1.5s' },
          { top: '40%', left: '80%', size: 5, delay: '2s' },
        ].map((dot, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: dot.size,
            height: dot.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.15)',
            top: dot.top,
            left: (dot as any).left,
            right: (dot as any).right,
            animation: `float 4s ease-in-out ${dot.delay} infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        <div style={{ ...containerStyle, width: '100%' }}>
          <div className="landing-hero-inner" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 64,
          }}>
            {/* Left: Text Content */}
            <div className="landing-hero-left" style={{ flex: 1, maxWidth: 640 }}>
              <div className="landing-hero-content" style={{
                animation: 'fadeInUp 0.8s ease forwards',
              }}>
                {/* Trust badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 100,
                  padding: '8px 16px',
                  marginBottom: 24,
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  <IconShield />
                  <span className="landing-hero-trust-badge-text" style={{ color: '#ffffff', fontSize: 13, fontWeight: 500 }}>
                    {t.landing.heroTrustBadge}
                  </span>
                </div>

                <h1 style={{
                  fontSize: 'clamp(32px, 5.5vw, 60px)',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  margin: '0 0 24px',
                  letterSpacing: '-0.03em',
                }}>
                  {t.landing.heroTitle1}
                  <br />
                  <span style={{
                    background: 'linear-gradient(90deg, #4ade80, #22d3ee)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {t.landing.heroTitle2}
                  </span>
                  {' '}{t.landing.heroTitle3}
                </h1>

                <p style={{
                  fontSize: 'clamp(16px, 2vw, 20px)',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.6,
                  margin: '0 0 40px',
                  maxWidth: 520,
                }}>
                  {t.landing.heroSubtitle}
                </p>

                {/* CTA buttons */}
                <div className="landing-hero-buttons" style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 48,
                }}>
                  <button
                    style={{
                      padding: '16px 32px',
                      borderRadius: 12,
                      border: 'none',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontSize: 17,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 24px rgba(22,163,74,0.4)',
                      fontFamily: pageFont,
                    }}
                    onClick={handleStartApp}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(22,163,74,0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(22,163,74,0.4)'
                    }}
                  >
                    {t.landing.heroCTA1}
                    <IconArrowRight size={18} />
                  </button>
                  <button
                    style={{
                      padding: '16px 28px',
                      borderRadius: 12,
                      border: '2px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(4px)',
                      fontFamily: pageFont,
                    }}
                    onClick={() => scrollToSection('video-demo')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                    }}
                  >
                    <IconPlay size={16} />
                    {t.landing.heroCTA2}
                  </button>
                </div>

                {/* Floating stats */}
                <div className="landing-hero-stats" style={{
                  display: 'flex',
                  gap: 32,
                  flexWrap: 'wrap',
                }}>
                  <div ref={stat1.ref} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#4ade80' }}>{stat1.count}+</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                      {t.landing.heroStat1Label}
                    </span>
                  </div>
                  <div className="landing-hero-stats-divider" style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'stretch' }} />
                  <div ref={stat2.ref} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#22d3ee' }}>{stat2.count}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                      {t.landing.heroStat2Label}
                    </span>
                  </div>
                  <div className="landing-hero-stats-divider" style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'stretch' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#ffffff' }}>{t.landing.heroStat3Value}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                      {t.landing.heroStat3Label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Mock POS Interface Illustration */}
            <div className="landing-hero-right" style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              animation: 'slideInRight 1s ease forwards',
            }}>
              <div style={{
                width: 380,
                maxWidth: '100%',
                animation: 'float 6s ease-in-out infinite',
                position: 'relative',
              }}>
                {/* Mock phone / tablet with POS UI */}
                <div style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 28,
                  padding: 12,
                  boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                }}>
                  {/* Status bar */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 16px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 11,
                  }}>
                    <span>9:41</span>
                    <div style={{ width: 60, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: 3, height: 6, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                      <div style={{ width: 3, height: 9, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                      <div style={{ width: 3, height: 12, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                    </span>
                  </div>

                  {/* Screen content */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 20,
                    overflow: 'hidden',
                    minHeight: 420,
                  }}>
                    {/* App header bar */}
                    <div style={{
                      background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LogoIcon size={16} />
                        </div>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>POS Mano Verde</span>
                      </div>
                      <div style={{
                        backgroundColor: '#22c55e',
                        borderRadius: 100,
                        padding: '3px 10px',
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#fff' }} />
                        {t.sidebar.online}
                      </div>
                    </div>

                    {/* Mock products */}
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{t.nav.pos} - #1042</span>
                        <span style={{ fontSize: 10, color: '#64748b' }}>14:32</span>
                      </div>
                      {[
                        { name: 'Riz Basmati 5kg', price: '4 500', qty: 2 },
                        { name: 'Huile Palme 1L', price: '1 800', qty: 1 },
                        { name: 'Savon Marseille', price: '750', qty: 3 },
                        { name: 'Sucre 1kg', price: '950', qty: 1 },
                      ].map((item, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          backgroundColor: i % 2 === 0 ? '#ffffff' : '#f1f5f9',
                          borderRadius: 8,
                          marginBottom: 4,
                          fontSize: 11,
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                            <div style={{ color: '#94a3b8', fontSize: 10 }}>x{item.qty}</div>
                          </div>
                          <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 12 }}>{item.price} F</span>
                        </div>
                      ))}

                      {/* Total */}
                      <div style={{
                        borderTop: '2px dashed #e2e8f0',
                        marginTop: 12,
                        paddingTop: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>TOTAL</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>$24.50 USD</span>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <div style={{
                          flex: 1, backgroundColor: '#2563eb', borderRadius: 10,
                          padding: '12px', textAlign: 'center', color: '#fff',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {t.pos.confirmPayment}
                        </div>
                        <div style={{
                          flex: 1, backgroundColor: '#f1f5f9', borderRadius: 10,
                          padding: '12px', textAlign: 'center', color: '#64748b',
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {t.pos.printReceipt}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification cards */}
                <div style={{
                  position: 'absolute',
                  top: 80,
                  right: -40,
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  padding: '12px 16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  animation: 'float 5s ease-in-out 1s infinite',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconCheck size={18} color="#16a34a" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.pos.orderSuccess}</div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>Bluetooth &#10003;</div>
                  </div>
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: 60,
                  left: -60,
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  padding: '12px 16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  animation: 'float 5s ease-in-out 2s infinite',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <IconRefresh />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.sync.synced}</div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>42 &#10003;</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved bottom separator */}
        <div style={{
          position: 'absolute',
          bottom: -2,
          left: 0,
          right: 0,
          lineHeight: 0,
        }}>
          <svg viewBox="0 0 1440 80" fill="none" style={{ width: '100%', height: 80 }}>
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ================================================================
          TRUSTED BY / SOCIAL PROOF BAR
          ================================================================ */}
      <section style={{
        backgroundColor: '#f8fafc',
        padding: '32px 24px 64px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 24,
        }}>
          {t.landing.trustBadge}
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '24px 48px',
          opacity: 0.5,
          maxWidth: 900,
          margin: '0 auto',
        }}>
          {[
            { region: 'Afrique', countries: ['Cameroun', 'S\u00e9n\u00e9gal', 'C\u00f4te d\'Ivoire'] },
            { region: 'Europe', countries: ['France', 'Belgique', 'Suisse'] },
            { region: 'Am\u00e9riques', countries: ['USA', 'Canada', 'Br\u00e9sil'] },
            { region: 'Asie', countries: ['Chine', 'Japon', 'Inde'] },
            { region: 'Oc\u00e9anie', countries: ['Australie', 'N-Z\u00e9lande'] },
          ].map((group) => (
            <div key={group.region} style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                {group.region.toUpperCase()}
              </span>
              <div style={{ display: 'flex', gap: 16 }}>
                {group.countries.map((c) => (
                  <span key={c} style={{ fontSize: 14, fontWeight: 700, color: '#64748b', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                    {c.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          FEATURES SECTION
          ================================================================ */}
      <section id="features" className="landing-section-padding" style={sectionStyle('#ffffff')}>
        <div style={containerStyle}>
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#2563eb',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}>
            {t.landing.navFeatures}
          </p>
          <h2 style={sectionTitleStyle}>{t.landing.featuresTitle}</h2>
          <p style={sectionSubtitleStyle}>
            {t.landing.featuresSubtitle}
          </p>

          <div className="landing-features-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}>
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                style={{
                  padding: 32,
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'
                  e.currentTarget.style.borderColor = '#bfdbfe'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  color: '#2563eb',
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: '0 0 10px',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: 14,
                  color: '#64748b',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PRODUCT SHOWCASE
          ================================================================ */}
      <section id="showcase" className="landing-section-padding" style={{
        ...sectionStyle('#f8fafc'),
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      }}>
        <div style={containerStyle}>
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#2563eb',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}>
            {t.landing.showcaseBadge}
          </p>
          <h2 style={sectionTitleStyle}>{t.landing.showcaseTitle}</h2>
          <p style={sectionSubtitleStyle}>{t.landing.showcaseSubtitle}</p>

          {/* Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
            {[t.landing.showcaseTab1, t.landing.showcaseTab2, t.landing.showcaseTab3].map((tab, i) => (
              <button
                key={i}
                onClick={() => setShowcaseTab(i)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 50,
                  border: showcaseTab === i ? '2px solid #2563eb' : '2px solid #e2e8f0',
                  backgroundColor: showcaseTab === i ? '#2563eb' : '#ffffff',
                  color: showcaseTab === i ? '#ffffff' : '#334155',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: pageFont,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Mockup area */}
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: 16,
            padding: '24px 24px 0',
            maxWidth: 900,
            margin: '0 auto',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          }}>
            {/* Browser chrome */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <div style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', marginLeft: 8 }} />
            </div>

            {/* Dashboard mockup */}
            {showcaseTab === 0 && (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0', padding: 24, minHeight: 320 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                  {['#2563eb', '#16a34a', '#f59e0b'].map((color, i) => (
                    <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 20, borderLeft: `4px solid ${color}` }}>
                      <div style={{ width: 60, height: 10, backgroundColor: '#cbd5e1', borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: pageFont }}>{['247,500', '38', '12'][i]}</div>
                      <div style={{ width: 80, height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, marginTop: 6 }} />
                    </div>
                  ))}
                </div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 20, height: 120 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: '100%' }}>
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: '#2563eb', borderRadius: '4px 4px 0 0', opacity: 0.7 + (i * 0.025) }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* POS mockup */}
            {showcaseTab === 1 && (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0', padding: 24, minHeight: 320 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, textAlign: 'center', border: i === 1 ? '2px solid #2563eb' : '1px solid #e2e8f0' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#e0e7ff', '#f1f5f9'][i], margin: '0 auto 8px' }} />
                          <div style={{ width: '70%', height: 8, backgroundColor: '#cbd5e1', borderRadius: 4, margin: '0 auto 4px' }} />
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: pageFont }}>
                            {['1,200', '850', '2,500', '600', '3,200', '450'][i]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, fontFamily: pageFont }}>Panier</div>
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ width: 80, height: 8, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
                        <div style={{ width: 40, height: 8, backgroundColor: '#cbd5e1', borderRadius: 4 }} />
                      </div>
                    ))}
                    <div style={{ marginTop: 16, padding: '12px 0', borderTop: '2px solid #0f172a', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, fontFamily: pageFont }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: 16, color: '#2563eb', fontFamily: pageFont }}>4,550</span>
                    </div>
                    <div style={{ backgroundColor: '#2563eb', color: '#fff', borderRadius: 8, padding: '10px 0', textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: 700, fontFamily: pageFont }}>
                      Payer
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reports mockup */}
            {showcaseTab === 2 && (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0', padding: 24, minHeight: 320 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 20 }}>
                    <div style={{ width: 100, height: 8, backgroundColor: '#cbd5e1', borderRadius: 4, marginBottom: 16 }} />
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
                      {[30, 50, 40, 70, 60, 85, 75].map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: i === 6 ? '#2563eb' : '#dbeafe', borderRadius: '3px 3px 0 0' }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 100, height: 100, borderRadius: '50%', border: '10px solid #2563eb', borderRightColor: '#dbeafe', borderBottomColor: '#93c5fd', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: pageFont }}>72%</span>
                    </div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16 }}>
                  {[1, 2, 3, 4].map((_, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ['#2563eb', '#16a34a', '#f59e0b', '#9333ea'][i] }} />
                        <div style={{ width: 100 + i * 20, height: 8, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
                      </div>
                      <div style={{ width: 50, height: 8, backgroundColor: '#cbd5e1', borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tab descriptions */}
          <p style={{ textAlign: 'center', fontSize: 15, color: '#64748b', lineHeight: 1.7, marginTop: 24, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            {[t.landing.showcaseTab1Desc, t.landing.showcaseTab2Desc, t.landing.showcaseTab3Desc][showcaseTab]}
          </p>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={() => {
                const el = document.getElementById('pricing')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              style={{
                padding: '14px 32px',
                borderRadius: 50,
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: pageFont,
                transition: 'all 0.2s ease',
              }}
            >
              {t.landing.showcaseCTA} &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================
          VIDEO DEMO
          ================================================================ */}
      <section id="video-demo" style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{ ...containerStyle, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#ffffff', margin: '0 0 12px', fontFamily: pageFont }}>
            {t.landing.demoTitle}
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 24px', fontFamily: pageFont }}>
            {t.landing.demoSubtitle}
          </p>

          {/* Responsive video player — optimized for low bandwidth */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 720,
            margin: '0 auto 28px',
            borderRadius: 'clamp(8px, 2vw, 16px)',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            aspectRatio: '640 / 356',
            backgroundColor: '#0f172a',
          }}>
            <video
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/demo-poster.jpg"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            >
              <source src="/demo-pos-manoverde.webm" type="video/webm" />
              <source src="/demo-pos-manoverde.mp4" type="video/mp4" />
            </video>
          </div>

          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 28px', fontFamily: pageFont }}>
            {t.landing.demoDuration}
          </p>
          <button
            onClick={() => {
              const el = document.getElementById('pricing')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            style={{
              padding: '14px 32px',
              borderRadius: 50,
              border: '2px solid rgba(255,255,255,0.2)',
              backgroundColor: 'transparent',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: pageFont,
              transition: 'all 0.2s ease',
            }}
          >
            {t.landing.demoCTA} &rarr;
          </button>
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <section id="how-it-works" className="landing-section-padding" style={{
        ...sectionStyle('#f8fafc'),
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      }}>
        <div style={containerStyle}>
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#16a34a',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}>
            {t.landing.howBadge}
          </p>
          <h2 style={sectionTitleStyle}>{t.landing.howTitle}</h2>
          <p style={sectionSubtitleStyle}>
            {t.landing.howSubtitle}
          </p>

          <div className="landing-steps-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 40,
            maxWidth: 960,
            margin: '0 auto',
          }}>
            {HOW_STEPS.map((step, index) => (
              <div key={index} style={{ textAlign: 'center', position: 'relative' }}>
                {/* Connector line */}
                {index < 2 && (
                  <div className="landing-step-connector" style={{
                    position: 'absolute',
                    top: 44,
                    left: '60%',
                    right: '-40%',
                    height: 2,
                    background: `linear-gradient(90deg, ${step.color}40, ${step.color}10)`,
                  }} />
                )}
                <div style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  backgroundColor: `${step.color}10`,
                  border: `3px solid ${step.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  <span style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: step.color,
                    letterSpacing: '-0.02em',
                  }}>
                    {step.step}
                  </span>
                </div>
                <h3 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: '0 0 12px',
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: 14,
                  color: '#64748b',
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: 280,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTORS / USE CASES — ALL 27 ACTIVITIES
          ================================================================ */}
      <section id="sectors" className="landing-section-padding" style={sectionStyle('#ffffff')}>
        <div style={containerStyle}>
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#16a34a',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}>
            {t.landing.navSectors}
          </p>
          <h2 style={sectionTitleStyle}>{t.landing.sectorsTitle}</h2>
          <p style={sectionSubtitleStyle}>{t.landing.sectorsSubtitle}</p>

          {/* Category filter tabs */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {ACTIVITY_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 20,
                  border: activeCategory === cat.key ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: activeCategory === cat.key ? '#eff6ff' : '#fff',
                  color: activeCategory === cat.key ? '#2563eb' : '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: pageFont,
                }}
              >
                {t.landing[cat.i18nKey]}
                {cat.key !== 'all' && <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>({cat.activities.length})</span>}
              </button>
            ))}
          </div>

          {/* Unified activity cards grid */}
          <div className="landing-sectors-all-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {filteredActivities.map((act) => {
              const Icon = ACTIVITY_ICONS[act]
              const color = ACTIVITY_COLORS[act]
              const isFeatured = FEATURED_KEYS.has(act)
              const setupKey = act as keyof typeof t.setup
              const wallpaper = ACTIVITY_WALLPAPERS[act]
              return (
                <div
                  key={act}
                  onClick={() => {
                    if (isFeatured) {
                      setSectorTab(0)
                      setSectorModal(act)
                    } else {
                      const el = document.getElementById('pricing')
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 20,
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'
                    e.currentTarget.style.borderColor = color
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                >
                  {/* Wallpaper subtle overlay for featured */}
                  {isFeatured && wallpaper && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `url(${wallpaper.replace('w=1200', 'w=400').replace('q=60', 'q=40')})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      opacity: 0.06, pointerEvents: 'none',
                    }} />
                  )}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} color={color} />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: pageFont, flex: 1 }}>
                        {t.setup[setupKey]}
                      </h3>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: '0 0 10px', fontFamily: pageFont, minHeight: 36 }}>
                      {t.setup[`${act}Desc` as keyof typeof t.setup]}
                    </p>
                    {isFeatured ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: color, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {t.landing.sectorsViewPreview} <span style={{ fontSize: 14 }}>&rarr;</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>&rarr;</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
          TECHNICAL TRUST / SECURITY
          ================================================================ */}
      <section className="landing-section-padding" style={{
        ...sectionStyle('#f8fafc'),
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      }}>
        <div style={containerStyle}>
          <h2 style={{ ...sectionTitleStyle, fontSize: 'clamp(24px, 3vw, 32px)' }}>{t.landing.trustTitle}</h2>
          <p style={sectionSubtitleStyle}>{t.landing.trustSubtitle}</p>

          <div className="landing-trust-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}>
            {[
              { icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ), title: t.landing.trust1Title, desc: t.landing.trust1Desc },
              { icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              ), title: t.landing.trust2Title, desc: t.landing.trust2Desc },
              { icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
                </svg>
              ), title: t.landing.trust3Title, desc: t.landing.trust3Desc },
              { icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                  <polyline points="8 14 12 10 16 14" />
                </svg>
              ), title: t.landing.trust4Title, desc: t.landing.trust4Desc },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 24 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: ['rgba(37,99,235,0.1)', 'rgba(22,163,74,0.1)', 'rgba(147,51,234,0.1)', 'rgba(245,158,11,0.1)'][i],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', fontFamily: pageFont }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0, fontFamily: pageFont }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PRICING SECTION
          ================================================================ */}
      <section id="pricing" className="landing-section-padding" style={sectionStyle('#ffffff')}>
        <div style={containerStyle}>
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#2563eb',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}>
            {t.landing.navPricing}
          </p>
          <h2 style={sectionTitleStyle}>{t.landing.pricingTitle}</h2>
          <p style={sectionSubtitleStyle}>
            {t.landing.pricingSubtitle}
          </p>

          {/* Billing toggle */}
          <div className="landing-billing-toggle-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginBottom: 48,
          }}>
            <span style={{
              fontSize: 14,
              fontWeight: billingYearly ? 400 : 600,
              color: billingYearly ? '#94a3b8' : '#0f172a',
              transition: 'all 0.2s',
            }}>
              {t.landing.pricingMonthly}
            </span>
            <button
              onClick={() => setBillingYearly(!billingYearly)}
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                border: 'none',
                backgroundColor: billingYearly ? '#16a34a' : '#cbd5e1',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.3s ease',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                position: 'absolute',
                top: 3,
                left: billingYearly ? 27 : 3,
                transition: 'left 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
            <span style={{
              fontSize: 14,
              fontWeight: billingYearly ? 600 : 400,
              color: billingYearly ? '#0f172a' : '#94a3b8',
              transition: 'all 0.2s',
            }}>
              {t.landing.pricingYearly}
            </span>
            {billingYearly && (
              <span style={{
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap',
              }}>
                {t.landing.pricingYearlySave}
              </span>
            )}
          </div>

          {/* Pricing cards */}
          <div className="landing-pricing-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 16,
            alignItems: 'stretch',
          }}>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                style={{
                  borderRadius: 20,
                  border: plan.highlight
                    ? '2px solid #16a34a'
                    : '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  padding: plan.highlight ? 0 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  boxShadow: plan.highlight
                    ? '0 16px 48px rgba(22,163,74,0.15)'
                    : '0 1px 3px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!plan.highlight) {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!plan.highlight) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                  }
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    backgroundColor: plan.badgeColor || '#2563eb',
                    color: '#ffffff',
                    textAlign: 'center',
                    padding: '6px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{
                  padding: '28px 24px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Plan name */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      margin: '0 0 4px',
                    }}>
                      {plan.tagline}
                    </p>
                    <h3 style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: '0 0 6px',
                    }}>
                      {plan.name}
                    </h3>
                    <p style={{
                      fontSize: 13,
                      color: '#64748b',
                      margin: 0,
                      lineHeight: 1.4,
                    }}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: 24 }}>
                    {plan.price === -1 ? (
                      <div>
                        <span style={{
                          fontSize: 28,
                          fontWeight: 800,
                          color: '#0f172a',
                        }}>
                          {t.landing.pricingCustom}
                        </span>
                      </div>
                    ) : plan.price === -2 ? (
                      <div>
                        <span style={{
                          fontSize: 36,
                          fontWeight: 800,
                          color: '#0f172a',
                          letterSpacing: '-0.02em',
                        }}>
                          $0.02
                        </span>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#64748b',
                          marginLeft: 6,
                        }}>
                          USD / ticket
                        </span>
                        <p style={{
                          fontSize: 13,
                          color: '#f59e0b',
                          fontWeight: 600,
                          margin: '4px 0 0',
                        }}>
                          {t.billing.noCommitment || 'Pas d\'engagement'}
                        </p>
                      </div>
                    ) : plan.price === 0 ? (
                      <div>
                        <span style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: '#0f172a',
                          letterSpacing: '-0.02em',
                        }}>
                          $
                        </span>
                        <span style={{
                          fontSize: 40,
                          fontWeight: 800,
                          color: '#0f172a',
                          letterSpacing: '-0.02em',
                        }}>
                          0
                        </span>
                        <p style={{
                          fontSize: 13,
                          color: '#16a34a',
                          fontWeight: 600,
                          margin: '4px 0 0',
                        }}>
                          {t.landing.pricingFreeForever}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: '#0f172a',
                          letterSpacing: '-0.02em',
                        }}>
                          $
                        </span>
                        <span style={{
                          fontSize: 36,
                          fontWeight: 800,
                          color: '#0f172a',
                          letterSpacing: '-0.02em',
                        }}>
                          {formatPrice(billingYearly ? plan.priceYearly : plan.price)}
                        </span>
                        <span style={{
                          fontSize: 16,
                          fontWeight: 500,
                          color: '#64748b',
                          marginLeft: 4,
                        }}>
                          {plan.currency}{t.landing.pricingPerMonth}
                        </span>
                        {billingYearly && plan.price > 0 && (
                          <p style={{
                            fontSize: 12,
                            color: '#16a34a',
                            fontWeight: 600,
                            margin: '4px 0 0',
                          }}>
                            ${formatPrice(plan.priceYearly * 12)} {plan.currency}{t.landing.pricingPerYear}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA button */}
                  <button
                    onClick={() => handlePlanCTA(plan.id)}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: 10,
                      border: plan.ctaVariant === 'solid'
                        ? 'none'
                        : '2px solid #2563eb',
                      backgroundColor: plan.ctaVariant === 'solid'
                        ? '#16a34a'
                        : 'transparent',
                      color: plan.ctaVariant === 'solid'
                        ? '#ffffff'
                        : '#2563eb',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: 24,
                      fontFamily: pageFont,
                    }}
                    onMouseEnter={(e) => {
                      if (plan.ctaVariant === 'solid') {
                        e.currentTarget.style.backgroundColor = '#15803d'
                      } else {
                        e.currentTarget.style.backgroundColor = '#2563eb'
                        e.currentTarget.style.color = '#ffffff'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (plan.ctaVariant === 'solid') {
                        e.currentTarget.style.backgroundColor = '#16a34a'
                      } else {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#2563eb'
                      }
                    }}
                  >
                    {plan.cta}
                  </button>

                  {/* Features */}
                  <div style={{ flex: 1 }}>
                    {plan.features.map((feature, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 0',
                        borderBottom: i < plan.features.length - 1 ? '1px solid #f1f5f9' : 'none',
                      }}>
                        {feature.included ? (
                          <IconCheck size={16} color="#16a34a" />
                        ) : (
                          <IconX size={16} color="#cbd5e1" />
                        )}
                        <span style={{
                          fontSize: 13,
                          color: feature.included ? '#334155' : '#94a3b8',
                          fontWeight: feature.included ? 500 : 400,
                        }}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Guarantee badge */}
          <div style={{
            textAlign: 'center',
            marginTop: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
              flexShrink: 0,
            }}>
              <IconShield />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
                {t.landing.pricingGuaranteeTitle}
              </p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                {t.landing.pricingGuaranteeDesc}
              </p>
            </div>
          </div>

          {/* Payment methods */}
          <div style={{
            textAlign: 'center',
            marginTop: 32,
          }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px' }}>
              {t.landing.pricingSecurePayment}
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
              flexWrap: 'wrap',
            }}>
              {['Mobile Money', 'Orange Money', 'Wave', 'Visa', 'Mastercard'].map((method) => (
                <span key={method} style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#94a3b8',
                  padding: '6px 14px',
                  borderRadius: 6,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          TESTIMONIALS
          ================================================================ */}
      <section id="testimonials" className="landing-section-padding" style={{
        ...sectionStyle('#f8fafc'),
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      }}>
        <div style={containerStyle}>
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#9333ea',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}>
            {t.landing.navTestimonials}
          </p>
          <h2 style={sectionTitleStyle}>{t.landing.testimonialsTitle}</h2>
          <p style={sectionSubtitleStyle}>
            {t.landing.testimonialsSubtitle}
          </p>

          <div className="landing-testimonials-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            justifyItems: 'center',
          }}>
            {TESTIMONIALS.map((testimonial, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 20,
                  padding: 32,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <IconStar key={i} size={16} />
                  ))}
                </div>

                {/* Quote */}
                <p style={{
                  fontSize: 15,
                  color: '#334155',
                  lineHeight: 1.7,
                  margin: '0 0 24px',
                  flex: 1,
                  fontStyle: 'italic',
                }}>
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: testimonial.avatarBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
                      {testimonial.name}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PARTNER / DEVENIR PARTENAIRE SECTION
          ================================================================ */}
      <section id="partner" className="landing-section-padding" style={{
        ...sectionStyle('#0f172a'),
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc',
      }}>
        <div style={containerStyle}>
          {/* Section Title */}
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#4ade80',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: '0 0 12px',
          }}>
            {(t.landing as any)?.partnerBadge || 'Programme Partenaire'}
          </p>
          <h2 style={{
            ...sectionTitleStyle,
            color: '#f8fafc',
          }}>
            {(t.landing as any)?.partnerTitle || 'Devenez Partenaire '}
            <span style={{
              background: 'linear-gradient(90deg, #4ade80, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {(t.landing as any)?.partnerTitleAccent || 'Mano Verde'}
            </span>
          </h2>
          <p style={{
            ...sectionSubtitleStyle,
            color: '#94a3b8',
          }}>
            {(t.landing as any)?.partnerSubtitle || 'Gagnez des commissions en aidant les commerçants à digitaliser leur activité'}
          </p>

          {/* 3 Value Proposition Cards */}
          <div className="landing-features-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            marginBottom: 80,
          }}>
            {/* Card 1 - Phone */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
              transition: 'transform 0.2s, background 0.2s',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 10px' }}>
                {(t.landing as any)?.partnerCard1Title || 'Gérez tout depuis un téléphone'}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
                {(t.landing as any)?.partnerCard1Desc || 'Proposez à vos clients une caisse enregistreuse professionnelle sur leur téléphone ou tablette. Toute activité commerciale, gérée simplement.'}
              </p>
            </div>

            {/* Card 2 - Commissions */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
              transition: 'transform 0.2s, background 0.2s',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 10px' }}>
                {(t.landing as any)?.partnerCard2Title || 'Commissions jusqu\'à 20%'}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
                {(t.landing as any)?.partnerCard2Desc || 'Évoluez à travers 4 niveaux de partenariat et augmentez vos revenus à chaque palier atteint.'}
              </p>
            </div>

            {/* Card 3 - Dashboard */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
              transition: 'transform 0.2s, background 0.2s',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #9333ea, #c084fc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 10px' }}>
                {(t.landing as any)?.partnerCard3Title || 'Suivi en temps réel'}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
                {(t.landing as any)?.partnerCard3Desc || 'Un tableau de bord dédié pour suivre vos clients, vos commissions et vos performances en temps réel.'}
              </p>
            </div>
          </div>

          {/* 4-Tier Progression Visual */}
          <h3 style={{
            textAlign: 'center',
            fontSize: 'clamp(20px, 3vw, 26px)',
            fontWeight: 700,
            color: '#f8fafc',
            margin: '0 0 40px',
          }}>
            {(t.landing as any)?.partnerTiersTitle || 'Votre progression'}
          </h3>
          <div className="landing-pricing-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 80,
          }}>
            {/* Tier 1 - Débutant */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #64748b',
              borderRadius: 14,
              padding: '28px 20px',
              textAlign: 'center',
              position: 'relative',
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: 18,
                fontWeight: 800,
                color: '#fff',
              }}>1</div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                {(t.landing as any)?.partnerTier1Label || 'Débutant'}
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px' }}>5%</p>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                {(t.landing as any)?.partnerTier1Clients || '10 clients'}
              </p>
            </div>

            {/* Tier 2 - Intermédiaire */}
            <div style={{
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid #3b82f6',
              borderRadius: 14,
              padding: '28px 20px',
              textAlign: 'center',
              position: 'relative',
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: 18,
                fontWeight: 800,
                color: '#fff',
              }}>2</div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                {(t.landing as any)?.partnerTier2Label || 'Intermédiaire'}
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px' }}>10%</p>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                {(t.landing as any)?.partnerTier2Clients || '25 clients'}
              </p>
            </div>

            {/* Tier 3 - Avancé */}
            <div style={{
              background: 'rgba(147,51,234,0.1)',
              border: '1px solid #a855f7',
              borderRadius: 14,
              padding: '28px 20px',
              textAlign: 'center',
              position: 'relative',
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: 18,
                fontWeight: 800,
                color: '#fff',
              }}>3</div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                {(t.landing as any)?.partnerTier3Label || 'Avancé'}
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px' }}>15%</p>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                {(t.landing as any)?.partnerTier3Clients || '50 clients'}
              </p>
            </div>

            {/* Tier 4 - Expert */}
            <div style={{
              background: 'rgba(234,179,8,0.1)',
              border: '1px solid #eab308',
              borderRadius: 14,
              padding: '28px 20px',
              textAlign: 'center',
              position: 'relative',
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #eab308, #f59e0b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                fontSize: 18,
                fontWeight: 800,
                color: '#fff',
              }}>4</div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                {(t.landing as any)?.partnerTier4Label || 'Expert'}
              </p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px' }}>20%</p>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                {(t.landing as any)?.partnerTier4Clients || '100+ clients'}
              </p>
            </div>
          </div>

          {/* Phone/Tablet Showcase */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(74,222,128,0.1))',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 'clamp(32px, 5vw, 56px)',
            marginBottom: 48,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <h3 style={{
              fontSize: 'clamp(22px, 3.5vw, 32px)',
              fontWeight: 800,
              color: '#f8fafc',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}>
              {(t.landing as any)?.partnerShowcaseTitle || 'Votre caisse enregistreuse dans la poche'}
            </h3>
            <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: '#94a3b8', margin: '0 0 40px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              {(t.landing as any)?.partnerShowcaseDesc || 'Restaurant, boutique, salon de coiffure, pharmacie... Toute activité se gère professionnellement depuis un simple téléphone.'}
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 'clamp(24px, 4vw, 48px)',
              flexWrap: 'wrap',
            }}>
              {/* Phone SVG */}
              <svg width="140" height="260" viewBox="0 0 140 260" fill="none" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}>
                <rect x="4" y="4" width="132" height="252" rx="20" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <rect x="12" y="40" width="116" height="190" rx="4" fill="#0f172a" />
                {/* Status bar */}
                <rect x="50" y="12" width="40" height="6" rx="3" fill="#334155" />
                {/* POS Interface mockup */}
                <rect x="18" y="48" width="50" height="8" rx="2" fill="#4ade80" opacity="0.8" />
                <rect x="18" y="62" width="104" height="1" fill="#334155" />
                {/* Product rows */}
                <rect x="18" y="70" width="70" height="6" rx="2" fill="#475569" />
                <rect x="96" y="70" width="26" height="6" rx="2" fill="#3b82f6" opacity="0.6" />
                <rect x="18" y="82" width="55" height="6" rx="2" fill="#475569" />
                <rect x="96" y="82" width="26" height="6" rx="2" fill="#3b82f6" opacity="0.6" />
                <rect x="18" y="94" width="65" height="6" rx="2" fill="#475569" />
                <rect x="96" y="94" width="26" height="6" rx="2" fill="#3b82f6" opacity="0.6" />
                <rect x="18" y="106" width="48" height="6" rx="2" fill="#475569" />
                <rect x="96" y="106" width="26" height="6" rx="2" fill="#3b82f6" opacity="0.6" />
                <rect x="18" y="118" width="60" height="6" rx="2" fill="#475569" />
                <rect x="96" y="118" width="26" height="6" rx="2" fill="#3b82f6" opacity="0.6" />
                {/* Divider */}
                <rect x="18" y="132" width="104" height="1" fill="#334155" />
                {/* Total area */}
                <rect x="18" y="140" width="30" height="8" rx="2" fill="#94a3b8" />
                <rect x="80" y="138" width="42" height="12" rx="3" fill="#4ade80" opacity="0.9" />
                {/* Pay button */}
                <rect x="18" y="162" width="104" height="28" rx="8" fill="url(#payGrad)" />
                <text x="70" y="180" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="sans-serif">ENCAISSER</text>
                {/* Bottom grid - categories */}
                <rect x="18" y="198" width="22" height="22" rx="6" fill="#2563eb" opacity="0.3" />
                <rect x="46" y="198" width="22" height="22" rx="6" fill="#16a34a" opacity="0.3" />
                <rect x="74" y="198" width="22" height="22" rx="6" fill="#9333ea" opacity="0.3" />
                <rect x="102" y="198" width="22" height="22" rx="6" fill="#eab308" opacity="0.3" />
                {/* Home indicator */}
                <rect x="45" y="240" width="50" height="5" rx="2.5" fill="#475569" />
                <defs>
                  <linearGradient id="payGrad" x1="18" y1="162" x2="122" y2="190">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#4ade80" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Tablet SVG */}
              <svg width="220" height="280" viewBox="0 0 220 280" fill="none" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}>
                <rect x="4" y="4" width="212" height="272" rx="16" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <rect x="12" y="12" width="196" height="256" rx="8" fill="#0f172a" />
                {/* Header */}
                <rect x="20" y="20" width="60" height="10" rx="3" fill="#4ade80" opacity="0.8" />
                <rect x="160" y="20" width="40" height="10" rx="3" fill="#334155" />
                <rect x="20" y="36" width="180" height="1" fill="#334155" />
                {/* Sidebar - Categories */}
                <rect x="20" y="44" width="44" height="200" rx="6" fill="rgba(255,255,255,0.03)" />
                <rect x="26" y="52" width="32" height="20" rx="4" fill="#2563eb" opacity="0.4" />
                <rect x="26" y="78" width="32" height="20" rx="4" fill="rgba(255,255,255,0.05)" />
                <rect x="26" y="104" width="32" height="20" rx="4" fill="rgba(255,255,255,0.05)" />
                <rect x="26" y="130" width="32" height="20" rx="4" fill="rgba(255,255,255,0.05)" />
                <rect x="26" y="156" width="32" height="20" rx="4" fill="rgba(255,255,255,0.05)" />
                {/* Product Grid */}
                <rect x="72" y="44" width="50" height="40" rx="6" fill="rgba(255,255,255,0.05)" />
                <rect x="78" y="50" width="38" height="20" rx="3" fill="#334155" />
                <rect x="78" y="74" width="30" height="5" rx="2" fill="#475569" />
                <rect x="128" y="44" width="50" height="40" rx="6" fill="rgba(255,255,255,0.05)" />
                <rect x="134" y="50" width="38" height="20" rx="3" fill="#334155" />
                <rect x="134" y="74" width="30" height="5" rx="2" fill="#475569" />
                <rect x="72" y="92" width="50" height="40" rx="6" fill="rgba(255,255,255,0.05)" />
                <rect x="78" y="98" width="38" height="20" rx="3" fill="#334155" />
                <rect x="78" y="122" width="30" height="5" rx="2" fill="#475569" />
                <rect x="128" y="92" width="50" height="40" rx="6" fill="rgba(255,255,255,0.05)" />
                <rect x="134" y="98" width="38" height="20" rx="3" fill="#334155" />
                <rect x="134" y="122" width="30" height="5" rx="2" fill="#475569" />
                {/* Cart panel on right */}
                <rect x="184" y="44" width="1" height="200" fill="#334155" />
                <rect x="190" y="50" width="12" height="6" rx="2" fill="#94a3b8" />
                <rect x="190" y="62" width="12" height="4" rx="1" fill="#475569" />
                <rect x="190" y="72" width="12" height="4" rx="1" fill="#475569" />
                <rect x="190" y="82" width="12" height="4" rx="1" fill="#475569" />
                {/* Total + Pay */}
                <rect x="72" y="212" width="108" height="1" fill="#334155" />
                <rect x="72" y="220" width="30" height="8" rx="2" fill="#94a3b8" />
                <rect x="130" y="218" width="48" height="12" rx="3" fill="#4ade80" opacity="0.9" />
                <rect x="72" y="238" width="108" height="24" rx="6" fill="url(#tabPayGrad)" />
                <text x="126" y="254" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="sans-serif">VALIDER LA VENTE</text>
                <defs>
                  <linearGradient id="tabPayGrad" x1="72" y1="238" x2="180" y2="262">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#4ade80" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Partner Application Form */}
          <div style={{
            maxWidth: 520,
            margin: '0 auto',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#4ade80', textAlign: 'center' }}>
              {(t.landing as any)?.partnerFormTitle || 'Postuler maintenant'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input
                placeholder={(t.landing as any)?.partnerName || 'Nom complet *'}
                value={partnerForm.name}
                onChange={e => setPartnerForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#f8fafc', fontSize: 14, fontFamily: pageFont, outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                placeholder={(t.landing as any)?.partnerEmail || 'Email *'}
                type="email"
                value={partnerForm.email}
                onChange={e => setPartnerForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#f8fafc', fontSize: 14, fontFamily: pageFont, outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                placeholder={(t.landing as any)?.partnerPhone || 'WhatsApp (6XXXXXXXX) *'}
                value={partnerForm.phone}
                onChange={e => setPartnerForm(f => ({ ...f, phone: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#f8fafc', fontSize: 14, fontFamily: pageFont, outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                placeholder={(t.landing as any)?.partnerCity || 'Ville'}
                value={partnerForm.city}
                onChange={e => setPartnerForm(f => ({ ...f, city: e.target.value }))}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#f8fafc', fontSize: 14, fontFamily: pageFont, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <textarea
              placeholder={(t.landing as any)?.partnerMotivation || 'Pourquoi souhaitez-vous devenir partenaire ? (optionnel)'}
              value={partnerForm.motivation}
              onChange={e => setPartnerForm(f => ({ ...f, motivation: e.target.value }))}
              rows={3}
              style={{ width: '100%', marginTop: 12, padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#f8fafc', fontSize: 14, fontFamily: pageFont, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button
              onClick={handlePartnerSubmit}
              disabled={partnerSubmitting || !partnerForm.name || !partnerForm.email || !partnerForm.phone}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '14px 24px',
                background: (!partnerForm.name || !partnerForm.email || !partnerForm.phone) ? '#475569' : 'linear-gradient(135deg, #16a34a, #4ade80)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 10,
                border: 'none',
                cursor: (!partnerForm.name || !partnerForm.email || !partnerForm.phone) ? 'not-allowed' : 'pointer',
                fontFamily: pageFont,
                boxShadow: '0 4px 24px rgba(74,222,128,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {partnerSubmitting ? (
                <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <IconMail size={18} />
              )}
              {(t.landing as any)?.partnerCta || 'Envoyer ma candidature'}
            </button>
            {partnerResult && (
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                background: partnerResult.type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
                color: partnerResult.type === 'success' ? '#4ade80' : '#f87171',
                textAlign: 'center',
              }}>
                {partnerResult.text}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================================================================
          INSTALL SECTION
          ================================================================ */}
      <section id="install" className="landing-section-padding" style={sectionStyle('#f0f9ff')}>
        <div style={containerStyle}>
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#2563eb',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}>
            {t.landing.navInstall}
          </p>
          <h2 style={sectionTitleStyle}>{t.landing.installTitle}</h2>
          <p style={sectionSubtitleStyle}>{t.landing.installSubtitle}</p>

          {/* 3 platform columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280, 1fr))',
            gap: 24,
            marginTop: 40,
          }}>
            {/* Android */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, #34a853, #4caf50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 28,
              }}>
                {'\uD83D\uDCF1'}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                Android (Chrome)
              </h3>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', backgroundColor: '#dbeafe',
                    color: '#2563eb', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>1</span>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6 }}>
                    {t.install.androidStep1}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', backgroundColor: '#dbeafe',
                    color: '#2563eb', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>2</span>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6 }}>
                    {t.install.androidStep2}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', backgroundColor: '#dbeafe',
                    color: '#2563eb', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>3</span>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6 }}>
                    {t.install.androidStep3}
                  </p>
                </div>
              </div>
            </div>

            {/* iOS */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, #007aff, #5856d6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 28,
              }}>
                {'\uD83C\uDF4F'}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                iOS (Safari)
              </h3>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', backgroundColor: '#ede9fe',
                    color: '#7c3aed', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>1</span>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6 }}>
                    {t.install.iosStep1}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', backgroundColor: '#ede9fe',
                    color: '#7c3aed', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>2</span>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6 }}>
                    {t.install.iosStep2}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', backgroundColor: '#ede9fe',
                    color: '#7c3aed', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>3</span>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6 }}>
                    {t.install.iosStep3}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 28,
              }}>
                {'\uD83D\uDCBB'}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
                Desktop (Chrome / Edge)
              </h3>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', backgroundColor: '#dbeafe',
                    color: '#2563eb', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>1</span>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6 }}>
                    {t.install.desktopStep1}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', backgroundColor: '#dbeafe',
                    color: '#2563eb', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>2</span>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6 }}>
                    {t.install.desktopStep2}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', backgroundColor: '#dbeafe',
                    color: '#2563eb', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>3</span>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.6 }}>
                    {t.install.desktopStep3}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Install CTA button (if native prompt available) */}
          {useAppStore.getState().installPromptEvent && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button
                onClick={async () => {
                  const evt = useAppStore.getState().installPromptEvent
                  if (evt) {
                    evt.prompt()
                    const result = await evt.userChoice
                    if (result.outcome === 'accepted') {
                      useAppStore.getState().setIsAppInstalled(true)
                      useAppStore.getState().setInstallPromptEvent(null)
                    }
                  }
                }}
                style={{
                  padding: '16px 40px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                  transition: 'all 0.2s',
                  fontFamily: pageFont,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'
                }}
              >
                {t.install.installButton}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================
          FAQ SECTION
          ================================================================ */}
      <section id="faq" className="landing-section-padding" style={sectionStyle('#ffffff')}>
        <div style={{ ...containerStyle, maxWidth: 768 }}>
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#2563eb',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}>
            {t.landing.navFaq}
          </p>
          <h2 style={sectionTitleStyle}>{t.landing.faqTitle}</h2>
          <p style={sectionSubtitleStyle}>
            {t.landing.faqSubtitle}
          </p>

          <div style={{
            borderTop: '1px solid #e2e8f0',
          }}>
            {FAQ_ITEMS.map((item, index) => (
              <FAQItem key={index} question={item.question} answer={item.answer} />
            ))}
          </div>

          {/* Contact for more questions */}
          <div style={{
            textAlign: 'center',
            marginTop: 48,
            padding: 32,
            backgroundColor: '#f8fafc',
            borderRadius: 16,
          }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
              {t.landing.faqMoreQuestions}
            </p>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>
              {t.landing.faqMoreQuestionsDesc}
            </p>
            <a
              href="mailto:infos@manovende.com"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                borderRadius: 10,
                border: '2px solid #2563eb',
                backgroundColor: 'transparent',
                color: '#2563eb',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#2563eb'
              }}
            >
              {t.landing.faqContact}
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================
          FINAL CTA SECTION
          ================================================================ */}
      <section style={{
        padding: '96px 24px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #2563eb 100%)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background circles */}
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          top: -200, left: -100, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.1) 0%, transparent 70%)',
          bottom: -150, right: -100, pointerEvents: 'none',
        }} />

        <div style={{ ...containerStyle, position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 16px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            {t.landing.ctaTitle}
          </h2>
          <p style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: 520,
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}>
            {t.landing.ctaSubtitle}
          </p>

          <button
            onClick={handleStartApp}
            style={{
              padding: '18px 40px',
              borderRadius: 14,
              border: 'none',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 24px rgba(22,163,74,0.4)',
              marginBottom: 16,
              fontFamily: pageFont,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 8px 40px rgba(22,163,74,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(22,163,74,0.4)'
            }}
          >
            {t.landing.ctaButton}
            <IconArrowRight size={20} />
          </button>

          <p style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
            <IconShield />
            {t.landing.ctaNoCard}
          </p>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer style={{
        backgroundColor: '#0f172a',
        padding: '64px 24px 32px',
        color: '#94a3b8',
      }}>
        <div style={containerStyle}>
          <div className="landing-footer-grid" style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 48,
            marginBottom: 48,
          }}>
            {/* Company info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LogoIcon size={20} />
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>POS Mano Verde</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 20px', maxWidth: 320 }}>
                {t.landing.footerDesc}
              </p>

              {/* Contact emails */}
              <div style={{ marginBottom: 20 }}>
                <a
                  href="mailto:direction@manovende.com"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#94a3b8',
                    textDecoration: 'none',
                    fontSize: 13,
                    marginBottom: 8,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                >
                  <IconMail size={14} />
                  direction@manovende.com
                </a>
                <a
                  href="mailto:infos@manovende.com"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#94a3b8',
                    textDecoration: 'none',
                    fontSize: 13,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                >
                  <IconMail size={14} />
                  infos@manovende.com
                </a>
              </div>

              {/* Social links */}
              <div className="landing-social-links" style={{ display: 'flex', gap: 12 }}>
                {['Facebook', 'Twitter', 'LinkedIn', 'WhatsApp'].map((social) => (
                  <span
                    key={social}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title={social}
                    role="link"
                    tabIndex={0}
                  >
                    {social.charAt(0)}
                  </span>
                ))}
              </div>
            </div>

            {/* Product links */}
            <div>
              <h4 style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 20px',
              }}>
                {t.landing.footerProduct}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  { label: t.landing.navFeatures, action: () => scrollToSection('features') },
                  { label: t.landing.navPricing, action: () => scrollToSection('pricing') },
                  { label: t.landing.navInstall, action: () => scrollToSection('install') },
                  { label: 'Documentation', action: () => setInfoPage('docs') },
                  { label: 'API', action: () => setInfoPage('api') },
                  { label: 'Changelog', action: () => setInfoPage('changelog') },
                ].map((link, i) => (
                  <li key={i} style={{ marginBottom: 12 }}>
                    <button
                      style={{
                        background: 'none', border: 'none', color: '#94a3b8',
                        fontSize: 14, cursor: 'pointer', padding: 0,
                        fontFamily: pageFont, transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                      onClick={link.action}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support links */}
            <div>
              <h4 style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 20px',
              }}>
                {t.landing.footerSupport}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  { label: t.common.help, href: undefined },
                  { label: 'Contact', href: 'mailto:infos@manovende.com' },
                  { label: t.landing.navFaq, href: undefined, action: () => scrollToSection('faq') },
                ].map((link, i) => (
                  <li key={i} style={{ marginBottom: 12 }}>
                    {link.href ? (
                      <a
                        href={link.href}
                        style={{
                          background: 'none', border: 'none', color: '#94a3b8',
                          fontSize: 14, cursor: 'pointer', padding: 0,
                          fontFamily: pageFont, transition: 'color 0.2s',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <button
                        style={{
                          background: 'none', border: 'none', color: '#94a3b8',
                          fontSize: 14, cursor: 'pointer', padding: 0,
                          fontFamily: pageFont, transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                        onClick={(link as any).action}
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h4 style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 20px',
              }}>
                {t.landing.footerLegal}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  { label: t.landing.footerCGV, href: '/terms' },
                  { label: t.landing.footerRGPD, href: '/privacy' },
                  { label: t.landing.footerTerms, href: '/terms' },
                ].map((link, idx) => (
                  <li key={idx} style={{ marginBottom: 12 }}>
                    <a
                      href={link.href}
                      style={{
                        color: '#94a3b8',
                        fontSize: 14, cursor: 'pointer', padding: 0,
                        fontFamily: pageFont, transition: 'color 0.2s',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid #1e293b',
            paddingTop: 24,
          }}>
            <div className="landing-footer-bottom" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <p style={{ fontSize: 13, margin: 0, color: '#64748b' }}>
                {t.landing.footerCopyright}
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                <a href="/privacy" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b' }}
                >Privacy Policy</a>
                <a href="/terms" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b' }}
                >Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ================================================================
          SCROLL TO TOP BUTTON
          ================================================================ */}
      <button
        className={`landing-scroll-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        tabIndex={showScrollTop ? 0 : -1}
      >
        <IconArrowUp size={20} />
      </button>

      </div>{/* end .landing-page-root */}

      {/* Legal document modal */}
      {legalModal && (
        <LegalModal documentType={legalModal} onClose={() => setLegalModal(null)} />
      )}

      {/* Info page modal (Documentation, API, Changelog) */}
      {infoPage && (() => {
        const pages = {
          docs: {
            title: 'Documentation',
            icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            ),
            sections: [
              {
                title: t.landing.navFeatures,
                items: [
                  { label: t.landing.feature1Title, desc: t.landing.feature1Desc },
                  { label: t.landing.feature2Title, desc: t.landing.feature2Desc },
                  { label: t.landing.feature3Title, desc: t.landing.feature3Desc },
                  { label: t.landing.feature4Title, desc: t.landing.feature4Desc },
                  { label: t.landing.feature5Title, desc: t.landing.feature5Desc },
                  { label: t.landing.feature6Title, desc: t.landing.feature6Desc },
                ],
              },
              {
                title: t.landing.howStep1Title,
                items: [
                  { label: '1. ' + t.landing.howStep1Title, desc: t.landing.howStep1Desc },
                  { label: '2. ' + t.landing.howStep2Title, desc: t.landing.howStep2Desc },
                  { label: '3. ' + t.landing.howStep3Title, desc: t.landing.howStep3Desc },
                ],
              },
              {
                title: t.landing.navInstall,
                items: [
                  { label: 'Android (Chrome)', desc: t.install.androidStep1 + ' \u2192 ' + t.install.androidStep2 + ' \u2192 ' + t.install.androidStep3 },
                  { label: 'iOS (Safari)', desc: t.install.iosStep1 + ' \u2192 ' + t.install.iosStep2 + ' \u2192 ' + t.install.iosStep3 },
                  { label: 'Desktop (Chrome / Edge)', desc: t.install.desktopStep1 + ' \u2192 ' + t.install.desktopStep2 + ' \u2192 ' + t.install.desktopStep3 },
                ],
              },
            ],
          },
          api: {
            title: 'API Reference',
            icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
            ),
            endpoints: [
              { method: 'POST', path: '/auth/register', desc: 'Create a new account' },
              { method: 'POST', path: '/auth/login', desc: 'Authenticate user' },
              { method: 'GET', path: '/products', desc: 'List all products' },
              { method: 'POST', path: '/products', desc: 'Create a product' },
              { method: 'PUT', path: '/products/:id', desc: 'Update a product' },
              { method: 'DELETE', path: '/products/:id', desc: 'Delete a product' },
              { method: 'GET', path: '/orders', desc: 'List all orders' },
              { method: 'POST', path: '/orders', desc: 'Create an order' },
              { method: 'GET', path: '/stats/dashboard', desc: 'Get dashboard stats' },
              { method: 'GET', path: '/sync/pull', desc: 'Pull sync data' },
              { method: 'POST', path: '/sync/push', desc: 'Push sync data' },
            ],
          },
          changelog: {
            title: 'Changelog',
            icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ),
            releases: [
              { version: 'v1.5.0', date: 'Mars 2026', tag: 'latest', items: [
                'Landing page: Product showcase, Video demo, Sectors, Trust badges',
                'Employee authentication with PIN login',
                'Multi-currency support (25+ currencies)',
                'Activity-specific products (27 business types)',
              ]},
              { version: 'v1.4.0', date: 'Fevrier 2026', tag: null, items: [
                'Responsive 3-tier layout',
                'PayPal & Orange Money payment integration',
                'Subscription management',
                'Browser language detection',
              ]},
              { version: 'v1.3.0', date: 'Janvier 2026', tag: null, items: [
                'Offline-first with IndexedDB',
                'Bluetooth receipt printing',
                'Cloud synchronization',
                'Multi-store management',
              ]},
              { version: 'v1.0.0', date: 'Decembre 2025', tag: null, items: [
                'Initial release',
                'POS interface with product grid',
                'Order management',
                'Basic dashboard & reports',
              ]},
            ],
          },
        }
        const page = pages[infoPage]
        return (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={(e) => { if (e.target === e.currentTarget) setInfoPage(null) }}
          >
            <div style={{ backgroundColor: '#ffffff', maxWidth: 750, width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 16, padding: 32, position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {page.icon}
                  </div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{page.title}</h2>
                </div>
                <button
                  onClick={() => setInfoPage(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', color: '#64748b' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 24 }} />

              {/* Documentation content */}
              {infoPage === 'docs' && 'sections' in page && (page as any).sections.map((section: any, si: number) => (
                <div key={si} style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section.title}</h3>
                  {section.items.map((item: any, ii: number) => (
                    <div key={ii} style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: 10, borderLeft: '3px solid #2563eb' }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              ))}

              {/* API content */}
              {infoPage === 'api' && 'endpoints' in page && (
                <div>
                  <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
                    REST API — Endpoints disponibles apres authentification.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(page as any).endpoints.map((ep: any, ei: number) => (
                      <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', backgroundColor: '#f8fafc', borderRadius: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 4, minWidth: 56, textAlign: 'center',
                          backgroundColor: ep.method === 'GET' ? '#dcfce7' : ep.method === 'POST' ? '#dbeafe' : ep.method === 'PUT' ? '#fef3c7' : '#fecaca',
                          color: ep.method === 'GET' ? '#16a34a' : ep.method === 'POST' ? '#2563eb' : ep.method === 'PUT' ? '#d97706' : '#dc2626',
                        }}>{ep.method}</span>
                        <code style={{ fontSize: 13, fontFamily: 'monospace', color: '#0f172a', fontWeight: 500 }}>{ep.path}</code>
                        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{ep.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Changelog content */}
              {infoPage === 'changelog' && 'releases' in page && (
                <div>
                  {(page as any).releases.map((release: any, ri: number) => (
                    <div key={ri} style={{ marginBottom: 28, position: 'relative', paddingLeft: 24, borderLeft: ri === 0 ? '2px solid #2563eb' : '2px solid #e2e8f0' }}>
                      <div style={{ position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: '50%', backgroundColor: ri === 0 ? '#2563eb' : '#cbd5e1' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{release.version}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{release.date}</span>
                        {release.tag && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, backgroundColor: '#dcfce7', color: '#16a34a', textTransform: 'uppercase' }}>{release.tag}</span>}
                      </div>
                      <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                        {release.items.map((item: string, ii: number) => (
                          <li key={ii} style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setInfoPage(null)}
                  style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  {t.common.close}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ================================================================
          SECTOR PREVIEW MODAL
          ================================================================ */}
      {sectorModal !== null && (() => {
        const s = FEATURED_SECTORS.find(f => f.activity === sectorModal)
        if (!s) return null
        const accent = s.color
        const statLabels = ['CA mensuel', 'Commandes', s.stat3Label]
        const SectorIcon = ACTIVITY_ICONS[sectorModal]
        return (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={(e) => { if (e.target === e.currentTarget) setSectorModal(null) }}
          >
            <div style={{ backgroundColor: '#fff', maxWidth: 850, width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 16, position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              {/* Header */}
              <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SectorIcon size={24} color={accent} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{t.setup[sectorModal as keyof typeof t.setup]}</h2>
                </div>
                <button onClick={() => setSectorModal(null)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, display: 'flex', color: '#64748b' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, padding: '16px 28px 0', borderBottom: '1px solid #e2e8f0' }}>
                {[t.landing.showcaseTab1, t.landing.showcaseTab2].map((tab, ti) => (
                  <button key={ti} onClick={() => setSectorTab(ti)} style={{
                    padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none',
                    color: sectorTab === ti ? accent : '#64748b',
                    borderBottom: sectorTab === ti ? `2px solid ${accent}` : '2px solid transparent',
                    marginBottom: -1, transition: 'all 0.2s',
                  }}>{tab}</button>
                ))}
              </div>

              {/* Mockup area */}
              <div style={{ margin: '20px 28px', backgroundColor: '#0f172a', borderRadius: 12, overflow: 'hidden' }}>
                {/* Browser chrome */}
                <div style={{ padding: '10px 14px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <div style={{ flex: 1, marginLeft: 10, backgroundColor: '#334155', borderRadius: 4, height: 20, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>pos.manoverde.com</span>
                  </div>
                </div>

                <div style={{ display: 'flex' }}>
                  {/* Mini sidebar */}
                  <div style={{ width: 52, backgroundColor: '#0c1222', borderRight: '1px solid #1e293b', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {s.sidebar.map((item, si) => (
                      <div key={si} style={{
                        width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1, cursor: 'pointer',
                        backgroundColor: si === (sectorTab === 0 ? 0 : 0) && sectorTab === 0 ? `${accent}22` : 'transparent',
                        border: si === 0 && sectorTab === 0 ? `1px solid ${accent}44` : '1px solid transparent',
                      }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: si === 0 ? accent : '#475569', opacity: si === 0 ? 1 : 0.5 }} />
                        <span style={{ fontSize: 7, color: si === 0 ? '#e2e8f0' : '#64748b', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 34, textAlign: 'center' }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Content area */}
                  <div style={{ flex: 1, padding: 16 }}>
                    {sectorTab === 0 ? (
                      /* ---- Dashboard Tab ---- */
                      <div>
                        {/* Stat cards */}
                        <div className="landing-sector-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                          {s.stats.map((st, si) => (
                            <div key={si} style={{ backgroundColor: '#1e293b', borderRadius: 8, padding: 12, borderLeft: `3px solid ${st.c}` }}>
                              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>{statLabels[si]}</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{st.v}</div>
                            </div>
                          ))}
                        </div>
                        {/* Bar chart */}
                        <div style={{ backgroundColor: '#1e293b', borderRadius: 8, padding: 14 }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Ventes mensuelles</div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
                            {s.bars.map((h, bi) => (
                              <div key={bi} style={{ flex: 1, height: `${h}%`, backgroundColor: accent, borderRadius: 3, opacity: 0.7 + (h / 300), transition: 'height 0.5s ease' }} />
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            {['J','F','M','A','M','J','J','A','S','O','N','D'].map((m, mi) => (
                              <span key={mi} style={{ fontSize: 8, color: '#64748b', flex: 1, textAlign: 'center' }}>{m}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ---- POS Tab ---- */
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px' }}>
                          {/* Category tabs */}
                          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                            {s.categories.map((cat, ci) => (
                              <span key={ci} style={{
                                fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 12,
                                backgroundColor: ci === 0 ? accent : '#1e293b',
                                color: ci === 0 ? '#fff' : '#94a3b8',
                                cursor: 'pointer',
                              }}>{cat}</span>
                            ))}
                          </div>
                          {/* Product grid */}
                          <div className="landing-sector-products" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                            {s.products.map((p, pi) => (
                              <div key={pi} style={{ backgroundColor: p.bg, borderRadius: 8, padding: 9, textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                              >
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', marginBottom: 3, lineHeight: 1.2 }}>{p.n}</div>
                                <div style={{ fontSize: 11, color: '#475569' }}>{p.p}</div>
                                {p.badge && (
                                  <span style={{ position: 'absolute', top: 3, right: 3, fontSize: 8, backgroundColor: accent, color: '#fff', padding: '1px 4px', borderRadius: 3, fontWeight: 600, lineHeight: 1.3 }}>{p.badge}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Cart */}
                        <div style={{ flex: '0 0 160px', backgroundColor: '#1e293b', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#f1f5f9', marginBottom: 8, borderBottom: '1px solid #334155', paddingBottom: 6 }}>Panier</div>
                          {s.cart.map((item, ci) => (
                            <div key={ci} style={{ fontSize: 11, color: '#cbd5e1', padding: '4px 0', borderBottom: ci < s.cart.length - 1 ? '1px solid #334155' : 'none' }}>{item}</div>
                          ))}
                          <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #475569', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Total</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{s.total}</span>
                          </div>
                          <button style={{ width: '100%', marginTop: 8, padding: '7px 0', borderRadius: 6, border: 'none', backgroundColor: accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Payer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '0 28px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setSectorModal(null)}
                  style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >{t.common.close}</button>
                <button
                  onClick={() => { setSectorModal(null); const el = document.getElementById('pricing'); if (el) el.scrollIntoView({ behavior: 'smooth' }) }}
                  style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#15803d' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#16a34a' }}
                >{t.landing.planFreeCTA}</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
