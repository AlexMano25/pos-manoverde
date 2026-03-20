import { create } from 'zustand'
import type { SyncEntry } from '../types'
import { db } from '../db/dexie'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { useAppStore } from './appStore'

// ── State ────────────────────────────────────────────────────────────────────

interface SyncState {
  pendingCount: number
  lastSyncAt: string | null
  isSyncing: boolean
  syncError: string | null
}

// ── Actions ──────────────────────────────────────────────────────────────────

export interface SyncEntityCount {
  orders: number
  products: number
  stock_moves: number
  users: number
}

export interface FailedSyncEntry {
  id: string
  entity_type: string
  entity_id: string
  operation: string
  retries: number
  created_at: string
  error?: string
}

interface SyncActions {
  countPending: () => Promise<void>
  syncToServer: () => Promise<void>
  syncFromServer: () => Promise<void>
  markSynced: (ids: string[]) => Promise<void>
  getFailedEntries: () => Promise<FailedSyncEntry[]>
  retryEntry: (id: string) => Promise<void>
  clearFailed: () => Promise<void>
  getPendingByEntity: () => Promise<SyncEntityCount>
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

function getStoreId(): string | null {
  try {
    const stored = localStorage.getItem('pos-auth-store')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed?.state?.user?.store_id || null
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

/**
 * Check if the local server is reachable (quick health check).
 * Verifies the response is JSON from the actual Express backend,
 * not an SPA fallback HTML page from Vite/Vercel.
 */
async function checkLocalServer(): Promise<boolean> {
  const baseUrl = getServerUrl()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeoutId)

    if (!response.ok) return false

    // Verify response is JSON from backend, not HTML from SPA fallback
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) return false

    const data = await response.json()
    return data && typeof data === 'object' && 'status' in data
  } catch {
    return false
  }
}

/**
 * Sync pending entries to Supabase cloud (PostgREST).
 * Processes each sync queue entry and applies it to Supabase tables.
 */
