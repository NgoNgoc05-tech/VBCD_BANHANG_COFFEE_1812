import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import { useEffect } from "react"
import { Coffee, Home as HomeIcon } from "lucide-react"
import { AdminRoute, ProtectedRoute } from "./components/auth/ProtectedRoute"
import AdminLayout from "./components/admin/AdminLayout"
import ChatWidget from "./components/chat/ChatWidget"
import Footer from "./components/layout/Footer"
import Header from "./components/layout/Header"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import Account from "./pages/customer/Account"
import Home from "./pages/customer/Home"
import ProductList from "./pages/customer/ProductList"
import ProductDetail from "./pages/customer/ProductDetail"
import Cart from "./pages/customer/Cart"
import Checkout from "./pages/customer/Checkout"
import OrderSuccess from "./pages/customer/OrderSuccess"
import Orders from "./pages/customer/Orders"
import OrderDetail from "./pages/customer/OrderDetail"
import Dashboard from "./pages/admin/Dashboard"
import AdminProducts from "./pages/admin/Products"
import AdminCategories from "./pages/admin/Categories"
import AdminOrders from "./pages/admin/Orders"
import AdminCustomers from "./pages/admin/Customers"
import CartDrawer from "./components/cart/CartDrawer"
import { useAuthStore } from "./stores/authStore"
import { useCartStore } from "./stores/cartStore"
import { toast } from "sonner"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Trang chủ"
  if (pathname === "/products") return "Sản phẩm"
  if (pathname.startsWith("/products/")) return "Chi tiết sản phẩm"
  if (pathname === "/cart") return "Giỏ hàng"
  if (pathname === "/checkout") return "Thanh toán"
  if (pathname.startsWith("/order-success/")) return "Đặt hàng thành công"
  if (pathname === "/login") return "Đăng nhập"
  if (pathname === "/register") return "Đăng ký"
  if (pathname === "/account") return "Tài khoản"
  if (pathname === "/account/orders") return "Đơn hàng của tôi"
  if (pathname.startsWith("/account/orders/")) return "Chi tiết đơn hàng"
  if (pathname === "/admin") return "Tổng quan"
  if (pathname === "/admin/products") return "Quản lý sản phẩm"
  if (pathname === "/admin/categories") return "Quản lý danh mục"
  if (pathname === "/admin/orders") return "Quản lý đơn hàng"
  if (pathname === "/admin/customers") return "Khách hàng"
  return "Không tìm thấy trang"
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary">
          <Coffee aria-hidden="true" className="h-10 w-10" />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Phin &amp; Bean</p>
        <h1 className="mt-3 text-3xl font-bold">Trang này chưa được pha</h1>
        <p className="mt-3 text-muted-foreground">Đường dẫn bạn tìm có thể đã thay đổi hoặc không tồn tại.</p>
        <Link
          to="/"
          className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <HomeIcon aria-hidden="true" className="h-4 w-4" />
          Về trang chủ
        </Link>
      </div>
    </main>
  )
}

function AppLayout() {
  const location = useLocation()
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register"
  const isCheckout = location.pathname === "/checkout"
  const isAdminArea = location.pathname.startsWith("/admin")
  const token = useAuthStore((state) => state.token)
  const isCartDrawerOpen = useCartStore((state) => state.isDrawerOpen)

  useEffect(() => {
    const cartStore = useCartStore.getState()
    if (token) {
      void cartStore.hydrateServerCart().catch(() => {
        toast.error("Không thể tải giỏ hàng từ máy chủ.")
      })
    } else {
      cartStore.showGuestCart()
    }
  }, [])

  useEffect(() => {
    document.title = `${getPageTitle(location.pathname)} | Phin & Bean`
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [location.pathname])

  return (
    <div className={`flex min-h-screen flex-col bg-background ${
      isCheckout || isAdminArea ? "" : "pb-36 md:pb-0"
    }`}>
      {!isAuthPage && !isAdminArea && <Header />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-success/:code"
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/orders/:code"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {!isAuthPage && !isCheckout && !isAdminArea && <Footer />}
      <Toaster position="top-right" richColors />
      {!isCheckout && !isAdminArea && !isCartDrawerOpen && <ChatWidget />}
      {!isAdminArea && <CartDrawer />}
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
