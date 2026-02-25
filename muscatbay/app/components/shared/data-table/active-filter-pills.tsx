"use client";

import { X } from 'lucide-react';

export interface FilterPill {
    key: string;
    label: string;
    colorClass?: string;
    onRemove: () => void;
}

interface ActiveFilterPillsProps {
    pills: FilterPill[];
}

export function ActiveFilterPills({ pills }: ActiveFilterPillsProps) {
    if (pills.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 px-1">
            {pills.map(pill => (
                <span
                    key={pill.key}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${pill.colorClass || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                    {pill.label}
                    <button onClick={pill.onRemove} className="hover:opacity-70 transition-opacity">
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
        </div>
    );
}
