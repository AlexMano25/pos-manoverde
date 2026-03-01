import { create } from 'zustand'
import type { SyncEntry } from '../types'
import { db } from '../db/dexie'

// ── State ────────────────────────────────────────────────────────────────────

interface SyncState {
  pendingCount: number
  lastSyncAt: string | null
  isSyncing: boolean
  syncError: string | null
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface SyncActions {
  countPending: () => Promise<void>
  syncToServer: () => Promise<void>
  syncFromServer: () => Promise<void>
  markSynced: (ids: string[]) => Promise<void>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getServerUrl(): string {
  try {
    const stored = localStorage.getItem('pos-app-store')
    if (!stored) return '/api'
    const parsed = JSON.parse(stored)
    return parsed?.state?.serverUrl || '/api'
  } catch {
    return '/api'
  }
}

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('pos-auth-store')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed?.state?.token || null
  } catch {
    return null
  }
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useSyncStore = create<SyncState & SyncActions>()((set, get) => ({
  // State
  pendingCount: 0,
  lastSyncAt: null,
  isSyncing: false,
  syncError: null,

  // Actions
  countPending: async () => {
    try {
      // Pending = entries that have no synced_at timestamp
      const all = await db.sync_queue.toArray()
      const count = all.filter((entry) => !entry.synced_at).length
      set({ pendingCount: count })
    } catch (error) {
      console.error('[syncStore] Failed to count pending:', error)
    }
  },

  syncToServer: async () => {
    const { isSyncing } = get()
    if (isSyncing) return

    set({ isSyncing: true, syncError: null })

    try {
      // Get all unsynced entries (no synced_at)
      const allEntries = await db.sync_queue.toArray()
      const pendingEntries: SyncEntry[] = allEntries.filter(
        (e) => !e.synced_at
      )

      if (pendingEntries.length === 0) {
        set({
          isSyncing: false,
          pendingCount: 0,
          lastSyncAt: new Date().toISOString(),
        })
        return
      }

      const baseUrl = getServerUrl()

      // Send in batches of 50 to avoid request-size limits
      const batchSize = 50
      const syncedIds: string[] = []

      for (let i = 0; i < pendingEntries.length; i += batchSize) {
        const batch = pendingEntries.slice(i, i + batchSize)

        const response = await fetch(`${baseUrl}/sync/push`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ entries: batch }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))

          // Increment retry counter for each failed entry
          await db.transaction('rw', db.sync_queue, async () => {
            for (const entry of batch) {
              await db.sync_queue.update(entry.id, {
                retries: entry.retries + 1,
              })
            }
          })

          throw new Error(
            errorData.message || `Sync failed with status ${response.status}`
          )
        }

        const result = await response.json()

        // Collect successfully synced IDs
        if (result.synced_ids && Array.isArray(result.synced_ids)) {
          syncedIds.push(...(result.synced_ids as string[]))
        } else {
          // If server doesn't return specific IDs, assume entire batch succeeded
          syncedIds.push(...batch.map((e) => e.id))
        }
      }

      // Mark synced entries
      if (syncedIds.length > 0) {
        await get().markSynced(syncedIds)
      }

      // Refresh pending count
      await get().countPending()

      set({ lastSyncAt: new Date().toISOString() })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown sync error'
      console.error('[syncStore] Sync to server failed:', message)
      set({ syncError: message })
      // Never delete pending entries on error -- preserve data
    } finally {
      set({ isSyncing: false })
    }
  },

  syncFromServer: async () => {
    const { isSyncing } = get()
    if (isSyncing) return

    set({ isSyncing: true, syncError: null })

    try {
      const baseUrl = getServerUrl()
      const lastSync = get().lastSyncAt

      const params = new URLSearchParams()
      if (lastSync) {
        params.set('since', lastSync)
      }

      const response = await fetch(
        `${baseUrl}/sync/pull?${params.toString()}`,
        {
          method: 'GET',
          headers: authHeaders(),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || `Pull failed with status ${response.status}`
        )
      }

      const data = await response.json()

      // Apply server data to local Dexie tables
      await db.transaction(
        'rw',
        db.products,
        db.orders,
        db.stock_moves,
        db.users,
        async () => {
          if (data.products && Array.isArray(data.products)) {
            for (const product of data.products) {
              await db.products.put(product)
            }
          }

          if (data.orders && Array.isArray(data.orders)) {
            for (const order of data.orders) {
              await db.orders.put({ ...order, synced: true })
            }
          }

          if (data.stock_moves && Array.isArray(data.stock_moves)) {
            for (const move of data.stock_moves) {
              await db.stock_moves.put({ ...move, synced: true })
            }
          }

          if (data.users && Array.isArray(data.users)) {
            for (const user of data.users) {
              await db.users.put(user)
            }
          }
        }
      )

      set({ lastSyncAt: new Date().toISOString() })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown pull error'
      console.error('[syncStore] Sync from server failed:', message)
      set({ syncError: message })
    } finally {
      set({ isSyncing: false })
    }
  },

  markSynced: async (ids: string[]) => {
    try {
      const now = new Date().toISOString()

      await db.transaction('rw', db.sync_queue, async () => {
        for (const id of ids) {
          await db.sync_queue.update(id, { synced_at: now })
        }
      })

      // Also mark corresponding entities as synced in their own tables
      const entries = await db.sync_queue.bulkGet(ids)
      await db.transaction('rw', db.orders, db.stock_moves, async () => {
        for (const entry of entries) {
          if (!entry) continue
          if (entry.entity_type === 'order') {
            await db.orders
              .update(entry.entity_id, { synced: true })
              .catch(() => {
                // Entity may have been deleted; ignore
              })
          } else if (entry.entity_type === 'stock_move') {
            await db.stock_moves
              .update(entry.entity_id, { synced: true })
              .catch(() => {})
          }
        }
      })

      // Refresh pending count
      await get().countPending()
    } catch (error) {
      console.error('[syncStore] Failed to mark entries as synced:', error)
      throw error
    }
  },
}))
