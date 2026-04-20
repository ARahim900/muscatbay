"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDynamicMonths } from "@/lib/water-data";
import {
    ZONE_BULK_CONFIG, BUILDING_CONFIG, DC_METERS, BUILDING_CHILD_METERS,
} from "@/lib/water-accounts";
import { getSupabaseClient } from "@/lib/supabase";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import {
    CalendarDays, ChevronRight, ChevronDown, Loader2, RefreshCw,
    WifiOff, Radio, Clock, Layers, Droplets, TrendingDown, Activity,
    Search, X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_ABBREVS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDefaultMonth(): string {
    const months = getDynamicMonths();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = `${MONTH_ABBREVS[yesterday.getMonth()]}-${String(yesterday.getFullYear()).slice(2)}`;
    return months.includes(key) ? key : months[months.length - 1];
}

function getAvailableYears(): string[] {
    return [...new Set(getDynamicMonths().map(m => m.split('-')[1]))];
}

function getMonthsForYear(year: string): string[] {
    return getDynamicMonths().filter(m => m.endsWith(`-${year}`));
}

/** Return number of days in a month string like "Feb-26". */
function daysInMonth(monthStr: string): number {
    const [abbr, yr] = monthStr.split('-');
    const mIdx = MONTH_ABBREVS.indexOf(abbr);
    if (mIdx < 0 || !yr) return 31;
    const fullYear = 2000 + Number(yr);
    return new Date(fullYear, mIdx + 1, 0).getDate();
}

const r2 = (v: number) => Math.round(v * 100) / 100;

function fmt(v: number | null, decimals = 0): string {
    if (v === null || v === undefined) return '—';
    return v.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

// ─── Hierarchy node ───────────────────────────────────────────────────────────

interface HierarchyNode {
    accountNumber: string;
    meterName: string;
    level: 'L1' | 'L2' | 'L3' | 'L4' | 'DC';
    zone: string;
    type: string;
    parentMeter: string;
    dailyReadings: (number | null)[];
    monthTotal: number;
    hasData: boolean;
    children: HierarchyNode[];
    depth: number;
}

function rowToDailyArray(
    row: SupabaseDailyWaterConsumption | undefined,
    nDays: number,
): (number | null)[] {
    const readings: (number | null)[] = [];
    for (let d = 1; d <= nDays; d++) {
        if (!row) {
            readings.push(null);
            continue;
        }
        const val = row[`day_${d}` as keyof SupabaseDailyWaterConsumption];
        readings.push(val != null ? Number(val) : null);
    }
    return readings;
}

function computeTotals(node: HierarchyNode) {
    const valid = node.dailyReadings.filter((v): v is number => v !== null);
    node.monthTotal = r2(valid.reduce((s, v) => s + v, 0));
    node.hasData = valid.length > 0;
}

function buildHierarchyFromConfig(
    readings: Map<string, SupabaseDailyWaterConsumption>,
    nDays: number,
): HierarchyNode {
    // ── L1 root — Main Bulk (NAMA) ────────────────────────────────────────────
    const rootAccount = 'C43659';
    const rootRow = readings.get(rootAccount);
    const root: HierarchyNode = {
        accountNumber: rootAccount,
        meterName: rootRow?.meter_name ?? 'Main Bulk (NAMA)',
        level: 'L1',
        zone: rootRow?.zone ?? 'Main Bulk',
        type: rootRow?.type ?? 'Main BULK',
        parentMeter: 'NAMA',
        dailyReadings: rowToDailyArray(rootRow, nDays),
        monthTotal: 0,
        hasData: false,
        children: [],
        depth: 0,
    };

    // ── L2 zones (each with L3 children — possibly buildings with L4 kids) ────
    for (const zone of ZONE_BULK_CONFIG) {
        const zoneRow = readings.get(zone.l2Account);
        const zoneNode: HierarchyNode = {
            accountNumber: zone.l2Account,
            meterName: zoneRow?.meter_name ?? zone.zoneName,
            level: 'L2',
            zone: zoneRow?.zone ?? zone.zoneName,
            type: zoneRow?.type ?? 'Zone Bulk',
            parentMeter: root.meterName,
            dailyReadings: rowToDailyArray(zoneRow, nDays),
            monthTotal: 0,
            hasData: false,
            children: [],
            depth: 1,
        };

        for (const l3Account of zone.l3Accounts) {
            const l3Row = readings.get(l3Account);
            const building = BUILDING_CONFIG.find(b => b.bulkAccount === l3Account);
            const l3Node: HierarchyNode = {
                accountNumber: l3Account,
                meterName: l3Row?.meter_name ?? building?.buildingName ?? l3Account,
                level: 'L3',
                zone: l3Row?.zone ?? zone.zoneName,
                type: l3Row?.type ?? (building ? 'D_Building_Bulk' : 'Residential'),
                parentMeter: zoneNode.meterName,
                dailyReadings: rowToDailyArray(l3Row, nDays),
                monthTotal: 0,
                hasData: false,
                children: [],
                depth: 2,
            };

            if (building) {
                const childInfos = BUILDING_CHILD_METERS[building.buildingName] ?? [];
                for (const child of childInfos) {
                    const childRow = readings.get(child.account);
                    const l4Node: HierarchyNode = {
                        accountNumber: child.account,
                        meterName: childRow?.meter_name ?? child.label,
                        level: 'L4',
                        zone: childRow?.zone ?? zone.zoneName,
                        type: childRow?.type ?? child.type,
                        parentMeter: l3Node.meterName,
                        dailyReadings: rowToDailyArray(childRow, nDays),
                        monthTotal: 0,
                        hasData: false,
                        children: [],
                        depth: 3,
                    };
                    computeTotals(l4Node);
                    l3Node.children.push(l4Node);
                }
            }

            computeTotals(l3Node);
            zoneNode.children.push(l3Node);
        }

        computeTotals(zoneNode);
        root.children.push(zoneNode);
    }

    // ── DC meters (direct connections, children of L1) ────────────────────────
    for (const dc of DC_METERS) {
        const dcRow = readings.get(dc.account);
        const dcNode: HierarchyNode = {
            accountNumber: dc.account,
            meterName: dcRow?.meter_name ?? dc.meterName,
            level: 'DC',
            zone: dcRow?.zone ?? 'Direct Connection',
            type: dcRow?.type ?? '',
            parentMeter: root.meterName,
            dailyReadings: rowToDailyArray(dcRow, nDays),
            monthTotal: 0,
            hasData: false,
            children: [],
            depth: 1,
        };
        computeTotals(dcNode);
        root.children.push(dcNode);
    }

    computeTotals(root);
    return root;
}

// ─── Level styling ────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<HierarchyNode['level'], { bg: string; text: string; badge: string }> = {
    L1: {
        bg: 'bg-primary/10 dark:bg-primary/20',
        text: 'text-primary dark:text-primary-foreground',
        badge: 'bg-primary text-white',
    },
    L2: {
        bg: 'bg-blue-50/70 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        badge: 'bg-blue-600 text-white dark:bg-blue-500',
    },
    L3: {
        bg: 'bg-amber-50/60 dark:bg-amber-900/15',
        text: 'text-amber-700 dark:text-amber-300',
        badge: 'bg-amber-600 text-white dark:bg-amber-500',
    },
    L4: {
        bg: 'bg-slate-50/80 dark:bg-slate-800/40',
        text: 'text-slate-700 dark:text-slate-300',
        badge: 'bg-slate-500 text-white',
    },
    DC: {
        bg: 'bg-purple-50/60 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-300',
        badge: 'bg-purple-600 text-white dark:bg-purple-500',
    },
};

// ─── KPI Card sub-component ───────────────────────────────────────────────────

type KpiTone = 'primary' | 'blue' | 'amber' | 'emerald';

function KpiCard({
    label, value, unit, subtitle, icon, tone,
}: {
    label: string;
    /** Numeric value to show, or `null` for an "unavailable" state. */
    value: number | null;
    unit: string;
    subtitle: string;
    icon: React.ReactNode;
    tone: KpiTone;
}) {
    const tones: Record<KpiTone, { bg: string; text: string; border: string }> = {
        primary: {
            bg: 'bg-primary/8 dark:bg-primary/20',
            text: 'text-primary dark:text-primary-foreground',
            border: 'border-primary/20',
        },
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-100 dark:border-blue-900/30',
        },
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-100 dark:border-amber-900/30',
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-100 dark:border-emerald-900/30',
        },
    };
    const t = tones[tone];
    return (
        <Card className={cn("card-elevated border", t.border)}>
            <CardContent className={cn("p-4 rounded-lg", t.bg)}>
                <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                        {label}
                    </span>
                    <div className={t.text}>{icon}</div>
                </div>
                <div className="flex items-baseline gap-1.5">
                    {value === null ? (
                        <span
                            className={cn(
                                "text-2xl sm:text-3xl font-bold tabular-nums text-slate-400 dark:text-slate-500",
                            )}
                            aria-label="unavailable"
                        >
                            —
                        </span>
                    ) : (
                        <>
                            <span className={cn("text-2xl sm:text-3xl font-bold tabular-nums", t.text)}>
                                {value.toLocaleString(undefined, {
                                    maximumFractionDigits: unit === '%' ? 1 : 0,
                                })}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{unit}</span>
                        </>
                    )}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
            </CardContent>
        </Card>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Status = 'loading' | 'success' | 'error';

export function WaterHierarchyReport() {
    const [selectedMonth, setSelectedMonth] = useState<string>(getDefaultMonth);
    const [status, setStatus] = useState<Status>('loading');
    const [rows, setRows] = useState<SupabaseDailyWaterConsumption[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [lastFetched, setLastFetched] = useState<Date | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');

    const nDays = useMemo(() => daysInMonth(selectedMonth), [selectedMonth]);

    // Map rows by account_number for fast lookup
    const readings = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of rows) map.set(row.account_number, row);
        return map;
    }, [rows]);

    const tree = useMemo(
        () => (rows.length > 0 ? buildHierarchyFromConfig(readings, nDays) : null),
        [readings, rows.length, nDays],
    );

    // Default expansion: L1 root + all L2 zones & DC bucket (first load only per tree)
    useEffect(() => {
        if (!tree) return;
        setExpanded(prev => {
            if (prev.size > 0) return prev;
            const initial = new Set<string>();
            initial.add(tree.accountNumber);
            for (const child of tree.children) {
                if (child.level === 'L2') initial.add(child.accountNumber);
            }
            return initial;
        });
    }, [tree]);

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
                // Always reconcile — if the month's data was deleted, a silent
                // refresh should clear stale rows and surface the empty state.
                setRows([]);
                setErrorMsg(`No data found for ${month}. This month may not have been loaded yet.`);
                setStatus('error');
                return;
            }
            // Success reconciliation applies to both manual and silent refreshes
            // so a recovering realtime update can flip the UI out of an error state.
            setRows(data as SupabaseDailyWaterConsumption[]);
            setLastFetched(new Date());
            setErrorMsg('');
            setStatus('success');
        } catch (err) {
            if (!silent) {
                setErrorMsg(err instanceof Error ? err.message : String(err));
                setStatus('error');
            }
        }
    }, []);

    useEffect(() => {
        setRows([]);
        fetchMonth(selectedMonth);
    }, [selectedMonth, fetchMonth]);

    const { isLive } = useSupabaseRealtime({
        table: 'water_daily_consumption',
        channelName: `water-hierarchy-rt-${selectedMonth}`,
        filter: `month=eq.${selectedMonth}`,
        onChanged: () => fetchMonth(selectedMonth, true),
    });

    const toggle = useCallback((id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        if (!tree) return;
        const all = new Set<string>();
        const walk = (node: HierarchyNode) => {
            if (node.children.length > 0) all.add(node.accountNumber);
            node.children.forEach(walk);
        };
        walk(tree);
        setExpanded(all);
    }, [tree]);

    const collapseAll = useCallback(() => setExpanded(new Set()), []);

    // KPIs
    const kpis = useMemo(() => {
        if (!tree) return null;
        const l1Total = tree.monthTotal;
        const l2DCTotal = tree.children.reduce((s, c) => s + c.monthTotal, 0);
        const loss = l1Total - l2DCTotal;
        const efficiency = l1Total > 0 ? (l2DCTotal / l1Total) * 100 : 0;
        return {
            l1Total: r2(l1Total),
            l2DCTotal: r2(l2DCTotal),
            loss: r2(loss),
            efficiency: r2(efficiency),
            hasL1: tree.hasData,
        };
    }, [tree]);

    // Compute visible nodes (respecting expand state + search filter)
    const visibleNodes = useMemo(() => {
        if (!tree) return [] as HierarchyNode[];
        const normalized = search.trim().toLowerCase();
        const result: HierarchyNode[] = [];

        if (!normalized) {
            const walk = (node: HierarchyNode) => {
                result.push(node);
                if (expanded.has(node.accountNumber)) {
                    node.children.forEach(walk);
                }
            };
            walk(tree);
        } else {
            // Two-pass search: compute which nodes are "alive" (match or have matching descendants)
            const alive = new Set<string>();
            const matches = (n: HierarchyNode): boolean =>
                n.meterName.toLowerCase().includes(normalized) ||
                n.accountNumber.toLowerCase().includes(normalized) ||
                n.zone.toLowerCase().includes(normalized);
            const checkAlive = (node: HierarchyNode): boolean => {
                let keep = matches(node);
                for (const c of node.children) {
                    if (checkAlive(c)) keep = true;
                }
                if (keep) alive.add(node.accountNumber);
                return keep;
            };
            checkAlive(tree);
            const walk = (node: HierarchyNode) => {
                if (!alive.has(node.accountNumber)) return;
                result.push(node);
                node.children.forEach(walk);
            };
            walk(tree);
        }
        return result;
    }, [tree, expanded, search]);

    const colSpan = nDays + 4; // name, acct, label, …days, total

    return (
        <div className="space-y-6 motion-safe:animate-in fade-in duration-200">
            {/* ── Controls ─────────────────────────────────────────────────── */}
            <Card className="card-elevated">
                <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Year + Month */}
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                            <select
                                aria-label="Year"
                                value={selectedMonth.split('-')[1]}
                                onChange={e => {
                                    const yr = e.target.value;
                                    const months = getMonthsForYear(yr);
                                    const currentAbbrev = selectedMonth.split('-')[0];
                                    const match = months.find(m => m.startsWith(currentAbbrev));
                                    setSelectedMonth(match ?? months[months.length - 1]);
                                }}
                                disabled={status === 'loading'}
                                className="px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                            >
                                {[...getAvailableYears()].reverse().map(yr => (
                                    <option key={yr} value={yr}>20{yr}</option>
                                ))}
                            </select>
                            <select
                                aria-label="Month"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                disabled={status === 'loading'}
                                className="px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                            >
                                {getMonthsForYear(selectedMonth.split('-')[1]).map(m => (
                                    <option key={m} value={m}>{m.split('-')[0]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                aria-label="Search meters by name, account number, or zone"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search meter name, account, zone…"
                                className="h-9 w-full pl-9 pr-8 text-sm rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    aria-label="Clear search"
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition"
                                >
                                    <XIcon className="h-2.5 w-2.5" />
                                </button>
                            )}
                        </div>

                        {/* Expand / Collapse */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={expandAll} className="h-9">
                                Expand all
                            </Button>
                            <Button variant="outline" size="sm" onClick={collapseAll} className="h-9">
                                Collapse all
                            </Button>
                        </div>

                        {/* Refresh */}
                        <Button
                            variant="outline" size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => fetchMonth(selectedMonth)}
                            disabled={status === 'loading'}
                            title="Refresh"
                        >
                            {status === 'loading'
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <RefreshCw className="h-4 w-4" />}
                        </Button>

                        {/* Live + timestamp */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
                                isLive
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                            )}>
                                <Radio className={cn("h-3 w-3", isLive && "motion-safe:animate-pulse")} />
                                {isLive ? "Live" : "Offline"}
                            </span>
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

            {/* ── KPI Cards ─────────────────────────────────────────────────── */}
            {kpis && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <KpiCard
                        label="A1 — MAIN BULK (L1)"
                        value={kpis.hasL1 ? kpis.l1Total : kpis.l2DCTotal}
                        unit="m³"
                        subtitle={kpis.hasL1 ? 'NAMA → Muscat Bay (MTD)' : 'L1 not reported — using L2+DC'}
                        icon={<Droplets className="h-5 w-5" />}
                        tone="primary"
                    />
                    <KpiCard
                        label="A2 — L2 + DC TOTAL"
                        value={kpis.l2DCTotal}
                        unit="m³"
                        subtitle="Zone bulks + direct connections"
                        icon={<Layers className="h-5 w-5" />}
                        tone="blue"
                    />
                    <KpiCard
                        label="NETWORK LOSS"
                        value={kpis.hasL1 ? kpis.loss : null}
                        unit="m³"
                        subtitle={kpis.hasL1 ? 'L1 − (L2 + DC)' : 'Unavailable — L1 not reported'}
                        icon={<TrendingDown className="h-5 w-5" />}
                        tone="amber"
                    />
                    <KpiCard
                        label="NETWORK EFFICIENCY"
                        value={kpis.hasL1 ? kpis.efficiency : null}
                        unit="%"
                        subtitle={kpis.hasL1 ? 'Distribution efficiency ratio' : 'Unavailable — L1 not reported'}
                        icon={<Activity className="h-5 w-5" />}
                        tone="emerald"
                    />
                </div>
            )}

            {/* ── Error state ────────────────────────────────────────────────── */}
            {status === 'error' && (
                <Card className="card-elevated">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                        <WifiOff className="h-8 w-8 text-red-500" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Failed to Load Hierarchy
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">{errorMsg}</p>
                        <Button onClick={() => fetchMonth(selectedMonth)} variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" /> Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── Hierarchy Table ───────────────────────────────────────────── */}
            {status !== 'error' && (
                <Card className="card-elevated overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[13px]">
                                <thead>
                                    <tr className="bg-primary text-white">
                                        <th className="sticky left-0 z-20 bg-primary text-left px-4 py-3 font-semibold min-w-[280px] sm:min-w-[320px]">
                                            Meter Hierarchy
                                        </th>
                                        <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Acct #</th>
                                        <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Level</th>
                                        {Array.from({ length: nDays }, (_, i) => i + 1).map(d => (
                                            <th
                                                key={d}
                                                className="px-2 py-3 text-right font-semibold whitespace-nowrap tabular-nums"
                                            >
                                                {d}
                                            </th>
                                        ))}
                                        <th className="sticky right-0 z-20 bg-primary px-4 py-3 text-right font-semibold whitespace-nowrap">
                                            Month Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {status === 'loading' && rows.length === 0 && (
                                        <tr>
                                            <td colSpan={colSpan} className="text-center py-16 text-slate-400">
                                                <Loader2 className="h-8 w-8 animate-spin text-secondary inline-block" />
                                            </td>
                                        </tr>
                                    )}
                                    {visibleNodes.map(node => {
                                        const color = LEVEL_COLORS[node.level];
                                        const isExpanded = expanded.has(node.accountNumber);
                                        const hasChildren = node.children.length > 0;
                                        return (
                                            <tr
                                                key={node.accountNumber}
                                                className={cn(
                                                    "border-b border-slate-100 dark:border-slate-800 transition-colors",
                                                    "hover:bg-slate-50/60 dark:hover:bg-slate-800/40",
                                                )}
                                            >
                                                <td
                                                    className={cn(
                                                        "sticky left-0 z-10 py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-100 min-w-[280px] sm:min-w-[320px]",
                                                        color.bg,
                                                    )}
                                                    style={{ paddingLeft: `${16 + node.depth * 18}px` }}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        {hasChildren ? (
                                                            <button
                                                                onClick={() => toggle(node.accountNumber)}
                                                                className="h-5 w-5 flex items-center justify-center rounded hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition shrink-0"
                                                                aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                                                                aria-expanded={isExpanded}
                                                            >
                                                                {isExpanded
                                                                    ? <ChevronDown className="h-3.5 w-3.5" />
                                                                    : <ChevronRight className="h-3.5 w-3.5" />}
                                                            </button>
                                                        ) : (
                                                            <span className="inline-block w-5 shrink-0" />
                                                        )}
                                                        <span className={cn(
                                                            "truncate",
                                                            node.level === 'L1' && "font-bold text-primary dark:text-primary-foreground",
                                                            node.level === 'L2' && "font-semibold",
                                                        )}>
                                                            {node.meterName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                                                    {node.accountNumber}
                                                </td>
                                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold",
                                                        color.badge,
                                                    )}>
                                                        {node.level}
                                                    </span>
                                                </td>
                                                {node.dailyReadings.map((v, idx) => (
                                                    <td
                                                        key={idx}
                                                        className={cn(
                                                            "px-2 py-2.5 text-right tabular-nums whitespace-nowrap",
                                                            v === null || v === 0
                                                                ? "text-slate-300 dark:text-slate-600"
                                                                : "text-slate-600 dark:text-slate-300",
                                                        )}
                                                    >
                                                        {v === null ? '—' : fmt(v, v < 10 ? 1 : 0)}
                                                    </td>
                                                ))}
                                                <td className={cn(
                                                    "sticky right-0 z-10 px-4 py-2.5 text-right font-bold tabular-nums whitespace-nowrap",
                                                    color.bg,
                                                    color.text,
                                                )}>
                                                    {fmt(node.monthTotal)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {tree && visibleNodes.length === 0 && (
                                        <tr>
                                            <td colSpan={colSpan} className="text-center py-12 text-slate-500">
                                                No meters match &quot;{search}&quot;.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Legend ────────────────────────────────────────────────────── */}
            {tree && (
                <Card className="card-elevated">
                    <CardContent className="p-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">Legend:</span>
                        {(['L1', 'L2', 'L3', 'L4', 'DC'] as const).map(lvl => (
                            <span key={lvl} className="inline-flex items-center gap-1.5">
                                <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold", LEVEL_COLORS[lvl].badge)}>
                                    {lvl}
                                </span>
                                <span>
                                    {lvl === 'L1' && 'Main Bulk (NAMA)'}
                                    {lvl === 'L2' && 'Zone Bulks'}
                                    {lvl === 'L3' && 'Buildings & Villas'}
                                    {lvl === 'L4' && 'Apartments / Common'}
                                    {lvl === 'DC' && 'Direct Connections'}
                                </span>
                            </span>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
