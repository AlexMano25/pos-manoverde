/**
 * Shared Supabase client for API serverless functions.
 * Uses SUPABASE_SERVICE_ROLE_KEY for full admin access (server-side only).
 * Falls back to anon key for read operations.
 */
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('[API] SUPABASE_URL is not configured')
}

// Use service role key for server-side operations (bypasses RLS)
// Fall back to anon key if service key not set
const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

// Anon client for user-scoped operations (respects RLS)
const supabaseAnon = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

module.exports = { supabase, supabaseAnon, supabaseUrl }
