"use client";

/**
 * Exceptions — the day's auto-generated operational queue, mirroring the
 * Monthly section's register. Every row is a rule firing on the selected
 * day's data: zone balance problems (high loss, negative balance, missing L2),
 * the rising-loss leak signature, building bulk-vs-ΣL4 mismatches, and
 * meter-level anomalies (spikes, zero-streaks).
 */

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, XCircle } from "lucide-react";
import { Badge, SectionCard } from "@/components/ui";
import { StatsGrid } from "@/components/shared/stats-grid";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButton } from "@/components/shared/data-table";
import { buildDailyGrid, buildZoneDaySeries, buildDailyExceptions } from "./daily-metrics";

export function DailyExceptions({
    monthData, selectedDay, month,
}: {
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    month: string;
}) {
    const rows = useMemo(() => {
        const grid = buildDailyGrid(monthData);
        return buildDailyExceptions(grid, buildZoneDaySeries(grid), selectedDay);
    }, [monthData, selectedDay]);

    const critical = rows.filter((r) => r.Severity === "Critical").length;
    const watch = rows.length - critical;

    return (
        <div className="space-y-6">
            <StatsGrid stats={[
                { label: "Exceptions Identified", value: String(rows.length), subtitle: `Day ${selectedDay} · ${month}`, icon: ClipboardList, variant: "primary" },
                { label: "Critical", value: String(critical), subtitle: "Needs validation now", icon: XCircle, variant: "danger" },
                { label: "Watch", value: String(watch), subtitle: "Monitor or verify", icon: AlertTriangle, variant: "warning" },
            ]} />

            <SectionCard>
                <SectionCard.Header
                    icon={ClipboardList}
                    title={`Exceptions — ${month} · Day ${selectedDay}`}
                    action={<ExportButton rows={rows} filename={`water-daily-exceptions-${month}-day${selectedDay}`} />}
                />
                <SectionCard.Body>
                    <p className="mb-3 text-caption text-muted">
                        Auto-generated from the day&apos;s readings: high-loss zones, negative balances, missing bulk
                        readings, rising-loss leak signatures, building mismatches, consumption spikes and zero-streaks.
                        This register identifies issues and suggests a next step — it does not assign or track them.
                    </p>
                    {rows.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <CheckCircle2 size={20} strokeWidth={2} className="text-success" aria-hidden="true" />
                            <p className="text-label text-fg">No exceptions for Day {selectedDay}</p>
                            <p className="max-w-md text-caption text-muted">
                                All zone balances, building balances and meters are within tolerance. Move the day slider
                                or check the Zone Watch heatmap to review other days.
                            </p>
                        </div>
                    ) : (
                        <Table data-density="compact" aria-label={`Exceptions for day ${selectedDay}`}>
                            <TableCaption className="sr-only mt-0">
                                {rows.length} exceptions detected on day {selectedDay} of {month}, each with its category,
                                the item affected, a severity band, the measured value and a suggested next step.
                            </TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead className="num">Value</TableHead>
                                    <TableHead>Suggested Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((r, i) => (
                                    <TableRow key={`${r.Category}-${r.Item}-${i}`}>
                                        <TableCell className="whitespace-nowrap">{r.Category}</TableCell>
                                        <TableCell className="min-w-48 text-fg">{r.Item}</TableCell>
                                        <TableCell>
                                            <Badge tone={r.Severity === "Critical" ? "danger" : "warning"}>{r.Severity}</Badge>
                                        </TableCell>
                                        <TableCell className="num whitespace-nowrap text-fg">{r.Value}</TableCell>
                                        <TableCell className="min-w-60 text-muted">{r.Action}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </SectionCard.Body>
            </SectionCard>
        </div>
    );
}
