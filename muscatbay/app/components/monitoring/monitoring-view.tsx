"use client";

/**
 * The Monitoring module — three tabs over one evaluation pass.
 *
 * Daily and Monthly answer "was everything that should have been recorded for
 * this period actually recorded, and is what *was* recorded believable?".
 * Renewals answers "which contracts are about to lapse?".
 *
 * The whole surface is read-only by design. It reports what the data says and
 * what to go and check; it never assigns, schedules or closes anything.
 */

import { useState } from "react";
import {
    AlertTriangle, CalendarClock, CalendarDays, CalendarRange,
    ClipboardList, EyeOff, Gauge, RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { StatsGrid, type StatItem } from "@/components/shared/stats-grid";
import { StatsGridSkeleton, Skeleton } from "@/components/shared/skeleton";
import { Button } from "@/components/ui/button";
import { useMonitoringAgent } from "@/hooks/useMonitoringAgent";
import { MonitoringReportView } from "./report-view";
import { RenewalsPanel } from "./renewals-panel";
import { summarise } from "@/lib/monitoring/report";
import { formatDay } from "@/lib/monitoring/calendar";
import type { HeatColumn } from "@/components/shared/inspection";
import type { MonitoringReport } from "@/lib/monitoring/types";

type Tab = "daily" | "monthly" | "renewals";

const TABS = [
    { key: "daily", label: "Daily report", icon: CalendarDays },
    { key: "monthly", label: "Monthly report", icon: CalendarRange },
    { key: "renewals", label: "Expiry & renewals", icon: CalendarClock },
];

/**
 * The four figures a reader needs before deciding whether to read further.
 *
 * `completeness` is deliberately allowed to render "—": when every source is
 * unreadable there is no honest percentage, and a 0% would be as wrong as a
 * 100%.
 */
function summaryStats(report: MonitoringReport): StatItem[] {
    const summary = summarise(report);
    return [
        {
            label: "Entries recorded",
            value: summary.completenessLabel,
            subtitle: report.partial ? "of what could be assessed — report is partial" : "of everything expected this period",
            icon: Gauge,
            variant: summary.severity === "good" ? "success" : summary.severity === "critical" ? "danger" : "warning",
        },
        {
            label: "Confirmed issues",
            value: summary.confirmedIssues.toLocaleString("en-GB"),
            subtitle: "facts read from the data, not predictions",
            icon: ClipboardList,
            variant: summary.confirmedIssues === 0 ? "success" : "warning",
        },
        {
            label: "Critical",
            value: summary.critical.toLocaleString("en-GB"),
            subtitle: "a balance or a log that cannot be reconstructed",
            icon: AlertTriangle,
            variant: summary.critical === 0 ? "success" : "danger",
        },
        {
            label: "Sections not readable",
            value: summary.blindSections.length.toLocaleString("en-GB"),
            subtitle: summary.blindSections.length ? summary.blindSections.join(", ") : "every source responded",
            icon: EyeOff,
            variant: summary.blindSections.length === 0 ? "success" : "warning",
        },
    ];
}

export function MonitoringView() {
    const [tab, setTab] = useState<Tab>("daily");
    const { status, daily, monthly, fetchedAt, refreshing, refresh } = useMonitoringAgent();

    const report = tab === "monthly" ? monthly : daily;
    const loading = status === "loading" || !daily || !monthly;

    const dailyColumns: HeatColumn[] =
        daily?.days.map((day) => ({
            key: day.toISOString().slice(0, 10),
            label: `${day.getUTCDate()}`,
        })) ?? [];

    const monthlyColumns: HeatColumn[] =
        monthly?.trend.map((month, i, all) => ({
            key: month.key,
            label: month.key,
            highlight: i === all.length - 1,
        })) ?? [];

    return (
        <div className="space-y-5">
            <PageHeader
                title="Monitoring"
                description="Daily, monthly and renewal completeness across every module — what was recorded, what is missing, and what to check."
            >
                <div className="flex flex-col items-end gap-1.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refresh}
                        disabled={loading || refreshing}
                        className="gap-1.5"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "motion-safe:animate-spin" : ""}`} aria-hidden="true" />
                        {refreshing ? "Refreshing…" : "Re-run checks"}
                    </Button>
                    <p className="text-[11px] text-muted-foreground" role="status">
                        {fetchedAt ? `Sources last read ${fetchedAt.toLocaleTimeString("en-GB")}` : "Reading sources…"}
                    </p>
                </div>
            </PageHeader>

            <TabNavigation
                tabs={TABS}
                activeTab={tab}
                onTabChange={(key) => setTab(key as Tab)}
                ariaLabel="Monitoring reports"
            />

            {loading ? (
                <div className="space-y-5">
                    <StatsGridSkeleton />
                    <Skeleton className="h-64 w-full rounded-[10.5px]" />
                </div>
            ) : tab === "renewals" ? (
                <SectionBoundary title="Expiry & renewals">
                    <div className="space-y-4">
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                            Contract end dates exactly as the register holds them, with the horizon each has crossed.
                            Reporting a recorded date — no renewal task, owner or close-out is tracked anywhere in this app.
                        </p>
                        <RenewalsPanel items={daily.renewals} />
                    </div>
                </SectionBoundary>
            ) : report ? (
                <>
                    <StatsGrid stats={summaryStats(report)} />
                    <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{report.periodLabel}</span>
                        {" · "}
                        {report.kind === "daily" ? daily.cadenceNote : monthly.cadenceNote}
                    </p>
                    <MonitoringReportView
                        report={report}
                        columns={report.kind === "daily" ? dailyColumns : monthlyColumns}
                        heatmapTitle={report.kind === "daily" ? "Completeness by day" : "Completeness by month"}
                        heatmapNote={
                            report.kind === "daily"
                                ? `Share of expected entries recorded on each day of ${formatDay(daily.days[0])} – ${formatDay(daily.days[daily.days.length - 1])}. A dash means the section was not assessed.`
                                : "Share of expected entries recorded in each due month. The newest due month is underlined; the current month is never assessed — its imports are not late yet."
                        }
                    />
                </>
            ) : null}
        </div>
    );
}
