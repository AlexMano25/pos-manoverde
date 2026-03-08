import React, { useState, useEffect, useMemo } from 'react'
import {
  Clock,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Play,
  Square,
  Coffee,
  Users,
  Timer,
  AlertTriangle,
  Calendar,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useTimeAttendanceStore } from '../stores/timeAttendanceStore'
import { useAuthStore } from '../stores/authStore'
import { useResponsive } from '../hooks/useLayoutMode'
import type { TimeEntry, ClockStatus } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#4f46e5',
  primaryLight: '#6366f1',
  primaryDark: '#3730a3',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  indigoLight: '#e0e7ff',
} as const

// ── Date filter helpers ──────────────────────────────────────────────────

type DateFilter = 'today' | 'week' | 'month'

function getFilterStart(filter: DateFilter): Date {
  const now = new Date()
  if (filter === 'today') {
    now.setHours(0, 0, 0, 0)
    return now
  }
  if (filter === 'week') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now)
    monday.setDate(diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  }
  // month
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

function formatHours(h: number): string {
  const hours = Math.floor(h)
  const minutes = Math.round((h - hours) * 60)
  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

// ── Component ────────────────────────────────────────────────────────────

export default function TimeAttendancePage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    entries,
    loading,
    loadEntries,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    addEntry,
    updateEntry,
    deleteEntry,
    getTodayEntries,
  } = useTimeAttendanceStore()

  const storeId = currentStore?.id || 'default-store'

  // ── i18n fallback ────────────────────────────────────────────────────
  const label = (t as Record<string, unknown>).timeAttendance || {} as Record<string, string>
  const L = {
    title: (label as Record<string, string>).title || 'Time & Attendance',
    present: (label as Record<string, string>).present || 'Present Today',
    onBreak: (label as Record<string, string>).onBreak || 'On Break',
    totalHours: (label as Record<string, string>).totalHours || 'Total Hours Today',
    absent: (label as Record<string, string>).absent || 'Absent',
    clockIn: (label as Record<string, string>).clockIn || 'Clock In',
    clockOut: (label as Record<string, string>).clockOut || 'Clock Out',
    startBreak: (label as Record<string, string>).startBreak || 'Start Break',
    endBreak: (label as Record<string, string>).endBreak || 'End Break',
    manualEntry: (label as Record<string, string>).manualEntry || 'Manual Entry',
    liveStatus: (label as Record<string, string>).liveStatus || 'Live Status',
    timesheet: (label as Record<string, string>).timesheet || 'Timesheet',
    yourStatus: (label as Record<string, string>).yourStatus || 'Your Status',
    clockedIn: (label as Record<string, string>).clockedIn || 'Clocked In',
    clockedOut: (label as Record<string, string>).clockedOut || 'Clocked Out',
    working: (label as Record<string, string>).working || 'Working',
    employeeName: (label as Record<string, string>).employeeName || 'Employee Name',
    date: (label as Record<string, string>).date || 'Date',
    notes: (label as Record<string, string>).notes || 'Notes',
    save: (label as Record<string, string>).save || 'Save',
    cancel: (label as Record<string, string>).cancel || 'Cancel',
    deleteConfirm: (label as Record<string, string>).deleteConfirm || 'Are you sure you want to delete this entry?',
    deleteTitle: (label as Record<string, string>).deleteTitle || 'Delete Entry',
    editEntry: (label as Record<string, string>).editEntry || 'Edit Entry',
    today: (label as Record<string, string>).today || 'Today',
    thisWeek: (label as Record<string, string>).thisWeek || 'This Week',
    thisMonth: (label as Record<string, string>).thisMonth || 'This Month',
    noEntries: (label as Record<string, string>).noEntries || 'No entries found',
    employeeStatus: (label as Record<string, string>).employeeStatus || 'Employee Status',
    duration: (label as Record<string, string>).duration || 'Duration',
    actions: (label as Record<string, string>).actions || 'Actions',
    delete: (label as Record<string, string>).delete || 'Delete',
    breakTime: (label as Record<string, string>).breakTime || 'Break',
  }

  // ── State ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'live' | 'timesheet'>('live')
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [showManualModal, setShowManualModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null)
  const [clockTick, setClockTick] = useState(0)

  // Manual / edit form
  const [formName, setFormName] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formClockIn, setFormClockIn] = useState('')
  const [formClockOut, setFormClockOut] = useState('')
  const [formNotes, setFormNotes] = useState('')

  // ── Load entries on mount ────────────────────────────────────────────
  useEffect(() => {
    loadEntries(storeId)
  }, [storeId, loadEntries])

  // ── Live clock tick (every 30s) ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setClockTick((p) => p + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  // ── Derived data ─────────────────────────────────────────────────────
  const todayEntries = useMemo(
    () => getTodayEntries(storeId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, storeId, clockTick]
  )

  const presentCount = todayEntries.filter((e) => e.status === 'clocked_in').length
  const onBreakCount = todayEntries.filter((e) => e.status === 'on_break').length
  const absentCount = Math.max(0, todayEntries.length - presentCount - onBreakCount)

  const totalHoursToday = useMemo(() => {
    return todayEntries.reduce((sum, e) => {
      if (e.total_hours) return sum + e.total_hours
      if (e.clock_in) {
        const start = new Date(e.clock_in).getTime()
        const end = e.clock_out ? new Date(e.clock_out).getTime() : Date.now()
        return sum + (end - start) / (1000 * 60 * 60)
      }
      return sum
    }, 0)
  }, [todayEntries, clockTick])

  // Current user's active entry
  const myActiveEntry = useMemo(() => {
    return todayEntries.find(
      (e) => e.user_id === user?.id && e.status !== 'clocked_out'
    ) || null
  }, [todayEntries, user, clockTick])

  const myStatus: ClockStatus | 'not_started' = myActiveEntry
    ? myActiveEntry.status
    : 'not_started'

  const myDuration = useMemo(() => {
    if (!myActiveEntry) return 0
    return Date.now() - new Date(myActiveEntry.clock_in).getTime()
  }, [myActiveEntry, clockTick])

  // Filtered entries for timesheet
  const filteredEntries = useMemo(() => {
    const start = getFilterStart(dateFilter)
    return entries.filter((e) => new Date(e.created_at) >= start)
  }, [entries, dateFilter])

  // ── Actions ──────────────────────────────────────────────────────────
  const handleClockIn = async () => {
    if (!user) return
    await clockIn(storeId, user.id, user.name || user.email)
  }

  const handleClockOut = async () => {
    if (!myActiveEntry) return
    await clockOut(myActiveEntry.id)
  }

  const handleStartBreak = async () => {
    if (!myActiveEntry) return
    await startBreak(myActiveEntry.id)
  }

  const handleEndBreak = async () => {
    if (!myActiveEntry) return
    await endBreak(myActiveEntry.id)
  }

  const openManualModal = () => {
    const now = new Date()
    setFormName('')
    setFormDate(now.toISOString().slice(0, 10))
    setFormClockIn('09:00')
    setFormClockOut('17:00')
    setFormNotes('')
    setShowManualModal(true)
  }

  const openEditModal = (entry: TimeEntry) => {
    setSelectedEntry(entry)
    setFormName(entry.user_name)
    setFormDate(entry.clock_in.slice(0, 10))
    setFormClockIn(new Date(entry.clock_in).toTimeString().slice(0, 5))
    setFormClockOut(
      entry.clock_out
        ? new Date(entry.clock_out).toTimeString().slice(0, 5)
        : ''
    )
    setFormNotes(entry.notes || '')
    setShowEditModal(true)
  }

  const openDeleteModal = (entry: TimeEntry) => {
    setSelectedEntry(entry)
    setShowDeleteModal(true)
  }

  const handleManualSave = async () => {
    if (!formName || !formDate || !formClockIn) return
    const clockInTime = new Date(`${formDate}T${formClockIn}:00`).toISOString()
    const clockOutTime = formClockOut
      ? new Date(`${formDate}T${formClockOut}:00`).toISOString()
      : undefined

    const status: ClockStatus = clockOutTime ? 'clocked_out' : 'clocked_in'
    let totalHrs: number | undefined
    if (clockOutTime) {
      const diffMs =
        new Date(clockOutTime).getTime() - new Date(clockInTime).getTime()
      totalHrs = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
    }

    await addEntry(storeId, {
      user_id: 'manual',
      user_name: formName,
      clock_in: clockInTime,
      clock_out: clockOutTime,
      status,
      total_hours: totalHrs,
      notes: formNotes || undefined,
    })
    setShowManualModal(false)
  }

  const handleEditSave = async () => {
    if (!selectedEntry || !formName || !formDate || !formClockIn) return
    const clockInTime = new Date(`${formDate}T${formClockIn}:00`).toISOString()
    const clockOutTime = formClockOut
      ? new Date(`${formDate}T${formClockOut}:00`).toISOString()
      : undefined

    const status: ClockStatus = clockOutTime ? 'clocked_out' : 'clocked_in'
    let totalHrs: number | undefined
    if (clockOutTime) {
      const diffMs =
        new Date(clockOutTime).getTime() - new Date(clockInTime).getTime()
      totalHrs = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
    }

    await updateEntry(selectedEntry.id, {
      user_name: formName,
      clock_in: clockInTime,
      clock_out: clockOutTime,
      status,
      total_hours: totalHrs,
      notes: formNotes || undefined,
    })
    setShowEditModal(false)
    setSelectedEntry(null)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedEntry) return
    await deleteEntry(selectedEntry.id)
    setShowDeleteModal(false)
    setSelectedEntry(null)
  }

  // ── Status helpers ───────────────────────────────────────────────────
  const statusColor = (s: ClockStatus | 'not_started') => {
    if (s === 'clocked_in') return C.success
    if (s === 'on_break') return C.warning
    if (s === 'clocked_out') return C.textSecondary
    return C.textSecondary
  }

  const statusLabel = (s: ClockStatus | 'not_started') => {
    if (s === 'clocked_in') return L.clockedIn
    if (s === 'on_break') return L.onBreak
    if (s === 'clocked_out') return L.clockedOut
    return L.clockedOut
  }

  const statusBg = (s: ClockStatus | 'not_started') => {
    if (s === 'clocked_in') return C.successLight
    if (s === 'on_break') return C.warningLight
    return '#f1f5f9'
  }

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <Loader2 size={32} style={{ color: C.primary, animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,
          padding: rv('16px 16px', '20px 24px', '24px 32px'),
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: rv(20, 24, 28), fontWeight: 800 }}>{L.title}</h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Present badge */}
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Users size={14} />
              {presentCount} {L.present}
            </div>

            <button
              type="button"
              onClick={openManualModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 10,
                border: '2px solid rgba(255,255,255,0.4)',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
              }}
            >
              <Plus size={16} />
              {L.manualEntry}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: rv('1fr 1fr', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
          gap: rv(10, 14, 16),
          padding: rv('12px 16px', '16px 24px', '20px 32px'),
        }}
      >
        {/* Present */}
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label={L.present}
          value={presentCount}
          color={C.primary}
          bgColor={C.indigoLight}
        />
        {/* On Break */}
        <StatCard
          icon={<Coffee size={20} />}
          label={L.onBreak}
          value={onBreakCount}
          color={C.warning}
          bgColor={C.warningLight}
        />
        {/* Total Hours */}
        <StatCard
          icon={<Timer size={20} />}
          label={L.totalHours}
          value={formatHours(totalHoursToday)}
          color={C.success}
          bgColor={C.successLight}
        />
        {/* Absent / Clocked Out */}
        <StatCard
          icon={<AlertTriangle size={20} />}
          label={L.absent}
          value={absentCount}
          color={C.danger}
          bgColor={C.dangerLight}
        />
      </div>

      {/* ── Clock In/Out Section ───────────────────────────────────────── */}
      <div style={{ padding: rv('0 16px 12px', '0 24px 16px', '0 32px 20px') }}>
        <div
          style={{
            backgroundColor: C.card,
            borderRadius: 16,
            padding: rv(20, 24, 28),
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: C.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 16,
            }}
          >
            {L.yourStatus}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: isMobile ? 'stretch' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: rv(16, 20, 24),
            }}
          >
            {/* Status indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                borderRadius: 12,
                backgroundColor: statusBg(myStatus),
                flex: isMobile ? undefined : 1,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: statusColor(myStatus),
                  boxShadow: myStatus === 'clocked_in'
                    ? `0 0 8px ${C.success}80`
                    : myStatus === 'on_break'
                      ? `0 0 8px ${C.warning}80`
                      : 'none',
                }}
              />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                  {statusLabel(myStatus)}
                </div>
                {myActiveEntry && (
                  <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>
                    {L.working}: {formatDuration(myDuration)}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {myStatus === 'not_started' || myStatus === 'clocked_out' ? (
                <ActionButton
                  label={L.clockIn}
                  icon={<Play size={18} />}
                  color={C.success}
                  onClick={handleClockIn}
                />
              ) : myStatus === 'clocked_in' ? (
                <>
                  <ActionButton
                    label={L.clockOut}
                    icon={<Square size={18} />}
                    color={C.danger}
                    onClick={handleClockOut}
                  />
                  <ActionButton
                    label={L.startBreak}
                    icon={<Coffee size={18} />}
                    color={C.warning}
                    onClick={handleStartBreak}
                  />
                </>
              ) : (
                <>
                  <ActionButton
                    label={L.endBreak}
                    icon={<Coffee size={18} />}
                    color={C.primary}
                    onClick={handleEndBreak}
                  />
                  <ActionButton
                    label={L.clockOut}
                    icon={<Square size={18} />}
                    color={C.danger}
                    onClick={handleClockOut}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Toggle ─────────────────────────────────────────────────── */}
      <div style={{ padding: rv('0 16px', '0 24px', '0 32px') }}>
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: C.card,
            borderRadius: 12,
            padding: 4,
            border: `1px solid ${C.border}`,
            marginBottom: 16,
          }}
        >
          <TabButton
            active={activeTab === 'live'}
            label={L.liveStatus}
            onClick={() => setActiveTab('live')}
          />
          <TabButton
            active={activeTab === 'timesheet'}
            label={L.timesheet}
            onClick={() => setActiveTab('timesheet')}
          />
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────── */}
      <div style={{ padding: rv('0 16px 24px', '0 24px 32px', '0 32px 40px') }}>
        {activeTab === 'live' ? (
          /* ── Live Status ──────────────────────────────────────────── */
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.text,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Users size={18} style={{ color: C.primary }} />
              {L.employeeStatus}
            </div>

            {todayEntries.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 40,
                  color: C.textSecondary,
                  backgroundColor: C.card,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                }}
              >
                <Clock size={40} style={{ color: C.border, marginBottom: 12 }} />
                <div style={{ fontSize: 15 }}>{L.noEntries}</div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: rv('1fr', '1fr 1fr', 'repeat(3, 1fr)'),
                  gap: 12,
                }}
              >
                {todayEntries.map((entry) => (
                  <EmployeeStatusCard key={entry.id} entry={entry} L={L} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Timesheet ───────────────────────────────────────────── */
          <div>
            {/* Filter bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              <Filter size={16} style={{ color: C.textSecondary }} />
              {(
                [
                  { key: 'today', label: L.today },
                  { key: 'week', label: L.thisWeek },
                  { key: 'month', label: L.thisMonth },
                ] as const
              ).map(({ key, label: filterLabel }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDateFilter(key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: `1px solid ${dateFilter === key ? C.primary : C.border}`,
                    backgroundColor: dateFilter === key ? C.indigoLight : C.card,
                    color: dateFilter === key ? C.primary : C.textSecondary,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {filterLabel}
                </button>
              ))}
            </div>

            {filteredEntries.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 40,
                  color: C.textSecondary,
                  backgroundColor: C.card,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                }}
              >
                <Calendar size={40} style={{ color: C.border, marginBottom: 12 }} />
                <div style={{ fontSize: 15 }}>{L.noEntries}</div>
              </div>
            ) : isMobile ? (
              /* Mobile: card list */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredEntries.map((entry) => (
                  <TimesheetCard
                    key={entry.id}
                    entry={entry}
                    L={L}
                    onEdit={() => openEditModal(entry)}
                    onDelete={() => openDeleteModal(entry)}
                  />
                ))}
              </div>
            ) : (
              /* Desktop: table */
              <div
                style={{
                  backgroundColor: C.card,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  overflow: 'hidden',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: `2px solid ${C.border}`,
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        {[L.employeeName, L.date, L.clockIn, L.clockOut, L.breakTime, L.totalHours, L.actions].map(
                          (header) => (
                            <th
                              key={header}
                              style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: 12,
                                fontWeight: 700,
                                color: C.textSecondary,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              {header}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry, idx) => (
                        <tr
                          key={entry.id}
                          style={{
                            borderBottom:
                              idx < filteredEntries.length - 1
                                ? `1px solid ${C.border}`
                                : 'none',
                            transition: 'background-color 0.1s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: C.text }}>
                            {entry.user_name}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: C.textSecondary }}>
                            {new Date(entry.clock_in).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>
                            {new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>
                            {entry.clock_out
                              ? new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: C.textSecondary }}>
                            {entry.break_start && entry.break_end
                              ? formatDuration(
                                  new Date(entry.break_end).getTime() -
                                    new Date(entry.break_start).getTime()
                                )
                              : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.primary }}>
                            {entry.total_hours ? formatHours(entry.total_hours) : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => openEditModal(entry)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: `1px solid ${C.border}`,
                                  backgroundColor: 'transparent',
                                  color: C.primary,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = C.indigoLight
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteModal(entry)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: `1px solid ${C.border}`,
                                  backgroundColor: 'transparent',
                                  color: C.danger,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = C.dangerLight
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Manual Entry Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        title={L.manualEntry}
        size="md"
      >
        <EntryForm
          formName={formName}
          setFormName={setFormName}
          formDate={formDate}
          setFormDate={setFormDate}
          formClockIn={formClockIn}
          setFormClockIn={setFormClockIn}
          formClockOut={formClockOut}
          setFormClockOut={setFormClockOut}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          onSave={handleManualSave}
          onCancel={() => setShowManualModal(false)}
          L={L}
        />
      </Modal>

      {/* ── Edit Entry Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={L.editEntry}
        size="md"
      >
        <EntryForm
          formName={formName}
          setFormName={setFormName}
          formDate={formDate}
          setFormDate={setFormDate}
          formClockIn={formClockIn}
          setFormClockIn={setFormClockIn}
          formClockOut={formClockOut}
          setFormClockOut={setFormClockOut}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          onSave={handleEditSave}
          onCancel={() => setShowEditModal(false)}
          L={L}
        />
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={L.deleteTitle}
        size="sm"
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              backgroundColor: C.dangerLight,
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <AlertTriangle size={24} style={{ color: C.danger, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.5 }}>
              {L.deleteConfirm}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                backgroundColor: C.card,
                color: C.textSecondary,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {L.cancel}
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: C.danger,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  bgColor: string
}) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  label,
  icon,
  color,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  color: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 24px',
        borderRadius: 12,
        border: 'none',
        backgroundColor: color,
        color: '#fff',
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: `0 2px 8px ${color}40`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = `0 4px 12px ${color}50`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = `0 2px 8px ${color}40`
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 20px',
        borderRadius: 8,
        border: 'none',
        backgroundColor: active ? C.primary : 'transparent',
        color: active ? '#fff' : C.textSecondary,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function EmployeeStatusCard({
  entry,
  L,
}: {
  entry: TimeEntry
  L: Record<string, string>
}) {
  const statusCol =
    entry.status === 'clocked_in'
      ? C.success
      : entry.status === 'on_break'
        ? C.warning
        : C.textSecondary

  const statusLbl =
    entry.status === 'clocked_in'
      ? L.clockedIn
      : entry.status === 'on_break'
        ? L.onBreak
        : L.clockedOut

  const elapsed =
    entry.status !== 'clocked_out'
      ? Date.now() - new Date(entry.clock_in).getTime()
      : 0

  return (
    <div
      style={{
        backgroundColor: C.card,
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: C.indigoLight,
          color: C.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {entry.user_name.charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.user_name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: statusCol,
              boxShadow:
                entry.status === 'clocked_in'
                  ? `0 0 6px ${C.success}80`
                  : entry.status === 'on_break'
                    ? `0 0 6px ${C.warning}80`
                    : 'none',
            }}
          />
          <span style={{ fontSize: 12, color: statusCol, fontWeight: 600 }}>
            {statusLbl}
          </span>
        </div>
      </div>

      {elapsed > 0 && (
        <div style={{ fontSize: 13, fontWeight: 600, color: C.primary, flexShrink: 0 }}>
          {formatDuration(elapsed)}
        </div>
      )}
    </div>
  )
}

function TimesheetCard({
  entry,
  L,
  onEdit,
  onDelete,
}: {
  entry: TimeEntry
  L: Record<string, string>
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      style={{
        backgroundColor: C.card,
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{entry.user_name}</div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
            {new Date(entry.clock_in).toLocaleDateString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={onEdit}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              backgroundColor: 'transparent',
              color: C.primary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              backgroundColor: 'transparent',
              color: C.danger,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          fontSize: 13,
        }}
      >
        <div>
          <span style={{ color: C.textSecondary }}>{L.clockIn}: </span>
          <span style={{ fontWeight: 600, color: C.text }}>
            {new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div>
          <span style={{ color: C.textSecondary }}>{L.clockOut}: </span>
          <span style={{ fontWeight: 600, color: C.text }}>
            {entry.clock_out
              ? new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </span>
        </div>
        <div>
          <span style={{ color: C.textSecondary }}>{L.breakTime}: </span>
          <span style={{ fontWeight: 600, color: C.text }}>
            {entry.break_start && entry.break_end
              ? formatDuration(new Date(entry.break_end).getTime() - new Date(entry.break_start).getTime())
              : '—'}
          </span>
        </div>
        <div>
          <span style={{ color: C.textSecondary }}>{L.totalHours}: </span>
          <span style={{ fontWeight: 600, color: C.primary }}>
            {entry.total_hours ? formatHours(entry.total_hours) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

function EntryForm({
  formName,
  setFormName,
  formDate,
  setFormDate,
  formClockIn,
  setFormClockIn,
  formClockOut,
  setFormClockOut,
  formNotes,
  setFormNotes,
  onSave,
  onCancel,
  L,
}: {
  formName: string
  setFormName: (v: string) => void
  formDate: string
  setFormDate: (v: string) => void
  formClockIn: string
  setFormClockIn: (v: string) => void
  formClockOut: string
  setFormClockOut: (v: string) => void
  formNotes: string
  setFormNotes: (v: string) => void
  onSave: () => void
  onCancel: () => void
  L: Record<string, string>
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    backgroundColor: '#f8fafc',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: C.textSecondary,
    marginBottom: 6,
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave()
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>{L.employeeName}</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            style={inputStyle}
            required
            placeholder="John Doe"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        <div>
          <label style={labelStyle}>{L.date}</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            style={inputStyle}
            required
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>{L.clockIn}</label>
            <input
              type="time"
              value={formClockIn}
              onChange={(e) => setFormClockIn(e.target.value)}
              style={inputStyle}
              required
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>{L.clockOut}</label>
            <input
              type="time"
              value={formClockOut}
              onChange={(e) => setFormClockOut(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{L.notes}</label>
          <textarea
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            style={{
              ...inputStyle,
              minHeight: 80,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
            placeholder="Optional notes..."
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            backgroundColor: C.card,
            color: C.textSecondary,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {L.cancel}
        </button>
        <button
          type="submit"
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: C.primary,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: `0 2px 8px ${C.primary}40`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = C.primaryDark
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = C.primary
          }}
        >
          {L.save}
        </button>
      </div>
    </form>
  )
}
