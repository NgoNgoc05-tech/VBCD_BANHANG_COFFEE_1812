import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Check, ChevronRight, Minus, Plus, ShoppingBag, Star, Truck } from "lucide-react"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { getProduct, getProducts } from "../../api/catalog"
import ProductCard, { ProductCardSkeleton } from "../../components/product/ProductCard"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { formatDate, formatPrice } from "../../lib/format"

export default function ProductDetail() {
  const { slug = "" } = useParams()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description")
  const productQuery = useQuery({
    queryKey: ["catalog", "product", slug],
    queryFn: () => getProduct(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
  })
  const product = productQuery.data
  const relatedQuery = useQuery({
    queryKey: ["catalog", "products", "related", product?.category.slug],
    queryFn: () => getProducts({ category: product?.category.slug, page_size: 5, sort: "rating" }),
    enabled: Boolean(product?.category.slug),
    staleTime: 60_000,
  })
  const images = product
    ? product.images.length > 0
      ? product.images
      : [product.image_url || "/placeholder.svg"]
    : []
  const isNotFound = axios.isAxiosError(productQuery.error) && productQuery.error.response?.status === 404

  if (productQuery.isPending) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-3">
            <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="aspect-square animate-pulse rounded-xl bg-muted" />)}
            </div>
          </div>
          <div className="space-y-5">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </main>
    )
  }

  if (productQuery.isError && !isNotFound) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center px-4 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phin &amp; Bean</p>
          <h1 className="mt-3 text-3xl font-semibold">Chưa thể tải thông tin sản phẩm</h1>
          <p className="mt-3 text-muted-foreground">Vui lòng kiểm tra kết nối và thử lại.</p>
          <Button className="mt-6" onClick={() => void productQuery.refetch()}>Thử lại</Button>
        </div>
      </main>
    )
  }

  if (isNotFound || !product) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center px-4 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">404 — Không tìm thấy</p>
          <h1 className="mt-3 text-3xl font-semibold">Sản phẩm này không còn ở đây</h1>
          <p className="mt-3 text-muted-foreground">Có thể đường dẫn không đúng hoặc sản phẩm đã được gỡ khỏi cửa hàng.</p>
          <Button asChild className="mt-6"><Link to="/products">Khám phá sản phẩm</Link></Button>
        </div>
      </main>
    )
  }

  const discounted = product.sale_price !== null && product.sale_price < product.price
  const reviews = product.reviews ?? []
  const reviewCount = reviews.length
  const relatedProducts = (relatedQuery.data?.items ?? []).filter((item) => item.id !== product.id).slice(0, 4)

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
        <Link to={`/products?category=${encodeURIComponent(product.category.slug)}`} className="hover:text-primary">{product.category.name}</Link>
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <section className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="min-w-0">
          <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
            <img
              src={images[selectedImage] || "/placeholder.svg"}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = "/placeholder.svg"
              }}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`Xem ảnh ${index + 1} của ${product.name}`}
                  aria-pressed={selectedImage === index}
                  className={`aspect-square overflow-hidden rounded-xl border-2 transition ${selectedImage === index ? "border-primary" : "border-transparent hover:border-accent"}`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = "/placeholder.svg"
                    }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Link to={`/products?category=${encodeURIComponent(product.category.slug)}`} className="text-sm font-medium text-primary hover:underline">
            {product.category.name}
          </Link>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-amber-600" aria-label={`Đánh giá ${product.avg_rating} trên 5`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} aria-hidden="true" className={`h-4 w-4 ${index < Math.round(product.avg_rating) ? "fill-current" : ""}`} />
              ))}
            </div>
            <span className="text-sm font-medium">{product.avg_rating.toFixed(1)}</span>
            <button type="button" onClick={() => setActiveTab("reviews")} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              ({reviewCount} đánh giá)
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(discounted ? product.sale_price : product.price)}</span>
            {discounted && <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>}
            {discounted && product.sale_price !== null && (
              <Badge className="bg-destructive text-white">
                -{Math.round((1 - product.sale_price / product.price) * 100)}%
              </Badge>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2">
            {product.stock > 0 ? (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700"><Check aria-hidden="true" className="h-4 w-4" /></span>
                <p className="text-sm font-medium text-green-800">Còn hàng <span className="font-normal text-muted-foreground">({product.stock} sản phẩm)</span></p>
              </>
            ) : (
              <Badge variant="secondary">Tạm hết hàng</Badge>
            )}
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-secondary/70 p-4 text-sm text-foreground/80">
            <Truck aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
            <span>Miễn phí giao hàng cho đơn từ {formatPrice(500_000)}.</span>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center rounded-lg border border-border bg-card">
              <button type="button" aria-label="Giảm số lượng" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-10 w-10 items-center justify-center text-foreground hover:text-primary disabled:opacity-40">
                <Minus aria-hidden="true" className="h-4 w-4" />
              </button>
              <span aria-live="polite" className="w-9 text-center text-sm font-semibold">{quantity}</span>
              <button type="button" aria-label="Tăng số lượng" disabled={quantity >= product.stock} onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} className="flex h-10 w-10 items-center justify-center text-foreground hover:text-primary disabled:opacity-40">
                <Plus aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <Button
              type="button"
              disabled={product.stock < 1}
              onClick={() => toast.success("Đã thêm vào giỏ")}
              className="min-w-[160px] flex-1 sm:flex-none"
            >
              <ShoppingBag aria-hidden="true" /> Thêm vào giỏ
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={product.stock < 1}
              onClick={() => toast.info("Tính năng mua ngay sẽ có trong giai đoạn giỏ hàng.")}
              className="min-w-[120px] flex-1 sm:flex-none"
            >
              Mua ngay
            </Button>
          </div>

          <div className="mt-9 border-b border-border">
            <div role="tablist" aria-label="Thông tin sản phẩm" className="flex gap-6">
              <button type="button" role="tab" aria-selected={activeTab === "description"} onClick={() => setActiveTab("description")} className={`border-b-2 pb-3 text-sm font-semibold ${activeTab === "description" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
                Mô tả
              </button>
              <button type="button" role="tab" aria-selected={activeTab === "reviews"} onClick={() => setActiveTab("reviews")} className={`border-b-2 pb-3 text-sm font-semibold ${activeTab === "reviews" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
                Đánh giá ({reviewCount})
              </button>
            </div>
          </div>
          <div role="tabpanel" className="min-h-28 py-5 text-sm leading-7 text-muted-foreground">
            {activeTab === "description" ? (
              <p className="whitespace-pre-line text-foreground/80">{product.description || "Thông tin sản phẩm đang được cập nhật."}</p>
            ) : (
              reviews.length > 0 ? (
                <ul className="space-y-4">
                  {reviews.map((review) => (
                    <li key={review.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{review.user.full_name}</p>
                        <time dateTime={review.created_at} className="text-xs text-muted-foreground">{formatDate(review.created_at)}</time>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-amber-600" aria-label={`${review.rating} trên 5 sao`}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} aria-hidden="true" className={`h-4 w-4 ${index < review.rating ? "fill-current" : ""}`} />
                        ))}
                      </div>
                      {review.comment && <p className="mt-3 whitespace-pre-line text-foreground/80">{review.comment}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl bg-secondary/50 p-5 text-center">
                  <Star aria-hidden="true" className="mx-auto h-6 w-6 text-accent" />
                  <p className="mt-2 font-medium text-foreground">Chưa có đánh giá</p>
                  <p className="mt-1">Hãy quay lại sau để xem nhận xét từ khách hàng.</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {(relatedQuery.isPending || relatedProducts.length > 0) && (
        <section className="mt-14 border-t border-border pt-10 sm:mt-20">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Có thể bạn sẽ thích</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">Sản phẩm cùng danh mục</h2>
          </div>
          {relatedQuery.isPending ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          )}
        </section>
      )}
    </main>
  )
}
