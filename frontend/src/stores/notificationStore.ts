import { create } from 'zustand'
import type { PosNotification, NotificationType, NotificationPriority, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface NotificationState {
  notifications: PosNotification[]
  loading: boolean
  filterType: NotificationType | 'all'
  filterPriority: NotificationPriority | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface NotificationActions {
  loadNotifications: (storeId: string) => Promise<void>
  addNotification: (
    storeId: string,
    data: Omit<PosNotification, 'id' | 'store_id' | 'is_read' | 'is_dismissed' | 'synced' | 'created_at'>
  ) => Promise<PosNotification>
  markRead: (id: string) => Promise<void>
  markAllRead: (storeId: string) => Promise<void>
  dismissNotification: (id: string) => Promise<void>
  dismissAll: (storeId: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  getUnreadCount: (storeId: string) => number
  setFilterType: (type: NotificationType | 'all') => void
  setFilterPriority: (priority: NotificationPriority | 'all') => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  (set, get) => ({
    notifications: [],
    loading: false,
    filterType: 'all',
    filterPriority: 'all',

    loadNotifications: async (storeId: string) => {
      set({ loading: true })
      try {
        const notifications = await db.notifications
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        notifications.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ notifications })
      } catch (error) {
        console.error('[notificationStore] Failed to load notifications:', error)
      } finally {
        set({ loading: false })
      }
    },

    addNotification: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()

        const notification: PosNotification = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          is_read: false,
          is_dismissed: false,
          synced: false,
          created_at: now,
        }

        await db.notifications.add(notification)
        await addToSyncQueue('notification', notification.id, 'create', notification, storeId)

        await get().loadNotifications(storeId)
        return notification
      } catch (error) {
        console.error('[notificationStore] Failed to add notification:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    markRead: async (id: string) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        await db.notifications.update(id, { is_read: true, read_at: now })

        const notification = await db.notifications.get(id)
        if (notification) {
          await addToSyncQueue('notification', id, 'update', notification, notification.store_id)
          await get().loadNotifications(notification.store_id)
        }
      } catch (error) {
        console.error('[notificationStore] Failed to mark notification as read:', error)
      } finally {
        set({ loading: false })
      }
    },

    markAllRead: async (storeId: string) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const unread = await db.notifications
          .where('[store_id+is_read]')
          .equals([storeId, 0])
          .toArray()

        for (const n of unread) {
          await db.notifications.update(n.id, { is_read: true, read_at: now })
          const updated = { ...n, is_read: true, read_at: now }
          await addToSyncQueue('notification', n.id, 'update', updated, storeId)
        }

        await get().loadNotifications(storeId)
      } catch (error) {
        console.error('[notificationStore] Failed to mark all as read:', error)
      } finally {
        set({ loading: false })
      }
    },

    dismissNotification: async (id: string) => {
      set({ loading: true })
      try {
        await db.notifications.update(id, { is_dismissed: true })

        const notification = await db.notifications.get(id)
        if (notification) {
          await addToSyncQueue('notification', id, 'update', notification, notification.store_id)
          await get().loadNotifications(notification.store_id)
        }
      } catch (error) {
        console.error('[notificationStore] Failed to dismiss notification:', error)
      } finally {
        set({ loading: false })
      }
    },

    dismissAll: async (storeId: string) => {
      set({ loading: true })
      try {
        const all = await db.notifications
          .where('store_id')
          .equals(storeId)
          .toArray()

        const undismissed = all.filter((n) => !n.is_dismissed)

        for (const n of undismissed) {
          await db.notifications.update(n.id, { is_dismissed: true })
          const updated = { ...n, is_dismissed: true }
          await addToSyncQueue('notification', n.id, 'update', updated, storeId)
        }

        await get().loadNotifications(storeId)
      } catch (error) {
        console.error('[notificationStore] Failed to dismiss all notifications:', error)
      } finally {
        set({ loading: false })
      }
    },

    deleteNotification: async (id: string) => {
      set({ loading: true })
      try {
        const notification = await db.notifications.get(id)
        await db.notifications.delete(id)

        if (notification) {
          await addToSyncQueue('notification', id, 'delete', notification, notification.store_id)
          await get().loadNotifications(notification.store_id)
        }
      } catch (error) {
        console.error('[notificationStore] Failed to delete notification:', error)
      } finally {
        set({ loading: false })
      }
    },

    getUnreadCount: (storeId: string) => {
      return get().notifications.filter(
        (n) => n.store_id === storeId && !n.is_read && !n.is_dismissed
      ).length
    },

    setFilterType: (type) => {
      set({ filterType: type })
    },

    setFilterPriority: (priority) => {
      set({ filterPriority: priority })
    },
  })
)
