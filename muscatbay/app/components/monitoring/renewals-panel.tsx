"use client";

/**
 * Contract expiry & renewal ladder.
 *
 * Scope note: this reports a date that already exists in the register, and the
 * horizon it has crossed. There is no renewal task, owner, or close-out — those
 * are deliberately absent from the whole module.
 */

import { CalendarClock } from "lucide-react";
import { SeverityChip } from "@/components/shared/inspection";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { TableToolbar } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDay } from "@/lib/monitoring/calendar";
import { describeRenewalCadence } from "@/lib/monitoring/config";
import type { RenewalItem } from "@/lib/monitoring/renewals";

const BAND_WORD: Record<RenewalItem["band"], string> = {
    expired: "Expired",
    soon: "Expiring",
    window: "Renewal window",
    active: "Active",
    unreadable: "No usable date",
    closed: "Closed in register",
};

const thBase =
    "h-[2.875rem] px-4 py-3 text-left align-middle text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground whitespace-nowrap";
const tdBase = "px-4 py-3.5 align-middle text-[12.5px] text-card-foreground";

/** `in 12 days` / `12 days ago` / `today` / `—`. */
function countdown(days: number | null): string {
    if (days === null) return "—";
    if (days === 0) return "today";
    if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
}

export function RenewalsPanel({ items }: { items: RenewalItem[] }) {
    if (items.length === 0) {
        return (
            <EmptyState
                icon={CalendarClock}
                title="No contracts to track"
                description="Renewal countdowns appear once the contractor register carries rows with an end date."
            />
        );
    }

    return (
        <div className="overflow-hidden rounded-[10.5px] border border-border bg-card">
            <TableToolbar title="Contract expiry ladder" count={items.length} />
            <p className="px-3 pb-2 text-[11px] leading-relaxed text-muted-foreground sm:px-5">
                {describeRenewalCadence()}
            </p>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <th scope="col" className={thBase}>Status</th>
                            <th scope="col" className={thBase}>Contractor</th>
                            <th scope="col" className={thBase}>Service</th>
                            <th scope="col" className={thBase}>End date (as recorded)</th>
                            <th scope="col" className={thBase}>End date (as read)</th>
                            <th scope="col" className={thBase}>Countdown</th>
                            <th scope="col" className={thBase}>Next notification</th>
                            <th scope="col" className={thBase}>Register status</th>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={`${item.contractor}|${item.service}|${item.endDateRaw}`}>
                                <TableCell className={tdBase}>
                                    <SeverityChip severity={item.severity} label={BAND_WORD[item.band]} />
                                </TableCell>
                                <TableCell className={`${tdBase} font-medium`}>{item.contractor}</TableCell>
                                <TableCell className={`${tdBase} text-muted-foreground`}>{item.service || "—"}</TableCell>
                                <TableCell className={`${tdBase} meter text-muted-foreground`}>
                                    {item.endDateRaw || "—"}
                                    {item.ambiguousDate && (
                                        <span
                                            className="ml-1.5 rounded-[5px] bg-mb-warning-light px-1.5 py-0.5 text-[10px] font-semibold text-mb-warning-text"
                                            title="d/m/yyyy with both parts 12 or under — the alert feed reads this month-first and the Contractors page day-first"
                                        >
                                            ambiguous
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className={`${tdBase} whitespace-nowrap`}>
                                    {item.endDate ? formatDay(item.endDate) : "could not be read"}
                                </TableCell>
                                <TableCell className={`${tdBase} whitespace-nowrap tabular-nums`}>{countdown(item.days)}</TableCell>
                                <TableCell className={`${tdBase} whitespace-nowrap text-muted-foreground`}>
                                    {item.horizon !== null ? `${item.horizon}-day horizon` : "—"}
                                </TableCell>
                                <TableCell className={`${tdBase} text-muted-foreground`}>{item.statusRaw || "—"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
