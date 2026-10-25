import { useState } from "react"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { saveProductReview } from "../../api/reviews"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { getApiErrorMessage } from "../../lib/apiError"

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productSlug: string
  productName: string
  onSaved: () => void
}

export default function ReviewDialog({
  open,
  onOpenChange,
  productSlug,
  productName,
  onSaved,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitReview = async () => {
    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá.")
      return
    }
    setIsSubmitting(true)
    try {
      await saveProductReview(productSlug, { rating, comment: comment.trim() })
      toast.success("Cảm ơn bạn đã gửi đánh giá.")
      setComment("")
      setRating(5)
      onOpenChange(false)
      onSaved()
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Không thể gửi đánh giá. Vui lòng thử lại."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đánh giá sản phẩm</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>
        <div>
          <p className="mb-2 text-sm font-medium">Mức độ hài lòng</p>
          <div className="flex items-center gap-1" onMouseLeave={() => setHoveredRating(null)}>
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1
              const active = value <= (hoveredRating ?? rating)
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} sao`}
                  aria-pressed={rating === value}
                  onMouseEnter={() => setHoveredRating(value)}
                  onFocus={() => setHoveredRating(value)}
                  onBlur={() => setHoveredRating(null)}
                  onClick={() => setRating(value)}
                  className="rounded p-1 text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star aria-hidden="true" className={`h-7 w-7 ${active ? "fill-current" : ""}`} />
                </button>
              )
            })}
            <span className="ml-2 text-sm text-muted-foreground">{rating}/5 sao</span>
          </div>
        </div>
        <label className="grid gap-2 text-sm font-medium" htmlFor="review-comment">
          Chia sẻ trải nghiệm
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Sản phẩm có hợp khẩu vị của bạn không?"
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="text-right text-xs font-normal text-muted-foreground">{comment.length}/2000</span>
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Để sau
          </Button>
          <Button type="button" onClick={() => void submitReview()} disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
