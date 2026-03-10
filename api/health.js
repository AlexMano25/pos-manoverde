/**
 * GET /api/health — Public health check endpoint
 */
const { supabase, supabaseUrl } = require('./_supabase')
const { setCors } = require('./_auth')

module.exports = async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const health = {
    status: 'ok',
    server: 'POS Mano Verde API',
    version: '1.0.0',
    environment: 'production',
    supabase: supabaseUrl ? 'connected' : 'not configured',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /api/health',
      products: 'GET /api/v1/products?store_id=xxx',
      orders: 'GET /api/v1/orders?store_id=xxx',
      stock: 'GET /api/v1/stock?store_id=xxx',
      stores: 'GET /api/v1/stores',
    },
    auth: 'Authorization: Bearer <supabase_jwt> or X-API-Key: mv_xxxxx',
  }

  // Optional: ping Supabase to verify connection
  if (supabase) {
    try {
      const { error } = await supabase.from('stores').select('id').limit(1)
      health.database = error ? 'error' : 'ok'
    } catch {
      health.database = 'unreachable'
    }
  }

  res.status(200).json(health)
}
