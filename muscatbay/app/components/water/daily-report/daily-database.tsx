"use client";

/**
 * Daily Database — the full meter × day ledger for the loaded month, mirroring
 * the Monthly section's "Main Database" explorer. Once Zone Watch says which
 * zone and which day, this table answers "which meter": search any account,
 * scan its day-by-day readings, and read the anomaly flag computed for the
 * selected day (missing / spike / zero-streak).
 */

import { useMemo, useState } from "react";
import { Database, Filter, MapPin } from "lucide-react";
import { Badge, Button, SectionCard } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { TableSearch, thBase, tdBase, n } from "./inline-shared";
import { ExportButton } from "@/components/shared/data-table";
import { buildDailyGrid, detectSpike, zeroStreak, wasActiveBefore, type DayValues } from "./daily-metrics";

interface LedgerRow {
    meterName: string;
    account: string;
    zone: string;
    label: string;
    type: string;
    values: DayValues;
    mtd: number | null;
    dayValue: number | null;
    flags: string[];
}

const r2 = (v: number) => Math.round(v * 100) / 100;

function rowFlags(values: DayValues, day: number): string[] {
    const flags: string[] = [];
    if (values[day - 1] == null) flags.push("Missing");
    const spike = detectSpike(values, day);
    if (spike) flags.push(`Spike ×${spike.ratio.toFixed(1)}`);
    const streak = zeroStreak(values, day);
    if (streak >= 3 && wasActiveBefore(values, day, streak)) flags.push(`Zero ${streak}d`);
    return flags;
}

