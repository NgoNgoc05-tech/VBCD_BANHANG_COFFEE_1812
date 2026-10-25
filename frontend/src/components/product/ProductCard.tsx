import { ShoppingBag, Star } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { useState } from "react"
import type { Product } from "../../types"
import { formatPrice } from "../../lib/format"
import { getApiErrorMessage } from "../../lib/apiError"
import { useCartStore } from "../../stores/cartStore"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"

interface ProductCardProps {
  product: Product
}

function discountPercent(product: Product): number {
  if (!product.sale_price || product.sale_price >= product.price) return 0
  return Math.round((1 - product.sale_price / product.price) * 100)
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = discountPercent(product)
  const addItem = useCartStore((state) => state.addItem)
  const [isAdding, setIsAdding] = useState(false)

  const addToCart = async () => {
    setIsAdding(true)
    try {
      await addItem(product)
      toast.success("Đã thêm vào giỏ")
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Không thể thêm sản phẩm vào giỏ."))
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow duration-200 hover:shadow-soft">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Link
          to={`/products/${product.slug}`}
          aria-label={`Xem ${product.name}`}
          className="block h-full w-full"
        >
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = "/placeholder.svg"
            }}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
          {discount > 0 && <Badge className="bg-destructive text-white">-{discount}%</Badge>}
          {product.stock <= 0 && (
            <Badge variant="secondary" className="bg-foreground/80 text-white">
              Hết hàng
            </Badge>
          )}
        </div>
        {product.stock > 0 && (
          <Button
            type="button"
            size="sm"
            onClick={() => void addToCart()}
            disabled={isAdding}
            className="absolute bottom-3 left-3 right-3 translate-y-0 opacity-100 transition duration-200 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
          >
            <ShoppingBag aria-hidden="true" />
            {isAdding ? "Đang thêm..." : "Thêm vào giỏ"}
          </Button>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <Link
          to={`/products/${product.slug}`}
          className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground hover:text-primary sm:text-base"
        >
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
          <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
          <span className="font-medium text-foreground">{product.avg_rating.toFixed(1)}</span>
          <span className="text-muted-foreground">/ 5</span>
        </div>
        <div className="mt-2 flex min-h-6 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-bold text-primary">
            {formatPrice(product.sale_price ?? product.price)}
          </span>
          {discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-3 sm:p-4">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="mt-4 h-5 w-4/5" />
      <Skeleton className="mt-3 h-4 w-1/3" />
      <Skeleton className="mt-3 h-5 w-2/3" />
    </div>
  )
}
