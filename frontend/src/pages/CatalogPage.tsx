import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Share2, ShoppingBag, ShoppingCart, X, Filter, Plus, Minus, Trash2, Send, ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from '../services/supabase'
import { formatCurrency } from '../utils/currency'
import { generateUUID } from '../utils/uuid'

// ── Types ─────────────────────────────────────────────────────────────────

interface CatalogProduct {
  id: string
  name: string
  price: number
  category: string
  image_url?: string
  description?: string
}

interface CartItem {
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
  phone?: string
  logo_url?: string
  organization_id?: string
  tax_rate?: number
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
  headerBg: '#0f172a',
  headerText: '#ffffff',
  accent: '#f59e0b',
} as const

// ── Component ─────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const storeId = params.get('store') || ''

  const [store, setStore] = useState<StoreInfo | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showShareToast, setShowShareToast] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [sending, setSending] = useState(false)
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ── Load store and products ────────────────────────────────────────────

  useEffect(() => {
    if (!storeId || !supabase) {
      setLoading(false)
      setError('Lien catalogue invalide.')
      return
    }
    ;(async () => {
      try {
        // Load store - try by ID, then by organization_id
        let storeData: any = null
        const { data: byId } = await supabase
          .from('stores')
          .select('id, name, currency, activity, phone, logo_url, organization_id, tax_rate')
          .eq('id', storeId)
          .maybeSingle()
        if (byId) {
          storeData = byId
        } else {
          const { data: byOrg } = await supabase
            .from('stores')
            .select('id, name, currency, activity, phone, logo_url, organization_id, tax_rate')
            .eq('organization_id', storeId)
            .limit(1)
            .maybeSingle()
          if (byOrg) storeData = byOrg
          if (!storeData) {
            const { data: org } = await supabase
              .from('organizations')
              .select('id, name')
              .eq('id', storeId)
              .maybeSingle()
            if (org) storeData = { id: org.id, name: org.name, currency: 'XAF', activity: 'restaurant', organization_id: org.id }
          }
        }
        if (!storeData) {
          setError('Magasin introuvable.')
          setLoading(false)
          return
        }
        setStore(storeData)
        const realStoreId = storeData.id

        // Load products
        const { data: prods, error: prodErr } = await supabase
          .from('products')
          .select('id, name, price, category, image_url, description')
          .eq('store_id', realStoreId)
          .eq('is_active', true)
          .order('category')
          .order('name')
        if (prodErr) {
          setError('Erreur lors du chargement des produits.')
          setLoading(false)
          return
        }
        setProducts(prods || [])
      } catch {
        setError('Erreur de connexion.')
      } finally {
        setLoading(false)
      }
    })()
  }, [storeId])

  // ── Derived data ───────────────────────────────────────────────────────

  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach(p => { if (p.category) cats.add(p.category) })
    return Array.from(cats).sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    let result = products
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      )
    }
    return result
  }, [products, selectedCategory, searchQuery])

  const currencyCode = store?.currency || 'XAF'

  // ── Cart operations ─────────────────────────────────────────────────────

  const addToCart = useCallback((product: CatalogProduct) => {
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
    setCart(prev =>
      prev.map(i =>
        i.product_id === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i
      ).filter(i => i.qty > 0)
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.product_id !== productId))
  }, [])

  const cartTotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart])
  const cartItemCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart])

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleWhatsAppOrder = () => {
    if (cart.length === 0 || !store) return
    const storePhone = store.phone || ''
    const itemLines = cart.map(i =>
      `- ${i.qty}x ${i.name} (${formatCurrency(i.price * i.qty, currencyCode)})`
    ).join('\n')
    const totalFormatted = formatCurrency(cartTotal, currencyCode)
    const message = `Bonjour, je souhaite commander:\n${itemLines}\nTotal: ${totalFormatted}\n(Catalogue: ${store.name})`
    const encoded = encodeURIComponent(message)
    const waUrl = storePhone
      ? `https://wa.me/${storePhone.replace(/[^0-9+]/g, '')}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`
    window.open(waUrl, '_blank')
  }

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
      const receiptNum = `CAT-${Date.now().toString(36).toUpperCase()}`

      const realSid = store.id || storeId
      const order = {
        id: orderId,
        store_id: realSid,
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
        payment_method: 'cash',
        status: 'pending',
        device_id: `catalog-${store.name}`,
        receipt_number: receiptNum,
        created_at: now,
        updated_at: now,
      }

      const { error: insertErr } = await supabase
        .from('orders')
        .insert(order)

      if (insertErr) {
        console.error('[Catalog] Insert error:', insertErr)
        setError('Erreur lors de l\'envoi de la commande. Veuillez r\u00e9essayer.')
        setSending(false)
        return
      }

      setOrderNumber(receiptNum)
      setOrderConfirmed(true)
      setCart([])
      setShowCart(false)
      setSending(false)
    } catch (err) {
      console.error('[Catalog] Send error:', err)
      setError('Erreur lors de l\'envoi. Veuillez r\u00e9essayer.')
      setSending(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    const title = `Catalogue - ${store?.name || 'Boutique'}`
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch { /* user cancelled or not supported */ }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setShowShareToast(true)
    setTimeout(() => setShowShareToast(false), 2500)
  }

  // ── Loading / Error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: C.bg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #e2e8f0',
            borderTopColor: C.primary, borderRadius: '50%',
            animation: 'catalog-spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: C.textSecondary, fontSize: 15 }}>Chargement du catalogue...</p>
          <style>{`@keyframes catalog-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (error && !store) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: C.bg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <ShoppingBag size={64} color={C.textMuted} strokeWidth={1.5} />
          <h2 style={{ margin: '16px 0 8px', fontSize: 20, color: C.text }}>
            Catalogue indisponible
          </h2>
          <p style={{ color: C.textSecondary, fontSize: 14, maxWidth: 320, margin: '0 auto' }}>
            {error || 'Ce catalogue n\'est pas accessible pour le moment.'}
          </p>
        </div>
      </div>
    )
  }

  // ── Order confirmed ─────────────────────────────────────────────────────

  if (orderConfirmed) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: C.bg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 360, padding: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', backgroundColor: C.successBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <ShoppingCart size={32} color={C.success} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, color: C.text, fontWeight: 700 }}>
            Commande envoy{'\u00e9'}e !
          </h2>
          <p style={{ color: C.textSecondary, fontSize: 14, marginBottom: 4 }}>
            Votre commande a {'\u00e9'}t{'\u00e9'} transmise au magasin.
          </p>
          <p style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
            Commande #{orderNumber}
          </p>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 24 }}>
            {store?.name}
          </p>
          <button
            style={{
              padding: '14px 24px', borderRadius: 12, border: 'none',
              backgroundColor: C.primary, color: '#fff', fontSize: 15,
              fontWeight: 600, cursor: 'pointer', width: '100%',
            }}
            onClick={() => { setOrderConfirmed(false); setOrderNumber('') }}
          >
            Passer une autre commande
          </button>
        </div>
      </div>
    )
  }

  // ── Placeholder image ──────────────────────────────────────────────────

  const placeholderStyle: React.CSSProperties = {
    width: '100%',
    height: isMobile ? 160 : 180,
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px 12px 0 0',
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: C.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: cart.length > 0 ? 80 : 20,
    }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.headerBg,
        color: C.headerText,
        padding: isMobile ? '24px 16px 20px' : '32px 24px 28px',
        textAlign: 'center',
      }}>
        {store?.logo_url && (
          <img
            src={store.logo_url}
            alt={store?.name}
            style={{
              width: 56, height: 56, borderRadius: 12,
              objectFit: 'cover', margin: '0 auto 12px', display: 'block',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          />
        )}
        <h1 style={{
          margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 700,
          letterSpacing: '-0.02em',
        }}>
          {store?.name}
        </h1>
        <p style={{
          margin: '6px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.65)',
        }}>
          Catalogue en ligne &mdash; {products.length} produit{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Search + Category filter ────────────────────────────────────── */}
      <div style={{
        padding: isMobile ? '16px 12px 8px' : '20px 24px 12px',
        maxWidth: 1200, margin: '0 auto',
      }}>
        {/* Search */}
        <div style={{
          position: 'relative', marginBottom: 12,
        }}>
          <Search size={18} color={C.textMuted} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          }} />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 12px 12px 40px',
              borderRadius: 10, border: `1px solid ${C.border}`,
              fontSize: 15, color: C.text, outline: 'none',
              backgroundColor: C.card, boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)', background: 'none',
                border: 'none', cursor: 'pointer', padding: 4,
                color: C.textMuted,
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories */}
        {categories.length > 1 && (
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            paddingBottom: 8, WebkitOverflowScrolling: 'touch',
          }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '8px 16px', borderRadius: 20,
                border: selectedCategory === null ? 'none' : `1px solid ${C.border}`,
                backgroundColor: selectedCategory === null ? C.primary : C.card,
                color: selectedCategory === null ? '#fff' : C.text,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <Filter size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Tout ({products.length})
            </button>
            {categories.map(cat => {
              const count = products.filter(p => p.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  style={{
                    padding: '8px 16px', borderRadius: 20,
                    border: selectedCategory === cat ? 'none' : `1px solid ${C.border}`,
                    backgroundColor: selectedCategory === cat ? C.primary : C.card,
                    color: selectedCategory === cat ? '#fff' : C.text,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          margin: '0 12px 8px',
          padding: '10px 14px',
          borderRadius: 8,
          backgroundColor: C.dangerBg,
          color: C.danger,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 1200,
          marginLeft: 'auto',
          marginRight: 'auto',
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

      {/* ── Product grid ────────────────────────────────────────────────── */}
      <div style={{
        padding: isMobile ? '8px 12px 100px' : '12px 24px 100px',
        maxWidth: 1200, margin: '0 auto',
      }}>
        {filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
          }}>
            <ShoppingBag size={48} color={C.textMuted} strokeWidth={1.5} />
            <p style={{ color: C.textSecondary, fontSize: 15, marginTop: 12 }}>
              Aucun produit trouv{'\u00e9'}.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, 1fr)'
              : 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: isMobile ? 10 : 16,
          }}>
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.product_id === product.id)
              return (
                <div key={product.id} style={{
                  backgroundColor: C.card,
                  borderRadius: 12,
                  border: `1px solid ${inCart ? C.primary : C.border}`,
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Image */}
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: isMobile ? 160 : 180,
                        objectFit: 'cover',
                        borderRadius: '12px 12px 0 0',
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={placeholderStyle}>
                      <ShoppingBag size={36} color={C.textMuted} strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Info */}
                  <div style={{
                    padding: isMobile ? '10px 10px 12px' : '14px 16px 16px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {product.category && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: C.primary,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        marginBottom: 4,
                      }}>
                        {product.category}
                      </span>
                    )}
                    <h3 style={{
                      margin: '0 0 4px', fontSize: isMobile ? 14 : 16,
                      fontWeight: 600, color: C.text,
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {product.name}
                    </h3>
                    {product.description && (
                      <p style={{
                        margin: '0 0 8px', fontSize: 12,
                        color: C.textSecondary, lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                      }}>
                        {product.description}
                      </p>
                    )}
                    <div style={{
                      fontSize: isMobile ? 16 : 18, fontWeight: 700,
                      color: C.text, marginTop: 'auto', marginBottom: 10,
                    }}>
                      {formatCurrency(product.price, currencyCode)}
                    </div>

                    {/* Add to cart / quantity controls */}
                    {inCart ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      }}>
                        <button
                          onClick={() => updateQty(product.id, -1)}
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            border: `1px solid ${C.border}`, backgroundColor: C.card,
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: 0,
                          }}
                        >
                          <Minus size={15} color={C.text} />
                        </button>
                        <span style={{
                          fontSize: 16, fontWeight: 700, color: C.text,
                          minWidth: 24, textAlign: 'center',
                        }}>
                          {inCart.qty}
                        </span>
                        <button
                          onClick={() => updateQty(product.id, 1)}
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            border: 'none', backgroundColor: C.primary,
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: 0,
                          }}
                        >
                          <Plus size={15} color="#fff" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        style={{
                          width: '100%', padding: isMobile ? '10px' : '11px 16px',
                          borderRadius: 8, border: 'none',
                          backgroundColor: C.success, color: '#fff',
                          fontSize: 14, fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', gap: 6,
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <Plus size={15} />
                        Ajouter
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Floating cart bar ──────────────────────────────────────────────── */}
      {cart.length > 0 && !showCart && (
        <div
          style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            backgroundColor: C.primary,
            color: '#fff',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            zIndex: 100,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          }}
          onClick={() => setShowCart(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShoppingCart size={16} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {cartItemCount} article{cartItemCount > 1 ? 's' : ''}
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

      {/* ── Cart overlay ──────────────────────────────────────────────────── */}
      {showCart && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowCart(false)}
        >
          <div
            style={{
              backgroundColor: C.card,
              borderRadius: '20px 20px 0 0',
              padding: 20,
              maxHeight: '75vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cart header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>
                Votre commande
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
                    {formatCurrency(item.price, currencyCode)} / unit{'\u00e9'}
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

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {/* WhatsApp order */}
              <button
                style={{
                  padding: '14px 24px', borderRadius: 12, border: 'none',
                  backgroundColor: C.success, color: '#fff', fontSize: 15,
                  fontWeight: 600, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
                }}
                onClick={handleWhatsAppOrder}
              >
                <Send size={18} />
                Commander via WhatsApp
              </button>

              {/* Direct order (only if store param exists = embedded catalog) */}
              {storeId && (
                <button
                  style={{
                    padding: '14px 24px', borderRadius: 12, border: 'none',
                    backgroundColor: C.primary, color: '#fff', fontSize: 15,
                    fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, width: '100%',
                    opacity: sending ? 0.7 : 1,
                  }}
                  onClick={handleSendOrder}
                  disabled={sending || cart.length === 0}
                >
                  {sending ? (
                    <>Envoi en cours...</>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      Envoyer la commande
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating share button ───────────────────────────────────────── */}
      {cart.length === 0 && (
        <button
          onClick={handleShare}
          style={{
            position: 'fixed',
            bottom: 24, right: 24,
            width: 56, height: 56,
            borderRadius: 28,
            backgroundColor: C.primary,
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          title="Partager le catalogue"
        >
          <Share2 size={22} />
        </button>
      )}

      {/* ── Share toast ──────────────────────────────────────────────────── */}
      {showShareToast && (
        <div style={{
          position: 'fixed',
          bottom: 90, right: 24,
          backgroundColor: C.headerBg,
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1001,
          animation: 'catalog-toast-in 0.3s ease',
        }}>
          Lien copi{'\u00e9'} !
          <style>{`@keyframes catalog-toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{
        textAlign: 'center',
        padding: '20px 16px 40px',
        fontSize: 12,
        color: C.textMuted,
      }}>
        Propuls{'\u00e9'} par POS Mano Verde
      </div>
    </div>
  )
}
