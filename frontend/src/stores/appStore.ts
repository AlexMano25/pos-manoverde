import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Activity, ConnectionStatus, Mode, Store } from '../types'

// ── State ────────────────────────────────────────────────────────────────────

interface AppState {
  mode: Mode
  activity: Activity | null
  currentStore: Store | null
  section: string
  connectionStatus: ConnectionStatus
  serverUrl: string
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface AppActions {
  setMode: (mode: Mode) => void
  setActivity: (activity: Activity) => void
  setCurrentStore: (store: Store | null) => void
  setSection: (section: string) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setServerUrl: (url: string) => void
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // State
      mode: 'server',
      activity: null,
      currentStore: null,
      section: 'dashboard',
      connectionStatus: 'offline',
      serverUrl: '',

      // Actions
      setMode: (mode) => set({ mode }),
      setActivity: (activity) => set({ activity }),
      setCurrentStore: (store) => set({ currentStore: store }),
      setSection: (section) => set({ section }),
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      setServerUrl: (url) => set({ serverUrl: url }),
    }),
    {
      name: 'pos-app-store',
      partialize: (state) => ({
        mode: state.mode,
        activity: state.activity,
        serverUrl: state.serverUrl,
      }),
    }
  )
)
