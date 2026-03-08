import { create } from 'zustand'
import type { Recipe, RecipeStatus, ProductionBatch, ProductionStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface RecipeState {
  recipes: Recipe[]
  batches: ProductionBatch[]
  loading: boolean
  filterStatus: RecipeStatus | 'all'
  filterCategory: string
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface RecipeActions {
  loadRecipes: (storeId: string) => Promise<void>
  addRecipe: (
    storeId: string,
    data: Omit<Recipe, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<Recipe>
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>

  loadBatches: (storeId: string) => Promise<void>
  addBatch: (
    storeId: string,
    data: Omit<ProductionBatch, 'id' | 'store_id' | 'batch_number' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<ProductionBatch>
  updateBatch: (id: string, updates: Partial<ProductionBatch>) => Promise<void>
  deleteBatch: (id: string) => Promise<void>

  startProduction: (id: string, producedBy: string, producedByName: string) => Promise<void>
  completeProduction: (id: string, actualCost?: number) => Promise<void>
  cancelBatch: (id: string) => Promise<void>

  getAvgCost: (storeId: string) => number
  getAvgMargin: (storeId: string) => number

  setFilterStatus: (status: RecipeStatus | 'all') => void
  setFilterCategory: (category: string) => void
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

async function generateBatchNumber(storeId: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const count = await db.production_batches.where('store_id').equals(storeId).count()
  const seq = String(count + 1).padStart(3, '0')
  return `PB-${yy}${mm}${dd}-${seq}`
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useRecipeStore = create<RecipeState & RecipeActions>()(
  (set, get) => ({
    recipes: [],
    batches: [],
    loading: false,
    filterStatus: 'all',
    filterCategory: 'all',

    // ── Recipes ────────────────────────────────────────────────────────────

    loadRecipes: async (storeId: string) => {
      set({ loading: true })
      try {
        const recipes = await db.recipes
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by created_at descending (newest first)
        recipes.sort((a, b) => b.created_at.localeCompare(a.created_at))
        set({ recipes })
      } catch (error) {
        console.error('[recipeStore] Failed to load recipes:', error)
      } finally {
        set({ loading: false })
      }
    },

    addRecipe: async (storeId, data) => {
      const now = new Date().toISOString()

      const recipe: Recipe = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      try {
        await db.recipes.add(recipe)
        await addToSyncQueue('recipe', recipe.id, 'create', recipe, storeId)

        set((state) => ({
          recipes: [recipe, ...state.recipes],
        }))
      } catch (error) {
        console.error('[recipeStore] Failed to add recipe:', error)
        throw error
      }
      return recipe
    },

    updateRecipe: async (id, updates) => {
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.recipes.update(id, merged)

        const recipe = await db.recipes.get(id)
        if (recipe) {
          await addToSyncQueue('recipe', id, 'update', recipe, recipe.store_id)
        }

        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id ? { ...r, ...merged } : r
          ),
        }))
      } catch (error) {
        console.error('[recipeStore] Failed to update recipe:', error)
        throw error
      }
    },

    deleteRecipe: async (id) => {
      try {
        const recipe = await db.recipes.get(id)
        await db.recipes.delete(id)
        if (recipe) {
          await addToSyncQueue('recipe', id, 'delete', recipe, recipe.store_id)
        }
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        }))
      } catch (error) {
        console.error('[recipeStore] Failed to delete recipe:', error)
        throw error
      }
    },

    // ── Production Batches ─────────────────────────────────────────────────

    loadBatches: async (storeId: string) => {
      set({ loading: true })
      try {
        const batches = await db.production_batches
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by planned_date descending (newest first)
        batches.sort((a, b) => b.planned_date.localeCompare(a.planned_date))
        set({ batches })
      } catch (error) {
        console.error('[recipeStore] Failed to load batches:', error)
      } finally {
        set({ loading: false })
      }
    },

    addBatch: async (storeId, data) => {
      const now = new Date().toISOString()
      const batch_number = await generateBatchNumber(storeId)

      const batch: ProductionBatch = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        batch_number,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      try {
        await db.production_batches.add(batch)
        await addToSyncQueue('production_batch', batch.id, 'create', batch, storeId)

        set((state) => ({
          batches: [batch, ...state.batches],
        }))
      } catch (error) {
        console.error('[recipeStore] Failed to add batch:', error)
        throw error
      }
      return batch
    },

    updateBatch: async (id, updates) => {
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.production_batches.update(id, merged)

        const batch = await db.production_batches.get(id)
        if (batch) {
          await addToSyncQueue('production_batch', id, 'update', batch, batch.store_id)
        }

        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === id ? { ...b, ...merged } : b
          ),
        }))
      } catch (error) {
        console.error('[recipeStore] Failed to update batch:', error)
        throw error
      }
    },

    deleteBatch: async (id) => {
      try {
        const batch = await db.production_batches.get(id)
        await db.production_batches.delete(id)
        if (batch) {
          await addToSyncQueue('production_batch', id, 'delete', batch, batch.store_id)
        }
        set((state) => ({
          batches: state.batches.filter((b) => b.id !== id),
        }))
      } catch (error) {
        console.error('[recipeStore] Failed to delete batch:', error)
        throw error
      }
    },

    // ── Production workflow ────────────────────────────────────────────────

    startProduction: async (id, producedBy, producedByName) => {
      try {
        await get().updateBatch(id, {
          status: 'in_progress' as ProductionStatus,
          started_at: new Date().toISOString(),
          produced_by: producedBy,
          produced_by_name: producedByName,
        })
      } catch (error) {
        console.error('[recipeStore] Failed to start production:', error)
        throw error
      }
    },

    completeProduction: async (id, actualCost) => {
      try {
        const updates: Partial<ProductionBatch> = {
          status: 'completed' as ProductionStatus,
          completed_at: new Date().toISOString(),
        }
        if (actualCost !== undefined) {
          updates.actual_cost = actualCost
        }
        await get().updateBatch(id, updates)
      } catch (error) {
        console.error('[recipeStore] Failed to complete production:', error)
        throw error
      }
    },

    cancelBatch: async (id) => {
      try {
        await get().updateBatch(id, {
          status: 'cancelled' as ProductionStatus,
        })
      } catch (error) {
        console.error('[recipeStore] Failed to cancel batch:', error)
        throw error
      }
    },

    // ── Analytics ──────────────────────────────────────────────────────────

    getAvgCost: (storeId) => {
      const storeRecipes = get().recipes.filter(
        (r) => r.store_id === storeId && r.status === 'active'
      )
      if (storeRecipes.length === 0) return 0
      const total = storeRecipes.reduce((sum, r) => sum + r.total_cost, 0)
      return total / storeRecipes.length
    },

    getAvgMargin: (storeId) => {
      const storeRecipes = get().recipes.filter(
        (r) => r.store_id === storeId && r.status === 'active' && r.margin_percent != null
      )
      if (storeRecipes.length === 0) return 0
      const total = storeRecipes.reduce((sum, r) => sum + (r.margin_percent ?? 0), 0)
      return total / storeRecipes.length
    },

    // ── Filters ────────────────────────────────────────────────────────────

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },

    setFilterCategory: (category) => {
      set({ filterCategory: category })
    },
  })
)
