/**
 * /api/v1/orders — Orders CRUD
 *
 * GET    /api/v1/orders              — List orders (paginated, filterable)
 * GET    /api/v1/orders?id=xxx       — Get a single order
 * POST   /api/v1/orders              — Create an order
 * PUT    /api/v1/orders?id=xxx       — Update order status
 * DELETE /api/v1/orders?id=xxx       — Delete an order
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
          .from('orders')
          .select('*')
          .eq('id', id)
          .eq('store_id', auth.storeId)
          .single()

        if (error || !data) {
          return res.status(404).json({ error: 'Order not found' })
        }
        return res.status(200).json({ data })
      }

      // List with optional filters
      const {
        status,
        customer_id,
        date_from,
        date_to,
        limit = '50',
        offset = '0',
        sort = 'created_at',
        order = 'desc',
      } = req.query

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('store_id', auth.storeId)

      if (status) query = query.eq('status', status)
      if (customer_id) query = query.eq('customer_id', customer_id)
      if (date_from) query = query.gte('created_at', date_from)
      if (date_to) query = query.lte('created_at', date_to)

      const validSorts = ['created_at', 'updated_at', 'total', 'status']
      const sortCol = validSorts.includes(sort) ? sort : 'created_at'
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
      if (!body || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({ error: 'Order items array is required and must not be empty' })
      }

      // Calculate total if not provided
      const total = body.total || body.items.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 1)
      }, 0)

      const orderData = {
        ...body,
        total,
        store_id: auth.storeId,
        status: body.status || 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: error.message })
      }

      // Update stock levels for each item (non-blocking)
      if (body.items && Array.isArray(body.items)) {
        for (const item of body.items) {
          if (item.product_id && item.quantity) {
            supabase.rpc('decrement_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            }).then(() => {}).catch(() => {})
          }
        }
      }

      return res.status(201).json({ data })
    }

    // ── PUT / PATCH ────────────────────────────────────────────
    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!hasScope(auth, 'write')) {
        return res.status(403).json({ error: 'Insufficient permissions (write required)' })
      }

      if (!id) {
        return res.status(400).json({ error: 'Order id is required (?id=xxx)' })
      }

      const body = req.body
      if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ error: 'Request body is required' })
      }

      // Only allow updating specific fields
      const allowed = ['status', 'payment_method', 'notes', 'customer_id', 'customer_name']
      const updates = {}
      for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
      }
      updates.updated_at = new Date().toISOString()

      if (Object.keys(updates).length <= 1) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .eq('store_id', auth.storeId)
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: error.message })
      }
      if (!data) {
        return res.status(404).json({ error: 'Order not found' })
      }

      return res.status(200).json({ data })
    }

    // ── DELETE ──────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!hasScope(auth, 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions (admin required)' })
      }

      if (!id) {
        return res.status(400).json({ error: 'Order id is required (?id=xxx)' })
      }

      const { error } = await supabase
        .from('orders')
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
