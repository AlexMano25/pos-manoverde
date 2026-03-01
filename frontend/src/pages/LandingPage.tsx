import React, { useState, useEffect, useRef } from 'react'

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


// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: <IconWifiOff />,
    title: 'Fonctionne hors-ligne',
    description: 'Vendez meme sans connexion internet. Vos donnees se synchronisent automatiquement des que le reseau revient.',
  },
  {
    icon: <IconStore />,
    title: 'Multi-boutiques',
    description: 'Gerez plusieurs points de vente depuis un seul tableau de bord. Vue consolidee de toutes vos boutiques.',
  },
  {
    icon: <IconPrinter />,
    title: 'Impression Bluetooth',
    description: 'Imprimez vos tickets de caisse, factures et recus directement via imprimante Bluetooth portable.',
  },
  {
    icon: <IconRefresh />,
    title: 'Synchronisation automatique',
    description: 'Les donnees se synchronisent automatiquement entre vos appareils. Tous vos caisses restent a jour en temps reel.',
  },
  {
    icon: <IconGlobe />,
    title: 'Multi-langues',
    description: 'Interface disponible en francais et en anglais. Adaptee aux besoins des commercants africains.',
  },
  {
    icon: <IconZap />,
    title: 'Installation en 2 minutes',
    description: 'Pas de materiel couteux a acheter. Installez sur votre telephone ou tablette et commencez a vendre.',
  },
]

