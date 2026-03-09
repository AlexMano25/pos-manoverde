import { create } from 'zustand'
import type { BarcodeBatch, BarcodeBatchStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface BarcodeState {
  batches: BarcodeBatch[]
  loading: boolean
  filterStatus: BarcodeBatchStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface BarcodeActions {
  loadBatches: (storeId: string) => Promise<void>
  addBatch: (
    storeId: string,
    data: Omit<BarcodeBatch, 'id' | 'store_id' | 'batch_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<BarcodeBatch>
  updateBatch: (id: string, updates: Partial<BarcodeBatch>) => Promise<void>
  deleteBatch: (id: string) => Promise<void>
  generateBarcodes: (id: string) => Promise<void>
  markPrinted: (id: string) => Promise<void>
  markApplied: (id: string) => Promise<void>
  getPendingPrint: () => BarcodeBatch[]
  getTotalLabels: () => number
  setFilterStatus: (status: BarcodeBatchStatus | 'all') => void
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

async function generateBatchNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const datePrefix = `BC-${yy}${mm}${dd}`

  // Count today's existing batches for this store to determine sequence number
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()

  const todayBatches = await db.barcode_batches
    .where('store_id')
    .equals(storeId)
    .filter((b) => b.created_at >= todayStart && b.created_at <= todayEnd)
    .count()

  const seq = String(todayBatches + 1).padStart(3, '0')
  return `${datePrefix}-${seq}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useBarcodeStore = create<BarcodeState & BarcodeActions>()(
  (set, get) => ({
    // State
    batches: [],
    loading: false,
    filterStatus: 'all',

    // Actions
    loadBatches: async (storeId: string) => {
      set({ loading: true })
      try {
        const batches = await db.barcode_batches
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        batches.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ batches })
      } catch (error) {
        console.error('[barcodeStore] Failed to load batches:', error)
      } finally {
        set({ loading: false })
      }
    },

    addBatch: async (storeId, data) => {
      const now = new Date().toISOString()
      const batchNumber = await generateBatchNumber(storeId)

      const batch: BarcodeBatch = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        batch_number: batchNumber,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.barcode_batches.add(batch)
      await addToSyncQueue('barcode_batch', batch.id, 'create', batch, storeId)

      set((state) => ({
        batches: [batch, ...state.batches],
      }))
      return batch
    },

    updateBatch: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.barcode_batches.update(id, merged)

      const batch = await db.barcode_batches.get(id)
      if (batch) {
        await addToSyncQueue('barcode_batch', id, 'update', batch, batch.store_id)
      }

      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === id ? { ...b, ...merged } : b
        ),
      }))
    },

    deleteBatch: async (id) => {
      const batch = await db.barcode_batches.get(id)
      await db.barcode_batches.delete(id)
      if (batch) {
        await addToSyncQueue('barcode_batch', id, 'delete', batch, batch.store_id)
      }
      set((state) => ({
        batches: state.batches.filter((b) => b.id !== id),
      }))
    },

    generateBarcodes: async (id) => {
      const now = new Date().toISOString()
      const batch = await db.barcode_batches.get(id)
      if (!batch) throw new Error('Barcode batch not found')

      const updates: Partial<BarcodeBatch> = {
        status: 'generated',
        generated_count: batch.total_labels,
        updated_at: now,
      }

      await db.barcode_batches.update(id, updates)
      await addToSyncQueue('barcode_batch', id, 'update', { ...batch, ...updates }, batch.store_id)

      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        ),
      }))
    },

    markPrinted: async (id) => {
      const now = new Date().toISOString()
      const batch = await db.barcode_batches.get(id)
      if (!batch) throw new Error('Barcode batch not found')

      const updates: Partial<BarcodeBatch> = {
        status: 'printed',
        printed_count: batch.total_labels,
        printed_at: now,
        updated_at: now,
      }

      await db.barcode_batches.update(id, updates)
      await addToSyncQueue('barcode_batch', id, 'update', { ...batch, ...updates }, batch.store_id)

      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        ),
      }))
    },

    markApplied: async (id) => {
      const now = new Date().toISOString()
      const batch = await db.barcode_batches.get(id)
      if (!batch) throw new Error('Barcode batch not found')

      const updates: Partial<BarcodeBatch> = {
        status: 'applied',
        updated_at: now,
      }

      await db.barcode_batches.update(id, updates)
      await addToSyncQueue('barcode_batch', id, 'update', { ...batch, ...updates }, batch.store_id)

      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        ),
      }))
    },

    getPendingPrint: (): BarcodeBatch[] => {
      return get().batches.filter((b) => b.status === 'generated')
    },

    getTotalLabels: (): number => {
      return get().batches.reduce((sum, b) => sum + b.total_labels, 0)
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
