import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Loader2,
  Grid3X3,
  List,
  Package,
  AlertTriangle,
  Tag,
  BarChart3,
  Info,
  X,
  ScanBarcode,
  Filter,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useProductStore } from '../stores/productStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { Product } from '../types'

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

// ── Auto repair categories ───────────────────────────────────────────────

const AUTO_CATEGORIES = [
  { key: 'all', label: 'All Parts', icon: Package },
  { key: 'Filtres', label: 'Filtres', icon: Filter },
  { key: 'Huiles', label: 'Huiles & Lubrifiants', icon: Package },
  { key: 'Freins', label: 'Freins', icon: Package },
  { key: 'Suspension', label: 'Suspension', icon: Package },
  { key: 'Electrique', label: 'Electrique', icon: Package },
  { key: 'Carrosserie', label: 'Carrosserie', icon: Package },
  { key: 'Moteur', label: 'Moteur', icon: Package },
  { key: 'Transmission', label: 'Transmission', icon: Package },
  { key: 'Echappement', label: 'Echappement', icon: Package },
  { key: 'Climatisation', label: 'Climatisation', icon: Package },
  { key: 'Pneus', label: 'Pneus & Roues', icon: Package },
  { key: 'Accessoires', label: 'Accessoires', icon: Package },
]

// ── Component ────────────────────────────────────────────────────────────

