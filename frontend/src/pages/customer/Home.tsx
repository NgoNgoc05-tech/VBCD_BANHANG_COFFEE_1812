import { useQuery } from "@tanstack/react-query"
import { ArrowDown, Coffee } from "lucide-react"
import { Badge } from "../../components/ui/badge"

interface HealthResponse {
  status: string
  database?: string
}

async function getBackendHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/health")
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }

  const health: HealthResponse = await response.json()
  if (health.status !== "ok") {
    throw new Error("Backend health check reported an unhealthy status")
  }

  return health
}

export default function Home() {
  const { isPending, isError } = useQuery({
    queryKey: ["backend-health"],
    queryFn: getBackendHealth,
    retry: false,
  })

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-[#2E211A] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_45%,rgba(212,163,115,0.3),transparent_45%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Badge className="mb-6 border border-white/20 bg-white/10 text-amber-100 hover:bg-white/10">
              Cà phê Việt, chuẩn vị mỗi sáng
            </Badge>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Chậm một nhịp,
              <span className="block text-[#D4A373]">đậm một ngày.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">
              Hương vị cà phê Việt được tuyển chọn kỹ lưỡng, dành cho những
              khoảnh khắc bạn muốn tận hưởng trọn vẹn.
            </p>
            <div className="mt-8">
              {isPending ? (
                <Badge variant="outline" className="border-white/30 text-white">
                  Đang kiểm tra kết nối backend...
                </Badge>
              ) : isError ? (
                <Badge variant="destructive">Mất kết nối</Badge>
              ) : (
                <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">
                  Kết nối backend: OK
                </Badge>
              )}
            </div>
          </div>
          <div className="mx-auto flex aspect-square w-full max-w-sm items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#8E6345] to-[#3B2A20] shadow-[0_30px_100px_-30px_rgba(0,0,0,0.8)]">
            <div className="flex h-4/5 w-4/5 items-center justify-center rounded-full border border-[#D4A373]/40 bg-[#2E211A]/50">
              <Coffee
                aria-hidden="true"
                className="h-28 w-28 text-[#D4A373] sm:h-36 sm:w-36"
                strokeWidth={1}
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs text-stone-400 sm:flex">
          <ArrowDown aria-hidden="true" className="h-4 w-4" />
          Hương vị dành riêng cho bạn
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Từ hạt cà phê đến tách thơm
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
            Chọn cách bạn bắt đầu ngày mới
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Cà phê hạt rang, cà phê phin, cold brew và dụng cụ pha chế — tất cả
            đều bắt đầu từ niềm yêu thích hương vị nguyên bản.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["01", "Hạt rang", "Hương thơm tròn đầy từ những mẻ rang vừa đủ."],
            ["02", "Cà phê phin", "Vị đậm đà thân quen, chậm rãi qua từng giọt."],
            ["03", "Cold brew", "Mát lành, dịu nhẹ cho những ngày nhiều nắng."],
          ].map(([number, title, description]) => (
            <article
              key={number}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <span className="text-sm font-medium text-accent">{number}</span>
              <h3 className="mt-5 text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-2 leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
