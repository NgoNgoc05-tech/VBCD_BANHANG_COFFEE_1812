import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ImagePlus, LoaderCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  getAdminProducts,
  setAdminProductStatus,
  updateAdminProduct,
  uploadAdminImage,
  type AdminProduct,
  type AdminProductInput,
} from "../../api/admin"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { formatPrice } from "../../lib/format"
import { getApiErrorMessage } from "../../lib/apiError"
import { toast } from "sonner"

const productSchema = z.object({
  name: z.string().trim().min(2, "Tên sản phẩm tối thiểu 2 ký tự."),
  category_id: z.number().int().positive("Vui lòng chọn danh mục."),
  price: z.number().int().positive("Giá phải lớn hơn 0."),
  sale_price: z.number().int().positive().nullable(),
  stock: z.number().int().min(0, "Tồn kho không được âm."),
  description: z.string().max(10000).nullable(),
  is_featured: z.boolean(),
  image_url: z.string().nullable(),
  images: z.array(z.string()),
  is_active: z.boolean(),
}).refine((values) => values.sale_price === null || values.sale_price < values.price, {
  message: "Giá khuyến mãi phải thấp hơn giá gốc.",
  path: ["sale_price"],
})
type ProductFormValues = z.infer<typeof productSchema>
const blankForm: ProductFormValues = {
  name: "", category_id: 0, price: 0, sale_price: null, stock: 0, description: "",
  is_featured: false, image_url: null, images: [], is_active: true,
}

