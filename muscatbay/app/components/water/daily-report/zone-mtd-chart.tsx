"use client";

/**
 * Month-to-date cumulative balance for one zone: running Σ of the L2 bulk vs
 * the running Σ of its individual meters. Single days are noisy; a slow,
 * steady leak shows up here as a fan that keeps widening even when no single
 * day trips the alarm threshold.
 */

import { useMemo } from "react";
import {
    ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { TrendingDown } from "lucide-react";
import { ChartFrame, chartTheme, SectionCard } from "@/components/ui";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { n } from "./inline-shared";
import { buildDailyGrid, buildZoneDaySeries, buildZoneMtd } from "./daily-metrics";
import { useChartMotion } from "@/hooks/useReducedMotion";

/** Loose value type matching Recharts' Formatter signature (mirrors the monthly dashboard). */
type TipValue = number | string | ReadonlyArray<number | string> | undefined;

const SUPPLY = chartTheme.series[1];   // teal
const METERED = chartTheme.series[0];  // purple
const LOSS = chartTheme.loss;

export function ZoneMtdChart({
    monthData, activeZoneName, selectedDay, month,
}: {
    monthData: SupabaseDailyWaterConsumption[];
    activeZoneName: string;
    selectedDay: number;
    month: string;
}) {
    const chartMotion = useChartMotion();
    const data = useMemo(() => {
        const grid = buildDailyGrid(monthData);
        const series = buildZoneDaySeries(grid).find((s) => s.zoneName === activeZoneName);
        return series ? buildZoneMtd(series) : [];
    }, [monthData, activeZoneName]);

    if (data.length < 2) return null;

    const last = data[data.length - 1];
    const selectedLabel = data.find((p) => p.day === selectedDay)?.label;
    const lossShare = last.cumSupply > 0 ? ` (${((last.cumLoss / last.cumSupply) * 100).toFixed(1)}% of zone supply)` : "";

    return (
        <SectionCard>
            <SectionCard.Header
                icon={TrendingDown}
                title={`Month-to-date cumulative balance — ${activeZoneName}`}
                description={`Running totals for ${month} · a widening gap between the lines is a steady leak`}
            />
            <SectionCard.Body>
                <ChartFrame
                    series={3}
                    height="chart-lg"
                    legend={[
                        { label: "Cumulative supply (L2)", color: SUPPLY },
                        { label: "Cumulative metered (ΣL3)", color: METERED },
                        { label: "Cumulative loss", color: LOSS },
                    ]}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 6, right: 8, left: -6, bottom: 0 }}>
                            <CartesianGrid {...chartTheme.grid} />
                            <XAxis dataKey="label" {...chartTheme.axis} minTickGap={16} />
                            <YAxis {...chartTheme.axis} />
                            <Tooltip
                                formatter={(v: TipValue, name) => [`${n(Number(v))} m³`, String(name)]}
                                {...chartTheme.tooltip}
                            />
                            {selectedLabel && (
                                <ReferenceLine x={selectedLabel} stroke={chartTheme.series[0]} strokeDasharray="4 4" />
                            )}
                            <Area type="monotone" dataKey="cumSupply" name="Cumulative supply (L2)" stroke={SUPPLY} fill={SUPPLY} {...chartTheme.area} {...chartMotion} />
                            <Area type="monotone" dataKey="cumMetered" name="Cumulative metered (ΣL3)" stroke={METERED} fill={METERED} {...chartTheme.area} {...chartMotion} />
                            <Line type="monotone" dataKey="cumLoss" name="Cumulative loss" stroke={LOSS} {...chartTheme.line} {...chartMotion} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartFrame>
            </SectionCard.Body>
            <SectionCard.Footer tone={last.cumLoss > 0 ? "warning" : "neutral"}>
                Cumulative loss so far: {n(last.cumLoss)} m³{lossShare} · days with a missing L2 reading count as 0 supply
            </SectionCard.Footer>
        </SectionCard>
    );
}
