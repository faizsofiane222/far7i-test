import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * GildedButton Variants
 * 
 * Design System: "Gilded Sage"
 * - default: Deep Charcoal background (#1E1E1E) with Warm White text
 * - outline: Soft Stone border with white background
 * - ghost: Transparent with hover effect
 * - link: Underlined with Gilded Gold decoration
 */
const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-[#1E1E1E] text-[#F8F5F0] hover:bg-[#1E1E1E]/90 shadow-sm",
                outline: "border border-[#D4D2CF] bg-white hover:bg-slate-50 text-[#1E1E1E]",
                ghost: "hover:bg-slate-100 hover:text-slate-900",
                link: "text-[#1E1E1E] underline-offset-4 hover:underline decoration-[#B79A63]",
            },
            size: {
                default: "h-12 px-6 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-14 rounded-md px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface GildedButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const GildedButton = React.forwardRef<HTMLButtonElement, GildedButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
GildedButton.displayName = "GildedButton"

export { GildedButton, buttonVariants }
