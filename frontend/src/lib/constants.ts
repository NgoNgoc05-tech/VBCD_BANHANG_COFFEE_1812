// ============================================
// App Constants - Chuyển trạng thái & nhãn hiển thị
// Định nghĩa 1 file dùng chung cho Frontend
// ============================================

// --- Order status ---
export const ORDER_STATUS = {
  PENDING: "pending", // "Chờ xác nhận" - badge vàng
  PROCESSING: "processing", // "Đang xử lý" - badge xanh dương
  SHIPPING: "shipping", // "Đang giao" - badge tím
  COMPLETED: "completed", // "Đã hoàn thành" - badge xanh lá
  CANCELLED: "cancelled", // "Đã hủy" - badge xám/đỏ
} as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipping: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
}

// --- Payment method ---
export const PAYMENT_METHODS = {
  COD: "cod",
  MOCK_CARD: "mock_card",
  VIETQR: "vietqr",
} as const

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "COD",
  mock_card: "Thẻ giả lập",
  vietqr: "VietQR giả lập",
}

// --- User role ---
export const ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
} as const

// --- Chatbot ---
export const CHATBOT_RATE_LIMIT = 10 // request/phút/IP
export const CHATBOT_RATE_LIMIT_WINDOW_SECONDS = 60

// --- Shipping fee ---
export const FREE_SHIPPING_THRESHOLD_CENTS = 500000 // Miễn phí vận chuyển từ 500.000đ
export const SHIPPING_FEE_CENTS = 30000 // Phí ship cố định 30.000đ

// --- Order ---
export const ORDER_TIMELINE_STEPS = ["pending", "processing", "shipping", "completed"] as const

export const DEFAULT_CATEGORY_SLUG = "ca-phe" // fallback
