import { useState, useRef, useEffect } from 'react'
import { Store as StoreIcon, ChevronDown, Plus, Check } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useAuthStore } from '../../stores/authStore'
import { useLanguageStore } from '../../stores/languageStore'
import { supabase } from '../../services/supabase'
import type { Store } from '../../types'
import AddStoreModal from '../common/AddStoreModal'

export default function StoreSwitcher() {
  const {
    currentStore,
    availableStores,
    setAvailableStores,
    setCurrentStore,
    setActivity,
  } = useAppStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()

  const multiStoreAccess = user?.role === 'admin'

  const [isOpen, setIsOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [switching, setSwitching] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Auto-fetch stores if list is empty on mount (admin/manager only) ────
  useEffect(() => {
    if (!multiStoreAccess) return
    if (availableStores.length > 0 || !supabase || !user) return

    const fetchStores = async () => {
      try {
        // Get org_id from current store or user's store
        const storeId = currentStore?.id || user.store_id
        if (!storeId) return

        // First get the org_id
        const { data: storeData } = await supabase!
          .from('stores')
          .select('organization_id')
          .eq('id', storeId)
          .single()

        if (!storeData?.organization_id) return

        // Then fetch all org stores
        const { data: orgStores } = await supabase!
          .from('stores')
          .select('*')
          .eq('organization_id', storeData.organization_id)

        if (orgStores && orgStores.length > 0) {
          setAvailableStores(orgStores as Store[])

          // Also restore currentStore if it's null
          if (!currentStore && user.store_id) {
            const myStore = orgStores.find((s) => s.id === user.store_id)
            if (myStore) {
              setCurrentStore(myStore as Store)
              setActivity((myStore as Store).activity)
            }
          }
        }
      } catch (err) {
        console.error('StoreSwitcher: failed to fetch stores', err)
      }
    }

    fetchStores()
  }, [availableStores.length, user, currentStore, setAvailableStores, setCurrentStore, setActivity])

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSwitchStore = async (store: Store) => {
    if (switching || store.id === currentStore?.id) {
      setIsOpen(false)
      return
    }

    setSwitching(true)

    try {
      if (supabase) {
        const { error } = await supabase.rpc('switch_store', {
          p_store_id: store.id,
        })
        if (error) throw new Error(error.message)
      }

      setCurrentStore(store)
      setActivity(store.activity)
      setIsOpen(false)

      // Reload to reinitialize with new store context
      window.location.reload()
    } catch (err) {
      console.error('Failed to switch store:', err)
      setSwitching(false)
    }
  }

  // ── Display name ────────────────────────────────────────────────────────
  const storeName = currentStore?.name || 'Store'
  const activityLabel = currentStore?.activity
    ? (t.setup as Record<string, string>)[currentStore.activity] || currentStore.activity
    : ''

  // ── Styles ───────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    position: 'relative',
  }

  const triggerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    cursor: switching ? 'wait' : 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s',
    outline: 'none',
  }

  const triggerIconStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const triggerNameStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#e2e8f0',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3,
  }

  const triggerActivityStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#94a3b8',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3,
  }

  const chevronStyle: React.CSSProperties = {
    flexShrink: 0,
    color: '#94a3b8',
    transition: 'transform 0.2s',
    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    zIndex: 100,
    overflow: 'hidden',
    maxHeight: 300,
    overflowY: 'auto',
  }

  const dropdownHeaderStyle: React.CSSProperties = {
    padding: '10px 14px 8px',
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const getItemStyle = (store: Store): React.CSSProperties => {
    const isActive = store.id === currentStore?.id
    return {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      border: 'none',
      backgroundColor: isActive ? '#eff6ff' : 'transparent',
      cursor: switching ? 'wait' : 'pointer',
      width: '100%',
      textAlign: 'left',
      transition: 'background-color 0.15s',
      outline: 'none',
      fontSize: 13,
    }
  }

  const itemNameStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  }

  const itemStoreName: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: '#1e293b',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3,
  }

  const itemActivityLabel: React.CSSProperties = {
    fontSize: 11,
    color: '#64748b',
    margin: 0,
    lineHeight: 1.3,
  }

  const addItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    border: 'none',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'background-color 0.15s',
    outline: 'none',
    fontSize: 13,
    fontWeight: 500,
    color: '#2563eb',
  }

  return (
    <>
      <div style={containerStyle} ref={dropdownRef}>
        {/* Trigger */}
        <button
          style={{ ...triggerStyle, cursor: multiStoreAccess ? (switching ? 'wait' : 'pointer') : 'default' }}
          onClick={() => { if (multiStoreAccess) setIsOpen(!isOpen) }}
          onMouseEnter={(e) => {
            if (!switching && multiStoreAccess) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'
          }}
          disabled={switching}
        >
          <div style={triggerIconStyle}>
            <StoreIcon size={14} color="#60a5fa" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={triggerNameStyle}>{storeName}</p>
            {activityLabel && <p style={triggerActivityStyle}>{activityLabel}</p>}
          </div>
          {multiStoreAccess && (
            <div style={chevronStyle}>
              <ChevronDown size={14} />
            </div>
          )}
        </button>

        {/* Dropdown (admin/manager only) */}
        {isOpen && multiStoreAccess && (
          <div style={dropdownStyle}>
            <div style={dropdownHeaderStyle}>
              {t.stores?.myStores || 'Mes points de vente'}
            </div>

            {availableStores.map((store) => (
              <button
                key={store.id}
                style={getItemStyle(store)}
                onClick={() => handleSwitchStore(store)}
                onMouseEnter={(e) => {
                  if (store.id !== currentStore?.id) {
                    e.currentTarget.style.backgroundColor = '#f8fafc'
                  }
                }}
                onMouseLeave={(e) => {
                  if (store.id !== currentStore?.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
                disabled={switching}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  backgroundColor: store.id === currentStore?.id ? '#dbeafe' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <StoreIcon size={14} color={store.id === currentStore?.id ? '#2563eb' : '#64748b'} />
                </div>

                <div style={itemNameStyle}>
                  <p style={{
                    ...itemStoreName,
                    color: store.id === currentStore?.id ? '#2563eb' : '#1e293b',
                    fontWeight: store.id === currentStore?.id ? 600 : 500,
                  }}>
                    {store.name}
                  </p>
                  <p style={itemActivityLabel}>
                    {(t.setup as Record<string, string>)[store.activity] || store.activity}
                  </p>
                </div>

                {store.id === currentStore?.id && (
                  <Check size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                )}
              </button>
            ))}

            {/* Add Store */}
            <button
              style={addItemStyle}
              onClick={() => {
                setIsOpen(false)
                setShowAddModal(true)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Plus size={14} color="#2563eb" />
              </div>
              {t.stores?.addStore || 'Ajouter un point de vente'}
            </button>
          </div>
        )}
      </div>

      {/* Add Store Modal */}
      <AddStoreModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </>
  )
}
