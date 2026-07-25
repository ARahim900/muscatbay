"use client";

/**
 * AMC pricing schedule (`amc_contractor_pricing`) — year-1..year-5 rates and the
 * contract total, per contractor. Another table that existed in Supabase with a
 * ready fetcher (`getContractorPricing()`) and no caller.
 *
 * Values are stored as text (they include notes like "Variable" or "—"), so they
 * are rendered exactly as recorded. Nothing is summed or converted: a computed
 * total over free text would be a fabricated number.
 */

import type { AmcContractorPricing } from "@/entities/contractor";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/skeleton";
import { ExportButton, type ExportColumn } from "@/components/shared/data-table";

const EXPORT_COLUMNS: ExportColumn<AmcContractorPricing>[] = [
    { key: 'contractor', header: 'Contractor' },
    { key: 'year_1_omr', header: 'Year 1 (OMR)' },
    { key: 'year_2_omr', header: 'Year 2 (OMR)' },
    { key: 'year_3_omr', header: 'Year 3 (OMR)' },
    { key: 'year_4_omr', header: 'Year 4 (OMR)' },
    { key: 'year_5_omr', header: 'Year 5 (OMR)' },
    { key: 'total_omr', header: 'Total (OMR)' },
    { key: 'notes', header: 'Notes' },
];

const YEAR_KEYS: (keyof AmcContractorPricing)[] = [
    'year_1_omr', 'year_2_omr', 'year_3_omr', 'year_4_omr', 'year_5_omr',
];

function cell(value: string | null | undefined) {
    const text = (value ?? '').trim();
    if (!text) return <span className="text-muted-foreground/70 dark:text-muted-foreground">—</span>;
    return text;
}

export function PricingPanel({ pricing, loading }: { pricing: AmcContractorPricing[]; loading: boolean }) {
    if (loading) {
        return (
            <div className="rounded-[10.5px] border border-border bg-card p-4 sm:p-6">
                <TableSkeleton columns={8} rows={5} />
            </div>
        );
    }

    if (pricing.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card">
                <EmptyState
                    variant="no-data"
                    title="No AMC pricing schedule"
                    description="Per-year contract rates appear once rows exist in amc_contractor_pricing."
                />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                    Contracted rate per contract year, exactly as recorded in the pricing schedule.
                </p>
                <ExportButton rows={pricing} filename="contract-pricing" columns={EXPORT_COLUMNS} />
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
                {pricing.map(p => (
                    <div key={p.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
                        <p className="break-words text-sm font-semibold text-foreground">{p.contractor}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                            {YEAR_KEYS.map((k, i) => (
                                <div key={k} className="flex justify-between gap-2">
                                    <span className="text-muted-foreground">Year {i + 1}</span>
                                    <span className="font-mono text-foreground">{cell(p[k] as string | null)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between border-t border-border/60 pt-2 text-xs">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-mono font-semibold text-primary">{cell(p.total_omr)}</span>
                        </div>
                        {p.notes && <p className="break-words text-xs text-muted-foreground">{p.notes}</p>}
                    </div>
                ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead scope="col" className="col-sticky">Contractor</TableHead>
                            {[1, 2, 3, 4, 5].map(y => (
                                <TableHead key={y} scope="col" className="text-right">Year {y} (OMR)</TableHead>
                            ))}
                            <TableHead scope="col" className="text-right">Total (OMR)</TableHead>
                            <TableHead scope="col">Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pricing.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="col-sticky font-semibold text-foreground">{p.contractor}</TableCell>
                                {YEAR_KEYS.map(k => (
                                    <TableCell key={k} className="num whitespace-nowrap">{cell(p[k] as string | null)}</TableCell>
                                ))}
                                <TableCell className="num whitespace-nowrap font-semibold text-primary">{cell(p.total_omr)}</TableCell>
                                <TableCell className="max-w-[260px] break-words text-muted-foreground">{p.notes || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
