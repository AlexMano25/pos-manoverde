import { useState, useEffect, useMemo } from 'react'
import { useDocumentStore } from '../stores/documentStore'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import Modal from '../components/common/Modal'
import {
  FileText, FilePlus, Edit3, Trash2, Eye, Archive, Upload,
  Download, Search, FolderOpen, Image, File,
  FileSpreadsheet, Tag, Clock,
  Grid, List, MoreVertical, X,
} from 'lucide-react'
import type { PosDocument, DocumentType, DocumentStatus } from '../types'

// ── Color palette ────────────────────────────────────────────────────────────

const C = {
  primary: '#059669',
  primaryLight: '#ecfdf5',
  primaryDark: '#047857',
  primaryHover: '#065f46',
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
} as const

// ── Document type config ─────────────────────────────────────────────────────

type DocTypeConfig = {
  color: string
  bg: string
  icon: typeof FileText
  label: string
}

const TYPE_CONFIG: Record<DocumentType, Omit<DocTypeConfig, 'label'>> = {
  receipt:     { color: '#059669', bg: '#ecfdf5', icon: FileText },
  invoice:     { color: '#2563eb', bg: '#eff6ff', icon: FileSpreadsheet },
  contract:    { color: '#7c3aed', bg: '#f5f3ff', icon: File },
  report:      { color: '#f59e0b', bg: '#fffbeb', icon: FileSpreadsheet },
  certificate: { color: '#ca8a04', bg: '#fefce8', icon: FileText },
  license:     { color: '#dc2626', bg: '#fef2f2', icon: FileText },
  photo:       { color: '#ec4899', bg: '#fdf2f8', icon: Image },
  manual:      { color: '#64748b', bg: '#f8fafc', icon: File },
  other:       { color: '#475569', bg: '#f1f5f9', icon: FolderOpen },
}

const STATUS_CONFIG: Record<DocumentStatus, { color: string; bg: string }> = {
  active:   { color: '#16a34a', bg: '#f0fdf4' },
  archived: { color: '#64748b', bg: '#f1f5f9' },
  expired:  { color: '#dc2626', bg: '#fef2f2' },
}

const ALL_TYPES: DocumentType[] = [
  'receipt', 'invoice', 'contract', 'report', 'certificate',
  'license', 'photo', 'manual', 'other',
]

