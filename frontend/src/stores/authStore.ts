import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "../types"

export interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  loading: boolean

  login: (user: User) => void
  logout: () => void
  setUser: (user: User | null) => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      login: (user) => {
        set({ user, isAuthenticated: true, loading: false })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, loading: false })
      },

      setUser: (user: User | null) =>
        set({ user, isAuthenticated: user !== null, loading: false }),

      checkAuth: () =>
        set((state) => ({
          isAuthenticated: state.user !== null,
          loading: false,
        })),
    }),
    {
      name: "phin-bean-auth",
    }
  )
)

export const useStore = useAuthStore

export { useAuthStore as useAuth }
