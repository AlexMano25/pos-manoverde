/**
 * Super Admin API — /api/v1/admin
 * Protected endpoints for managing organizations, plans, and license codes.
 * Only accessible by direction@manoverde.com (super_admin).
 */
const { handleCors, authenticate } = require('../_auth')
const { supabase } = require('../_supabase')

const SUPER_ADMIN_EMAIL = 'direction@manoverde.com'

function isSuperAdmin(auth) {
  return auth && auth.email === SUPER_ADMIN_EMAIL
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return

  const auth = await authenticate(req, res)
  if (!auth) return

  if (!isSuperAdmin(auth)) {
    return res.status(403).json({ error: 'Super admin access required' })
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname.replace('/api/v1/admin', '') || '/'
  const method = req.method

  try {
    // GET /api/v1/admin/organizations
    if (method === 'GET' && (path === '/organizations' || path === '/organizations/')) {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return res.status(500).json({ error: error.message })

      // Enrich with subscription and store data
      const enriched = []
      for (const org of orgs || []) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan, status, current_period_end')
          .eq('organization_id', org.id)
          .limit(1)
          .single()

        const { count: storesCount } = await supabase
          .from('stores')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)

        const { data: credit } = await supabase
          .from('credit_balances')
          .select('balance_usd')
          .eq('organization_id', org.id)
          .limit(1)
          .single()

        enriched.push({
          ...org,
          plan: sub?.plan || 'free',
          status: sub?.status || 'active',
          period_end: sub?.current_period_end || null,
          stores_count: storesCount || 0,
          credit_balance: credit?.balance_usd || null,
        })
      }

      return res.status(200).json({ data: enriched })
    }

    // GET /api/v1/admin/organizations/:id
    const orgMatch = path.match(/^\/organizations\/([^/]+)$/)
    if (method === 'GET' && orgMatch) {
      const orgId = orgMatch[1]

      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (error || !org) return res.status(404).json({ error: 'Organization not found' })

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', orgId)
        .limit(1)
        .single()

      const { data: stores } = await supabase
        .from('stores')
        .select('id, name, activity')
        .eq('organization_id', orgId)

      const { data: credit } = await supabase
        .from('credit_balances')
        .select('*')
        .eq('organization_id', orgId)
        .limit(1)
        .single()

      return res.status(200).json({
        data: {
          ...org,
          subscription: sub,
          stores: stores || [],
          credit_balance: credit,
        },
      })
    }

    // PUT /api/v1/admin/organizations/:id/plan
    const planMatch = path.match(/^\/organizations\/([^/]+)\/plan$/)
    if (method === 'PUT' && planMatch) {
      const orgId = planMatch[1]
      const { plan } = req.body || {}

      if (!plan) return res.status(400).json({ error: 'Plan is required' })

      const validPlans = ['free', 'starter', 'pro', 'enterprise', 'pay_as_you_grow']
      if (!validPlans.includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' })
      }

      const { error } = await supabase
        .from('subscriptions')
        .update({ plan, status: 'active', updated_at: new Date().toISOString() })
        .eq('organization_id', orgId)

      if (error) return res.status(500).json({ error: error.message })

      return res.status(200).json({ success: true, plan })
    }

    // POST /api/v1/admin/licenses
    if (method === 'POST' && (path === '/licenses' || path === '/licenses/')) {
      const { organization_id, code, plan, days } = req.body || {}

      if (!organization_id || !code || !plan || !days) {
        return res.status(400).json({ error: 'Missing required fields: organization_id, code, plan, days' })
      }

      const { data, error } = await supabase
        .from('license_codes')
        .insert({
          organization_id,
          code,
          plan,
          days,
          generated_by: auth.userId,
        })
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })

      return res.status(201).json({ data })
    }

    // GET /api/v1/admin/licenses
    if (method === 'GET' && (path === '/licenses' || path === '/licenses/')) {
      const { data, error } = await supabase
        .from('license_codes')
        .select('*, organizations(name)')
        .order('generated_at', { ascending: false })
        .limit(100)

      if (error) return res.status(500).json({ error: error.message })

      return res.status(200).json({ data: data || [] })
    }

    // GET /api/v1/admin/stats
    if (method === 'GET' && (path === '/stats' || path === '/stats/')) {
      const { count: totalOrgs } = await supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })

      const { data: subs } = await supabase
        .from('subscriptions')
        .select('plan, status')

      const planDist = {}
      const statusDist = {}
      for (const s of subs || []) {
        planDist[s.plan] = (planDist[s.plan] || 0) + 1
        statusDist[s.status] = (statusDist[s.status] || 0) + 1
      }

      return res.status(200).json({
        data: {
          totalOrgs: totalOrgs || 0,
          planDistribution: planDist,
          statusDistribution: statusDist,
        },
      })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[admin API]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
