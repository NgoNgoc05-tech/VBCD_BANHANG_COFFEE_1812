import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import { useEffect } from "react"
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

  return (
    <div className={`flex min-h-screen flex-col bg-background ${
      isCheckout || location.pathname.startsWith("/admin") ? "" : "pb-16 md:pb-0"
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
          </Route>
          <Route path="*" element={<main className="mx-auto flex min-h-[45vh] max-w-7xl items-center justify-center px-4 py-16"><div className="text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Phin &amp; Bean</p><h1 className="mt-3 text-2xl font-semibold">Trang này không tồn tại</h1></div></main>} />
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
