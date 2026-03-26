// ── Plan Enforcement Hook ────────────────────────────────────────────────────
// Checks subscription status on startup, hourly, and on reconnect.
// Updates appStore.planStatus with the current enforcement level.

import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { db } from '../db/dexie'
import type { PlanStatus, PlanStatusLevel } from '../types'

const CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
const GRACE_PERIOD_DAYS = 3

export function usePlanEnforcement(): void {
  const connectionStatus = useAppStore(s => s.connectionStatus)
  const setPlanStatus = useAppStore(s => s.setPlanStatus)
  const user = useAuthStore(s => s.user)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCheckRef = useRef<number>(0)

  const checkPlan = useCallback(async () => {
    if (!user) return
    // Super admin is always active
    if (user.role === 'super_admin') {
      setPlanStatus({ level: 'active', daysRemaining: null, creditsRemaining: null, creditsPct: null, checkedAt: new Date().toISOString() })
      return
    }

    try {
      let subscription: any = null
      let creditBalance: number | null = null

      // Try to fetch from Supabase if online
      if (connectionStatus === 'online' && isSupabaseConfigured && supabase) {
        // Get the store's organization_id
        const store = useAppStore.getState().currentStore
        if (store?.organization_id) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('organization_id', store.organization_id)
            .limit(1)
            .single()

          if (sub) {
            subscription = sub
            // Cache in IndexedDB for offline use
            try {
              await db.table('_meta').put({ key: 'subscription', value: sub })
            } catch { /* meta table may not exist */ }
          }

          // Check credit balance for pay_as_you_grow
          if (sub?.plan === 'pay_as_you_grow') {
            const { data: credit } = await supabase
              .from('credit_balances')
              .select('balance_usd')
              .eq('organization_id', store.organization_id)
              .limit(1)
              .single()

            if (credit) {
              creditBalance = credit.balance_usd
              try {
                await db.table('_meta').put({ key: 'credit_balance', value: credit.balance_usd })
              } catch { /* ignore */ }
            }
          }
        }
      } else {
        // Offline: load from IndexedDB cache (with freshness check)
        try {
          const cachedSub = await db.table('_meta').get('subscription')
          if (cachedSub?.value) {
            subscription = cachedSub.value
            // If cached data is older than 7 days, show warning
            const cachedAt = cachedSub.value?.updated_at || cachedSub.value?.created_at
            if (cachedAt) {
              const cacheAge = Date.now() - new Date(cachedAt).getTime()
              if (cacheAge > 14 * 86400000) {
                // >14 days offline without sync → expired, must reconnect
                console.warn('[usePlanEnforcement] Cached subscription >14 days old → expired')
                setPlanStatus({ level: 'expired', daysRemaining: 0, creditsRemaining: null, creditsPct: null, checkedAt: new Date().toISOString() })
                return
              } else if (cacheAge > 7 * 86400000) {
                // >7 days offline → warning, should reconnect soon
                console.warn('[usePlanEnforcement] Cached subscription data is >7 days old')
              }
            }
          }

          const cachedCredit = await db.table('_meta').get('credit_balance')
          if (cachedCredit?.value != null) creditBalance = cachedCredit.value
        } catch { /* meta table may not exist */ }
      }

      if (!subscription) {
        // No subscription data: if online and still no sub → treat as free (limited)
        // If offline with no cache → allow limited access with warning
        if (connectionStatus === 'online') {
          // Online but no subscription found → apply free plan limits
          setPlanStatus({ level: 'active', daysRemaining: null, creditsRemaining: null, creditsPct: null, checkedAt: new Date().toISOString() })
          // Store the fact that this is a free/no-plan user
          useAppStore.getState().setSelectedPlan('free')
        } else {
          // Offline with no cached sub → warning level (limited functionality)
          setPlanStatus({ level: 'warning_30', daysRemaining: null, creditsRemaining: null, creditsPct: null, checkedAt: new Date().toISOString() })
        }
        return
      }

      const plan = subscription.plan as string
      const now = new Date()

      // Free plan — active but with strict limits (enforced in orderStore)
      if (plan === 'free') {
        setPlanStatus({ level: 'active', daysRemaining: null, creditsRemaining: null, creditsPct: null, checkedAt: now.toISOString() })
        return
      }

      let level: PlanStatusLevel = 'active'
      let daysRemaining: number | null = null
      let creditsRemaining: number | null = null
      let creditsPct: number | null = null

      if (plan === 'pay_as_you_grow') {
        // Credit-based enforcement
        creditsRemaining = creditBalance
        // Calculate percentage based on total loaded (not hardcoded)
        let totalLoaded = 10 // default initial credit
        const currentStoreRef = useAppStore.getState().currentStore
        if (connectionStatus === 'online' && isSupabaseConfigured && supabase && currentStoreRef?.organization_id) {
          const { data: cb } = await supabase.from('credit_balances')
            .select('total_loaded_usd').eq('organization_id', currentStoreRef.organization_id).single()
          if (cb?.total_loaded_usd) totalLoaded = Math.max(cb.total_loaded_usd, 1)
        }
        creditsPct = creditsRemaining != null ? Math.max(0, Math.min(100, (creditsRemaining / totalLoaded) * 100)) : null

        if (creditsRemaining != null) {
          if (creditsRemaining <= 0) level = 'expired'
          else if (creditsRemaining <= 2) level = 'warning_10'  // $2 or less = urgent
          else if (creditsRemaining <= 5) level = 'warning_30'  // $5 or less = warning
          else level = 'active'
        }
      } else {
        // Time-based enforcement (starter, pro, enterprise)
        const periodEnd = subscription.current_period_end
        if (periodEnd) {
          const endDate = new Date(periodEnd)
          const diffMs = endDate.getTime() - now.getTime()
          daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

          if (daysRemaining <= -GRACE_PERIOD_DAYS) {
            level = 'expired'
          } else if (daysRemaining <= 0) {
            level = 'grace'
          } else if (daysRemaining <= 5) {
            level = 'warning_10'  // 5 days or less = urgent
          } else if (daysRemaining <= 10) {
            level = 'warning_30'  // 10 days or less = warning
          } else {
            level = 'active'
          }
        }
      }

      const status: PlanStatus = {
        level,
        daysRemaining,
        creditsRemaining,
        creditsPct,
        checkedAt: now.toISOString(),
      }

      setPlanStatus(status)
      lastCheckRef.current = Date.now()
    } catch (err) {
      console.error('[usePlanEnforcement] Check failed:', err)
    }
  }, [user, connectionStatus, setPlanStatus])

  // Check on mount
  useEffect(() => {
    checkPlan()
  }, [checkPlan])

  // Periodic check every hour
  useEffect(() => {
    intervalRef.current = setInterval(checkPlan, CHECK_INTERVAL_MS)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [checkPlan])

  // Check on reconnect
  useEffect(() => {
    if (connectionStatus === 'online' && Date.now() - lastCheckRef.current > 60_000) {
      checkPlan()
    }
  }, [connectionStatus, checkPlan])
}