async function syncToCloud(entries: SyncEntry[]): Promise<string[]> {
  if (!supabase || entries.length === 0) return []

  const syncedIds: string[] = []

  for (const entry of entries) {
    try {
      let entityData: Record<string, unknown>
      try {
        entityData = JSON.parse(entry.data) as Record<string, unknown>
      } catch {
        console.warn(`[syncStore] Invalid JSON in sync entry ${entry.id}`)
        continue
      }

      let error: unknown = null

      switch (entry.entity_type) {
        case 'order': {
          // Strip fields that don't exist in Supabase orders table
          const od = entityData as any
          const orderClean: any = {
            id: od.id, store_id: od.store_id, items: od.items,
            subtotal: od.subtotal, discount: od.discount || 0, tax: od.tax || 0,
            total: od.total, payment_method: od.payment_method, status: od.status,
            amount_received: od.amount_received || 0, change_due: od.change_due || 0,
            device_id: od.device_id || null, receipt_number: od.receipt_number || null,
            created_at: od.created_at, updated_at: od.updated_at || new Date().toISOString(),
          }
          if (od.user_id && od.user_id.length === 36) orderClean.user_id = od.user_id
          if (entry.operation === 'create') {
            const { error: e } = await supabase.from('orders').upsert(orderClean as never)
            error = e
          } else if (entry.operation === 'update') {
            const { error: e } = await supabase
              .from('orders')
              .update(orderClean as never)
              .eq('id', entry.entity_id)
            error = e
          }
          break
        }
        case 'product': {
          if (entry.operation === 'create' || entry.operation === 'update') {
            const { error: e } = await supabase.from('products').upsert(entityData as never)
            error = e
          } else if (entry.operation === 'delete') {
            const { error: e } = await supabase
              .from('products')
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .eq('id', entry.entity_id)
            error = e
          }
          break
        }
        case 'stock_move': {
          if (entry.operation === 'create') {
            const { error: e } = await supabase.from('stock_moves').upsert(entityData as never)
            error = e
          }
          break
        }
        case 'user': {
          if (entry.operation === 'create' || entry.operation === 'update') {
            const { error: e } = await supabase.from('users').upsert(entityData as never)
            error = e
          }
          break
        }
        case 'customer': {
          if (entry.operation === 'create' || entry.operation === 'update') {
            const { error: e } = await supabase.from('customers').upsert(entityData as never)
            error = e
          } else if (entry.operation === 'delete') {
            const { error: e } = await supabase
              .from('customers')
              .delete()
              .eq('id', entry.entity_id)
            error = e
          }
          break
        }
        case 'kds_order': {
          if (entry.operation === 'create' || entry.operation === 'update') {
            const d = entityData as any
            const kdsClean = {
              id: d.id, store_id: d.store_id, order_number: d.order_number,
              table_name: d.table_number || d.table_name || null, status: d.status,
              priority: d.priority || false, items: d.items || [],
              created_at: d.created_at, updated_at: d.updated_at || new Date().toISOString(),
              started_at: d.started_at || null, completed_at: d.completed_at || null,
            }
            const { error: e } = await supabase.from('kds_orders').upsert(kdsClean as never)
            error = e
          } else if (entry.operation === 'delete') {
            const { error: e } = await supabase
              .from('kds_orders')
              .delete()
              .eq('id', entry.entity_id)
            error = e
          }
          break
        }
        case 'online_order': {
          if (entry.operation === 'create' || entry.operation === 'update') {
            const { error: e } = await supabase.from('online_orders').upsert(entityData as never)
            error = e
          } else if (entry.operation === 'delete') {
            const { error: e } = await supabase
              .from('online_orders')
              .delete()
              .eq('id', entry.entity_id)
            error = e
          }
          break
        }
        case 'notification': {
          if (entry.operation === 'create' || entry.operation === 'update') {
            const { error: e } = await supabase.from('notifications').upsert(entityData as never)
            error = e
          } else if (entry.operation === 'delete') {
            const { error: e } = await supabase
              .from('notifications')
              .delete()
              .eq('id', entry.entity_id)
            error = e
          }
          break
        }
      }

      if (!error) {
        syncedIds.push(entry.id)
      } else {
        console.warn(`[syncStore] Cloud sync failed for ${entry.entity_type}/${entry.entity_id}:`, error)
      }
    } catch (err) {
      console.warn(`[syncStore] Error syncing entry ${entry.id}:`, err)
    }
  }

  return syncedIds
}

/**
 * Pull data from Supabase cloud into IndexedDB.
 */
