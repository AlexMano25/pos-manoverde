import { create } from 'zustand'
import type { Quote, QuoteStatus, QuoteItem, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface QuoteState {
  quotes: Quote[]
  loading: boolean
  filterStatus: QuoteStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface QuoteActions {
  loadQuotes: (storeId: string) => Promise<void>
  addQuote: (
    storeId: string,
    data: Omit<Quote, 'id' | 'store_id' | 'quote_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<Quote>
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>
  deleteQuote: (id: string) => Promise<void>
  setStatus: (id: string, status: QuoteStatus) => Promise<void>
  addItem: (quoteId: string, item: QuoteItem) => Promise<void>
  removeItem: (quoteId: string, itemIndex: number) => Promise<void>
  duplicateQuote: (quoteId: string) => Promise<void>
  getExpiredQuotes: (storeId: string) => Quote[]
  setFilterStatus: (status: QuoteStatus | 'all') => void
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateQuoteNumber(existingCount: number): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const nnn = String(existingCount + 1).padStart(3, '0')
  return `QT-${yy}${mm}${dd}-${nnn}`
}

function recalculateQuoteTotals(items: QuoteItem[]): {
  subtotal: number
  total: number
} {
  let subtotal = 0
  for (const item of items) {
    subtotal += item.total
  }
  // total = subtotal (discount and tax are managed separately on the quote)
  return { subtotal, total: subtotal }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useQuoteStore = create<QuoteState & QuoteActions>()(
  (set, get) => ({
    quotes: [],
    loading: false,
    filterStatus: 'all',

    loadQuotes: async (storeId: string) => {
      set({ loading: true })
      try {
        const quotes = await db.quotes
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        quotes.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ quotes })
      } catch (error) {
        console.error('[quoteStore] Failed to load quotes:', error)
      } finally {
        set({ loading: false })
      }
    },

    addQuote: async (storeId, data) => {
      const now = new Date().toISOString()
      const todayStr = now.slice(0, 10)

      // Count today's quotes for number generation
      const todayCount = get().quotes.filter((q) =>
        q.store_id === storeId && q.created_at.startsWith(todayStr)
      ).length

      const quote: Quote = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        quote_number: generateQuoteNumber(todayCount),
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.quotes.add(quote)
      await addToSyncQueue('quote', quote.id, 'create', quote, storeId)

      set((state) => ({
        quotes: [quote, ...state.quotes],
      }))
      return quote
    },

    updateQuote: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.quotes.update(id, merged)

      const quote = await db.quotes.get(id)
      if (quote) {
        await addToSyncQueue('quote', id, 'update', quote, quote.store_id)
      }

      set((state) => ({
        quotes: state.quotes.map((q) =>
          q.id === id ? { ...q, ...merged } : q
        ),
      }))
    },

    deleteQuote: async (id) => {
      const quote = await db.quotes.get(id)
      await db.quotes.delete(id)
      if (quote) {
        await addToSyncQueue('quote', id, 'delete', quote, quote.store_id)
      }
      set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id),
      }))
    },

    setStatus: async (id, status) => {
      await get().updateQuote(id, { status })
    },

    addItem: async (quoteId, item) => {
      const quote = await db.quotes.get(quoteId)
      if (!quote) return

      const newItems = [...quote.items, item]
      const totals = recalculateQuoteTotals(newItems)
      const updates = {
        items: newItems,
        subtotal: totals.subtotal,
        total: totals.subtotal - (quote.discount || 0) + (quote.tax || 0),
      }

      await get().updateQuote(quoteId, updates)
    },

    removeItem: async (quoteId, itemIndex) => {
      const quote = await db.quotes.get(quoteId)
      if (!quote) return

      const newItems = quote.items.filter((_, i) => i !== itemIndex)
      const totals = recalculateQuoteTotals(newItems)
      const updates = {
        items: newItems,
        subtotal: totals.subtotal,
        total: totals.subtotal - (quote.discount || 0) + (quote.tax || 0),
      }

      await get().updateQuote(quoteId, updates)
    },

    duplicateQuote: async (quoteId) => {
      const original = await db.quotes.get(quoteId)
      if (!original) return

      const now = new Date().toISOString()
      const todayStr = now.slice(0, 10)

      const todayCount = get().quotes.filter((q) =>
        q.store_id === original.store_id && q.created_at.startsWith(todayStr)
      ).length

      const duplicate: Quote = {
        ...original,
        id: generateUUID(),
        quote_number: generateQuoteNumber(todayCount),
        status: 'draft',
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.quotes.add(duplicate)
      await addToSyncQueue('quote', duplicate.id, 'create', duplicate, duplicate.store_id)

      set((state) => ({
        quotes: [duplicate, ...state.quotes],
      }))
    },

    getExpiredQuotes: (storeId) => {
      const todayStr = new Date().toISOString().split('T')[0]
      return get().quotes.filter(
        (q) =>
          q.store_id === storeId &&
          q.valid_until < todayStr &&
          q.status !== 'accepted' &&
          q.status !== 'converted'
      )
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
