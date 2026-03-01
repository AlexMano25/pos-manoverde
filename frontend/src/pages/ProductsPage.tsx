import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Package,
  Loader2,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
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

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

// ── Blank product form state ─────────────────────────────────────────────

interface ProductForm {
  name: string
  price: string
  cost: string
  stock: string
  category: string
  sku: string
  barcode: string
}

const emptyForm: ProductForm = {
  name: '',
  price: '',
  cost: '',
  stock: '',
  category: '',
  sku: '',
  barcode: '',
}

// ── Component ────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { products, categories, loading, loadProducts, addProduct, updateProduct, deleteProduct } = useProductStore()
  const { currentStore } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

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

  const openAddModal = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      price: String(product.price),
      cost: String(product.cost ?? ''),
      stock: String(product.stock),
      category: product.category,
      sku: product.sku || '',
      barcode: product.barcode || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product)
    setShowDeleteModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Le nom est requis')
      return
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      setFormError('Le prix doit etre superieur a 0')
      return
    }
    if (!currentStore) return

    setSaving(true)
    setFormError('')

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: form.name.trim(),
          price: parseFloat(form.price),
          cost: form.cost ? parseFloat(form.cost) : undefined,
          stock: parseInt(form.stock) || 0,
          category: form.category.trim() || 'General',
          sku: form.sku.trim() || undefined,
          barcode: form.barcode.trim() || undefined,
        })
      } else {
        const now = new Date().toISOString()
        const newProduct: Product = {
          id: crypto.randomUUID(),
          store_id: currentStore.id,
          name: form.name.trim(),
          price: parseFloat(form.price),
          cost: form.cost ? parseFloat(form.cost) : undefined,
          stock: parseInt(form.stock) || 0,
          category: form.category.trim() || 'General',
          sku: form.sku.trim() || undefined,
          barcode: form.barcode.trim() || undefined,
          is_active: true,
          created_at: now,
          updated_at: now,
        }
        await addProduct(newProduct)
      }
      setShowModal(false)
      setForm(emptyForm)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    try {
      await deleteProduct(deletingProduct.id)
      setShowDeleteModal(false)
      setDeletingProduct(null)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const updateField = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFormError('')
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
    marginBottom: 20,
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

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    alignItems: 'center',
  }

  const searchBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 8,
    padding: '0 12px',
    border: `1px solid ${C.border}`,
    flex: 1,
    maxWidth: 400,
  }

  const searchInputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '10px 0',
    fontSize: 14,
    color: C.text,
    backgroundColor: 'transparent',
  }

  const filterSelectStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.card,
    outline: 'none',
    cursor: 'pointer',
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

  const lowStockTd: React.CSSProperties = {
    ...tdStyle,
    color: C.danger,
    fontWeight: 600,
  }

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color,
    padding: 6,
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s',
  })

  const badgeStyle = (bgColor: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    color: bgColor,
    backgroundColor: bgColor + '15',
  })

  // Form styles
  const formFieldStyle: React.CSSProperties = {
    marginBottom: 16,
  }

  const formLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    marginBottom: 6,
  }

  const formInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const formRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  }

  const formErrorStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    color: C.danger,
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 12,
  }

  const formBtnRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  }

  const cancelBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    backgroundColor: '#ffffff',
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  }

  const saveBtnStyle: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.primary,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: saving ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    opacity: saving ? 0.7 : 1,
  }

  const deleteModalBtnRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  }

  const deleteBtnStyle: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.danger,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  }

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textSecondary, fontSize: 16 }}>Chargement des produits...</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Produits</h1>
        <button style={addBtnStyle} onClick={openAddModal}>
          <Plus size={16} /> Ajouter un produit
        </button>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={searchBarStyle}>
          <Search size={16} color={C.textSecondary} />
          <input
            style={searchInputStyle}
            type="text"
            placeholder="Rechercher par nom, SKU ou code-barres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 2, display: 'flex' }}
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          style={filterSelectStyle}
          value={selectedCategory ?? ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
        >
          <option value="">Toutes categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={tableCardStyle}>
        {filteredProducts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.textSecondary }}>
            <Package size={40} color={C.border} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>Aucun produit trouve</p>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Nom / SKU</th>
                <th style={thStyle}>Categorie</th>
                <th style={thStyle}>Prix</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Statut</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= (product.min_stock ?? 5)
                return (
                  <tr key={product.id}>
                    <td style={tdStyle}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{product.name}</span>
                        {product.sku && (
                          <span style={{ display: 'block', fontSize: 12, color: C.textSecondary, fontFamily: 'monospace' }}>
                            {product.sku}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={badgeStyle('#8b5cf6')}>{product.category}</span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{formatFCFA(product.price)}</td>
                    <td style={isLowStock ? lowStockTd : tdStyle}>
                      {product.stock}
                      {isLowStock && product.stock > 0 && (
                        <span style={{ fontSize: 11, marginLeft: 6 }}>(faible)</span>
                      )}
                      {product.stock === 0 && (
                        <span style={{ fontSize: 11, marginLeft: 6 }}>(rupture)</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(product.is_active ? C.success : C.textSecondary)}>
                        {product.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        style={actionBtnStyle(C.primary)}
                        onClick={() => openEditModal(product)}
                        title="Modifier"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primary + '10')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        style={actionBtnStyle(C.danger)}
                        onClick={() => openDeleteModal(product)}
                        title="Supprimer"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.danger + '10')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
        size="md"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>Nom du produit *</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder="Ex: Coca-Cola 33cl"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            autoFocus
          />
        </div>

        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>Prix de vente (FCFA) *</label>
            <input
              style={formInputStyle}
              type="number"
              placeholder="0"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
              min={0}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>Prix d'achat (FCFA)</label>
            <input
              style={formInputStyle}
              type="number"
              placeholder="0"
              value={form.cost}
              onChange={(e) => updateField('cost', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
              min={0}
            />
          </div>
        </div>

        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>Stock initial</label>
            <input
              style={formInputStyle}
              type="number"
              placeholder="0"
              value={form.stock}
              onChange={(e) => updateField('stock', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
              min={0}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>Categorie</label>
            <input
              style={formInputStyle}
              type="text"
              placeholder="Ex: Boissons"
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
        </div>

        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>SKU</label>
            <input
              style={formInputStyle}
              type="text"
              placeholder="Ex: COCA-33CL"
              value={form.sku}
              onChange={(e) => updateField('sku', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>Code-barres</label>
            <input
              style={formInputStyle}
              type="text"
              placeholder="Ex: 5449000000996"
              value={form.barcode}
              onChange={(e) => updateField('barcode', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>
        </div>

        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowModal(false)}>
            Annuler
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? 'Sauvegarde...' : editingProduct ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 8px' }}>
          Etes-vous sur de vouloir supprimer le produit <strong>{deletingProduct?.name}</strong> ?
        </p>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
          Cette action est irreversible.
        </p>
        <div style={deleteModalBtnRow}>
          <button style={cancelBtnStyle} onClick={() => setShowDeleteModal(false)}>
            Annuler
          </button>
          <button style={deleteBtnStyle} onClick={handleDelete}>
            <Trash2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Supprimer
          </button>
        </div>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
