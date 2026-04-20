"use client";

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type BadgeColor, DOT_COLORS } from './status-badge';

export interface FilterPill {
    key: string;
    label: string;
    color?: BadgeColor;
    colorClass?: string;
    onRemove: () => void;
}

interface ActiveFilterPillsProps {
    pills: FilterPill[];
}

export function ActiveFilterPills({ pills }: ActiveFilterPillsProps) {
    if (pills.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
            {pills.map(pill => (
                <span
                    key={pill.key}
                    className={cn(
                        "inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium border transition-colors",
                        pill.color
                            ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            : pill.colorClass
                                ? pill.colorClass
                                : "bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300"
                    )}
                >
                    {pill.color && (
                        <span
                            aria-hidden="true"
                            className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", DOT_COLORS[pill.color] ?? DOT_COLORS.slate)}
                        />
                    )}
                    {pill.label}
                    <button
                        onClick={pill.onRemove}
                        className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
                        aria-label={`Remove ${pill.label} filter`}
                    >
                        <X className="w-2.5 h-2.5" />
                    </button>
                </span>
            ))}
        </div>
    );
}
