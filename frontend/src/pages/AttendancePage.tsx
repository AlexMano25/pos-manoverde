import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Calendar,
  Check,
  X,
  Clock,
  AlertCircle,
  Users,
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  BookOpen,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useSchoolStore } from '../stores/schoolStore'
import { useResponsive } from '../hooks/useLayoutMode'
import type { AttendanceStatus } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  primaryDark: '#1d4ed8',
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
  info: '#2563eb',
  infoBg: '#dbeafe',
} as const

// ── Status config ────────────────────────────────────────────────────────

const ATTENDANCE_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  present: { label: 'Present', icon: <Check size={16} />,      color: C.success, bg: C.successBg },
  absent:  { label: 'Absent',  icon: <X size={16} />,          color: C.danger,  bg: C.dangerBg },
  late:    { label: 'Late',    icon: <Clock size={16} />,       color: C.warning, bg: C.warningBg },
  excused: { label: 'Excused', icon: <AlertCircle size={16} />, color: C.info,    bg: C.infoBg },
}

// ── Local state type ────────────────────────────────────────────────────

interface StudentAttendanceRow {
  student_id: string
  student_name: string
  status: AttendanceStatus
  existingRecordId?: string
}

// ══════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════

export default function AttendancePage() {
  const { currentStore } = useAppStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  const {
    students, classes, attendanceRecords, loading,
    loadStudents, loadClasses, loadAttendance,
    bulkRecordAttendance, updateAttendanceStatus,
  } = useSchoolStore()

  const storeId = currentStore?.id || 'default-store'

  // ── Local state ────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedClassId, setSelectedClassId] = useState('')
  const [rows, setRows] = useState<StudentAttendanceRow[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // ── Labels ─────────────────────────────────────────────────────────────
  const L = useMemo(() => ({
    title:          (t as any).school?.attendance || 'Attendance',
    date:           (t as any).school?.date || 'Date',
    class:          (t as any).school?.class || 'Class',
    selectClass:    (t as any).school?.selectClass || 'Select a class',
    student:        (t as any).school?.student || 'Student',
    status:         (t as any).school?.status || 'Status',
    present:        (t as any).school?.present || 'Present',
    absent:         (t as any).school?.absent || 'Absent',
    late:           (t as any).school?.late || 'Late',
    excused:        (t as any).school?.excused || 'Excused',
    markAllPresent: (t as any).school?.markAllPresent || 'Mark All Present',
    markAllAbsent:  (t as any).school?.markAllAbsent || 'Mark All Absent',
    save:           (t as any).common?.save || 'Save',
    saved:          (t as any).school?.saved || 'Saved!',
    saving:         (t as any).school?.saving || 'Saving...',
    saveAttendance: (t as any).school?.saveAttendance || 'Save Attendance',
    presentCount:   (t as any).school?.presentCount || 'Present',
    absentCount:    (t as any).school?.absentCount || 'Absent',
    lateCount:      (t as any).school?.lateCount || 'Late',
    attendanceRate: (t as any).school?.attendanceRate || 'Attendance Rate',
    noStudents:     (t as any).school?.noStudentsInClass || 'No students in this class',
    noClassSelected:(t as any).school?.noClassSelected || 'Please select a class to take attendance',
  }), [t])

  // ── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadStudents(storeId)
    loadClasses(storeId)
  }, [storeId, loadStudents, loadClasses])

  // Auto-select first class if not selected
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id)
    }
  }, [classes, selectedClassId])

  // Load attendance for date + class & build rows
  useEffect(() => {
    if (!selectedClassId) return
    loadAttendance(storeId, selectedDate, selectedClassId)
  }, [storeId, selectedDate, selectedClassId, loadAttendance])

  // Build rows from students + existing attendance
  useEffect(() => {
    if (!selectedClassId) { setRows([]); return }

    const classStudents = students.filter(s => s.class_id === selectedClassId && s.status === 'active')
    const newRows: StudentAttendanceRow[] = classStudents.map(s => {
      const existing = attendanceRecords.find(
        r => r.student_id === s.id && r.date === selectedDate && r.class_id === selectedClassId
      )
      return {
        student_id: s.id,
        student_name: `${s.first_name} ${s.last_name}`,
        status: existing?.status || 'present',
        existingRecordId: existing?.id,
      }
    })
    newRows.sort((a, b) => a.student_name.localeCompare(b.student_name))
    setRows(newRows)
    setSaved(false)
  }, [students, attendanceRecords, selectedClassId, selectedDate])

  // ── Stats ──────────────────────────────────────────────────────────────
  const dailyStats = useMemo(() => {
    const total = rows.length
    const present = rows.filter(r => r.status === 'present').length
    const absent = rows.filter(r => r.status === 'absent').length
    const late = rows.filter(r => r.status === 'late').length
    const excused = rows.filter(r => r.status === 'excused').length
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0
    return { total, present, absent, late, excused, rate }
  }, [rows])

  // ── Actions ────────────────────────────────────────────────────────────
  const setStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setRows(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r))
    setSaved(false)
  }, [])

  const markAll = useCallback((status: AttendanceStatus) => {
    setRows(prev => prev.map(r => ({ ...r, status })))
    setSaved(false)
  }, [])

  const handleSave = useCallback(async () => {
    if (rows.length === 0) return
    setSaving(true)
    try {
      const selectedClass = classes.find(c => c.id === selectedClassId)
      const className = selectedClass?.name || ''

      // For existing records, update them individually
      const toUpdate = rows.filter(r => r.existingRecordId)
      for (const r of toUpdate) {
        await updateAttendanceStatus(r.existingRecordId!, r.status)
      }

      // For new records, bulk create
      const toCreate = rows.filter(r => !r.existingRecordId)
      if (toCreate.length > 0) {
        await bulkRecordAttendance(toCreate.map(r => ({
          store_id: storeId,
          student_id: r.student_id,
          student_name: r.student_name,
          class_id: selectedClassId,
          class_name: className,
          date: selectedDate,
          status: r.status,
          recorded_by: user?.name || user?.email || 'admin',
        })))
      }

      setSaved(true)
      // Reload to refresh existing record IDs
      await loadAttendance(storeId, selectedDate, selectedClassId)
    } finally {
      setSaving(false)
    }
  }, [rows, classes, selectedClassId, selectedDate, storeId, user, bulkRecordAttendance, updateAttendanceStatus, loadAttendance])

  // ── Shared styles ─────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    outline: 'none',
    color: C.text,
    backgroundColor: C.card,
    boxSizing: 'border-box',
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: C.primary,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  }

  const btnSecondary: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: C.textSecondary,
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    cursor: 'pointer',
  }

  // ── Loading screen ────────────────────────────────────────────────────
  if (loading && students.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: rv(12, 20, 24), backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={28} color={C.primary} />
          <h1 style={{ margin: 0, fontSize: rv(20, 24, 26), fontWeight: 700, color: C.text }}>
            {L.title}
          </h1>
        </div>
      </div>

      {/* ── Controls: Date + Class selector ──────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20,
        backgroundColor: C.card, padding: 16, borderRadius: 12, border: `1px solid ${C.border}`,
      }}>
        <div style={{ flex: '0 0 auto' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 4 }}>
            {L.date}
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ ...inputStyle, width: rv(160, 180, 200) }}
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 4 }}>
            {L.class}
          </label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            style={{ ...inputStyle, maxWidth: 300 }}
          >
            <option value="">{L.selectClass}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {/* Bulk actions */}
        {selectedClassId && rows.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button style={{ ...btnSecondary, color: C.success, borderColor: C.success }} onClick={() => markAll('present')}>
              <CheckCircle2 size={16} /> {L.markAllPresent}
            </button>
            <button style={{ ...btnSecondary, color: C.danger, borderColor: C.danger }} onClick={() => markAll('absent')}>
              <XCircle size={16} /> {L.markAllAbsent}
            </button>
          </div>
        )}
      </div>

      {/* ── Daily summary ────────────────────────────────────────────────── */}
      {selectedClassId && rows.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(4, 1fr)', 'repeat(5, 1fr)'),
          gap: rv(8, 12, 16),
          marginBottom: 20,
        }}>
          {[
            { label: L.presentCount, value: dailyStats.present, color: C.success, bg: C.successBg, icon: <UserCheck size={18} /> },
            { label: L.absentCount,  value: dailyStats.absent,  color: C.danger,  bg: C.dangerBg,  icon: <UserX size={18} /> },
            { label: L.lateCount,    value: dailyStats.late,    color: C.warning, bg: C.warningBg, icon: <Clock size={18} /> },
            { label: L.excused,      value: dailyStats.excused, color: C.info,    bg: C.infoBg,    icon: <AlertCircle size={18} /> },
            { label: L.attendanceRate, value: `${dailyStats.rate}%`, color: C.primary, bg: C.primaryLight, icon: <Users size={18} /> },
          ].map((card, i) => (
            <div key={i} style={{
              backgroundColor: C.card, borderRadius: 12, padding: rv(10, 14, 14),
              border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, backgroundColor: card.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0,
              }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.textSecondary }}>{card.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Attendance grid ──────────────────────────────────────────────── */}
      {!selectedClassId ? (
        <div style={{
          textAlign: 'center', padding: 40, color: C.textSecondary,
          backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
        }}>
          <BookOpen size={40} color={C.border} style={{ marginBottom: 8 }} />
          <div>{L.noClassSelected}</div>
        </div>
      ) : rows.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 40, color: C.textSecondary,
          backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
        }}>
          <Users size={40} color={C.border} style={{ marginBottom: 8 }} />
          <div>{L.noStudents}</div>
        </div>
      ) : (
        <>
          {/* Table / card layout */}
          {isMobile ? (
            /* Mobile: card layout */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {rows.map(row => (
                <div key={row.student_id} style={{
                  backgroundColor: C.card, borderRadius: 12, padding: 14,
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>
                    {row.student_name}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(Object.keys(ATTENDANCE_CONFIG) as AttendanceStatus[]).map(status => {
                      const cfg = ATTENDANCE_CONFIG[status]
                      const isActive = row.status === status
                      return (
                        <button
                          key={status}
                          onClick={() => setStatus(row.student_id, status)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            padding: '8px 4px',
                            fontSize: 11,
                            fontWeight: 600,
                            border: `2px solid ${isActive ? cfg.color : C.border}`,
                            borderRadius: 8,
                            backgroundColor: isActive ? cfg.bg : 'transparent',
                            color: isActive ? cfg.color : C.textSecondary,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {cfg.icon}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop / tablet: table layout */
            <div style={{
              backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
              overflow: 'hidden', marginBottom: 20,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: C.bg }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.textSecondary }}>
                      #
                    </th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.textSecondary }}>
                      {L.student}
                    </th>
                    <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.textSecondary }}>
                      {L.status}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.student_id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: C.textSecondary }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 500, color: C.text }}>
                        {row.student_name}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          {(Object.keys(ATTENDANCE_CONFIG) as AttendanceStatus[]).map(status => {
                            const cfg = ATTENDANCE_CONFIG[status]
                            const isActive = row.status === status
                            return (
                              <button
                                key={status}
                                onClick={() => setStatus(row.student_id, status)}
                                title={cfg.label}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '6px 12px',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: `2px solid ${isActive ? cfg.color : C.border}`,
                                  borderRadius: 8,
                                  backgroundColor: isActive ? cfg.bg : 'transparent',
                                  color: isActive ? cfg.color : C.textSecondary,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {cfg.icon}
                                <span>{cfg.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            {saved && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: C.success, fontSize: 14, fontWeight: 600,
              }}>
                <CheckCircle2 size={18} /> {L.saved}
              </div>
            )}
            <button
              style={{
                ...btnPrimary,
                padding: '10px 24px',
                fontSize: 15,
                opacity: saving ? 0.7 : 1,
              }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Save size={18} />
              )}
              {saving ? L.saving : L.saveAttendance}
            </button>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
