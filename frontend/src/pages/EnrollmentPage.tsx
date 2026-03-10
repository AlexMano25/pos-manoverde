import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  UserCheck,
  Loader2,
  GraduationCap,
  BookOpen,
  X,
  Save,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useSchoolStore } from '../stores/schoolStore'
import { useResponsive } from '../hooks/useLayoutMode'
import type { Student, SchoolClass, StudentStatus } from '../types'

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
  infoBg: '#dbeafe',
  info: '#2563eb',
  purple: '#7c3aed',
  purpleBg: '#ede9fe',
} as const

// ── Status config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StudentStatus, { label: string; color: string; bg: string }> = {
  enrolled:   { label: 'Enrolled',   color: C.info,    bg: C.infoBg },
  active:     { label: 'Active',     color: C.success, bg: C.successBg },
  suspended:  { label: 'Suspended',  color: C.warning, bg: C.warningBg },
  graduated:  { label: 'Graduated',  color: C.purple,  bg: C.purpleBg },
  withdrawn:  { label: 'Withdrawn',  color: C.danger,  bg: C.dangerBg },
}

// ── Tabs ─────────────────────────────────────────────────────────────────

type ViewTab = 'students' | 'classes'

// ── Form interfaces ─────────────────────────────────────────────────────

interface StudentForm {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other' | ''
  class_id: string
  parent_name: string
  parent_phone: string
  parent_email: string
  address: string
  medical_notes: string
  status: StudentStatus
}

const emptyStudentForm: StudentForm = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  class_id: '',
  parent_name: '',
  parent_phone: '',
  parent_email: '',
  address: '',
  medical_notes: '',
  status: 'active',
}

interface ClassForm {
  name: string
  level: string
  academic_year: string
  teacher_name: string
  capacity: string
}

const emptyClassForm: ClassForm = {
  name: '',
  level: '',
  academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  teacher_name: '',
  capacity: '30',
}

// ── Helper ──────────────────────────────────────────────────────────────

function getInitials(first: string, last: string): string {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase()
}

