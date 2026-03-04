import * as React from "react"
import { cn } from "@/lib/utils"

export interface GildedInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

/**
 * GildedInput Component
 * 
 * Standardized input component with "Gilded Sage" design system.
 * 
 * Design Tokens:
 * - Background: Warm White (#F8F5F0)
 * - Border: Soft Stone (#D4D2CF)
 * - Focus Border: Gilded Gold (#B79A63)
 * - Text: Deep Charcoal (slate-900)
 * - Font: Lato (font-sans)
 */
const GildedInput = React.forwardRef<HTMLInputElement, GildedInputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    // Base styles - Gilded Sage Design System
                    "flex h-12 w-full rounded-md",
                    "border border-[#D4D2CF]",      // Soft Stone border
                    "bg-[#F8F5F0]",                  // Warm White background
                    "px-4 py-2",
                    // Typography
                    "text-base md:text-sm font-sans text-[#1E1E1E]",  // 16px on mobile to prevent iOS zoom
                    "placeholder:text-slate-400",
                    // Transitions
                    "transition-all duration-200 ease-in-out",
                    // Focus state - Gilded Gold
                    "focus-visible:outline-none",
                    "focus-visible:border-[#B79A63]",    // Gilded Gold border
                    "focus-visible:ring-1",
                    "focus-visible:ring-[#B79A63]",      // Gilded Gold ring
                    // Disabled state
                    "disabled:cursor-not-allowed",
                    "disabled:opacity-50",
                    // Allow custom overrides
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
