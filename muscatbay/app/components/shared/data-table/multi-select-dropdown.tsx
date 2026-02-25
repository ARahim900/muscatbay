"use client";

import React, { useState } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectDropdownProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    getDisplayName?: (option: string) => string;
    icon?: React.ComponentType<{ className?: string }>;
}

export function MultiSelectDropdown({
    label,
    options,
    selected,
    onChange,
    getDisplayName,
    icon: Icon = Filter,
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(s => s !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const selectAll = () => onChange([...options]);
    const clearAll = () => onChange([]);

    const displayName = getDisplayName || ((o: string) => o);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                    selected.length > 0 && selected.length < options.length
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300"
                )}
            >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {selected.length > 0 && selected.length < options.length && (
                    <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                        {selected.length}
                    </span>
                )}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg min-w-[180px] py-1">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
                            <button
                                onClick={selectAll}
                                className="text-xs text-primary hover:underline"
                            >
                                Select All
                            </button>
                            <button
                                onClick={clearAll}
                                className="text-xs text-slate-500 hover:underline"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="max-h-[240px] overflow-y-auto">
                            {options.map(option => (
                                <label
                                    key={option}
                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(option)}
                                        onChange={() => toggleOption(option)}
                                        className="rounded border-slate-300 text-primary focus:ring-primary/50"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                        {displayName(option)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
