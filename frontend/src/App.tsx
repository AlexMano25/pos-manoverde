import { useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import { useAuthStore } from './stores/authStore'
import { useProductStore } from './stores/productStore'
import { useOrderStore } from './stores/orderStore'
import { useSyncStore } from './stores/syncStore'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { useSync } from './hooks/useSync'
import Layout from './components/layout/Layout'
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

  useOnlineStatus()
  useSync()

  const storeId = currentStore?.id || user?.store_id || 'default-store'

  useEffect(() => {
    loadProducts(storeId)
    loadOrders(storeId)
    countPending()
  }, [storeId, loadProducts, loadOrders, countPending])

  const pageTitles: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: 'Tableau de bord', subtitle: activity ? `${activity.charAt(0).toUpperCase() + activity.slice(1)}` : undefined },
    pos: { title: 'Caisse', subtitle: 'Point de vente' },
    products: { title: 'Produits', subtitle: 'Gestion du catalogue' },
    orders: { title: 'Commandes', subtitle: 'Historique des ventes' },
    stock: { title: 'Stock', subtitle: 'Gestion des inventaires' },
    employees: { title: 'Employes', subtitle: 'Equipe et acces' },
    settings: { title: 'Parametres', subtitle: 'Configuration du systeme' },
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
    </Layout>
  )
}

export default function App() {
  const { activity } = useAppStore()
  const { user, token } = useAuthStore()

  if (!activity) {
    return <SetupPage />
  }

  if (!user || !token) {
    return <LoginPage />
  }

  return <AppContent />
}
