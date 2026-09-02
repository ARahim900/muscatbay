"use client";

// ─── Overview-tab chart pair — extracted verbatim from
//     app/firefighting/page.tsx. Pure relocation; no behaviour changes.
//
// Living here rather than in the route file does two jobs at once. It satisfies
// the layout rule (`app/` holds routes only; every module has one home under
// `components/<module>/`), and it gives `app/firefighting/page.tsx` a real
// module to hand `next/dynamic` — Recharts is ~330 kB and nothing on the route's
// first paint needs it, so the page loads this file lazily and keeps the library
// out of first-load JS.

import {
    BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
// Charts mount through the shared container, never Recharts' own
// ResponsiveContainer: it defers the plot until a ResizeObserver reports a real
// box and enforces a minHeight, so a parent that loses its fixed height can no
// longer produce a silent width(-1)/height(-1) blank chart.
import { ChartContainer } from "@/components/charts/chart-container";
import { Building2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_PALETTE } from "@/lib/tokens";
import { useChartMotion } from "@/hooks/useReducedMotion";
import { CARD_TITLE, CHART_TOOLTIP_STYLE, EQUIP_STATUS_CHART_COLORS } from "./firefighting-ui";

/** One bar per designated zone — the count of registered equipment in it. */
export interface EquipmentZonePoint {
    zone: string;
    count: number;
}

/** One donut slice per status value present in the live equipment register. */
export interface EquipmentStatusPoint {
    status: string;
    count: number;
}

interface EquipmentChartsProps {
    byZone: EquipmentZonePoint[];
    byStatus: EquipmentStatusPoint[];
}

export function EquipmentCharts({ byZone, byStatus }: EquipmentChartsProps) {
    const chartMotion = useChartMotion();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className={CARD_TITLE}><Building2 className="h-4 w-4 text-primary" aria-hidden="true" /> Equipment by Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[260px]">
                        <ChartContainer minHeight={260}>
                            <BarChart data={byZone} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                <XAxis dataKey="zone" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                                <YAxis tick={{ fontSize: 11, fill: "var(--chart-axis)" }} allowDecimals={false} />
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                <Bar dataKey="count" fill="var(--chart-inlet)" radius={[4, 4, 0, 0]} name="Equipment" {...chartMotion} />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className={CARD_TITLE}><ShieldCheck className="h-4 w-4 text-secondary" aria-hidden="true" /> Equipment by Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[260px]">
                        <ChartContainer minHeight={260}>
                            <PieChart>
                                <Pie
                                    data={byStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="count"
                                    nameKey="status"
                                    label={(props) => `${props.name}: ${props.value}`}
                                    labelLine={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
                                    {...chartMotion}
                                >
                                    {byStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={EQUIP_STATUS_CHART_COLORS[entry.status] || CHART_PALETTE[index % CHART_PALETTE.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                <Legend verticalAlign="bottom" height={36} iconSize={10} formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>} />
                            </PieChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
