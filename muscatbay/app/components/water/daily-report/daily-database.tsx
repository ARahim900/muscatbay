"use client";

/**
 * Daily Database — the full meter × day ledger for the loaded month, mirroring
 * the Monthly section's "Main Database" explorer. Once Zone Watch says which
 * zone and which day, this table answers "which meter": search any account,
 * scan its day-by-day readings, and read the anomaly flag computed for the
 * selected day (missing / spike / zero-streak).
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Download, Filter, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { NULL_AS_ZERO_ACCOUNTS } from "@/lib/water-accounts";
import { downloadRows } from "@/lib/water-monthly-data";
import { TableSearch, StatusChip, thBase, tdBase, n } from "./inline-shared";
import { buildDailyGrid, detectSpike, zeroStreak, wasActiveBefore, type DayValues } from "./daily-metrics";

interface LedgerRow {
    meterName: string;
    account: string;
    zone: string;
    label: string;
    type: string;
    values: DayValues;
    mtd: number;
    dayValue: number | null;
    flags: string[];
}

const r2 = (v: number) => Math.round(v * 100) / 100;

function rowFlags(values: DayValues, day: number, account: string): string[] {
    const flags: string[] = [];
    const nullOk = NULL_AS_ZERO_ACCOUNTS.has(account);
    if (values[day - 1] == null && !nullOk) flags.push("Missing");
    const spike = detectSpike(values, day);
    if (spike) flags.push(`Spike ×${spike.ratio.toFixed(1)}`);
    const streak = zeroStreak(values, day);
    if (streak >= 3 && !nullOk && wasActiveBefore(values, day, streak)) flags.push(`Zero ${streak}d`);
    return flags;
}

/** Small select in the daily filter idiom (used for zone / level). */
function LedgerSelect({
    icon: Icon, value, onChange, options, ariaLabel,
}: {
    icon: typeof MapPin; value: string; onChange: (v: string) => void; options: string[]; ariaLabel: string;
}) {
    return (
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-white/50 px-2.5 py-1.5 dark:bg-muted/50">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <select
                aria-label={ariaLabel}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-transparent text-sm text-foreground focus:outline-none"
            >
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

export function DailyDatabase({
    monthData, selectedDay, month,
}: {
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    month: string;
}) {
    const [search, setSearch] = useState("");
    const [zone, setZone] = useState("All");
    const [level, setLevel] = useState("All");
    const [issuesOnly, setIssuesOnly] = useState(false);

    const grid = useMemo(() => buildDailyGrid(monthData), [monthData]);
    const days = useMemo(() => Array.from({ length: grid.latestDay }, (_, i) => i + 1), [grid]);

    const rows = useMemo<LedgerRow[]>(() => monthData.map((r) => {
        const values = grid.values.get(r.account_number) ?? [];
        const mtd = r2(values.reduce<number>((s, v) => s + (v ?? 0), 0));
        return {
            meterName: r.meter_name || r.account_number,
            account: r.account_number,
            zone: r.zone || "—",
            label: r.label || "—",
            type: (r.type || "—").replace("Residential ", ""),
            values,
            mtd,
            dayValue: values[selectedDay - 1] ?? null,
            flags: rowFlags(values, selectedDay, r.account_number),
        };
    }), [monthData, grid, selectedDay]);

    const zoneOpts = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.zone))).sort()], [rows]);
    const levelOpts = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.label))).sort()], [rows]);

    const filtered = useMemo(() => rows
        .filter((r) => zone === "All" || r.zone === zone)
        .filter((r) => level === "All" || r.label === level)
        .filter((r) => !issuesOnly || r.flags.length > 0)
        .filter((r) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return r.meterName.toLowerCase().includes(q) || r.account.includes(q);
        })
        .sort((a, b) => b.mtd - a.mtd), [rows, zone, level, issuesOnly, search]);

    const exportRows = filtered.map((r) => ({
        Meter: r.meterName,
        Account: r.account,
        Zone: r.zone,
        Level: r.label,
        Type: r.type,
        [`Day_${selectedDay}_m3`]: r.dayValue ?? "",
        MTD_m3: r.mtd,
        Flags: r.flags.join(" | ") || "Normal",
        ...Object.fromEntries(days.map((d) => [`D${d}`, r.values[d - 1] ?? ""])),
    }));

    return (
        <Card className="card-elevated">
            <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6 pb-2 sm:pb-2 md:pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Database className="h-4 w-4 text-secondary" aria-hidden="true" />
                    Daily Database — {month}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                    Every meter&apos;s day-by-day readings for the month. Flags are computed for the selected day:
                    missing reading, spike vs the trailing 7-day average, or a zero-streak on a previously active meter.
                </p>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-5 md:p-6 pt-2 sm:pt-2 md:pt-2">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    <TableSearch value={search} onChange={setSearch} placeholder="Search meter or account…" />
                    <LedgerSelect icon={MapPin} value={zone} onChange={setZone} options={zoneOpts} ariaLabel="Filter by zone" />
                    <LedgerSelect icon={Filter} value={level} onChange={setLevel} options={levelOpts} ariaLabel="Filter by level" />
                    <button
                        type="button"
                        onClick={() => setIssuesOnly((v) => !v)}
                        aria-pressed={issuesOnly}
                        className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                            issuesOnly
                                ? "border-mb-danger-text/40 bg-mb-danger-light text-mb-danger-text"
                                : "border-border text-muted-foreground hover:bg-muted",
                        )}
                    >
                        Issues only
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadRows(exportRows, `water-daily-database-${month}-day${selectedDay}.csv`)}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Export CSV
                    </button>
                    <span className="ml-auto text-[12px] font-medium text-muted-foreground tabular-nums">
                        {filtered.length} meters · Day {selectedDay} highlighted
                    </span>
                </div>

                {/* Ledger */}
                <div className="overflow-hidden rounded-[10.5px] border border-border">
                    <div className="overflow-auto" style={{ maxHeight: 600 }}>
                        <table
                            className="w-full border-collapse text-[11px]"
                            style={{ minWidth: `${560 + days.length * 58}px` }}
                        >
                            <thead>
                                <tr>
                                    {/* Corner cell sticks on both axes (thBase already pins top). */}
                                    <th scope="col" className={cn(thBase, "left-0 z-20 min-w-[160px]")}>Meter</th>
                                    <th scope="col" className={thBase}>Account</th>
                                    <th scope="col" className={thBase}>Zone</th>
                                    <th scope="col" className={cn(thBase, "text-center")}>Lvl</th>
                                    <th scope="col" className={thBase}>Type</th>
                                    <th scope="col" className={thBase}>Flag</th>
                                    {days.map((d) => (
                                        <th
                                            scope="col"
                                            key={d}
                                            className={cn(thBase, "min-w-[54px] px-2 text-right tabular-nums")}
                                            style={d === selectedDay ? { background: "var(--secondary)", color: "var(--primary)" } : undefined}
                                        >
                                            D{d}
                                        </th>
                                    ))}
                                    <th scope="col" className={cn(thBase, "min-w-[76px] text-right")}>MTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7 + days.length} className="py-10 text-center text-[13px] text-muted-foreground">
                                            No meters match the current filters.
                                        </td>
                                    </tr>
                                )}
                                {filtered.map((r, i) => {
                                    const zebra = i % 2 === 1;
                                    const hasIssue = r.flags.length > 0;
                                    return (
                                        <tr key={r.account} className={cn("border-b border-border/60", zebra && "bg-muted/40 dark:bg-muted/20")}>
                                            <td
                                                className={cn(tdBase, "sticky left-0 z-10 whitespace-nowrap font-semibold text-foreground")}
                                                // Opaque background so scrolled columns never bleed through.
                                                style={{ background: zebra ? "color-mix(in srgb, var(--muted) 40%, var(--card))" : "var(--card)" }}
                                            >
                                                {r.meterName}
                                            </td>
                                            <td className={cn(tdBase, "meter whitespace-nowrap text-muted-foreground")}>{r.account}</td>
                                            <td className={cn(tdBase, "whitespace-nowrap text-muted-foreground")}>{r.zone}</td>
                                            <td className={cn(tdBase, "text-center")}>
                                                <StatusChip label={r.label} color={r.label === "L2" || r.label === "L1" ? "primary" : "default"} />
                                            </td>
                                            <td className={cn(tdBase, "whitespace-nowrap text-muted-foreground")}>{r.type}</td>
                                            <td className={cn(tdBase, "whitespace-nowrap")}>
                                                <StatusChip
                                                    label={hasIssue ? r.flags.join(" · ") : "Normal"}
                                                    color={hasIssue ? (r.flags.includes("Missing") ? "danger" : "warning") : "success"}
                                                />
                                            </td>
                                            {days.map((d) => {
                                                const v = r.values[d - 1];
                                                return (
                                                    <td
                                                        key={d}
                                                        className={cn(tdBase, "px-2 text-right tabular-nums", d === selectedDay && "font-bold")}
                                                        style={d === selectedDay ? { background: "var(--row-hover)" } : undefined}
                                                    >
                                                        {v == null
                                                            ? <span className="text-muted-foreground/60">·</span>
                                                            : v === 0
                                                                ? <span className="text-muted-foreground">0</span>
                                                                : n(v)}
                                                    </td>
                                                );
                                            })}
                                            <td className={cn(tdBase, "bg-muted/60 text-right font-semibold tabular-nums text-foreground dark:bg-muted/30")}>
                                                {n(r.mtd)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
