"use client";

/**
 * Zone Watch — the Daily section's default tab. A fleet view of every zone's
 * L2-vs-ΣL3 balance for the selected day, built to answer one question fast:
 * "which zone is bleeding, and since when?" The daily data has no L1/NAMA
 * account, so everything here is distribution-level by design.
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import {
    AlertTriangle, ChevronRight, Droplets, Gauge, MapPin, TrendingUp, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { SeverityChip, Sparkline, type Severity } from "@/components/shared/inspection";
import { SortableTableHead } from "@/components/shared/data-table/sortable-table-head";
import { TableToolbar } from "@/components/shared/data-table/table-toolbar";
import { n } from "./inline-shared";
import { DailyBriefing } from "./inline-briefing";
import type { BriefingMetrics } from "./briefing-metrics";
import {
    buildDailyGrid, buildZoneDaySeries, buildZoneWatch, dailySeverity,
    SEVERITY_LABEL, type DailySeverity, type ZoneWatchRow,
} from "./daily-metrics";
import { useChartMotion } from "@/hooks/useReducedMotion";

// ─── Severity → design tokens (no raw hex; flips with the theme) ─────────────

type ChipColor = "success" | "danger" | "warning" | "default" | "primary";

export const SEV_UI: Record<DailySeverity, { base: string; text: string; bg: string; chip: ChipColor }> = {
    nodata: {
        base: "var(--mb-stale)", text: "var(--mb-stale-text)",
        bg: "color-mix(in srgb, var(--mb-stale) 10%, transparent)", chip: "default",
    },
    check: {
        base: "var(--mb-info)", text: "var(--mb-info-text)",
        bg: "color-mix(in srgb, var(--mb-info) 14%, transparent)", chip: "default",
    },
    good: {
        base: "var(--mb-success)", text: "var(--mb-success-text)",
        bg: "color-mix(in srgb, var(--mb-success) 12%, transparent)", chip: "success",
    },
    moderate: {
        base: "var(--mb-warning)", text: "var(--mb-warning-text)",
        bg: "color-mix(in srgb, var(--mb-warning) 18%, transparent)", chip: "warning",
    },
    high: {
        base: "var(--mb-danger)", text: "var(--mb-danger-text)",
        bg: "color-mix(in srgb, var(--mb-danger) 14%, transparent)", chip: "danger",
    },
    critical: {
        base: "var(--mb-danger)", text: "var(--mb-danger-text)",
        bg: "color-mix(in srgb, var(--mb-danger) 28%, transparent)", chip: "danger",
    },
};

const TIP_STYLE = {
    fontSize: 12, borderRadius: 8,
    background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)",
} as const;

/** Loose value type matching Recharts' Formatter signature (mirrors the monthly dashboard). */
type TipValue = number | string | ReadonlyArray<number | string> | undefined;

// ─── Small primitives ─────────────────────────────────────────────────────────

