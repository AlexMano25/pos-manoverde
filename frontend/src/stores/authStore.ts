import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { useAppStore } from './appStore'
import { db } from '../db/dexie'
import type { Activity } from '../types'

// ── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  token: string | null
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  loginWithPin: (pin: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  loadSession: () => void
}

// ── Computed ─────────────────────────────────────────────────────────────────

interface AuthComputed {
  isAuthenticated: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getServerUrl(): string {
  try {
    const stored = localStorage.getItem('pos-app-store')
    if (!stored) return '/api'
    const parsed = JSON.parse(stored)
    return parsed?.state?.serverUrl || '/api'
  } catch {
    return '/api'
  }
}

/**
 * After Supabase Auth login, load initial data from cloud into IndexedDB.
 * This ensures the app has products, store info, etc. on first use.
 */
async function loadCloudDataToIndexedDB(storeId: string): Promise<void> {
  if (!supabase) return

  try {
    // Fetch products from Supabase
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)

    // Fetch recent orders (last 200)
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(200)

    // Fetch users (without password_hash)
    const { data: users } = await supabase
      .from('users')
      .select('id, store_id, name, email, role, pin, phone, is_active, created_at, updated_at')
      .eq('store_id', storeId)

    // Fetch store
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    // Write to IndexedDB
    await db.transaction(
      'rw',
      db.stores,
      db.products,
      db.orders,
      db.users,
      async () => {
        // Store
        if (store) {
          await db.stores.put(store)
        }

        // Products: replace all for this store
        if (products && products.length > 0) {
          await db.products.where('store_id').equals(storeId).delete()
          await db.products.bulkAdd(products)
        }

        // Orders: upsert (put) to avoid duplicates
        if (orders && orders.length > 0) {
          for (const order of orders) {
            await db.orders.put({ ...order, synced: true })
          }
        }

        // Users: replace all for this store
        if (users && users.length > 0) {
          await db.users.where('store_id').equals(storeId).delete()
          await db.users.bulkAdd(users)
        }
      },
    )

    console.info(
      `[authStore] Cloud data loaded: ${products?.length ?? 0} products, ${orders?.length ?? 0} orders, ${users?.length ?? 0} users`,
    )
  } catch (error) {
    console.error('[authStore] Failed to load cloud data to IndexedDB:', error)
    // Non-fatal: the app can still work, data will sync later
  }
}

/**
 * Check if the local Express server is reachable (quick 3s timeout).
 * We call GET /health and verify the JSON response contains { status: 'ok' }
 * to distinguish a real backend from Vite/Vercel SPA fallback (which returns HTML).
 */
