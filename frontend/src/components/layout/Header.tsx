import { Coffee, ShoppingBag, UserRound } from "lucide-react"
import { Link, NavLink } from "react-router-dom"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors hover:text-primary ${
    isActive ? "text-primary" : "text-foreground/75"
  }`

export default function Header() {
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
          <Link
            to="/account"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-secondary"
          >
            <UserRound aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Tài khoản</span>
          </Link>
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