const PLANS = [
  {
    id: 'free',
    name: 'Decouverte',
    tagline: 'GRATUIT',
    price: 0,
    priceYearly: 0,
    currency: 'FCFA',
    period: '/mois',
    description: 'Ideal pour demarrer et tester la solution sans engagement.',
    badge: 'Populaire',
    badgeColor: '#2563eb',
    features: [
      { text: '1 boutique, 1 caisse', included: true },
      { text: '50 produits maximum', included: true },
      { text: '100 commandes / mois', included: true },
      { text: 'Stockage local uniquement', included: true },
      { text: 'Support communautaire', included: true },
      { text: 'Sync cloud', included: false },
      { text: 'Impression Bluetooth', included: false },
      { text: 'Multi-utilisateurs', included: false },
      { text: 'Rapports avances', included: false },
    ],
    cta: 'Commencer gratuitement',
    ctaVariant: 'outline' as const,
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Essentiel',
    tagline: 'STARTER',
    price: 9900,
    priceYearly: 8250,
    currency: 'FCFA',
    period: '/mois',
    description: 'Pour les commercants qui veulent passer au niveau superieur.',
    badge: null,
    badgeColor: null,
    features: [
      { text: '1 boutique, 3 caisses', included: true },
      { text: '500 produits', included: true },
      { text: 'Commandes illimitees', included: true },
      { text: 'Synchronisation cloud', included: true },
      { text: 'Impression Bluetooth', included: true },
      { text: 'Support email', included: true },
      { text: 'Multi-utilisateurs', included: false },
      { text: 'Rapports avances', included: false },
      { text: 'API personnalisee', included: false },
    ],
    cta: 'Essayer 14 jours gratuit',
    ctaVariant: 'outline' as const,
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Professionnel',
    tagline: 'PRO',
    price: 29900,
    priceYearly: 24917,
    currency: 'FCFA',
    period: '/mois',
    description: 'La solution complete pour les entreprises en croissance.',
    badge: 'Recommande',
    badgeColor: '#16a34a',
    features: [
      { text: '3 boutiques, 10 caisses', included: true },
      { text: 'Produits illimites', included: true },
      { text: 'Commandes illimitees', included: true },
      { text: 'Sync cloud temps reel', included: true },
      { text: 'Multi-utilisateurs avec roles', included: true },
      { text: 'Rapports avances', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Impression Bluetooth', included: true },
      { text: 'API personnalisee', included: false },
    ],
    cta: 'Essayer 14 jours gratuit',
    ctaVariant: 'solid' as const,
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    tagline: 'ENTERPRISE',
    price: -1,
    priceYearly: -1,
    currency: '',
    period: '',
    description: 'Solution sur mesure pour les grandes enseignes et franchises.',
    badge: null,
    badgeColor: null,
    features: [
      { text: 'Boutiques illimitees', included: true },
      { text: 'Caisses illimitees', included: true },
      { text: 'Tout du plan PRO', included: true },
      { text: 'API personnalisee', included: true },
      { text: 'Formation sur site', included: true },
      { text: 'Serveur dedie', included: true },
      { text: 'Support 24/7', included: true },
      { text: 'SLA garanti', included: true },
      { text: 'Migration assistee', included: true },
    ],
    cta: 'Nous contacter',
    ctaVariant: 'outline' as const,
    highlight: false,
  },
]

const TESTIMONIALS = [
  {
    name: 'Amadou Ndiaye',
    role: 'Proprietaire de restaurant',
    location: 'Douala, Cameroun',
    avatar: 'AN',
    avatarBg: '#2563eb',
    text: "Avant POS Mano Verde, je notais tout sur papier. Maintenant, mes 3 serveurs prennent les commandes sur tablette et le ticket sort automatiquement en cuisine. Meme quand le reseau coupe, tout continue de fonctionner. J'ai reduit mes erreurs de commande de 80%.",
    rating: 5,
  },
  {
    name: 'Fatou Diallo',
    role: 'Gerante de supermarche',
    location: 'Abidjan, Cote d\'Ivoire',
    avatar: 'FD',
    avatarBg: '#16a34a',
    text: "Je gere 2 superettes avec POS Mano Verde. Le tableau de bord me montre en temps reel les ventes de chaque boutique. La gestion de stock est incroyable - je recois des alertes quand un produit atteint le seuil minimum. C'est vraiment concu pour l'Afrique.",
    rating: 5,
  },
  {
    name: 'Dr. Moussa Sow',
    role: 'Proprietaire de pharmacie',
    location: 'Dakar, Senegal',
    avatar: 'MS',
    avatarBg: '#9333ea',
    text: "La conformite est essentielle dans la pharmacie. POS Mano Verde me permet de tracer chaque vente, de gerer les dates de peremption et d'imprimer des factures conformes. Le support est reactif et l'application est tres stable. Je la recommande a tous mes collegues.",
    rating: 5,
  },
]

const FAQ_ITEMS = [
  {
    question: 'Est-ce que POS Mano Verde fonctionne vraiment sans internet ?',
    answer: 'Oui, absolument. POS Mano Verde stocke toutes vos donnees localement sur votre appareil. Vous pouvez creer des ventes, gerer vos produits et imprimer des tickets meme sans aucune connexion. Lorsque vous retrouvez internet, toutes les donnees se synchronisent automatiquement avec le cloud.',
  },
  {
    question: 'Quel materiel ai-je besoin pour utiliser POS Mano Verde ?',
    answer: 'Un simple smartphone ou une tablette Android suffit. Pour l\'impression, vous pouvez utiliser n\'importe quelle imprimante thermique Bluetooth compatible (nous recommandons les modeles 58mm ou 80mm). Aucun materiel special ou couteux n\'est necessaire.',
  },
  {
    question: 'Puis-je migrer mes donnees depuis un autre logiciel ?',
    answer: 'Oui. Vous pouvez importer vos produits via un fichier CSV ou Excel. Pour les plans Pro et Enterprise, notre equipe peut vous assister dans la migration complete de vos donnees, incluant l\'historique des ventes et la base clients.',
  },
  {
    question: 'Comment fonctionne la facturation ?',
    answer: 'Le plan Gratuit est 100% gratuit, pour toujours, sans carte bancaire. Pour les plans payants, vous etes facture mensuellement ou annuellement (2 mois offerts). Nous acceptons le paiement par Mobile Money (MTN, Orange, Wave), carte bancaire et virement bancaire.',
  },
  {
    question: 'Mes donnees sont-elles en securite ?',
    answer: 'Vos donnees sont chiffrees en transit et au repos. Nous utilisons des serveurs securises avec des sauvegardes quotidiennes. Vous gardez toujours la propriete de vos donnees et pouvez les exporter a tout moment. Nous sommes conformes aux reglementations locales de protection des donnees.',
  },
  {
    question: 'Puis-je annuler mon abonnement a tout moment ?',
    answer: 'Oui, sans engagement. Vous pouvez annuler votre abonnement a tout moment depuis les parametres de votre compte. Nous offrons egalement une garantie satisfait ou rembourse de 30 jours sur tous les plans payants.',
  },
  {
    question: 'Combien d\'employes peuvent utiliser le systeme ?',
    answer: 'Le plan Gratuit est limite a 1 utilisateur. Le plan Starter permet jusqu\'a 3 utilisateurs. Le plan Pro offre un nombre illimite d\'utilisateurs avec gestion des roles (admin, manager, caissier). Le plan Enterprise inclut des roles personnalises et un annuaire d\'entreprise.',
  },
  {
    question: 'Proposez-vous une formation ?',
    answer: 'Oui. Tous les plans incluent un acces a nos guides en ligne et videos tutoriels. Le plan Pro inclut une session de formation a distance. Le plan Enterprise comprend une formation sur site pour votre equipe, avec un support dedie pour le deploiement.',
  },
]


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
// Main Landing Page Component
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingYearly, setBillingYearly] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)

  // Animated counters for hero stats
  const stat1 = useCountUp(500, 2000)
  const stat2 = useCountUp(12, 1500)

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const formatPrice = (price: number) => {
    if (price === -1) return 'Sur devis'
    if (price === 0) return '0'
    return price.toLocaleString('fr-FR')
  }

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

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    cursor: 'pointer',
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
          KEYFRAME ANIMATIONS
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

        @media (max-width: 768px) {
          .landing-nav-links { display: none !important; }
          .landing-nav-cta-desktop { display: none !important; }
          .landing-mobile-toggle { display: flex !important; }
          .landing-hero-stats { flex-direction: column !important; gap: 12px !important; }
          .landing-features-grid { grid-template-columns: 1fr !important; }
          .landing-steps-grid { grid-template-columns: 1fr !important; }
          .landing-pricing-grid { grid-template-columns: 1fr !important; }
          .landing-testimonials-grid { grid-template-columns: 1fr !important; }
          .landing-footer-grid { grid-template-columns: 1fr !important; text-align: center; }
          .landing-footer-bottom { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
          .landing-hero-content { text-align: center !important; }
          .landing-hero-buttons { justify-content: center !important; }
          .landing-hero-inner { flex-direction: column !important; }
          .landing-hero-left { max-width: 100% !important; }
          .landing-hero-right { display: none !important; }
          .landing-billing-toggle-container { flex-direction: column !important; align-items: center !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .landing-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-testimonials-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ================================================================
          HEADER / NAVBAR
          ================================================================ */}
      <header style={headerStyle}>
        <nav style={navContainerStyle}>
          {/* Logo */}
          <div style={logoStyle} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
          </div>

          {/* Desktop nav links */}
          <ul className="landing-nav-links" style={navLinksStyle}>
            <li><button style={navLinkStyle} onClick={() => scrollToSection('features')}>Fonctionnalites</button></li>
            <li><button style={navLinkStyle} onClick={() => scrollToSection('how-it-works')}>Comment ca marche</button></li>
            <li><button style={navLinkStyle} onClick={() => scrollToSection('pricing')}>Tarifs</button></li>
            <li><button style={navLinkStyle} onClick={() => scrollToSection('testimonials')}>Temoignages</button></li>
            <li><button style={navLinkStyle} onClick={() => scrollToSection('faq')}>FAQ</button></li>
          </ul>

          {/* Desktop CTA */}
          <div className="landing-nav-cta-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{
                ...navLinkStyle,
                color: headerScrolled ? '#2563eb' : '#ffffff',
                fontWeight: 600,
              }}
              onClick={() => scrollToSection('pricing')}
            >
              Connexion
            </button>
            <button style={navCTAStyle} onClick={() => scrollToSection('pricing')}>
              Commencer
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
            {['features', 'how-it-works', 'pricing', 'testimonials', 'faq'].map((id) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
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
                {id === 'features' && 'Fonctionnalites'}
                {id === 'how-it-works' && 'Comment ca marche'}
                {id === 'pricing' && 'Tarifs'}
                {id === 'testimonials' && 'Temoignages'}
                {id === 'faq' && 'FAQ'}
              </button>
            ))}
            <button
              style={{
                ...navCTAStyle,
                width: '100%',
                marginTop: 16,
                padding: '14px 20px',
                fontSize: 15,
                textAlign: 'center',
              }}
              onClick={() => scrollToSection('pricing')}
            >
              Commencer gratuitement
            </button>
          </div>
        )}
      </header>

      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section style={{
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
                  <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 500 }}>
                    Solution certifiee - Fonctionne 100% hors-ligne
                  </span>
                </div>

                <h1 style={{
                  fontSize: 'clamp(36px, 5.5vw, 60px)',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  margin: '0 0 24px',
                  letterSpacing: '-0.03em',
                }}>
                  Le Point de Vente
                  <br />
                  <span style={{
                    background: 'linear-gradient(90deg, #4ade80, #22d3ee)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    intelligent
                  </span>
                  {' '}pour l'Afrique
                </h1>

                <p style={{
                  fontSize: 'clamp(16px, 2vw, 20px)',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.6,
                  margin: '0 0 40px',
                  maxWidth: 520,
                }}>
                  Gerez vos boutiques meme sans internet. POS Mano Verde fonctionne hors-ligne, synchronise automatiquement, et imprime vos tickets via Bluetooth.
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
                    }}
                    onClick={() => scrollToSection('pricing')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(22,163,74,0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(22,163,74,0.4)'
                    }}
                  >
                    Commencer gratuitement
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
                    }}
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
                    Voir la demo
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
                      Commercants<br />actifs
                    </span>
                  </div>
                  <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'stretch' }} />
                  <div ref={stat2.ref} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#22d3ee' }}>{stat2.count}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                      Pays<br />en Afrique
                    </span>
                  </div>
                  <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'stretch' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#ffffff' }}>99.9%</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                      Disponibilite<br />uptime
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
                        En ligne
                      </div>
                    </div>

                    {/* Mock products */}
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Caisse - Vente #1042</span>
                        <span style={{ fontSize: 10, color: '#64748b' }}>14:32</span>
                      </div>
                      {[
                        { name: 'Riz Basmati 5kg', price: '4 500', qty: 2 },
                        { name: 'Huile Palme 1L', price: '1 800', qty: 1 },
                        { name: 'Savon Marseille', price: '750', qty: 3 },
                        { name: 'Sucre en poudre 1kg', price: '950', qty: 1 },
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
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>14 550 FCFA</span>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <div style={{
                          flex: 1, backgroundColor: '#2563eb', borderRadius: 10,
                          padding: '12px', textAlign: 'center', color: '#fff',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          Encaisser
                        </div>
                        <div style={{
                          flex: 1, backgroundColor: '#f1f5f9', borderRadius: 10,
                          padding: '12px', textAlign: 'center', color: '#64748b',
                          fontSize: 11, fontWeight: 600,
                        }}>
                          Imprimer
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
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Vente validee</div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>Ticket imprime via Bluetooth</div>
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
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Sync terminee</div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>42 transactions envoyees</div>
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
          Utilise par des commercants dans toute l'Afrique
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 48,
          flexWrap: 'wrap',
          opacity: 0.4,
        }}>
          {['Cameroun', 'Senegal', 'Cote d\'Ivoire', 'Gabon', 'Congo', 'Mali'].map((country) => (
            <span key={country} style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.05em',
            }}>
              {country.toUpperCase()}
            </span>
          ))}
        </div>
      </section>

      {/* ================================================================
          FEATURES SECTION
          ================================================================ */}
      <section id="features" style={sectionStyle('#ffffff')}>
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
            Fonctionnalites
          </p>
          <h2 style={sectionTitleStyle}>Pourquoi POS Mano Verde ?</h2>
          <p style={sectionSubtitleStyle}>
            Une solution de caisse pensee pour les realites africaines. Pas d'internet ? Pas de probleme.
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
          HOW IT WORKS
          ================================================================ */}
      <section id="how-it-works" style={{
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
            Demarrage rapide
          </p>
          <h2 style={sectionTitleStyle}>Comment ca marche ?</h2>
          <p style={sectionSubtitleStyle}>
            En 3 etapes simples, votre point de vente est operationnel. Aucune connaissance technique requise.
          </p>

          <div className="landing-steps-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 40,
            maxWidth: 960,
            margin: '0 auto',
          }}>
            {[
              {
                step: '01',
                title: 'Inscrivez-vous gratuitement',
                description: 'Creez votre compte en 30 secondes. Pas de carte bancaire requise, pas d\'engagement.',
                color: '#2563eb',
              },
              {
                step: '02',
                title: 'Configurez votre boutique',
                description: 'Ajoutez vos produits, configurez votre imprimante Bluetooth et personnalisez vos tickets.',
                color: '#16a34a',
              },
              {
                step: '03',
                title: 'Commencez a vendre',
                description: 'Votre caisse est prete. Vendez, encaissez, imprimez les tickets - meme sans internet.',
                color: '#9333ea',
              },
            ].map((step, index) => (
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
          PRICING SECTION
          ================================================================ */}
      <section id="pricing" style={sectionStyle('#ffffff')}>
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
            Tarifs
          </p>
          <h2 style={sectionTitleStyle}>Tarifs simples et transparents</h2>
          <p style={sectionSubtitleStyle}>
            Commencez gratuitement, evoluez a votre rythme. Pas de frais caches, pas de surprise.
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
              Mensuel
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
              Annuel
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
                2 mois offerts
              </span>
            )}
          </div>

          {/* Pricing cards */}
          <div className="landing-pricing-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
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
                          Sur devis
                        </span>
                      </div>
                    ) : plan.price === 0 ? (
                      <div>
                        <span style={{
                          fontSize: 40,
                          fontWeight: 800,
                          color: '#0f172a',
                          letterSpacing: '-0.02em',
                        }}>
                          0
                        </span>
                        <span style={{
                          fontSize: 16,
                          fontWeight: 500,
                          color: '#64748b',
                          marginLeft: 4,
                        }}>
                          FCFA
                        </span>
                        <p style={{
                          fontSize: 13,
                          color: '#16a34a',
                          fontWeight: 600,
                          margin: '4px 0 0',
                        }}>
                          Toujours gratuit
                        </p>
                      </div>
                    ) : (
                      <div>
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
                          FCFA{plan.period}
                        </span>
                        {billingYearly && plan.price > 0 && (
                          <p style={{
                            fontSize: 12,
                            color: '#16a34a',
                            fontWeight: 600,
                            margin: '4px 0 0',
                          }}>
                            soit {formatPrice(plan.priceYearly * 12)} FCFA/an
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA button */}
                  <button
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
            }}>
              <IconShield />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
                Satisfait ou rembourse 30 jours
              </p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Testez sans risque. Si vous n'etes pas satisfait, nous vous remboursons integralement.
              </p>
            </div>
          </div>

          {/* Payment methods */}
          <div style={{
            textAlign: 'center',
            marginTop: 32,
          }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px' }}>
              Paiement securise par
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
      <section id="testimonials" style={{
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
            Temoignages
          </p>
          <h2 style={sectionTitleStyle}>Ce que disent nos clients</h2>
          <p style={sectionSubtitleStyle}>
            Des centaines de commercants font confiance a POS Mano Verde pour gerer leur activite au quotidien.
          </p>

          <div className="landing-testimonials-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
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
                  "{testimonial.text}"
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
                      {testimonial.role} - {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FAQ SECTION
          ================================================================ */}
      <section id="faq" style={sectionStyle('#ffffff')}>
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
            FAQ
          </p>
          <h2 style={sectionTitleStyle}>Questions frequentes</h2>
          <p style={sectionSubtitleStyle}>
            Tout ce que vous devez savoir avant de commencer. Vous ne trouvez pas la reponse ? Contactez-nous.
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
              Vous avez d'autres questions ?
            </p>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>
              Notre equipe est disponible pour vous repondre.
            </p>
            <button
              style={{
                padding: '12px 28px',
                borderRadius: 10,
                border: '2px solid #2563eb',
                backgroundColor: 'transparent',
                color: '#2563eb',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
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
              Nous contacter
            </button>
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
            Pret a transformer
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #4ade80, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              votre commerce ?
            </span>
          </h2>
          <p style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: 520,
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}>
            Rejoignez les centaines de commercants qui gerent leurs boutiques efficacement avec POS Mano Verde.
          </p>

          <button
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
            Commencer gratuitement
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
            Pas de carte bancaire requise - Demarrez en 2 minutes
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
                La solution de caisse intelligente concue pour les commercants africains. Fonctionnement hors-ligne, synchronisation automatique et impression Bluetooth.
              </p>
              {/* Social links */}
              <div style={{ display: 'flex', gap: 12 }}>
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
                Produit
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Fonctionnalites', 'Tarifs', 'Documentation', 'API', 'Changelog'].map((link) => (
                  <li key={link} style={{ marginBottom: 12 }}>
                    <button
                      style={{
                        background: 'none', border: 'none', color: '#94a3b8',
                        fontSize: 14, cursor: 'pointer', padding: 0,
                        fontFamily: pageFont, transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                      onClick={() => {
                        if (link === 'Fonctionnalites') scrollToSection('features')
                        if (link === 'Tarifs') scrollToSection('pricing')
                      }}
                    >
                      {link}
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
                Support
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Centre d\'aide', 'Contact', 'Communaute', 'Statut du service', 'Tutoriels'].map((link) => (
                  <li key={link} style={{ marginBottom: 12 }}>
                    <button
                      style={{
                        background: 'none', border: 'none', color: '#94a3b8',
                        fontSize: 14, cursor: 'pointer', padding: 0,
                        fontFamily: pageFont, transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                    >
                      {link}
                    </button>
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
                Legal
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Conditions d\'utilisation', 'Politique de confidentialite', 'Mentions legales', 'CGV'].map((link) => (
                  <li key={link} style={{ marginBottom: 12 }}>
                    <button
                      style={{
                        background: 'none', border: 'none', color: '#94a3b8',
                        fontSize: 14, cursor: 'pointer', padding: 0,
                        fontFamily: pageFont, transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8' }}
                    >
                      {link}
                    </button>
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
                &copy; 2024-2026 Mano Verde SA. Tous droits reserves.
              </p>
              <p style={{
                fontSize: 13,
                margin: 0,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                Concu et developpe au Cameroun
                <span role="img" aria-label="Cameroon flag" style={{ fontSize: 16 }}>
                  &#x1F1E8;&#x1F1F2;
                </span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
