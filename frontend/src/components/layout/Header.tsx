import { useState } from "react"
import { useStore } from "../stores"
import { cn } from "../lib/utils"
import { MenuBar, XMark, Search, ShoppingCart, User, LogOut, Moon, Sun } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Header() {
  const { user, isAuthenticated } = useStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }))
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)

  // Tính số lượng item trong giỏ (mặc định 0 nếu chưa login/không có giỏ)
  if (isAuthenticated && user) {
    // Ở giai đoạn 1: mock số lượng
    setCartItemCount(3)
  }

  const toggleSearch = () => setIsSearchOpen((prev) => !prev)

  const handleLogout = () => {
    // useStore.getState().logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-50 bg-amber-50/90 backdrop-blur-md border-b border-amber-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          {/* Sử dụng hình ảnh placeholder hoặc icon */}
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <span className="text-amber-600 text-xl font-bold">☕</span>
          </div>
          <span className="text-xl font-bold text-zinc-800">[TÊN SHOP]</span>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-zinc-600 hover:text-zinc-800 transition-colors font-medium">
            Trang chủ
          </a>
          <a href="#" className="text-zinc-600 hover:text-zinc-800 transition-colors font-medium">
            Sản phẩm
          </a>
          <a href="#" className="text-zinc-600 hover:text-zinc-800 transition-colors font-medium">
            Giỏ hàng
          </a>
          <a href="#" className="text-zinc-600 hover:text-zinc-800 transition-colors font-medium">
            Liên hệ
          </a>
        </nav>

        {/* User actions & Search & Cart */}
        <div className="flex items-center gap-4">
          {/* Search bar (debounce 300ms) */}
          <button
            onClick={toggleSearch}
            className={cn(
              "relative p-2 rounded-lg hover:bg-amber-50 transition-colors",
              "md:hidden"
            )}
            aria-label="Tìm kiếm"
          >
            <Search className="w-5 h-5 text-zinc-500" />
          </button>

          {/* Cart badge */}
          <button
            onClick={() => navigate("/gio-hang")}
            className={cn(
              "relative p-2 rounded-lg hover:bg-amber-50 transition-colors",
              "flex items-center gap-1"
            )}
            aria-label="Giỏ hàng"
          >
            <ShoppingCart className="w-5 h-5 text-zinc-500" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* User menu */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-zinc-500" />
              <span className="text-sm text-zinc-600">{user?.full_name}</span>
            </div>
          ) : (
            <button
              onClick={() => navigate("/dang-nhap")}
              className="text-sm text-zinc-600 hover:underline"
            >
              Đăng nhập
            </button>
          )}
          {isAuthenticated && (
            <button onClick={handleLogout} className="text-sm text-zinc-600 hover:underline">
              Đăng xuất
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu (collapsed) */}
      <nav className="md:hidden">
        <ul className="flex flex-col p-4 bg-amber-50">
          <li>
            <a href="#" className="py-2 px-3 text-zinc-700 hover:bg-amber-100 transition-colors">Trang chủ</a>
          </li>
          <li>
            <a href="#" className="py-2 px-3 text-zinc-700 hover:bg-amber-100 transition-colors">Sản phẩm</a>
          </li>
          <li>
            <a href="#" className="py-2 px-3 text-zinc-700 hover:bg-amber-100 transition-colors">Giỏ hàng</a>
          </li>
          <li>
            <a href="#" className="py-2 px-3 text-zinc-700 hover:bg-amber-100 transition-colors">Liên hệ</a>
          </li>
          {isAuthenticated ? (
            <li>
              <button onClick={handleLogout} className="py-2 px-3 text-amber-600">Đăng xuất</button>
            </li>
          ) : (
            <li>
              <a href="#" className="py-2 px-3 text-zinc-700 hover:bg-amber-100 transition-colors">Đăng nhập</a>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}