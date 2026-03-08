import { useEffect, useMemo } from 'react'
import { useAppStore } from './stores/appStore'
import { useAuthStore } from './stores/authStore'
import { useProductStore } from './stores/productStore'
import { useOrderStore } from './stores/orderStore'
import { useSyncStore } from './stores/syncStore'
import { useLanguageStore } from './stores/languageStore'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { useSync } from './hooks/useSync'
import Layout from './components/layout/Layout'
import HelpButton from './components/common/HelpButton'
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
import WaiterPOSPage from './pages/WaiterPOSPage'
import StoreSelectPage from './pages/StoreSelectPage'
import { getSidebarItems } from './data/sidebarConfig'
import { resolveI18nKey } from './utils/i18nResolve'

function AppContent() {
  const { section, setSection, mode, activity, currentStore } = useAppStore()
  const { user } = useAuthStore()
  const { loadProducts } = useProductStore()
  const { loadOrders } = useOrderStore()
  const { countPending } = useSyncStore()
  const { t } = useLanguageStore()

  useOnlineStatus()
  useSync()

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

  // Activities that use table-based waiter mode in client mode
  const TABLE_ACTIVITIES = ['restaurant', 'bar', 'bakery', 'hotel']

  const renderPage = () => {
    if (mode === 'client') {
      // For restaurant/bar/bakery/hotel, use lightweight waiter interface
      if (TABLE_ACTIVITIES.includes(currentActivity)) {
        return <WaiterPOSPage />
      }
      return <POSPage />
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
      case 'payroll':       return <PayrollPage />
      default:              return <DashboardPage />
    }
  }

  return (
    <Layout title={currentTitle} subtitle={currentSubtitle}>
      {renderPage()}
      <HelpButton pageKey={pageKey} userRole={user?.role} />
    </Layout>
  )
}

export default function App() {
  const { activity, registrationMode, showLogin, needsStoreSelection, setIsAppInstalled, setInstallPromptEvent } = useAppStore()
  const { user, token } = useAuthStore()

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

  // Registration flow (all plans including free)
  if (registrationMode) {
    return <RegistrationPage />
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
