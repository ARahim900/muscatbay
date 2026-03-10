"use client";

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    label: string;
    color?: 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'slate' | 'amber' | 'cyan' | 'emerald';
    className?: string;
}

const DOT_COLORS: Record<string, string> = {
    green: 'bg-emerald-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    orange: 'bg-amber-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-violet-500',
    slate: 'bg-slate-400',
    cyan: 'bg-cyan-500',
};

const BG_COLORS: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    orange: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    purple: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
};

export function StatusBadge({ label, color = 'slate', className }: StatusBadgeProps) {
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
            BG_COLORS[color] || BG_COLORS.slate,
            className
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", DOT_COLORS[color] || DOT_COLORS.slate)} />
            {label}
        </span>
    );
}
