import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, LoaderCircle } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { z } from "zod"
import api from "../../api/client"
import AuthLayout from "../../components/auth/AuthLayout"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { getApiErrorMessage } from "../../lib/apiError"
import { useAuthStore } from "../../stores/authStore"
import { toast } from "sonner"

const phonePattern = /^(0|\+84)(3|5|7|8|9)\d{8}$/
const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, "Họ tên cần có ít nhất 2 ký tự."),
    email: z.string().trim().email("Email không hợp lệ."),
    phone: z.union([
      z.literal(""),
      z.string().regex(phonePattern, "Số điện thoại không đúng định dạng."),
    ]),
    address: z.string().trim().max(500, "Địa chỉ tối đa 500 ký tự."),
    password: z
      .string()
      .min(8, "Mật khẩu cần có ít nhất 8 ký tự.")
      .refine((value) => /\p{L}/u.test(value) && /\d/.test(value), {
        message: "Mật khẩu cần có cả chữ và số.",
      }),
    confirm_password: z.string(),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: "Mật khẩu xác nhận chưa khớp.",
    path: ["confirm_password"],
  })

type RegisterValues = z.infer<typeof registerSchema>

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = async (values: RegisterValues) => {
    try {
      await api.post("/api/auth/register", {
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        phone: values.phone || null,
        address: values.address || null,
      })
      toast.success("Đăng ký thành công. Vui lòng đăng nhập.")
      navigate("/login", { replace: true, state: location.state })
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Không thể tạo tài khoản. Vui lòng thử lại.")
      if (message === "Email này đã được đăng ký.") {
        setError("email", { type: "server", message })
      }
      toast.error(message)
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <AuthLayout
      heading="Tạo tài khoản mới"
      description="Tham gia cùng Phin & Bean để lưu thông tin giao hàng và theo dõi đơn hàng."
      switchLabel="Đã có tài khoản?"
      switchText="Đăng nhập"
      switchTo="/login"
      switchState={location.state}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-foreground">
            Họ và tên
          </label>
          <Input id="full_name" autoComplete="name" placeholder="Nguyễn Minh Anh" aria-invalid={Boolean(errors.full_name)} {...register("full_name")} />
          {errors.full_name && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.full_name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
            Email
          </label>
          <Input id="email" type="email" autoComplete="email" placeholder="ban@email.com" aria-invalid={Boolean(errors.email)} {...register("email")} />
          {errors.email && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">
            Số điện thoại <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
          </label>
          <Input id="phone" type="tel" autoComplete="tel" placeholder="0912345678" aria-invalid={Boolean(errors.phone)} {...register("phone")} />
          {errors.phone && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.phone.message}</p>}
        </div>
        <div>
          <label htmlFor="address" className="mb-2 block text-sm font-medium text-foreground">
            Địa chỉ <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
          </label>
          <Input id="address" autoComplete="street-address" placeholder="Địa chỉ giao hàng" aria-invalid={Boolean(errors.address)} {...register("address")} />
          {errors.address && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.address.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
            Mật khẩu
          </label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Ít nhất 8 ký tự, gồm chữ và số" className="pr-12" aria-invalid={Boolean(errors.password)} {...register("password")} />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.password.message}</p>}
        </div>
        <div>
          <label htmlFor="confirm_password" className="mb-2 block text-sm font-medium text-foreground">
            Nhập lại mật khẩu
          </label>
          <div className="relative">
            <Input id="confirm_password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Nhập lại mật khẩu" className="pr-12" aria-invalid={Boolean(errors.confirm_password)} {...register("confirm_password")} />
            <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground">
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm_password && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.confirm_password.message}</p>}
        </div>
        <Button type="submit" className="h-11 w-full rounded-lg" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </Button>
      </form>
    </AuthLayout>
  )
}
