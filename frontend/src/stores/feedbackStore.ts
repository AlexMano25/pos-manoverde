import { create } from 'zustand'
import type { CustomerFeedback, FeedbackStatus, FeedbackChannel, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface FeedbackState {
  feedbacks: CustomerFeedback[]
  loading: boolean
  filterStatus: FeedbackStatus | 'all'
  filterChannel: FeedbackChannel | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface FeedbackActions {
  loadFeedbacks: (storeId: string) => Promise<void>
  addFeedback: (
    storeId: string,
    data: Omit<CustomerFeedback, 'id' | 'store_id' | 'feedback_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<CustomerFeedback>
  updateFeedback: (id: string, updates: Partial<CustomerFeedback>) => Promise<void>
  deleteFeedback: (id: string) => Promise<void>
  respondToFeedback: (id: string, response: string, respondedBy: string, respondedByName: string) => Promise<void>
  markReviewed: (id: string) => Promise<void>
  markResolved: (id: string) => Promise<void>
  archiveFeedback: (id: string) => Promise<void>
  toggleFeatured: (id: string) => Promise<void>
  getAverageRating: (storeId: string) => number
  getResponseRate: (storeId: string) => number
  setFilterStatus: (status: FeedbackStatus | 'all') => void
  setFilterChannel: (channel: FeedbackChannel | 'all') => void
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

async function generateFeedbackNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const todayPrefix = `FB-${yy}${mm}${dd}-`
  const allFeedbacks = await db.customer_feedbacks
    .where('store_id')
    .equals(storeId)
    .toArray()
  const todayCount = allFeedbacks.filter((f) => f.feedback_number.startsWith(todayPrefix)).length
  const seq = String(todayCount + 1).padStart(3, '0')
  return `${todayPrefix}${seq}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useFeedbackStore = create<FeedbackState & FeedbackActions>()(
  (set, get) => ({
    feedbacks: [],
    loading: false,
    filterStatus: 'all',
    filterChannel: 'all',

    loadFeedbacks: async (storeId: string) => {
      set({ loading: true })
      try {
        const feedbacks = await db.customer_feedbacks
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        feedbacks.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ feedbacks })
      } catch (error) {
        console.error('[feedbackStore] Failed to load feedbacks:', error)
      } finally {
        set({ loading: false })
      }
    },

    addFeedback: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const feedback_number = await generateFeedbackNumber(storeId)

        const feedback: CustomerFeedback = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          feedback_number,
          synced: false,
          created_at: now,
          updated_at: now,
        }

        await db.customer_feedbacks.add(feedback)
        await addToSyncQueue('customer_feedback', feedback.id, 'create', feedback, storeId)

        set((state) => ({
          feedbacks: [feedback, ...state.feedbacks],
        }))
        return feedback
      } catch (error) {
        console.error('[feedbackStore] Failed to add feedback:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    updateFeedback: async (id, updates) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.customer_feedbacks.update(id, merged)

        const feedback = await db.customer_feedbacks.get(id)
        if (feedback) {
          await addToSyncQueue('customer_feedback', id, 'update', feedback, feedback.store_id)
        }

        set((state) => ({
          feedbacks: state.feedbacks.map((f) =>
            f.id === id ? { ...f, ...merged } : f
          ),
        }))
      } catch (error) {
        console.error('[feedbackStore] Failed to update feedback:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    deleteFeedback: async (id) => {
      set({ loading: true })
      try {
        const feedback = await db.customer_feedbacks.get(id)
        await db.customer_feedbacks.delete(id)
        if (feedback) {
          await addToSyncQueue('customer_feedback', id, 'delete', feedback, feedback.store_id)
        }
        set((state) => ({
          feedbacks: state.feedbacks.filter((f) => f.id !== id),
        }))
      } catch (error) {
        console.error('[feedbackStore] Failed to delete feedback:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    respondToFeedback: async (id, response, respondedBy, respondedByName) => {
      try {
        await get().updateFeedback(id, {
          response,
          responded_by: respondedBy,
          responded_by_name: respondedByName,
          status: 'responded',
        })
      } catch (error) {
        console.error('[feedbackStore] Failed to respond to feedback:', error)
        throw error
      }
    },

    markReviewed: async (id) => {
      try {
        await get().updateFeedback(id, {
          status: 'reviewed',
        })
      } catch (error) {
        console.error('[feedbackStore] Failed to mark reviewed:', error)
        throw error
      }
    },

    markResolved: async (id) => {
      try {
        await get().updateFeedback(id, {
          status: 'resolved',
        })
      } catch (error) {
        console.error('[feedbackStore] Failed to mark resolved:', error)
        throw error
      }
    },

    archiveFeedback: async (id) => {
      try {
        await get().updateFeedback(id, {
          status: 'archived',
        })
      } catch (error) {
        console.error('[feedbackStore] Failed to archive feedback:', error)
        throw error
      }
    },

    toggleFeatured: async (id) => {
      try {
        const feedback = get().feedbacks.find((f) => f.id === id)
        if (feedback) {
          await get().updateFeedback(id, {
            is_featured: !feedback.is_featured,
          })
        }
      } catch (error) {
        console.error('[feedbackStore] Failed to toggle featured:', error)
        throw error
      }
    },

    getAverageRating: (storeId) => {
      const storeFeedbacks = get().feedbacks.filter((f) => f.store_id === storeId)
      if (storeFeedbacks.length === 0) return 0
      const total = storeFeedbacks.reduce((sum, f) => sum + f.rating, 0)
      return Math.round((total / storeFeedbacks.length) * 10) / 10
    },

    getResponseRate: (storeId) => {
      const storeFeedbacks = get().feedbacks.filter((f) => f.store_id === storeId)
      if (storeFeedbacks.length === 0) return 0
      const responded = storeFeedbacks.filter(
        (f) => f.status === 'responded' || f.status === 'resolved'
      ).length
      return Math.round((responded / storeFeedbacks.length) * 100)
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },

    setFilterChannel: (channel) => {
      set({ filterChannel: channel })
    },
  })
)
