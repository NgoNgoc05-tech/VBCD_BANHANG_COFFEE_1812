import axios from "axios"

// Base URL sẽ định nghĩa qua .env hoặc base path
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
})

// --- JWT interceptor ---
// Ném ra lỗi 401, frontend sẽ tự logout và chuyển về login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không xác thực
      // Store sẽ xử lý logout và redirect về trang login
      // window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api