/** Small select in the design-system control idiom (used for zone / level). */
function LedgerSelect({
    icon: Icon, value, onChange, options, ariaLabel,
}: {
    icon: typeof MapPin; value: string; onChange: (v: string) => void; options: string[]; ariaLabel: string;
}) {
    return (
        <span className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-card px-2.5">
            <Icon size={16} strokeWidth={2} className="shrink-0 text-muted" aria-hidden="true" />
            <select
                aria-label={ariaLabel}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-transparent text-label text-fg outline-none"
            >
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </span>
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
        const hasReading = values.some((value) => value !== null);
        const mtd = hasReading ? r2(values.reduce<number>((s, v) => s + (v ?? 0), 0)) : null;
        return {
            meterName: r.meter_name || r.account_number,
            account: r.account_number,
            zone: r.zone || "—",
            label: r.label || "—",
            type: (r.type || "—").replace("Residential ", ""),
            values,
            mtd,
            dayValue: values[selectedDay - 1] ?? null,
            flags: rowFlags(values, selectedDay),
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
        .sort((a, b) => (b.mtd ?? Number.NEGATIVE_INFINITY) - (a.mtd ?? Number.NEGATIVE_INFINITY)), [rows, zone, level, issuesOnly, search]);

    const exportRows = filtered.map((r) => ({
        Meter: r.meterName,
        Account: r.account,
        Zone: r.zone,
        Level: r.label,
        Type: r.type,
        [`Day_${selectedDay}_m3`]: r.dayValue ?? "",
        MTD_m3: r.mtd ?? "",
        Flags: r.flags.join(" | ") || "Normal",
        ...Object.fromEntries(days.map((d) => [`D${d}`, r.values[d - 1] ?? ""])),
    }));

    return (
        <SectionCard>
            <SectionCard.Header
                icon={Database}
                title={`Daily database — ${month}`}
                description={`${filtered.length} meters · Day ${selectedDay} highlighted`}
                action={<ExportButton rows={exportRows} filename={`water-daily-database-${month}-day${selectedDay}`} />}
            />
            <SectionCard.Body className="space-y-3">
                <p className="text-caption text-muted">
                    Every meter&apos;s day-by-day readings for the month. Flags are computed for the selected day:
                    missing reading, spike vs the trailing 7-day average, or a zero-streak on a previously active meter.
                </p>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    <TableSearch value={search} onChange={setSearch} placeholder="Search meter or account…" />
                    <LedgerSelect icon={MapPin} value={zone} onChange={setZone} options={zoneOpts} ariaLabel="Filter by zone" />
                    <LedgerSelect icon={Filter} value={level} onChange={setLevel} options={levelOpts} ariaLabel="Filter by level" />
                    <Button
                        variant={issuesOnly ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setIssuesOnly((v) => !v)}
                        aria-pressed={issuesOnly}
                    >
                        Issues only
                    </Button>
                </div>

                {/* Ledger */}
                <div className="overflow-hidden rounded-control border border-line">
                    <div className="overflow-auto" style={{ maxHeight: 600 }}>
                        <table
                            className="w-full border-collapse"
                            style={{ minWidth: `${560 + days.length * 58}px` }}
                        >
                            <thead>
                                <tr>
                                    {/* Corner cell sticks on both axes (thBase already pins top). */}
                                    <th scope="col" className={cn(thBase, "left-0 z-20 min-w-40")}>Meter</th>
                                    <th scope="col" className={thBase}>Account</th>
                                    <th scope="col" className={thBase}>Zone</th>
                                    <th scope="col" className={cn(thBase, "text-center")}>Lvl</th>
                                    <th scope="col" className={thBase}>Type</th>
                                    <th scope="col" className={thBase}>Flag</th>
                                    {days.map((d) => (
                                        <th
                                            scope="col"
                                            key={d}
                                            className={cn(thBase, "min-w-14 px-2 text-right tabular-nums")}
                                            style={d === selectedDay ? { background: "var(--color-accent)", color: "var(--color-primary)" } : undefined}
                                        >
                                            D{d}
                                        </th>
                                    ))}
                                    <th scope="col" className={cn(thBase, "min-w-20 text-right")}>MTD</th>
                                </tr>
                            </thead>
                            <tbody className="[&>tr]:h-11">
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7 + days.length} className="py-10 text-center text-label text-muted">
                                            No meters match the current filters.
                                        </td>
                                    </tr>
                                )}
                                {filtered.map((r, i) => {
                                    const zebra = i % 2 === 1;
                                    const hasIssue = r.flags.length > 0;
                                    return (
                                        <tr key={r.account} className={cn("border-b border-line", zebra && "bg-component")}>
                                            <td
                                                className={cn(tdBase, "sticky left-0 z-10 whitespace-nowrap font-medium")}
                                                // Opaque background so scrolled columns never bleed through.
                                                style={{ background: zebra ? "var(--color-component)" : "var(--color-card)" }}
                                            >
                                                {r.meterName}
                                            </td>
                                            <td className={cn(tdBase, "meter whitespace-nowrap text-muted")}>{r.account}</td>
                                            <td className={cn(tdBase, "whitespace-nowrap text-muted")}>{r.zone}</td>
                                            <td className={cn(tdBase, "text-center")}>
                                                <Badge tone={r.label === "L2" || r.label === "L1" ? "info" : "neutral"}>{r.label}</Badge>
                                            </td>
                                            <td className={cn(tdBase, "whitespace-nowrap text-muted")}>{r.type}</td>
                                            <td className={cn(tdBase, "whitespace-nowrap")}>
                                                <Badge tone={hasIssue ? (r.flags.includes("Missing") ? "danger" : "warning") : "success"}>
                                                    {hasIssue ? r.flags.join(" · ") : "Normal"}
                                                </Badge>
                                            </td>
                                            {days.map((d) => {
                                                const v = r.values[d - 1];
                                                return (
                                                    <td
                                                        key={d}
                                                        className={cn(tdBase, "px-2 text-right tabular-nums", d === selectedDay && "bg-accent-tint font-medium")}
                                                    >
                                                        {v == null
                                                            ? <span className="text-muted">·</span>
                                                            : v === 0
                                                                ? <span className="text-muted">0</span>
                                                                : n(v)}
                                                    </td>
                                                );
                                            })}
                                            <td className={cn(tdBase, "text-right font-medium tabular-nums")}>
                                                {n(r.mtd)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </SectionCard.Body>
        </SectionCard>
    );
}
