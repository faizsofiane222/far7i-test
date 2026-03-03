import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeStatus = 'pending' | 'approved' | 'rejected' | 'draft' | 'active' | 'inactive' | 'completed' | 'failed' | 'sent';
type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'default' | 'outline' | 'solid';

interface UnifiedBadgeProps {
    status?: BadgeStatus;
    children?: ReactNode;
    size?: BadgeSize;
    variant?: BadgeVariant;
    className?: string;
}

const statusConfig = {
    pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: 'En attente',
    },
    approved: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'Approuvé',
    },
    rejected: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        label: 'Refusé',
    },
    draft: {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
        label: 'Brouillon',
    },
    active: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'Actif',
    },
    inactive: {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
        label: 'Inactif',
    },
    completed: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: 'Terminé',
    },
    failed: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        label: 'Échoué',
    },
    sent: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        label: 'Envoyé',
    },
};

const sizeStyles = {
    sm: 'text-[8px] px-2 py-0.5',
    md: 'text-[10px] px-2.5 py-1',
    lg: 'text-xs px-3 py-1.5',
};

export function UnifiedBadge({
    status,
    children,
    size = 'md',
    variant = 'default',
    className,
}: UnifiedBadgeProps) {
    const config = status ? statusConfig[status] : null;

    const baseStyles = 'inline-flex items-center rounded-full font-bold uppercase tracking-widest transition-all';

    const variantStyles = variant === 'outline'
        ? `border ${config?.border || 'border-slate-200'} ${config?.text || 'text-slate-600'} bg-transparent`
        : variant === 'solid'
            ? `${config?.bg || 'bg-slate-100'} ${config?.text || 'text-slate-700'} border-none`
            : `${config?.bg || 'bg-slate-50'} ${config?.text || 'text-slate-600'} border-none`;

    return (
        <span
            className={cn(
                baseStyles,
                sizeStyles[size],
                variantStyles,
                className
            )}
        >
            {children || (config?.label || status)}
        </span>
    );
}
