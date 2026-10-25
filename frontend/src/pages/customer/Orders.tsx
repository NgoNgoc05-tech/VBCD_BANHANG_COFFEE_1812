import { useQuery } from "@tanstack/react-query"
import { ArrowRight, PackageOpen } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { getMyOrders } from "../../api/cart"
import { Button } from "../../components/ui/button"
import { ORDER_STATUS, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "../../lib/constants"
import { formatDateTime, formatPrice } from "../../lib/format"

const tabs = [
  { label: "Tất cả", value: "" },
  { label: "Chờ xác nhận", value: ORDER_STATUS.PENDING },
  { label: "Đang xử lý", value: ORDER_STATUS.PROCESSING },
  { label: "Đang giao", value: ORDER_STATUS.SHIPPING },
  { label: "Đã hoàn thành", value: ORDER_STATUS.COMPLETED },
  { label: "Đã hủy", value: ORDER_STATUS.CANCELLED },
]

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedStatus = searchParams.get("status") ?? ""
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)
  const ordersQuery = useQuery({
    queryKey: ["orders", "me", selectedStatus, page],
    queryFn: () => getMyOrders({
      ...(selectedStatus ? { status: selectedStatus } : {}),
      page,
      page_size: 8,
    }),
  })
  const orders = ordersQuery.data?.items ?? []

  const selectStatus = (status: string) => {
    const next = new URLSearchParams()
    if (status) next.set("status", status)
    setSearchParams(next)
  }

  return (
    <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Tài khoản</p>
      <h1 className="mt-2 text-3xl font-semibold">Đơn hàng của tôi</h1>
      <p className="mt-2 text-muted-foreground">Theo dõi trạng thái và xem lại những đơn hàng của bạn.</p>

      <div role="tablist" aria-label="Lọc đơn hàng theo trạng thái" className="mt-7 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const selected = selectedStatus === tab.value
          return (
            <button
              key={tab.value || "all"}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectStatus(tab.value)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {ordersQuery.isPending ? (
        <div className="mt-6 space-y-4" aria-label="Đang tải đơn hàng">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : ordersQuery.isError ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-medium">Chưa thể tải danh sách đơn hàng.</p>
          <Button variant="outline" className="mt-4" onClick={() => void ordersQuery.refetch()}>Thử lại</Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <PackageOpen aria-hidden="true" className="mx-auto h-10 w-10 text-primary/70" />
          <h2 className="mt-4 text-xl font-semibold">Bạn chưa có đơn hàng nào</h2>
          <p className="mt-2 text-sm text-muted-foreground">Những đơn hàng của bạn sẽ xuất hiện tại đây.</p>
          <Button asChild className="mt-5"><Link to="/products">Mua sắm ngay</Link></Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
                  <p className="mt-1 font-semibold tracking-wide">{order.code}</p>
                  <time dateTime={order.created_at} className="mt-1 block text-xs text-muted-foreground">
                    {formatDateTime(order.created_at)}
                  </time>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-hidden py-4">
                {order.items.slice(0, 5).map((item) => (
                  <img
                    key={item.id}
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.product_name}
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = "/placeholder.svg"
                    }}
                    className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
                  />
                ))}
                {order.items.length > 5 && <span className="text-sm text-muted-foreground">+{order.items.length - 5}</span>}
                <span className="ml-auto pl-3 text-right text-sm text-muted-foreground">{order.items.reduce((total, item) => total + item.quantity, 0)} sản phẩm</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm">Tổng thanh toán <span className="ml-1 font-bold text-primary">{formatPrice(order.total_amount_cents)}</span></p>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/account/orders/${encodeURIComponent(order.code)}`}>Xem chi tiết <ArrowRight aria-hidden="true" /></Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {(ordersQuery.data?.total_pages ?? 0) > 1 && (
        <nav aria-label="Phân trang đơn hàng" className="mt-7 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setSearchParams((current) => {
            const next = new URLSearchParams(current)
            next.set("page", String(page - 1))
            return next
          })}>Trước</Button>
          <span className="px-2 text-sm">Trang {page}/{ordersQuery.data?.total_pages}</span>
          <Button variant="outline" size="sm" disabled={page >= (ordersQuery.data?.total_pages ?? 1)} onClick={() => setSearchParams((current) => {
            const next = new URLSearchParams(current)
            next.set("page", String(page + 1))
            return next
          })}>Sau</Button>
        </nav>
      )}
    </main>
  )
}
