import { create } from "zustand"
import { persist } from "zustand/middleware"
import { User } from "../types"

export interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  loading: boolean

  login: (user: Partial<User>) => void
  logout: () => void
  setUser: (user: User | null) => void
  checkAuth: () => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: true,

      login: (userData: Partial<User>) => {
        const user: User = {
          id: Math.floor(Math.random() * 10000) + 1,
          full_name: userData.full_name ?? "Khách hàng",
          email: userData.email ?? "",
          role: userData.role ?? "customer",
        }
        set({ user, isAuthenticated: true, loading: false })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, loading: false })
      },

      setUser: (user: User | null) => set({ user, isAuthenticated: user !== null, loading: false }),

      checkAuth: async () => {
        // Ở giai đoạn 1: localStorage simulation
        // Ở giai đoạn 2+: gọi API /api/auth/me để đồng bộ
        const stored = typeof window !== "undefined" ? localStorage.getItem("[TÊN SHOP]_auth") : null
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            set({ user: parsed.user, isAuthenticated: true, loading: false })
          } catch {
            localStorage.removeItem("[TÊN SHOP]_auth")
            set({ user: null, isAuthenticated: false, loading: false })
          }
        } else {
          set({ user: null, isAuthenticated: false, loading: false })
        }
      },
    }),
    {
      name: "[TÊN SHOP]_auth",
    }
  )
)