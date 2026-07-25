"use client";

import {
    Droplets, Gauge, TrendingDown, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown, Minus,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { n } from "./inline-shared";
import type { BriefingMetrics } from "./briefing-metrics";

/**
 * Day-over-day change, written so the direction is unambiguous.
 *
 * A bare "+3.2%" forces the reader to work out what moved and whether up is
 * good. Water use rising is not automatically bad, so the phrasing states the
 * movement and leaves the judgement to the zone status beside it.
 */
function changeVsYesterday(v: number | null): string {
    if (v === null) return "No reading yesterday";
    const magnitude = Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (Math.abs(v) < 0.05) return "Same as yesterday";
    return v > 0 ? `${magnitude}% more used` : `${magnitude}% less used`;
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
    const { totalSupply, l2Total, l3Total, lossM3, lossPct, alarmCount, alarmZones, zoneCount, vsYesterdayPct, status } = metrics;

    const isWarning = status === "warning";
    // Points with the movement; a flat/absent comparison gets the neutral glyph
    // rather than an arrow implying a direction the data does not support.
    const TrendIcon =
        vsYesterdayPct === null || Math.abs(vsYesterdayPct) < 0.05
            ? Minus
            : vsYesterdayPct < 0
              ? ArrowDown
              : ArrowUp;

    return (
        // pr matches gap-x so both copies have identical width — the −50%
        // keyframe then lands exactly on the seam and the loop is invisible.
        <ul
            className="mb-ticker-copy flex list-none items-center gap-x-10 pr-10"
            aria-hidden={duplicate ? "true" : undefined}
        >
            <Stat
                icon={Droplets}
                label="Water supplied today"
                value={<>{n(totalSupply)} <span className="text-xs font-medium text-muted-foreground">m³</span></>}
                iconColor="var(--module-water)"
                title="Zone bulk meters plus direct connections. Daily data carries no NAMA main-bulk reading, so this is what entered the distribution network — not total network supply."
            />
            <Stat
                icon={Gauge}
                label="Recorded at meters"
                value={
                    <>
                        {n(l3Total)} <span className="text-xs font-medium text-muted-foreground">of</span> {n(l2Total)}{" "}
                        <span className="text-xs font-medium text-muted-foreground">m³</span>
                    </>
                }
                iconColor="var(--status-info)"
                title="Sum of the individual property meters, against the zone bulk meters feeding them. The difference between the two is the loss."
            />
            <Stat
                icon={TrendingDown}
                label="Unaccounted water"
                value={
                    lossPct === null
                        ? `${n(lossM3)} m³ lost`
                        : `${n(lossM3)} m³ lost · ${lossPct.toFixed(1)}% of supply`
                }
                // Calm by default: amber only when a zone is actually in alarm.
                valueClassName={isWarning ? "text-mb-warning-text" : undefined}
                iconColor={isWarning ? "var(--status-warning)" : "var(--module-water)"}
                title="Water that entered the zones but was not recorded at any property meter — leaks, unmetered use or meter error."
            />
            {alarmCount > 0 ? (
                <Stat
                    icon={AlertTriangle}
                    label="Zones needing attention"
                    value={`${alarmCount} of ${zoneCount} · ${alarmZones.map(shortZone).join(", ")}`}
                    valueClassName="text-mb-danger-text"
                    iconColor="var(--status-danger)"
                    title={`Above the daily loss threshold: ${alarmZones.join(", ")}`}
                />
            ) : (
                <Stat
                    icon={CheckCircle2}
                    label="Zones needing attention"
                    value={zoneCount > 0 ? `None — all ${zoneCount} zones normal` : "No zone data today"}
                    valueClassName={zoneCount > 0 ? "text-mb-success-text" : undefined}
                    iconColor={zoneCount > 0 ? "var(--status-normal)" : "var(--status-missing)"}
                />
            )}
            <Stat
                icon={TrendIcon}
                label="Compared with yesterday"
                value={changeVsYesterday(vsYesterdayPct)}
                iconColor="var(--status-info)"
                title="Change in the total water supplied, against the previous day."
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
