import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Save,
  Award,
  BarChart3,
  X,
  FileText,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useSchoolStore } from '../stores/schoolStore'
import { useResponsive } from '../hooks/useLayoutMode'
import type { GradeEntry } from '../types'

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
  purple: '#7c3aed',
  purpleBg: '#ede9fe',
} as const

// ── Grade helpers ────────────────────────────────────────────────────────

function calcPercentage(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0
  return Math.round((score / maxScore) * 100)
}

function calcGradeLetter(percentage: number): string {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

function gradeColor(letter: string): { color: string; bg: string } {
  switch (letter) {
    case 'A': return { color: C.success, bg: C.successBg }
    case 'B': return { color: C.info,    bg: C.infoBg }
    case 'C': return { color: C.warning, bg: C.warningBg }
    case 'D': return { color: '#ea580c', bg: '#fff7ed' }
    default:  return { color: C.danger,  bg: C.dangerBg }
  }
}

// ── Assessment type labels ───────────────────────────────────────────────

const ASSESSMENT_TYPES: { value: GradeEntry['assessment_type']; label: string }[] = [
  { value: 'exam',          label: 'Exam' },
  { value: 'quiz',          label: 'Quiz' },
  { value: 'homework',      label: 'Homework' },
  { value: 'project',       label: 'Project' },
  { value: 'participation', label: 'Participation' },
]

// ── Default subjects ─────────────────────────────────────────────────────

const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'French', 'History',
  'Geography', 'Physics', 'Chemistry', 'Biology', 'Literature',
  'Art', 'Music', 'Physical Education', 'Computer Science', 'Philosophy',
]

// ── Form interface ──────────────────────────────────────────────────────

interface GradeForm {
  student_id: string
  class_id: string
  subject: string
  assessment_type: GradeEntry['assessment_type']
  score: string
  max_score: string
  term: string
  academic_year: string
  comments: string
}

const emptyForm: GradeForm = {
  student_id: '',
  class_id: '',
  subject: '',
  assessment_type: 'exam',
  score: '',
  max_score: '100',
  term: 'Term 1',
  academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  comments: '',
}

// ── View types ──────────────────────────────────────────────────────────

type ViewMode = 'table' | 'report-card'

// ══════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════

