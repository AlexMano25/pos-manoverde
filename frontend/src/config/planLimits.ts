// ── Plan Limits Configuration ────────────────────────────────────────────────
// Defines feature and resource limits for each subscription plan.

import type { SubscriptionPlan } from '../types'

export type PlanLimitConfig = {
  maxUsers: number       // -1 = unlimited
  maxProducts: number    // -1 = unlimited
  maxOrdersPerDay: number // -1 = unlimited
  maxStores: number      // -1 = unlimited
  features: string[]     // 'all' = all features enabled
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimitConfig> = {
  free: {
    maxUsers: 2,
    maxProducts: 50,
    maxOrdersPerDay: 20,
    maxStores: 1,
    features: ['pos', 'products'],
  },
  starter: {
    maxUsers: 5,
    maxProducts: 500,
    maxOrdersPerDay: 200,
    maxStores: 2,
    features: ['pos', 'products', 'crm', 'reports', 'receipts'],
  },
  pro: {
    maxUsers: 20,
    maxProducts: 5000,
    maxOrdersPerDay: -1,
    maxStores: 5,
    features: ['all'],
  },
  enterprise: {
    maxUsers: -1,
    maxProducts: -1,
    maxOrdersPerDay: -1,
    maxStores: -1,
    features: ['all'],
  },
  pay_as_you_grow: {
    maxUsers: -1,
    maxProducts: -1,
    maxOrdersPerDay: -1,
    maxStores: -1,
    features: ['all'],
  },
}

/** Cost per ticket/order for pay-as-you-grow billing (USD) */
export const TICKET_PRICE_USD = 0.02
