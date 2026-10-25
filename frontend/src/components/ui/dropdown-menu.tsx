import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <DropdownMenuPrimitive.Content
      ref={ref}
      className={cn(
        "rounded-md border bg-popover p-1 text-sm shadow-md z-50[&>[&>*:not(script)]:first-child]:pb-0[&>[&>*:not(script)]:last-child]:pa-0",
        className
      )}
      {...props}
    />
  )
})
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName
const DropdownMenuItem = DropdownMenuPrimitive.Item
const DropdownMenuSeparator = DropdownMenuPrimitive.Separator

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}