"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Building2, Activity, Home, ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react";
import {
    BUILDING_CONFIG, BUILDING_CHILD_METERS,
    NULL_AS_ZERO_ACCOUNTS, type ZoneBulkConfig,
} from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { cn } from "@/lib/utils";
import {
    type ZoneRow, type BuildingRow, type SortState,
    CHART_COLORS, PALETTE, r2, n, diffCell,
} from "./report-types";
import {
    HierarchyStatCard, Th, TableSearch, StatusChip,
    TablePagination, thBase, tdBase,
} from "./report-primitives";

// ZoneAnalyticsPanel extracted to zone-analytics.tsx

// ─── Zone L3 Meters Table — All-Days View ────────────────────────────────────

export function ZoneL3Table({
    zoneRow,
    zoneConfig,
    monthData,
    buildingRows,
}: {
    zoneRow: ZoneRow;
    zoneConfig: ZoneBulkConfig;
    monthData: SupabaseDailyWaterConsumption[];
    buildingRows: BuildingRow[];
}) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortState>({ key: '', dir: null });
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    // Track which L3-building rows are currently expanded to reveal their L4 children
    const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
    const toggleBuilding = useCallback((bulkAccount: string) => {
        setExpandedBuildings(prev => {
            const next = new Set(prev);
            if (next.has(bulkAccount)) next.delete(bulkAccount);
            else next.add(bulkAccount);
            return next;
        });
    }, []);

    // Build account map for quick lookups
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    // Map building bulk accounts to building info (only buildings in this zone)
    const buildingMap = useMemo(() => {
        const map = new Map<string, BuildingRow>();
        for (const b of buildingRows) {
            if (zoneConfig.l3Accounts.includes(b.bulkAccount)) {
                map.set(b.bulkAccount, b);
            }
        }
        return map;
    }, [buildingRows, zoneConfig]);

    // Determine latest day with data for any L3 account in this zone
    const latestDay = useMemo(() => {
        let maxDay = 0;
        for (const account of zoneConfig.l3Accounts) {
            const row = accountMap.get(account);
            if (!row) continue;
            for (let d = 31; d >= 1; d--) {
                if (d <= maxDay) break;
                const val = row[`day_${d}` as keyof SupabaseDailyWaterConsumption];
                if (val != null) { maxDay = d; break; }
            }
        }
        return Math.max(maxDay, 1);
    }, [accountMap, zoneConfig]);

    const days = useMemo(() => Array.from({ length: latestDay }, (_, i) => i + 1), [latestDay]);

    // Build L3 meter list with all daily readings
    const l3Meters = useMemo(() => {
        return zoneConfig.l3Accounts.map(account => {
            const building = buildingMap.get(account) ?? null;
            const dbRow = accountMap.get(account);
            const isNullAsZero = NULL_AS_ZERO_ACCOUNTS.has(account);

            const dailyValues: (number | null)[] = [];
            let total = 0;
            for (let d = 1; d <= latestDay; d++) {
                const raw = dbRow ? (dbRow[`day_${d}` as keyof SupabaseDailyWaterConsumption] as number | null) : null;
                const val = raw != null ? r2(Number(raw)) : isNullAsZero ? 0 : null;
                dailyValues.push(val);
                total += val ?? 0;
            }

            return {
                account,
                isNullAsZero,
                building,
                label: building ? building.buildingName : account,
                dailyValues,
                total: r2(total),
            };
        });
    }, [zoneConfig, accountMap, buildingMap, latestDay]);

    // Per-day ΣL3 totals for footer
    const dayTotals = useMemo(() => {
        return days.map((_, i) => r2(l3Meters.reduce((sum, m) => sum + (m.dailyValues[i] ?? 0), 0)));
    }, [days, l3Meters]);
    const grandTotal = r2(dayTotals.reduce((s, v) => s + v, 0));

    // L2 per-day values for tiles
    const l2DayTotals = useMemo(() => {
        const row = accountMap.get(zoneConfig.l2Account);
        return days.map(d => {
            if (!row) return null;
            const val = row[`day_${d}` as keyof SupabaseDailyWaterConsumption];
            return val != null ? r2(Number(val)) : null;
        });
    }, [accountMap, zoneConfig, days]);
    const l2GrandTotal = r2(l2DayTotals.reduce<number>((s, v) => s + (v ?? 0), 0));
    const diffGrandTotal = r2(l2GrandTotal - grandTotal);

    // Per-day difference: L2 bulk minus ΣL3 for each reporting day
    const diffByDay = useMemo(
        () => days.map((_, i) => r2((l2DayTotals[i] ?? 0) - dayTotals[i])),
        [days, l2DayTotals, dayTotals],
    );

    // ── Per-building L4 drill-down data ───────────────────────────────────────
    // For every L3 meter in this zone that is itself a building bulk, compute
    // the day-by-day readings for each of its L4 children, the ΣL4 totals,
    // and the building-level difference (L3 bulk − ΣL4). Memoised off `days`
    // and the account map so it recomputes only when the reporting window or
    // data changes.
    interface BuildingChildReading {
        account: string;
        label: string;
        type: 'Apartment' | 'Common';
        dailyValues: (number | null)[];
        total: number;
    }
    interface BuildingL4Detail {
        buildingName: string;
        bulkDailyValues: (number | null)[];
        bulkTotal: number;
        children: BuildingChildReading[];
        childDayTotals: number[];
        childGrandTotal: number;
        diffDayTotals: number[];
        diffGrandTotal: number;
    }
    const buildingL4Data = useMemo<Map<string, BuildingL4Detail>>(() => {
        const map = new Map<string, BuildingL4Detail>();
        for (const b of BUILDING_CONFIG) {
            if (!zoneConfig.l3Accounts.includes(b.bulkAccount)) continue;

            const bulkRow = accountMap.get(b.bulkAccount);
            const bulkDailyValues: (number | null)[] = days.map(d => {
                if (!bulkRow) return null;
                const v = bulkRow[`day_${d}` as keyof SupabaseDailyWaterConsumption];
                return v != null ? r2(Number(v)) : null;
            });
            const bulkTotal = r2(bulkDailyValues.reduce<number>((s, v) => s + (v ?? 0), 0));

            const info = BUILDING_CHILD_METERS[b.buildingName] ?? [];
            const children: BuildingChildReading[] = b.l4Accounts.map(acc => {
                const meta = info.find(c => c.account === acc);
                const row = accountMap.get(acc);
                const dailyValues: (number | null)[] = days.map(d => {
                    if (!row) return null;
                    const v = row[`day_${d}` as keyof SupabaseDailyWaterConsumption];
                    return v != null ? r2(Number(v)) : null;
                });
                const total = r2(dailyValues.reduce<number>((s, v) => s + (v ?? 0), 0));
                return {
                    account: acc,
                    label: meta?.label ?? acc,
                    type: meta?.type ?? 'Apartment',
                    dailyValues,
                    total,
                };
            });

            const childDayTotals = days.map((_, i) =>
                r2(children.reduce((s, c) => s + (c.dailyValues[i] ?? 0), 0)),
            );
            const childGrandTotal = r2(childDayTotals.reduce((s, v) => s + v, 0));

            const diffDayTotals = days.map((_, i) =>
                r2((bulkDailyValues[i] ?? 0) - childDayTotals[i]),
            );
            const diffGrandTotal = r2(bulkTotal - childGrandTotal);

            map.set(b.bulkAccount, {
                buildingName: b.buildingName,
                bulkDailyValues,
                bulkTotal,
                children,
                childDayTotals,
                childGrandTotal,
                diffDayTotals,
                diffGrandTotal,
            });
        }
        return map;
    }, [zoneConfig, accountMap, days]);

    // Filter & sort
    const filtered = useMemo(() => {
        let result = [...l3Meters];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(m => m.label.toLowerCase().includes(q) || m.account.includes(q));
        }
        if (sort.dir && sort.key) {
            result.sort((a, b) => {
                let va: number | string, vb: number | string;
                if (sort.key === 'label') { va = a.label; vb = b.label; }
                else if (sort.key === 'total') { va = a.total; vb = b.total; }
                else { va = a.account; vb = b.account; }
                const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                return sort.dir === 'desc' ? -cmp : cmp;
            });
        }
        return result;
    }, [l3Meters, search, sort]);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination to page 1 when search/sort change; storing page in state is needed because users can also change it via pagination controls.
    useEffect(() => { setPage(1); }, [search, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const colCount = 3 + days.length + 1; // Meter, Account, Type, ...days, Total

    return (
        <Card className="card-elevated">
            <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                <div>
                    <CardTitle className="text-base sm:text-lg">{zoneRow.zoneName} — L3 Meters</CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {l3Meters.length} meters — Day 1 to Day {latestDay}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-0 space-y-4">
                {/* Zone summary KPI cards — unified brand palette */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* L2 Bulk — primary purple */}
                    <HierarchyStatCard
                        label="L2 Bulk (m³)"
                        value={n(l2GrandTotal)}
                        icon={<Droplets className="w-4 h-4 sm:w-5 sm:h-5" />}
                        color={PALETTE.primary}
                    />
                    {/* ΣL3 — info blue */}
                    <HierarchyStatCard
                        label="Σ Individuals (m³)"
                        value={n(grandTotal)}
                        icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
                        color={PALETTE.blue}
                    />
                    {/* Difference — mint (ok) / red (high loss) */}
                    <HierarchyStatCard
                        label="Difference"
                        value={diffCell(diffGrandTotal)}
                        icon={<ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                        color={Math.abs(diffGrandTotal) > 20 ? PALETTE.red : PALETTE.mint}
                        valueColor={Math.abs(diffGrandTotal) > 20 ? PALETTE.red : undefined}
                    />
                </div>

                <TableSearch value={search} onChange={setSearch} placeholder="Search meter or account..." />

                {/* Horizontally scrollable table */}
                <div className="relative overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 border-t border-slate-100 dark:border-slate-800">
                    <table className="w-full border-collapse" style={{ minWidth: `${420 + days.length * 72}px` }}>
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <Th
                                    sortKey="label" sort={sort} onSort={setSort}
                                    className="sticky left-0 z-10 bg-white dark:bg-slate-900 min-w-[150px]"
                                >Meter</Th>
                                <Th sortKey="account" sort={sort} onSort={setSort} className="min-w-[100px]">Account</Th>
                                <th scope="col" className={cn(thBase, "text-center min-w-[90px]")}>Type</th>
                                {days.map(d => (
                                    <th scope="col" key={d} className={cn(thBase, "text-right min-w-[64px] px-2")}>D{d}</th>
                                ))}
                                <Th
                                    sortKey="total" sort={sort} onSort={setSort}
                                    className="text-right min-w-[80px] bg-slate-50/80 dark:bg-slate-800/40"
                                >Total</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* ── L2 Bulk summary row (top) ──────────────────────
                               Always visible, unaffected by pagination/search.  */}
                            <tr
                                className="border-b-2"
                                style={{
                                    backgroundColor: `${PALETTE.primary}14`,
                                    borderBottomColor: `${PALETTE.primary}40`,
                                }}
                            >
                                <td
                                    className={cn(tdBase, "font-bold sticky left-0 z-10")}
                                    style={{
                                        backgroundColor: `${PALETTE.primary}14`,
                                        color: PALETTE.primary,
                                        boxShadow: `inset 4px 0 0 ${PALETTE.primary}`,
                                    }}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Droplets className="h-3.5 w-3.5 shrink-0" />
                                        {zoneRow.zoneName} Bulk (L2)
                                    </span>
                                </td>
                                <td className={cn(tdBase, "font-mono text-[11px]")} style={{ color: `${PALETTE.primary}AA` }}>
                                    {zoneConfig.l2Account}
                                </td>
                                <td className={cn(tdBase, "text-center")}>
                                    <StatusChip label="L2 BULK" color="primary" />
                                </td>
                                {l2DayTotals.map((val, i) => (
                                    <td
                                        key={i}
                                        className={cn(tdBase, "text-right tabular-nums px-2 text-[12px] font-bold")}
                                        style={{ color: PALETTE.primary }}
                                    >
                                        {val === null ? (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        ) : (
                                            n(val)
                                        )}
                                    </td>
                                ))}
                                <td
                                    className={cn(tdBase, "text-right tabular-nums font-bold")}
                                    style={{
                                        backgroundColor: `${PALETTE.primary}20`,
                                        color: PALETTE.primary,
                                    }}
                                >
                                    {n(l2GrandTotal)}
                                </td>
                            </tr>

                            {/* ── Individual L3 meter rows (paginated/filtered) ── */}
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={colCount} className="text-center py-10 text-[13px] text-slate-400 dark:text-slate-500">
                                        No meters found
                                    </td>
                                </tr>
                            ) : paginated.flatMap(meter => {
                                const detail = meter.building ? buildingL4Data.get(meter.account) : null;
                                const isExpanded = !!detail && expandedBuildings.has(meter.account);
                                const rows: React.ReactNode[] = [];

                                // ── The L3 meter row itself ───────────────────────
                                rows.push(
                                    <tr
                                        key={meter.account}
                                        className={cn(
                                            "border-b border-slate-50 dark:border-slate-800/60 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30",
                                            !isExpanded && "even:bg-slate-50/40 dark:even:bg-slate-800/20",
                                        )}
                                    >
                                        <td className={cn(tdBase, "font-semibold sticky left-0 z-10 bg-white dark:bg-slate-900")}>
                                            <span className="inline-flex items-center gap-2">
                                                {detail ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleBuilding(meter.account)}
                                                        aria-expanded={isExpanded}
                                                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${detail.buildingName} L4 meters`}
                                                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        style={{ color: PALETTE.primary }}
                                                    >
                                                        {isExpanded
                                                            ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                                                            : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                                                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="font-semibold">{detail.buildingName}</span>
                                                    </button>
                                                ) : meter.building ? (
                                                    <>
                                                        <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: PALETTE.primary }} />
                                                        {meter.building.buildingName}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Home className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                        {meter.account}
                                                        {meter.isNullAsZero && <StatusChip label="IRR" color="primary" />}
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className={cn(tdBase, "font-mono text-[11px] text-slate-400 dark:text-slate-500")}>{meter.account}</td>
                                        <td className={cn(tdBase, "text-center")}>
                                            <StatusChip label={meter.building ? "Building" : "Individual"} color={meter.building ? "primary" : "default"} />
                                        </td>
                                        {meter.dailyValues.map((val, i) => (
                                            <td key={i} className={cn(tdBase, "text-right tabular-nums px-2 text-[12px]")}>
                                                {val === null ? (
                                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                                ) : val === 0 ? (
                                                    <span className="text-slate-400">0.00</span>
                                                ) : (
                                                    n(val)
                                                )}
                                            </td>
                                        ))}
                                        <td className={cn(tdBase, "text-right tabular-nums font-semibold bg-slate-50/80 dark:bg-slate-800/40")}>
                                            {n(meter.total)}
                                        </td>
                                    </tr>,
                                );

                                // ── Expanded: child L4 meters + ΣL4 + diff ───────
                                if (detail && isExpanded) {
                                    // L4 child rows
                                    detail.children.forEach((child, idx) => {
                                        rows.push(
                                            <tr
                                                key={`${meter.account}-child-${child.account}`}
                                                className="border-b border-slate-50 dark:border-slate-800/60"
                                                style={{ backgroundColor: `${PALETTE.neutral}26` }}
                                            >
                                                <td
                                                    className={cn(tdBase, "pl-10 font-normal sticky left-0 z-10 text-[13px]")}
                                                    style={{
                                                        backgroundColor: `${PALETTE.neutral}26`,
                                                        boxShadow: `inset 4px 0 0 ${PALETTE.primary}30`,
                                                    }}
                                                >
                                                    <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                        {idx === detail.children.length - 1
                                                            ? <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE.primary }} />
                                                            : <span className="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />}
                                                        {child.label}
                                                    </span>
                                                </td>
                                                <td className={cn(tdBase, "font-mono text-[11px] text-slate-400 dark:text-slate-500")}>{child.account}</td>
                                                <td className={cn(tdBase, "text-center")}>
                                                    <StatusChip
                                                        label={child.type === 'Common' ? 'Common' : 'Apartment'}
                                                        color={child.type === 'Common' ? 'primary' : 'default'}
                                                    />
                                                </td>
                                                {child.dailyValues.map((val, i) => (
                                                    <td key={i} className={cn(tdBase, "text-right tabular-nums px-2 text-[12px] font-normal")}>
                                                        {val === null ? (
                                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                                        ) : val === 0 ? (
                                                            <span className="text-slate-400">0.00</span>
                                                        ) : (
                                                            n(val)
                                                        )}
                                                    </td>
                                                ))}
                                                <td className={cn(tdBase, "text-right tabular-nums font-semibold bg-slate-50/80 dark:bg-slate-800/40")}>
                                                    {n(child.total)}
                                                </td>
                                            </tr>,
                                        );
                                    });

                                    // ΣL4 sub-footer — sum of apartments
                                    rows.push(
                                        <tr
                                            key={`${meter.account}-l4sum`}
                                            style={{ backgroundColor: `${PALETTE.blue}12` }}
                                        >
                                            <td
                                                className={cn(tdBase, "pl-10 font-bold sticky left-0 z-10 text-[12px]")}
                                                style={{
                                                    backgroundColor: `${PALETTE.blue}12`,
                                                    color: PALETTE.blue,
                                                    boxShadow: `inset 4px 0 0 ${PALETTE.blue}`,
                                                }}
                                                colSpan={3}
                                            >
                                                Σ Individuals — {detail.children.length} meters
                                            </td>
                                            {detail.childDayTotals.map((t, i) => (
                                                <td
                                                    key={i}
                                                    className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}
                                                    style={{ color: PALETTE.blue }}
                                                >
                                                    {n(t)}
                                                </td>
                                            ))}
                                            <td
                                                className={cn(tdBase, "text-right tabular-nums font-bold")}
                                                style={{ backgroundColor: `${PALETTE.blue}20`, color: PALETTE.blue }}
                                            >
                                                {n(detail.childGrandTotal)}
                                            </td>
                                        </tr>,
                                    );

                                    // Difference sub-footer — bulk − sum
                                    const isHighBuildingDiff = Math.abs(detail.diffGrandTotal) > 5;
                                    const diffTint = isHighBuildingDiff ? PALETTE.red : PALETTE.mint;
                                    rows.push(
                                        <tr
                                            key={`${meter.account}-l4diff`}
                                            className="border-b-2"
                                            style={{
                                                backgroundColor: `${diffTint}14`,
                                                borderBottomColor: `${diffTint}40`,
                                            }}
                                        >
                                            <td
                                                className={cn(tdBase, "pl-10 font-bold sticky left-0 z-10 text-[12px]")}
                                                style={{
                                                    backgroundColor: `${diffTint}14`,
                                                    color: diffTint,
                                                    boxShadow: `inset 4px 0 0 ${diffTint}`,
                                                }}
                                                colSpan={3}
                                            >
                                                Difference (Bulk − Σ)
                                            </td>
                                            {detail.diffDayTotals.map((t, i) => (
                                                <td
                                                    key={i}
                                                    className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}
                                                    style={{ color: diffTint }}
                                                >
                                                    {diffCell(t)}
                                                </td>
                                            ))}
                                            <td
                                                className={cn(tdBase, "text-right tabular-nums font-bold")}
                                                style={{ backgroundColor: `${diffTint}20`, color: diffTint }}
                                            >
                                                {diffCell(detail.diffGrandTotal)}
                                            </td>
                                        </tr>,
                                    );
                                }

                                return rows;
                            })}

                            {/* ── Σ Individuals footer row (zone level) ──────── */}
                            <tr
                                className="border-t-2"
                                style={{
                                    backgroundColor: `${PALETTE.blue}12`,
                                    borderTopColor: `${PALETTE.blue}40`,
                                }}
                            >
                                <td
                                    className={cn(tdBase, "font-bold sticky left-0 z-10")}
                                    colSpan={3}
                                    style={{
                                        backgroundColor: `${PALETTE.blue}12`,
                                        color: PALETTE.blue,
                                        boxShadow: `inset 4px 0 0 ${PALETTE.blue}`,
                                    }}
                                >
                                    Σ Individuals — {l3Meters.length} meters
                                </td>
                                {dayTotals.map((t, i) => (
                                    <td
                                        key={i}
                                        className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}
                                        style={{ color: PALETTE.blue }}
                                    >
                                        {n(t)}
                                    </td>
                                ))}
                                <td
                                    className={cn(tdBase, "text-right tabular-nums font-bold")}
                                    style={{ backgroundColor: `${PALETTE.blue}20`, color: PALETTE.blue }}
                                >
                                    {n(grandTotal)}
                                </td>
                            </tr>

                            {/* ── Difference footer row (zone level) ─────────── */}
                            {(() => {
                                const isHighZoneDiff = Math.abs(diffGrandTotal) > 20;
                                const diffTint = isHighZoneDiff ? PALETTE.red : PALETTE.mint;
                                return (
                                    <tr
                                        className="border-t"
                                        style={{
                                            backgroundColor: `${diffTint}14`,
                                            borderTopColor: `${diffTint}40`,
                                        }}
                                    >
                                        <td
                                            className={cn(tdBase, "font-bold sticky left-0 z-10")}
                                            colSpan={3}
                                            style={{
                                                backgroundColor: `${diffTint}14`,
                                                color: diffTint,
                                                boxShadow: `inset 4px 0 0 ${diffTint}`,
                                            }}
                                        >
                                            Difference (L2 − Σ Individuals)
                                        </td>
                                        {diffByDay.map((t, i) => (
                                            <td
                                                key={i}
                                                className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}
                                                style={{ color: diffTint }}
                                            >
                                                {diffCell(t)}
                                            </td>
                                        ))}
                                        <td
                                            className={cn(tdBase, "text-right tabular-nums font-bold")}
                                            style={{ backgroundColor: `${diffTint}20`, color: diffTint }}
                                        >
                                            {diffCell(diffGrandTotal)}
                                        </td>
                                    </tr>
                                );
                            })()}
                        </tbody>
                    </table>
                    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent sm:hidden" />
                </div>

                {filtered.length > rowsPerPage && (
                    <TablePagination
                        page={page}
                        totalPages={totalPages}
                        totalItems={filtered.length}
                        onPageChange={setPage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={rpp => { setRowsPerPage(rpp); setPage(1); }}
                    />
                )}
            </CardContent>
        </Card>
    );
}
