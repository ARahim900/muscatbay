"use client";

/**
 * The monitoring findings register.
 *
 * Why this exists alongside `components/shared/findings-register.tsx`
 * ------------------------------------------------------------------
 * The shared register is the right shape for an anomaly list — severity / item
 * / value / remarks / suggested action — and this one keeps its two defining
 * properties: the same five-level severity vocabulary as the health cards, and
 * **no Owner and no Status column**, because the app identifies findings and
 * the floor actions them.
 *
 * It differs in exactly two ways, both required by the monitoring brief:
 *
 *  1. **Confirmed and recommended are separate columns.** The shared register
 *     folds the reason into free-text remarks. Here the owner asked that a
 *     statement of fact and a suggested next step never be confusable, so they
 *     are distinct columns with distinct headings — and they stay separate all
 *     the way into the CSV.
 *  2. **Findings carry their affected data points.** Every row lists the
 *     accounts, dates or contracts it concerns, so an alert is addressable
 *     rather than a general complaint about a module.
 *
 * It deliberately does NOT add owner, status, due date or close-out.
 */

import { useMemo, useState } from "react";
import { ClipboardCheck, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablePagination, TableToolbar, type PageSizeOption } from "@/components/shared/data-table";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { SEVERITY_LABEL, SeverityChip } from "@/components/shared/inspection";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { SEVERITY_ORDER } from "@/lib/monitoring/coverage";
import type { MonitoringFinding } from "@/lib/monitoring/types";
import { reportToCsvRows, unassessedSections } from "@/lib/monitoring/report";
import type { MonitoringReport } from "@/lib/monitoring/types";

const KIND_LABEL: Record<MonitoringFinding["kind"], string> = {
    missing: "Missing entry",
    integrity: "Data integrity",
    "cross-check": "Cross-check",
    renewal: "Expiry / renewal",
    provenance: "Provenance",
};

const thBase =
    "h-[2.875rem] px-4 py-3 text-left align-middle text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground whitespace-nowrap";
const tdBase = "px-4 py-3.5 align-top text-[12.5px] text-card-foreground";

/**
 * The affected data points, capped on screen but never dropped from the CSV.
 *
 * Each chip carries the identifier the database actually uses — an account
 * number, an ISO date — because "some meters were not read" is a complaint and
 * "4300343 was not read on 18 Aug" is something an operator can act on. The id
 * is only appended when the label does not already contain it, so the common
 * case ("Zone 3A meter 4300002") does not print the number twice.
 */
function AffectedCell({ finding }: { finding: MonitoringFinding }) {
    const [expanded, setExpanded] = useState(false);
    if (finding.affected.length === 0) {
        return <span className="text-muted-foreground">—</span>;
    }
    const shown = expanded ? finding.affected : finding.affected.slice(0, 3);
    return (
        <div className="flex flex-col gap-1">
            <ul className="flex flex-wrap gap-1">
                {shown.map((ref, i) => (
                    <li
                        key={`${ref.kind}-${ref.id}-${i}`}
                        className="rounded-[5px] bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                        title={`${ref.kind}: ${ref.id}`}
                    >
                        {ref.label}
                        {!ref.label.includes(ref.id) && (
                            <span className="meter ml-1 text-foreground/80">{ref.id}</span>
                        )}
                    </li>
                ))}
            </ul>
            {finding.affected.length > 3 && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="self-start text-[11px] font-medium text-secondary underline-offset-2 hover:underline"
                >
                    {expanded ? "Show fewer" : `Show all ${finding.affected.length}`}
                </button>
            )}
        </div>
    );
}

