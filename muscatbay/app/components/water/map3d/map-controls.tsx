"use client";

/**
 * @fileoverview Water 3D Map — toolbar, date controls, search and filters.
 *
 * Small, self-contained, fully keyboard-accessible control pieces the wrapper
 * composes. Native `<select>`/buttons (touch-friendly, RTL-aware) + tokens only.
 *
 * @module components/water/map3d/map-controls
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
    BarChart3, CalendarDays, ChevronLeft, ChevronRight, Search, X,
    Layers as LayersIcon, Droplets, Tag, Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapMode, MapSnapshot, MapMeterDatum } from "@/lib/water-map-data";
import type { SceneLayers } from "@/components/water/map3d/water-3d-scene";
import type { MonthlyPeriodOption } from "@/lib/water-map-data";
import type { DailyMonthOption } from "@/functions/api/water-map";

const btn =
    "inline-flex items-center justify-center gap-1.5 rounded-[7px] border border-border bg-card px-2.5 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 disabled:opacity-40 disabled:pointer-events-none";
const selectCls =
    "rounded-[7px] border border-border bg-card px-2.5 py-1.5 text-[13px] font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60";

/* ── Mode toggle ───────────────────────────────────────────────────────────── */

export function ModeToggle({ mode, onChange }: { mode: MapMode; onChange: (m: MapMode) => void }) {
    const items: { key: MapMode; label: string; icon: typeof BarChart3 }[] = [
        { key: "monthly", label: "Monthly", icon: BarChart3 },
        { key: "daily", label: "Daily", icon: CalendarDays },
    ];
    return (
        <div role="group" aria-label="Map data period" className="inline-flex rounded-[7px] border border-border bg-card p-0.5">
            {items.map((it) => {
                const active = mode === it.key;
                return (
                    <button
                        key={it.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(it.key)}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60",
                            active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <it.icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {it.label}
                    </button>
                );
            })}
        </div>
    );
}

/* ── Monthly date control ──────────────────────────────────────────────────── */

