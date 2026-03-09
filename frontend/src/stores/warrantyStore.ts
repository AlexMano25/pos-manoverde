import { create } from 'zustand'
import type { WarrantyClaim, ClaimStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface WarrantyState {
  claims: WarrantyClaim[]
  loading: boolean
  filterStatus: ClaimStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface WarrantyActions {
  loadClaims: (storeId: string) => Promise<void>
  addClaim: (
    storeId: string,
    data: Omit<WarrantyClaim, 'id' | 'store_id' | 'claim_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<WarrantyClaim>
  updateClaim: (id: string, updates: Partial<WarrantyClaim>) => Promise<void>
  deleteClaim: (id: string) => Promise<void>
  approveClaim: (id: string) => Promise<void>
  rejectClaim: (id: string) => Promise<void>
  startRepair: (id: string, assignedTo: string, assignedToName: string) => Promise<void>
  completeRepair: (id: string, resolution: string, repairCost?: number) => Promise<void>
  closeClaim: (id: string) => Promise<void>
  markReplaced: (id: string, replacementProductId: string, replacementSerial?: string) => Promise<void>
  getActiveClaims: (storeId: string) => WarrantyClaim[]
  getResolvedThisMonth: (storeId: string) => WarrantyClaim[]
  setFilterStatus: (status: ClaimStatus | 'all') => void
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

async function generateClaimNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const todayPrefix = `WC-${yy}${mm}${dd}-`
  const allClaims = await db.warranty_claims
    .where('store_id')
    .equals(storeId)
    .toArray()
  const todayCount = allClaims.filter((c) => c.claim_number.startsWith(todayPrefix)).length
  const seq = String(todayCount + 1).padStart(3, '0')
  return `${todayPrefix}${seq}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useWarrantyStore = create<WarrantyState & WarrantyActions>()(
  (set, get) => ({
    claims: [],
    loading: false,
    filterStatus: 'all',

    loadClaims: async (storeId: string) => {
      set({ loading: true })
      try {
        const claims = await db.warranty_claims
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        claims.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ claims })
      } catch (error) {
        console.error('[warrantyStore] Failed to load claims:', error)
      } finally {
        set({ loading: false })
      }
    },

    addClaim: async (storeId, data) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const claim_number = await generateClaimNumber(storeId)

        const claim: WarrantyClaim = {
          ...data,
          id: generateUUID(),
          store_id: storeId,
          claim_number,
          synced: false,
          created_at: now,
          updated_at: now,
        }

        await db.warranty_claims.add(claim)
        await addToSyncQueue('warranty_claim', claim.id, 'create', claim, storeId)

        set((state) => ({
          claims: [claim, ...state.claims],
        }))
        return claim
      } catch (error) {
        console.error('[warrantyStore] Failed to add claim:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    updateClaim: async (id, updates) => {
      set({ loading: true })
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.warranty_claims.update(id, merged)

        const claim = await db.warranty_claims.get(id)
        if (claim) {
          await addToSyncQueue('warranty_claim', id, 'update', claim, claim.store_id)
        }

        set((state) => ({
          claims: state.claims.map((c) =>
            c.id === id ? { ...c, ...merged } : c
          ),
        }))
      } catch (error) {
        console.error('[warrantyStore] Failed to update claim:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    deleteClaim: async (id) => {
      set({ loading: true })
      try {
        const claim = await db.warranty_claims.get(id)
        await db.warranty_claims.delete(id)
        if (claim) {
          await addToSyncQueue('warranty_claim', id, 'delete', claim, claim.store_id)
        }
        set((state) => ({
          claims: state.claims.filter((c) => c.id !== id),
        }))
      } catch (error) {
        console.error('[warrantyStore] Failed to delete claim:', error)
        throw error
      } finally {
        set({ loading: false })
      }
    },

    approveClaim: async (id) => {
      try {
        await get().updateClaim(id, {
          claim_status: 'approved',
        })
      } catch (error) {
        console.error('[warrantyStore] Failed to approve claim:', error)
        throw error
      }
    },

    rejectClaim: async (id) => {
      try {
        await get().updateClaim(id, {
          claim_status: 'rejected',
        })
      } catch (error) {
        console.error('[warrantyStore] Failed to reject claim:', error)
        throw error
      }
    },

    startRepair: async (id, assignedTo, assignedToName) => {
      try {
        await get().updateClaim(id, {
          claim_status: 'in_repair',
          assigned_to: assignedTo,
          assigned_to_name: assignedToName,
        })
      } catch (error) {
        console.error('[warrantyStore] Failed to start repair:', error)
        throw error
      }
    },

    completeRepair: async (id, resolution, repairCost) => {
      try {
        const updates: Partial<WarrantyClaim> = {
          claim_status: 'repaired',
          resolution,
          resolved_at: new Date().toISOString(),
        }
        if (repairCost !== undefined) {
          updates.repair_cost = repairCost
        }
        await get().updateClaim(id, updates)
      } catch (error) {
        console.error('[warrantyStore] Failed to complete repair:', error)
        throw error
      }
    },

    closeClaim: async (id) => {
      try {
        await get().updateClaim(id, {
          claim_status: 'closed',
          resolved_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('[warrantyStore] Failed to close claim:', error)
        throw error
      }
    },

    markReplaced: async (id, replacementProductId, replacementSerial) => {
      try {
        const updates: Partial<WarrantyClaim> = {
          claim_status: 'replaced',
          replacement_product_id: replacementProductId,
          resolved_at: new Date().toISOString(),
        }
        if (replacementSerial !== undefined) {
          updates.replacement_serial = replacementSerial
        }
        await get().updateClaim(id, updates)
      } catch (error) {
        console.error('[warrantyStore] Failed to mark replaced:', error)
        throw error
      }
    },

    getActiveClaims: (storeId) => {
      return get().claims.filter(
        (c) =>
          c.store_id === storeId &&
          c.claim_status !== 'closed' &&
          c.claim_status !== 'rejected'
      )
    },

    getResolvedThisMonth: (storeId) => {
      const { start, end } = getCurrentMonthRange()
      return get().claims.filter(
        (c) =>
          c.store_id === storeId &&
          c.resolved_at &&
          c.resolved_at >= start &&
          c.resolved_at <= end &&
          (c.claim_status === 'repaired' ||
            c.claim_status === 'replaced' ||
            c.claim_status === 'closed')
      )
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
