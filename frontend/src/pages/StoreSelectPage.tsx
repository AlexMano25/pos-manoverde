import { useState, useEffect } from 'react'
import { Store as StoreIcon, Plus, Loader2, ChevronRight } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { supabase } from '../services/supabase'
import { getCurrencySymbol } from '../utils/currency'
import type { Store } from '../types'
import AddStoreModal from '../components/common/AddStoreModal'

export default function StoreSelectPage() {
  const {
    availableStores,
    setCurrentStore,
    setActivity,
    setNeedsStoreSelection,
  } = useAppStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()

  // Defense: if a non-privileged role reaches this page, redirect to assigned store
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const assignedStore = availableStores.find(s => s.id === user.store_id)
      if (assignedStore) {
        setCurrentStore(assignedStore)
        setActivity(assignedStore.activity)
      }
      setNeedsStoreSelection(false)
    }
  }, [user, availableStores, setCurrentStore, setActivity, setNeedsStoreSelection])

  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleSelectStore = async (store: Store) => {
    if (switchingId) return

    setSwitchingId(store.id)

    try {
      if (supabase) {
        const { error } = await supabase.rpc('switch_store', {
          p_store_id: store.id,
        })
        if (error) throw new Error(error.message)
      }

      setCurrentStore(store)
      setActivity(store.activity)
      setNeedsStoreSelection(false)
    } catch (err) {
      console.error('Failed to switch store:', err)
      setSwitchingId(null)
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: 600,
    width: '100%',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  }

  const brandingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '32px 24px 24px',
  }

  const logoContainerStyle: React.CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 4px',
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: availableStores.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 12,
    padding: '0 24px 24px',
  }

  const getStoreCardStyle = (store: Store): React.CSSProperties => {
    const isHovered = hoveredId === store.id
    const isSwitching = switchingId === store.id

    return {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '16px 18px',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      backgroundColor: isSwitching ? '#f8fafc' : '#ffffff',
      cursor: switchingId ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      boxShadow: isHovered && !switchingId
        ? '0 4px 12px rgba(0,0,0,0.1)'
        : '0 1px 3px rgba(0,0,0,0.04)',
      opacity: switchingId && !isSwitching ? 0.5 : 1,
      outline: 'none',
      textAlign: 'left' as const,
      width: '100%',
      position: 'relative' as const,
    }
  }

  const storeIconStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const storeInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  }

  const storeNameStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: '#1e293b',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  const storeMetaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  }

  const badgeStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: '2px 8px',
    borderRadius: 6,
    whiteSpace: 'nowrap',
  }

  const currencyLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#94a3b8',
  }

  const chevronStyle: React.CSSProperties = {
    flexShrink: 0,
    color: '#94a3b8',
  }

  const addButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '14px 18px',
    borderRadius: 12,
    border: '2px dashed #cbd5e1',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: '#64748b',
    transition: 'all 0.2s',
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={cardStyle}>
          {/* Branding */}
          <div style={brandingStyle}>
            <div style={logoContainerStyle}>
              <StoreIcon size={32} color="#ffffff" />
            </div>
            <h1 style={titleStyle}>{t.stores?.myStores || 'Mes points de vente'}</h1>
            <p style={subtitleStyle}>
              {t.stores?.selectStore || 'Selectionnez un point de vente pour continuer'}
            </p>
          </div>

          {/* Store Grid */}
          <div style={gridStyle}>
            {availableStores.map((store) => (
              <button
                key={store.id}
                style={getStoreCardStyle(store)}
                onClick={() => handleSelectStore(store)}
                onMouseEnter={() => setHoveredId(store.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={!!switchingId}
              >
                <div style={storeIconStyle}>
                  {switchingId === store.id ? (
                    <Loader2 size={20} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <StoreIcon size={20} color="#2563eb" />
                  )}
                </div>

                <div style={storeInfoStyle}>
                  <p style={storeNameStyle}>{store.name}</p>
                  <div style={storeMetaStyle}>
                    <span style={badgeStyle}>
                      {(t.setup as Record<string, string>)[store.activity] || store.activity}
                    </span>
                    <span style={currencyLabelStyle}>
                      {getCurrencySymbol(store.currency)}
                    </span>
                  </div>
                </div>

                <div style={chevronStyle}>
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}

            {/* Add Store Button */}
            <button
              style={addButtonStyle}
              onClick={() => setShowAddModal(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.color = '#2563eb'
                e.currentTarget.style.backgroundColor = '#eff6ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1'
                e.currentTarget.style.color = '#64748b'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              disabled={!!switchingId}
            >
              <Plus size={18} />
              {t.stores?.addStore || 'Ajouter un point de vente'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Store Modal */}
      <AddStoreModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

      {/* Spinner animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
