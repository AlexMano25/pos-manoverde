import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Printer,
  Clock,
  Save,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useScheduleStore, type Shift, type ShiftRole } from '../stores/scheduleStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { db } from '../db/dexie'
import type { User } from '../types'

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
} as const

const ROLE_COLORS: Record<ShiftRole, { bg: string; text: string; border: string }> = {
  admin:   { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  manager: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  cashier: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  stock:   { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
}

const ROLE_LABELS: Record<ShiftRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  cashier: 'Cashier',
  stock: 'Stock',
}

// ── Date helpers ─────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

function shiftHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff < 0) diff += 24 * 60 // overnight shift
  return diff / 60
}

function formatWeekOf(monday: Date, lang: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  return monday.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', opts)
}

const DAY_NAMES_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ── Component ────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { currentStore } = useAppStore()
  const { t, language } = useLanguageStore()
  const { shifts, addShift, updateShift, deleteShift } = useScheduleStore()
  const { isMobile } = useResponsive()

  const storeId = currentStore?.id || ''
  const dayNames = language === 'fr' ? DAY_NAMES_FR : DAY_NAMES_EN

  // ── Week navigation ──────────────────────────────────────────────────

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])

  const prevWeek = useCallback(() => setWeekStart(prev => addDays(prev, -7)), [])
  const nextWeek = useCallback(() => setWeekStart(prev => addDays(prev, 7)), [])
  const goToday = useCallback(() => setWeekStart(getMonday(new Date())), [])

  // ── Employees ────────────────────────────────────────────────────────

  const [employees, setEmployees] = useState<User[]>([])

  useEffect(() => {
    if (!storeId) return
    db.users
      .where('store_id')
      .equals(storeId)
      .toArray()
      .then(users => setEmployees(users.filter(u => u.is_active)))
      .catch(() => setEmployees([]))
  }, [storeId])

  // ── Week shifts (filtered) ───────────────────────────────────────────

  const weekShifts = useMemo(() => {
    const start = formatDate(weekStart)
    const end = formatDate(addDays(weekStart, 6))
    return shifts.filter(s => s.store_id === storeId && s.date >= start && s.date <= end)
  }, [shifts, weekStart, storeId])

  // ── Modal state ──────────────────────────────────────────────────────

  const [modalOpen, setModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [form, setForm] = useState({
    employee_id: '',
    employee_name: '',
    date: '',
    start_time: '08:00',
    end_time: '17:00',
    role: 'cashier' as ShiftRole,
    notes: '',
  })

  const openAdd = (empId: string, empName: string, date: string) => {
    setEditingShift(null)
    setForm({ employee_id: empId, employee_name: empName, date, start_time: '08:00', end_time: '17:00', role: 'cashier', notes: '' })
    setModalOpen(true)
  }

  const openEdit = (shift: Shift) => {
    setEditingShift(shift)
    setForm({
      employee_id: shift.employee_id,
      employee_name: shift.employee_name,
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      role: shift.role,
      notes: shift.notes,
    })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.employee_id || !form.date || !form.start_time || !form.end_time) return
    if (editingShift) {
      updateShift(editingShift.id, {
        start_time: form.start_time,
        end_time: form.end_time,
        role: form.role,
        notes: form.notes,
      })
    } else {
      addShift({
        employee_id: form.employee_id,
        employee_name: form.employee_name,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        role: form.role,
        store_id: storeId,
        notes: form.notes,
      })
    }
    setModalOpen(false)
  }

  const handleDelete = () => {
    if (editingShift) {
      deleteShift(editingShift.id)
      setModalOpen(false)
    }
  }

  // ── Print ────────────────────────────────────────────────────────────

  const tableRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  // ── Total hours per employee ─────────────────────────────────────────

  const employeeTotals = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of weekShifts) {
      map[s.employee_id] = (map[s.employee_id] || 0) + shiftHours(s.start_time, s.end_time)
    }
    return map
  }, [weekShifts])

  // ── Render ───────────────────────────────────────────────────────────

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  }

  const navBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.card,
    cursor: 'pointer',
    color: C.text,
  }

  const todayBtnStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 8,
    border: `1px solid ${C.primary}`,
    background: 'transparent',
    color: C.primary,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  }

  const printBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: C.primary,
    color: '#fff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    background: C.card,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  }

  const thStyle: React.CSSProperties = {
    padding: isMobile ? '8px 4px' : '10px 12px',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: isMobile ? 11 : 13,
    color: C.textSecondary,
    borderBottom: `2px solid ${C.border}`,
    background: '#f8fafc',
    whiteSpace: 'nowrap',
  }

  const thNameStyle: React.CSSProperties = {
    ...thStyle,
    textAlign: 'left',
    minWidth: isMobile ? 80 : 140,
  }

  const thTotalStyle: React.CSSProperties = {
    ...thStyle,
    minWidth: isMobile ? 50 : 70,
  }

  const tdStyle: React.CSSProperties = {
    padding: isMobile ? '4px 2px' : '6px 8px',
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: 'top',
    minHeight: 48,
  }

  const tdNameStyle: React.CSSProperties = {
    ...tdStyle,
    fontWeight: 600,
    fontSize: isMobile ? 12 : 14,
    color: C.text,
    whiteSpace: 'nowrap',
  }

  const cellBtn: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 40,
    border: `1px dashed ${C.border}`,
    borderRadius: 6,
    background: 'transparent',
    cursor: 'pointer',
    color: C.textSecondary,
    fontSize: 14,
    transition: 'background 0.15s',
  }

  const shiftChipStyle = (role: ShiftRole): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: isMobile ? '4px 6px' : '6px 10px',
    borderRadius: 8,
    background: ROLE_COLORS[role].bg,
    border: `1px solid ${ROLE_COLORS[role].border}`,
    color: ROLE_COLORS[role].text,
    fontSize: isMobile ? 10 : 12,
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: 0,
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: C.textSecondary,
    marginBottom: 4,
    display: 'block',
  }

  const fieldGroup: React.CSSProperties = {
    marginBottom: 14,
  }

  return (
    <div style={{ padding: isMobile ? 12 : 24, background: C.bg, minHeight: '100%' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={headerStyle} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={22} color={C.primary} />
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, color: C.text }}>
            {(t as any).schedule?.title || 'Planning'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button style={navBtnStyle} onClick={prevWeek} title="Previous week">
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: C.text, minWidth: 120, textAlign: 'center' }}>
            {(t as any).schedule?.weekOf || 'Semaine du'} {formatWeekOf(weekStart, language)}
          </span>
          <button style={navBtnStyle} onClick={nextWeek} title="Next week">
            <ChevronRight size={18} />
          </button>
          <button style={todayBtnStyle} onClick={goToday}>
            {language === 'fr' ? "Aujourd'hui" : 'Today'}
          </button>
          <button style={printBtnStyle} onClick={handlePrint}>
            <Printer size={15} />
            {(t as any).schedule?.print || 'Imprimer'}
          </button>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }} className="no-print">
        {(Object.keys(ROLE_COLORS) as ShiftRole[]).map(role => (
          <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: ROLE_COLORS[role].bg, border: `1px solid ${ROLE_COLORS[role].border}` }} />
            <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>{ROLE_LABELS[role]}</span>
          </div>
        ))}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div ref={tableRef} style={{ overflowX: 'auto' }}>
        {employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.textSecondary, fontSize: 15 }}>
            {(t as any).schedule?.noShift || 'Aucun employe'}
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thNameStyle}>{language === 'fr' ? 'Employe' : 'Employee'}</th>
                {weekDays.map((d, i) => {
                  const isToday = formatDate(d) === formatDate(new Date())
                  return (
                    <th key={i} style={{ ...thStyle, background: isToday ? '#eef2ff' : '#f8fafc' }}>
                      {dayNames[i]}
                      <br />
                      <span style={{ fontWeight: 400, fontSize: isMobile ? 10 : 11 }}>
                        {d.getDate()}/{d.getMonth() + 1}
                      </span>
                    </th>
                  )
                })}
                <th style={thTotalStyle}>
                  <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {(t as any).schedule?.totalHours || 'Total'}
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const total = employeeTotals[emp.id] || 0
                return (
                  <tr key={emp.id}>
                    <td style={tdNameStyle}>{emp.name}</td>
                    {weekDays.map((d, i) => {
                      const dateStr = formatDate(d)
                      const dayShifts = weekShifts.filter(
                        s => s.employee_id === emp.id && s.date === dateStr
                      )
                      const isToday = dateStr === formatDate(new Date())
                      return (
                        <td key={i} style={{ ...tdStyle, background: isToday ? '#f5f7ff' : undefined }}>
                          {dayShifts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {dayShifts.map(s => (
                                <div
                                  key={s.id}
                                  style={shiftChipStyle(s.role)}
                                  onClick={() => openEdit(s)}
                                  title={s.notes || undefined}
                                >
                                  <span>{s.start_time} - {s.end_time}</span>
                                  <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 500, opacity: 0.8 }}>
                                    {ROLE_LABELS[s.role]}
                                  </span>
                                </div>
                              ))}
                              <button
                                style={{ ...cellBtn, minHeight: 24, border: 'none', fontSize: 12 }}
                                onClick={() => openAdd(emp.id, emp.name, dateStr)}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              style={cellBtn}
                              onClick={() => openAdd(emp.id, emp.name, dateStr)}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </td>
                      )
                    })}
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, fontSize: isMobile ? 12 : 14, color: total > 40 ? C.danger : C.text }}>
                      {total.toFixed(1)}h
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Shift Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingShift ? ((t as any).schedule?.editShift || 'Modifier') : ((t as any).schedule?.addShift || 'Ajouter')}
        size="sm"
      >
        <div>
          {/* Employee name (read-only) */}
          <div style={fieldGroup}>
            <label style={labelStyle}>{language === 'fr' ? 'Employe' : 'Employee'}</label>
            <input style={{ ...inputStyle, background: '#f1f5f9' }} value={form.employee_name} disabled />
          </div>

          {/* Date (read-only) */}
          <div style={fieldGroup}>
            <label style={labelStyle}>{language === 'fr' ? 'Date' : 'Date'}</label>
            <input style={{ ...inputStyle, background: '#f1f5f9' }} value={form.date} disabled />
          </div>

          {/* Start time */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...fieldGroup, flex: 1 }}>
              <label style={labelStyle}>{(t as any).schedule?.startTime || 'Debut'}</label>
              <input
                type="time"
                style={inputStyle}
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
              />
            </div>
            <div style={{ ...fieldGroup, flex: 1 }}>
              <label style={labelStyle}>{(t as any).schedule?.endTime || 'Fin'}</label>
              <input
                type="time"
                style={inputStyle}
                value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
              />
            </div>
          </div>

          {/* Role */}
          <div style={fieldGroup}>
            <label style={labelStyle}>{language === 'fr' ? 'Role / Poste' : 'Role / Position'}</label>
            <select
              style={inputStyle}
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as ShiftRole }))}
            >
              {(Object.keys(ROLE_COLORS) as ShiftRole[]).map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div style={fieldGroup}>
            <label style={labelStyle}>{(t as any).schedule?.notes || 'Notes'}</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder={language === 'fr' ? 'Notes optionnelles...' : 'Optional notes...'}
            />
          </div>

          {/* Hours preview */}
          {form.start_time && form.end_time && (
            <div style={{ marginBottom: 14, fontSize: 13, color: C.textSecondary }}>
              <Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {shiftHours(form.start_time, form.end_time).toFixed(1)}h
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            {editingShift && (
              <button
                style={{ ...printBtnStyle, background: C.danger }}
                onClick={handleDelete}
              >
                <Trash2 size={14} />
                {t.common?.delete || 'Supprimer'}
              </button>
            )}
            <button
              style={{ ...printBtnStyle, background: '#94a3b8' }}
              onClick={() => setModalOpen(false)}
            >
              {t.common?.cancel || 'Annuler'}
            </button>
            <button
              style={printBtnStyle}
              onClick={handleSave}
            >
              <Save size={14} />
              {t.common?.save || 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Print styles ───────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          table { font-size: 11px !important; }
        }
      `}</style>
    </div>
  )
}
