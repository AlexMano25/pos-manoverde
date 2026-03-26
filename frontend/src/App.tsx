import { useEffect, useMemo } from 'react'
import { useAppStore } from './stores/appStore'
import { useAuthStore } from './stores/authStore'
import { useProductStore } from './stores/productStore'
import { useOrderStore } from './stores/orderStore'
import { useSyncStore } from './stores/syncStore'
import { useLanguageStore } from './stores/languageStore'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { useSync } from './hooks/useSync'
import { useInventoryAlerts } from './hooks/useInventoryAlerts'
import Layout from './components/layout/Layout'
import ChatWidget from './components/common/ChatWidget'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
// SetupPage removed - registration flow handles all plans
import DashboardPage from './pages/DashboardPage'
import POSPage from './pages/POSPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import StockPage from './pages/StockPage'
import EmployeesPage from './pages/EmployeesPage'
import SettingsPage from './pages/SettingsPage'
import RegistrationPage from './pages/RegistrationPage'
import BillingPage from './pages/BillingPage'
import TablesPage from './pages/TablesPage'
import CustomersPage from './pages/CustomersPage'
import PromotionsPage from './pages/PromotionsPage'
import ReportsPage from './pages/ReportsPage'
import AppointmentsPage from './pages/AppointmentsPage'
import MembershipsPage from './pages/MembershipsPage'
import WorkOrdersPage from './pages/WorkOrdersPage'
import QuotesPage from './pages/QuotesPage'
import CashRegisterPage from './pages/CashRegisterPage'
import SuppliersPage from './pages/SuppliersPage'
import InvoicesPage from './pages/InvoicesPage'
import DeliveriesPage from './pages/DeliveriesPage'
import TimeAttendancePage from './pages/TimeAttendancePage'
import LoyaltyPage from './pages/LoyaltyPage'
import KitchenDisplayPage from './pages/KitchenDisplayPage'
import GiftCardsPage from './pages/GiftCardsPage'
import ExpensesPage from './pages/ExpensesPage'
import CampaignsPage from './pages/CampaignsPage'
import PayrollPage from './pages/PayrollPage'
import NotificationsPage from './pages/NotificationsPage'
import AuditTrailPage from './pages/AuditTrailPage'
import ReturnsPage from './pages/ReturnsPage'
import DocumentsPage from './pages/DocumentsPage'
import TransfersPage from './pages/TransfersPage'
import RecipesPage from './pages/RecipesPage'
import OnlineOrdersPage from './pages/OnlineOrdersPage'
import MaintenancePage from './pages/MaintenancePage'
import SelfCheckoutPage from './pages/SelfCheckoutPage'
import WarrantyPage from './pages/WarrantyPage'
import BarcodePage from './pages/BarcodePage'
import DynamicPricingPage from './pages/DynamicPricingPage'
import WasteLossPage from './pages/WasteLossPage'
import StocktakePage from './pages/StocktakePage'
import TaxPage from './pages/TaxPage'
import FeedbackPage from './pages/FeedbackPage'
import ServerOrderPage from './pages/ServerOrderPage'
import RoomManagementPage from './pages/RoomManagementPage'
import HousekeepingPage from './pages/HousekeepingPage'
import MinibarPage from './pages/MinibarPage'
import EnrollmentPage from './pages/EnrollmentPage'
import AttendancePage from './pages/AttendancePage'
import GradesPage from './pages/GradesPage'
import TravelPackagePage from './pages/TravelPackagePage'
import ItineraryPage from './pages/ItineraryPage'
import BookingCalendarPage from './pages/BookingCalendarPage'
import VinDecoderPage from './pages/VinDecoderPage'
import VehicleHistoryPage from './pages/VehicleHistoryPage'
import PartsCatalogPage from './pages/PartsCatalogPage'
import MultiStoreDashboardPage from './pages/MultiStoreDashboardPage'
import WebhooksPage from './pages/WebhooksPage'
import DataExchangePage from './pages/DataExchangePage'
import SuperAdminPage from './pages/SuperAdminPage'
import SchedulePage from './pages/SchedulePage'
import ForecastPage from './pages/ForecastPage'
import AgentDashboardPage from './pages/AgentDashboardPage'
import QROrderPage from './pages/QROrderPage'
import CatalogPage from './pages/CatalogPage'
import LegalPage from './pages/LegalPage'
import PlanWarningBanner from './components/PlanWarningBanner'
import StoreSelectPage from './pages/StoreSelectPage'
import { getSidebarItems } from './data/sidebarConfig'
import { resolveI18nKey } from './utils/i18nResolve'
import { usePlanEnforcement } from './hooks/usePlanEnforcement'

