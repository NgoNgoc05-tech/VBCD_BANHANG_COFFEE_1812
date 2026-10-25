import api from "./client"
import type { Category, PaginatedResponse, Product, ProductDetail } from "../types"

export interface ProductQuery {
  search?: string
  category?: string
  min_price?: number
  max_price?: number
  sort?: "newest" | "price_asc" | "price_desc" | "rating"
  featured?: boolean
  page?: number
  page_size?: number
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>("/api/categories")
  return response.data
}

export async function getProducts(
  params: ProductQuery = {}
): Promise<PaginatedResponse<Product>> {
  const response = await api.get<PaginatedResponse<Product>>("/api/products", {
    params,
  })
  return response.data
}

export async function getProduct(slug: string): Promise<ProductDetail> {
  const response = await api.get<ProductDetail>(
    `/api/products/${encodeURIComponent(slug)}`
  )
  return response.data
}
