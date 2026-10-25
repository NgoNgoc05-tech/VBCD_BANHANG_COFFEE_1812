import axios from "axios"
import { useAuthStore } from "../stores/authStore"

const api = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !/\/auth\/(login|register)$/.test(error.config?.url ?? "")
    ) {
      const { token, logout } = useAuthStore.getState()
      if (token) {
        if (typeof window !== "undefined") {
          const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
          if (returnTo !== "/login" && returnTo !== "/register") {
            window.sessionStorage.setItem("phin-bean-return-to", returnTo)
          }
        }
        logout()
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.assign("/login")
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api