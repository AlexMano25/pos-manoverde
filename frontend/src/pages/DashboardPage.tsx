import React, { useEffect, useMemo, useState } from 'react'
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Plus,
  TrendingUp,
  Download,
  CreditCard,
  Receipt,
  ShoppingBag,
  TrendingUp as TrendingUpIcon,
  Clock,
  Calendar,
  Activity,
  Users,
  Car,
  Home,
  Target,
  GraduationCap,
  Loader,
  BedDouble,
  Wine,
  UtensilsCrossed,
  X,
  Info,
} from 'lucide-react'
import { useOrderStore } from '../stores/orderStore'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import ExportMenu from '../components/common/ExportMenu'
import { exportDailySummary } from '../utils/pdfExport'
import { DASHBOARD_CONFIG } from '../data/dashboardConfig'
import { getSidebarItems } from '../data/sidebarConfig'
import { getTemplatesForActivity } from '../data/contractTemplates'
import { computeStatValue, getStatCardMeta, computeWeeklyTrend, computeOrdersTrend } from '../utils/dashboardComputations'
import { seedSampleProducts } from '../utils/seedProducts'
import StatCard from '../components/dashboard/StatCard'
import QuickActions from '../components/dashboard/QuickActions'
import WidgetRenderer from '../components/dashboard/WidgetRenderer'
import AIInsightsWidget from '../components/dashboard/AIInsightsWidget'
import ContractModal from '../components/dashboard/ContractModal'
import DashboardCustomizer from '../components/dashboard/DashboardCustomizer'
import { useResponsive } from '../hooks/useLayoutMode'
import InstallTutorial from '../components/common/InstallTutorial'
import type { PaymentMethod, CreditBalance, Activity as ActivityType, ContractTemplate } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
} as const

// ── Lucide icon map for dynamic stat cards ───────────────────────────────

const LUCIDE_ICONS: Record<string, React.ElementType> = {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  CreditCard,
  Receipt,
  ShoppingBag,
  TrendingUp: TrendingUpIcon,
  UtensilsCrossed,
  Wine,
  Clock,
  BedDouble,
  Calendar,
  Activity,
  Users,
  Car,
  Home,
  Target,
  GraduationCap,
  Loader,
}

// ── Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { orders, loading: ordersLoading, loadOrders } = useOrderStore()
  const { products, loading: productsLoading, loadProducts } = useProductStore()
  const { currentStore, setSection, activity, isAppInstalled, installPromptEvent, setInstallPromptEvent, setIsAppInstalled, setPendingAction } = useAppStore()
  const { user } = useAuthStore()
  const { t, language } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  // ── Locale-aware helpers ────────────────────────────────────────────────

  const intlLocale = language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : language === 'it' ? 'it-IT' : language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : 'en-US'

  const paymentLabels: Record<PaymentMethod, string> = {
    cash: t.pos.cash,
    card: t.pos.card,
    momo: t.pos.momo,
    transfer: t.pos.transfer,
    orange_money: t.pos.orangeMoney,
    mtn_money: t.pos.mtnMoney,
    carte_bancaire: t.pos.carteBancaire,
    paypal: 'PayPal',
  }

  const statusLabels: Record<string, string> = {
    paid: t.orders.paid,
    pending: t.orders.pending,
    refunded: t.orders.refunded,
    cancelled: t.orders.cancelled,
  }

  // ── Credit balance for pay-as-you-grow ────────────────────────────────

  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [showInstallTutorial, setShowInstallTutorial] = useState(false)
  const [installBannerDismissed, setInstallBannerDismissed] = useState(false)

  useEffect(() => {
    if (currentStore?.id) {
      loadOrders(currentStore.id)
      loadProducts(currentStore.id)
    }
  }, [currentStore?.id, loadOrders, loadProducts])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const orgId = currentStore?.organization_id
    if (!orgId) return

    supabase
      .from('credit_balances')
      .select('*')
      .eq('organization_id', orgId)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('[DashboardPage] Credit balance fetch failed:', error)
        else if (data) setCreditBalance(data as CreditBalance)
      })
  }, [currentStore?.organization_id])

  // ── Derived data ──────────────────────────────────────────────────────

  const todayStr = new Date().toISOString().slice(0, 10)

  const todayOrders = useMemo(
    () => orders.filter((o) => o.created_at.slice(0, 10) === todayStr),
    [orders, todayStr]
  )

  const hasData = orders.length > 0 || products.length > 0

  // Sparkline trends (7-day)
  const revenueTrend = useMemo(() => computeWeeklyTrend(orders), [orders])
  const ordersTrend = useMemo(() => computeOrdersTrend(orders), [orders])

  // ── Activity-specific config ──────────────────────────────────────────

  const currentActivity = (activity || currentStore?.activity || 'restaurant') as ActivityType
  const dashConfig = DASHBOARD_CONFIG[currentActivity] || DASHBOARD_CONFIG.restaurant

  // Find the sidebar section that maps to the 'orders' page (varies by activity)
  const ordersSection = useMemo(() => {
    const items = getSidebarItems(currentActivity)
    const match = items.find(i => i.pageComponent === 'orders' && i.section !== 'pos')
    return match?.section || 'orders'
  }, [currentActivity])

  // ── Contract templates for this activity ──────────────────────────────

  const activityTemplates = useMemo(
    () => getTemplatesForActivity(currentActivity),
    [currentActivity]
  )

  const contractTemplateLabels = useMemo(
    () => activityTemplates.map(tmpl => ({
      key: tmpl.key,
      label: (t.contracts as Record<string, string>)[tmpl.i18nKey.replace('contracts.', '')] || tmpl.key,
      icon: tmpl.icon,
    })),
    [activityTemplates, t.contracts]
  )

  // ── Quick action labels (resolve i18n keys) ───────────────────────────

  const resolvedQuickActions = useMemo(
    () => dashConfig.quickActions.map(qa => ({
      label: (t.dashboard as Record<string, string>)[qa.i18nKey.replace('dashboard.', '')] || qa.i18nKey,
      icon: qa.icon,
      targetSection: qa.targetSection,
      action: qa.action,
    })),
    [dashConfig.quickActions, t.dashboard]
  )

  // ── Stat card rendering ───────────────────────────────────────────────

  const statCards = useMemo(() => {
    return dashConfig.statCards.map(variant => {
      // Special handling for credit balance
      if (variant === 'credit' && creditBalance) {
        return {
          variant,
          value: creditBalance.balance_usd,
          meta: getStatCardMeta('credit'),
          extraLabel: `${Math.floor(creditBalance.balance_usd / 0.02).toLocaleString()} ${t.billing.ticketsLabel}`,
        }
      }
      if (variant === 'credit' && !creditBalance) return null

      const value = computeStatValue(variant, todayOrders, orders, products)
      const meta = getStatCardMeta(variant)
      return { variant, value, meta, extraLabel: undefined }
    }).filter(Boolean)
  }, [dashConfig.statCards, todayOrders, orders, products, creditBalance, t.billing.ticketsLabel])

  // ── Seed sample products for stores that don't have them ──────────────

  const handleSeedProducts = async () => {
    if (!currentStore?.id || seeding) return
    setSeeding(true)
    try {
      await seedSampleProducts(currentStore.id, currentActivity)
      // Reload products after seeding
      loadProducts(currentStore.id)
    } catch (err) {
      console.error('[DashboardPage] Seeding failed:', err)
    } finally {
      setSeeding(false)
    }
  }

  // ── Handle contract selection ─────────────────────────────────────────

  const handleSelectContract = (templateKey: string) => {
    const tmpl = activityTemplates.find(t => t.key === templateKey)
    if (tmpl) {
      setSelectedTemplate(tmpl)
      setContractModalOpen(true)
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(16, 24, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12, flexDirection: isMobile ? 'column' : 'row' }
  const titleStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }
  const subtitleStyle: React.CSSProperties = { fontSize: 14, color: C.textSecondary, margin: '4px 0 0' }
  const actionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
  const primaryBtnStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: C.primary, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
  const outlineBtnStyle: React.CSSProperties = { ...primaryBtnStyle, backgroundColor: '#ffffff', color: C.primary, border: `1px solid ${C.primary}` }
  const emptyStyle: React.CSSProperties = { textAlign: 'center', padding: rv('32px 16px', '60px 24px', '60px 24px'), backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}` }
  const emptyIconStyle: React.CSSProperties = { width: 64, height: 64, borderRadius: 16, backgroundColor: C.primary + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }

  if (ordersLoading || productsLoading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textSecondary, fontSize: 16 }}>{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t.dashboard.title}</h1>
          <p style={subtitleStyle}>
            {currentStore?.name || 'POS Mano Verde'} &mdash;{' '}
            {new Date().toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={actionsStyle}>
          <DashboardCustomizer
            storeId={currentStore?.id || 'default'}
            userId={user?.id || 'default'}
            labels={{
              customizeDashboard: ((t as unknown as Record<string, any>).dashboard?.customize) || 'Customize',
              customize: ((t as unknown as Record<string, any>).dashboard?.customize) || 'Customize',
              reset: t.common.cancel,
              hide: ((t as unknown as Record<string, any>).common?.hide) || 'Hide',
              show: ((t as unknown as Record<string, any>).common?.show) || 'Show',
              widget_stat_card: ((t as unknown as Record<string, any>).dashboard?.keyMetrics) || 'Key Metrics',
              widget_ai_insights: ((t as unknown as Record<string, any>).ai?.insights) || 'AI Insights',
              widget_quick_actions: t.dashboard.quickActions,
              widget_revenue_chart: ((t as unknown as Record<string, any>).dashboard?.revenueChart) || 'Revenue Chart',
              widget_category_breakdown: t.dashboard.categoryBreakdown,
              widget_heatmap: ((t as unknown as Record<string, any>).dashboard?.heatmap) || 'Heatmap',
              widget_peak_hours: t.dashboard.peakHours,
              widget_top_products: ((t as unknown as Record<string, any>).reports?.topProducts) || 'Top Products',
              widget_payment_breakdown: ((t as unknown as Record<string, any>).reports?.paymentBreakdown) || 'Payment Methods',
              widget_alerts: t.dashboard.alerts,
              widget_recent_orders: t.dashboard.recentOrders,
            }}
          />
          <ExportMenu
            label={t.common.export}
            items={[
              {
                label: t.common.exportPDF,
                icon: <Download size={14} color={C.primary} />,
                onClick: () => exportDailySummary(orders, products, currentStore?.name || 'POS'),
              },
            ]}
          />
          <button style={primaryBtnStyle} onClick={() => setSection('pos')}>
            <ShoppingCart size={16} /> {t.dashboard.newSale}
          </button>
          <button style={outlineBtnStyle} onClick={() => setSection('products')}>
            <Plus size={16} /> {t.dashboard.addProduct}
          </button>
        </div>
      </div>

      {/* ── Install PWA Banner ──────────────────────────────────────── */}
      {!isAppInstalled && !installBannerDismissed && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 12,
          padding: rv('14px 16px', '16px 20px', '16px 24px'),
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: rv(12, 16, 16),
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Download size={20} color={C.primary} />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>
              {((t as unknown as Record<string, any>).install?.title) || 'Installer l\'application'}
            </p>
            <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 0' }}>
              {((t as unknown as Record<string, any>).install?.description) || 'Accès rapide depuis votre écran d\'accueil'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {installPromptEvent && (
              <button
                onClick={async () => {
                  try {
                    await installPromptEvent.prompt()
                    const result = await installPromptEvent.userChoice
                    if (result.outcome === 'accepted') {
                      setIsAppInstalled(true)
                      setInstallPromptEvent(null)
                    }
                  } catch { /* dismissed */ }
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: C.primary,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Download size={14} /> {((t as unknown as Record<string, any>).install?.installButton) || 'Installer'}
              </button>
            )}
            <button
              onClick={() => setShowInstallTutorial(true)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                backgroundColor: '#fff',
                color: C.text,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Info size={14} /> {((t as unknown as Record<string, any>).install?.howToInstall) || 'Comment installer'}
            </button>
            <button
              onClick={() => setInstallBannerDismissed(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: '#94a3b8',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {!hasData ? (
        <div style={emptyStyle}>
          <div style={emptyIconStyle}>
            <TrendingUp size={32} color={C.primary} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
            {t.dashboard.welcomeTitle}
          </h2>
          <p style={{ color: C.textSecondary, fontSize: 14, margin: '0 0 24px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            {t.dashboard.welcomeMessage}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{ ...primaryBtnStyle, backgroundColor: seeding ? '#93c5fd' : C.primary }}
              onClick={handleSeedProducts}
              disabled={seeding}
            >
              <Package size={16} /> {seeding ? t.common.loading : (t.dashboard.loadExamples || 'Charger les exemples')}
            </button>
            <button style={outlineBtnStyle} onClick={() => setSection('products')}>
              <Plus size={16} /> {t.dashboard.addProduct}
            </button>
            <button style={outlineBtnStyle} onClick={() => setSection('pos')}>
              <ShoppingCart size={16} /> {t.dashboard.newSale}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Activity-specific Stat Cards ──────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(3, 1fr)', `repeat(${Math.min(statCards.length, 5)}, 1fr)`),
            gap: rv(12, 16, 16),
            marginBottom: 24,
          }}>
            {statCards.map((card) => {
              if (!card) return null
              const { variant, value, meta } = card
              const IconComponent = LUCIDE_ICONS[meta.icon] || DollarSign
              const label = (t.dashboard as Record<string, string>)[meta.labelKey.replace('dashboard.', '')] || meta.labelKey
              // Assign sparkline based on variant
              const sparkline = variant === 'revenue' ? revenueTrend
                : variant === 'orders' ? ordersTrend
                : undefined
              return (
                <StatCard
                  key={variant}
                  label={label}
                  value={value}
                  icon={<IconComponent size={20} />}
                  color={meta.color}
                  isCurrency={meta.isCurrency}
                  isPercentage={meta.isPercentage}
                  currencyCode={currentStore?.currency}
                  sparkline={sparkline}
                />
              )
            })}
          </div>

          {/* ── Quick Actions ─────────────────────────────────────────── */}
          <div style={{ marginBottom: 24 }}>
            <QuickActions
              actions={resolvedQuickActions}
              onNavigate={(section, action) => {
                if (action) setPendingAction({ type: action as 'add', section })
                setSection(section)
              }}
              title={t.dashboard.quickActions}
            />
          </div>

          {/* ── AI Insights Widget ─────────────────────────────────── */}
          <AIInsightsWidget
            orders={orders}
            products={products}
            labels={{
              aiInsights: ((t as unknown as Record<string, any>).ai?.insights) || 'AI Insights',
              viewAll: t.dashboard.viewAll,
              rising: ((t as unknown as Record<string, any>).ai?.rising) || 'Rising',
              atRisk: ((t as unknown as Record<string, any>).ai?.atRisk) || 'At Risk',
              anomalies: ((t as unknown as Record<string, any>).ai?.anomalies) || 'Anomalies',
              stockoutWarning: ((t as unknown as Record<string, any>).ai?.stockoutWarning) || 'Stockout Risk (< 14 days)',
              topTrending: ((t as unknown as Record<string, any>).ai?.topTrending) || 'Top Trending',
            }}
            onNavigate={setSection}
          />

          {/* ── Activity-specific Widgets + Recent Orders ─────────────── */}
          <WidgetRenderer
            config={dashConfig}
            todayOrders={todayOrders}
            allOrders={orders}
            products={products}
            currencyCode={currentStore?.currency}
            labels={{
              categoryBreakdown: t.dashboard.categoryBreakdown,
              peakHours: t.dashboard.peakHours,
              alerts: t.dashboard.alerts,
              contracts: t.dashboard.contracts,
              recentOrders: t.dashboard.recentOrders,
              viewAll: t.dashboard.viewAll,
              orderId: t.orders.orderId,
              dateTime: t.orders.dateTime,
              articles: t.common.articles,
              total: t.common.total,
              paymentMethod: t.orders.paymentMethod,
              status: t.common.status,
              revenueChart: (t.dashboard as Record<string, string>).revenueChart || 'Revenus (7 jours)',
              salesTrend: (t.dashboard as Record<string, string>).salesTrend || 'Tendance des ventes',
            }}
            paymentLabels={paymentLabels}
            statusLabels={statusLabels}
            onNavigate={setSection}
            ordersSection={ordersSection}
            contractTemplates={contractTemplateLabels}
            onSelectContract={handleSelectContract}
          />
        </>
      )}

      {/* ── Contract Modal ──────────────────────────────────────────── */}
      <ContractModal
        isOpen={contractModalOpen}
        onClose={() => {
          setContractModalOpen(false)
          setSelectedTemplate(null)
        }}
        template={selectedTemplate}
        storeName={currentStore?.name || 'POS Mano Verde'}
        storeAddress={currentStore?.address}
        storePhone={currentStore?.phone}
      />

      <InstallTutorial
        isOpen={showInstallTutorial}
        onClose={() => setShowInstallTutorial(false)}
      />
    </div>
  )
}
