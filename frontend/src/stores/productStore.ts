import { create } from 'zustand'
import type { Product, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface ProductState {
  products: Product[]
  categories: string[]
  loading: boolean
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface ProductActions {
  loadProducts: (storeId: string) => Promise<void>
  addProduct: (product: Product) => Promise<void>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  syncFromServer: (products: Product[]) => Promise<void>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function deriveCategories(products: Product[]): string[] {
  const categorySet = new Set<string>()
  for (const product of products) {
    if (product.category) {
      categorySet.add(product.category)
    }
  }
  return Array.from(categorySet).sort()
}

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

export const useProductStore = create<ProductState & ProductActions>()(
  (set, get) => ({
    // State
    products: [],
    categories: [],
    loading: false,

    // Actions
    loadProducts: async (storeId: string) => {
      set({ loading: true })
      try {
        const products = await db.products
          .where('store_id')
          .equals(storeId)
          .and((p) => p.is_active)
          .toArray()

        set({
          products,
          categories: deriveCategories(products),
        })
      } catch (error) {
        console.error('[productStore] Failed to load products:', error)
      } finally {
        set({ loading: false })
      }
    },

    addProduct: async (product: Product) => {
      try {
        await db.products.add(product)
        await addToSyncQueue(
          'product',
          product.id,
          'create',
          product,
          product.store_id
        )

        const current = get().products
        const updated = [...current, product]
        set({
          products: updated,
          categories: deriveCategories(updated),
        })
      } catch (error) {
        console.error('[productStore] Failed to add product:', error)
        throw error
      }
    },

    updateProduct: async (id: string, updates: Partial<Product>) => {
      try {
        const now = new Date().toISOString()
        await db.products.update(id, { ...updates, updated_at: now })

        const updatedProduct = await db.products.get(id)
        if (updatedProduct) {
          await addToSyncQueue(
            'product',
            id,
            'update',
            updatedProduct,
            updatedProduct.store_id
          )
        }

        const current = get().products
        const updated = current.map((p) =>
          p.id === id ? { ...p, ...updates, updated_at: now } : p
        )
        set({
          products: updated,
          categories: deriveCategories(updated),
        })
      } catch (error) {
        console.error('[productStore] Failed to update product:', error)
        throw error
      }
    },

    deleteProduct: async (id: string) => {
      try {
        const product = await db.products.get(id)
        if (!product) return

        // Soft-delete: mark as inactive
        await db.products.update(id, {
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        await addToSyncQueue(
          'product',
          id,
          'delete',
          product,
          product.store_id
        )

        const current = get().products
        const updated = current.filter((p) => p.id !== id)
        set({
          products: updated,
          categories: deriveCategories(updated),
        })
      } catch (error) {
        console.error('[productStore] Failed to delete product:', error)
        throw error
      }
    },

    syncFromServer: async (products: Product[]) => {
      try {
        await db.transaction('rw', db.products, async () => {
          const storeId = products[0]?.store_id
          if (storeId) {
            // Remove existing products for this store, then bulk-insert
            await db.products.where('store_id').equals(storeId).delete()
          }
          await db.products.bulkAdd(products)
        })

        const activeProducts = products.filter((p) => p.is_active)
        set({
          products: activeProducts,
          categories: deriveCategories(activeProducts),
        })
      } catch (error) {
        console.error(
          '[productStore] Failed to sync products from server:',
          error
        )
        throw error
      }
    },
  })
)
