import * as React from "react"
import { cn } from "@/lib/utils"

export interface Far7iCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glassmorphism?: boolean
}

const Far7iCard = React.forwardRef<HTMLDivElement, Far7iCardProps>(
  ({ className, hover = false, glassmorphism = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-md transition-all duration-300",
        hover && "hover:shadow-premium hover:-translate-y-2 hover:border-primary/50 hover:scale-[1.02] cursor-pointer group",
        glassmorphism && "bg-card/80 backdrop-blur-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Far7iCard.displayName = "Far7iCard"

const Far7iCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
Far7iCardContent.displayName = "Far7iCardContent"

export { Far7iCard, Far7iCardContent }
