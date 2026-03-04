import { useState, useRef, useEffect } from 'react'
import { Store as StoreIcon, ChevronDown, Plus, Check } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useLanguageStore } from '../../stores/languageStore'
import { supabase } from '../../services/supabase'
import type { Store } from '../../types'
import AddStoreModal from '../common/AddStoreModal'

export default function StoreSwitcher() {
  const {
    currentStore,
    availableStores,
    setCurrentStore,
    setActivity,
  } = useAppStore()
  const { t } = useLanguageStore()

  const [isOpen, setIsOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [switching, setSwitching] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // If only one store (or none), just show the store name without dropdown
  if (availableStores.length <= 1) {
    return (
      <div style={staticContainerStyle}>
        <div style={staticIconStyle}>
          <StoreIcon size={16} color="#2563eb" />
        </div>
        <span style={staticNameStyle}>
          {currentStore?.name || 'Store'}
        </span>
      </div>
    )
  }

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
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
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
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const triggerTextStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  }

  const triggerNameStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3,
  }

  const triggerActivityStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#64748b',
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
    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
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
          style={triggerStyle}
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={(e) => {
            if (!switching) e.currentTarget.style.borderColor = '#cbd5e1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0'
          }}
          disabled={switching}
        >
          <div style={triggerIconStyle}>
            <StoreIcon size={14} color="#2563eb" />
          </div>
          <div style={triggerTextStyle}>
            <p style={triggerNameStyle}>{currentStore?.name || 'Store'}</p>
            <p style={triggerActivityStyle}>
              {currentStore?.activity
                ? (t.setup as Record<string, string>)[currentStore.activity] || currentStore.activity
                : ''
              }
            </p>
          </div>
          <div style={chevronStyle}>
            <ChevronDown size={14} />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div style={dropdownStyle}>
            <div style={dropdownHeaderStyle}>
              {t.stores?.switchStore || 'Changer de point de vente'}
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

// ── Static display styles (single store, no dropdown) ────────────────────

const staticContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
}

const staticIconStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 7,
  backgroundColor: 'rgba(37, 99, 235, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const staticNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#e2e8f0',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
