import { create } from 'zustand'
import type { Appointment, AppointmentStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface AppointmentState {
  appointments: Appointment[]
  loading: boolean
  selectedDate: string
  viewMode: 'day' | 'week' | 'list'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface AppointmentActions {
  loadAppointments: (storeId: string) => Promise<void>
  addAppointment: (
    storeId: string,
    data: Omit<Appointment, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<Appointment>
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  setStatus: (id: string, status: AppointmentStatus) => Promise<void>
  getAppointmentsByDate: (date: string) => Appointment[]
  getAvailableSlots: (storeId: string, date: string, durationMinutes: number) => string[]
  setSelectedDate: (date: string) => void
  setViewMode: (mode: 'day' | 'week' | 'list') => void
}

// ── Sync helper ──────────────────────────────────────────────────────────────

async function addToSyncQueue(
  entityType: SyncEntry['entity_type'],
  entityId: string,
  operation: SyncEntry['operation'],
  entity: unknown,
  storeId: string
): Promise<void> {
  const entry: SyncEntry = {
    id: generateUUID(),
    entity_type: entityType,
    entity_id: entityId,
    operation,
    data: JSON.stringify(entity),
    device_id: getDeviceId(),
    store_id: storeId,
    retries: 0,
    created_at: new Date().toISOString(),
  }
  await db.sync_queue.add(entry)
}

// ── Helper: today as YYYY-MM-DD ─────────────────────────────────────────────

function todayString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAppointmentStore = create<AppointmentState & AppointmentActions>()(
  (set, get) => ({
    appointments: [],
    loading: false,
    selectedDate: todayString(),
    viewMode: 'list',

    loadAppointments: async (storeId: string) => {
      set({ loading: true })
      try {
        const appointments = await db.appointments
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by date then time_start
        appointments.sort((a, b) => {
          const dateCmp = a.date.localeCompare(b.date)
          if (dateCmp !== 0) return dateCmp
          return a.time_start.localeCompare(b.time_start)
        })
        set({ appointments })
      } catch (error) {
        console.error('[appointmentStore] Failed to load appointments:', error)
      } finally {
        set({ loading: false })
      }
    },

    addAppointment: async (storeId, data) => {
      const now = new Date().toISOString()
      const appointment: Appointment = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.appointments.add(appointment)
      await addToSyncQueue('appointment', appointment.id, 'create', appointment, storeId)

      set((state) => ({
        appointments: [...state.appointments, appointment].sort((a, b) => {
          const dateCmp = a.date.localeCompare(b.date)
          if (dateCmp !== 0) return dateCmp
          return a.time_start.localeCompare(b.time_start)
        }),
      }))
      return appointment
    },

    updateAppointment: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.appointments.update(id, merged)

      const appointment = await db.appointments.get(id)
      if (appointment) {
        await addToSyncQueue('appointment', id, 'update', appointment, appointment.store_id)
      }

      set((state) => ({
        appointments: state.appointments
          .map((a) => (a.id === id ? { ...a, ...merged } : a))
          .sort((a, b) => {
            const dateCmp = a.date.localeCompare(b.date)
            if (dateCmp !== 0) return dateCmp
            return a.time_start.localeCompare(b.time_start)
          }),
      }))
    },

    deleteAppointment: async (id) => {
      const appointment = await db.appointments.get(id)
      await db.appointments.delete(id)
      if (appointment) {
        await addToSyncQueue('appointment', id, 'delete', appointment, appointment.store_id)
      }
      set((state) => ({
        appointments: state.appointments.filter((a) => a.id !== id),
      }))
    },

    setStatus: async (id, status) => {
      await get().updateAppointment(id, { status })
    },

    getAppointmentsByDate: (date) => {
      return get().appointments.filter((a) => a.date === date)
    },

    getAvailableSlots: (storeId, date, durationMinutes) => {
      const booked = get().appointments.filter(
        (a) =>
          a.store_id === storeId &&
          a.date === date &&
          a.status !== 'cancelled' &&
          a.status !== 'no_show'
      )

      // Generate all 30min slots from 08:00 to 20:00
      const slots: string[] = []
      const startHour = 8
      const endHour = 20

      for (let h = startHour; h < endHour; h++) {
        for (const m of [0, 30]) {
          const slotStart = h * 60 + m
          const slotEnd = slotStart + durationMinutes

          // Don't exceed end of day (20:00)
          if (slotEnd > endHour * 60) continue

          // Check if this slot overlaps with any booked appointment
          const overlaps = booked.some((appt) => {
            const [apptStartH, apptStartM] = appt.time_start.split(':').map(Number)
            const [apptEndH, apptEndM] = appt.time_end.split(':').map(Number)
            const apptStart = apptStartH * 60 + apptStartM
            const apptEnd = apptEndH * 60 + apptEndM
            return slotStart < apptEnd && slotEnd > apptStart
          })

          if (!overlaps) {
            const hh = String(Math.floor(slotStart / 60)).padStart(2, '0')
            const mm = String(slotStart % 60).padStart(2, '0')
            slots.push(`${hh}:${mm}`)
          }
        }
      }

      return slots
    },

    setSelectedDate: (date) => {
      set({ selectedDate: date })
    },

    setViewMode: (mode) => {
      set({ viewMode: mode })
    },
  })
)
