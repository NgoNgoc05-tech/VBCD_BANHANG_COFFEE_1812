import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  Award,
  Coffee,
  Gift,
  HeartHandshake,
  Leaf,
  Truck,
} from "lucide-react"
import { Link } from "react-router-dom"
import { getCategories, getProducts } from "../../api/catalog"
import ProductCard, { ProductCardSkeleton } from "../../components/product/ProductCard"
import { Button } from "../../components/ui/button"
import { formatPrice } from "../../lib/format"
import type { Product } from "../../types"

function ProductSection({
  eyebrow,
  title,
  description,
  products,
  isPending,
  isError,
  emptyMessage,
}: {
  eyebrow: string
  title: string
  description: string
  products: Product[]
  isPending: boolean
  isError: boolean
  emptyMessage: string
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
      <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        </div>
        <Link
          to="/products"
          className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline sm:inline-flex"
        >
          Xem tất cả <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      {isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <ProductCardSkeleton key={index} />)}
        </div>
      ) : isError ? (
        <p role="status" className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
          Chưa thể tải sản phẩm. Vui lòng thử tải lại trang.
        </p>
      ) : products.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
      <Link to="/products" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary sm:hidden">
        Xem tất cả sản phẩm <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  )
}

const benefits = [
  {
    icon: Leaf,
    title: "Tuyển chọn kỹ lưỡng",
    text: "Nguồn hạt chất lượng, giữ trọn hương vị đặc trưng của cà phê Việt.",
  },
  {
    icon: Award,
    title: "Rang mới mỗi ngày",
    text: "Chú trọng độ tươi để mỗi lần pha đều thơm ngon và tròn vị.",
  },
  {
    icon: HeartHandshake,
    title: "Tư vấn tận tâm",
    text: "Giúp bạn chọn gu cà phê và cách pha phù hợp với sở thích.",
  },
  {
    icon: Truck,
    title: "Giao hàng chu đáo",
    text: "Đóng gói cẩn thận, miễn phí vận chuyển từ 500.000đ.",
  },
]

export default function Home() {
  const categoriesQuery = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  })
  const featuredQuery = useQuery({
    queryKey: ["catalog", "products", "featured"],
    queryFn: () => getProducts({ featured: true, page_size: 4, sort: "rating" }),
    staleTime: 60_000,
  })
  const newestQuery = useQuery({
    queryKey: ["catalog", "products", "newest"],
    queryFn: () => getProducts({ page_size: 4, sort: "newest" }),
    staleTime: 60_000,
  })

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-[#2E211A] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_45%,rgba(212,163,115,0.3),transparent_45%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-amber-100 sm:text-sm">
              Cà phê Việt, chuẩn vị mỗi sáng
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Chậm một nhịp,
              <span className="block text-[#D4A373]">đậm một ngày.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">
              Hương vị cà phê Việt được tuyển chọn kỹ lưỡng, dành cho những khoảnh khắc bạn muốn tận hưởng trọn vẹn.
            </p>
            <Button asChild size="lg" className="mt-8 bg-[#D4A373] text-[#1F1A17] hover:bg-[#e2b88e]">
              <Link to="/products">Khám phá sản phẩm <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
          <div className="mx-auto flex aspect-square w-full max-w-sm items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#8E6345] to-[#3B2A20] shadow-[0_30px_100px_-30px_rgba(0,0,0,0.8)]">
            <div className="flex h-4/5 w-4/5 items-center justify-center rounded-full border border-[#D4A373]/40 bg-[#2E211A]/50">
              <Coffee aria-hidden="true" className="h-28 w-28 text-[#D4A373] sm:h-36 sm:w-36" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="mb-7 text-center sm:mb-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Từ hạt cà phê đến tách thơm</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Khám phá danh mục</h2>
        </div>
        {categoriesQuery.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        ) : categoriesQuery.isError ? (
          <p role="status" className="text-center text-muted-foreground">Chưa thể tải danh mục sản phẩm.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
            {categoriesQuery.data.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.slug)}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  <img
                    src={category.image_url || "/placeholder.svg"}
                    alt={category.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = "/placeholder.svg"
                    }}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex min-h-14 items-center justify-between gap-2 px-3 py-3 sm:px-4">
                  <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <ProductSection
        eyebrow="Được yêu thích"
        title="Sản phẩm nổi bật"
        description="Những lựa chọn được Phin & Bean tuyển chọn dành riêng cho bạn."
        products={featuredQuery.data?.items ?? []}
        isPending={featuredQuery.isPending}
        isError={featuredQuery.isError}
        emptyMessage="Sản phẩm nổi bật sẽ được cập nhật sớm."
      />
      <ProductSection
        eyebrow="Vừa lên kệ"
        title="Sản phẩm mới"
        description="Khám phá những hương vị và món đồ pha chế mới nhất."
        products={newestQuery.data?.items ?? []}
        isPending={newestQuery.isPending}
        isError={newestQuery.isError}
        emptyMessage="Hiện chưa có sản phẩm mới."
      />

      <section className="mx-4 overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-soft sm:mx-8 lg:mx-auto lg:max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 px-6 py-8 sm:flex-row sm:items-center sm:px-10 sm:py-10">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Gift aria-hidden="true" className="h-6 w-6 text-accent" />
            </span>
            <div>
              <p className="text-xl font-semibold sm:text-2xl">Ưu đãi giao hàng miễn phí</p>
              <p className="mt-2 text-sm text-white/75">Áp dụng cho đơn hàng từ {formatPrice(500_000)}.</p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link to="/products">Mua sắm ngay <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto mb-9 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Phin &amp; Bean</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Vì sao chọn Phin &amp; Bean</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
