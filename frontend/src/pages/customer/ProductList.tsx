import { useQuery } from "react-query"
import { Card } from "../../../components/ui/button"
import { Skeleton } from "../../../components/ui/skeleton"

// Mock data for product list
const mockProducts = [
  { id: 1, name: "Cà phê Phin Premium", price: 45000, stock: 25, image: "https://via.placeholder.com/400/6F4E37/FFFFFF?text=Product+1" },
  { id: 2, name: "Cà phê Phin Tươi", price: 38000, stock: 18, image: "https://via.placeholder.com/400/6F4E37/FFFFFF?text=Product+2" },
  { id: 3, name: "Cà phê Phin Đa", price: 52000, stock: 12, image: "https://via.placeholder.com/400/6F4E37/FFFFFF?text=Product+3" },
  { id: 4, name: "Cà phê Phin Premium", price: 48000, stock: 30, image: "https://via.placeholder.com/400/6F4E37/FFFFFF?text=Product+4" },
  { id: 5, name: "Cà phê Phin Cà phê", price: 32000, stock: 45, image: "https://via.placeholder.com/400/6F4E37/FFFFFF?text=Product+5" },
]

export default function ProductList() {
  const { data: products, isLoading, isError } = useQuery(
    "products",
    () => Promise.resolve(mockProducts),
    {
      staleTime: 60,
    }
  )

  if (isLoading) return <Skeleton className="h-12" />
  if (isError) return <Skeleton className="h-12" />

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">Danh sách sản phẩm</h1>
        <p className="text-zinc-500">Xem tất cả sản phẩm tại Phin & Bean.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
            title={product.name}
          >
            <div className="aspect-square rounded-lg overflow-hidden mb-4">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">{product.name}</h3>
                <p className="text-zinc-500 text-sm">${product.price / 1000} VND</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">{product.stock} left</span>
                <button className="text-sm text-primary hover:underline">Xem chi tiết</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
