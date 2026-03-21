import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Supabase Client -- optional cloud backend for POS Mano Verde
//
// When VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set the app can sync
// data through Supabase (Postgres + Realtime + Auth).
//
// When those env vars are absent the app operates in "local-only" mode and
// this module exports `null` for the client so consumers can guard accordingly:
//
//   import { supabase } from './supabase'
//   if (supabase) { /* cloud calls */ } else { /* local-only */ }
// ---------------------------------------------------------------------------

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Whether the Supabase integration is configured.
 * Use this to guard cloud-related code paths.
 */
export const isSupabaseConfigured: boolean =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey)

/**
 * The Supabase client instance.
 * `null` when the env vars are not provided (local-only mode).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
        storageKey: 'pos-supabase-auth',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'x-application-name': 'pos-manoverde',
        },
      },
    })
  : null

// ---------------------------------------------------------------------------
// Auth helpers (only usable when Supabase is configured)
// ---------------------------------------------------------------------------

/**
 * Sign in with email + password via Supabase Auth.
 * Returns the session or an error message.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured' }
  }
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

/**
 * Get the current authenticated user (or null).
 */
export async function getCurrentUser() {
  if (!supabase) return null
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Get the current session (or null).
 */
export async function getSession() {
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Listen for auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
): (() => void) | null {
  if (!supabase) return null
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}

// ---------------------------------------------------------------------------
// Realtime helpers
// ---------------------------------------------------------------------------

/**
 * Subscribe to changes on a table scoped to a store.
 * Returns an unsubscribe function.
 */
export function subscribeToTable(
  table: string,
  storeId: string,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: Record<string, unknown>
    old: Record<string, unknown>
  }) => void,
): (() => void) | null {
  if (!supabase) return null

  const channel = supabase
    .channel(`${table}-${storeId}`)
    .on(
      'postgres_changes' as never,
      {
        event: '*',
        schema: 'public',
        table,
        filter: `store_id=eq.${storeId}`,
      },
      (payload: Record<string, unknown>) => {
        callback(
          payload as unknown as {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE'
            new: Record<string, unknown>
            old: Record<string, unknown>
          },
        )
      },
    )
    .subscribe()

  return () => {
    supabase!.removeChannel(channel)
  }
}

// ---------------------------------------------------------------------------
// Data helpers -- thin wrappers around supabase.from(table)
// ---------------------------------------------------------------------------

/**
 * Upsert rows into a Supabase table (used during sync).
 */
export async function upsertRows<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured' }
  }
  if (rows.length === 0) {
    return { success: true }
  }
  const { error } = await supabase.from(table).upsert(rows as never)
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Fetch all rows from a Supabase table for a given store.
 */
export async function fetchRows<T>(
  table: string,
  storeId: string,
): Promise<{ data: T[] | null; error?: string }> {
  if (!supabase) {
    return { data: null, error: 'Supabase is not configured' }
  }
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('store_id', storeId)
  if (error) {
    return { data: null, error: error.message }
  }
  return { data: data as T[] }
}

/**
 * Delete a row by id from a Supabase table.
 */
export async function deleteRow(
  table: string,
  id: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured' }
  }
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}
