import React, { useState, useEffect } from 'react'
import {
  Plus, X, Save, Search,
  BedDouble, Users, CalendarCheck, LogIn, LogOut,
  Wrench, AlertTriangle, CheckCircle2,
  Wifi, Tv, Wine, Snowflake, Sun,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useHotelStore } from '../stores/hotelStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { HotelRoom, RoomStatus, RoomType } from '../types'

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
  gray: '#6b7280',
  blue: '#3b82f6',
  purple: '#7c3aed',
} as const

const STATUS_COLORS: Record<RoomStatus, string> = {
  available: C.success,
  occupied: C.danger,
  cleaning: C.warning,
  maintenance: C.orange,
  out_of_order: C.gray,
}

const ROOM_TYPES: RoomType[] = ['single', 'double', 'twin', 'suite', 'apartment', 'studio', 'penthouse']

const AMENITIES_OPTIONS = [
  { key: 'wifi', label: 'WiFi', icon: Wifi },
  { key: 'tv', label: 'TV', icon: Tv },
  { key: 'minibar', label: 'Minibar', icon: Wine },
  { key: 'ac', label: 'A/C', icon: Snowflake },
  { key: 'balcony', label: 'Balcony', icon: Sun },
]

// ── Component ──────────────────────────────────────────────────────────────

