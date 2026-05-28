"use client";

// ─── Overview-tab chart row — extracted verbatim from
//     app/electricity/page.tsx. Pure relocation; no behavior changes.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    Tooltip, BarChart, Bar, Cell,
    Legend,
} from "recharts";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";
import { CHART_COLORS } from "./electricity-shared";

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
    return (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Monthly Consumption Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <div role="img" aria-label="Monthly electricity consumption trend: area chart showing kilowatt-hour usage over selected date range" className="h-[220px] sm:h-[260px] md:h-[300px] min-h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
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
                                <Area type="natural" dataKey="consumption" name="Consumption" stroke={CHART_COLORS.primary} fill="url(#elecGrad)" strokeWidth={3} activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }} animationDuration={600} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Consumption by Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <div role="img" aria-label="Electricity consumption by type: horizontal bar chart breaking down kilowatt-hour usage across meter categories" className="h-[220px] sm:h-[260px] md:h-[300px] min-h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={consumptionByType} layout="vertical" margin={{ left: 10 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="type" width={80} className="text-xs" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)" }} />
                                <Tooltip content={<LiquidTooltip />} cursor={{ fill: 'var(--chart-cursor-fill)', radius: 6 }} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} animationDuration={600}>
                                    {consumptionByType.map((entry, index) => (
                                        <Cell key={`c-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
