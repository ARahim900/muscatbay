"use client";

/**
 * Contract expiry & renewal surface.
 *
 * Reads `amc_contractor_expiry` (days_remaining, renewal_action_required_by,
 * priority, renewal_status) — data that already existed in Supabase but was
 * never rendered anywhere. Falls back to the AMC tracker's End Date column when
 * the expiry table is empty, so the countdown still works off real data.
 *
 * This is reporting on dates the database already holds — no work orders, no
 * assignment, no close-out.
 */

import { useMemo } from "react";
import { CalendarClock, CalendarX2, HelpCircle, AlertTriangle } from "lucide-react";
import type { AmcContractorExpiry, ContractorTracker } from "@/entities/contractor";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/skeleton";
import { SeverityChip } from "@/components/shared/inspection";
import { ExportButton, type ExportColumn } from "@/components/shared/data-table";
import { formatContractDate, parseContractDate } from "@/lib/contract-dates";
import { expiryStatus, type ExpiryStatus } from "./contract-dates";

export interface RenewalRow {
    key: string;
    contractor: string;
    /** End date exactly as stored. */
    endDateRaw: string | null;
    status: ExpiryStatus;
    /** Days as recorded in the expiry table — kept only when we cannot compute one. */
    recordedDays: number | null;
    actionRequiredBy: string | null;
    priority: string | null;
    renewalStatus: string | null;
}

const EXPORT_COLUMNS: ExportColumn<RenewalRow>[] = [
    { key: 'contractor', header: 'Contractor' },
    { key: 'endDateRaw', header: 'End Date (as recorded)', format: r => r.endDateRaw ?? '' },
    { key: 'status', header: 'Expiry Status', format: r => r.status.label },
    { key: 'status', header: 'Days Remaining', format: r => r.status.days ?? '' },
    { key: 'actionRequiredBy', header: 'Renewal Action Required By', format: r => r.actionRequiredBy ?? '' },
    { key: 'priority', header: 'Priority', format: r => r.priority ?? '' },
    { key: 'renewalStatus', header: 'Renewal Status', format: r => r.renewalStatus ?? '' },
];

function buildRows(expiry: AmcContractorExpiry[], tracker: ContractorTracker[]): { rows: RenewalRow[]; source: 'expiry-table' | 'tracker' | 'none' } {
    if (expiry.length > 0) {
        const rows = expiry.map((e, i) => ({
            key: `${e.id ?? e.contractor}-${i}`,
            contractor: e.contractor,
            endDateRaw: e.end_date,
            status: expiryStatus(e.end_date),
            recordedDays: e.days_remaining,
            actionRequiredBy: e.renewal_action_required_by,
            priority: e.priority,
            renewalStatus: e.renewal_status,
        }));
        return { rows, source: 'expiry-table' };
    }

    const withDates = tracker.filter(t => (t["End Date"] ?? '').trim() !== '');
    if (withDates.length === 0) return { rows: [], source: 'none' };

    return {
        source: 'tracker',
        rows: withDates.map((t, i) => ({
            key: `${t.Contractor ?? 'unknown'}-${t["Service Provided"] ?? ''}-${i}`,
            contractor: t.Contractor || 'Unnamed contractor',
            endDateRaw: t["End Date"],
            status: expiryStatus(t["End Date"]),
            recordedDays: null,
            actionRequiredBy: null,
            priority: null,
            renewalStatus: t["Renewal Plan"],
        })),
    };
}

/** Worst first: expired, then soonest, unreadable dates last. */
function sortRows(rows: RenewalRow[]): RenewalRow[] {
    return [...rows].sort((a, b) => {
        const ad = a.status.days;
        const bd = b.status.days;
        if (ad === null && bd === null) return a.contractor.localeCompare(b.contractor);
        if (ad === null) return 1;
        if (bd === null) return -1;
        return ad - bd;
    });
}

function Tile({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof CalendarX2; color: string }) {
    return (
        <div className="relative overflow-hidden rounded-[10.5px] border border-border bg-card p-4 shadow-card-standard">
            <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: color }} aria-hidden="true" />
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
                    <h3 className="text-lg font-semibold tabular-nums tracking-tight text-foreground sm:text-xl md:text-2xl">{value}</h3>
                </div>
                <div className="shrink-0 rounded-lg p-2 sm:p-3" style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}