export default function PartsCatalogPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const { products, loading, loadProducts, categories: storeCategories } = useProductStore()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedPart, setSelectedPart] = useState<Product | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const storeId = currentStore?.id || ''
  const currency = currentStore?.currency || 'XOF'

  // ── Load products ──────────────────────────────────────────────────────

  useEffect(() => {
    if (storeId) {
      loadProducts(storeId)
    }
  }, [storeId, loadProducts])

  // ── Filter products ────────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    let result = products

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p =>
        (p.category || '').toLowerCase().includes(selectedCategory.toLowerCase())
      )
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [products, selectedCategory, search])

  // ── Category counts ────────────────────────────────────────────────────

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length }
    for (const p of products) {
      const cat = p.category || 'Uncategorized'
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  }, [products])

  // ── Available categories (from store data merged with AUTO_CATEGORIES) ─

  const availableCategories = useMemo(() => {
    const storeCats = storeCategories.map(c => c.toLowerCase())
    return AUTO_CATEGORIES.filter(ac =>
      ac.key === 'all' || storeCats.some(sc => sc.includes(ac.key.toLowerCase()))
    )
  }, [storeCategories])

  // If no auto categories match, show all store categories
  const displayCategories = useMemo(() => {
    if (availableCategories.length <= 1) {
      // Fallback: show store categories as-is
      return [
        { key: 'all', label: (t as any).garage?.allParts || 'All Parts', icon: Package },
        ...storeCategories.map(c => ({ key: c, label: c, icon: Package })),
      ]
    }
    return availableCategories
  }, [availableCategories, storeCategories, t])

  // ── Stats ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const lowStock = products.filter(p => p.min_stock != null && p.stock <= p.min_stock).length
    const outOfStock = products.filter(p => p.stock <= 0).length
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)
    return { total: products.length, lowStock, outOfStock, totalValue }
  }, [products])

  // ── Render helpers ─────────────────────────────────────────────────────

  const getStockBadge = (product: Product) => {
    if (product.stock <= 0) {
      return { label: (t as any).garage?.outOfStock || 'Out of Stock', color: C.danger, bg: '#fef2f2' }
    }
    if (product.min_stock != null && product.stock <= product.min_stock) {
      return { label: (t as any).garage?.lowStock || 'Low Stock', color: C.warning, bg: '#fffbeb' }
    }
    return { label: (t as any).garage?.inStock || 'In Stock', color: C.success, bg: '#f0fdf4' }
  }

  // ── Category sidebar ──────────────────────────────────────────────────

  const renderCategorySidebar = () => (
    <div style={{
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: `1px solid ${C.border}`,
        fontSize: 15,
        fontWeight: 700,
        color: C.text,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <Filter size={16} color={C.primary} />
        {(t as any).garage?.categories || 'Categories'}
      </div>
      <div style={{ padding: 8 }}>
        {displayCategories.map(cat => {
          const isActive = selectedCategory === cat.key
          const count = cat.key === 'all' ? products.length : (categoryCounts[cat.key] || 0)
          return (
            <button
              key={cat.key}
              onClick={() => {
                setSelectedCategory(cat.key)
                if (isMobile) setShowMobileFilters(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                backgroundColor: isActive ? C.primary + '10' : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s',
                marginBottom: 2,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = C.bg }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <cat.icon size={16} color={isActive ? C.primary : C.textSecondary} />
              <span style={{
                flex: 1,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? C.primary : C.text,
              }}>
                {(t as any).garage?.categoryLabels?.[cat.key] || cat.label}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? C.primary : C.textSecondary,
                backgroundColor: isActive ? C.primary + '15' : C.bg,
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  // ── Part card (grid) ──────────────────────────────────────────────────

  const renderPartCardGrid = (product: Product) => {
    const badge = getStockBadge(product)
    return (
      <div
        key={product.id}
        onClick={() => setSelectedPart(product)}
        style={{
          backgroundColor: C.card,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          cursor: 'pointer',
          overflow: 'hidden',
          transition: 'box-shadow 0.2s, border-color 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = C.primary
          e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}20`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = C.border
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
        }}
      >
        {/* Image area / placeholder */}
        <div style={{
          height: 120,
          backgroundColor: C.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Package size={36} color={C.border} strokeWidth={1.5} />
          )}
          {/* Stock badge */}
          <span style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            color: badge.color,
            backgroundColor: badge.bg,
            border: `1px solid ${badge.color}20`,
          }}>
            {badge.label}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>
            {product.name}
          </div>
          {product.sku && (
            <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 6, fontFamily: 'monospace' }}>
              SKU: {product.sku}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>
              {formatCurrency(product.price, currency)}
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: product.stock <= 0 ? C.danger : product.min_stock != null && product.stock <= product.min_stock ? C.warning : C.textSecondary,
            }}>
              {product.stock} {(t as any).garage?.inStockUnit || 'in stock'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── Part row (list) ───────────────────────────────────────────────────

  const renderPartRow = (product: Product) => {
    const badge = getStockBadge(product)
    return (
      <div
        key={product.id}
        onClick={() => setSelectedPart(product)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: rv(10, 16, 20),
          padding: rv(12, 16, 16),
          backgroundColor: C.card,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          marginBottom: 8,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          backgroundColor: C.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {product.image_url ? (
            <img src={product.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
          ) : (
            <Package size={20} color={C.textSecondary} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{product.name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: rv(6, 12, 16), marginTop: 3 }}>
            {product.sku && (
              <span style={{ fontSize: 11, color: C.textSecondary, fontFamily: 'monospace' }}>
                SKU: {product.sku}
              </span>
            )}
            {product.barcode && (
              <span style={{ fontSize: 11, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 3 }}>
                <ScanBarcode size={10} /> {product.barcode}
              </span>
            )}
            {product.category && (
              <span style={{ fontSize: 11, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Tag size={10} /> {product.category}
              </span>
            )}
          </div>
        </div>

        {/* Stock */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            color: badge.color,
            backgroundColor: badge.bg,
            marginBottom: 4,
          }}>
            {product.stock} {(t as any).garage?.units || 'units'}
          </span>
        </div>

        {/* Price */}
        {!isMobile && (
          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.primary }}>
              {formatCurrency(product.price, currency)}
            </div>
          </div>
        )}

        <ChevronRight size={16} color={C.textSecondary} style={{ flexShrink: 0 }} />
      </div>
    )
  }

  // ── Detail panel ──────────────────────────────────────────────────────

  const renderDetailPanel = () => {
    if (!selectedPart) return null
    const badge = getStockBadge(selectedPart)

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: isMobile ? '100%' : 420,
        backgroundColor: C.card,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>
            {(t as any).garage?.partDetails || 'Part Details'}
          </h3>
          <button
            onClick={() => setSelectedPart(null)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              border: 'none', backgroundColor: 'transparent',
              cursor: 'pointer', color: C.textSecondary,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Image */}
          <div style={{
            height: 180,
            backgroundColor: C.bg,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            overflow: 'hidden',
          }}>
            {selectedPart.image_url ? (
              <img src={selectedPart.image_url} alt={selectedPart.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Package size={48} color={C.border} strokeWidth={1.5} />
            )}
          </div>

          {/* Name + Price */}
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: C.text }}>
            {selectedPart.name}
          </h2>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.primary, marginBottom: 16 }}>
            {formatCurrency(selectedPart.price, currency)}
          </div>

          {/* Stock badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            color: badge.color,
            backgroundColor: badge.bg,
            marginBottom: 20,
          }}>
            {selectedPart.stock <= 0 && <AlertTriangle size={14} />}
            {badge.label} ({selectedPart.stock} {(t as any).garage?.units || 'units'})
            {selectedPart.min_stock != null && (
              <span style={{ fontSize: 11, fontWeight: 500, color: C.textSecondary }}>
                / min: {selectedPart.min_stock}
              </span>
            )}
          </div>

          {/* Details grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 20,
          }}>
            {selectedPart.sku && (
              <div style={{ padding: '10px 14px', backgroundColor: C.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>SKU</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{selectedPart.sku}</div>
              </div>
            )}
            {selectedPart.barcode && (
              <div style={{ padding: '10px 14px', backgroundColor: C.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                  {(t as any).garage?.barcode || 'Barcode'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{selectedPart.barcode}</div>
              </div>
            )}
            {selectedPart.category && (
              <div style={{ padding: '10px 14px', backgroundColor: C.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                  {(t as any).garage?.category || 'Category'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedPart.category}</div>
              </div>
            )}
            {selectedPart.unit && (
              <div style={{ padding: '10px 14px', backgroundColor: C.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                  {(t as any).garage?.unit || 'Unit'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedPart.unit}</div>
              </div>
            )}
            {selectedPart.manufacturer && (
              <div style={{ padding: '10px 14px', backgroundColor: C.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                  {(t as any).garage?.manufacturer || 'Manufacturer'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedPart.manufacturer}</div>
              </div>
            )}
            {selectedPart.cost != null && selectedPart.cost > 0 && (
              <div style={{ padding: '10px 14px', backgroundColor: C.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                  {(t as any).garage?.costPrice || 'Cost Price'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{formatCurrency(selectedPart.cost, currency)}</div>
              </div>
            )}
            {selectedPart.vehicle_type && (
              <div style={{ padding: '10px 14px', backgroundColor: C.bg, borderRadius: 8, gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                  {(t as any).garage?.vehicleType || 'Vehicle Type'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedPart.vehicle_type}</div>
              </div>
            )}
          </div>

          {/* Description / compatibility */}
          {selectedPart.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Info size={14} color={C.primary} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  {(t as any).garage?.compatibilityInfo || 'Description / Compatibility'}
                </span>
              </div>
              <div style={{
                padding: '12px 16px',
                backgroundColor: C.bg,
                borderRadius: 8,
                fontSize: 14,
                color: C.text,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {selectedPart.description}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div style={{ padding: rv(16, 24, 32), backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 12,
        marginBottom: rv(20, 28, 32),
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: rv(22, 26, 28), fontWeight: 800, color: C.text }}>
            {(t as any).garage?.partsCatalog || 'Parts Catalog'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: C.textSecondary }}>
            {(t as any).garage?.partsCatalogDesc || 'Browse and search auto parts inventory'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isMobile && (
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', backgroundColor: C.card,
                color: C.text, border: `1px solid ${C.border}`,
                borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Filter size={15} />
              {(t as any).garage?.filters || 'Filters'}
            </button>
          )}
          <div style={{
            display: 'flex',
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, border: 'none',
                backgroundColor: viewMode === 'grid' ? C.primary : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : C.textSecondary,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, border: 'none',
                borderLeft: `1px solid ${C.border}`,
                backgroundColor: viewMode === 'list' ? C.primary : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : C.textSecondary,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: rv('1fr 1fr', '1fr 1fr 1fr 1fr', '1fr 1fr 1fr 1fr'),
        gap: rv(10, 16, 16),
        marginBottom: 24,
      }}>
        {[
          { label: (t as any).garage?.totalParts || 'Total Parts', value: String(stats.total), icon: Package, color: C.primary },
          { label: (t as any).garage?.lowStockParts || 'Low Stock', value: String(stats.lowStock), icon: AlertTriangle, color: C.warning },
          { label: (t as any).garage?.outOfStockParts || 'Out of Stock', value: String(stats.outOfStock), icon: AlertTriangle, color: C.danger },
          { label: (t as any).garage?.inventoryValue || 'Inventory Value', value: formatCurrency(stats.totalValue, currency), icon: BarChart3, color: C.success },
        ].map((stat, i) => (
          <div key={i} style={{
            backgroundColor: C.card,
            borderRadius: 12,
            padding: rv(14, 18, 20),
            border: `1px solid ${C.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                backgroundColor: stat.color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon size={16} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: rv(18, 22, 24), fontWeight: 800, color: C.text }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search bar ────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={18} color={C.textSecondary} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={(t as any).garage?.searchParts || 'Search by name, SKU, barcode...'}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            fontSize: 14,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            outline: 'none',
            color: C.text,
            backgroundColor: C.card,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Mobile category drawer ────────────────────────────────────────── */}
      {isMobile && showMobileFilters && (
        <div style={{ marginBottom: 16 }}>
          {renderCategorySidebar()}
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '240px 1fr',
        gap: 24,
      }}>
        {/* Sidebar - desktop only */}
        {!isMobile && (
          <div>
            {renderCategorySidebar()}
          </div>
        )}

        {/* Products */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{
              backgroundColor: C.card, borderRadius: 12, padding: 48,
              border: `1px solid ${C.border}`, textAlign: 'center',
            }}>
              <Package size={48} color={C.border} strokeWidth={1.5} />
              <p style={{ margin: '12px 0 0', fontSize: 15, color: C.textSecondary, fontWeight: 500 }}>
                {search
                  ? ((t as any).garage?.noPartsFound || 'No parts found matching your search')
                  : ((t as any).garage?.noPartsYet || 'No parts in this category')
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: rv('1fr 1fr', '1fr 1fr 1fr', '1fr 1fr 1fr 1fr'),
              gap: rv(10, 14, 16),
            }}>
              {filteredProducts.map(renderPartCardGrid)}
            </div>
          ) : (
            <div>
              {filteredProducts.map(renderPartRow)}
            </div>
          )}

          {/* Result count */}
          {!loading && filteredProducts.length > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '16px 0',
              fontSize: 13,
              color: C.textSecondary,
              fontWeight: 500,
            }}>
              {filteredProducts.length} {(t as any).garage?.partsShown || 'parts'}
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail side panel ─────────────────────────────────────────────── */}
      {selectedPart && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setSelectedPart(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.3)',
              zIndex: 9997,
            }}
          />
          {renderDetailPanel()}
        </>
      )}

      {/* ── Spin animation ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
