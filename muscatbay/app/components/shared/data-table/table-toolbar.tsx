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

export type TableDensity = 'compact' | 'comfortable' | 'spacious';

interface DensityToggleProps {
    density: TableDensity;
    onChange: (density: TableDensity) => void;
    className?: string;
}

const CompactIcon = () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
        <rect x="0" y="0.5"  width="13" height="1.5" rx="0.75" />
        <rect x="0" y="3.75" width="13" height="1.5" rx="0.75" />
        <rect x="0" y="7"    width="13" height="1.5" rx="0.75" />
        <rect x="0" y="10.25" width="13" height="1.5" rx="0.75" />
    </svg>
);

const ComfortableIcon = () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
        <rect x="0" y="0"   width="13" height="2.5" rx="1.25" />
        <rect x="0" y="5.5" width="13" height="2.5" rx="1.25" />
        <rect x="0" y="11"  width="13" height="2"   rx="1" />
    </svg>
);

const SpaciousIcon = () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
        <rect x="0" y="0" width="13" height="3.5" rx="1.75" />
        <rect x="0" y="7" width="13" height="3.5" rx="1.75" />
    </svg>
);

const DENSITIES: { value: TableDensity; label: string; Icon: () => React.ReactElement }[] = [
    { value: 'compact',     label: 'Compact',     Icon: CompactIcon },
    { value: 'comfortable', label: 'Comfortable', Icon: ComfortableIcon },
    { value: 'spacious',    label: 'Spacious',    Icon: SpaciousIcon },
];

export function DensityToggle({ density, onChange, className }: DensityToggleProps) {
    return (
        <div
            role="group"
            aria-label="Table density"
            className={cn(
                "flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden h-8",
                className
            )}
        >
            {DENSITIES.map(({ value, label, Icon }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => onChange(value)}
                    title={label}
                    aria-pressed={density === value}
                    className={cn(
                        "flex items-center justify-center w-8 h-8 transition-colors duration-150",
                        density === value
                            ? "bg-primary text-primary-foreground"
                            : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Icon />
                    <span className="sr-only">{label}</span>
                </button>
            ))}
        </div>
    );
}
