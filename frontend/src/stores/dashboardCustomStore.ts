/**
 * Dashboard Customization Store
 * Persists user's custom widget layout and preferences
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Widget types ──────────────────────────────────────────────────
export type WidgetType =
  | 'stat_card'
  | 'revenue_chart'
  | 'sales_trend'
  | 'category_breakdown'
  | 'peak_hours'
  | 'recent_orders'
  | 'ai_insights'
  | 'heatmap'
  | 'top_products'
  | 'payment_breakdown'
  | 'alerts'
  | 'expiry_alerts'
  | 'quick_actions'
  | 'employee_performance'
  | 'funnel'
  | 'inventory_value'
  | 'anomaly_summary'
  | 'forecast_summary'

export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  width: 'full' | 'half' | 'third'  // grid span
  visible: boolean
  order: number
  config?: Record<string, unknown>    // widget-specific config
}

export interface DashboardLayout {
  storeId: string
  userId: string
  widgets: DashboardWidget[]
  updatedAt: string
}

// ── Default widgets per layout ────────────────────────────────────
function defaultWidgets(): DashboardWidget[] {
  return [
    { id: 'w_stats', type: 'stat_card', title: 'Key Metrics', width: 'full', visible: true, order: 0 },
    { id: 'w_ai', type: 'ai_insights', title: 'AI Insights', width: 'full', visible: true, order: 1 },
    { id: 'w_quickactions', type: 'quick_actions', title: 'Quick Actions', width: 'full', visible: true, order: 2 },
    { id: 'w_revenue', type: 'revenue_chart', title: 'Revenue Chart', width: 'half', visible: true, order: 3 },
    { id: 'w_category', type: 'category_breakdown', title: 'Category Breakdown', width: 'half', visible: true, order: 4 },
    { id: 'w_heatmap', type: 'heatmap', title: 'Sales Heatmap', width: 'half', visible: true, order: 5 },
    { id: 'w_peakhours', type: 'peak_hours', title: 'Peak Hours', width: 'half', visible: true, order: 6 },
    { id: 'w_topproducts', type: 'top_products', title: 'Top Products', width: 'half', visible: true, order: 7 },
    { id: 'w_payments', type: 'payment_breakdown', title: 'Payment Methods', width: 'half', visible: true, order: 8 },
    { id: 'w_alerts', type: 'alerts', title: 'Alerts', width: 'half', visible: true, order: 9 },
    { id: 'w_recentorders', type: 'recent_orders', title: 'Recent Orders', width: 'full', visible: true, order: 10 },
  ]
}

// ── Store ─────────────────────────────────────────────────────────
interface DashboardCustomState {
  layouts: Record<string, DashboardLayout>  // key = storeId:userId
  getLayout: (storeId: string, userId: string) => DashboardLayout
  updateWidgetOrder: (storeId: string, userId: string, widgetId: string, newOrder: number) => void
  toggleWidgetVisibility: (storeId: string, userId: string, widgetId: string) => void
  updateWidgetWidth: (storeId: string, userId: string, widgetId: string, width: 'full' | 'half' | 'third') => void
  resetLayout: (storeId: string, userId: string) => void
  moveWidget: (storeId: string, userId: string, widgetId: string, direction: 'up' | 'down') => void
}

const layoutKey = (storeId: string, userId: string) => `${storeId}:${userId}`

export const useDashboardCustomStore = create<DashboardCustomState>()(
  persist(
    (set, get) => ({
      layouts: {},

      getLayout: (storeId, userId) => {
        const key = layoutKey(storeId, userId)
        const existing = get().layouts[key]
        if (existing) return existing
        const layout: DashboardLayout = {
          storeId,
          userId,
          widgets: defaultWidgets(),
          updatedAt: new Date().toISOString(),
        }
        set(state => ({
          layouts: { ...state.layouts, [key]: layout },
        }))
        return layout
      },

      toggleWidgetVisibility: (storeId, userId, widgetId) => {
        const key = layoutKey(storeId, userId)
        set(state => {
          const layout = state.layouts[key] || { storeId, userId, widgets: defaultWidgets(), updatedAt: '' }
          const widgets = layout.widgets.map(w =>
            w.id === widgetId ? { ...w, visible: !w.visible } : w
          )
          return {
            layouts: {
              ...state.layouts,
              [key]: { ...layout, widgets, updatedAt: new Date().toISOString() },
            },
          }
        })
      },

      updateWidgetOrder: (storeId, userId, widgetId, newOrder) => {
        const key = layoutKey(storeId, userId)
        set(state => {
          const layout = state.layouts[key] || { storeId, userId, widgets: defaultWidgets(), updatedAt: '' }
          const widgets = layout.widgets.map(w =>
            w.id === widgetId ? { ...w, order: newOrder } : w
          )
          return {
            layouts: {
              ...state.layouts,
              [key]: { ...layout, widgets, updatedAt: new Date().toISOString() },
            },
          }
        })
      },

      updateWidgetWidth: (storeId, userId, widgetId, width) => {
        const key = layoutKey(storeId, userId)
        set(state => {
          const layout = state.layouts[key] || { storeId, userId, widgets: defaultWidgets(), updatedAt: '' }
          const widgets = layout.widgets.map(w =>
            w.id === widgetId ? { ...w, width } : w
          )
          return {
            layouts: {
              ...state.layouts,
              [key]: { ...layout, widgets, updatedAt: new Date().toISOString() },
            },
          }
        })
      },

      moveWidget: (storeId, userId, widgetId, direction) => {
        const key = layoutKey(storeId, userId)
        set(state => {
          const layout = state.layouts[key] || { storeId, userId, widgets: defaultWidgets(), updatedAt: '' }
          const sorted = [...layout.widgets].sort((a, b) => a.order - b.order)
          const idx = sorted.findIndex(w => w.id === widgetId)
          if (idx < 0) return state

          const swapIdx = direction === 'up' ? idx - 1 : idx + 1
          if (swapIdx < 0 || swapIdx >= sorted.length) return state

          // Swap orders
          const tempOrder = sorted[idx].order
          sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order }
          sorted[swapIdx] = { ...sorted[swapIdx], order: tempOrder }

          return {
            layouts: {
              ...state.layouts,
              [key]: { ...layout, widgets: sorted, updatedAt: new Date().toISOString() },
            },
          }
        })
      },

      resetLayout: (storeId, userId) => {
        const key = layoutKey(storeId, userId)
        set(state => ({
          layouts: {
            ...state.layouts,
            [key]: {
              storeId,
              userId,
              widgets: defaultWidgets(),
              updatedAt: new Date().toISOString(),
            },
          },
        }))
      },
    }),
    {
      name: 'pos-dashboard-custom',
    }
  )
)