export function MonthlyDateControl({
    periods,
    value,
    onChange,
}: {
    periods: MonthlyPeriodOption[];
    value: string | null;
    onChange: (periodKey: string) => void;
}) {
    const idx = periods.findIndex((p) => p.periodKey === value);
    const step = (d: number) => {
        const next = periods[idx + d];
        if (next) onChange(next.periodKey);
    };
    return (
        <div className="inline-flex items-center gap-1.5">
            <button type="button" className={btn} onClick={() => step(-1)} disabled={idx <= 0} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <label className="sr-only" htmlFor="map-month">Month</label>
            <select id="map-month" className={selectCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
                {periods.map((p) => (
                    <option key={p.periodKey} value={p.periodKey}>{p.label}</option>
                ))}
            </select>
            <button type="button" className={btn} onClick={() => step(1)} disabled={idx < 0 || idx >= periods.length - 1} aria-label="Next month">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
    );
}

/* ── Daily date control ────────────────────────────────────────────────────── */

export function DailyDateControl({
    months,
    month,
    year,
    day,
    latestDay,
    onMonthChange,
    onDayChange,
}: {
    months: DailyMonthOption[];
    month: string | null;
    year: number | null;
    day: number;
    latestDay: number;
    onMonthChange: (month: string, year: number) => void;
    onDayChange: (day: number) => void;
}) {
    const key = month && year ? `${year}|${month}` : "";
    return (
        <div className="inline-flex flex-wrap items-center gap-1.5">
            <label className="sr-only" htmlFor="map-daily-month">Daily month</label>
            <select
                id="map-daily-month"
                className={selectCls}
                value={key}
                onChange={(e) => {
                    const [y, m] = e.target.value.split("|");
                    if (m && y) onMonthChange(m, Number(y));
                }}
            >
                {months.length === 0 && <option value="">No daily data</option>}
                {months.map((m) => (
                    <option key={`${m.year}|${m.month}`} value={`${m.year}|${m.month}`}>{m.label}</option>
                ))}
            </select>
            <div className="inline-flex items-center gap-1.5">
                <button type="button" className={btn} onClick={() => onDayChange(Math.max(1, day - 1))} disabled={day <= 1} aria-label="Previous day">
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="min-w-[3.5rem] text-center text-[13px] font-semibold tabular-nums text-foreground" aria-live="polite">
                    Day {day}
                </span>
                <button type="button" className={btn} onClick={() => onDayChange(Math.min(latestDay, day + 1))} disabled={day >= latestDay} aria-label="Next day">
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

/* ── Layer toggles ─────────────────────────────────────────────────────────── */

export function LayerToggles({
    layers,
    onLayersChange,
}: {
    layers: SceneLayers;
    onLayersChange: (partial: Partial<SceneLayers>) => void;
}) {
    const toggles: { key: keyof SceneLayers; label: string; icon: typeof LayersIcon }[] = [
        { key: "meters", label: "Meters", icon: Droplets },
        { key: "pipes", label: "Pipes", icon: Waypoints },
        { key: "labels", label: "Labels", icon: Tag },
    ];
    return (
        <div className="inline-flex flex-wrap items-center gap-1.5" role="group" aria-label="Map layers">
            {toggles.map((t) => (
                <button
                    key={t.key}
                    type="button"
                    aria-pressed={layers[t.key]}
                    onClick={() => onLayersChange({ [t.key]: !layers[t.key] })}
                    className={cn(btn, layers[t.key] ? "border-secondary/50 text-foreground" : "text-muted-foreground")}
                    title={`Toggle ${t.label}`}
                >
                    <t.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">{t.label}</span>
                </button>
            ))}
        </div>
    );
}

/* ── Scene switcher (three local aerial scenes) ────────────────────────────── */

export function SceneSwitcher({
    order,
    labels,
    active,
    onChange,
}: {
    order: readonly string[];
    labels: Record<string, string>;
    active: string;
    onChange: (sceneId: string) => void;
}) {
    return (
        <div role="group" aria-label="Aerial scene" className="inline-flex rounded-[7px] border border-border bg-card p-0.5">
            {order.map((id) => (
                <button
                    key={id}
                    type="button"
                    aria-pressed={active === id}
                    onClick={() => onChange(id)}
                    className={cn(
                        "rounded-[5px] px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60",
                        active === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    {labels[id] ?? id}
                </button>
            ))}
        </div>
    );
}

/* ── Search combobox ───────────────────────────────────────────────────────── */

export function MapSearch({
    meters,
    onPick,
}: {
    meters: MapMeterDatum[];
    onPick: (key: string) => void;
}) {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [debounced, setDebounced] = useState("");
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(q.trim().toLowerCase()), 180);
        return () => clearTimeout(id);
    }, [q]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const results = useMemo(() => {
        if (!debounced) return [];
        return meters
            .filter(
                (m) =>
                    m.name.toLowerCase().includes(debounced) ||
                    m.account.toLowerCase().includes(debounced) ||
                    m.zoneName.toLowerCase().includes(debounced),
            )
            .slice(0, 8);
    }, [debounced, meters]);

    const pick = (key: string) => {
        onPick(key);
        setOpen(false);
        setQ("");
    };

    return (
        <div ref={rootRef} className="relative w-full sm:w-72">
            <div className="relative">
                <Search className="pointer-events-none absolute inset-y-0 left-2.5 my-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input
                    type="search"
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && results[0]) pick(results[0].key);
                        if (e.key === "Escape") setOpen(false);
                    }}
                    placeholder="Search meter, account or zone…"
                    aria-label="Search meters"
                    role="combobox"
                    aria-expanded={open && results.length > 0}
                    aria-controls="map-search-list"
                    className="w-full rounded-[7px] border border-border bg-card py-1.5 pl-8 pr-8 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                />
                {q && (
                    <button
                        type="button"
                        onClick={() => setQ("")}
                        aria-label="Clear search"
                        className="absolute inset-y-0 right-2 my-auto h-5 w-5 rounded text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
            </div>
            {open && results.length > 0 && (
                <ul
                    id="map-search-list"
                    role="listbox"
                    className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-[7px] border border-border bg-card p-1 shadow-lg"
                >
                    {results.map((m) => (
                        <li key={m.key} role="option" aria-selected={false}>
                            <button
                                type="button"
                                onClick={() => pick(m.key)}
                                className="flex w-full items-center justify-between gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] hover:bg-muted focus:outline-none focus-visible:bg-muted"
                            >
                                <span className="min-w-0 truncate font-medium text-foreground">{m.name}</span>
                                <span className="shrink-0 text-[11px] text-muted-foreground">{m.zoneName}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ── Filters ───────────────────────────────────────────────────────────────── */

export interface MapFilterState {
    zoneId: string;
    severity: string;
    level: string;
    issue: string;
}

export const DEFAULT_FILTERS: MapFilterState = { zoneId: "all", severity: "all", level: "all", issue: "all" };

export function MapFilters({
    snapshot,
    filters,
    onChange,
}: {
    snapshot: MapSnapshot;
    filters: MapFilterState;
    onChange: (f: MapFilterState) => void;
}) {
    const levels = useMemo(() => Array.from(new Set(snapshot.meters.map((m) => m.level).filter(Boolean))).sort(), [snapshot.meters]);
    const set = (patch: Partial<MapFilterState>) => onChange({ ...filters, ...patch });
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <label className="sr-only" htmlFor="f-zone">Zone</label>
            <select id="f-zone" className={selectCls} value={filters.zoneId} onChange={(e) => set({ zoneId: e.target.value })}>
                <option value="all">All zones</option>
                {snapshot.zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                ))}
            </select>
            <label className="sr-only" htmlFor="f-sev">Severity</label>
            <select id="f-sev" className={selectCls} value={filters.severity} onChange={(e) => set({ severity: e.target.value })}>
                <option value="all">All status</option>
                <option value="good">Healthy</option>
                <option value="watch">Watch</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
                <option value="nodata">No data</option>
            </select>
            <label className="sr-only" htmlFor="f-level">Level</label>
            <select id="f-level" className={selectCls} value={filters.level} onChange={(e) => set({ level: e.target.value })}>
                <option value="all">All levels</option>
                {levels.map((l) => (
                    <option key={l} value={l}>{l}</option>
                ))}
            </select>
            <label className="sr-only" htmlFor="f-issue">Issue</label>
            <select id="f-issue" className={selectCls} value={filters.issue} onChange={(e) => set({ issue: e.target.value })}>
                <option value="all">All meters</option>
                <option value="missing">Missing reading</option>
                <option value="abnormal">Abnormal</option>
            </select>
            {(filters.zoneId !== "all" || filters.severity !== "all" || filters.level !== "all" || filters.issue !== "all") && (
                <button type="button" className={btn} onClick={() => onChange(DEFAULT_FILTERS)}>
                    Reset
                </button>
            )}
        </div>
    );
}
