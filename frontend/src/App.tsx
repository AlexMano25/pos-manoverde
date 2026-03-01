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
import SetupPage from './pages/SetupPage'
import DashboardPage from './pages/DashboardPage'
import POSPage from './pages/POSPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import StockPage from './pages/StockPage'
import EmployeesPage from './pages/EmployeesPage'
import SettingsPage from './pages/SettingsPage'

function AppContent() {
  const { section, activity, currentStore } = useAppStore()
  const { user } = useAuthStore()
  const { loadProducts } = useProductStore()
  const { loadOrders } = useOrderStore()
  const { countPending } = useSyncStore()
  const { t } = useLanguageStore()

  useOnlineStatus()
  useSync()

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
  }

  const current = pageTitles[section] || pageTitles.dashboard

  const renderPage = () => {
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
  const { activity } = useAppStore()
  const { user, token } = useAuthStore()

  const isPublicAccess = !activity && !user && !token
  const hasSetupStarted = localStorage.getItem('pos-app-store')

  const isLanding = isPublicAccess && !hasSetupStarted

  // Remove app-mode class when showing landing/setup/login pages
  useEffect(() => {
    if (isLanding) {
      document.body.classList.remove('app-mode')
    }
  }, [isLanding])

  if (isLanding) {
    return <LandingPage />
  }

  if (!activity) {
    return <SetupPage />
  }

  if (!user || !token) {
    return <LoginPage />
  }

  return <AppContent />
}
