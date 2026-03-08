import { create } from 'zustand'
import type { Expense, ExpenseCategory, ExpenseStatus, SyncEntry } from '../types'
import { db, getDeviceId } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

// ── State ────────────────────────────────────────────────────────────────────

interface ExpenseState {
  expenses: Expense[]
  loading: boolean
  filterCategory: ExpenseCategory | 'all'
  filterStatus: ExpenseStatus | 'all'
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface ExpenseActions {
  loadExpenses: (storeId: string) => Promise<void>
  addExpense: (
    storeId: string,
    data: Omit<Expense, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'>
  ) => Promise<Expense>
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  approveExpense: (id: string, approvedBy: string) => Promise<void>
  rejectExpense: (id: string) => Promise<void>
  markPaid: (id: string) => Promise<void>
  getMonthlyTotal: (storeId: string) => number
  getCategoryBreakdown: (storeId: string) => Record<ExpenseCategory, number>
  setFilterCategory: (category: ExpenseCategory | 'all') => void
  setFilterStatus: (status: ExpenseStatus | 'all') => void
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

const ALL_CATEGORIES: ExpenseCategory[] = [
  'rent', 'utilities', 'salaries', 'supplies', 'marketing',
  'maintenance', 'transport', 'taxes', 'insurance', 'food_cost',
  'equipment', 'other',
]

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
  return { start, end }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useExpenseStore = create<ExpenseState & ExpenseActions>()(
  (set, get) => ({
    expenses: [],
    loading: false,
    filterCategory: 'all',
    filterStatus: 'all',

    loadExpenses: async (storeId: string) => {
      set({ loading: true })
      try {
        const expenses = await db.expenses
          .where('store_id')
          .equals(storeId)
          .toArray()
        // Sort by expense_date descending (newest first)
        expenses.sort((a, b) => b.expense_date.localeCompare(a.expense_date))
        set({ expenses })
      } catch (error) {
        console.error('[expenseStore] Failed to load expenses:', error)
      } finally {
        set({ loading: false })
      }
    },

    addExpense: async (storeId, data) => {
      const now = new Date().toISOString()

      const expense: Expense = {
        ...data,
        id: generateUUID(),
        store_id: storeId,
        synced: false,
        created_at: now,
        updated_at: now,
      }

      try {
        await db.expenses.add(expense)
        await addToSyncQueue('expense', expense.id, 'create', expense, storeId)

        set((state) => ({
          expenses: [expense, ...state.expenses],
        }))
      } catch (error) {
        console.error('[expenseStore] Failed to add expense:', error)
        throw error
      }
      return expense
    },

    updateExpense: async (id, updates) => {
      try {
        const now = new Date().toISOString()
        const merged = { ...updates, updated_at: now }
        await db.expenses.update(id, merged)

        const expense = await db.expenses.get(id)
        if (expense) {
          await addToSyncQueue('expense', id, 'update', expense, expense.store_id)
        }

        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...merged } : e
          ),
        }))
      } catch (error) {
        console.error('[expenseStore] Failed to update expense:', error)
        throw error
      }
    },

    deleteExpense: async (id) => {
      try {
        const expense = await db.expenses.get(id)
        await db.expenses.delete(id)
        if (expense) {
          await addToSyncQueue('expense', id, 'delete', expense, expense.store_id)
        }
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }))
      } catch (error) {
        console.error('[expenseStore] Failed to delete expense:', error)
        throw error
      }
    },

    approveExpense: async (id, approvedBy) => {
      try {
        await get().updateExpense(id, {
          status: 'approved',
          approved_by: approvedBy,
        })
      } catch (error) {
        console.error('[expenseStore] Failed to approve expense:', error)
        throw error
      }
    },

    rejectExpense: async (id) => {
      try {
        await get().updateExpense(id, {
          status: 'rejected',
        })
      } catch (error) {
        console.error('[expenseStore] Failed to reject expense:', error)
        throw error
      }
    },

    markPaid: async (id) => {
      try {
        await get().updateExpense(id, {
          status: 'paid',
        })
      } catch (error) {
        console.error('[expenseStore] Failed to mark expense as paid:', error)
        throw error
      }
    },

    getMonthlyTotal: (storeId) => {
      const { start, end } = getCurrentMonthRange()
      return get()
        .expenses.filter(
          (e) =>
            e.store_id === storeId &&
            e.expense_date >= start &&
            e.expense_date <= end
        )
        .reduce((sum, e) => sum + e.amount, 0)
    },

    getCategoryBreakdown: (storeId) => {
      const { start, end } = getCurrentMonthRange()
      const breakdown = {} as Record<ExpenseCategory, number>

      // Initialize all categories to 0
      for (const cat of ALL_CATEGORIES) {
        breakdown[cat] = 0
      }

      get()
        .expenses.filter(
          (e) =>
            e.store_id === storeId &&
            e.expense_date >= start &&
            e.expense_date <= end
        )
        .forEach((e) => {
          breakdown[e.category] = (breakdown[e.category] || 0) + e.amount
        })

      return breakdown
    },

    setFilterCategory: (category) => {
      set({ filterCategory: category })
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status })
    },
  })
)
