import { useQuery } from "@tanstack/react-query"
import { Check, Copy, ShoppingBag } from "lucide-react"
import { useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import { getOrder } from "../../api/cart"
import { Button } from "../../components/ui/button"
import { formatDateTime, formatPrice } from "../../lib/format"

const paymentLabels: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng",
  mock_card: "Thẻ (giả lập)",
  vietqr: "VietQR (giả lập)",
}

export default function OrderSuccess() {
  const { code = "" } = useParams()
  const orderQuery = useQuery({
    queryKey: ["orders", code],
    queryFn: () => getOrder(code),
    enabled: Boolean(code),
    staleTime: 60_000,
  })
  const order = orderQuery.data

  if (orderQuery.isPending) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><div className="h-96 animate-pulse rounded-2xl bg-muted" /></main>
  }

  if (orderQuery.isError || !order) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Không thể tải thông tin đơn hàng</h1>
          <p className="mt-2 text-muted-foreground">Hãy đăng nhập đúng tài khoản đặt hàng hoặc thử lại.</p>
          <Button className="mt-5" onClick={() => void orderQuery.refetch()}>Thử lại</Button>
        </div>
      </main>
    )
  }

  const subtotal = order.total_amount_cents - order.shipping_fee_cents

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-16">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        <div className="bg-primary px-6 py-10 text-center text-primary-foreground sm:px-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 animate-[pulse_2s_ease-in-out_1]">
            <Check aria-hidden="true" className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold sm:text-3xl">Đặt hàng thành công!</h1>
          <p className="mt-2 text-sm text-white/80">Cảm ơn bạn đã lựa chọn Phin &amp; Bean.</p>
        </div>
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/60 p-4">
            <div><p className="text-xs text-muted-foreground">Mã đơn hàng</p><p className="mt-1 text-lg font-bold tracking-wide text-primary">{order.code}</p></div>
            <button
              type="button"
              aria-label="Sao chép mã đơn hàng"
              onClick={() => {
                void navigator.clipboard.writeText(order.code)
                toast.success("Đã sao chép mã đơn hàng.")
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white"
            >
              <Copy aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6">
            <h2 className="font-semibold">Thông tin đơn hàng</h2>
            <div className="mt-3 space-y-2 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{item.product_name} × {item.quantity}</span>
                  <span className="shrink-0 font-medium">{formatPrice(item.unit_price_cents * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-3 text-muted-foreground">
                <span>Phí vận chuyển</span><span>{order.shipping_fee_cents ? formatPrice(order.shipping_fee_cents) : "Miễn phí"}</span>
              </div>
              <div className="flex justify-between text-base font-bold"><span>Tổng cộng</span><span className="text-primary">{formatPrice(order.total_amount_cents)}</span></div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">Người nhận</p><p className="mt-1 font-medium">{order.shipping_name}</p><p className="text-muted-foreground">{order.shipping_phone}</p></div>
            <div><p className="text-xs text-muted-foreground">Thanh toán</p><p className="mt-1 font-medium">{paymentLabels[order.payment_method] ?? order.payment_method}</p><p className="text-muted-foreground">{order.payment_status === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Địa chỉ giao hàng</p><p className="mt-1">{order.shipping_address}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Ngày đặt</p><p className="mt-1">{formatDateTime(order.created_at)}</p></div>
          </div>

          {order.payment_method === "vietqr" && (
            <div className="mt-5 rounded-xl border border-border bg-background p-5 text-center">
              <img src="/qr-mock.svg" alt="Mã QR chuyển khoản VietQR minh họa" className="mx-auto h-36 w-36 rounded-xl border border-border bg-white p-2" />
              <p className="mt-3 font-semibold">Nội dung chuyển khoản: {order.code}</p>
              <p className="mt-1 text-xs text-muted-foreground">Đây là QR minh họa, không kết nối ngân hàng.</p>
              <Button variant="outline" className="mt-4" onClick={() => toast.success("Đã ghi nhận thông báo chuyển khoản.")}>Tôi đã chuyển khoản</Button>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="flex-1"><Link to="/orders">Xem đơn hàng</Link></Button>
            <Button asChild className="flex-1"><Link to="/products"><ShoppingBag aria-hidden="true" /> Tiếp tục mua sắm</Link></Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Tạm tính hàng hóa: {formatPrice(subtotal)}</p>
        </div>
      </section>
    </main>
  )
}
