"use client";

/**
 * ZoneDayBreakdownChart — where one day's zone supply went.
 *
 * Sits beside the "Zone daily consumption trend" chart in Zone Analysis. The
 * trend answers "when"; this answers "who": the L2 bulk reading split into the
 * zone's largest individual (L3) meters, the rest folded into "Other", and the
 * unmetered balance (L2 − ΣL3) ranked alongside them in the loss colour. When
 * the loss bar outranks every meter, the zone's biggest consumer is the ground.
 *
 * Honest by construction: an unread bulk meter means no loss bar and a footer
 * that says so; unread L3 meters are counted, never treated as 0 consumption.
 */

import { useMemo } from "react";
import {
    ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Layers } from "lucide-react";
import { ChartFrame, chartTheme, SectionCard } from "@/components/ui";
import { ZONE_BULK_CONFIG } from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { n } from "./inline-shared";
import {
    buildDailyGrid, buildZoneDayBreakdown, dailySeverity, SEVERITY_LABEL,
    type BreakdownBar, type DailySeverity, type ZoneDayBreakdown,
} from "./daily-metrics";
import { useChartMotion } from "@/hooks/useReducedMotion";

const METERED = chartTheme.series[0];  // purple — the ΣL3 colour in the trend chart beside it
const LOSS = chartTheme.loss;

/** Axis labels are clipped to keep the label column narrow; the tooltip carries the full name. */
const AXIS_LABEL_MAX = 18;
const clip = (s: string): string => (s.length > AXIS_LABEL_MAX ? `${s.slice(0, AXIS_LABEL_MAX)}…` : s);

type Row = BreakdownBar & { axis: string };

/** Loose value type matching Recharts' Formatter signature. */
type TipValue = number | string | ReadonlyArray<number | string> | undefined;

type FooterTone = "neutral" | "success" | "warning" | "danger" | "info";

/** Footer dot per severity band — the same bands the Exceptions register uses. */
const TONE_BY_SEVERITY: Record<DailySeverity, FooterTone> = {
    nodata: "neutral", check: "warning", good: "success", moderate: "warning", high: "danger", critical: "danger",
};

/** One footer line: the day's balance in words. */
function describe(b: ZoneDayBreakdown, day: number): { tone: FooterTone; text: string } {
    const unread = b.unread > 0 ? ` · ${b.unread} meter${b.unread === 1 ? "" : "s"} not read` : "";
    if (!b.hasData) return { tone: "neutral", text: `No L2 or L3 readings recorded for Day ${day}` };
    if (b.l2 === null) {
        return { tone: "neutral", text: `L2 bulk not read on Day ${day} — the unmetered share cannot be computed${unread}` };
    }
    const loss = b.loss ?? 0;
    const pct = b.l2 > 0 ? (loss / b.l2) * 100 : null;
    const severity = dailySeverity(loss, pct);
    const tone = TONE_BY_SEVERITY[severity];
    if (severity === "check") {
        return { tone, text: `Meters read ${n(Math.abs(loss))} m³ more than the ${n(b.l2)} m³ bulk — check meters${unread}` };
    }
    if (loss <= 0) return { tone, text: `Balanced — ΣL3 matches the ${n(b.l2)} m³ bulk${unread}` };
    const share = pct !== null ? ` · ${pct.toFixed(1)}% of the ${n(b.l2)} m³ bulk` : "";
    return { tone, text: `Unmetered loss ${n(loss)} m³${share} · ${SEVERITY_LABEL[severity]}${unread}` };
}

interface Props {
    monthData: SupabaseDailyWaterConsumption[];
    activeZoneName: string;
    selectedDay: number;
    month: string;
}

export function ZoneDayBreakdownChart({ monthData, activeZoneName, selectedDay, month }: Props) {
    const chartMotion = useChartMotion();

    const breakdown = useMemo(() => {
        const zone = ZONE_BULK_CONFIG.find((z) => z.zoneName === activeZoneName) ?? ZONE_BULK_CONFIG[0];
        return buildZoneDayBreakdown(buildDailyGrid(monthData), zone, selectedDay);
    }, [monthData, activeZoneName, selectedDay]);

    const rows: Row[] = breakdown.bars.map((b) => ({ ...b, axis: clip(b.label) }));
    const footer = describe(breakdown, selectedDay);

    return (
        <SectionCard>
            <SectionCard.Header
                icon={Layers}
                title={`Where the water went — Day ${selectedDay}`}
                description={`${activeZoneName}, ${month} · largest consumers first, unmetered loss ranked alongside`}
            />
            <SectionCard.Body>
                {rows.length === 0 ? (
                    <div className="flex h-chart items-center justify-center text-body text-muted">
                        No readings recorded for Day {selectedDay}
                    </div>
                ) : (
                    <ChartFrame
                        series={2}
                        legend={[
                            { label: "Metered (L3)", color: METERED },
                            { label: "Unmetered loss", color: LOSS },
                        ]}
                    >
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid {...chartTheme.grid} vertical horizontal={false} />
                                <XAxis type="number" {...chartTheme.axis} />
                                <YAxis
                                    type="category" dataKey="axis" {...chartTheme.axis}
                                    tick={{ fontSize: 11, fill: "var(--color-fg)" }} width={120} interval={0}
                                />
                                <Tooltip
                                    formatter={(v: TipValue, _name, item) => {
                                        const bar = (item?.payload ?? null) as BreakdownBar | null;
                                        const share = bar?.shareOfSupply ?? null;
                                        return [
                                            `${n(Number(v))} m³${share !== null ? ` · ${share.toFixed(1)}% of bulk` : ""}`,
                                            bar?.kind === "loss" ? "Unmetered" : "Metered",
                                        ];
                                    }}
                                    labelFormatter={(label, payload) =>
                                        (payload?.[0]?.payload as BreakdownBar | undefined)?.label ?? String(label)}
                                    {...chartTheme.tooltip}
                                />
                                <Bar dataKey="value" {...chartTheme.bar} radius={[0, 4, 4, 0]} barSize={14} {...chartMotion}>
                                    {rows.map((r) => (
                                        <Cell key={r.key} fill={r.kind === "loss" ? LOSS : METERED} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartFrame>
                )}
            </SectionCard.Body>
            <SectionCard.Footer tone={footer.tone}>{footer.text}</SectionCard.Footer>
        </SectionCard>
    );
}
