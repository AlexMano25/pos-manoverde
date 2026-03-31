import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search, ShoppingCart, Minus, Plus, X, Banknote, Send,
  ChevronLeft, Grid3X3, User, Users, Clock, ClipboardList,
  CheckCircle2, ArrowRightLeft, Merge, Split, ChefHat,
  UserPlus,
} from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useProductStore } from '../stores/productStore'
import { useAppStore } from '../stores/appStore'
import { useTableStore } from '../stores/tableStore'
import { useOrderStore } from '../stores/orderStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useCustomerStore } from '../stores/customerStore'
import { usePromotionStore } from '../stores/promotionStore'
import { useKdsStore } from '../stores/kdsStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { PaymentMethod, RestaurantTable, TableStatus, Order, CartItem } from '../types'

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
  orange: '#f97316',
  purple: '#9333ea',
  teal: '#0d9488',
} as const

const STATUS_COLORS: Record<TableStatus, string> = {
  free: C.success,
  occupied: C.danger,
  reserved: C.warning,
  bill_requested: C.blue,
  food_ready: '#22c55e',
}

type IdentifyMode = 'table' | 'customer'
type ServerStep = 'identify' | 'order'
type CourseTag = 'entree' | 'plat' | 'dessert' | 'boisson'

const COURSE_TAGS: CourseTag[] = ['entree', 'plat', 'dessert', 'boisson']
const COURSE_ORDER: Record<CourseTag, number> = { entree: 1, plat: 2, dessert: 3, boisson: 4 }

// Activities that support tables
const TABLE_ACTIVITIES = ['restaurant', 'bar', 'bakery', 'hotel', 'cafe', 'nightclub']

// ── Overlay modal helper ──────────────────────────────────────────────────

const ModalOverlay: React.FC<{ onClose: () => void; children: React.ReactNode; width?: string }> = ({ onClose, children, width }) => (
  <div style={{
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }} onClick={onClose}>
    <div style={{
      backgroundColor: '#fff', borderRadius: 16, padding: 24,
      width: width || '90%', maxWidth: 440, maxHeight: '85vh', overflow: 'auto',
    }} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
)

// ── Component ──────────────────────────────────────────────────────────────

