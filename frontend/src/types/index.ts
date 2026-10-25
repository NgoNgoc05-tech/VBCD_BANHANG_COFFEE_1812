// ============================================
// Shared TypeScript Types - Dùng cho cả frontend & backend
// ============================================

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: "customer" | "admin";
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  sale_price_cents: number | null;
  stock: number;
  images: string[];
  category_id: number;
  is_featured: boolean;
  is_active: boolean;
  avg_rating: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
}

export interface Order {
  id: number;
  code: string;
  user_id: number;
  total_amount_cents: number;
  status: "pending" | "processing" | "shipping" | "completed" | "cancelled";
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  payment_method: string;
  payment_status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
}

export interface ChatMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface ChatHistory {
  id: number;
  role: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface Cart {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemDetail {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
}

export interface ProductFilter {
  keyword: string;
  category_slug: string | null;
  min_price: number | null;
  max_price: number | null;
  sort: "newest" | "price_asc" | "price_desc" | "rating";
  featured: boolean;
}

export interface OrderFilter {
  status: string | null;
  date_from: string | null;
  date_to: string | null;
}

export interface OrderDetail {
  id: number;
  code: string;
  user_id: number;
  total_amount_cents: number;
  status: "pending" | "processing" | "shipping" | "completed" | "cancelled";
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  payment_method: string;
  payment_status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  role: "customer" | "admin";
  created_at: string;
}

export interface DashboardStats {
  total_revenue_30d: number;
  total_orders: number;
  total_customers: number;
  products_at_risk: number;
}

export interface AdminDashboard {
  stats: DashboardStats;
  order_status_counts: Record<string, number>;
  top_5_products: Product[];
  latest_orders: Order[];
}

export interface ChatBotResponse {
  answer: string;
  suggested_products: number[];
  error?: string;
}
