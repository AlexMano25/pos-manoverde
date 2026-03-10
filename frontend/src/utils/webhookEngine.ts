/**
 * Webhook Engine — Manages webhook endpoint CRUD, event triggering, and delivery
 * Stores webhook config in localStorage, delivers via fetch (non-blocking).
 * HMAC-SHA256 signature validation for security.
 */

import { generateUUID } from './uuid'

// ── Types ──────────────────────────────────────────────────────────────

export type WebhookEventType =
  | 'order.created'
  | 'order.updated'
  | 'order.paid'
  | 'order.refunded'
  | 'order.cancelled'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'stock.low'
  | 'stock.adjusted'
  | 'customer.created'
  | 'customer.updated'

export type WebhookEndpoint = {
  id: string
  store_id: string
  name: string
  url: string
  events: WebhookEventType[]
  active: boolean
  secret: string            // HMAC-SHA256 secret for signature
  headers?: Record<string, string>  // custom headers
  created_at: string
  updated_at: string
}

export type DeliveryStatus = 'pending' | 'sent' | 'failed'

export type WebhookDelivery = {
  id: string
  store_id: string
  endpoint_id: string
  endpoint_name: string
  event: WebhookEventType
  payload: string            // JSON-stringified
  status: DeliveryStatus
  status_code?: number
  response_body?: string     // first 500 chars of response
  error?: string
  retries: number
  created_at: string
  delivered_at?: string
}

export type WebhookPayload = {
  id: string
  event: WebhookEventType
  store_id: string
  timestamp: string
  data: Record<string, unknown>
}

// ── Storage keys ────────────────────────────────────────────────────────

const ENDPOINTS_KEY = 'pos-webhook-endpoints'
const DELIVERIES_KEY = 'pos-webhook-deliveries'
const MAX_DELIVERIES = 200       // Keep last N deliveries in storage
const MAX_RETRIES = 3
const DELIVERY_TIMEOUT_MS = 10_000

// ── Helper: generate HMAC-SHA256 signature ─────────────────────────────

async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const msgData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Helper: generate a random webhook secret ───────────────────────────

