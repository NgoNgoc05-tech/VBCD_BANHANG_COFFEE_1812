import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  addCartItem,
  clearServerCart,
  getCart,
  mergeCart,
  removeCartItem,
  updateCartItem,
  type CartLine,
} from "../api/cart"
import { useAuthStore } from "./authStore"
import type { Product } from "../types"

export interface CartStore {
  items: CartLine[]
  guestItems: CartLine[]
  subtotal: number
  isDrawerOpen: boolean
  isHydrating: boolean
  setItems: (items: CartLine[], subtotal?: number) => void
  addItem: (product: Product, quantity?: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  updateQty: (productId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  clearAfterCheckout: () => void
  hydrateServerCart: () => Promise<void>
  mergeGuestCart: () => Promise<void>
  showGuestCart: () => void
  setDrawerOpen: (open: boolean) => void
}

function getProductPrice(product: Product): number {
  return product.sale_price ?? product.price
}

function calculateSubtotal(items: CartLine[]): number {
  return items.reduce(
    (total, item) => total + getProductPrice(item.product) * item.quantity,
    0
  )
}

function normalizeServerCart(items: CartLine[]): CartLine[] {
  return items.map((item) => ({ ...item, id: item.id ?? null }))
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      guestItems: [],
      subtotal: 0,
      isDrawerOpen: false,
      isHydrating: false,

      setItems: (items, subtotal) => {
        const normalized = normalizeServerCart(items)
        set({ items: normalized, subtotal: subtotal ?? calculateSubtotal(normalized) })
      },

      addItem: async (product, quantity = 1) => {
        if (!Number.isInteger(quantity) || quantity < 1) {
          throw new Error("Số lượng sản phẩm không hợp lệ.")
        }
        if (!product.is_active || product.stock < 1) {
          throw new Error("Sản phẩm hiện đã hết hàng.")
        }

        if (useAuthStore.getState().token) {
          const cart = await addCartItem(product.id, quantity)
          get().setItems(cart.items, cart.subtotal)
        } else {
          const current = get().guestItems
          const existing = current.find((item) => item.product_id === product.id)
          const nextQuantity = (existing?.quantity ?? 0) + quantity
          if (nextQuantity > product.stock) {
            throw new Error(`Chỉ còn ${product.stock} sản phẩm trong kho.`)
          }
          const next = existing
            ? current.map((item) =>
                item.product_id === product.id
                  ? { ...item, quantity: nextQuantity, product }
                  : item
              )
            : [...current, { id: null, product_id: product.id, quantity, product }]
          set({
            guestItems: next,
            items: next,
            subtotal: calculateSubtotal(next),
          })
        }
        set({ isDrawerOpen: true })
      },

      removeItem: async (productId) => {
        if (useAuthStore.getState().token) {
          const cart = await removeCartItem(productId)
          get().setItems(cart.items, cart.subtotal)
        } else {
          const next = get().guestItems.filter((item) => item.product_id !== productId)
          set({ guestItems: next, items: next, subtotal: calculateSubtotal(next) })
        }
      },

      updateQty: async (productId, quantity) => {
        if (!Number.isInteger(quantity) || quantity < 1) {
          throw new Error("Số lượng sản phẩm không hợp lệ.")
        }
        const currentItem = get().items.find((item) => item.product_id === productId)
        if (!currentItem) return
        if (quantity > currentItem.product.stock) {
          throw new Error(`Chỉ còn ${currentItem.product.stock} sản phẩm trong kho.`)
        }

        if (useAuthStore.getState().token) {
          const cart = await updateCartItem(productId, quantity)
          get().setItems(cart.items, cart.subtotal)
        } else {
          const next = get().guestItems.map((item) =>
            item.product_id === productId ? { ...item, quantity } : item
          )
          set({ guestItems: next, items: next, subtotal: calculateSubtotal(next) })
        }
      },

      clearCart: async () => {
        if (useAuthStore.getState().token) {
          await clearServerCart()
        }
        get().clearAfterCheckout()
      },

      clearAfterCheckout: () =>
        set({ items: [], guestItems: [], subtotal: 0, isDrawerOpen: false }),

      hydrateServerCart: async () => {
        if (!useAuthStore.getState().token) {
          get().showGuestCart()
          return
        }
        set({ isHydrating: true })
        try {
          const cart = await getCart()
          get().setItems(cart.items, cart.subtotal)
        } finally {
          set({ isHydrating: false })
        }
      },

      mergeGuestCart: async () => {
        const guestItems = get().guestItems
        if (!useAuthStore.getState().token) {
          throw new Error("Vui lòng đăng nhập để đồng bộ giỏ hàng.")
        }
        const cart =
          guestItems.length > 0
            ? await mergeCart(
                guestItems.map(({ product_id, quantity }) => ({
                  product_id,
                  quantity,
                }))
              )
            : await getCart()
        get().setItems(cart.items, cart.subtotal)
        set({ guestItems: [] })
      },

      showGuestCart: () => {
        const guestItems = get().guestItems
        set({ items: guestItems, subtotal: calculateSubtotal(guestItems) })
      },

      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
    }),
    {
      name: "phin-bean-cart",
      partialize: (state) => ({ guestItems: state.guestItems }),
    }
  )
)

export const useCart = useCartStore
