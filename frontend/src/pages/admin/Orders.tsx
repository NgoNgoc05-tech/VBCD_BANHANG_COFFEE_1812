import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  changeAdminOrderStatus,
  getAdminOrder,
  getAdminOrders,
  type AdminOrder,
} from "../../api/admin"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { ORDER_STATUS, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "../../lib/constants"
import { formatDateTime, formatPrice } from "../../lib/format"
import { getApiErrorMessage } from "../../lib/apiError"
import { toast } from "sonner"

const statusTabs = [
  { label: "Tất cả", value: "" },
  ...Object.values(ORDER_STATUS).map((value) => ({ label: ORDER_STATUS_LABELS[value], value })),
]
const nextStatus: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipping", "cancelled"],
  shipping: ["completed"],
  completed: [],
  cancelled: [],
}
const paymentLabels: Record<string, string> = { cod: "COD", mock_card: "Thẻ", vietqr: "VietQR" }

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("code") ?? "")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminOrder | null>(null)
  const [statusToSet, setStatusToSet] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const status = searchParams.get("status") ?? ""
  const ordersQuery = useQuery({
    queryKey: ["admin", "orders", status, search, dateFrom, dateTo, page],
    queryFn: () => getAdminOrders({
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
      page,
      page_size: 15,
    }),
  })
  const detailQuery = useQuery({
    queryKey: ["admin", "order", selected?.code],
    queryFn: () => getAdminOrder(selected?.code ?? ""),
    enabled: Boolean(selected?.code),
  })
  useEffect(() => {
    const code = searchParams.get("code")
    if (code && ordersQuery.data) {
      const found = ordersQuery.data.items.find((order) => order.code === code)
      if (found) setSelected(found)
    }
  }, [ordersQuery.data, searchParams])
  const transitionMutation = useMutation({
    mutationFn: () => changeAdminOrderStatus(selected?.code ?? "", statusToSet ?? ""),
    onSuccess: async (order) => {
      toast.success(`Đã chuyển đơn ${order.code} sang "${ORDER_STATUS_LABELS[order.status]}".`)
      setStatusToSet(null)
      setSelected(order)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "order", order.code] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "recent-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "order-status"] }),
      ])
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, "Không thể chuyển trạng thái đơn.")),
  })
  const order = detailQuery.data ?? selected

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-semibold">Đơn hàng</h2><p className="mt-1 text-sm text-muted-foreground">Theo dõi và cập nhật trạng thái đơn hàng.</p></div>
      <div role="tablist" aria-label="Lọc trạng thái đơn hàng" className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => <button key={tab.value || "all"} type="button" role="tab" aria-selected={status === tab.value} onClick={() => { const params = new URLSearchParams(searchParams); if (tab.value) params.set("status", tab.value); else params.delete("status"); params.delete("code"); setSearchParams(params); setPage(1) }} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${status === tab.value ? "border-primary bg-primary text-white" : "border-border bg-white hover:bg-secondary"}`}>{tab.label}</button>)}
      </div>
      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Mã đơn, tên hoặc SĐT..." /></label>
          <label className="grid gap-1 text-xs text-muted-foreground">Từ ngày<input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1) }} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground" /></label>
          <label className="grid gap-1 text-xs text-muted-foreground">Đến ngày<input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1) }} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground" /></label>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-[#faf8f5] text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Mã đơn</th><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Ngày đặt</th><th className="px-4 py-3 text-right">Tổng tiền</th><th className="px-4 py-3">Thanh toán</th><th className="px-5 py-3">Trạng thái</th></tr></thead>
          <tbody>{ordersQuery.isPending ? Array.from({ length: 6 }, (_, index) => <tr key={index}><td colSpan={6} className="px-5 py-4"><div className="h-7 animate-pulse rounded bg-muted" /></td></tr>) : ordersQuery.data?.items.map((item) => (
            <tr key={item.id} tabIndex={0} onClick={() => setSelected(item)} onKeyDown={(event) => { if (event.key === "Enter") setSelected(item) }} className="cursor-pointer border-t border-border hover:bg-[#fcfbf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <td className="px-5 py-3 font-semibold text-primary">{item.code}</td><td className="px-4 py-3"><p className="font-medium">{item.customer_name}</p><p className="text-xs text-muted-foreground">{item.shipping_phone}</p></td><td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.created_at)}</td><td className="px-4 py-3 text-right font-semibold">{formatPrice(item.total_amount_cents)}</td><td className="px-4 py-3">{paymentLabels[item.payment_method] ?? item.payment_method}<p className="text-xs text-muted-foreground">{item.payment_status === "paid" ? "Đã thanh toán" : item.payment_status === "refunded" ? "Đã hoàn tiền" : "Chưa thanh toán"}</p></td><td className="px-5 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_COLORS[item.status]}`}>{ORDER_STATUS_LABELS[item.status]}</span></td>
            </tr>
          ))}{!ordersQuery.isPending && !ordersQuery.data?.items.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Không tìm thấy đơn hàng.</td></tr>}</tbody>
        </table></div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm"><span className="text-muted-foreground">{ordersQuery.data?.total ?? 0} đơn hàng</span><div className="flex items-center gap-3"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button><span>{page}/{ordersQuery.data?.total_pages || 1}</span><Button variant="outline" size="sm" disabled={page >= (ordersQuery.data?.total_pages ?? 1)} onClick={() => setPage((value) => value + 1)}>Sau</Button></div></div>
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) { setSelected(null); if (searchParams.has("code")) setSearch(""); setSearchParams((current) => { const next = new URLSearchParams(current); next.delete("code"); return next }) } }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {order && <>
            <DialogHeader><DialogTitle>Đơn hàng {order.code}</DialogTitle><DialogDescription>Đặt lúc {formatDateTime(order.created_at)}</DialogDescription></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-xl bg-secondary/50 p-4 text-sm"><h3 className="font-semibold">Thông tin khách hàng</h3><p className="mt-2">{order.shipping_name}</p><p className="text-muted-foreground">{order.customer_email}</p><p className="text-muted-foreground">{order.shipping_phone}</p><p className="mt-2">{order.shipping_address}</p></section>
              <section className="rounded-xl bg-secondary/50 p-4 text-sm"><h3 className="font-semibold">Thanh toán</h3><p className="mt-2">{paymentLabels[order.payment_method] ?? order.payment_method}</p><p className="text-muted-foreground">{order.payment_status === "paid" ? "Đã thanh toán" : order.payment_status === "refunded" ? "Đã hoàn tiền" : "Chưa thanh toán"}</p></section>
            </div>
            <section><h3 className="font-semibold">Sản phẩm</h3><ul className="mt-2 divide-y divide-border">{order.items.map((item) => <li key={item.id} className="flex items-center gap-3 py-3"><img src={item.image_url || "/placeholder.svg"} alt="" className="h-12 w-12 rounded-lg object-cover" /><span className="flex-1">{item.product_name} × {item.quantity}</span><span className="font-medium">{formatPrice(item.unit_price_cents * item.quantity)}</span></li>)}</ul></section>
            <div className="space-y-2 border-t border-border pt-3 text-sm"><p className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(order.total_amount_cents - order.shipping_fee_cents)}</span></p><p className="flex justify-between"><span>Phí vận chuyển</span><span>{order.shipping_fee_cents ? formatPrice(order.shipping_fee_cents) : "Miễn phí"}</span></p><p className="flex justify-between text-base font-bold"><span>Tổng cộng</span><span className="text-primary">{formatPrice(order.total_amount_cents)}</span></p></div>
            {detailQuery.isError && <p className="text-sm text-red-600">Không thể tải đầy đủ chi tiết đơn hàng.</p>}
            <DialogFooter className="flex-col sm:flex-row">
              {nextStatus[order.status]?.map((next) => <Button key={next} variant={next === "cancelled" ? "destructive" : "default"} disabled={transitionMutation.isPending} onClick={() => setStatusToSet(next)}>{next === "cancelled" ? "Hủy đơn" : `Chuyển: ${ORDER_STATUS_LABELS[next]}`}</Button>)}
            </DialogFooter>
          </>}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(statusToSet)} onOpenChange={(open) => { if (!open) setStatusToSet(null) }}><DialogContent><DialogHeader><DialogTitle>Xác nhận cập nhật đơn hàng?</DialogTitle><DialogDescription>Đơn {order?.code} sẽ chuyển sang trạng thái “{statusToSet ? ORDER_STATUS_LABELS[statusToSet] : ""}”.{statusToSet === "cancelled" && " Tồn kho sẽ được hoàn lại."}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setStatusToSet(null)}>Quay lại</Button><Button variant={statusToSet === "cancelled" ? "destructive" : "default"} disabled={transitionMutation.isPending} onClick={() => transitionMutation.mutate()}>{transitionMutation.isPending ? "Đang cập nhật..." : "Xác nhận"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
