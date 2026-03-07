import { create } from 'zustand'
import type { Membership, MembershipStatus, MembershipPlanType, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface MembershipState {
  memberships: Membership[]
  loading: boolean
  filterStatus: MembershipStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface MembershipActions {
  loadMemberships: (storeId: string) => Promise<void>
  addMembership: (
    storeId: string,
    data: Omit<Membership, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<Membership>
  updateMembership: (id: string, updates: Partial<Membership>) => Promise<void>
  deleteMembership: (id: string) => Promise<void>
  renewMembership: (id: string) => Promise<void>
  suspendMembership: (id: string) => Promise<void>
  checkIn: (membershipId: string) => Promise<void>
  getActiveMembers: (storeId: string) => Membership[]
  getExpiringMemberships: (storeId: string, withinDays: number) => Membership[]
  getMembershipByCustomer: (customerId: string) => Membership | undefined
  setFilterStatus: (status: MembershipStatus | 'all') => void
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

// ── Renewal helper ───────────────────────────────────────────────────────────

function computeRenewalDate(currentEnd: string, planType: MembershipPlanType): string {
  const d = new Date(currentEnd)
  switch (planType) {
    case 'daily':
      d.setDate(d.getDate() + 1)
      break
    case 'weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'monthly':
      d.setDate(d.getDate() + 30)
      break
    case 'quarterly':
      d.setDate(d.getDate() + 90)
      break
    case 'yearly':
      d.setDate(d.getDate() + 365)
      break
    case 'session_pack':
      // session_pack: keep same end_date, just reset sessions
      break
  }
  return d.toISOString().split('T')[0]
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useMembershipStore = create<MembershipState & MembershipActions>()(
  (set, get) => ({
    memberships: [],
    loading: false,
    filterStatus: 'all',

    loadMemberships: async (storeId: string) => {
      set({ loading: true })
      try {
        const memberships = await db.memberships
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by customer name
        memberships.sort((a, b) => a.customer_name.localeCompare(b.customer_name))
        set({ memberships })
      } catch (error) {
        console.error('[membershipStore] Failed to load memberships:', error)
      } finally {
        set({ loading: false })
      }
    },

    addMembership: async (storeId, data) => {
      const now = new Date().toISOString()
      const membership: Membership = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      await db.memberships.add(membership)
      await addToSyncQueue('membership', membership.id, 'create', membership, storeId)

      set((state) => ({
        memberships: [...state.memberships, membership].sort((a, b) =>
          a.customer_name.localeCompare(b.customer_name)
        ),
      }))
      return membership
    },

    updateMembership: async (id, updates) => {
      const now = new Date().toISOString()
      const merged = { ...updates, updated_at: now }
      await db.memberships.update(id, merged)

      const membership = await db.memberships.get(id)
      if (membership) {
        await addToSyncQueue('membership', id, 'update', membership, membership.store_id)
      }

      set((state) => ({
        memberships: state.memberships
          .map((m) => (m.id === id ? { ...m, ...merged } : m))
          .sort((a, b) => a.customer_name.localeCompare(b.customer_name)),
      }))
    },

    deleteMembership: async (id) => {
      const membership = await db.memberships.get(id)
      await db.memberships.delete(id)
      if (membership) {
        await addToSyncQueue('membership', id, 'delete', membership, membership.store_id)
      }
      set((state) => ({
        memberships: state.memberships.filter((m) => m.id !== id),
      }))
    },

    renewMembership: async (id) => {
      const membership = await db.memberships.get(id)
      if (!membership) return

      const updates: Partial<Membership> =
        membership.plan_type === 'session_pack'
          ? { sessions_used: 0, status: 'active' as MembershipStatus }
          : {
              end_date: computeRenewalDate(membership.end_date, membership.plan_type),
              status: 'active' as MembershipStatus,
            }

      await get().updateMembership(id, updates)
    },

    suspendMembership: async (id) => {
      await get().updateMembership(id, { status: 'suspended' })
    },

    checkIn: async (membershipId) => {
      const membership = await db.memberships.get(membershipId)
      if (!membership) return

      // For session packs, only check in if sessions remain
      if (
        membership.plan_type === 'session_pack' &&
        membership.sessions_total != null &&
        membership.sessions_used != null &&
        membership.sessions_used >= membership.sessions_total
      ) {
        return
      }

      const now = new Date().toISOString()
      const newUsed = (membership.sessions_used ?? 0) + 1
      const updates = { sessions_used: newUsed, updated_at: now }
      await db.memberships.update(membershipId, updates)

      const updated = await db.memberships.get(membershipId)
      if (updated) {
        await addToSyncQueue('membership', membershipId, 'update', updated, updated.store_id)
      }

      set((state) => ({
        memberships: state.memberships.map((m) =>
          m.id === membershipId ? { ...m, ...updates } : m
        ),
      }))
    },

    getActiveMembers: (storeId) => {
      return get().memberships.filter(
        (m) => m.store_id === storeId && m.status === 'active'
      )
    },

    getExpiringMemberships: (storeId, withinDays) => {
      const now = new Date()
      const threshold = new Date(now)
      threshold.setDate(threshold.getDate() + withinDays)
      const thresholdStr = threshold.toISOString().split('T')[0]
      const todayStr = now.toISOString().split('T')[0]

      return get().memberships.filter(
        (m) =>
          m.store_id === storeId &&
          m.status === 'active' &&
          m.end_date >= todayStr &&
          m.end_date <= thresholdStr
      )
    },

    getMembershipByCustomer: (customerId) => {
      return get().memberships.find(
        (m) => m.customer_id === customerId && m.status === 'active'
      )
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
