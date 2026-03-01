// ---------------------------------------------------------------------------
// useSync -- React hook for managing data synchronisation
//
// - Auto-syncs pending items every 30 seconds when online
// - Listens for online/offline browser events
// - Sets up WebSocket listeners for real-time updates from other devices
// - Provides manual syncNow() trigger
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useSyncStore } from '../stores/syncStore'
import { useProductStore } from '../stores/productStore'
import { useOrderStore } from '../stores/orderStore'
import { wsService } from '../services/websocket'
import { db } from '../db/dexie'
import type { Order, Product } from '../types'

// Sync interval in milliseconds
const SYNC_INTERVAL_MS = 30_000

export function useSync() {
  const { connectionStatus, serverUrl, currentStore } = useAppStore()
  const { token } = useAuthStore()
  const {
    pendingCount,
    isSyncing,
    lastSyncAt,
    syncToServer,
    syncFromServer,
    countPending,
  } = useSyncStore()
  const { loadProducts } = useProductStore()
  const { loadOrders } = useOrderStore()

  // Track last sync time locally for display purposes
  const [localLastSync, setLocalLastSync] = useState<string | null>(lastSyncAt)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wsInitializedRef = useRef(false)

  // Update local state when store updates
  useEffect(() => {
    setLocalLastSync(lastSyncAt)
  }, [lastSyncAt])

  /**
   * Perform a full sync cycle: push pending changes, then pull from server
   */
  const syncNow = useCallback(async () => {
    if (isSyncing) return
    if (connectionStatus === 'offline') {
      console.info('[useSync] Cannot sync -- offline')
      return
    }

    try {
      // Push local changes first
      await syncToServer()
      // Then pull remote changes
      await syncFromServer()
      // Refresh pending count
      await countPending()

      setLocalLastSync(new Date().toISOString())
    } catch (error) {
      console.error('[useSync] Sync failed:', error)
    }
  }, [isSyncing, connectionStatus, syncToServer, syncFromServer, countPending])

  // ── Auto-sync interval ──
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Only set up auto-sync when not offline
    if (connectionStatus === 'offline') return

    // Check pending and auto-sync every SYNC_INTERVAL_MS
    intervalRef.current = setInterval(async () => {
      await countPending()

      const { pendingCount: currentPending, isSyncing: currentlySyncing } =
        useSyncStore.getState()

      if (currentPending > 0 && !currentlySyncing) {
        console.info(
          `[useSync] Auto-sync: ${currentPending} pending items`,
        )
        try {
          await syncToServer()
          await countPending()
        } catch (error) {
          console.warn('[useSync] Auto-sync push failed:', error)
        }
      }
    }, SYNC_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [connectionStatus, countPending, syncToServer])

  // ── Browser online/offline events ──
  useEffect(() => {
    const handleOnline = () => {
      console.info('[useSync] Browser went online')
      // Trigger a sync when coming back online
      countPending().then(() => {
        const { pendingCount: pending } = useSyncStore.getState()
        if (pending > 0) {
          syncToServer().catch((err) =>
            console.warn('[useSync] Sync on reconnect failed:', err),
          )
        }
      })
    }

    const handleOffline = () => {
      console.info('[useSync] Browser went offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [countPending, syncToServer])

  // ── WebSocket listeners for real-time updates ──
  useEffect(() => {
    const storeId = currentStore?.id
    if (!serverUrl || !token || !storeId) return
    if (connectionStatus === 'offline') return

    // Prevent double initialization
    if (wsInitializedRef.current) return
    wsInitializedRef.current = true

    // Connect WebSocket
    wsService.connect(serverUrl, token, storeId)

    // Handle incoming order from another device
    wsService.onOrderCreated(async (order: Order) => {
      try {
        // Check if we already have this order locally
        const existing = await db.orders.get(order.id)
        if (!existing) {
          await db.orders.add({ ...order, synced: true })
          // Reload orders in the store
          await loadOrders(storeId)
          console.info('[useSync] Received new order from another device:', order.id)
        }
      } catch (error) {
        console.error('[useSync] Error processing incoming order:', error)
      }
    })

    // Handle product updates from another device or back-office
    wsService.onProductUpdated(async (product: Product) => {
      try {
        await db.products.put(product)
        // Reload products in the store
        await loadProducts(storeId)
        console.info('[useSync] Product updated from server:', product.id)
      } catch (error) {
        console.error('[useSync] Error processing product update:', error)
      }
    })

    // Handle stock updates
    wsService.onStockUpdated(async (data) => {
      try {
        const product = await db.products.get(data.product_id)
        if (product) {
          await db.products.update(data.product_id, {
            stock: data.stock,
            updated_at: data.updated_at,
          })
          await loadProducts(storeId)
          console.info('[useSync] Stock updated for product:', data.product_id)
        }
      } catch (error) {
        console.error('[useSync] Error processing stock update:', error)
      }
    })

    // Handle sync requests from the server (admin triggered full sync)
    wsService.onSyncRequested(async () => {
      console.info('[useSync] Full sync requested by server')
      try {
        await syncFromServer()
        await loadProducts(storeId)
        await loadOrders(storeId)
        await countPending()
      } catch (error) {
        console.error('[useSync] Server-requested sync failed:', error)
      }
    })

    return () => {
      wsService.off('order:created')
      wsService.off('product:updated')
      wsService.off('stock:updated')
      wsService.off('sync:requested')
      wsService.disconnect()
      wsInitializedRef.current = false
    }
  }, [
    serverUrl,
    token,
    currentStore?.id,
    connectionStatus,
    loadProducts,
    loadOrders,
    syncFromServer,
    countPending,
  ])

  // ── Initial pending count on mount ──
  useEffect(() => {
    countPending()
  }, [countPending])

  return {
    pendingCount,
    isSyncing,
    lastSyncAt: localLastSync,
    syncNow,
  }
}
