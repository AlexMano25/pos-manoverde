import { create } from 'zustand'
import type {
  CashSession,
  CashSessionStatus,
  CashMovementType,
  CashMovement,
  DenominationCount,
  SyncEntry,
} from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface CashRegisterState {
  sessions: CashSession[]
  currentSession: CashSession | null
  loading: boolean
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface CashRegisterActions {
  loadSessions: (storeId: string) => Promise<void>
  getCurrentSession: (storeId: string) => Promise<CashSession | null>
  openSession: (
    storeId: string,
    userId: string,
    userName: string,
    openingFloat: number
  ) => Promise<CashSession>
  closeSession: (
    sessionId: string,
    closingCount: DenominationCount[],
    notes?: string
  ) => Promise<void>
  addMovement: (
    sessionId: string,
    type: CashMovementType,
    amount: number,
    reason: string,
    userId: string,
    userName: string
  ) => Promise<void>
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

// ── Store ────────────────────────────────────────────────────────────────────

export const useCashRegisterStore = create<CashRegisterState & CashRegisterActions>()(
  (set) => ({
    sessions: [],
    currentSession: null,
    loading: false,

    loadSessions: async (storeId: string) => {
      set({ loading: true })
      try {
        const sessions = await db.cash_sessions
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by opened_at descending (newest first)
        sessions.sort((a, b) => b.opened_at.localeCompare(a.opened_at))
        // Find open session
        const currentSession = sessions.find((s) => s.status === 'open') || null
        set({ sessions, currentSession })
      } catch (error) {
        console.error('[cashRegisterStore] Failed to load sessions:', error)
      } finally {
        set({ loading: false })
      }
    },

    getCurrentSession: async (storeId: string) => {
      try {
        const sessions = await db.cash_sessions
          .where({ store_id: storeId, status: 'open' as CashSessionStatus })
          .toArray()
        const current = sessions.length > 0 ? sessions[0] : null
        set({ currentSession: current })
        return current
      } catch (error) {
        console.error('[cashRegisterStore] Failed to get current session:', error)
        return null
      }
    },

    openSession: async (storeId, userId, userName, openingFloat) => {
      const now = new Date().toISOString()
      const session: CashSession = {
        id: generateUUID(),
        store_id: storeId,
        user_id: userId,
        user_name: userName,
        status: 'open',
        opening_float: openingFloat,
        closing_count: [],
        closing_total: 0,
        cash_sales_total: 0,
        expected_cash: 0,
        discrepancy: 0,
        cash_movements: [],
        opened_at: now,
        notes: undefined,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.cash_sessions.add(session)
      await addToSyncQueue('cash_session', session.id, 'create', session, storeId)

      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSession: session,
      }))

      return session
    },

    closeSession: async (sessionId, closingCount, notes) => {
      const session = await db.cash_sessions.get(sessionId)
      if (!session) return

      const now = new Date().toISOString()

      // Calculate closing_total from denomination counts
      const closingTotal = closingCount.reduce((sum, d) => sum + d.total, 0)

      // Calculate cash_sales_total from orders
      const orders = await db.orders
        .where('store_id')
        .equals(session.store_id)
        .filter(
          (o) =>
            o.created_at >= session.opened_at &&
            o.created_at <= now &&
            o.status === 'paid' &&
            o.payment_method === 'cash'
        )
        .toArray()
      const cashSalesTotal = orders.reduce((sum, o) => sum + o.total, 0)

      // Calculate expected cash from movements
      const movements = session.cash_movements || []
      let movementIn = 0
      let movementOut = 0
      for (const m of movements) {
        if (m.type === 'cash_in' || m.type === 'tip') {
          movementIn += m.amount
        } else if (m.type === 'cash_out' || m.type === 'petty_cash' || m.type === 'return') {
          movementOut += m.amount
        }
      }

      const expectedCash = session.opening_float + cashSalesTotal + movementIn - movementOut
      const discrepancy = closingTotal - expectedCash

      const updates: Partial<CashSession> = {
        status: 'closed' as CashSessionStatus,
        closed_at: now,
        closing_count: closingCount,
        closing_total: closingTotal,
        cash_sales_total: cashSalesTotal,
        expected_cash: expectedCash,
        discrepancy,
        notes: notes || session.notes,
        updated_at: now,
      }

      await db.cash_sessions.update(sessionId, updates)

      const updatedSession = await db.cash_sessions.get(sessionId)
      if (updatedSession) {
        await addToSyncQueue(
          'cash_session',
          sessionId,
          'update',
          updatedSession,
          session.store_id
        )
      }

      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, ...updates } : s
        ),
        currentSession: null,
      }))
    },

    addMovement: async (sessionId, type, amount, reason, userId, userName) => {
      const session = await db.cash_sessions.get(sessionId)
      if (!session) return

      const now = new Date().toISOString()

      const movement: CashMovement = {
        id: generateUUID(),
        type,
        amount,
        reason,
        user_id: userId,
        user_name: userName,
        created_at: now,
      }

      const updatedMovements = [...(session.cash_movements || []), movement]

      await db.cash_sessions.update(sessionId, {
        cash_movements: updatedMovements,
        updated_at: now,
      })

      const updatedSession = await db.cash_sessions.get(sessionId)
      if (updatedSession) {
        await addToSyncQueue(
          'cash_session',
          sessionId,
          'update',
          updatedSession,
          session.store_id
        )
      }

      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, cash_movements: updatedMovements, updated_at: now }
            : s
        ),
        currentSession:
          state.currentSession?.id === sessionId
            ? { ...state.currentSession, cash_movements: updatedMovements, updated_at: now }
            : state.currentSession,
      }))
    },
  })
)
