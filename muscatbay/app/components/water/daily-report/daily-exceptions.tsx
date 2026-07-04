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
import { AlertTriangle, CheckCircle2, ClipboardList, Download, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { downloadRows } from "@/lib/water-monthly-data";
import { HierarchyStatCard, StatusChip, thBase, tdBase, PALETTE } from "./inline-shared";
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
                    label="Open Exceptions"
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
                                <ClipboardList className="h-4 w-4 text-secondary" aria-hidden="true" />
                                Exceptions &amp; Actions — {month} · Day {selectedDay}
                            </CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Auto-generated from the day&apos;s readings: high-loss zones, negative balances, missing bulk
                                readings, rising-loss leak signatures, building mismatches, consumption spikes and zero-streaks.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => downloadRows(rows, `water-daily-exceptions-${month}-day${selectedDay}.csv`)}
                            disabled={rows.length === 0}
                            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                        >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            Export Actions
                        </button>
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
                        <div className="overflow-hidden rounded-[10.5px] border border-border">
                            <div className="overflow-auto" style={{ maxHeight: 560 }}>
                                <table className="w-full border-collapse text-[12px]" style={{ minWidth: 880 }}>
                                    <thead>
                                        <tr>
                                            <th scope="col" className={thBase}>Category</th>
                                            <th scope="col" className={thBase}>Item</th>
                                            <th scope="col" className={thBase}>Severity</th>
                                            <th scope="col" className={cn(thBase, "text-right")}>Value</th>
                                            <th scope="col" className={thBase}>Owner</th>
                                            <th scope="col" className={thBase}>Status</th>
                                            <th scope="col" className={thBase}>Suggested Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r, i) => (
                                            <tr
                                                key={`${r.Category}-${r.Item}-${i}`}
                                                className={cn("border-b border-border/60", i % 2 === 1 && "bg-muted/40 dark:bg-muted/20")}
                                            >
                                                <td className={cn(tdBase, "whitespace-nowrap font-semibold text-foreground")}>{r.Category}</td>
                                                <td className={cn(tdBase, "text-foreground")}>{r.Item}</td>
                                                <td className={tdBase}>
                                                    <StatusChip label={r.Severity} color={r.Severity === "Critical" ? "danger" : "warning"} />
                                                </td>
                                                <td className={cn(tdBase, "whitespace-nowrap text-right tabular-nums text-foreground")}>{r.Value}</td>
                                                <td className={cn(tdBase, "whitespace-nowrap text-muted-foreground")}>{r.Owner}</td>
                                                <td className={tdBase}>
                                                    <StatusChip label={r.Status} color="default" />
                                                </td>
                                                <td className={cn(tdBase, "min-w-[240px] text-muted-foreground")}>{r.Action}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
