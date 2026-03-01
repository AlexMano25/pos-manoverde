// ---------------------------------------------------------------------------
// useOnlineStatus -- React hook for monitoring network connectivity
//
// Tracks three levels of connectivity:
//   'online'     -- Internet access AND (local server reachable OR Supabase cloud available)
//   'local-only' -- Local server reachable but no internet
//   'offline'    -- Nothing reachable
//
// Periodically pings the local server (every 10 seconds) and checks
// navigator.onLine for browser-level connectivity.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { isSupabaseConfigured } from '../services/supabase'
import type { ConnectionStatus } from '../types'

// How often to check server reachability (milliseconds)
const PING_INTERVAL_MS = 10_000

// Timeout for the server health check (milliseconds)
const PING_TIMEOUT_MS = 4_000

// URL to check internet access (a fast, reliable endpoint)
const INTERNET_CHECK_URL = 'https://www.google.com/generate_204'
const INTERNET_CHECK_TIMEOUT_MS = 5_000

/** Return type of the useOnlineStatus hook */
type UseOnlineStatusReturn = {
  /** Whether the browser reports network access (navigator.onLine) */
  isOnline: boolean
  /** Whether the local POS server is reachable */
  isServerReachable: boolean
  /** Computed connection status: 'online' | 'local-only' | 'offline' */
  connectionStatus: ConnectionStatus
}

/**
 * Ping the local server's health endpoint.
 * Returns true if the server responds with an OK status within the timeout.
 */
async function checkServerHealth(serverUrl: string): Promise<boolean> {
  if (!serverUrl) return false

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)

    const response = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Check if the device has internet access by hitting a known fast endpoint.
 * Uses an opaque fetch (no-cors mode) so that CORS policies don't block it.
 * A successful response (even opaque) means the network route works.
 */
async function checkInternetAccess(): Promise<boolean> {
  if (!navigator.onLine) return false

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      INTERNET_CHECK_TIMEOUT_MS,
    )

    const response = await fetch(INTERNET_CHECK_URL, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    return response.type === 'opaque' || response.ok
  } catch {
    return false
  }
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const { serverUrl, setConnectionStatus } = useAppStore()

  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [isServerReachable, setIsServerReachable] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus>('offline')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * Run a full connectivity check: server + internet
   */
  const runCheck = useCallback(async () => {
    const browserOnline = navigator.onLine
    setIsOnline(browserOnline)

    // Check server reachability
    const serverOk = await checkServerHealth(serverUrl)
    setIsServerReachable(serverOk)

    // Determine connection status
    let newStatus: ConnectionStatus

    if (!serverOk && !browserOnline) {
      newStatus = 'offline'
    } else if (serverOk && browserOnline) {
      const internetOk = await checkInternetAccess()
      newStatus = internetOk ? 'online' : 'local-only'
    } else if (serverOk && !browserOnline) {
      newStatus = 'local-only'
    } else {
      // !serverOk && browserOnline: browser has internet but local server down
      // If Supabase is configured, we can still operate in "online" mode
      // using the cloud backend for data sync
      if (isSupabaseConfigured) {
        const internetOk = await checkInternetAccess()
        newStatus = internetOk ? 'online' : 'offline'
      } else {
        newStatus = 'offline'
      }
    }

    setStatus(newStatus)
    setConnectionStatus(newStatus)
  }, [serverUrl, setConnectionStatus])

  // ── Browser online/offline events ──
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      runCheck()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setStatus('offline')
      setConnectionStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [runCheck, setConnectionStatus])

  // ── Periodic ping interval ──
  useEffect(() => {
    runCheck()

    intervalRef.current = setInterval(runCheck, PING_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [runCheck])

  return {
    isOnline,
    isServerReachable,
    connectionStatus: status,
  }
}
