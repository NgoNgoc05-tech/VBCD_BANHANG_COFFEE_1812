import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
type SheetContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  side?: "left" | "right" | "bottom"
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, side = "right", ...props }, ref) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="ui-overlay fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "ui-sheet-content fixed inset-y-0 z-50 w-[min(22rem,85vw)] border bg-background p-6 shadow-xl outline-none",
          side === "bottom"
            ? "sheet-bottom inset-x-0 bottom-0 top-auto max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl border-t"
            : side === "right"
              ? "sheet-right right-0 border-l"
              : "sheet-left left-0 border-r",
          className
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  )
})
SheetContent.displayName = "SheetContent"

export { Sheet, SheetClose, SheetContent, SheetTrigger }