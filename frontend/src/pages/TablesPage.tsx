import React, { useState, useEffect } from 'react'
import {
  Plus, Trash2, Edit3, X, Users, Grid3X3,
  CheckCircle2, Save,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useTableStore } from '../stores/tableStore'
import { useOrderStore } from '../stores/orderStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { RestaurantTable, TableStatus } from '../types'

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
} as const

const STATUS_COLORS: Record<TableStatus, string> = {
  free: C.success,
  occupied: C.danger,
  reserved: C.warning,
  bill_requested: C.blue,
  food_ready: '#22c55e',
}

// ── Component ──────────────────────────────────────────────────────────────

export default function TablesPage() {
  const { currentStore } = useAppStore()
  const { tables, loading, loadTables, addTable, updateTable, deleteTable, setTableStatus, initializeDefaultTables } = useTableStore()
  const { orders } = useOrderStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const currencyCode = currentStore?.currency || 'XAF'

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [setupCount, setSetupCount] = useState(10)

  // Form state
  const [formNumber, setFormNumber] = useState(1)
  const [formName, setFormName] = useState('')
  const [formCapacity, setFormCapacity] = useState(4)
  const [formZone, setFormZone] = useState('')

  const storeId = currentStore?.id || ''

  useEffect(() => {
    if (storeId) loadTables(storeId)
  }, [storeId, loadTables])

  // Stats
  const freeCount = tables.filter(t => t.status === 'free').length
  const occupiedCount = tables.filter(t => t.status === 'occupied').length
  const reservedCount = tables.filter(t => t.status === 'reserved').length
  const billCount = tables.filter(t => t.status === 'bill_requested').length
  const foodReadyCount = tables.filter(t => t.status === 'food_ready').length

  const getStatusLabel = (status: TableStatus): string => {
    const map: Record<TableStatus, string> = {
      free: t.tables.free,
      occupied: t.tables.occupied,
      reserved: t.tables.reserved,
      bill_requested: t.tables.billRequested,
      food_ready: (t.tables as any).foodReady || 'Prêt à servir',
    }
    return map[status]
  }

  const getOrderTotal = (orderId?: string): number => {
    if (!orderId) return 0
    const order = orders.find(o => o.id === orderId)
    return order?.total || 0
  }

  const handleSetup = async () => {
    if (storeId && setupCount > 0) {
      await initializeDefaultTables(storeId, setupCount)
      setShowSetup(false)
    }
  }

  const openAddModal = () => {
    const nextNum = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1
    setFormNumber(nextNum)
    setFormName(`Table ${nextNum}`)
    setFormCapacity(4)
    setFormZone('')
    setShowAddModal(true)
  }

  const openEditModal = (table: RestaurantTable) => {
    setEditingTable(table)
    setFormNumber(table.number)
    setFormName(table.name)
    setFormCapacity(table.capacity)
    setFormZone(table.zone || '')
  }

  const handleSave = async () => {
    if (editingTable) {
      await updateTable(editingTable.id, {
        number: formNumber,
        name: formName.trim() || `Table ${formNumber}`,
        capacity: formCapacity,
        zone: formZone.trim() || undefined,
      })
      setEditingTable(null)
    } else {
      await addTable(storeId, {
        number: formNumber,
        name: formName.trim() || `Table ${formNumber}`,
        capacity: formCapacity,
        zone: formZone.trim() || undefined,
      })
      setShowAddModal(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteTable(id)
  }

  const toggleStatus = async (table: RestaurantTable) => {
    // If food_ready, clicking means food was served -> go to occupied (waiting for payment)
    if (table.status === 'food_ready') {
      await setTableStatus(table.id, 'occupied')
      return
    }
    const cycle: TableStatus[] = ['free', 'occupied', 'reserved', 'bill_requested']
    const currentIdx = cycle.indexOf(table.status)
    const nextStatus = cycle[(currentIdx + 1) % cycle.length]
    await setTableStatus(table.id, nextStatus)
  }

  // ── Styles ───────────────────────────────────────────────────────────────

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
    marginBottom: 20,
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

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: rv(
      'repeat(2, 1fr)',
      'repeat(3, 1fr)',
      'repeat(4, 1fr)'
    ),
    gap: rv(10, 14, 16),
  }

  const tableCardStyle = (status: TableStatus): React.CSSProperties => ({
    backgroundColor: status === 'food_ready' ? '#f0fdf4' : C.card,
    borderRadius: 12,
    border: `2px solid ${STATUS_COLORS[status]}${status === 'food_ready' ? '' : '40'}`,
    padding: rv(12, 16, 18),
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    position: 'relative',
    animation: status === 'food_ready' ? 'table-food-ready-pulse 1.5s ease-in-out infinite' : undefined,
    boxShadow: status === 'food_ready' ? '0 0 12px rgba(34,197,94,0.3)' : undefined,
  })

  const tableNumberStyle: React.CSSProperties = {
    fontSize: rv(22, 26, 28),
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const tableNameStyle: React.CSSProperties = {
    fontSize: 12,
    color: C.textSecondary,
    margin: '2px 0 6px',
  }

  const statusDot = (status: TableStatus): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: STATUS_COLORS[status],
    display: 'inline-block',
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
    maxWidth: 400,
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

  // ── No tables → Setup ─────────────────────────────────────────────────

  if (!loading && tables.length === 0 && !showSetup) {
    return (
      <div style={pageStyle}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 20,
        }}>
          <Grid3X3 size={64} color={C.textSecondary} strokeWidth={1.5} />
          <h2 style={{ margin: 0, fontSize: 20, color: C.text }}>{t.tables.noTables}</h2>
          <p style={{ margin: 0, fontSize: 14, color: C.textSecondary, textAlign: 'center' }}>
            {t.tables.setupTables}
          </p>
          <button style={addBtnStyle} onClick={() => setShowSetup(true)}>
            <Plus size={16} /> {t.tables.createTables}
          </button>
        </div>

        {/* Quick setup modal */}
        {showSetup && (
          <div style={overlayStyle} onClick={() => setShowSetup(false)}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: C.text }}>
                {t.tables.setupTables}
              </h3>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t.tables.tableCount}</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={setupCount}
                  onChange={e => setSetupCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                  min={1}
                  max={100}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  style={{ ...addBtnStyle, backgroundColor: C.textSecondary, flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowSetup(false)}
                >{t.common.cancel}</button>
                <button
                  style={{ ...addBtnStyle, flex: 1, justifyContent: 'center' }}
                  onClick={handleSetup}
                >
                  <CheckCircle2 size={16} /> {t.tables.createTables}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Render modal (add/edit) ────────────────────────────────────────────

  const renderModal = () => {
    if (!showAddModal && !editingTable) return null
    return (
      <div style={overlayStyle} onClick={() => { setShowAddModal(false); setEditingTable(null) }}>
        <div style={modalStyle} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.text }}>
              {editingTable ? t.tables.editTable : t.tables.addTable}
            </h3>
            <button onClick={() => { setShowAddModal(false); setEditingTable(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textSecondary }}>
              <X size={20} />
            </button>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t.tables.tableNumber}</label>
            <input type="number" style={inputStyle} value={formNumber} onChange={e => setFormNumber(Number(e.target.value))} min={1} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t.tables.tableName}</label>
            <input style={inputStyle} value={formName} onChange={e => setFormName(e.target.value)} placeholder="Table 1" />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t.tables.capacity}</label>
            <input type="number" style={inputStyle} value={formCapacity} onChange={e => setFormCapacity(Number(e.target.value))} min={1} max={50} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t.tables.zone}</label>
            <input style={inputStyle} value={formZone} onChange={e => setFormZone(e.target.value)} placeholder="Terrasse, Salle, VIP..." />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{ ...addBtnStyle, backgroundColor: C.textSecondary, flex: 1, justifyContent: 'center' }}
              onClick={() => { setShowAddModal(false); setEditingTable(null) }}
            >{t.common.cancel}</button>
            <button
              style={{ ...addBtnStyle, flex: 1, justifyContent: 'center' }}
              onClick={handleSave}
            >
              <Save size={16} /> {t.common.save}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes table-food-ready-pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(34,197,94,0.3); }
          50% { box-shadow: 0 0 20px rgba(34,197,94,0.5); }
        }
      `}</style>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t.tables.title}</h1>
          <p style={subtitleStyle}>{t.tables.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={addBtnStyle} onClick={openAddModal}>
            <Plus size={16} /> {t.tables.addTable}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={statsRowStyle}>
        <div style={statBadge(C.success)}>
          <span style={statusDot('free')} /> {t.tables.freeCount}: {freeCount}
        </div>
        <div style={statBadge(C.danger)}>
          <span style={statusDot('occupied')} /> {t.tables.occupiedCount}: {occupiedCount}
        </div>
        {reservedCount > 0 && (
          <div style={statBadge(C.warning)}>
            <span style={statusDot('reserved')} /> {t.tables.reserved}: {reservedCount}
          </div>
        )}
        {foodReadyCount > 0 && (
          <div style={statBadge('#22c55e')}>
            <span style={statusDot('food_ready')} /> {(t.tables as any).foodReady || 'Prêt'}: {foodReadyCount}
          </div>
        )}
        {billCount > 0 && (
          <div style={statBadge(C.blue)}>
            <span style={statusDot('bill_requested')} /> {t.tables.billRequested}: {billCount}
          </div>
        )}
      </div>

      {/* Table grid */}
      <div style={gridStyle}>
        {tables.map(table => (
          <div
            key={table.id}
            style={tableCardStyle(table.status)}
            onClick={() => toggleStatus(table)}
          >
            {/* Actions row */}
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 4,
            }}>
              <button
                onClick={e => { e.stopPropagation(); openEditModal(table) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textSecondary }}
              >
                <Edit3 size={14} />
              </button>
              {table.status === 'free' && (
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(table.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.danger }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Content */}
            <p style={tableNumberStyle}>#{table.number}</p>
            <p style={tableNameStyle}>{table.name}</p>

            {/* Status badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: table.status === 'food_ready' ? '4px 10px' : '3px 8px',
              borderRadius: 6,
              backgroundColor: table.status === 'food_ready' ? '#22c55e' : STATUS_COLORS[table.status] + '15',
              fontSize: table.status === 'food_ready' ? 12 : 11,
              fontWeight: table.status === 'food_ready' ? 700 : 500,
              color: table.status === 'food_ready' ? '#fff' : STATUS_COLORS[table.status],
              marginBottom: 6,
            }}>
              <span style={{
                ...statusDot(table.status),
                backgroundColor: table.status === 'food_ready' ? '#fff' : STATUS_COLORS[table.status],
                animation: table.status === 'food_ready' ? 'table-food-ready-pulse 1s ease-in-out infinite' : undefined,
              }} />
              {getStatusLabel(table.status)}
            </div>

            {/* Capacity */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: C.textSecondary,
            }}>
              <Users size={12} /> {table.capacity}
              {table.zone && <span style={{ marginLeft: 6 }}>· {table.zone}</span>}
            </div>

            {/* Order total (if occupied) */}
            {table.current_order_id && (
              <div style={{
                marginTop: 6,
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
              }}>
                {formatCurrency(getOrderTotal(table.current_order_id), currencyCode)}
              </div>
            )}
          </div>
        ))}
      </div>

      {renderModal()}
    </div>
  )
}
