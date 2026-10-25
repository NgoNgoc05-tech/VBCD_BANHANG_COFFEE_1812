import { useQuery } from "react-query"
import { Card } from "../../../components/ui/button"
import { Skeleton } from "../../../components/ui/skeleton"

// Mock data for product detail
const mockProductDetail = {
  id: 1,
  name: "Cà phê Phin Premium",
  price: 45000,
  stock: 25,
  image: "https://via.placeholder.com/600/400/6F4E37/FFFFFF?text=Product+1+Detail",
  description: "Cà phê Phin Premium - Cà phê phin cao cấp với hạt phin select, hương vị đậm đà và thơm ngon."
}

export default function ProductDetail() {
  const { data, isLoading, isError } = useQuery(
    "product-detail",
    () => Promise.resolve(mockProductDetail),
    {
      staleTime: 300,
    }
  )

  if (isLoading) return <Skeleton className="h-64" />
  if (isError) return <Skeleton className="h-64" />
  if (!data) return <p className="text-center text-zinc-500">Sản phẩm không tìm thấy.</p>

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-card rounded-xl p-8 shadow-lg">
            <img src={data.image} alt={data.name} className="w-full h-64 object-cover" />
            <div className="mt-6">
              <h1 className="text-2xl font-bold text-center mb-4">{data.name}</h1>
              <p className="text-zinc-500 text-lg mb-4">{data.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-primary">${data.price / 1000} VND</p>
                  <p className="text-zinc-500">{data.stock} sản phẩm</p>
                </div>
                <div className="flex items-center gap-4">
                  <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors">Mua ngay</button>
                  <button className="text-zinc-500 hover:text-primary px-4 py-2 rounded-lg transition-colors">Xem chi tiết</button>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Thông tin chi tiết</h2>
            <p className="text-zinc-500 mb-4">{data.description}</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-2xl">⭐</span>
                <span className="text-primary">{data.stock} sản phẩm còn lại</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl">⏱</span>
                <span className="text-primary">{data.price / 1000} VND</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl">📦</span>
                <span className="text-primary">{data.stock} sản phẩm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
