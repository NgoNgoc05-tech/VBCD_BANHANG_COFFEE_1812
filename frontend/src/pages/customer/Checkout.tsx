import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Banknote, CreditCard, LoaderCircle, QrCode, ShieldCheck, Truck } from "lucide-react"
import { createOrder, type CreateOrderRequest } from "../../api/cart"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { getApiErrorMessage } from "../../lib/apiError"
import { formatPrice } from "../../lib/format"
import { useAuthStore } from "../../stores/authStore"
import { useCartStore } from "../../stores/cartStore"

const phonePattern = /^(0|\+84)(3|5|7|8|9)\d{8}$/
const checkoutSchema = z.object({
  shipping_name: z.string().trim().min(2, "Vui lòng nhập họ tên người nhận."),
  shipping_phone: z.string().trim().regex(phonePattern, "Số điện thoại không đúng định dạng."),
  shipping_address: z.string().trim().min(5, "Vui lòng nhập địa chỉ giao hàng."),
  note: z.string().max(1000, "Ghi chú tối đa 1000 ký tự."),
  payment_method: z.enum(["cod", "mock_card", "vietqr"]),
  card_number: z.string().optional(),
  card_holder: z.string().optional(),
  card_expiry: z.string().optional(),
  card_cvv: z.string().optional(),
}).superRefine((values, context) => {
  if (values.payment_method !== "mock_card") return
  const number = (values.card_number ?? "").replace(/\s/g, "")
  if (!/^\d{16}$/.test(number)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["card_number"], message: "Số thẻ phải gồm 16 chữ số." })
  }
  if (!(values.card_holder ?? "").trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["card_holder"], message: "Vui lòng nhập tên chủ thẻ." })
  }
  const expiry = values.card_expiry ?? ""
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["card_expiry"], message: "Ngày hết hạn theo định dạng MM/YY." })
  } else {
    const [monthText, yearText] = expiry.split("/")
    const month = Number(monthText)
    const year = 2000 + Number(yearText)
    const now = new Date()
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["card_expiry"], message: "Thẻ đã hết hạn." })
    }
  }
  if (!/^\d{3}$/.test(values.card_cvv ?? "")) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["card_cvv"], message: "CVV gồm 3 chữ số." })
  }
})

type CheckoutValues = z.infer<typeof checkoutSchema>

const paymentMethods = [
  { value: "cod", label: "Thanh toán khi nhận hàng", description: "Trả tiền mặt khi đơn hàng được giao.", icon: Banknote },
  { value: "mock_card", label: "Thẻ (giả lập)", description: "Thanh toán an toàn bằng thẻ thử nghiệm.", icon: CreditCard },
  { value: "vietqr", label: "VietQR (giả lập)", description: "Quét mã QR và xác nhận chuyển khoản.", icon: QrCode },
] as const

const FREE_SHIPPING_THRESHOLD = 500_000

