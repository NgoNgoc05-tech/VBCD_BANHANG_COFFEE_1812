import api from "./client"
import type { PaginatedResponse, ProductReview } from "../types"

export interface ProductReviewsResponse extends PaginatedResponse<ProductReview> {
  average_rating: number
  rating_counts: Record<string, number>
}

export interface ReviewInput {
  rating: number
  comment: string
}

export async function getProductReviews(
  slug: string,
  page = 1,
  pageSize = 5
): Promise<ProductReviewsResponse> {
  const response = await api.get<ProductReviewsResponse>(
    `/api/products/${encodeURIComponent(slug)}/reviews`,
    { params: { page, page_size: pageSize } }
  )
  return response.data
}

export async function canReviewProduct(slug: string): Promise<boolean> {
  const response = await api.get<{ can_review: boolean }>(
    `/api/products/${encodeURIComponent(slug)}/can-review`
  )
  return response.data.can_review
}

export async function saveProductReview(
  slug: string,
  review: ReviewInput
): Promise<ProductReview> {
  const response = await api.post<ProductReview>(
    `/api/products/${encodeURIComponent(slug)}/reviews`,
    review
  )
  return response.data
}
