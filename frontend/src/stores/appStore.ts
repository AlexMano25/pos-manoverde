import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Activity, ConnectionStatus, Mode, PlanStatus, Store, SubscriptionPlan } from '../types'

// ── State ────────────────────────────────────────────────────────────────────

interface AppState {
  mode: Mode
  activity: Activity | null
  currentStore: Store | null
  section: string
  connectionStatus: ConnectionStatus
  serverUrl: string
  selectedPlan: SubscriptionPlan | null
  registrationMode: boolean
  showLogin: boolean
  availableStores: Store[]
  needsStoreSelection: boolean
  isAppInstalled: boolean
  installPromptEvent: any | null  // BeforeInstallPromptEvent (non-persisted)
  pendingAction: { type: 'add'; section: string } | null  // transient, not persisted
  planStatus: PlanStatus | null
  planWarningDismissed: boolean
  sidebarCollapsed: boolean
  referralCode: string | null
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface AppActions {
  setMode: (mode: Mode) => void
  setActivity: (activity: Activity) => void
  setCurrentStore: (store: Store | null) => void
  setSection: (section: string) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setServerUrl: (url: string) => void
  setSelectedPlan: (plan: SubscriptionPlan | null) => void
  setRegistrationMode: (mode: boolean) => void
  setShowLogin: (show: boolean) => void
  setAvailableStores: (stores: Store[]) => void
  setNeedsStoreSelection: (v: boolean) => void
  setIsAppInstalled: (v: boolean) => void
  setInstallPromptEvent: (e: any | null) => void
  setPendingAction: (action: AppState['pendingAction']) => void
  setPlanStatus: (status: PlanStatus | null) => void
  setPlanWarningDismissed: (v: boolean) => void
  toggleSidebar: () => void
  setReferralCode: (code: string | null) => void
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
      selectedPlan: null,
      registrationMode: false,
      showLogin: false,
      availableStores: [],
      needsStoreSelection: false,
      isAppInstalled: false,
      installPromptEvent: null,
      pendingAction: null,
      planStatus: null,
      planWarningDismissed: false,
      sidebarCollapsed: false,
      referralCode: null,

      // Actions
      setMode: (mode) => set({ mode, section: mode === 'client' ? 'pos' : 'dashboard' }),
      setActivity: (activity) => set({ activity }),
      setCurrentStore: (store) => set({ currentStore: store }),
      setSection: (section) => set({ section }),
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      setServerUrl: (url) => set({ serverUrl: url }),
      setSelectedPlan: (plan) => set({ selectedPlan: plan }),
      setRegistrationMode: (mode) => set({ registrationMode: mode }),
      setShowLogin: (show) => set({ showLogin: show }),
      setAvailableStores: (stores) => set({ availableStores: stores }),
      setNeedsStoreSelection: (v) => set({ needsStoreSelection: v }),
      setIsAppInstalled: (v) => set({ isAppInstalled: v }),
      setInstallPromptEvent: (e) => set({ installPromptEvent: e }),
      setPendingAction: (action) => set({ pendingAction: action }),
      setPlanStatus: (status) => set({ planStatus: status }),
      setPlanWarningDismissed: (v) => set({ planWarningDismissed: v }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setReferralCode: (code) => set({ referralCode: code }),
    }),
    {
      name: 'pos-app-store',
      partialize: (state) => ({
        mode: state.mode,
        activity: state.activity,
        serverUrl: state.serverUrl,
        selectedPlan: state.selectedPlan,
        registrationMode: state.registrationMode,
        showLogin: state.showLogin,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
