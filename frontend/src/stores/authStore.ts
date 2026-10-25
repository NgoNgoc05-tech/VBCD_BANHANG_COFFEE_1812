import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "../types"

export interface AuthStore {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  loading: boolean

  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User | null) => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      loading: false,

      login: (token, user) => {
        set({ token, user, isAuthenticated: true, loading: false })
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, loading: false })
      },

      setUser: (user: User | null) =>
        set((state) => ({
          token: user ? state.token : null,
          user,
          isAuthenticated: user !== null && state.token !== null,
          loading: false,
        })),

      checkAuth: () =>
        set((state) => ({
          isAuthenticated: state.user !== null && state.token !== null,
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
