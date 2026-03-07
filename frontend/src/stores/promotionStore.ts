import { create } from 'zustand'
import type { CartItem, Promotion, PromotionType, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── Types ────────────────────────────────────────────────────────────────────

interface AppliedPromotion {
  promotion: Promotion
  discount: number      // total discount amount
  affectedItems: string[] // product_ids affected
}

// ── State ────────────────────────────────────────────────────────────────────

interface PromotionState {
  promotions: Promotion[]
  loading: boolean
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface PromotionActions {
  loadPromotions: (storeId: string) => Promise<void>
  addPromotion: (storeId: string, data: Omit<Promotion, 'id' | 'store_id' | 'usage_count' | 'created_at' | 'updated_at'>) => Promise<Promotion>
  updatePromotion: (id: string, data: Partial<Promotion>) => Promise<void>
  deletePromotion: (id: string) => Promise<void>
  togglePromotion: (id: string) => Promise<void>
  getActivePromotions: (storeId: string) => Promotion[]
  getApplicablePromotions: (items: CartItem[], storeId: string) => AppliedPromotion[]
  calculateTotalDiscount: (items: CartItem[], storeId: string) => { total: number; applied: AppliedPromotion[] }
  incrementUsage: (id: string) => Promise<void>
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
    entity_type: 'promotion',
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function isPromotionCurrentlyActive(promo: Promotion): boolean {
  if (!promo.is_active) return false
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  if (promo.start_date > today) return false
  if (promo.end_date && promo.end_date < today) return false
  if (promo.max_uses && promo.usage_count >= promo.max_uses) return false

  // Check day-of-week condition
  if (promo.conditions.days && promo.conditions.days.length > 0) {
    if (!promo.conditions.days.includes(now.getDay())) return false
  }

  // Check time window (happy hour)
  if (promo.conditions.time_start && promo.conditions.time_end) {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    if (currentTime < promo.conditions.time_start || currentTime > promo.conditions.time_end) return false
  }

  return true
}

function calculatePromoDiscount(promo: Promotion, items: CartItem[]): AppliedPromotion | null {
  // Filter eligible items
  let eligibleItems = items
  if (promo.conditions.product_ids && promo.conditions.product_ids.length > 0) {
    eligibleItems = items.filter(i => promo.conditions.product_ids!.includes(i.product_id))
  }
  if (promo.conditions.categories && promo.conditions.categories.length > 0) {
    // Categories are checked at a higher level (product data needed)
    // For now, apply to all items if no product_ids filter
    if (!promo.conditions.product_ids || promo.conditions.product_ids.length === 0) {
      eligibleItems = items
    }
  }

  if (eligibleItems.length === 0) return null

  const eligibleTotal = eligibleItems.reduce((sum, i) => sum + i.price * i.qty, 0)
  const eligibleQty = eligibleItems.reduce((sum, i) => sum + i.qty, 0)

  // Check minimum conditions
  if (promo.conditions.min_amount && eligibleTotal < promo.conditions.min_amount) return null
  if (promo.conditions.min_qty && eligibleQty < promo.conditions.min_qty) return null

  let discount = 0
  const affectedItems = eligibleItems.map(i => i.product_id)

  switch (promo.type) {
    case 'percentage':
      discount = eligibleTotal * (promo.value / 100)
      break
    case 'fixed_amount':
      discount = Math.min(promo.value, eligibleTotal)
      break
    case 'bogo': {
      // Buy One Get One: cheapest free for every 2 items
      const sorted = [...eligibleItems].sort((a, b) => a.price - b.price)
      const freeCount = Math.floor(eligibleQty / 2)
      let remaining = freeCount
      for (const item of sorted) {
        if (remaining <= 0) break
        const free = Math.min(item.qty, remaining)
        discount += item.price * free
        remaining -= free
      }
      break
    }
    case 'happy_hour':
      discount = eligibleTotal * (promo.value / 100)
      break
    case 'bundle':
      discount = promo.value
      break
  }

  if (discount <= 0) return null

  return { promotion: promo, discount: Math.round(discount), affectedItems }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const usePromotionStore = create<PromotionState & PromotionActions>()(
  (set, get) => ({
    promotions: [],
    loading: false,

    loadPromotions: async (storeId: string) => {
      set({ loading: true })
      try {
        const promotions = await db.promotions
          .where('store_id')
          .equals(storeId)
          .toArray()
        promotions.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ promotions })
      } catch (error) {
        console.error('[promotionStore] Failed to load promotions:', error)
      } finally {
        set({ loading: false })
      }
    },

    addPromotion: async (storeId, data) => {
      const now = new Date().toISOString()
      const promotion: Promotion = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        usage_count: 0,
        created_at: now,
        updated_at: now,
      }
      await db.promotions.add(promotion)
      await addToSyncQueue(promotion.id, 'create', promotion, storeId)
      set((state) => ({
        promotions: [promotion, ...state.promotions],
      }))
      return promotion
    },

    updatePromotion: async (id, data) => {
      const now = new Date().toISOString()
      const updates = { ...data, updated_at: now }
      await db.promotions.update(id, updates)
      const promo = await db.promotions.get(id)
      if (promo) {
        await addToSyncQueue(id, 'update', promo, promo.store_id)
      }
      set((state) => ({
        promotions: state.promotions.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }))
    },

    deletePromotion: async (id) => {
      const promo = await db.promotions.get(id)
      await db.promotions.delete(id)
      if (promo) {
        await addToSyncQueue(id, 'delete', promo, promo.store_id)
      }
      set((state) => ({
        promotions: state.promotions.filter((p) => p.id !== id),
      }))
    },

    togglePromotion: async (id) => {
      const promo = get().promotions.find((p) => p.id === id)
      if (!promo) return
      const now = new Date().toISOString()
      const updates = { is_active: !promo.is_active, updated_at: now }
      await db.promotions.update(id, updates)
      set((state) => ({
        promotions: state.promotions.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }))
    },

    getActivePromotions: (storeId) => {
      return get()
        .promotions.filter((p) => p.store_id === storeId && isPromotionCurrentlyActive(p))
    },

    getApplicablePromotions: (items, storeId) => {
      const activePromos = get().getActivePromotions(storeId)
      const results: AppliedPromotion[] = []
      for (const promo of activePromos) {
        const result = calculatePromoDiscount(promo, items)
        if (result) results.push(result)
      }
      return results
    },

    calculateTotalDiscount: (items, storeId) => {
      const applied = get().getApplicablePromotions(items, storeId)
      // Take the best single promotion (non-stackable)
      if (applied.length === 0) return { total: 0, applied: [] }
      const best = applied.reduce((a, b) => (a.discount > b.discount ? a : b))
      return { total: best.discount, applied: [best] }
    },

    incrementUsage: async (id) => {
      const promo = await db.promotions.get(id)
      if (!promo) return
      const now = new Date().toISOString()
      await db.promotions.update(id, {
        usage_count: promo.usage_count + 1,
        updated_at: now,
      })
      set((state) => ({
        promotions: state.promotions.map((p) =>
          p.id === id
            ? { ...p, usage_count: p.usage_count + 1, updated_at: now }
            : p
        ),
      }))
    },
  })
)

// Re-export type for POS integration
export type { AppliedPromotion, PromotionType }