function generateStudentNumber(existing: Student[]): string {
  const year = new Date().getFullYear()
  const prefix = `STU-${year}-`
  const existingNums = existing
    .filter(s => s.student_number.startsWith(prefix))
    .map(s => parseInt(s.student_number.replace(prefix, ''), 10))
    .filter(n => !isNaN(n))
  const next = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

// ══════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════

export default function EnrollmentPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { rv } = useResponsive()

  const {
    students, classes, loading,
    loadStudents, loadClasses,
    createStudent, updateStudent, deleteStudent,
    createClass, updateClass, deleteClass,
  } = useSchoolStore()

  const storeId = currentStore?.id || 'default-store'

  // ── Local state ────────────────────────────────────────────────────────
  const [viewTab, setViewTab] = useState<ViewTab>('students')
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState<StudentStatus | ''>('')

  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [studentForm, setStudentForm] = useState<StudentForm>(emptyStudentForm)
  const [saving, setSaving] = useState(false)

  const [showClassModal, setShowClassModal] = useState(false)
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null)
  const [classForm, setClassForm] = useState<ClassForm>(emptyClassForm)

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // ── Labels ─────────────────────────────────────────────────────────────
  const L = useMemo(() => ({
    title:          (t as any).school?.enrollment || 'Enrollment',
    students:       (t as any).school?.students || 'Students',
    classes:        (t as any).school?.classes || 'Classes',
    addStudent:     (t as any).school?.addStudent || 'Add Student',
    editStudent:    (t as any).school?.editStudent || 'Edit Student',
    addClass:       (t as any).school?.addClass || 'Add Class',
    editClass:      (t as any).school?.editClass || 'Edit Class',
    search:         (t as any).common?.search || 'Search...',
    save:           (t as any).common?.save || 'Save',
    cancel:         (t as any).common?.cancel || 'Cancel',
    delete:         (t as any).common?.delete || 'Delete',
    confirm:        (t as any).common?.confirm || 'Confirm',
    firstName:      (t as any).school?.firstName || 'First Name',
    lastName:       (t as any).school?.lastName || 'Last Name',
    dateOfBirth:    (t as any).school?.dateOfBirth || 'Date of Birth',
    gender:         (t as any).school?.gender || 'Gender',
    male:           (t as any).school?.male || 'Male',
    female:         (t as any).school?.female || 'Female',
    other:          (t as any).school?.other || 'Other',
    class:          (t as any).school?.class || 'Class',
    parentName:     (t as any).school?.parentName || 'Parent Name',
    parentPhone:    (t as any).school?.parentPhone || 'Parent Phone',
    parentEmail:    (t as any).school?.parentEmail || 'Parent Email',
    address:        (t as any).school?.address || 'Address',
    medicalNotes:   (t as any).school?.medicalNotes || 'Medical Notes',
    status:         (t as any).school?.status || 'Status',
    className:      (t as any).school?.className || 'Class Name',
    level:          (t as any).school?.level || 'Level',
    academicYear:   (t as any).school?.academicYear || 'Academic Year',
    teacher:        (t as any).school?.teacher || 'Teacher',
    capacity:       (t as any).school?.capacity || 'Capacity',
    totalEnrolled:  (t as any).school?.totalEnrolled || 'Total Enrolled',
    activeStudents: (t as any).school?.activeStudents || 'Active',
    byClass:        (t as any).school?.byClass || 'By Class',
    genderBreakdown:(t as any).school?.genderBreakdown || 'Gender',
    allClasses:     (t as any).school?.allClasses || 'All Classes',
    allStatuses:    (t as any).school?.allStatuses || 'All Statuses',
    noStudents:     (t as any).school?.noStudents || 'No students found',
    noClasses:      (t as any).school?.noClasses || 'No classes yet',
    deleteConfirm:  (t as any).school?.deleteConfirm || 'Are you sure you want to delete this?',
    studentNumber:  (t as any).school?.studentNumber || 'Student #',
    enrolled:       (t as any).school?.enrolled || 'Enrolled',
    studentsCount:  (t as any).school?.studentsCount || 'students',
  }), [t])

  // ── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadStudents(storeId)
    loadClasses(storeId)
  }, [storeId, loadStudents, loadClasses])

  // ── Filtered students ──────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    let list = students
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.student_number.toLowerCase().includes(q) ||
        (s.parent_name || '').toLowerCase().includes(q)
      )
    }
    if (filterClass) list = list.filter(s => s.class_id === filterClass)
    if (filterStatus) list = list.filter(s => s.status === filterStatus)
    return list
  }, [students, search, filterClass, filterStatus])

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = students.length
    const active = students.filter(s => s.status === 'active').length
    const male = students.filter(s => s.gender === 'male').length
    const female = students.filter(s => s.gender === 'female').length
    const byClass: Record<string, number> = {}
    students.forEach(s => {
      const cn = s.class_name || 'Unassigned'
      byClass[cn] = (byClass[cn] || 0) + 1
    })
    return { total, active, male, female, byClass }
  }, [students])

  // ── Student CRUD ──────────────────────────────────────────────────────
  const openNewStudent = useCallback(() => {
    setEditingStudent(null)
    setStudentForm(emptyStudentForm)
    setShowStudentModal(true)
  }, [])

  const openEditStudent = useCallback((s: Student) => {
    setEditingStudent(s)
    setStudentForm({
      first_name: s.first_name,
      last_name: s.last_name,
      date_of_birth: s.date_of_birth || '',
      gender: s.gender || '',
      class_id: s.class_id || '',
      parent_name: s.parent_name || '',
      parent_phone: s.parent_phone || '',
      parent_email: s.parent_email || '',
      address: s.address || '',
      medical_notes: s.medical_notes || '',
      status: s.status,
    })
    setShowStudentModal(true)
  }, [])

  const handleSaveStudent = useCallback(async () => {
    if (!studentForm.first_name.trim() || !studentForm.last_name.trim()) return
    setSaving(true)
    try {
      const selectedClass = classes.find(c => c.id === studentForm.class_id)
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          first_name: studentForm.first_name.trim(),
          last_name: studentForm.last_name.trim(),
          date_of_birth: studentForm.date_of_birth || undefined,
          gender: (studentForm.gender || undefined) as Student['gender'],
          class_id: studentForm.class_id || undefined,
          class_name: selectedClass?.name || undefined,
          parent_name: studentForm.parent_name || undefined,
          parent_phone: studentForm.parent_phone || undefined,
          parent_email: studentForm.parent_email || undefined,
          address: studentForm.address || undefined,
          medical_notes: studentForm.medical_notes || undefined,
          status: studentForm.status,
        })
      } else {
        await createStudent({
          store_id: storeId,
          student_number: generateStudentNumber(students),
          first_name: studentForm.first_name.trim(),
          last_name: studentForm.last_name.trim(),
          date_of_birth: studentForm.date_of_birth || undefined,
          gender: (studentForm.gender || undefined) as Student['gender'],
          class_id: studentForm.class_id || undefined,
          class_name: selectedClass?.name || undefined,
          parent_name: studentForm.parent_name || undefined,
          parent_phone: studentForm.parent_phone || undefined,
          parent_email: studentForm.parent_email || undefined,
          address: studentForm.address || undefined,
          medical_notes: studentForm.medical_notes || undefined,
          status: studentForm.status,
          enrollment_date: new Date().toISOString().slice(0, 10),
        })
      }
      setShowStudentModal(false)
    } finally {
      setSaving(false)
    }
  }, [studentForm, editingStudent, students, classes, storeId, createStudent, updateStudent])

  const handleDeleteStudent = useCallback(async (id: string) => {
    await deleteStudent(id)
    setDeleteConfirmId(null)
  }, [deleteStudent])

  // ── Class CRUD ─────────────────────────────────────────────────────────
  const openNewClass = useCallback(() => {
    setEditingClass(null)
    setClassForm(emptyClassForm)
    setShowClassModal(true)
  }, [])

  const openEditClass = useCallback((c: SchoolClass) => {
    setEditingClass(c)
    setClassForm({
      name: c.name,
      level: c.level,
      academic_year: c.academic_year,
      teacher_name: c.teacher_name || '',
      capacity: String(c.capacity),
    })
    setShowClassModal(true)
  }, [])

  const handleSaveClass = useCallback(async () => {
    if (!classForm.name.trim()) return
    setSaving(true)
    try {
      if (editingClass) {
        await updateClass(editingClass.id, {
          name: classForm.name.trim(),
          level: classForm.level.trim(),
          academic_year: classForm.academic_year.trim(),
          teacher_name: classForm.teacher_name.trim() || undefined,
          capacity: parseInt(classForm.capacity, 10) || 30,
        })
      } else {
        await createClass({
          store_id: storeId,
          name: classForm.name.trim(),
          level: classForm.level.trim(),
          academic_year: classForm.academic_year.trim(),
          teacher_name: classForm.teacher_name.trim() || undefined,
          capacity: parseInt(classForm.capacity, 10) || 30,
          student_count: 0,
        })
      }
      setShowClassModal(false)
    } finally {
      setSaving(false)
    }
  }, [classForm, editingClass, storeId, createClass, updateClass])

  const handleDeleteClass = useCallback(async (id: string) => {
    await deleteClass(id)
    setDeleteConfirmId(null)
  }, [deleteClass])

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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: C.textSecondary,
    marginBottom: 4,
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
    backgroundColor: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    cursor: 'pointer',
  }

  // ── Render ────────────────────────────────────────────────────────────
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
          <GraduationCap size={28} color={C.primary} />
          <h1 style={{ margin: 0, fontSize: rv(20, 24, 26), fontWeight: 700, color: C.text }}>
            {L.title}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {viewTab === 'students' ? (
            <button style={btnPrimary} onClick={openNewStudent}>
              <Plus size={16} /> {L.addStudent}
            </button>
          ) : (
            <button style={btnPrimary} onClick={openNewClass}>
              <Plus size={16} /> {L.addClass}
            </button>
          )}
        </div>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: rv('1fr 1fr', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
        gap: rv(8, 12, 16),
        marginBottom: 20,
      }}>
        {[
          { label: L.totalEnrolled, value: stats.total, icon: <Users size={20} />, color: C.primary, bg: C.primaryLight },
          { label: L.activeStudents, value: stats.active, icon: <UserCheck size={20} />, color: C.success, bg: C.successBg },
          { label: L.byClass, value: Object.keys(stats.byClass).length, icon: <BookOpen size={20} />, color: C.warning, bg: C.warningBg },
          { label: L.genderBreakdown, value: `${stats.male}M / ${stats.female}F`, icon: <Users size={20} />, color: C.purple, bg: C.purpleBg },
        ].map((card, i) => (
          <div key={i} style={{
            backgroundColor: C.card, borderRadius: 12, padding: rv(12, 16, 16),
            border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, backgroundColor: card.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab toggle ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 16,
        backgroundColor: C.card, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden',
        width: 'fit-content',
      }}>
        {(['students', 'classes'] as ViewTab[]).map(tab => (
          <button key={tab} onClick={() => setViewTab(tab)} style={{
            padding: '8px 20px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
            backgroundColor: viewTab === tab ? C.primary : 'transparent',
            color: viewTab === tab ? '#fff' : C.textSecondary,
            transition: 'all 0.2s',
          }}>
            {tab === 'students' ? L.students : L.classes}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STUDENTS TAB                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {viewTab === 'students' && (
        <>
          {/* Search + filters */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16,
          }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 360 }}>
              <Search size={16} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                placeholder={L.search}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 34 }}
              />
            </div>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: 140 }}
            >
              <option value="">{L.allClasses}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as StudentStatus | '')}
              style={{ ...inputStyle, width: 'auto', minWidth: 140 }}
            >
              <option value="">{L.allStatuses}</option>
              {(Object.keys(STATUS_CONFIG) as StudentStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          {/* Student list */}
          {filteredStudents.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 40, color: C.textSecondary,
              backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
            }}>
              <Users size={40} color={C.border} style={{ marginBottom: 8 }} />
              <div>{L.noStudents}</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: rv('1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)'),
              gap: rv(8, 12, 16),
            }}>
              {filteredStudents.map(s => {
                const statusCfg = STATUS_CONFIG[s.status]
                return (
                  <div key={s.id} style={{
                    backgroundColor: C.card, borderRadius: 12, padding: 16,
                    border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    {/* Top row: avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Photo placeholder with initials */}
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', backgroundColor: C.primaryLight,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: C.primary, flexShrink: 0,
                      }}>
                        {getInitials(s.first_name, s.last_name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.first_name} {s.last_name}
                        </div>
                        <div style={{ fontSize: 12, color: C.textSecondary }}>{s.student_number}</div>
                      </div>
                      {/* Status badge */}
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        color: statusCfg.color, backgroundColor: statusCfg.bg, whiteSpace: 'nowrap',
                      }}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Info rows */}
                    <div style={{ fontSize: 13, color: C.textSecondary, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {s.class_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <BookOpen size={13} /> {s.class_name}
                        </div>
                      )}
                      {s.parent_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={13} /> {s.parent_name} {s.parent_phone ? `(${s.parent_phone})` : ''}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                      <button
                        onClick={() => openEditStudent(s)}
                        style={{ ...btnSecondary, padding: '6px 10px', fontSize: 13 }}
                      >
                        <Edit2 size={14} /> {L.editStudent.replace('Edit ', '').replace('Modifier ', '')}
                      </button>
                      {deleteConfirmId === s.id ? (
                        <>
                          <button
                            onClick={() => handleDeleteStudent(s.id)}
                            style={{ ...btnPrimary, padding: '6px 10px', fontSize: 13, backgroundColor: C.danger }}
                          >
                            {L.confirm}
                          </button>
                          <button onClick={() => setDeleteConfirmId(null)} style={{ ...btnSecondary, padding: '6px 10px', fontSize: 13 }}>
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(s.id)}
                          style={{ ...btnSecondary, padding: '6px 10px', fontSize: 13, color: C.danger }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CLASSES TAB                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {viewTab === 'classes' && (
        <>
          {classes.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 40, color: C.textSecondary,
              backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
            }}>
              <BookOpen size={40} color={C.border} style={{ marginBottom: 8 }} />
              <div>{L.noClasses}</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: rv('1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)'),
              gap: rv(8, 12, 16),
            }}>
              {classes.map(c => (
                <div key={c.id} style={{
                  backgroundColor: C.card, borderRadius: 12, padding: 16,
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: C.textSecondary }}>{c.level} - {c.academic_year}</div>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      backgroundColor: C.primaryLight, color: C.primary,
                    }}>
                      {c.student_count}/{c.capacity}
                    </div>
                  </div>
                  {c.teacher_name && (
                    <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
                      {L.teacher}: {c.teacher_name}
                    </div>
                  )}
                  {/* Capacity bar */}
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: C.border, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${Math.min(100, (c.student_count / c.capacity) * 100)}%`,
                      backgroundColor: c.student_count >= c.capacity ? C.danger : C.primary,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEditClass(c)} style={{ ...btnSecondary, padding: '6px 10px', fontSize: 13 }}>
                      <Edit2 size={14} />
                    </button>
                    {deleteConfirmId === c.id ? (
                      <>
                        <button
                          onClick={() => handleDeleteClass(c.id)}
                          style={{ ...btnPrimary, padding: '6px 10px', fontSize: 13, backgroundColor: C.danger }}
                        >
                          {L.confirm}
                        </button>
                        <button onClick={() => setDeleteConfirmId(null)} style={{ ...btnSecondary, padding: '6px 10px', fontSize: 13 }}>
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(c.id)}
                        style={{ ...btnSecondary, padding: '6px 10px', fontSize: 13, color: C.danger }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STUDENT MODAL                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        title={editingStudent ? L.editStudent : L.addStudent}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Row: first + last name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.firstName} *</label>
              <input style={inputStyle} value={studentForm.first_name}
                onChange={e => setStudentForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>{L.lastName} *</label>
              <input style={inputStyle} value={studentForm.last_name}
                onChange={e => setStudentForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
          </div>

          {/* Row: DOB + gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.dateOfBirth}</label>
              <input type="date" style={inputStyle} value={studentForm.date_of_birth}
                onChange={e => setStudentForm(f => ({ ...f, date_of_birth: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>{L.gender}</label>
              <select style={inputStyle} value={studentForm.gender}
                onChange={e => setStudentForm(f => ({ ...f, gender: e.target.value as any }))}>
                <option value="">--</option>
                <option value="male">{L.male}</option>
                <option value="female">{L.female}</option>
                <option value="other">{L.other}</option>
              </select>
            </div>
          </div>

          {/* Class + status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.class}</label>
              <select style={inputStyle} value={studentForm.class_id}
                onChange={e => setStudentForm(f => ({ ...f, class_id: e.target.value }))}>
                <option value="">--</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{L.status}</label>
              <select style={inputStyle} value={studentForm.status}
                onChange={e => setStudentForm(f => ({ ...f, status: e.target.value as StudentStatus }))}>
                {(Object.keys(STATUS_CONFIG) as StudentStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Parent info */}
          <div>
            <label style={labelStyle}>{L.parentName}</label>
            <input style={inputStyle} value={studentForm.parent_name}
              onChange={e => setStudentForm(f => ({ ...f, parent_name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.parentPhone}</label>
              <input type="tel" style={inputStyle} value={studentForm.parent_phone}
                onChange={e => setStudentForm(f => ({ ...f, parent_phone: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>{L.parentEmail}</label>
              <input type="email" style={inputStyle} value={studentForm.parent_email}
                onChange={e => setStudentForm(f => ({ ...f, parent_email: e.target.value }))} />
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}>{L.address}</label>
            <input style={inputStyle} value={studentForm.address}
              onChange={e => setStudentForm(f => ({ ...f, address: e.target.value }))} />
          </div>

          {/* Medical notes */}
          <div>
            <label style={labelStyle}>{L.medicalNotes}</label>
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={studentForm.medical_notes}
              onChange={e => setStudentForm(f => ({ ...f, medical_notes: e.target.value }))}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button style={btnSecondary} onClick={() => setShowStudentModal(false)}>
              {L.cancel}
            </button>
            <button style={btnPrimary} onClick={handleSaveStudent} disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              {L.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CLASS MODAL                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        title={editingClass ? L.editClass : L.addClass}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>{L.className} *</label>
            <input style={inputStyle} value={classForm.name} placeholder="e.g. CM2 A"
              onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.level}</label>
              <input style={inputStyle} value={classForm.level} placeholder="e.g. Primaire"
                onChange={e => setClassForm(f => ({ ...f, level: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>{L.academicYear}</label>
              <input style={inputStyle} value={classForm.academic_year} placeholder="2025-2026"
                onChange={e => setClassForm(f => ({ ...f, academic_year: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.teacher}</label>
              <input style={inputStyle} value={classForm.teacher_name}
                onChange={e => setClassForm(f => ({ ...f, teacher_name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>{L.capacity}</label>
              <input type="number" style={inputStyle} value={classForm.capacity}
                onChange={e => setClassForm(f => ({ ...f, capacity: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button style={btnSecondary} onClick={() => setShowClassModal(false)}>
              {L.cancel}
            </button>
            <button style={btnPrimary} onClick={handleSaveClass} disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              {L.save}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
