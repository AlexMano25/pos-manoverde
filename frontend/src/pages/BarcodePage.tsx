import { useState, useEffect, useMemo } from 'react'
import {
  ScanBarcode,
  Plus,
  Search,
  Trash2,
  Edit2,
  Eye,
  Printer,
  Download,
  QrCode,
  Hash,
  CheckCircle,
  Filter,
  Tag,
  Layers,
  Activity,
  Clock,
  Package,
  User,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useBarcodeStore } from '../stores/barcodeStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import { generateUUID } from '../utils/uuid'
import type {
  BarcodeBatch,
  BarcodeBatchStatus,
  BarcodeBatchItem,
  BarcodeFormat,
  ScanLog,
} from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#0891b2',
  primaryLight: '#cffafe',
  primaryDark: '#0e7490',
  primaryDeep: '#155e75',
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
  teal: '#0d9488',
  tealBg: '#ccfbf1',
} as const

// ── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BarcodeBatchStatus, { color: string; bg: string }> = {
  pending:   { color: '#f59e0b', bg: '#fffbeb' },
  generated: { color: '#2563eb', bg: '#eff6ff' },
  printed:   { color: '#16a34a', bg: '#f0fdf4' },
  applied:   { color: '#0d9488', bg: '#ccfbf1' },
}

const ALL_STATUSES: BarcodeBatchStatus[] = ['pending', 'generated', 'printed', 'applied']

// ── Format config ─────────────────────────────────────────────────────────

const BARCODE_FORMATS: BarcodeFormat[] = ['EAN13', 'EAN8', 'UPC', 'CODE128', 'CODE39', 'QR']

const FORMAT_LABELS: Record<BarcodeFormat, string> = {
  EAN13: 'EAN-13',
  EAN8: 'EAN-8',
  UPC: 'UPC-A',
  CODE128: 'Code 128',
  CODE39: 'Code 39',
  QR: 'QR Code',
}

// ── Scan type config ──────────────────────────────────────────────────────

type ScanType = ScanLog['scan_type']

const SCAN_TYPE_CONFIG: Record<ScanType, { color: string; bg: string; label: string }> = {
  sale:      { color: '#16a34a', bg: '#f0fdf4', label: 'Sale' },
  stock_in:  { color: '#2563eb', bg: '#eff6ff', label: 'Stock In' },
  stock_out: { color: '#f59e0b', bg: '#fffbeb', label: 'Stock Out' },
  inventory: { color: '#7c3aed', bg: '#f5f3ff', label: 'Inventory' },
  lookup:    { color: '#64748b', bg: '#f8fafc', label: 'Lookup' },
}

// ── Template options ──────────────────────────────────────────────────────

const TEMPLATE_OPTIONS = [
  { value: 'standard', label: 'Standard (50mm x 25mm)' },
  { value: 'small', label: 'Small (30mm x 15mm)' },
  { value: 'large', label: 'Large (70mm x 35mm)' },
  { value: 'shelf', label: 'Shelf Tag (60mm x 40mm)' },
  { value: 'jewelry', label: 'Jewelry (40mm x 10mm)' },
  { value: 'custom', label: 'Custom Size' },
]

// ── Tab type ──────────────────────────────────────────────────────────────

type TabKey = 'batches' | 'scanlog'

// ── Component ─────────────────────────────────────────────────────────────

