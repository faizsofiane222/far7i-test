import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, error, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);

        return (
            <div className="relative">
                <Input
                    type={showPassword ? "text" : "password"}
                    className={cn(
                        "pr-10",
                        "bg-[#FAF9F6]",
                        "border-[#D4D2CF]",
                        "focus:border-[#B79A63]",
                        "focus:ring-[#B79A63]",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E1E1E] opacity-60 hover:opacity-100 transition-opacity"
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
        );
    }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
