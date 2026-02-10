"use client";

import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface DateRangePickerProps {
    startMonth: string;
    endMonth: string;
    availableMonths: string[];
    onRangeChange: (start: string, end: string) => void;
    onReset: () => void;
}

export function DateRangePicker({
    startMonth,
    endMonth,
    availableMonths,
    onRangeChange,
    onReset
}: DateRangePickerProps) {
    const startIndex = availableMonths.indexOf(startMonth);
    const endIndex = availableMonths.indexOf(endMonth);

    // Extract unique years from available months
    const availableYears = useMemo(() => {
        const years = [...new Set(availableMonths.map(m => m.split('-')[1]))];
        return years.map(y => ({ short: y, full: `20${y}` }));
    }, [availableMonths]);

    // Determine currently active year(s) based on selected range
    const activeYears = useMemo(() => {
        const rangeMonths = availableMonths.slice(startIndex, endIndex + 1);
        return [...new Set(rangeMonths.map(m => m.split('-')[1]))];
    }, [availableMonths, startIndex, endIndex]);

    const formatMonthDisplay = (month: string) => {
        const [m, y] = month.split('-');
        const months: Record<string, string> = {
            'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
            'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
            'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
        };
        return `${months[m] || m} 20${y}`;
    };

    const handleSliderChange = (values: number[]) => {
        const newStartIndex = values[0];
        const newEndIndex = values[1];
        onRangeChange(availableMonths[newStartIndex], availableMonths[newEndIndex]);
    };

    // Year-based selection
    const selectYear = (yearShort: string) => {
        const yearMonths = availableMonths.filter(m => m.endsWith(`-${yearShort}`));
        if (yearMonths.length > 0) {
            onRangeChange(yearMonths[0], yearMonths[yearMonths.length - 1]);
        }
    };

    const selectAll = () => {
        onRangeChange(availableMonths[0], availableMonths[availableMonths.length - 1]);
    };

    // Quick preset handlers
    const applyPreset = (preset: 'ytd' | 'last3' | 'last6' | 'full') => {
        const lastIndex = availableMonths.length - 1;
        switch (preset) {
            case 'ytd': {
                const latestYear = availableMonths[lastIndex].split('-')[1];
                const janOfLatestYear = availableMonths.find(m => m.startsWith('Jan-') && m.endsWith(latestYear));
                onRangeChange(janOfLatestYear || availableMonths[0], availableMonths[lastIndex]);
                break;
            }
            case 'last3':
                onRangeChange(availableMonths[Math.max(0, lastIndex - 2)], availableMonths[lastIndex]);
                break;
            case 'last6':
                onRangeChange(availableMonths[Math.max(0, lastIndex - 5)], availableMonths[lastIndex]);
                break;
            case 'full':
                selectAll();
                break;
        }
    };

    const isYearFullySelected = (yearShort: string) => {
        const yearMonths = availableMonths.filter(m => m.endsWith(`-${yearShort}`));
        const selectedRange = availableMonths.slice(startIndex, endIndex + 1);
        return yearMonths.every(m => selectedRange.includes(m)) &&
            selectedRange.every(m => m.endsWith(`-${yearShort}`));
    };

    const isAllSelected = startIndex === 0 && endIndex === availableMonths.length - 1;

    return (
        <div className="space-y-5">
            {/* Title Row with Year Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#81D8D0]/10 dark:bg-[#81D8D0]/20">
                        <Calendar className="w-5 h-5 text-[#4E4456] dark:text-[#81D8D0]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date Range</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-[#4E4456] dark:text-[#81D8D0]">{formatMonthDisplay(startMonth)}</span>
                            {' \u2013 '}
                            <span className="font-medium text-[#4E4456] dark:text-[#81D8D0]">{formatMonthDisplay(endMonth)}</span>
                        </p>
                    </div>
                </div>

                {/* Year Toggle + Quick Presets */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Year Selection Pills */}
                    {availableYears.length > 1 && (
                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
                            {availableYears.map(({ short, full }) => (
                                <button
                                    key={short}
                                    onClick={() => selectYear(short)}
                                    className={`
                                        px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200
                                        ${isYearFullySelected(short)
                                            ? 'bg-[#4E4456] text-white dark:bg-[#81D8D0] dark:text-slate-900 shadow-sm'
                                            : activeYears.includes(short)
                                                ? 'bg-[#4E4456]/10 text-[#4E4456] dark:bg-[#81D8D0]/20 dark:text-[#81D8D0]'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }
                                    `}
                                >
                                    {full}
                                </button>
                            ))}
                            <button
                                onClick={selectAll}
                                className={`
                                    px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200
                                    ${isAllSelected
                                        ? 'bg-[#4E4456] text-white dark:bg-[#81D8D0] dark:text-slate-900 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }
                                `}
                            >
                                All
                            </button>
                        </div>
                    )}

                    {/* Divider */}
                    {availableYears.length > 1 && (
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 hidden sm:block" />
                    )}

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 mr-0.5">Quick:</span>
                        <button
                            onClick={() => applyPreset('last3')}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            3M
                        </button>
                        <button
                            onClick={() => applyPreset('last6')}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            6M
                        </button>
                        <button
                            onClick={() => applyPreset('ytd')}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            YTD
                        </button>
                        <button
                            onClick={onReset}
                            className="px-2.5 py-1.5 text-xs font-medium text-white bg-slate-600 dark:bg-slate-500 rounded-md hover:bg-slate-700 dark:hover:bg-slate-400 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Dual-Thumb Range Slider */}
            <div className="px-2">
                <Slider
                    value={[startIndex, endIndex]}
                    onValueChange={handleSliderChange}
                    max={availableMonths.length - 1}
                    min={0}
                    step={1}
                    className="w-full"
                    trackClassName="bg-[#4E4456]"
                    rangeClassName="bg-[#81D8D0]"
                    thumbClassName="border-[#4E4456] bg-[#4E4456] dark:border-[#81D8D0] dark:bg-[#81D8D0]"
                    aria-label="Month Range"
                />
            </div>

            {/* Month Labels with Year Separators */}
            <div className="flex justify-between px-1 text-xs text-slate-400 dark:text-slate-500 relative pt-4">
                {availableMonths.map((m, i) => {
                    const [monthPart, yearPart] = m.split('-');
                    const prevYear = i > 0 ? availableMonths[i - 1].split('-')[1] : null;
                    const isYearBoundary = prevYear !== null && prevYear !== yearPart;

                    return (
                        <span
                            key={m}
                            className={`
                                relative text-center
                                ${i >= startIndex && i <= endIndex ? 'text-[#81D8D0] font-medium' : ''}
                                ${i === startIndex || i === endIndex ? 'text-[#4E4456] dark:text-[#81D8D0] font-bold' : ''}
                                ${isYearBoundary ? 'border-l-2 border-[#4E4456]/20 dark:border-[#81D8D0]/30 pl-1.5' : ''}
                            `}
                        >
                            {(i === 0 || isYearBoundary) && availableYears.length > 1 && (
                                <span className="absolute -top-4 left-0 text-[10px] font-bold text-[#4E4456]/50 dark:text-[#81D8D0]/40 tracking-wider">
                                    &apos;{yearPart}
                                </span>
                            )}
                            {monthPart}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
