import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface UnifiedCardProps {
    children: ReactNode;
    variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hover?: boolean;
    className?: string;
    onClick?: () => void;
}

export function UnifiedCard({
    children,
    variant = 'default',
    padding = 'md',
    hover = false,
    className,
    onClick,
}: UnifiedCardProps) {
    const baseStyles = 'bg-white rounded-2xl transition-all duration-300';

    const variantStyles = {
        default: 'border border-[#D4D2CF] shadow-sm',
        elevated: 'border border-[#D4D2CF] shadow-md',
        outlined: 'border-2 border-[#D4D2CF]',
        ghost: 'border border-transparent',
    };

    const paddingStyles = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-12',
    };

    const hoverStyles = hover
        ? 'hover:border-[#B79A63] hover:-translate-y-1 hover:shadow-lg cursor-pointer'
        : '';

    return (
        <div
            className={cn(
                baseStyles,
                variantStyles[variant],
                paddingStyles[padding],
                hoverStyles,
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
