"use client";

import {
    Droplets, Gauge, TrendingDown, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown, Minus,
    type LucideIcon,
} from "lucide-react";
import { SectionCard } from "@/components/ui";
import { cn } from "@/lib/cn";
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
 * One briefing stat: eyebrow label with a 16 px icon, value beneath. The strip
 * summarises; the zone table below is the working surface.
 */
function Stat({
    icon: Icon, label, value, valueClassName, iconClassName, title,
}: {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode;
    valueClassName?: string;
    iconClassName: string;
    title?: string;
}) {
    return (
        <li className="min-w-0" title={title}>
            <p className="flex items-center gap-1.5 text-eyebrow uppercase text-muted">
                <Icon size={16} strokeWidth={2} className={cn("shrink-0", iconClassName)} aria-hidden="true" />
                <span className="truncate">{label}</span>
            </p>
            <p className={cn("mt-1 text-label text-fg", valueClassName)}>{value}</p>
        </li>
    );
}

/**
 * Daily briefing — the five distribution-level figures for the selected day in
 * one static card (the former news-ticker strip is gone: DESIGN_SYSTEM.md rule 7,
 * ticker / marquee strips do not exist). Labels stay distribution-level — the
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
        <SectionCard>
            <SectionCard.Header icon={Droplets} title={`Briefing · ${month} · Day ${day}`} />
            <SectionCard.Body>
                <ul className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Stat
                        icon={Droplets}
                        iconClassName="text-mod-water"
                        label="Water supplied today"
                        value={<>{n(totalSupply)} <span className="text-caption text-muted">m³</span></>}
                        title="Zone bulk meters plus direct connections. Daily data carries no NAMA main-bulk reading, so this is what entered the distribution network — not total network supply."
                    />
                    <Stat
                        icon={Gauge}
                        iconClassName="text-info"
                        label="Recorded at meters"
                        value={
                            <>
                                {n(l3Total)} <span className="text-caption text-muted">of</span> {n(l2Total)}{" "}
                                <span className="text-caption text-muted">m³</span>
                            </>
                        }
                        title="Sum of the individual property meters, against the zone bulk meters feeding them. The difference between the two is the loss."
                    />
                    <Stat
                        icon={TrendingDown}
                        // Calm by default: amber only when a zone is actually in alarm.
                        iconClassName={isWarning ? "text-warning" : "text-mod-water"}
                        label="Unaccounted water"
                        value={
                            lossPct === null
                                ? `${n(lossM3)} m³ lost`
                                : `${n(lossM3)} m³ lost · ${lossPct.toFixed(1)}% of supply`
                        }
                        valueClassName={isWarning ? "text-warning" : undefined}
                        title="Water that entered the zones but was not recorded at any property meter — leaks, unmetered use or meter error."
                    />
                    {alarmCount > 0 ? (
                        <Stat
                            icon={AlertTriangle}
                            iconClassName="text-danger"
                            label="Zones needing attention"
                            value={`${alarmCount} of ${zoneCount} · ${alarmZones.map(shortZone).join(", ")}`}
                            valueClassName="text-danger"
                            title={`Above the daily loss threshold: ${alarmZones.join(", ")}`}
                        />
                    ) : (
                        <Stat
                            icon={CheckCircle2}
                            iconClassName={zoneCount > 0 ? "text-success" : "text-neutral"}
                            label="Zones needing attention"
                            value={zoneCount > 0 ? `None — all ${zoneCount} zones normal` : "No zone data today"}
                            valueClassName={zoneCount > 0 ? "text-success" : undefined}
                        />
                    )}
                    <Stat
                        icon={TrendIcon}
                        iconClassName="text-info"
                        label="Compared with yesterday"
                        value={changeVsYesterday(vsYesterdayPct)}
                        title="Change in the total water supplied, against the previous day."
                    />
                </ul>
            </SectionCard.Body>
        </SectionCard>
    );
}
