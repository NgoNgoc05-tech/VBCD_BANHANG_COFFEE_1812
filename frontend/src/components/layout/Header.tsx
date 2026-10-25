import { Coffee, House, LogOut, Package, Search, Shield, ShoppingBag, UserRound } from "lucide-react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { useAuthStore } from "../../stores/authStore"
import { toast } from "sonner"
import HeaderSearch from "./HeaderSearch"
import { useCartStore } from "../../stores/cartStore"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors hover:text-primary ${
    isActive ? "text-primary" : "text-foreground/75"
  }`

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const cartCount = useCartStore((state) => state.cart.reduce((total, item) => total + item.quantity, 0))
  const hideMobileNav = location.pathname.startsWith("/admin") || location.pathname.startsWith("/checkout")

  const signOut = () => {
    logout()
    toast.success("Bạn đã đăng xuất.")
    navigate("/")
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="Phin & Bean - Trang chủ">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Coffee aria-hidden="true" className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-bold leading-tight text-foreground">
              Phin &amp; Bean
            </span>
            <span className="hidden text-[11px] tracking-wide text-muted-foreground sm:block">
              Cà phê Việt, chuẩn vị mỗi sáng
            </span>
          </span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-8 xl:flex">
          <NavLink to="/" end className={linkClass}>
            Trang chủ
          </NavLink>
          <NavLink to="/products" className={linkClass}>
            Sản phẩm
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            Về chúng tôi
          </NavLink>
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
          <HeaderSearch />
          <Link
            to="/cart"
            aria-label="Giỏ hàng"
            className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-secondary hover:text-primary"
          >
            <ShoppingBag aria-hidden="true" className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Tài khoản ${user.full_name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {user.full_name.trim().charAt(0).toLocaleUpperCase("vi-VN")}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-semibold">{user.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <UserRound aria-hidden="true" />
                    Tài khoản
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders">
                    <Package aria-hidden="true" />
                    Đơn hàng của tôi
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Shield aria-hidden="true" />
                      Quản trị
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
                  <LogOut aria-hidden="true" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-secondary"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
    {!hideMobileNav && (
      <nav aria-label="Điều hướng di động" className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t border-border bg-background/95 shadow-[0_-4px_18px_rgba(31,26,23,0.06)] backdrop-blur-md md:hidden">
        <NavLink to="/" end className={({ isActive }) => `${linkClass({ isActive })} flex flex-col items-center justify-center gap-1 text-[11px]`}>
          <House aria-hidden="true" className="h-5 w-5" />Trang chủ
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `${linkClass({ isActive })} flex flex-col items-center justify-center gap-1 text-[11px]`}>
          <Search aria-hidden="true" className="h-5 w-5" />Sản phẩm
        </NavLink>
        <NavLink to="/cart" className={({ isActive }) => `${linkClass({ isActive })} relative flex flex-col items-center justify-center gap-1 text-[11px]`}>
          <ShoppingBag aria-hidden="true" className="h-5 w-5" />
          {cartCount > 0 && <span className="absolute left-1/2 top-1 -ml-1 h-2 w-2 rounded-full bg-primary" />}
          Giỏ hàng
        </NavLink>
        <NavLink to="/account" className={({ isActive }) => `${linkClass({ isActive })} flex flex-col items-center justify-center gap-1 text-[11px]`}>
          <UserRound aria-hidden="true" className="h-5 w-5" />Tài khoản
        </NavLink>
      </nav>
    )}
    </>
  )
}
