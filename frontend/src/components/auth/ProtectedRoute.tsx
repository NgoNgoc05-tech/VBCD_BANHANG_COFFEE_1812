import type { ReactNode } from "react"
import { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { toast } from "sonner"
import { useAuthStore } from "../../stores/authStore"

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { token, user } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export function AdminRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { token, user } = useAuthStore()
  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (token && user && !isAdmin) {
      toast.error("Bạn không có quyền truy cập trang quản trị.")
    }
  }, [isAdmin, token, user])

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}
