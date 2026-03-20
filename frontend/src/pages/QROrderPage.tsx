import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Send, CheckCircle2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatCurrency } from '../utils/currency'
import { generateUUID } from '../utils/uuid'

// ── Types ─────────────────────────────────────────────────────────────────

interface QRProduct {
  id: string
  name: string
  price: number
  category: string
  image_url?: string
  description?: string
}

interface QRCartItem {
  product_id: string
  name: string
  price: number
  qty: number
}

interface StoreInfo {
  id: string
  name: string
  currency: string
  activity: string
  logo_url?: string
  tax_rate: number
}

// ── Colors ────────────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#f0fdf4',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  accent: '#f59e0b',
} as const

// ── Component ─────────────────────────────────────────────────────────────

export default function QROrderPage() {
  // Parse URL params
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const tableId = params.get('table') || ''
  const storeId = params.get('store') || ''

  // State
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [tableName, setTableName] = useState('')
  const [tableNumber, setTableNumber] = useState(0)
  const [products, setProducts] = useState<QRProduct[]>([])
  const [cart, setCart] = useState<QRCartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCart, setShowCart] = useState(false)

  const currencyCode = store?.currency || 'XAF'

  // ── Load store, table, and products from Supabase ─────────────────────

  useEffect(() => {
    if (!storeId || !tableId || !supabase) {
      setLoading(false)
      if (!supabase) setError('Service unavailable')
      else setError('Invalid QR code link. Missing store or table information.')
      return
    }

    const loadData = async () => {
      if (!supabase) return
      try {
        // Load store info - try by store ID first, then by organization_id
        let storeData: any = null
        const { data: byId } = await supabase
          .from('stores')
          .select('id, name, currency, activity, logo_url, tax_rate, organization_id')
          .eq('id', storeId)
          .maybeSingle()

        if (byId) {
          storeData = byId
        } else {
          // storeId might be an organization_id — find the first store
          const { data: byOrg } = await supabase
            .from('stores')
            .select('id, name, currency, activity, logo_url, tax_rate, organization_id')
            .eq('organization_id', storeId)
            .limit(1)
            .maybeSingle()
          if (byOrg) storeData = byOrg

          // Also try organizations table directly
          if (!storeData) {
            const { data: org } = await supabase
              .from('organizations')
              .select('id, name')
              .eq('id', storeId)
              .maybeSingle()
            if (org) {
              storeData = { id: org.id, name: org.name, currency: 'XAF', activity: 'restaurant', organization_id: org.id }
            }
          }
        }

        if (!storeData) {
          setError('Store not found. Please scan a valid QR code.')
          setLoading(false)
          return
        }
        setStore(storeData as StoreInfo)
        const realStoreId = storeData.id
        void (storeData.organization_id) // org available for future use

        // Load table info - search by table ID across stores in this org
        const { data: tableData } = await supabase
          .from('restaurant_tables')
          .select('id, name, number')
          .eq('id', tableId)
          .maybeSingle()

        if (tableData) {
          setTableName((tableData as { name: string }).name)
          setTableNumber((tableData as { number: number }).number)
        }

        // Load active products - by store ID
        const { data: productData, error: prodErr } = await supabase
          .from('products')
          .select('id, name, price, category, image_url, description')
          .eq('store_id', realStoreId)
          .eq('is_active', true)
          .order('category')
          .order('name')

        if (prodErr) {
          console.error('[QROrder] Failed to load products:', prodErr)
          setError('Failed to load menu. Please try again.')
          setLoading(false)
          return
        }
        setProducts((productData as QRProduct[]) || [])
        setLoading(false)
      } catch (err) {
        console.error('[QROrder] Error:', err)
        setError('Something went wrong. Please try again.')
        setLoading(false)
      }
    }

    loadData()
  }, [storeId, tableId])

  // ── Categories ────────────────────────────────────────────────────────

  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach(p => { if (p.category) cats.add(p.category) })
    return Array.from(cats).sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products
    return products.filter(p => p.category === selectedCategory)
  }, [products, selectedCategory])

  // ── Cart operations ───────────────────────────────────────────────────

  const addToCart = useCallback((product: QRProduct) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }, [])

  const updateQty = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(i =>
        i.product_id === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i
      ).filter(i => i.qty > 0)
      return updated
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.product_id !== productId))
  }, [])

  const cartTotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart])
  const cartItemCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart])

  // ── Send order ────────────────────────────────────────────────────────

  const handleSendOrder = async () => {
    if (!supabase || cart.length === 0 || !store) return
    setSending(true)
    setError('')

    try {
      const taxRate = store.tax_rate || 0
      const subtotal = cartTotal
      const tax = Math.round(subtotal * taxRate / 100)
      const total = subtotal + tax

      const orderId = generateUUID()
      const now = new Date().toISOString()
      const receiptNum = `QR-${Date.now().toString(36).toUpperCase()}`

      const order = {
        id: orderId,
        store_id: storeId,
        user_id: 'qr-customer', // anonymous QR order
        items: cart.map(i => ({
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          qty: i.qty,
        })),
        subtotal,
        discount: 0,
        tax,
        total,
        payment_method: 'cash' as const, // will be settled at table
        status: 'pending' as const,
        note: `QR Order - ${tableName} (#${tableNumber})`,
        synced: true,
        device_id: 'qr-order',
        table_id: tableId,
        table_name: tableName,
        receipt_number: receiptNum,
        created_at: now,
        updated_at: now,
      }

      const { error: insertErr } = await supabase
        .from('orders')
        .insert(order)

      if (insertErr) {
        console.error('[QROrder] Insert error:', insertErr)
        setError('Failed to send order. Please try again or call a waiter.')
        setSending(false)
        return
      }

      // Update table status to occupied
      await supabase
        .from('restaurant_tables')
        .update({ status: 'occupied', current_order_id: orderId, updated_at: now })
        .eq('id', tableId)

      setOrderNumber(receiptNum)
      setOrderConfirmed(true)
      setCart([])
      setSending(false)
    } catch (err) {
      console.error('[QROrder] Send error:', err)
      setError('Failed to send order. Please try again.')
      setSending(false)
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: C.bg,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: cart.length > 0 ? 80 : 20,
  }

  const headerStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
    color: '#fff',
    padding: '20px 16px',
    textAlign: 'center',
  }

  const storeLogo: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.3)',
    marginBottom: 8,
  }

  const categoryBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    padding: '12px 16px',
    overflowX: 'auto',
    backgroundColor: C.card,
    borderBottom: `1px solid ${C.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }

  const categoryBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: `1px solid ${active ? C.primary : C.border}`,
    backgroundColor: active ? C.primary : C.card,
    color: active ? '#fff' : C.text,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  })

  const productGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
    padding: 16,
  }

  const productCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: 14,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  const floatingCartStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.primary,
    color: '#fff',
    padding: '14px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 100,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
  }

  const cartOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  }

  const cartPanelStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: '20px 20px 0 0',
    padding: 20,
    maxHeight: '75vh',
    overflowY: 'auto',
  }

  const btnPrimary: React.CSSProperties = {
    padding: '14px 24px',
    borderRadius: 12,
    border: 'none',
    backgroundColor: C.primary,
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  }

  // ── Error / Loading states ────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${C.border}`,
            borderTopColor: C.primary, borderRadius: '50%',
            animation: 'qr-spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: C.textSecondary, fontSize: 14 }}>Loading menu...</p>
          <style>{`@keyframes qr-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (error && !store) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>!</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, color: C.text }}>Unable to Load</h2>
          <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.5 }}>{error}</p>
        </div>
      </div>
    )
  }

  // ── Order confirmed ───────────────────────────────────────────────────

  if (orderConfirmed) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <CheckCircle2 size={64} color={C.success} strokeWidth={1.5} />
          <h2 style={{ margin: '16px 0 8px', fontSize: 22, color: C.text }}>
            Order Sent!
          </h2>
          <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 4 }}>
            Your order has been sent to the kitchen.
          </p>
          <p style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
            Order #{orderNumber}
          </p>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 24 }}>
            {store?.name} - {tableName}
          </p>
          <button
            style={btnPrimary}
            onClick={() => { setOrderConfirmed(false); setOrderNumber('') }}
          >
            Place Another Order
          </button>
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        {store?.logo_url && (
          <img src={store.logo_url} alt={store.name} style={storeLogo} />
        )}
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{store?.name}</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, opacity: 0.85 }}>
          {tableName} (#{tableNumber})
        </p>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div style={categoryBarStyle}>
          <button
            style={categoryBtnStyle(selectedCategory === null)}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              style={categoryBtnStyle(selectedCategory === cat)}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{
          margin: '12px 16px 0',
          padding: '10px 14px',
          borderRadius: 8,
          backgroundColor: C.dangerBg,
          color: C.danger,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {error}
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: C.danger, marginLeft: 'auto' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Products grid */}
      <div style={productGridStyle}>
        {filteredProducts.map(product => {
          const inCart = cart.find(i => i.product_id === product.id)
          return (
            <div
              key={product.id}
              style={{
                ...productCardStyle,
                borderColor: inCart ? C.primary : C.border,
              }}
              onClick={() => addToCart(product)}
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{
                    width: '100%', height: 100, objectFit: 'cover',
                    borderRadius: 8, marginBottom: 4,
                  }}
                />
              )}
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>
                {product.name}
              </p>
              {product.description && (
                <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.3 }}>
                  {product.description.length > 60
                    ? product.description.slice(0, 60) + '...'
                    : product.description}
                </p>
              )}
              <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: C.primary }}>
                {formatCurrency(product.price, currencyCode)}
              </p>
              {inCart && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginTop: 4, justifyContent: 'center',
                }}>
                  <button
                    onClick={e => { e.stopPropagation(); updateQty(product.id, -1) }}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`,
                      backgroundColor: C.card, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                  >
                    <Minus size={14} color={C.text} />
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text, minWidth: 20, textAlign: 'center' }}>
                    {inCart.qty}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); updateQty(product.id, 1) }}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', border: 'none',
                      backgroundColor: C.primary, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                  >
                    <Plus size={14} color="#fff" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textSecondary }}>
          <p style={{ fontSize: 16, fontWeight: 500 }}>No items available</p>
          <p style={{ fontSize: 13 }}>The menu is currently empty.</p>
        </div>
      )}

      {/* Floating cart bar */}
      {cart.length > 0 && !showCart && (
        <div style={floatingCartStyle} onClick={() => setShowCart(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShoppingCart size={16} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {cartItemCount} item{cartItemCount > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              {formatCurrency(cartTotal, currencyCode)}
            </span>
            <ChevronUp size={18} />
          </div>
        </div>
      )}

      {/* Cart overlay */}
      {showCart && (
        <div style={cartOverlayStyle} onClick={() => setShowCart(false)}>
          <div style={cartPanelStyle} onClick={e => e.stopPropagation()}>
            {/* Cart header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>
                Your Order
              </h3>
              <button
                onClick={() => setShowCart(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textSecondary }}
              >
                <ChevronDown size={22} />
              </button>
            </div>

            {/* Cart items */}
            {cart.map(item => (
              <div
                key={item.product_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.text }}>{item.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: C.textSecondary }}>
                    {formatCurrency(item.price, currencyCode)} each
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => updateQty(item.product_id, -1)}
                    style={{
                      width: 30, height: 30, borderRadius: '50%', border: `1px solid ${C.border}`,
                      backgroundColor: C.card, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                  >
                    <Minus size={14} color={C.text} />
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text, minWidth: 24, textAlign: 'center' }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product_id, 1)}
                    style={{
                      width: 30, height: 30, borderRadius: '50%', border: 'none',
                      backgroundColor: C.primary, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                  >
                    <Plus size={14} color="#fff" />
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, minWidth: 70, textAlign: 'right' }}>
                  {formatCurrency(item.price * item.qty, currencyCode)}
                </p>
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.danger }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0', marginTop: 4,
            }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                {formatCurrency(cartTotal, currencyCode)}
              </span>
            </div>

            {/* Send order button */}
            <button
              style={{
                ...btnPrimary,
                opacity: sending ? 0.7 : 1,
                cursor: sending ? 'not-allowed' : 'pointer',
                marginTop: 4,
              }}
              onClick={handleSendOrder}
              disabled={sending || cart.length === 0}
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send size={18} />
                  Send Order
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
