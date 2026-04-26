"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine, Legend, Line,
} from "recharts";
import { LiquidProgressRing } from "@/components/charts/liquid-progress-ring";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";
import { ZONE_BULK_CONFIG } from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { type ZoneAnalyticsPanelProps, CHART_COLORS, r2 } from "./report-types";

export function ZoneAnalyticsPanel({ reportData, monthData, selectedDay, month, activeZoneName }: ZoneAnalyticsPanelProps) {
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    const zoneRow = reportData.zoneRows.find(r => r.zoneName === activeZoneName) ?? null;
    const l2Value = zoneRow?.l2Value ?? 0;
    const l3Sum = zoneRow?.l3Sum ?? 0;
    const diff = zoneRow?.diff ?? null;

    const gaugeMax = Math.max(l2Value, l3Sum) * 1.2 || 100;
    const lossColor = diff !== null && diff > 0 ? CHART_COLORS.loss : CHART_COLORS.success;

    const trendData = useMemo(() => {
        const zc = ZONE_BULK_CONFIG.find(z => z.zoneName === activeZoneName) ?? ZONE_BULK_CONFIG[0];
        const results: { day: string; dayNum: number; 'L2 Bulk': number | null; 'ΣL3': number; Loss: number | null }[] = [];
        for (let day = 1; day <= 31; day++) {
            const dayCol = `day_${day}` as keyof SupabaseDailyWaterConsumption;
            const getVal = (acc: string): number | null => {
                const row = accountMap.get(acc);
                const v = row?.[dayCol];
                return v != null ? Number(v) : null;
            };
            const l2 = getVal(zc.l2Account);
            const l3 = zc.l3Accounts.reduce((s, a) => s + (getVal(a) ?? 0), 0);
            if (l2 === null && l3 === 0) continue;
            results.push({
                day: `D${String(day).padStart(2, '0')}`,
                dayNum: day,
                'L2 Bulk': l2 !== null ? r2(l2) : null,
                'ΣL3': r2(l3),
                Loss: l2 !== null ? r2(Math.max(0, l2 - l3)) : null,
            });
        }
        return results;
    }, [accountMap, activeZoneName]);

    const currentDayLabel = trendData.find(d => d.dayNum === selectedDay)?.day;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {activeZoneName} Analysis — Day {selectedDay}, {month}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span className="text-mb-secondary font-medium">L2 Bulk</span> = zone entry meter &bull;{" "}
                    <span className="text-mb-primary font-medium">ΣL3 Total</span> = sum of all L3 meters &bull;{" "}
                    <span style={{ color: CHART_COLORS.loss }} className="font-medium">Difference</span> = L2 &minus; ΣL3
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <LiquidProgressRing value={l2Value} max={gaugeMax} label="L2 Bulk Meter" sublabel="Total water entering zone"
                    color={CHART_COLORS.bulk} size={160} showPercentage={false} unit="m³" elementId="daily-gauge-1" />
                <LiquidProgressRing value={l3Sum} max={gaugeMax} label="ΣL3 Meters Total" sublabel="Recorded by L3 meters"
                    color={CHART_COLORS.individual} size={160} showPercentage={false} unit="m³" elementId="daily-gauge-2" />
                <LiquidProgressRing value={Math.abs(diff ?? 0)} max={l2Value || 100} label="Water Loss / Diff"
                    sublabel="Leakage, meter loss, etc." color={lossColor} size={160} showPercentage={true} elementId="daily-gauge-3" />
            </div>

            <Card className="card-elevated">
                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                    <CardTitle className="text-base sm:text-lg">Zone Daily Consumption Trend</CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Day-by-day comparison of L2 Bulk vs ΣL3 totals — {activeZoneName}, {month}
                    </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                    {trendData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-slate-400 dark:text-slate-500">
                            No trend data available for this zone
                        </div>
                    ) : (
                        <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradDailyBulk" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.bulk} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={CHART_COLORS.bulk} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradDailyL3" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.individual} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={CHART_COLORS.individual} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--chart-axis)" }} dy={10} interval={4} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                        label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }} />
                                    <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                    <Legend iconType="circle" />
                                    {currentDayLabel && (
                                        <ReferenceLine x={currentDayLabel} stroke={CHART_COLORS.individual}
                                            strokeDasharray="4 3" strokeWidth={1.5}
                                            label={{ value: `Day ${selectedDay}`, position: 'top', fontSize: 10, fill: CHART_COLORS.individual, fontWeight: 600 }} />
                                    )}
                                    <Area type="monotone" name="ΣL3 Total" dataKey="ΣL3"
                                        stroke={CHART_COLORS.individual} fill="url(#gradDailyL3)" strokeWidth={3}
                                        activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }} animationDuration={600} />
                                    <Line type="monotone" name="Loss" dataKey="Loss"
                                        stroke={CHART_COLORS.loss} strokeWidth={2} dot={false} strokeDasharray="5 5" animationDuration={600} />
                                    <Area type="monotone" name="L2 Bulk" dataKey="L2 Bulk"
                                        stroke={CHART_COLORS.bulk} fill="url(#gradDailyBulk)" strokeWidth={3}
                                        activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }} animationDuration={600} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