export function RenewalsPanel({
    expiry,
    tracker,
    loading,
}: {
    expiry: AmcContractorExpiry[];
    tracker: ContractorTracker[];
    loading: boolean;
}) {
    const { rows, source } = useMemo(() => buildRows(expiry, tracker), [expiry, tracker]);
    const sorted = useMemo(() => sortRows(rows), [rows]);

    const counts = useMemo(() => ({
        expired: rows.filter(r => r.status.severity === 'critical').length,
        soon: rows.filter(r => r.status.severity === 'high').length,
        window: rows.filter(r => r.status.severity === 'watch').length,
        unreadable: rows.filter(r => r.status.days === null).length,
    }), [rows]);

    if (loading) {
        return (
            <div className="rounded-[10.5px] border border-border bg-card p-4 sm:p-6">
                <TableSkeleton columns={6} rows={6} />
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card">
                <EmptyState
                    variant="no-data"
                    title="No contract end dates recorded"
                    description="Renewal countdowns appear once contracts carry an end date in amc_contractor_expiry or the AMC tracker."
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
                <Tile label="Expired" value={counts.expired} icon={CalendarX2} color="var(--status-danger)" />
                <Tile label="Within 30 days" value={counts.soon} icon={AlertTriangle} color="var(--status-warning)" />
                <Tile label="Within 90 days" value={counts.window} icon={CalendarClock} color="var(--status-info)" />
                <Tile label="Date unreadable" value={counts.unreadable} icon={HelpCircle} color="var(--status-missing)" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                    {source === 'expiry-table'
                        ? 'Source: amc_contractor_expiry. Countdown recomputed from the recorded end date each time this page loads.'
                        : 'Source: AMC tracker End Date column — the amc_contractor_expiry table holds no rows.'}
                </p>
                <ExportButton rows={sorted} filename="contract-renewals" columns={EXPORT_COLUMNS} />
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
                {sorted.map(r => (
                    <div key={r.key} className="space-y-2 rounded-xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-2">
                            <p className="break-words text-sm font-semibold text-foreground">{r.contractor}</p>
                            <SeverityChip severity={r.status.severity} label={r.status.label} />
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <r.status.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {r.status.detail}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>Action by: <span className="text-foreground">{r.actionRequiredBy || '-'}</span></div>
                            <div>Priority: <span className="text-foreground">{r.priority || '-'}</span></div>
                        </div>
                        {r.renewalStatus && <p className="text-xs text-muted-foreground">Renewal: {r.renewalStatus}</p>}
                    </div>
                ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead scope="col" className="col-sticky">Contractor</TableHead>
                            <TableHead scope="col">End date</TableHead>
                            <TableHead scope="col">Expiry status</TableHead>
                            <TableHead scope="col" className="text-right">Days remaining</TableHead>
                            <TableHead scope="col">Action required by</TableHead>
                            <TableHead scope="col">Priority</TableHead>
                            <TableHead scope="col">Renewal status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map(r => {
                            const parsed = parseContractDate(r.endDateRaw);
                            const Icon = r.status.icon;
                            return (
                                <TableRow key={r.key}>
                                    <TableCell className="col-sticky font-semibold text-foreground">{r.contractor}</TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {parsed ? formatContractDate(parsed) : (r.endDateRaw?.trim() || '-')}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                            <SeverityChip severity={r.status.severity} label={r.status.label} />
                                        </span>
                                    </TableCell>
                                    <TableCell className="num whitespace-nowrap">
                                        {r.status.days !== null
                                            ? r.status.days
                                            : r.recordedDays !== null
                                                ? <span className="text-muted-foreground" title="Value stored in amc_contractor_expiry; the end date itself could not be parsed.">{r.recordedDays} (as recorded)</span>
                                                : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">{r.actionRequiredBy || '-'}</TableCell>
                                    <TableCell className="text-muted-foreground">{r.priority || '-'}</TableCell>
                                    <TableCell className="text-muted-foreground">{r.renewalStatus || '-'}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
