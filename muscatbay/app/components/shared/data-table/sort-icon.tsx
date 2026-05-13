"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortIconProps {
    field: string;
    currentSortField: string | null;
    currentSortDirection: 'asc' | 'desc';
}

export function SortIcon({ field, currentSortField, currentSortDirection }: SortIconProps) {
    if (currentSortField !== field) {
        return <ArrowUpDown className={cn("w-[11px] h-[11px] transition-opacity opacity-[0.45]")} />;
    }
    return currentSortDirection === 'asc'
        ? <ArrowUp className={cn("w-[11px] h-[11px] transition-opacity opacity-100 text-foreground")} />
        : <ArrowDown className={cn("w-[11px] h-[11px] transition-opacity opacity-100 text-foreground")} />;
}