export function generateWebhookSecret(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return 'whsec_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Endpoint CRUD ──────────────────────────────────────────────────────

export function getEndpoints(storeId: string): WebhookEndpoint[] {
  try {
    const raw = localStorage.getItem(ENDPOINTS_KEY)
    if (!raw) return []
    const all: WebhookEndpoint[] = JSON.parse(raw)
    return all.filter(e => e.store_id === storeId)
  } catch {
    return []
  }
}

function getAllEndpoints(): WebhookEndpoint[] {
  try {
    const raw = localStorage.getItem(ENDPOINTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveEndpoints(endpoints: WebhookEndpoint[]): void {
  localStorage.setItem(ENDPOINTS_KEY, JSON.stringify(endpoints))
}

export function createEndpoint(
  storeId: string,
  name: string,
  url: string,
  events: WebhookEventType[],
  secret?: string
): WebhookEndpoint {
  const now = new Date().toISOString()
  const endpoint: WebhookEndpoint = {
    id: generateUUID(),
    store_id: storeId,
    name,
    url,
    events,
    active: true,
    secret: secret || generateWebhookSecret(),
    created_at: now,
    updated_at: now,
  }
  const all = getAllEndpoints()
  all.push(endpoint)
  saveEndpoints(all)
  return endpoint
}

export function updateEndpoint(
  endpointId: string,
  updates: Partial<Pick<WebhookEndpoint, 'name' | 'url' | 'events' | 'active' | 'secret' | 'headers'>>
): WebhookEndpoint | null {
  const all = getAllEndpoints()
  const idx = all.findIndex(e => e.id === endpointId)
  if (idx < 0) return null

  all[idx] = {
    ...all[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  saveEndpoints(all)
  return all[idx]
}

export function deleteEndpoint(endpointId: string): boolean {
  const all = getAllEndpoints()
  const filtered = all.filter(e => e.id !== endpointId)
  if (filtered.length === all.length) return false
  saveEndpoints(filtered)
  return true
}

export function toggleEndpoint(endpointId: string): WebhookEndpoint | null {
  const all = getAllEndpoints()
  const ep = all.find(e => e.id === endpointId)
  if (!ep) return null
  ep.active = !ep.active
  ep.updated_at = new Date().toISOString()
  saveEndpoints(all)
  return ep
}

// ── Delivery log ────────────────────────────────────────────────────────

function getDeliveries(): WebhookDelivery[] {
  try {
    const raw = localStorage.getItem(DELIVERIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveDeliveries(deliveries: WebhookDelivery[]): void {
  // Keep only last MAX_DELIVERIES
  const trimmed = deliveries.slice(-MAX_DELIVERIES)
  localStorage.setItem(DELIVERIES_KEY, JSON.stringify(trimmed))
}

export function getDeliveryLog(storeId: string, limit = 50): WebhookDelivery[] {
  return getDeliveries()
    .filter(d => d.store_id === storeId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
}

export function getDeliveryStats(storeId: string): { total: number; sent: number; failed: number; pending: number } {
  const deliveries = getDeliveries().filter(d => d.store_id === storeId)
  return {
    total: deliveries.length,
    sent: deliveries.filter(d => d.status === 'sent').length,
    failed: deliveries.filter(d => d.status === 'failed').length,
    pending: deliveries.filter(d => d.status === 'pending').length,
  }
}

export function clearDeliveryLog(storeId: string): void {
  const all = getDeliveries().filter(d => d.store_id !== storeId)
  saveDeliveries(all)
}

// ── Event trigger ───────────────────────────────────────────────────────

/**
 * Fire a webhook event for all matching active endpoints (non-blocking).
 * Creates delivery records and sends HTTP POST asynchronously.
 */
export function triggerWebhookEvent(
  storeId: string,
  event: WebhookEventType,
  data: Record<string, unknown>
): void {
  const endpoints = getEndpoints(storeId).filter(e => e.active && e.events.includes(event))
  if (endpoints.length === 0) return

  const payload: WebhookPayload = {
    id: generateUUID(),
    event,
    store_id: storeId,
    timestamp: new Date().toISOString(),
    data,
  }

  const payloadJson = JSON.stringify(payload)

  // Fire all deliveries in parallel (non-blocking)
  for (const ep of endpoints) {
    const delivery: WebhookDelivery = {
      id: generateUUID(),
      store_id: storeId,
      endpoint_id: ep.id,
      endpoint_name: ep.name,
      event,
      payload: payloadJson,
      status: 'pending',
      retries: 0,
      created_at: new Date().toISOString(),
    }

    // Save as pending
    const all = getDeliveries()
    all.push(delivery)
    saveDeliveries(all)

    // Send asynchronously
    deliverWebhook(ep, delivery, payloadJson).catch(() => {
      // Already handled inside deliverWebhook
    })
  }
}

/**
 * Send a single webhook delivery with retry logic
 */
async function deliverWebhook(
  endpoint: WebhookEndpoint,
  delivery: WebhookDelivery,
  payloadJson: string,
  attempt = 0
): Promise<void> {
  try {
    const signature = await hmacSha256(endpoint.secret, payloadJson)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Id': delivery.id,
      'X-Webhook-Event': delivery.event,
      'X-Webhook-Signature': `sha256=${signature}`,
      'X-Webhook-Timestamp': delivery.created_at,
      'User-Agent': 'POS-ManoVerde-Webhook/1.0',
      ...(endpoint.headers || {}),
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: payloadJson,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    // Update delivery status
    const deliveries = getDeliveries()
    const idx = deliveries.findIndex(d => d.id === delivery.id)
    if (idx >= 0) {
      deliveries[idx].status_code = response.status
      if (response.ok) {
        deliveries[idx].status = 'sent'
        deliveries[idx].delivered_at = new Date().toISOString()
      } else {
        const body = await response.text().catch(() => '')
        deliveries[idx].response_body = body.slice(0, 500)
        deliveries[idx].retries = attempt + 1

        if (attempt + 1 < MAX_RETRIES) {
          deliveries[idx].status = 'pending'
          saveDeliveries(deliveries)
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
          return deliverWebhook(endpoint, deliveries[idx], payloadJson, attempt + 1)
        } else {
          deliveries[idx].status = 'failed'
          deliveries[idx].error = `HTTP ${response.status}: ${body.slice(0, 200)}`
        }
      }
      saveDeliveries(deliveries)
    }
  } catch (err) {
    const deliveries = getDeliveries()
    const idx = deliveries.findIndex(d => d.id === delivery.id)
    if (idx >= 0) {
      deliveries[idx].retries = attempt + 1
      if (attempt + 1 < MAX_RETRIES) {
        deliveries[idx].status = 'pending'
        saveDeliveries(deliveries)
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
        return deliverWebhook(endpoint, deliveries[idx], payloadJson, attempt + 1)
      } else {
        deliveries[idx].status = 'failed'
        deliveries[idx].error = err instanceof Error ? err.message : 'Network error'
      }
      saveDeliveries(deliveries)
    }
    console.error(`[Webhook] Delivery failed for ${endpoint.url}:`, err)
  }
}

// ── Test delivery ───────────────────────────────────────────────────────

/**
 * Send a test webhook to verify the endpoint is reachable
 */
export async function testEndpoint(endpoint: WebhookEndpoint): Promise<{
  success: boolean
  statusCode?: number
  error?: string
  durationMs: number
}> {
  const testPayload: WebhookPayload = {
    id: generateUUID(),
    event: 'order.created',
    store_id: endpoint.store_id,
    timestamp: new Date().toISOString(),
    data: {
      _test: true,
      message: 'This is a test webhook delivery from POS Mano Verde',
    },
  }

  const payloadJson = JSON.stringify(testPayload)
  const start = performance.now()

  try {
    const signature = await hmacSha256(endpoint.secret, payloadJson)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Id': testPayload.id,
        'X-Webhook-Event': 'order.created',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Timestamp': testPayload.timestamp,
        'User-Agent': 'POS-ManoVerde-Webhook/1.0 (test)',
        ...(endpoint.headers || {}),
      },
      body: payloadJson,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    const durationMs = Math.round(performance.now() - start)

    if (response.ok) {
      return { success: true, statusCode: response.status, durationMs }
    } else {
      const body = await response.text().catch(() => '')
      return {
        success: false,
        statusCode: response.status,
        error: body.slice(0, 200),
        durationMs,
      }
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - start)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
      durationMs,
    }
  }
}

// ── Retry failed deliveries ─────────────────────────────────────────────

export async function retryFailedDeliveries(storeId: string): Promise<number> {
  const deliveries = getDeliveries()
  const failed = deliveries.filter(d => d.store_id === storeId && d.status === 'failed')
  const endpoints = getEndpoints(storeId)
  let retried = 0

  for (const d of failed) {
    const ep = endpoints.find(e => e.id === d.endpoint_id)
    if (!ep || !ep.active) continue

    // Reset for retry
    d.status = 'pending'
    d.retries = 0
    d.error = undefined
    d.status_code = undefined
    saveDeliveries(deliveries)

    deliverWebhook(ep, d, d.payload).catch(() => {})
    retried++
  }

  return retried
}

// ── Available webhook events ────────────────────────────────────────────

export const WEBHOOK_EVENT_CATEGORIES: Record<string, WebhookEventType[]> = {
  orders: ['order.created', 'order.updated', 'order.paid', 'order.refunded', 'order.cancelled'],
  products: ['product.created', 'product.updated', 'product.deleted'],
  stock: ['stock.low', 'stock.adjusted'],
  customers: ['customer.created', 'customer.updated'],
}

export function getEventLabel(event: WebhookEventType): string {
  const labels: Record<WebhookEventType, string> = {
    'order.created': 'Order Created',
    'order.updated': 'Order Updated',
    'order.paid': 'Order Paid',
    'order.refunded': 'Order Refunded',
    'order.cancelled': 'Order Cancelled',
    'product.created': 'Product Created',
    'product.updated': 'Product Updated',
    'product.deleted': 'Product Deleted',
    'stock.low': 'Low Stock Alert',
    'stock.adjusted': 'Stock Adjusted',
    'customer.created': 'Customer Created',
    'customer.updated': 'Customer Updated',
  }
  return labels[event] || event
}
