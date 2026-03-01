import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  ShoppingCart,
  Minus,
  Plus,
  X,
  Banknote,
  CreditCard,
  Smartphone,
  ArrowRightLeft,
  Package,
  Trash2,
} from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import PaymentModal from '../components/pos/PaymentModal'
import type { PaymentMethod, Product } from '../types'

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

// ── Component ────────────────────────────────────────────────────────────

export default function POSPage() {
  const { products, categories, loadProducts } = useProductStore()
  const { items, addItem, updateQty, removeItem, clear, getTotal } = useCartStore()
  const { currentStore } = useAppStore()
  const { t, language } = useLanguageStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash')

  // ── Locale-aware helpers ────────────────────────────────────────────────

  const intlLocale = language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : language === 'it' ? 'it-IT' : language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : 'en-US'

  function formatFCFA(amount: number): string {
    return new Intl.NumberFormat(intlLocale).format(amount) + ' FCFA'
  }

  useEffect(() => {
    if (currentStore?.id) {
      loadProducts(currentStore.id)
    }
  }, [currentStore?.id, loadProducts])

  const filteredProducts = useMemo(() => {
    let result = products
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(searchQuery))
      )
    }
    return result
  }, [products, selectedCategory, searchQuery])

  const subtotal = getTotal()
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const taxRate = currentStore?.tax_rate ?? 0
  const taxAmount = Math.round((subtotal - discountAmount) * (taxRate / 100))
  const total = subtotal - discountAmount + taxAmount

  const handlePayment = (method: PaymentMethod) => {
    if (items.length === 0) return
    setSelectedPaymentMethod(method)
    setShowPaymentModal(true)
  }

  const handleAddProduct = (product: Product) => {
    if (product.stock <= 0) return
    addItem(product)
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = { display: 'flex', height: '100%', backgroundColor: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden' }
  const leftPanelStyle: React.CSSProperties = { flex: '0 0 60%', display: 'flex', flexDirection: 'column', padding: 20, overflow: 'hidden' }
  const searchBarStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 10, padding: '0 16px', border: `1px solid ${C.border}`, marginBottom: 16 }
  const searchInputStyle: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', padding: '12px 0', fontSize: 14, color: C.text, backgroundColor: 'transparent' }
  const pillsContainerStyle: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, flexShrink: 0 }
  const pillStyle = (isActive: boolean): React.CSSProperties => ({ padding: '7px 16px', borderRadius: 20, border: `1px solid ${isActive ? C.primary : C.border}`, backgroundColor: isActive ? C.primary : C.card, color: isActive ? '#ffffff' : C.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0 })
  const gridContainerStyle: React.CSSProperties = { flex: 1, overflowY: 'auto', paddingRight: 4 }
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }
  const productCardStyle = (inStock: boolean): React.CSSProperties => ({ backgroundColor: C.card, borderRadius: 10, padding: 14, border: `1px solid ${C.border}`, cursor: inStock ? 'pointer' : 'not-allowed', opacity: inStock ? 1 : 0.4, transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 6 })
  const productNameStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
  const productPriceStyle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: C.primary, margin: 0 }
  const productStockStyle = (count: number): React.CSSProperties => ({ fontSize: 12, color: count <= 5 ? C.danger : C.textSecondary, margin: 0, fontWeight: count <= 5 ? 600 : 400 })
  const rightPanelStyle: React.CSSProperties = { flex: '0 0 40%', display: 'flex', flexDirection: 'column', backgroundColor: C.card, borderLeft: `1px solid ${C.border}`, overflow: 'hidden' }
  const cartHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }
  const cartTitleStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }
  const cartCountBadge: React.CSSProperties = { backgroundColor: C.primary, color: '#ffffff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }
  const clearBtnStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: C.danger, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: '4px 8px', borderRadius: 6 }
  const cartListStyle: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '12px 20px' }
  const cartItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` }
  const cartItemInfoStyle: React.CSSProperties = { flex: 1, minWidth: 0 }
  const cartItemNameStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
  const cartItemPriceStyle: React.CSSProperties = { fontSize: 12, color: C.textSecondary, margin: 0 }
  const qtyControlsStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 0, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }
  const qtyBtnStyle: React.CSSProperties = { width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: C.textSecondary, fontSize: 14 }
  const qtyInputStyle: React.CSSProperties = { width: 36, height: 30, textAlign: 'center', border: 'none', borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, outline: 'none', fontSize: 13, fontWeight: 600, color: C.text, backgroundColor: 'transparent' }
  const cartItemTotalStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', minWidth: 80, textAlign: 'right' }
  const removeItemBtnStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 4, borderRadius: 4, display: 'flex' }
  const cartFooterStyle: React.CSSProperties = { padding: '16px 20px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }
  const summaryRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 14, color: C.textSecondary }
  const discountInputRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }
  const discountInputStyle: React.CSSProperties = { width: 50, padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, textAlign: 'center', outline: 'none', color: C.text }
  const totalRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', fontSize: 22, fontWeight: 800, color: C.text }
  const paymentButtonsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 12 }
  const payBtnBase: React.CSSProperties = { padding: '12px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: items.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: items.length > 0 ? 1 : 0.5, transition: 'all 0.15s' }
  const payBtnPrimary: React.CSSProperties = { ...payBtnBase, backgroundColor: C.primary, color: '#ffffff', border: 'none' }
  const payBtnOutline: React.CSSProperties = { ...payBtnBase, backgroundColor: '#ffffff', color: C.text, border: `1px solid ${C.border}` }
  const emptyCartStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textSecondary, gap: 8, padding: 40 }
  const emptyGridStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, color: C.textSecondary, gap: 8 }

  return (
    <div style={pageStyle}>
      {/* ── Left Panel: Products ────────────────────────────────────── */}
      <div style={leftPanelStyle}>
        {/* Search */}
        <div style={searchBarStyle}>
          <Search size={18} color={C.textSecondary} />
          <input
            style={searchInputStyle}
            type="text"
            placeholder={t.pos.searchProducts}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 4, display: 'flex' }}
              onClick={() => setSearchQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div style={pillsContainerStyle}>
          <button
            style={pillStyle(selectedCategory === null)}
            onClick={() => setSelectedCategory(null)}
          >
            {t.common.all}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              style={pillStyle(selectedCategory === cat)}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div style={gridContainerStyle}>
          {filteredProducts.length === 0 ? (
            <div style={emptyGridStyle}>
              <Package size={40} color={C.border} />
              <p style={{ fontSize: 14, margin: 0 }}>{t.products.noProducts}</p>
            </div>
          ) : (
            <div style={gridStyle}>
              {filteredProducts.map((product) => {
                const inStock = product.stock > 0
                return (
                  <div
                    key={product.id}
                    style={productCardStyle(inStock)}
                    onClick={() => handleAddProduct(product)}
                    onMouseEnter={(e) => {
                      if (inStock) {
                        e.currentTarget.style.borderColor = C.primary
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.12)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* Product image */}
                    {product.image_url ? (
                      <div style={{ width: '100%', height: 60, borderRadius: 6, overflow: 'hidden', marginBottom: 2 }}>
                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: 60, borderRadius: 6, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                        <Package size={24} color={C.border} />
                      </div>
                    )}
                    <p style={productNameStyle}>{product.name}</p>
                    <p style={productPriceStyle}>{formatFCFA(product.price)}</p>
                    <p style={productStockStyle(product.stock)}>
                      {inStock ? `${t.pos.inStock}: ${product.stock}` : t.pos.outOfStock}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Cart ───────────────────────────────────────── */}
      <div style={rightPanelStyle}>
        <div style={cartHeaderStyle}>
          <h2 style={cartTitleStyle}>
            <ShoppingCart size={18} />
            {t.pos.cart}
            {items.length > 0 && <span style={cartCountBadge}>{items.length}</span>}
          </h2>
          {items.length > 0 && (
            <button style={clearBtnStyle} onClick={clear}>
              <Trash2 size={14} /> {t.pos.clearCart}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div style={emptyCartStyle}>
            <ShoppingCart size={40} color={C.border} />
            <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>{t.pos.emptyCart}</p>
            <p style={{ fontSize: 12, margin: 0 }}>{t.pos.addToCartHint}</p>
          </div>
        ) : (
          <>
            <div style={cartListStyle}>
              {items.map((item) => (
                <div key={item.product_id} style={cartItemStyle}>
                  <div style={cartItemInfoStyle}>
                    <p style={cartItemNameStyle}>{item.name}</p>
                    <p style={cartItemPriceStyle}>{formatFCFA(item.price)}{t.pos.perUnit}</p>
                  </div>
                  <div style={qtyControlsStyle}>
                    <button style={qtyBtnStyle} onClick={() => updateQty(item.product_id, item.qty - 1)}>
                      <Minus size={14} />
                    </button>
                    <input
                      style={qtyInputStyle}
                      type="number"
                      value={item.qty}
                      onChange={(e) => { const val = parseInt(e.target.value) || 0; updateQty(item.product_id, val) }}
                      min={0}
                    />
                    <button style={qtyBtnStyle} onClick={() => updateQty(item.product_id, item.qty + 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <span style={cartItemTotalStyle}>{formatFCFA(item.price * item.qty)}</span>
                  <button
                    style={removeItemBtnStyle}
                    onClick={() => removeItem(item.product_id)}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.danger)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.textSecondary)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={cartFooterStyle}>
              <div style={summaryRowStyle}>
                <span>{t.pos.subtotal}</span>
                <span style={{ fontWeight: 600, color: C.text }}>{formatFCFA(subtotal)}</span>
              </div>

              <div style={summaryRowStyle}>
                <span style={discountInputRowStyle}>
                  {t.pos.discount}
                  <input
                    style={discountInputStyle}
                    type="number"
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    placeholder="0"
                    min={0}
                    max={100}
                  />
                  <span>%</span>
                </span>
                <span style={{ color: C.danger, fontWeight: 500 }}>
                  {discountAmount > 0 ? `-${formatFCFA(discountAmount)}` : '0 FCFA'}
                </span>
              </div>

              {taxRate > 0 && (
                <div style={summaryRowStyle}>
                  <span>{t.pos.tax} ({taxRate}%)</span>
                  <span style={{ fontWeight: 500, color: C.text }}>{formatFCFA(taxAmount)}</span>
                </div>
              )}

              <div style={{ height: 1, backgroundColor: C.border, margin: '8px 0' }} />

              <div style={totalRowStyle}>
                <span>{t.pos.grandTotal}</span>
                <span style={{ color: C.primary }}>{formatFCFA(total)}</span>
              </div>

              <div style={paymentButtonsStyle}>
                <button style={payBtnPrimary} onClick={() => handlePayment('cash')}>
                  <Banknote size={18} />
                  {t.pos.cash}
                </button>
                <button style={payBtnOutline} onClick={() => handlePayment('card')}>
                  <CreditCard size={18} />
                  {t.pos.card}
                </button>
                <button style={payBtnOutline} onClick={() => handlePayment('momo')}>
                  <Smartphone size={18} />
                  {t.pos.momo}
                </button>
                <button style={payBtnOutline} onClick={() => handlePayment('transfer')}>
                  <ArrowRightLeft size={18} />
                  {t.pos.transfer}
                </button>
                <button style={payBtnOutline} onClick={() => handlePayment('orange_money')}>
                  <Smartphone size={18} />
                  {t.pos.orangeMoney}
                </button>
                <button style={payBtnOutline} onClick={() => handlePayment('mtn_money')}>
                  <Smartphone size={18} />
                  {t.pos.mtnMoney}
                </button>
                <button style={payBtnOutline} onClick={() => handlePayment('carte_bancaire')}>
                  <CreditCard size={18} />
                  {t.pos.carteBancaire}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentMethod={selectedPaymentMethod}
      />
    </div>
  )
}
