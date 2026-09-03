"use client";

// ─── ZoneL3Table — the per-zone L3 meter × day matrix for the Daily report ──────
// Data logic unchanged; presentation is the design-system primitives
// (SectionCard, KpiCard, Badge) and the design tokens only.

import { useState, useCallback, useMemo, useEffect } from "react";
import { Badge, SectionCard } from "@/components/ui";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
    Droplets, Building2, Activity, Home,
    ChevronDown, ChevronRight, ArrowUpDown,
} from "lucide-react";
import {
    BUILDING_CONFIG, BUILDING_CHILD_METERS,
    type ZoneBulkConfig,
} from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { cn } from "@/lib/cn";
import {
    type ZoneRow, type BuildingRow, type SortState,
    r2, n, diffCell,
    Th, TableSearch,
    TablePagination, thBase, tdBase,
} from "./inline-shared";
import { ExportButton, type ExportColumn } from "@/components/shared/data-table";

export { ZoneL3Table };

// ─── Status tokens for DOM cells (DESIGN_SYSTEM.md §2.2) ─────────────────────
// Table cells route status colours through the design tokens so they flip with
// the theme. `tint(role, pct)` builds a translucent background from the role's
// colour; the same colour is the (WCAG-tuned) foreground.
type StatusRole = 'primary' | 'info' | 'success' | 'danger';
const STATUS_BASE: Record<StatusRole, string> = {
    primary: 'var(--color-primary)',
    info: 'var(--color-info)',
    success: 'var(--color-success)',
    danger: 'var(--color-danger)',
};
const STATUS_TEXT: Record<StatusRole, string> = {
    primary: 'var(--color-primary)',
    info: 'var(--color-info)',
    success: 'var(--color-success)',
    danger: 'var(--color-danger)',
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

            const dailyValues: (number | null)[] = [];
            let total = 0;
            for (let d = 1; d <= latestDay; d++) {
                const raw = dbRow ? (dbRow[`day_${d}` as keyof SupabaseDailyWaterConsumption] as number | null) : null;
                const val = raw != null ? r2(Number(raw)) : null;
                dailyValues.push(val);
                total += val ?? 0;
            }

            return {
                account,
                building,
                isIrrigation: String(dbRow?.type ?? "").toLowerCase().includes("irr"),
                // Meter column shows the meter NAME. Buildings use their curated
                // config name; individual meters use the DB `meter_name` (e.g.
                // "Building FM", "Irrigation Tank (Z01_FM)"), falling back to the
                // account number only when no name is recorded.
                label: building ? building.buildingName : (dbRow?.meter_name || account),
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

    // CSV mirrors the on-screen matrix; missing readings export as empty cells,
    // never 0 — the no-fabrication rule.
    type L3MeterRow = (typeof l3Meters)[number];
    const exportColumns = useMemo<ExportColumn<L3MeterRow>[]>(() => [
        { key: 'label', header: 'Meter' },
        { key: 'account', header: 'Account' },
        { key: 'building', header: 'Type', format: (m) => m.building ? 'Building bulk' : m.isIrrigation ? 'Irrigation' : 'Individual' },
        ...days.map((d) => ({
            key: 'dailyValues',
            header: `Day ${d}`,
            format: (m: L3MeterRow) => m.dailyValues[d - 1] ?? '',
        } as ExportColumn<L3MeterRow>)),
        { key: 'total', header: 'Total (m³)' },
    ], [days]);

    const highZoneDiff = Math.abs(diffGrandTotal) > 20;

    return (
        <SectionCard>
            <SectionCard.Header
                icon={Building2}
                title={`${zoneRow.zoneName} — L3 meters`}
                description={`${l3Meters.length} meters — Day 1 to Day ${latestDay}`}
            />
            <SectionCard.Body className="space-y-4">
                {/* Zone summary KPIs — the app-wide StatsGrid tile */}
                <StatsGrid stats={[
                    { label: "L2 Bulk", value: n(l2GrandTotal), unit: "m³", subtitle: "Zone entry meter · month to date", icon: Droplets, variant: "primary" },
                    { label: "Σ Individuals", value: n(grandTotal), unit: "m³", subtitle: `${l3Meters.length} L3 meters · month to date`, icon: Activity, variant: "info" },
                    { label: "Difference", value: diffCell(diffGrandTotal), unit: "m³", subtitle: highZoneDiff ? "Above the 20 m³ tolerance" : "Within the 20 m³ tolerance", icon: ArrowUpDown, variant: highZoneDiff ? "danger" : "success" },
                ]} />

                <div className="flex flex-wrap items-center gap-2">
                    <TableSearch value={search} onChange={setSearch} placeholder="Search meter or account..." />
                    <ExportButton rows={filtered} filename={`water-zone-l3-${zoneRow.zoneName.replace(/\s+/g, '-').toLowerCase()}`} columns={exportColumns} className="ml-auto" />
                </div>

                {/* Horizontally scrollable table */}
                <div className="relative -mx-5">
                <Table
                    containerProps={{
                        role: "region",
                        "aria-label": "Zone daily readings. Scroll horizontally to view all days.",
                        tabIndex: 0,
                        className: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    }}
                    style={{ minWidth: `${420 + days.length * 72}px` }}
                    data-density="compact"
                >
                    <TableHeader>
                        <TableRow className="border-b border-line">
                            <Th
                                sortKey="label" sort={sort} onSort={setSort}
                                className="sticky left-0 z-20 min-w-40 bg-primary"
                            >Meter</Th>
                            <Th sortKey="account" sort={sort} onSort={setSort} className="min-w-24">Account</Th>
                            <TableHead scope="col" className={cn(thBase, "min-w-24 text-center")}>Type</TableHead>
                            {days.map(d => (
                                <TableHead scope="col" key={d} className={cn(thBase, "min-w-16 px-2 text-right")}>D{d}</TableHead>
                            ))}
                            <Th
                                sortKey="total" sort={sort} onSort={setSort}
                                className="min-w-20 text-right"
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
                                className={cn(tdBase, "sticky left-0 z-10 font-medium")}
                                style={{
                                    backgroundColor: tint('primary', 8),
                                    color: STATUS_TEXT.primary,
                                    boxShadow: `inset 4px 0 0 ${STATUS_BASE.primary}`,
                                }}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <Droplets size={16} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                                    {zoneRow.zoneName} Bulk (L2)
                                </span>
                            </TableCell>
                            <TableCell className={cn(tdBase, "meter")} style={{ color: `color-mix(in srgb, ${STATUS_TEXT.primary} 67%, transparent)` }}>
                                {zoneConfig.l2Account}
                            </TableCell>
                            <TableCell className={cn(tdBase, "text-center")}>
                                <Badge tone="info">L2 BULK</Badge>
                            </TableCell>
                            {l2DayTotals.map((val, i) => (
                                <TableCell
                                    key={i}
                                    className={cn(tdBase, "px-2 text-right font-medium tabular-nums")}
                                    style={{ color: STATUS_TEXT.primary }}
                                >
                                    {val === null ? (
                                        <span className="text-muted">—</span>
                                    ) : (
                                        n(val)
                                    )}
                                </TableCell>
                            ))}
                            <TableCell
                                className={cn(tdBase, "text-right font-medium tabular-nums")}
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
                                <TableCell colSpan={colCount} className="py-10 text-center text-label text-muted">
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
                                        "border-b border-line transition-colors hover:bg-component",
                                        !isExpanded && "even:bg-component",
                                    )}
                                >
                                    <TableCell className={cn(tdBase, "sticky left-0 z-10 bg-card font-medium")}>
                                        <span className="inline-flex items-center gap-2">
                                            {detail ? (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleBuilding(meter.account)}
                                                    aria-expanded={isExpanded}
                                                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${detail.buildingName} L4 meters`}
                                                    className="-ml-1 inline-flex items-center gap-1 rounded-control px-1.5 py-1 transition-colors hover:bg-component"
                                                    style={{ color: STATUS_TEXT.primary }}
                                                >
                                                    {isExpanded
                                                        ? <ChevronDown size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                                                        : <ChevronRight size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />}
                                                    <Building2 size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                                                    <span className="font-medium">{detail.buildingName}</span>
                                                </button>
                                            ) : meter.building ? (
                                                <>
                                                    <Building2 size={14} strokeWidth={2} className="shrink-0 text-primary" aria-hidden="true" />
                                                    {meter.building.buildingName}
                                                </>
                                            ) : (
                                                <>
                                                    <Home size={14} strokeWidth={2} className="shrink-0 text-muted" aria-hidden="true" />
                                                    {meter.label}
                                                    {meter.isIrrigation && <Badge tone="info">IRR</Badge>}
                                                </>
                                            )}
                                        </span>
                                    </TableCell>
                                    <TableCell className={cn(tdBase, "meter text-muted")}>{meter.account}</TableCell>
                                    <TableCell className={cn(tdBase, "text-center")}>
                                        <Badge tone={meter.building ? "info" : "neutral"}>{meter.building ? "Building" : "Individual"}</Badge>
                                    </TableCell>
                                    {meter.dailyValues.map((val, i) => (
                                        <TableCell key={i} className={cn(tdBase, "px-2 text-right tabular-nums")}>
                                            {val === null ? (
                                                <span className="text-muted">—</span>
                                            ) : val === 0 ? (
                                                <span className="text-muted">0.00</span>
                                            ) : (
                                                n(val)
                                            )}
                                        </TableCell>
                                    ))}
                                    <TableCell className={cn(tdBase, "bg-component text-right font-medium tabular-nums")}>
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
                                            className="border-b border-line bg-component"
                                        >
                                            <TableCell
                                                className={cn(tdBase, "sticky left-0 z-10 bg-component pl-10 font-normal text-label")}
                                                style={{
                                                    boxShadow: `inset 4px 0 0 ${tint('primary', 19)}`,
                                                }}
                                            >
                                                <span className="inline-flex items-center gap-2 text-muted">
                                                    {idx === detail.children.length - 1
                                                        ? <span className="inline-block h-2 w-2 rounded-pill" style={{ backgroundColor: STATUS_BASE.primary }} />
                                                        : <span className="inline-block h-2 w-2 rounded-pill bg-line" />}
                                                    {child.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className={cn(tdBase, "meter text-muted")}>{child.account}</TableCell>
                                            <TableCell className={cn(tdBase, "text-center")}>
                                                <Badge tone={child.type === 'Common' ? 'info' : 'neutral'}>{child.type === 'Common' ? 'Common' : 'Apartment'}</Badge>
                                            </TableCell>
                                            {child.dailyValues.map((val, i) => (
                                                <TableCell key={i} className={cn(tdBase, "px-2 text-right font-normal tabular-nums")}>
                                                    {val === null ? (
                                                        <span className="text-muted">—</span>
                                                    ) : val === 0 ? (
                                                        <span className="text-muted">0.00</span>
                                                    ) : (
                                                        n(val)
                                                    )}
                                                </TableCell>
                                            ))}
                                            <TableCell className={cn(tdBase, "bg-component text-right font-medium tabular-nums")}>
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
                                            className={cn(tdBase, "sticky left-0 z-10 pl-10 font-medium")}
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
                                                className={cn(tdBase, "px-2 text-right font-medium tabular-nums")}
                                                style={{ color: STATUS_TEXT.info }}
                                            >
                                                {n(t)}
                                            </TableCell>
                                        ))}
                                        <TableCell
                                            className={cn(tdBase, "text-right font-medium tabular-nums")}
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
                                            className={cn(tdBase, "sticky left-0 z-10 pl-10 font-medium")}
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
                                                className={cn(tdBase, "px-2 text-right font-medium tabular-nums")}
                                                style={{ color: STATUS_TEXT[diffRole] }}
                                            >
                                                {diffCell(t)}
                                            </TableCell>
                                        ))}
                                        <TableCell
                                            className={cn(tdBase, "text-right font-medium tabular-nums")}
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
                                className={cn(tdBase, "sticky left-0 z-10 font-medium")}
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
                                    className={cn(tdBase, "px-2 text-right font-medium tabular-nums")}
                                    style={{ color: STATUS_TEXT.info }}
                                >
                                    {n(t)}
                                </TableCell>
                            ))}
                            <TableCell
                                className={cn(tdBase, "text-right font-medium tabular-nums")}
                                style={{ backgroundColor: tint('info', 12), color: STATUS_TEXT.info }}
                            >
                                {n(grandTotal)}
                            </TableCell>
                        </TableRow>

                        {/* ── Difference footer row (zone level) ─────────── */}
                        {(() => {
                            const diffRole: StatusRole = highZoneDiff ? 'danger' : 'success';
                            return (
                                <TableRow
                                    className="border-t"
                                    style={{
                                        backgroundColor: tint(diffRole, 8),
                                        borderTopColor: tint(diffRole, 25),
                                    }}
                                >
                                    <TableCell
                                        className={cn(tdBase, "sticky left-0 z-10 font-medium")}
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
                                            className={cn(tdBase, "px-2 text-right font-medium tabular-nums")}
                                            style={{ color: STATUS_TEXT[diffRole] }}
                                        >
                                            {diffCell(t)}
                                        </TableCell>
                                    ))}
                                    <TableCell
                                        className={cn(tdBase, "text-right font-medium tabular-nums")}
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
                    className="pointer-events-none absolute bottom-0 right-0 top-0 w-8 bg-linear-to-l from-card to-transparent sm:hidden"
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
            </SectionCard.Body>
        </SectionCard>
    );
}
