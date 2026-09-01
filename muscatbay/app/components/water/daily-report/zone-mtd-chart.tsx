"use client";

/**
 * Month-to-date cumulative balance for one zone: running Σ of the L2 bulk vs
 * the running Σ of its individual meters. Single days are noisy; a slow,
 * steady leak shows up here as a fan that keeps widening even when no single
 * day trips the alarm threshold.
 */

import { useMemo } from "react";
import {
    ComposedChart, Area, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { ChartShell, SafeResponsiveContainer as ResponsiveContainer } from "@/components/charts/chart-container";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { n } from "./inline-shared";
import { buildDailyGrid, buildZoneDaySeries, buildZoneMtd } from "./daily-metrics";
import { useChartMotion } from "@/hooks/useReducedMotion";

const TIP_STYLE = {
    fontSize: 12, borderRadius: 8,
    background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)",
} as const;

/** Loose value type matching Recharts' Formatter signature (mirrors the monthly dashboard). */
type TipValue = number | string | ReadonlyArray<number | string> | undefined;

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

    return (
        <ChartShell
            title={`Month-to-Date Cumulative Balance — ${activeZoneName}`}
            description={`Running totals for ${month}. Cumulative loss so far: ${n(last.cumLoss)} m³${last.cumSupply > 0 ? ` (${((last.cumLoss / last.cumSupply) * 100).toFixed(1)}% of zone supply)` : ""}.`}
            state="ready"
            interpretation="A widening gap between supply and metered consumption indicates a sustained loss pattern that needs field verification. Missing L2 days remain identified in the source data."
        >
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={data} margin={{ top: 6, right: 8, left: -6, bottom: 0 }}>
                        <defs>
                            <linearGradient id="mtd-supply" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--chart-teal)" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="var(--chart-teal)" stopOpacity={0.03} />
                            </linearGradient>
                            <linearGradient id="mtd-metered" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--chart-brand)" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="var(--chart-brand)" stopOpacity={0.03} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} minTickGap={16} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                        <Tooltip
                            formatter={(v: TipValue, name) => [`${n(Number(v))} m³`, String(name)]}
                            contentStyle={TIP_STYLE}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, color: "var(--foreground)" }} />
                        {selectedLabel && (
                            <ReferenceLine x={selectedLabel} stroke="var(--primary)" strokeDasharray="4 4" />
                        )}
                        <Area type="monotone" dataKey="cumSupply" name="Cumulative supply (L2)" stroke="var(--chart-teal)" strokeWidth={2} fill="url(#mtd-supply)" {...chartMotion}/>
                        <Area type="monotone" dataKey="cumMetered" name="Cumulative metered (ΣL3)" stroke="var(--chart-brand)" strokeWidth={2} fill="url(#mtd-metered)" {...chartMotion}/>
                        <Line type="monotone" dataKey="cumLoss" name="Cumulative loss" stroke="var(--chart-loss)" strokeWidth={2.5} dot={false} {...chartMotion}/>
                    </ComposedChart>
                </ResponsiveContainer>
        </ChartShell>
    );
}
