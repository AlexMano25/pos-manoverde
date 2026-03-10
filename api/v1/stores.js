/**
 * /api/v1/stores — List stores for the authenticated user's organization
 *
 * GET  /api/v1/stores          — List all stores
 * GET  /api/v1/stores?id=xxx   — Get a single store
 */
const { supabase } = require('../_supabase')
const { handleCors, authenticate } = require('../_auth')

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return

  const auth = await authenticate(req, res)
  if (!auth) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' })
  }

  try {
    const { id } = req.query

    if (id) {
      // Get single store
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        return res.status(404).json({ error: 'Store not found' })
      }
      return res.status(200).json({ data })
    }

    // List stores — if storeId is set, get the organization's stores
    let query = supabase.from('stores').select('*')

    if (auth.storeId) {
      // Get org_id from the user's store, then list all stores in that org
      const { data: store } = await supabase
        .from('stores')
        .select('organization_id')
        .eq('id', auth.storeId)
        .single()

      if (store?.organization_id) {
        query = query.eq('organization_id', store.organization_id)
      } else {
        query = query.eq('id', auth.storeId)
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({
      data: data || [],
      count: (data || []).length,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
