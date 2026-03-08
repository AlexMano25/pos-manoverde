import { create } from 'zustand'
import type { GiftCard, GiftCardStatus, GiftCardTransaction, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface GiftCardState {
  cards: GiftCard[]
  transactions: GiftCardTransaction[]
  loading: boolean
  filterStatus: GiftCardStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface GiftCardActions {
  loadCards: (storeId: string) => Promise<void>
  loadTransactions: (storeId: string) => Promise<void>
  addCard: (
    storeId: string,
    data: Omit<GiftCard, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<GiftCard>
  updateCard: (id: string, updates: Partial<GiftCard>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  redeemCard: (
    storeId: string,
    cardId: string,
    amount: number,
    orderId?: string,
    cashierId?: string,
    cashierName?: string
  ) => Promise<GiftCardTransaction>
  refundCard: (
    storeId: string,
    cardId: string,
    amount: number
  ) => Promise<GiftCardTransaction>
  getCardByCode: (storeId: string, code: string) => GiftCard | undefined
  setFilterStatus: (status: GiftCardStatus | 'all') => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let part1 = ''
  let part2 = ''
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length))
    part2 += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `GC-${part1}-${part2}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useGiftCardStore = create<GiftCardState & GiftCardActions>()(
  (set, get) => ({
    cards: [],
    transactions: [],
    loading: false,
    filterStatus: 'all',

    loadCards: async (storeId: string) => {
      set({ loading: true })
      try {
        const cards = await db.gift_cards
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        cards.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ cards })
      } catch (error) {
        console.error('[giftCardStore] Failed to load cards:', error)
      } finally {
        set({ loading: false })
      }
    },

    loadTransactions: async (storeId: string) => {
      set({ loading: true })
      try {
        const transactions = await db.gift_card_transactions
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        transactions.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ transactions })
      } catch (error) {
        console.error('[giftCardStore] Failed to load transactions:', error)
      } finally {
        set({ loading: false })
      }
    },

    addCard: async (storeId, data) => {
      const now = new Date().toISOString()

      const card: GiftCard = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        code: data.code || generateGiftCardCode(),
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.gift_cards.add(card)
      await addToSyncQueue('gift_card', card.id, 'create', card, storeId)

      set((state) => ({
        cards: [card, ...state.cards],
      }))
      return card
    },

    updateCard: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.gift_cards.update(id, merged)

      const card = await db.gift_cards.get(id)
      if (card) {
        await addToSyncQueue('gift_card', id, 'update', card, card.store_id)
      }

      set((state) => ({
        cards: state.cards.map((c) =>
          c.id === id ? { ...c, ...merged } : c
        ),
      }))
    },

    deleteCard: async (id) => {
      const card = await db.gift_cards.get(id)
      await db.gift_cards.delete(id)
      if (card) {
        await addToSyncQueue('gift_card', id, 'delete', card, card.store_id)
      }
      set((state) => ({
        cards: state.cards.filter((c) => c.id !== id),
      }))
    },

    redeemCard: async (storeId, cardId, amount, orderId, cashierId, cashierName) => {
      const now = new Date().toISOString()
      const card = await db.gift_cards.get(cardId)
      if (!card) throw new Error('Gift card not found')
      if (card.status !== 'active') throw new Error('Gift card is not active')
      if (amount > card.current_balance) throw new Error('Insufficient gift card balance')

      const newBalance = card.current_balance - amount
      const newStatus: GiftCardStatus = newBalance === 0 ? 'redeemed' : 'active'

      // Update the card balance and status
      const cardUpdates: Partial<GiftCard> = {
        current_balance: newBalance,
        status: newStatus,
        last_used_at: now,
        updated_at: now,
      }
      await db.gift_cards.update(cardId, cardUpdates)
      await addToSyncQueue('gift_card', cardId, 'update', { ...card, ...cardUpdates }, storeId)

      set((state) => ({
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, ...cardUpdates } : c
        ),
      }))

      // Create the redeem transaction
      const transaction: GiftCardTransaction = {
        id: generateUUID(),
        store_id: storeId,
        gift_card_id: cardId,
        gift_card_code: card.code,
        type: 'redeem',
        amount: -amount,
        balance_after: newBalance,
        order_id: orderId,
        cashier_id: cashierId,
        cashier_name: cashierName,
        synced: false,
        created_at: now,
      }

      await db.gift_card_transactions.add(transaction)
      await addToSyncQueue('gift_card_transaction', transaction.id, 'create', transaction, storeId)

      set((state) => ({
        transactions: [transaction, ...state.transactions],
      }))
      return transaction
    },

    refundCard: async (storeId, cardId, amount) => {
      const now = new Date().toISOString()
      const card = await db.gift_cards.get(cardId)
      if (!card) throw new Error('Gift card not found')

      const newBalance = card.current_balance + amount
      const newStatus: GiftCardStatus = newBalance > 0 && card.status === 'redeemed' ? 'active' : card.status

      // Update the card balance and status
      const cardUpdates: Partial<GiftCard> = {
        current_balance: newBalance,
        status: newStatus,
        updated_at: now,
      }
      await db.gift_cards.update(cardId, cardUpdates)
      await addToSyncQueue('gift_card', cardId, 'update', { ...card, ...cardUpdates }, storeId)

      set((state) => ({
        cards: state.cards.map((c) =>
          c.id === cardId ? { ...c, ...cardUpdates } : c
        ),
      }))

      // Create the refund transaction
      const transaction: GiftCardTransaction = {
        id: generateUUID(),
        store_id: storeId,
        gift_card_id: cardId,
        gift_card_code: card.code,
        type: 'refund',
        amount,
        balance_after: newBalance,
        synced: false,
        created_at: now,
      }

      await db.gift_card_transactions.add(transaction)
      await addToSyncQueue('gift_card_transaction', transaction.id, 'create', transaction, storeId)

      set((state) => ({
        transactions: [transaction, ...state.transactions],
      }))
      return transaction
    },

    getCardByCode: (storeId, code) => {
      return get().cards.find(
        (c) => c.store_id === storeId && c.code === code
      )
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
