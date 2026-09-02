"use client";

/**
 * Exceptions & Actions — the day's auto-generated operational queue, mirroring
 * the Monthly section's register. Every row is a rule firing on the selected
 * day's data: zone balance problems (high loss, negative balance, missing L2),
 * the rising-loss leak signature, building bulk-vs-ΣL4 mismatches, and
 * meter-level anomalies (spikes, zero-streaks).
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, ClipboardList, XCircle } from "lucide-react";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButton } from "@/components/shared/data-table";
import { HierarchyStatCard, StatusChip, PALETTE } from "./inline-shared";
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <HierarchyStatCard
                    label="Exceptions Identified"
                    value={String(rows.length)}
                    icon={<ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />}
                    color={PALETTE.primary}
                />
                <HierarchyStatCard
                    label="Critical"
                    value={String(critical)}
                    icon={<XCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
                    color={PALETTE.red}
                    valueColor={critical > 0 ? PALETTE.red : undefined}
                />
                <HierarchyStatCard
                    label="Watch"
                    value={String(watch)}
                    icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />}
                    color={PALETTE.amber}
                />
            </div>

            <Card className="card-elevated">
                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6 pb-2 sm:pb-2 md:pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <ClipboardList className="h-4 w-4 text-mb-secondary-text" aria-hidden="true" />
                                Exceptions &amp; Actions — {month} · Day {selectedDay}
                            </CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Auto-generated from the day&apos;s readings: high-loss zones, negative balances, missing bulk
                                readings, rising-loss leak signatures, building mismatches, consumption spikes and zero-streaks.
                                This register identifies issues and suggests a next step — it does not assign or track them.
                            </p>
                        </div>
                        <ExportButton rows={rows} filename={`water-daily-exceptions-${month}-day${selectedDay}`} />
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 md:p-6 pt-2 sm:pt-2 md:pt-2">
                    {rows.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <CheckCircle2 className="h-8 w-8 text-mb-success-text" aria-hidden="true" />
                            <p className="text-sm font-semibold text-foreground">No exceptions for Day {selectedDay}</p>
                            <p className="max-w-md text-xs text-muted-foreground">
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
                                        <TableCell className="min-w-[200px] text-foreground">{r.Item}</TableCell>
                                        <TableCell>
                                            <StatusChip label={r.Severity} color={r.Severity === "Critical" ? "danger" : "warning"} />
                                        </TableCell>
                                        <TableCell className="num whitespace-nowrap text-foreground">{r.Value}</TableCell>
                                        <TableCell className="min-w-[240px] text-muted-foreground">{r.Action}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
