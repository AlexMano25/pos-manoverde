import { create } from 'zustand'
import type { StockTransfer, TransferStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface TransferState {
  transfers: StockTransfer[]
  loading: boolean
  filterStatus: TransferStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface TransferActions {
  loadTransfers: (storeId: string) => Promise<void>
  addTransfer: (
    storeId: string,
    data: Omit<StockTransfer, 'id' | 'store_id' | 'transfer_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<StockTransfer>
  updateTransfer: (id: string, updates: Partial<StockTransfer>) => Promise<void>
  deleteTransfer: (id: string) => Promise<void>
  approveTransfer: (id: string, approvedBy: string, approvedByName: string) => Promise<void>
  shipTransfer: (id: string) => Promise<void>
  receiveTransfer: (id: string, receivedBy: string, receivedByName: string) => Promise<void>
  cancelTransfer: (id: string) => Promise<void>
  getMonthlyValue: (storeId: string) => number
  setFilterStatus: (status: TransferStatus | 'all') => void
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

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
  return { start, end }
}

async function generateTransferNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const count = await db.stock_transfers.where('store_id').equals(storeId).count()
  const seq = String(count + 1).padStart(3, '0')
  return `TR-${yy}${mm}${dd}-${seq}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useTransferStore = create<TransferState & TransferActions>()(
  (set, get) => ({
    transfers: [],
    loading: false,
    filterStatus: 'all',

    loadTransfers: async (storeId: string) => {
      set({ loading: true })
      try {
        const transfers = await db.stock_transfers
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        transfers.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ transfers })
      } catch (error) {
        console.error('[transferStore] Failed to load transfers:', error)
      } finally {
        set({ loading: false })
      }
    },

    addTransfer: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const transfer_number = await generateTransferNumber(storeId)

        const transfer: StockTransfer = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          transfer_number,
          synced: false,
          created_at: now,
          updated_at: now,
        }

        await db.stock_transfers.add(transfer)
        await addToSyncQueue('stock_transfer', transfer.id, 'create', transfer, storeId)

        set((state) => ({
          transfers: [transfer, ...state.transfers],
        }))
        return transfer
      } catch (error) {
        console.error('[transferStore] Failed to add transfer:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    updateTransfer: async (id, updates) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.stock_transfers.update(id, merged)

        const transfer = await db.stock_transfers.get(id)
        if (transfer) {
          await addToSyncQueue('stock_transfer', id, 'update', transfer, transfer.store_id)
        }

        set((state) => ({
          transfers: state.transfers.map((t) =>
            t.id === id ? { ...t, ...merged } : t
          ),
        }))
      } catch (error) {
        console.error('[transferStore] Failed to update transfer:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    deleteTransfer: async (id) => {
      set({ loading: true })
      try {
        const transfer = await db.stock_transfers.get(id)
        await db.stock_transfers.delete(id)
        if (transfer) {
          await addToSyncQueue('stock_transfer', id, 'delete', transfer, transfer.store_id)
        }
        set((state) => ({
          transfers: state.transfers.filter((t) => t.id !== id),
        }))
      } catch (error) {
        console.error('[transferStore] Failed to delete transfer:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    approveTransfer: async (id, approvedBy, approvedByName) => {
      try {
        await get().updateTransfer(id, {
          status: 'pending',
          approved_by: approvedBy,
          approved_by_name: approvedByName,
        })
      } catch (error) {
        console.error('[transferStore] Failed to approve transfer:', error)
        throw error
      }
    },

    shipTransfer: async (id) => {
      try {
        await get().updateTransfer(id, {
          status: 'in_transit',
          shipped_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('[transferStore] Failed to ship transfer:', error)
        throw error
      }
    },

    receiveTransfer: async (id, receivedBy, receivedByName) => {
      try {
        await get().updateTransfer(id, {
          status: 'received',
          received_at: new Date().toISOString(),
          received_by: receivedBy,
          received_by_name: receivedByName,
        })
      } catch (error) {
        console.error('[transferStore] Failed to receive transfer:', error)
        throw error
      }
    },

    cancelTransfer: async (id) => {
      try {
        await get().updateTransfer(id, {
          status: 'cancelled',
        })
      } catch (error) {
        console.error('[transferStore] Failed to cancel transfer:', error)
        throw error
      }
    },

    getMonthlyValue: (storeId) => {
      const { start, end } = getCurrentMonthRange()
      return get()
        .transfers.filter(
          (t) =>
            t.store_id === storeId &&
            t.created_at >= start &&
            t.created_at <= end &&
            t.status === 'received'
        )
        .reduce((sum, t) => sum + t.total_value, 0)
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