async function pullFromCloud(storeId: string, since?: string | null): Promise<void> {
  if (!supabase) return

  // Build query with optional since filter
  const productsQuery = supabase.from('products').select('*').eq('store_id', storeId)
  const ordersQuery = supabase.from('orders').select('*').eq('store_id', storeId)
    .order('created_at', { ascending: false }).limit(200)
  const usersQuery = supabase
    .from('users')
    .select('id, store_id, name, email, role, pin, phone, is_active, created_at, updated_at')
    .eq('store_id', storeId)

  // If we have a last sync timestamp, only fetch newer records
  if (since) {
    productsQuery.gte('updated_at', since)
    ordersQuery.gte('updated_at', since)
  }

  const [productsResult, ordersResult, usersResult] = await Promise.all([
    productsQuery,
    ordersQuery,
    usersQuery,
  ])

  // Apply to IndexedDB
  await db.transaction(
    'rw',
    db.products,
    db.orders,
    db.users,
    async () => {
      if (productsResult.data && productsResult.data.length > 0) {
        for (const product of productsResult.data) {
          await db.products.put(product)
        }
      }

      if (ordersResult.data && ordersResult.data.length > 0) {
        for (const order of ordersResult.data) {
          await db.orders.put({ ...order, synced: true })
        }
      }

      if (usersResult.data && usersResult.data.length > 0) {
        for (const user of usersResult.data) {
          await db.users.put(user)
        }
      }
    },
  )

  console.info(
    `[syncStore] Cloud pull: ${productsResult.data?.length ?? 0} products, ${ordersResult.data?.length ?? 0} orders`,
  )
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

      // For all_in_one mode, skip local server check and go directly to cloud
      const appMode = useAppStore.getState().mode
      const localAvailable = appMode === 'all_in_one' ? false : await checkLocalServer()

      if (localAvailable) {
        // ── Push to local server (existing behavior) ──
        const baseUrl = getServerUrl()
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

          if (result.synced_ids && Array.isArray(result.synced_ids)) {
            syncedIds.push(...(result.synced_ids as string[]))
          } else {
            syncedIds.push(...batch.map((e) => e.id))
          }
        }

        if (syncedIds.length > 0) {
          await get().markSynced(syncedIds)
        }
      } else if (isSupabaseConfigured && supabase) {
        // ── Fall back to Supabase cloud ──
        const syncedIds = await syncToCloud(pendingEntries)

        if (syncedIds.length > 0) {
          await get().markSynced(syncedIds)
        }
      } else {
        throw new Error('No server available for sync')
      }

      // Refresh pending count
      await get().countPending()
      set({ lastSyncAt: new Date().toISOString() })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown sync error'
      console.error('[syncStore] Sync to server failed:', message)
      set({ syncError: message })
    } finally {
      set({ isSyncing: false })
    }
  },

  syncFromServer: async () => {
    const { isSyncing } = get()
    if (isSyncing) return

    set({ isSyncing: true, syncError: null })

    try {
      // For all_in_one mode, skip local server check and go directly to cloud
      const appMode2 = useAppStore.getState().mode
      const localAvailable = appMode2 === 'all_in_one' ? false : await checkLocalServer()

      if (localAvailable) {
        // ── Pull from local server (existing behavior) ──
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
      } else if (isSupabaseConfigured && supabase) {
        // ── Fall back to Supabase cloud ──
        const storeId = getStoreId()
        if (!storeId) {
          throw new Error('No store_id available for cloud sync')
        }

        await pullFromCloud(storeId, get().lastSyncAt)
      } else {
        throw new Error('No server available for sync')
      }

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

  getFailedEntries: async (): Promise<FailedSyncEntry[]> => {
    try {
      const all = await db.sync_queue.toArray()
      return all
        .filter(e => !e.synced_at && e.retries >= 3)
        .map(e => ({
          id: e.id,
          entity_type: e.entity_type,
          entity_id: e.entity_id,
          operation: e.operation,
          retries: e.retries,
          created_at: e.created_at,
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } catch (error) {
      console.error('[syncStore] Failed to get failed entries:', error)
      return []
    }
  },

  retryEntry: async (id: string) => {
    try {
      // Reset retries to 0 so next sync picks it up
      await db.sync_queue.update(id, { retries: 0 })
      // Trigger sync
      await get().syncToServer()
    } catch (error) {
      console.error('[syncStore] Failed to retry entry:', error)
    }
  },

  clearFailed: async () => {
    try {
      const all = await db.sync_queue.toArray()
      const failedIds = all.filter(e => !e.synced_at && e.retries >= 3).map(e => e.id)
      if (failedIds.length > 0) {
        await db.sync_queue.bulkDelete(failedIds)
      }
      await get().countPending()
    } catch (error) {
      console.error('[syncStore] Failed to clear failed entries:', error)
    }
  },

  getPendingByEntity: async (): Promise<SyncEntityCount> => {
    try {
      const all = await db.sync_queue.toArray()
      const pending = all.filter(e => !e.synced_at)
      return {
        orders: pending.filter(e => e.entity_type === 'order').length,
        products: pending.filter(e => e.entity_type === 'product').length,
        stock_moves: pending.filter(e => e.entity_type === 'stock_move').length,
        users: pending.filter(e => e.entity_type === 'user').length,
      }
    } catch {
      return { orders: 0, products: 0, stock_moves: 0, users: 0 }
    }
  },
}))
