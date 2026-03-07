import { useState, useEffect, useMemo } from 'react'
import {
  Truck,
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  Package,
  Check,
  X,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useSupplierStore } from '../stores/supplierStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { Supplier, PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#0891b2',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
} as const

// ── PO Status config ────────────────────────────────────────────────────

const PO_STATUS_CONFIG: Record<PurchaseOrderStatus, { color: string; bg: string; label: string }> = {
  draft:     { color: '#94a3b8', bg: '#f1f5f9', label: 'Brouillon' },
  sent:      { color: '#3b82f6', bg: '#eff6ff', label: 'Envoy\u00e9' },
  partial:   { color: '#f59e0b', bg: '#fffbeb', label: 'Partiel' },
  received:  { color: '#16a34a', bg: '#f0fdf4', label: 'Re\u00e7u' },
  cancelled: { color: '#ef4444', bg: '#fef2f2', label: 'Annul\u00e9' },
}

const PO_FILTER_TABS: Array<{ key: PurchaseOrderStatus | 'all'; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'draft', label: 'Brouillon' },
  { key: 'sent', label: 'Envoy\u00e9' },
  { key: 'partial', label: 'Partiel' },
  { key: 'received', label: 'Re\u00e7u' },
  { key: 'cancelled', label: 'Annul\u00e9' },
]

// ── Form types ──────────────────────────────────────────────────────────

interface SupplierForm {
  name: string
  contact_name: string
  email: string
  phone: string
  address: string
  category: string
  payment_terms: string
  notes: string
  is_active: boolean
}

const emptySupplierForm: SupplierForm = {
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  address: '',
  category: '',
  payment_terms: '',
  notes: '',
  is_active: true,
}

interface POForm {
  supplier_id: string
  supplier_name: string
  items: PurchaseOrderItem[]
  tax: number
  expected_delivery: string
  notes: string
}

const emptyPoItem: PurchaseOrderItem = {
  description: '',
  quantity: 1,
  received_quantity: 0,
  unit_cost: 0,
  total: 0,
}

const emptyPOForm: POForm = {
  supplier_id: '',
  supplier_name: '',
  items: [{ ...emptyPoItem }],
  tax: 0,
  expected_delivery: '',
  notes: '',
}

