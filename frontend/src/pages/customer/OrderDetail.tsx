import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Circle, Package, Star, Truck } from "lucide-react"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { cancelOrder, getOrder, type OrderResponse } from "../../api/cart"
import ReviewDialog from "../../components/reviews/ReviewDialog"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { ORDER_STATUS, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, ORDER_TIMELINE_STEPS } from "../../lib/constants"
import { formatDateTime, formatPrice } from "../../lib/format"
import { getApiErrorMessage } from "../../lib/apiError"
import { toast } from "sonner"

const timelineLabels: Record<string, string> = {
  pending: "Chờ xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  completed: "Đã hoàn thành",
}
const timelineIcons = [Package, Check, Truck, Check]
const paymentMethodLabels: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng",
  mock_card: "Thẻ (giả lập)",
  vietqr: "VietQR (giả lập)",
}

export default function OrderDetail() {
  const { code = "" } = useParams()
  const queryClient = useQueryClient()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [reviewItem, setReviewItem] = useState<OrderResponse["items"][number] | null>(null)
  const orderQuery = useQuery({
    queryKey: ["orders", code],
    queryFn: () => getOrder(code),
    enabled: Boolean(code),
  })
  const order = orderQuery.data
  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(code),
    onSuccess: async () => {
      toast.success("Đơn hàng đã được hủy và tồn kho đã được hoàn lại.")
      setConfirmCancel(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders", code] }),
        queryClient.invalidateQueries({ queryKey: ["orders", "me"] }),
      ])
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, "Không thể hủy đơn hàng.")),
  })

  if (orderQuery.isPending) {
    return <main className="mx-auto max-w-4xl px-4 py-10"><div className="h-96 animate-pulse rounded-2xl bg-muted" /></main>
  }
  if (orderQuery.isError || !order) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-4xl items-center justify-center px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Không thể tải đơn hàng</h1>
          <p className="mt-2 text-muted-foreground">Đơn hàng không tồn tại hoặc bạn không có quyền xem.</p>
          <Button asChild className="mt-5"><Link to="/account/orders">Về đơn hàng của tôi</Link></Button>
        </div>
      </main>
    )
  }

  const canCancel = order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.PROCESSING
  const currentStep = ORDER_TIMELINE_STEPS.indexOf(order.status as (typeof ORDER_TIMELINE_STEPS)[number])
  const subtotal = order.total_amount_cents - order.shipping_fee_cents

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      <Link to="/account/orders" className="text-sm font-medium text-primary hover:underline">← Đơn hàng của tôi</Link>
      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Chi tiết đơn hàng</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-wide sm:text-3xl">{order.code}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Đặt lúc {formatDateTime(order.created_at)}</p>
        </div>
        <Badge className={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </header>

      <section className="mt-7 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <h2 className="font-semibold">Trạng thái đơn hàng</h2>
        {order.status === ORDER_STATUS.CANCELLED ? (
          <div className="mt-5 rounded-xl bg-gray-100 px-4 py-3 text-center font-semibold text-gray-700">Đơn hàng đã hủy</div>
        ) : (
          <ol className="mt-6 grid grid-cols-4">
            {ORDER_TIMELINE_STEPS.map((step, index) => {
              const Icon = timelineIcons[index] ?? Circle
              const complete = index < currentStep
              const active = index === currentStep
              return (
                <li key={step} className="relative flex flex-col items-center text-center">
                  {index > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-4 h-0.5 w-full ${complete || active ? "bg-primary" : "bg-border"}`} />}
                  <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${complete || active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className={`mt-2 text-[10px] leading-tight sm:text-xs ${active ? "font-semibold text-primary" : "text-muted-foreground"}`}>{timelineLabels[step]}</span>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <h2 className="font-semibold">Sản phẩm đã đặt</h2>
        <ul className="mt-4 divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-0">
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.product_name}
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = "/placeholder.svg"
                }}
                className="h-16 w-16 rounded-xl border border-border object-cover"
              />
              <div className="min-w-0 flex-1">
                {item.product_slug ? (
                  <Link to={`/products/${item.product_slug}`} className="font-medium hover:text-primary">{item.product_name}</Link>
                ) : <p className="font-medium">{item.product_name}</p>}
                <p className="mt-1 text-sm text-muted-foreground">{formatPrice(item.unit_price_cents)} × {item.quantity}</p>
              </div>
              <p className="font-semibold">{formatPrice(item.unit_price_cents * item.quantity)}</p>
              {order.status === ORDER_STATUS.COMPLETED && item.product_slug && (
                <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setReviewItem(item)}>
                  <Star aria-hidden="true" /> Đánh giá
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-semibold">Thông tin giao hàng</h2>
          <p className="mt-3 font-medium">{order.shipping_name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{order.shipping_phone}</p>
          <p className="mt-2 text-sm leading-relaxed">{order.shipping_address}</p>
          {order.note && <p className="mt-3 text-sm text-muted-foreground">Ghi chú: {order.note}</p>}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-semibold">Thanh toán</h2>
          <div className="mt-3 flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Phương thức</span>
            <span className="text-right font-medium">{paymentMethodLabels[order.payment_method] ?? order.payment_method}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Trạng thái</span>
            <span className="font-medium">
              {order.payment_status === "paid" ? "Đã thanh toán" : order.payment_status === "refunded" ? "Đã hoàn tiền" : order.payment_status === "failed" ? "Thất bại" : "Chờ thanh toán"}
            </span>
          </div>
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <p className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatPrice(subtotal)}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Phí vận chuyển</span><span>{order.shipping_fee_cents ? formatPrice(order.shipping_fee_cents) : "Miễn phí"}</span></p>
            <p className="flex justify-between pt-2 text-base font-bold"><span>Tổng cộng</span><span className="text-primary">{formatPrice(order.total_amount_cents)}</span></p>
          </div>
        </section>
      </div>

      {canCancel && (
        <div className="mt-5 flex justify-end">
          <Button type="button" variant="destructive" onClick={() => setConfirmCancel(true)}>Hủy đơn</Button>
        </div>
      )}

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy đơn hàng?</DialogTitle>
            <DialogDescription>Đơn hàng sẽ được hủy và số lượng sản phẩm sẽ được hoàn lại vào kho.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(false)} disabled={cancelMutation.isPending}>Giữ đơn hàng</Button>
            <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {reviewItem?.product_slug && (
        <ReviewDialog
          open={Boolean(reviewItem)}
          onOpenChange={(open) => { if (!open) setReviewItem(null) }}
          productSlug={reviewItem.product_slug}
          productName={reviewItem.product_name}
          onSaved={() => {
            void queryClient.invalidateQueries({ queryKey: ["product-reviews", reviewItem.product_slug] })
            void queryClient.invalidateQueries({ queryKey: ["can-review", reviewItem.product_slug] })
            void queryClient.invalidateQueries({ queryKey: ["catalog", "product", reviewItem.product_slug] })
          }}
        />
      )}
    </main>
  )
}
