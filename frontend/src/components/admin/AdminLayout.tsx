import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Store,
  Users,
  X,
} from "lucide-react"
import { useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuthStore } from "../../stores/authStore"
import { useCartStore } from "../../stores/cartStore"

const navItems = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Sản phẩm", icon: Package },
  { to: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { to: "/admin/orders", label: "Đơn hàng", icon: ClipboardList },
  { to: "/admin/customers", label: "Khách hàng", icon: Users },
]

const pageTitles: Record<string, string> = {
  "/admin": "Tổng quan",
  "/admin/products": "Quản lý sản phẩm",
  "/admin/categories": "Quản lý danh mục",
  "/admin/orders": "Quản lý đơn hàng",
  "/admin/customers": "Khách hàng",
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const clearCart = useCartStore((state) => state.clearAfterCheckout)
  const title = pageTitles[location.pathname] ?? "Quản trị"

  const signOut = () => {
    logout()
    clearCart()
    toast.success("Bạn đã đăng xuất.")
    navigate("/login")
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 items-center border-b border-white/10 px-4 ${collapsed ? "justify-center" : "gap-3"}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary-foreground">
          <BarChart3 aria-hidden="true" className="h-5 w-5" />
        </span>
        {!collapsed && <span className="font-bold tracking-tight">Phin &amp; Bean</span>}
        <button type="button" className="ml-auto rounded p-1 text-white/70 hover:bg-white/10 md:hidden" aria-label="Đóng menu" onClick={() => setDrawerOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav aria-label="Quản trị" className="flex-1 space-y-1 px-3 py-5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setDrawerOpen(false)}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
              isActive ? "bg-white text-primary shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"
            } ${collapsed ? "justify-center px-2" : ""}`}
          >
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-white/10 p-3">
        <Link to="/" className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-white/80 hover:bg-white/10 ${collapsed ? "justify-center px-2" : ""}`}>
          <Store aria-hidden="true" className="h-5 w-5 shrink-0" />
          {!collapsed && "Về cửa hàng"}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          className="hidden h-9 w-full items-center justify-center rounded-lg text-white/70 hover:bg-white/10 md:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-[#34251d] text-white transition-all duration-200 md:flex ${collapsed ? "w-[76px]" : "w-64"}`}>
        {sidebar}
      </aside>
      {drawerOpen && (
        <div className="admin-drawer-overlay fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Đóng menu" onClick={() => setDrawerOpen(false)} />
          <aside className="admin-drawer-panel absolute inset-y-0 left-0 w-[min(82vw,300px)] bg-[#34251d] text-white">{sidebar}</aside>
        </div>
      )}
      <div className={`min-h-screen transition-[padding] ${collapsed ? "md:pl-[76px]" : "md:pl-64"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-lg p-2 hover:bg-secondary md:hidden" aria-label="Mở menu" onClick={() => setDrawerOpen(true)}>
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.full_name ?? "Quản trị viên"}</p>
              <p className="text-xs text-muted-foreground">Quản trị viên</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {user?.full_name.trim().charAt(0).toLocaleUpperCase("vi-VN") ?? "A"}
            </span>
            <button type="button" onClick={signOut} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary" aria-label="Đăng xuất">
              <LogOut aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-[1600px] p-4 sm:p-7">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
