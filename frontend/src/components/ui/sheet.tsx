import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-sheet"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>
>(({ className, side = "right", ...props }, ref) => {
  return (
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "p-6 rounded-lg bg-background shadow-md transition-all duration-300 sm:max-w-sm",
        side === "right"
          ? "right-0 top-1/2 -translate-y-1/2 sm:right-auto sm:translate-x-28"
          : "left-0 top-1/2 -translate-y-1/2 sm:left-auto sm:-translate-x-28",
        className
      )}
      {...props}
    />
  )
})
SheetContent.displayName = SheetPrimitive.Content.displayName

export { Sheet, SheetContent, SheetTrigger }