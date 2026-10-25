import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle, LockKeyhole, Package, UserRound } from "lucide-react"
import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import api from "../../api/client"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { getApiErrorMessage } from "../../lib/apiError"
import { useAuthStore } from "../../stores/authStore"
import type { User } from "../../types"
import { toast } from "sonner"

const phonePattern = /^(0|\+84)(3|5|7|8|9)\d{8}$/
const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Họ tên cần có ít nhất 2 ký tự."),
  phone: z.union([z.literal(""), z.string().regex(phonePattern, "Số điện thoại không đúng định dạng.")]),
  address: z.string().trim().max(500, "Địa chỉ tối đa 500 ký tự."),
})
const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    new_password: z
      .string()
      .min(8, "Mật khẩu mới cần có ít nhất 8 ký tự.")
      .refine((value) => /\p{L}/u.test(value) && /\d/.test(value), {
        message: "Mật khẩu mới cần có cả chữ và số.",
      }),
    confirm_password: z.string(),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: "Mật khẩu xác nhận chưa khớp.",
    path: ["confirm_password"],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export default function Account() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
    },
  })
  const resetProfile = profileForm.reset
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  })

  useEffect(() => {
    let cancelled = false
    api
      .get<User>("/api/auth/me")
      .then((response) => {
        if (!cancelled) {
          setUser(response.data)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Không thể tải hồ sơ tài khoản."))
        }
      })
    return () => {
      cancelled = true
    }
  }, [setUser])

  useEffect(() => {
    if (user) {
      resetProfile({
        full_name: user.full_name,
        phone: user.phone ?? "",
        address: user.address ?? "",
      })
    }
  }, [resetProfile, user])

  const saveProfile = async (values: ProfileValues) => {
    try {
      const response = await api.put<User>("/api/auth/me", {
        ...values,
        phone: values.phone || null,
        address: values.address || null,
      })
      setUser(response.data)
      toast.success("Đã cập nhật hồ sơ.")
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật hồ sơ. Vui lòng thử lại."))
    }
  }

  const changePassword = async (values: PasswordValues) => {
    try {
      const response = await api.put<{ message: string }>("/api/auth/change-password", {
        current_password: values.current_password,
        new_password: values.new_password,
      })
      toast.success(response.data.message)
      passwordForm.reset()
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Không thể đổi mật khẩu. Vui lòng thử lại.")
      if (message === "Mật khẩu hiện tại không chính xác.") {
        passwordForm.setError("current_password", { type: "server", message })
      }
      toast.error(message)
    }
  }

  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Tài khoản</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Thông tin của bạn</h1>
          <p className="mt-2 text-muted-foreground">Quản lý hồ sơ và bảo mật tài khoản Phin &amp; Bean.</p>
        </div>
        <Button asChild variant="outline"><Link to="/account/orders"><Package aria-hidden="true" /> Đơn hàng của tôi</Link></Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <UserRound aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-foreground">Hồ sơ cá nhân</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <form className="space-y-4" onSubmit={profileForm.handleSubmit(saveProfile)} noValidate>
            <div>
              <label htmlFor="account-name" className="mb-2 block text-sm font-medium">Họ và tên</label>
              <Input id="account-name" autoComplete="name" aria-invalid={Boolean(profileForm.formState.errors.full_name)} {...profileForm.register("full_name")} />
              {profileForm.formState.errors.full_name && <p className="mt-1 text-sm text-destructive">{profileForm.formState.errors.full_name.message}</p>}
            </div>
            <div>
              <label htmlFor="account-phone" className="mb-2 block text-sm font-medium">Số điện thoại</label>
              <Input id="account-phone" type="tel" autoComplete="tel" aria-invalid={Boolean(profileForm.formState.errors.phone)} {...profileForm.register("phone")} />
              {profileForm.formState.errors.phone && <p className="mt-1 text-sm text-destructive">{profileForm.formState.errors.phone.message}</p>}
            </div>
            <div>
              <label htmlFor="account-address" className="mb-2 block text-sm font-medium">Địa chỉ</label>
              <Input id="account-address" autoComplete="street-address" aria-invalid={Boolean(profileForm.formState.errors.address)} {...profileForm.register("address")} />
              {profileForm.formState.errors.address && <p className="mt-1 text-sm text-destructive">{profileForm.formState.errors.address.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting && <LoaderCircle aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
              {profileForm.formState.isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <LockKeyhole aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-foreground">Đổi mật khẩu</h2>
              <p className="text-sm text-muted-foreground">Dùng mật khẩu mạnh gồm chữ và số.</p>
            </div>
          </div>
          <form className="space-y-4" onSubmit={passwordForm.handleSubmit(changePassword)} noValidate>
            <div>
              <label htmlFor="current-password" className="mb-2 block text-sm font-medium">Mật khẩu hiện tại</label>
              <Input id="current-password" type="password" autoComplete="current-password" aria-invalid={Boolean(passwordForm.formState.errors.current_password)} {...passwordForm.register("current_password")} />
              {passwordForm.formState.errors.current_password && <p className="mt-1 text-sm text-destructive">{passwordForm.formState.errors.current_password.message}</p>}
            </div>
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-medium">Mật khẩu mới</label>
              <Input id="new-password" type="password" autoComplete="new-password" aria-invalid={Boolean(passwordForm.formState.errors.new_password)} {...passwordForm.register("new_password")} />
              {passwordForm.formState.errors.new_password && <p className="mt-1 text-sm text-destructive">{passwordForm.formState.errors.new_password.message}</p>}
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium">Nhập lại mật khẩu mới</label>
              <Input id="confirm-password" type="password" autoComplete="new-password" aria-invalid={Boolean(passwordForm.formState.errors.confirm_password)} {...passwordForm.register("confirm_password")} />
              {passwordForm.formState.errors.confirm_password && <p className="mt-1 text-sm text-destructive">{passwordForm.formState.errors.confirm_password.message}</p>}
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting && <LoaderCircle aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
              {passwordForm.formState.isSubmitting ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
