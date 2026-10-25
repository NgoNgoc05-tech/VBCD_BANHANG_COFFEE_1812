import { useQuery } from "@tanstack/react-query"
import { Search, Users } from "lucide-react"
import { useState } from "react"
import { getAdminCustomers } from "../../api/admin"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { formatDate, formatPrice } from "../../lib/format"

export default function Customers() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const customersQuery = useQuery({
    queryKey: ["admin", "customers", search, page],
    queryFn: () => getAdminCustomers({ ...(search ? { search } : {}), page, page_size: 20 }),
  })

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-semibold">Khách hàng</h2><p className="mt-1 text-sm text-muted-foreground">Thông tin khách hàng và lịch sử mua sắm.</p></div>
      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <label className="relative block max-w-lg"><Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Tìm theo tên, email hoặc số điện thoại..." /></label>
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#faf8f5] text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Khách hàng</th><th className="px-4 py-3">Số điện thoại</th><th className="px-4 py-3">Ngày tham gia</th><th className="px-4 py-3 text-right">Số đơn</th><th className="px-5 py-3 text-right">Tổng chi tiêu</th></tr></thead>
          <tbody>{customersQuery.isPending ? Array.from({ length: 7 }, (_, index) => <tr key={index}><td colSpan={5} className="px-5 py-4"><div className="h-8 animate-pulse rounded bg-muted" /></td></tr>) : customersQuery.data?.items.map((customer) => (
            <tr key={customer.id} className="border-t border-border hover:bg-[#fcfbf9]">
              <td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-semibold text-primary">{customer.full_name.trim().charAt(0).toLocaleUpperCase("vi-VN")}</span><div><p className="font-semibold">{customer.full_name}</p><p className="text-xs text-muted-foreground">{customer.email}</p></div></div></td>
              <td className="px-4 py-3 text-muted-foreground">{customer.phone || "—"}</td><td className="px-4 py-3 text-muted-foreground">{formatDate(customer.created_at)}</td><td className="px-4 py-3 text-right">{customer.order_count}</td><td className="px-5 py-3 text-right font-semibold">{formatPrice(customer.total_spent)}</td>
            </tr>
          ))}{!customersQuery.isPending && !customersQuery.data?.items.length && <tr><td colSpan={5} className="px-5 py-12 text-center"><Users aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 text-muted-foreground">Không tìm thấy khách hàng.</p></td></tr>}</tbody>
        </table></div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm"><span className="text-muted-foreground">{customersQuery.data?.total ?? 0} khách hàng</span><div className="flex items-center gap-3"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button><span>{page}/{customersQuery.data?.total_pages || 1}</span><Button variant="outline" size="sm" disabled={page >= (customersQuery.data?.total_pages ?? 1)} onClick={() => setPage((value) => value + 1)}>Sau</Button></div></div>
      </section>
    </div>
  )
}
