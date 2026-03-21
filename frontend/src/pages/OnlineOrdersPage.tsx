import { useState, useEffect, useMemo } from 'react'
import {
  Globe,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  ShoppingBag,
  Truck,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useOnlineOrderStore } from '../stores/onlineOrderStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type {
  OnlineOrder,
  OnlineOrderStatus,
  OnlineOrderChannel,
  OnlineFulfillment,
  OnlineOrderItem,
} from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#0284c7',
  primaryLight: '#e0f2fe',
  primaryDark: '#0369a1',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#2563eb',
  infoBg: '#eff6ff',
  indigo: '#6366f1',
  indigoBg: '#eef2ff',
  violet: '#8b5cf6',
  violetBg: '#f5f3ff',
  teal: '#14b8a6',
  tealBg: '#f0fdfa',
  amber: '#f59e0b',
  amberBg: '#fffbeb',
} as const

// ── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OnlineOrderStatus, { color: string; bg: string; label: string }> = {
  new:        { color: C.info,    bg: C.infoBg,    label: 'New' },
  confirmed:  { color: C.indigo,  bg: C.indigoBg,  label: 'Confirmed' },
  preparing:  { color: C.amber,   bg: C.amberBg,   label: 'Preparing' },
  ready:      { color: C.teal,    bg: C.tealBg,    label: 'Ready' },
  shipped:    { color: C.violet,  bg: C.violetBg,  label: 'Shipped' },
  delivered:  { color: C.success, bg: C.successBg, label: 'Delivered' },
  cancelled:  { color: C.danger,  bg: C.dangerBg,  label: 'Cancelled' },
  refunded:   { color: C.textMuted, bg: '#f8fafc',  label: 'Refunded' },
}

const ALL_STATUSES: OnlineOrderStatus[] = [
  'new', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded',
]

const PIPELINE_STATUSES: OnlineOrderStatus[] = [
  'new', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered',
]

// ── Channel config ────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<OnlineOrderChannel, { icon: string; color: string; bg: string; label: string }> = {
  website:     { icon: '\uD83C\uDF10', color: C.info,    bg: C.infoBg,    label: 'Website' },
  mobile_app:  { icon: '\uD83D\uDCF1', color: C.violet,  bg: C.violetBg,  label: 'Mobile App' },
  whatsapp:    { icon: '\uD83D\uDCAC', color: C.success, bg: C.successBg, label: 'WhatsApp' },
  facebook:    { icon: '\uD83D\uDCD8', color: C.info,    bg: C.infoBg,    label: 'Facebook' },
  instagram:   { icon: '\uD83D\uDCF8', color: '#e11d48', bg: '#fff1f2',   label: 'Instagram' },
  marketplace: { icon: '\uD83C\uDFEA', color: C.amber,   bg: C.amberBg,   label: 'Marketplace' },
  other:       { icon: '\uD83D\uDCCB', color: C.textSecondary, bg: '#f8fafc', label: 'Other' },
}

const ALL_CHANNELS: OnlineOrderChannel[] = [
  'website', 'mobile_app', 'whatsapp', 'facebook', 'instagram', 'marketplace', 'other',
]

const ALL_FULFILLMENTS: OnlineFulfillment[] = ['delivery', 'pickup', 'dine_in']

const PAYMENT_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending:  { color: C.amber,   bg: C.amberBg },
  paid:     { color: C.success, bg: C.successBg },
  failed:   { color: C.danger,  bg: C.dangerBg },
  refunded: { color: C.textMuted, bg: '#f8fafc' },
}

// ── Component ─────────────────────────────────────────────────────────────

