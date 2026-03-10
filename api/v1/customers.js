/**
 * /api/v1/customers — Customers CRUD
 *
 * GET    /api/v1/customers            — List customers
 * GET    /api/v1/customers?id=xxx     — Get a single customer
 * POST   /api/v1/customers            — Create a customer
 * PUT    /api/v1/customers?id=xxx     — Update a customer
 * DELETE /api/v1/customers?id=xxx     — Delete a customer
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
          .from('customers')
          .select('*')
          .eq('id', id)
          .eq('store_id', auth.storeId)
          .single()

        if (error || !data) {
          return res.status(404).json({ error: 'Customer not found' })
        }
        return res.status(200).json({ data })
      }

      const { search, limit = '50', offset = '0', sort = 'name', order = 'asc' } = req.query

      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('store_id', auth.storeId)

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      const validSorts = ['name', 'email', 'created_at', 'total_spent', 'loyalty_points']
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
        return res.status(400).json({ error: 'Customer name is required' })
      }

      const customer = {
        ...body,
        store_id: auth.storeId,
        total_spent: body.total_spent || 0,
        loyalty_points: body.loyalty_points || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: error.message })
      }

      return res.status(201).json({ data })
    }

    // ── PUT / PATCH ────────────────────────────────────────────
    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!hasScope(auth, 'write')) {
        return res.status(403).json({ error: 'Insufficient permissions (write required)' })
      }

      if (!id) {
        return res.status(400).json({ error: 'Customer id is required (?id=xxx)' })
      }

      const body = req.body
      if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ error: 'Request body is required' })
      }

      delete body.store_id
      body.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('customers')
        .update(body)
        .eq('id', id)
        .eq('store_id', auth.storeId)
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: error.message })
      }
      if (!data) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      return res.status(200).json({ data })
    }

    // ── DELETE ──────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!hasScope(auth, 'write')) {
        return res.status(403).json({ error: 'Insufficient permissions (write required)' })
      }

      if (!id) {
        return res.status(400).json({ error: 'Customer id is required (?id=xxx)' })
      }

      const { error } = await supabase
        .from('customers')
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
