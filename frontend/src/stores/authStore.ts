import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, RegistrationData, Store } from '../types'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { useAppStore } from './appStore'
import { db } from '../db/dexie'
import type { Activity } from '../types'
import { seedSampleProducts } from '../utils/seedProducts'

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
  register: (data: RegistrationData) => Promise<void>
}

// ── Computed ─────────────────────────────────────────────────────────────────

interface AuthComputed {
  isAuthenticated: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Only admin (owner) can view/switch between multiple stores */
function canAccessMultipleStores(role?: string): boolean {
  return role === 'admin' || role === 'super_admin'
}

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
          // For all_in_one mode, skip local server check and go directly to Supabase
          const appMode = useAppStore.getState().mode
          const localAvailable = appMode === 'all_in_one' ? false : await isLocalServerReachable()

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
            if (!appStore.activity) {
              appStore.setActivity((store.activity || 'restaurant') as Activity)
            }
            appStore.setCurrentStore(store)

            // Detect super admin by email (must be before store selection logic)
            const effectiveRole = email === 'direction@manoverde.com' ? 'super_admin' : profile.role

            // Fetch org stores — only admin/super_admin can switch between stores
            const orgId = store?.organization_id
            if (effectiveRole === 'super_admin') {
              // Super admin: load all stores across ALL organizations, skip store selection
              const { data: allStores } = await supabase
                .from('stores')
                .select('*')
              appStore.setAvailableStores((allStores || [store]) as Store[])
              appStore.setNeedsStoreSelection(false)
              appStore.setSection('super_admin')
            } else if (orgId && canAccessMultipleStores(effectiveRole)) {
              const { data: orgStores } = await supabase
                .from('stores')
                .select('*')
                .eq('organization_id', orgId)
              if (orgStores && orgStores.length > 0) {
                appStore.setAvailableStores(orgStores as Store[])
                if (orgStores.length > 1) {
                  appStore.setNeedsStoreSelection(true)
                }
              }
            } else {
              // Cashier/stock: lock to their assigned store only
              appStore.setAvailableStores([store as Store])
              appStore.setNeedsStoreSelection(false)
            }

            // Set auth state
            set({
              user: {
                id: profile.id,
                store_id: profile.store_id,
                name: profile.name,
                email: profile.email,
                role: effectiveRole,
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
          const appMode = useAppStore.getState().mode
          const localAvailable = appMode === 'all_in_one' ? false : await isLocalServerReachable()

          if (!localAvailable) {
            // Use pin-login Edge Function for secure PIN authentication
            const { data: pinData, error: pinError } = await supabase.functions.invoke(
              'pin-login',
              { body: { pin } },
            )

            if (pinError) {
              throw new Error('PIN invalide')
            }

            // Check for error in response body
            if (pinData?.error) {
              throw new Error(pinData.error)
            }

            if (!pinData?.session || !pinData?.user) {
              throw new Error('PIN invalide')
            }

            // Set the Supabase session from the Edge Function response
            await supabase.auth.setSession({
              access_token: pinData.session.access_token,
              refresh_token: pinData.session.refresh_token,
            })

            const profile = pinData.user

            // Fetch store data
            const { data: store } = await supabase
              .from('stores')
              .select('*')
              .eq('id', profile.store_id)
              .single()

            if (store) {
              const appStore = useAppStore.getState()
              if (!appStore.activity) {
                appStore.setActivity((store.activity || 'restaurant') as Activity)
              }
              appStore.setCurrentStore(store)

              // Fetch org stores — only admin/manager can switch between stores
              const orgId = store?.organization_id
              if (orgId && canAccessMultipleStores(profile.role)) {
                const { data: orgStores } = await supabase
                  .from('stores')
                  .select('*')
                  .eq('organization_id', orgId)
                if (orgStores && orgStores.length > 0) {
                  appStore.setAvailableStores(orgStores as Store[])
                  if (orgStores.length > 1) {
                    appStore.setNeedsStoreSelection(true)
                  }
                }
              } else {
                // Cashier/stock: lock to their assigned store only
                appStore.setAvailableStores([store as Store])
                appStore.setNeedsStoreSelection(false)
              }
            }

            set({
              user: profile as User,
              token: pinData.session.access_token,
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

      register: async (data: RegistrationData) => {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase is not configured')
        }

        // 1. Create Supabase Auth user (unconfirmed at this point)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.ownerEmail,
          password: data.password,
        })
        if (authError) throw new Error(authError.message)
        if (!authData.user) throw new Error('Registration failed')

        // 2. Call the registration RPC function (SECURITY DEFINER)
        //    This auto-confirms the auth user AND creates org/store/user/subscription
        const { data: result, error: rpcError } = await supabase.rpc('register_organization', {
          p_org_name: data.orgName,
          p_owner_name: data.ownerName,
          p_owner_email: data.ownerEmail,
          p_owner_phone: data.ownerPhone,
          p_owner_address: data.ownerAddress,
          p_plan: data.plan,
          p_billing_cycle: data.billingCycle,
          p_payment_method: data.paymentMethod,
          p_store_name: data.storeName,
          p_activity: data.activity,
          p_auth_id: authData.user.id,
          p_terms_accepted_at: data.termsAcceptedAt || null,
        })
        if (rpcError) throw new Error(rpcError.message)

        // 3. Now sign in (user is auto-confirmed by the RPC function)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.ownerEmail,
          password: data.password,
        })
        if (signInError) {
          console.warn('[authStore] Sign-in after registration failed:', signInError.message)
        }

        // 4. Fetch the newly created user profile
        const { data: profile } = await supabase
          .from('users')
          .select('id, store_id, name, email, role, pin, phone, is_active, created_at, updated_at')
          .eq('email', data.ownerEmail)
          .eq('is_active', true)
          .single()

        if (!profile) throw new Error('Failed to fetch user profile after registration')

        // 5. Fetch the store
        const { data: store } = await supabase
          .from('stores')
          .select('*')
          .eq('id', result.store_id)
          .single()

        // 6. Set app state
        const appStore = useAppStore.getState()
        appStore.setActivity(data.activity)
        if (store) {
          appStore.setCurrentStore(store)
          // After registration there is only the one newly created store
          appStore.setAvailableStores([store as Store])
        }

        // 6b. Seed activity-specific sample products for the new store
        seedSampleProducts(result.store_id, data.activity).catch((err) =>
          console.error('[authStore] Sample product seeding failed:', err),
        )

        appStore.setRegistrationMode(false)
        appStore.setSelectedPlan(null)

        // 7. Set auth state
        set({
          user: profile as User,
          token: signInData?.session?.access_token ?? authData.session?.access_token ?? 'registered-session',
        })

        // 8. Load cloud data into IndexedDB (non-blocking)
        loadCloudDataToIndexedDB(profile.store_id).catch((err) =>
          console.error('[authStore] Background data load failed:', err),
        )
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
