import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateUUID } from '../utils/uuid'

// ── Types ────────────────────────────────────────────────────────────────────

export type ShiftRole = 'admin' | 'manager' | 'cashier' | 'stock'

export interface Shift {
  id: string
  employee_id: string
  employee_name: string
  date: string            // YYYY-MM-DD
  start_time: string      // HH:mm
  end_time: string        // HH:mm
  role: ShiftRole
  store_id: string
  notes: string
  created_at: string
  updated_at: string
}

// ── State ────────────────────────────────────────────────────────────────────

interface ScheduleState {
  shifts: Shift[]
  loading: boolean
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface ScheduleActions {
  loadShifts: (storeId: string) => void
  addShift: (data: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) => Shift
  updateShift: (id: string, updates: Partial<Shift>) => void
  deleteShift: (id: string) => void
  getWeekShifts: (weekStart: string) => Shift[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useScheduleStore = create<ScheduleState & ScheduleActions>()(
  persist(
    (set, get) => ({
      shifts: [],
      loading: false,

      loadShifts: (storeId: string) => {
        // Already in memory via persist — filter by store
        const all = get().shifts.filter(s => s.store_id === storeId)
        set({ shifts: all.length ? get().shifts : get().shifts })
      },

      addShift: (data) => {
        const now = new Date().toISOString()
        const shift: Shift = {
          ...data,
          id: generateUUID(),
          created_at: now,
          updated_at: now,
        }
        set(state => ({ shifts: [...state.shifts, shift] }))
        return shift
      },

      updateShift: (id, updates) => {
        set(state => ({
          shifts: state.shifts.map(s =>
            s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
          ),
        }))
      },

      deleteShift: (id) => {
        set(state => ({ shifts: state.shifts.filter(s => s.id !== id) }))
      },

      getWeekShifts: (weekStart: string) => {
        const end = getWeekEnd(weekStart)
        return get().shifts.filter(s => s.date >= weekStart && s.date <= end)
      },
    }),
    {
      name: 'pos-schedule-storage',
      partialize: (state) => ({ shifts: state.shifts }),
    }
  )
)