export function MonitoringFindingsRegister({ report }: { report: MonitoringReport }) {
    const [severity, setSeverity] = useState<string>("all");
    const [kind, setKind] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return report.findings.filter((f) => {
            if (severity !== "all" && f.severity !== severity) return false;
            if (kind !== "all" && f.kind !== kind) return false;
            if (!term) return true;
            return (
                f.confirmed.toLowerCase().includes(term) ||
                f.recommendation.toLowerCase().includes(term) ||
                f.section.toLowerCase().includes(term) ||
                f.period.toLowerCase().includes(term) ||
                f.affected.some((a) => a.label.toLowerCase().includes(term) || a.id.toLowerCase().includes(term))
            );
        });
    }, [report.findings, severity, kind, search]);

    const total = filtered.length;
    const size = pageSize === "All" ? Math.max(total, 1) : pageSize;
    const totalPages = Math.max(1, Math.ceil(total / size));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * size;
    const rows = filtered.slice(start, start + size);

    const severityCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const f of report.findings) counts.set(f.severity, (counts.get(f.severity) ?? 0) + 1);
        return counts;
    }, [report.findings]);

    if (report.findings.length === 0) {
        // A section nobody could read, and a section whose register came back
        // empty, are both unassessed — neither may be covered by an all-clear.
        const blind = unassessedSections(report);
        return (
            <div className="flex flex-col items-center gap-2 rounded-[10.5px] border border-border bg-card px-4 py-12 text-center">
                <ClipboardCheck className="h-8 w-8 text-mb-success-text" aria-hidden="true" />
                <h3 className="text-base font-semibold text-foreground">No confirmed issues for this period</h3>
                <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
                    {blind.length > 0
                        ? `Every section the agent could assess is complete. ${blind.length} section${blind.length === 1 ? " could" : "s could"} not be assessed this pass (${blind.map((s) => s.title).join(", ")}), so this is not a clean bill of health for ${blind.length === 1 ? "it" : "them"}.`
                        : "Every expected entry for this period was recorded, and no integrity problem was found in what was recorded."}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-[10.5px] border border-border bg-card">
            <TableToolbar title="Confirmed issues & recommended checks" count={total}>
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search meters, dates, contractors…"
                        aria-label="Search findings"
                        className="h-9 w-52 pl-8 text-xs"
                    />
                </div>
                <Select value={severity} onValueChange={(v) => { setSeverity(v ?? "all"); setPage(1); }}>
                    <SelectTrigger className="h-9 w-36 text-xs" aria-label="Filter by severity">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All severities</SelectItem>
                        {SEVERITY_ORDER.filter((s) => severityCounts.has(s)).map((s) => (
                            <SelectItem key={s} value={s}>
                                {SEVERITY_LABEL[s]} ({severityCounts.get(s)})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={kind} onValueChange={(v) => { setKind(v ?? "all"); setPage(1); }}>
                    <SelectTrigger className="h-9 w-40 text-xs" aria-label="Filter by finding type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {(Object.keys(KIND_LABEL) as MonitoringFinding["kind"][])
                            .filter((k) => report.findings.some((f) => f.kind === k))
                            .map((k) => (
                                <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
                            ))}
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-xs"
                    onClick={() =>
                        exportToCSV(
                            reportToCsvRows({ ...report, findings: filtered }),
                            `muscat-bay-${report.kind}-monitoring-${getDateForFilename()}`,
                        )
                    }
                >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" /> CSV
                </Button>
            </TableToolbar>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <th scope="col" className={thBase}>Severity</th>
                            <th scope="col" className={thBase}>Period</th>
                            <th scope="col" className={thBase}>Section</th>
                            <th scope="col" className={thBase}>Type</th>
                            <th scope="col" className={`${thBase} min-w-[22rem]`}>Confirmed issue</th>
                            <th scope="col" className={`${thBase} min-w-[14rem]`}>Affected data points</th>
                            <th scope="col" className={`${thBase} min-w-[18rem]`}>Recommended check</th>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((finding) => (
                            <TableRow key={finding.id}>
                                <TableCell className={tdBase}><SeverityChip severity={finding.severity} /></TableCell>
                                <TableCell className={`${tdBase} whitespace-nowrap tabular-nums text-muted-foreground`}>
                                    {finding.period || "—"}
                                </TableCell>
                                <TableCell className={`${tdBase} whitespace-nowrap font-medium`}>{finding.section}</TableCell>
                                <TableCell className={`${tdBase} whitespace-nowrap text-muted-foreground`}>{KIND_LABEL[finding.kind]}</TableCell>
                                <TableCell className={`${tdBase} leading-relaxed`}>{finding.confirmed}</TableCell>
                                <TableCell className={tdBase}><AffectedCell finding={finding} /></TableCell>
                                <TableCell className={`${tdBase} leading-relaxed text-muted-foreground`}>{finding.recommendation}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <TablePagination
                currentPage={current}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                startIndex={start}
                endIndex={Math.min(start + size, total)}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
        </div>
    );
}
