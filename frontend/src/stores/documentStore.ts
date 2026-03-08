import { create } from 'zustand'
import type { PosDocument, DocumentType, DocumentStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface DocumentState {
  documents: PosDocument[]
  loading: boolean
  filterType: DocumentType | 'all'
  filterStatus: DocumentStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface DocumentActions {
  loadDocuments: (storeId: string) => Promise<void>
  addDocument: (
    storeId: string,
    data: Omit<PosDocument, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<PosDocument>
  updateDocument: (id: string, updates: Partial<PosDocument>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  archiveDocument: (id: string) => Promise<void>
  unarchiveDocument: (id: string) => Promise<void>
  getDocumentsByEntity: (storeId: string, entityType: string, entityId: string) => PosDocument[]
  getTotalSize: (storeId: string) => number
  setFilterType: (type: DocumentType | 'all') => void
  setFilterStatus: (status: DocumentStatus | 'all') => void
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

export const useDocumentStore = create<DocumentState & DocumentActions>()(
  (set, get) => ({
    documents: [],
    loading: false,
    filterType: 'all',
    filterStatus: 'all',

    loadDocuments: async (storeId: string) => {
      set({ loading: true })
      try {
        const documents = await db.pos_documents
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        documents.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ documents })
      } catch (error) {
        console.error('[documentStore] Failed to load documents:', error)
      } finally {
        set({ loading: false })
      }
    },

    addDocument: async (storeId, data) => {
      const now = new Date().toISOString()

      const document: PosDocument = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      try {
        await db.pos_documents.add(document)
        await addToSyncQueue('pos_document', document.id, 'create', document, storeId)

        set((state) => ({
          documents: [document, ...state.documents],
        }))
      } catch (error) {
        console.error('[documentStore] Failed to add document:', error)
        throw error
      }
      return document
    },

    updateDocument: async (id, updates) => {
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.pos_documents.update(id, merged)

        const document = await db.pos_documents.get(id)
        if (document) {
          await addToSyncQueue('pos_document', id, 'update', document, document.store_id)
        }

        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...merged } : d
          ),
        }))
      } catch (error) {
        console.error('[documentStore] Failed to update document:', error)
        throw error
      }
    },

    deleteDocument: async (id) => {
      try {
        const document = await db.pos_documents.get(id)
        await db.pos_documents.delete(id)
        if (document) {
          await addToSyncQueue('pos_document', id, 'delete', document, document.store_id)
        }
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }))
      } catch (error) {
        console.error('[documentStore] Failed to delete document:', error)
        throw error
      }
    },

    archiveDocument: async (id) => {
      try {
        await get().updateDocument(id, { status: 'archived' })
      } catch (error) {
        console.error('[documentStore] Failed to archive document:', error)
        throw error
      }
    },

    unarchiveDocument: async (id) => {
      try {
        await get().updateDocument(id, { status: 'active' })
      } catch (error) {
        console.error('[documentStore] Failed to unarchive document:', error)
        throw error
      }
    },

    getDocumentsByEntity: (storeId, entityType, entityId) => {
      return get().documents.filter(
        (d) =>
          d.store_id === storeId &&
          d.related_entity_type === entityType &&
          d.related_entity_id === entityId
      )
    },

    getTotalSize: (storeId) => {
      return get()
        .documents.filter((d) => d.store_id === storeId)
        .reduce((sum, d) => sum + (d.file_size || 0), 0)
    },

    setFilterType: (type) => {
      set({ filterType: type })
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
