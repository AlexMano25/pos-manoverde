import React, { useState, useEffect, useMemo } from 'react'
import {
  Search, ShoppingCart, Minus, Plus, X, Banknote, Send,
  ChevronLeft, Grid3X3, User, Users, Clock, ClipboardList,
  CheckCircle2,
} from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import { useTableStore } from '../stores/tableStore'
import { useOrderStore } from '../stores/orderStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useCustomerStore } from '../stores/customerStore'
import { usePromotionStore } from '../stores/promotionStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { PaymentMethod, RestaurantTable, TableStatus, Order } from '../types'

// ── Colors ─────────────────────────────────────────────────────────────────

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
  blue: '#3b82f6',
  orange: '#f97316',
} as const

const STATUS_COLORS: Record<TableStatus, string> = {
  free: C.success,
  occupied: C.danger,
  reserved: C.warning,
  bill_requested: C.blue,
  food_ready: '#22c55e',
}

type IdentifyMode = 'table' | 'customer'
type ServerStep = 'identify' | 'order'

// Activities that support tables
const TABLE_ACTIVITIES = ['restaurant', 'bar', 'bakery', 'hotel', 'cafe', 'nightclub']

// ── Component ──────────────────────────────────────────────────────────────

export default function ServerOrderPage() {
  const { currentStore, activity } = useAppStore()
  const { products, categories, loadProducts } = useProductStore()
  const { items, addItem, updateQty, clear, getTotal } = useCartStore()
  const { tables, loadTables, setTableStatus } = useTableStore()
  const { createOrder, orders, loadOrders, updateOrderStatus } = useOrderStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()
  const { recordVisit } = useCustomerStore()
  const selectedCustomer = useCustomerStore(s => s.selectedCustomer)
  const { calculateTotalDiscount, loadPromotions } = usePromotionStore()
  const { rv } = useResponsive()

  const currencyCode = currentStore?.currency || 'XAF'
  const storeId = currentStore?.id || ''
  const hasTableSupport = TABLE_ACTIVITIES.includes(activity || '')

  const [step, setStep] = useState<ServerStep>('identify')
  const [identifyMode, setIdentifyMode] = useState<IdentifyMode>(hasTableSupport ? 'table' : 'customer')
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPendingPanel, setShowPendingPanel] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<'sent' | 'paid' | null>(null)

  // Fallback labels
  const so = (t as any).serverOrder || {}
  const lbl = {
    title: so.title || 'Prise de commande',
    byTable: so.byTable || 'Par table',
    byCustomer: so.byCustomer || 'Par client',
    customerName: so.customerName || 'Nom du client',
    enterCustomerName: so.enterCustomerName || 'Entrez le nom du client...',
    startOrder: so.startOrder || 'Commencer la commande',
    sendOrder: so.sendOrder || 'Envoyer',
    payNow: so.payNow || 'Payer',
    pendingOrders: so.pendingOrders || 'Commandes en cours',
    noPendingOrders: so.noPendingOrders || 'Aucune commande en cours',
    orderSent: so.orderSent || 'Commande envoyee !',
    orderSentDesc: so.orderSentDesc || 'La commande a ete transmise.',
    orderPaid: so.orderPaid || 'Paiement confirme !',
    quickOrder: so.quickOrder || 'Commande rapide',
    markAsPaid: so.markAsPaid || 'Encaisser',
    items: so.itemsLabel || t.pos?.items || 'articles',
    pending: so.pendingLabel || 'En attente',
    tableLabel: so.tableLabel || 'Table',
  }

  // Always reload data on mount (ensures newly created tables/products appear)
  useEffect(() => {
    if (storeId) {
      loadProducts(storeId)
      loadOrders(storeId)
      loadPromotions(storeId)
      if (hasTableSupport) loadTables(storeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.is_active && p.stock > 0)
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q))
    }
    return result
  }, [products, selectedCategory, searchQuery])

  // Pending orders for current store
  const pendingOrders = useMemo(() =>
    orders.filter(o => o.status === 'pending' && o.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)),
    [orders]
  )

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table)
    clear()
    setStep('order')
  }

  const handleStartCustomerOrder = () => {
    if (!customerName.trim()) return
    clear()
    setStep('order')
  }

  const handleBackToIdentify = () => {
    setStep('identify')
    setSelectedTable(null)
    setCustomerName('')
    clear()
    setSearchQuery('')
    setSelectedCategory(null)
  }

  const handleSendOrder = async () => {
    if (items.length === 0 || !user || !storeId) return

    try {
      // Calculate promotion discount
      const promoResult = calculateTotalDiscount(items, storeId)
      const promoDiscount = promoResult.total
      const promoNames = promoResult.applied.map(a => a.promotion.name)

      const order = await createOrder(items, 'cash', user.id, storeId, {
        table_id: selectedTable?.id,
        table_name: selectedTable ? `${lbl.tableLabel} #${selectedTable.number}` : undefined,
        customer_name: identifyMode === 'customer' ? customerName : undefined,
        status: 'pending',
        promotion_discount: promoDiscount > 0 ? promoDiscount : undefined,
        promotion_names: promoNames.length > 0 ? promoNames : undefined,
      })

      // Set table to occupied right after order creation (same try block)
      if (selectedTable) {
        await setTableStatus(selectedTable.id, 'occupied')
      }

      // Record customer visit if a customer is selected
      if (selectedCustomer) {
        recordVisit(selectedCustomer.id, order.total).catch(() => {})
      }

      clear()
      setOrderSuccess('sent')
      setTimeout(() => {
        setOrderSuccess(null)
        handleBackToIdentify()
      }, 2000)
    } catch (err) {
      console.error('Failed to send order:', err)
    }
  }

  const handlePaymentConfirm = async (paymentMethod: PaymentMethod) => {
    if (!user || !storeId) return

    try {
      // Calculate promotion discount
      const promoResult = calculateTotalDiscount(items, storeId)
      const promoDiscount = promoResult.total
      const promoNames = promoResult.applied.map(a => a.promotion.name)

      const order = await createOrder(items, paymentMethod, user.id, storeId, {
        table_id: selectedTable?.id,
        table_name: selectedTable ? `${lbl.tableLabel} #${selectedTable.number}` : undefined,
        customer_name: identifyMode === 'customer' ? customerName : undefined,
        promotion_discount: promoDiscount > 0 ? promoDiscount : undefined,
        promotion_names: promoNames.length > 0 ? promoNames : undefined,
      })

      // Free the table right after order creation (same try block)
      if (selectedTable) {
        await setTableStatus(selectedTable.id, 'free')
      }

      // Record customer visit if a customer is selected
      if (selectedCustomer) {
        recordVisit(selectedCustomer.id, order.total).catch(() => {})
      }

      setShowPaymentModal(false)
      clear()
      setOrderSuccess('paid')
      setTimeout(() => {
        setOrderSuccess(null)
        handleBackToIdentify()
      }, 2000)
    } catch (err) {
      console.error('Payment failed:', err)
    }
  }

  const handlePayPendingOrder = async (order: Order, paymentMethod: PaymentMethod) => {
    try {
      await updateOrderStatus(order.id, 'paid', paymentMethod)
      if (order.table_id) {
        const table = tables.find(t => t.id === order.table_id)
        if (table) await setTableStatus(table.id, 'free')
      }
    } catch (err) {
      console.error('Failed to pay order:', err)
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', height: '100vh',
    backgroundColor: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    backgroundColor: C.primary, color: '#fff', padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
  }

  const backBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
    padding: '6px 10px', color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500,
  }

  const contentStyle: React.CSSProperties = {
    flex: 1, overflow: 'auto', padding: rv(12, 16, 20),
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(3, 1fr)', 'repeat(4, 1fr)'),
    gap: rv(10, 12, 14),
  }

  const modeTabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '12px 16px', border: 'none', borderRadius: 10,
    backgroundColor: active ? C.primary : C.card,
    color: active ? '#fff' : C.text,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.2s',
  })

  const tableCardStyle = (status: TableStatus): React.CSSProperties => ({
    backgroundColor: C.card, borderRadius: 12,
    border: `2px solid ${STATUS_COLORS[status]}60`,
    padding: rv(14, 16, 18), cursor: status === 'free' ? 'pointer' : 'default',
    textAlign: 'center', transition: 'transform 0.15s',
    opacity: status === 'free' ? 1 : 0.5,
  })

  const productCardStyle = (inCart: boolean): React.CSSProperties => ({
    backgroundColor: C.card, borderRadius: 10,
    border: `${inCart ? 2 : 1}px solid ${inCart ? C.primary : C.border}`,
    padding: rv(10, 12, 14), cursor: 'pointer', transition: 'transform 0.1s',
  })

  const footerStyle: React.CSSProperties = {
    backgroundColor: C.card, borderTop: `1px solid ${C.border}`,
    padding: '12px 16px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexShrink: 0,
  }

  const pendingBadgeStyle: React.CSSProperties = {
    position: 'fixed', bottom: 80, right: 16,
    backgroundColor: C.orange, color: '#fff', borderRadius: 16,
    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }

  const getStatusLabel = (status: TableStatus): string => {
    const map: Record<TableStatus, string> = {
      free: t.tables?.free || 'Free',
      occupied: t.tables?.occupied || 'Occupied',
      reserved: t.tables?.reserved || 'Reserved',
      bill_requested: t.tables?.billRequested || 'Bill',
      food_ready: (t.tables as any)?.foodReady || 'Prêt à servir',
    }
    return map[status]
  }

  // ── Order success overlay ───────────────────────────────────────────────

  if (orderSuccess) {
    return (
      <div style={{
        ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: orderSuccess === 'paid' ? C.success : C.primary,
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <CheckCircle2 size={64} />
          <h2 style={{ margin: '16px 0 0', fontSize: 22 }}>
            {orderSuccess === 'paid' ? lbl.orderPaid : lbl.orderSent}
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 15, opacity: 0.9 }}>
            {lbl.orderSentDesc}
          </p>
        </div>
      </div>
    )
  }

  // ── Pending orders panel overlay ────────────────────────────────────────

  const renderPendingPanel = () => {
    if (!showPendingPanel) return null
    return (
      <div style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      }} onClick={() => setShowPendingPanel(false)}>
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: rv('85%', '400px', '420px'),
          backgroundColor: C.card, padding: 20, overflow: 'auto',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: C.text }}>{lbl.pendingOrders}</h3>
            <button onClick={() => setShowPendingPanel(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary,
            }}><X size={20} /></button>
          </div>

          {pendingOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.textSecondary }}>
              <ClipboardList size={40} strokeWidth={1.5} />
              <p style={{ margin: '12px 0 0', fontSize: 14 }}>{lbl.noPendingOrders}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingOrders.map(order => (
                <div key={order.id} style={{
                  padding: 14, borderRadius: 10, border: `1px solid ${C.border}`,
                  backgroundColor: C.bg,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {order.table_name || order.customer_name || `#${order.receipt_number || order.id.slice(0, 8)}`}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                        <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{order.items.reduce((s, i) => s + i.qty, 0)} {lbl.items}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>
                      {formatCurrency(order.total, currencyCode)}
                    </div>
                  </div>
                  {/* Items list */}
                  <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>
                    {order.items.map((item, i) => (
                      <span key={i}>{i > 0 ? ', ' : ''}{item.qty}x {item.name}</span>
                    ))}
                  </div>
                  {/* Pay buttons */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(['cash', 'momo', 'carte_bancaire'] as PaymentMethod[]).map(method => (
                      <button key={method} onClick={() => handlePayPendingOrder(order, method)} style={{
                        flex: 1, minWidth: 80, padding: '8px 10px', borderRadius: 8,
                        border: `1px solid ${C.border}`, backgroundColor: C.card,
                        cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.text,
                        textAlign: 'center',
                      }}>
                        {method === 'cash' ? `💵 ${t.pos?.cash || 'Cash'}` :
                         method === 'momo' ? `📱 MoMo` :
                         `💳 ${t.pos?.carteBancaire || 'CB'}`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Step 1: Order identification ────────────────────────────────────────

  if (step === 'identify') {
    const freeTables = tables.filter(t => t.status === 'free')
    const occupiedTables = tables.filter(t => t.status !== 'free')

    return (
      <div style={pageStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <ClipboardList size={22} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{lbl.title}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {currentStore?.name || 'POS'} · {user?.name || ''}
            </div>
          </div>
          {pendingOrders.length > 0 && (
            <button onClick={() => setShowPendingPanel(true)} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
              padding: '6px 12px', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}>
              <Clock size={14} />
              {pendingOrders.length}
            </button>
          )}
        </div>

        <div style={contentStyle}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {hasTableSupport && (
              <button style={modeTabStyle(identifyMode === 'table')} onClick={() => setIdentifyMode('table')}>
                <Grid3X3 size={18} /> {lbl.byTable}
              </button>
            )}
            <button style={modeTabStyle(identifyMode === 'customer')} onClick={() => setIdentifyMode('customer')}>
              <User size={18} /> {lbl.byCustomer}
            </button>
          </div>

          {/* Table mode */}
          {identifyMode === 'table' && hasTableSupport && (
            <>
              {freeTables.length > 0 && (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.success, margin: '0 0 10px' }}>
                    {t.tables?.freeCount || 'Available'} ({freeTables.length})
                  </p>
                  <div style={{ ...gridStyle, marginBottom: 20 }}>
                    {freeTables.map(table => (
                      <div key={table.id} style={tableCardStyle(table.status)} onClick={() => handleSelectTable(table)}>
                        <p style={{ fontSize: rv(22, 26, 28), fontWeight: 700, color: C.text, margin: 0 }}>
                          #{table.number}
                        </p>
                        <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 6px' }}>{table.name}</p>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 8px', borderRadius: 6,
                          backgroundColor: C.success + '15', fontSize: 11, color: C.success,
                        }}>
                          {getStatusLabel('free')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textSecondary, marginTop: 6, justifyContent: 'center' }}>
                          <Users size={12} /> {table.capacity}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {occupiedTables.length > 0 && (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, margin: '0 0 10px' }}>
                    {t.tables?.occupiedCount || 'Occupied'} ({occupiedTables.length})
                  </p>
                  <div style={gridStyle}>
                    {occupiedTables.map(table => (
                      <div key={table.id} style={tableCardStyle(table.status)}>
                        <p style={{ fontSize: rv(22, 26, 28), fontWeight: 700, color: C.text, margin: 0 }}>
                          #{table.number}
                        </p>
                        <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 6px' }}>{table.name}</p>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 8px', borderRadius: 6,
                          backgroundColor: STATUS_COLORS[table.status] + '15',
                          fontSize: 11, color: STATUS_COLORS[table.status],
                        }}>
                          {getStatusLabel(table.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tables.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.textSecondary }}>
                  <Grid3X3 size={48} strokeWidth={1.5} />
                  <p style={{ margin: '12px 0 0', fontSize: 14 }}>{t.tables?.noTables || 'No tables configured'}</p>
                </div>
              )}
            </>
          )}

          {/* Customer name mode */}
          {identifyMode === 'customer' && (
            <div style={{ maxWidth: 400, margin: '0 auto' }}>
              <div style={{
                padding: 20, backgroundColor: C.card, borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>
                  {lbl.customerName}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <User size={18} color={C.textSecondary} />
                  <input
                    style={{
                      flex: 1, padding: '12px 14px', borderRadius: 10,
                      border: `2px solid ${customerName.trim() ? C.primary : C.border}`,
                      fontSize: 16, fontWeight: 500, color: C.text, outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    placeholder={lbl.enterCustomerName}
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleStartCustomerOrder()}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleStartCustomerOrder}
                  disabled={!customerName.trim()}
                  style={{
                    width: '100%', padding: '14px 20px', borderRadius: 10,
                    border: 'none', fontSize: 15, fontWeight: 600,
                    backgroundColor: customerName.trim() ? C.primary : C.border,
                    color: customerName.trim() ? '#fff' : C.textSecondary,
                    cursor: customerName.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <ShoppingCart size={18} />
                  {lbl.startOrder}
                </button>
              </div>
            </div>
          )}

          {/* Pending orders summary on identify page */}
          {pendingOrders.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.orange, margin: 0 }}>
                  {lbl.pendingOrders} ({pendingOrders.length})
                </p>
                <button onClick={() => setShowPendingPanel(true)} style={{
                  background: 'none', border: 'none', color: C.primary,
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}>
                  {t.common?.viewAll || 'View all'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingOrders.slice(0, 3).map(order => (
                  <div key={order.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10, backgroundColor: C.card,
                    border: `1px solid ${C.orange}30`,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                        {order.table_name || order.customer_name || `#${order.receipt_number || order.id.slice(0, 8)}`}
                      </div>
                      <div style={{ fontSize: 11, color: C.textSecondary }}>
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{order.items.reduce((s, i) => s + i.qty, 0)} {lbl.items}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.orange }}>
                      {formatCurrency(order.total, currencyCode)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {renderPendingPanel()}
      </div>
    )
  }

  // ── Step 2: Order taking ────────────────────────────────────────────────

  const orderLabel = selectedTable
    ? `${selectedTable.name || lbl.tableLabel + ' #' + selectedTable.number}`
    : customerName

  return (
    <div style={pageStyle}>
      {/* Header with order info */}
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={handleBackToIdentify}>
          <ChevronLeft size={16} /> {t.common?.back || 'Back'}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{orderLabel}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {selectedTable
              ? `#${selectedTable.number} · ${selectedTable.capacity} ${(t.tables?.capacity || 'places').toLowerCase()}`
              : lbl.byCustomer
            }
          </div>
        </div>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
          padding: '6px 12px', fontSize: 13, fontWeight: 600,
        }}>
          <ShoppingCart size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {items.length} · {formatCurrency(getTotal(), currencyCode)}
        </div>
      </div>

      {/* Search + categories */}
      <div style={{ padding: '12px 16px 0', backgroundColor: C.card, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary }} />
            <input
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                border: `1px solid ${C.border}`, fontSize: 14, color: C.text,
                outline: 'none', boxSizing: 'border-box', backgroundColor: C.card,
              }}
              placeholder={t.pos?.searchProducts || 'Search...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10 }}>
          <button
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none',
              backgroundColor: !selectedCategory ? C.primary : C.bg,
              color: !selectedCategory ? '#fff' : C.text,
              fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
            onClick={() => setSelectedCategory(null)}
          >
            {t.common?.all || 'All'}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                backgroundColor: selectedCategory === cat ? C.primary : C.bg,
                color: selectedCategory === cat ? '#fff' : C.text,
                fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div style={contentStyle}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(3, 1fr)', 'repeat(4, 1fr)'),
          gap: rv(8, 10, 12),
        }}>
          {filteredProducts.map(product => {
            const inCart = items.find(i => i.product_id === product.id)
            return (
              <div key={product.id} style={productCardStyle(!!inCart)} onClick={() => addItem(product)}>
                <p style={{
                  fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 4px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {product.name}
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.primary, margin: 0 }}>
                  {formatCurrency(product.price, currencyCode)}
                </p>
                {inCart && (
                  <div style={{
                    marginTop: 6, display: 'flex', alignItems: 'center',
                    gap: 8, justifyContent: 'center',
                  }}>
                    <button
                      onClick={e => { e.stopPropagation(); updateQty(product.id, Math.max(0, inCart.qty - 1)) }}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: `1px solid ${C.border}`, backgroundColor: C.card,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    ><Minus size={14} /></button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text, minWidth: 20, textAlign: 'center' }}>
                      {inCart.qty}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); updateQty(product.id, inCart.qty + 1) }}
                      style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        backgroundColor: C.primary, color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    ><Plus size={14} /></button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer with actions */}
      <div style={footerStyle}>
        <div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>
            {items.reduce((s, i) => s + i.qty, 0)} {lbl.items}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
            {formatCurrency(getTotal(), currencyCode)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {items.length > 0 && (
            <button onClick={() => clear()} style={{
              padding: '10px 14px', borderRadius: 8,
              border: `1px solid ${C.danger}30`, backgroundColor: C.danger + '08',
              color: C.danger, cursor: 'pointer', fontSize: 13,
            }}>
              <X size={14} />
            </button>
          )}
          {/* Send order (pending) */}
          <button
            onClick={handleSendOrder}
            disabled={items.length === 0}
            style={{
              padding: '12px 20px', borderRadius: 10, border: 'none',
              backgroundColor: items.length > 0 ? C.orange : C.border,
              color: items.length > 0 ? '#fff' : C.textSecondary,
              cursor: items.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Send size={16} />
            {lbl.sendOrder}
          </button>
          {/* Pay now (if authorized: admin, manager, cashier) */}
          {user && ['admin', 'manager', 'cashier'].includes(user.role) && (
            <button
              onClick={() => items.length > 0 && setShowPaymentModal(true)}
              disabled={items.length === 0}
              style={{
                padding: '12px 20px', borderRadius: 10, border: 'none',
                backgroundColor: items.length > 0 ? C.success : C.border,
                color: items.length > 0 ? '#fff' : C.textSecondary,
                cursor: items.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Banknote size={16} />
              {lbl.payNow}
            </button>
          )}
        </div>
      </div>

      {/* Pending orders floating badge */}
      {pendingOrders.length > 0 && (
        <div style={pendingBadgeStyle} onClick={() => setShowPendingPanel(true)}>
          <Clock size={16} />
          {pendingOrders.length} {lbl.pending}
        </div>
      )}

      {/* Payment modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowPaymentModal(false)}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 16, padding: 24,
            width: '90%', maxWidth: 380,
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: C.text }}>
              {t.pos?.confirmPayment || 'Confirm Payment'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: C.primary }}>
              {formatCurrency(getTotal(), currencyCode)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['cash', 'card', 'momo', 'mtn_money', 'orange_money', 'transfer'] as PaymentMethod[]).map(method => {
                const labels: Record<string, string> = {
                  cash: `💵 ${t.pos?.cash || 'Cash'}`,
                  card: `💳 ${t.pos?.carteBancaire || 'Card'}`,
                  momo: `📱 Mobile Money`,
                  mtn_money: `📱 MTN MoMo`,
                  orange_money: `📱 Orange Money`,
                  transfer: `🏦 ${t.pos?.transfer || 'Transfer'}`,
                }
                return (
                  <button key={method} onClick={() => handlePaymentConfirm(method)} style={{
                    padding: '14px 16px', borderRadius: 10, border: `1px solid ${C.border}`,
                    backgroundColor: C.card, cursor: 'pointer', fontSize: 15, fontWeight: 600,
                    color: C.text, textAlign: 'left',
                  }}>
                    {labels[method] || method}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowPaymentModal(false)} style={{
              marginTop: 12, width: '100%', padding: '10px', borderRadius: 8,
              border: 'none', backgroundColor: C.bg, color: C.textSecondary,
              cursor: 'pointer', fontSize: 14,
            }}>
              {t.common?.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {renderPendingPanel()}
    </div>
  )
}
