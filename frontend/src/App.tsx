import { useEffect } from 'react'
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
    document.body.classList.add('app-mode')
    return () => { document.body.classList.remove('app-mode') }
  }, [])

  useEffect(() => {
    loadProducts(storeId)
    loadOrders(storeId)
    countPending()
  }, [storeId, loadProducts, loadOrders, countPending])

  const pageTitles: Record<string, { title: string; subtitle?: string; helpKey: string }> = {
    dashboard: { title: t.nav.dashboard, subtitle: activity ? `${activity.charAt(0).toUpperCase() + activity.slice(1)}` : undefined, helpKey: 'dashboard' },
    pos: { title: t.nav.pos, subtitle: t.pos.title, helpKey: 'pos' },
    products: { title: t.nav.products, subtitle: t.products.subtitle, helpKey: 'products' },
    orders: { title: t.nav.orders, subtitle: t.orders.subtitle, helpKey: 'orders' },
    stock: { title: t.nav.stock, subtitle: t.stock.subtitle, helpKey: 'stock' },
    employees: { title: t.nav.employees, subtitle: t.employees.subtitle, helpKey: 'employees' },
    settings: { title: t.nav.settings, subtitle: t.settings.subtitle, helpKey: 'settings' },
    billing: { title: t.nav.billing, subtitle: t.billing.subtitle, helpKey: 'billing' },
  }

  const current = pageTitles[section] || pageTitles.dashboard

  const renderPage = () => {
    // Client mode: always show POS
    if (mode === 'client') {
      return <POSPage />
    }

    switch (section) {
      case 'pos':
        return <POSPage />
      case 'products':
        return <ProductsPage />
      case 'orders':
        return <OrdersPage />
      case 'stock':
        return <StockPage />
      case 'employees':
        return <EmployeesPage />
      case 'settings':
        return <SettingsPage />
      case 'billing':
        return <BillingPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <Layout title={current.title} subtitle={current.subtitle}>
      {renderPage()}
      <HelpButton pageKey={current.helpKey} userRole={user?.role} />
    </Layout>
  )
}

export default function App() {
  const { activity, registrationMode, showLogin } = useAppStore()
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (!activity && !registrationMode && !showLogin) {
      document.body.classList.remove('app-mode')
    }
  }, [activity, registrationMode, showLogin])

  // Registration flow (all plans including free)
  if (registrationMode) {
    return <RegistrationPage />
  }

  // Explicit login mode (user clicked "Already have an account?" or "Sign in")
  if (showLogin) {
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

  return <AppContent />
}
