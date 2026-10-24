import { create } from "zustand"
import { persist } from "zustand/middleware"
import { CartItem, Product } from "../types"

export interface CartStore {
  // State
  cart: CartItem[]
  totalCents: number

  // Actions
  setCart: (items: CartItem[]) => void
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  clearCart: () => void
  recalculateTotal: () => void
}

// Helper: kiểm tra xem product đã hết trong kho chưa
function canAddToCart(cart: CartItem[], product: Product, qty: number): boolean {
  const currentQty = cart
    .filter((item) => item.product_id === product.id)
    .reduce((sum, item) => sum + item.quantity, 0)
  return currentQty + qty <= product.stock
}

// Helper: tính tổng
function calculateTotal(cart: CartItem[], products: Map<number, Product>): number {
  let total = 0
  for (const item of cart) {
    const product = products.get(item.product_id)
    if (product) {
      total += product.sale_price_cents ?? product.price_cents
    }
  }
  return total
}

// Tạo store Zustand (persist localStorage)
export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      totalCents: 0,

      setCart: (items: CartItem[]) =>
        set({
          cart: items,
          totalCents: calculateTotal(items, new Map()), // sẽ recalculate sau khi load products,
        }),

      addItem: (product: Product, qty = 1) => {
        if (!canAddToCart(get().cart, product, qty)) {
          // Nếu vượt kho, chỉ thêm số lượng còn trống
          // Tốt hơn làToast lỗi - để implement riêng
        }

        const existingIndex = get().cart.findIndex(
          (item) => item.product_id === product.id
        )

        if (existingIndex >= 0) {
          // Cập nhật quantity
          const newQty = Math.min(
            get().cart[existingIndex].quantity + qty,
            product.stock
          )
          const newCart = [...get().cart]
          newCart[existingIndex] = {
            ...get().cart[existingIndex],
            quantity: newQty,
          }
          set({ cart: newCart })
        } else {
          set({ cart: [...get().cart, { product_id: product.id, quantity: qty }] })
        }

        get().recalculateTotal()
      },

      removeItem: (productId: number) => {
        set({
          cart: get().cart.filter((item) => item.product_id !== productId),
        })
        get().recalculateTotal()
      },

      updateQty: (productId: number, qty: number) => {
        if (qty <= 0) {
          get().removeItem(productId)
          return
        }
        const product = /* fetch product detail */ null
        const newCart = get().cart.map((item) =>
          item.product_id === productId ? { ...item, quantity: qty } : item
        )
        set({ cart: newCart })
        get().recalculateTotal()
      },

      clearCart: () => set({ cart: [], totalCents: 0 }),

      recalculateTotal: () => {
        // Nơi này sẽ sản phẩm được load từ API, ví dụ qua Map<number, Product>
        // Mình sẽ keep totalCents = 0 nếu chưa có product list.
        // Ở component sẽ truyền products vào hoặc gọi service.
        // Ở đây chỉ set tổng giả định.
        set({ totalCents: 0 })
      },
    }),
    {
      name: "[TÊN SHOP]_cart",
      // Chỉ persist cart items, không persist totalCents (tính toán mới)
      // storage: createJSONStorage({ getItem: () => sessionStorage.getItem("[TÊN SHOP]_cart") }),
    }
  )
)