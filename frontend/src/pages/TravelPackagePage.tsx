import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  MapPin,
  Clock,
  Users,
  Archive,
  Send,
  Palmtree,
  Mountain,
  Landmark,
  Binoculars,
  Ship,
  Briefcase,
  Package,
  X,
  Image,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useTravelStore } from '../stores/travelStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { TravelPackage, PackageStatus } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#dbeafe',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#dcfce7',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  purple: '#7c3aed',
  purpleBg: '#f3e8ff',
  orange: '#ea580c',
  orangeBg: '#fff7ed',
  grayBg: '#f1f5f9',
  cyan: '#0891b2',
  cyanBg: '#ecfeff',
} as const

// ── Status config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PackageStatus, { color: string; bg: string; label: string }> = {
  draft:     { color: C.textSecondary, bg: C.grayBg,    label: 'Draft' },
  published: { color: C.success,       bg: C.successBg, label: 'Published' },
  sold_out:  { color: C.danger,        bg: C.dangerBg,  label: 'Sold Out' },
  archived:  { color: C.purple,        bg: C.purpleBg,  label: 'Archived' },
}

// ── Category config ──────────────────────────────────────────────────────

type CategoryKey = 'beach' | 'adventure' | 'cultural' | 'safari' | 'cruise' | 'business'

const CATEGORY_CONFIG: Record<CategoryKey, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  beach:     { icon: <Palmtree size={14} />,   label: 'Beach',     color: C.cyan,    bg: C.cyanBg },
  adventure: { icon: <Mountain size={14} />,   label: 'Adventure', color: C.orange,   bg: C.orangeBg },
  cultural:  { icon: <Landmark size={14} />,   label: 'Cultural',  color: C.purple,   bg: C.purpleBg },
  safari:    { icon: <Binoculars size={14} />, label: 'Safari',    color: C.warning,  bg: C.warningBg },
  cruise:    { icon: <Ship size={14} />,       label: 'Cruise',    color: C.primary,  bg: C.primaryLight },
  business:  { icon: <Briefcase size={14} />,  label: 'Business',  color: C.textSecondary, bg: C.grayBg },
}

const CATEGORIES: CategoryKey[] = ['beach', 'adventure', 'cultural', 'safari', 'cruise', 'business']

const INCLUSION_OPTIONS = ['flight', 'hotel', 'meals', 'transfers', 'guide', 'insurance', 'visa', 'excursions', 'wifi', 'photos']
const EXCLUSION_OPTIONS = ['flights', 'meals', 'insurance', 'personal_expenses', 'tips', 'visa_fees', 'extra_activities', 'luggage_overweight']

// ── Form state ───────────────────────────────────────────────────────────

interface PackageForm {
  name: string
  destination: string
  description: string
  duration_days: number
  price_per_person: number
  max_travelers: number
  spots_remaining: number
  departure_date: string
  return_date: string
  inclusions: string[]
  exclusions: string[]
  category: CategoryKey
  status: PackageStatus
  image_url: string
}

