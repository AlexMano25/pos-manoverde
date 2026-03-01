// ---------------------------------------------------------------------------
// WebSocket Client Service -- Real-time communication via socket.io
// ---------------------------------------------------------------------------

import { io, type Socket } from 'socket.io-client'
import type { Order, Product } from '../types'

// ── Types ───────────────────────────────────────────────────────────────────

/** Stock update payload sent/received via WebSocket */
export type StockUpdatePayload = {
  product_id: string
  store_id: string
  stock: number
  updated_at: string
}

/** Connection change callback */
type ConnectionChangeCallback = (connected: boolean) => void

// ── WebSocket Service ───────────────────────────────────────────────────────

export class WebSocketService {
  private socket: Socket | null = null
  private isConnected = false
  private storeId = ''
  private connectionCallbacks: Set<ConnectionChangeCallback> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 20
  private baseReconnectDelay = 1000 // 1 second
  private maxReconnectDelay = 30000 // 30 seconds

  /**
   * Connect to the WebSocket server with authentication.
   *
   * @param serverUrl - Base URL of the server (e.g. 'http://192.168.1.100:3000')
   * @param token     - JWT authentication token
   * @param storeId   - Current store ID to join the store room
   */
  connect(serverUrl: string, token: string, storeId: string): void {
    // Disconnect existing socket before creating a new one
    if (this.socket) {
      this.disconnect()
    }

    this.storeId = storeId

    this.socket = io(serverUrl, {
      auth: {
        token,
      },
      query: {
        store_id: storeId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.baseReconnectDelay,
      reconnectionDelayMax: this.maxReconnectDelay,
      timeout: 10000,
      autoConnect: true,
    })

    // ── Connection lifecycle events ──

    this.socket.on('connect', () => {
      this.isConnected = true
      this.reconnectAttempts = 0
      console.info('[ws] Connected to server:', serverUrl)

      // Join the store-specific room
      this.socket?.emit('join:store', { store_id: storeId })

      this.notifyConnectionChange(true)
    })

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false
      console.info('[ws] Disconnected:', reason)

      this.notifyConnectionChange(false)

      // If the server closed the connection, socket.io will auto-reconnect
      // If the client disconnected intentionally, we do nothing
    })

    this.socket.on('connect_error', (error) => {
      this.isConnected = false
      this.reconnectAttempts++

      // Calculate backoff delay for logging
      const delay = Math.min(
        this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
        this.maxReconnectDelay,
      )

      console.warn(
        `[ws] Connection error (attempt ${this.reconnectAttempts}):`,
        error.message,
        `| Next retry in ${Math.round(delay / 1000)}s`,
      )

      this.notifyConnectionChange(false)
    })

    this.socket.io.on('reconnect', (attempt) => {
      this.isConnected = true
      this.reconnectAttempts = 0
      console.info('[ws] Reconnected after', attempt, 'attempts')

      // Re-join the store room after reconnection
      this.socket?.emit('join:store', { store_id: storeId })

      this.notifyConnectionChange(true)
    })

    this.socket.io.on('reconnect_failed', () => {
      console.error(
        '[ws] Reconnection failed after',
        this.maxReconnectAttempts,
        'attempts',
      )
      this.notifyConnectionChange(false)
    })
  }

  /**
   * Disconnect from the WebSocket server cleanly
   */
  disconnect(): void {
    if (this.socket) {
      // Leave the store room
      this.socket.emit('leave:store', { store_id: this.storeId })

      // Remove all listeners to prevent memory leaks
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }

    this.isConnected = false
    this.reconnectAttempts = 0
    this.notifyConnectionChange(false)
  }

  // ── Event listeners (incoming from server) ──

  /**
   * Listen for new orders created on other devices
   */
  onOrderCreated(callback: (order: Order) => void): void {
    this.socket?.on('order:created', callback)
  }

  /**
   * Listen for product updates from other devices or back-office
   */
  onProductUpdated(callback: (product: Product) => void): void {
    this.socket?.on('product:updated', callback)
  }

  /**
   * Listen for stock level changes
   */
  onStockUpdated(callback: (data: StockUpdatePayload) => void): void {
    this.socket?.on('stock:updated', callback)
  }

  /**
   * Listen for sync requests from the server (e.g. admin triggers full sync)
   */
  onSyncRequested(callback: () => void): void {
    this.socket?.on('sync:requested', callback)
  }

  // ── Event emitters (outgoing to server) ──

  /**
   * Notify the server and other devices that an order was created
   */
  emitOrderCreated(order: Order): void {
    if (!this.socket || !this.isConnected) {
      console.warn('[ws] Cannot emit order:created -- not connected')
      return
    }
    this.socket.emit('order:created', {
      ...order,
      store_id: this.storeId,
    })
  }

  /**
   * Notify the server and other devices that a product was updated
   */
  emitProductUpdated(product: Product): void {
    if (!this.socket || !this.isConnected) {
      console.warn('[ws] Cannot emit product:updated -- not connected')
      return
    }
    this.socket.emit('product:updated', {
      ...product,
      store_id: this.storeId,
    })
  }

  /**
   * Notify the server and other devices of a stock change
   */
  emitStockUpdated(data: StockUpdatePayload): void {
    if (!this.socket || !this.isConnected) {
      console.warn('[ws] Cannot emit stock:updated -- not connected')
      return
    }
    this.socket.emit('stock:updated', data)
  }

  /**
   * Request a full sync from the server
   */
  requestSync(): void {
    if (!this.socket || !this.isConnected) {
      console.warn('[ws] Cannot request sync -- not connected')
      return
    }
    this.socket.emit('sync:request', { store_id: this.storeId })
  }

  // ── Connection state tracking ──

  /**
   * Register a callback to be notified when connection state changes.
   * Returns an unsubscribe function.
   */
  onConnectionChange(callback: ConnectionChangeCallback): () => void {
    this.connectionCallbacks.add(callback)
    // Immediately notify with current state
    callback(this.isConnected)

    return () => {
      this.connectionCallbacks.delete(callback)
    }
  }

  /**
   * Check if currently connected to the WebSocket server
   */
  getIsConnected(): boolean {
    return this.isConnected
  }

  /**
   * Remove a specific event listener
   */
  off(event: string): void {
    this.socket?.off(event)
  }

  /**
   * Remove all listeners for a specific event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.socket?.off(event)
    } else {
      this.socket?.removeAllListeners()
    }
  }

  // ── Private helpers ──

  private notifyConnectionChange(connected: boolean): void {
    for (const callback of this.connectionCallbacks) {
      try {
        callback(connected)
      } catch (error) {
        console.error('[ws] Connection change callback error:', error)
      }
    }
  }
}

// ── Singleton Instance ──────────────────────────────────────────────────────

export const wsService = new WebSocketService()
