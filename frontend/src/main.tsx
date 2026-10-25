import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createRoutesFromElements, createBrowserRouter } from "react-router-dom"
import { AuthProvider } from "./stores/authStore"
import Home from "./pages/customer/Home"
import ProductList from "./pages/customer/ProductList"
import ProductDetail from "./pages/customer/ProductDetail"
import "./styles/index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 300000,
    },
  },
})

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/products",
    element: <ProductList />,
  },
  {
    path: "/products/:id",
    element: <ProductDetail />,
  },
  {
    path: "*",
    element: <Home />,
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