export default function RoomManagementPage() {
  const { currentStore } = useAppStore()
  const {
    rooms, loading,
    loadRooms, createRoom, updateRoom, deleteRoom,
    updateRoomStatus, checkIn, checkOut,
  } = useHotelStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const currencyCode = currentStore?.currency || 'XAF'
  const storeId = currentStore?.id || ''

  // Filters
  const [filterFloor, setFilterFloor] = useState<number | ''>('')
  const [filterStatus, setFilterStatus] = useState<RoomStatus | ''>('')
  const [filterType, setFilterType] = useState<RoomType | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<HotelRoom | null>(null)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInRoomId, setCheckInRoomId] = useState('')

  // Room form
  const [formNumber, setFormNumber] = useState('')
  const [formFloor, setFormFloor] = useState(1)
  const [formType, setFormType] = useState<RoomType>('single')
  const [formPrice, setFormPrice] = useState(0)
  const [formMaxGuests, setFormMaxGuests] = useState(2)
  const [formAmenities, setFormAmenities] = useState<string[]>([])

  // Check-in form
  const [ciGuestName, setCiGuestName] = useState('')
  const [ciCheckOutDate, setCiCheckOutDate] = useState('')

  useEffect(() => {
    if (storeId) loadRooms(storeId)
  }, [storeId, loadRooms])

  // ── Derived data ──────────────────────────────────────────────────────

  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b)

  const filtered = rooms.filter(r => {
    if (filterFloor !== '' && r.floor !== filterFloor) return false
    if (filterStatus && r.status !== filterStatus) return false
    if (filterType && r.type !== filterType) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!r.number.toLowerCase().includes(q) && !(r.current_guest_name || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalRooms = rooms.length
  const availableCount = rooms.filter(r => r.status === 'available').length
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length
  const cleaningCount = rooms.filter(r => r.status === 'cleaning').length
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0

  // ── Handlers ──────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingRoom(null)
    setFormNumber('')
    setFormFloor(1)
    setFormType('single')
    setFormPrice(0)
    setFormMaxGuests(2)
    setFormAmenities([])
    setShowRoomModal(true)
  }

  const openEditModal = (room: HotelRoom) => {
    setEditingRoom(room)
    setFormNumber(room.number)
    setFormFloor(room.floor)
    setFormType(room.type)
    setFormPrice(room.price_per_night)
    setFormMaxGuests(room.max_guests)
    setFormAmenities([...(room.amenities || [])])
    setShowRoomModal(true)
  }

  const handleSaveRoom = async () => {
    if (!formNumber.trim()) return
    const data = {
      number: formNumber.trim(),
      floor: formFloor,
      type: formType,
      price_per_night: formPrice,
      max_guests: formMaxGuests,
      amenities: formAmenities,
    }
    if (editingRoom) {
      await updateRoom(editingRoom.id, data)
    } else {
      await createRoom({ ...data, store_id: storeId, status: 'available' as RoomStatus })
    }
    setShowRoomModal(false)
  }

  const openCheckIn = (roomId: string) => {
    setCheckInRoomId(roomId)
    setCiGuestName('')
    setCiCheckOutDate('')
    setShowCheckInModal(true)
  }

  const handleCheckIn = async () => {
    if (!ciGuestName.trim()) return
    await checkIn(checkInRoomId, ciGuestName.trim(), undefined, ciCheckOutDate || undefined)
    setShowCheckInModal(false)
  }

  const handleCheckOut = async (roomId: string) => {
    await checkOut(roomId)
  }

  const handleQuickStatus = async (roomId: string, status: RoomStatus) => {
    await updateRoomStatus(roomId, status)
  }

  const toggleAmenity = (key: string) => {
    setFormAmenities(prev =>
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
    )
  }

  const getStatusLabel = (status: RoomStatus): string => {
    const map: Record<RoomStatus, string> = {
      available: (t as any).hotel?.available || 'Available',
      occupied: (t as any).hotel?.occupied || 'Occupied',
      cleaning: (t as any).hotel?.cleaning || 'Cleaning',
      maintenance: (t as any).hotel?.maintenance || 'Maintenance',
      out_of_order: (t as any).hotel?.outOfOrder || 'Out of Order',
    }
    return map[status]
  }

  const getTypeLabel = (type: RoomType): string => {
    const map: Record<RoomType, string> = {
      single: (t as any).hotel?.single || 'Single',
      double: (t as any).hotel?.double || 'Double',
      twin: (t as any).hotel?.twin || 'Twin',
      suite: (t as any).hotel?.suite || 'Suite',
      apartment: (t as any).hotel?.apartment || 'Apartment',
      studio: (t as any).hotel?.studio || 'Studio',
      penthouse: (t as any).hotel?.penthouse || 'Penthouse',
    }
    return map[type]
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

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(3, 1fr)', 'repeat(4, 1fr)'),
    gap: rv(10, 14, 16),
  }

  const roomCardStyle = (status: RoomStatus): React.CSSProperties => ({
    backgroundColor: C.card,
    borderRadius: 12,
    border: `2px solid ${STATUS_COLORS[status]}40`,
    padding: rv(12, 16, 18),
    position: 'relative',
    transition: 'transform 0.15s, box-shadow 0.15s',
  })

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
    maxWidth: 440,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxHeight: '90vh',
    overflowY: 'auto',
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

  const smallBtnStyle = (bg: string): React.CSSProperties => ({
    padding: '5px 10px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: bg + '15',
    color: bg,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  })

  // ── Render room card ──────────────────────────────────────────────────

  const renderRoomCard = (room: HotelRoom) => (
    <div key={room.id} style={roomCardStyle(room.status)}>
      {/* Room number & type */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <p style={{ margin: 0, fontSize: rv(20, 22, 24), fontWeight: 700, color: C.text }}>
            {room.number}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textSecondary }}>
            {(t as any).hotel?.floor || 'Floor'} {room.floor} - {getTypeLabel(room.type)}
          </p>
        </div>
        <button
          onClick={() => openEditModal(room)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textSecondary }}
        >
          <Wrench size={14} />
        </button>
      </div>

      {/* Status badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        borderRadius: 6,
        backgroundColor: STATUS_COLORS[room.status] + '15',
        fontSize: 11,
        fontWeight: 500,
        color: STATUS_COLORS[room.status],
        marginBottom: 8,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          backgroundColor: STATUS_COLORS[room.status],
          display: 'inline-block',
        }} />
        {getStatusLabel(room.status)}
      </div>

      {/* Guest info if occupied */}
      {room.status === 'occupied' && room.current_guest_name && (
        <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>
          <Users size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {room.current_guest_name}
        </div>
      )}
      {room.status === 'occupied' && room.check_out_date && (
        <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>
          <CalendarCheck size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {(t as any).hotel?.checkOut || 'Check-out'}: {room.check_out_date}
        </div>
      )}

      {/* Price */}
      <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8 }}>
        {formatCurrency(room.price_per_night, currencyCode)}/{(t as any).hotel?.night || 'night'}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {room.status === 'available' && (
          <button style={smallBtnStyle(C.success)} onClick={() => openCheckIn(room.id)}>
            <LogIn size={12} /> {(t as any).hotel?.checkIn || 'Check In'}
          </button>
        )}
        {room.status === 'occupied' && (
          <button style={smallBtnStyle(C.danger)} onClick={() => handleCheckOut(room.id)}>
            <LogOut size={12} /> {(t as any).hotel?.checkOut || 'Check Out'}
          </button>
        )}
        {(room.status === 'available' || room.status === 'cleaning') && (
          <button style={smallBtnStyle(C.orange)} onClick={() => handleQuickStatus(room.id, 'maintenance')}>
            <Wrench size={12} /> {(t as any).hotel?.maintenance || 'Maintenance'}
          </button>
        )}
        {room.status === 'maintenance' && (
          <button style={smallBtnStyle(C.success)} onClick={() => handleQuickStatus(room.id, 'available')}>
            <CheckCircle2 size={12} /> {(t as any).hotel?.available || 'Available'}
          </button>
        )}
        {room.status === 'cleaning' && (
          <button style={smallBtnStyle(C.success)} onClick={() => handleQuickStatus(room.id, 'available')}>
            <CheckCircle2 size={12} /> {(t as any).hotel?.markReady || 'Ready'}
          </button>
        )}
        {room.status === 'available' && (
          <button style={smallBtnStyle(C.gray)} onClick={() => handleQuickStatus(room.id, 'out_of_order')}>
            <AlertTriangle size={12} /> {(t as any).hotel?.outOfOrder || 'Out of Order'}
          </button>
        )}
        {room.status === 'out_of_order' && (
          <button style={smallBtnStyle(C.success)} onClick={() => handleQuickStatus(room.id, 'available')}>
            <CheckCircle2 size={12} /> {(t as any).hotel?.available || 'Available'}
          </button>
        )}
      </div>
    </div>
  )

  // ── Room modal ────────────────────────────────────────────────────────

  const renderRoomModal = () => {
    if (!showRoomModal) return null
    return (
      <div style={overlayStyle} onClick={() => setShowRoomModal(false)}>
        <div style={modalStyle} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.text }}>
              {editingRoom
                ? (t as any).hotel?.editRoom || 'Edit Room'
                : (t as any).hotel?.addRoom || 'Add Room'}
            </h3>
            <button onClick={() => setShowRoomModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textSecondary }}>
              <X size={20} />
            </button>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.roomNumber || 'Room Number'}</label>
            <input style={inputStyle} value={formNumber} onChange={e => setFormNumber(e.target.value)} placeholder="101" />
          </div>

          <div style={{ display: 'flex', gap: 10, ...fieldStyle }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{(t as any).hotel?.floor || 'Floor'}</label>
              <input type="number" style={inputStyle} value={formFloor} onChange={e => setFormFloor(Number(e.target.value))} min={-2} max={100} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{(t as any).hotel?.maxGuests || 'Max Guests'}</label>
              <input type="number" style={inputStyle} value={formMaxGuests} onChange={e => setFormMaxGuests(Number(e.target.value))} min={1} max={20} />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.roomType || 'Type'}</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={formType} onChange={e => setFormType(e.target.value as RoomType)}>
              {ROOM_TYPES.map(rt => (
                <option key={rt} value={rt}>{getTypeLabel(rt)}</option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.pricePerNight || 'Price per Night'}</label>
            <input type="number" style={inputStyle} value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} min={0} step={1} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.amenities || 'Amenities'}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AMENITIES_OPTIONS.map(am => {
                const active = formAmenities.includes(am.key)
                return (
                  <button
                    key={am.key}
                    onClick={() => toggleAmenity(am.key)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: `1px solid ${active ? C.primary : C.border}`,
                      backgroundColor: active ? C.primary + '10' : C.card,
                      color: active ? C.primary : C.textSecondary,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <am.icon size={13} /> {am.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {editingRoom && (
              <button
                style={{ ...addBtnStyle, backgroundColor: C.danger, flex: 0, justifyContent: 'center', padding: '10px 14px' }}
                onClick={async () => { await deleteRoom(editingRoom.id); setShowRoomModal(false) }}
              >
                <X size={16} />
              </button>
            )}
            <button
              style={{ ...addBtnStyle, backgroundColor: C.textSecondary, flex: 1, justifyContent: 'center' }}
              onClick={() => setShowRoomModal(false)}
            >{(t as any).common?.cancel || 'Cancel'}</button>
            <button
              style={{ ...addBtnStyle, flex: 1, justifyContent: 'center' }}
              onClick={handleSaveRoom}
            >
              <Save size={16} /> {(t as any).common?.save || 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Check-in modal ────────────────────────────────────────────────────

  const renderCheckInModal = () => {
    if (!showCheckInModal) return null
    return (
      <div style={overlayStyle} onClick={() => setShowCheckInModal(false)}>
        <div style={{ ...modalStyle, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.text }}>
              <LogIn size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {(t as any).hotel?.checkIn || 'Check In'}
            </h3>
            <button onClick={() => setShowCheckInModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textSecondary }}>
              <X size={20} />
            </button>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.guestName || 'Guest Name'}</label>
            <input style={inputStyle} value={ciGuestName} onChange={e => setCiGuestName(e.target.value)} placeholder="John Doe" autoFocus />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.checkOutDate || 'Check-out Date'}</label>
            <input type="date" style={inputStyle} value={ciCheckOutDate} onChange={e => setCiCheckOutDate(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{ ...addBtnStyle, backgroundColor: C.textSecondary, flex: 1, justifyContent: 'center' }}
              onClick={() => setShowCheckInModal(false)}
            >{(t as any).common?.cancel || 'Cancel'}</button>
            <button
              style={{ ...addBtnStyle, backgroundColor: C.success, flex: 1, justifyContent: 'center' }}
              onClick={handleCheckIn}
            >
              <LogIn size={16} /> {(t as any).hotel?.checkIn || 'Check In'}
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
            <BedDouble size={rv(20, 22, 24)} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {(t as any).hotel?.roomManagement || 'Room Management'}
          </h1>
          <p style={subtitleStyle}>
            {(t as any).hotel?.roomManagementSub || 'Manage rooms, check-ins, and availability'}
          </p>
        </div>
        <button style={addBtnStyle} onClick={openAddModal}>
          <Plus size={16} /> {(t as any).hotel?.addRoom || 'Add Room'}
        </button>
      </div>

      {/* Stats */}
      <div style={statsRowStyle}>
        <div style={statBadge(C.primary)}>
          <BedDouble size={14} /> {(t as any).hotel?.totalRooms || 'Total'}: {totalRooms}
        </div>
        <div style={statBadge(C.success)}>
          <CheckCircle2 size={14} /> {(t as any).hotel?.available || 'Available'}: {availableCount}
        </div>
        <div style={statBadge(C.danger)}>
          <Users size={14} /> {(t as any).hotel?.occupied || 'Occupied'}: {occupiedCount}
        </div>
        <div style={statBadge(C.warning)}>
          {(t as any).hotel?.cleaning || 'Cleaning'}: {cleaningCount}
        </div>
        <div style={statBadge(C.purple)}>
          {(t as any).hotel?.occupancyRate || 'Occupancy'}: {occupancyRate}%
        </div>
      </div>

      {/* Filters */}
      <div style={filterRowStyle}>
        <div style={{ position: 'relative' }}>
          <Search size={15} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: 9 }} />
          <input
            style={searchInputStyle}
            placeholder={(t as any).hotel?.searchRooms || 'Search rooms...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select style={selectStyle} value={filterFloor} onChange={e => setFilterFloor(e.target.value === '' ? '' : Number(e.target.value))}>
          <option value="">{(t as any).hotel?.allFloors || 'All Floors'}</option>
          {floors.map(f => (
            <option key={f} value={f}>{(t as any).hotel?.floor || 'Floor'} {f}</option>
          ))}
        </select>

        <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value as RoomStatus | '')}>
          <option value="">{(t as any).hotel?.allStatuses || 'All Statuses'}</option>
          {(['available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'] as RoomStatus[]).map(s => (
            <option key={s} value={s}>{getStatusLabel(s)}</option>
          ))}
        </select>

        <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value as RoomType | '')}>
          <option value="">{(t as any).hotel?.allTypes || 'All Types'}</option>
          {ROOM_TYPES.map(rt => (
            <option key={rt} value={rt}>{getTypeLabel(rt)}</option>
          ))}
        </select>
      </div>

      {/* Room grid */}
      {filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '40vh', gap: 16,
        }}>
          <BedDouble size={56} color={C.textSecondary} strokeWidth={1.5} />
          <p style={{ margin: 0, fontSize: 15, color: C.textSecondary }}>
            {(t as any).hotel?.noRooms || 'No rooms found'}
          </p>
          <button style={addBtnStyle} onClick={openAddModal}>
            <Plus size={16} /> {(t as any).hotel?.addRoom || 'Add Room'}
          </button>
        </div>
      ) : (
        <div style={gridStyle}>
          {filtered.map(renderRoomCard)}
        </div>
      )}

      {renderRoomModal()}
      {renderCheckInModal()}
    </div>
  )
}
