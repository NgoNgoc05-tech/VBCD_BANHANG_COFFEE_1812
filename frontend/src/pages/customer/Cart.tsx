import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ArrowRight, ShoppingBag, Truck } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import CartLineItem from "../../components/cart/CartLineItem"
import { formatPrice } from "../../lib/format"
import { getApiErrorMessage } from "../../lib/apiError"
import { useCartStore } from "../../stores/cartStore"

const FREE_SHIPPING_THRESHOLD = 500_000
const STANDARD_SHIPPING_FEE = 30_000

export default function Cart() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const subtotal = useCartStore((state) => state.subtotal)
  const isHydrating = useCartStore((state) => state.isHydrating)
  const clearCart = useCartStore((state) => state.clearCart)
  const [confirmClear, setConfirmClear] = useState(false)
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  const emptyCart = async () => {
    try {
      await clearCart()
      toast.success("Đã xóa toàn bộ giỏ hàng.")
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Không thể xóa giỏ hàng."))
    } finally {
      setConfirmClear(false)
    }
  }

  if (isHydrating) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <div className="h-9 w-56 animate-pulse rounded bg-muted" />
        <div className="mt-8 h-48 animate-pulse rounded-2xl bg-muted" />
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center px-4 py-12 sm:px-8">
        <div className="max-w-md text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
            <ShoppingBag aria-hidden="true" className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">Giỏ hàng của bạn đang trống</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Hãy chọn vài món cà phê yêu thích để bắt đầu nhé.</p>
          <Button asChild className="mt-6"><Link to="/products">Tiếp tục mua sắm</Link></Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Trang chủ</Link><span className="mx-2">/</span><span className="text-foreground">Giỏ hàng</span>
      </nav>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Đơn hàng của bạn</p>
          <h1 className="mt-2 text-3xl font-semibold">Giỏ hàng <span className="text-lg font-normal text-muted-foreground">({itemCount} sản phẩm)</span></h1>
        </div>
        <button type="button" onClick={() => setConfirmClear(true)} className="text-sm font-medium text-destructive hover:underline">
          Xóa tất cả
        </button>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Sản phẩm trong giỏ hàng" className="space-y-3">
          {items.map((item) => <CartLineItem key={item.product_id} item={item} />)}
          <Link to="/products" className="inline-flex items-center gap-2 pt-3 text-sm font-semibold text-primary hover:underline">
            Tiếp tục mua sắm <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </section>

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Tóm tắt đơn hàng</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 text-muted-foreground">
              <span>Tạm tính</span><span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4 text-muted-foreground">
              <span>Phí vận chuyển</span>
              <span className="font-medium text-foreground">{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex justify-between gap-4 text-base font-bold">
                <span>Tổng cộng</span><span className="text-primary">{formatPrice(subtotal + shippingFee)}</span>
              </div>
              <p className="mt-1 text-right text-xs text-muted-foreground">Đã bao gồm phí vận chuyển</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-secondary/60 p-4">
            <div className="flex items-start gap-2 text-xs leading-5 text-foreground/80">
              <Truck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {remaining > 0
                ? <>Mua thêm <strong>{formatPrice(remaining)}</strong> để được miễn phí vận chuyển.</>
                : <strong>Đơn hàng của bạn được miễn phí vận chuyển!</strong>}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-right text-[11px] text-muted-foreground">{formatPrice(FREE_SHIPPING_THRESHOLD)} để freeship</p>
          </div>
          <Button className="mt-5 w-full" onClick={() => navigate("/checkout")}>Tiến hành thanh toán</Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Giá sản phẩm và tồn kho được xác nhận khi đặt hàng.</p>
        </aside>
      </div>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa toàn bộ giỏ hàng?</DialogTitle>
            <DialogDescription>Thao tác này sẽ xóa tất cả sản phẩm khỏi giỏ hàng của bạn.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmClear(false)}>Giữ lại</Button>
            <Button type="button" variant="destructive" onClick={() => void emptyCart()}>Xóa giỏ hàng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
