import { create } from 'zustand'
import type { LoyaltyReward, PointTransaction, PointTransactionType, LoyaltyTier, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface LoyaltyState {
  rewards: LoyaltyReward[]
  transactions: PointTransaction[]
  loading: boolean
  filterType: PointTransactionType | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface LoyaltyActions {
  loadRewards: (storeId: string) => Promise<void>
  loadTransactions: (storeId: string) => Promise<void>
  addReward: (
    storeId: string,
    data: Omit<LoyaltyReward, 'id' | 'store_id' | 'redemption_count' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<LoyaltyReward>
  updateReward: (id: string, updates: Partial<LoyaltyReward>) => Promise<void>
  deleteReward: (id: string) => Promise<void>
  earnPoints: (
    storeId: string,
    customerId: string,
    customerName: string,
    points: number,
    orderId?: string
  ) => Promise<PointTransaction>
  redeemPoints: (
    storeId: string,
    customerId: string,
    customerName: string,
    points: number,
    rewardId?: string
  ) => Promise<PointTransaction>
  getCustomerBalance: (storeId: string, customerId: string) => number
  getCustomerTier: (totalPoints: number) => LoyaltyTier
  setFilterType: (type: PointTransactionType | 'all') => void
}

// ── Sync helper ──────────────────────────────────────────────────────────────

async function addToSyncQueue(
  entityType: SyncEntry['entity_type'],
  entityId: string,
  operation: SyncEntry['operation'],
  entity: unknown,
  storeId: string
): Promise<void> {
  const entry: SyncEntry = {
    id: generateUUID(),
    entity_type: entityType,
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

export const useLoyaltyStore = create<LoyaltyState & LoyaltyActions>()(
  (set, get) => ({
    rewards: [],
    transactions: [],
    loading: false,
    filterType: 'all',

    loadRewards: async (storeId: string) => {
      set({ loading: true })
      try {
        const rewards = await db.loyalty_rewards
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        rewards.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ rewards })
      } catch (error) {
        console.error('[loyaltyStore] Failed to load rewards:', error)
      } finally {
        set({ loading: false })
      }
    },

    loadTransactions: async (storeId: string) => {
      set({ loading: true })
      try {
        const transactions = await db.point_transactions
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        transactions.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ transactions })
      } catch (error) {
        console.error('[loyaltyStore] Failed to load transactions:', error)
      } finally {
        set({ loading: false })
      }
    },

    addReward: async (storeId, data) => {
      const now = new Date().toISOString()

      const reward: LoyaltyReward = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        redemption_count: 0,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.loyalty_rewards.add(reward)
      await addToSyncQueue('loyalty_reward', reward.id, 'create', reward, storeId)

      set((state) => ({
        rewards: [reward, ...state.rewards],
      }))
      return reward
    },

    updateReward: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.loyalty_rewards.update(id, merged)

      const reward = await db.loyalty_rewards.get(id)
      if (reward) {
        await addToSyncQueue('loyalty_reward', id, 'update', reward, reward.store_id)
      }

      set((state) => ({
        rewards: state.rewards.map((r) =>
          r.id === id ? { ...r, ...merged } : r
        ),
      }))
    },

    deleteReward: async (id) => {
      const reward = await db.loyalty_rewards.get(id)
      await db.loyalty_rewards.delete(id)
      if (reward) {
        await addToSyncQueue('loyalty_reward', id, 'delete', reward, reward.store_id)
      }
      set((state) => ({
        rewards: state.rewards.filter((r) => r.id !== id),
      }))
    },

    earnPoints: async (storeId, customerId, customerName, points, orderId) => {
      const now = new Date().toISOString()
      const currentBalance = get().getCustomerBalance(storeId, customerId)

      const transaction: PointTransaction = {
        id: generateUUID(),
        store_id: storeId,
        customer_id: customerId,
        customer_name: customerName,
        type: 'earn',
        points,
        balance_after: currentBalance + points,
        order_id: orderId,
        synced: false,
        created_at: now,
      }

      await db.point_transactions.add(transaction)
      await addToSyncQueue('point_transaction', transaction.id, 'create', transaction, storeId)

      set((state) => ({
        transactions: [transaction, ...state.transactions],
      }))
      return transaction
    },

    redeemPoints: async (storeId, customerId, customerName, points, rewardId) => {
      const now = new Date().toISOString()
      const currentBalance = get().getCustomerBalance(storeId, customerId)

      const transaction: PointTransaction = {
        id: generateUUID(),
        store_id: storeId,
        customer_id: customerId,
        customer_name: customerName,
        type: 'redeem',
        points: -points,
        balance_after: currentBalance - points,
        order_id: undefined,
        reward_id: rewardId,
        synced: false,
        created_at: now,
      }

      await db.point_transactions.add(transaction)
      await addToSyncQueue('point_transaction', transaction.id, 'create', transaction, storeId)

      set((state) => ({
        transactions: [transaction, ...state.transactions],
      }))
      return transaction
    },

    getCustomerBalance: (storeId, customerId) => {
      const customerTransactions = get().transactions.filter(
        (t) => t.store_id === storeId && t.customer_id === customerId
      )
      return customerTransactions.reduce((sum, t) => sum + t.points, 0)
    },

    getCustomerTier: (totalPoints) => {
      if (totalPoints >= 5000) return 'platinum'
      if (totalPoints >= 2000) return 'gold'
      if (totalPoints >= 500) return 'silver'
      return 'bronze'
    },

    setFilterType: (type) => {
      set({ filterType: type })
    },
  })
)
