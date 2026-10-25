import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, LoaderCircle } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { z } from "zod"
import AuthLayout from "../../components/auth/AuthLayout"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import api from "../../api/client"
import type { AuthResponse } from "../../types"
import { getApiErrorMessage } from "../../lib/apiError"
import { getPostAuthPath } from "../../lib/authNavigation"
import { useAuthStore } from "../../stores/authStore"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
})

type LoginValues = z.infer<typeof loginSchema>

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const saveLogin = useAuthStore((state) => state.login)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginValues) => {
    try {
      const response = await api.post<AuthResponse>("/api/auth/login", values)
      saveLogin(response.data.access_token, response.data.user)
      toast.success("Đăng nhập thành công.")
      navigate(getPostAuthPath(location.state), { replace: true })
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Không thể đăng nhập. Vui lòng thử lại.")
      if (message === "Email hoặc mật khẩu không chính xác.") {
        setError("password", { type: "server", message })
      }
      toast.error(message)
    }
  }

  return (
    <AuthLayout
      heading="Chào mừng bạn trở lại"
      description="Đăng nhập để tiếp tục hành trình thưởng thức cà phê."
      switchLabel="Chưa có tài khoản?"
      switchText="Tạo tài khoản"
      switchTo="/register"
      switchState={location.state}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ban@email.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
            Mật khẩu
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              aria-invalid={Boolean(errors.password)}
              className="pr-12"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="h-11 w-full rounded-lg" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
        Bằng việc tiếp tục, bạn đồng ý với các điều khoản mua hàng của Phin &amp; Bean.
      </p>
      <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-primary">
        Quay về trang chủ
      </Link>
    </AuthLayout>
  )
}
