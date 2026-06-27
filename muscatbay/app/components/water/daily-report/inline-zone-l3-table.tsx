"use client";

// ─── ZoneL3Table — extracted verbatim from DailyWaterReport.tsx ──────────────
// Pure relocation; no behavior changes. Imports the inline palette / helpers
// from inline-shared.tsx (NOT the enhanced versions in zone-panel.tsx).

import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
    Droplets, Building2, Activity, Home,
    ChevronDown, ChevronRight, ArrowUpDown,
} from "lucide-react";
import {
    BUILDING_CONFIG, BUILDING_CHILD_METERS, NULL_AS_ZERO_ACCOUNTS,
    type ZoneBulkConfig,
} from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { cn } from "@/lib/utils";
import {
    type ZoneRow, type BuildingRow, type SortState,
    PALETTE, r2, n, diffCell,
    HierarchyStatCard, Th, TableSearch, StatusChip,
    TablePagination, thBase, tdBase,
} from "./inline-shared";

export { ZoneL3Table };

// ─── Dark-mode-aware status tokens for DOM cells ─────────────────────────────
// PALETTE stays for chart-only / HierarchyStatCard props. For table cells we
// route status colors through CSS variables so they auto-flip in dark mode.
// `tint(role, pct)` builds a translucent background from the role's base var;
// the `*Text` vars are the WCAG-tuned foreground colors (light in dark theme).
type StatusRole = 'primary' | 'info' | 'success' | 'danger';
const STATUS_BASE: Record<StatusRole, string> = {
    primary: 'var(--primary)',
    info: 'var(--mb-info)',
    success: 'var(--mb-success)',
    danger: 'var(--mb-danger)',
};
const STATUS_TEXT: Record<StatusRole, string> = {
    primary: 'var(--primary)',
    info: 'var(--mb-info-text)',
    success: 'var(--mb-success-text)',
    danger: 'var(--mb-danger-text)',
};
const tint = (role: StatusRole, pct: number) =>
    `color-mix(in srgb, ${STATUS_BASE[role]} ${pct}%, transparent)`;

// ─── Zone L3 Meters Table — All-Days View ────────────────────────────────────

