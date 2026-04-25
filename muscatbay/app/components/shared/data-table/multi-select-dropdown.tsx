"use client";

import React, { useId, useState } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type BadgeColor, DOT_COLORS } from './status-badge';

interface MultiSelectDropdownProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    getDisplayName?: (option: string) => string;
    getOptionColor?: (option: string) => BadgeColor | undefined;
    icon?: React.ComponentType<{ className?: string }>;
}

export function MultiSelectDropdown({
    label,
    options,
    selected,
    onChange,
    getDisplayName,
    getOptionColor,
    icon: Icon = Filter,
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const listboxId = useId();

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
    const hasActiveFilter = selected.length > 0 && selected.length < options.length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? listboxId : undefined}
                className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border transition-all duration-200",
                    hasActiveFilter
                        ? "border-primary/40 bg-primary/5 text-primary shadow-sm dark:border-primary/50 dark:bg-primary/15 dark:text-slate-100 dark:shadow-primary/10"
                        : "border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm text-slate-600 dark:text-slate-300"
                )}
            >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {hasActiveFilter && (
                    getOptionColor ? (
                        <span
                            className="flex items-center gap-0.5"
                            aria-label={`${selected.length} filters selected`}
                        >
                            {selected.slice(0, 3).map(s => {
                                const c = getOptionColor(s);
                                return c ? (
                                    <span
                                        key={s}
                                        className={cn("w-2 h-2 rounded-full shadow-sm", DOT_COLORS[c])}
                                    />
                                ) : null;
                            })}
                            {selected.length > 3 && (
                                <span className="text-xs font-semibold ml-0.5 bg-primary text-white px-1.5 py-0.5 rounded-full">
                                    +{selected.length - 3}
                                </span>
                            )}
                        </span>
                    ) : (
                        <span
                            className="bg-primary text-white text-xs font-semibold px-1.5 py-0.5 rounded-full"
                            aria-label={`${selected.length} filters selected`}
                            aria-live="polite"
                        >
                            {selected.length}
                        </span>
                    )
                )}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div role="presentation" aria-hidden="true" className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 sm:left-0 right-0 sm:right-auto mt-1.5 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl min-w-[200px] max-w-[calc(100vw-2rem)] overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700/70">
                            <button
                                onClick={selectAll}
                                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors min-h-[36px] px-1 flex items-center"
                            >
                                Select All
                            </button>
                            <span className="text-slate-200 dark:text-slate-600 select-none text-xs">|</span>
                            <button
                                onClick={clearAll}
                                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors min-h-[36px] px-1 flex items-center"
                            >
                                Clear
                            </button>
                        </div>
                        <div
                            id={listboxId}
                            role="listbox"
                            aria-label={label}
                            aria-multiselectable="true"
                            className="max-h-[240px] overflow-y-auto py-1"
                        >
                            {options.map(option => {
                                const isChecked = selected.includes(option);
                                const optionColor = getOptionColor?.(option);
                                return (
                                    <label
                                        key={option}
                                        role="option"
                                        aria-selected={isChecked}
                                        className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer min-h-[44px] transition-colors duration-100"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleOption(option)}
                                            className="sr-only"
                                        />
                                        <div
                                            aria-hidden="true"
                                            className={cn(
                                                "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-150",
                                                isChecked
                                                    ? "border-primary bg-primary"
                                                    : "border-slate-300 dark:border-slate-600"
                                            )}
                                        >
                                            {isChecked && (
                                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                            )}
                                        </div>
                                        {optionColor && (
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    "w-2 h-2 rounded-full flex-shrink-0 shadow-sm",
                                                    DOT_COLORS[optionColor] ?? DOT_COLORS.slate
                                                )}
                                            />
                                        )}
                                        <span className={cn(
                                            "text-sm flex-1 transition-colors duration-100",
                                            isChecked
                                                ? "text-slate-800 dark:text-slate-100 font-medium"
                                                : "text-slate-700 dark:text-slate-300"
                                        )}>
                                            {displayName(option)}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
