import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { getCategories, getProducts, type ProductQuery } from "../../api/catalog"
import ProductCard, { ProductCardSkeleton } from "../../components/product/ProductCard"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import {
  Sheet,
  SheetContent,
} from "../../components/ui/sheet"
import { DialogTitle } from "../../components/ui/dialog"

const sortOptions: Array<{ value: NonNullable<ProductQuery["sort"]>; label: string }> = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "rating", label: "Đánh giá cao" },
]

function readPrice(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const search = searchParams.get("search") ?? ""
  const category = searchParams.get("category") ?? ""
  const minPrice = readPrice(searchParams.get("min_price"))
  const maxPrice = readPrice(searchParams.get("max_price"))
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const sortValue = searchParams.get("sort")
  const sort = sortOptions.some((option) => option.value === sortValue)
    ? (sortValue as NonNullable<ProductQuery["sort"]>)
    : "newest"
  const [minDraft, setMinDraft] = useState(minPrice?.toString() ?? "")
  const [maxDraft, setMaxDraft] = useState(maxPrice?.toString() ?? "")

  useEffect(() => {
    setMinDraft(minPrice?.toString() ?? "")
    setMaxDraft(maxPrice?.toString() ?? "")
  }, [minPrice, maxPrice])

  const params = useMemo<ProductQuery>(() => ({
    search: search || undefined,
    category: category || undefined,
    min_price: minPrice,
    max_price: maxPrice,
    sort,
    page,
    page_size: 12,
  }), [category, maxPrice, minPrice, page, search, sort])
  const productsQuery = useQuery({
    queryKey: ["catalog", "products", params],
    queryFn: () => getProducts(params),
    staleTime: 60_000,
  })
  const categoriesQuery = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  })
  const result = productsQuery.data

  const updateParams = (updates: Record<string, string | number | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") next.delete(key)
      else next.set(key, String(value))
    })
    if (resetPage && !("page" in updates)) next.delete("page")
    setSearchParams(next)
  }

  const applyPrice = () => {
    const min = readPrice(minDraft.trim() ? minDraft : null)
    const max = readPrice(maxDraft.trim() ? maxDraft : null)
    if (min !== undefined && max !== undefined && min > max) return
    updateParams({ min_price: min, max_price: max })
  }
  const invalidDraftRange =
    minDraft.trim() !== "" &&
    maxDraft.trim() !== "" &&
    Number.isFinite(Number(minDraft)) &&
    Number.isFinite(Number(maxDraft)) &&
    Number(minDraft) > Number(maxDraft)

  const clearFilters = () => {
    const next = new URLSearchParams()
    if (search) next.set("search", search)
    setSearchParams(next)
    setMobileFiltersOpen(false)
  }

  const choosePriceRange = (min: number | undefined, max: number | undefined) => {
    setMinDraft(min?.toString() ?? "")
    setMaxDraft(max?.toString() ?? "")
    updateParams({ min_price: min, max_price: max })
  }

  const filterContents = (
    <div className="space-y-7">
      <section>
        <h3 className="text-sm font-semibold text-foreground">Danh mục</h3>
        <fieldset className="mt-3 space-y-2.5">
          <legend className="sr-only">Lọc theo danh mục</legend>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
            <input
              type="radio"
              name="category"
              checked={!category}
              onChange={() => updateParams({ category: undefined })}
              className="accent-primary"
            />
            Tất cả danh mục
          </label>
          {(categoriesQuery.data ?? []).map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
              <input
                type="radio"
                name="category"
                checked={category === item.slug}
                onChange={() => updateParams({ category: item.slug })}
                className="accent-primary"
              />
              {item.name}
            </label>
          ))}
        </fieldset>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">Khoảng giá</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">
            Từ
            <Input
              inputMode="numeric"
              min="0"
              type="number"
              value={minDraft}
              onChange={(event) => setMinDraft(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && applyPrice()}
              placeholder="0"
              className="mt-1"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Đến
            <Input
              inputMode="numeric"
              min="0"
              type="number"
              value={maxDraft}
              onChange={(event) => setMaxDraft(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && applyPrice()}
              placeholder="Không giới hạn"
              className="mt-1"
            />
          </label>
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={applyPrice}>
          Áp dụng khoảng giá
        </Button>
        {invalidDraftRange && (
          <p role="alert" className="mt-2 text-xs text-destructive">Giá tối thiểu phải nhỏ hơn giá tối đa.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => choosePriceRange(undefined, 199_999)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary">
            Dưới 200k
          </button>
          <button type="button" onClick={() => choosePriceRange(200_000, 500_000)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary">
            200k–500k
          </button>
          <button type="button" onClick={() => choosePriceRange(500_001, undefined)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary">
            Trên 500k
          </button>
        </div>
      </section>
      <Button type="button" variant="ghost" className="w-full justify-start text-muted-foreground" onClick={clearFilters}>
        <X aria-hidden="true" /> Xóa lọc
      </Button>
    </div>
  )

  const maxPages = result?.total_pages ?? 0
  const pageNumbers = Array.from({ length: maxPages }, (_, index) => index + 1)
    .filter((number) => Math.abs(number - page) <= 2 || number === 1 || number === maxPages)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Trang chủ</Link><span className="mx-2">/</span>
        <span className="text-foreground">Sản phẩm</span>
      </nav>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Gian hàng</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Tất cả sản phẩm</h1>
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-2xl border border-border bg-card p-5 lg:block">
          <div className="mb-5 flex items-center gap-2 font-semibold">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-primary" /> Bộ lọc
          </div>
          {filterContents}
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Tìm kiếm sản phẩm</span>
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => updateParams({ search: event.target.value || undefined })}
                placeholder="Bạn đang tìm sản phẩm nào?"
                className="pl-10"
              />
            </label>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {productsQuery.isPending ? "Đang tải..." : `${result?.total ?? 0} sản phẩm`}
              </span>
              <label className="flex items-center gap-2 text-sm">
                <span className="hidden text-muted-foreground sm:inline">Sắp xếp</span>
                <select
                  value={sort}
                  onChange={(event) => updateParams({ sort: event.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Sắp xếp sản phẩm"
                >
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <Button type="button" variant="outline" className="lg:hidden" onClick={() => setMobileFiltersOpen(true)}>
                <Filter aria-hidden="true" /> Bộ lọc
              </Button>
            </div>
          </div>

          {productsQuery.isPending ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)}
            </div>
          ) : productsQuery.isError ? (
            <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
              <h2 className="text-xl font-semibold">Không thể tải sản phẩm</h2>
              <p className="mt-2 text-sm text-muted-foreground">Vui lòng kiểm tra kết nối rồi thử lại.</p>
              <Button className="mt-5" onClick={() => void productsQuery.refetch()}>Thử lại</Button>
            </div>
          ) : (result?.items.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
                <Search aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-semibold">Chưa tìm thấy sản phẩm phù hợp</h2>
              <p className="mt-2 text-sm text-muted-foreground">Thử thay đổi từ khóa hoặc xóa bớt bộ lọc nhé.</p>
              <Button variant="outline" className="mt-5" onClick={clearFilters}>Xóa bộ lọc</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                {result?.items.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
              {maxPages > 1 && (
                <nav aria-label="Phân trang sản phẩm" className="mt-9 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Trang trước"
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: page - 1 }, false)}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </Button>
                  {pageNumbers.map((number, index) => (
                    <span key={number} className="flex items-center gap-2">
                      {index > 0 && pageNumbers[index - 1] < number - 1 && <span className="px-1 text-muted-foreground">…</span>}
                      <Button
                        type="button"
                        variant={number === page ? "default" : "outline"}
                        size="icon"
                        aria-label={`Trang ${number}`}
                        aria-current={number === page ? "page" : undefined}
                        onClick={() => updateParams({ page: number }, false)}
                      >
                        {number}
                      </Button>
                    </span>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Trang sau"
                    disabled={page >= maxPages}
                    onClick={() => updateParams({ page: page + 1 }, false)}
                  >
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom" className="space-y-5">
          <DialogTitle className="text-lg font-semibold">Bộ lọc sản phẩm</DialogTitle>
          {filterContents}
          <Button type="button" className="w-full" onClick={() => setMobileFiltersOpen(false)}>Xem {result?.total ?? 0} sản phẩm</Button>
        </SheetContent>
      </Sheet>
    </main>
  )
}
