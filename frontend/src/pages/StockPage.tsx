import React, { useState, useEffect, useMemo } from 'react'
import {
  Package,
  AlertTriangle,
  XCircle,
  Plus,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useProductStore } from '../stores/productStore'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { db, getDeviceId } from '../db/dexie'
import type { Product, StockMove, StockMoveType } from '../types'
import { generateUUID } from '../utils/uuid'

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

// formatFCFA removed -- not used in this page (available in bluetooth.ts if needed)

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const MIN_STOCK_THRESHOLD = 5

const moveTypeLabels: Record<StockMoveType, string> = {
  in: 'Entree',
  out: 'Sortie',
  adjust: 'Ajustement',
  sale: 'Vente',
  return: 'Retour',
}

const moveTypeColors: Record<StockMoveType, string> = {
  in: '#16a34a',
  out: '#dc2626',
  adjust: '#f59e0b',
  sale: '#2563eb',
  return: '#8b5cf6',
}

// ── Component ────────────────────────────────────────────────────────────

export default function StockPage() {
  const { products, loadProducts, updateProduct } = useProductStore()
  const { user } = useAuthStore()
  const { currentStore } = useAppStore()

  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [moveType, setMoveType] = useState<'in' | 'out' | 'adjust'>('in')
  const [moveQty, setMoveQty] = useState('')
  const [moveReason, setMoveReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [stockMoves, setStockMoves] = useState<StockMove[]>([])
  const [movesLoading, setMovesLoading] = useState(false)

  useEffect(() => {
    if (currentStore?.id) {
      loadProducts(currentStore.id)
      loadStockMoves()
    }
  }, [currentStore?.id, loadProducts])

  const loadStockMoves = async () => {
    if (!currentStore?.id) return
    setMovesLoading(true)
    try {
      const moves = await db.stock_moves
        .where('store_id')
        .equals(currentStore.id)
        .reverse()
        .sortBy('created_at')
      setStockMoves(moves.slice(0, 50))
    } catch (err) {
      console.error('Failed to load stock moves:', err)
    } finally {
      setMovesLoading(false)
    }
  }

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= (p.min_stock ?? MIN_STOCK_THRESHOLD) && p.stock > 0),
    [products]
  )

  const outOfStockProducts = useMemo(
    () => products.filter((p) => p.stock === 0),
    [products]
  )

  const getStockStatus = (product: Product): { label: string; color: string } => {
    if (product.stock === 0) return { label: 'Rupture', color: C.danger }
    if (product.stock <= (product.min_stock ?? MIN_STOCK_THRESHOLD)) return { label: 'Faible', color: C.warning }
    return { label: 'Normal', color: C.success }
  }

  const getStockBarWidth = (product: Product): number => {
    const minStock = product.min_stock ?? MIN_STOCK_THRESHOLD
    const maxDisplay = Math.max(minStock * 4, 50)
    return Math.min(100, (product.stock / maxDisplay) * 100)
  }

  const handleAdjust = async () => {
    if (!selectedProductId || !moveQty || !currentStore || !user) return
    const qty = parseInt(moveQty)
    if (isNaN(qty) || qty <= 0) return

    setSaving(true)
    try {
      const product = products.find((p) => p.id === selectedProductId)
      if (!product) return

      let newStock: number
      if (moveType === 'in') {
        newStock = product.stock + qty
      } else if (moveType === 'out') {
        newStock = Math.max(0, product.stock - qty)
      } else {
        newStock = qty // 'adjust' sets absolute value
      }

      // Update product stock
      await updateProduct(selectedProductId, { stock: newStock })

      // Create stock move record
      const move: StockMove = {
        id: generateUUID(),
        store_id: currentStore.id,
        product_id: selectedProductId,
        type: moveType as StockMoveType,
        qty: moveType === 'out' ? -qty : qty,
        reason: moveReason.trim() || undefined,
        user_id: user.id,
        synced: false,
        created_at: new Date().toISOString(),
      }

      await db.stock_moves.add(move)

      // Add to sync queue
      await db.sync_queue.add({
        id: generateUUID(),
        entity_type: 'stock_move',
        entity_id: move.id,
        operation: 'create',
        data: JSON.stringify(move),
        device_id: getDeviceId(),
        store_id: currentStore.id,
        retries: 0,
        created_at: new Date().toISOString(),
      })

      setShowAdjustModal(false)
      setSelectedProductId('')
      setMoveQty('')
      setMoveReason('')
      setMoveType('in')
      await loadStockMoves()
    } catch (err) {
      console.error('Stock adjustment error:', err)
    } finally {
      setSaving(false)
    }
  }

  const openAdjustModal = () => {
    setSelectedProductId('')
    setMoveQty('')
    setMoveReason('')
    setMoveType('in')
    setShowAdjustModal(true)
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: 24,
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.primary,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const summaryGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 24,
  }

  const summaryCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${C.border}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }

  const summaryLabelStyle: React.CSSProperties = {
    fontSize: 13,
    color: C.textSecondary,
    fontWeight: 500,
    margin: '0 0 8px',
  }

  const summaryValueStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const iconBoxStyle = (bg: string): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: bg + '15',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  })

  const sectionStyle: React.CSSProperties = {
    marginBottom: 24,
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: C.text,
    margin: '0 0 12px',
  }

  const tableCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `1px solid ${C.border}`,
    backgroundColor: '#f8fafc',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 14,
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
  }

  const badgeStyle = (bgColor: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    color: bgColor,
    backgroundColor: bgColor + '15',
  })

  const stockBarContainerStyle: React.CSSProperties = {
    width: 80,
    height: 6,
    backgroundColor: C.border,
    borderRadius: 3,
    overflow: 'hidden',
    display: 'inline-block',
    verticalAlign: 'middle',
    marginLeft: 8,
  }

  const stockBarFillStyle = (width: number, color: string): React.CSSProperties => ({
    width: `${width}%`,
    height: '100%',
    backgroundColor: color,
    borderRadius: 3,
    transition: 'width 0.3s',
  })

  // Modal form styles
  const formFieldStyle: React.CSSProperties = { marginBottom: 16 }
  const formLabelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 6 }
  const formInputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }
  const formSelectStyle: React.CSSProperties = { ...formInputStyle, cursor: 'pointer', backgroundColor: C.card }
  const formBtnRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }
  const cancelBtnStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: '#ffffff', color: C.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }
  const saveBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: C.primary, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }

  const moveTypeTilesStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    marginBottom: 0,
  }

  const moveTypeTileStyle = (isActive: boolean, color: string): React.CSSProperties => ({
    padding: '10px 12px',
    borderRadius: 8,
    border: `2px solid ${isActive ? color : C.border}`,
    backgroundColor: isActive ? color + '10' : '#ffffff',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s',
    fontSize: 13,
    fontWeight: 600,
    color: isActive ? color : C.textSecondary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  })

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Gestion du Stock</h1>
        <button style={addBtnStyle} onClick={openAdjustModal}>
          <Plus size={16} /> Ajustement de stock
        </button>
      </div>

      {/* Summary Cards */}
      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <div style={iconBoxStyle('#8b5cf6')}>
            <Package size={20} color="#8b5cf6" />
          </div>
          <p style={summaryLabelStyle}>Total produits</p>
          <p style={summaryValueStyle}>{products.length}</p>
        </div>
        <div style={summaryCardStyle}>
          <div style={iconBoxStyle(C.warning)}>
            <AlertTriangle size={20} color={C.warning} />
          </div>
          <p style={summaryLabelStyle}>Alertes stock faible</p>
          <p style={{ ...summaryValueStyle, color: lowStockProducts.length > 0 ? C.warning : C.text }}>
            {lowStockProducts.length}
          </p>
        </div>
        <div style={summaryCardStyle}>
          <div style={iconBoxStyle(C.danger)}>
            <XCircle size={20} color={C.danger} />
          </div>
          <p style={summaryLabelStyle}>Rupture de stock</p>
          <p style={{ ...summaryValueStyle, color: outOfStockProducts.length > 0 ? C.danger : C.text }}>
            {outOfStockProducts.length}
          </p>
        </div>
      </div>

      {/* Stock Table */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Inventaire des produits</h3>
        <div style={tableCardStyle}>
          {products.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: C.textSecondary }}>
              <Package size={40} color={C.border} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, margin: 0 }}>Aucun produit en stock</p>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Produit</th>
                  <th style={thStyle}>Categorie</th>
                  <th style={thStyle}>Stock actuel</th>
                  <th style={thStyle}>Seuil min.</th>
                  <th style={thStyle}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const status = getStockStatus(product)
                  const barWidth = getStockBarWidth(product)
                  return (
                    <tr key={product.id}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{product.name}</td>
                      <td style={tdStyle}>
                        <span style={badgeStyle('#8b5cf6')}>{product.category}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: status.color }}>{product.stock}</span>
                        <div style={stockBarContainerStyle}>
                          <div style={stockBarFillStyle(barWidth, status.color)} />
                        </div>
                      </td>
                      <td style={tdStyle}>{product.min_stock ?? MIN_STOCK_THRESHOLD}</td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(status.color)}>{status.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Stock Movement History */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Historique des mouvements</h3>
        <div style={tableCardStyle}>
          {movesLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.textSecondary }}>
              Chargement...
            </div>
          ) : stockMoves.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.textSecondary }}>
              <RefreshCw size={32} color={C.border} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, margin: 0 }}>Aucun mouvement de stock enregistre</p>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Produit</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Quantite</th>
                  <th style={thStyle}>Raison</th>
                </tr>
              </thead>
              <tbody>
                {stockMoves.map((move) => {
                  const product = products.find((p) => p.id === move.product_id)
                  return (
                    <tr key={move.id}>
                      <td style={tdStyle}>{formatDateTime(move.created_at)}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>
                        {product?.name || move.product_id.slice(0, 8)}
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(moveTypeColors[move.type] || C.textSecondary)}>
                          {moveTypeLabels[move.type] || move.type}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: move.qty >= 0 ? C.success : C.danger }}>
                        {move.qty >= 0 ? `+${move.qty}` : move.qty}
                      </td>
                      <td style={{ ...tdStyle, color: C.textSecondary }}>{move.reason || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Adjustment Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title="Ajustement de stock"
        size="md"
      >
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>Produit</label>
          <select
            style={formSelectStyle}
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Selectionner un produit</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Stock: {p.stock})
              </option>
            ))}
          </select>
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>Type de mouvement</label>
          <div style={moveTypeTilesStyle}>
            <div
              style={moveTypeTileStyle(moveType === 'in', C.success)}
              onClick={() => setMoveType('in')}
            >
              <ArrowDownCircle size={18} />
              Entree
            </div>
            <div
              style={moveTypeTileStyle(moveType === 'out', C.danger)}
              onClick={() => setMoveType('out')}
            >
              <ArrowUpCircle size={18} />
              Sortie
            </div>
            <div
              style={moveTypeTileStyle(moveType === 'adjust', C.warning)}
              onClick={() => setMoveType('adjust')}
            >
              <RefreshCw size={18} />
              Ajuster
            </div>
          </div>
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>
            {moveType === 'adjust' ? 'Nouveau stock' : 'Quantite'}
          </label>
          <input
            style={formInputStyle}
            type="number"
            placeholder="0"
            value={moveQty}
            onChange={(e) => setMoveQty(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            min={0}
          />
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>Raison (optionnel)</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder="Ex: Livraison fournisseur, Inventaire..."
            value={moveReason}
            onChange={(e) => setMoveReason(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>

        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowAdjustModal(false)}>
            Annuler
          </button>
          <button
            style={saveBtnStyle}
            onClick={handleAdjust}
            disabled={saving || !selectedProductId || !moveQty}
          >
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
