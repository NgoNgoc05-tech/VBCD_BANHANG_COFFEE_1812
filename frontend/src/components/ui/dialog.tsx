import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 grid place-items-start gap-4 rounded-lg border bg-background p-6 transition-popover-sm-first [&>[&>div>*:first-child]:pt-0 sm:max-w-lg md:max-w-md lg:max-w-xl",
        className
      )}
      {...props}
    />
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-4 line-clamp-2 max-w-full", className)}
      {...props}
    />
  )
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex justify-end gap-2", className)} {...props} />
  )
)
DialogFooter.displayName = "DialogFooter"

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTrigger }