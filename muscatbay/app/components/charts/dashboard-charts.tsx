"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, ArrowUpRight, Recycle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, ReferenceLine } from "recharts";
import { LiquidTooltip } from "./liquid-tooltip";
import { ChartContainer } from "./chart-container";
import { AnimateOnScroll } from "@/components/shared/scroll-animation";
import type { ChartData } from "@/hooks/useDashboardData";

const CHART_COLORS = { teal: 'var(--chart-teal)', brand: 'var(--chart-brand)' } as const;

// Stable object refs — avoids new-object-per-render diffing
const AXIS_TICK = { fontSize: 11, fill: "var(--chart-axis)" } as const;
const AXIS_TICK_SM = { fontSize: 10, fill: "var(--chart-axis)" } as const;
const Y_AXIS_LABEL = { value: 'k m³', angle: -90, position: 'insideLeft' as const, style: { textAnchor: 'middle' as const, fill: 'var(--chart-axis)', fontSize: 11 } };
const AREA_CURSOR = { stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 } as const;
const BAR_CURSOR = { fill: 'rgba(0,0,0,0.04)', radius: 4 } as const;
const WATER_ACTIVE_DOT = { r: 6, stroke: '#fff', strokeWidth: 2 } as const;
const LEGEND_STYLE = { paddingTop: 10 } as const;
const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

interface DashboardChartsProps {
    chartData: ChartData[];
    stpChartData: ChartData[];
}

const REFERENCE_LINE_LABEL = { position: 'insideTopRight' as const, fontSize: 10, fill: 'var(--chart-axis)', dy: -4 };

function DashboardChartsInner({ chartData, stpChartData }: DashboardChartsProps) {
    const waterAvg = chartData.length > 0
        ? chartData.reduce((sum, d) => sum + ((d.water as number) || 0), 0) / chartData.length
        : 0;

    return (
        <AnimateOnScroll className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-7">
            <Link href="/water" aria-label="View water production details" className="col-span-1 lg:col-span-4 group/chart">
                <Card
                    interactive
                    className="card-elevated transition-shadow duration-200 hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                >
                    <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Droplets className="h-5 w-5 text-mb-secondary" />
                            Water Production Trend
                            <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground opacity-40 group-hover/chart:opacity-100 transition-opacity" />
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground">Monthly water production in thousand m³</p>
                    </CardHeader>
                    <div role="img" aria-label="Water production monthly trend chart in thousand cubic meters">
                        <ChartContainer height="100%" className="h-[200px] sm:h-[250px] md:h-[300px]">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" opacity={0.5} />
                                <XAxis dataKey="month" className="text-xs" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={10} />
                                <YAxis className="text-xs" tick={AXIS_TICK} axisLine={false} tickLine={false} label={Y_AXIS_LABEL} />
                                <Tooltip content={<LiquidTooltip />} cursor={AREA_CURSOR} />
                                <Legend iconType="circle" wrapperStyle={LEGEND_STYLE} />
                                <Area type="monotone" dataKey="water" stroke={CHART_COLORS.teal} fill="url(#colorWater)" name="Water (k m³)" strokeWidth={3} activeDot={WATER_ACTIVE_DOT} animationDuration={200} />
                                {waterAvg > 0 && (
                                    <ReferenceLine y={waterAvg} stroke="var(--status-warning)" strokeDasharray="5 3" strokeWidth={1.5} label={{ ...REFERENCE_LINE_LABEL, value: `Avg ${waterAvg.toFixed(1)}k` }} />
                                )}
                            </AreaChart>
                        </ChartContainer>
                    </div>
                </Card>
            </Link>

            <Link href="/stp" aria-label="View STP treatment details" className="col-span-1 lg:col-span-3 group/chart">
                <Card
                    interactive
                    className="card-elevated transition-shadow duration-200 hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                >
                    <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Recycle className="h-5 w-5 text-mb-primary" />
                            STP Treatment Overview
                            <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground opacity-40 group-hover/chart:opacity-100 transition-opacity" />
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground">Monthly inlet vs TSE output (k m³)</p>
                    </CardHeader>
                    <div role="img" aria-label="STP monthly inlet vs TSE output comparison bar chart">
                        <ChartContainer height="100%" className="h-[200px] sm:h-[250px] md:h-[300px]">
                            <BarChart data={stpChartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" opacity={0.5} />
                                <XAxis dataKey="month" className="text-xs" tick={AXIS_TICK_SM} axisLine={false} tickLine={false} dy={10} />
                                <YAxis className="text-xs" tick={AXIS_TICK_SM} axisLine={false} tickLine={false} />
                                <Tooltip content={<LiquidTooltip />} cursor={BAR_CURSOR} />
                                <Legend iconType="circle" />
                                <Bar dataKey="inlet" name="Inlet" fill="var(--chart-inlet)" radius={BAR_RADIUS} animationDuration={200} />
                                <Bar dataKey="tse" name="TSE Output" fill={CHART_COLORS.teal} radius={BAR_RADIUS} animationDuration={200} />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </Card>
            </Link>
        </AnimateOnScroll>
    );
}

const DashboardCharts = React.memo(DashboardChartsInner);
export default DashboardCharts;
