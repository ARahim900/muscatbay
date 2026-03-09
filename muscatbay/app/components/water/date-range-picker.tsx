"use client";

import React, { useMemo } from 'react';
import { Calendar, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface DateRangePickerProps {
    startMonth: string;
    endMonth: string;
    availableMonths: string[];
    onRangeChange: (start: string, end: string) => void;
    onReset: () => void;
}

// Stable reference outside component
const monthFullNames: Record<string, string> = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
};

type PresetKey = 'ytd' | 'last3' | 'last6' | null;

export function DateRangePicker({
    startMonth,
    endMonth,
    availableMonths,
    onRangeChange,
    onReset
}: DateRangePickerProps) {
    const [activePreset, setActivePreset] = React.useState<PresetKey>(null);

    // Timeline is directly the available months passed by parent (already filtered by year if needed)
    const activeTimeline = availableMonths;

    // Calculate slider indices
    let activeStartIndex = activeTimeline.indexOf(startMonth);
    let activeEndIndex = activeTimeline.indexOf(endMonth);

    // If out of bounds, default to full range
    if (activeStartIndex === -1) activeStartIndex = 0;
    if (activeEndIndex === -1) activeEndIndex = Math.max(0, activeTimeline.length - 1);

    // Ensure valid indices
    activeStartIndex = Math.max(0, activeStartIndex);
    activeEndIndex = Math.min(Math.max(0, activeEndIndex), Math.max(0, activeTimeline.length - 1));

    // Count of selected months
    const selectedDataMonths = activeEndIndex - activeStartIndex + 1;

    // Detect whether the timeline spans multiple years (for year boundary markers)
    const uniqueYears = useMemo(() => {
        const years = new Set(availableMonths.map(m => m.split('-')[1]));
        return years.size;
    }, [availableMonths]);

    // Format: "Jan 2024"
    const formatMonthWithYear = (month: string) => {
        const [m, y] = month.split('-');
        return `${monthFullNames[m] || m} 20${y}`;
    };

    const handleSliderChange = (values: number[]) => {
        setActivePreset(null);
        const start = activeTimeline[values[0]];
        const end = activeTimeline[values[1]];
        if (start && end) onRangeChange(start, end);
    };

    // Quick preset handlers
    const applyPreset = (preset: 'ytd' | 'last3' | 'last6') => {
        if (availableMonths.length === 0) return;
        setActivePreset(preset);
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
        }
    };

    const presets: { key: PresetKey; label: string }[] = [
        { key: 'last3', label: '3M' },
        { key: 'last6', label: '6M' },
        { key: 'ytd', label: 'YTD' },
    ];

    return (
        <div className="space-y-4">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left: Icon + Range Display */}
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#81D8D0]/15 to-[#4E4456]/5 dark:from-[#81D8D0]/20 dark:to-[#81D8D0]/5 ring-1 ring-[#81D8D0]/10 dark:ring-[#81D8D0]/15 mt-0.5 shrink-0">
                        <Calendar className="w-[18px] h-[18px] text-[#4E4456] dark:text-[#81D8D0]" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-tight">Date Range</h3>
                            <span className="inline-flex items-center px-1.5 py-px text-[10px] font-bold rounded-full bg-[#81D8D0]/10 text-[#4E4456] dark:bg-[#81D8D0]/15 dark:text-[#81D8D0] tabular-nums ring-1 ring-[#81D8D0]/20 dark:ring-[#81D8D0]/20">
                                {selectedDataMonths} mo
                            </span>
                        </div>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                            <span className="font-semibold text-[#4E4456] dark:text-[#81D8D0]">{formatMonthWithYear(startMonth)}</span>
                            <span className="mx-1.5 text-slate-300 dark:text-slate-600">&rarr;</span>
                            <span className="font-semibold text-[#4E4456] dark:text-[#81D8D0]">{formatMonthWithYear(endMonth)}</span>
                        </p>
                    </div>
                </div>

                {/* Right: Quick Presets */}
                <div className="inline-flex items-center gap-1 shrink-0">
                    {presets.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => key && applyPreset(key)}
                            className={`
                                px-2 py-1 text-[11px] font-semibold rounded-md transition-all duration-200
                                ${activePreset === key
                                    ? 'bg-[#4E4456]/10 text-[#4E4456] dark:bg-[#81D8D0]/15 dark:text-[#81D8D0] ring-1 ring-[#4E4456]/20 dark:ring-[#81D8D0]/25'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300'
                                }
                            `}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            setActivePreset(null);
                            onReset();
                        }}
                        className="ml-0.5 px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 rounded-md hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all duration-200 inline-flex items-center gap-1"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Slider + Timeline */}
            <div className="px-1">
                {/* Dual-Thumb Range Slider */}
                <div className="px-1">
                    <Slider
                        value={[activeStartIndex, activeEndIndex]}
                        onValueChange={handleSliderChange}
                        max={Math.max(0, activeTimeline.length - 1)}
                        min={0}
                        step={1}
                        className="w-full"
                        trackClassName="bg-slate-200 dark:bg-slate-700"
                        rangeClassName="bg-[#81D8D0]"
                        thumbClassName="border-2 border-[#4E4456] bg-white dark:border-[#81D8D0] dark:bg-slate-900 shadow-md shadow-black/10 dark:shadow-black/30 hover:scale-110 transition-transform"
                        aria-label="Month Range"
                    />
                </div>

                {/* Month Labels with Year Separators + Data Dots */}
                <div className="flex justify-between px-1.5 mt-4 relative">
                    {activeTimeline.map((m, i) => {
                        const [monthPart, yearPart] = m.split('-');
                        const prevYear = i > 0 ? activeTimeline[i - 1].split('-')[1] : null;
                        const isYearBoundary = prevYear !== null && prevYear !== yearPart;
                        const isFirstOfYear = i === 0 || isYearBoundary;
                        const isInRange = i >= activeStartIndex && i <= activeEndIndex;
                        const isEndpoint = i === activeStartIndex || i === activeEndIndex;

                        return (
                            <div
                                key={m}
                                className="relative flex flex-col items-center"
                            >
                                {/* Year badge - only when timeline spans multiple years */}
                                {isFirstOfYear && uniqueYears > 1 && (
                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-[#4E4456]/50 dark:text-[#81D8D0]/35 tracking-wider whitespace-nowrap">
                                        20{yearPart}
                                    </span>
                                )}

                                {/* Year divider */}
                                {isYearBoundary && uniqueYears > 1 && (
                                    <div className="absolute -top-2 -left-0.5 w-px h-[calc(100%+12px)] bg-gradient-to-b from-[#4E4456]/20 to-transparent dark:from-[#81D8D0]/20 dark:to-transparent" />
                                )}

                                {/* Month label */}
                                <span
                                    className={`
                                        text-[11px] leading-none transition-colors duration-150
                                        ${isEndpoint
                                            ? 'font-extrabold text-[#4E4456] dark:text-[#81D8D0]'
                                            : isInRange
                                                ? 'font-semibold text-[#81D8D0] dark:text-[#81D8D0]/90'
                                                : 'font-medium text-slate-400 dark:text-slate-500'
                                        }
                                    `}
                                >
                                    {monthPart}
                                </span>

                                {/* Data availability dot */}
                                <span
                                    className={`
                                        mt-1.5 w-1 h-1 rounded-full transition-all duration-150
                                        ${isEndpoint
                                            ? 'bg-[#4E4456] dark:bg-[#81D8D0] w-1.5 h-1.5'
                                            : isInRange
                                                ? 'bg-[#81D8D0] dark:bg-[#81D8D0]/70'
                                                : 'bg-slate-300 dark:bg-slate-600'
                                        }
                                    `}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
