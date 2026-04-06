"use client";

import { cn } from '@/lib/utils';

// Muscat Bay color palette
// #4E4456 brand purple | #C6D8D3 sage | #A4DCC6 mint | #337FCA blue | #F4C741 amber | #E05050 coral

interface StatusBadgeProps {
    label: string;
    color?: 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'slate' | 'amber' | 'cyan' | 'emerald' | 'sage';
    className?: string;
}

const DOT_COLORS: Record<string, string> = {
    green:   'bg-[#A4DCC6]',
    emerald: 'bg-[#A4DCC6]',
    red:     'bg-[#E05050]',
    orange:  'bg-[#F4C741]',
    amber:   'bg-[#F4C741]',
    blue:    'bg-[#337FCA]',
    purple:  'bg-[#4E4456]',
    slate:   'bg-slate-400',
    cyan:    'bg-[#C6D8D3]',
    sage:    'bg-[#C6D8D3]',
};

const BG_COLORS: Record<string, string> = {
    green:
        'bg-[#A4DCC6]/20 text-[#0d5c38] ring-1 ring-[#A4DCC6]/50 ' +
        'dark:bg-[#A4DCC6]/15 dark:text-[#A4DCC6] dark:ring-[#A4DCC6]/30',
    emerald:
        'bg-[#A4DCC6]/20 text-[#0d5c38] ring-1 ring-[#A4DCC6]/50 ' +
        'dark:bg-[#A4DCC6]/15 dark:text-[#A4DCC6] dark:ring-[#A4DCC6]/30',
    red:
        'bg-[#E05050]/12 text-[#8a1515] ring-1 ring-[#E05050]/35 ' +
        'dark:bg-[#E05050]/20 dark:text-[#E05050] dark:ring-[#E05050]/35',
    orange:
        'bg-[#F4C741]/18 text-[#7a5200] ring-1 ring-[#F4C741]/45 ' +
        'dark:bg-[#F4C741]/15 dark:text-[#F4C741] dark:ring-[#F4C741]/35',
    amber:
        'bg-[#F4C741]/18 text-[#7a5200] ring-1 ring-[#F4C741]/45 ' +
        'dark:bg-[#F4C741]/15 dark:text-[#F4C741] dark:ring-[#F4C741]/35',
    blue:
        'bg-[#337FCA]/12 text-[#1a4fa8] ring-1 ring-[#337FCA]/30 ' +
        'dark:bg-[#337FCA]/20 dark:text-[#337FCA] dark:ring-[#337FCA]/35',
    purple:
        'bg-[#4E4456]/10 text-[#4E4456] ring-1 ring-[#4E4456]/25 ' +
        'dark:bg-[#4E4456]/30 dark:text-[#c6bece] dark:ring-[#4E4456]/40',
    slate:
        'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 ' +
        'dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700/60',
    cyan:
        'bg-[#C6D8D3]/30 text-[#2d5048] ring-1 ring-[#C6D8D3]/60 ' +
        'dark:bg-[#C6D8D3]/10 dark:text-[#C6D8D3] dark:ring-[#C6D8D3]/25',
    sage:
        'bg-[#C6D8D3]/30 text-[#2d5048] ring-1 ring-[#C6D8D3]/60 ' +
        'dark:bg-[#C6D8D3]/10 dark:text-[#C6D8D3] dark:ring-[#C6D8D3]/25',
};

export function StatusBadge({ label, color = 'slate', className }: StatusBadgeProps) {
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
            BG_COLORS[color] ?? BG_COLORS.slate,
            className
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm", DOT_COLORS[color] ?? DOT_COLORS.slate)} />
            {label}
        </span>
    );
}
