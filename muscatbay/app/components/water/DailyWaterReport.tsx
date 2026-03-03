"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AVAILABLE_MONTHS } from "@/lib/water-data";
import {
    ZONE_BULK_CONFIG, BUILDING_CONFIG, DC_METERS, NULL_AS_ZERO_ACCOUNTS,
    type ZoneBulkConfig, type BuildingConfig, type DCMeterConfig,
} from "@/lib/water-accounts";
import { getSupabaseClient } from "@/lib/supabase";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import {
    AlertTriangle, ChevronLeft, ChevronRight, CalendarDays,
    Droplets, Building2, Zap, Activity, CheckCircle2,
    Clock, Loader2, RefreshCw, WifiOff, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidProgressRing } from "@/components/charts/liquid-progress-ring";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";
import {
    AreaChart, Area, XAxis, YAxis,
    Tooltip, ResponsiveContainer, ReferenceLine, Legend, Line,
} from "recharts";

// ─── Computed row types ───────────────────────────────────────────────────────

interface ZoneRow {
    zoneName: string;
    l2Account: string;
    l2Value: number | null;
    l3Sum: number;
    diff: number | null;
    isNullL2: boolean;
    isHighLoss: boolean;
}

interface BuildingRow {
    buildingName: string;
    zone: '3A' | '3B';
    bulkAccount: string;
    l3Bulk: number | null;
    l4Sum: number;
    diff: number | null;
    hasNonZeroDiff: boolean;
}

interface DCRow {
    meterName: string;
    account: string;
    isIrr: boolean;
    rawValue: number | null;
    /** The value displayed — 0 for null-as-zero, null for truly missing non-irr meters */
    displayValue: number | null;
    isNullFlag: boolean;
}

interface ReportData {
    zoneRows: ZoneRow[];
    buildingRows: BuildingRow[];
    dcRows: DCRow[];
    l2Total: number;
    dcTotal: number;
    grandTotal: number;
}

type ReportStatus = 'loading' | 'success' | 'error';

// ─── Data processing ──────────────────────────────────────────────────────────

function processReport(readings: Record<string, number | null>): ReportData {
    const get = (acc: string): number | null =>
        acc in readings ? readings[acc] : null;

    // TABLE 1 — Zone rows
    const zoneRows: ZoneRow[] = ZONE_BULK_CONFIG.map(z => {
        const l2Value = get(z.l2Account);
        const l3Sum = z.l3Accounts.reduce((s, a) => s + (get(a) ?? 0), 0);
        const diff = l2Value !== null ? Math.round(l2Value - l3Sum) : null;
        return {
            zoneName: z.zoneName,
            l2Account: z.l2Account,
            l2Value: l2Value !== null ? Math.round(l2Value) : null,
            l3Sum: Math.round(l3Sum),
            diff,
            isNullL2: l2Value === null,
            isHighLoss: diff !== null && Math.abs(diff) > 20,
        };
    });

    // TABLE 2 — Building rows
    const buildingRows: BuildingRow[] = BUILDING_CONFIG.map(b => {
        const l3Bulk = get(b.bulkAccount);
        const l4Sum = b.l4Accounts.reduce((s, a) => s + (get(a) ?? 0), 0);
        const diff = l3Bulk !== null ? Math.round(l3Bulk - l4Sum) : null;
        return {
            buildingName: b.buildingName,
            zone: b.zone,
            bulkAccount: b.bulkAccount,
            l3Bulk: l3Bulk !== null ? Math.round(l3Bulk) : null,
            l4Sum: Math.round(l4Sum),
            diff,
            hasNonZeroDiff: diff !== null && diff !== 0,
        };
    });

    // TABLE 3 — DC rows
    const dcRows: DCRow[] = DC_METERS.map(dc => {
        const rawValue = get(dc.account);
        const isNullAsZero = dc.isIrr || NULL_AS_ZERO_ACCOUNTS.has(dc.account);
        const displayValue = rawValue !== null ? Math.round(rawValue)
            : isNullAsZero ? 0 : null;
        return {
            meterName: dc.meterName,
            account: dc.account,
            isIrr: dc.isIrr,
            rawValue,
            displayValue,
            isNullFlag: rawValue === null && !isNullAsZero,
        };
    });

    // SUMMARY
    const l2Total = Math.round(zoneRows.reduce((s, r) => s + (r.l2Value ?? 0), 0));
    const dcTotal = Math.round(dcRows.reduce((s, r) => s + (r.displayValue ?? 0), 0));

    return { zoneRows, buildingRows, dcRows, l2Total, dcTotal, grandTotal: l2Total + dcTotal };
}