const emptyForm: PackageForm = {
  name: '',
  destination: '',
  description: '',
  duration_days: 7,
  price_per_person: 0,
  max_travelers: 20,
  spots_remaining: 20,
  departure_date: '',
  return_date: '',
  inclusions: [],
  exclusions: [],
  category: 'beach',
  status: 'draft',
  image_url: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Component ────────────────────────────────────────────────────────────

export default function TravelPackagePage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    packages,
    loading,
    loadPackages,
    createPackage,
    updatePackage,
    deletePackage,
  } = useTravelStore()

  const storeId = currentStore?.id || 'default-store'
  const currencyCode = currentStore?.currency || 'XAF'

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<CategoryKey | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<PackageStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingPkg, setEditingPkg] = useState<TravelPackage | null>(null)
  const [form, setForm] = useState<PackageForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingPkg, setDeletingPkg] = useState<TravelPackage | null>(null)

  // ── i18n helpers ─────────────────────────────────────────────────────
  const tTravel = (key: string, fallback: string): string => {
    const tObj = (t as Record<string, unknown>).travel
    if (tObj && typeof tObj === 'object') {
      const val = (tObj as Record<string, string>)[key]
      if (typeof val === 'string') return val
    }
    return fallback
  }
  const tCommon = (key: string, fallback: string): string => {
    const obj = (t as Record<string, unknown>).common
    if (obj && typeof obj === 'object') {
      const val = (obj as Record<string, string>)[key]
      if (typeof val === 'string') return val
    }
    return fallback
  }

  // ── Load on mount ──────────────────────────────────────────────────
  useEffect(() => {
    loadPackages(storeId)
  }, [storeId, loadPackages])

  // ── Filtering ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...packages]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.destination.toLowerCase().includes(q)
      )
    }
    if (filterCategory !== 'all') {
      list = list.filter(p => p.category === filterCategory)
    }
    if (filterStatus !== 'all') {
      list = list.filter(p => p.status === filterStatus)
    }
    return list
  }, [packages, searchQuery, filterCategory, filterStatus])

  // ── Stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const published = packages.filter(p => p.status === 'published').length
    const totalSpots = packages.reduce((s, p) => s + p.spots_remaining, 0)
    const avgPrice = packages.length > 0
      ? packages.reduce((s, p) => s + p.price_per_person, 0) / packages.length
      : 0
    return { total: packages.length, published, totalSpots, avgPrice }
  }, [packages])

  // ── Modal actions ─────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingPkg(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (pkg: TravelPackage) => {
    setEditingPkg(pkg)
    setForm({
      name: pkg.name,
      destination: pkg.destination,
      description: pkg.description || '',
      duration_days: pkg.duration_days,
      price_per_person: pkg.price_per_person,
      max_travelers: pkg.max_travelers,
      spots_remaining: pkg.spots_remaining,
      departure_date: pkg.departure_date || '',
      return_date: pkg.return_date || '',
      inclusions: pkg.inclusions || [],
      exclusions: pkg.exclusions || [],
      category: (pkg.category as CategoryKey) || 'beach',
      status: pkg.status,
      image_url: pkg.image_url || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError(tTravel('nameRequired', 'Package name is required')); return }
    if (!form.destination.trim()) { setFormError(tTravel('destRequired', 'Destination is required')); return }
    if (form.price_per_person <= 0) { setFormError(tTravel('priceRequired', 'Price must be greater than 0')); return }
    if (form.duration_days <= 0) { setFormError(tTravel('durationRequired', 'Duration must be at least 1 day')); return }

    setSaving(true)
    setFormError('')
    try {
      const data = {
        store_id: storeId,
        name: form.name.trim(),
        destination: form.destination.trim(),
        description: form.description.trim() || undefined,
        duration_days: form.duration_days,
        price_per_person: form.price_per_person,
        max_travelers: form.max_travelers,
        spots_remaining: form.spots_remaining,
        departure_date: form.departure_date || undefined,
        return_date: form.return_date || undefined,
        inclusions: form.inclusions,
        exclusions: form.exclusions,
        category: form.category,
        status: form.status,
        image_url: form.image_url.trim() || undefined,
      }
      if (editingPkg) {
        await updatePackage(editingPkg.id, data)
      } else {
        await createPackage(data)
      }
      setShowModal(false)
      setForm(emptyForm)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingPkg) return
    try {
      await deletePackage(deletingPkg.id)
      setShowDeleteModal(false)
      setDeletingPkg(null)
    } catch (err) {
      console.error('Delete package error:', err)
    }
  }

  const handleQuickAction = async (pkg: TravelPackage, action: 'publish' | 'archive') => {
    const newStatus: PackageStatus = action === 'publish' ? 'published' : 'archived'
    await updatePackage(pkg.id, { status: newStatus })
  }

  const toggleInclusion = (item: string) => {
    setForm(prev => ({
      ...prev,
      inclusions: prev.inclusions.includes(item)
        ? prev.inclusions.filter(i => i !== item)
        : [...prev.inclusions, item],
    }))
  }

  const toggleExclusion = (item: string) => {
    setForm(prev => ({
      ...prev,
      exclusions: prev.exclusions.includes(item)
        ? prev.exclusions.filter(i => i !== item)
        : [...prev.exclusions, item],
    }))
  }

  // ── Styles ──────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(12, 20, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? 12 : 0,
    marginBottom: 20,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 22, 24),
    fontWeight: 700,
    color: C.text,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  const createBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
  }

  const statsRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
    gap: rv(8, 12, 16),
    marginBottom: 20,
  }

  const statCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: rv(12, 14, 16),
    border: `1px solid ${C.border}`,
    textAlign: 'center',
  }

  const searchBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
    flexDirection: isMobile ? 'column' : 'row',
  }

  const searchInputWrap: React.CSSProperties = {
    flex: 1,
    position: 'relative',
  }

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px 10px 38px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: C.card,
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: rv('1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)'),
    gap: rv(12, 16, 20),
  }

  const pkgCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.15s, transform 0.15s',
  }

  const imgPlaceholder: React.CSSProperties = {
    width: '100%',
    height: rv(120, 140, 160),
    backgroundColor: C.grayBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: C.border,
    position: 'relative',
  }

  const cardBodyStyle: React.CSSProperties = {
    padding: rv(12, 14, 16),
  }

  const formFieldStyle: React.CSSProperties = { marginBottom: 16 }
  const formLabelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 6 }
  const formInputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }
  const formRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }
  const formErrorStyle: React.CSSProperties = { backgroundColor: C.dangerBg, color: C.danger, padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }
  const formBtnRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }
  const cancelBtnStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`, backgroundColor: '#ffffff', color: C.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }
  const saveBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }
  const deleteBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, border: 'none', backgroundColor: C.danger, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color,
    padding: 6,
    borderRadius: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color,
    backgroundColor: bg,
  })

  const chipStyle = (selected: boolean, color: string, bg: string): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: 8,
    border: selected ? `2px solid ${color}` : `1px solid ${C.border}`,
    backgroundColor: selected ? bg : C.card,
    color: selected ? color : C.textSecondary,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  })

  // ── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 12 }}>
            {tCommon('loading', 'Loading...')}
          </p>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          <Package size={rv(22, 24, 26)} color={C.primary} />
          {tTravel('packages', 'Travel Packages')}
        </h1>
        <button style={createBtnStyle} onClick={openCreateModal}>
          <Plus size={16} /> {tTravel('addPackage', 'Add Package')}
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div style={statsRowStyle}>
        <div style={statCardStyle}>
          <div style={{ fontSize: rv(20, 22, 26), fontWeight: 800, color: C.primary }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{tTravel('totalPackages', 'Total Packages')}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: rv(20, 22, 26), fontWeight: 800, color: C.success }}>{stats.published}</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{tTravel('published', 'Published')}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: rv(20, 22, 26), fontWeight: 800, color: C.warning }}>{stats.totalSpots}</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{tTravel('totalSpots', 'Total Spots')}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: rv(20, 22, 26), fontWeight: 800, color: C.purple }}>{formatCurrency(stats.avgPrice, currencyCode)}</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{tTravel('avgPrice', 'Avg Price')}</div>
        </div>
      </div>

      {/* ── Search & Filters ──────────────────────────────────────────── */}
      <div style={searchBarStyle}>
        <div style={searchInputWrap}>
          <Search size={16} color={C.textSecondary} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={searchInputStyle}
            type="text"
            placeholder={tTravel('searchPackages', 'Search packages...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 4 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          style={{ ...formInputStyle, width: isMobile ? '100%' : 160, cursor: 'pointer' }}
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as CategoryKey | 'all')}
        >
          <option value="all">{tTravel('allCategories', 'All Categories')}</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          style={{ ...formInputStyle, width: isMobile ? '100%' : 140, cursor: 'pointer' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as PackageStatus | 'all')}
        >
          <option value="all">{tTravel('allStatuses', 'All Statuses')}</option>
          {(Object.keys(STATUS_CONFIG) as PackageStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {/* ── Package Grid ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          backgroundColor: C.card,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}>
          <Package size={40} color={C.border} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
            {tTravel('noPackages', 'No packages yet')}
          </p>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
            {tTravel('createFirstPackage', 'Create your first travel package to get started')}
          </p>
        </div>
      ) : (
        <div style={gridStyle}>
          {filtered.map(pkg => {
            const catCfg = CATEGORY_CONFIG[pkg.category as CategoryKey] || CATEGORY_CONFIG.beach
            const stCfg = STATUS_CONFIG[pkg.status] || STATUS_CONFIG.draft
            return (
              <div
                key={pkg.id}
                style={pkgCardStyle}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                }}
              >
                {/* Image placeholder */}
                <div style={imgPlaceholder}>
                  {pkg.image_url ? (
                    <img src={pkg.image_url} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Image size={36} />
                  )}
                  {/* Status badge overlay */}
                  <span style={{
                    ...badgeStyle(stCfg.color, stCfg.bg),
                    position: 'absolute',
                    top: 8,
                    right: 8,
                  }}>
                    {stCfg.label}
                  </span>
                  {/* Category badge overlay */}
                  <span style={{
                    ...badgeStyle(catCfg.color, catCfg.bg),
                    position: 'absolute',
                    top: 8,
                    left: 8,
                  }}>
                    {catCfg.icon} {catCfg.label}
                  </span>
                </div>

                {/* Card body */}
                <div style={cardBodyStyle}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px', lineHeight: 1.3 }}>
                    {pkg.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.textSecondary, marginBottom: 10 }}>
                    <MapPin size={13} /> {pkg.destination}
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} /> {pkg.duration_days} {tTravel('days', 'days')}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={13} /> {pkg.spots_remaining}/{pkg.max_travelers}
                    </span>
                  </div>

                  {/* Departure date */}
                  {pkg.departure_date && (
                    <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>
                      {tTravel('departs', 'Departs')}: {formatDateShort(pkg.departure_date)}
                    </div>
                  )}

                  {/* Price */}
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.primary, marginBottom: 12 }}>
                    {formatCurrency(pkg.price_per_person, currencyCode)}
                    <span style={{ fontSize: 12, fontWeight: 400, color: C.textSecondary }}> /{tTravel('person', 'person')}</span>
                  </div>

                  {/* Inclusions preview */}
                  {pkg.inclusions && pkg.inclusions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                      {pkg.inclusions.slice(0, 4).map(inc => (
                        <span key={inc} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, backgroundColor: C.successBg, color: C.success, fontWeight: 500 }}>
                          {inc}
                        </span>
                      ))}
                      {pkg.inclusions.length > 4 && (
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, backgroundColor: C.grayBg, color: C.textSecondary }}>
                          +{pkg.inclusions.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {pkg.status === 'draft' && (
                        <button
                          style={{ ...badgeStyle(C.success, C.successBg), border: 'none', cursor: 'pointer', fontSize: 11 }}
                          onClick={() => handleQuickAction(pkg, 'publish')}
                          title={tTravel('publish', 'Publish')}
                        >
                          <Send size={12} /> {tTravel('publish', 'Publish')}
                        </button>
                      )}
                      {pkg.status === 'published' && (
                        <button
                          style={{ ...badgeStyle(C.purple, C.purpleBg), border: 'none', cursor: 'pointer', fontSize: 11 }}
                          onClick={() => handleQuickAction(pkg, 'archive')}
                          title={tTravel('archive', 'Archive')}
                        >
                          <Archive size={12} /> {tTravel('archive', 'Archive')}
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        style={actionBtnStyle(C.primary)}
                        onClick={() => openEditModal(pkg)}
                        title={tCommon('edit', 'Edit')}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.primaryLight }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        style={actionBtnStyle(C.danger)}
                        onClick={() => { setDeletingPkg(pkg); setShowDeleteModal(true) }}
                        title={tCommon('delete', 'Delete')}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.dangerBg }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create/Edit Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPkg ? tTravel('editPackage', 'Edit Package') : tTravel('addPackage', 'Add Package')}
        size="lg"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        {/* Name */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('packageName', 'Package Name')} *</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder={tTravel('packageNamePlaceholder', 'e.g. Bali Paradise Tour')}
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
            autoFocus
          />
        </div>

        {/* Destination + Category */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('destination', 'Destination')} *</label>
            <input
              style={formInputStyle}
              type="text"
              placeholder={tTravel('destinationPlaceholder', 'e.g. Bali, Indonesia')}
              value={form.destination}
              onChange={e => setForm(prev => ({ ...prev, destination: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('category', 'Category')} *</label>
            <select
              style={{ ...formInputStyle, cursor: 'pointer' }}
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value as CategoryKey }))}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('description', 'Description')}</label>
          <textarea
            style={{ ...formInputStyle, minHeight: 70, resize: 'vertical' }}
            placeholder={tTravel('descriptionPlaceholder', 'Describe the package...')}
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = C.primary }}
            onBlur={e => { e.target.style.borderColor = C.border }}
          />
        </div>

        {/* Duration + Price */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('durationDays', 'Duration (days)')} *</label>
            <input
              style={formInputStyle}
              type="number"
              min="1"
              value={form.duration_days || ''}
              onChange={e => setForm(prev => ({ ...prev, duration_days: Number(e.target.value) }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('pricePerPerson', 'Price / person')} *</label>
            <input
              style={formInputStyle}
              type="number"
              min="0"
              step="0.01"
              value={form.price_per_person || ''}
              onChange={e => setForm(prev => ({ ...prev, price_per_person: Number(e.target.value) }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Max travelers + Spots remaining */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('maxTravelers', 'Max Travelers')}</label>
            <input
              style={formInputStyle}
              type="number"
              min="1"
              value={form.max_travelers || ''}
              onChange={e => setForm(prev => ({ ...prev, max_travelers: Number(e.target.value) }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('spotsRemaining', 'Spots Remaining')}</label>
            <input
              style={formInputStyle}
              type="number"
              min="0"
              value={form.spots_remaining || ''}
              onChange={e => setForm(prev => ({ ...prev, spots_remaining: Number(e.target.value) }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Departure + Return dates */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('departureDate', 'Departure Date')}</label>
            <input
              style={formInputStyle}
              type="date"
              value={form.departure_date}
              onChange={e => setForm(prev => ({ ...prev, departure_date: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('returnDate', 'Return Date')}</label>
            <input
              style={formInputStyle}
              type="date"
              value={form.return_date}
              onChange={e => setForm(prev => ({ ...prev, return_date: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Inclusions */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('inclusions', 'Inclusions')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {INCLUSION_OPTIONS.map(item => (
              <button
                key={item}
                type="button"
                style={chipStyle(form.inclusions.includes(item), C.success, C.successBg)}
                onClick={() => toggleInclusion(item)}
              >
                {form.inclusions.includes(item) ? '✓' : '+'} {item}
              </button>
            ))}
          </div>
        </div>

        {/* Exclusions */}
        <div style={formFieldStyle}>
          <label style={formLabelStyle}>{tTravel('exclusions', 'Exclusions')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXCLUSION_OPTIONS.map(item => (
              <button
                key={item}
                type="button"
                style={chipStyle(form.exclusions.includes(item), C.danger, C.dangerBg)}
                onClick={() => toggleExclusion(item)}
              >
                {form.exclusions.includes(item) ? '✓' : '+'} {item}
              </button>
            ))}
          </div>
        </div>

        {/* Status + Image URL */}
        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('status', 'Status')}</label>
            <select
              style={{ ...formInputStyle, cursor: 'pointer' }}
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as PackageStatus }))}
            >
              {(Object.keys(STATUS_CONFIG) as PackageStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>{tTravel('imageUrl', 'Image URL')}</label>
            <input
              style={formInputStyle}
              type="url"
              placeholder="https://..."
              value={form.image_url}
              onChange={e => setForm(prev => ({ ...prev, image_url: e.target.value }))}
              onFocus={e => { e.target.style.borderColor = C.primary }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowModal(false)}>
            {tCommon('cancel', 'Cancel')}
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? tCommon('loading', 'Loading...') : editingPkg ? tCommon('save', 'Save') : tTravel('create', 'Create')}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={tTravel('deletePackage', 'Delete Package')}
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 8px' }}>
          {tTravel('deleteConfirm', 'Are you sure you want to delete this package?')}
        </p>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
          <strong>{deletingPkg?.name}</strong> - {deletingPkg?.destination}
        </p>
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowDeleteModal(false)}>
            {tCommon('cancel', 'Cancel')}
          </button>
          <button style={deleteBtnStyle} onClick={handleDelete}>
            {tCommon('delete', 'Delete')}
          </button>
        </div>
      </Modal>

      {/* ── CSS keyframes ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
