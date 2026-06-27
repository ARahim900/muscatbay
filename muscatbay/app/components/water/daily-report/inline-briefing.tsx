"use client";

import { Droplets, TrendingDown, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import { StatsGrid, type StatItem } from "@/components/shared/stats-grid";
import { n } from "./inline-shared";
import type { BriefingMetrics } from "./briefing-metrics";

/** Format a signed percentage, or em dash when null. */
function pct(v: number | null): string {
    if (v === null) return "—";
    const sign = v > 0 ? "+" : "";
    return `${sign}${v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function DailyBriefing({
    metrics, month, day,
}: {
    metrics: BriefingMetrics;
    month: string;
    day: number;
}) {
    const { totalSupply, lossM3, lossPct, alarmCount, alarmZones, vsYesterdayPct, status } = metrics;

    const isWarning = status === "warning";
    // null → neutral up arrow placeholder; otherwise points with the movement.
    const TrendIcon = vsYesterdayPct !== null && vsYesterdayPct < 0 ? ArrowDown : ArrowUp;

    // Unified KPI cards — same shared StatsGrid the rest of the app uses, so the
    // daily briefing reads as one system with every other section. The alarm-zone
    // list now lives calmly in the "Zones in Alarm" subtitle (replacing the loud
    // amber banner) instead of shouting from a full-width callout.
    const stats: StatItem[] = [
        {
            label: "Total Supply",
            value: `${n(totalSupply)} m³`,
            icon: Droplets,
            variant: "water",
            subtitle: "Total entering the network",
        },
        {
            label: "Distribution Loss",
            value: lossPct === null ? `${n(lossM3)} m³` : `${n(lossM3)} m³ · ${lossPct.toFixed(1)}%`,
            icon: TrendingDown,
            // Calm by default: amber only when a zone is actually in alarm.
            variant: isWarning ? "warning" : "water",
            subtitle: "Zone bulk (L2) vs sub-meters (L3)",
        },
        {
            label: "Zones in Alarm",
            value: String(alarmCount),
            icon: AlertTriangle,
            variant: alarmCount > 0 ? "danger" : "success",
            subtitle: alarmCount > 0 ? alarmZones.join(", ") : "All zones within tolerance",
        },
        {
            label: "vs. Yesterday",
            value: pct(vsYesterdayPct),
            icon: TrendIcon,
            variant: "info",
            subtitle: "Day-over-day supply",
        },
    ];

    return (
        <section aria-label="Daily briefing" className="space-y-3">
            <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Daily Briefing
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {month} · Day {day}
                </span>
            </div>

            <StatsGrid stats={stats} />
        </section>
    );
}
