import { create } from 'zustand'
import type { AuditLog, AuditAction, AuditModule } from '../types'
import { db } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface AuditState {
  logs: AuditLog[]
  loading: boolean
  filterAction: AuditAction | 'all'
  filterModule: AuditModule | 'all'
  filterUser: string | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface AuditActions {
  loadLogs: (storeId: string) => Promise<void>
  addLog: (
    storeId: string,
    data: Omit<AuditLog, 'id' | 'store_id' | 'created_at'>
  ) => Promise<void>
  clearLogs: (storeId: string) => Promise<void>
  getLogsByDateRange: (storeId: string, from: string, to: string) => AuditLog[]
  getTodayStats: (storeId: string) => { totalActions: number; uniqueUsers: number; criticalActions: number }
  setFilterAction: (action: AuditAction | 'all') => void
  setFilterModule: (module: AuditModule | 'all') => void
  setFilterUser: (userId: string | 'all') => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CRITICAL_ACTIONS: AuditAction[] = ['delete', 'void', 'refund', 'settings_change']

function getTodayRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
  return { start, end }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAuditStore = create<AuditState & AuditActions>()(
  (set, get) => ({
    logs: [],
    loading: false,
    filterAction: 'all',
    filterModule: 'all',
    filterUser: 'all',

    loadLogs: async (storeId: string) => {
      set({ loading: true })
      try {
        const logs = await db.audit_logs
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first) and limit to 500
        logs.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ logs: logs.slice(0, 500) })
      } catch (error) {
        console.error('[auditStore] Failed to load logs:', error)
      } finally {
        set({ loading: false })
      }
    },

    addLog: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()

        const log: AuditLog = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          created_at: now,
        }

        await db.audit_logs.add(log)
        await get().loadLogs(storeId)
      } catch (error) {
        console.error('[auditStore] Failed to add log:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    clearLogs: async (storeId: string) => {
      set({ loading: true })
      try {
        const ids = await db.audit_logs
          .where('store_id')
          .equals(storeId)
          .primaryKeys()
        await db.audit_logs.bulkDelete(ids)
        await get().loadLogs(storeId)
      } catch (error) {
        console.error('[auditStore] Failed to clear logs:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    getLogsByDateRange: (storeId: string, from: string, to: string) => {
      return get().logs.filter(
        (l) =>
          l.store_id === storeId &&
          l.created_at >= from &&
          l.created_at <= to
      )
    },

    getTodayStats: (storeId: string) => {
      const { start, end } = getTodayRange()
      const todayLogs = get().logs.filter(
        (l) =>
          l.store_id === storeId &&
          l.created_at >= start &&
          l.created_at <= end
      )

      const uniqueUsers = new Set(todayLogs.map((l) => l.user_id)).size
      const criticalActions = todayLogs.filter((l) =>
        CRITICAL_ACTIONS.includes(l.action)
      ).length

      return {
        totalActions: todayLogs.length,
        uniqueUsers,
        criticalActions,
      }
    },

    setFilterAction: (action) => {
      set({ filterAction: action })
    },

    setFilterModule: (module) => {
      set({ filterModule: module })
    },

    setFilterUser: (userId) => {
      set({ filterUser: userId })
    },
  })
)