// ─── Number formatter ─────────────────────────────────────────────────────────

function n(v: number | null, fallback = '—'): string {
    if (v === null) return fallback;
    return v.toLocaleString();
}

function diffCell(diff: number | null): string {
    if (diff === null) return '—';
    if (diff === 0) return '0';
    return (diff > 0 ? '+' : '') + diff.toLocaleString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
    icon, title, subtitle, color = 'teal',
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    color?: 'teal' | 'violet' | 'amber' | 'emerald';
}) {
    const bg = {
        teal: 'bg-teal-100 dark:bg-teal-900/30',
        violet: 'bg-violet-100 dark:bg-violet-900/30',
        amber: 'bg-amber-100 dark:bg-amber-900/30',
        emerald: 'bg-emerald-100 dark:bg-emerald-900/30',
    }[color];
    const text = {
        teal: 'text-teal-600 dark:text-teal-400',
        violet: 'text-violet-600 dark:text-violet-400',
        amber: 'text-amber-600 dark:text-amber-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
    }[color];
    return (
        <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", bg)}>
                <div className={cn("h-5 w-5", text)}>{icon}</div>
            </div>
            <div>
                <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
                {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function NullBadge() {
    return (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" /> NULL
        </span>
    );
}

// TABLE 1 ─────────────────────────────────────────────────────────────────────

function ZoneBulkTable({ rows }: { rows: ZoneRow[] }) {
    const l2Total = rows.reduce((s, r) => s + (r.l2Value ?? 0), 0);
    const l3Total = rows.reduce((s, r) => s + r.l3Sum, 0);
    const diffTotal = Math.round(l2Total - l3Total);

    return (
        <Card className="glass-card">
            <CardHeader className="glass-card-header p-4 sm:p-5">
                <SectionHeader
                    icon={<Droplets className="h-5 w-5" />}
                    title="Zone Bulk (L2) vs Sum of L3 Meters"
                    subtitle="L2 bulk meter reading vs sum of all L3 meters per zone — values in m³"
                    color="teal"
                />
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableHead className="min-w-[130px]">Zone</TableHead>
                            <TableHead className="text-center text-xs">L2 Account</TableHead>
                            <TableHead className="text-right">L2 (m³)</TableHead>
                            <TableHead className="text-right">ΣL3 (m³)</TableHead>
                            <TableHead className="text-right">Diff</TableHead>
                            <TableHead className="text-center min-w-[120px]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow
                                key={row.zoneName}
                                className={cn(
                                    row.isNullL2 && "bg-amber-50/70 dark:bg-amber-900/10",
                                    row.isHighLoss && "bg-red-50/70 dark:bg-red-900/10",
                                )}
                            >
                                <TableCell className="font-semibold text-sm">{row.zoneName}</TableCell>
                                <TableCell className="text-center font-mono text-xs text-slate-500">{row.l2Account}</TableCell>
                                <TableCell className="text-right font-mono text-sm font-medium">
                                    {row.isNullL2 ? <NullBadge /> : n(row.l2Value)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">{n(row.l3Sum)}</TableCell>
                                <TableCell className={cn(
                                    "text-right font-mono text-sm font-semibold",
                                    row.isHighLoss && "text-red-600 dark:text-red-400",
                                    !row.isHighLoss && !row.isNullL2 && row.diff === 0 && "text-emerald-600 dark:text-emerald-400",
                                )}>
                                    {row.diff !== null ? diffCell(row.diff) : '—'}
                                </TableCell>
                                <TableCell className="text-center">
                                    {row.isNullL2 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                            <AlertTriangle className="h-2.5 w-2.5" /> NULL L2
                                        </span>
                                    )}
                                    {row.isHighLoss && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                            🔴 High Loss
                                        </span>
                                    )}
                                    {!row.isNullL2 && !row.isHighLoss && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                            <CheckCircle2 className="h-2.5 w-2.5" /> Normal
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {/* Totals row */}
                        <TableRow className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/30 font-bold">
                            <TableCell className="font-bold text-sm" colSpan={2}>Total</TableCell>
                            <TableCell className="text-right font-mono font-bold text-sm">{Math.round(l2Total).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono font-bold text-sm">{Math.round(l3Total).toLocaleString()}</TableCell>
                            <TableCell className={cn(
                                "text-right font-mono font-bold text-sm",
                                diffTotal > 20 && "text-red-600 dark:text-red-400",
                            )}>
                                {diffCell(diffTotal)}
                            </TableCell>
                            <TableCell />
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// TABLE 2 ─────────────────────────────────────────────────────────────────────

function BuildingBulkTable({ rows }: { rows: BuildingRow[] }) {
    const zone3A = rows.filter(r => r.zone === '3A');
    const zone3B = rows.filter(r => r.zone === '3B');

    function renderRows(group: BuildingRow[]) {
        return group.map(row => (
            <TableRow
                key={row.buildingName}
                className={row.hasNonZeroDiff ? "bg-amber-50/50 dark:bg-amber-900/10" : undefined}
            >
                <TableCell className="font-semibold text-sm">{row.buildingName}</TableCell>
                <TableCell className="font-mono text-xs text-slate-500">{row.bulkAccount}</TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                    {row.l3Bulk === null ? <NullBadge /> : n(row.l3Bulk)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{n(row.l4Sum)}</TableCell>
                <TableCell className={cn(
                    "text-right font-mono text-sm font-semibold",
                    row.hasNonZeroDiff && "text-amber-600 dark:text-amber-400",
                    !row.hasNonZeroDiff && row.diff === 0 && "text-emerald-600 dark:text-emerald-400",
                )}>
                    {row.diff !== null ? (
                        <span className="inline-flex items-center justify-end gap-1">
                            {row.hasNonZeroDiff && <AlertTriangle className="h-3 w-3" />}
                            {diffCell(row.diff)}
                        </span>
                    ) : '—'}
                </TableCell>
            </TableRow>
        ));
    }

    return (
        <Card className="glass-card">
            <CardHeader className="glass-card-header p-4 sm:p-5">
                <SectionHeader
                    icon={<Building2 className="h-5 w-5" />}
                    title="Building Bulk (L3) vs Apartments (L4)"
                    subtitle="21 buildings — L3 bulk meter vs sum of L4 apartment meters • ⚠️ = non-zero difference"
                    color="violet"
                />
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableHead className="min-w-[80px]">Building</TableHead>
                            <TableHead className="text-xs">Bulk Account</TableHead>
                            <TableHead className="text-right">L3 Bulk (m³)</TableHead>
                            <TableHead className="text-right">ΣL4 (m³)</TableHead>
                            <TableHead className="text-right">Diff</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Zone 3A group */}
                        <TableRow className="bg-violet-50/40 dark:bg-violet-900/10 hover:bg-violet-50/40 dark:hover:bg-violet-900/10">
                            <TableCell colSpan={5} className="py-2 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                Zone 3A — {zone3A.length} Buildings
                            </TableCell>
                        </TableRow>
                        {renderRows(zone3A)}
                        {/* Zone 3B group */}
                        <TableRow className="bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50/40 dark:hover:bg-blue-900/10">
                            <TableCell colSpan={5} className="py-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                Zone 3B — {zone3B.length} Buildings
                            </TableCell>
                        </TableRow>
                        {renderRows(zone3B)}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// TABLE 3 ─────────────────────────────────────────────────────────────────────

function DCMetersTable({ rows }: { rows: DCRow[] }) {
    const total = rows.reduce((s, r) => s + (r.displayValue ?? 0), 0);

    return (
        <Card className="glass-card">
            <CardHeader className="glass-card-header p-4 sm:p-5">
                <SectionHeader
                    icon={<Zap className="h-5 w-5" />}
                    title="Direct Connections (DC)"
                    subtitle="Hotels, irrigation, facilities — connected directly to the L1 main supply"
                    color="amber"
                />
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableHead>Meter Name</TableHead>
                            <TableHead className="text-xs">Account</TableHead>
                            <TableHead className="text-right">Reading (m³)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow
                                key={row.account}
                                className={row.isNullFlag ? "bg-amber-50/70 dark:bg-amber-900/10" : undefined}
                            >
                                <TableCell className="text-sm font-medium">
                                    {row.meterName}
                                    {row.isIrr && (
                                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-medium">
                                            IRR
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-slate-500">{row.account}</TableCell>
                                <TableCell className="text-right font-mono text-sm font-medium">
                                    {row.isNullFlag ? (
                                        <NullBadge />
                                    ) : row.rawValue === null ? (
                                        <span className="text-slate-400 dark:text-slate-500">0</span>
                                    ) : (
                                        n(row.displayValue)
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {/* Totals row */}
                        <TableRow className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/30">
                            <TableCell className="font-bold text-sm" colSpan={2}>Total DC</TableCell>
                            <TableCell className="text-right font-mono font-bold text-sm">
                                {Math.round(total).toLocaleString()}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// SUMMARY CARD ────────────────────────────────────────────────────────────────

function SummaryCard({ data, day, month }: { data: ReportData; day: number; month: string }) {
    const highLossZones = data.zoneRows.filter(r => r.isHighLoss);
    const nullL2Zones = data.zoneRows.filter(r => r.isNullL2);
    const nullDCMeters = data.dcRows.filter(r => r.isNullFlag);
    const flaggedBuildings = data.buildingRows.filter(r => r.hasNonZeroDiff);
    const hasIssues = highLossZones.length > 0 || nullL2Zones.length > 0 || nullDCMeters.length > 0;

    return (
        <Card className="glass-card">
            <CardHeader className="glass-card-header p-4 sm:p-5">
                <SectionHeader
                    icon={<Activity className="h-5 w-5" />}
                    title="Report Summary"
                    subtitle={`Day ${day}, ${month} — Grand total of all measured consumption`}
                    color="emerald"
                />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Stat tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-5 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30">
                        <Droplets className="h-6 w-6 text-teal-500 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-teal-700 dark:text-teal-300">
                            {data.l2Total.toLocaleString()}
                        </div>
                        <div className="text-xs font-medium text-teal-600/70 dark:text-teal-400/70 mt-1">L2 Zone Bulk Total (m³)</div>
                    </div>
                    <div className="text-center p-5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                        <Zap className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                            {data.dcTotal.toLocaleString()}
                        </div>
                        <div className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70 mt-1">DC Connections Total (m³)</div>
                    </div>
                    <div className="text-center p-5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <Activity className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-slate-700 dark:text-slate-200">
                            {data.grandTotal.toLocaleString()}
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-1">Grand Total (L2 + DC) (m³)</div>
                    </div>
                </div>

                {/* Flags */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Flags & Alerts
                    </p>

                    {!hasIssues && (
                        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg px-4 py-2.5">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            All zones within acceptable range. No critical issues detected for day {day}.
                        </div>
                    )}

                    {highLossZones.map(z => (
                        <div key={z.zoneName} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg px-4 py-2.5">
                            <span className="shrink-0 mt-0.5">🔴</span>
                            <span>
                                <strong>High Loss — {z.zoneName}:</strong>{" "}
                                L2 = {n(z.l2Value)} m³, ΣL3 = {n(z.l3Sum)} m³, Diff = {n(z.diff)} m³
                                {z.diff !== null && z.l2Value ? ` (${Math.round(Math.abs(z.diff) / z.l2Value * 100)}%)` : ''}
                            </span>
                        </div>
                    ))}

                    {nullL2Zones.map(z => (
                        <div key={z.zoneName} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg px-4 py-2.5">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span><strong>NULL L2 — {z.zoneName}:</strong> Bulk meter has no reading for this day</span>
                        </div>
                    ))}

                    {nullDCMeters.map(dc => (
                        <div key={dc.account} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg px-4 py-2.5">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span><strong>NULL Meter — {dc.meterName}</strong> ({dc.account})</span>
                        </div>
                    ))}

                    {flaggedBuildings.length > 0 && (
                        <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg px-4 py-2.5">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                                <strong>{flaggedBuildings.length} building{flaggedBuildings.length > 1 ? 's' : ''} with non-zero L3/L4 diff:</strong>{" "}
                                {flaggedBuildings.map(b => `${b.buildingName} (${b.diff && b.diff > 0 ? '+' : ''}${b.diff})`).join(', ')}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Zone Analytics Panel ─────────────────────────────────────────────────────

interface ZoneAnalyticsPanelProps {
    reportData: ReportData;
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    month: string;
}

function ZoneAnalyticsPanel({ reportData, monthData, selectedDay, month }: ZoneAnalyticsPanelProps) {
    const [activeZoneName, setActiveZoneName] = useState(ZONE_BULK_CONFIG[0].zoneName);

    // O(1) lookup map keyed by account_number
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    // Active zone report row
    const zoneRow    = reportData.zoneRows.find(r => r.zoneName === activeZoneName) ?? null;
    const l2Value    = zoneRow?.l2Value ?? 0;
    const l3Sum      = zoneRow?.l3Sum   ?? 0;
    const diff       = zoneRow?.diff    ?? null;

    // Shared gauge scale (same as Zone Analysis page)
    const gaugeMax   = Math.max(l2Value, l3Sum) * 1.2 || 100;
    const lossColor  = diff !== null && diff > 0 ? '#C95D63' : '#5BA88B';

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
                'L2 Bulk': l2 !== null ? Math.round(l2) : null,
                'ΣL3': Math.round(l3),
                Loss: l2 !== null ? Math.round(Math.max(0, l2 - l3)) : null,
            });
        }
        return results;
    }, [accountMap, activeZoneName]);

    const currentDayLabel = trendData.find(d => d.dayNum === selectedDay)?.day;

    return (
        <div className="space-y-6">

            {/* ── Zone selector ────────────────────────────────────────────── */}
            <Card className="glass-card">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mr-1">
                            Select Zone
                        </span>
                        {ZONE_BULK_CONFIG.map(z => {
                            const zr          = reportData.zoneRows.find(r => r.zoneName === z.zoneName);
                            const isActive    = z.zoneName === activeZoneName;
                            const hasHighLoss = zr?.isHighLoss;
                            const hasNullL2   = zr?.isNullL2;
                            return (
                                <button
                                    key={z.zoneName}
                                    onClick={() => setActiveZoneName(z.zoneName)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                                        isActive
                                            ? "bg-primary text-white border-primary shadow-sm"
                                            : hasHighLoss
                                                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 hover:bg-red-100"
                                                : hasNullL2
                                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-100"
                                                    : "bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    )}
                                >
                                    {z.zoneName}
                                    {!isActive && hasHighLoss && <span className="ml-1 text-[10px]">🔴</span>}
                                    {!isActive && hasNullL2   && <span className="ml-1 text-[10px]">⚠️</span>}
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ── Zone heading ─────────────────────────────────────────────── */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {activeZoneName} Analysis — Day {selectedDay}, {month}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span className="text-mb-secondary font-medium">L2 Bulk</span> = zone entry meter &bull;{" "}
                    <span className="text-mb-primary font-medium">ΣL3 Total</span> = sum of all L3 meters &bull;{" "}
                    <span style={{ color: '#C95D63' }} className="font-medium">Difference</span> = L2 &minus; ΣL3
                </p>
            </div>

            {/* ── 3 Gauge rings — bare grid, no individual card wrappers ───── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <LiquidProgressRing
                    value={l2Value}
                    max={gaugeMax}
                    label="L2 Bulk Meter"
                    sublabel="Total water entering zone"
                    color="#81D8D0"
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-gauge-1"
                />
                <LiquidProgressRing
                    value={l3Sum}
                    max={gaugeMax}
                    label="ΣL3 Meters Total"
                    sublabel="Recorded by L3 meters"
                    color="#4E4456"
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-gauge-2"
                />
                <LiquidProgressRing
                    value={Math.abs(diff ?? 0)}
                    max={l2Value || 100}
                    label="Water Loss / Diff"
                    sublabel="Leakage, meter loss, etc."
                    color={lossColor}
                    size={160}
                    showPercentage={true}
                    elementId="daily-gauge-3"
                />
            </div>

            {/* ── Daily trend chart ────────────────────────────────────────── */}
            <Card className="glass-card">
                <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                    <CardTitle className="text-base sm:text-lg">
                        Zone Daily Consumption Trend
                    </CardTitle>
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
                                            <stop offset="5%"  stopColor="#81D8D0" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#81D8D0" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradDailyL3" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#4E4456" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#4E4456" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false} tickLine={false}
                                        tick={{ fontSize: 11, fill: "#6B7280" }}
                                        dy={10} interval={4}
                                    />
                                    <YAxis
                                        axisLine={false} tickLine={false}
                                        tick={{ fontSize: 11, fill: "#6B7280" }}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                        label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }}
                                    />
                                    <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                    <Legend iconType="circle" />
                                    {currentDayLabel && (
                                        <ReferenceLine
                                            x={currentDayLabel}
                                            stroke="#4E4456"
                                            strokeDasharray="4 3"
                                            strokeWidth={1.5}
                                            label={{ value: `Day ${selectedDay}`, position: 'top', fontSize: 10, fill: '#4E4456', fontWeight: 600 }}
                                        />
                                    )}
                                    <Area
                                        type="monotone" name="ΣL3 Total" dataKey="ΣL3"
                                        stroke="#4E4456" fill="url(#gradDailyL3)" strokeWidth={3}
                                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                        animationDuration={1500}
                                    />
                                    <Line
                                        type="monotone" name="Loss" dataKey="Loss"
                                        stroke="#C95D63" strokeWidth={2}
                                        dot={false} strokeDasharray="5 5"
                                        animationDuration={1500}
                                    />
                                    <Area
                                        type="monotone" name="L2 Bulk" dataKey="L2 Bulk"
                                        stroke="#81D8D0" fill="url(#gradDailyBulk)" strokeWidth={3}
                                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Loading / Error states ───────────────────────────────────────────────────

function LoadingState() {
    return (
        <div className="space-y-4">
            {['Zone Bulk vs L3', 'Building Analysis', 'Direct Connections'].map(label => (
                <Card key={label} className="glass-card">
                    <CardHeader className="glass-card-header p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="h-3 w-72 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-9 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <WifiOff className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Failed to Load Report
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                {message}
            </p>
            <Button onClick={onRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Retry
            </Button>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DailyWaterReport() {
    const [selectedMonth, setSelectedMonth] = useState(
        AVAILABLE_MONTHS[AVAILABLE_MONTHS.length - 1]
    );
    const [selectedDay, setSelectedDay] = useState(1);
    const [status, setStatus]           = useState<ReportStatus>('loading');
    const [monthData, setMonthData]     = useState<SupabaseDailyWaterConsumption[]>([]);
    const [reportData, setReportData]   = useState<ReportData | null>(null);
    const [errorMsg, setErrorMsg]       = useState('');
    const [lastFetched, setLastFetched] = useState<Date | null>(null);
    const [isLive, setIsLive]           = useState(false);

    // ── Build report from cached month rows for any day (no network call) ──────
    const computeReport = useCallback((rows: SupabaseDailyWaterConsumption[], day: number) => {
        const dayCol = `day_${day}` as keyof SupabaseDailyWaterConsumption;
        const readings: Record<string, number | null> = {};
        for (const row of rows) {
            const val = row[dayCol];
            readings[row.account_number] = val != null ? Number(val) : null;
        }
        return processReport(readings);
    }, []);

    // ── Fetch all rows for a month from Supabase ──────────────────────────────
    const fetchMonth = useCallback(async (month: string, silent = false) => {
        if (!silent) {
            setStatus('loading');
            setErrorMsg('');
        }
        try {
            const client = getSupabaseClient();
            if (!client) throw new Error('Supabase is not configured.');

            const { data, error } = await client
                .from('water_daily_consumption')
                .select('*')
                .eq('month', month);

            if (error) throw new Error(error.message);

            if (!data || data.length === 0) {
                if (!silent) {
                    setErrorMsg(`No data found for ${month}. This month may not have been loaded yet.`);
                    setStatus('error');
                }
                return;
            }

            setMonthData(data as SupabaseDailyWaterConsumption[]);
            setLastFetched(new Date());
            if (!silent) setStatus('success');
        } catch (err) {
            if (!silent) {
                setErrorMsg(err instanceof Error ? err.message : String(err));
                setStatus('error');
            }
        }
    }, []);

    // ── Recompute report whenever cached data OR selected day changes ─────────
    useEffect(() => {
        if (monthData.length === 0) return;
        setReportData(computeReport(monthData, selectedDay));
        setStatus('success');
    }, [monthData, selectedDay, computeReport]);

    // ── Stable slider handler — inline arrow would recreate every render and
    //    cause Radix Slider to call onValueChange in a loop (infinite updates)
    const handleSliderChange = useCallback((v: number[]) => {
        setSelectedDay(v[0]);
    }, []); // setSelectedDay is a stable useState dispatcher — no deps needed

    // ── Auto-fetch when month changes (includes initial mount) ────────────────
    useEffect(() => {
        setReportData(null);
        fetchMonth(selectedMonth);
    }, [selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Supabase real-time subscription ───────────────────────────────────────
    useEffect(() => {
        const client = getSupabaseClient();
        if (!client) return;

        const channel = client
            .channel(`water-daily-rt-${selectedMonth}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'water_daily_consumption',
                    filter: `month=eq.${selectedMonth}`,
                },
                () => {
                    // Silent background refresh — report updates automatically
                    fetchMonth(selectedMonth, true);
                }
            )
            .subscribe(subStatus => {
                setIsLive(subStatus === 'SUBSCRIBED');
            });

        return () => {
            setIsLive(false);
            client.removeChannel(channel);
        };
    }, [selectedMonth, fetchMonth]);

    // ── Controls bar ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="glass-card">
                <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="flex flex-wrap items-center gap-4">

                        {/* Month selector */}
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                            <select
                                value={selectedMonth}
                                onChange={e => { setSelectedMonth(e.target.value); setSelectedDay(1); }}
                                disabled={status === 'loading'}
                                className="px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                            >
                                {[...AVAILABLE_MONTHS].reverse().map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Day selector */}
                        <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                            <Button
                                variant="outline" size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => setSelectedDay(d => Math.max(1, d - 1))}
                                disabled={selectedDay <= 1 || status === 'loading'}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 max-w-[200px]">
                                <Slider
                                    value={[selectedDay]}
                                    onValueChange={handleSliderChange}
                                    min={1} max={31} step={1}
                                    disabled={status === 'loading'}
                                />
                            </div>
                            <Button
                                variant="outline" size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => setSelectedDay(d => Math.min(31, d + 1))}
                                disabled={selectedDay >= 31 || status === 'loading'}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <span className="text-base font-bold text-primary min-w-[56px] tabular-nums">
                                Day {selectedDay}
                            </span>
                        </div>

                        {/* Manual refresh */}
                        <Button
                            variant="outline" size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => fetchMonth(selectedMonth)}
                            disabled={status === 'loading'}
                            title="Refresh"
                        >
                            {status === 'loading'
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <RefreshCw className="h-4 w-4" />
                            }
                        </Button>

                        {/* Live badge + last fetched */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Real-time status */}
                            <span className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
                                isLive
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                                <Radio className={cn("h-3 w-3", isLive && "animate-pulse")} />
                                {isLive ? "Live" : "Offline"}
                            </span>

                            {/* Loading indicator */}
                            {status === 'loading' && (
                                <span className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                                </span>
                            )}

                            {/* Last fetched time */}
                            {lastFetched && status !== 'loading' && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                                    <Clock className="h-3 w-3" />
                                    Updated {lastFetched.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Content ─────────────────────────────────────────────────── */}
            {status === 'loading' && !reportData && <LoadingState />}
            {status === 'error'   && <ErrorState message={errorMsg} onRetry={() => fetchMonth(selectedMonth)} />}

            {reportData && (
                <>
                    <ZoneAnalyticsPanel
                        reportData={reportData}
                        monthData={monthData}
                        selectedDay={selectedDay}
                        month={selectedMonth}
                    />
                    <ZoneBulkTable rows={reportData.zoneRows} />
                    <BuildingBulkTable rows={reportData.buildingRows} />
                    <DCMetersTable rows={reportData.dcRows} />
                    <SummaryCard data={reportData} day={selectedDay} month={selectedMonth} />
                </>
            )}
        </div>
    );
}
