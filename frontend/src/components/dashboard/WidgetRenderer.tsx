import { useMemo } from 'react'
import { useResponsive } from '../../hooks/useLayoutMode'
import type { Order, Product, ActivityDashboardConfig } from '../../types'
import type { CategoryBreakdownItem, PeakHourItem, AlertItem } from '../../utils/dashboardComputations'
import {
  computeCategoryBreakdown,
  computePeakHours,
  computeAlerts,
} from '../../utils/dashboardComputations'
import CategoryBreakdown from './CategoryBreakdown'
import PeakHoursWidget from './PeakHoursWidget'
import AlertsPanel from './AlertsPanel'
import ContractShortcuts from './ContractShortcuts'
import RecentItemsTable from './RecentItemsTable'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WidgetRendererProps = {
  config: ActivityDashboardConfig
  todayOrders: Order[]
  allOrders: Order[]
  products: Product[]
  currencyCode?: string
  labels: {
    categoryBreakdown: string
    peakHours: string
    alerts: string
    contracts: string
    recentOrders: string
    viewAll: string
    orderId: string
    dateTime: string
    articles: string
    total: string
    paymentMethod: string
    status: string
  }
  paymentLabels: Record<string, string>
  statusLabels: Record<string, string>
  onNavigate: (section: string) => void
  contractTemplates: Array<{ key: string; label: string; icon: string }>
  onSelectContract: (key: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WidgetRenderer = ({
  config,
  todayOrders,
  allOrders,
  products,
  currencyCode,
  labels,
  paymentLabels,
  statusLabels,
  onNavigate,
  contractTemplates,
  onSelectContract,
}: WidgetRendererProps) => {
  const { rv } = useResponsive()

  // Compute derived data
  const categoryData: CategoryBreakdownItem[] = useMemo(
    () => computeCategoryBreakdown(todayOrders, products),
    [todayOrders, products],
  )

  const peakHoursData: PeakHourItem[] = useMemo(
    () => computePeakHours(todayOrders),
    [todayOrders],
  )

  const alertsMap = useMemo(() => {
    const map: Record<number, AlertItem[]> = {}
    config.widgets.forEach((w, idx) => {
      if (w.type === 'alerts_panel' && w.alertTypes) {
        map[idx] = computeAlerts(w.alertTypes, products, allOrders)
      }
    })
    return map
  }, [config.widgets, products, allOrders])

  const recentOrders = useMemo(
    () =>
      [...allOrders]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10),
    [allOrders],
  )

  // Render a single widget by config entry
  const renderWidget = (widget: ActivityDashboardConfig['widgets'][number], idx: number) => {
    switch (widget.type) {
      case 'category_breakdown':
        return (
          <CategoryBreakdown
            key={`widget-${idx}`}
            data={categoryData}
            title={labels.categoryBreakdown}
            currencyCode={currencyCode}
          />
        )
      case 'peak_hours':
        return (
          <PeakHoursWidget
            key={`widget-${idx}`}
            data={peakHoursData}
            title={labels.peakHours}
            currencyCode={currencyCode}
          />
        )
      case 'alerts_panel':
        return (
          <AlertsPanel
            key={`widget-${idx}`}
            alerts={alertsMap[idx] ?? []}
            title={labels.alerts}
          />
        )
      case 'contract_shortcuts':
        return (
          <ContractShortcuts
            key={`widget-${idx}`}
            templates={contractTemplates}
            title={labels.contracts}
            onSelectTemplate={onSelectContract}
          />
        )
      case 'recent_items':
        return null // rendered separately below the grid
      default:
        return null
    }
  }

  // Filter out recent_items from the grid (rendered full-width below)
  const gridWidgets = config.widgets.filter(w => w.type !== 'recent_items')

  return (
    <div>
      {/* Widget grid: 1 column on mobile, 2 columns on tablet/desktop */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: rv('1fr', 'repeat(2, 1fr)', 'repeat(2, 1fr)'),
          gap: rv(16, 20, 20),
        }}
      >
        {gridWidgets.map((widget, idx) => renderWidget(widget, idx))}
      </div>

      {/* Recent orders table: full width */}
      <div style={{ marginTop: 20 }}>
        <RecentItemsTable
          orders={recentOrders}
          title={labels.recentOrders}
          onViewAll={() => onNavigate('orders')}
          viewAllLabel={labels.viewAll}
          currencyCode={currencyCode}
          labels={{
            orderId: labels.orderId,
            dateTime: labels.dateTime,
            articles: labels.articles,
            total: labels.total,
            paymentMethod: labels.paymentMethod,
            status: labels.status,
          }}
          paymentLabels={paymentLabels}
          statusLabels={statusLabels}
        />
      </div>
    </div>
  )
}

export default WidgetRenderer
