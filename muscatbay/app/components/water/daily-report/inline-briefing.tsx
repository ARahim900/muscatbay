"use client";

import {
    Droplets, Gauge, TrendingDown, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown, Minus,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTickerLoop } from "@/hooks/useTickerLoop";
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
        <li className="flex items-center gap-1.5" title={title}>
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: iconColor }} aria-hidden="true" />
            <span className="mb-ticker-label">{label}</span>
            <span className={cn("mb-ticker-value", valueClassName)}>{value}</span>
        </li>
    );
}

/** The run of five stats — rendered twice for the seamless ticker loop. */
function StatRun({ metrics, duplicate, runRef }: { metrics: BriefingMetrics; duplicate?: boolean; runRef?: (n: HTMLElement | null) => void }) {
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
            ref={runRef}
            className="mb-ticker-copy flex list-none items-center gap-x-8 pr-8"
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
    // Same measurement as the shared ticker: the run is repeated until half
    // the track is viewport-wide, so the loop is seamless and always moving.
    const { viewportRef, runRef, trackProps, repeat } = useTickerLoop();

    return (
        <section aria-label="Daily briefing" className="mb-ticker-note">
            <p className="mb-ticker-note__caption">Briefing · {month} · Day {day}</p>
            <div className="flex min-w-0 flex-1 items-center px-3">
                <div ref={viewportRef} className="mb-ticker-viewport min-w-0 flex-1">
                    <div className="mb-ticker-track items-center" {...trackProps}>
                        {/* Only the first copy is measured or read aloud; the rest
                            exist to keep the viewport covered mid-cycle. */}
                        {Array.from({ length: repeat * 2 }, (_, i) => (
                            <StatRun key={i} metrics={metrics} duplicate={i > 0} runRef={i === 0 ? runRef : undefined} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
