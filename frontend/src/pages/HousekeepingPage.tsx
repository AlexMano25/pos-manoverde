import React, { useState, useEffect } from 'react'
import {
  Plus, X, Save, Search,
  Sparkles, Clock, CheckCircle2,
  ArrowRight, User,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useHotelStore } from '../stores/hotelStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import type { HousekeepingTask, HousekeepingStatus, HousekeepingPriority } from '../types'

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

const STATUS_COLORS: Record<HousekeepingStatus, string> = {
  pending: C.orange,
  in_progress: C.blue,
  completed: C.success,
  inspected: C.purple,
}

const PRIORITY_COLORS: Record<HousekeepingPriority, string> = {
  low: C.textSecondary,
  normal: C.blue,
  high: C.orange,
  urgent: C.danger,
}

const TASK_TYPES = ['checkout_clean', 'stay_clean', 'deep_clean', 'turndown', 'inspection'] as const

// ── Component ──────────────────────────────────────────────────────────────

export default function HousekeepingPage() {
  const { currentStore } = useAppStore()
  const {
    rooms, housekeepingTasks, loading,
    loadRooms, loadHousekeeping,
    createHousekeepingTask, updateHousekeepingStatus,
  } = useHotelStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const storeId = currentStore?.id || ''

  // Filters
  const [filterStatus, setFilterStatus] = useState<HousekeepingStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<HousekeepingPriority | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [formRoomId, setFormRoomId] = useState('')
  const [formType, setFormType] = useState<typeof TASK_TYPES[number]>('checkout_clean')
  const [formPriority, setFormPriority] = useState<HousekeepingPriority>('normal')
  const [formAssignedName, setFormAssignedName] = useState('')
  const [formNotes, setFormNotes] = useState('')

  useEffect(() => {
    if (storeId) {
      loadRooms(storeId)
      loadHousekeeping(storeId)
    }
  }, [storeId, loadRooms, loadHousekeeping])

  // ── Derived data ──────────────────────────────────────────────────────

  const today = new Date().toISOString().slice(0, 10)

  const filtered = housekeepingTasks.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false
    if (filterPriority && task.priority !== filterPriority) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !task.room_number.toLowerCase().includes(q) &&
        !(task.assigned_name || '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const totalTasks = housekeepingTasks.length
  const pendingCount = housekeepingTasks.filter(t => t.status === 'pending').length
  const inProgressCount = housekeepingTasks.filter(t => t.status === 'in_progress').length
  const completedTodayCount = housekeepingTasks.filter(
    t => (t.status === 'completed' || t.status === 'inspected') && (t.completed_at || '').slice(0, 10) === today
  ).length

  // ── Handlers ──────────────────────────────────────────────────────────

  const openAddModal = () => {
    setFormRoomId(rooms.length > 0 ? rooms[0].id : '')
    setFormType('checkout_clean')
    setFormPriority('normal')
    setFormAssignedName('')
    setFormNotes('')
    setShowAddModal(true)
  }

  const handleAddTask = async () => {
    const room = rooms.find(r => r.id === formRoomId)
    if (!room) return
    await createHousekeepingTask({
      store_id: storeId,
      room_id: formRoomId,
      room_number: room.number,
      type: formType,
      status: 'pending',
      priority: formPriority,
      assigned_name: formAssignedName.trim() || undefined,
      notes: formNotes.trim() || undefined,
    })
    setShowAddModal(false)
  }

  const progressStatus = async (task: HousekeepingTask) => {
    const next: Record<string, HousekeepingStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'inspected',
    }
    const nextStatus = next[task.status]
    if (nextStatus) {
      await updateHousekeepingStatus(task.id, nextStatus)
    }
  }

  const getStatusLabel = (status: HousekeepingStatus): string => {
    const map: Record<HousekeepingStatus, string> = {
      pending: (t as any).hotel?.pending || 'Pending',
      in_progress: (t as any).hotel?.inProgress || 'In Progress',
      completed: (t as any).hotel?.completed || 'Completed',
      inspected: (t as any).hotel?.inspected || 'Inspected',
    }
    return map[status]
  }

  const getPriorityLabel = (priority: HousekeepingPriority): string => {
    const map: Record<HousekeepingPriority, string> = {
      low: (t as any).hotel?.low || 'Low',
      normal: (t as any).hotel?.normal || 'Normal',
      high: (t as any).hotel?.high || 'High',
      urgent: (t as any).hotel?.urgent || 'Urgent',
    }
    return map[priority]
  }

  const getTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      checkout_clean: (t as any).hotel?.checkoutClean || 'Checkout Clean',
      stay_clean: (t as any).hotel?.stayClean || 'Stay Clean',
      deep_clean: (t as any).hotel?.deepClean || 'Deep Clean',
      turndown: (t as any).hotel?.turndown || 'Turndown',
      inspection: (t as any).hotel?.inspection || 'Inspection',
    }
    return map[type] || type
  }

  const getNextActionLabel = (status: HousekeepingStatus): string => {
    const map: Record<string, string> = {
      pending: (t as any).hotel?.startTask || 'Start',
      in_progress: (t as any).hotel?.markComplete || 'Complete',
      completed: (t as any).hotel?.markInspected || 'Inspect',
    }
    return map[status] || ''
  }

  const formatTime = (iso: string): string => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
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

  const taskCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: rv(12, 16, 18),
    marginBottom: 10,
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: rv(10, 16, 20),
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

  // ── Render task card ──────────────────────────────────────────────────

  const renderTaskCard = (task: HousekeepingTask) => (
    <div key={task.id} style={taskCardStyle}>
      {/* Room number */}
      <div style={{ minWidth: 60 }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>
          {task.room_number}
        </p>
      </div>

      {/* Status badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 6,
        backgroundColor: STATUS_COLORS[task.status] + '15',
        fontSize: 12,
        fontWeight: 600,
        color: STATUS_COLORS[task.status],
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          backgroundColor: STATUS_COLORS[task.status],
          display: 'inline-block',
        }} />
        {getStatusLabel(task.status)}
      </div>

      {/* Type */}
      <div style={{
        padding: '4px 10px',
        borderRadius: 6,
        backgroundColor: C.primary + '10',
        color: C.primary,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}>
        {getTypeLabel(task.type)}
      </div>

      {/* Priority */}
      <div style={{
        padding: '4px 10px',
        borderRadius: 6,
        backgroundColor: PRIORITY_COLORS[task.priority] + '15',
        color: PRIORITY_COLORS[task.priority],
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        {getPriorityLabel(task.priority)}
      </div>

      {/* Assigned staff */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {task.assigned_name ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.text }}>
            <User size={13} /> {task.assigned_name}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: C.textSecondary, fontStyle: 'italic' }}>
            {(t as any).hotel?.unassigned || 'Unassigned'}
          </span>
        )}
      </div>

      {/* Time */}
      <div style={{ fontSize: 12, color: C.textSecondary, whiteSpace: 'nowrap' }}>
        <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
        {formatTime(task.created_at)}
      </div>

      {/* Progress button */}
      {task.status !== 'inspected' && (
        <button
          onClick={() => progressStatus(task)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: STATUS_COLORS[
              task.status === 'pending' ? 'in_progress' :
              task.status === 'in_progress' ? 'completed' : 'inspected'
            ],
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          <ArrowRight size={13} /> {getNextActionLabel(task.status)}
        </button>
      )}
      {task.status === 'inspected' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: C.success, fontSize: 12, fontWeight: 600,
        }}>
          <CheckCircle2 size={14} /> {(t as any).hotel?.done || 'Done'}
        </div>
      )}
    </div>
  )

  // ── Add task modal ────────────────────────────────────────────────────

  const renderAddModal = () => {
    if (!showAddModal) return null
    return (
      <div style={overlayStyle} onClick={() => setShowAddModal(false)}>
        <div style={modalStyle} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.text }}>
              <Sparkles size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {(t as any).hotel?.addTask || 'Add Task'}
            </h3>
            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textSecondary }}>
              <X size={20} />
            </button>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.selectRoom || 'Room'}</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={formRoomId} onChange={e => setFormRoomId(e.target.value)}>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.number} - {(t as any).hotel?.floor || 'Floor'} {r.floor}</option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.taskType || 'Type'}</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={formType} onChange={e => setFormType(e.target.value as typeof TASK_TYPES[number])}>
              {TASK_TYPES.map(tt => (
                <option key={tt} value={tt}>{getTypeLabel(tt)}</option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.priority || 'Priority'}</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={formPriority} onChange={e => setFormPriority(e.target.value as HousekeepingPriority)}>
              {(['low', 'normal', 'high', 'urgent'] as HousekeepingPriority[]).map(p => (
                <option key={p} value={p}>{getPriorityLabel(p)}</option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.assignedStaff || 'Assigned Staff'}</label>
            <input style={inputStyle} value={formAssignedName} onChange={e => setFormAssignedName(e.target.value)} placeholder={(t as any).hotel?.staffNamePlaceholder || 'Staff name (optional)'} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{(t as any).hotel?.notes || 'Notes'}</label>
            <input style={inputStyle} value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder={(t as any).hotel?.notesPlaceholder || 'Optional notes...'} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{ ...addBtnStyle, backgroundColor: C.textSecondary, flex: 1, justifyContent: 'center' }}
              onClick={() => setShowAddModal(false)}
            >{(t as any).common?.cancel || 'Cancel'}</button>
            <button
              style={{ ...addBtnStyle, flex: 1, justifyContent: 'center' }}
              onClick={handleAddTask}
            >
              <Save size={16} /> {(t as any).hotel?.addTask || 'Add Task'}
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
            <Sparkles size={rv(20, 22, 24)} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {(t as any).hotel?.housekeeping || 'Housekeeping'}
          </h1>
          <p style={subtitleStyle}>
            {(t as any).hotel?.housekeepingSub || 'Manage cleaning tasks and room readiness'}
          </p>
        </div>
        <button style={addBtnStyle} onClick={openAddModal}>
          <Plus size={16} /> {(t as any).hotel?.addTask || 'Add Task'}
        </button>
      </div>

      {/* Stats */}
      <div style={statsRowStyle}>
        <div style={statBadge(C.primary)}>
          <Sparkles size={14} /> {(t as any).hotel?.totalTasks || 'Total'}: {totalTasks}
        </div>
        <div style={statBadge(C.orange)}>
          <Clock size={14} /> {(t as any).hotel?.pending || 'Pending'}: {pendingCount}
        </div>
        <div style={statBadge(C.blue)}>
          {(t as any).hotel?.inProgress || 'In Progress'}: {inProgressCount}
        </div>
        <div style={statBadge(C.success)}>
          <CheckCircle2 size={14} /> {(t as any).hotel?.completedToday || 'Completed Today'}: {completedTodayCount}
        </div>
      </div>

      {/* Filters */}
      <div style={filterRowStyle}>
        <div style={{ position: 'relative' }}>
          <Search size={15} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: 9 }} />
          <input
            style={searchInputStyle}
            placeholder={(t as any).hotel?.searchTasks || 'Search tasks...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value as HousekeepingStatus | '')}>
          <option value="">{(t as any).hotel?.allStatuses || 'All Statuses'}</option>
          {(['pending', 'in_progress', 'completed', 'inspected'] as HousekeepingStatus[]).map(s => (
            <option key={s} value={s}>{getStatusLabel(s)}</option>
          ))}
        </select>

        <select style={selectStyle} value={filterPriority} onChange={e => setFilterPriority(e.target.value as HousekeepingPriority | '')}>
          <option value="">{(t as any).hotel?.allPriorities || 'All Priorities'}</option>
          {(['low', 'normal', 'high', 'urgent'] as HousekeepingPriority[]).map(p => (
            <option key={p} value={p}>{getPriorityLabel(p)}</option>
          ))}
        </select>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '40vh', gap: 16,
        }}>
          <Sparkles size={56} color={C.textSecondary} strokeWidth={1.5} />
          <p style={{ margin: 0, fontSize: 15, color: C.textSecondary }}>
            {(t as any).hotel?.noTasks || 'No housekeeping tasks'}
          </p>
          <button style={addBtnStyle} onClick={openAddModal}>
            <Plus size={16} /> {(t as any).hotel?.addTask || 'Add Task'}
          </button>
        </div>
      ) : (
        <div>{filtered.map(renderTaskCard)}</div>
      )}

      {renderAddModal()}
    </div>
  )
}
