import { useState, useEffect } from 'react'
import { X, Store as StoreIcon, Loader2 } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useLanguageStore } from '../../stores/languageStore'
import { supabase } from '../../services/supabase'
import { WORLD_CURRENCIES } from '../../utils/currency'
import { seedSampleProducts } from '../../utils/seedProducts'
import type { Activity } from '../../types'

// ── All 26 supported activities ──────────────────────────────────────────────

const ALL_ACTIVITIES: Activity[] = [
  'restaurant', 'supermarket', 'pharmacy', 'fashion', 'electronics', 'services',
  'bar', 'bakery', 'hotel', 'hair_salon', 'spa', 'gym', 'pool', 'car_wash',
  'gas_station', 'laundry', 'auto_repair', 'daycare', 'school', 'home_cleaning',
  'florist', 'pet_shop', 'bookstore', 'printing', 'real_estate', 'travel_agency',
]

// ── Props ────────────────────────────────────────────────────────────────────

interface AddStoreModalProps {
  isOpen: boolean
  onClose: () => void
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AddStoreModal({ isOpen, onClose }: AddStoreModalProps) {
  const { currentStore, availableStores, setAvailableStores, setCurrentStore, setActivity, setNeedsStoreSelection } = useAppStore()
  const { t } = useLanguageStore()

  const [name, setName] = useState('')
  const [activity, setActivityValue] = useState<Activity>('restaurant')
  const [currency, setCurrency] = useState(currentStore?.currency || 'XAF')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setName('')
      setActivityValue('restaurant')
      setCurrency(currentStore?.currency || 'XAF')
      setError('')
    }
  }, [isOpen, currentStore?.currency])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(t.common.required)
      return
    }
    if (!supabase) {
      setError('Supabase is not configured')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: rpcError } = await supabase.rpc('create_new_store', {
        p_name: name.trim(),
        p_activity: activity,
        p_currency: currency,
      })

      if (rpcError) throw new Error(rpcError.message)

      const newStoreId = (data as { store_id: string }).store_id

      // Seed activity-specific sample products for the new store
      seedSampleProducts(newStoreId, activity).catch((err) =>
        console.error('[AddStoreModal] Sample product seeding failed:', err),
      )

      // Switch to the new store
      const { error: switchError } = await supabase.rpc('switch_store', {
        p_store_id: newStoreId,
      })

      if (switchError) throw new Error(switchError.message)

      // Fetch updated store data
      const { data: storeData, error: fetchError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', newStoreId)
        .single()

      if (fetchError) throw new Error(fetchError.message)

      // Update local state
      setAvailableStores([...availableStores, storeData])
      setCurrentStore(storeData)
      setActivity(activity)
      setNeedsStoreSelection(false)

      onClose()

      // Reload to reinitialize with new store context
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // ── Styles ───────────────────────────────────────────────────────────────

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  }

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    maxWidth: 500,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: 16,
    padding: 32,
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  }

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }

  const iconContainerStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: '#0f172a',
  }

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    transition: 'background-color 0.2s, color 0.2s',
    flexShrink: 0,
  }

  const fieldStyle: React.CSSProperties = {
    marginBottom: 20,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#1e293b',
    marginBottom: 6,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 36,
  }

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background-color 0.2s',
    opacity: loading ? 0.7 : 1,
    marginTop: 8,
  }

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleRowStyle}>
            <div style={iconContainerStyle}>
              <StoreIcon size={20} color="#ffffff" />
            </div>
            <h2 style={titleStyle}>{t.stores?.addStore || 'Ajouter un point de vente'}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            style={closeButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9'
              e.currentTarget.style.color = '#0f172a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 24 }} />

        {/* Error */}
        {error && <div style={errorStyle}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleCreate}>
          {/* Store Name */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.stores?.storeName || 'Nom du point de vente'}</label>
            <input
              style={inputStyle}
              type="text"
              placeholder={t.stores?.storeName || 'Nom du point de vente'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Activity Type */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.stores?.storeActivity || 'Type d\'activite'}</label>
            <select
              style={selectStyle}
              value={activity}
              onChange={(e) => setActivityValue(e.target.value as Activity)}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              disabled={loading}
            >
              {ALL_ACTIVITIES.map((act) => (
                <option key={act} value={act}>
                  {(t.setup as Record<string, string>)[act] || act}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div style={fieldStyle}>
            <label style={labelStyle}>{t.settings?.currency || 'Devise'}</label>
            <select
              style={selectStyle}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              disabled={loading}
            >
              {WORLD_CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.symbol} - {cur.name} ({cur.code})
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
            {loading
              ? (t.common.loading)
              : (t.stores?.createStore || 'Creer')
            }
          </button>
        </form>
      </div>

      {/* Spinner animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
