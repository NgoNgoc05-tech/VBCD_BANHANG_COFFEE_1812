import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product } from "../types"

export interface GuestCartItem {
  product_id: number
  quantity: number
  unit_price_cents: number
  stock: number
}

export interface CartStore {
  cart: GuestCartItem[]
  totalCents: number
  setCart: (items: GuestCartItem[]) => void
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  clearCart: () => void
  recalculateTotal: () => void
}

function calculateTotal(cart: GuestCartItem[]): number {
  return cart.reduce(
    (total, item) => total + item.unit_price_cents * item.quantity,
    0
  )
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      totalCents: 0,

      setCart: (items) =>
        set({ cart: items, totalCents: calculateTotal(items) }),

      addItem: (product: Product, qty = 1) => {
        if (!Number.isInteger(qty) || qty < 1 || product.stock < 1) {
          return
        }

        const currentCart = get().cart
        const existingItem = currentCart.find(
          (item) => item.product_id === product.id
        )
        const currentQuantity = existingItem?.quantity ?? 0
        const quantity = Math.min(currentQuantity + qty, product.stock)
        const unitPrice = product.sale_price_cents ?? product.price_cents
        const updatedItem: GuestCartItem = {
          product_id: product.id,
          quantity,
          unit_price_cents: unitPrice,
          stock: product.stock,
        }

        const cart = existingItem
          ? currentCart.map((item) =>
              item.product_id === product.id ? updatedItem : item
            )
          : [...currentCart, updatedItem]
        set({ cart, totalCents: calculateTotal(cart) })
      },

      removeItem: (productId: number) => {
        const cart = get().cart.filter((item) => item.product_id !== productId)
        set({ cart, totalCents: calculateTotal(cart) })
      },

      updateQty: (productId: number, qty: number) => {
        if (!Number.isInteger(qty) || qty <= 0) {
          get().removeItem(productId)
          return
        }
        const cart = get().cart.map((item) =>
          item.product_id === productId
            ? { ...item, quantity: Math.min(qty, item.stock) }
            : item
        ).filter((item) => item.stock > 0)
        set({ cart, totalCents: calculateTotal(cart) })
      },

      clearCart: () => set({ cart: [], totalCents: 0 }),

      recalculateTotal: () =>
        set({ totalCents: calculateTotal(get().cart) }),
    }),
    {
      name: "phin-bean-cart",
      partialize: (state) => ({
        cart: state.cart,
        totalCents: calculateTotal(state.cart),
      }),
    }
  )
)

export const useCart = useCartStore