function AppContent() {
  const { section, setSection, mode, activity, currentStore } = useAppStore()
  const { user } = useAuthStore()
  const { loadProducts } = useProductStore()
  const { loadOrders } = useOrderStore()
  const { countPending } = useSyncStore()
  const { t } = useLanguageStore()

  useOnlineStatus()
  useSync()
  useInventoryAlerts()
  usePlanEnforcement()

  // Refresh user profile on mount to get latest allowed_pages
  useEffect(() => {
    if (user) {
      useAuthStore.getState().refreshProfile()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Client mode: force POS section
  useEffect(() => {
    if (mode === 'client' && section !== 'pos') {
      setSection('pos')
    }
  }, [mode, section, setSection])

  const storeId = currentStore?.id || user?.store_id || 'default-store'

  useEffect(() => {
    document.documentElement.classList.add('app-mode')
    return () => { document.documentElement.classList.remove('app-mode') }
  }, [])

  useEffect(() => {
    loadProducts(storeId)
    loadOrders(storeId)
    countPending()
  }, [storeId, loadProducts, loadOrders, countPending])

  const currentActivity = (activity || currentStore?.activity || 'restaurant')
  const sidebarItems = useMemo(() => getSidebarItems(currentActivity), [currentActivity])
  const currentItem = sidebarItems.find(item => item.section === section)
  const pageKey = currentItem?.pageComponent || 'dashboard'

  const currentTitle = currentItem
    ? resolveI18nKey(t as unknown as Record<string, unknown>, currentItem.i18nKey)
    : t.nav.dashboard
  const currentSubtitle = currentActivity
    ? ((t.setup as Record<string, string>)[currentActivity] || currentActivity)
    : undefined

  // Validate current section when activity changes
  useEffect(() => {
    const items = getSidebarItems(activity || currentStore?.activity)
    const validSections = items.map(i => i.section)
    if (section && !validSections.includes(section as any)) {
      setSection('dashboard')
    }
  }, [activity, currentStore?.activity])

  const renderPage = () => {
    if (mode === 'client') {
      // Cross-functional server order-taking interface
      // Supports tables (for restaurant/bar/hotel) and customer name (all activities)
      return <ServerOrderPage />
    }

    switch (pageKey) {
      case 'pos':       return <POSPage />
      case 'products':  return <ProductsPage />
      case 'orders':    return <OrdersPage />
      case 'stock':     return <StockPage />
      case 'employees': return <EmployeesPage />
      case 'settings':  return <SettingsPage />
      case 'billing':    return <BillingPage />
      case 'tables':     return <TablesPage />
      case 'customers':  return <CustomersPage />
      case 'promotions': return <PromotionsPage />
      case 'reports':       return <ReportsPage />
      case 'appointments':  return <AppointmentsPage />
      case 'memberships':   return <MembershipsPage />
      case 'work_orders':   return <WorkOrdersPage />
      case 'quotes':        return <QuotesPage />
      case 'cash_register': return <CashRegisterPage />
      case 'suppliers':     return <SuppliersPage />
      case 'invoices':      return <InvoicesPage />
      case 'deliveries':    return <DeliveriesPage />
      case 'time_attendance': return <TimeAttendancePage />
      case 'loyalty':       return <LoyaltyPage />
      case 'kds':           return <KitchenDisplayPage />
      case 'gift_cards':    return <GiftCardsPage />
      case 'expenses':      return <ExpensesPage />
      case 'campaigns':     return <CampaignsPage />
      case 'payroll':        return <PayrollPage />
      case 'notifications':  return <NotificationsPage />
      case 'audit_trail':    return <AuditTrailPage />
      case 'returns':        return <ReturnsPage />
      case 'documents':      return <DocumentsPage />
      case 'transfers':      return <TransfersPage />
      case 'recipes':        return <RecipesPage />
      case 'online_orders':  return <OnlineOrdersPage />
      case 'maintenance':      return <MaintenancePage />
      case 'self_checkout':    return <SelfCheckoutPage />
      case 'warranty':         return <WarrantyPage />
      case 'barcode':          return <BarcodePage />
      case 'dynamic_pricing':  return <DynamicPricingPage />
      case 'waste_loss':       return <WasteLossPage />
      case 'stocktake':        return <StocktakePage />
      case 'tax':              return <TaxPage />
      case 'feedback':         return <FeedbackPage />
      case 'server_orders':    return <ServerOrderPage />
      case 'room_management':  return <RoomManagementPage />
      case 'housekeeping':     return <HousekeepingPage />
      case 'minibar':          return <MinibarPage />
      case 'student_enrollment': return <EnrollmentPage />
      case 'attendance':       return <AttendancePage />
      case 'grades':           return <GradesPage />
      case 'travel_packages':  return <TravelPackagePage />
      case 'itineraries':      return <ItineraryPage />
      case 'booking_calendar': return <BookingCalendarPage />
      case 'vin_decoder':      return <VinDecoderPage />
      case 'vehicle_history':  return <VehicleHistoryPage />
      case 'parts_catalog':    return <PartsCatalogPage />
      case 'multi_store':      return <MultiStoreDashboardPage />
      case 'webhooks':         return <WebhooksPage />
      case 'data_exchange':    return <DataExchangePage />
      case 'schedule':         return <SchedulePage />
      case 'super_admin':      return <SuperAdminPage />
      case 'forecast':         return <ForecastPage />
      default:                 return <DashboardPage />
    }
  }

  // Super admin: hide activity subtitle, override title when on super_admin section
  const isSuperAdmin = user?.role === 'super_admin'
  const effectiveTitle = (isSuperAdmin && section === 'super_admin') ? 'Super Admin' : currentTitle
  const effectiveSubtitle = isSuperAdmin ? undefined : currentSubtitle

  return (
    <Layout title={effectiveTitle} subtitle={effectiveSubtitle}>
      <PlanWarningBanner />
      {renderPage()}
      <ChatWidget pageKey={pageKey} userRole={user?.role} />
    </Layout>
  )
}

// Public pages rendered WITHOUT any store/auth — prevents login redirect
export default function PublicRouter() {
  const pathname = window.location.pathname
  const search = window.location.search
  if (pathname === '/privacy') return <LegalPage type="privacy" />
  if (pathname === '/terms') return <LegalPage type="terms" />
  if (pathname === '/order' || new URLSearchParams(search).get('order') === 'qr') return <QROrderPage />
  if (pathname === '/catalog') return <CatalogPage />
  return <App />
}

function App() {
  const { activity, registrationMode, showLogin, needsStoreSelection, setIsAppInstalled, setInstallPromptEvent, setReferralCode } = useAppStore()
  const { user, token } = useAuthStore()

  // Capture ?ref= referral code from URL on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const refCode = params.get('ref')
    if (refCode) {
      setReferralCode(refCode)
      sessionStorage.setItem('pos_referral_code', refCode)
    }
    // Store employee invite store/email params for login pre-fill
    const storeParam = params.get('store')
    const emailParam = params.get('email')
    if (storeParam) sessionStorage.setItem('pos_invite_store', storeParam)
    if (emailParam) sessionStorage.setItem('pos_invite_email', emailParam)
    // Clean ref from URL (keep store/email for LoginPage to read)
    if (refCode) {
      const url = new URL(window.location.href)
      url.searchParams.delete('ref')
      window.history.replaceState({}, '', url.pathname + url.search)
    }
  }, [setReferralCode])

  useEffect(() => {
    if (!activity && !registrationMode && !showLogin) {
      document.documentElement.classList.remove('app-mode')
    }
  }, [activity, registrationMode, showLogin])

  // PWA install prompt + detection
  useEffect(() => {
    // Detect if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true) {
      setIsAppInstalled(true)
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPromptEvent(e)
    }

    const handleAppInstalled = () => {
      setIsAppInstalled(true)
      setInstallPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [setIsAppInstalled, setInstallPromptEvent])

  // Public routes handled by PublicRouter wrapper (no auth needed)

  // Registration flow (all plans including free)
  if (registrationMode) {
    return <RegistrationPage />
  }

  // Agent dashboard — agents don't need activity or store, intercept early
  if (user && token && user.role === 'agent') {
    return <AgentDashboardPage />
  }

  // Explicit login mode (user clicked "Already have an account?" or "Sign in")
  // Skip if user is already authenticated with an activity (login succeeded)
  if (showLogin && !(user && token && activity)) {
    return <LoginPage />
  }

  // No activity = not registered yet → show landing
  if (!activity) {
    // Clear stale partial setup state
    const stored = localStorage.getItem('pos-app-store')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed?.state && !parsed.state.activity && !parsed.state.registrationMode && !parsed.state.showLogin) {
          localStorage.removeItem('pos-app-store')
        }
      } catch { /* ignore */ }
    }
    return <LandingPage />
  }

  // Has activity but not logged in
  if (!user || !token) {
    return <LoginPage />
  }

  // Multiple stores available → let user pick
  if (needsStoreSelection) {
    return <StoreSelectPage />
  }

  return <AppContent />
}
