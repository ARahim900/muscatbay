"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortIconProps {
    field: string;
    currentSortField: string | null;
    currentSortDirection: 'asc' | 'desc';
}

export function SortIcon({ field, currentSortField, currentSortDirection }: SortIconProps) {
    if (currentSortField !== field) {
        return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    }
    return currentSortDirection === 'asc'
        ? <ArrowUp className="w-3.5 h-3.5 text-primary" />
        : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
}
