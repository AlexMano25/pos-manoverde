import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Package,
  Loader2,
  FileText,
  BarChart3,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import ImageUpload from '../components/common/ImageUpload'
import BarcodeDisplay from '../components/common/BarcodeDisplay'
import ExportMenu from '../components/common/ExportMenu'
import type { ExportMenuItem } from '../components/common/ExportMenu'
import { exportProductsCatalog, exportBarcodesSheet, exportInventoryReport } from '../utils/pdfExport'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import type { Product } from '../types'
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

// ── Blank product form state ─────────────────────────────────────────────

interface ProductForm {
  name: string
  price: string
  cost: string
  stock: string
  category: string
  sku: string
  barcode: string
  imageUrl: string
}

const emptyForm: ProductForm = {
  name: '',
  price: '',
  cost: '',
  stock: '',
  category: '',
  sku: '',
  barcode: '',
  imageUrl: '',
}

// ── Component ────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { products, categories, loading, loadProducts, addProduct, updateProduct, deleteProduct } = useProductStore()
  const { currentStore } = useAppStore()
  const { t, language } = useLanguageStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  function formatFCFA(amount: number): string {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : language === 'ar' ? 'ar-SA' : 'en-US').format(amount) + ' FCFA'
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
      imageUrl: product.image_url || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product)
    setShowDeleteModal(true)
  }

  const handleGenerateBarcode = () => {
    const prefix = (currentStore?.activity?.slice(0, 3).toUpperCase() || 'POS')
    const barcode = prefix + '-' + Date.now().toString(36).toUpperCase()
    updateField('barcode', barcode)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(t.products.productName + ' - ' + t.common.required)
      return
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      setFormError(t.common.price + ' - ' + t.common.required)
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
          image_url: form.imageUrl || undefined,
        })
      } else {
        const now = new Date().toISOString()
        const newProduct: Product = {
          id: generateUUID(),
          store_id: currentStore.id,
          name: form.name.trim(),
          price: parseFloat(form.price),
          cost: form.cost ? parseFloat(form.cost) : undefined,
          stock: parseInt(form.stock) || 0,
          category: form.category.trim() || 'General',
          sku: form.sku.trim() || undefined,
          barcode: form.barcode.trim() || undefined,
          image_url: form.imageUrl || undefined,
          is_active: true,
          created_at: now,
          updated_at: now,
        }
        await addProduct(newProduct)
      }
      setShowModal(false)
      setForm(emptyForm)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.common.error)
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

  // ── Export menu items ─────────────────────────────────────────────────

  const storeName = currentStore?.name || 'POS'

  const exportItems: ExportMenuItem[] = [
    {
      label: t.products.title + ' - PDF',
      icon: <FileText size={14} color={C.textSecondary} />,
      onClick: () => exportProductsCatalog(products, storeName, {
        name: t.common.name,
        category: t.common.category,
        price: t.common.price,
        stock: t.products.stock,
        sku: t.products.sku,
      }),
    },
    {
      label: t.products.barcode + ' - PDF',
      icon: <FileText size={14} color={C.textSecondary} />,
      onClick: () => exportBarcodesSheet(products, storeName),
    },
    {
      label: t.stock?.inventoryReport || 'Inventory Report',
      icon: <BarChart3 size={14} color={C.textSecondary} />,
      onClick: () => exportInventoryReport(products, storeName, {
        product: t.common.name,
        category: t.common.category,
        stock: t.products.stock,
        minStock: t.products.minStock,
        status: t.common.status,
        price: t.common.price,
        value: t.common.total,
      }),
      divider: true,
    },
  ]

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

  const headerActionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
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

  const thumbnailStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 8,
    objectFit: 'cover',
    border: `1px solid ${C.border}`,
  }

  const thumbnailPlaceholderStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    backgroundColor: C.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

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

  const generateBarcodeBtnStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${C.primary}30`,
    backgroundColor: C.primary + '10',
    color: C.primary,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  }

  const barcodePreviewStyle: React.CSSProperties = {
    marginTop: 8,
    padding: 12,
    backgroundColor: C.bg,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    textAlign: 'center',
  }

  const barcodePreviewLabelStyle: React.CSSProperties = {
    fontSize: 11,
    color: C.textSecondary,
    marginBottom: 6,
    fontWeight: 500,
  }

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textSecondary, fontSize: 16 }}>{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>{t.products.title}</h1>
        <div style={headerActionsStyle}>
          <ExportMenu items={exportItems} label={t.common.exportPDF} />
          <button style={addBtnStyle} onClick={openAddModal}>
            <Plus size={16} /> {t.products.addProduct}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={searchBarStyle}>
          <Search size={16} color={C.textSecondary} />
          <input
            style={searchInputStyle}
            type="text"
            placeholder={t.common.search + '...'}
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
          <option value="">{t.common.all} - {t.common.category}</option>
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
            <p style={{ fontSize: 14, margin: 0 }}>{t.products.noProducts}</p>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 56, padding: '10px 8px 10px 16px' }}></th>
                <th style={thStyle}>{t.common.name} / {t.products.sku}</th>
                <th style={thStyle}>{t.common.category}</th>
                <th style={thStyle}>{t.common.price}</th>
                <th style={thStyle}>{t.products.stock}</th>
                <th style={thStyle}>{t.common.status}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= (product.min_stock ?? 5)
                return (
                  <tr key={product.id}>
                    <td style={{ ...tdStyle, width: 56, padding: '8px 8px 8px 16px' }}>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          style={thumbnailStyle}
                        />
                      ) : (
                        <div style={thumbnailPlaceholderStyle}>
                          <Package size={18} color={C.border} />
                        </div>
                      )}
                    </td>
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
                        <span style={{ fontSize: 11, marginLeft: 6 }}>({t.products.lowStockAlert})</span>
                      )}
                      {product.stock === 0 && (
                        <span style={{ fontSize: 11, marginLeft: 6 }}>({t.products.outOfStockLabel})</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(product.is_active ? C.success : C.textSecondary)}>
                        {product.is_active ? t.common.active : t.common.inactive}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        style={actionBtnStyle(C.primary)}
                        onClick={() => openEditModal(product)}
                        title={t.common.edit}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primary + '10')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        style={actionBtnStyle(C.danger)}
                        onClick={() => openDeleteModal(product)}
                        title={t.common.delete}
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
        title={editingProduct ? t.products.editProduct : t.products.addProduct}
        size="md"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        {/* Image Upload */}
        <div style={{ ...formFieldStyle, textAlign: 'center' }}>
          <ImageUpload
            value={form.imageUrl || undefined}
            onChange={(dataUrl) => updateField('imageUrl', dataUrl || '')}
            uploadLabel={t.products.imageUpload}
            cameraLabel={t.products.takePhoto}
            removeLabel={t.products.removeImage}
          />
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{t.products.productName} *</label>
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
            <label style={formLabelStyle}>{t.products.priceLabel} (FCFA) *</label>
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
            <label style={formLabelStyle}>{t.products.cost} (FCFA)</label>
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
            <label style={formLabelStyle}>{t.products.initialStock}</label>
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
            <label style={formLabelStyle}>{t.common.category}</label>
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
            <label style={formLabelStyle}>{t.products.sku}</label>
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
            <label style={formLabelStyle}>{t.products.barcode}</label>
            <input
              style={formInputStyle}
              type="text"
              placeholder="Ex: 5449000000996"
              value={form.barcode}
              onChange={(e) => updateField('barcode', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
            <button
              type="button"
              style={generateBarcodeBtnStyle}
              onClick={handleGenerateBarcode}
            >
              <Package size={12} />
              {t.products.generateBarcode}
            </button>

            {/* Barcode preview */}
            {form.barcode.trim() && (
              <div style={barcodePreviewStyle}>
                <div style={barcodePreviewLabelStyle}>{t.products.barcodePreview}</div>
                <BarcodeDisplay value={form.barcode.trim()} height={50} width={1.5} />
              </div>
            )}
          </div>
        </div>

        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowModal(false)}>
            {t.common.cancel}
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? t.common.loading : editingProduct ? t.common.edit : t.common.add}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t.products.deleteConfirm}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 8px' }}>
          {t.products.deleteMessage}
        </p>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
          <strong>{deletingProduct?.name}</strong>
        </p>
        <div style={deleteModalBtnRow}>
          <button style={cancelBtnStyle} onClick={() => setShowDeleteModal(false)}>
            {t.common.cancel}
          </button>
          <button style={deleteBtnStyle} onClick={handleDelete}>
            <Trash2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t.common.delete}
          </button>
        </div>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