export default function Checkout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const items = useCartStore((state) => state.items)
  const subtotal = useCartStore((state) => state.subtotal)
  const isHydrating = useCartStore((state) => state.isHydrating)
  const clearAfterCheckout = useCartStore((state) => state.clearAfterCheckout)
  const [orderPending, setOrderPending] = useState(false)
  const {
    register,
    watch,
    setValue,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping_name: user?.full_name ?? "",
      shipping_phone: user?.phone ?? "",
      shipping_address: user?.address ?? "",
      note: "",
      payment_method: "cod",
      card_number: "",
      card_holder: "",
      card_expiry: "",
      card_cvv: "",
    },
  })
  const paymentMethod = watch("payment_method")
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 30_000

  useEffect(() => {
    if (!user) return
    setValue("shipping_name", user.full_name)
    setValue("shipping_phone", user.phone ?? "")
    setValue("shipping_address", user.address ?? "")
  }, [setValue, user])

  const submit = handleSubmit(async (values) => {
    if (items.length === 0) {
      toast.error("Giỏ hàng đang trống.")
      navigate("/cart")
      return
    }
    const request: CreateOrderRequest = {
      shipping_name: values.shipping_name,
      shipping_phone: values.shipping_phone,
      shipping_address: values.shipping_address,
      note: values.note.trim() || undefined,
      payment_method: values.payment_method,
    }
    if (values.payment_method === "mock_card") {
      request.card = {
        number: (values.card_number ?? "").replace(/\s/g, ""),
        holder: (values.card_holder ?? "").trim(),
        expiry: values.card_expiry ?? "",
        cvv: values.card_cvv ?? "",
      }
    }

    setOrderPending(true)
    try {
      const order = await createOrder(request)
      clearAfterCheckout()
      toast.success("Đặt hàng thành công!")
      navigate(`/order-success/${encodeURIComponent(order.code)}`, { replace: true })
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Không thể đặt hàng. Vui lòng thử lại.")
      if (message.includes("Số điện thoại")) {
        setError("shipping_phone", { type: "server", message })
      }
      toast.error(message)
    } finally {
      setOrderPending(false)
    }
  })

  if (isHydrating) {
    return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-8"><div className="h-80 animate-pulse rounded-2xl bg-muted" /></main>
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Giỏ hàng đang trống</h1>
          <p className="mt-2 text-muted-foreground">Thêm sản phẩm trước khi thanh toán nhé.</p>
          <Button asChild className="mt-5"><Link to="/products">Tiếp tục mua sắm</Link></Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
        <Link to="/cart" className="hover:text-primary">Giỏ hàng</Link><span className="mx-2">/</span><span className="text-foreground">Thanh toán</span>
      </nav>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Bước cuối cùng</p>
        <h1 className="mt-2 text-3xl font-semibold">Thanh toán</h1>
      </div>

      <form onSubmit={submit} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Truck aria-hidden="true" /></span>
              <div><h2 className="font-semibold">Thông tin giao hàng</h2><p className="mt-1 text-xs text-muted-foreground">Đơn hàng sẽ được giao đến địa chỉ này.</p></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="shipping_name" className="mb-1.5 block text-sm font-medium">Họ và tên người nhận</label>
                <Input id="shipping_name" autoComplete="name" aria-invalid={Boolean(errors.shipping_name)} {...register("shipping_name")} />
                {errors.shipping_name && <p role="alert" className="mt-1 text-xs text-destructive">{errors.shipping_name.message}</p>}
              </div>
              <div>
                <label htmlFor="shipping_phone" className="mb-1.5 block text-sm font-medium">Số điện thoại</label>
                <Input id="shipping_phone" type="tel" autoComplete="tel" placeholder="0912345678" aria-invalid={Boolean(errors.shipping_phone)} {...register("shipping_phone")} />
                {errors.shipping_phone && <p role="alert" className="mt-1 text-xs text-destructive">{errors.shipping_phone.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="shipping_address" className="mb-1.5 block text-sm font-medium">Địa chỉ giao hàng</label>
                <Input id="shipping_address" autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" aria-invalid={Boolean(errors.shipping_address)} {...register("shipping_address")} />
                {errors.shipping_address && <p role="alert" className="mt-1 text-xs text-destructive">{errors.shipping_address.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="note" className="mb-1.5 block text-sm font-medium">Ghi chú <span className="font-normal text-muted-foreground">(không bắt buộc)</span></label>
                <textarea id="note" rows={3} {...register("note")} placeholder="Lưu ý khi giao hàng..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                {errors.note && <p role="alert" className="mt-1 text-xs text-destructive">{errors.note.message}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
            <div className="mb-5">
              <h2 className="font-semibold">Phương thức thanh toán</h2>
              <p className="mt-1 text-sm text-muted-foreground">Chọn cách thanh toán phù hợp với bạn.</p>
            </div>
            <div className="space-y-3">
              {paymentMethods.map(({ value, label, description, icon: Icon }) => (
                <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${paymentMethod === value ? "border-primary bg-secondary/40 ring-1 ring-primary" : "border-border hover:border-primary/40"}`}>
                  <input type="radio" value={value} {...register("payment_method")} className="mt-1 accent-primary" />
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><Icon aria-hidden="true" className="h-5 w-5" /></span>
                  <span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span>
                </label>
              ))}
            </div>

            {paymentMethod === "mock_card" && (
              <div className="mt-5 space-y-4 rounded-xl border border-border bg-background p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold"><CreditCard aria-hidden="true" className="h-4 w-4 text-primary" /> Thông tin thẻ giả lập</div>
                <div>
                  <label htmlFor="card_number" className="mb-1.5 block text-sm font-medium">Số thẻ</label>
                  <Input
                    id="card_number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    aria-invalid={Boolean(errors.card_number)}
                    {...register("card_number", {
                      onChange: (event) => {
                        const digits = event.target.value.replace(/\D/g, "").slice(0, 16)
                        setValue("card_number", digits.match(/.{1,4}/g)?.join(" ") ?? "", { shouldValidate: true })
                      },
                    })}
                  />
                  {errors.card_number && <p role="alert" className="mt-1 text-xs text-destructive">{errors.card_number.message}</p>}
                </div>
                <div>
                  <label htmlFor="card_holder" className="mb-1.5 block text-sm font-medium">Tên chủ thẻ</label>
                  <Input id="card_holder" autoComplete="cc-name" placeholder="NGUYEN VAN A" aria-invalid={Boolean(errors.card_holder)} {...register("card_holder")} />
                  {errors.card_holder && <p role="alert" className="mt-1 text-xs text-destructive">{errors.card_holder.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="card_expiry" className="mb-1.5 block text-sm font-medium">MM/YY</label>
                    <Input id="card_expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="12/28" maxLength={5} aria-invalid={Boolean(errors.card_expiry)} {...register("card_expiry", {
                      onChange: (event) => {
                        const digits = event.target.value.replace(/\D/g, "").slice(0, 4)
                        setValue("card_expiry", digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits, { shouldValidate: true })
                      },
                    })} />
                    {errors.card_expiry && <p role="alert" className="mt-1 text-xs text-destructive">{errors.card_expiry.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="card_cvv" className="mb-1.5 block text-sm font-medium">CVV</label>
                    <Input id="card_cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={3} aria-invalid={Boolean(errors.card_cvv)} {...register("card_cvv", {
                      onChange: (event) => setValue("card_cvv", event.target.value.replace(/\D/g, "").slice(0, 3), { shouldValidate: true }),
                    })} />
                    {errors.card_cvv && <p role="alert" className="mt-1 text-xs text-destructive">{errors.card_cvv.message}</p>}
                  </div>
                </div>
                <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-xs leading-5 text-foreground/80">
                  <strong>Thẻ thử nghiệm:</strong><br />
                  Thành công: 4242 4242 4242 4242<br />
                  Bị từ chối: 4000 0000 0000 0002<br />
                  Dùng tên bất kỳ, ngày hết hạn trong tương lai và CVV 3 chữ số.
                </div>
              </div>
            )}

            {paymentMethod === "vietqr" && (
              <div className="mt-5 flex flex-col items-center rounded-xl border border-border bg-background p-5 text-center">
                <img src="/qr-mock.svg" alt="Mã QR chuyển khoản VietQR minh họa" className="h-36 w-36 rounded-xl border border-border bg-white p-2" />
                <p className="mt-3 text-sm font-semibold">Mã QR minh họa</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Đơn hàng sẽ được tạo ở trạng thái chờ thanh toán. Bạn có thể xác nhận chuyển khoản tại trang thông tin đơn hàng.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Tóm tắt đơn hàng</h2>
          <div className="mt-4 max-h-60 space-y-3 overflow-y-auto">
            {items.map((item) => (
              <div key={item.product_id} className="flex items-center gap-3">
                <img src={item.product.image_url || "/placeholder.svg"} alt="" onError={(event) => { event.currentTarget.src = "/placeholder.svg" }} className="h-12 w-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-medium">{item.product.name}</p><p className="text-xs text-muted-foreground">SL: {item.quantity}</p></div>
                <span className="text-sm font-semibold">{formatPrice((item.product.sale_price ?? item.product.price) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Tạm tính</span><span className="text-foreground">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Phí vận chuyển</span><span className="text-foreground">{shippingFee ? formatPrice(shippingFee) : "Miễn phí"}</span></div>
            <div className="flex justify-between border-t border-border pt-4 text-base font-bold"><span>Tổng cộng</span><span className="text-primary">{formatPrice(subtotal + shippingFee)}</span></div>
          </div>
          <Button type="submit" disabled={orderPending} className="mt-5 w-full">
            {orderPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Đang xử lý thanh toán...</> : "Đặt hàng"}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Thông tin thanh toán được bảo mật</p>
        </aside>
      </form>
    </main>
  )
}
