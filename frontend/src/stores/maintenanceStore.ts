import { create } from 'zustand'
import type { MaintenanceTask, MaintenanceStatus, MaintenanceType, MaintenancePriority, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface MaintenanceState {
  tasks: MaintenanceTask[]
  loading: boolean
  filterStatus: MaintenanceStatus | 'all'
  filterType: MaintenanceType | 'all'
  filterPriority: MaintenancePriority | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface MaintenanceActions {
  loadTasks: (storeId: string) => Promise<void>
  addTask: (
    storeId: string,
    data: Omit<MaintenanceTask, 'id' | 'store_id' | 'task_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<MaintenanceTask>
  updateTask: (id: string, updates: Partial<MaintenanceTask>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  startTask: (id: string) => Promise<void>
  completeTask: (id: string, completedBy: string, completedByName: string, cost?: number) => Promise<void>
  cancelTask: (id: string) => Promise<void>
  getOverdueTasks: (storeId: string) => MaintenanceTask[]
  getMonthlyCost: (storeId: string) => number
  setFilterStatus: (status: MaintenanceStatus | 'all') => void
  setFilterType: (type: MaintenanceType | 'all') => void
  setFilterPriority: (priority: MaintenancePriority | 'all') => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
  return { start, end }
}

async function generateTaskNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const count = await db.maintenance_tasks.where('store_id').equals(storeId).count()
  const seq = String(count + 1).padStart(3, '0')
  return `MT-${yy}${mm}${dd}-${seq}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useMaintenanceStore = create<MaintenanceState & MaintenanceActions>()(
  (set, get) => ({
    tasks: [],
    loading: false,
    filterStatus: 'all',
    filterType: 'all',
    filterPriority: 'all',

    loadTasks: async (storeId: string) => {
      set({ loading: true })
      try {
        const tasks = await db.maintenance_tasks
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by scheduled_date descending (newest first)
        tasks.sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
        set({ tasks })
      } catch (error) {
        console.error('[maintenanceStore] Failed to load tasks:', error)
      } finally {
        set({ loading: false })
      }
    },

    addTask: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const task_number = await generateTaskNumber(storeId)

        const task: MaintenanceTask = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          task_number,
          synced: false,
          created_at: now,
          updated_at: now,
        }

        await db.maintenance_tasks.add(task)
        await addToSyncQueue('maintenance_task', task.id, 'create', task, storeId)

        set((state) => ({
          tasks: [task, ...state.tasks],
        }))
        return task
      } catch (error) {
        console.error('[maintenanceStore] Failed to add task:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    updateTask: async (id, updates) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.maintenance_tasks.update(id, merged)

        const task = await db.maintenance_tasks.get(id)
        if (task) {
          await addToSyncQueue('maintenance_task', id, 'update', task, task.store_id)
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...merged } : t
          ),
        }))
      } catch (error) {
        console.error('[maintenanceStore] Failed to update task:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    deleteTask: async (id) => {
      set({ loading: true })
      try {
        const task = await db.maintenance_tasks.get(id)
        await db.maintenance_tasks.delete(id)
        if (task) {
          await addToSyncQueue('maintenance_task', id, 'delete', task, task.store_id)
        }
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }))
      } catch (error) {
        console.error('[maintenanceStore] Failed to delete task:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    startTask: async (id) => {
      try {
        await get().updateTask(id, {
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('[maintenanceStore] Failed to start task:', error)
        throw error
      }
    },

    completeTask: async (id, completedBy, completedByName, cost) => {
      try {
        const updates: Partial<MaintenanceTask> = {
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: completedBy,
          completed_by_name: completedByName,
        }
        if (cost !== undefined) {
          updates.cost = cost
        }
        await get().updateTask(id, updates)
      } catch (error) {
        console.error('[maintenanceStore] Failed to complete task:', error)
        throw error
      }
    },

    cancelTask: async (id) => {
      try {
        await get().updateTask(id, {
          status: 'cancelled',
        })
      } catch (error) {
        console.error('[maintenanceStore] Failed to cancel task:', error)
        throw error
      }
    },

    getOverdueTasks: (storeId) => {
      const now = new Date().toISOString()
      return get().tasks.filter(
        (t) =>
          t.store_id === storeId &&
          t.due_date &&
          t.due_date < now &&
          t.status !== 'completed' &&
          t.status !== 'cancelled'
      )
    },

    getMonthlyCost: (storeId) => {
      const { start, end } = getCurrentMonthRange()
      return get()
        .tasks.filter(
          (t) =>
            t.store_id === storeId &&
            t.status === 'completed' &&
            t.completed_at &&
            t.completed_at >= start &&
            t.completed_at <= end
        )
        .reduce((sum, t) => sum + (t.cost || 0), 0)
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },

    setFilterType: (type) => {
      set({ filterType: type })
    },

    setFilterPriority: (priority) => {
      set({ filterPriority: priority })
    },
  })
)

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
