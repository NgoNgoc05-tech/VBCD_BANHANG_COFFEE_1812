import { Coffee, LogOut, Package, Shield, ShoppingBag, UserRound } from "lucide-react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { useAuthStore } from "../../stores/authStore"
import { toast } from "sonner"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors hover:text-primary ${
    isActive ? "text-primary" : "text-foreground/75"
  }`

export default function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const signOut = () => {
    logout()
    toast.success("Bạn đã đăng xuất.")
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
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

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-8 md:flex">
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

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/cart"
            aria-label="Giỏ hàng"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-secondary hover:text-primary"
          >
            <ShoppingBag aria-hidden="true" className="h-5 w-5" />
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
      <nav aria-label="Điều hướng di động" className="flex border-t border-border/70 md:hidden">
        <NavLink to="/" end className={({ isActive }) => `${linkClass({ isActive })} flex-1 py-3 text-center`}>
          Trang chủ
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `${linkClass({ isActive })} flex-1 py-3 text-center`}>
          Sản phẩm
        </NavLink>
        <NavLink to="/cart" className={({ isActive }) => `${linkClass({ isActive })} flex-1 py-3 text-center`}>
          Giỏ hàng
        </NavLink>
        <NavLink to="/account" className={({ isActive }) => `${linkClass({ isActive })} flex-1 py-3 text-center`}>
          Tài khoản
        </NavLink>
      </nav>
    </header>
  )
}