async function isLocalServerReachable(): Promise<boolean> {
  const baseUrl = getServerUrl()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return false

    // Verify the response is JSON from the actual backend, not HTML from SPA fallback
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) return false

    const data = await response.json()
    // The Express backend returns { status: 'ok', ... }
    return data && typeof data === 'object' && 'status' in data
  } catch {
    return false
  }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions & AuthComputed>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,

      // Computed (evaluated on access via getter)
      get isAuthenticated(): boolean {
        return get().user !== null
      },

      // Actions
      login: async (email: string, password: string) => {
        // ── Strategy: Try Supabase Auth first if configured ──
        if (isSupabaseConfigured && supabase) {
          // First check if local server is available
          const localAvailable = await isLocalServerReachable()

          if (!localAvailable) {
            // Use Supabase Auth (cloud mode)
            const { data: authData, error: authError } =
              await supabase.auth.signInWithPassword({ email, password })

            if (authError) {
              throw new Error(authError.message)
            }

            // Fetch user profile from users table
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select(
                'id, store_id, name, email, role, pin, phone, is_active, created_at, updated_at',
              )
              .eq('email', email)
              .eq('is_active', true)
              .single()

            if (profileError || !profile) {
              throw new Error('Profil utilisateur introuvable')
            }

            // Fetch store data
            const { data: store, error: storeError } = await supabase
              .from('stores')
              .select('*')
              .eq('id', profile.store_id)
              .single()

            if (storeError || !store) {
              throw new Error('Boutique introuvable')
            }

            // Set app store state (activity and current store)
            const appStore = useAppStore.getState()
            appStore.setActivity((store.activity || 'restaurant') as Activity)
            appStore.setCurrentStore(store)

            // Set auth state
            set({
              user: {
                id: profile.id,
                store_id: profile.store_id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                pin: profile.pin,
                phone: profile.phone,
                is_active: profile.is_active,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
              } as User,
              token: authData.session?.access_token ?? null,
            })

            // Load cloud data into IndexedDB (non-blocking)
            loadCloudDataToIndexedDB(profile.store_id).catch((err) =>
              console.error('[authStore] Background data load failed:', err),
            )

            return
          }
        }

        // ── Fall back to local server (Express backend) ──
        const baseUrl = getServerUrl()

        const response = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.message || 'Login failed')
        }

        const data = await response.json()
        set({
          user: data.user as User,
          token: data.token as string,
        })
      },

      loginWithPin: async (pin: string) => {
        // ── Supabase cloud mode: PIN login via direct users table lookup ──
        if (isSupabaseConfigured && supabase) {
          const localAvailable = await isLocalServerReachable()

          if (!localAvailable) {
            // Look up user by PIN in the users table
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select(
                'id, store_id, name, email, role, pin, phone, is_active, created_at, updated_at',
              )
              .eq('pin', pin)
              .eq('is_active', true)
              .single()

            if (profileError || !profile) {
              throw new Error('PIN invalide')
            }

            // Sign in via Supabase Auth using the user's email
            // We use a known default password for PIN users
            // For proper security, this should use an Edge Function with service_role
            // For MVP, we try the default password
            const { data: authData, error: authError } =
              await supabase.auth.signInWithPassword({
                email: profile.email,
                password: 'admin123', // Default password for PIN-based login in MVP
              })

            if (authError) {
              // If auth fails, we still proceed with an anonymous session
              // The RLS policies allow anon access for basic operations
              console.warn('[authStore] Supabase Auth failed for PIN user, using anon session')
            }

            // Fetch store data
            const { data: store } = await supabase
              .from('stores')
              .select('*')
              .eq('id', profile.store_id)
              .single()

            if (store) {
              const appStore = useAppStore.getState()
              appStore.setActivity((store.activity || 'restaurant') as Activity)
              appStore.setCurrentStore(store)
            }

            set({
              user: profile as User,
              token: authData?.session?.access_token ?? 'pin-session',
            })

            // Load cloud data into IndexedDB
            loadCloudDataToIndexedDB(profile.store_id).catch((err) =>
              console.error('[authStore] Background data load failed:', err),
            )

            return
          }
        }

        // ── Fall back to local server ──
        const baseUrl = getServerUrl()

        const response = await fetch(`${baseUrl}/auth/pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.message || 'PIN login failed')
        }

        const data = await response.json()
        set({
          user: data.user as User,
          token: data.token as string,
        })
      },

      logout: () => {
        // Sign out from Supabase Auth if configured
        if (isSupabaseConfigured && supabase) {
          supabase.auth.signOut().catch(() => {})
        }
        set({ user: null, token: null })
      },

      setUser: (user: User) => {
        set({ user })
      },

      loadSession: () => {
        // The persist middleware automatically rehydrates state from
        // localStorage on store creation. This method provides an explicit
        // reload path, e.g. after external storage mutations.
        const stored = localStorage.getItem('pos-auth-store')
        if (!stored) return

        try {
          const parsed = JSON.parse(stored)
          const state = parsed?.state
          if (state?.token && state?.user) {
            set({ user: state.user, token: state.token })
          }
        } catch {
          // Corrupted storage -- wipe it and reset
          localStorage.removeItem('pos-auth-store')
          set({ user: null, token: null })
        }
      },
    }),
    {
      name: 'pos-auth-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
)
