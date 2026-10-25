import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import { AdminRoute, ProtectedRoute } from "./components/auth/ProtectedRoute"
import ChatWidget from "./components/chat/ChatWidget"
import Footer from "./components/layout/Footer"
import Header from "./components/layout/Header"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import Account from "./pages/customer/Account"
import Home from "./pages/customer/Home"
import ProductList from "./pages/customer/ProductList"
import ProductDetail from "./pages/customer/ProductDetail"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function RoutePlaceholder() {
  return (
    <main className="mx-auto flex min-h-[45vh] max-w-7xl items-center justify-center px-4 py-16">
      <div className="text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Phin &amp; Bean
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          Trang này sẽ sớm có mặt
        </h1>
        <p className="mt-3 text-muted-foreground">
          Chúng tôi đang chuẩn bị thêm trải nghiệm dành cho bạn.
        </p>
      </div>
    </main>
  )
}

function AppLayout() {
  const location = useLocation()
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register"

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0">
      {!isAuthPage && <Header />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
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
            path="/admin"
            element={
              <AdminRoute>
                <RoutePlaceholder />
              </AdminRoute>
            }
          />
          <Route path="*" element={<RoutePlaceholder />} />
        </Routes>
      </div>
      {!isAuthPage && <Footer />}
      <Toaster position="top-right" richColors />
      <ChatWidget />
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
