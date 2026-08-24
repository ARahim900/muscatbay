"use client";

/**
 * SLA & commercial terms panel.
 *
 * Renders `amc_contractor_details` — response times, liquidated damages,
 * performance bond, payment terms, warranty period, key exclusions and the
 * contact person. All of it was already in Supabase and reachable through
 * `getContractorDetails()`, but no page had ever called it.
 */

import { useMemo, useState } from "react";
import { Search, ShieldCheck, Timer, Wallet } from "lucide-react";
import type { AmcContractorDetails } from "@/entities/contractor";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/shared/skeleton";
import { ExportButton, TableToolbar, type ExportColumn } from "@/components/shared/data-table";

const EXPORT_COLUMNS: ExportColumn<AmcContractorDetails>[] = [
    { key: 'contractor', header: 'Contractor' },
    { key: 'contract_ref', header: 'Contract Ref' },
    { key: 'scope_of_work', header: 'Scope of Work' },
    { key: 'ppm_frequency', header: 'PPM Frequency' },
    { key: 'response_time_emergency', header: 'Response — Emergency' },
    { key: 'response_time_normal', header: 'Response — Normal' },
    { key: 'liquidated_damages', header: 'Liquidated Damages' },
    { key: 'performance_bond', header: 'Performance Bond' },
    { key: 'payment_terms', header: 'Payment Terms' },
    { key: 'warranty_period', header: 'Warranty Period' },
    { key: 'key_exclusions', header: 'Key Exclusions' },
    { key: 'contact_person', header: 'Contact Person' },
];

function Fact({ label, value }: { label: string; value: string | null }) {
    const text = (value ?? '').trim();
    return (
        <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className={text ? "mt-0.5 break-words text-[13px] text-foreground" : "mt-0.5 text-[13px] text-muted-foreground/70"}>
                {text || 'Not recorded'}
            </dd>
        </div>
    );
}

function TermsCard({ item }: { item: AmcContractorDetails }) {
    return (
        <article className="rounded-[10.5px] border border-border bg-card p-4 shadow-card-standard sm:p-5">
            <header className="border-b border-border/60 pb-3">
                <h3 className="break-words text-sm font-semibold text-foreground">{item.contractor}</h3>
                {item.contract_ref && <p className="meter mt-0.5 text-xs text-muted-foreground">{item.contract_ref}</p>}
            </header>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                <Fact label="PPM frequency" value={item.ppm_frequency} />
                <Fact label="Contact person" value={item.contact_person} />
            </dl>

            <section className="mt-4 rounded-[7px] border border-border/60 bg-muted/40 p-3 dark:bg-muted/20">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Timer className="h-3 w-3" aria-hidden="true" /> Response times (SLA)
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3">
                    <Fact label="Emergency" value={item.response_time_emergency} />
                    <Fact label="Normal" value={item.response_time_normal} />
                </dl>
            </section>

            <section className="mt-3 rounded-[7px] border border-border/60 bg-muted/40 p-3 dark:bg-muted/20">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Wallet className="h-3 w-3" aria-hidden="true" /> Commercial terms
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3">
                    <Fact label="Payment terms" value={item.payment_terms} />
                    <Fact label="Performance bond" value={item.performance_bond} />
                    <Fact label="Liquidated damages" value={item.liquidated_damages} />
                    <Fact label="Warranty period" value={item.warranty_period} />
                </dl>
            </section>

            <dl className="mt-4 space-y-3">
                <Fact label="Scope of work" value={item.scope_of_work} />
                <Fact label="Key exclusions" value={item.key_exclusions} />
            </dl>
        </article>
    );
}

export function TermsPanel({ details, loading }: { details: AmcContractorDetails[]; loading: boolean }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return details;
        return details.filter(d =>
            d.contractor.toLowerCase().includes(term) ||
            (d.contract_ref ?? '').toLowerCase().includes(term) ||
            (d.scope_of_work ?? '').toLowerCase().includes(term)
        );
    }, [details, search]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 sm:gap-4">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="rounded-[10.5px] border border-border bg-card p-5">
                        <Skeleton className="h-5 w-48" />
                        <div className="mt-4 space-y-2">
                            {[0, 1, 2, 3, 4].map(j => <Skeleton key={j} className="h-4 w-full" />)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (details.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card">
                <EmptyState
                    variant="no-data"
                    title="No contract terms recorded"
                    description="SLA and commercial terms appear once rows exist in amc_contractor_details."
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <TableToolbar className="flex-wrap">
                <div className="relative min-w-0 max-w-md flex-1 sm:min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input
                        type="text"
                        aria-label="Search contract terms"
                        placeholder="Search contractor, ref or scope…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-border/80 bg-card py-2 pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <ExportButton rows={filtered} filename="contract-terms" columns={EXPORT_COLUMNS} className="sm:ml-auto" />
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span className="font-semibold text-foreground">{filtered.length}</span>
                    {filtered.length !== details.length && <span>of {details.length}</span>} contracts
                </span>
            </TableToolbar>

            {filtered.length === 0 ? (
                <div className="rounded-xl border border-border bg-card">
                    <EmptyState variant="filter-empty" title="No contracts match" description="Try a different search term." />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 sm:gap-4">
                    {filtered.map(item => <TermsCard key={item.id} item={item} />)}
                </div>
            )}
        </div>
    );
}
