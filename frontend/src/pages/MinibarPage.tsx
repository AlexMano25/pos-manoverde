import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus, X, Save, Search,
  Wine, CheckCircle2, DollarSign,
  Receipt, ShoppingCart, BedDouble,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useHotelStore } from '../stores/hotelStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { MinibarCharge } from '../types'

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
  orange: '#ea580c',
  blue: '#3b82f6',
  purple: '#7c3aed',
} as const

// ── Component ──────────────────────────────────────────────────────────────

export default function MinibarPage() {
  const { currentStore } = useAppStore()
  const {
    rooms, minibarCharges, loading,
    loadRooms, loadMinibarCharges,
    addMinibarCharge, markChargesBilled,
  } = useHotelStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const currencyCode = currentStore?.currency || 'XAF'
  const storeId = currentStore?.id || ''

  // Filters
  const [filterRoom, setFilterRoom] = useState('')
  const [filterBilled, setFilterBilled] = useState<'all' | 'billed' | 'unbilled'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Add charge modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [formRoomId, setFormRoomId] = useState('')
  const [formProductName, setFormProductName] = useState('')
  const [formQuantity, setFormQuantity] = useState(1)
  const [formUnitPrice, setFormUnitPrice] = useState(0)

  useEffect(() => {
    if (storeId) {
      loadRooms(storeId)
      loadMinibarCharges(storeId)
    }
  }, [storeId, loadRooms, loadMinibarCharges])

  // ── Derived data ──────────────────────────────────────────────────────

  // Group charges by room
  const chargesByRoom = useMemo(() => {
    const map: Record<string, { roomId: string; roomNumber: string; guestName?: string; charges: MinibarCharge[] }> = {}
    for (const charge of minibarCharges) {
      if (!map[charge.room_id]) {
        const room = rooms.find(r => r.id === charge.room_id)
        map[charge.room_id] = {
          roomId: charge.room_id,
          roomNumber: charge.room_number,
          guestName: room?.current_guest_name || charge.guest_name,
          charges: [],
        }
      }
      map[charge.room_id].charges.push(charge)
    }
    return Object.values(map)
  }, [minibarCharges, rooms])

  // Apply filters
  const filteredGroups = chargesByRoom.filter(group => {
    if (filterRoom && group.roomId !== filterRoom) return false
    if (filterBilled === 'billed' && group.charges.some(c => !c.charged)) {
      // keep only if all are billed
      if (!group.charges.every(c => c.charged)) return false
    }
    if (filterBilled === 'unbilled' && group.charges.every(c => c.charged)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !group.roomNumber.toLowerCase().includes(q) &&
        !(group.guestName || '').toLowerCase().includes(q) &&
        !group.charges.some(c => c.product_name.toLowerCase().includes(q))
      ) return false
    }
    return true
  })

  // Summary stats
  const totalCharges = minibarCharges.reduce((sum, c) => sum + c.total, 0)
  const billedAmount = minibarCharges.filter(c => c.charged).reduce((sum, c) => sum + c.total, 0)
  const unbilledAmount = minibarCharges.filter(c => !c.charged).reduce((sum, c) => sum + c.total, 0)

  // Rooms with charges (for filter dropdown)
  const roomsWithCharges = [...new Set(minibarCharges.map(c => c.room_id))].map(rid => {
    const ch = minibarCharges.find(c => c.room_id === rid)
    return { id: rid, number: ch?.room_number || '' }
  })

  // Occupied rooms (for adding charges)
  const occupiedRooms = rooms.filter(r => r.status === 'occupied')

  // ── Handlers ──────────────────────────────────────────────────────────

  const openAddModal = () => {
    setFormRoomId(occupiedRooms.length > 0 ? occupiedRooms[0].id : (rooms.length > 0 ? rooms[0].id : ''))
    setFormProductName('')
    setFormQuantity(1)
    setFormUnitPrice(0)
    setShowAddModal(true)
  }

  const handleAddCharge = async () => {
    if (!formRoomId || !formProductName.trim() || formQuantity < 1 || formUnitPrice <= 0) return
    const room = rooms.find(r => r.id === formRoomId)
    if (!room) return
    await addMinibarCharge({
      store_id: storeId,
      room_id: formRoomId,
      room_number: room.number,
      guest_name: room.current_guest_name,
      product_name: formProductName.trim(),
      quantity: formQuantity,
      unit_price: formUnitPrice,
      total: formQuantity * formUnitPrice,
      charged: false,
    })
    setShowAddModal(false)
  }

  const handleMarkBilled = async (roomId: string) => {
    await markChargesBilled(roomId)
  }

  const formatDate = (iso: string): string => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  // ── Styles ────────────────────────────────────────────────────────────

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
    gap: 12,
    marginBottom: 20,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 22, 24),
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: 13,
    color: C.textSecondary,
    margin: '2px 0 0',
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.primary,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const statsRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 16,
  }

  const statBadge = (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 8,
    backgroundColor: color + '10',
    color,
    fontSize: 13,
    fontWeight: 600,
  })

  const filterRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 20,
    alignItems: 'center',
  }

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 13,
    color: C.text,
    backgroundColor: C.card,
    outline: 'none',
    cursor: 'pointer',
  }

  const searchInputStyle: React.CSSProperties = {
    padding: '8px 12px 8px 34px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 13,
    color: C.text,
    backgroundColor: C.card,
    outline: 'none',
    flex: isMobile ? 1 : 'none',
    minWidth: 180,
  }

  const roomGroupStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    marginBottom: 14,
    overflow: 'hidden',
  }

  const roomGroupHeaderStyle: React.CSSProperties = {
    padding: rv(12, 16, 18),
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    flexDirection: isMobile ? 'column' : 'row',
    gap: 10,
  }

  const chargeRowStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: isMobile ? 'flex-start' : 'center',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 6 : 16,
    fontSize: 13,
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: 16,
  }

  const modalStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: rv(20, 24, 28),
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const fieldStyle: React.CSSProperties = { marginBottom: 14 }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    marginBottom: 6,
  }

  // ── Render room group ─────────────────────────────────────────────────

  const renderRoomGroup = (group: { roomId: string; roomNumber: string; guestName?: string; charges: MinibarCharge[] }) => {
    const unbilled = group.charges.filter(c => !c.charged)
    const roomTotal = group.charges.reduce((s, c) => s + c.total, 0)
    const unbilledTotal = unbilled.reduce((s, c) => s + c.total, 0)
    const hasUnbilled = unbilled.length > 0

    return (
      <div key={group.roomId} style={roomGroupStyle}>
        {/* Room header */}
        <div style={roomGroupHeaderStyle}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BedDouble size={18} color={C.primary} />
              <span style={{ fontSize: 17, fontWeight: 700, color: C.text }}>
                {(t as any).hotel?.room || 'Room'} {group.roomNumber}
              </span>
              {group.guestName && (
                <span style={{ fontSize: 13, color: C.textSecondary }}>
                  - {group.guestName}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>
                {(t as any).hotel?.total || 'Total'}: {formatCurrency(roomTotal, currencyCode)}
              </span>
              {hasUnbilled && (
                <span style={{ color: C.danger, fontWeight: 500 }}>
                  {(t as any).hotel?.unbilled || 'Unbilled'}: {formatCurrency(unbilledTotal, currencyCode)}
                </span>
              )}
            </div>
          </div>

          {hasUnbilled && (
            <button
              onClick={() => handleMarkBilled(group.roomId)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: C.success,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
              }}
            >
              <Receipt size={14} /> {(t as any).hotel?.markBilled || 'Mark as Billed'}
            </button>
          )}
        </div>

        {/* Charge rows */}
        {group.charges.map((charge, idx) => (
          <div
            key={charge.id}
            style={{
              ...chargeRowStyle,
              borderBottom: idx === group.charges.length - 1 ? 'none' : `1px solid ${C.border}`,
              backgroundColor: charge.charged ? C.success + '05' : 'transparent',
            }}
          >
            {/* Product name */}
            <div style={{ flex: 2, minWidth: 0 }}>
              <span style={{ fontWeight: 500, color: C.text }}>{charge.product_name}</span>
            </div>

            {/* Quantity */}
            <div style={{ minWidth: 50, color: C.textSecondary }}>
              x{charge.quantity}
            </div>

            {/* Unit price */}
            <div style={{ minWidth: 80, color: C.textSecondary }}>
              @ {formatCurrency(charge.unit_price, currencyCode)}
            </div>

            {/* Total */}
            <div style={{ minWidth: 90, fontWeight: 600, color: C.text }}>
              {formatCurrency(charge.total, currencyCode)}
            </div>

            {/* Status */}
            <div style={{
              padding: '3px 8px',
              borderRadius: 6,
              backgroundColor: charge.charged ? C.success + '15' : C.warning + '15',
              color: charge.charged ? C.success : C.warning,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {charge.charged
                ? (t as any).hotel?.billed || 'Billed'
                : (t as any).hotel?.unbilledLabel || 'Unbilled'}
            </div>

            {/* Date */}
            <div style={{ fontSize: 11, color: C.textSecondary, whiteSpace: 'nowrap' }}>
              {formatDate(charge.created_at)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Add charge modal ──────────────────────────────────────────────────

  const renderAddModal = () => {
    if (!showAddModal) return null
    const allRoomsForSelect = occupiedRooms.length > 0 ? occupiedRooms : rooms
    return (
      <div style={overlayStyle} onClick={() => setShowAddModal(false)}>
        <div style={modalStyle} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.text }}>
              <ShoppingCart size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {(t as any).hotel?.addCharge || 'Add Charge'}
            </h3>
            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textSecondary }}>
              <X size={20} />
            </button>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.selectRoom || 'Room'}</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={formRoomId} onChange={e => setFormRoomId(e.target.value)}>
              {allRoomsForSelect.map(r => (
                <option key={r.id} value={r.id}>
                  {r.number}{r.current_guest_name ? ` - ${r.current_guest_name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.productName || 'Product Name'}</label>
            <input
              style={inputStyle}
              value={formProductName}
              onChange={e => setFormProductName(e.target.value)}
              placeholder={(t as any).hotel?.productPlaceholder || 'e.g. Coca-Cola, Snickers...'}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: 10, ...fieldStyle }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{(t as any).hotel?.quantity || 'Quantity'}</label>
              <input type="number" style={inputStyle} value={formQuantity} onChange={e => setFormQuantity(Math.max(1, Number(e.target.value)))} min={1} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{(t as any).hotel?.unitPrice || 'Unit Price'}</label>
              <input type="number" style={inputStyle} value={formUnitPrice} onChange={e => setFormUnitPrice(Math.max(0, Number(e.target.value)))} min={0} step={1} />
            </div>
          </div>

          {formQuantity > 0 && formUnitPrice > 0 && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: C.primary + '08',
              marginBottom: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, color: C.textSecondary }}>{(t as any).hotel?.chargeTotal || 'Total'}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                {formatCurrency(formQuantity * formUnitPrice, currencyCode)}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{ ...addBtnStyle, backgroundColor: C.textSecondary, flex: 1, justifyContent: 'center' }}
              onClick={() => setShowAddModal(false)}
            >{(t as any).common?.cancel || 'Cancel'}</button>
            <button
              style={{ ...addBtnStyle, flex: 1, justifyContent: 'center' }}
              onClick={handleAddCharge}
            >
              <Save size={16} /> {(t as any).hotel?.addCharge || 'Add Charge'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: C.textSecondary, fontSize: 14 }}>{(t as any).common?.loading || 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <Wine size={rv(20, 22, 24)} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {(t as any).hotel?.minibar || 'Minibar'}
          </h1>
          <p style={subtitleStyle}>
            {(t as any).hotel?.minibarSub || 'Track minibar consumption and billing'}
          </p>
        </div>
        <button style={addBtnStyle} onClick={openAddModal}>
          <Plus size={16} /> {(t as any).hotel?.addCharge || 'Add Charge'}
        </button>
      </div>

      {/* Stats */}
      <div style={statsRowStyle}>
        <div style={statBadge(C.primary)}>
          <DollarSign size={14} /> {(t as any).hotel?.totalCharges || 'Total Charges'}: {formatCurrency(totalCharges, currencyCode)}
        </div>
        <div style={statBadge(C.success)}>
          <CheckCircle2 size={14} /> {(t as any).hotel?.billed || 'Billed'}: {formatCurrency(billedAmount, currencyCode)}
        </div>
        <div style={statBadge(C.danger)}>
          {(t as any).hotel?.unbilled || 'Unbilled'}: {formatCurrency(unbilledAmount, currencyCode)}
        </div>
      </div>

      {/* Filters */}
      <div style={filterRowStyle}>
        <div style={{ position: 'relative' }}>
          <Search size={15} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: 9 }} />
          <input
            style={searchInputStyle}
            placeholder={(t as any).hotel?.searchCharges || 'Search charges...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select style={selectStyle} value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
          <option value="">{(t as any).hotel?.allRooms || 'All Rooms'}</option>
          {roomsWithCharges.map(r => (
            <option key={r.id} value={r.id}>{(t as any).hotel?.room || 'Room'} {r.number}</option>
          ))}
        </select>

        <select style={selectStyle} value={filterBilled} onChange={e => setFilterBilled(e.target.value as 'all' | 'billed' | 'unbilled')}>
          <option value="all">{(t as any).hotel?.allCharges || 'All'}</option>
          <option value="billed">{(t as any).hotel?.billed || 'Billed'}</option>
          <option value="unbilled">{(t as any).hotel?.unbilled || 'Unbilled'}</option>
        </select>
      </div>

      {/* Charge groups */}
      {filteredGroups.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '40vh', gap: 16,
        }}>
          <Wine size={56} color={C.textSecondary} strokeWidth={1.5} />
          <p style={{ margin: 0, fontSize: 15, color: C.textSecondary }}>
            {(t as any).hotel?.noCharges || 'No minibar charges'}
          </p>
          <button style={addBtnStyle} onClick={openAddModal}>
            <Plus size={16} /> {(t as any).hotel?.addCharge || 'Add Charge'}
          </button>
        </div>
      ) : (
        <div>{filteredGroups.map(renderRoomGroup)}</div>
      )}

      {renderAddModal()}
    </div>
  )
}