function ZoneL3Table({
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
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mt-1">
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
                <div className="relative -mx-4 sm:-mx-5 md:-mx-6">
                <Table
                    role="region"
                    aria-label="Zone daily readings. Scroll horizontally to view all days."
                    tabIndex={0}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    style={{ minWidth: `${420 + days.length * 72}px` }}
                    data-density="compact"
                >
                    <TableHeader>
                        <TableRow className="border-b border-border dark:border-border">
                            <Th
                                sortKey="label" sort={sort} onSort={setSort}
                                className="sticky left-0 z-10 bg-white dark:bg-muted min-w-[150px]"
                            >Meter</Th>
                            <Th sortKey="account" sort={sort} onSort={setSort} className="min-w-[100px]">Account</Th>
                            <TableHead scope="col" className={cn(thBase, "text-center min-w-[90px]")}>Type</TableHead>
                            {days.map(d => (
                                <TableHead scope="col" key={d} className={cn(thBase, "text-right min-w-[64px] px-2")}>D{d}</TableHead>
                            ))}
                            <Th
                                sortKey="total" sort={sort} onSort={setSort}
                                className="text-right min-w-[80px] bg-muted/80 dark:bg-muted/40"
                            >Total</Th>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* ── L2 Bulk summary row (top) ──────────────────────
                           Always visible, unaffected by pagination/search.  */}
                        <TableRow
                            className="border-b-2"
                            style={{
                                backgroundColor: tint('primary', 8),
                                borderBottomColor: tint('primary', 25),
                            }}
                        >
                            <TableCell
                                className={cn(tdBase, "font-medium sticky left-0 z-10")}
                                style={{
                                    backgroundColor: tint('primary', 8),
                                    color: STATUS_TEXT.primary,
                                    boxShadow: `inset 4px 0 0 ${STATUS_BASE.primary}`,
                                }}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Droplets className="h-3.5 w-3.5 shrink-0" />
                                    {zoneRow.zoneName} Bulk (L2)
                                </span>
                            </TableCell>
                            <TableCell className={cn(tdBase, "font-mono text-[11px]")} style={{ color: `color-mix(in srgb, ${STATUS_TEXT.primary} 67%, transparent)` }}>
                                {zoneConfig.l2Account}
                            </TableCell>
                            <TableCell className={cn(tdBase, "text-center")}>
                                <StatusChip label="L2 BULK" color="primary" />
                            </TableCell>
                            {l2DayTotals.map((val, i) => (
                                <TableCell
                                    key={i}
                                    className={cn(tdBase, "text-right tabular-nums px-2 text-[12px] font-medium")}
                                    style={{ color: STATUS_TEXT.primary }}
                                >
                                    {val === null ? (
                                        <span className="text-muted-foreground/70 dark:text-muted-foreground">—</span>
                                    ) : (
                                        n(val)
                                    )}
                                </TableCell>
                            ))}
                            <TableCell
                                className={cn(tdBase, "text-right tabular-nums font-medium")}
                                style={{
                                    backgroundColor: tint('primary', 12),
                                    color: STATUS_TEXT.primary,
                                }}
                            >
                                {n(l2GrandTotal)}
                            </TableCell>
                        </TableRow>

                        {/* ── Individual L3 meter rows (paginated/filtered) ── */}
                        {paginated.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={colCount} className="text-center py-10 text-[13px] text-muted-foreground dark:text-muted-foreground">
                                    No meters found
                                </TableCell>
                            </TableRow>
                        ) : paginated.flatMap(meter => {
                            const detail = meter.building ? buildingL4Data.get(meter.account) : null;
                            const isExpanded = !!detail && expandedBuildings.has(meter.account);
                            const rows: React.ReactNode[] = [];

                            // ── The L3 meter row itself ───────────────────────
                            rows.push(
                                <TableRow
                                    key={meter.account}
                                    className={cn(
                                        "border-b border-border/60 dark:border-border/60 transition-colors hover:bg-muted/70 dark:hover:bg-muted/30",
                                        !isExpanded && "even:bg-muted/40 dark:even:bg-muted/20",
                                    )}
                                >
                                    <TableCell className={cn(tdBase, "font-semibold sticky left-0 z-10 bg-white dark:bg-muted")}>
                                        <span className="inline-flex items-center gap-2">
                                            {detail ? (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleBuilding(meter.account)}
                                                    aria-expanded={isExpanded}
                                                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${detail.buildingName} L4 meters`}
                                                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 -ml-1 hover:bg-muted dark:hover:bg-muted transition-colors"
                                                    style={{ color: STATUS_TEXT.primary }}
                                                >
                                                    {isExpanded
                                                        ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                                                        : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="font-semibold">{detail.buildingName}</span>
                                                </button>
                                            ) : meter.building ? (
                                                <>
                                                    <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                    {meter.building.buildingName}
                                                </>
                                            ) : (
                                                <>
                                                    <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    {meter.account}
                                                    {meter.isNullAsZero && <StatusChip label="IRR" color="primary" />}
                                                </>
                                            )}
                                        </span>
                                    </TableCell>
                                    <TableCell className={cn(tdBase, "font-mono text-[11px] text-muted-foreground dark:text-muted-foreground")}>{meter.account}</TableCell>
                                    <TableCell className={cn(tdBase, "text-center")}>
                                        <StatusChip label={meter.building ? "Building" : "Individual"} color={meter.building ? "primary" : "default"} />
                                    </TableCell>
                                    {meter.dailyValues.map((val, i) => (
                                        <TableCell key={i} className={cn(tdBase, "text-right tabular-nums px-2 text-[12px]")}>
                                            {val === null ? (
                                                <span className="text-muted-foreground/70 dark:text-muted-foreground">—</span>
                                            ) : val === 0 ? (
                                                <span className="text-muted-foreground">0.00</span>
                                            ) : (
                                                n(val)
                                            )}
                                        </TableCell>
                                    ))}
                                    <TableCell className={cn(tdBase, "text-right tabular-nums font-semibold bg-muted/80 dark:bg-muted/40")}>
                                        {n(meter.total)}
                                    </TableCell>
                                </TableRow>,
                            );

                            // ── Expanded: child L4 meters + ΣL4 + diff ───────
                            if (detail && isExpanded) {
                                // L4 child rows
                                detail.children.forEach((child, idx) => {
                                    rows.push(
                                        <TableRow
                                            key={`${meter.account}-child-${child.account}`}
                                            className="border-b border-border/60 dark:border-border/60 bg-muted/40 dark:bg-muted/20"
                                        >
                                            <TableCell
                                                className={cn(tdBase, "pl-10 font-normal sticky left-0 z-10 text-[13px] bg-muted/40 dark:bg-muted/20")}
                                                style={{
                                                    boxShadow: `inset 4px 0 0 ${tint('primary', 19)}`,
                                                }}
                                            >
                                                <span className="inline-flex items-center gap-2 text-muted-foreground dark:text-muted-foreground/70">
                                                    {idx === detail.children.length - 1
                                                        ? <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_BASE.primary }} />
                                                        : <span className="inline-block w-2 h-2 rounded-full bg-border dark:bg-muted" />}
                                                    {child.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className={cn(tdBase, "font-mono text-[11px] text-muted-foreground dark:text-muted-foreground")}>{child.account}</TableCell>
                                            <TableCell className={cn(tdBase, "text-center")}>
                                                <StatusChip
                                                    label={child.type === 'Common' ? 'Common' : 'Apartment'}
                                                    color={child.type === 'Common' ? 'primary' : 'default'}
                                                />
                                            </TableCell>
                                            {child.dailyValues.map((val, i) => (
                                                <TableCell key={i} className={cn(tdBase, "text-right tabular-nums px-2 text-[12px] font-normal")}>
                                                    {val === null ? (
                                                        <span className="text-muted-foreground/70 dark:text-muted-foreground">—</span>
                                                    ) : val === 0 ? (
                                                        <span className="text-muted-foreground">0.00</span>
                                                    ) : (
                                                        n(val)
                                                    )}
                                                </TableCell>
                                            ))}
                                            <TableCell className={cn(tdBase, "text-right tabular-nums font-semibold bg-muted/80 dark:bg-muted/40")}>
                                                {n(child.total)}
                                            </TableCell>
                                        </TableRow>,
                                    );
                                });

                                // ΣL4 sub-footer — sum of apartments
                                rows.push(
                                    <TableRow
                                        key={`${meter.account}-l4sum`}
                                        style={{ backgroundColor: tint('info', 7) }}
                                    >
                                        <TableCell
                                            className={cn(tdBase, "pl-10 font-medium sticky left-0 z-10 text-[12px]")}
                                            style={{
                                                backgroundColor: tint('info', 7),
                                                color: STATUS_TEXT.info,
                                                boxShadow: `inset 4px 0 0 ${STATUS_BASE.info}`,
                                            }}
                                            colSpan={3}
                                        >
                                            Σ Individuals — {detail.children.length} meters
                                        </TableCell>
                                        {detail.childDayTotals.map((t, i) => (
                                            <TableCell
                                                key={i}
                                                className={cn(tdBase, "text-right tabular-nums font-medium px-2 text-[12px]")}
                                                style={{ color: STATUS_TEXT.info }}
                                            >
                                                {n(t)}
                                            </TableCell>
                                        ))}
                                        <TableCell
                                            className={cn(tdBase, "text-right tabular-nums font-medium")}
                                            style={{ backgroundColor: tint('info', 12), color: STATUS_TEXT.info }}
                                        >
                                            {n(detail.childGrandTotal)}
                                        </TableCell>
                                    </TableRow>,
                                );

                                // Difference sub-footer — bulk − sum
                                const isHighBuildingDiff = Math.abs(detail.diffGrandTotal) > 5;
                                const diffRole: StatusRole = isHighBuildingDiff ? 'danger' : 'success';
                                rows.push(
                                    <TableRow
                                        key={`${meter.account}-l4diff`}
                                        className="border-b-2"
                                        style={{
                                            backgroundColor: tint(diffRole, 8),
                                            borderBottomColor: tint(diffRole, 25),
                                        }}
                                    >
                                        <TableCell
                                            className={cn(tdBase, "pl-10 font-medium sticky left-0 z-10 text-[12px]")}
                                            style={{
                                                backgroundColor: tint(diffRole, 8),
                                                color: STATUS_TEXT[diffRole],
                                                boxShadow: `inset 4px 0 0 ${STATUS_BASE[diffRole]}`,
                                            }}
                                            colSpan={3}
                                        >
                                            Difference (Bulk − Σ)
                                        </TableCell>
                                        {detail.diffDayTotals.map((t, i) => (
                                            <TableCell
                                                key={i}
                                                className={cn(tdBase, "text-right tabular-nums font-medium px-2 text-[12px]")}
                                                style={{ color: STATUS_TEXT[diffRole] }}
                                            >
                                                {diffCell(t)}
                                            </TableCell>
                                        ))}
                                        <TableCell
                                            className={cn(tdBase, "text-right tabular-nums font-medium")}
                                            style={{ backgroundColor: tint(diffRole, 12), color: STATUS_TEXT[diffRole] }}
                                        >
                                            {diffCell(detail.diffGrandTotal)}
                                        </TableCell>
                                    </TableRow>,
                                );
                            }

                            return rows;
                        })}

                        {/* ── Σ Individuals footer row (zone level) ──────── */}
                        <TableRow
                            className="border-t-2"
                            style={{
                                backgroundColor: tint('info', 7),
                                borderTopColor: tint('info', 25),
                            }}
                        >
                            <TableCell
                                className={cn(tdBase, "font-medium sticky left-0 z-10")}
                                colSpan={3}
                                style={{
                                    backgroundColor: tint('info', 7),
                                    color: STATUS_TEXT.info,
                                    boxShadow: `inset 4px 0 0 ${STATUS_BASE.info}`,
                                }}
                            >
                                Σ Individuals — {l3Meters.length} meters
                            </TableCell>
                            {dayTotals.map((t, i) => (
                                <TableCell
                                    key={i}
                                    className={cn(tdBase, "text-right tabular-nums font-medium px-2 text-[12px]")}
                                    style={{ color: STATUS_TEXT.info }}
                                >
                                    {n(t)}
                                </TableCell>
                            ))}
                            <TableCell
                                className={cn(tdBase, "text-right tabular-nums font-medium")}
                                style={{ backgroundColor: tint('info', 12), color: STATUS_TEXT.info }}
                            >
                                {n(grandTotal)}
                            </TableCell>
                        </TableRow>

                        {/* ── Difference footer row (zone level) ─────────── */}
                        {(() => {
                            const isHighZoneDiff = Math.abs(diffGrandTotal) > 20;
                            const diffRole: StatusRole = isHighZoneDiff ? 'danger' : 'success';
                            return (
                                <TableRow
                                    className="border-t"
                                    style={{
                                        backgroundColor: tint(diffRole, 8),
                                        borderTopColor: tint(diffRole, 25),
                                    }}
                                >
                                    <TableCell
                                        className={cn(tdBase, "font-medium sticky left-0 z-10")}
                                        colSpan={3}
                                        style={{
                                            backgroundColor: tint(diffRole, 8),
                                            color: STATUS_TEXT[diffRole],
                                            boxShadow: `inset 4px 0 0 ${STATUS_BASE[diffRole]}`,
                                        }}
                                    >
                                        Difference (L2 − Σ Individuals)
                                    </TableCell>
                                    {diffByDay.map((t, i) => (
                                        <TableCell
                                            key={i}
                                            className={cn(tdBase, "text-right tabular-nums font-medium px-2 text-[12px]")}
                                            style={{ color: STATUS_TEXT[diffRole] }}
                                        >
                                            {diffCell(t)}
                                        </TableCell>
                                    ))}
                                    <TableCell
                                        className={cn(tdBase, "text-right tabular-nums font-medium")}
                                        style={{ backgroundColor: tint(diffRole, 12), color: STATUS_TEXT[diffRole] }}
                                    >
                                        {diffCell(diffGrandTotal)}
                                    </TableCell>
                                </TableRow>
                            );
                        })()}
                    </TableBody>
                </Table>
                <div
                    className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent sm:hidden"
                    aria-hidden="true"
                />
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
