import type { ReactNode } from "react"
import { Coffee } from "lucide-react"
import { Link } from "react-router-dom"

interface AuthLayoutProps {
  children: ReactNode
  heading: string
  description: string
  switchLabel: string
  switchText: string
  switchTo: string
  switchState?: unknown
}

export default function AuthLayout({
  children,
  heading,
  description,
  switchLabel,
  switchText,
  switchTo,
  switchState,
}: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen bg-background md:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#2E211A] text-white md:flex md:min-h-screen md:flex-col md:justify-between md:p-12 lg:p-16">
        <img
          src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1600&q=85"
          alt="Tách cà phê trong không gian ấm áp"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#211711]/65 via-[#211711]/20 to-[#211711]/90" />
        <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Coffee aria-hidden="true" className="h-5 w-5 text-[#E7B982]" />
          </span>
          <span className="text-lg font-bold">Phin &amp; Bean</span>
        </Link>
        <div className="relative z-10 max-w-lg pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#E7B982]">
            Cà phê Việt, chuẩn vị mỗi sáng
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight lg:text-5xl">
            Một góc nhỏ để
            <span className="block text-[#E7B982]">thưởng thức vị quen.</span>
          </h1>
          <p className="mt-5 max-w-md leading-7 text-white/75">
            Hạt cà phê được tuyển chọn kỹ lưỡng, dành cho những khoảnh khắc bạn
            muốn tận hưởng trọn vẹn.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-primary md:hidden">
            <Coffee aria-hidden="true" className="h-5 w-5" />
            Phin &amp; Bean
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Phin &amp; Bean
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {heading}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-7 text-center text-sm text-muted-foreground">
            {switchLabel}{" "}
            <Link to={switchTo} state={switchState} className="font-semibold text-primary hover:underline">
              {switchText}
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