export default function GradesPage() {
  const { currentStore } = useAppStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  const {
    students, classes, gradeEntries, loading,
    loadStudents, loadClasses, loadGrades,
    createGrade, updateGrade, deleteGrade,
  } = useSchoolStore()

  const storeId = currentStore?.id || 'default-store'

  // ── Local state ────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [filterClass, setFilterClass] = useState('')
  const [filterStudent, setFilterStudent] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterTerm, setFilterTerm] = useState('')
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingGrade, setEditingGrade] = useState<GradeEntry | null>(null)
  const [form, setForm] = useState<GradeForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Report card state
  const [reportStudentId, setReportStudentId] = useState('')

  // ── Labels ─────────────────────────────────────────────────────────────
  const L = useMemo(() => ({
    title:         (t as any).school?.grades || 'Grades',
    addGrade:      (t as any).school?.addGrade || 'Add Grade',
    editGrade:     (t as any).school?.editGrade || 'Edit Grade',
    student:       (t as any).school?.student || 'Student',
    class:         (t as any).school?.class || 'Class',
    subject:       (t as any).school?.subject || 'Subject',
    assessment:    (t as any).school?.assessment || 'Assessment',
    score:         (t as any).school?.score || 'Score',
    maxScore:      (t as any).school?.maxScore || 'Max Score',
    percentage:    (t as any).school?.percentage || '%',
    grade:         (t as any).school?.grade || 'Grade',
    term:          (t as any).school?.term || 'Term',
    academicYear:  (t as any).school?.academicYear || 'Academic Year',
    comments:      (t as any).school?.comments || 'Comments',
    save:          (t as any).common?.save || 'Save',
    cancel:        (t as any).common?.cancel || 'Cancel',
    delete:        (t as any).common?.delete || 'Delete',
    confirm:       (t as any).common?.confirm || 'Confirm',
    search:        (t as any).common?.search || 'Search...',
    allClasses:    (t as any).school?.allClasses || 'All Classes',
    allStudents:   (t as any).school?.allStudents || 'All Students',
    allSubjects:   (t as any).school?.allSubjects || 'All Subjects',
    allTerms:      (t as any).school?.allTerms || 'All Terms',
    noGrades:      (t as any).school?.noGrades || 'No grades recorded yet',
    classAverage:  (t as any).school?.classAverage || 'Class Average',
    reportCard:    (t as any).school?.reportCard || 'Report Card',
    gradeTable:    (t as any).school?.gradeTable || 'Grade Table',
    selectStudent: (t as any).school?.selectStudent || 'Select a student to view report card',
    average:       (t as any).school?.average || 'Average',
    totalGrades:   (t as any).school?.totalGrades || 'Total Grades',
    bestSubject:   (t as any).school?.bestSubject || 'Best Subject',
    back:          (t as any).common?.back || 'Back',
  }), [t])

  // ── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadStudents(storeId)
    loadClasses(storeId)
    loadGrades(storeId)
  }, [storeId, loadStudents, loadClasses, loadGrades])

  // ── Filtered grades ────────────────────────────────────────────────────
  const filteredGrades = useMemo(() => {
    let list = gradeEntries
    if (filterClass) list = list.filter(g => g.class_id === filterClass)
    if (filterStudent) list = list.filter(g => g.student_id === filterStudent)
    if (filterSubject) list = list.filter(g => g.subject === filterSubject)
    if (filterTerm) list = list.filter(g => g.term === filterTerm)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(g =>
        g.student_name.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q)
      )
    }
    return list
  }, [gradeEntries, filterClass, filterStudent, filterSubject, filterTerm, search])

  // ── Derived data ───────────────────────────────────────────────────────
  const uniqueSubjects = useMemo(() => {
    return [...new Set(gradeEntries.map(g => g.subject))].sort()
  }, [gradeEntries])

  const uniqueTerms = useMemo(() => {
    return [...new Set(gradeEntries.map(g => g.term))].sort()
  }, [gradeEntries])

  // Class averages by subject
  const classAverages = useMemo(() => {
    if (!filterClass) return []
    const classGrades = gradeEntries.filter(g => g.class_id === filterClass)
    const bySubject: Record<string, number[]> = {}
    classGrades.forEach(g => {
      if (!bySubject[g.subject]) bySubject[g.subject] = []
      bySubject[g.subject].push(g.percentage)
    })
    return Object.entries(bySubject)
      .map(([subject, pcts]) => ({
        subject,
        average: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
        count: pcts.length,
      }))
      .sort((a, b) => b.average - a.average)
  }, [gradeEntries, filterClass])

  // Students filtered by class for modal
  const classStudents = useMemo(() => {
    if (!form.class_id) return students
    return students.filter(s => s.class_id === form.class_id)
  }, [students, form.class_id])

  // Report card data
  const reportCardData = useMemo(() => {
    if (!reportStudentId) return null
    const studentGrades = gradeEntries.filter(g => g.student_id === reportStudentId)
    const student = students.find(s => s.id === reportStudentId)
    if (!student || studentGrades.length === 0) return null

    // Group by subject then by term
    const bySubject: Record<string, { term: string; percentage: number; grade_letter: string; score: number; max_score: number; assessment_type: string }[]> = {}
    studentGrades.forEach(g => {
      if (!bySubject[g.subject]) bySubject[g.subject] = []
      bySubject[g.subject].push({
        term: g.term,
        percentage: g.percentage,
        grade_letter: g.grade_letter || calcGradeLetter(g.percentage),
        score: g.score,
        max_score: g.max_score,
        assessment_type: g.assessment_type,
      })
    })

    // Compute per-subject averages
    const subjects = Object.entries(bySubject).map(([subject, entries]) => {
      const avg = Math.round(entries.reduce((a, e) => a + e.percentage, 0) / entries.length)
      return {
        subject,
        entries,
        average: avg,
        gradeLetter: calcGradeLetter(avg),
      }
    }).sort((a, b) => a.subject.localeCompare(b.subject))

    const overallAvg = subjects.length > 0
      ? Math.round(subjects.reduce((a, s) => a + s.average, 0) / subjects.length)
      : 0

    return { student, subjects, overallAvg, totalGrades: studentGrades.length }
  }, [reportStudentId, gradeEntries, students])

  // ── Grade CRUD ─────────────────────────────────────────────────────────
  const openNewGrade = useCallback(() => {
    setEditingGrade(null)
    setForm({ ...emptyForm, class_id: filterClass || '' })
    setShowModal(true)
  }, [filterClass])

  const openEditGrade = useCallback((g: GradeEntry) => {
    setEditingGrade(g)
    setForm({
      student_id: g.student_id,
      class_id: g.class_id,
      subject: g.subject,
      assessment_type: g.assessment_type,
      score: String(g.score),
      max_score: String(g.max_score),
      term: g.term,
      academic_year: g.academic_year,
      comments: g.comments || '',
    })
    setShowModal(true)
  }, [])

  const handleSaveGrade = useCallback(async () => {
    const score = parseFloat(form.score)
    const maxScore = parseFloat(form.max_score)
    if (!form.student_id || !form.subject || isNaN(score) || isNaN(maxScore) || maxScore <= 0) return

    setSaving(true)
    try {
      const percentage = calcPercentage(score, maxScore)
      const gradeLetter = calcGradeLetter(percentage)
      const student = students.find(s => s.id === form.student_id)
      const cls = classes.find(c => c.id === form.class_id)

      if (editingGrade) {
        await updateGrade(editingGrade.id, {
          student_id: form.student_id,
          student_name: student ? `${student.first_name} ${student.last_name}` : editingGrade.student_name,
          class_id: form.class_id,
          class_name: cls?.name || editingGrade.class_name,
          subject: form.subject,
          assessment_type: form.assessment_type,
          score,
          max_score: maxScore,
          percentage,
          grade_letter: gradeLetter,
          term: form.term,
          academic_year: form.academic_year,
          comments: form.comments || undefined,
        })
      } else {
        await createGrade({
          store_id: storeId,
          student_id: form.student_id,
          student_name: student ? `${student.first_name} ${student.last_name}` : '',
          class_id: form.class_id,
          class_name: cls?.name || '',
          subject: form.subject,
          assessment_type: form.assessment_type,
          score,
          max_score: maxScore,
          percentage,
          grade_letter: gradeLetter,
          term: form.term,
          academic_year: form.academic_year,
          comments: form.comments || undefined,
          recorded_by: user?.name || user?.email || 'admin',
        })
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }, [form, editingGrade, students, classes, storeId, user, createGrade, updateGrade])

  const handleDeleteGrade = useCallback(async (id: string) => {
    await deleteGrade(id)
    setDeleteConfirmId(null)
  }, [deleteGrade])

  // ── Computed percentage / grade for form preview ──────────────────────
  const formPreview = useMemo(() => {
    const score = parseFloat(form.score)
    const max = parseFloat(form.max_score)
    if (isNaN(score) || isNaN(max) || max <= 0) return null
    const pct = calcPercentage(score, max)
    return { percentage: pct, letter: calcGradeLetter(pct) }
  }, [form.score, form.max_score])

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
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    cursor: 'pointer',
  }

  // ── Loading screen ────────────────────────────────────────────────────
  if (loading && gradeEntries.length === 0 && students.length === 0) {
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
          <Award size={28} color={C.primary} />
          <h1 style={{ margin: 0, fontSize: rv(20, 24, 26), fontWeight: 700, color: C.text }}>
            {L.title}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnPrimary} onClick={openNewGrade}>
            <Plus size={16} /> {L.addGrade}
          </button>
        </div>
      </div>

      {/* ── View toggle ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 16,
        backgroundColor: C.card, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden',
        width: 'fit-content',
      }}>
        {([
          { key: 'table' as ViewMode, label: L.gradeTable, icon: <BarChart3 size={14} /> },
          { key: 'report-card' as ViewMode, label: L.reportCard, icon: <FileText size={14} /> },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setViewMode(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
            backgroundColor: viewMode === tab.key ? C.primary : 'transparent',
            color: viewMode === tab.key ? '#fff' : C.textSecondary,
            transition: 'all 0.2s',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* GRADE TABLE VIEW                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'table' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
              <Search size={16} color={C.textSecondary} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                placeholder={L.search}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 34 }}
              />
            </div>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 130 }}>
              <option value="">{L.allClasses}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 140 }}>
              <option value="">{L.allStudents}</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 130 }}>
              <option value="">{L.allSubjects}</option>
              {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 120 }}>
              <option value="">{L.allTerms}</option>
              {uniqueTerms.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Class averages */}
          {filterClass && classAverages.length > 0 && (
            <div style={{
              backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
              padding: 16, marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>
                {L.classAverage}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {classAverages.map(a => {
                  const gc = gradeColor(calcGradeLetter(a.average))
                  return (
                    <div key={a.subject} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      backgroundColor: gc.bg, color: gc.color,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {a.subject}: {a.average}% ({calcGradeLetter(a.average)})
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Grade table */}
          {filteredGrades.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 40, color: C.textSecondary,
              backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
            }}>
              <Award size={40} color={C.border} style={{ marginBottom: 8 }} />
              <div>{L.noGrades}</div>
            </div>
          ) : isMobile ? (
            /* Mobile: card layout */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredGrades.map(g => {
                const gc = gradeColor(g.grade_letter || calcGradeLetter(g.percentage))
                return (
                  <div key={g.id} style={{
                    backgroundColor: C.card, borderRadius: 12, padding: 14,
                    border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{g.student_name}</div>
                        <div style={{ fontSize: 12, color: C.textSecondary }}>{g.subject} - {g.assessment_type}</div>
                      </div>
                      <span style={{
                        fontSize: 16, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                        color: gc.color, backgroundColor: gc.bg,
                      }}>
                        {g.grade_letter || calcGradeLetter(g.percentage)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, color: C.textSecondary }}>
                        {g.score}/{g.max_score} ({g.percentage}%) - {g.term}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEditGrade(g)} style={{ ...btnSecondary, padding: '4px 8px', fontSize: 12 }}>
                          <Edit2 size={13} />
                        </button>
                        {deleteConfirmId === g.id ? (
                          <>
                            <button onClick={() => handleDeleteGrade(g.id)} style={{ ...btnPrimary, padding: '4px 8px', fontSize: 12, backgroundColor: C.danger }}>
                              {L.confirm}
                            </button>
                            <button onClick={() => setDeleteConfirmId(null)} style={{ ...btnSecondary, padding: '4px 8px', fontSize: 12 }}>
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(g.id)} style={{ ...btnSecondary, padding: '4px 8px', fontSize: 12, color: C.danger }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Desktop: table layout */
            <div style={{
              backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
              overflow: 'auto',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ backgroundColor: C.bg }}>
                    {[L.student, L.subject, L.assessment, L.score, L.percentage, L.grade, L.term, ''].map((h, i) => (
                      <th key={i} style={{
                        textAlign: i === 7 ? 'right' : 'left',
                        padding: '10px 14px', fontSize: 13, fontWeight: 600, color: C.textSecondary,
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map(g => {
                    const gc = gradeColor(g.grade_letter || calcGradeLetter(g.percentage))
                    return (
                      <tr key={g.id} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500, color: C.text }}>{g.student_name}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: C.text }}>{g.subject}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: C.textSecondary, textTransform: 'capitalize' }}>{g.assessment_type}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: C.text }}>{g.score}/{g.max_score}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: C.text }}>{g.percentage}%</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                            color: gc.color, backgroundColor: gc.bg,
                          }}>
                            {g.grade_letter || calcGradeLetter(g.percentage)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: C.textSecondary }}>{g.term}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button onClick={() => openEditGrade(g)} style={{ ...btnSecondary, padding: '4px 8px', fontSize: 12 }}>
                              <Edit2 size={13} />
                            </button>
                            {deleteConfirmId === g.id ? (
                              <>
                                <button onClick={() => handleDeleteGrade(g.id)} style={{ ...btnPrimary, padding: '4px 8px', fontSize: 12, backgroundColor: C.danger }}>
                                  {L.confirm}
                                </button>
                                <button onClick={() => setDeleteConfirmId(null)} style={{ ...btnSecondary, padding: '4px 8px', fontSize: 12 }}>
                                  <X size={13} />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => setDeleteConfirmId(g.id)} style={{ ...btnSecondary, padding: '4px 8px', fontSize: 12, color: C.danger }}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* REPORT CARD VIEW                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'report-card' && (
        <>
          {/* Student selector */}
          <div style={{
            backgroundColor: C.card, padding: 16, borderRadius: 12, border: `1px solid ${C.border}`,
            marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end',
          }}>
            <div style={{ flex: '0 0 auto', minWidth: 160 }}>
              <label style={labelStyle}>{L.class}</label>
              <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setReportStudentId('') }}
                style={{ ...inputStyle, maxWidth: 250 }}>
                <option value="">{L.allClasses}</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={labelStyle}>{L.student}</label>
              <select value={reportStudentId} onChange={e => setReportStudentId(e.target.value)}
                style={{ ...inputStyle, maxWidth: 300 }}>
                <option value="">{L.selectStudent}</option>
                {(filterClass ? students.filter(s => s.class_id === filterClass) : students).map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          {!reportStudentId || !reportCardData ? (
            <div style={{
              textAlign: 'center', padding: 40, color: C.textSecondary,
              backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
            }}>
              <FileText size={40} color={C.border} style={{ marginBottom: 8 }} />
              <div>{L.selectStudent}</div>
            </div>
          ) : (
            <div style={{ backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              {/* Report header */}
              <div style={{
                padding: 20, borderBottom: `1px solid ${C.border}`,
                background: `linear-gradient(135deg, ${C.primary}10, ${C.primaryLight})`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', backgroundColor: C.primaryLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 700, color: C.primary, flexShrink: 0,
                  }}>
                    {(reportCardData.student.first_name[0] || '') + (reportCardData.student.last_name[0] || '')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                      {reportCardData.student.first_name} {reportCardData.student.last_name}
                    </div>
                    <div style={{ fontSize: 13, color: C.textSecondary }}>
                      {reportCardData.student.student_number} - {reportCardData.student.class_name || ''}
                    </div>
                  </div>
                  {/* Overall average badge */}
                  <div style={{
                    textAlign: 'center', padding: '8px 20px', borderRadius: 12,
                    ...(() => { const gc = gradeColor(calcGradeLetter(reportCardData.overallAvg)); return { backgroundColor: gc.bg, color: gc.color } })(),
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{L.average}</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{reportCardData.overallAvg}%</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{calcGradeLetter(reportCardData.overallAvg)}</div>
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13, color: C.textSecondary }}>
                    <span style={{ fontWeight: 600, color: C.text }}>{reportCardData.totalGrades}</span> {L.totalGrades}
                  </div>
                  {reportCardData.subjects.length > 0 && (
                    <div style={{ fontSize: 13, color: C.textSecondary }}>
                      {L.bestSubject}: <span style={{ fontWeight: 600, color: C.success }}>{
                        [...reportCardData.subjects].sort((a, b) => b.average - a.average)[0].subject
                      } ({[...reportCardData.subjects].sort((a, b) => b.average - a.average)[0].average}%)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject breakdown table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: C.bg }}>
                      <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.textSecondary }}>
                        {L.subject}
                      </th>
                      <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.textSecondary }}>
                        {L.average}
                      </th>
                      <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.textSecondary }}>
                        {L.grade}
                      </th>
                      <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.textSecondary }}>
                        {L.totalGrades}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCardData.subjects.map(s => {
                      const gc = gradeColor(s.gradeLetter)
                      return (
                        <tr key={s.subject} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: C.text }}>
                            {s.subject}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {/* Progress bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                              <div style={{ width: 80, height: 6, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', borderRadius: 3,
                                  width: `${Math.min(100, s.average)}%`,
                                  backgroundColor: gc.color,
                                  transition: 'width 0.3s',
                                }} />
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, minWidth: 36 }}>{s.average}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: 14, fontWeight: 700, padding: '3px 12px', borderRadius: 6,
                              color: gc.color, backgroundColor: gc.bg,
                            }}>
                              {s.gradeLetter}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: C.textSecondary }}>
                            {s.entries.length}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ADD / EDIT GRADE MODAL                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGrade ? L.editGrade : L.addGrade}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Class */}
          <div>
            <label style={labelStyle}>{L.class}</label>
            <select style={inputStyle} value={form.class_id}
              onChange={e => setForm(f => ({ ...f, class_id: e.target.value, student_id: '' }))}>
              <option value="">--</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Student */}
          <div>
            <label style={labelStyle}>{L.student} *</label>
            <select style={inputStyle} value={form.student_id}
              onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}>
              <option value="">--</option>
              {classStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>

          {/* Subject + assessment type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.subject} *</label>
              <select style={inputStyle} value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                <option value="">--</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{L.assessment}</label>
              <select style={inputStyle} value={form.assessment_type}
                onChange={e => setForm(f => ({ ...f, assessment_type: e.target.value as GradeEntry['assessment_type'] }))}>
                {ASSESSMENT_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>

          {/* Score + max score */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>{L.score} *</label>
              <input type="number" step="0.5" min="0" style={inputStyle} value={form.score}
                onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>{L.maxScore}</label>
              <input type="number" step="1" min="1" style={inputStyle} value={form.max_score}
                onChange={e => setForm(f => ({ ...f, max_score: e.target.value }))} />
            </div>
            {/* Preview */}
            {formPreview && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, textAlign: 'center',
                ...gradeColor(formPreview.letter),
                fontWeight: 700, fontSize: 14,
              }}>
                {formPreview.percentage}% ({formPreview.letter})
              </div>
            )}
          </div>

          {/* Term + year */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{L.term}</label>
              <select style={inputStyle} value={form.term}
                onChange={e => setForm(f => ({ ...f, term: e.target.value }))}>
                {['Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2', 'Trimestre 1', 'Trimestre 2', 'Trimestre 3'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{L.academicYear}</label>
              <input style={inputStyle} value={form.academic_year}
                onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} />
            </div>
          </div>

          {/* Comments */}
          <div>
            <label style={labelStyle}>{L.comments}</label>
            <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.comments}
              onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button style={btnSecondary} onClick={() => setShowModal(false)}>
              {L.cancel}
            </button>
            <button style={btnPrimary} onClick={handleSaveGrade} disabled={saving}>
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
