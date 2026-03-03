import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface UnifiedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    loading?: boolean;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

export function UnifiedButton({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className,
    disabled,
    ...props
}: UnifiedButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-widest rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-[#1E1E1E] text-[#B79A63] hover:bg-black hover:scale-105 active:scale-95 shadow-md hover:shadow-lg',
        secondary: 'border-2 border-[#1E1E1E] text-[#1E1E1E] bg-transparent hover:bg-[#1E1E1E] hover:text-white',
        ghost: 'text-[#1E1E1E] hover:bg-[#F8F5F0] hover:text-[#B79A63]',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg',
    };

    const sizeStyles = {
        sm: 'h-9 px-4 text-[10px] gap-1.5',
        md: 'h-11 px-6 text-xs gap-2',
        lg: 'h-14 px-8 text-sm gap-2.5',
        xl: 'h-16 px-10 text-base gap-3',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
        <button
            className={cn(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                widthStyles,
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!loading && icon && iconPosition === 'left' && icon}
            {children}
            {!loading && icon && iconPosition === 'right' && icon}
        </button>
    );
}
