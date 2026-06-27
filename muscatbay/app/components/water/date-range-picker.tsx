"use client";

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { Calendar, RotateCcw } from 'lucide-react';

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

// Fixed Jan-Dec axis — slider always displays a complete 12-month year
const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

type PresetKey = 'ytd' | 'last3' | 'last6' | 'last12' | null;

// ─── Custom dual-range slider (replaces Radix Slider for React 19 compat) ────

interface DualRangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onValueChange: (value: [number, number]) => void;
    startLabel?: string;
    endLabel?: string;
}

function DualRangeSlider({ min, max, value, onValueChange, startLabel, endLabel }: DualRangeSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<'start' | 'end' | null>(null);
    // Track rect is captured once on pointerdown instead of per pointermove —
    // avoids forced layout reads during drag. Stale only if the page scrolls
    // mid-drag, which a horizontal slider drag doesn't trigger.
    const dragRectRef = useRef<DOMRect | null>(null);
    // Refs to always read the latest props inside window event listeners.
    // Updated in a layout effect (not during render) so concurrent rendering
    // cannot observe inconsistent values.
    const valueRef = useRef(value);
    const onValueChangeRef = useRef(onValueChange);
    const minRef = useRef(min);
    const maxRef = useRef(max);
    useEffect(() => {
        valueRef.current = value;
        onValueChangeRef.current = onValueChange;
        minRef.current = min;
        maxRef.current = max;
    }, [value, onValueChange, min, max]);
    // Prevent the click event that fires after pointerup from jumping a thumb
    const justDraggedRef = useRef(false);

    const range = max - min || 1;
    const startPct = ((value[0] - min) / range) * 100;
    const endPct = ((value[1] - min) / range) * 100;

    // Window-level pointermove/pointerup for reliable drag handling.
    // This avoids pointer-capture and event-bubbling issues entirely.
    useEffect(() => {
        const handleMove = (e: PointerEvent) => {
            if (!draggingRef.current) return;
            e.preventDefault();
            const rect = dragRectRef.current ?? trackRef.current?.getBoundingClientRect() ?? null;
            if (!rect || rect.width === 0) return;
            const lo = minRef.current;
            const hi = maxRef.current;
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const v = Math.round(lo + pct * (hi - lo));
            if (Number.isNaN(v)) return;
            const current = valueRef.current;
            if (draggingRef.current === 'start') {
                const clamped = Math.max(lo, Math.min(v, current[1]));
                if (clamped !== current[0]) onValueChangeRef.current([clamped, current[1]]);
            } else {
                const clamped = Math.min(hi, Math.max(v, current[0]));
                if (clamped !== current[1]) onValueChangeRef.current([current[0], clamped]);
            }
        };
        const handleUp = () => {
            if (draggingRef.current) {
                justDraggedRef.current = true;
                requestAnimationFrame(() => { justDraggedRef.current = false; });
            }
            draggingRef.current = null;
            dragRectRef.current = null;
        };
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent, thumb: 'start' | 'end') => {
        e.preventDefault();
        e.stopPropagation();
        draggingRef.current = thumb;
        dragRectRef.current = trackRef.current?.getBoundingClientRect() ?? null;
        justDraggedRef.current = false;
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, thumb: 'start' | 'end') => {
        const current = valueRef.current;
        const lo = minRef.current;
        const hi = maxRef.current;
        const step = e.shiftKey ? 3 : 1;
        let nextValue: number | null = null;

        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            nextValue = thumb === 'start'
                ? Math.min(current[0] + step, current[1])
                : Math.min(current[1] + step, hi);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            nextValue = thumb === 'start'
                ? Math.max(current[0] - step, lo)
                : Math.max(current[1] - step, current[0]);
        } else if (e.key === 'Home') {
            nextValue = thumb === 'start' ? lo : current[0];
        } else if (e.key === 'End') {
            nextValue = thumb === 'start' ? current[1] : hi;
        }

        if (nextValue === null) return;
        e.preventDefault();
        if (thumb === 'start') {
            onValueChange([nextValue, current[1]]);
        } else {
            onValueChange([current[0], nextValue]);
        }
    }, [onValueChange]);

    const getValueFromPointer = useCallback((clientX: number): number => {
        const track = trackRef.current;
        if (!track) return min;
        const rect = track.getBoundingClientRect();
        if (rect.width === 0) return min;
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const v = Math.round(min + pct * (max - min));
        return Number.isNaN(v) ? min : v;
    }, [min, max]);

    // Click on track to jump the nearest thumb
    const handleTrackClick = useCallback((e: React.MouseEvent) => {
        if (justDraggedRef.current) return;
        if (draggingRef.current) return;
        const v = getValueFromPointer(e.clientX);
        const current = valueRef.current;
        const distStart = Math.abs(v - current[0]);
        const distEnd = Math.abs(v - current[1]);
        if (distStart <= distEnd) {
            onValueChange([Math.max(min, Math.min(v, current[1])), current[1]]);
        } else {
            onValueChange([current[0], Math.min(max, Math.max(v, current[0]))]);
        }
    }, [getValueFromPointer, min, max, onValueChange]);

    const thumbClass = "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-primary bg-white dark:border-secondary dark:bg-muted shadow-md shadow-black/10 dark:shadow-black/30 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform cursor-grab active:cursor-grabbing z-10";

    return (
        <div
            ref={trackRef}
            className="relative flex items-center w-full h-5 cursor-pointer touch-none select-none overflow-visible"
            onClick={handleTrackClick}
        >
            {/* Track background — lifted off the dark card surface (--muted #22202A is
                nearly indistinguishable from --card #16141B) so the inactive portion of
                the track stays visible and the active range reads as a clear contrast. */}
            <div className="absolute inset-x-0 h-2 rounded-full bg-border dark:bg-muted-foreground/30" />
            {/* Active range — brand teal is bright in both themes; pinned explicitly for dark. */}
            <div
                className="absolute h-2 rounded-full bg-secondary dark:bg-secondary"
                style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
            />
            {/* Start thumb */}
            <div
                role="slider"
                tabIndex={0}
                aria-label="Start month"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value[0]}
                aria-valuetext={startLabel}
                className={thumbClass}
                style={{ left: `${startPct}%` }}
                onPointerDown={e => handlePointerDown(e, 'start')}
                onKeyDown={e => handleKeyDown(e, 'start')}
            />
            {/* End thumb */}
            <div
                role="slider"
                tabIndex={0}
                aria-label="End month"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value[1]}
                aria-valuetext={endLabel}
                className={thumbClass}
                style={{ left: `${endPct}%` }}
                onPointerDown={e => handlePointerDown(e, 'end')}
                onKeyDown={e => handleKeyDown(e, 'end')}
            />
        </div>
    );
}

