import { useQuery } from "@tanstack/react-query"
import { ArrowDownRight, ArrowUpRight, Boxes, ClipboardList, DollarSign, Users } from "lucide-react"
import { Link } from "react-router-dom"
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { getAdminStats, getOrdersByStatus, getRecentOrders, getRevenue, getTopProducts } from "../../api/admin"
import type { AdminOrder, AdminProduct, RevenuePoint } from "../../api/admin"
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "../../lib/constants"
import { formatDateTime, formatPrice } from "../../lib/format"

const statusPalette: Record<string, string> = {
  pending: "#d4a017",
  processing: "#3b82f6",
  shipping: "#8b5cf6",
  completed: "#22a06b",
  cancelled: "#9ca3af",
}
const compactCurrency = (value: number) => value >= 1_000_000
  ? `${Number((value / 1_000_000).toFixed(1)).toLocaleString("vi-VN")}tr`
  : value >= 1_000 ? `${Math.round(value / 1_000)}k` : String(value)

function StatCard({
  title, value, icon: Icon, change, loading,
}: {
  title: string
  value: string
  icon: typeof DollarSign
  change?: number
  loading: boolean
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      {loading ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : (
        <>
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted-foreground">{title}</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Icon aria-hidden="true" className="h-5 w-5" /></span>
          </div>
          <p className="mt-3 text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(change).toLocaleString("vi-VN")}% so với kỳ trước
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default function Dashboard() {
  const statsQuery = useQuery({ queryKey: ["admin", "stats"], queryFn: getAdminStats })
  const revenueQuery = useQuery({ queryKey: ["admin", "revenue", 30], queryFn: () => getRevenue(30) })
  const statusQuery = useQuery({ queryKey: ["admin", "order-status"], queryFn: getOrdersByStatus })
  const topQuery = useQuery({ queryKey: ["admin", "top-products"], queryFn: () => getTopProducts(5) })
  const recentQuery = useQuery({ queryKey: ["admin", "recent-orders"], queryFn: () => getRecentOrders(5) })
  const stats = statsQuery.data
  const statusRows = Object.entries(statusQuery.data ?? {}).map(([status, value]) => ({
    status,
    label: ORDER_STATUS_LABELS[status] ?? status,
    value,
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Tổng quan tình hình kinh doanh</p>
        <h2 className="mt-1 text-2xl font-semibold">Chào mừng trở lại</h2>
      </div>
      {statsQuery.isError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Không thể tải số liệu tổng quan.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng doanh thu" value={formatPrice(stats?.total_revenue)} icon={DollarSign} change={stats?.revenue_change_percent} loading={statsQuery.isPending} />
        <StatCard title="Tổng đơn hàng" value={(stats?.total_orders ?? 0).toLocaleString("vi-VN")} icon={ClipboardList} loading={statsQuery.isPending} />
        <StatCard title="Khách hàng" value={(stats?.total_customers ?? 0).toLocaleString("vi-VN")} icon={Users} loading={statsQuery.isPending} />
        <StatCard title="Sắp hết hàng" value={(stats?.low_stock_products ?? 0).toLocaleString("vi-VN")} icon={Boxes} loading={statsQuery.isPending} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><h3 className="font-semibold">Doanh thu 30 ngày</h3><p className="mt-1 text-xs text-muted-foreground">Chỉ tính đơn đã hoàn thành</p></div>
          </div>
          <div className="mt-5 h-[290px]">
            {revenueQuery.isPending ? <div className="h-full animate-pulse rounded-xl bg-muted" /> : revenueQuery.isError ? (
              <p className="py-20 text-center text-sm text-red-600">Không thể tải biểu đồ doanh thu.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueQuery.data as RevenuePoint[]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee7df" />
                  <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={compactCurrency} tick={{ fontSize: 11 }} width={46} />
                  <Tooltip formatter={(value) => formatPrice(Number(value))} labelFormatter={(value) => `Ngày ${String(value)}`} />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#6f4e37" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Đơn hàng theo trạng thái</h3>
          <div className="mt-3 h-[230px]">
            {statusQuery.isPending ? <div className="h-full animate-pulse rounded-xl bg-muted" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusRows} dataKey="value" nameKey="label" innerRadius={54} outerRadius={90} paddingAngle={2}>
                    {statusRows.map((entry) => <Cell key={entry.status} fill={statusPalette[entry.status]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
            {statusRows.map((row) => <span key={row.status} className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusPalette[row.status] }} />{row.label}: {row.value}</span>)}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-semibold">Sản phẩm bán chạy</h3>
            <Link to="/admin/products" className="text-sm font-medium text-primary hover:underline">Tất cả sản phẩm</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead className="bg-[#faf8f5] text-xs text-muted-foreground"><tr><th className="px-5 py-3">Sản phẩm</th><th className="px-4 py-3">Danh mục</th><th className="px-5 py-3 text-right">Đã bán</th></tr></thead>
              <tbody>
                {topQuery.isPending ? Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={3} className="px-5 py-4"><div className="h-5 animate-pulse rounded bg-muted" /></td></tr>) : (topQuery.data as Array<AdminProduct & { sold_quantity: number }> | undefined)?.map((product) => (
                  <tr key={product.id} className="border-t border-border hover:bg-[#fcfbf9]">
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><img src={product.image_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="max-w-56 truncate font-medium">{product.name}</span></div></td>
                    <td className="px-4 py-3 text-muted-foreground">{product.category.name}</td>
                    <td className="px-5 py-3 text-right font-semibold">{product.sold_quantity}</td>
                  </tr>
                ))}
                {!topQuery.isPending && !topQuery.data?.length && <tr><td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">Chưa có dữ liệu bán hàng.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-semibold">Đơn hàng mới nhất</h3>
            <Link to="/admin/orders" className="text-sm font-medium text-primary hover:underline">Tất cả đơn hàng</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[470px] text-left text-sm">
              <thead className="bg-[#faf8f5] text-xs text-muted-foreground"><tr><th className="px-5 py-3">Đơn hàng</th><th className="px-4 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Tổng tiền</th></tr></thead>
              <tbody>
                {recentQuery.isPending ? Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={3} className="px-5 py-4"><div className="h-5 animate-pulse rounded bg-muted" /></td></tr>) : (recentQuery.data as AdminOrder[] | undefined)?.map((order) => (
                  <tr key={order.id} className="border-t border-border hover:bg-[#fcfbf9]">
                    <td className="px-5 py-3"><Link to={`/admin/orders?code=${encodeURIComponent(order.code)}`} className="font-semibold text-primary hover:underline">{order.code}</Link><p className="mt-1 text-xs text-muted-foreground">{order.customer_name} · {formatDateTime(order.created_at)}</p></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span></td>
                    <td className="px-5 py-3 text-right font-semibold">{formatPrice(order.total_amount_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
