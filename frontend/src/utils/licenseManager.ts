// ── License Code Manager ─────────────────────────────────────────────────────
// Generates and validates HMAC-SHA256 based license codes for offline plan renewal.
// Format: MV-{timestamp_hex}-{org_hash_6}-{plan_code}-{days_hex}-{hmac_8}

import type { SubscriptionPlan } from '../types'

const SHARED_SECRET = 'MV-POS-2026-LICENSE-KEY'

const PLAN_CODES: Record<SubscriptionPlan, string> = {
  free: 'F',
  starter: 'S',
  pro: 'P',
  enterprise: 'E',
  pay_as_you_grow: 'G',
}

const CODE_TO_PLAN: Record<string, SubscriptionPlan> = {
  F: 'free',
  S: 'starter',
  P: 'pro',
  E: 'enterprise',
  G: 'pay_as_you_grow',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSign(payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SHARED_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return toHex(signature)
}

function hashOrgId(orgId: string): string {
  // Simple hash: take first 6 hex chars of a basic hash
  let hash = 0
  for (let i = 0; i < orgId.length; i++) {
    hash = ((hash << 5) - hash + orgId.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6)
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface ParsedLicense {
  timestamp: number
  orgHash: string
  plan: SubscriptionPlan
  days: number
  checksum: string
}

/**
 * Generate a license code for a given organization, plan, and duration.
 * Used by the super admin to create offline renewal codes.
 */
export async function generateLicenseCode(
  orgId: string,
  plan: SubscriptionPlan,
  days: number,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000)
  const tsHex = timestamp.toString(16)
  const orgHash = hashOrgId(orgId)
  const planCode = PLAN_CODES[plan]
  const daysHex = days.toString(16).padStart(2, '0')

  const payload = `${tsHex}-${orgHash}-${planCode}-${daysHex}`
  const fullHmac = await hmacSign(payload)
  const hmac8 = fullHmac.slice(0, 8)

  return `MV-${tsHex}-${orgHash}-${planCode}-${daysHex}-${hmac8}`.toUpperCase()
}

/**
 * Parse a license code string into its components.
 * Returns null if the format is invalid.
 */
export function parseLicenseCode(code: string): ParsedLicense | null {
  const normalized = code.trim().toUpperCase()
  const parts = normalized.split('-')

  // Expected: MV, tsHex, orgHash, planCode, daysHex, hmac8
  if (parts.length !== 6 || parts[0] !== 'MV') return null

  const [, tsHex, orgHash, planCodeStr, daysHex, checksum] = parts

  const plan = CODE_TO_PLAN[planCodeStr]
  if (!plan) return null

  const timestamp = parseInt(tsHex, 16)
  const days = parseInt(daysHex, 16)

  if (isNaN(timestamp) || isNaN(days) || days <= 0) return null

  return { timestamp, orgHash, plan, days, checksum }
}

/**
 * Validate a license code against an organization ID.
 * Checks HMAC integrity, org match, and expiration.
 */
export async function validateLicenseCode(
  code: string,
  orgId: string,
): Promise<{ valid: boolean; error?: string; parsed?: ParsedLicense }> {
  const parsed = parseLicenseCode(code)
  if (!parsed) {
    return { valid: false, error: 'Invalid code format' }
  }

  // Verify org hash matches
  const expectedOrgHash = hashOrgId(orgId).toUpperCase()
  if (parsed.orgHash !== expectedOrgHash) {
    return { valid: false, error: 'Code does not match this organization' }
  }

  // Verify timestamp is not in the future (with 5 min tolerance)
  const now = Math.floor(Date.now() / 1000)
  if (parsed.timestamp > now + 300) {
    return { valid: false, error: 'Code timestamp is in the future' }
  }

  // Verify the code hasn't expired (timestamp + days should be in the future)
  const expiresAt = parsed.timestamp + parsed.days * 86400
  if (expiresAt < now) {
    return { valid: false, error: 'License code has expired' }
  }

  // Verify HMAC
  const normalizedCode = code.trim().toUpperCase()
  const parts = normalizedCode.split('-')
  const [, tsHex, orgHash, planCode, daysHex] = parts

  const payload = `${tsHex}-${orgHash}-${planCode}-${daysHex}`.toLowerCase()
  const fullHmac = await hmacSign(payload)
  const expectedHmac = fullHmac.slice(0, 8).toUpperCase()

  if (parsed.checksum !== expectedHmac) {
    return { valid: false, error: 'Invalid license code' }
  }

  return { valid: true, parsed }
}

/**
 * Calculate the new subscription period end date from a license code.
 */
export function getLicenseEndDate(parsed: ParsedLicense): Date {
  const now = new Date()
  const end = new Date(now.getTime() + parsed.days * 86400 * 1000)
  return end
}
