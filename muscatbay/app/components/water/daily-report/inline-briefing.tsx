"use client";

import {
    Droplets, Gauge, TrendingDown, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { n } from "./inline-shared";
import type { BriefingMetrics } from "./briefing-metrics";

/** Format a signed percentage, or em dash when null. */
function pct(v: number | null): string {
    if (v === null) return "—";
    const sign = v > 0 ? "+" : "";
    return `${sign}${v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/** "Zone 3A" → "3A" so the alarm list stays short; other names pass through. */
const shortZone = (z: string) => z.replace(/^Zone\s+/i, "");

/**
 * One inline stat in the briefing strip: small icon, 10px uppercase label,
 * value beneath. Deliberately tiny — the strip summarises; the zone cards
 * below are the working surface.
 */
function Stat({
    icon: Icon, label, value, valueClassName, iconColor, title,
}: {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode;
    valueClassName?: string;
    iconColor: string;
    title?: string;
}) {
    return (
        <div className="flex min-w-0 items-center gap-2" title={title}>
            <Icon className="h-4 w-4 shrink-0" style={{ color: iconColor }} aria-hidden="true" />
            <div className="min-w-0 leading-tight">
                <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className={cn("truncate text-sm font-semibold tabular-nums text-foreground", valueClassName)}>{value}</p>
            </div>
        </div>
    );
}

/**
 * Daily briefing — a single compact status strip (replaces the earlier
 * six-tile card row, which together with the zone cards read as a wall of
 * cards). Same six facts, one line: distribution total, ΣL2 → ΣL3 balance,
 * loss, zones in alarm, day-over-day. Labels stay distribution-level — the
 * daily data has no L1/NAMA account, so nothing here claims to be "network
 * supply".
 */
export function DailyBriefing({
    metrics, month, day,
}: {
    metrics: BriefingMetrics;
    month: string;
    day: number;
}) {
    const { totalSupply, l2Total, l3Total, lossM3, lossPct, alarmCount, alarmZones, vsYesterdayPct, status } = metrics;

    const isWarning = status === "warning";
    // null → neutral up arrow placeholder; otherwise points with the movement.
    const TrendIcon = vsYesterdayPct !== null && vsYesterdayPct < 0 ? ArrowDown : ArrowUp;

    return (
        <section
            aria-label="Daily briefing"
            className="rounded-[10.5px] border border-border bg-card px-4 py-3 shadow-card-standard"
        >
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 lg:flex lg:flex-wrap lg:items-center lg:gap-x-6">
                {/* Caption — the strip's anchor; the day itself is set in the controls above. */}
                <p className="col-span-2 self-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-muted-foreground lg:col-span-1">
                    Briefing · {month} · Day {day}
                </p>

                <Stat
                    icon={Droplets}
                    label="Distribution total"
                    value={<>{n(totalSupply)} <span className="text-xs font-medium text-muted-foreground">m³</span></>}
                    iconColor="var(--module-water)"
                    title="Zone bulk (L2) + direct connections — the daily data has no L1/NAMA reading"
                />
                <Stat
                    icon={Gauge}
                    label="ΣL2 → ΣL3"
                    value={<>{n(l2Total)} <span className="text-muted-foreground">→</span> {n(l3Total)}</>}
                    iconColor="var(--status-info)"
                    title="Total entering all zones (L2) vs recorded by individual meters (L3)"
                />
                <Stat
                    icon={TrendingDown}
                    label="Loss"
                    value={lossPct === null ? `${n(lossM3)} m³` : `${n(lossM3)} m³ · ${lossPct.toFixed(1)}%`}
                    // Calm by default: amber only when a zone is actually in alarm.
                    valueClassName={isWarning ? "text-mb-warning-text" : undefined}
                    iconColor={isWarning ? "var(--status-warning)" : "var(--module-water)"}
                    title="Zone bulk (L2) − sub-meters (L3)"
                />
                {alarmCount > 0 ? (
                    <Stat
                        icon={AlertTriangle}
                        label="Zones in alarm"
                        value={`${alarmCount} · ${alarmZones.map(shortZone).join(", ")}`}
                        valueClassName="text-mb-danger-text"
                        iconColor="var(--status-danger)"
                        title={alarmZones.join(", ")}
                    />
                ) : (
                    <Stat
                        icon={CheckCircle2}
                        label="Zones in alarm"
                        value="0 · all within tolerance"
                        valueClassName="text-mb-success-text"
                        iconColor="var(--status-normal)"
                    />
                )}
                <Stat
                    icon={TrendIcon}
                    label="vs. yesterday"
                    value={pct(vsYesterdayPct)}
                    iconColor="var(--status-info)"
                    title="Day-over-day distribution total"
                />
            </div>
        </section>
    );
}
