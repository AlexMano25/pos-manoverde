import React, { useState, useEffect, useMemo } from 'react'
import {
  Search, ShoppingCart, Minus, Plus, X, Banknote, CreditCard,
  Smartphone, ArrowRightLeft, ChevronLeft, Grid3X3, Users,
  CheckCircle2,
} from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import { useTableStore } from '../stores/tableStore'
import { useOrderStore } from '../stores/orderStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import PaymentModal from '../components/pos/PaymentModal'
import { formatCurrency } from '../utils/currency'
import type { PaymentMethod, RestaurantTable, TableStatus } from '../types'

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
} as const

const STATUS_COLORS: Record<TableStatus, string> = {
  free: C.success,
  occupied: C.danger,
  reserved: C.warning,
  bill_requested: C.blue,
}

type WaiterStep = 'tables' | 'order' | 'payment'

// ── Component ──────────────────────────────────────────────────────────────

export default function WaiterPOSPage() {
  const { currentStore } = useAppStore()
  const { products, categories, loadProducts } = useProductStore()
  const { items, addItem, updateQty, removeItem, clear, getTotal } = useCartStore()
  const { tables, loadTables, setTableStatus } = useTableStore()
  const { createOrder } = useOrderStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  const currencyCode = currentStore?.currency || 'XAF'
  const storeId = currentStore?.id || ''

  const [step, setStep] = useState<WaiterStep>('tables')
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  useEffect(() => {
    if (storeId) {
      loadProducts(storeId)
      loadTables(storeId)
    }
  }, [storeId, loadProducts, loadTables])

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

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table)
    clear()
    setStep('order')
  }

  const handleBackToTables = () => {
    setStep('tables')
    setSelectedTable(null)
    clear()
    setSearchQuery('')
    setSelectedCategory(null)
  }

  const handleProceedToPayment = () => {
    if (items.length === 0) return
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async (paymentMethod: PaymentMethod) => {
    if (!user || !storeId || !selectedTable) return

    try {
      const order = await createOrder(items, paymentMethod, user.id, storeId)

      // Free the table after payment
      await setTableStatus(selectedTable.id, 'free')

      setShowPaymentModal(false)
      setOrderSuccess(true)
      clear()

      setTimeout(() => {
        setOrderSuccess(false)
        handleBackToTables()
      }, 2000)
    } catch (err) {
      console.error('Order creation failed:', err)
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: C.bg,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    backgroundColor: C.primary,
    color: '#fff',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  }

  const backBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: 8,
    padding: '6px 10px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    fontWeight: 500,
  }

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: rv(12, 16, 20),
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(3, 1fr)', 'repeat(4, 1fr)'),
    gap: rv(10, 12, 14),
  }

  const tableCardStyle = (status: TableStatus): React.CSSProperties => ({
    backgroundColor: C.card,
    borderRadius: 12,
    border: `2px solid ${STATUS_COLORS[status]}60`,
    padding: rv(14, 16, 18),
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'transform 0.15s',
  })

  const productCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    padding: rv(10, 12, 14),
    cursor: 'pointer',
    transition: 'transform 0.1s',
  }

  const searchStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  }

  const searchInputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 150,
    padding: '10px 12px 10px 36px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: C.card,
  }

  const categoryChipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: 'none',
    backgroundColor: active ? C.primary : C.card,
    color: active ? '#fff' : C.text,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  })

  const footerStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderTop: `1px solid ${C.border}`,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  }

  const payBtnStyle: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: items.length > 0 ? C.success : C.textSecondary,
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: items.length > 0 ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const getStatusLabel = (status: TableStatus): string => {
    const map: Record<TableStatus, string> = {
      free: t.tables.free,
      occupied: t.tables.occupied,
      reserved: t.tables.reserved,
      bill_requested: t.tables.billRequested,
    }
    return map[status]
  }

  // ── Order success overlay ─────────────────────────────────────────────

  if (orderSuccess) {
    return (
      <div style={{
        ...pageStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.success,
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <CheckCircle2 size={64} />
          <h2 style={{ margin: '16px 0 0', fontSize: 22 }}>{t.pos.orderSuccess}</h2>
          <p style={{ margin: '8px 0 0', fontSize: 15, opacity: 0.9 }}>{t.pos.orderCreated}</p>
        </div>
      </div>
    )
  }

  // ── Step 1: Table selection ────────────────────────────────────────────

  if (step === 'tables') {
    const freeTables = tables.filter(t => t.status === 'free')
    const occupiedTables = tables.filter(t => t.status !== 'free')

    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <Grid3X3 size={22} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{t.tables.selectTable}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {currentStore?.name || 'POS'} · {tables.length} tables
            </div>
          </div>
        </div>

        <div style={contentStyle}>
          {/* Free tables first */}
          {freeTables.length > 0 && (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.success, margin: '0 0 10px' }}>
                {t.tables.freeCount} ({freeTables.length})
              </p>
              <div style={{ ...gridStyle, marginBottom: 20 }}>
                {freeTables.map(table => (
                  <div
                    key={table.id}
                    style={tableCardStyle(table.status)}
                    onClick={() => handleSelectTable(table)}
                  >
                    <p style={{ fontSize: rv(22, 26, 28), fontWeight: 700, color: C.text, margin: 0 }}>
                      #{table.number}
                    </p>
                    <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 6px' }}>{table.name}</p>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 8px', borderRadius: 6,
                      backgroundColor: C.success + '15', fontSize: 11, color: C.success,
                    }}>
                      {t.tables.free}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textSecondary, marginTop: 6, justifyContent: 'center' }}>
                      <Users size={12} /> {table.capacity}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Occupied / reserved tables */}
          {occupiedTables.length > 0 && (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, margin: '0 0 10px' }}>
                {t.tables.occupiedCount} ({occupiedTables.length})
              </p>
              <div style={gridStyle}>
                {occupiedTables.map(table => (
                  <div
                    key={table.id}
                    style={{ ...tableCardStyle(table.status), opacity: 0.6 }}
                  >
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
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.textSecondary }}>
              <Grid3X3 size={48} strokeWidth={1.5} />
              <p style={{ margin: '12px 0 0', fontSize: 14 }}>{t.tables.noTables}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Step 2: Order taking ──────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header with table info */}
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={handleBackToTables}>
          <ChevronLeft size={16} /> {t.common.back}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {selectedTable?.name || 'Table'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            #{selectedTable?.number} · {selectedTable?.capacity} {t.tables.capacity.toLowerCase()}
          </div>
        </div>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 600,
        }}>
          <ShoppingCart size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {items.length} · {formatCurrency(getTotal(), currencyCode)}
        </div>
      </div>

      {/* Search + categories */}
      <div style={{ padding: '12px 16px 0', backgroundColor: C.card, flexShrink: 0 }}>
        <div style={searchStyle}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary }} />
            <input
              style={searchInputStyle}
              placeholder={t.pos.searchProducts}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10 }}>
          <button style={categoryChipStyle(!selectedCategory)} onClick={() => setSelectedCategory(null)}>
            {t.common.all}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              style={categoryChipStyle(selectedCategory === cat)}
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
              <div
                key={product.id}
                style={{
                  ...productCardStyle,
                  borderColor: inCart ? C.primary : C.border,
                  borderWidth: inCart ? 2 : 1,
                }}
                onClick={() => addItem({
                  product_id: product.id,
                  name: product.name,
                  price: product.price,
                  qty: 1,
                })}
              >
                <p style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  margin: '0 0 4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {product.name}
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.primary, margin: 0 }}>
                  {formatCurrency(product.price, currencyCode)}
                </p>
                {inCart && (
                  <div style={{
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    justifyContent: 'center',
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
                        width: 28, height: 28, borderRadius: 6,
                        border: 'none', backgroundColor: C.primary, color: '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    ><Plus size={14} /></button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer with cart summary + pay button */}
      <div style={footerStyle}>
        <div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>{t.pos.items}: {items.reduce((s, i) => s + i.qty, 0)}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
            {formatCurrency(getTotal(), currencyCode)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {items.length > 0 && (
            <button
              onClick={() => clear()}
              style={{
                padding: '10px 14px', borderRadius: 8,
                border: `1px solid ${C.danger}30`, backgroundColor: C.danger + '08',
                color: C.danger, cursor: 'pointer', fontSize: 13,
              }}
            >
              <X size={14} />
            </button>
          )}
          <button style={payBtnStyle} onClick={handleProceedToPayment} disabled={items.length === 0}>
            <Banknote size={18} />
            {t.pos.confirmPayment}
          </button>
        </div>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <PaymentModal
          total={getTotal()}
          currencyCode={currencyCode}
          onConfirm={handlePaymentConfirm}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  )
}
