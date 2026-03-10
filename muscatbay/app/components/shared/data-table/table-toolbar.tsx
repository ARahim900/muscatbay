"use client";

import { cn } from '@/lib/utils';

interface TableToolbarProps {
    children: React.ReactNode;
    className?: string;
}

export function TableToolbar({ children, className }: TableToolbarProps) {
    return (
        <div className={cn(
            "flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm",
            className
        )}>
            {children}
        </div>
    );
}
