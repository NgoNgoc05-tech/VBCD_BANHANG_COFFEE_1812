import { Minus, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "../../lib/format"
import { getApiErrorMessage } from "../../lib/apiError"
import { useCartStore } from "../../stores/cartStore"
import type { CartLine } from "../../api/cart"

interface CartLineItemProps {
  item: CartLine
  compact?: boolean
}

export default function CartLineItem({ item, compact = false }: CartLineItemProps) {
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)
  const { product, quantity } = item
  const price = product.sale_price ?? product.price

  const changeQuantity = async (nextQuantity: number) => {
    try {
      await updateQty(product.id, nextQuantity)
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật số lượng."))
    }
  }

  const remove = async () => {
    try {
      await removeItem(product.id)
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.")
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Không thể xóa sản phẩm."))
    }
  }

  return (
    <article className={`flex gap-3 ${compact ? "items-start" : "items-center"} rounded-xl border border-border bg-card p-3 sm:p-4`}>
      <img
        src={product.image_url || "/placeholder.svg"}
        alt={product.name}
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = "/placeholder.svg"
        }}
        className={`${compact ? "h-20 w-20" : "h-20 w-20 sm:h-24 sm:w-24"} shrink-0 rounded-lg bg-secondary object-cover`}
      />
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">{product.name}</h3>
        <p className="mt-1 text-sm font-semibold text-primary">{formatPrice(price)}</p>
        {product.stock < 1 && <p className="mt-1 text-xs text-destructive">Hiện đã hết hàng</p>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex h-9 items-center rounded-lg border border-border">
            <button
              type="button"
              aria-label={`Giảm số lượng ${product.name}`}
              disabled={quantity <= 1}
              onClick={() => void changeQuantity(quantity - 1)}
              className="flex h-8 w-8 items-center justify-center text-foreground hover:text-primary disabled:opacity-40"
            >
              <Minus aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <span aria-live="polite" className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              aria-label={`Tăng số lượng ${product.name}`}
              disabled={quantity >= product.stock}
              onClick={() => void changeQuantity(quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-foreground hover:text-primary disabled:opacity-40"
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-sm font-bold text-foreground">{formatPrice(price * quantity)}</p>
          <button
            type="button"
            aria-label={`Xóa ${product.name}`}
            onClick={() => void remove()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