export default function OnlineOrdersPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    orders,
    loading,
    filterStatus,
    filterChannel,
    loadOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    confirmOrder,
    startPreparing,
    markReady,
    shipOrder,
    deliverOrder,
    cancelOrder,
    refundOrder,
    getNewOrdersCount,
    getTodayDelivered,
    setFilterStatus,
    setFilterChannel,
  } = useOnlineOrderStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'

  // i18n
  const tr = (t as Record<string, any>).onlineOrders || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: tr.title || 'Online Orders',
    addOrder: tr.addOrder || 'New Order',
    editOrder: tr.editOrder || 'Edit Order',
    viewOrder: tr.viewOrder || 'Order Details',
    totalOrders: tr.totalOrders || 'Total Orders',
    newOrders: tr.newOrders || 'New Orders',
    preparingOrders: tr.preparingOrders || 'Preparing',
    deliveredToday: tr.deliveredToday || 'Delivered Today',
    orderNumber: tr.orderNumber || 'Order #',
    channel: tr.channel || 'Channel',
    customer: tr.customer || 'Customer',
    customerName: tr.customerName || 'Customer Name',
    customerEmail: tr.customerEmail || 'Email',
    customerPhone: tr.customerPhone || 'Phone',
    fulfillment: tr.fulfillment || 'Fulfillment',
    deliveryAddress: tr.deliveryAddress || 'Delivery Address',
    items: tr.items || 'Items',
    itemsCount: tr.itemsCount || 'items',
    total: tr.total || 'Total',
    subtotal: tr.subtotal || 'Subtotal',
    deliveryFee: tr.deliveryFee || 'Delivery Fee',
    discount: tr.discount || 'Discount',
    tax: tr.tax || 'Tax',
    paymentStatus: tr.paymentStatus || 'Payment',
    orderStatus: tr.orderStatus || 'Status',
    date: tr.date || 'Date',
    actions: tr.actions || 'Actions',
    notes: tr.notes || 'Notes',
    productName: tr.productName || 'Product Name',
    quantity: tr.quantity || 'Qty',
    unitPrice: tr.unitPrice || 'Unit Price',
    lineTotal: tr.lineTotal || 'Total',
    itemNotes: tr.itemNotes || 'Item Notes',
    addItem: tr.addItem || 'Add Item',
    removeItem: tr.removeItem || 'Remove',
    pipeline: tr.pipeline || 'Order Pipeline',
    allStatuses: tr.allStatuses || 'All Statuses',
    allChannels: tr.allChannels || 'All Channels',
    noOrders: tr.noOrders || 'No online orders yet',
    noOrdersDesc: tr.noOrdersDesc || 'Start receiving online orders by adding a new one.',
    noResults: tr.noResults || 'No orders match your filters',
    noResultsDesc: tr.noResultsDesc || 'Try adjusting the filters or search query.',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    delete: tCommon.delete || 'Delete',
    deleteConfirm: tr.deleteConfirm || 'Are you sure you want to delete this order?',
    confirm: tr.confirm || 'Confirm',
    startPreparing: tr.startPreparing || 'Start Preparing',
    markReady: tr.markReady || 'Mark Ready',
    ship: tr.ship || 'Ship',
    deliver: tr.deliver || 'Deliver',
    cancelOrder: tr.cancelOrder || 'Cancel Order',
    refund: tr.refund || 'Refund',
    close: tr.close || 'Close',
    orderTimeline: tr.orderTimeline || 'Order Timeline',
    orderInfo: tr.orderInfo || 'Order Information',
    customerInfo: tr.customerInfo || 'Customer Information',
    // Status labels
    st_new: tr.st_new || 'New',
    st_confirmed: tr.st_confirmed || 'Confirmed',
    st_preparing: tr.st_preparing || 'Preparing',
    st_ready: tr.st_ready || 'Ready',
    st_shipped: tr.st_shipped || 'Shipped',
    st_delivered: tr.st_delivered || 'Delivered',
    st_cancelled: tr.st_cancelled || 'Cancelled',
    st_refunded: tr.st_refunded || 'Refunded',
    // Channel labels
    ch_website: tr.ch_website || 'Website',
    ch_mobile_app: tr.ch_mobile_app || 'Mobile App',
    ch_whatsapp: tr.ch_whatsapp || 'WhatsApp',
    ch_facebook: tr.ch_facebook || 'Facebook',
    ch_instagram: tr.ch_instagram || 'Instagram',
    ch_marketplace: tr.ch_marketplace || 'Marketplace',
    ch_other: tr.ch_other || 'Other',
    // Fulfillment labels
    ff_delivery: tr.ff_delivery || 'Delivery',
    ff_pickup: tr.ff_pickup || 'Pickup',
    ff_dine_in: tr.ff_dine_in || 'Dine In',
    // Payment status labels
    ps_pending: tr.ps_pending || 'Pending',
    ps_paid: tr.ps_paid || 'Paid',
    ps_failed: tr.ps_failed || 'Failed',
    ps_refunded: tr.ps_refunded || 'Refunded',
    ordersCount: tr.ordersCount || 'orders',
    estimatedDelivery: tr.estimatedDelivery || 'Estimated Delivery',
    deliveredAt: tr.deliveredAt || 'Delivered At',
    createdAt: tr.createdAt || 'Created',
  }

  const statusLabel = (s: OnlineOrderStatus): string => (L as Record<string, string>)[`st_${s}`] || s
  const channelLabel = (c: OnlineOrderChannel): string => (L as Record<string, string>)[`ch_${c}`] || c
  const fulfillmentLabel = (f: OnlineFulfillment): string => (L as Record<string, string>)[`ff_${f}`] || f
  const paymentStatusLabel = (ps: string): string => (L as Record<string, string>)[`ps_${ps}`] || ps

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<OnlineOrder | null>(null)
  const [viewingOrder, setViewingOrder] = useState<OnlineOrder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state
  const [formChannel, setFormChannel] = useState<OnlineOrderChannel>('website')
  const [formCustomerName, setFormCustomerName] = useState('')
  const [formCustomerEmail, setFormCustomerEmail] = useState('')
  const [formCustomerPhone, setFormCustomerPhone] = useState('')
  const [formFulfillment, setFormFulfillment] = useState<OnlineFulfillment>('delivery')
  const [formDeliveryAddress, setFormDeliveryAddress] = useState('')
  const [formItems, setFormItems] = useState<OnlineOrderItem[]>([
    { product_id: '', product_name: '', quantity: 1, unit_price: 0, total: 0 },
  ])
  const [formDeliveryFee, setFormDeliveryFee] = useState('')
  const [formDiscount, setFormDiscount] = useState('')
  const [formTax, setFormTax] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // ── Load data on mount + auto-refresh every 10s ──────────────────────

  useEffect(() => {
    loadOrders(storeId)
    const interval = setInterval(() => loadOrders(storeId), 10000)
    return () => clearInterval(interval)
  }, [storeId, loadOrders])

  // ── Filtered and searched orders ──────────────────────────────────────

  const filteredOrders = useMemo(() => {
    let result = [...orders]

    if (filterStatus !== 'all') {
      result = result.filter((o) => o.status === filterStatus)
    }
    if (filterChannel !== 'all') {
      result = result.filter((o) => o.channel === filterChannel)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
          (o.customer_phone && o.customer_phone.toLowerCase().includes(q))
      )
    }

    return result
  }, [orders, filterStatus, filterChannel, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const totalCount = orders.length
  const newCount = getNewOrdersCount(storeId)
  const preparingCount = useMemo(
    () => orders.filter((o) => o.status === 'preparing').length,
    [orders]
  )
  const deliveredTodayCount = getTodayDelivered(storeId)

  // ── Pipeline counts ───────────────────────────────────────────────────

  const pipelineCounts = useMemo(() => {
    const counts: Record<OnlineOrderStatus, number> = {
      new: 0, confirmed: 0, preparing: 0, ready: 0, shipped: 0,
      delivered: 0, cancelled: 0, refunded: 0,
    }
    for (const o of orders) {
      counts[o.status]++
    }
    return counts
  }, [orders])

  const pipelineMax = useMemo(
    () => Math.max(...PIPELINE_STATUSES.map((s) => pipelineCounts[s]), 1),
    [pipelineCounts]
  )

  // ── Form helpers ──────────────────────────────────────────────────────

  function resetForm() {
    setFormChannel('website')
    setFormCustomerName('')
    setFormCustomerEmail('')
    setFormCustomerPhone('')
    setFormFulfillment('delivery')
    setFormDeliveryAddress('')
    setFormItems([{ product_id: '', product_name: '', quantity: 1, unit_price: 0, total: 0 }])
    setFormDeliveryFee('')
    setFormDiscount('')
    setFormTax('')
    setFormNotes('')
    setEditingOrder(null)
  }

  function openAddModal() {
    resetForm()
    setShowModal(true)
  }

  function openEditModal(order: OnlineOrder) {
    setEditingOrder(order)
    setFormChannel(order.channel)
    setFormCustomerName(order.customer_name)
    setFormCustomerEmail(order.customer_email || '')
    setFormCustomerPhone(order.customer_phone || '')
    setFormFulfillment(order.fulfillment)
    setFormDeliveryAddress(order.delivery_address || '')
    setFormItems(order.items.length > 0 ? [...order.items] : [{ product_id: '', product_name: '', quantity: 1, unit_price: 0, total: 0 }])
    setFormDeliveryFee(order.delivery_fee > 0 ? order.delivery_fee.toString() : '')
    setFormDiscount(order.discount > 0 ? order.discount.toString() : '')
    setFormTax(order.tax > 0 ? order.tax.toString() : '')
    setFormNotes(order.notes || '')
    setShowModal(true)
  }

  function handleItemChange(index: number, field: keyof OnlineOrderItem, value: string | number) {
    setFormItems((prev) => {
      const updated = [...prev]
      const item = { ...updated[index] }

      if (field === 'product_name') {
        item.product_name = value as string
      } else if (field === 'quantity') {
        item.quantity = Math.max(1, Number(value) || 1)
      } else if (field === 'unit_price') {
        item.unit_price = Math.max(0, Number(value) || 0)
      } else if (field === 'notes') {
        item.notes = value as string
      }

      item.total = item.quantity * item.unit_price
      updated[index] = item
      return updated
    })
  }

  function addFormItem() {
    setFormItems((prev) => [
      ...prev,
      { product_id: '', product_name: '', quantity: 1, unit_price: 0, total: 0 },
    ])
  }

  function removeFormItem(index: number) {
    setFormItems((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  const formSubtotal = useMemo(
    () => formItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [formItems]
  )

  const formTotal = useMemo(() => {
    const fee = parseFloat(formDeliveryFee) || 0
    const disc = parseFloat(formDiscount) || 0
    const tx = parseFloat(formTax) || 0
    return formSubtotal + fee - disc + tx
  }, [formSubtotal, formDeliveryFee, formDiscount, formTax])

  async function handleSave() {
    if (!formCustomerName.trim() || formItems.every((it) => !it.product_name.trim())) return

    setFormSaving(true)
    try {
      const validItems = formItems
        .filter((it) => it.product_name.trim())
        .map((it) => ({
          ...it,
          product_id: it.product_id || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          total: it.quantity * it.unit_price,
        }))

      const subtotal = validItems.reduce((sum, it) => sum + it.total, 0)
      const deliveryFee = parseFloat(formDeliveryFee) || 0
      const discount = parseFloat(formDiscount) || 0
      const tax = parseFloat(formTax) || 0
      const total = subtotal + deliveryFee - discount + tax

      const data = {
        channel: formChannel,
        customer_name: formCustomerName.trim(),
        customer_email: formCustomerEmail.trim() || undefined,
        customer_phone: formCustomerPhone.trim() || undefined,
        fulfillment: formFulfillment,
        delivery_address: formFulfillment === 'delivery' ? formDeliveryAddress.trim() || undefined : undefined,
        items: validItems,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        tax,
        total,
        payment_status: 'pending' as const,
        status: 'new' as OnlineOrderStatus,
        notes: formNotes.trim() || undefined,
      }

      if (editingOrder) {
        await updateOrder(editingOrder.id, data)
      } else {
        await addOrder(storeId, data)
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[OnlineOrdersPage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteOrder(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[OnlineOrdersPage] Delete error:', error)
    }
  }

  async function handleStatusAction(action: string, id: string) {
    try {
      switch (action) {
        case 'confirm': await confirmOrder(id); break
        case 'prepare': await startPreparing(id); break
        case 'ready': await markReady(id); break
        case 'ship': await shipOrder(id); break
        case 'deliver': await deliverOrder(id); break
        case 'cancel': await cancelOrder(id); break
        case 'refund': await refundOrder(id); break
      }
      // Refresh viewed order if open
      if (viewingOrder && viewingOrder.id === id) {
        const updated = orders.find((o) => o.id === id)
        if (updated) setViewingOrder({ ...updated })
      }
    } catch (error) {
      console.error('[OnlineOrdersPage] Status action error:', error)
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return iso.slice(0, 10)
    }
  }

  function formatDateTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso.slice(0, 16)
    }
  }

  function getStatusActions(status: OnlineOrderStatus): Array<{ key: string; label: string; color: string; bg: string }> {
    switch (status) {
      case 'new':
        return [
          { key: 'confirm', label: L.confirm, color: C.indigo, bg: C.indigoBg },
          { key: 'cancel', label: L.cancelOrder, color: C.danger, bg: C.dangerBg },
        ]
      case 'confirmed':
        return [
          { key: 'prepare', label: L.startPreparing, color: C.amber, bg: C.amberBg },
          { key: 'cancel', label: L.cancelOrder, color: C.danger, bg: C.dangerBg },
        ]
      case 'preparing':
        return [
          { key: 'ready', label: L.markReady, color: C.teal, bg: C.tealBg },
          { key: 'cancel', label: L.cancelOrder, color: C.danger, bg: C.dangerBg },
        ]
      case 'ready':
        return [
          { key: 'ship', label: L.ship, color: C.violet, bg: C.violetBg },
          { key: 'deliver', label: L.deliver, color: C.success, bg: C.successBg },
        ]
      case 'shipped':
        return [
          { key: 'deliver', label: L.deliver, color: C.success, bg: C.successBg },
        ]
      case 'delivered':
        return [
          { key: 'refund', label: L.refund, color: C.textMuted, bg: '#f8fafc' },
        ]
      case 'cancelled':
        return []
      case 'refunded':
        return []
      default:
        return []
    }
  }

  // Keep viewed order in sync with store data
  const syncedViewingOrder = useMemo(() => {
    if (!viewingOrder) return null
    return orders.find((o) => o.id === viewingOrder.id) || viewingOrder
  }, [viewingOrder, orders])

  // ── Styles ────────────────────────────────────────────────────────────

  const s = {
    page: {
      padding: rv(12, 20, 24),
      backgroundColor: C.bg,
      minHeight: '100vh',
    } as React.CSSProperties,

    header: {
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 12,
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    title: {
      margin: 0,
      fontSize: rv(20, 24, 28),
      fontWeight: 700,
      color: C.text,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as React.CSSProperties,

    addBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      backgroundColor: C.primary,
      color: '#ffffff',
      border: 'none',
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      whiteSpace: 'nowrap',
    } as React.CSSProperties,

    statsGrid: {
      display: 'grid',
      gridTemplateColumns: rv('1fr 1fr', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
      gap: rv(10, 14, 16),
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    statCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      padding: rv(14, 18, 20),
      border: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    } as React.CSSProperties,

    statLabel: {
      fontSize: rv(11, 12, 13),
      fontWeight: 500,
      color: C.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    } as React.CSSProperties,

    statValue: {
      fontSize: rv(18, 22, 26),
      fontWeight: 700,
      color: C.text,
    } as React.CSSProperties,

    pipelineSection: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: rv(14, 18, 20),
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    pipelineTitle: {
      fontSize: 16,
      fontWeight: 700,
      color: C.text,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: '0 0 16px',
    } as React.CSSProperties,

    pipelineRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    } as React.CSSProperties,

    pipelineLabel: {
      width: rv(70, 90, 100),
      fontSize: rv(11, 12, 13),
      fontWeight: 500,
      color: C.textSecondary,
      textAlign: 'right' as const,
      flexShrink: 0,
    } as React.CSSProperties,

    pipelineTrack: {
      flex: 1,
      height: rv(18, 22, 24),
      backgroundColor: C.bg,
      borderRadius: 6,
      overflow: 'hidden',
      position: 'relative' as const,
    } as React.CSSProperties,

    pipelineCount: {
      fontSize: rv(11, 12, 12),
      fontWeight: 600,
      color: C.textSecondary,
      minWidth: 30,
      textAlign: 'right' as const,
      flexShrink: 0,
    } as React.CSSProperties,

    filterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: rv(8, 10, 12),
      alignItems: 'center',
      marginBottom: rv(16, 20, 24),
      backgroundColor: C.card,
      padding: rv(12, 14, 16),
      borderRadius: 12,
      border: `1px solid ${C.border}`,
    } as React.CSSProperties,

    searchInput: {
      flex: 1,
      minWidth: rv(140, 180, 220),
      padding: '9px 12px 9px 36px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: C.bg,
      outline: 'none',
    } as React.CSSProperties,

    selectInput: {
      padding: '9px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: C.bg,
      outline: 'none',
      cursor: 'pointer',
      minWidth: rv(100, 130, 150),
    } as React.CSSProperties,

    tableWrapper: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    } as React.CSSProperties,

    th: {
      padding: '12px 16px',
      textAlign: 'left' as const,
      fontSize: 12,
      fontWeight: 600,
      color: C.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      borderBottom: `2px solid ${C.border}`,
      backgroundColor: '#f8fafc',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    td: {
      padding: '12px 16px',
      fontSize: 14,
      color: C.text,
      borderBottom: `1px solid ${C.border}`,
      verticalAlign: 'middle' as const,
    } as React.CSSProperties,

    badge: (color: string, bg: string) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color,
        backgroundColor: bg,
        whiteSpace: 'nowrap',
      } as React.CSSProperties),

    actionBtn: (color: string) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        border: 'none',
        borderRadius: 6,
        backgroundColor: 'transparent',
        color,
        cursor: 'pointer',
        transition: 'background-color 0.15s',
      } as React.CSSProperties),

    statusActionBtn: (color: string, bg: string) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        border: `1px solid ${color}`,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        color,
        backgroundColor: bg,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
        whiteSpace: 'nowrap',
      } as React.CSSProperties),

    mobileCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: 14,
      marginBottom: 10,
    } as React.CSSProperties,

    mobileCardRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    } as React.CSSProperties,

    formGroup: {
      marginBottom: 16,
    } as React.CSSProperties,

    formLabel: {
      display: 'block',
      marginBottom: 6,
      fontSize: 13,
      fontWeight: 600,
      color: C.text,
    } as React.CSSProperties,

    formInput: {
      width: '100%',
      padding: '10px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    formTextarea: {
      width: '100%',
      padding: '10px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box' as const,
      resize: 'vertical' as const,
      minHeight: 70,
      fontFamily: 'inherit',
    } as React.CSSProperties,

    formRow: {
      display: 'grid',
      gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
      gap: 12,
    } as React.CSSProperties,

    formFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 20,
      paddingTop: 16,
      borderTop: `1px solid ${C.border}`,
    } as React.CSSProperties,

    cancelBtn: {
      padding: '10px 20px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      color: C.textSecondary,
      backgroundColor: '#ffffff',
      cursor: 'pointer',
    } as React.CSSProperties,

    saveBtn: {
      padding: '10px 24px',
      border: 'none',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: C.primary,
      cursor: 'pointer',
      opacity: formSaving ? 0.7 : 1,
    } as React.CSSProperties,

    emptyState: {
      textAlign: 'center' as const,
      padding: rv(40, 60, 80),
      color: C.textSecondary,
    } as React.CSSProperties,

    emptyIcon: {
      marginBottom: 16,
      color: C.textMuted,
    } as React.CSSProperties,

    emptyTitle: {
      fontSize: 18,
      fontWeight: 600,
      color: C.text,
      margin: '0 0 8px',
    } as React.CSSProperties,

    emptyDesc: {
      fontSize: 14,
      color: C.textSecondary,
      margin: 0,
    } as React.CSSProperties,

    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 60,
      color: C.textSecondary,
      fontSize: 15,
    } as React.CSSProperties,

    // View modal sections
    viewSection: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: `1px solid ${C.border}`,
    } as React.CSSProperties,

    viewSectionTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: C.text,
      margin: '0 0 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    } as React.CSSProperties,

    viewRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
      fontSize: 13,
    } as React.CSSProperties,

    viewLabel: {
      color: C.textSecondary,
      fontWeight: 500,
    } as React.CSSProperties,

    viewValue: {
      color: C.text,
      fontWeight: 600,
    } as React.CSSProperties,

    // Items table in form
    itemsTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: 13,
      marginBottom: 8,
    } as React.CSSProperties,

    itemTh: {
      padding: '8px 6px',
      textAlign: 'left' as const,
      fontSize: 11,
      fontWeight: 600,
      color: C.textSecondary,
      textTransform: 'uppercase' as const,
      borderBottom: `1px solid ${C.border}`,
    } as React.CSSProperties,

    itemTd: {
      padding: '6px',
      verticalAlign: 'middle' as const,
      borderBottom: `1px solid ${C.border}`,
    } as React.CSSProperties,

    itemInput: {
      width: '100%',
      padding: '7px 8px',
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      fontSize: 13,
      color: C.text,
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && orders.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <Globe size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading online orders...</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <h1 style={s.title}>
          <Globe size={rv(22, 26, 28)} color={C.primary} />
          {L.title}
        </h1>
        <button
          style={s.addBtn}
          onClick={openAddModal}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = C.primaryDark
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = C.primary
          }}
        >
          <Plus size={18} />
          {L.addOrder}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total orders */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalOrders}</span>
          </div>
          <div style={s.statValue}>{totalCount}</div>
        </div>

        {/* New orders */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.infoBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={18} color={C.info} />
            </div>
            <span style={s.statLabel}>{L.newOrders}</span>
          </div>
          <div style={s.statValue}>{newCount}</div>
        </div>

        {/* Preparing */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.warningBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.preparingOrders}</span>
          </div>
          <div style={s.statValue}>{preparingCount}</div>
        </div>

        {/* Delivered today */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.successBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Truck size={18} color={C.success} />
            </div>
            <span style={s.statLabel}>{L.deliveredToday}</span>
          </div>
          <div style={s.statValue}>{deliveredTodayCount}</div>
        </div>
      </div>

      {/* ── Pipeline view ───────────────────────────────────────────────── */}
      {orders.length > 0 && (
        <div style={s.pipelineSection}>
          <h3 style={s.pipelineTitle}>
            <ShoppingBag size={18} color={C.primary} />
            {L.pipeline}
          </h3>

          {PIPELINE_STATUSES.map((status) => {
            const count = pipelineCounts[status]
            const cfg = STATUS_CONFIG[status]
            const pct = (count / pipelineMax) * 100

            return (
              <div key={status} style={s.pipelineRow}>
                <div style={s.pipelineLabel}>
                  {statusLabel(status)}
                </div>
                <div style={s.pipelineTrack}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: cfg.color,
                      borderRadius: 6,
                      transition: 'width 0.4s ease',
                      minWidth: count > 0 ? 4 : 0,
                      opacity: 0.8,
                    }}
                  />
                </div>
                <div style={s.pipelineCount}>{count}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Filters bar ─────────────────────────────────────────────────── */}
      <div style={s.filterBar}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: rv(140, 180, 220) }}>
          <Search
            size={16}
            color={C.textMuted}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder={L.search + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={s.searchInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as OnlineOrderStatus | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allStatuses}</option>
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>
              {statusLabel(st)}
            </option>
          ))}
        </select>

        {/* Channel filter */}
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value as OnlineOrderChannel | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allChannels}</option>
          {ALL_CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {CHANNEL_CONFIG[ch].icon} {channelLabel(ch)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Order list ────────────────────────────────────────────────── */}
      {orders.length === 0 ? (
        /* Empty state - no orders at all */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <Globe size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noOrders}</h3>
          <p style={s.emptyDesc}>{L.noOrdersDesc}</p>
          <button
            style={{ ...s.addBtn, marginTop: 20 }}
            onClick={openAddModal}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = C.primaryDark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = C.primary
            }}
          >
            <Plus size={18} />
            {L.addOrder}
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty state - filters returned nothing */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <Search size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noResults}</h3>
          <p style={s.emptyDesc}>{L.noResultsDesc}</p>
        </div>
      ) : isMobile ? (
        /* ── Mobile cards ──────────────────────────────────────────────── */
        <div>
          <div
            style={{
              fontSize: 12,
              color: C.textSecondary,
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            {filteredOrders.length} {L.ordersCount}
          </div>
          {filteredOrders.map((order) => {
            const stCfg = STATUS_CONFIG[order.status]
            const chCfg = CHANNEL_CONFIG[order.channel]
            const psCfg = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending
            const actions = getStatusActions(order.status)

            return (
              <div key={order.id} style={s.mobileCard}>
                {/* Top row: order # + total */}
                <div style={s.mobileCardRow}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>
                    {order.order_number}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                    {formatCurrency(order.total, currency)}
                  </span>
                </div>

                {/* Channel + Customer */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={s.badge(chCfg.color, chCfg.bg)}>
                    {chCfg.icon} {channelLabel(order.channel)}
                  </span>
                  <span>{order.customer_name}</span>
                </div>

                {/* Fulfillment + Items + Date */}
                <div
                  style={{
                    fontSize: 12,
                    color: C.textSecondary,
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{fulfillmentLabel(order.fulfillment)}</span>
                  <span>{order.items.length} {L.itemsCount}</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>

                {/* Status + Payment */}
                <div style={{ ...s.mobileCardRow, marginBottom: 0 }}>
                  <span style={s.badge(stCfg.color, stCfg.bg)}>
                    {statusLabel(order.status)}
                  </span>
                  <span style={s.badge(psCfg.color, psCfg.bg)}>
                    {paymentStatusLabel(order.payment_status)}
                  </span>
                </div>

                {/* Action buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${C.border}`,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => setViewingOrder(order)}
                    style={{
                      ...s.actionBtn(C.primary),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                    }}
                    title={L.viewOrder}
                  >
                    <Eye size={13} />
                  </button>

                  <button
                    onClick={() => openEditModal(order)}
                    style={{
                      ...s.actionBtn(C.info),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                    }}
                    title={L.editOrder}
                  >
                    <Edit size={13} />
                  </button>

                  {actions.map((act) => (
                    <button
                      key={act.key}
                      onClick={() => handleStatusAction(act.key, order.id)}
                      style={s.statusActionBtn(act.color, act.bg)}
                    >
                      {act.label}
                    </button>
                  ))}

                  <button
                    onClick={() => setDeleteTarget(order.id)}
                    style={{
                      ...s.actionBtn(C.danger),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                      marginLeft: 'auto',
                    }}
                    title={L.delete}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Desktop/tablet table ──────────────────────────────────────── */
        <div style={s.tableWrapper}>
          <div
            style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${C.border}`,
              fontSize: 12,
              color: C.textSecondary,
              fontWeight: 500,
            }}
          >
            {filteredOrders.length} {L.ordersCount}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{L.orderNumber}</th>
                  <th style={s.th}>{L.channel}</th>
                  <th style={s.th}>{L.customer}</th>
                  <th style={s.th}>{L.fulfillment}</th>
                  <th style={s.th}>{L.items}</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>{L.total}</th>
                  <th style={s.th}>{L.paymentStatus}</th>
                  <th style={s.th}>{L.orderStatus}</th>
                  <th style={s.th}>{L.date}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const stCfg = STATUS_CONFIG[order.status]
                  const chCfg = CHANNEL_CONFIG[order.channel]
                  const psCfg = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending
                  const actions = getStatusActions(order.status)

                  return (
                    <tr
                      key={order.id}
                      style={{ transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = ''
                      }}
                    >
                      <td style={s.td}>
                        <span style={{ fontWeight: 700, color: C.primary, fontSize: 13 }}>
                          {order.order_number}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(chCfg.color, chCfg.bg)}>
                          {chCfg.icon} {channelLabel(order.channel)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 500 }}>{order.customer_name}</div>
                        {order.customer_phone && (
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                            {order.customer_phone}
                          </div>
                        )}
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize: 13, color: C.textSecondary }}>
                          {fulfillmentLabel(order.fulfillment)}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {order.items.length}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatCurrency(order.total, currency)}
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(psCfg.color, psCfg.bg)}>
                          {paymentStatusLabel(order.payment_status)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(stCfg.color, stCfg.bg)}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontSize: 13, color: C.textSecondary, whiteSpace: 'nowrap' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setViewingOrder(order)}
                            style={s.actionBtn(C.primary)}
                            title={L.viewOrder}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.primaryLight
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => openEditModal(order)}
                            style={s.actionBtn(C.info)}
                            title={L.editOrder}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.infoBg
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Edit size={15} />
                          </button>

                          {actions.map((act) => (
                            <button
                              key={act.key}
                              onClick={() => handleStatusAction(act.key, order.id)}
                              style={s.statusActionBtn(act.color, act.bg)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.8'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1'
                              }}
                            >
                              {act.label}
                            </button>
                          ))}

                          <button
                            onClick={() => setDeleteTarget(order.id)}
                            style={s.actionBtn(C.danger)}
                            title={L.delete}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.dangerBg
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Order Modal ────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingOrder ? L.editOrder : L.addOrder}
        size="lg"
      >
        {/* Channel & Fulfillment */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.channel} *</label>
            <select
              value={formChannel}
              onChange={(e) => setFormChannel(e.target.value as OnlineOrderChannel)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {CHANNEL_CONFIG[ch].icon} {channelLabel(ch)}
                </option>
              ))}
            </select>
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.fulfillment} *</label>
            <select
              value={formFulfillment}
              onChange={(e) => setFormFulfillment(e.target.value as OnlineFulfillment)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_FULFILLMENTS.map((ff) => (
                <option key={ff} value={ff}>
                  {fulfillmentLabel(ff)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer name */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.customerName} *</label>
          <input
            type="text"
            value={formCustomerName}
            onChange={(e) => setFormCustomerName(e.target.value)}
            placeholder={L.customerName + '...'}
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Email & Phone */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.customerEmail}</label>
            <input
              type="email"
              value={formCustomerEmail}
              onChange={(e) => setFormCustomerEmail(e.target.value)}
              placeholder="email@example.com"
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.customerPhone}</label>
            <input
              type="tel"
              value={formCustomerPhone}
              onChange={(e) => setFormCustomerPhone(e.target.value)}
              placeholder="+237..."
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        </div>

        {/* Delivery address (only when fulfillment=delivery) */}
        {formFulfillment === 'delivery' && (
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.deliveryAddress}</label>
            <input
              type="text"
              value={formDeliveryAddress}
              onChange={(e) => setFormDeliveryAddress(e.target.value)}
              placeholder={L.deliveryAddress + '...'}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        )}

        {/* Items table */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.items} *</label>
          <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <table style={s.itemsTable}>
              <thead>
                <tr>
                  <th style={{ ...s.itemTh, minWidth: 140 }}>{L.productName}</th>
                  <th style={{ ...s.itemTh, width: 60, textAlign: 'center' }}>{L.quantity}</th>
                  <th style={{ ...s.itemTh, width: 100 }}>{L.unitPrice}</th>
                  <th style={{ ...s.itemTh, minWidth: 100 }}>{L.itemNotes}</th>
                  <th style={{ ...s.itemTh, width: 80, textAlign: 'right' }}>{L.lineTotal}</th>
                  <th style={{ ...s.itemTh, width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {formItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={s.itemTd}>
                      <input
                        type="text"
                        value={item.product_name}
                        onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                        placeholder={L.productName + '...'}
                        style={s.itemInput}
                      />
                    </td>
                    <td style={{ ...s.itemTd, textAlign: 'center' }}>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        style={{ ...s.itemInput, textAlign: 'center', width: 50 }}
                      />
                    </td>
                    <td style={s.itemTd}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price || ''}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        placeholder="0"
                        style={s.itemInput}
                      />
                    </td>
                    <td style={s.itemTd}>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                        placeholder={L.itemNotes + '...'}
                        style={s.itemInput}
                      />
                    </td>
                    <td style={{ ...s.itemTd, textAlign: 'right', fontWeight: 600, fontSize: 13 }}>
                      {formatCurrency(item.quantity * item.unit_price, currency)}
                    </td>
                    <td style={s.itemTd}>
                      {formItems.length > 1 && (
                        <button
                          onClick={() => removeFormItem(idx)}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: C.danger,
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={L.removeItem}
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addFormItem}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              border: `1px dashed ${C.border}`,
              borderRadius: 6,
              backgroundColor: 'transparent',
              color: C.primary,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            <Plus size={14} />
            {L.addItem}
          </button>
        </div>

        {/* Delivery fee, Discount, Tax */}
        <div style={{ display: 'grid', gridTemplateColumns: rv('1fr', '1fr 1fr 1fr', '1fr 1fr 1fr'), gap: 12 }}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.deliveryFee}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formDeliveryFee}
              onChange={(e) => setFormDeliveryFee(e.target.value)}
              placeholder="0"
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.discount}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formDiscount}
              onChange={(e) => setFormDiscount(e.target.value)}
              placeholder="0"
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.tax}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formTax}
              onChange={(e) => setFormTax(e.target.value)}
              placeholder="0"
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        </div>

        {/* Totals summary */}
        <div
          style={{
            backgroundColor: C.bg,
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
            <span style={{ color: C.textSecondary }}>{L.subtotal}</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(formSubtotal, currency)}</span>
          </div>
          {(parseFloat(formDeliveryFee) || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
              <span style={{ color: C.textSecondary }}>+ {L.deliveryFee}</span>
              <span>{formatCurrency(parseFloat(formDeliveryFee) || 0, currency)}</span>
            </div>
          )}
          {(parseFloat(formDiscount) || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: C.danger }}>
              <span>- {L.discount}</span>
              <span>{formatCurrency(parseFloat(formDiscount) || 0, currency)}</span>
            </div>
          )}
          {(parseFloat(formTax) || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
              <span style={{ color: C.textSecondary }}>+ {L.tax}</span>
              <span>{formatCurrency(parseFloat(formTax) || 0, currency)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTop: `1px solid ${C.border}`,
              fontSize: 15,
              fontWeight: 700,
              color: C.text,
            }}
          >
            <span>{L.total}</span>
            <span>{formatCurrency(formTotal, currency)}</span>
          </div>
        </div>

        {/* Notes */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.notes}</label>
          <textarea
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder={L.notes + '...'}
            style={s.formTextarea}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Form footer */}
        <div style={s.formFooter}>
          <button
            style={s.cancelBtn}
            onClick={() => {
              setShowModal(false)
              resetForm()
            }}
          >
            {L.cancel}
          </button>
          <button
            style={s.saveBtn}
            onClick={handleSave}
            disabled={formSaving || !formCustomerName.trim() || formItems.every((it) => !it.product_name.trim())}
          >
            {formSaving ? 'Saving...' : L.save}
          </button>
        </div>
      </Modal>

      {/* ── View Order Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={syncedViewingOrder !== null}
        onClose={() => setViewingOrder(null)}
        title={L.viewOrder}
        size="lg"
      >
        {syncedViewingOrder && (() => {
          const vo = syncedViewingOrder
          const stCfg = STATUS_CONFIG[vo.status]
          const chCfg = CHANNEL_CONFIG[vo.channel]
          const psCfg = PAYMENT_STATUS_CONFIG[vo.payment_status] || PAYMENT_STATUS_CONFIG.pending
          const actions = getStatusActions(vo.status)

          return (
            <>
              {/* Order Info section */}
              <div style={s.viewSection}>
                <h4 style={s.viewSectionTitle}>
                  <ShoppingBag size={16} color={C.primary} />
                  {L.orderInfo}
                </h4>
                <div style={s.viewRow}>
                  <span style={s.viewLabel}>{L.orderNumber}</span>
                  <span style={{ ...s.viewValue, color: C.primary }}>{vo.order_number}</span>
                </div>
                <div style={s.viewRow}>
                  <span style={s.viewLabel}>{L.channel}</span>
                  <span style={s.badge(chCfg.color, chCfg.bg)}>
                    {chCfg.icon} {channelLabel(vo.channel)}
                  </span>
                </div>
                <div style={s.viewRow}>
                  <span style={s.viewLabel}>{L.fulfillment}</span>
                  <span style={s.viewValue}>{fulfillmentLabel(vo.fulfillment)}</span>
                </div>
                <div style={s.viewRow}>
                  <span style={s.viewLabel}>{L.orderStatus}</span>
                  <span style={s.badge(stCfg.color, stCfg.bg)}>{statusLabel(vo.status)}</span>
                </div>
                <div style={s.viewRow}>
                  <span style={s.viewLabel}>{L.paymentStatus}</span>
                  <span style={s.badge(psCfg.color, psCfg.bg)}>{paymentStatusLabel(vo.payment_status)}</span>
                </div>
                <div style={s.viewRow}>
                  <span style={s.viewLabel}>{L.createdAt}</span>
                  <span style={s.viewValue}>{formatDateTime(vo.created_at)}</span>
                </div>
                {vo.estimated_delivery && (
                  <div style={s.viewRow}>
                    <span style={s.viewLabel}>{L.estimatedDelivery}</span>
                    <span style={s.viewValue}>{formatDateTime(vo.estimated_delivery)}</span>
                  </div>
                )}
                {vo.delivered_at && (
                  <div style={s.viewRow}>
                    <span style={s.viewLabel}>{L.deliveredAt}</span>
                    <span style={s.viewValue}>{formatDateTime(vo.delivered_at)}</span>
                  </div>
                )}
              </div>

              {/* Customer Info section */}
              <div style={s.viewSection}>
                <h4 style={s.viewSectionTitle}>
                  <MapPin size={16} color={C.primary} />
                  {L.customerInfo}
                </h4>
                <div style={s.viewRow}>
                  <span style={s.viewLabel}>{L.customerName}</span>
                  <span style={s.viewValue}>{vo.customer_name}</span>
                </div>
                {vo.customer_email && (
                  <div style={s.viewRow}>
                    <span style={s.viewLabel}>{L.customerEmail}</span>
                    <span style={s.viewValue}>{vo.customer_email}</span>
                  </div>
                )}
                {vo.customer_phone && (
                  <div style={s.viewRow}>
                    <span style={s.viewLabel}>{L.customerPhone}</span>
                    <span style={s.viewValue}>{vo.customer_phone}</span>
                  </div>
                )}
                {vo.delivery_address && (
                  <div style={s.viewRow}>
                    <span style={s.viewLabel}>{L.deliveryAddress}</span>
                    <span style={s.viewValue}>{vo.delivery_address}</span>
                  </div>
                )}
              </div>

              {/* Status Timeline section */}
              <div style={s.viewSection}>
                <h4 style={s.viewSectionTitle}>
                  <Clock size={16} color={C.primary} />
                  {L.orderTimeline}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {ALL_STATUSES.filter((st) => st !== 'cancelled' && st !== 'refunded').map((st, idx) => {
                    const cfg = STATUS_CONFIG[st]
                    const statusIdx = ALL_STATUSES.indexOf(vo.status)
                    const thisIdx = ALL_STATUSES.indexOf(st)
                    const isActive = thisIdx <= statusIdx && vo.status !== 'cancelled' && vo.status !== 'refunded'
                    const isCurrent = st === vo.status

                    return (
                      <div key={st} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        {/* Timeline dot and line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24 }}>
                          <div
                            style={{
                              width: isCurrent ? 16 : 12,
                              height: isCurrent ? 16 : 12,
                              borderRadius: '50%',
                              backgroundColor: isActive ? cfg.color : C.border,
                              border: isCurrent ? `3px solid ${cfg.bg}` : 'none',
                              boxShadow: isCurrent ? `0 0 0 2px ${cfg.color}` : 'none',
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          />
                          {idx < 5 && (
                            <div
                              style={{
                                width: 2,
                                height: 24,
                                backgroundColor: isActive && thisIdx < statusIdx ? cfg.color : C.border,
                                opacity: 0.4,
                              }}
                            />
                          )}
                        </div>
                        {/* Label */}
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: isCurrent ? 700 : 500,
                            color: isActive ? cfg.color : C.textMuted,
                            paddingBottom: idx < 5 ? 10 : 0,
                          }}
                        >
                          {statusLabel(st)}
                        </div>
                      </div>
                    )
                  })}

                  {/* Show cancelled/refunded if applicable */}
                  {(vo.status === 'cancelled' || vo.status === 'refunded') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: STATUS_CONFIG[vo.status].color,
                          border: `3px solid ${STATUS_CONFIG[vo.status].bg}`,
                          boxShadow: `0 0 0 2px ${STATUS_CONFIG[vo.status].color}`,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: STATUS_CONFIG[vo.status].color,
                        }}
                      >
                        {statusLabel(vo.status)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items section */}
              <div style={s.viewSection}>
                <h4 style={s.viewSectionTitle}>
                  <ShoppingBag size={16} color={C.primary} />
                  {L.items} ({vo.items.length})
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ ...s.itemTh, textAlign: 'left' }}>{L.productName}</th>
                        <th style={{ ...s.itemTh, textAlign: 'center' }}>{L.quantity}</th>
                        <th style={{ ...s.itemTh, textAlign: 'right' }}>{L.unitPrice}</th>
                        <th style={{ ...s.itemTh, textAlign: 'right' }}>{L.lineTotal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vo.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '8px 6px', borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                            {item.notes && (
                              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                                {item.notes}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 6px', borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '8px 6px', borderBottom: `1px solid ${C.border}`, textAlign: 'right' }}>
                            {formatCurrency(item.unit_price, currency)}
                          </td>
                          <td style={{ padding: '8px 6px', borderBottom: `1px solid ${C.border}`, textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(item.total, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div style={{ marginTop: 12, backgroundColor: C.bg, borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span style={{ color: C.textSecondary }}>{L.subtotal}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(vo.subtotal, currency)}</span>
                  </div>
                  {vo.delivery_fee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: C.textSecondary }}>+ {L.deliveryFee}</span>
                      <span>{formatCurrency(vo.delivery_fee, currency)}</span>
                    </div>
                  )}
                  {vo.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: C.danger }}>
                      <span>- {L.discount}</span>
                      <span>{formatCurrency(vo.discount, currency)}</span>
                    </div>
                  )}
                  {vo.tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: C.textSecondary }}>+ {L.tax}</span>
                      <span>{formatCurrency(vo.tax, currency)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: 8,
                      borderTop: `1px solid ${C.border}`,
                      fontSize: 16,
                      fontWeight: 700,
                      color: C.text,
                    }}
                  >
                    <span>{L.total}</span>
                    <span>{formatCurrency(vo.total, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Notes section */}
              {vo.notes && (
                <div style={{ ...s.viewSection, borderBottom: 'none' }}>
                  <h4 style={s.viewSectionTitle}>{L.notes}</h4>
                  <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>
                    {vo.notes}
                  </p>
                </div>
              )}

              {/* Action buttons in view modal */}
              {actions.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    paddingTop: 16,
                    borderTop: `1px solid ${C.border}`,
                    marginTop: 8,
                  }}
                >
                  {actions.map((act) => (
                    <button
                      key={act.key}
                      onClick={() => handleStatusAction(act.key, vo.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        border: `1px solid ${act.color}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: act.color,
                        backgroundColor: act.bg,
                        cursor: 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                    >
                      {act.key === 'confirm' && <CheckCircle size={14} />}
                      {act.key === 'cancel' && <XCircle size={14} />}
                      {act.key === 'deliver' && <Truck size={14} />}
                      {act.key === 'ship' && <Truck size={14} />}
                      {act.key === 'prepare' && <Clock size={14} />}
                      {act.key === 'ready' && <CheckCircle size={14} />}
                      {act.key === 'refund' && <XCircle size={14} />}
                      {act.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Close button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  style={s.cancelBtn}
                  onClick={() => setViewingOrder(null)}
                >
                  {L.close}
                </button>
              </div>
            </>
          )
        })()}
      </Modal>

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={L.delete}
        size="sm"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: C.dangerBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Trash2 size={24} color={C.danger} />
          </div>
          <p style={{ fontSize: 15, color: C.text, margin: '0 0 24px', lineHeight: 1.5 }}>
            {L.deleteConfirm}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              style={s.cancelBtn}
              onClick={() => setDeleteTarget(null)}
            >
              {L.cancel}
            </button>
            <button
              style={{
                ...s.saveBtn,
                backgroundColor: C.danger,
              }}
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