export default function BarcodePage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    batches,
    loading,
    filterStatus,
    loadBatches,
    addBatch,
    updateBatch,
    deleteBatch,
    generateBarcodes,
    markPrinted,
    markApplied,
    getPendingPrint,
    getTotalLabels,
    setFilterStatus,
  } = useBarcodeStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n
  const bc = (t as Record<string, any>).barcode || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: bc.title || 'Barcode & Scanning',
    subtitle: bc.subtitle || 'Manage barcode batches, generate labels, and track scans',
    addBatch: bc.addBatch || 'New Batch',
    editBatch: bc.editBatch || 'Edit Batch',
    viewBatch: bc.viewBatch || 'Batch Details',
    previewLabels: bc.previewLabels || 'Preview Labels',
    totalBatches: bc.totalBatches || 'Total Batches',
    pendingPrint: bc.pendingPrint || 'Pending Print',
    scansToday: bc.scansToday || 'Scans Today',
    productsWithBarcode: bc.productsWithBarcode || 'Products with Barcode',
    batchNumber: bc.batchNumber || 'Batch #',
    batchName: bc.batchName || 'Batch Name',
    format: bc.format || 'Format',
    totalLabels: bc.totalLabels || 'Total Labels',
    generated: bc.generated || 'Generated',
    printed: bc.printed || 'Printed',
    status: bc.status || 'Status',
    date: bc.date || 'Date',
    actions: bc.actions || 'Actions',
    productName: bc.productName || 'Product Name',
    barcode: bc.barcode || 'Barcode',
    sku: bc.sku || 'SKU',
    price: bc.price || 'Price',
    quantity: bc.quantity || 'Qty Labels',
    notes: bc.notes || 'Notes',
    template: bc.template || 'Template',
    labelSize: bc.labelSize || 'Label Size',
    widthMm: bc.widthMm || 'Width (mm)',
    heightMm: bc.heightMm || 'Height (mm)',
    createdBy: bc.createdBy || 'Created By',
    printedAt: bc.printedAt || 'Printed At',
    addItem: bc.addItem || 'Add Item',
    removeItem: bc.removeItem || 'Remove',
    allStatuses: bc.allStatuses || 'All Statuses',
    noBatches: bc.noBatches || 'No barcode batches yet',
    noBatchesDesc: bc.noBatchesDesc || 'Start by creating a new batch to generate barcode labels.',
    noResults: bc.noResults || 'No batches match your filters',
    noResultsDesc: bc.noResultsDesc || 'Try adjusting the filters or search query.',
    generate: bc.generate || 'Generate',
    print: bc.print || 'Print',
    markApplied: bc.markApplied || 'Mark Applied',
    delete: bc.delete || 'Delete',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    batchesCount: bc.batchesCount || 'batches',
    deleteConfirm: bc.deleteConfirm || 'Are you sure you want to delete this batch?',
    tabBatches: bc.tabBatches || 'Barcode Batches',
    tabScanLog: bc.tabScanLog || 'Scan Log',
    scanBarcode: bc.scanBarcode || 'Barcode',
    scanProduct: bc.scanProduct || 'Product',
    scanType: bc.scanType || 'Scan Type',
    scannedBy: bc.scannedBy || 'Scanned By',
    timestamp: bc.timestamp || 'Timestamp',
    noScans: bc.noScans || 'No scan entries yet',
    noScansDesc: bc.noScansDesc || 'Scans will appear here as barcodes are scanned in the POS.',
    preview: bc.preview || 'Preview',
    download: bc.download || 'Download',
    // Status labels
    st_pending: bc.st_pending || 'Pending',
    st_generated: bc.st_generated || 'Generated',
    st_printed: bc.st_printed || 'Printed',
    st_applied: bc.st_applied || 'Applied',
    // Scan type labels
    sc_sale: bc.sc_sale || 'Sale',
    sc_stock_in: bc.sc_stock_in || 'Stock In',
    sc_stock_out: bc.sc_stock_out || 'Stock Out',
    sc_inventory: bc.sc_inventory || 'Inventory',
    sc_lookup: bc.sc_lookup || 'Lookup',
  }

  const statusLabel = (s: BarcodeBatchStatus): string => (L as Record<string, string>)[`st_${s}`] || s
  const scanTypeLabel = (st: ScanType): string => (L as Record<string, string>)[`sc_${st}`] || st

  // ── Local state ───────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<TabKey>('batches')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBatch, setEditingBatch] = useState<BarcodeBatch | null>(null)
  const [viewingBatch, setViewingBatch] = useState<BarcodeBatch | null>(null)
  const [previewBatch, setPreviewBatch] = useState<BarcodeBatch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formFormat, setFormFormat] = useState<BarcodeFormat>('EAN13')
  const [formItems, setFormItems] = useState<BarcodeBatchItem[]>([])
  const [formTemplate, setFormTemplate] = useState('standard')
  const [formWidthMm, setFormWidthMm] = useState('50')
  const [formHeightMm, setFormHeightMm] = useState('25')
  const [formNotes, setFormNotes] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // Scan log mock data
  const [scanLogs] = useState<ScanLog[]>(() => generateMockScans())

  // ── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    loadBatches(storeId)
  }, [storeId, loadBatches])

  // ── Filtered and searched batches ────────────────────────────────────

  const filteredBatches = useMemo(() => {
    let result = [...batches]

    if (filterStatus !== 'all') {
      result = result.filter((b) => b.status === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (b) =>
          b.batch_number.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q) ||
          b.format.toLowerCase().includes(q) ||
          (b.notes && b.notes.toLowerCase().includes(q)) ||
          b.items.some(
            (item) =>
              item.product_name.toLowerCase().includes(q) ||
              item.barcode.toLowerCase().includes(q)
          )
      )
    }

    return result
  }, [batches, filterStatus, searchQuery])

  // ── Filtered scan logs ──────────────────────────────────────────────

  const filteredScans = useMemo(() => {
    if (!searchQuery.trim()) return scanLogs
    const q = searchQuery.toLowerCase()
    return scanLogs.filter(
      (s) =>
        s.barcode.toLowerCase().includes(q) ||
        (s.product_name && s.product_name.toLowerCase().includes(q)) ||
        s.scanned_by_name.toLowerCase().includes(q)
    )
  }, [scanLogs, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const pendingPrintCount = getPendingPrint().length
  const totalLabels = getTotalLabels()

  const scansToday = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    return scanLogs.filter((s) => s.created_at.startsWith(todayStr)).length
  }, [scanLogs])

  const productsWithBarcode = useMemo(() => {
    const productIds = new Set<string>()
    batches.forEach((b) => {
      b.items.forEach((item) => {
        if (item.product_id) productIds.add(item.product_id)
      })
    })
    return productIds.size
  }, [batches])

  // ── Form helpers ──────────────────────────────────────────────────────

  function resetForm() {
    setFormName('')
    setFormFormat('EAN13')
    setFormItems([])
    setFormTemplate('standard')
    setFormWidthMm('50')
    setFormHeightMm('25')
    setFormNotes('')
    setEditingBatch(null)
  }

  function openAddModal() {
    resetForm()
    setFormItems([
      { product_id: '', product_name: '', barcode: '', sku: '', price: 0, quantity: 1 },
    ])
    setShowModal(true)
  }

  function openEditModal(batch: BarcodeBatch) {
    setEditingBatch(batch)
    setFormName(batch.name)
    setFormFormat(batch.format)
    setFormItems(batch.items.map((item) => ({ ...item })))
    setFormTemplate(batch.template || 'standard')
    setFormWidthMm(batch.label_width_mm ? String(batch.label_width_mm) : '50')
    setFormHeightMm(batch.label_height_mm ? String(batch.label_height_mm) : '25')
    setFormNotes(batch.notes || '')
    setShowModal(true)
  }

  function addItemRow() {
    setFormItems([
      ...formItems,
      { product_id: '', product_name: '', barcode: '', sku: '', price: 0, quantity: 1 },
    ])
  }

  function removeItemRow(index: number) {
    setFormItems(formItems.filter((_, i) => i !== index))
  }

  function updateItemField(index: number, field: keyof BarcodeBatchItem, value: string | number) {
    setFormItems(
      formItems.map((item, i) => {
        if (i !== index) return item
        return { ...item, [field]: value }
      })
    )
  }

  function generateRandomBarcode(format: BarcodeFormat): string {
    const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('')
    switch (format) {
      case 'EAN13': return digits(13)
      case 'EAN8': return digits(8)
      case 'UPC': return digits(12)
      case 'CODE128': return 'C128-' + digits(8)
      case 'CODE39': return 'C39-' + digits(6).toUpperCase()
      case 'QR': return 'QR-' + digits(10)
      default: return digits(13)
    }
  }

  function autoGenerateBarcodes() {
    setFormItems(
      formItems.map((item) => ({
        ...item,
        barcode: item.barcode || generateRandomBarcode(formFormat),
      }))
    )
  }

  const formTotalLabels = useMemo(
    () => formItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [formItems]
  )

  async function handleSave() {
    if (!formName.trim() || formItems.length === 0) return
    const validItems = formItems.filter((item) => item.product_name.trim() && item.barcode.trim())
    if (validItems.length === 0) return

    setFormSaving(true)
    try {
      const totalLabelsCount = validItems.reduce((sum, item) => sum + item.quantity, 0)

      if (editingBatch) {
        await updateBatch(editingBatch.id, {
          name: formName.trim(),
          format: formFormat,
          items: validItems,
          total_labels: totalLabelsCount,
          template: formTemplate,
          label_width_mm: parseFloat(formWidthMm) || 50,
          label_height_mm: parseFloat(formHeightMm) || 25,
          notes: formNotes.trim() || undefined,
        })
      } else {
        await addBatch(storeId, {
          name: formName.trim(),
          format: formFormat,
          items: validItems,
          total_labels: totalLabelsCount,
          generated_count: 0,
          printed_count: 0,
          status: 'pending' as BarcodeBatchStatus,
          template: formTemplate,
          label_width_mm: parseFloat(formWidthMm) || 50,
          label_height_mm: parseFloat(formHeightMm) || 25,
          created_by: userId,
          created_by_name: userName,
          notes: formNotes.trim() || undefined,
        })
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[BarcodePage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBatch(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[BarcodePage] Delete error:', error)
    }
  }

  async function handleGenerate(id: string) {
    try {
      await generateBarcodes(id)
    } catch (error) {
      console.error('[BarcodePage] Generate error:', error)
    }
  }

  async function handlePrint(id: string) {
    try {
      await markPrinted(id)
    } catch (error) {
      console.error('[BarcodePage] Print error:', error)
    }
  }

  async function handleApply(id: string) {
    try {
      await markApplied(id)
    } catch (error) {
      console.error('[BarcodePage] Apply error:', error)
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

  // ── Mock scan data generator ──────────────────────────────────────────

  function generateMockScans(): ScanLog[] {
    const scanTypes: ScanType[] = ['sale', 'stock_in', 'stock_out', 'inventory', 'lookup']
    const products = [
      { name: 'Premium Coffee 250g', id: 'prod-001' },
      { name: 'Organic Tea Box', id: 'prod-002' },
      { name: 'Dark Chocolate 100g', id: 'prod-003' },
      { name: 'Olive Oil 500ml', id: 'prod-004' },
      { name: 'Fresh Bread Loaf', id: 'prod-005' },
      { name: 'Natural Honey 350g', id: 'prod-006' },
      { name: 'Almond Butter 200g', id: 'prod-007' },
      { name: 'Green Juice 1L', id: 'prod-008' },
    ]
    const users = ['Marie D.', 'Jean P.', 'Admin']
    const now = new Date()
    const result: ScanLog[] = []

    for (let i = 0; i < 25; i++) {
      const hoursAgo = Math.floor(Math.random() * 72)
      const scanDate = new Date(now.getTime() - hoursAgo * 3600000)
      const prod = products[Math.floor(Math.random() * products.length)]
      result.push({
        id: generateUUID(),
        store_id: storeId,
        barcode: String(Math.floor(1000000000000 + Math.random() * 9000000000000)),
        product_id: prod.id,
        product_name: prod.name,
        scan_type: scanTypes[Math.floor(Math.random() * scanTypes.length)],
        quantity: Math.floor(Math.random() * 10) + 1,
        scanned_by: userId,
        scanned_by_name: users[Math.floor(Math.random() * users.length)],
        created_at: scanDate.toISOString(),
      })
    }

    result.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return result
  }

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

    titleWrap: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
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

    subtitle: {
      margin: 0,
      fontSize: rv(12, 13, 14),
      color: C.textSecondary,
      fontWeight: 400,
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
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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

    tabBar: {
      display: 'flex',
      gap: 0,
      marginBottom: rv(16, 20, 24),
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    } as React.CSSProperties,

    tabBtn: (active: boolean) =>
      ({
        flex: isMobile ? 1 : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: rv('12px 16px', '12px 28px', '14px 36px'),
        backgroundColor: active ? C.primary : 'transparent',
        color: active ? '#ffffff' : C.textSecondary,
        border: 'none',
        fontSize: rv(13, 14, 14),
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        transition: 'background-color 0.2s, color 0.2s',
        whiteSpace: 'nowrap',
      } as React.CSSProperties),

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
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    } as React.CSSProperties,

    tableScroll: {
      overflowX: 'auto',
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

    // Mobile card layout
    mobileCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: 14,
      marginBottom: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    } as React.CSSProperties,

    mobileCardRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    } as React.CSSProperties,

    // Form styles
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

    formSelect: {
      width: '100%',
      padding: '10px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box' as const,
      cursor: 'pointer',
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

    formRow3: {
      display: 'grid',
      gridTemplateColumns: rv('1fr', '1fr 1fr 1fr', '1fr 1fr 1fr'),
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

    // Empty state
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

    // Loading
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 60,
      color: C.textSecondary,
      fontSize: 15,
    } as React.CSSProperties,

    // Item row in form
    itemRow: {
      backgroundColor: '#f8fafc',
      borderRadius: 10,
      padding: rv(10, 12, 14),
      marginBottom: 10,
      border: `1px solid ${C.border}`,
    } as React.CSSProperties,

    itemRowHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    } as React.CSSProperties,

    removeBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 10px',
      border: 'none',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      color: C.danger,
      backgroundColor: C.dangerBg,
      cursor: 'pointer',
    } as React.CSSProperties,

    // Progress bar
    progressBar: {
      width: '100%',
      height: 6,
      backgroundColor: '#e2e8f0',
      borderRadius: 3,
      overflow: 'hidden',
    } as React.CSSProperties,

    progressFill: (pct: number) =>
      ({
        height: '100%',
        width: `${Math.min(pct, 100)}%`,
        backgroundColor: C.primary,
        borderRadius: 3,
        transition: 'width 0.3s',
      } as React.CSSProperties),

    // Barcode visual
    barcodeVisual: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
    } as React.CSSProperties,

    // View detail row
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: `1px solid ${C.border}`,
      fontSize: 14,
    } as React.CSSProperties,

    detailLabel: {
      fontWeight: 600,
      color: C.text,
      minWidth: 120,
    } as React.CSSProperties,

    detailValue: {
      color: C.textSecondary,
      textAlign: 'right' as const,
      flex: 1,
    } as React.CSSProperties,

    // Preview card
    previewCard: {
      border: `1px dashed ${C.border}`,
      borderRadius: 8,
      padding: rv(12, 16, 20),
      marginBottom: 12,
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    } as React.CSSProperties,
  }

  // ── Barcode visual helper ─────────────────────────────────────────────

  function renderBarcodeVisual(format: BarcodeFormat, code: string, small?: boolean) {
    const h = small ? 28 : 50
    const w = small ? 80 : 140

    if (format === 'QR') {
      return (
        <div
          style={{
            width: small ? 36 : 60,
            height: small ? 36 : 60,
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(7, 1fr)',
            gap: 0,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          {Array.from({ length: 49 }).map((_, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: [0,1,2,5,6,7,8,12,14,20,28,34,35,36,40,41,42,43,46,47,48].includes(idx)
                  ? '#1e293b'
                  : '#ffffff',
              }}
            />
          ))}
        </div>
      )
    }

    // Linear barcode visual
    const bars: number[] = []
    const seed = code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    const barCount = small ? 30 : 55
    for (let i = 0; i < barCount; i++) {
      bars.push((seed * (i + 1) * 7) % 3 === 0 ? 2 : 1)
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, height: h, width: w }}>
          {bars.map((barW, idx) => (
            <div
              key={idx}
              style={{
                width: barW,
                height: h - (idx % 5 === 0 ? 4 : 0),
                backgroundColor: idx % 2 === 0 ? '#1e293b' : '#ffffff',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: small ? 8 : 10, fontFamily: 'monospace', color: C.textSecondary, letterSpacing: 1 }}>
          {code.length > 16 ? code.slice(0, 16) + '...' : code}
        </span>
      </div>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && batches.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <ScanBarcode size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading barcode data...</div>
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
        <div style={s.titleWrap}>
          <h1 style={s.title}>
            <ScanBarcode size={rv(22, 26, 28)} color={C.primary} />
            {L.title}
          </h1>
          <p style={s.subtitle}>{L.subtitle}</p>
        </div>
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
          {L.addBatch}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total Batches */}
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
              <Layers size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalBatches}</span>
          </div>
          <div style={s.statValue}>{batches.length}</div>
        </div>

        {/* Pending Print */}
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
              <Printer size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.pendingPrint}</span>
          </div>
          <div style={s.statValue}>{pendingPrintCount}</div>
        </div>

        {/* Total Scans Today */}
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
              <Activity size={18} color={C.info} />
            </div>
            <span style={s.statLabel}>{L.scansToday}</span>
          </div>
          <div style={s.statValue}>{scansToday}</div>
        </div>

        {/* Products with Barcode */}
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
              <Tag size={18} color={C.success} />
            </div>
            <span style={s.statLabel}>{L.productsWithBarcode}</span>
          </div>
          <div style={s.statValue}>{productsWithBarcode}</div>
        </div>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div style={s.tabBar}>
        <button
          style={s.tabBtn(activeTab === 'batches')}
          onClick={() => setActiveTab('batches')}
          onMouseEnter={(e) => {
            if (activeTab !== 'batches') {
              e.currentTarget.style.backgroundColor = '#f1f5f9'
              e.currentTarget.style.color = C.text
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'batches') {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = C.textSecondary
            }
          }}
        >
          <QrCode size={16} />
          {L.tabBatches}
        </button>
        <button
          style={s.tabBtn(activeTab === 'scanlog')}
          onClick={() => setActiveTab('scanlog')}
          onMouseEnter={(e) => {
            if (activeTab !== 'scanlog') {
              e.currentTarget.style.backgroundColor = '#f1f5f9'
              e.currentTarget.style.color = C.text
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'scanlog') {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = C.textSecondary
            }
          }}
        >
          <Activity size={16} />
          {L.tabScanLog}
        </button>
      </div>

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

        {/* Status filter (only for batches tab) */}
        {activeTab === 'batches' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color={C.textMuted} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as BarcodeBatchStatus | 'all')}
              style={s.selectInput}
            >
              <option value="all">{L.allStatuses}</option>
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {statusLabel(st)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── BATCHES TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'batches' && (
        <>
          {batches.length === 0 ? (
            /* Empty state - no batches at all */
            <div style={{ ...s.tableWrapper, ...s.emptyState }}>
              <div style={s.emptyIcon}>
                <ScanBarcode size={48} />
              </div>
              <h3 style={s.emptyTitle}>{L.noBatches}</h3>
              <p style={s.emptyDesc}>{L.noBatchesDesc}</p>
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
                {L.addBatch}
              </button>
            </div>
          ) : filteredBatches.length === 0 ? (
            /* Empty state - filters returned nothing */
            <div style={{ ...s.tableWrapper, ...s.emptyState }}>
              <div style={s.emptyIcon}>
                <Search size={48} />
              </div>
              <h3 style={s.emptyTitle}>{L.noResults}</h3>
              <p style={s.emptyDesc}>{L.noResultsDesc}</p>
            </div>
          ) : isMobile ? (
            /* ── Mobile cards ──────────────────────────────────────────── */
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: C.textSecondary,
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                {filteredBatches.length} {L.batchesCount}
              </div>
              {filteredBatches.map((batch) => {
                const stCfg = STATUS_CONFIG[batch.status]
                const genPct = batch.total_labels > 0
                  ? (batch.generated_count / batch.total_labels) * 100
                  : 0

                return (
                  <div key={batch.id} style={s.mobileCard}>
                    {/* Top row: batch number + format */}
                    <div style={s.mobileCardRow}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                        {batch.batch_number}
                      </span>
                      <span style={s.badge(C.primaryDark, C.primaryLight)}>
                        {FORMAT_LABELS[batch.format]}
                      </span>
                    </div>

                    {/* Batch name */}
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: C.text,
                        marginBottom: 6,
                      }}
                    >
                      {batch.name}
                    </div>

                    {/* Labels info */}
                    <div
                      style={{
                        fontSize: 12,
                        color: C.textSecondary,
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>{batch.total_labels} labels</span>
                      <span>{batch.generated_count} generated</span>
                      <span>{batch.printed_count} printed</span>
                    </div>

                    {/* Progress */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={s.progressBar}>
                        <div style={s.progressFill(genPct)} />
                      </div>
                    </div>

                    {/* Status + date */}
                    <div style={{ ...s.mobileCardRow, marginBottom: 0 }}>
                      <span style={s.badge(stCfg.color, stCfg.bg)}>
                        {statusLabel(batch.status)}
                      </span>
                      <span style={{ fontSize: 11, color: C.textMuted }}>
                        {formatDate(batch.created_at)}
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
                        onClick={() => setViewingBatch(batch)}
                        style={{
                          ...s.actionBtn(C.primary),
                          width: 'auto',
                          padding: '5px 10px',
                          fontSize: 12,
                        }}
                        title={L.viewBatch}
                      >
                        <Eye size={13} />
                      </button>

                      <button
                        onClick={() => setPreviewBatch(batch)}
                        style={{
                          ...s.actionBtn(C.info),
                          width: 'auto',
                          padding: '5px 10px',
                          fontSize: 12,
                        }}
                        title={L.previewLabels}
                      >
                        <QrCode size={13} />
                      </button>

                      {batch.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openEditModal(batch)}
                            style={{
                              ...s.actionBtn(C.info),
                              width: 'auto',
                              padding: '5px 10px',
                              fontSize: 12,
                            }}
                            title={L.editBatch}
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => handleGenerate(batch.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '5px 10px',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 500,
                              color: '#ffffff',
                              backgroundColor: C.primary,
                              cursor: 'pointer',
                            }}
                          >
                            <Hash size={12} />
                            {L.generate}
                          </button>
                        </>
                      )}

                      {batch.status === 'generated' && (
                        <button
                          onClick={() => handlePrint(batch.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#ffffff',
                            backgroundColor: C.success,
                            cursor: 'pointer',
                          }}
                        >
                          <Printer size={12} />
                          {L.print}
                        </button>
                      )}

                      {batch.status === 'printed' && (
                        <button
                          onClick={() => handleApply(batch.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 10px',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#ffffff',
                            backgroundColor: C.teal,
                            cursor: 'pointer',
                          }}
                        >
                          <CheckCircle size={12} />
                          {L.markApplied}
                        </button>
                      )}

                      {batch.status === 'pending' && (
                        <button
                          onClick={() => setDeleteTarget(batch.id)}
                          style={{
                            ...s.actionBtn(C.danger),
                            width: 'auto',
                            padding: '5px 10px',
                            fontSize: 12,
                          }}
                          title={L.delete}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* ── Desktop table ──────────────────────────────────────────── */
            <div style={s.tableWrapper}>
              <div
                style={{
                  padding: '12px 16px',
                  fontSize: 12,
                  color: C.textSecondary,
                  fontWeight: 500,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {filteredBatches.length} {L.batchesCount}
              </div>
              <div style={s.tableScroll}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>{L.batchNumber}</th>
                      <th style={s.th}>{L.batchName}</th>
                      <th style={s.th}>{L.format}</th>
                      <th style={s.th}>{L.totalLabels}</th>
                      <th style={s.th}>{L.generated}/{L.printed}</th>
                      <th style={s.th}>{L.status}</th>
                      <th style={s.th}>{L.date}</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>{L.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((batch) => {
                      const stCfg = STATUS_CONFIG[batch.status]
                      const genPct = batch.total_labels > 0
                        ? (batch.generated_count / batch.total_labels) * 100
                        : 0

                      return (
                        <tr
                          key={batch.id}
                          style={{ transition: 'background-color 0.1s' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <td style={s.td}>
                            <span style={{ fontWeight: 600, color: C.primary, fontSize: 13 }}>
                              {batch.batch_number}
                            </span>
                          </td>
                          <td style={s.td}>
                            <div style={{ fontWeight: 500 }}>{batch.name}</div>
                            {batch.notes && (
                              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                                {batch.notes.length > 40 ? batch.notes.slice(0, 40) + '...' : batch.notes}
                              </div>
                            )}
                          </td>
                          <td style={s.td}>
                            <span style={s.badge(C.primaryDark, C.primaryLight)}>
                              {FORMAT_LABELS[batch.format]}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={{ fontWeight: 600 }}>{batch.total_labels}</span>
                          </td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 100 }}>
                              <div style={{ fontSize: 12, color: C.textSecondary }}>
                                {batch.generated_count} / {batch.printed_count}
                              </div>
                              <div style={s.progressBar}>
                                <div style={s.progressFill(genPct)} />
                              </div>
                            </div>
                          </td>
                          <td style={s.td}>
                            <span style={s.badge(stCfg.color, stCfg.bg)}>
                              {statusLabel(batch.status)}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={{ fontSize: 13, color: C.textSecondary }}>
                              {formatDate(batch.created_at)}
                            </span>
                          </td>
                          <td style={{ ...s.td, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button
                                onClick={() => setViewingBatch(batch)}
                                style={s.actionBtn(C.primary)}
                                title={L.viewBatch}
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
                                onClick={() => setPreviewBatch(batch)}
                                style={s.actionBtn(C.info)}
                                title={L.previewLabels}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = C.infoBg
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <QrCode size={15} />
                              </button>

                              {batch.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => openEditModal(batch)}
                                    style={s.actionBtn(C.info)}
                                    title={L.editBatch}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = C.infoBg
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <Edit2 size={15} />
                                  </button>

                                  <button
                                    onClick={() => handleGenerate(batch.id)}
                                    style={s.actionBtn(C.primary)}
                                    title={L.generate}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = C.primaryLight
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    <Hash size={15} />
                                  </button>
                                </>
                              )}

                              {batch.status === 'generated' && (
                                <button
                                  onClick={() => handlePrint(batch.id)}
                                  style={s.actionBtn(C.success)}
                                  title={L.print}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = C.successBg
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  <Printer size={15} />
                                </button>
                              )}

                              {batch.status === 'printed' && (
                                <button
                                  onClick={() => handleApply(batch.id)}
                                  style={s.actionBtn(C.teal)}
                                  title={L.markApplied}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = C.tealBg
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}

                              {batch.status === 'pending' && (
                                <button
                                  onClick={() => setDeleteTarget(batch.id)}
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
                              )}
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
        </>
      )}

      {/* ── SCAN LOG TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'scanlog' && (
        <>
          {scanLogs.length === 0 ? (
            <div style={{ ...s.tableWrapper, ...s.emptyState }}>
              <div style={s.emptyIcon}>
                <ScanBarcode size={48} />
              </div>
              <h3 style={s.emptyTitle}>{L.noScans}</h3>
              <p style={s.emptyDesc}>{L.noScansDesc}</p>
            </div>
          ) : isMobile ? (
            /* Mobile scan cards */
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: C.textSecondary,
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                {filteredScans.length} entries
              </div>
              {filteredScans.map((scan) => {
                const stCfg = SCAN_TYPE_CONFIG[scan.scan_type]

                return (
                  <div key={scan.id} style={s.mobileCard}>
                    {/* Barcode + scan type */}
                    <div style={s.mobileCardRow}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.text,
                          letterSpacing: 0.5,
                        }}
                      >
                        {scan.barcode}
                      </span>
                      <span style={s.badge(stCfg.color, stCfg.bg)}>
                        {scanTypeLabel(scan.scan_type)}
                      </span>
                    </div>

                    {/* Product name */}
                    {scan.product_name && (
                      <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>
                        <Package size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {scan.product_name}
                      </div>
                    )}

                    {/* Scanned by + timestamp */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12,
                        color: C.textMuted,
                        marginTop: 4,
                      }}
                    >
                      <span>
                        <User size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        {scan.scanned_by_name}
                      </span>
                      <span>
                        <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        {formatDateTime(scan.created_at)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Desktop scan table */
            <div style={s.tableWrapper}>
              <div
                style={{
                  padding: '12px 16px',
                  fontSize: 12,
                  color: C.textSecondary,
                  fontWeight: 500,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {filteredScans.length} entries
              </div>
              <div style={s.tableScroll}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>{L.scanBarcode}</th>
                      <th style={s.th}>{L.scanProduct}</th>
                      <th style={s.th}>{L.scanType}</th>
                      <th style={s.th}>{L.quantity}</th>
                      <th style={s.th}>{L.scannedBy}</th>
                      <th style={s.th}>{L.timestamp}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScans.map((scan) => {
                      const stCfg = SCAN_TYPE_CONFIG[scan.scan_type]

                      return (
                        <tr
                          key={scan.id}
                          style={{ transition: 'background-color 0.1s' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <td style={s.td}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: 13,
                                fontWeight: 600,
                                color: C.text,
                                letterSpacing: 0.5,
                                backgroundColor: '#f1f5f9',
                                padding: '2px 8px',
                                borderRadius: 4,
                              }}
                            >
                              {scan.barcode}
                            </span>
                          </td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Package size={14} color={C.textMuted} />
                              <span style={{ fontWeight: 500 }}>
                                {scan.product_name || '-'}
                              </span>
                            </div>
                          </td>
                          <td style={s.td}>
                            <span style={s.badge(stCfg.color, stCfg.bg)}>
                              {scanTypeLabel(scan.scan_type)}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={{ fontWeight: 500 }}>{scan.quantity || 1}</span>
                          </td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  backgroundColor: C.primaryLight,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: C.primary,
                                }}
                              >
                                {scan.scanned_by_name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: 13 }}>{scan.scanned_by_name}</span>
                            </div>
                          </td>
                          <td style={s.td}>
                            <span style={{ fontSize: 13, color: C.textSecondary }}>
                              {formatDateTime(scan.created_at)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ADD/EDIT BATCH MODAL ─────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingBatch ? L.editBatch : L.addBatch}
        size="lg"
      >
        {/* Batch Name */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.batchName}</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. March 2026 Product Labels"
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Format + Template row */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.format}</label>
            <select
              value={formFormat}
              onChange={(e) => setFormFormat(e.target.value as BarcodeFormat)}
              style={s.formSelect}
            >
              {BARCODE_FORMATS.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {FORMAT_LABELS[fmt]}
                </option>
              ))}
            </select>
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.template}</label>
            <select
              value={formTemplate}
              onChange={(e) => setFormTemplate(e.target.value)}
              style={s.formSelect}
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom dimensions if template is "custom" */}
        {formTemplate === 'custom' && (
          <div style={s.formRow}>
            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.widthMm}</label>
              <input
                type="number"
                value={formWidthMm}
                onChange={(e) => setFormWidthMm(e.target.value)}
                style={s.formInput}
                min="10"
                max="200"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.primary
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.border
                }}
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.formLabel}>{L.heightMm}</label>
              <input
                type="number"
                value={formHeightMm}
                onChange={(e) => setFormHeightMm(e.target.value)}
                style={s.formInput}
                min="5"
                max="200"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.primary
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.border
                }}
              />
            </div>
          </div>
        )}

        {/* Items section header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            marginTop: 8,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
            Products & Barcodes ({formItems.length} items, {formTotalLabels} labels)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={autoGenerateBarcodes}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                border: `1px solid ${C.primary}`,
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                color: C.primary,
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = C.primaryLight
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
              }}
            >
              <Hash size={12} />
              Auto-Generate
            </button>
            <button
              onClick={addItemRow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                color: '#ffffff',
                backgroundColor: C.primary,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = C.primaryDark
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = C.primary
              }}
            >
              <Plus size={12} />
              {L.addItem}
            </button>
          </div>
        </div>

        {/* Item rows */}
        {formItems.map((item, idx) => (
          <div key={idx} style={s.itemRow}>
            <div style={s.itemRowHeader}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>
                Item #{idx + 1}
              </span>
              {formItems.length > 1 && (
                <button onClick={() => removeItemRow(idx)} style={s.removeBtn}>
                  <Trash2 size={11} />
                  {L.removeItem}
                </button>
              )}
            </div>

            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.productName}</label>
                <input
                  type="text"
                  value={item.product_name}
                  onChange={(e) => updateItemField(idx, 'product_name', e.target.value)}
                  placeholder="Product name..."
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
                <label style={s.formLabel}>{L.barcode}</label>
                <input
                  type="text"
                  value={item.barcode}
                  onChange={(e) => updateItemField(idx, 'barcode', e.target.value)}
                  placeholder="Barcode value..."
                  style={{ ...s.formInput, fontFamily: 'monospace' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border
                  }}
                />
              </div>
            </div>

            <div style={s.formRow3}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.sku}</label>
                <input
                  type="text"
                  value={item.sku || ''}
                  onChange={(e) => updateItemField(idx, 'sku', e.target.value)}
                  placeholder="SKU..."
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
                <label style={s.formLabel}>{L.price}</label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateItemField(idx, 'price', parseFloat(e.target.value) || 0)}
                  style={s.formInput}
                  min="0"
                  step="0.01"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border
                  }}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{L.quantity}</label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItemField(idx, 'quantity', parseInt(e.target.value) || 1)}
                  style={s.formInput}
                  min="1"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border
                  }}
                />
              </div>
            </div>

            {/* Mini barcode preview */}
            {item.barcode && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  backgroundColor: '#ffffff',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {renderBarcodeVisual(formFormat, item.barcode, true)}
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {formatCurrency(item.price, currency)} x{item.quantity} labels
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Notes */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.notes}</label>
          <textarea
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Optional notes about this batch..."
            style={s.formTextarea}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Footer */}
        <div style={s.formFooter}>
          <button
            onClick={() => {
              setShowModal(false)
              resetForm()
            }}
            style={s.cancelBtn}
          >
            {L.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={formSaving || !formName.trim() || formItems.length === 0}
            style={{
              ...s.saveBtn,
              opacity: formSaving || !formName.trim() || formItems.length === 0 ? 0.5 : 1,
            }}
          >
            {formSaving ? 'Saving...' : L.save}
          </button>
        </div>
      </Modal>

      {/* ── VIEW BATCH MODAL ─────────────────────────────────────────────── */}
      <Modal
        isOpen={!!viewingBatch}
        onClose={() => setViewingBatch(null)}
        title={L.viewBatch}
        size="lg"
      >
        {viewingBatch && (
          <div>
            {/* Summary header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                padding: 16,
                backgroundColor: C.primaryLight,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: C.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ScanBarcode size={24} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>
                  {viewingBatch.name}
                </div>
                <div style={{ fontSize: 13, color: C.primaryDark, fontWeight: 500 }}>
                  {viewingBatch.batch_number}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={s.badge(STATUS_CONFIG[viewingBatch.status].color, STATUS_CONFIG[viewingBatch.status].bg)}>
                  {statusLabel(viewingBatch.status)}
                </span>
              </div>
            </div>

            {/* Detail rows */}
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.format}</span>
              <span style={s.detailValue}>
                <span style={s.badge(C.primaryDark, C.primaryLight)}>
                  {FORMAT_LABELS[viewingBatch.format]}
                </span>
              </span>
            </div>
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.totalLabels}</span>
              <span style={s.detailValue}>{viewingBatch.total_labels}</span>
            </div>
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.generated}</span>
              <span style={s.detailValue}>{viewingBatch.generated_count}</span>
            </div>
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.printed}</span>
              <span style={s.detailValue}>{viewingBatch.printed_count}</span>
            </div>
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.template}</span>
              <span style={s.detailValue}>
                {TEMPLATE_OPTIONS.find((o) => o.value === viewingBatch.template)?.label || viewingBatch.template || 'Standard'}
              </span>
            </div>
            {viewingBatch.label_width_mm && viewingBatch.label_height_mm && (
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.labelSize}</span>
                <span style={s.detailValue}>
                  {viewingBatch.label_width_mm}mm x {viewingBatch.label_height_mm}mm
                </span>
              </div>
            )}
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.createdBy}</span>
              <span style={s.detailValue}>{viewingBatch.created_by_name}</span>
            </div>
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{L.date}</span>
              <span style={s.detailValue}>{formatDateTime(viewingBatch.created_at)}</span>
            </div>
            {viewingBatch.printed_at && (
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.printedAt}</span>
                <span style={s.detailValue}>{formatDateTime(viewingBatch.printed_at)}</span>
              </div>
            )}
            {viewingBatch.notes && (
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.notes}</span>
                <span style={s.detailValue}>{viewingBatch.notes}</span>
              </div>
            )}

            {/* Progress bar */}
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>
                Generation Progress: {viewingBatch.generated_count}/{viewingBatch.total_labels}
              </div>
              <div style={{ ...s.progressBar, height: 10 }}>
                <div
                  style={{
                    ...s.progressFill(
                      viewingBatch.total_labels > 0
                        ? (viewingBatch.generated_count / viewingBatch.total_labels) * 100
                        : 0
                    ),
                    height: 10,
                  }}
                />
              </div>
            </div>

            {/* Items table */}
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12, marginTop: 20 }}>
              Products in Batch ({viewingBatch.items.length})
            </div>
            <div
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={{ ...s.th, padding: '8px 12px' }}>{L.productName}</th>
                    <th style={{ ...s.th, padding: '8px 12px' }}>{L.barcode}</th>
                    <th style={{ ...s.th, padding: '8px 12px' }}>{L.price}</th>
                    <th style={{ ...s.th, padding: '8px 12px' }}>{L.quantity}</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingBatch.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ ...s.td, padding: '8px 12px' }}>
                        <span style={{ fontWeight: 500 }}>{item.product_name}</span>
                        {item.sku && (
                          <div style={{ fontSize: 11, color: C.textMuted }}>SKU: {item.sku}</div>
                        )}
                      </td>
                      <td style={{ ...s.td, padding: '8px 12px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 12,
                            backgroundColor: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {item.barcode}
                        </span>
                      </td>
                      <td style={{ ...s.td, padding: '8px 12px' }}>
                        {formatCurrency(item.price, currency)}
                      </td>
                      <td style={{ ...s.td, padding: '8px 12px' }}>
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 20,
                paddingTop: 16,
                borderTop: `1px solid ${C.border}`,
                flexWrap: 'wrap',
              }}
            >
              {viewingBatch.status === 'pending' && (
                <button
                  onClick={() => {
                    handleGenerate(viewingBatch.id)
                    setViewingBatch(null)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: C.primary,
                    cursor: 'pointer',
                  }}
                >
                  <Hash size={16} />
                  {L.generate}
                </button>
              )}
              {viewingBatch.status === 'generated' && (
                <button
                  onClick={() => {
                    handlePrint(viewingBatch.id)
                    setViewingBatch(null)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: C.success,
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={16} />
                  {L.print}
                </button>
              )}
              {viewingBatch.status === 'printed' && (
                <button
                  onClick={() => {
                    handleApply(viewingBatch.id)
                    setViewingBatch(null)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: C.teal,
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle size={16} />
                  {L.markApplied}
                </button>
              )}
              <button
                onClick={() => {
                  setViewingBatch(null)
                  setPreviewBatch(viewingBatch)
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: C.textSecondary,
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <Eye size={16} />
                {L.preview}
              </button>
              <button
                onClick={() => setViewingBatch(null)}
                style={{
                  marginLeft: 'auto',
                  padding: '10px 18px',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: C.textSecondary,
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── PREVIEW LABELS MODAL ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!previewBatch}
        onClose={() => setPreviewBatch(null)}
        title={L.previewLabels}
        size="lg"
      >
        {previewBatch && (
          <div>
            {/* Batch info summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: C.text }}>{previewBatch.name}</span>
                <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 10 }}>
                  {previewBatch.batch_number}
                </span>
              </div>
              <span style={s.badge(C.primaryDark, C.primaryLight)}>
                {FORMAT_LABELS[previewBatch.format]}
              </span>
            </div>

            {/* Label previews grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr 1fr'),
                gap: rv(10, 14, 16),
              }}
            >
              {previewBatch.items.map((item, idx) => (
                <div key={idx} style={s.previewCard as React.CSSProperties}>
                  {/* Barcode visual */}
                  {renderBarcodeVisual(previewBatch.format, item.barcode)}

                  {/* Product info */}
                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: 4,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>
                      {item.product_name}
                    </div>
                    {item.sku && (
                      <div style={{ fontSize: 11, color: C.textMuted }}>
                        SKU: {item.sku}
                      </div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginTop: 4 }}>
                      {formatCurrency(item.price, currency)}
                    </div>
                  </div>

                  {/* Label count */}
                  <div
                    style={{
                      fontSize: 11,
                      color: C.textMuted,
                      marginTop: 2,
                      textAlign: 'center',
                    }}
                  >
                    x{item.quantity} labels
                  </div>
                </div>
              ))}
            </div>

            {/* Preview summary */}
            <div
              style={{
                marginTop: 20,
                padding: '14px 16px',
                backgroundColor: C.primaryLight,
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: C.primaryDeep }}>
                Total: {previewBatch.items.length} products, {previewBatch.total_labels} labels
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    // Simulate download
                    console.log('[BarcodePage] Download labels for batch:', previewBatch.batch_number)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 14px',
                    border: `1px solid ${C.primary}`,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    color: C.primary,
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={13} />
                  {L.download}
                </button>
                <button
                  onClick={() => {
                    // Simulate print
                    console.log('[BarcodePage] Print labels for batch:', previewBatch.batch_number)
                    if (previewBatch.status === 'generated') {
                      handlePrint(previewBatch.id)
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 14px',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: C.primary,
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={13} />
                  {L.print}
                </button>
              </div>
            </div>

            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => setPreviewBatch(null)}
                style={s.cancelBtn}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── DELETE CONFIRMATION MODAL ────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={L.delete}
        size="sm"
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
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
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => setDeleteTarget(null)}
              style={s.cancelBtn}
            >
              {L.cancel}
            </button>
            <button
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget)
              }}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: C.danger,
                cursor: 'pointer',
              }}
            >
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Total labels footer ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: rv(12, 16, 20),
          backgroundColor: C.card,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ScanBarcode size={20} color={C.primary} />
          <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
            Total Labels Across All Batches
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>
              {totalLabels}
            </div>
          </div>
          <div
            style={{
              width: 1,
              height: 32,
              backgroundColor: C.border,
            }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Batches
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
              {batches.length}
            </div>
          </div>
          <div
            style={{
              width: 1,
              height: 32,
              backgroundColor: C.border,
            }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Formats
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
              {new Set(batches.map((b) => b.format)).size}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
