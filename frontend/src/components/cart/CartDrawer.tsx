import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DialogDescription, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Sheet, SheetContent } from "../ui/sheet"
import CartLineItem from "./CartLineItem"
import { useCartStore } from "../../stores/cartStore"
import { formatPrice } from "../../lib/format"

const FREE_SHIPPING_THRESHOLD = 500_000

export default function CartDrawer() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const subtotal = useCartStore((state) => state.subtotal)
  const isOpen = useCartStore((state) => state.isDrawerOpen)
  const setOpen = useCartStore((state) => state.setDrawerOpen)
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const shippingMessage = useMemo(
    () => remaining > 0
      ? `Mua thêm ${formatPrice(remaining)} để được miễn phí vận chuyển.`
      : "Đơn hàng của bạn được miễn phí vận chuyển!",
    [remaining]
  )

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex h-full flex-col gap-0 p-0 sm:w-[min(440px,92vw)]">
        <div className="border-b border-border px-5 py-4">
          <DialogTitle className="text-lg font-semibold">Giỏ hàng của bạn</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {items.reduce((count, item) => count + item.quantity, 0)} sản phẩm
          </DialogDescription>
        </div>
        {items.length > 0 ? (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {items.map((item) => <CartLineItem key={item.product_id} item={item} compact />)}
            </div>
            <div className="space-y-4 border-t border-border bg-background p-5">
              <div className="rounded-xl bg-secondary/70 p-3 text-sm text-foreground/80">{shippingMessage}</div>
              <div className="flex items-center justify-between font-semibold">
                <span>Tạm tính</span><span className="text-primary">{formatPrice(subtotal)}</span>
              </div>
              <Button asChild variant="outline" className="w-full" onClick={() => setOpen(false)}>
                <Link to="/cart">Xem giỏ hàng</Link>
              </Button>
              <Button
                className="w-full"
                onClick={() => {
                  setOpen(false)
                  navigate("/checkout")
                }}
              >
                Tiến hành thanh toán
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-medium">Giỏ hàng đang trống</p>
            <Button asChild className="mt-4" onClick={() => setOpen(false)}>
              <Link to="/products">Khám phá sản phẩm</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
