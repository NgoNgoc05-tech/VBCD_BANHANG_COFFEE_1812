// ============================================
// Format utilities - Định dạng tiền & ngày giờ
// ============================================
import { OrderStatus } from "../types";

export function formatCurrency(cents: number): string {
  // Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  // VND không có ký tự symbol nên format sẽ ra "1.000.000" -> cần thêm chữ VND
  const number = new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents);
  return `${number} VND`;
}

export function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "0 VND";
  const number = new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents);
  return `${number} VND`;
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  // dd/MM/yyyy
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

export function formatOrderCode(id: number, code?: string): string {
  if (code) return code;
  return `COF-${String(id).padStart(6, "0")}`;
}
