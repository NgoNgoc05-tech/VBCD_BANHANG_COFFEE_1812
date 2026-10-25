import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
  uploadAdminImage,
  type AdminCategory,
} from "../../api/admin"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { getApiErrorMessage } from "../../lib/apiError"
import { toast } from "sonner"

const categorySchema = z.object({
  name: z.string().trim().min(2, "Tên danh mục tối thiểu 2 ký tự."),
  image_url: z.string().nullable(),
})
type CategoryValues = z.infer<typeof categorySchema>
const emptyValues: CategoryValues = { name: "", image_url: null }

export default function Categories() {
  const queryClient = useQueryClient()
  const categoriesQuery = useQuery({ queryKey: ["admin", "categories"], queryFn: getAdminCategories })
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [deleting, setDeleting] = useState<AdminCategory | null>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const form = useForm<CategoryValues>({ resolver: zodResolver(categorySchema), defaultValues: emptyValues })
  useEffect(() => {
    form.reset(open && editing ? { name: editing.name, image_url: editing.image_url } : emptyValues)
  }, [editing, form, open])
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
  const saveMutation = useMutation({
    mutationFn: (values: CategoryValues) => editing ? updateAdminCategory(editing.id, values) : createAdminCategory(values),
    onSuccess: async () => {
      toast.success(editing ? "Đã cập nhật danh mục." : "Đã thêm danh mục.")
      setOpen(false)
      setEditing(null)
      await refresh()
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, "Không thể lưu danh mục.")),
  })
  const deleteMutation = useMutation({
    mutationFn: (category: AdminCategory) => deleteAdminCategory(category.id),
    onSuccess: async (result) => {
      toast.success(result.message)
      setDeleting(null)
      await refresh()
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, "Không thể xóa danh mục.")),
  })
  const upload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error("Chọn ảnh JPG, PNG hoặc WEBP dung lượng tối đa 2 MB.")
      return
    }
    setUploading(true)
    try { form.setValue("image_url", await uploadAdminImage(file), { shouldDirty: true }) }
    catch (error: unknown) { toast.error(getApiErrorMessage(error, "Không thể tải ảnh lên.")) }
    finally { setUploading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold">Danh mục</h2><p className="mt-1 text-sm text-muted-foreground">Sắp xếp và quản lý nhóm sản phẩm.</p></div><Button onClick={() => { setEditing(null); setOpen(true) }}><Plus /> Thêm danh mục</Button></div>
      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-[#faf8f5] text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Danh mục</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3 text-right">Sản phẩm</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
          <tbody>{categoriesQuery.isPending ? Array.from({ length: 4 }, (_, index) => <tr key={index}><td colSpan={4} className="px-5 py-4"><div className="h-7 animate-pulse rounded bg-muted" /></td></tr>) : categoriesQuery.data?.map((category) => (
            <tr key={category.id} className="border-t border-border hover:bg-[#fcfbf9]">
              <td className="px-5 py-3"><div className="flex items-center gap-3"><img src={category.image_url || "/placeholder.svg"} alt="" className="h-12 w-12 rounded-lg object-cover" /><span className="font-semibold">{category.name}</span></div></td>
              <td className="px-4 py-3 text-muted-foreground">{category.slug}</td><td className="px-4 py-3 text-right">{category.product_count}</td>
              <td className="px-5 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label={`Sửa ${category.name}`} onClick={() => { setEditing(category); setOpen(true) }}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Xóa ${category.name}`} className="text-red-600" onClick={() => setDeleting(category)}><Trash2 /></Button></div></td>
            </tr>
          ))}{!categoriesQuery.isPending && !categoriesQuery.data?.length && <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">Chưa có danh mục.</td></tr>}</tbody>
        </table></div>
      </section>
      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setEditing(null) }}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle><DialogDescription>Nhập tên và ảnh đại diện danh mục.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate({ ...values, image_url: values.image_url || null }))}>
            <label className="grid gap-1.5 text-sm font-medium">Tên danh mục<Input {...form.register("name")} />{form.formState.errors.name && <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>}</label>
            <div><p className="mb-2 text-sm font-medium">Ảnh đại diện</p><div className="flex items-center gap-3">{form.watch("image_url") && <img src={form.watch("image_url") ?? ""} alt="Xem trước danh mục" className="h-16 w-16 rounded-lg border object-cover" />}<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"><ImagePlus className="h-4 w-4" />{uploading ? "Đang tải..." : "Tải ảnh"}<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = "" }} /></label></div></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={saveMutation.isPending || uploading}>{saveMutation.isPending ? "Đang lưu..." : "Lưu danh mục"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleting)} onOpenChange={(value) => { if (!value) setDeleting(null) }}><DialogContent><DialogHeader><DialogTitle>Xóa danh mục?</DialogTitle><DialogDescription>Danh mục “{deleting?.name}” không thể xóa khi còn sản phẩm.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Đóng</Button><Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleting && deleteMutation.mutate(deleting)}>{deleteMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
