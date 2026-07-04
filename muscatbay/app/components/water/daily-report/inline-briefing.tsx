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
 * One inline stat in the ticker: small icon, 10px uppercase label, value
 * beneath. Deliberately tiny — the strip summarises; the zone cards below
 * are the working surface.
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
        <li className="flex items-center gap-2" title={title}>
            <Icon className="h-4 w-4 shrink-0" style={{ color: iconColor }} aria-hidden="true" />
            <div className="leading-tight">
                <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className={cn("whitespace-nowrap text-sm font-semibold tabular-nums text-foreground", valueClassName)}>{value}</p>
            </div>
        </li>
    );
}

/** The run of five stats — rendered twice for the seamless ticker loop. */
function StatRun({ metrics, duplicate }: { metrics: BriefingMetrics; duplicate?: boolean }) {
    const { totalSupply, l2Total, l3Total, lossM3, lossPct, alarmCount, alarmZones, vsYesterdayPct, status } = metrics;

    const isWarning = status === "warning";
    // null → neutral up arrow placeholder; otherwise points with the movement.
    const TrendIcon = vsYesterdayPct !== null && vsYesterdayPct < 0 ? ArrowDown : ArrowUp;

    return (
        // pr matches gap-x so both copies have identical width — the −50%
        // keyframe then lands exactly on the seam and the loop is invisible.
        <ul
            className="mb-ticker-copy flex list-none items-center gap-x-10 pr-10"
            aria-hidden={duplicate ? "true" : undefined}
        >
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
        </ul>
    );
}

/**
 * Daily briefing — a compact news-ticker strip: a fixed caption on the left
 * and the five stats looping continuously beside it. Hovering (or tabbing
 * into) the strip pauses the loop so values stay readable; users with
 * reduced motion get a static wrapped strip instead. Labels stay
 * distribution-level — the daily data has no L1/NAMA account, so nothing
 * here claims to be "network supply".
 */
export function DailyBriefing({
    metrics, month, day,
}: {
    metrics: BriefingMetrics;
    month: string;
    day: number;
}) {
    return (
        <section
            aria-label="Daily briefing"
            className="rounded-[10.5px] border border-border bg-card px-4 py-3 shadow-card-standard"
        >
            <div className="flex items-center gap-4">
                <p className="shrink-0 whitespace-nowrap border-e border-border/60 pe-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Briefing · {month} · Day {day}
                </p>
                <div className="mb-ticker-viewport min-w-0 flex-1">
                    <div className="mb-ticker-track items-center">
                        <StatRun metrics={metrics} />
                        {/* Second copy exists only to make the loop seamless. */}
                        <StatRun metrics={metrics} duplicate />
                    </div>
                </div>
            </div>
        </section>
    );
}
