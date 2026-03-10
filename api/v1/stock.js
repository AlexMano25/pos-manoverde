/**
 * /api/v1/stock — Stock levels & movements
 *
 * GET    /api/v1/stock               — List stock levels (all products)
 * GET    /api/v1/stock?product_id=x  — Get stock for one product
 * POST   /api/v1/stock/adjust        — Adjust stock (add/remove)
 * GET    /api/v1/stock/movements     — List stock movements
 * GET    /api/v1/stock/low           — Get low-stock products
 */
const { supabase } = require('../_supabase')
const { handleCors, authenticate, hasScope } = require('../_auth')

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return

  const auth = await authenticate(req, res)
  if (!auth) return

  try {
    // ── GET — stock levels ─────────────────────────────────────
    if (req.method === 'GET') {
      if (!hasScope(auth, 'read')) {
        return res.status(403).json({ error: 'Insufficient permissions (read required)' })
      }

      const { product_id, low_stock, category, limit = '100', offset = '0' } = req.query

      // Single product stock
      if (product_id) {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, stock, min_stock, category, unit, price')
          .eq('id', product_id)
          .eq('store_id', auth.storeId)
          .single()

        if (error || !data) {
          return res.status(404).json({ error: 'Product not found' })
        }

        return res.status(200).json({
          data: {
            ...data,
            is_low: data.min_stock ? data.stock <= data.min_stock : false,
          },
        })
      }

      // List stock levels
      let query = supabase
        .from('products')
        .select('id, name, stock, min_stock, category, unit, price, expiry_date', { count: 'exact' })
        .eq('store_id', auth.storeId)

      if (category) query = query.eq('category', category)

      // Low-stock filter
      if (low_stock === 'true') {
        query = query.not('min_stock', 'is', null)
        // We'll filter client-side since Supabase doesn't easily support column-to-column comparison
      }

      query = query
        .order('stock', { ascending: true })
        .range(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10) - 1)

      const { data, error, count } = await query

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      let results = (data || []).map(p => ({
        ...p,
        is_low: p.min_stock ? p.stock <= p.min_stock : false,
      }))

      // Filter low-stock server-side
      if (low_stock === 'true') {
        results = results.filter(p => p.is_low)
      }

      return res.status(200).json({
        data: results,
        count: low_stock === 'true' ? results.length : (count || 0),
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      })
    }

    // ── POST — stock adjustment ────────────────────────────────
    if (req.method === 'POST') {
      if (!hasScope(auth, 'write')) {
        return res.status(403).json({ error: 'Insufficient permissions (write required)' })
      }

      const body = req.body
      if (!body || !body.product_id) {
        return res.status(400).json({ error: 'product_id is required' })
      }
      if (body.quantity === undefined || body.quantity === null) {
        return res.status(400).json({ error: 'quantity is required (positive to add, negative to remove)' })
      }

      const quantity = parseFloat(body.quantity)
      if (isNaN(quantity) || quantity === 0) {
        return res.status(400).json({ error: 'quantity must be a non-zero number' })
      }

      // Get current product
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('id, name, stock, store_id')
        .eq('id', body.product_id)
        .eq('store_id', auth.storeId)
        .single()

      if (fetchError || !product) {
        return res.status(404).json({ error: 'Product not found' })
      }

      const newStock = (product.stock || 0) + quantity

      // Update product stock
      const { data: updated, error: updateError } = await supabase
        .from('products')
        .update({
          stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.product_id)
        .eq('store_id', auth.storeId)
        .select()
        .single()

      if (updateError) {
        return res.status(400).json({ error: updateError.message })
      }

      // Record stock movement
      const movement = {
        product_id: body.product_id,
        store_id: auth.storeId,
        type: quantity > 0 ? 'in' : 'out',
        quantity: Math.abs(quantity),
        reason: body.reason || (quantity > 0 ? 'manual_add' : 'manual_remove'),
        notes: body.notes || '',
        previous_stock: product.stock || 0,
        new_stock: newStock,
        created_at: new Date().toISOString(),
      }

      // Insert stock movement (non-blocking, don't fail the request if this fails)
      supabase
        .from('stock_movements')
        .insert(movement)
        .then(() => {})
        .catch(() => {})

      return res.status(200).json({
        data: {
          product_id: body.product_id,
          product_name: product.name,
          previous_stock: product.stock || 0,
          adjustment: quantity,
          new_stock: newStock,
          reason: movement.reason,
        },
      })
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed. Use GET or POST.` })
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
