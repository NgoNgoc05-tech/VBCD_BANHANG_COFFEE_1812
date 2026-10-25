import * as React from "react"

import { cn } from "@/lib/utils"

const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md animate-pulse bg-muted",
        className
      )}
      {...props}
    />
  )
)
Skeleton.displayName = "Skeleton"

const SkeletonAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "h-12 w-12 rounded-full animate-pulse bg-muted",
      className
    )}
    {...props}
  />
))
SkeletonAvatar.displayName = "SkeletonAvatar"

const SkeletonText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "h-6 w-full rounded-md animate-pulse bg-muted my-2",
      className
    )}
    {...props}
  />
))
SkeletonText.displayName = "SkeletonText"

const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg animate-pulse bg-card h-48 my-4",
      className
    )}
    {...props}
  />
))
SkeletonCard.displayName = "SkeletonCard"

export { Skeleton, SkeletonAvatar, SkeletonText, SkeletonCard }