export default function ServerOrderPage() {
  const { currentStore, activity } = useAppStore()
  const { products, categories, loadProducts } = useProductStore()
  const { items, addItem, updateQty, clear, getTotal } = useCartStore()
  const { tables, loadTables, setTableStatus, transferTable, mergeTables } = useTableStore()
  const { createOrder, orders, loadOrders, updateOrderStatus } = useOrderStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()
  const { recordVisit } = useCustomerStore()
  const selectedCustomer = useCustomerStore(s => s.selectedCustomer)
  const { calculateTotalDiscount, loadPromotions } = usePromotionStore()
  const kdsStore = useKdsStore()
  const { rv } = useResponsive()

  const currencyCode = currentStore?.currency || 'XAF'
  const storeId = currentStore?.id || ''
  const hasTableSupport = TABLE_ACTIVITIES.includes(activity || '')

  const [step, setStep] = useState<ServerStep>('identify')
  const [identifyMode, setIdentifyMode] = useState<IdentifyMode>(hasTableSupport ? 'table' : 'customer')
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPendingPanel, setShowPendingPanel] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<'sent' | 'paid' | null>(null)

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferFromTable, setTransferFromTable] = useState<RestaurantTable | null>(null)

  // Merge modal
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [mergeSelectedIds, setMergeSelectedIds] = useState<string[]>([])
  const [mergePrimaryId, setMergePrimaryId] = useState<string | null>(null)

  // Split bill modal
  const [showSplitBillModal, setShowSplitBillModal] = useState(false)
  const [guestCount, setGuestCount] = useState(2)
  // Map: product_id -> guest index (0-based)
  const [guestAssignments, setGuestAssignments] = useState<Record<string, number>>({})
  const [guestPaidStatus, setGuestPaidStatus] = useState<Record<number, PaymentMethod | null>>({})
  // Custom amounts per guest (overrides calculated amount)
  const [guestCustomAmounts, setGuestCustomAmounts] = useState<Record<number, string>>({})

  // Coursing
  const [courseTags, setCourseTags] = useState<Record<string, CourseTag>>({}) // product_id -> course
  const [sentCourses, setSentCourses] = useState<Set<CourseTag>>(new Set())
  const [showCourseModal, setShowCourseModal] = useState(false)

  // Fallback labels
  const so = (t as any).serverOrder || {}
  const lbl = {
    title: so.title || 'Prise de commande',
    byTable: so.byTable || 'Par table',
    byCustomer: so.byCustomer || 'Par client',
    customerName: so.customerName || 'Nom du client',
    enterCustomerName: so.enterCustomerName || 'Entrez le nom du client...',
    startOrder: so.startOrder || 'Commencer la commande',
    sendOrder: so.sendOrder || 'Envoyer',
    payNow: so.payNow || 'Payer',
    pendingOrders: so.pendingOrders || 'Commandes en cours',
    noPendingOrders: so.noPendingOrders || 'Aucune commande en cours',
    orderSent: so.orderSent || 'Commande envoyee !',
    orderSentDesc: so.orderSentDesc || 'La commande a ete transmise.',
    orderPaid: so.orderPaid || 'Paiement confirme !',
    quickOrder: so.quickOrder || 'Commande rapide',
    markAsPaid: so.markAsPaid || 'Encaisser',
    items: so.itemsLabel || t.pos?.items || 'articles',
    pending: so.pendingLabel || 'En attente',
    tableLabel: so.tableLabel || 'Table',
    // Transfer
    transfer: so.transfer || 'Transferer',
    transferTitle: so.transferTitle || 'Transferer la table',
    selectTargetTable: so.selectTargetTable || 'Selectionnez la table de destination',
    transferSuccess: so.transferSuccess || 'Table transferee !',
    // Merge
    merge: so.merge || 'Fusionner',
    mergeTitle: so.mergeTitle || 'Fusionner les tables',
    selectTablesToMerge: so.selectTablesToMerge || 'Selectionnez les tables a fusionner',
    primaryTable: so.primaryTable || 'Table principale',
    mergeTables: so.mergeTables || 'Fusionner les tables',
    mergeSuccess: so.mergeSuccess || 'Tables fusionnees !',
    // Split bill
    splitBill: so.splitBill || 'Diviser par convive',
    splitBillTitle: so.splitBillTitle || "Diviser l'addition",
    guest: so.guest || 'Convive',
    addGuest: so.addGuest || 'Ajouter un convive',
    assignToGuest: so.assignToGuest || 'Assigner au convive',
    guestSubtotal: so.guestSubtotal || 'Sous-total convive',
    payGuest: so.payGuest || 'Payer pour ce convive',
    guestPaid: so.guestPaid || 'Convive paye',
    allGuestsPaid: so.allGuestsPaid || 'Tous les convives ont paye !',
    unassigned: so.unassigned || 'Non assigne',
    // Coursing
    course: so.course || 'Service',
    courseEntree: so.courseEntree || 'Entree',
    coursePlat: so.coursePlat || 'Plat',
    courseDessert: so.courseDessert || 'Dessert',
    courseBoisson: so.courseBoisson || 'Boisson',
    sendCourse: so.sendCourse || 'Envoyer le service',
    sendNextCourse: so.sendNextCourse || 'Envoyer service suivant',
    courseLabel: so.courseLabel || 'Service',
    allCoursesSent: so.allCoursesSent || 'Tous les services envoyes',
    courseSent: so.courseSent || 'Service envoye !',
    setCourse: so.setCourse || 'Definir le service',
  }

  const courseLabels: Record<CourseTag, string> = {
    entree: lbl.courseEntree,
    plat: lbl.coursePlat,
    dessert: lbl.courseDessert,
    boisson: lbl.courseBoisson,
  }

  const courseColors: Record<CourseTag, string> = {
    entree: C.orange,
    plat: C.primary,
    dessert: C.purple,
    boisson: C.teal,
  }

  // Always reload data on mount (ensures newly created tables/products appear)
  useEffect(() => {
    if (storeId) {
      loadProducts(storeId)
      loadOrders(storeId)
      loadPromotions(storeId)
      if (hasTableSupport) loadTables(storeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

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

  // Pending orders for current store
  const pendingOrders = useMemo(() =>
    orders.filter(o => o.status === 'pending' && o.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)),
    [orders]
  )

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table)
    clear()
    setCourseTags({})
    setSentCourses(new Set())
    setStep('order')
  }

  const handleStartCustomerOrder = () => {
    if (!customerName.trim()) return
    clear()
    setCourseTags({})
    setSentCourses(new Set())
    setStep('order')
  }

  const handleBackToIdentify = () => {
    setStep('identify')
    setSelectedTable(null)
    setCustomerName('')
    clear()
    setSearchQuery('')
    setSelectedCategory(null)
    setCourseTags({})
    setSentCourses(new Set())
  }

  const handleSendOrder = async () => {
    if (items.length === 0 || !user || !storeId) return

    try {
      // Calculate promotion discount
      const promoResult = calculateTotalDiscount(items, storeId)
      const promoDiscount = promoResult.total
      const promoNames = promoResult.applied.map(a => a.promotion.name)

      const order = await createOrder(items, 'cash', user.id, storeId, {
        table_id: selectedTable?.id,
        table_name: selectedTable ? `${lbl.tableLabel} #${selectedTable.number}` : undefined,
        customer_name: identifyMode === 'customer' ? customerName : undefined,
        status: 'pending',
        promotion_discount: promoDiscount > 0 ? promoDiscount : undefined,
        promotion_names: promoNames.length > 0 ? promoNames : undefined,
      })

      // Set table to occupied right after order creation (same try block)
      if (selectedTable) {
        await setTableStatus(selectedTable.id, 'occupied')
      }

      // Record customer visit if a customer is selected
      if (selectedCustomer) {
        recordVisit(selectedCustomer.id, order.total).catch(() => {})
      }

      clear()
      setOrderSuccess('sent')
      setTimeout(() => {
        setOrderSuccess(null)
        handleBackToIdentify()
      }, 2000)
    } catch (err) {
      console.error('Failed to send order:', err)
    }
  }

  const handlePaymentConfirm = async (paymentMethod: PaymentMethod) => {
    if (!user || !storeId) return

    try {
      // Calculate promotion discount
      const promoResult = calculateTotalDiscount(items, storeId)
      const promoDiscount = promoResult.total
      const promoNames = promoResult.applied.map(a => a.promotion.name)

      const order = await createOrder(items, paymentMethod, user.id, storeId, {
        table_id: selectedTable?.id,
        table_name: selectedTable ? `${lbl.tableLabel} #${selectedTable.number}` : undefined,
        customer_name: identifyMode === 'customer' ? customerName : undefined,
        promotion_discount: promoDiscount > 0 ? promoDiscount : undefined,
        promotion_names: promoNames.length > 0 ? promoNames : undefined,
      })

      // Free the table right after order creation (same try block)
      if (selectedTable) {
        await setTableStatus(selectedTable.id, 'free')
      }

      // Record customer visit if a customer is selected
      if (selectedCustomer) {
        recordVisit(selectedCustomer.id, order.total).catch(() => {})
      }

      setShowPaymentModal(false)
      clear()
      setOrderSuccess('paid')
      setTimeout(() => {
        setOrderSuccess(null)
        handleBackToIdentify()
      }, 2000)
    } catch (err) {
      console.error('Payment failed:', err)
    }
  }

  const handlePayPendingOrder = async (order: Order, paymentMethod: PaymentMethod) => {
    try {
      await updateOrderStatus(order.id, 'paid', paymentMethod)
      if (order.table_id) {
        const table = tables.find(t => t.id === order.table_id)
        if (table) await setTableStatus(table.id, 'free')
      }
    } catch (err) {
      console.error('Failed to pay order:', err)
    }
  }

  // ── Transfer handler ──────────────────────────────────────────────────

  const handleTransferTable = useCallback(async (toTable: RestaurantTable) => {
    if (!transferFromTable) return
    try {
      await transferTable(transferFromTable.id, toTable.id)

      // Update KDS orders with new table info
      const kdsOrders = kdsStore.orders.filter(o => o.table_id === transferFromTable.id)
      for (const ko of kdsOrders) {
        await kdsStore.updateItemStatus(ko.id, -1, false) // no-op just to trigger re-render
      }

      // Update pending orders' table references
      const relatedOrders = pendingOrders.filter(o => o.table_id === transferFromTable.id)
      for (const order of relatedOrders) {
        // We update the order in IndexedDB through the order store
        await updateOrderStatus(order.id, 'pending')
      }

      setShowTransferModal(false)
      setTransferFromTable(null)
      if (storeId) loadTables(storeId)
    } catch (err) {
      console.error('Transfer failed:', err)
    }
  }, [transferFromTable, transferTable, kdsStore, pendingOrders, updateOrderStatus, storeId, loadTables])

  // ── Merge handler ──────────────────────────────────────────────────────

  const handleMergeTables = useCallback(async () => {
    if (!mergePrimaryId || mergeSelectedIds.length < 2) return
    const secondaryIds = mergeSelectedIds.filter(id => id !== mergePrimaryId)
    try {
      await mergeTables(mergePrimaryId, secondaryIds)

      // Merge items from secondary table orders into primary
      // (In a real system you'd combine the order items; here we just free secondaries)
      if (storeId) {
        loadTables(storeId)
        loadOrders(storeId)
      }

      setShowMergeModal(false)
      setMergeSelectedIds([])
      setMergePrimaryId(null)
    } catch (err) {
      console.error('Merge failed:', err)
    }
  }, [mergePrimaryId, mergeSelectedIds, mergeTables, storeId, loadTables, loadOrders])

  // ── Split bill handlers ───────────────────────────────────────────────

  const openSplitBill = useCallback(() => {
    setGuestCount(2)
    const assignments: Record<string, number> = {}
    items.forEach(item => { assignments[item.product_id] = 0 })
    setGuestAssignments(assignments)
    setGuestPaidStatus({})
    setGuestCustomAmounts({})
    setShowSplitBillModal(true)
  }, [items])

  const getGuestItems = useCallback((guestIndex: number): CartItem[] => {
    return items.filter(item => (guestAssignments[item.product_id] ?? 0) === guestIndex)
  }, [items, guestAssignments])

  const getGuestTotal = useCallback((guestIndex: number): number => {
    return getGuestItems(guestIndex).reduce((sum, item) => sum + item.price * item.qty, 0)
  }, [getGuestItems])

  const getGuestEffectiveTotal = useCallback((guestIndex: number): number => {
    const customStr = guestCustomAmounts[guestIndex]
    if (customStr !== undefined && customStr !== '') {
      const parsed = parseFloat(customStr)
      if (!isNaN(parsed) && parsed >= 0) return parsed
    }
    return getGuestTotal(guestIndex)
  }, [guestCustomAmounts, getGuestTotal])

  const handleEqualSplit = useCallback(() => {
    const total = getTotal()
    const perGuest = Math.floor((total / guestCount) * 100) / 100
    const newAmounts: Record<number, string> = {}
    let remaining = total
    for (let i = 0; i < guestCount; i++) {
      if (i === guestCount - 1) {
        // Last guest gets the remainder to avoid rounding issues
        newAmounts[i] = Math.round(remaining * 100 / 100).toString()
      } else {
        newAmounts[i] = perGuest.toString()
        remaining -= perGuest
      }
    }
    setGuestCustomAmounts(newAmounts)
  }, [guestCount, getTotal])

  const handlePayGuest = useCallback(async (guestIndex: number, paymentMethod: PaymentMethod) => {
    if (!user || !storeId) return
    try {
      const guestItems = getGuestItems(guestIndex)
      const effectiveTotal = getGuestEffectiveTotal(guestIndex)
      if (guestItems.length === 0 && effectiveTotal <= 0) return

      // Use guest items or create a placeholder if custom amount differs
      const orderItems = guestItems.length > 0 ? guestItems : [{
        product_id: `custom-${guestIndex}`,
        name: `${lbl.guest} ${guestIndex + 1}`,
        price: effectiveTotal,
        qty: 1,
        category: '',
      }]

      await createOrder(orderItems, paymentMethod, user.id, storeId, {
        table_id: selectedTable?.id,
        table_name: selectedTable ? `${lbl.tableLabel} #${selectedTable.number} - ${lbl.guest} ${guestIndex + 1}` : undefined,
        customer_name: identifyMode === 'customer' ? `${customerName} - ${lbl.guest} ${guestIndex + 1}` : undefined,
      })

      setGuestPaidStatus(prev => ({ ...prev, [guestIndex]: paymentMethod }))
    } catch (err) {
      console.error('Guest payment failed:', err)
    }
  }, [user, storeId, getGuestItems, getGuestEffectiveTotal, createOrder, selectedTable, lbl, identifyMode, customerName])

  const allGuestsPaid = useMemo(() => {
    for (let i = 0; i < guestCount; i++) {
      const hasItems = getGuestItems(i).length > 0
      const hasCustomAmount = getGuestEffectiveTotal(i) > 0
      if (!guestPaidStatus[i] && (hasItems || hasCustomAmount)) return false
    }
    return true
  }, [guestCount, guestPaidStatus, getGuestItems, getGuestEffectiveTotal])

  // ── Coursing handlers ─────────────────────────────────────────────────

  const currentCourse = useMemo((): CourseTag | null => {
    // Find the first unsent course that has items
    for (const tag of COURSE_TAGS) {
      if (!sentCourses.has(tag)) {
        const hasItems = items.some(item => courseTags[item.product_id] === tag)
        if (hasItems) return tag
      }
    }
    return null
  }, [items, courseTags, sentCourses])

  const nextCourse = useMemo((): CourseTag | null => {
    let foundCurrent = false
    for (const tag of COURSE_TAGS) {
      if (tag === currentCourse) { foundCurrent = true; continue }
      if (foundCurrent && !sentCourses.has(tag)) {
        const hasItems = items.some(item => courseTags[item.product_id] === tag)
        if (hasItems) return tag
      }
    }
    return null
  }, [items, courseTags, sentCourses, currentCourse])

  const handleSendCourse = useCallback(async (courseTag: CourseTag) => {
    if (!user || !storeId) return
    const courseItems = items.filter(item => courseTags[item.product_id] === courseTag)
    if (courseItems.length === 0) return

    try {
      // Send just these items to KDS
      const kdsItems = courseItems.map(item => ({
        product_name: item.name,
        quantity: item.qty,
        station: 'grill' as const,
        done: false,
      }))

      await kdsStore.addOrder(storeId, {
        order_id: `course-${Date.now()}`,
        order_number: `${lbl.courseLabel} ${COURSE_ORDER[courseTag]} - ${courseLabels[courseTag]}`,
        table_number: selectedTable ? `#${selectedTable.number}` : undefined,
        table_id: selectedTable?.id,
        items: kdsItems,
        status: 'new',
        station: 'grill',
        priority: false,
      })

      setSentCourses(prev => new Set(prev).add(courseTag))
    } catch (err) {
      console.error('Failed to send course:', err)
    }
  }, [user, storeId, items, courseTags, kdsStore, selectedTable, lbl, courseLabels])

  // ── Styles ──────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100vh', minHeight: '100vh',
    backgroundColor: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: isMobile ? 'auto' : 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    backgroundColor: C.primary, color: '#fff', padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
  }

  const backBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
    padding: '6px 10px', color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500,
  }

  const contentStyle: React.CSSProperties = {
    flex: 1, overflow: 'auto', padding: rv(12, 16, 20),
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(3, 1fr)', 'repeat(4, 1fr)'),
    gap: rv(10, 12, 14),
  }

  const modeTabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '12px 16px', border: 'none', borderRadius: 10,
    backgroundColor: active ? C.primary : C.card,
    color: active ? '#fff' : C.text,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.2s',
  })

  const tableCardStyle = (status: TableStatus, clickable?: boolean): React.CSSProperties => ({
    backgroundColor: C.card, borderRadius: 12,
    border: `2px solid ${STATUS_COLORS[status]}60`,
    padding: rv(14, 16, 18), cursor: (clickable ?? status === 'free') ? 'pointer' : 'default',
    textAlign: 'center', transition: 'transform 0.15s',
    opacity: (clickable ?? status === 'free') ? 1 : 0.5,
  })

  const productCardStyle = (inCart: boolean): React.CSSProperties => ({
    backgroundColor: C.card, borderRadius: 10,
    border: `${inCart ? 2 : 1}px solid ${inCart ? C.primary : C.border}`,
    padding: rv(10, 12, 14), cursor: 'pointer', transition: 'transform 0.1s',
  })

  const footerStyle: React.CSSProperties = {
    backgroundColor: C.card, borderTop: `1px solid ${C.border}`,
    padding: '12px 16px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexShrink: 0,
  }

  const pendingBadgeStyle: React.CSSProperties = {
    position: 'fixed', bottom: 80, right: 16,
    backgroundColor: C.orange, color: '#fff', borderRadius: 16,
    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }

  const actionBtnStyle = (color: string, disabled?: boolean): React.CSSProperties => ({
    padding: '8px 12px', borderRadius: 8, border: 'none',
    backgroundColor: disabled ? C.border : color,
    color: disabled ? C.textSecondary : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
    whiteSpace: 'nowrap',
  })

  const getStatusLabel = (status: TableStatus): string => {
    const map: Record<TableStatus, string> = {
      free: t.tables?.free || 'Free',
      occupied: t.tables?.occupied || 'Occupied',
      reserved: t.tables?.reserved || 'Reserved',
      bill_requested: t.tables?.billRequested || 'Bill',
      food_ready: (t.tables as any)?.foodReady || 'Pret a servir',
    }
    return map[status]
  }

  // ── Order success overlay ───────────────────────────────────────────────

  if (orderSuccess) {
    return (
      <div style={{
        ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: orderSuccess === 'paid' ? C.success : C.primary,
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <CheckCircle2 size={64} />
          <h2 style={{ margin: '16px 0 0', fontSize: 22 }}>
            {orderSuccess === 'paid' ? lbl.orderPaid : lbl.orderSent}
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 15, opacity: 0.9 }}>
            {lbl.orderSentDesc}
          </p>
        </div>
      </div>
    )
  }

  // ── Pending orders panel overlay ────────────────────────────────────────

  const renderPendingPanel = () => {
    if (!showPendingPanel) return null
    return (
      <div style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      }} onClick={() => setShowPendingPanel(false)}>
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: rv('85%', '400px', '420px'),
          backgroundColor: C.card, padding: 20, overflow: 'auto',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: C.text }}>{lbl.pendingOrders}</h3>
            <button onClick={() => setShowPendingPanel(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary,
            }}><X size={20} /></button>
          </div>

          {pendingOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.textSecondary }}>
              <ClipboardList size={40} strokeWidth={1.5} />
              <p style={{ margin: '12px 0 0', fontSize: 14 }}>{lbl.noPendingOrders}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingOrders.map(order => (
                <div key={order.id} style={{
                  padding: 14, borderRadius: 10, border: `1px solid ${C.border}`,
                  backgroundColor: C.bg,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {order.table_name || order.customer_name || `#${order.receipt_number || order.id.slice(0, 8)}`}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                        <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{order.items.reduce((s, i) => s + i.qty, 0)} {lbl.items}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>
                      {formatCurrency(order.total, currencyCode)}
                    </div>
                  </div>
                  {/* Items list */}
                  <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>
                    {order.items.map((item, i) => (
                      <span key={i}>{i > 0 ? ', ' : ''}{item.qty}x {item.name}</span>
                    ))}
                  </div>
                  {/* Pay buttons */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(['cash', 'momo', 'carte_bancaire'] as PaymentMethod[]).map(method => (
                      <button key={method} onClick={() => handlePayPendingOrder(order, method)} style={{
                        flex: 1, minWidth: 80, padding: '8px 10px', borderRadius: 8,
                        border: `1px solid ${C.border}`, backgroundColor: C.card,
                        cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.text,
                        textAlign: 'center',
                      }}>
                        {method === 'cash' ? `${t.pos?.cash || 'Cash'}` :
                         method === 'momo' ? 'MoMo' :
                         `${t.pos?.carteBancaire || 'CB'}`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Transfer Modal ────────────────────────────────────────────────────

  const renderTransferModal = () => {
    if (!showTransferModal) return null
    const freeTables = tables.filter(tb => tb.status === 'free')
    return (
      <ModalOverlay onClose={() => setShowTransferModal(false)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: C.text }}>
            <ArrowRightLeft size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {lbl.transferTitle}
          </h3>
          <button onClick={() => setShowTransferModal(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary,
          }}><X size={20} /></button>
        </div>
        {transferFromTable && (
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 12px' }}>
            {lbl.tableLabel} #{transferFromTable.number} → {lbl.selectTargetTable}
          </p>
        )}
        {freeTables.length === 0 ? (
          <p style={{ textAlign: 'center', color: C.textSecondary, padding: 20 }}>
            {t.tables?.noTables || 'No free tables available'}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {freeTables.map(tb => (
              <div key={tb.id} onClick={() => handleTransferTable(tb)} style={{
                ...tableCardStyle('free', true), cursor: 'pointer', opacity: 1,
              }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>#{tb.number}</p>
                <p style={{ fontSize: 11, color: C.textSecondary, margin: '2px 0 0' }}>{tb.name}</p>
              </div>
            ))}
          </div>
        )}
      </ModalOverlay>
    )
  }

  // ── Merge Modal ───────────────────────────────────────────────────────

  const renderMergeModal = () => {
    if (!showMergeModal) return null
    const occupiedTables = tables.filter(tb => tb.status === 'occupied')
    return (
      <ModalOverlay onClose={() => setShowMergeModal(false)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: C.text }}>
            <Merge size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {lbl.mergeTitle}
          </h3>
          <button onClick={() => setShowMergeModal(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary,
          }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 12px' }}>
          {lbl.selectTablesToMerge}
        </p>

        {occupiedTables.length < 2 ? (
          <p style={{ textAlign: 'center', color: C.textSecondary, padding: 20 }}>
            {t.tables?.noTables || 'Need at least 2 occupied tables'}
          </p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {occupiedTables.map(tb => {
                const selected = mergeSelectedIds.includes(tb.id)
                const isPrimary = mergePrimaryId === tb.id
                return (
                  <div key={tb.id} onClick={() => {
                    setMergeSelectedIds(prev =>
                      prev.includes(tb.id) ? prev.filter(id => id !== tb.id) : [...prev, tb.id]
                    )
                    if (!mergePrimaryId) setMergePrimaryId(tb.id)
                  }} style={{
                    backgroundColor: C.card, borderRadius: 12,
                    border: `2px solid ${selected ? (isPrimary ? C.primary : C.warning) : C.border}`,
                    padding: 14, cursor: 'pointer', textAlign: 'center',
                    opacity: 1,
                  }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>#{tb.number}</p>
                    <p style={{ fontSize: 11, color: C.textSecondary, margin: '2px 0 4px' }}>{tb.name}</p>
                    {isPrimary && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: C.primary,
                        backgroundColor: C.primary + '15', padding: '2px 6px', borderRadius: 4,
                      }}>{lbl.primaryTable}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {mergeSelectedIds.length >= 2 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>{lbl.primaryTable}:</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {mergeSelectedIds.map(id => {
                    const tb = tables.find(t => t.id === id)
                    if (!tb) return null
                    return (
                      <button key={id} onClick={() => setMergePrimaryId(id)} style={{
                        padding: '6px 12px', borderRadius: 8,
                        border: `1px solid ${mergePrimaryId === id ? C.primary : C.border}`,
                        backgroundColor: mergePrimaryId === id ? C.primary + '15' : C.card,
                        color: C.text, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      }}>
                        #{tb.number}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleMergeTables}
              disabled={mergeSelectedIds.length < 2 || !mergePrimaryId}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                backgroundColor: mergeSelectedIds.length >= 2 ? C.primary : C.border,
                color: mergeSelectedIds.length >= 2 ? '#fff' : C.textSecondary,
                cursor: mergeSelectedIds.length >= 2 ? 'pointer' : 'not-allowed',
                fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Merge size={16} />
              {lbl.mergeTables} ({mergeSelectedIds.length})
            </button>
          </>
        )}
      </ModalOverlay>
    )
  }

  // ── Split Bill Modal ──────────────────────────────────────────────────

  const renderSplitBillModal = () => {
    if (!showSplitBillModal) return null
    return (
      <ModalOverlay onClose={() => setShowSplitBillModal(false)} width="95%">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: C.text }}>
            <Split size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {lbl.splitBillTitle}
          </h3>
          <button onClick={() => setShowSplitBillModal(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary,
          }}><X size={20} /></button>
        </div>

        {/* Guest count control + equal split */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{lbl.guest}:</span>
          <button onClick={() => setGuestCount(Math.max(2, guestCount - 1))} style={{
            width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`,
            backgroundColor: C.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Minus size={14} /></button>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text, minWidth: 20, textAlign: 'center' }}>{guestCount}</span>
          <button onClick={() => setGuestCount(guestCount + 1)} style={{
            width: 30, height: 30, borderRadius: 6, border: 'none',
            backgroundColor: C.primary, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><UserPlus size={14} /></button>
          <button onClick={handleEqualSplit} style={{
            marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: 'none',
            backgroundColor: C.teal, color: '#fff', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Split size={12} /> Diviser en parts égales
          </button>
        </div>

        {/* Items assignment */}
        <div style={{ marginBottom: 16 }}>
          {items.map(item => {
            const assignedGuest = guestAssignments[item.product_id] ?? 0
            return (
              <div key={item.product_id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 8, marginBottom: 6,
                border: `1px solid ${C.border}`, backgroundColor: C.bg,
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.qty}x {item.name}</span>
                  <span style={{ fontSize: 12, color: C.textSecondary, marginLeft: 8 }}>
                    {formatCurrency(item.price * item.qty, currencyCode)}
                  </span>
                </div>
                <select
                  value={assignedGuest}
                  onChange={e => setGuestAssignments(prev => ({
                    ...prev, [item.product_id]: parseInt(e.target.value),
                  }))}
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.border}`,
                    fontSize: 12, color: C.text, backgroundColor: C.card, cursor: 'pointer',
                  }}
                >
                  {Array.from({ length: guestCount }, (_, i) => (
                    <option key={i} value={i}>{lbl.guest} {i + 1}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>

        {/* Guest subtotals and pay buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: guestCount }, (_, gIdx) => {
            const gItems = getGuestItems(gIdx)
            const gTotal = getGuestTotal(gIdx)
            const effectiveTotal = getGuestEffectiveTotal(gIdx)
            const hasCustomAmount = guestCustomAmounts[gIdx] !== undefined && guestCustomAmounts[gIdx] !== ''
            const paid = guestPaidStatus[gIdx]
            return (
              <div key={gIdx} style={{
                padding: 12, borderRadius: 10,
                border: `1px solid ${paid ? C.success : C.border}`,
                backgroundColor: paid ? C.success + '08' : C.card,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                    <User size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {lbl.guest} {gIdx + 1}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: paid ? C.success : C.primary }}>
                    {formatCurrency(effectiveTotal, currencyCode)}
                    {hasCustomAmount && gTotal !== effectiveTotal && (
                      <span style={{ fontSize: 11, fontWeight: 400, color: C.textSecondary, textDecoration: 'line-through', marginLeft: 6 }}>
                        {formatCurrency(gTotal, currencyCode)}
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8 }}>
                  {gItems.map((item, i) => (
                    <span key={i}>{i > 0 ? ', ' : ''}{item.qty}x {item.name}</span>
                  ))}
                  {gItems.length === 0 && !hasCustomAmount && <span style={{ fontStyle: 'italic' }}>{lbl.unassigned}</span>}
                </div>
                {/* Adjustment input */}
                {!paid && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, whiteSpace: 'nowrap' }}>Ajustement:</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={gTotal.toString()}
                      value={guestCustomAmounts[gIdx] ?? ''}
                      onChange={e => setGuestCustomAmounts(prev => ({
                        ...prev, [gIdx]: e.target.value,
                      }))}
                      style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6,
                        border: `1px solid ${hasCustomAmount ? C.warning : C.border}`,
                        fontSize: 13, color: C.text, outline: 'none',
                        backgroundColor: hasCustomAmount ? C.warning + '08' : C.card,
                        boxSizing: 'border-box' as const,
                      }}
                    />
                    {hasCustomAmount && (
                      <button onClick={() => setGuestCustomAmounts(prev => {
                        const next = { ...prev }
                        delete next[gIdx]
                        return next
                      })} style={{
                        width: 24, height: 24, borderRadius: 6, border: 'none',
                        backgroundColor: C.danger + '15', color: C.danger,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}
                {paid ? (
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.success, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={14} /> {lbl.guestPaid}
                  </div>
                ) : (gItems.length > 0 || effectiveTotal > 0) ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(['cash', 'card', 'momo'] as PaymentMethod[]).map(method => (
                      <button key={method} onClick={() => handlePayGuest(gIdx, method)} style={{
                        flex: 1, minWidth: 70, padding: '6px 8px', borderRadius: 6,
                        border: `1px solid ${C.border}`, backgroundColor: C.card,
                        cursor: 'pointer', fontSize: 11, fontWeight: 600, color: C.text, textAlign: 'center',
                      }}>
                        {method === 'cash' ? (t.pos?.cash || 'Cash') :
                         method === 'card' ? (t.pos?.carteBancaire || 'Card') : 'MoMo'}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Total mismatch warning */}
        {(() => {
          const orderTotal = getTotal()
          const customTotal = Array.from({ length: guestCount }, (_, i) => getGuestEffectiveTotal(i))
            .reduce((sum, v) => sum + v, 0)
          const diff = Math.abs(orderTotal - customTotal)
          if (diff > 0.01) {
            return (
              <div style={{
                marginTop: 12, padding: 10, borderRadius: 8,
                backgroundColor: C.warning + '15', border: `1px solid ${C.warning}40`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>&#9888;</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.warning }}>
                  Total convives ({formatCurrency(customTotal, currencyCode)}) ≠ Total commande ({formatCurrency(orderTotal, currencyCode)})
                  {' — '}Différence: {formatCurrency(diff, currencyCode)}
                </span>
              </div>
            )
          }
          return null
        })()}

        {allGuestsPaid && (
          <div style={{
            marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: C.success + '15',
            textAlign: 'center', color: C.success, fontSize: 14, fontWeight: 700,
          }}>
            <CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {lbl.allGuestsPaid}
          </div>
        )}

        {allGuestsPaid && (
          <button onClick={() => {
            setShowSplitBillModal(false)
            if (selectedTable) setTableStatus(selectedTable.id, 'free')
            clear()
            setOrderSuccess('paid')
            setTimeout(() => { setOrderSuccess(null); handleBackToIdentify() }, 2000)
          }} style={{
            marginTop: 10, width: '100%', padding: 12, borderRadius: 10, border: 'none',
            backgroundColor: C.success, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            {t.common?.close || 'Close'}
          </button>
        )}
      </ModalOverlay>
    )
  }

  // ── Coursing Modal ────────────────────────────────────────────────────

  const renderCourseModal = () => {
    if (!showCourseModal) return null
    return (
      <ModalOverlay onClose={() => setShowCourseModal(false)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: C.text }}>
            <ChefHat size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {lbl.setCourse}
          </h3>
          <button onClick={() => setShowCourseModal(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary,
          }}><X size={20} /></button>
        </div>

        {/* Assign course tag per item */}
        {items.map(item => {
          const tag = courseTags[item.product_id]
          return (
            <div key={item.product_id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 8, marginBottom: 6,
              border: `1px solid ${C.border}`, backgroundColor: C.bg,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>
                {item.qty}x {item.name}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {COURSE_TAGS.map(ct => (
                  <button key={ct} onClick={() => setCourseTags(prev => ({ ...prev, [item.product_id]: ct }))} style={{
                    padding: '4px 8px', borderRadius: 6, border: 'none',
                    backgroundColor: tag === ct ? courseColors[ct] : C.bg,
                    color: tag === ct ? '#fff' : C.textSecondary,
                    cursor: 'pointer', fontSize: 10, fontWeight: 600,
                  }}>
                    {courseLabels[ct]}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {/* Course status summary */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {COURSE_TAGS.map(ct => {
            const courseItems = items.filter(item => courseTags[item.product_id] === ct)
            if (courseItems.length === 0) return null
            const isSent = sentCourses.has(ct)
            return (
              <div key={ct} style={{
                padding: 10, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: `1px solid ${isSent ? C.success : courseColors[ct]}30`,
                backgroundColor: isSent ? C.success + '08' : courseColors[ct] + '08',
              }}>
                <div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: isSent ? C.success : courseColors[ct],
                    marginRight: 6,
                  }}>
                    {lbl.courseLabel} {COURSE_ORDER[ct]}: {courseLabels[ct]}
                  </span>
                  <span style={{ fontSize: 11, color: C.textSecondary }}>
                    ({courseItems.length} {lbl.items})
                  </span>
                </div>
                {isSent ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.success, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} /> {lbl.courseSent}
                  </span>
                ) : (
                  <button onClick={() => handleSendCourse(ct)} style={actionBtnStyle(courseColors[ct])}>
                    <Send size={12} /> {lbl.sendCourse}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <button onClick={() => setShowCourseModal(false)} style={{
          marginTop: 16, width: '100%', padding: 10, borderRadius: 8,
          border: 'none', backgroundColor: C.bg, color: C.textSecondary,
          cursor: 'pointer', fontSize: 14,
        }}>
          {t.common?.close || 'Close'}
        </button>
      </ModalOverlay>
    )
  }

  // ── Step 1: Order identification ────────────────────────────────────────

  if (step === 'identify') {
    const freeTables = tables.filter(t => t.status === 'free')
    const occupiedTables = tables.filter(t => t.status !== 'free')

    return (
      <div style={pageStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <ClipboardList size={22} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{lbl.title}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {currentStore?.name || 'POS'} · {user?.name || ''}
            </div>
          </div>
          {pendingOrders.length > 0 && (
            <button onClick={() => setShowPendingPanel(true)} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
              padding: '6px 12px', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}>
              <Clock size={14} />
              {pendingOrders.length}
            </button>
          )}
        </div>

        <div style={contentStyle}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {hasTableSupport && (
              <button style={modeTabStyle(identifyMode === 'table')} onClick={() => setIdentifyMode('table')}>
                <Grid3X3 size={18} /> {lbl.byTable}
              </button>
            )}
            <button style={modeTabStyle(identifyMode === 'customer')} onClick={() => setIdentifyMode('customer')}>
              <User size={18} /> {lbl.byCustomer}
            </button>
          </div>

          {/* Table mode */}
          {identifyMode === 'table' && hasTableSupport && (
            <>
              {/* Transfer / Merge action buttons */}
              {occupiedTables.length >= 2 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button onClick={() => setShowMergeModal(true)} style={actionBtnStyle(C.purple)}>
                    <Merge size={14} /> {lbl.merge} ({occupiedTables.length})
                  </button>
                </div>
              )}

              {freeTables.length > 0 && (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.success, margin: '0 0 10px' }}>
                    {t.tables?.freeCount || 'Available'} ({freeTables.length})
                  </p>
                  <div style={{ ...gridStyle, marginBottom: 20 }}>
                    {freeTables.map(table => (
                      <div key={table.id} style={tableCardStyle(table.status)} onClick={() => handleSelectTable(table)}>
                        <p style={{ fontSize: rv(22, 26, 28), fontWeight: 700, color: C.text, margin: 0 }}>
                          #{table.number}
                        </p>
                        <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 6px' }}>{table.name}</p>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 8px', borderRadius: 6,
                          backgroundColor: C.success + '15', fontSize: 11, color: C.success,
                        }}>
                          {getStatusLabel('free')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textSecondary, marginTop: 6, justifyContent: 'center' }}>
                          <Users size={12} /> {table.capacity}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {occupiedTables.length > 0 && (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, margin: '0 0 10px' }}>
                    {t.tables?.occupiedCount || 'Occupied'} ({occupiedTables.length})
                  </p>
                  <div style={gridStyle}>
                    {occupiedTables.map(table => (
                      <div key={table.id} style={{ ...tableCardStyle(table.status, true), opacity: 1, cursor: 'pointer' }}>
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
                        {/* Transfer button on occupied tables */}
                        <div style={{ marginTop: 8 }}>
                          <button onClick={(e) => {
                            e.stopPropagation()
                            setTransferFromTable(table)
                            setShowTransferModal(true)
                          }} style={{
                            padding: '4px 10px', borderRadius: 6, border: 'none',
                            backgroundColor: C.blue + '15', color: C.blue,
                            cursor: 'pointer', fontSize: 10, fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            <ArrowRightLeft size={10} /> {lbl.transfer}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tables.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.textSecondary }}>
                  <Grid3X3 size={48} strokeWidth={1.5} />
                  <p style={{ margin: '12px 0 0', fontSize: 14 }}>{t.tables?.noTables || 'No tables configured'}</p>
                </div>
              )}
            </>
          )}

          {/* Customer name mode */}
          {identifyMode === 'customer' && (
            <div style={{ maxWidth: 400, margin: '0 auto' }}>
              <div style={{
                padding: 20, backgroundColor: C.card, borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>
                  {lbl.customerName}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <User size={18} color={C.textSecondary} />
                  <input
                    style={{
                      flex: 1, padding: '12px 14px', borderRadius: 10,
                      border: `2px solid ${customerName.trim() ? C.primary : C.border}`,
                      fontSize: 16, fontWeight: 500, color: C.text, outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    placeholder={lbl.enterCustomerName}
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleStartCustomerOrder()}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleStartCustomerOrder}
                  disabled={!customerName.trim()}
                  style={{
                    width: '100%', padding: '14px 20px', borderRadius: 10,
                    border: 'none', fontSize: 15, fontWeight: 600,
                    backgroundColor: customerName.trim() ? C.primary : C.border,
                    color: customerName.trim() ? '#fff' : C.textSecondary,
                    cursor: customerName.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <ShoppingCart size={18} />
                  {lbl.startOrder}
                </button>
              </div>
            </div>
          )}

          {/* Pending orders summary on identify page */}
          {pendingOrders.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.orange, margin: 0 }}>
                  {lbl.pendingOrders} ({pendingOrders.length})
                </p>
                <button onClick={() => setShowPendingPanel(true)} style={{
                  background: 'none', border: 'none', color: C.primary,
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}>
                  {t.common?.viewAll || 'View all'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingOrders.slice(0, 3).map(order => (
                  <div key={order.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10, backgroundColor: C.card,
                    border: `1px solid ${C.orange}30`,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                        {order.table_name || order.customer_name || `#${order.receipt_number || order.id.slice(0, 8)}`}
                      </div>
                      <div style={{ fontSize: 11, color: C.textSecondary }}>
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{order.items.reduce((s, i) => s + i.qty, 0)} {lbl.items}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.orange }}>
                      {formatCurrency(order.total, currencyCode)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {renderPendingPanel()}
        {renderTransferModal()}
        {renderMergeModal()}
      </div>
    )
  }

  // ── Step 2: Order taking ────────────────────────────────────────────────

  const orderLabel = selectedTable
    ? `${selectedTable.name || lbl.tableLabel + ' #' + selectedTable.number}`
    : customerName

  // Count how many items have course tags assigned
  const taggedItemCount = items.filter(item => courseTags[item.product_id]).length
  const allCoursesSent = taggedItemCount > 0 && COURSE_TAGS.every(ct => {
    const hasItems = items.some(item => courseTags[item.product_id] === ct)
    return !hasItems || sentCourses.has(ct)
  })

  return (
    <div style={pageStyle}>
      {/* Header with order info */}
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={handleBackToIdentify}>
          <ChevronLeft size={16} /> {t.common?.back || 'Back'}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{orderLabel}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {selectedTable
              ? `#${selectedTable.number} · ${selectedTable.capacity} ${(t.tables?.capacity || 'places').toLowerCase()}`
              : lbl.byCustomer
            }
          </div>
        </div>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
          padding: '6px 12px', fontSize: 13, fontWeight: 600,
        }}>
          <ShoppingCart size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {items.length} · {formatCurrency(getTotal(), currencyCode)}
        </div>
      </div>

      {/* Action bar for coursing and split bill */}
      {items.length > 0 && hasTableSupport && (
        <div style={{
          display: 'flex', gap: 6, padding: '8px 16px', backgroundColor: C.card,
          borderBottom: `1px solid ${C.border}`, flexShrink: 0, overflowX: 'auto',
        }}>
          <button onClick={() => setShowCourseModal(true)} style={actionBtnStyle(C.teal)}>
            <ChefHat size={14} /> {lbl.course}
            {taggedItemCount > 0 && <span style={{
              backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '1px 6px', fontSize: 10,
            }}>{taggedItemCount}</span>}
          </button>
          {currentCourse && !sentCourses.has(currentCourse) && (
            <button onClick={() => handleSendCourse(currentCourse)} style={actionBtnStyle(courseColors[currentCourse])}>
              <Send size={12} /> {lbl.sendCourse}: {courseLabels[currentCourse]}
            </button>
          )}
          {nextCourse && (
            <button onClick={() => handleSendCourse(nextCourse)} style={actionBtnStyle(courseColors[nextCourse])}>
              <Send size={12} /> {lbl.sendNextCourse}: {courseLabels[nextCourse]}
            </button>
          )}
          {allCoursesSent && taggedItemCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: C.success, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}>
              <CheckCircle2 size={12} /> {lbl.allCoursesSent}
            </span>
          )}
        </div>
      )}

      {/* Search + categories */}
      <div style={{ padding: '12px 16px 0', backgroundColor: C.card, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary }} />
            <input
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                border: `1px solid ${C.border}`, fontSize: 14, color: C.text,
                outline: 'none', boxSizing: 'border-box', backgroundColor: C.card,
              }}
              placeholder={t.pos?.searchProducts || 'Search...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10 }}>
          <button
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none',
              backgroundColor: !selectedCategory ? C.primary : C.bg,
              color: !selectedCategory ? '#fff' : C.text,
              fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
            onClick={() => setSelectedCategory(null)}
          >
            {t.common?.all || 'All'}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                backgroundColor: selectedCategory === cat ? C.primary : C.bg,
                color: selectedCategory === cat ? '#fff' : C.text,
                fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
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
            const courseTag = courseTags[product.id]
            return (
              <div key={product.id} style={productCardStyle(!!inCart)} onClick={() => addItem(product)}>
                <p style={{
                  fontSize: 13, fontWeight: 600, color: C.text, margin: '0 0 4px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {product.name}
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.primary, margin: 0 }}>
                  {formatCurrency(product.price, currencyCode)}
                </p>
                {/* Course tag badge */}
                {inCart && courseTag && (
                  <span style={{
                    display: 'inline-block', marginTop: 4, padding: '1px 6px', borderRadius: 4,
                    fontSize: 9, fontWeight: 700, color: '#fff', backgroundColor: courseColors[courseTag],
                  }}>{courseLabels[courseTag]}</span>
                )}
                {inCart && (
                  <div style={{
                    marginTop: 6, display: 'flex', alignItems: 'center',
                    gap: 8, justifyContent: 'center',
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
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        backgroundColor: C.primary, color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    ><Plus size={14} /></button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer with actions */}
      <div style={footerStyle}>
        <div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>
            {items.reduce((s, i) => s + i.qty, 0)} {lbl.items}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
            {formatCurrency(getTotal(), currencyCode)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {items.length > 0 && (
            <button onClick={() => clear()} style={{
              padding: '10px 14px', borderRadius: 8,
              border: `1px solid ${C.danger}30`, backgroundColor: C.danger + '08',
              color: C.danger, cursor: 'pointer', fontSize: 13,
            }}>
              <X size={14} />
            </button>
          )}
          {/* Split bill button */}
          {items.length > 0 && (
            <button onClick={openSplitBill} style={actionBtnStyle(C.purple)}>
              <Split size={14} /> {lbl.splitBill}
            </button>
          )}
          {/* Send order (pending) */}
          <button
            onClick={handleSendOrder}
            disabled={items.length === 0}
            style={{
              padding: '12px 16px', borderRadius: 10, border: 'none',
              backgroundColor: items.length > 0 ? C.orange : C.border,
              color: items.length > 0 ? '#fff' : C.textSecondary,
              cursor: items.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Send size={16} />
            {lbl.sendOrder}
          </button>
          {/* Pay now (if authorized: admin, manager, cashier) */}
          {user && ['admin', 'manager', 'cashier'].includes(user.role) && (
            <button
              onClick={() => items.length > 0 && setShowPaymentModal(true)}
              disabled={items.length === 0}
              style={{
                padding: '12px 16px', borderRadius: 10, border: 'none',
                backgroundColor: items.length > 0 ? C.success : C.border,
                color: items.length > 0 ? '#fff' : C.textSecondary,
                cursor: items.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Banknote size={16} />
              {lbl.payNow}
            </button>
          )}
        </div>
      </div>

      {/* Pending orders floating badge */}
      {pendingOrders.length > 0 && (
        <div style={pendingBadgeStyle} onClick={() => setShowPendingPanel(true)}>
          <Clock size={16} />
          {pendingOrders.length} {lbl.pending}
        </div>
      )}

      {/* Payment modal */}
      {showPaymentModal && (
        <ModalOverlay onClose={() => setShowPaymentModal(false)}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: C.text }}>
            {t.pos?.confirmPayment || 'Confirm Payment'}
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: C.primary }}>
            {formatCurrency(getTotal(), currencyCode)}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['cash', 'card', 'momo', 'mtn_money', 'orange_money', 'transfer'] as PaymentMethod[]).map(method => {
              const labels: Record<string, string> = {
                cash: `${t.pos?.cash || 'Cash'}`,
                card: `${t.pos?.carteBancaire || 'Card'}`,
                momo: 'Mobile Money',
                mtn_money: 'MTN MoMo',
                orange_money: 'Orange Money',
                transfer: `${t.pos?.transfer || 'Transfer'}`,
              }
              return (
                <button key={method} onClick={() => handlePaymentConfirm(method)} style={{
                  padding: '14px 16px', borderRadius: 10, border: `1px solid ${C.border}`,
                  backgroundColor: C.card, cursor: 'pointer', fontSize: 15, fontWeight: 600,
                  color: C.text, textAlign: 'left',
                }}>
                  {labels[method] || method}
                </button>
              )
            })}
          </div>
          <button onClick={() => setShowPaymentModal(false)} style={{
            marginTop: 12, width: '100%', padding: '10px', borderRadius: 8,
            border: 'none', backgroundColor: C.bg, color: C.textSecondary,
            cursor: 'pointer', fontSize: 14,
          }}>
            {t.common?.cancel || 'Cancel'}
          </button>
        </ModalOverlay>
      )}

      {renderPendingPanel()}
      {renderSplitBillModal()}
      {renderCourseModal()}
    </div>
  )
}
