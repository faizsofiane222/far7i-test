import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const GildedInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-md border border-[#D4D2CF] bg-[#F8F5F0] px-4 py-2",
                    "text-base md:text-sm font-sans text-slate-900 placeholder:text-slate-400",
                    "transition-all duration-200 ease-in-out",
                    "focus-visible:outline-none focus-visible:border-[#B79A63] focus-visible:ring-1 focus-visible:ring-[#B79A63]",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
GildedInput.displayName = "GildedInput"

export { GildedInput }