const ALL_STATUSES: DocumentStatus[] = ['active', 'archived', 'expired']

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function isExpiringSoon(doc: PosDocument): boolean {
  if (!doc.expires_at || doc.status !== 'active') return false
  const now = new Date()
  const exp = new Date(doc.expires_at)
  const diffDays = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 0 && diffDays <= 30
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()

  const {
    documents,
    loading,
    filterType,
    filterStatus,
    loadDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    archiveDocument,
    unarchiveDocument,
    getTotalSize,
    setFilterType,
    setFilterStatus,
  } = useDocumentStore()

  const storeId = currentStore?.id || user?.store_id || 'default-store'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n
  const dt = (t as any).documents || {}
  const tCommon = (t as any).common || {}

  const L = {
    title: dt.title || 'Documents',
    addDocument: dt.addDocument || 'Add Document',
    editDocument: dt.editDocument || 'Edit Document',
    viewDocument: dt.viewDocument || 'Document Details',
    totalDocuments: dt.totalDocuments || 'Total Documents',
    activeDocuments: dt.activeDocuments || 'Active',
    expiringSoon: dt.expiringSoon || 'Expiring Soon',
    totalSize: dt.totalSize || 'Total Size',
    name: dt.name || 'Name',
    type: dt.type || 'Type',
    category: dt.category || 'Category',
    description: dt.description || 'Description',
    fileUrl: dt.fileUrl || 'File URL',
    fileSize: dt.fileSize || 'File Size',
    tags: dt.tags || 'Tags',
    status: dt.status || 'Status',
    uploadedBy: dt.uploadedBy || 'Uploaded By',
    date: dt.date || 'Date',
    expires: dt.expires || 'Expires',
    relatedEntity: dt.relatedEntity || 'Related Entity',
    entityType: dt.entityType || 'Entity Type',
    entityId: dt.entityId || 'Entity ID',
    actions: dt.actions || 'Actions',
    allTypes: dt.allTypes || 'All Types',
    allStatuses: dt.allStatuses || 'All Statuses',
    allCategories: dt.allCategories || 'All Categories',
    noDocuments: dt.noDocuments || 'No documents yet',
    noDocumentsDesc: dt.noDocumentsDesc || 'Start organizing your files by adding a new document.',
    noResults: dt.noResults || 'No documents match your filters',
    noResultsDesc: dt.noResultsDesc || 'Try adjusting the filters or search query.',
    view: dt.view || 'View',
    download: dt.download || 'Download',
    archive: dt.archive || 'Archive',
    unarchive: dt.unarchive || 'Unarchive',
    deleteLabel: dt.deleteLabel || 'Delete',
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    deleteConfirm: dt.deleteConfirm || 'Are you sure you want to delete this document?',
    expirationDate: dt.expirationDate || 'Expiration Date',
    gridView: dt.gridView || 'Grid View',
    listView: dt.listView || 'List View',
    // Type labels
    t_receipt: dt.t_receipt || 'Receipt',
    t_invoice: dt.t_invoice || 'Invoice',
    t_contract: dt.t_contract || 'Contract',
    t_report: dt.t_report || 'Report',
    t_certificate: dt.t_certificate || 'Certificate',
    t_license: dt.t_license || 'License',
    t_photo: dt.t_photo || 'Photo',
    t_manual: dt.t_manual || 'Manual',
    t_other: dt.t_other || 'Other',
    // Status labels
    s_active: dt.s_active || 'Active',
    s_archived: dt.s_archived || 'Archived',
    s_expired: dt.s_expired || 'Expired',
  }

  const typeLabel = (t: DocumentType): string => (L as any)[`t_${t}`] || t
  const statusLabel = (s: DocumentStatus): string => (L as any)[`s_${s}`] || s

  // ── Local state ──────────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<PosDocument | null>(null)
  const [editingDocument, setEditingDocument] = useState<PosDocument | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<DocumentType>('other')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formFileUrl, setFormFileUrl] = useState('')
  const [formFileSize, setFormFileSize] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formEntityType, setFormEntityType] = useState('')
  const [formEntityId, setFormEntityId] = useState('')
  const [formExpiresAt, setFormExpiresAt] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // ── Load data ────────────────────────────────────────────────────────────

  useEffect(() => {
    loadDocuments(storeId)
  }, [storeId, loadDocuments])

  // ── Filtered documents ───────────────────────────────────────────────────

  const filteredDocuments = useMemo(() => {
    let result = [...documents]

    if (filterType !== 'all') {
      result = result.filter((d) => d.type === filterType)
    }
    if (filterStatus !== 'all') {
      result = result.filter((d) => d.status === filterStatus)
    }
    if (categoryFilter !== 'all') {
      result = result.filter((d) => d.category === categoryFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          (d.category && d.category.toLowerCase().includes(q)) ||
          (d.tags && d.tags.some((tag) => tag.toLowerCase().includes(q))) ||
          d.uploaded_by_name.toLowerCase().includes(q)
      )
    }

    return result
  }, [documents, filterType, filterStatus, categoryFilter, searchQuery])

  // ── Stats ────────────────────────────────────────────────────────────────

  const totalDocs = documents.length
  const activeDocs = useMemo(() => documents.filter((d) => d.status === 'active').length, [documents])
  const expiringCount = useMemo(() => documents.filter(isExpiringSoon).length, [documents])
  const totalSize = getTotalSize(storeId)

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    documents.forEach((d) => { if (d.category) cats.add(d.category) })
    return Array.from(cats).sort()
  }, [documents])

  // ── Form helpers ─────────────────────────────────────────────────────────

  function resetForm() {
    setFormName('')
    setFormType('other')
    setFormCategory('')
    setFormDescription('')
    setFormFileUrl('')
    setFormFileSize('')
    setFormTags('')
    setFormEntityType('')
    setFormEntityId('')
    setFormExpiresAt('')
    setEditingDocument(null)
  }

  function openAddModal() {
    resetForm()
    setShowModal(true)
  }

  function openEditModal(doc: PosDocument) {
    setEditingDocument(doc)
    setFormName(doc.name)
    setFormType(doc.type)
    setFormCategory(doc.category || '')
    setFormDescription(doc.description || '')
    setFormFileUrl(doc.file_url || '')
    setFormFileSize(doc.file_size ? doc.file_size.toString() : '')
    setFormTags(doc.tags ? doc.tags.join(', ') : '')
    setFormEntityType(doc.related_entity_type || '')
    setFormEntityId(doc.related_entity_id || '')
    setFormExpiresAt(doc.expires_at ? doc.expires_at.slice(0, 10) : '')
    setShowModal(true)
  }

  function openViewModal(doc: PosDocument) {
    setViewingDocument(doc)
    setShowViewModal(true)
  }

  async function handleSave() {
    if (!formName.trim()) return

    setFormSaving(true)
    try {
      const parsedTags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const data: Omit<PosDocument, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'> = {
        name: formName.trim(),
        type: formType,
        category: formCategory.trim() || undefined,
        description: formDescription.trim() || undefined,
        file_url: formFileUrl.trim() || undefined,
        file_size: formFileSize ? parseInt(formFileSize, 10) || undefined : undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        related_entity_type: formEntityType.trim() || undefined,
        related_entity_id: formEntityId.trim() || undefined,
        expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : undefined,
        status: 'active',
        uploaded_by: userId,
        uploaded_by_name: userName,
      }

      if (editingDocument) {
        await updateDocument(editingDocument.id, data)
      } else {
        await addDocument(storeId, data)
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[DocumentsPage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDocument(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[DocumentsPage] Delete error:', error)
    }
  }

  async function handleArchive(doc: PosDocument) {
    try {
      if (doc.status === 'archived') {
        await unarchiveDocument(doc.id)
      } else {
        await archiveDocument(doc.id)
      }
    } catch (error) {
      console.error('[DocumentsPage] Archive error:', error)
    }
  }

  // ── Shared styles ────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    outline: 'none',
    color: C.text,
    backgroundColor: C.card,
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 32,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: C.textSecondary,
    marginBottom: 6,
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: C.primary,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'background-color 0.15s, transform 0.1s',
  }

  const btnSecondary: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: C.textSecondary,
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  }

  // ── Document icon renderer ───────────────────────────────────────────────

  function DocIcon({ type, size = 32 }: { type: DocumentType; size?: number }) {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other
    const IconComponent = cfg.icon
    return (
      <div
        style={{
          width: size + 16,
          height: size + 16,
          borderRadius: 12,
          backgroundColor: cfg.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconComponent size={size} color={cfg.color} />
      </div>
    )
  }

  // ── Type badge ───────────────────────────────────────────────────────────

  function TypeBadge({ type }: { type: DocumentType }) {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 20,
          color: cfg.color,
          backgroundColor: cfg.bg,
          textTransform: 'capitalize',
          whiteSpace: 'nowrap',
        }}
      >
        {typeLabel(type)}
      </span>
    )
  }

  // ── Status badge ─────────────────────────────────────────────────────────

  function StatusBadge({ status }: { status: DocumentStatus }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 20,
          color: cfg.color,
          backgroundColor: cfg.bg,
          textTransform: 'capitalize',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: cfg.color,
            flexShrink: 0,
          }}
        />
        {statusLabel(status)}
      </span>
    )
  }

  // ── Stat card ────────────────────────────────────────────────────────────

  function StatCard({
    icon: Icon,
    label,
    value,
    color,
    bg,
  }: {
    icon: typeof FileText
    label: string
    value: string | number
    color: string
    bg: string
  }) {
    return (
      <div
        style={{
          flex: '1 1 0',
          minWidth: rv(120, 140, 160),
          padding: rv(14, 16, 20),
          backgroundColor: C.card,
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: rv(10, 12, 14),
        }}
      >
        <div
          style={{
            width: rv(38, 42, 46),
            height: rv(38, 42, 46),
            borderRadius: 10,
            backgroundColor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={rv(18, 20, 22)} color={color} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: rv(11, 12, 12),
              fontWeight: 500,
              color: C.textMuted,
              marginBottom: 2,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: rv(18, 20, 24),
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
        </div>
      </div>
    )
  }

  // ── Action icon button ───────────────────────────────────────────────────

  function ActionBtn({
    icon: Icon,
    onClick,
    color,
    title,
    bg,
  }: {
    icon: typeof FileText
    onClick: () => void
    color: string
    title: string
    bg?: string
  }) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        title={title}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 8,
          border: 'none',
          backgroundColor: bg || 'transparent',
          cursor: 'pointer',
          color,
          transition: 'background-color 0.15s, transform 0.1s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = bg || '#f1f5f9'
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = bg || 'transparent'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <Icon size={16} />
      </button>
    )
  }

  // ── Grid card ────────────────────────────────────────────────────────────

  function DocumentCard({ doc }: { doc: PosDocument }) {
    const expiring = isExpiringSoon(doc)
    return (
      <div
        style={{
          backgroundColor: C.card,
          borderRadius: 12,
          border: `1px solid ${expiring ? '#fbbf24' : C.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: rv(14, 16, 18),
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          cursor: 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onClick={() => openViewModal(doc)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
        }}
      >
        {/* Top: Icon + Name + Menu */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <DocIcon type={doc.type} size={rv(24, 28, 28)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: rv(14, 15, 15),
                fontWeight: 600,
                color: C.text,
                marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={doc.name}
            >
              {doc.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <TypeBadge type={doc.type} />
              <StatusBadge status={doc.status} />
            </div>
          </div>
          {/* Three-dot menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(openMenuId === doc.id ? null : doc.id)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: C.textMuted,
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <MoreVertical size={16} />
            </button>
            {openMenuId === doc.id && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 32,
                  width: 160,
                  backgroundColor: C.card,
                  borderRadius: 10,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  border: `1px solid ${C.border}`,
                  zIndex: 50,
                  overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {[
                  { label: L.view, icon: Eye, color: C.info, action: () => { openViewModal(doc); setOpenMenuId(null) } },
                  ...(doc.file_url ? [{ label: L.download, icon: Download, color: C.primary, action: () => { window.open(doc.file_url, '_blank'); setOpenMenuId(null) } }] : []),
                  { label: doc.status === 'archived' ? L.unarchive : L.archive, icon: Archive, color: '#f59e0b', action: () => { handleArchive(doc); setOpenMenuId(null) } },
                  { label: L.editDocument, icon: Edit3, color: C.textSecondary, action: () => { openEditModal(doc); setOpenMenuId(null) } },
                  { label: L.deleteLabel, icon: Trash2, color: C.danger, action: () => { setDeleteTarget(doc.id); setOpenMenuId(null) } },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.action}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      color: item.color,
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description preview */}
        {doc.description && (
          <div
            style={{
              fontSize: 12,
              color: C.textSecondary,
              lineHeight: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {doc.description}
          </div>
        )}

        {/* Tags */}
        {doc.tags && doc.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {doc.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 500,
                  borderRadius: 12,
                  color: C.primary,
                  backgroundColor: C.primaryLight,
                }}
              >
                <Tag size={9} />
                {tag}
              </span>
            ))}
            {doc.tags.length > 3 && (
              <span style={{ fontSize: 10, color: C.textMuted, padding: '2px 4px' }}>
                +{doc.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: Meta info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTop: `1px solid ${C.border}`,
            fontSize: 11,
            color: C.textMuted,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} />
            {formatDate(doc.created_at)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {doc.file_size != null && doc.file_size > 0 && (
              <span>{formatFileSize(doc.file_size)}</span>
            )}
            <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {doc.uploaded_by_name}
            </span>
          </div>
        </div>

        {/* Expiring warning */}
        {expiring && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 8,
              backgroundColor: '#fffbeb',
              fontSize: 11,
              fontWeight: 600,
              color: '#b45309',
            }}
          >
            <Clock size={12} />
            {L.expiringSoon} - {formatDate(doc.expires_at!)}
          </div>
        )}
      </div>
    )
  }

  // ── Render: Empty state ──────────────────────────────────────────────────

  function EmptyState({ filtered }: { filtered?: boolean }) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: rv(40, 60, 80),
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: C.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <FolderOpen size={36} color={C.primary} />
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: C.text,
            marginBottom: 8,
          }}
        >
          {filtered ? L.noResults : L.noDocuments}
        </div>
        <div
          style={{
            fontSize: 14,
            color: C.textSecondary,
            maxWidth: 320,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {filtered ? L.noResultsDesc : L.noDocumentsDesc}
        </div>
        {!filtered && (
          <button
            onClick={openAddModal}
            style={btnPrimary}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryDark }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
          >
            <FilePlus size={18} />
            {L.addDocument}
          </button>
        )}
      </div>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openMenuId) return
    const handler = () => setOpenMenuId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openMenuId])

  return (
    <div
      style={{
        padding: rv(12, 20, 28),
        backgroundColor: C.bg,
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 0,
          marginBottom: rv(16, 20, 24),
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: rv(22, 26, 28),
              fontWeight: 700,
              color: C.text,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <FileText size={rv(22, 26, 28)} color={C.primary} />
            {L.title}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: C.card,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              title={L.gridView}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'grid' ? C.primaryLight : 'transparent',
                color: viewMode === 'grid' ? C.primary : C.textMuted,
                transition: 'all 0.15s',
              }}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title={L.listView}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? C.primaryLight : 'transparent',
                color: viewMode === 'list' ? C.primary : C.textMuted,
                transition: 'all 0.15s',
              }}
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={openAddModal}
            style={btnPrimary}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryDark }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
          >
            <FilePlus size={16} />
            {!isMobile && L.addDocument}
          </button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: rv(8, 12, 16),
          marginBottom: rv(16, 20, 24),
          flexWrap: 'wrap',
        }}
      >
        <StatCard icon={FileText} label={L.totalDocuments} value={totalDocs} color={C.primary} bg={C.primaryLight} />
        <StatCard icon={File} label={L.activeDocuments} value={activeDocs} color={C.success} bg={C.successBg} />
        <StatCard icon={Clock} label={L.expiringSoon} value={expiringCount} color={C.warning} bg={C.warningBg} />
        <StatCard icon={Upload} label={L.totalSize} value={formatFileSize(totalSize)} color={C.info} bg={C.infoBg} />
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: rv(8, 10, 12),
          marginBottom: rv(16, 20, 24),
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div
          style={{
            flex: isMobile ? '1 1 100%' : '1 1 220px',
            maxWidth: isMobile ? '100%' : 320,
            position: 'relative',
          }}
        >
          <Search
            size={16}
            color={C.textMuted}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={L.search + '...'}
            style={{
              ...inputStyle,
              paddingLeft: 36,
              borderRadius: 10,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#e2e8f0',
                cursor: 'pointer',
                color: C.textMuted,
                padding: 0,
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as DocumentType | 'all')}
          style={{
            ...selectStyle,
            flex: '0 0 auto',
            width: isMobile ? '48%' : 150,
            borderRadius: 10,
          }}
        >
          <option value="all">{L.allTypes}</option>
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>{typeLabel(t)}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as DocumentStatus | 'all')}
          style={{
            ...selectStyle,
            flex: '0 0 auto',
            width: isMobile ? '48%' : 140,
            borderRadius: 10,
          }}
        >
          <option value="all">{L.allStatuses}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>

        {/* Category filter */}
        {uniqueCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              ...selectStyle,
              flex: '0 0 auto',
              width: isMobile ? '100%' : 150,
              borderRadius: 10,
            }}
          >
            <option value="all">{L.allCategories}</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Content area ────────────────────────────────────────────────── */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 80,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: `3px solid ${C.border}`,
              borderTopColor: C.primary,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : documents.length === 0 ? (
        <EmptyState />
      ) : filteredDocuments.length === 0 ? (
        <EmptyState filtered />
      ) : viewMode === 'grid' ? (
        /* ── Grid view ──────────────────────────────────────────────── */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: rv(
              '1fr',
              'repeat(2, 1fr)',
              `repeat(${filteredDocuments.length === 1 ? 1 : filteredDocuments.length === 2 ? 2 : 3}, 1fr)`
            ),
            gap: rv(10, 14, 16),
          }}
        >
          {filteredDocuments.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        /* ── List view ──────────────────────────────────────────────── */
        <div
          style={{
            backgroundColor: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          {!isMobile && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 0.8fr 1fr 1fr 0.8fr 100px',
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderBottom: `1px solid ${C.border}`,
                fontSize: 12,
                fontWeight: 600,
                color: C.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              <span>{L.name}</span>
              <span>{L.type}</span>
              <span>{L.category}</span>
              <span>{L.fileSize}</span>
              <span>{L.uploadedBy}</span>
              <span>{L.date}</span>
              <span>{L.status}</span>
              <span style={{ textAlign: 'right' }}>{L.actions}</span>
            </div>
          )}

          {/* Table rows */}
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => openViewModal(doc)}
              style={{
                display: isMobile ? 'flex' : 'grid',
                gridTemplateColumns: isMobile ? undefined : '2fr 1fr 1fr 0.8fr 1fr 1fr 0.8fr 100px',
                flexDirection: isMobile ? 'column' : undefined,
                gap: isMobile ? 8 : 0,
                padding: isMobile ? '14px 16px' : '12px 16px',
                borderBottom: `1px solid ${C.border}`,
                alignItems: isMobile ? 'flex-start' : 'center',
                cursor: 'pointer',
                transition: 'background-color 0.1s',
                fontSize: 13,
                color: C.text,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafbfc' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {isMobile ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                    <DocIcon type={doc.type} size={20} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{formatDate(doc.created_at)}</div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <TypeBadge type={doc.type} />
                    {doc.category && <span style={{ fontSize: 11, color: C.textSecondary }}>{doc.category}</span>}
                    {doc.file_size != null && doc.file_size > 0 && (
                      <span style={{ fontSize: 11, color: C.textMuted }}>{formatFileSize(doc.file_size)}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                    <ActionBtn icon={Eye} onClick={() => openViewModal(doc)} color={C.info} title={L.view} />
                    <ActionBtn icon={Edit3} onClick={() => openEditModal(doc)} color={C.textSecondary} title={L.editDocument} />
                    <ActionBtn icon={Archive} onClick={() => handleArchive(doc)} color="#f59e0b" title={L.archive} />
                    <ActionBtn icon={Trash2} onClick={() => setDeleteTarget(doc.id)} color={C.danger} title={L.deleteLabel} />
                  </div>
                </>
              ) : (
                <>
                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <DocIcon type={doc.type} size={18} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {doc.name}
                    </span>
                  </div>
                  {/* Type */}
                  <div><TypeBadge type={doc.type} /></div>
                  {/* Category */}
                  <div style={{ color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.category || '-'}
                  </div>
                  {/* Size */}
                  <div style={{ color: C.textMuted }}>
                    {doc.file_size != null && doc.file_size > 0 ? formatFileSize(doc.file_size) : '-'}
                  </div>
                  {/* Uploaded by */}
                  <div style={{ color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.uploaded_by_name}
                  </div>
                  {/* Date */}
                  <div style={{ color: C.textMuted }}>{formatDate(doc.created_at)}</div>
                  {/* Status */}
                  <div><StatusBadge status={doc.status} /></div>
                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <ActionBtn icon={Eye} onClick={() => openViewModal(doc)} color={C.info} title={L.view} />
                    <ActionBtn icon={Edit3} onClick={() => openEditModal(doc)} color={C.textSecondary} title={L.editDocument} />
                    <ActionBtn icon={Trash2} onClick={() => setDeleteTarget(doc.id)} color={C.danger} title={L.deleteLabel} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title={editingDocument ? L.editDocument : L.addDocument}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Document name */}
          <div>
            <label style={labelStyle}>{L.name} *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Business License 2026"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>

          {/* Type + Category row */}
          <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{L.type}</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as DocumentType)}
                style={selectStyle}
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>{typeLabel(t)}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{L.category}</label>
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g. Legal, HR, Finance"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>{L.description}</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Brief description of this document..."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 72,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>

          {/* File URL + Size row */}
          <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>{L.fileUrl}</label>
              <input
                type="text"
                value={formFileUrl}
                onChange={(e) => setFormFileUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{L.fileSize} (bytes)</label>
              <input
                type="number"
                value={formFileSize}
                onChange={(e) => setFormFileSize(e.target.value)}
                placeholder="e.g. 1048576"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag size={13} />
                {L.tags}
              </span>
            </label>
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="tag1, tag2, tag3 (comma separated)"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>

          {/* Related entity */}
          <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{L.entityType}</label>
              <select
                value={formEntityType}
                onChange={(e) => setFormEntityType(e.target.value)}
                style={selectStyle}
              >
                <option value="">-- None --</option>
                <option value="order">Order</option>
                <option value="customer">Customer</option>
                <option value="employee">Employee</option>
                <option value="product">Product</option>
                <option value="supplier">Supplier</option>
                <option value="work_order">Work Order</option>
                <option value="invoice">Invoice</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{L.entityId}</label>
              <input
                type="text"
                value={formEntityId}
                onChange={(e) => setFormEntityId(e.target.value)}
                placeholder="Entity ID"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>
          </div>

          {/* Expiration date */}
          <div>
            <label style={labelStyle}>{L.expirationDate}</label>
            <input
              type="date"
              value={formExpiresAt}
              onChange={(e) => setFormExpiresAt(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
            <button
              onClick={() => { setShowModal(false); resetForm() }}
              style={btnSecondary}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.card }}
            >
              {L.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={formSaving || !formName.trim()}
              style={{
                ...btnPrimary,
                opacity: formSaving || !formName.trim() ? 0.6 : 1,
                cursor: formSaving || !formName.trim() ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!formSaving && formName.trim()) e.currentTarget.style.backgroundColor = C.primaryDark
              }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
            >
              {formSaving ? '...' : L.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── View Document Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingDocument(null) }}
        title={L.viewDocument}
        size="lg"
      >
        {viewingDocument && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header with icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <DocIcon type={viewingDocument.type} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.text }}>
                  {viewingDocument.name}
                </h3>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <TypeBadge type={viewingDocument.type} />
                  <StatusBadge status={viewingDocument.status} />
                </div>
              </div>
            </div>

            {/* Description */}
            {viewingDocument.description && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: '#f8fafc',
                  fontSize: 14,
                  color: C.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                {viewingDocument.description}
              </div>
            )}

            {/* Metadata grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12,
              }}
            >
              {[
                { label: L.category, value: viewingDocument.category || '-' },
                { label: L.fileSize, value: viewingDocument.file_size ? formatFileSize(viewingDocument.file_size) : '-' },
                { label: L.uploadedBy, value: viewingDocument.uploaded_by_name },
                { label: L.date, value: formatDate(viewingDocument.created_at) },
                ...(viewingDocument.expires_at ? [{ label: L.expires, value: formatDate(viewingDocument.expires_at) }] : []),
                ...(viewingDocument.related_entity_type ? [{ label: L.relatedEntity, value: `${viewingDocument.related_entity_type} / ${viewingDocument.related_entity_id || '-'}` }] : []),
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: '#f8fafc',
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            {viewingDocument.tags && viewingDocument.tags.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {L.tags}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewingDocument.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: 20,
                        color: C.primary,
                        backgroundColor: C.primaryLight,
                      }}
                    >
                      <Tag size={11} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* File URL */}
            {viewingDocument.file_url && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: C.primaryLight,
                  border: `1px solid ${C.primary}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.primary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    File URL
                  </div>
                  <div style={{ fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {viewingDocument.file_url}
                  </div>
                </div>
                <button
                  onClick={() => window.open(viewingDocument.file_url, '_blank')}
                  style={{
                    ...btnPrimary,
                    padding: '8px 16px',
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryDark }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
                >
                  <Download size={14} />
                  {L.download}
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                paddingTop: 8,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <button
                onClick={() => {
                  setShowViewModal(false)
                  openEditModal(viewingDocument)
                }}
                style={btnSecondary}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.card }}
              >
                <Edit3 size={14} />
                {L.editDocument}
              </button>
              <button
                onClick={() => {
                  handleArchive(viewingDocument)
                  setShowViewModal(false)
                }}
                style={{
                  ...btnSecondary,
                  color: '#b45309',
                  borderColor: '#fbbf24',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fffbeb' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.card }}
              >
                <Archive size={14} />
                {viewingDocument.status === 'archived' ? L.unarchive : L.archive}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete confirmation ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={L.deleteLabel}
        size="sm"
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: C.dangerBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Trash2 size={24} color={C.danger} />
          </div>
          <p
            style={{
              fontSize: 15,
              color: C.text,
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}
          >
            {L.deleteConfirm}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              onClick={() => setDeleteTarget(null)}
              style={btnSecondary}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.card }}
            >
              {L.cancel}
            </button>
            <button
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              style={{
                ...btnPrimary,
                backgroundColor: C.danger,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#b91c1c' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.danger }}
            >
              <Trash2 size={14} />
              {L.deleteLabel}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
