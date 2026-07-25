"use client";

/**
 * Contract cost by year — the visual companion to the yearly cost matrix.
 * One bar per contract year, height = the same `Year Total` the table prints,
 * so chart and table can never disagree.
 */

import { LiquidBarChart } from "@/components/charts/liquid-bar-chart";
import { CHART_PALETTE } from "@/lib/tokens";

export interface YearlyChartRow {
    year: number;
    label: string;
    total: number;
}

export function YearlyCostChart({ rows }: { rows: YearlyChartRow[] }) {
    if (rows.length === 0) return null;

    const data = rows.map(r => ({
        label: `Y${r.year} · ${r.label}`,
        "Total (OMR)": Number(r.total.toFixed(1)),
    }));

    return (
        <div className="rounded-[10.5px] border border-border bg-card p-4 shadow-card-standard sm:p-5">
            <h3 className="text-sm font-semibold text-foreground">Expense by contract year</h3>
            <p className="mt-1 text-xs text-muted-foreground">
                Total contracted expense per year (OMR), summed across all contractors in the matrix below.
            </p>
            <LiquidBarChart
                data={data}
                categories={["Total (OMR)"]}
                index="label"
                colors={[CHART_PALETTE[0]]}
                height={260}
                showGrid
                showLegend={false}
                yAxisLabel="OMR"
            />
        </div>
    );
}
