import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/customer/Home"
import ProductList from "./pages/customer/ProductList"
import ProductDetail from "./pages/customer/ProductDetail"
import MyOrders from "./pages/customer/MyOrders"
import AdminLayout from "./pages/admin/Layout"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminProducts from "./pages/admin/Products"
import AdminCategories from "./pages/admin/Categories"
import AdminOrders from "./pages/admin/Orders"
import AdminUsers from "./pages/admin/Users"
import NotFound from "./pages/customer/NotFound"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer routes */}
        <Route path="/" element={<Home />} />
        <Route path="/san-pham" element={<ProductList />} />
        <Route path="/san-pham/:slug" element={<ProductDetail />} />
        <Route path="/don-hang" element={<MyOrders />} />
        <Route path="/404" element={<NotFound />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}