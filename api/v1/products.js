/**
 * /api/v1/products — Products CRUD
 *
 * GET    /api/v1/products            — List products (paginated, filterable)
 * GET    /api/v1/products?id=xxx     — Get a single product
 * POST   /api/v1/products            — Create a product
 * PUT    /api/v1/products?id=xxx     — Update a product
 * DELETE /api/v1/products?id=xxx     — Delete a product
 */
const { supabase } = require('../_supabase')
const { handleCors, authenticate, hasScope } = require('../_auth')

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return

  const auth = await authenticate(req, res)
  if (!auth) return

  try {
    const { id } = req.query

    // ── GET ────────────────────────────────────────────────────
    if (req.method === 'GET') {
      if (!hasScope(auth, 'read')) {
        return res.status(403).json({ error: 'Insufficient permissions (read required)' })
      }

      if (id) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('store_id', auth.storeId)
          .single()

        if (error || !data) {
          return res.status(404).json({ error: 'Product not found' })
        }
        return res.status(200).json({ data })
      }

      // List with optional filters
      const {
        category,
        search,
        in_stock,
        limit = '50',
        offset = '0',
        sort = 'name',
        order = 'asc',
      } = req.query

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('store_id', auth.storeId)

      if (category) query = query.eq('category', category)
      if (search) query = query.ilike('name', `%${search}%`)
      if (in_stock === 'true') query = query.gt('stock', 0)
      if (in_stock === 'false') query = query.lte('stock', 0)

      const validSorts = ['name', 'price', 'stock', 'created_at', 'updated_at', 'category']
      const sortCol = validSorts.includes(sort) ? sort : 'name'
      const ascending = order !== 'desc'

      query = query
        .order(sortCol, { ascending })
        .range(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10) - 1)

      const { data, error, count } = await query

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({
        data: data || [],
        count: count || 0,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      })
    }

    // ── POST ───────────────────────────────────────────────────
    if (req.method === 'POST') {
      if (!hasScope(auth, 'write')) {
        return res.status(403).json({ error: 'Insufficient permissions (write required)' })
      }

      const body = req.body
      if (!body || !body.name) {
        return res.status(400).json({ error: 'Product name is required' })
      }

      const product = {
        ...body,
        store_id: auth.storeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: error.message })
      }

      return res.status(201).json({ data })
    }

    // ── PUT ────────────────────────────────────────────────────
    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!hasScope(auth, 'write')) {
        return res.status(403).json({ error: 'Insufficient permissions (write required)' })
      }

      if (!id) {
        return res.status(400).json({ error: 'Product id is required (?id=xxx)' })
      }

      const body = req.body
      if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ error: 'Request body is required' })
      }

      // Prevent changing store_id
      delete body.store_id
      body.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('products')
        .update(body)
        .eq('id', id)
        .eq('store_id', auth.storeId)
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: error.message })
      }
      if (!data) {
        return res.status(404).json({ error: 'Product not found' })
      }

      return res.status(200).json({ data })
    }

    // ── DELETE ──────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!hasScope(auth, 'write')) {
        return res.status(403).json({ error: 'Insufficient permissions (write required)' })
      }

      if (!id) {
        return res.status(400).json({ error: 'Product id is required (?id=xxx)' })
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('store_id', auth.storeId)

      if (error) {
        return res.status(400).json({ error: error.message })
      }

      return res.status(200).json({ success: true, deleted: id })
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
