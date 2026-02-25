"use client";

import { cn } from '@/lib/utils';

interface TableToolbarProps {
    children: React.ReactNode;
    className?: string;
}

export function TableToolbar({ children, className }: TableToolbarProps) {
    return (
        <div className={cn(
            "flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700",
            className
        )}>
            {children}
        </div>
    );
}
