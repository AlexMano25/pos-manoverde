import { create } from 'zustand'
import type { KioskSession, KioskSessionStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface SelfCheckoutState {
  sessions: KioskSession[]
  loading: boolean
  filterStatus: KioskSessionStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface SelfCheckoutActions {
  loadSessions: (storeId: string) => Promise<void>
  addSession: (
    storeId: string,
    data: Omit<KioskSession, 'id' | 'store_id' | 'session_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<KioskSession>
  updateSession: (id: string, updates: Partial<KioskSession>) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  completeSession: (id: string, orderId?: string) => Promise<void>
  abandonSession: (id: string) => Promise<void>
  cancelSession: (id: string) => Promise<void>
  getTodayRevenue: () => number
  getActiveCount: () => number
  setFilterStatus: (status: KioskSessionStatus | 'all') => void
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

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

async function generateSessionNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const todayPrefix = `KS-${yy}${mm}${dd}-`

  // Count today's sessions to generate sequence number
  const allSessions = await db.kiosk_sessions
    .where('store_id')
    .equals(storeId)
    .toArray()

  const todayStr = now.toISOString().slice(0, 10)
  const todayCount = allSessions.filter(
    (s) => s.created_at.slice(0, 10) === todayStr
  ).length

  const seq = String(todayCount + 1).padStart(3, '0')
  return `${todayPrefix}${seq}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useSelfCheckoutStore = create<SelfCheckoutState & SelfCheckoutActions>()(
  (set, get) => ({
    sessions: [],
    loading: false,
    filterStatus: 'all',

    loadSessions: async (storeId: string) => {
      set({ loading: true })
      try {
        const sessions = await db.kiosk_sessions
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        sessions.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ sessions })
      } catch (error) {
        console.error('[selfCheckoutStore] Failed to load sessions:', error)
      } finally {
        set({ loading: false })
      }
    },

    addSession: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const session_number = await generateSessionNumber(storeId)

        const session: KioskSession = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          session_number,
          synced: false,
          created_at: now,
          updated_at: now,
        }

        await db.kiosk_sessions.add(session)
        await addToSyncQueue('kiosk_session', session.id, 'create', session, storeId)

        set((state) => ({
          sessions: [session, ...state.sessions],
        }))
        return session
      } catch (error) {
        console.error('[selfCheckoutStore] Failed to add session:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    updateSession: async (id, updates) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.kiosk_sessions.update(id, merged)

        const session = await db.kiosk_sessions.get(id)
        if (session) {
          await addToSyncQueue('kiosk_session', id, 'update', session, session.store_id)
        }

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...merged } : s
          ),
        }))
      } catch (error) {
        console.error('[selfCheckoutStore] Failed to update session:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    deleteSession: async (id) => {
      set({ loading: true })
      try {
        const session = await db.kiosk_sessions.get(id)
        await db.kiosk_sessions.delete(id)
        if (session) {
          await addToSyncQueue('kiosk_session', id, 'delete', session, session.store_id)
        }
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }))
      } catch (error) {
        console.error('[selfCheckoutStore] Failed to delete session:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    completeSession: async (id, orderId) => {
      try {
        const updates: Partial<KioskSession> = {
          status: 'completed',
          payment_status: 'paid',
          completed_at: new Date().toISOString(),
        }
        if (orderId !== undefined) {
          updates.order_id = orderId
        }
        await get().updateSession(id, updates)
      } catch (error) {
        console.error('[selfCheckoutStore] Failed to complete session:', error)
        throw error
      }
    },

    abandonSession: async (id) => {
      try {
        await get().updateSession(id, {
          status: 'abandoned',
          completed_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('[selfCheckoutStore] Failed to abandon session:', error)
        throw error
      }
    },

    cancelSession: async (id) => {
      try {
        await get().updateSession(id, {
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('[selfCheckoutStore] Failed to cancel session:', error)
        throw error
      }
    },

    getTodayRevenue: (): number => {
      const today = getTodayDateString()
      return get()
        .sessions.filter(
          (s) =>
            s.created_at.slice(0, 10) === today &&
            s.status === 'completed' &&
            s.payment_status === 'paid'
        )
        .reduce((sum, s) => sum + s.total, 0)
    },

    getActiveCount: (): number => {
      return get().sessions.filter((s) => s.status === 'active').length
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
