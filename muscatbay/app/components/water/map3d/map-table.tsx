"use client";

/**
 * @fileoverview Water 3D Map — accessible table fallback.
 *
 * The non-WebGL alternative required for accessibility (and auto-shown when
 * WebGL is unavailable). Renders the same snapshot numbers as the 3D scene as
 * real, semantic tables with row selection.
 *
 * @module components/water/map3d/map-table
 */

import { SeverityChip, worstFirst } from "@/components/shared/inspection";
import { cn } from "@/lib/utils";
import type { MapZoneDatum, MapMeterDatum } from "@/lib/water-map-data";

const fmt = (n: number | null | undefined): string =>
    n == null ? "–" : Math.round(n).toLocaleString("en-GB");
const fmt1 = (n: number | null | undefined): string =>
    n == null ? "–" : Number(n).toLocaleString("en-GB", { maximumFractionDigits: 1 });

const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const td = "px-3 py-2 text-[13px] text-foreground whitespace-nowrap";

export function ZoneTable({
    zones,
    periodLabel,
    onSelect,
}: {
    zones: MapZoneDatum[];
    periodLabel: string;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="overflow-hidden rounded-[10.5px] border border-border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <caption className="px-3 pt-3 text-left text-sm font-semibold text-foreground">
                        Zone balance · {periodLabel}
                    </caption>
                    <thead>
                        <tr className="border-b border-border">
                            <th scope="col" className={th}>Zone</th>
                            <th scope="col" className={cn(th, "text-right")}>Bulk m³</th>
                            <th scope="col" className={cn(th, "text-right")}>Downstream m³</th>
                            <th scope="col" className={cn(th, "text-right")}>Loss m³</th>
                            <th scope="col" className={cn(th, "text-right")}>Loss %</th>
                            <th scope="col" className={cn(th, "text-right")}>Efficiency</th>
                            <th scope="col" className={cn(th, "text-right")}>Meters</th>
                            <th scope="col" className={cn(th, "text-right")}>Missing</th>
                            <th scope="col" className={cn(th, "text-right")}>Abnormal</th>
                            <th scope="col" className={th}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {worstFirst(zones).map((z) => (
                            <tr
                                key={z.id}
                                onClick={() => onSelect(z.id)}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onSelect(z.id);
                                    }
                                }}
                                className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/50 focus:outline-none focus-visible:bg-muted"
                            >
                                <th scope="row" className={cn(td, "font-semibold")}>{z.name}</th>
                                <td className={cn(td, "text-right tabular-nums")}>{fmt(z.bulk)}</td>
                                <td className={cn(td, "text-right tabular-nums")}>{fmt(z.downstream)}</td>
                                <td className={cn(td, "text-right tabular-nums")}>{fmt(z.loss)}</td>
                                <td className={cn(td, "text-right tabular-nums")}>{fmt1(z.lossPct)}%</td>
                                <td className={cn(td, "text-right tabular-nums")}>{fmt1(z.efficiency)}%</td>
                                <td className={cn(td, "text-right tabular-nums")}>{z.meterCount}</td>
                                <td className={cn(td, "text-right tabular-nums")}>{z.missingCount}</td>
                                <td className={cn(td, "text-right tabular-nums")}>{z.abnormalCount}</td>
                                <td className={td}><SeverityChip severity={z.severity} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function MeterTable({
    meters,
    selectedKey,
    onSelect,
}: {
    meters: MapMeterDatum[];
    selectedKey: string | null;
    onSelect: (key: string) => void;
}) {
    const rows = [...meters].sort((a, b) => {
        const rank = { critical: 4, high: 3, watch: 2, nodata: 1, good: 0 } as const;
        const d = rank[b.severity] - rank[a.severity];
        return d !== 0 ? d : (b.value ?? 0) - (a.value ?? 0);
    });
    return (
        <div className="overflow-hidden rounded-[10.5px] border border-border bg-card">
            <div className="max-h-[560px] overflow-auto">
                <table className="w-full border-collapse">
                    <caption className="px-3 pt-3 text-left text-sm font-semibold text-foreground">
                        Meters ({rows.length})
                    </caption>
                    <thead>
                        <tr className="border-b border-border">
                            <th scope="col" className={cn(th, "sticky top-0 z-10 bg-card")}>Meter</th>
                            <th scope="col" className={cn(th, "sticky top-0 z-10 bg-card")}>Account</th>
                            <th scope="col" className={cn(th, "sticky top-0 z-10 bg-card")}>Level</th>
                            <th scope="col" className={cn(th, "sticky top-0 z-10 bg-card")}>Zone</th>
                            <th scope="col" className={cn(th, "sticky top-0 z-10 bg-card text-right")}>m³</th>
                            <th scope="col" className={cn(th, "sticky top-0 z-10 bg-card text-right")}>Change</th>
                            <th scope="col" className={cn(th, "sticky top-0 z-10 bg-card")}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((m) => (
                            <tr
                                key={m.key}
                                onClick={() => onSelect(m.key)}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onSelect(m.key);
                                    }
                                }}
                                className={cn(
                                    "cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/50 focus:outline-none focus-visible:bg-muted",
                                    selectedKey === m.key && "bg-secondary/10",
                                )}
                            >
                                <th scope="row" className={cn(td, "font-medium")}>{m.name}</th>
                                <td className={cn(td, "meter text-muted-foreground")}>{m.account}</td>
                                <td className={td}>{m.level || "—"}</td>
                                <td className={cn(td, "text-muted-foreground")}>{m.zoneName}</td>
                                <td className={cn(td, "text-right tabular-nums")}>{m.value == null ? "missing" : fmt1(m.value)}</td>
                                <td className={cn(td, "text-right tabular-nums")}>
                                    {m.changePct == null ? "–" : `${m.changePct > 0 ? "+" : ""}${fmt1(m.changePct)}%`}
                                </td>
                                <td className={td}><SeverityChip severity={m.severity} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