/** Card-section wrapper matching the daily section's Card idiom. */
function WatchPanel({
    title, note, icon: Icon, children,
}: {
    title: string; note?: string; icon?: LucideIcon; children: React.ReactNode;
}) {
    return (
        <Card className="card-elevated">
            <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6 pb-2 sm:pb-2 md:pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    {Icon && <Icon className="h-4 w-4 text-secondary" aria-hidden="true" />}
                    {title}
                </CardTitle>
                {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-2 sm:pt-2 md:pt-2">{children}</CardContent>
        </Card>
    );
}

// ─── Zone performance table ──────────────────────────────────────────────────

/** Water's 6-level daily severity → the shared 5-level model. "check" (L2 bulk
 *  missing, so no balance can be computed) collapses into "no data"; "moderate"
 *  maps to "watch". The zone×day heatmap below keeps the finer 6-level palette. */
const ZONE_SEV_MAP: Record<DailySeverity, Severity> = {
    nodata: "nodata", check: "nodata", good: "good", moderate: "watch", high: "high", critical: "critical",
};

type ZoneSortField = "urgency" | "supply" | "metered" | "loss" | "mtdLoss" | "trend";
type SortDirection = "asc" | "desc";

const DAILY_SEVERITY_RANK: Record<DailySeverity, number> = {
    good: 0,
    nodata: 1,
    check: 2,
    moderate: 3,
    high: 4,
    critical: 5,
};

function compareZones(a: ZoneWatchRow, b: ZoneWatchRow, field: ZoneSortField): number {
    switch (field) {
        case "urgency":
            return DAILY_SEVERITY_RANK[a.severity] - DAILY_SEVERITY_RANK[b.severity]
                || (a.loss ?? Number.NEGATIVE_INFINITY) - (b.loss ?? Number.NEGATIVE_INFINITY);
        case "supply":
            return (a.l2 ?? Number.NEGATIVE_INFINITY) - (b.l2 ?? Number.NEGATIVE_INFINITY);
        case "metered":
            return a.l3Sum - b.l3Sum;
        case "loss":
            return (a.loss ?? Number.NEGATIVE_INFINITY) - (b.loss ?? Number.NEGATIVE_INFINITY);
        case "mtdLoss":
            return a.mtdLoss - b.mtdLoss;
        case "trend":
            return a.risingDays - b.risingDays
                || (a.loss ?? Number.NEGATIVE_INFINITY) - (b.loss ?? Number.NEGATIVE_INFINITY);
    }
}

function ZonePerformanceTable({
    rows,
    totalRows,
    selectedDay,
    attentionOnly,
    sortField,
    sortDirection,
    onAttentionOnlyChange,
    onSort,
    onInspect,
}: {
    rows: ZoneWatchRow[];
    totalRows: number;
    selectedDay: number;
    attentionOnly: boolean;
    sortField: ZoneSortField;
    sortDirection: SortDirection;
    onAttentionOnlyChange: (active: boolean) => void;
    onSort: (field: ZoneSortField) => void;
    onInspect: (zone: string) => void;
}) {
    return (
        <div className="overflow-hidden rounded-[10.5px] border border-border bg-card shadow-card-standard [&_.ops-table-shell]:rounded-none [&_.ops-table-shell]:border-0 [&_.ops-table-shell]:shadow-none">
            <TableToolbar
                title={`Zone performance · Day ${selectedDay}`}
                count={rows.length === totalRows ? `${totalRows} zones` : `${rows.length} of ${totalRows} zones`}
            >
                <button
                    type="button"
                    onClick={() => onAttentionOnlyChange(!attentionOnly)}
                    aria-pressed={attentionOnly}
                    className={cn(
                        "inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60",
                        attentionOnly
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                >
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    Attention only
                </button>
            </TableToolbar>

            <Table
                data-density="compact"
                className="min-w-0 table-fixed md:min-w-[930px] md:table-auto"
                aria-label="Water zone performance"
            >
                <TableHeader>
                    <TableRow>
                        <SortableTableHead
                            field="urgency"
                            currentSortField={sortField}
                            currentSortDirection={sortDirection}
                            onSort={(field) => onSort(field as ZoneSortField)}
                            className="col-sticky w-[56%] md:w-auto md:min-w-[190px]"
                        >
                            Zone / status
                        </SortableTableHead>
                        <SortableTableHead
                            field="supply"
                            currentSortField={sortField}
                            currentSortDirection={sortDirection}
                            onSort={(field) => onSort(field as ZoneSortField)}
                            align="right"
                            className="num hidden min-w-[110px] md:table-cell"
                        >
                            Supply (m³)
                        </SortableTableHead>
                        <SortableTableHead
                            field="metered"
                            currentSortField={sortField}
                            currentSortDirection={sortDirection}
                            onSort={(field) => onSort(field as ZoneSortField)}
                            align="right"
                            className="num hidden min-w-[115px] md:table-cell"
                        >
                            Metered (m³)
                        </SortableTableHead>
                        <SortableTableHead
                            field="loss"
                            currentSortField={sortField}
                            currentSortDirection={sortDirection}
                            onSort={(field) => onSort(field as ZoneSortField)}
                            align="right"
                            className="num w-[44%] md:w-auto md:min-w-[135px]"
                        >
                            <span className="md:hidden">Daily balance</span>
                            <span className="hidden md:inline">Loss</span>
                        </SortableTableHead>
                        <SortableTableHead
                            field="mtdLoss"
                            currentSortField={sortField}
                            currentSortDirection={sortDirection}
                            onSort={(field) => onSort(field as ZoneSortField)}
                            align="right"
                            className="num hidden min-w-[145px] md:table-cell"
                        >
                            MTD loss
                        </SortableTableHead>
                        <SortableTableHead
                            field="trend"
                            currentSortField={sortField}
                            currentSortDirection={sortDirection}
                            onSort={(field) => onSort(field as ZoneSortField)}
                            align="right"
                            className="num hidden min-w-[155px] md:table-cell"
                        >
                            7-day trend
                        </SortableTableHead>
                        <TableHead className="hidden w-12 md:table-cell"><span className="sr-only">Inspect</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => {
                        const mappedSeverity = ZONE_SEV_MAP[row.severity];
                        const dailyLoss = row.loss !== null ? `${n(row.loss)} m³` : "—";
                        const dailyLossPct = row.lossPct !== null ? `${row.lossPct.toFixed(1)}%` : "—";
                        const mtdLossPct = row.mtdLossPct !== null ? `${row.mtdLossPct.toFixed(1)}%` : "—";
                        const sparkPointCount = row.spark.filter((value) => value !== null && Number.isFinite(value)).length;

                        return (
                            <TableRow key={row.zoneName}>
                                <TableCell
                                    className="col-sticky strong"
                                    style={{ boxShadow: `inset 3px 0 0 ${SEV_UI[row.severity].base}` }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onInspect(row.zoneName)}
                                        aria-label={`Inspect ${row.zoneName} — ${SEVERITY_LABEL[row.severity]}`}
                                        className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-[13px] font-semibold text-foreground group-hover:text-primary">
                                                {row.zoneName}
                                            </span>
                                            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                                                {row.meterCount} meter{row.meterCount === 1 ? "" : "s"}
                                            </span>
                                        </span>
                                        <SeverityChip severity={mappedSeverity} label={SEVERITY_LABEL[row.severity]} />
                                    </button>
                                </TableCell>
                                <TableCell className="num hidden whitespace-nowrap md:table-cell">
                                    {row.l2 !== null ? n(row.l2) : "—"}
                                </TableCell>
                                <TableCell className="num hidden whitespace-nowrap md:table-cell">
                                    {n(row.l3Sum)}
                                </TableCell>
                                <TableCell className="num">
                                    <div className="ms-auto max-w-[150px]">
                                        <p className="whitespace-nowrap font-semibold" style={{ color: SEV_UI[row.severity].text }}>
                                            {dailyLoss}
                                            {row.lossPct !== null && (
                                                <span className="ms-1 text-[11px] font-normal">{dailyLossPct}</span>
                                            )}
                                        </p>
                                        <p className="mt-1 text-[10px] font-normal text-muted-foreground md:hidden">
                                            L2 {row.l2 !== null ? n(row.l2) : "—"} · ΣL3 {n(row.l3Sum)}
                                        </p>
                                        <p className="mt-0.5 text-[10px] font-normal text-muted-foreground md:hidden">
                                            MTD {n(row.mtdLoss)} m³ · {mtdLossPct}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell className="num hidden whitespace-nowrap md:table-cell">
                                    <span className="font-semibold text-foreground">{n(row.mtdLoss)} m³</span>
                                    <span className="ms-1 text-[11px] font-normal text-muted-foreground">{mtdLossPct}</span>
                                </TableCell>
                                <TableCell className="num hidden md:table-cell">
                                    <div className="ms-auto flex w-[140px] items-center justify-end gap-2">
                                        {sparkPointCount >= 2 ? (
                                            <Sparkline values={row.spark} stroke="var(--chart-brand)" className="w-20" />
                                        ) : (
                                            <span className="text-muted-foreground" title="Not enough trend data">—</span>
                                        )}
                                        {row.risingDays >= 3 && (
                                            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-mb-danger-text">
                                                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                                                {row.risingDays + 1}d
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden text-right md:table-cell">
                                    <button
                                        type="button"
                                        onClick={() => onInspect(row.zoneName)}
                                        aria-label={`Open ${row.zoneName} details`}
                                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                                    >
                                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                No zones need attention for Day {selectedDay}.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <p className="sr-only" aria-live="polite">
                Showing {rows.length} of {totalRows} water zones.
            </p>
        </div>
    );
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

function ZoneDayHeatmap({
    monthData, selectedDay, onInspect,
}: {
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    onInspect: (zone: string, day: number) => void;
}) {
    const grid = useMemo(() => buildDailyGrid(monthData), [monthData]);
    const series = useMemo(() => buildZoneDaySeries(grid), [grid]);
    const days = Array.from({ length: grid.latestDay }, (_, i) => i + 1);

    return (
        <WatchPanel
            title="Zone Loss — Daily Heatmap"
            icon={Gauge}
            note="Each cell is one day's loss for that zone (loss % shown; hover for m³). Redder = worse — a column turning red pinpoints the day a leak started. Tap a cell to open that zone on that day."
        >
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px]">
                    <thead>
                        <tr>
                            <th scope="col" className="sticky left-0 z-10 bg-card px-2 py-1.5 text-left font-semibold text-muted-foreground">Zone</th>
                            {days.map((d) => (
                                <th
                                    scope="col"
                                    key={d}
                                    className={cn(
                                        "px-1 py-1.5 text-center font-semibold tabular-nums",
                                        d === selectedDay ? "text-primary underline dark:text-secondary" : "text-muted-foreground",
                                    )}
                                >
                                    {d}
                                </th>
                            ))}
                            <th scope="col" className="px-2 py-1.5 text-center font-semibold text-muted-foreground">MTD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {series.map((z) => {
                            let mtdL2 = 0;
                            let mtdL3 = 0;
                            for (const p of z.points) {
                                mtdL2 += p.l2 ?? 0;
                                mtdL3 += p.l3Sum;
                            }
                            const mtdLoss = mtdL2 - mtdL3;
                            const mtdPct = mtdL2 > 0 ? (mtdLoss / mtdL2) * 100 : null;
                            const mtdSev = SEV_UI[dailySeverity(mtdL2 > 0 || mtdL3 > 0 ? mtdLoss : null, mtdPct)];
                            return (
                                <tr key={z.zoneName}>
                                    <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-2 py-1 font-semibold text-foreground">{z.zoneName}</td>
                                    {z.points.map((p) => {
                                        const s = SEV_UI[p.severity];
                                        const label = p.lossPct !== null
                                            ? String(Math.round(p.lossPct))
                                            : p.loss !== null ? String(Math.round(p.loss)) : "·";
                                        const detail = p.loss !== null
                                            ? `loss ${n(p.loss)} m³${p.lossPct !== null ? ` (${p.lossPct.toFixed(1)}%)` : ""}`
                                            : p.hasData ? "L2 reading missing — balance not computable" : "no data";
                                        return (
                                            <td key={p.day} className="p-0.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => onInspect(z.zoneName, p.day)}
                                                    title={`${z.zoneName} · Day ${p.day}: ${detail}`}
                                                    aria-label={`${z.zoneName}, day ${p.day}: ${detail}. Open zone analysis.`}
                                                    className={cn(
                                                        "min-h-[26px] w-full min-w-[26px] rounded px-1 py-1 font-medium tabular-nums transition-shadow hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60",
                                                        p.day === selectedDay && "ring-2 ring-inset ring-primary dark:ring-secondary",
                                                    )}
                                                    style={{ background: s.bg, color: p.severity === "nodata" ? "var(--muted-foreground)" : s.text }}
                                                >
                                                    {label}
                                                </button>
                                            </td>
                                        );
                                    })}
                                    <td className="px-2 py-1 text-center font-bold tabular-nums" style={{ color: mtdSev.text }}>
                                        {mtdPct !== null ? `${Math.round(mtdPct)}%` : "·"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Color-blind-safe legend: color always paired with a text label. */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                {(["good", "moderate", "high", "critical", "check", "nodata"] as DailySeverity[]).map((sev) => (
                    <span key={sev} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="h-3 w-3 rounded-sm border border-border/40" style={{ background: SEV_UI[sev].bg }} aria-hidden="true" />
                        {SEVERITY_LABEL[sev]}
                    </span>
                ))}
            </div>
        </WatchPanel>
    );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function ZoneWatch({
    briefing, monthData, selectedDay, month, onInspectZone,
}: {
    briefing: BriefingMetrics | null;
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    month: string;
    onInspectZone: (zone: string, day?: number) => void;
}) {
    const chartMotion = useChartMotion();
    const [sortField, setSortField] = useState<ZoneSortField>("urgency");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [attentionOnly, setAttentionOnly] = useState(false);
    const grid = useMemo(() => buildDailyGrid(monthData), [monthData]);
    const series = useMemo(() => buildZoneDaySeries(grid), [grid]);
    const watch = useMemo(() => buildZoneWatch(series, selectedDay), [series, selectedDay]);

    // Worst first — the leak you need to see is never below the fold.
    const ordered = useMemo(
        () => [...watch].sort((a, b) => (b.loss ?? -Infinity) - (a.loss ?? -Infinity)),
        [watch],
    );
    const attentionZones = useMemo(
        () => watch.filter((row) => row.severity !== "good"),
        [watch],
    );
    const visibleZones = useMemo(() => {
        const filtered = attentionOnly ? attentionZones : watch;
        const direction = sortDirection === "asc" ? 1 : -1;
        return [...filtered].sort((a, b) => {
            const result = compareZones(a, b, sortField);
            return result === 0 ? a.zoneName.localeCompare(b.zoneName) : result * direction;
        });
    }, [attentionOnly, attentionZones, sortDirection, sortField, watch]);

    const handleSort = (field: ZoneSortField) => {
        if (field === sortField) {
            setSortDirection((current) => current === "asc" ? "desc" : "asc");
            return;
        }
        setSortField(field);
        setSortDirection("desc");
    };

    const lossBars = ordered.map((w) => ({
        name: w.zoneName,
        loss: w.loss ?? 0,
        lossPct: w.lossPct,
        fill: SEV_UI[w.severity].base,
    }));
    const supplyBars = ordered.map((w) => ({
        name: w.zoneName,
        Supply: w.l2 ?? 0,
        Metered: w.l3Sum,
    }));

    return (
        <div className="space-y-6">
            {briefing && <DailyBriefing metrics={briefing} month={month} day={selectedDay} />}

            <ZonePerformanceTable
                rows={visibleZones}
                totalRows={watch.length}
                selectedDay={selectedDay}
                attentionOnly={attentionOnly}
                sortField={sortField}
                sortDirection={sortDirection}
                onAttentionOnlyChange={setAttentionOnly}
                onSort={handleSort}
                onInspect={onInspectZone}
            />

            <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
                <WatchPanel
                    title={`Loss by Zone — Day ${selectedDay}`}
                    icon={AlertTriangle}
                    note="Unaccounted water (L2 − ΣL3) per zone. Negative = meters read more than the bulk (check meters)."
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={lossBars} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} unit=" m³" />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--foreground)" }} width={96} />
                            <Tooltip
                                formatter={(v: TipValue, _n, p) => [
                                    `${n(Number(v))} m³${p?.payload?.lossPct != null ? ` (${Number(p.payload.lossPct).toFixed(1)}%)` : ""}`,
                                    "Loss",
                                ]}
                                contentStyle={TIP_STYLE}
                                cursor={{ fill: "var(--chart-cursor-fill)" }}
                            />
                            <Bar dataKey="loss" radius={[0, 4, 4, 0]} barSize={18} {...chartMotion}>
                                {lossBars.map((e, i) => <Cell key={i} fill={e.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </WatchPanel>

                <WatchPanel
                    title={`Supply vs Metered by Zone — Day ${selectedDay}`}
                    icon={Droplets}
                    note="The gap between the bars is that zone's unaccounted water."
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={supplyBars} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--chart-axis)" }} interval={0} angle={-15} textAnchor="end" height={50} />
                            <YAxis tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                            <Tooltip
                                formatter={(v: TipValue, name) => [`${n(Number(v))} m³`, name === "Supply" ? "Zone supply (L2)" : "Metered (ΣL3)"]}
                                contentStyle={TIP_STYLE}
                                cursor={{ fill: "var(--chart-cursor-fill)" }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, color: "var(--foreground)" }} />
                            <Bar dataKey="Supply" fill="var(--chart-teal)" radius={[3, 3, 0, 0]} barSize={16} {...chartMotion}/>
                            <Bar dataKey="Metered" fill="var(--chart-brand)" radius={[3, 3, 0, 0]} barSize={16} {...chartMotion}/>
                        </BarChart>
                    </ResponsiveContainer>
                </WatchPanel>
            </div>

            <ZoneDayHeatmap monthData={monthData} selectedDay={selectedDay} onInspect={onInspectZone} />

            <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Daily balances are distribution-level: zone bulk (L2) vs the sum of its individual meters (ΣL3).
                The NAMA main bulk (L1) is billed monthly and has no daily readings, so the full A1→A2→A3 balance
                lives in the Monthly section.
            </p>
        </div>
    );
}
