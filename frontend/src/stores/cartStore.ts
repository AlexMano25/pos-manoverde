import { create } from 'zustand'
import type { CartItem, Product } from '../types'

// ── State ────────────────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[]
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface CartActions {
  addItem: (product: Product) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  getTotal: () => number
}

// ── Store (in-memory only, NOT persisted) ────────────────────────────────────

export const useCartStore = create<CartState & CartActions>()((set, get) => ({
  // State
  items: [],

  // Actions
  addItem: (product: Product) => {
    if (product.stock <= 0) return

    set((state) => {
      const existing = state.items.find(
        (item) => item.product_id === product.id
      )

      if (existing) {
        // Don't exceed available stock
        if (existing.qty >= product.stock) return state

        return {
          items: state.items.map((item) =>
            item.product_id === product.id
              ? { ...item, qty: item.qty + 1 }
              : item
          ),
        }
      }

      return {
        items: [
          ...state.items,
          {
            product_id: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
          },
        ],
      }
    })
  },

  updateQty: (productId: string, qty: number) => {
    if (qty <= 0) {
      set((state) => ({
        items: state.items.filter((item) => item.product_id !== productId),
      }))
      return
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.product_id === productId ? { ...item, qty } : item
      ),
    }))
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.product_id !== productId),
    }))
  },

  clear: () => {
    set({ items: [] })
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => {
      const discount = item.discount ?? 0
      return sum + (item.price * item.qty - discount)
    }, 0)
  },
}))
