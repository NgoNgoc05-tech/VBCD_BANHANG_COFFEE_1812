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

export const useAuthStore = create<AuthStore>()(
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
          created_at: new Date().toISOString(),
        }
        set({ user, isAuthenticated: true, loading: false })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, loading: false })
      },

      setUser: (user: User | null) =>
        set({ user, isAuthenticated: user !== null, loading: false }),

      checkAuth: async () => {
        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem("phin-bean-auth")
            : null
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            set({ user: parsed.user, isAuthenticated: true, loading: false })
          } catch {
            localStorage.removeItem("phin-bean-auth")
            set({ user: null, isAuthenticated: false, loading: false })
          }
        } else {
          set({ user: null, isAuthenticated: false, loading: false })
        }
      },
    }),
    {
      name: "phin-bean-auth",
    }
  )
)

export const useStore = useAuthStore

export { useAuthStore as useAuth }
