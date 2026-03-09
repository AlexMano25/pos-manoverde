import { create } from 'zustand'
import type { PricingRule, PricingRuleStatus, PricingRuleType, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface DynamicPricingState {
  rules: PricingRule[]
  loading: boolean
  filterStatus: PricingRuleStatus | 'all'
  filterType: PricingRuleType | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface DynamicPricingActions {
  loadRules: (storeId: string) => Promise<void>
  addRule: (
    storeId: string,
    data: Omit<PricingRule, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<PricingRule>
  updateRule: (id: string, updates: Partial<PricingRule>) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  activateRule: (id: string) => Promise<void>
  pauseRule: (id: string) => Promise<void>
  duplicateRule: (storeId: string, ruleId: string) => Promise<PricingRule | undefined>
  getActiveCount: () => number
  getTotalApplied: () => number
  getTotalDiscountGiven: () => number
  setFilterStatus: (status: PricingRuleStatus | 'all') => void
  setFilterType: (type: PricingRuleType | 'all') => void
}

// ── Sync helper ──────────────────────────────────────────────────────────────

async function addToSyncQueue(
  entityId: string,
  operation: SyncEntry['operation'],
  entity: unknown,
  storeId: string
): Promise<void> {
  const entry: SyncEntry = {
    id: generateUUID(),
    entity_type: 'pricing_rule',
    entity_id: entityId,
    operation,
    data: JSON.stringify(entity),
    device_id: getDeviceId(),
    store_id: storeId,
    retries: 0,
    created_at: new Date().toISOString(),
  }
  await db.sync_queue.add(entry)
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useDynamicPricingStore = create<DynamicPricingState & DynamicPricingActions>()(
  (set, get) => ({
    rules: [],
    loading: false,
    filterStatus: 'all',
    filterType: 'all',

    loadRules: async (storeId: string) => {
      set({ loading: true })
      try {
        const rules = await db.pricing_rules
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by priority descending (highest first), then by created_at descending
        rules.sort((a, b) => b.priority - a.priority || b.created_at.localeCompare(a.created_at))
        set({ rules })
      } catch (error) {
        console.error('[dynamicPricingStore] Failed to load rules:', error)
      } finally {
        set({ loading: false })
      }
    },

    addRule: async (storeId, data) => {
      const now = new Date().toISOString()

      const rule: PricingRule = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      try {
        await db.pricing_rules.add(rule)
        await addToSyncQueue(rule.id, 'create', rule, storeId)

        set((state) => ({
          rules: [rule, ...state.rules],
        }))
        return rule
      } catch (error) {
        console.error('[dynamicPricingStore] Failed to add rule:', error)
        throw error
      }
    },

    updateRule: async (id, updates) => {
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.pricing_rules.update(id, merged)

        const rule = await db.pricing_rules.get(id)
        if (rule) {
          await addToSyncQueue(id, 'update', rule, rule.store_id)
        }

        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, ...merged } : r
          ),
        }))
      } catch (error) {
        console.error('[dynamicPricingStore] Failed to update rule:', error)
        throw error
      }
    },

    deleteRule: async (id) => {
      try {
        const rule = await db.pricing_rules.get(id)
        await db.pricing_rules.delete(id)
        if (rule) {
          await addToSyncQueue(id, 'delete', rule, rule.store_id)
        }
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
        }))
      } catch (error) {
        console.error('[dynamicPricingStore] Failed to delete rule:', error)
        throw error
      }
    },

    activateRule: async (id) => {
      try {
        const now = new Date().toISOString()
        const updates: Partial<PricingRule> = { status: 'active', updated_at: now }
        await db.pricing_rules.update(id, updates)

        const rule = await db.pricing_rules.get(id)
        if (rule) {
          await addToSyncQueue(id, 'update', rule, rule.store_id)
        }

        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }))
      } catch (error) {
        console.error('[dynamicPricingStore] Failed to activate rule:', error)
        throw error
      }
    },

    pauseRule: async (id) => {
      try {
        const now = new Date().toISOString()
        const updates: Partial<PricingRule> = { status: 'paused', updated_at: now }
        await db.pricing_rules.update(id, updates)

        const rule = await db.pricing_rules.get(id)
        if (rule) {
          await addToSyncQueue(id, 'update', rule, rule.store_id)
        }

        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }))
      } catch (error) {
        console.error('[dynamicPricingStore] Failed to pause rule:', error)
        throw error
      }
    },

    duplicateRule: async (storeId, ruleId) => {
      try {
        const original = await db.pricing_rules.get(ruleId)
        if (!original) {
          console.error('[dynamicPricingStore] Rule not found for duplication:', ruleId)
          return undefined
        }

        return await get().addRule(storeId, {
          name: `${original.name} (copy)`,
          description: original.description,
          type: original.type,
          status: 'draft',
          discount_type: original.discount_type,
          discount_value: original.discount_value,
          priority: original.priority,
          apply_to: original.apply_to,
          category_filter: original.category_filter,
          product_ids: original.product_ids,
          min_quantity: original.min_quantity,
          max_quantity: original.max_quantity,
          min_order_total: original.min_order_total,
          customer_tier: original.customer_tier,
          start_date: original.start_date,
          end_date: original.end_date,
          time_start: original.time_start,
          time_end: original.time_end,
          days_of_week: original.days_of_week,
          bundle_products: original.bundle_products,
          bundle_price: original.bundle_price,
          times_applied: 0,
          total_discount_given: 0,
          created_by: original.created_by,
          created_by_name: original.created_by_name,
          notes: original.notes,
        })
      } catch (error) {
        console.error('[dynamicPricingStore] Failed to duplicate rule:', error)
        throw error
      }
    },

    getActiveCount: () => {
      return get().rules.filter((r) => r.status === 'active').length
    },

    getTotalApplied: () => {
      return get().rules.reduce((sum, r) => sum + r.times_applied, 0)
    },

    getTotalDiscountGiven: () => {
      return get().rules.reduce((sum, r) => sum + r.total_discount_given, 0)
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },

    setFilterType: (type) => {
      set({ filterType: type })
    },
  })
)
