/**
 * API Key Manager — Generate, validate, and manage API keys
 * for external integrations (REST API access).
 * Stores keys in localStorage with HMAC-SHA256 hashed versions.
 */

import { generateUUID } from './uuid'

// ── Types ──────────────────────────────────────────────────────────────

export type ApiKeyScope = 'read' | 'write' | 'admin'

export type ApiKey = {
  id: string
  store_id: string
  name: string
  key_prefix: string    // first 8 chars of the key (for display)
  key_hash: string      // SHA-256 hash of full key
  scopes: ApiKeyScope[]
  active: boolean
  last_used_at?: string
  request_count: number
  rate_limit: number     // max requests per minute
  expires_at?: string
  created_at: string
  updated_at: string
}

export type ApiKeyWithSecret = ApiKey & {
  full_key: string       // only available at creation time
}

export type ApiRateLimitInfo = {
  remaining: number
  limit: number
  reset_at: string
}

// ── Storage ────────────────────────────────────────────────────────────

const KEYS_STORAGE = 'pos-api-keys'

function getAllKeys(): ApiKey[] {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAllKeys(keys: ApiKey[]): void {
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys))
}

// ── Hash utility ────────────────────────────────────────────────────────

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── Key generation ──────────────────────────────────────────────────────

function generateRawKey(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return 'mv_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── CRUD operations ────────────────────────────────────────────────────

export function getApiKeys(storeId: string): ApiKey[] {
  return getAllKeys().filter(k => k.store_id === storeId)
}

export async function createApiKey(
  storeId: string,
  name: string,
  scopes: ApiKeyScope[],
  options?: { rateLimit?: number; expiresInDays?: number }
): Promise<ApiKeyWithSecret> {
  const now = new Date().toISOString()
  const fullKey = generateRawKey()
  const keyHash = await sha256(fullKey)

  const key: ApiKey = {
    id: generateUUID(),
    store_id: storeId,
    name,
    key_prefix: fullKey.slice(0, 11), // "mv_" + 8 chars
    key_hash: keyHash,
    scopes,
    active: true,
    request_count: 0,
    rate_limit: options?.rateLimit || 60,
    expires_at: options?.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 86400000).toISOString()
      : undefined,
    created_at: now,
    updated_at: now,
  }

  const all = getAllKeys()
  all.push(key)
  saveAllKeys(all)

  return { ...key, full_key: fullKey }
}

export function updateApiKey(
  keyId: string,
  updates: Partial<Pick<ApiKey, 'name' | 'scopes' | 'active' | 'rate_limit' | 'expires_at'>>
): ApiKey | null {
  const all = getAllKeys()
  const idx = all.findIndex(k => k.id === keyId)
  if (idx < 0) return null

  all[idx] = {
    ...all[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  saveAllKeys(all)
  return all[idx]
}

export function revokeApiKey(keyId: string): boolean {
  const all = getAllKeys()
  const idx = all.findIndex(k => k.id === keyId)
  if (idx < 0) return false

  all[idx].active = false
  all[idx].updated_at = new Date().toISOString()
  saveAllKeys(all)
  return true
}

export function deleteApiKey(keyId: string): boolean {
  const all = getAllKeys()
  const filtered = all.filter(k => k.id !== keyId)
  if (filtered.length === all.length) return false
  saveAllKeys(filtered)
  return true
}

/**
 * Validate an API key and return the associated key record
 */
export async function validateApiKey(rawKey: string, storeId: string): Promise<ApiKey | null> {
  const hash = await sha256(rawKey)
  const all = getAllKeys()
  const key = all.find(k => k.key_hash === hash && k.store_id === storeId)

  if (!key) return null
  if (!key.active) return null
  if (key.expires_at && new Date(key.expires_at) < new Date()) return null

  // Update last_used_at and request_count
  key.last_used_at = new Date().toISOString()
  key.request_count += 1
  saveAllKeys(all)

  return key
}

/**
 * Check if a key has the required scope
 */
export function hasScope(key: ApiKey, requiredScope: ApiKeyScope): boolean {
  if (key.scopes.includes('admin')) return true
  return key.scopes.includes(requiredScope)
}

// ── API usage stats ─────────────────────────────────────────────────────

export function getApiUsageStats(storeId: string): {
  totalKeys: number
  activeKeys: number
  totalRequests: number
} {
  const keys = getApiKeys(storeId)
  return {
    totalKeys: keys.length,
    activeKeys: keys.filter(k => k.active).length,
    totalRequests: keys.reduce((sum, k) => sum + k.request_count, 0),
  }
}

// ── Scope labels ────────────────────────────────────────────────────────

export const SCOPE_LABELS: Record<ApiKeyScope, string> = {
  read: 'Read Only',
  write: 'Read & Write',
  admin: 'Full Admin',
}

export const SCOPE_DESCRIPTIONS: Record<ApiKeyScope, string> = {
  read: 'View orders, products, stock levels, customers',
  write: 'Create and update orders, products, stock, customers',
  admin: 'Full access including settings, users, and webhooks',
}
