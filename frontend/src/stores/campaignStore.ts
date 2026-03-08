import { create } from 'zustand'
import type { Campaign, CampaignType, CampaignStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface CampaignState {
  campaigns: Campaign[]
  loading: boolean
  filterType: CampaignType | 'all'
  filterStatus: CampaignStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface CampaignActions {
  loadCampaigns: (storeId: string) => Promise<void>
  addCampaign: (
    storeId: string,
    data: Omit<Campaign, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<Campaign>
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  sendCampaign: (id: string) => Promise<void>
  scheduleCampaign: (id: string, scheduledAt: string) => Promise<void>
  cancelCampaign: (id: string) => Promise<void>
  duplicateCampaign: (storeId: string, campaignId: string) => Promise<Campaign | undefined>
  setFilterType: (type: CampaignType | 'all') => void
  setFilterStatus: (status: CampaignStatus | 'all') => void
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

export const useCampaignStore = create<CampaignState & CampaignActions>()(
  (set, get) => ({
    campaigns: [],
    loading: false,
    filterType: 'all',
    filterStatus: 'all',

    loadCampaigns: async (storeId: string) => {
      set({ loading: true })
      try {
        const campaigns = await db.campaigns
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        campaigns.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ campaigns })
      } catch (error) {
        console.error('[campaignStore] Failed to load campaigns:', error)
      } finally {
        set({ loading: false })
      }
    },

    addCampaign: async (storeId, data) => {
      const now = new Date().toISOString()

      const campaign: Campaign = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        status: 'draft',
        recipients_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        failed_count: 0,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      try {
        await db.campaigns.add(campaign)
        await addToSyncQueue('campaign', campaign.id, 'create', campaign, storeId)

        set((state) => ({
          campaigns: [campaign, ...state.campaigns],
        }))
        return campaign
      } catch (error) {
        console.error('[campaignStore] Failed to add campaign:', error)
        throw error
      }
    },

    updateCampaign: async (id, updates) => {
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.campaigns.update(id, merged)

        const campaign = await db.campaigns.get(id)
        if (campaign) {
          await addToSyncQueue('campaign', id, 'update', campaign, campaign.store_id)
        }

        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...merged } : c
          ),
        }))
      } catch (error) {
        console.error('[campaignStore] Failed to update campaign:', error)
        throw error
      }
    },

    deleteCampaign: async (id) => {
      try {
        const campaign = await db.campaigns.get(id)
        await db.campaigns.delete(id)
        if (campaign) {
          await addToSyncQueue('campaign', id, 'delete', campaign, campaign.store_id)
        }
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        }))
      } catch (error) {
        console.error('[campaignStore] Failed to delete campaign:', error)
        throw error
      }
    },

    sendCampaign: async (id) => {
      try {
        const now = new Date().toISOString()
        await get().updateCampaign(id, {
          status: 'sent',
          sent_at: now,
        })
      } catch (error) {
        console.error('[campaignStore] Failed to send campaign:', error)
        throw error
      }
    },

    scheduleCampaign: async (id, scheduledAt) => {
      try {
        await get().updateCampaign(id, {
          status: 'scheduled',
          scheduled_at: scheduledAt,
        })
      } catch (error) {
        console.error('[campaignStore] Failed to schedule campaign:', error)
        throw error
      }
    },

    cancelCampaign: async (id) => {
      try {
        await get().updateCampaign(id, {
          status: 'cancelled',
        })
      } catch (error) {
        console.error('[campaignStore] Failed to cancel campaign:', error)
        throw error
      }
    },

    duplicateCampaign: async (storeId, campaignId) => {
      try {
        const original = await db.campaigns.get(campaignId)
        if (!original) {
          console.error('[campaignStore] Campaign not found for duplication:', campaignId)
          return undefined
        }

        const { id, store_id, synced, created_at, updated_at, status, sent_at, scheduled_at, recipients_count, delivered_count, opened_count, clicked_count, failed_count, ...rest } = original

        return await get().addCampaign(storeId, {
          ...rest,
          name: `${original.name} (copy)`,
          status: 'draft',
          recipients_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          failed_count: 0,
        })
      } catch (error) {
        console.error('[campaignStore] Failed to duplicate campaign:', error)
        throw error
      }
    },

    setFilterType: (type) => {
      set({ filterType: type })
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