// ── Component ────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    suppliers,
    purchaseOrders,
    loading,
    loadSuppliers,
    loadPurchaseOrders,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    sendPurchaseOrder,
    receiveGoods,
    cancelPurchaseOrder,
  } = useSupplierStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'

  // i18n
  const label = (t as Record<string, any>).suppliers || {}

  const L = {
    title: label.title || 'Fournisseurs & Commandes',
    suppliersTab: label.suppliersTab || 'Fournisseurs',
    purchaseOrdersTab: label.purchaseOrdersTab || 'Bons de Commande',
    addSupplier: label.addSupplier || 'Nouveau Fournisseur',
    editSupplier: label.editSupplier || 'Modifier Fournisseur',
    addPO: label.addPO || 'Nouveau Bon',
    editPO: label.editPO || 'Modifier Bon',
    searchSuppliers: label.searchSuppliers || 'Rechercher un fournisseur...',
    searchPO: label.searchPO || 'Rechercher par n\u00b0, fournisseur...',
    name: label.name || 'Nom',
    contactName: label.contactName || 'Personne de contact',
    email: label.email || 'Email',
    phone: label.phone || 'T\u00e9l\u00e9phone',
    address: label.address || 'Adresse',
    category: label.category || 'Cat\u00e9gorie',
    paymentTerms: label.paymentTerms || 'Conditions de paiement',
    notes: label.notes || 'Notes',
    active: label.active || 'Actif',
    inactive: label.inactive || 'Inactif',
    supplier: label.supplier || 'Fournisseur',
    selectSupplier: label.selectSupplier || 'S\u00e9lectionner un fournisseur',
    items: label.items || 'Articles',
    description: label.description || 'Description',
    qty: label.qty || 'Qt\u00e9',
    unitCost: label.unitCost || 'Co\u00fbt unit.',
    total: label.total || 'Total',
    addLine: label.addLine || '+ Ajouter une ligne',
    subtotal: label.subtotal || 'Sous-total',
    tax: label.tax || 'Taxes',
    grandTotal: label.grandTotal || 'Total TTC',
    expectedDelivery: label.expectedDelivery || 'Livraison pr\u00e9vue',
    save: label.save || 'Enregistrer',
    cancel: label.cancel || 'Annuler',
    delete: label.delete || 'Supprimer',
    confirmDelete: label.confirmDelete || '\u00cates-vous s\u00fbr de vouloir supprimer ?',
    confirmDeleteSupplier: label.confirmDeleteSupplier || 'Supprimer ce fournisseur ?',
    confirmDeletePO: label.confirmDeletePO || 'Supprimer ce bon de commande ?',
    noSuppliers: label.noSuppliers || 'Aucun fournisseur',
    noPOs: label.noPOs || 'Aucun bon de commande',
    noResults: label.noResults || 'Aucun r\u00e9sultat',
    send: label.send || 'Envoyer',
    receiveGoods: label.receiveGoods || 'R\u00e9ceptionner',
    cancelPO: label.cancelPO || 'Annuler',
    receiveGoodsTitle: label.receiveGoodsTitle || 'R\u00e9ception de marchandises',
    ordered: label.ordered || 'Command\u00e9',
    alreadyReceived: label.alreadyReceived || 'D\u00e9j\u00e0 re\u00e7u',
    newReceived: label.newReceived || 'Nouvelle qt\u00e9',
    confirm: label.confirm || 'Confirmer',
    all: label.all || 'Tous',
  }

  // ── Local state ─────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchase_orders'>('suppliers')
  const [searchQuery, setSearchQuery] = useState('')
  const [poStatusFilter, setPoStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all')

  // Supplier modals
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(emptySupplierForm)
  const [showDeleteSupplierModal, setShowDeleteSupplierModal] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)

  // PO modals
  const [showPOModal, setShowPOModal] = useState(false)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [poForm, setPOForm] = useState<POForm>(emptyPOForm)
  const [showDeletePOModal, setShowDeletePOModal] = useState(false)
  const [poToDelete, setPOToDelete] = useState<PurchaseOrder | null>(null)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [receivePO, setReceivePO] = useState<PurchaseOrder | null>(null)
  const [receiveQtys, setReceiveQtys] = useState<number[]>([])

  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Load data on mount ─────────────────────────────────────────────

  useEffect(() => {
    loadSuppliers(storeId)
    loadPurchaseOrders(storeId)
  }, [storeId, loadSuppliers, loadPurchaseOrders])

  // ── Filtered suppliers ────────────────────────────────────────────

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers
    const sq = searchQuery.toLowerCase()
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(sq) ||
      (s.contact_name || '').toLowerCase().includes(sq) ||
      (s.email || '').toLowerCase().includes(sq) ||
      (s.phone || '').includes(sq) ||
      (s.category || '').toLowerCase().includes(sq)
    )
  }, [suppliers, searchQuery])

  // ── Filtered POs ──────────────────────────────────────────────────

  const filteredPOs = useMemo(() => {
    let result = purchaseOrders
    if (poStatusFilter !== 'all') {
      result = result.filter((po) => po.status === poStatusFilter)
    }
    if (searchQuery.trim()) {
      const sq = searchQuery.toLowerCase()
      result = result.filter((po) =>
        po.po_number.toLowerCase().includes(sq) ||
        po.supplier_name.toLowerCase().includes(sq)
      )
    }
    return result
  }, [purchaseOrders, poStatusFilter, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────

  const activeSupplierCount = useMemo(() =>
    suppliers.filter((s) => s.is_active).length,
  [suppliers])

  const pendingPOCount = useMemo(() =>
    purchaseOrders.filter((po) => po.status === 'draft' || po.status === 'sent' || po.status === 'partial').length,
  [purchaseOrders])

  // ── Compute PO form totals ────────────────────────────────────────

  const computePOTotals = () => {
    let subtotal = 0
    for (const item of poForm.items) {
      subtotal += item.quantity * item.unit_cost
    }
    const taxAmount = poForm.tax || 0
    const grandTotal = subtotal + taxAmount
    return { subtotal, taxAmount, grandTotal }
  }

  const poTotals = computePOTotals()

  // ── Supplier handlers ─────────────────────────────────────────────

  const openAddSupplier = () => {
    setEditingSupplier(null)
    setSupplierForm(emptySupplierForm)
    setFormError('')
    setShowSupplierModal(true)
  }

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setSupplierForm({
      name: supplier.name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      category: supplier.category || '',
      payment_terms: supplier.payment_terms || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active,
    })
    setFormError('')
    setShowSupplierModal(true)
  }

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      setFormError(L.name + ' required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          name: supplierForm.name.trim(),
          contact_name: supplierForm.contact_name.trim() || undefined,
          email: supplierForm.email.trim() || undefined,
          phone: supplierForm.phone.trim() || undefined,
          address: supplierForm.address.trim() || undefined,
          category: supplierForm.category.trim() || undefined,
          payment_terms: supplierForm.payment_terms.trim() || undefined,
          notes: supplierForm.notes.trim() || undefined,
          is_active: supplierForm.is_active,
        })
      } else {
        await addSupplier(storeId, {
          name: supplierForm.name.trim(),
          contact_name: supplierForm.contact_name.trim() || undefined,
          email: supplierForm.email.trim() || undefined,
          phone: supplierForm.phone.trim() || undefined,
          address: supplierForm.address.trim() || undefined,
          category: supplierForm.category.trim() || undefined,
          payment_terms: supplierForm.payment_terms.trim() || undefined,
          notes: supplierForm.notes.trim() || undefined,
          is_active: supplierForm.is_active,
        })
      }
      setShowSupplierModal(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier)
    setShowDeleteSupplierModal(true)
  }

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return
    await deleteSupplier(supplierToDelete.id)
    setShowDeleteSupplierModal(false)
    setSupplierToDelete(null)
  }

  // ── PO handlers ───────────────────────────────────────────────────

  const openAddPO = () => {
    setEditingPO(null)
    const defaultDelivery = new Date()
    defaultDelivery.setDate(defaultDelivery.getDate() + 14)
    setPOForm({
      ...emptyPOForm,
      expected_delivery: defaultDelivery.toISOString().slice(0, 10),
      items: [{ ...emptyPoItem }],
    })
    setFormError('')
    setShowPOModal(true)
  }

  const openEditPO = (po: PurchaseOrder) => {
    setEditingPO(po)
    setPOForm({
      supplier_id: po.supplier_id,
      supplier_name: po.supplier_name,
      items: po.items.length > 0 ? [...po.items] : [{ ...emptyPoItem }],
      tax: po.tax,
      expected_delivery: po.expected_delivery || '',
      notes: po.notes || '',
    })
    setFormError('')
    setShowPOModal(true)
  }

  const handlePOItemChange = (idx: number, field: keyof PurchaseOrderItem, value: string | number) => {
    setPOForm((prev) => {
      const items = [...prev.items]
      const item = { ...items[idx] }

      if (field === 'description') {
        item.description = value as string
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0
        item.total = item.quantity * item.unit_cost
      } else if (field === 'unit_cost') {
        item.unit_cost = Number(value) || 0
        item.total = item.quantity * item.unit_cost
      }

      items[idx] = item
      return { ...prev, items }
    })
  }

  const handleAddPOLine = () => {
    setPOForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyPoItem }],
    }))
  }

  const handleRemovePOLine = (idx: number) => {
    setPOForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }))
  }

  const handleSavePO = async () => {
    if (!poForm.supplier_id) {
      setFormError(L.supplier + ' required')
      return
    }
    if (poForm.items.length === 0 || !poForm.items.some((it) => it.description.trim())) {
      setFormError(L.items + ' required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const items = poForm.items.map((item) => ({
        ...item,
        total: item.quantity * item.unit_cost,
      }))
      const totals = computePOTotals()

      if (editingPO) {
        await updatePurchaseOrder(editingPO.id, {
          supplier_id: poForm.supplier_id,
          supplier_name: poForm.supplier_name,
          items,
          subtotal: totals.subtotal,
          tax: totals.taxAmount,
          total: totals.grandTotal,
          expected_delivery: poForm.expected_delivery || undefined,
          notes: poForm.notes.trim() || undefined,
        })
      } else {
        await addPurchaseOrder(storeId, {
          supplier_id: poForm.supplier_id,
          supplier_name: poForm.supplier_name,
          items,
          subtotal: totals.subtotal,
          tax: totals.taxAmount,
          total: totals.grandTotal,
          status: 'draft',
          expected_delivery: poForm.expected_delivery || undefined,
          notes: poForm.notes.trim() || undefined,
        })
      }
      setShowPOModal(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const confirmDeletePO = (po: PurchaseOrder) => {
    setPOToDelete(po)
    setShowDeletePOModal(true)
  }

  const handleDeletePO = async () => {
    if (!poToDelete) return
    await deletePurchaseOrder(poToDelete.id)
    setShowDeletePOModal(false)
    setPOToDelete(null)
  }

  const handleSendPO = async (po: PurchaseOrder) => {
    await sendPurchaseOrder(po.id)
  }

  const handleCancelPO = async (po: PurchaseOrder) => {
    await cancelPurchaseOrder(po.id)
  }

  const openReceiveModal = (po: PurchaseOrder) => {
    setReceivePO(po)
    setReceiveQtys(po.items.map(() => 0))
    setShowReceiveModal(true)
  }

  const handleReceiveGoods = async () => {
    if (!receivePO) return
    const receivedItems = receiveQtys
      .map((qty, index) => ({ index, received_quantity: qty }))
      .filter((ri) => ri.received_quantity > 0)

    if (receivedItems.length === 0) return

    await receiveGoods(receivePO.id, receivedItems)
    setShowReceiveModal(false)
    setReceivePO(null)
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  // ── Styles ────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(12, 20, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 12 : 0,
    marginBottom: 20,
    padding: rv(16, 20, 24),
    background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    borderRadius: 16,
    color: '#ffffff',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 24, 28),
    fontWeight: 700,
    margin: 0,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const statBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    marginRight: 8,
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 12,
    border: '2px solid rgba(255,255,255,0.4)',
    background: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backdropFilter: 'blur(4px)',
    whiteSpace: 'nowrap',
  }

  const mainTabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 0,
    marginBottom: 16,
    borderBottom: `2px solid ${C.border}`,
  }

  const mainTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    borderBottom: isActive ? `3px solid ${C.primary}` : '3px solid transparent',
    color: isActive ? C.primary : C.textSecondary,
    background: 'none',
    border: 'none',
    borderBottomWidth: 3,
    borderBottomStyle: 'solid',
    borderBottomColor: isActive ? C.primary : 'transparent',
    marginBottom: -2,
    transition: 'all 0.15s',
  })

  const filterTabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    padding: '8px 0',
    marginBottom: 16,
  }

  const filterTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '7px 16px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    backgroundColor: isActive ? C.primary : '#f8fafc',
    color: isActive ? '#ffffff' : C.textSecondary,
    border: isActive ? 'none' : `1px solid ${C.border}`,
    transition: 'all 0.15s',
  })

  const searchContainerStyle: React.CSSProperties = {
    marginBottom: 16,
    position: 'relative',
  }

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px 12px 44px',
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.card,
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  }

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: C.textSecondary,
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: rv(12, 16, 20),
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    padding: rv(14, 16, 20),
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }

  const poNumStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: C.text,
    fontFamily: '"SF Mono", "Fira Code", monospace',
  }

  const statusBadge = (status: PurchaseOrderStatus): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 10,
    backgroundColor: PO_STATUS_CONFIG[status].bg,
    color: PO_STATUS_CONFIG[status].color,
  })

  const activeBadge = (isActive: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 10,
    backgroundColor: isActive ? '#f0fdf4' : '#fef2f2',
    color: isActive ? '#16a34a' : '#ef4444',
  })

  const formFieldStyle: React.CSSProperties = { marginBottom: 14 }
  const formLabelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 5,
  }
  const formInputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: `1px solid ${C.border}`, fontSize: 14, color: C.text,
    outline: 'none', boxSizing: 'border-box',
  }
  const formTextareaStyle: React.CSSProperties = {
    ...formInputStyle, minHeight: 70, resize: 'vertical' as const, fontFamily: 'inherit',
  }
  const formSelectStyle: React.CSSProperties = {
    ...formInputStyle, backgroundColor: C.card, cursor: 'pointer',
  }
  const formErrorStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2', color: C.danger, padding: '8px 12px',
    borderRadius: 8, fontSize: 13, marginBottom: 12,
  }
  const btnRowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16,
  }
  const cancelBtnStyle: React.CSSProperties = {
    padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`,
    backgroundColor: '#ffffff', color: C.textSecondary, fontSize: 14,
    fontWeight: 500, cursor: 'pointer',
  }
  const saveBtnStyle: React.CSSProperties = {
    padding: '10px 24px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    opacity: saving ? 0.7 : 1,
  }
  const actionBtnStyle = (color: string): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 10, border: 'none',
    backgroundColor: color, color: '#ffffff', fontSize: 13,
    fontWeight: 600, cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', gap: 4,
  })
  const smallBtnStyle = (color: string): React.CSSProperties => ({
    padding: '5px 10px', borderRadius: 8, border: 'none',
    backgroundColor: color + '15', color: color, fontSize: 12,
    fontWeight: 600, cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', gap: 3,
  })
  const dangerBtnStyle: React.CSSProperties = {
    padding: '10px 24px', borderRadius: 10, border: 'none',
    backgroundColor: C.danger, color: '#ffffff', fontSize: 14,
    fontWeight: 600, cursor: 'pointer',
  }

  // ── Render: Supplier cards ────────────────────────────────────────

  const renderSupplierCard = (supplier: Supplier) => (
    <div key={supplier.id} style={cardStyle} onClick={() => openEditSupplier(supplier)}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} style={{ color: C.primary }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{supplier.name}</span>
          </div>
          <span style={activeBadge(supplier.is_active)}>
            {supplier.is_active ? L.active : L.inactive}
          </span>
        </div>
        {supplier.contact_name && (
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>
            {supplier.contact_name}
          </div>
        )}
        {supplier.category && (
          <div style={{
            display: 'inline-flex', fontSize: 11, fontWeight: 600, padding: '2px 8px',
            borderRadius: 8, backgroundColor: C.primary + '15', color: C.primary, marginBottom: 8,
          }}>
            {supplier.category}
          </div>
        )}
      </div>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {supplier.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textSecondary }}>
              <Mail size={12} /> {supplier.email}
            </div>
          )}
          {supplier.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textSecondary }}>
              <Phone size={12} /> {supplier.phone}
            </div>
          )}
          {supplier.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textSecondary }}>
              <MapPin size={12} /> {supplier.address}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
          <button
            style={smallBtnStyle(C.primary)}
            onClick={() => openEditSupplier(supplier)}
          >
            <Edit size={12} /> {L.editSupplier.split(' ')[0]}
          </button>
          <button
            style={smallBtnStyle(C.danger)}
            onClick={() => confirmDeleteSupplier(supplier)}
          >
            <Trash2 size={12} /> {L.delete}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Render: PO cards ──────────────────────────────────────────────

  const renderPOCard = (po: PurchaseOrder) => (
    <div key={po.id} style={cardStyle} onClick={() => openEditPO(po)}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span style={poNumStyle}>{po.po_number}</span>
          <span style={statusBadge(po.status)}>{PO_STATUS_CONFIG[po.status].label}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>
          {po.supplier_name}
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
          {po.items.length} {L.items} &middot; {L.expectedDelivery}: {formatDate(po.expected_delivery)}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.primary, marginBottom: 8 }}>
          {formatCurrency(po.total, currency)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
          {po.status === 'draft' && (
            <>
              <button style={smallBtnStyle('#3b82f6')} onClick={() => handleSendPO(po)}>
                <Send size={12} /> {L.send}
              </button>
              <button style={smallBtnStyle(C.primary)} onClick={() => openEditPO(po)}>
                <Edit size={12} />
              </button>
              <button style={smallBtnStyle(C.danger)} onClick={() => confirmDeletePO(po)}>
                <Trash2 size={12} />
              </button>
            </>
          )}
          {(po.status === 'sent' || po.status === 'partial') && (
            <>
              <button style={smallBtnStyle(C.success)} onClick={() => openReceiveModal(po)}>
                <Package size={12} /> {L.receiveGoods}
              </button>
              <button style={smallBtnStyle(C.danger)} onClick={() => handleCancelPO(po)}>
                <X size={12} /> {L.cancelPO}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  // ── Render: PO line items editor ──────────────────────────────────

  const renderPOLineItems = () => (
    <div style={formFieldStyle}>
      <label style={formLabelStyle}>{L.items}</label>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 50px 70px 40px' : '1fr 70px 100px 100px 40px',
          gap: 0,
          padding: '8px 10px',
          backgroundColor: '#f8fafc',
          fontSize: 11,
          fontWeight: 600,
          color: C.textSecondary,
          textTransform: 'uppercase',
        }}>
          <span>{L.description}</span>
          <span>{L.qty}</span>
          {!isMobile && <span>{L.unitCost}</span>}
          <span style={{ textAlign: 'right' }}>{L.total}</span>
          <span />
        </div>
        {/* Rows */}
        {poForm.items.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 50px 70px 40px' : '1fr 70px 100px 100px 40px',
            gap: 0,
            padding: '6px 10px',
            borderTop: `1px solid ${C.border}`,
            alignItems: 'center',
          }}>
            <input
              value={item.description}
              onChange={(e) => handlePOItemChange(idx, 'description', e.target.value)}
              placeholder={L.description}
              style={{ ...formInputStyle, padding: '6px 8px', fontSize: 13 }}
            />
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => handlePOItemChange(idx, 'quantity', e.target.value)}
              style={{ ...formInputStyle, padding: '6px 4px', fontSize: 13, textAlign: 'center' }}
            />
            {!isMobile && (
              <input
                type="number"
                min={0}
                value={item.unit_cost}
                onChange={(e) => handlePOItemChange(idx, 'unit_cost', e.target.value)}
                style={{ ...formInputStyle, padding: '6px 4px', fontSize: 13, textAlign: 'right' }}
              />
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right', paddingRight: 4 }}>
              {formatCurrency(item.quantity * item.unit_cost, currency)}
            </span>
            <button
              type="button"
              onClick={() => handleRemovePOLine(idx)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.danger }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {/* Add line */}
        <div style={{ padding: '8px 10px', borderTop: `1px solid ${C.border}` }}>
          <button
            type="button"
            onClick={handleAddPOLine}
            style={{ background: 'none', border: 'none', color: C.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {L.addLine}
          </button>
        </div>
      </div>
      {/* Totals */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginTop: 10, fontSize: 13 }}>
        <span>{L.subtotal}: <strong>{formatCurrency(poTotals.subtotal, currency)}</strong></span>
        {poTotals.taxAmount > 0 && (
          <span>{L.tax}: <strong>{formatCurrency(poTotals.taxAmount, currency)}</strong></span>
        )}
        <span style={{ fontSize: 17, fontWeight: 700, color: C.primary, marginTop: 4 }}>
          {L.grandTotal}: {formatCurrency(poTotals.grandTotal, currency)}
        </span>
      </div>
    </div>
  )

  // ── Render: Empty states ──────────────────────────────────────────

  const renderEmptySuppliers = () => (
    <div style={{ textAlign: 'center', padding: 60, color: C.textSecondary }}>
      <Building2 size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
      <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
        {filteredSuppliers.length === 0 && suppliers.length > 0 ? L.noResults : L.noSuppliers}
      </p>
    </div>
  )

  const renderEmptyPOs = () => (
    <div style={{ textAlign: 'center', padding: 60, color: C.textSecondary }}>
      <Package size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
      <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
        {filteredPOs.length === 0 && purchaseOrders.length > 0 ? L.noResults : L.noPOs}
      </p>
    </div>
  )

  // ── Main render ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: C.primary }} />
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <Truck size={rv(22, 26, 28)} />
            {L.title}
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={statBadgeStyle}>{activeSupplierCount} {L.suppliersTab}</span>
            <span style={statBadgeStyle}>{pendingPOCount} {L.purchaseOrdersTab}</span>
          </div>
        </div>
        <button
          style={addBtnStyle}
          onClick={activeTab === 'suppliers' ? openAddSupplier : openAddPO}
        >
          <Plus size={16} />
          {activeTab === 'suppliers' ? L.addSupplier : L.addPO}
        </button>
      </div>

      {/* Main tabs */}
      <div style={mainTabBarStyle}>
        <button
          style={mainTabStyle(activeTab === 'suppliers')}
          onClick={() => { setActiveTab('suppliers'); setSearchQuery('') }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={16} />
            {L.suppliersTab}
          </span>
        </button>
        <button
          style={mainTabStyle(activeTab === 'purchase_orders')}
          onClick={() => { setActiveTab('purchase_orders'); setSearchQuery('') }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={16} />
            {L.purchaseOrdersTab}
          </span>
        </button>
      </div>

      {/* PO status filter tabs (only for PO tab) */}
      {activeTab === 'purchase_orders' && (
        <div style={filterTabBarStyle}>
          {PO_FILTER_TABS.map((tab) => (
            <div
              key={tab.key}
              style={filterTabStyle(poStatusFilter === tab.key)}
              onClick={() => setPoStatusFilter(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={searchContainerStyle}>
        <Search size={18} style={searchIconStyle} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'suppliers' ? L.searchSuppliers : L.searchPO}
          style={searchInputStyle}
        />
      </div>

      {/* Content */}
      {activeTab === 'suppliers' ? (
        filteredSuppliers.length === 0 ? renderEmptySuppliers() : (
          <div style={gridStyle}>
            {filteredSuppliers.map(renderSupplierCard)}
          </div>
        )
      ) : (
        filteredPOs.length === 0 ? renderEmptyPOs() : (
          <div style={gridStyle}>
            {filteredPOs.map(renderPOCard)}
          </div>
        )
      )}

      {/* ── Supplier Modal (Add/Edit) ──────────────────────────────── */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title={editingSupplier ? L.editSupplier : L.addSupplier}
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.name} *</label>
          <input
            value={supplierForm.name}
            onChange={(e) => setSupplierForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={L.name}
            style={formInputStyle}
          />
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.contactName}</label>
          <input
            value={supplierForm.contact_name}
            onChange={(e) => setSupplierForm((prev) => ({ ...prev, contact_name: e.target.value }))}
            placeholder={L.contactName}
            style={formInputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.email}</label>
            <input
              type="email"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder={L.email}
              style={formInputStyle}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.phone}</label>
            <input
              type="tel"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder={L.phone}
              style={formInputStyle}
            />
          </div>
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.address}</label>
          <input
            value={supplierForm.address}
            onChange={(e) => setSupplierForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder={L.address}
            style={formInputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.category}</label>
            <input
              value={supplierForm.category}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder={L.category}
              style={formInputStyle}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.paymentTerms}</label>
            <input
              value={supplierForm.payment_terms}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, payment_terms: e.target.value }))}
              placeholder={L.paymentTerms}
              style={formInputStyle}
            />
          </div>
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.notes}</label>
          <textarea
            value={supplierForm.notes}
            onChange={(e) => setSupplierForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder={L.notes}
            style={formTextareaStyle}
          />
        </div>

        <div style={formFieldStyle}>
          <label style={{ ...formLabelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={supplierForm.is_active}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              style={{ width: 18, height: 18, accentColor: C.primary }}
            />
            {L.active}
          </label>
        </div>

        <div style={btnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowSupplierModal(false)}>
            {L.cancel}
          </button>
          <button style={saveBtnStyle} onClick={handleSaveSupplier} disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : L.save}
          </button>
        </div>
      </Modal>

      {/* ── Purchase Order Modal (Add/Edit) ────────────────────────── */}
      <Modal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
        title={editingPO ? L.editPO : L.addPO}
        size="lg"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.supplier} *</label>
          <select
            value={poForm.supplier_id}
            onChange={(e) => {
              const selected = suppliers.find((s) => s.id === e.target.value)
              setPOForm((prev) => ({
                ...prev,
                supplier_id: e.target.value,
                supplier_name: selected?.name || '',
              }))
            }}
            style={formSelectStyle}
          >
            <option value="">{L.selectSupplier}</option>
            {suppliers.filter((s) => s.is_active).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {renderPOLineItems()}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.tax}</label>
            <input
              type="number"
              min={0}
              value={poForm.tax}
              onChange={(e) => setPOForm((prev) => ({ ...prev, tax: Number(e.target.value) || 0 }))}
              style={formInputStyle}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{L.expectedDelivery}</label>
            <input
              type="date"
              value={poForm.expected_delivery}
              onChange={(e) => setPOForm((prev) => ({ ...prev, expected_delivery: e.target.value }))}
              style={formInputStyle}
            />
          </div>
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{L.notes}</label>
          <textarea
            value={poForm.notes}
            onChange={(e) => setPOForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder={L.notes}
            style={formTextareaStyle}
          />
        </div>

        <div style={btnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowPOModal(false)}>
            {L.cancel}
          </button>
          <button style={saveBtnStyle} onClick={handleSavePO} disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : L.save}
          </button>
        </div>
      </Modal>

      {/* ── Receive Goods Modal ────────────────────────────────────── */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title={L.receiveGoodsTitle}
      >
        {receivePO && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                {receivePO.po_number} - {receivePO.supplier_name}
              </div>
              <span style={statusBadge(receivePO.status)}>
                {PO_STATUS_CONFIG[receivePO.status].label}
              </span>
            </div>

            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 50px 50px 60px' : '1fr 80px 80px 100px',
                gap: 0,
                padding: '8px 10px',
                backgroundColor: '#f8fafc',
                fontSize: 11,
                fontWeight: 600,
                color: C.textSecondary,
                textTransform: 'uppercase',
              }}>
                <span>{L.description}</span>
                <span style={{ textAlign: 'center' }}>{L.ordered}</span>
                <span style={{ textAlign: 'center' }}>{L.alreadyReceived}</span>
                <span style={{ textAlign: 'center' }}>{L.newReceived}</span>
              </div>
              {/* Rows */}
              {receivePO.items.map((item, idx) => {
                const remaining = item.quantity - item.received_quantity
                return (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 50px 50px 60px' : '1fr 80px 80px 100px',
                    gap: 0,
                    padding: '8px 10px',
                    borderTop: `1px solid ${C.border}`,
                    alignItems: 'center',
                    fontSize: 13,
                  }}>
                    <span style={{ color: C.text }}>{item.description}</span>
                    <span style={{ textAlign: 'center', color: C.textSecondary }}>{item.quantity}</span>
                    <span style={{
                      textAlign: 'center',
                      color: item.received_quantity >= item.quantity ? C.success : C.textSecondary,
                      fontWeight: item.received_quantity > 0 ? 600 : 400,
                    }}>
                      {item.received_quantity}
                    </span>
                    <div style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min={0}
                        max={remaining}
                        value={receiveQtys[idx] || 0}
                        onChange={(e) => {
                          const val = Math.min(Number(e.target.value) || 0, remaining)
                          setReceiveQtys((prev) => {
                            const next = [...prev]
                            next[idx] = val
                            return next
                          })
                        }}
                        disabled={remaining <= 0}
                        style={{
                          ...formInputStyle,
                          width: 60,
                          padding: '4px 6px',
                          fontSize: 13,
                          textAlign: 'center',
                          opacity: remaining <= 0 ? 0.4 : 1,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={btnRowStyle}>
              <button style={cancelBtnStyle} onClick={() => setShowReceiveModal(false)}>
                {L.cancel}
              </button>
              <button
                style={actionBtnStyle(C.success)}
                onClick={handleReceiveGoods}
                disabled={receiveQtys.every((q) => q === 0)}
              >
                <Check size={16} /> {L.confirm}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Supplier Confirmation ───────────────────────────── */}
      <Modal
        isOpen={showDeleteSupplierModal}
        onClose={() => setShowDeleteSupplierModal(false)}
        title={L.confirmDeleteSupplier}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, marginBottom: 16 }}>
          {L.confirmDelete}
          {supplierToDelete && (
            <strong style={{ display: 'block', marginTop: 8 }}>{supplierToDelete.name}</strong>
          )}
        </p>
        <div style={btnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowDeleteSupplierModal(false)}>
            {L.cancel}
          </button>
          <button style={dangerBtnStyle} onClick={handleDeleteSupplier}>
            <Trash2 size={16} style={{ marginRight: 4 }} /> {L.delete}
          </button>
        </div>
      </Modal>

      {/* ── Delete PO Confirmation ─────────────────────────────────── */}
      <Modal
        isOpen={showDeletePOModal}
        onClose={() => setShowDeletePOModal(false)}
        title={L.confirmDeletePO}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, marginBottom: 16 }}>
          {L.confirmDelete}
          {poToDelete && (
            <strong style={{ display: 'block', marginTop: 8 }}>{poToDelete.po_number}</strong>
          )}
        </p>
        <div style={btnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowDeletePOModal(false)}>
            {L.cancel}
          </button>
          <button style={dangerBtnStyle} onClick={handleDeletePO}>
            <Trash2 size={16} style={{ marginRight: 4 }} /> {L.delete}
          </button>
        </div>
      </Modal>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
