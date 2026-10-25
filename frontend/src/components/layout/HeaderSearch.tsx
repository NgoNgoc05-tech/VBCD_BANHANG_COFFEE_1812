import { useQuery } from "@tanstack/react-query"
import { Search, X } from "lucide-react"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { useNavigate } from "react-router-dom"
import { getProducts } from "../../api/catalog"
import { formatPrice } from "../../lib/format"

export default function HeaderSearch() {
  const navigate = useNavigate()
  const [value, setValue] = useState("")
  const [debouncedValue, setDebouncedValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value.trim()), 300)
    return () => window.clearTimeout(timeout)
  }, [value])

  useEffect(() => {
    if (mobileOpen) inputRef.current?.focus()
  }, [mobileOpen])

  const suggestionsQuery = useQuery({
    queryKey: ["catalog", "search-suggestions", debouncedValue],
    queryFn: () => getProducts({ search: debouncedValue, page_size: 5, sort: "newest" }),
    enabled: debouncedValue.length > 0,
    staleTime: 30_000,
  })
  const suggestions = suggestionsQuery.data?.items ?? []
  const isOpen = (mobile: boolean) =>
    isFocused && value.trim().length > 0 && (mobile ? mobileOpen : !mobileOpen)

  const goToSearch = () => {
    const search = value.trim()
    if (!search) return
    setIsFocused(false)
    setMobileOpen(false)
    navigate(`/products?search=${encodeURIComponent(search)}`)
  }

  const selectSuggestion = (slug: string) => {
    setIsFocused(false)
    setMobileOpen(false)
    navigate(`/products/${slug}`)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsFocused(false)
      setMobileOpen(false)
      inputRef.current?.blur()
      return
    }
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault()
      setIsFocused(true)
      setActiveIndex((index) => (index + 1) % suggestions.length)
    } else if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        selectSuggestion(suggestions[activeIndex].slug)
      } else {
        goToSearch()
      }
    }
  }

  const searchField = (mobile = false) => (
    <div className={`relative ${mobile ? "w-full" : "w-full"}`}>
      <label className="relative block">
        <span className="sr-only">Tìm sản phẩm</span>
        <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Tìm sản phẩm"
          aria-autocomplete="list"
          aria-expanded={isOpen(mobile)}
          aria-controls="header-search-suggestions"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setActiveIndex(-1)
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Tìm cà phê, dụng cụ..."
          className="h-10 w-full rounded-full border border-border bg-white/80 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
        />
      </label>
      {isOpen(mobile) && (
        <div
          id="header-search-suggestions"
          role="listbox"
          aria-label="Gợi ý sản phẩm"
          className={`${mobile ? "fixed left-4 right-4 top-[4.5rem]" : "absolute left-0 right-0 top-[calc(100%+0.5rem)] min-w-[320px]"} z-[80] overflow-hidden rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-medium`}
        >
          {suggestionsQuery.isPending ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Đang tìm sản phẩm...</p>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.slice(0, 5).map((product, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  key={product.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(product.slug)}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-secondary ${activeIndex === index ? "bg-secondary" : ""}`}
                >
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = "/placeholder.svg"
                    }}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 block text-sm font-medium">{product.name}</span>
                    <span className="mt-1 block text-xs font-semibold text-primary">
                      {formatPrice(product.sale_price ?? product.price)}
                    </span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={goToSearch}
                className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-border px-3 py-3 text-left text-sm font-medium text-primary hover:bg-secondary"
              >
                <Search aria-hidden="true" className="h-4 w-4" />
                Xem tất cả kết quả cho “{value.trim()}”
              </button>
            </>
          ) : suggestionsQuery.isError ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Không thể tải gợi ý lúc này.</p>
          ) : (
            <div className="p-3">
              <p className="text-sm text-muted-foreground">Không tìm thấy sản phẩm phù hợp.</p>
              <button type="button" onClick={goToSearch} className="mt-3 text-sm font-semibold text-primary">
                Xem tất cả kết quả cho “{value.trim()}”
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="hidden w-56 md:block xl:w-64">{searchField()}</div>
      <button
        type="button"
        aria-label="Mở tìm kiếm"
        onClick={() => setMobileOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/75 hover:bg-secondary hover:text-primary md:hidden"
      >
        <Search aria-hidden="true" className="h-5 w-5" />
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 z-[75] bg-background p-4 md:hidden">
          <div className="mb-5 flex items-center gap-3">
            <button
              type="button"
              aria-label="Đóng tìm kiếm"
              onClick={() => {
                setMobileOpen(false)
                setIsFocused(false)
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-secondary"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">Tìm kiếm sản phẩm</h2>
          </div>
          {searchField(true)}
        </div>
      )}
    </>
  )
}
