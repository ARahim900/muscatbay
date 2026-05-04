"use client";

import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    Circle,
    Sparkles,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export type BadgeColor = 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'slate' | 'amber' | 'cyan' | 'emerald' | 'sage';

interface StatusBadgeProps {
    label: string;
    color?: BadgeColor;
    className?: string;
    /**
     * Hide the leading status icon. Default: icon is shown.
     * Disable only when the badge sits next to another icon that already
     * conveys status (e.g. inside a row whose first cell carries the icon).
     */
    hideIcon?: boolean;
}

// Colors sourced from --badge-* tokens in globals.css.
// Opacity modifiers (e.g. /20) vary per mode so explicit dark: variants are kept;
// the *-fg variables flip automatically via the .dark block in globals.css.
export const DOT_COLORS: Record<string, string> = {
    green:   'bg-badge-green',
    emerald: 'bg-badge-green',
    red:     'bg-badge-red',
    orange:  'bg-badge-amber',
    amber:   'bg-badge-amber',
    blue:    'bg-badge-blue',
    purple:  'bg-primary',
    slate:   'bg-slate-400',
    cyan:    'bg-badge-sage',
    sage:    'bg-badge-sage',
};

const BG_COLORS: Record<string, string> = {
    green:
        'bg-badge-green/20 text-badge-green-fg ring-1 ring-badge-green/50 ' +
        'dark:bg-badge-green/15 dark:ring-badge-green/30',
    emerald:
        'bg-badge-green/20 text-badge-green-fg ring-1 ring-badge-green/50 ' +
        'dark:bg-badge-green/15 dark:ring-badge-green/30',
    red:
        'bg-badge-red/12 text-badge-red-fg ring-1 ring-badge-red/35 ' +
        'dark:bg-badge-red/20 dark:ring-badge-red/35',
    orange:
        'bg-badge-amber/18 text-badge-amber-fg ring-1 ring-badge-amber/45 ' +
        'dark:bg-badge-amber/15 dark:ring-badge-amber/35',
    amber:
        'bg-badge-amber/18 text-badge-amber-fg ring-1 ring-badge-amber/45 ' +
        'dark:bg-badge-amber/15 dark:ring-badge-amber/35',
    blue:
        'bg-badge-blue/12 text-badge-blue-fg ring-1 ring-badge-blue/30 ' +
        'dark:bg-badge-blue/20 dark:ring-badge-blue/35',
    purple:
        'bg-secondary text-white ring-1 ring-secondary/60 ' +
        'dark:bg-secondary/90 dark:text-white dark:ring-secondary/50',
    slate:
        'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 ' +
        'dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700/60',
    cyan:
        'bg-badge-sage/30 text-badge-sage-fg ring-1 ring-badge-sage/60 ' +
        'dark:bg-badge-sage/10 dark:ring-badge-sage/25',
    sage:
        'bg-badge-sage/30 text-badge-sage-fg ring-1 ring-badge-sage/60 ' +
        'dark:bg-badge-sage/10 dark:ring-badge-sage/25',
};

// Shape-distinct icons so status is distinguishable without color (WCAG 1.4.1).
// Pairs with the existing label and tinted background.
const ICON_FOR_COLOR: Record<BadgeColor, ComponentType<SVGProps<SVGSVGElement>>> = {
    green:   CheckCircle2,
    emerald: CheckCircle2,
    red:     AlertCircle,
    orange:  AlertTriangle,
    amber:   AlertTriangle,
    blue:    Info,
    purple:  Sparkles,
    cyan:    CheckCircle2,
    sage:    CheckCircle2,
    slate:   Circle,
};

export function StatusBadge({ label, color = 'slate', className, hideIcon = false }: StatusBadgeProps) {
    const Icon = ICON_FOR_COLOR[color] ?? Circle;
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
            BG_COLORS[color] ?? BG_COLORS.slate,
            className
        )}>
            {hideIcon
                ? <span aria-hidden="true" className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm", DOT_COLORS[color] ?? DOT_COLORS.slate)} />
                : <Icon aria-hidden="true" className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
            }
            {label}
        </span>
    );
}
