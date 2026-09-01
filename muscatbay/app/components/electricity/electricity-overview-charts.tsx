"use client";

// ─── Overview-tab chart row — extracted verbatim from
//     app/electricity/page.tsx. Pure relocation; no behavior changes.

import {
    AreaChart, Area, XAxis, YAxis,
    Tooltip, BarChart, Bar, Cell,
    Legend, ReferenceLine,
} from "recharts";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";
import { ELECTRICITY_RATES, ELECTRICITY_TARGETS } from "@/lib/config";
import { CHART_COLORS } from "./electricity-shared";
import { useChartMotion } from "@/hooks/useReducedMotion";
import { ChartContainer, ChartShell } from "@/components/charts/chart-container";

interface MonthlyPoint {
    month: string;
    consumption: number;
}

interface TypePoint {
    type: string;
    value: number;
    color: string;
}

interface OverviewChartsProps {
    filteredMonthlyData: MonthlyPoint[];
    consumptionByType: TypePoint[];
}

export function ElectricityOverviewCharts({ filteredMonthlyData, consumptionByType }: OverviewChartsProps) {
    const chartMotion = useChartMotion();
    // Management decision support: without a reference the trend is only an
    // average of itself. The target is a CONFIGURED value (lib/config.ts) — when
    // none has been agreed we say so instead of inventing one, and derive the
    // kWh line from the budget only when a real budget exists.
    const targetKWh = ELECTRICITY_TARGETS.MONTHLY_TARGET_KWH
        ?? (ELECTRICITY_TARGETS.MONTHLY_BUDGET_OMR !== null
            ? ELECTRICITY_TARGETS.MONTHLY_BUDGET_OMR / ELECTRICITY_RATES.RATE_PER_KWH
            : null);

    return (
        // 3/5 and 2/5 of the same row at lg, full width when stacked — three
        // different widths at two viewports. Each Card is its own `@container`
        // so the plot area sizes from the card it lives in rather than from the
        // window; the grid stays viewport-driven (how many columns fit is a
        // device question).
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-5">
            <ChartShell
                className="@container lg:col-span-3"
                title="Monthly Consumption Trend"
                description={targetKWh !== null
                    ? `Dashed line = the configured monthly target of ${Math.round(targetKWh).toLocaleString("en-US")} kWh (${(targetKWh * ELECTRICITY_RATES.RATE_PER_KWH).toLocaleString("en-US", { maximumFractionDigits: 0 })} OMR at ${ELECTRICITY_RATES.RATE_PER_KWH} OMR/kWh).`
                    : `No monthly consumption target or budget has been configured, so this trend has no reference line — it can only be compared with its own history. ${ELECTRICITY_TARGETS.SOURCE_NOTE}.`}
                state={filteredMonthlyData.length > 0 ? "ready" : "empty"}
                interpretation="Use the latest movement and any configured target variance to prioritise meter review."
            >
                    <div role="img" aria-label="Monthly electricity consumption trend: area chart showing kilowatt-hour usage over selected date range" className="h-[220px] @sm:h-[260px] @md:h-[300px] min-h-[260px]">
                        <ChartContainer minHeight={260}>
                            <AreaChart data={filteredMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} dy={10} />
                                <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }} />
                                <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'var(--chart-cursor-stroke)', strokeWidth: 2 }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                                {targetKWh !== null && (
                                    <ReferenceLine
                                        y={targetKWh}
                                        stroke="var(--mb-success)"
                                        strokeDasharray="6 4"
                                        strokeWidth={2}
                                        ifOverflow="extendDomain"
                                        label={{ value: 'Target', position: 'right', fill: 'var(--chart-axis)', fontSize: 11, fontWeight: 600 }}
                                    />
                                )}
                                <Area type="natural" dataKey="consumption" name="Consumption" stroke={CHART_COLORS.primary} fill="url(#elecGrad)" strokeWidth={3} activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }} {...chartMotion}/>
                            </AreaChart>
                        </ChartContainer>
                    </div>
            </ChartShell>

            <ChartShell
                className="@container lg:col-span-2"
                title="Consumption by Type"
                description="Selected-period consumption grouped by meter category."
                state={consumptionByType.length > 0 ? "ready" : "empty"}
                interpretation="The largest category is the first place to investigate material demand changes."
            >
                    <div role="img" aria-label="Electricity consumption by type: horizontal bar chart breaking down kilowatt-hour usage across meter categories" className="h-[220px] @sm:h-[260px] @md:h-[300px] min-h-[260px]">
                        <ChartContainer minHeight={260}>
                            <BarChart data={consumptionByType} layout="vertical" margin={{ left: 10 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="type" width={80} className="text-xs" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)" }} />
                                <Tooltip content={<LiquidTooltip />} cursor={{ fill: 'var(--chart-cursor-fill)', radius: 6 }} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} {...chartMotion}>
                                    {consumptionByType.map((entry, index) => (
                                        <Cell key={`c-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </div>
            </ChartShell>
        </div>
    );
}
