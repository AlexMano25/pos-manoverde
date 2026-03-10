/**
 * /api/v1/webhooks — Webhook endpoints management
 *
 * GET    /api/v1/webhooks            — List webhook endpoints
 * POST   /api/v1/webhooks            — Create a webhook endpoint
 * PUT    /api/v1/webhooks?id=xxx     — Update a webhook endpoint
 * DELETE /api/v1/webhooks?id=xxx     — Delete a webhook endpoint
 * POST   /api/v1/webhooks/test       — Test a webhook endpoint
 */
const { supabase } = require('../_supabase')
const { handleCors, authenticate, hasScope } = require('../_auth')

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return

  const auth = await authenticate(req, res)
  if (!auth) return

  // Webhooks require admin scope
  if (!hasScope(auth, 'admin')) {
    return res.status(403).json({ error: 'Insufficient permissions (admin required)' })
  }

  try {
    const { id } = req.query

    // ── GET ────────────────────────────────────────────────────
    if (req.method === 'GET') {
      let query = supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('store_id', auth.storeId)
        .order('created_at', { ascending: false })

      if (id) {
        query = query.eq('id', id).single()
        const { data, error } = await query
        if (error || !data) {
          return res.status(404).json({ error: 'Webhook endpoint not found' })
        }
        return res.status(200).json({ data })
      }

      const { data, error } = await query

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({
        data: data || [],
        count: (data || []).length,
      })
    }

    // ── POST ───────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body

      // Test endpoint
      if (req.query.action === 'test' && body?.url) {
        try {
          const https = require('https')
          const http = require('http')
          const testPayload = JSON.stringify({
            event: 'webhook.test',
            data: { message: 'Test webhook delivery', timestamp: new Date().toISOString() },
          })

          const url = new URL(body.url)
          const client = url.protocol === 'https:' ? https : http

          await new Promise((resolve, reject) => {
            const request = client.request(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ManoVerde-Webhook/1.0',
              },
              timeout: 10000,
            }, (response) => {
              let data = ''
              response.on('data', chunk => { data += chunk })
              response.on('end', () => resolve({ status: response.statusCode, body: data }))
            })
            request.on('error', reject)
            request.write(testPayload)
            request.end()
          })

          return res.status(200).json({ success: true, message: 'Test webhook sent' })
        } catch (err) {
          return res.status(400).json({ error: `Test failed: ${err.message}` })
        }
      }

      if (!body || !body.url || !body.events) {
        return res.status(400).json({ error: 'url and events array are required' })
      }

      // Generate a signing secret
      const crypto = require('crypto')
      const secret = 'whsec_' + crypto.randomBytes(24).toString('hex')

      const endpoint = {
        store_id: auth.storeId,
        url: body.url,
        events: body.events,
        secret,
        active: true,
        description: body.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert(endpoint)
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: error.message })
      }

      return res.status(201).json({ data })
    }

    // ── PUT / PATCH ────────────────────────────────────────────
    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!id) {
        return res.status(400).json({ error: 'Webhook endpoint id is required (?id=xxx)' })
      }

      const body = req.body
      if (!body) {
        return res.status(400).json({ error: 'Request body is required' })
      }

      const allowed = ['url', 'events', 'active', 'description']
      const updates = {}
      for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
      }
      updates.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('webhook_endpoints')
        .update(updates)
        .eq('id', id)
        .eq('store_id', auth.storeId)
        .select()
        .single()

      if (error || !data) {
        return res.status(404).json({ error: 'Webhook endpoint not found' })
      }

      return res.status(200).json({ data })
    }

    // ── DELETE ──────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Webhook endpoint id is required (?id=xxx)' })
      }

      const { error } = await supabase
        .from('webhook_endpoints')
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