export default function Products() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminProduct | null>(null)
  const [uploading, setUploading] = useState(false)
  const categoriesQuery = useQuery({ queryKey: ["admin", "categories"], queryFn: getAdminCategories })
  const productsQuery = useQuery({
    queryKey: ["admin", "products", search, category, status, page],
    queryFn: () => getAdminProducts({
      ...(search ? { search } : {}),
      ...(category ? { category: Number(category) } : {}),
      ...(status ? { status } : {}),
      page,
      page_size: 12,
    }),
  })
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: blankForm,
  })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] })

  useEffect(() => {
    if (!dialogOpen) form.reset(blankForm)
    else if (editing) form.reset({
      name: editing.name,
      category_id: editing.category_id,
      price: editing.price,
      sale_price: editing.sale_price,
      stock: editing.stock,
      description: editing.description ?? "",
      is_featured: editing.is_featured,
      image_url: editing.image_url,
      images: editing.images.filter((image) => image !== editing.image_url),
      is_active: editing.is_active,
    })
  }, [dialogOpen, editing, form])

  const saveMutation = useMutation({
    mutationFn: (values: AdminProductInput) => editing
      ? updateAdminProduct(editing.id, values)
      : createAdminProduct(values),
    onSuccess: async () => {
      toast.success(editing ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm.")
      setDialogOpen(false)
      setEditing(null)
      await invalidate()
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, "Không thể lưu sản phẩm.")),
  })
  const deleteMutation = useMutation({
    mutationFn: (product: AdminProduct) => deleteAdminProduct(product.id),
    onSuccess: async (result) => {
      toast.success(result.message)
      setDeleting(null)
      await invalidate()
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, "Không thể xóa sản phẩm.")),
  })
  const statusMutation = useMutation({
    mutationFn: ({ product, active }: { product: AdminProduct; active: boolean }) =>
      setAdminProductStatus(product.id, { is_active: active }),
    onSuccess: async (_, variables) => {
      toast.success(variables.active ? "Đã bật sản phẩm." : "Đã ẩn sản phẩm.")
      await invalidate()
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, "Không thể cập nhật trạng thái.")),
  })

  const beginCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const beginEdit = (product: AdminProduct) => {
    setEditing(product)
    setDialogOpen(true)
  }
  const upload = async (file: File, isPrimary: boolean) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error("Chọn ảnh JPG, PNG hoặc WEBP dung lượng tối đa 2 MB.")
      return
    }
    setUploading(true)
    try {
      const url = await uploadAdminImage(file)
      if (isPrimary) form.setValue("image_url", url, { shouldDirty: true })
      else form.setValue("images", [...form.getValues("images"), url], { shouldDirty: true })
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Không thể tải ảnh lên."))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-2xl font-semibold">Sản phẩm</h2><p className="mt-1 text-sm text-muted-foreground">Quản lý danh mục, giá bán và tồn kho.</p></div>
        <Button onClick={beginCreate}><Plus aria-hidden="true" /> Thêm sản phẩm</Button>
      </div>
      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_190px]">
          <label className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Tìm tên sản phẩm..." className="pl-9" />
          </label>
          <select aria-label="Lọc theo danh mục" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Tất cả danh mục</option>
            {categoriesQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select aria-label="Lọc trạng thái sản phẩm" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Mọi trạng thái</option><option value="active">Đang bán</option><option value="inactive">Đang ẩn</option><option value="low_stock">Sắp hết hàng</option><option value="out_of_stock">Hết hàng</option>
          </select>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-[#faf8f5] text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Sản phẩm</th><th className="px-4 py-3">Danh mục</th><th className="px-4 py-3 text-right">Giá</th><th className="px-4 py-3 text-right">Tồn kho</th><th className="px-4 py-3 text-center">Đang bán</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
            <tbody>
              {productsQuery.isPending ? Array.from({ length: 6 }, (_, index) => <tr key={index}><td colSpan={6} className="px-5 py-4"><div className="h-7 animate-pulse rounded bg-muted" /></td></tr>) : productsQuery.data?.items.map((product) => (
                <tr key={product.id} className="border-t border-border hover:bg-[#fcfbf9]">
                  <td className="px-5 py-3"><div className="flex items-center gap-3"><img src={product.image_url || "/placeholder.svg"} alt="" className="h-12 w-12 rounded-lg object-cover" /><div className="max-w-64"><p className="truncate font-semibold">{product.name}</p><p className="truncate text-xs text-muted-foreground">{product.slug}</p></div></div></td>
                  <td className="px-4 py-3 text-muted-foreground">{product.category.name}</td>
                  <td className="px-4 py-3 text-right"><p className="font-medium">{formatPrice(product.sale_price ?? product.price)}</p>{product.sale_price !== null && <p className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</p>}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${product.stock <= 5 ? "text-red-600" : ""}`}>{product.stock}</td>
                  <td className="px-4 py-3 text-center"><button type="button" aria-label={`${product.is_active ? "Ẩn" : "Bật"} ${product.name}`} aria-pressed={product.is_active} disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ product, active: !product.is_active })} className={`relative h-6 w-11 rounded-full transition ${product.is_active ? "bg-emerald-600" : "bg-gray-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${product.is_active ? "left-6" : "left-1"}`} /></button></td>
                  <td className="px-5 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label={`Sửa ${product.name}`} onClick={() => beginEdit(product)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Xóa ${product.name}`} className="text-red-600 hover:text-red-700" onClick={() => setDeleting(product)}><Trash2 /></Button></div></td>
                </tr>
              ))}
              {!productsQuery.isPending && !productsQuery.data?.items.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Không tìm thấy sản phẩm phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
          <span className="text-muted-foreground">{productsQuery.data?.total ?? 0} sản phẩm</span>
          <div className="flex items-center gap-3"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button><span>{page}/{productsQuery.data?.total_pages || 1}</span><Button variant="outline" size="sm" disabled={page >= (productsQuery.data?.total_pages ?? 1)} onClick={() => setPage((value) => value + 1)}>Sau</Button></div>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</DialogTitle><DialogDescription>Thông tin hiển thị trong cửa hàng Phin &amp; Bean.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate({
            ...values,
            sale_price: values.sale_price || null,
            description: values.description || null,
            image_url: values.image_url || null,
          }))}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Tên sản phẩm<Input {...form.register("name")} />{form.formState.errors.name && <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>}</label>
              <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Danh mục<select {...form.register("category_id", { valueAsNumber: true })} className="h-10 rounded-md border border-input bg-background px-3"><option value={0}>Chọn danh mục</option>{categoriesQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{form.formState.errors.category_id && <span className="text-xs text-red-600">{form.formState.errors.category_id.message}</span>}</label>
              <label className="grid gap-1.5 text-sm font-medium">Giá bán<input type="number" min="1" {...form.register("price", { valueAsNumber: true })} className="h-10 rounded-md border border-input bg-background px-3" />{form.formState.errors.price && <span className="text-xs text-red-600">{form.formState.errors.price.message}</span>}</label>
              <label className="grid gap-1.5 text-sm font-medium">Giá khuyến mãi<input type="number" min="0" {...form.register("sale_price", { setValueAs: (value) => value === "" ? null : Number(value) })} className="h-10 rounded-md border border-input bg-background px-3" />{form.formState.errors.sale_price && <span className="text-xs text-red-600">{form.formState.errors.sale_price.message}</span>}</label>
              <label className="grid gap-1.5 text-sm font-medium">Tồn kho<input type="number" min="0" {...form.register("stock", { valueAsNumber: true })} className="h-10 rounded-md border border-input bg-background px-3" />{form.formState.errors.stock && <span className="text-xs text-red-600">{form.formState.errors.stock.message}</span>}</label>
              <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Mô tả<textarea rows={4} {...form.register("description")} className="resize-y rounded-md border border-input bg-background px-3 py-2 font-normal" /></label>
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium">Ảnh chính</p>
                <div className="flex flex-wrap items-center gap-3">
                  {form.watch("image_url") && <img src={form.watch("image_url") ?? ""} alt="Xem trước ảnh chính" className="h-16 w-16 rounded-lg border object-cover" />}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"><ImagePlus className="h-4 w-4" />{uploading ? "Đang tải..." : "Tải ảnh chính"}<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, true); event.currentTarget.value = "" }} /></label>
                </div>
                <p className="mb-2 mt-4 text-sm font-medium">Ảnh phụ</p>
                <div className="flex flex-wrap items-center gap-2">{form.watch("images").map((image, index) => <span key={`${image}-${index}`} className="relative"><img src={image} alt={`Ảnh phụ ${index + 1}`} className="h-14 w-14 rounded-lg border object-cover" /><button type="button" aria-label={`Xóa ảnh phụ ${index + 1}`} onClick={() => form.setValue("images", form.getValues("images").filter((_, imageIndex) => imageIndex !== index))} className="absolute -right-1 -top-1 rounded-full bg-white text-red-600 shadow"><X className="h-4 w-4" /></button></span>)}
                  <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:bg-secondary"><Plus className="h-5 w-5" /><input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, false); event.currentTarget.value = "" }} /></label>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("is_featured")} className="h-4 w-4 accent-primary" /> Sản phẩm nổi bật</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("is_active")} className="h-4 w-4 accent-primary" /> Đang bán</label>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button><Button type="submit" disabled={saveMutation.isPending || uploading}>{saveMutation.isPending && <LoaderCircle className="animate-spin" />} {saveMutation.isPending ? "Đang lưu..." : "Lưu sản phẩm"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null) }}>
        <DialogContent><DialogHeader><DialogTitle>Xóa sản phẩm?</DialogTitle><DialogDescription>Sản phẩm “{deleting?.name}” sẽ bị xóa hoặc ẩn nếu đã xuất hiện trong đơn hàng.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Giữ lại</Button><Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleting && deleteMutation.mutate(deleting)}>{deleteMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}
