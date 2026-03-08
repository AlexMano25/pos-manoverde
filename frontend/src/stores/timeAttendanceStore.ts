import { create } from 'zustand'
import type { TimeEntry, ClockStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface TimeAttendanceState {
  entries: TimeEntry[]
  loading: boolean
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface TimeAttendanceActions {
  loadEntries: (storeId: string) => Promise<void>
  clockIn: (storeId: string, userId: string, userName: string) => Promise<TimeEntry>
  clockOut: (id: string) => Promise<void>
  startBreak: (id: string) => Promise<void>
  endBreak: (id: string) => Promise<void>
  addEntry: (
    storeId: string,
    data: Omit<TimeEntry, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<TimeEntry>
  updateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  getTodayEntries: (storeId: string) => TimeEntry[]
  getWeeklyReport: (storeId: string) => TimeEntry[]
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function calculateTotalHours(entry: TimeEntry): number {
  const clockIn = new Date(entry.clock_in).getTime()
  const clockOut = new Date(entry.clock_out!).getTime()
  let totalMs = clockOut - clockIn

  if (entry.break_start && entry.break_end) {
    const breakStart = new Date(entry.break_start).getTime()
    const breakEnd = new Date(entry.break_end).getTime()
    totalMs -= breakEnd - breakStart
  }

  return Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100
}

function getStartOfToday(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

function getStartOfWeek(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useTimeAttendanceStore = create<TimeAttendanceState & TimeAttendanceActions>()(
  (set, get) => ({
    entries: [],
    loading: false,

    loadEntries: async (storeId: string) => {
      set({ loading: true })
      try {
        const entries = await db.time_entries
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        entries.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ entries })
      } catch (error) {
        console.error('[timeAttendanceStore] Failed to load entries:', error)
      } finally {
        set({ loading: false })
      }
    },

    clockIn: async (storeId, userId, userName) => {
      const now = new Date().toISOString()

      const entry: TimeEntry = {
        id: generateUUID(),
        store_id: storeId,
        user_id: userId,
        user_name: userName,
        clock_in: now,
        status: 'clocked_in' as ClockStatus,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.time_entries.add(entry)
      await addToSyncQueue('time_entry', entry.id, 'create', entry, storeId)

      set((state) => ({
        entries: [entry, ...state.entries],
      }))
      return entry
    },

    clockOut: async (id) => {
      const now = new Date().toISOString()
      const entry = await db.time_entries.get(id)
      if (!entry) return

      const updates: Partial<TimeEntry> = {
        clock_out: now,
        status: 'clocked_out' as ClockStatus,
        updated_at: now,
      }

      // Calculate total hours
      const merged = { ...entry, ...updates }
      updates.total_hours = calculateTotalHours(merged as TimeEntry)

      await db.time_entries.update(id, updates)

      const updated = await db.time_entries.get(id)
      if (updated) {
        await addToSyncQueue('time_entry', id, 'update', updated, updated.store_id)
      }

      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      }))
    },

    startBreak: async (id) => {
      const now = new Date().toISOString()
      const updates: Partial<TimeEntry> = {
        break_start: now,
        status: 'on_break' as ClockStatus,
        updated_at: now,
      }

      await db.time_entries.update(id, updates)

      const entry = await db.time_entries.get(id)
      if (entry) {
        await addToSyncQueue('time_entry', id, 'update', entry, entry.store_id)
      }

      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      }))
    },

    endBreak: async (id) => {
      const now = new Date().toISOString()
      const updates: Partial<TimeEntry> = {
        break_end: now,
        status: 'clocked_in' as ClockStatus,
        updated_at: now,
      }

      await db.time_entries.update(id, updates)

      const entry = await db.time_entries.get(id)
      if (entry) {
        await addToSyncQueue('time_entry', id, 'update', entry, entry.store_id)
      }

      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      }))
    },

    addEntry: async (storeId, data) => {
      const now = new Date().toISOString()

      const entry: TimeEntry = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.time_entries.add(entry)
      await addToSyncQueue('time_entry', entry.id, 'create', entry, storeId)

      set((state) => ({
        entries: [entry, ...state.entries],
      }))
      return entry
    },

    updateEntry: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.time_entries.update(id, merged)

      const entry = await db.time_entries.get(id)
      if (entry) {
        await addToSyncQueue('time_entry', id, 'update', entry, entry.store_id)
      }

      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, ...merged } : e
        ),
      }))
    },

    deleteEntry: async (id) => {
      const entry = await db.time_entries.get(id)
      await db.time_entries.delete(id)
      if (entry) {
        await addToSyncQueue('time_entry', id, 'delete', entry, entry.store_id)
      }
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      }))
    },

    getTodayEntries: (storeId) => {
      const todayStart = getStartOfToday()
      return get().entries.filter(
        (e) => e.store_id === storeId && e.created_at >= todayStart
      )
    },

    getWeeklyReport: (storeId) => {
      const weekStart = getStartOfWeek()
      return get().entries.filter(
        (e) => e.store_id === storeId && e.created_at >= weekStart
      )
    },
  })
)
