import api from "./client"
import type { Category, PaginatedResponse, Product } from "../types"
import type { OrderResponse } from "./cart"

export interface AdminProduct extends Product {
  category: Category
}

export interface AdminCategory extends Category {
  product_count: number
}

export interface AdminCustomer {
  id: number
  full_name: string
  email: string
  phone: string | null
  created_at: string
  order_count: number
  total_spent: number
}

export interface AdminOrder extends OrderResponse {
  customer_name: string
  customer_email: string | null
}

export interface AdminStats {
  total_revenue: number
  total_orders: number
  total_customers: number
  pending_orders: number
  low_stock_products: number
  revenue_change_percent: number
}

export interface RevenuePoint {
  date: string
  revenue: number
  orders: number
}

export interface AdminProductInput {
  name: string
  category_id: number
  price: number
  sale_price: number | null
  stock: number
  description: string | null
  is_featured: boolean
  image_url: string | null
  images: string[]
  is_active: boolean
}

export interface CategoryInput {
  name: string
  image_url: string | null
}

export async function getAdminStats(): Promise<AdminStats> {
  return (await api.get<AdminStats>("/api/admin/stats")).data
}

export async function getRevenue(days = 30): Promise<RevenuePoint[]> {
  return (await api.get<{ items: RevenuePoint[] }>("/api/admin/stats/revenue", { params: { days } })).data.items
}

export async function getOrdersByStatus(): Promise<Record<string, number>> {
  return (await api.get<Record<string, number>>("/api/admin/stats/orders-by-status")).data
}

export async function getTopProducts(limit = 5): Promise<Array<AdminProduct & { sold_quantity: number }>> {
  return (await api.get<Array<AdminProduct & { sold_quantity: number }>>("/api/admin/stats/top-products", { params: { limit } })).data
}

export async function getRecentOrders(limit = 5): Promise<AdminOrder[]> {
  return (await api.get<AdminOrder[]>("/api/admin/orders/recent", { params: { limit } })).data
}

export async function getAdminProducts(params: {
  search?: string
  category?: number
  status?: string
  page?: number
  page_size?: number
} = {}): Promise<PaginatedResponse<AdminProduct>> {
  return (await api.get<PaginatedResponse<AdminProduct>>("/api/admin/products", { params })).data
}

export async function createAdminProduct(data: AdminProductInput): Promise<AdminProduct> {
  return (await api.post<AdminProduct>("/api/admin/products", data)).data
}

export async function updateAdminProduct(id: number, data: AdminProductInput): Promise<AdminProduct> {
  return (await api.put<AdminProduct>(`/api/admin/products/${id}`, data)).data
}

export async function setAdminProductStatus(
  id: number,
  data: { is_active?: boolean; out_of_stock?: boolean }
): Promise<AdminProduct> {
  return (await api.patch<AdminProduct>(`/api/admin/products/${id}/status`, data)).data
}

export async function deleteAdminProduct(id: number): Promise<{ message: string }> {
  return (await api.delete<{ message: string }>(`/api/admin/products/${id}`)).data
}

export async function uploadAdminImage(file: File): Promise<string> {
  const body = new FormData()
  body.append("file", file)
  return (await api.post<{ url: string }>("/api/admin/upload", body, {
    headers: { "Content-Type": "multipart/form-data" },
  })).data.url
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  return (await api.get<AdminCategory[]>("/api/admin/categories")).data
}

export async function createAdminCategory(data: CategoryInput): Promise<AdminCategory> {
  return (await api.post<AdminCategory>("/api/admin/categories", data)).data
}

export async function updateAdminCategory(id: number, data: CategoryInput): Promise<AdminCategory> {
  return (await api.put<AdminCategory>(`/api/admin/categories/${id}`, data)).data
}

export async function deleteAdminCategory(id: number): Promise<{ message: string }> {
  return (await api.delete<{ message: string }>(`/api/admin/categories/${id}`)).data
}

export async function getAdminOrders(params: {
  status?: string
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  page_size?: number
} = {}): Promise<PaginatedResponse<AdminOrder>> {
  return (await api.get<PaginatedResponse<AdminOrder>>("/api/admin/orders", { params })).data
}

export async function getAdminOrder(code: string): Promise<AdminOrder> {
  return (await api.get<AdminOrder>(`/api/admin/orders/${encodeURIComponent(code)}`)).data
}

export async function changeAdminOrderStatus(code: string, status: string): Promise<AdminOrder> {
  return (await api.patch<AdminOrder>(`/api/admin/orders/${encodeURIComponent(code)}/status`, { status })).data
}

export async function getAdminCustomers(params: {
  search?: string
  page?: number
  page_size?: number
} = {}): Promise<PaginatedResponse<AdminCustomer>> {
  return (await api.get<PaginatedResponse<AdminCustomer>>("/api/admin/customers", { params })).data
}
