import { Coffee } from "lucide-react"
import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="border-t border-border bg-[#F3EDE5]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
            <Coffee aria-hidden="true" className="h-5 w-5 text-primary" />
            Phin &amp; Bean
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Cà phê Việt, chuẩn vị mỗi sáng. Gửi đến bạn những hạt cà phê được
            chọn lựa bằng sự trân trọng dành cho hương vị nguyên bản.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Khám phá</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><Link className="transition-colors hover:text-primary" to="/">Trang chủ</Link></li>
            <li><Link className="transition-colors hover:text-primary" to="/products">Sản phẩm</Link></li>
            <li><Link className="transition-colors hover:text-primary" to="/about">Về chúng tôi</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Liên hệ</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Chúng tôi luôn sẵn lòng giúp bạn tìm được tách cà phê yêu thích.
          </p>
        </div>
      </div>
      <div className="border-t border-border/80">
        <p className="mx-auto max-w-7xl px-5 py-4 text-xs text-muted-foreground sm:px-8">
          © {new Date().getFullYear()} Phin &amp; Bean. Cà phê Việt, chuẩn vị mỗi sáng.
        </p>
      </div>
    </footer>
  )
}
