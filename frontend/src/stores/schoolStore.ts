import { create } from 'zustand'
import type { Student, SchoolClass, AttendanceRecord, GradeEntry, AttendanceStatus } from '../types'
import { db } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

interface SchoolState {
  students: Student[]
  classes: SchoolClass[]
  attendanceRecords: AttendanceRecord[]
  gradeEntries: GradeEntry[]
  loading: boolean
}

interface SchoolActions {
  loadStudents: (storeId: string) => Promise<void>
  createStudent: (s: Omit<Student, 'id' | 'synced' | 'created_at' | 'updated_at'>) => Promise<Student>
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>
  deleteStudent: (id: string) => Promise<void>

  loadClasses: (storeId: string) => Promise<void>
  createClass: (c: Omit<SchoolClass, 'id' | 'synced' | 'created_at' | 'updated_at'>) => Promise<SchoolClass>
  updateClass: (id: string, data: Partial<SchoolClass>) => Promise<void>
  deleteClass: (id: string) => Promise<void>

  loadAttendance: (storeId: string, date?: string, classId?: string) => Promise<void>
  recordAttendance: (record: Omit<AttendanceRecord, 'id' | 'synced' | 'created_at'>) => Promise<void>
  updateAttendanceStatus: (id: string, status: AttendanceStatus) => Promise<void>
  bulkRecordAttendance: (records: Omit<AttendanceRecord, 'id' | 'synced' | 'created_at'>[]) => Promise<void>

  loadGrades: (storeId: string, classId?: string, studentId?: string) => Promise<void>
  createGrade: (g: Omit<GradeEntry, 'id' | 'synced' | 'created_at' | 'updated_at'>) => Promise<void>
  updateGrade: (id: string, data: Partial<GradeEntry>) => Promise<void>
  deleteGrade: (id: string) => Promise<void>
}

export const useSchoolStore = create<SchoolState & SchoolActions>()((set, get) => ({
  students: [],
  classes: [],
  attendanceRecords: [],
  gradeEntries: [],
  loading: false,

  // ── Students ─────────────────────────────────────────────────────────────
  loadStudents: async (storeId) => {
    set({ loading: true })
    const students = await db.students.where('store_id').equals(storeId).toArray()
    students.sort((a, b) => a.last_name.localeCompare(b.last_name))
    set({ students, loading: false })
  },

  createStudent: async (data) => {
    const now = new Date().toISOString()
    const student: Student = { ...data, id: generateUUID(), synced: false, created_at: now, updated_at: now }
    await db.students.put(student)
    set({ students: [...get().students, student] })
    // Update class student count
    if (student.class_id) {
      const cls = get().classes.find(c => c.id === student.class_id)
      if (cls) await get().updateClass(cls.id, { student_count: cls.student_count + 1 })
    }
    return student
  },

  updateStudent: async (id, data) => {
    const now = new Date().toISOString()
    await db.students.update(id, { ...data, updated_at: now, synced: false })
    set({ students: get().students.map(s => s.id === id ? { ...s, ...data, updated_at: now } : s) })
  },

  deleteStudent: async (id) => {
    const student = get().students.find(s => s.id === id)
    await db.students.delete(id)
    set({ students: get().students.filter(s => s.id !== id) })
    if (student?.class_id) {
      const cls = get().classes.find(c => c.id === student.class_id)
      if (cls) await get().updateClass(cls.id, { student_count: Math.max(0, cls.student_count - 1) })
    }
  },

  // ── Classes ──────────────────────────────────────────────────────────────
  loadClasses: async (storeId) => {
    const classes = await db.school_classes.where('store_id').equals(storeId).toArray()
    classes.sort((a, b) => a.name.localeCompare(b.name))
    set({ classes })
  },

  createClass: async (data) => {
    const now = new Date().toISOString()
    const cls: SchoolClass = { ...data, id: generateUUID(), synced: false, created_at: now, updated_at: now }
    await db.school_classes.put(cls)
    set({ classes: [...get().classes, cls] })
    return cls
  },

  updateClass: async (id, data) => {
    const now = new Date().toISOString()
    await db.school_classes.update(id, { ...data, updated_at: now, synced: false })
    set({ classes: get().classes.map(c => c.id === id ? { ...c, ...data, updated_at: now } : c) })
  },

  deleteClass: async (id) => {
    await db.school_classes.delete(id)
    set({ classes: get().classes.filter(c => c.id !== id) })
  },

  // ── Attendance ───────────────────────────────────────────────────────────
  loadAttendance: async (storeId, date, classId) => {
    let records = await db.attendance_records.where('store_id').equals(storeId).toArray()
    if (date) records = records.filter(r => r.date === date)
    if (classId) records = records.filter(r => r.class_id === classId)
    records.sort((a, b) => a.student_name.localeCompare(b.student_name))
    set({ attendanceRecords: records })
  },

  recordAttendance: async (data) => {
    const now = new Date().toISOString()
    const record: AttendanceRecord = { ...data, id: generateUUID(), synced: false, created_at: now }
    await db.attendance_records.put(record)
    set({ attendanceRecords: [...get().attendanceRecords, record] })
  },

  updateAttendanceStatus: async (id, status) => {
    await db.attendance_records.update(id, { status, synced: false })
    set({ attendanceRecords: get().attendanceRecords.map(r => r.id === id ? { ...r, status } : r) })
  },

  bulkRecordAttendance: async (records) => {
    const now = new Date().toISOString()
    const entries: AttendanceRecord[] = records.map(r => ({
      ...r, id: generateUUID(), synced: false, created_at: now,
    }))
    await db.attendance_records.bulkPut(entries)
    set({ attendanceRecords: [...get().attendanceRecords, ...entries] })
  },

  // ── Grades ───────────────────────────────────────────────────────────────
  loadGrades: async (storeId, classId, studentId) => {
    let grades = await db.grade_entries.where('store_id').equals(storeId).toArray()
    if (classId) grades = grades.filter(g => g.class_id === classId)
    if (studentId) grades = grades.filter(g => g.student_id === studentId)
    grades.sort((a, b) => b.created_at.localeCompare(a.created_at))
    set({ gradeEntries: grades })
  },

  createGrade: async (data) => {
    const now = new Date().toISOString()
    const grade: GradeEntry = { ...data, id: generateUUID(), synced: false, created_at: now, updated_at: now }
    await db.grade_entries.put(grade)
    set({ gradeEntries: [grade, ...get().gradeEntries] })
  },

  updateGrade: async (id, data) => {
    const now = new Date().toISOString()
    await db.grade_entries.update(id, { ...data, updated_at: now, synced: false })
    set({ gradeEntries: get().gradeEntries.map(g => g.id === id ? { ...g, ...data, updated_at: now } : g) })
  },

  deleteGrade: async (id) => {
    await db.grade_entries.delete(id)
    set({ gradeEntries: get().gradeEntries.filter(g => g.id !== id) })
  },
}))
