import api from "./client"
import type { Product } from "../types"

export interface CartLine {
  id: number | null
  product_id: number
  quantity: number
  product: Product
}

export interface CartResponse {
  items: CartLine[]
  subtotal: number
}

export interface CartMergeItem {
  product_id: number
  quantity: number
}

export interface CardDetails {
  number: string
  holder: string
  expiry: string
  cvv: string
}

export interface CreateOrderRequest {
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  note?: string
  payment_method: "cod" | "mock_card" | "vietqr"
  card?: CardDetails
}

export interface OrderResponse {
  id: number
  code: string
  user_id: number
  total_amount_cents: number
  shipping_fee_cents: number
  status: string
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  payment_method: "cod" | "mock_card" | "vietqr"
  payment_status: "unpaid" | "paid" | "failed"
  note: string | null
  created_at: string
  items: Array<{
    id: number
    product_id: number
    product_name: string
    unit_price_cents: number
    quantity: number
  }>
}

export async function getCart(): Promise<CartResponse> {
  const response = await api.get<CartResponse>("/api/cart")
  return response.data
}

export async function addCartItem(
  product_id: number,
  quantity: number
): Promise<CartResponse> {
  const response = await api.post<CartResponse>("/api/cart/items", {
    product_id,
    quantity,
  })
  return response.data
}

export async function updateCartItem(
  product_id: number,
  quantity: number
): Promise<CartResponse> {
  const response = await api.put<CartResponse>(`/api/cart/items/${product_id}`, {
    quantity,
  })
  return response.data
}

export async function removeCartItem(product_id: number): Promise<CartResponse> {
  const response = await api.delete<CartResponse>(`/api/cart/items/${product_id}`)
  return response.data
}

export async function clearServerCart(): Promise<void> {
  await api.delete("/api/cart")
}

export async function mergeCart(items: CartMergeItem[]): Promise<CartResponse> {
  const response = await api.post<CartResponse>("/api/cart/merge", { items })
  return response.data
}

export async function createOrder(
  data: CreateOrderRequest
): Promise<OrderResponse> {
  const response = await api.post<OrderResponse>("/api/orders", data, {
    timeout: 30_000,
  })
  return response.data
}

export async function getOrder(code: string): Promise<OrderResponse> {
  const response = await api.get<OrderResponse>(
    `/api/orders/${encodeURIComponent(code)}`
  )
  return response.data
}
