"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { YtdMetric } from "@/hooks/useDashboardData";

/**
 * Year-to-date totals with a straight-line run-rate projection.
 *
 * Two rules make this honest:
 *  1. YTD sums only the months that actually carry a reading. A month with no
 *     data is skipped, never treated as zero.
 *  2. The full-year figure is a PROJECTION and is labelled as one everywhere —
 *     value, heading and screen-reader text. It is the mean of the months we
 *     have, annualised; with no months read it renders as unavailable, not 0.
 */

function formatScaled(value: number, scale: number): string {
    const scaled = value / scale;
    return scaled >= 100 ? Math.round(scaled).toLocaleString() : scaled.toFixed(1);
}

export function YtdPanel({ metrics }: { metrics: YtdMetric[] }) {
    if (metrics.length === 0) return null;

    const year = metrics[0].year;

    return (
        <Card className="card-elevated">
            <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-secondary" aria-hidden="true" />
                    Year to date &mdash; {year}
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Totals across the months with readings, plus a straight-line full-year projection.
                </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((m) => {
                        const hasData = m.monthsWithData > 0;
                        return (
                            <li key={m.key}>
                                <Link
                                    href={m.href}
                                    className="group/ytd flex h-full flex-col gap-1 rounded-lg border border-border bg-muted-bg/60 p-3 transition-[background-color,border-color] duration-150 hover:bg-card hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            {m.label}
                                        </span>
                                        <ArrowUpRight
                                            className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover/ytd:opacity-100"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <p className="text-xl font-semibold tabular-nums leading-tight text-foreground">
                                        {hasData ? (
                                            <>
                                                {formatScaled(m.value, m.scale)}
                                                <span className="ms-1 text-xs font-normal text-muted-foreground">{m.unit}</span>
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">&mdash;</span>
                                        )}
                                    </p>

                                    {hasData ? (
                                        <>
                                            <p className="text-[11px] text-muted-foreground">
                                                {m.monthsWithData} month{m.monthsWithData === 1 ? "" : "s"} with readings
                                            </p>
                                            <p className="mt-auto pt-1 text-[11px] leading-snug text-foreground/70">
                                                <span className="font-medium">Projected {m.year}: </span>
                                                <span className="tabular-nums">
                                                    {m.projection !== null ? formatScaled(m.projection, m.scale) : "—"} {m.unit}
                                                </span>
                                                <span className="sr-only"> (projection, not a measured total)</span>
                                            </p>
                                        </>
                                    ) : (
                                        <p className="mt-auto pt-1 text-[11px] leading-snug text-muted-foreground">
                                            No readings recorded for {m.year} yet.
                                        </p>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
                    <Info className="mt-px h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    <span>
                        Projections annualise the average of the months that have readings. They are estimates,
                        not measurements, and months with no reading are excluded rather than counted as zero.
                    </span>
                </p>
            </CardContent>
        </Card>
    );
}