// ─── DateRangePicker ─────────────────────────────────────────────────────────

export function DateRangePicker({
    startMonth,
    endMonth,
    availableMonths,
    onRangeChange,
    onReset
}: DateRangePickerProps) {
    const [activePreset, setActivePreset] = React.useState<PresetKey>(null);
    const onRangeChangeRef = useRef(onRangeChange);
    useEffect(() => {
        onRangeChangeRef.current = onRangeChange;
    }, [onRangeChange]);

    // Determine the year the slider should display: prefer endMonth's year,
    // then startMonth's year, then the latest year present in availableMonths.
    const displayYear = useMemo(() => {
        const fromEnd = endMonth?.split('-')[1];
        if (fromEnd) return fromEnd;
        const fromStart = startMonth?.split('-')[1];
        if (fromStart) return fromStart;
        if (availableMonths.length === 0) return '';
        return availableMonths[availableMonths.length - 1].split('-')[1];
    }, [startMonth, endMonth, availableMonths]);

    // Fixed Jan-Dec timeline for the display year ("Jan-YY" .. "Dec-YY")
    const activeTimeline = useMemo(() => {
        if (!displayYear) return [] as string[];
        return MONTH_ORDER.map(m => `${m}-${displayYear}`);
    }, [displayYear]);

    // Set of months that actually have data (used for dot visibility)
    const dataMonthsSet = useMemo(() => new Set(availableMonths), [availableMonths]);

    const selectableMonthIndexes = useMemo(() => {
        return activeTimeline
            .map((month, index) => dataMonthsSet.has(month) ? index : -1)
            .filter(index => index >= 0);
    }, [activeTimeline, dataMonthsSet]);

    const firstSelectableIndex = selectableMonthIndexes[0] ?? 0;
    const lastSelectableIndex = selectableMonthIndexes[selectableMonthIndexes.length - 1] ?? Math.max(0, activeTimeline.length - 1);

    const clampToAvailableMonth = useCallback((index: number) => {
        if (selectableMonthIndexes.length === 0) return 0;
        const bounded = Math.max(firstSelectableIndex, Math.min(index, lastSelectableIndex));
        // Snap to the nearest month that actually has data. Months can have gaps
        // (e.g. a missing mid-year reading), so a bounded calendar index may still
        // land on a non-selectable month — which would set the <select> value to an
        // option that isn't rendered. Snapping guarantees the value always matches
        // an entry in selectableMonthIndexes.
        if (dataMonthsSet.has(activeTimeline[bounded])) return bounded;
        return selectableMonthIndexes.reduce(
            (best, i) => (Math.abs(i - bounded) < Math.abs(best - bounded) ? i : best),
            selectableMonthIndexes[0],
        );
    }, [activeTimeline, dataMonthsSet, firstSelectableIndex, lastSelectableIndex, selectableMonthIndexes]);

    // Calculate slider indices (clamped to fixed Jan-Dec axis)
    let activeStartIndex = activeTimeline.length > 0 ? activeTimeline.indexOf(startMonth) : 0;
    let activeEndIndex = activeTimeline.length > 0 ? activeTimeline.indexOf(endMonth) : 0;

    // If out of bounds (e.g. startMonth is from a different year), clamp to bounds
    if (activeStartIndex === -1) activeStartIndex = firstSelectableIndex;
    if (activeEndIndex === -1) activeEndIndex = lastSelectableIndex;

    // Ensure start ≤ end and within bounds
    activeStartIndex = clampToAvailableMonth(activeStartIndex);
    activeEndIndex = Math.max(activeStartIndex, clampToAvailableMonth(activeEndIndex));

    // The displayed start/end months (what the slider actually shows)
    const displayStartMonth = activeTimeline[activeStartIndex] || '';
    const displayEndMonth = activeTimeline[activeEndIndex] || '';

    // Count of selected months
    const selectedDataMonths = activeTimeline
        .slice(activeStartIndex, activeEndIndex + 1)
        .filter(month => dataMonthsSet.has(month)).length;

    // Auto-sync parent when start/end months fall outside the fixed Jan-Dec axis
    // (e.g. after switching years, or when initial values span multiple years)
    useEffect(() => {
        if (activeTimeline.length === 0) return;
        // Key the check off membership in the *current* timeline, not the global
        // data set. availableMonths can span multiple years, so dataMonthsSet.has()
        // is true for a parent value from another year (e.g. 'Dec-23' while the axis
        // shows 2024) even though it isn't on the displayed axis — which would skip
        // the sync and leave the badge/label/slider diverged from the parent.
        const startOnAxis = activeTimeline.includes(startMonth);
        const endOnAxis = activeTimeline.includes(endMonth);
        const nextRangeChanged = displayStartMonth !== startMonth || displayEndMonth !== endMonth;
        if ((!startOnAxis || !endOnAxis) && nextRangeChanged) {
            onRangeChangeRef.current(displayStartMonth, displayEndMonth);
        }
    }, [activeTimeline, displayStartMonth, displayEndMonth, startMonth, endMonth]);

    // Format: "January 2024"
    const formatMonthWithYear = useCallback((month: string) => {
        if (!month) return '';
        const [m, y] = month.split('-');
        return `${monthFullNames[m] || m} 20${y}`;
    }, []);

    const handleSliderChange = useCallback((values: [number, number]) => {
        setActivePreset(null);
        const nextStartIndex = clampToAvailableMonth(Math.min(values[0], values[1]));
        const nextEndIndex = Math.max(nextStartIndex, clampToAvailableMonth(Math.max(values[0], values[1])));
        const start = activeTimeline[nextStartIndex];
        const end = activeTimeline[nextEndIndex];
        if (start && end) onRangeChange(start, end);
    }, [activeTimeline, clampToAvailableMonth, onRangeChange]);

    const handleStartSelect = useCallback((value: string) => {
        setActivePreset(null);
        const nextStartIndex = clampToAvailableMonth(Number(value));
        const nextEndIndex = Math.max(nextStartIndex, activeEndIndex);
        const start = activeTimeline[nextStartIndex];
        const end = activeTimeline[nextEndIndex];
        if (start && end) onRangeChange(start, end);
    }, [activeEndIndex, activeTimeline, clampToAvailableMonth, onRangeChange]);

    const handleEndSelect = useCallback((value: string) => {
        setActivePreset(null);
        const nextEndIndex = clampToAvailableMonth(Number(value));
        const nextStartIndex = Math.min(activeStartIndex, nextEndIndex);
        const start = activeTimeline[nextStartIndex];
        const end = activeTimeline[nextEndIndex];
        if (start && end) onRangeChange(start, end);
    }, [activeStartIndex, activeTimeline, clampToAvailableMonth, onRangeChange]);

    const handleMonthClick = useCallback((index: number) => {
        if (!dataMonthsSet.has(activeTimeline[index])) return;
        setActivePreset(null);
        const distStart = Math.abs(index - activeStartIndex);
        const distEnd = Math.abs(index - activeEndIndex);
        const nextStartIndex = distStart <= distEnd ? index : activeStartIndex;
        const nextEndIndex = distStart <= distEnd ? activeEndIndex : index;
        const start = activeTimeline[Math.min(nextStartIndex, nextEndIndex)];
        const end = activeTimeline[Math.max(nextStartIndex, nextEndIndex)];
        if (start && end) onRangeChange(start, end);
    }, [activeEndIndex, activeStartIndex, activeTimeline, dataMonthsSet, onRangeChange]);

    // Quick preset handlers (operate within the visible timeline)
    const applyPreset = useCallback((preset: 'ytd' | 'last3' | 'last6' | 'last12') => {
        if (activeTimeline.length === 0 || selectableMonthIndexes.length === 0) return;
        setActivePreset(preset);
        switch (preset) {
            case 'ytd': {
                const latestYear = activeTimeline[lastSelectableIndex].split('-')[1];
                const janOfLatestYear = activeTimeline.find(m => m.startsWith('Jan-') && m.endsWith(latestYear));
                const ytdStart = janOfLatestYear && dataMonthsSet.has(janOfLatestYear) ? janOfLatestYear : activeTimeline[firstSelectableIndex];
                onRangeChange(ytdStart, activeTimeline[lastSelectableIndex]);
                break;
            }
            case 'last3':
                onRangeChange(activeTimeline[clampToAvailableMonth(lastSelectableIndex - 2)], activeTimeline[lastSelectableIndex]);
                break;
            case 'last6':
                onRangeChange(activeTimeline[clampToAvailableMonth(lastSelectableIndex - 5)], activeTimeline[lastSelectableIndex]);
                break;
            case 'last12':
                onRangeChange(activeTimeline[firstSelectableIndex], activeTimeline[lastSelectableIndex]);
                break;
        }
    }, [activeTimeline, clampToAvailableMonth, dataMonthsSet, firstSelectableIndex, lastSelectableIndex, onRangeChange, selectableMonthIndexes.length]);

    const presets = useMemo<{ key: PresetKey; label: string }[]>(() => [
        { key: 'last3', label: '3M' },
        { key: 'last6', label: '6M' },
        { key: 'last12', label: '1Y' },
        { key: 'ytd', label: 'YTD' },
    ], []);

    // Guard: nothing to render when the timeline is empty
    if (activeTimeline.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left: Icon + Range Display */}
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary/10 dark:bg-secondary/15 mt-0.5 shrink-0">
                        <Calendar className="w-[18px] h-[18px] text-primary dark:text-secondary" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground dark:text-muted-foreground tracking-tight">Date Range</h3>
                            <span className="inline-flex items-center px-1.5 py-px text-[10px] font-bold rounded-full bg-secondary/10 text-primary dark:bg-secondary/15 dark:text-secondary tabular-nums ring-1 ring-secondary/20 dark:ring-secondary/20">
                                {selectedDataMonths} mo
                            </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground dark:text-muted-foreground leading-tight truncate">
                            <span className="font-semibold text-primary dark:text-secondary">{formatMonthWithYear(displayStartMonth)}</span>
                            <span className="mx-1.5 text-muted-foreground/70 dark:text-muted-foreground">&rarr;</span>
                            <span className="font-semibold text-primary dark:text-secondary">{formatMonthWithYear(displayEndMonth)}</span>
                        </p>
                    </div>
                </div>

                {/* Right: Direct selectors + quick presets */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        Start
                        <select
                            aria-label="Start month selector"
                            value={activeStartIndex}
                            onChange={(e) => handleStartSelect(e.target.value)}
                            className="min-h-9 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {selectableMonthIndexes.map(index => (
                                <option key={`start-${activeTimeline[index]}`} value={index}>
                                    {formatMonthWithYear(activeTimeline[index])}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        End
                        <select
                            aria-label="End month selector"
                            value={activeEndIndex}
                            onChange={(e) => handleEndSelect(e.target.value)}
                            className="min-h-9 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {selectableMonthIndexes.map(index => (
                                <option key={`end-${activeTimeline[index]}`} value={index}>
                                    {formatMonthWithYear(activeTimeline[index])}
                                </option>
                            ))}
                        </select>
                    </label>
                    {presets.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => key && applyPreset(key)}
                            className={`
                                min-h-11 px-3 py-2 text-[11px] font-semibold rounded-md transition-all duration-200 sm:min-h-0 sm:px-2 sm:py-1
                                ${activePreset === key
                                    ? 'bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary ring-1 ring-primary/20 dark:ring-secondary/25'
                                    : 'text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted/50 hover:text-muted-foreground dark:hover:text-muted-foreground/70'
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
                        className="ml-0.5 inline-flex min-h-11 items-center gap-1 rounded-md px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-all duration-200 hover:bg-red-50 hover:text-red-500 sm:min-h-0 sm:px-2 sm:py-1 dark:text-muted-foreground dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Slider + Timeline */}
            <div className="px-1 overflow-visible">
                {/* Dual-Thumb Range Slider — px-3 keeps thumbs away from Card overflow-hidden edges */}
                <div className="px-3 overflow-visible">
                    {activeTimeline.length < 2 ? (
                        <div className="h-2 w-full rounded-full bg-secondary" />
                    ) : (
                        <DualRangeSlider
                            value={[activeStartIndex, activeEndIndex]}
                            onValueChange={handleSliderChange}
                            max={activeTimeline.length - 1}
                            min={0}
                            startLabel={formatMonthWithYear(displayStartMonth)}
                            endLabel={formatMonthWithYear(displayEndMonth)}
                        />
                    )}
                </div>

                {/* Year badge */}
                {displayYear && (
                    <div className="px-3 mt-3 mb-1">
                        <span className="text-[10px] font-extrabold text-primary/50 dark:text-secondary/40 tracking-wider">
                            20{displayYear}
                        </span>
                    </div>
                )}

                {/* Fixed Jan-Dec month labels + data dots */}
                <div className="grid grid-cols-12 gap-1 px-3 mt-1 relative">
                    {activeTimeline.map((m, i) => {
                        const [monthPart] = m.split('-');
                        const isInRange = i >= activeStartIndex && i <= activeEndIndex;
                        const isEndpoint = i === activeStartIndex || i === activeEndIndex;
                        const hasData = dataMonthsSet.has(m);

                        return (
                            <button
                                key={m}
                                type="button"
                                disabled={!hasData}
                                onClick={() => handleMonthClick(i)}
                                aria-label={`${hasData ? 'Select' : 'Unavailable'} ${formatMonthWithYear(m)}`}
                                className="relative flex min-w-0 flex-col items-center rounded-md px-1 py-1 transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {/* Month label */}
                                <span
                                    className={`
                                        text-[11px] leading-none transition-colors duration-200
                                        ${isEndpoint
                                            ? 'font-extrabold text-primary dark:text-secondary'
                                            : isInRange
                                                ? 'font-semibold text-secondary dark:text-secondary/90'
                                                : hasData
                                                    ? 'font-medium text-muted-foreground dark:text-muted-foreground'
                                                    : 'font-medium text-muted-foreground/70 dark:text-muted-foreground'
                                        }
                                    `}
                                >
                                    {monthPart}
                                </span>

                                {/* Data availability dot — empty ring for months without data */}
                                <span
                                    className={`
                                        mt-1.5 rounded-full transition-all duration-200
                                        ${isEndpoint
                                            ? 'bg-primary dark:bg-secondary w-1.5 h-1.5'
                                            : isInRange && hasData
                                                ? 'bg-secondary dark:bg-secondary/70 w-1 h-1'
                                                : hasData
                                                    ? 'bg-border dark:bg-muted w-1 h-1'
                                                    : 'border border-border dark:border-border w-1 h-1'
                                        }
                                    `}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
