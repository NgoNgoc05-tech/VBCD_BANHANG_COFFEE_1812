// ============================================
// Format utilities - Định dạng tiền & ngày giờ
// ============================================
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatPrice(amount: number | null | undefined): string {
  return currencyFormatter.format(amount ?? 0)
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return ""
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return ""
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return ""
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return ""
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${minute}`
}

export function formatOrderCode(id: number, code?: string): string {
  if (code) return code
  return `COF-${String(id).padStart(6, "0")}`
}
