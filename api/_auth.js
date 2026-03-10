/**
 * API Authentication middleware for serverless functions.
 * Supports:
 *   1. Bearer token (Supabase JWT) — Authorization: Bearer <token>
 *   2. API Key — X-API-Key: mv_xxxxx (validated against Supabase api_keys table)
 *
 * Returns { user, storeId } on success, or sends 401/403 error.
 */
const { supabase, supabaseAnon } = require('./_supabase')

/**
 * Set CORS headers on the response
 */
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Store-Id')
  res.setHeader('Access-Control-Max-Age', '86400')
}

/**
 * Handle CORS preflight
 */
function handleCors(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

/**
 * Authenticate request via Bearer token or API key.
 * Returns { authenticated: true, storeId, userId } or sends error response.
 */
async function authenticate(req, res) {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured' })
    return null
  }

  const authHeader = req.headers['authorization'] || ''
  const apiKey = req.headers['x-api-key'] || ''
  const storeIdHeader = req.headers['x-store-id'] || ''

  // Method 1: Bearer token (Supabase JWT)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        res.status(401).json({ error: 'Invalid or expired token' })
        return null
      }

      // Get user's store from the users table
      const { data: userData } = await supabase
        .from('users')
        .select('store_id, role')
        .eq('email', user.email)
        .limit(1)
        .single()

      const storeId = storeIdHeader || userData?.store_id || ''
      return {
        authenticated: true,
        userId: user.id,
        email: user.email,
        role: userData?.role || 'cashier',
        storeId,
      }
    } catch {
      res.status(401).json({ error: 'Authentication failed' })
      return null
    }
  }

  // Method 2: API Key
  if (apiKey && apiKey.startsWith('mv_')) {
    try {
      // Hash the key to compare against stored hashes
      const crypto = require('crypto')
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

      // Look up the key in Supabase (api_keys table)
      const { data: keyRecord, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('active', true)
        .limit(1)
        .single()

      if (error || !keyRecord) {
        res.status(401).json({ error: 'Invalid API key' })
        return null
      }

      // Check expiration
      if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
        res.status(401).json({ error: 'API key has expired' })
        return null
      }

      // Update last_used and request_count (non-blocking)
      supabase
        .from('api_keys')
        .update({
          last_used_at: new Date().toISOString(),
          request_count: (keyRecord.request_count || 0) + 1,
        })
        .eq('id', keyRecord.id)
        .then(() => {})

      return {
        authenticated: true,
        userId: keyRecord.id,
        storeId: keyRecord.store_id,
        role: 'api',
        scopes: keyRecord.scopes || ['read'],
      }
    } catch {
      res.status(401).json({ error: 'API key validation failed' })
      return null
    }
  }

  res.status(401).json({
    error: 'Authentication required',
    hint: 'Provide Authorization: Bearer <token> or X-API-Key: mv_xxxxx',
  })
  return null
}

/**
 * Check if auth has required scope
 */
function hasScope(auth, requiredScope) {
  if (!auth) return false
  if (auth.role === 'admin' || auth.role === 'api') return true
  if (auth.scopes) {
    if (auth.scopes.includes('admin')) return true
    return auth.scopes.includes(requiredScope)
  }
  return true // JWT users have full access to their store
}

module.exports = { handleCors, setCors, authenticate, hasScope }
