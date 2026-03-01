import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

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
