import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
    children: ReactNode;
    className?: string;
    isVisible?: boolean;
}

export const StickyActionBar = ({
    children,
    className,
    isVisible = true
}: StickyActionBarProps) => {
    if (!isVisible) return null;

    return (
        <div className={cn(
            "md:hidden fixed bottom-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#D4D2CF] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-300",
            className
        )}>
            <div className="max-w-md mx-auto w-full">
                {children}
            </div>
        </div>
    );
};
