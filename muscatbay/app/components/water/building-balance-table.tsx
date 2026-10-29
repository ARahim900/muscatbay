"use client";

/**
 * Building balance — one row per Zone 3A/3B building: bulk meter vs the sum of
 * its individual meters (apartments + building common). Shared by the Daily
 * report (Zone Analysis) and the Monthly dashboard (Assets & Connections) so
 * both pages show the same figures under the same rules
 * (`lib/water-building-balance.ts`).
 */

import { AlertTriangle, Building2, CheckCircle2, ChevronRight, CircleDashed, Gauge, type LucideIcon } from "lucide-react";
import { Badge, SectionCard } from "@/components/ui";
import { ExportButton, type ExportColumn } from "@/components/shared/data-table";
import { cn } from "@/lib/cn";
import {
    BUILDING_BALANCE_STATUS_LABEL, BUILDING_DIFF_MIN_M3, BUILDING_DIFF_PCT,
    type BuildingBalance, type BuildingBalanceStatus,
} from "@/lib/water-building-balance";

const TH = "sticky top-0 z-10 whitespace-nowrap bg-primary px-3 py-2 text-left text-eyebrow uppercase text-on-primary";
const TD = "px-3 py-2 text-caption text-fg";
const TBODY = "[&>tr]:h-11 [&>tr:nth-child(even)]:bg-component";

const STATUS_STYLE: Record<BuildingBalanceStatus, { tone: "success" | "warning" | "danger" | "neutral"; icon: LucideIcon }> = {
    "within": { tone: "success", icon: CheckCircle2 },
    "possible-leak": { tone: "danger", icon: AlertTriangle },
    "bulk-suspect": { tone: "warning", icon: Gauge },
    "missing": { tone: "neutral", icon: CircleDashed },
};

const ONE_DP: Intl.NumberFormatOptions = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
const m3 = (v: number | null) => (v == null ? "—" : v.toLocaleString(undefined, ONE_DP));
const signed = (v: number | null) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toLocaleString(undefined, ONE_DP)}`);

const EXPORT_COLUMNS: ExportColumn<BuildingBalance>[] = [
    { key: "buildingName", header: "Building" },
    { key: "zone", header: "Zone", format: (r) => `Zone ${r.zone}` },
    { key: "bulkAccount", header: "Bulk account" },
    { key: "bulk", header: "Bulk (m3)", format: (r) => r.bulk ?? "" },
    { key: "individuals", header: "Apartments + common (m3)", format: (r) => r.individuals ?? "" },
    { key: "difference", header: "Difference (m3)", format: (r) => r.difference ?? "" },
    { key: "differencePct", header: "Difference %", format: (r) => r.differencePct ?? "" },
    { key: "compared", header: "Periods compared", format: (r) => `${r.compared} of ${r.periods}` },
    { key: "status", header: "Status", format: (r) => BUILDING_BALANCE_STATUS_LABEL[r.status] },
];

export function BuildingBalanceTable({
    rows, unit, filename, onSelect, showZone = true,
}: {
    rows: BuildingBalance[];
    /** What one compared period is — "day" on the Daily page, "month" on Monthly. */
    unit: "day" | "month";
    filename: string;
    /** When given, the building name opens that building's detail. */
    onSelect?: (row: BuildingBalance) => void;
    showZone?: boolean;
}) {
    const flagged = rows.filter((r) => r.status === "possible-leak" || r.status === "bulk-suspect").length;
    return (
        <SectionCard>
            <SectionCard.Header
                icon={Building2}
                title="Building balance — bulk vs individual meters"
                description={rows.length ? `${flagged} of ${rows.length} buildings need a check` : undefined}
                action={rows.length > 0 ? <ExportButton rows={rows} filename={filename} columns={EXPORT_COLUMNS} /> : undefined}
            />
            <SectionCard.Body>
                <p className="mb-3 max-w-prose text-caption text-muted">
                    Each building bulk meter minus its apartment and common meters. Only {unit}s when the bulk and every
                    individual meter have a reading are compared, so a missing reading is never counted as zero. A gap above{" "}
                    {BUILDING_DIFF_MIN_M3} m³ and {BUILDING_DIFF_PCT}% of the bulk points at a leak between the bulk and the flats.
                </p>
                <div className="overflow-auto rounded-control border border-line">
                    <table className="w-full">
                        <caption className="sr-only">
                            Building bulk meters compared with the sum of their apartment and common meters: bulk volume,
                            individual total, the difference in cubic metres and percent, how many {unit}s could be compared, and the status.
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col" className={TH}>Building</th>
                                {showZone && <th scope="col" className={TH}>Zone</th>}
                                <th scope="col" className={cn(TH, "text-right")}>Bulk m³</th>
                                <th scope="col" className={cn(TH, "text-right")}>Apts + common m³</th>
                                <th scope="col" className={cn(TH, "text-right")}>Difference m³</th>
                                <th scope="col" className={cn(TH, "text-right")}>Diff %</th>
                                <th scope="col" className={cn(TH, "text-right")}>{unit === "day" ? "Days" : "Months"} compared</th>
                                <th scope="col" className={TH}>Status</th>
                            </tr>
                        </thead>
                        <tbody className={TBODY}>
                            {rows.length === 0 && (
                                <tr><td colSpan={showZone ? 8 : 7} className={cn(TD, "text-center text-muted")}>No building data for this period.</td></tr>
                            )}
                            {rows.map((r) => {
                                const st = STATUS_STYLE[r.status];
                                const partial = r.compared < r.periods;
                                return (
                                    <tr key={r.bulkAccount} className="border-b border-line last:border-b-0">
                                        <th scope="row" className={cn(TD, "text-left font-medium")}>
                                            {onSelect ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onSelect(r)}
                                                    className="inline-flex items-center gap-1 rounded-control text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent dark:text-fg"
                                                    aria-label={`Open the day-by-day breakdown for ${r.buildingName}`}
                                                >
                                                    {r.buildingName}
                                                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                                                </button>
                                            ) : r.buildingName}
                                            <span className="meter ml-2 text-muted">{r.bulkAccount}</span>
                                        </th>
                                        {showZone && <td className={cn(TD, "text-muted")}>Zone {r.zone}</td>}
                                        <td className={cn(TD, "text-right tabular-nums")}>{m3(r.bulk)}</td>
                                        <td className={cn(TD, "text-right tabular-nums")}>{m3(r.individuals)}</td>
                                        <td className={cn(TD, "text-right font-medium tabular-nums")}>{signed(r.difference)}</td>
                                        <td className={cn(TD, "text-right tabular-nums")}>{r.differencePct == null ? "—" : `${r.differencePct}%`}</td>
                                        <td className={cn(TD, "text-right tabular-nums", partial && "text-warning")}>
                                            {r.compared} of {r.periods}
                                        </td>
                                        <td className={cn(TD, "whitespace-nowrap")}>
                                            <Badge tone={st.tone} icon={st.icon}>{BUILDING_BALANCE_STATUS_LABEL[r.status]}</Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </SectionCard.Body>
        </SectionCard>
    );
}
