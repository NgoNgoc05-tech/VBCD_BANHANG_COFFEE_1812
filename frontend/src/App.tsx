import { useQuery } from "@tanstack/react-query"
import { useLocation } from "react-router-dom"
import { useState } from "react"
import { useAuthStore } from "./stores"
import { useCartStore } from "./stores"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog"
import { useToast } from "./components/ui/use-toast"
import { Link, Outlet } from "react-router-dom"
import { Toaster } from "./components/ui/toaster"
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { useState as useState2 } from "react"

function ConnectionStatus() {
  const { data: health, isLoading, isError } = useQuery(
    "health",
    async () => {
      const response = await fetch("/api/health")
      if (!response.ok) {
        throw new Error("Backend health check failed")
      }
      const data = await response.json()
      return data
    },
    {
      retry: false,
      staleTime: 30000,
    }
  )

  if (isLoading) {
    return <Badge variant="outline" className="text-sm py-1 px-3">Đang kiểm tra...</Badge>
  }

  if (isError || !health) {
    return <Badge variant="destructive" className="text-sm py-1 px-3">Mất kết nối backend</Badge>
  }

  return <Badge variant="success" className="text-sm py-1 px-3">Kết nối backend: OK</Badge>
}

function HomePage() {
  const { data: health, isLoading, isError } = useQuery(
    "health",
    async () => {
      const response = await fetch("/api/health")
      if (!response.ok) {
        throw new Error("Backend health check failed")
      }
      const data = await response.json()
      return data
    },
    {
      retry: false,
      staleTime: 30000,
    }
  )

  const [showLogin, setShowLogin] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const location = useLocation()

  const handleLogin = () => {
    setShowLogin(true)
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">Cà phê Phin & Bean</h1>
        <p className="text-xl text-zinc-500 mb-8">Cà phê rang cháy nướng, phin thủ công đậm đà</p>

        <div className="mb-12">
          <ConnectionStatus />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Cà phê Phin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-500">Cà phê phin truyền thống với hạt rang cháy nướng</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Cà phê Espresso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-500">Cà phê Espresso đậm đà cho người hâm mộ</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Dung Môi & Phin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-500">Dung cụ pha cà phê chuyên dụng</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-center mt-8">
        <Button onClick={handleLogin}>Đăng nhập</Button>
      </div>

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng nhập</DialogTitle>
            <DialogDescription>Vui lòng đăng nhập vào tài khoản của bạn.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function App() {
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg">☕</span>
            </div>
            <span className="text-xl font-bold text-zinc-900">Phin & Bean</span>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {location.pathname === "/" ? <HomePage /> : <Outlet />}
      </main>

      <footer className="border-t border-border bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-zinc-500">
          <p>© 2025 Phin & Bean - Coffee Shop. All rights reserved.</p>
        </div>
      </footer>

      <Toaster />
    </div>
  )
}
