"use client";

// ─── ZoneAnalyticsPanel — the zone drill-down for the Daily report.

import { useMemo } from "react";
import {
    ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine, Line, CartesianGrid,
} from "recharts";
import { LiquidProgressRing } from "@/components/charts/liquid-progress-ring";
import { ChartFrame, chartTheme, SectionCard } from "@/components/ui";
import { ZONE_BULK_CONFIG } from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import {
    type ReportData,
    CHART_COLORS, r2, n, DailyLossConnector,
} from "./inline-shared";
import { ZoneDayBreakdownChart } from "./zone-day-breakdown-chart";
import { useChartMotion } from "@/hooks/useReducedMotion";

export { ZoneAnalyticsPanel };

// ─── Zone Analytics Panel ─────────────────────────────────────────────────────

interface ZoneAnalyticsPanelProps {
    reportData: ReportData;
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    month: string;
    activeZoneName: string;
}

/** Loose value type matching Recharts' Formatter signature. */
type TipValue = number | string | ReadonlyArray<number | string> | undefined;
const fmtM3 = (v: TipValue, name: number | string | undefined): [string, string] =>
    [v == null ? "—" : `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })} m³`, String(name)];

function ZoneAnalyticsPanel({ reportData, monthData, selectedDay, month, activeZoneName }: ZoneAnalyticsPanelProps) {
    const chartMotion = useChartMotion();

    // O(1) lookup map keyed by account_number
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    // Active zone report row. `l2Value` stays `null` when the zone bulk meter
    // was not read — rendering that as a 0 gauge implied "no water entered the
    // zone", which is a completely different (and wrong) statement.
    const zoneRow = reportData.zoneRows.find(r => r.zoneName === activeZoneName) ?? null;
    const l2Value = zoneRow?.l2Value ?? null;
    const l3Sum = zoneRow?.l3Sum ?? 0;
    const diff = zoneRow?.diff ?? null;
    const l2Missing = l2Value === null;

    // Shared gauge scale (same as Zone Analysis page)
    const gaugeMax = Math.max(l2Value ?? 0, l3Sum) * 1.2 || 100;

    // 31-day trend for the active zone
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
                // Not clamped at 0. A negative value means ΣL3 exceeded the zone
                // bulk — an over-reading L3 or an under-reading L2 — and the
                // Exceptions register flags exactly that as Critical. Hiding it
                // here made the chart contradict the register.
                Loss: l2 !== null ? r2(l2 - l3) : null,
            });
        }
        return results;
    }, [accountMap, activeZoneName]);

    const currentDayLabel = trendData.find(d => d.dayNum === selectedDay)?.day;

    // Month-to-date balance for the trend card's footer. Only days with a bulk
    // reading enter BOTH sums, so an unread L2 day is skipped rather than
    // counted as 0 supply (missing ≠ zero). This replaced the separate
    // cumulative-balance chart on 2026-09-03 at the owner's request.
    const mtd = useMemo(() => {
        let supply = 0;
        let metered = 0;
        let days = 0;
        for (const d of trendData) {
            if (d['L2 Bulk'] === null) continue;
            supply += d['L2 Bulk'];
            metered += d['ΣL3'];
            days++;
        }
        const loss = r2(supply - metered);
        return { supply: r2(supply), loss, days, pct: supply > 0 ? (loss / supply) * 100 : null };
    }, [trendData]);

    const mtdFooter: { tone: 'neutral' | 'success' | 'warning' | 'danger'; text: string } = (() => {
        if (mtd.days === 0) {
            return { tone: 'neutral', text: 'No bulk readings this month — the month-to-date balance cannot be computed' };
        }
        // One line in a 40 px footer at half width: keep it under ~80 characters.
        // The supply total itself is in the L2 Bulk tile directly below.
        const over = `${mtd.days} day${mtd.days === 1 ? '' : 's'} with a bulk reading`;
        if (mtd.loss < 0) {
            return { tone: 'warning', text: `Month to date: ΣL3 exceeds the bulk by ${n(Math.abs(mtd.loss))} m³ · ${over} · check meters` };
        }
        const share = mtd.pct !== null ? ` · ${mtd.pct.toFixed(1)}% of supply` : '';
        const tone = mtd.pct !== null && mtd.pct >= 25 ? 'danger' : mtd.pct !== null && mtd.pct >= 10 ? 'warning' : 'success';
        return { tone, text: `Month to date: ${n(mtd.loss)} m³ unmetered${share} · ${over}` };
    })();

    return (
        <div className="space-y-6">

            {/* ── Zone heading ─────────────────────────────────────────────── */}
            <div>
                <h2 className="text-title text-primary dark:text-fg">
                    {activeZoneName} Analysis — Day {selectedDay}, {month}
                </h2>
                <p className="mt-1 text-body text-muted">
                    <span className="font-medium text-fg">L2 Bulk</span> = zone entry meter &bull;{" "}
                    <span className="font-medium text-fg">ΣL3 Total</span> = sum of all L3 meters &bull;{" "}
                    <span className="font-medium text-danger">Difference</span> = L2 &minus; ΣL3
                </p>
            </div>

            {/* ── Two gauges with the loss written in between (supply → use) ─── */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 md:gap-10">
                {l2Missing ? (
                    // Honest stand-in for the gauge: an unread bulk meter is not
                    // "0 m³ entered the zone", and no loss can be derived from it.
                    <div
                        className="flex flex-col items-center justify-center rounded-pill border border-dashed border-line text-center"
                        style={{ width: 160, height: 160 }}
                        role="img"
                        aria-label="L2 bulk meter: no reading recorded for this day"
                    >
                        <span className="text-label text-muted">No reading</span>
                        <span className="mt-1 max-w-32 text-caption text-muted">
                            L2 bulk meter not read — zone loss cannot be computed
                        </span>
                    </div>
                ) : (
                    <LiquidProgressRing
                        value={l2Value}
                        max={gaugeMax}
                        label="L2 Bulk Meter"
                        sublabel="Total water entering zone"
                        color={CHART_COLORS.teal}
                        size={160}
                        showPercentage={false}
                        unit="m³"
                        elementId="daily-gauge-1"
                    />
                )}
                <DailyLossConnector loss={diff} of={l2Value ?? 0} />
                <LiquidProgressRing
                    value={l3Sum}
                    max={gaugeMax}
                    label="ΣL3 Meters Total"
                    sublabel="Recorded by L3 meters"
                    color={CHART_COLORS.brand}
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-gauge-2"
                />
            </div>

            {/* ── Half-width pair: where the day's water went (left) and the
                   daily trend (right). Both are SectionCards with a header and
                   a footer, so the fixed slots keep them the same height. ──── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="min-w-0">
                <ZoneDayBreakdownChart
                    monthData={monthData}
                    activeZoneName={activeZoneName}
                    selectedDay={selectedDay}
                    month={month}
                />
            </div>

            <div className="min-w-0">
            <SectionCard>
                <SectionCard.Header
                    title="Zone daily consumption trend"
                    description={`Day-by-day comparison of L2 Bulk vs ΣL3 totals — ${activeZoneName}, ${month}`}
                />
                <SectionCard.Body>
                    {trendData.length === 0 ? (
                        <div className="flex h-chart items-center justify-center text-body text-muted">
                            No trend data available for this zone
                        </div>
                    ) : (
                        <ChartFrame
                            series={3}
                            height="chart"
                            legend={[
                                { label: "L2 Bulk", color: CHART_COLORS.teal },
                                { label: "ΣL3 Total", color: CHART_COLORS.brand },
                                { label: "Loss", color: CHART_COLORS.loss, dashed: true },
                            ]}
                        >
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                                {/* Right margin leaves room for the "Day N" marker label when the last day is selected. */}
                                <ComposedChart data={trendData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                                    <CartesianGrid {...chartTheme.grid} />
                                    <XAxis dataKey="day" {...chartTheme.axis} interval={4} />
                                    <YAxis {...chartTheme.axis} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                    <Tooltip formatter={fmtM3} {...chartTheme.tooltip} />
                                    {currentDayLabel && (
                                        <ReferenceLine
                                            x={currentDayLabel}
                                            stroke={chartTheme.series[0]}
                                            strokeDasharray="4 3"
                                            strokeWidth={1.5}
                                            label={{ value: `Day ${selectedDay}`, position: 'top', fontSize: 11, fill: "var(--color-muted)" }}
                                        />
                                    )}
                                    <Area
                                        type="monotone" name="ΣL3 Total" dataKey="ΣL3"
                                        stroke={CHART_COLORS.brand} fill={CHART_COLORS.brand} {...chartTheme.area}
                                        {...chartMotion}
                                    />
                                    <Line
                                        type="monotone" name="Loss" dataKey="Loss"
                                        stroke={CHART_COLORS.loss} {...chartTheme.line} strokeDasharray="5 5"
                                        {...chartMotion}
                                    />
                                    <Area
                                        type="monotone" name="L2 Bulk" dataKey="L2 Bulk"
                                        stroke={CHART_COLORS.teal} fill={CHART_COLORS.teal} {...chartTheme.area}
                                        {...chartMotion}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </ChartFrame>
                    )}
                </SectionCard.Body>
                <SectionCard.Footer tone={mtdFooter.tone}>{mtdFooter.text}</SectionCard.Footer>
            </SectionCard>
            </div>
            </div>
        </div>
    );
}
