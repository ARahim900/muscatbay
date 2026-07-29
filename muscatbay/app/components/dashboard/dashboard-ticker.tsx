"use client";

import { useMemo } from "react";
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    CheckCircle2,
    Minus,
    ShieldAlert,
    Wifi,
    type LucideIcon,
} from "lucide-react";
import { InspectionTicker, type TickerStat } from "@/components/shared/inspection";
import type { DashboardStats } from "@/hooks/useDashboardData";
import type { OperationalAlert } from "@/lib/operational-alerts";

/**
 * Estate briefing — the dashboard's news-ticker strip.
 *
 * Mirrors the Water Daily briefing so the two read as one product, and renders
 * from the shared `InspectionTicker` that STP Plant Watch and Electricity Load
 * Watch already use, rather than a fourth bespoke implementation.
 *
 * Every figure comes from the same live data the KPI deck below it renders.
 * Nothing here is computed independently, so the strip cannot disagree with the
 * cards — and when a value is unavailable it says so instead of showing a zero.
 */

/** Alert counts, unacknowledged only — an acknowledged alert is not "current". */
function summariseAlerts(alerts: OperationalAlert[]) {
    const live = alerts.filter((a) => !("acknowledged" in a) || !(a as { acknowledged?: boolean }).acknowledged);
    return {
        critical: live.filter((a) => a.level === "error").length,
        warning: live.filter((a) => a.level === "warning").length,
        total: live.length,
    };
}

/**
 * Direction glyph for a KPI trend.
 *
 * Deliberately shape-distinct rather than colour-only, and a neutral or absent
 * trend gets `Minus` instead of an arrow implying movement the data does not
 * show.
 */
function trendIcon(trend: DashboardStats["trend"]): LucideIcon {
    if (trend === "up") return ArrowUp;
    if (trend === "down") return ArrowDown;
    return Minus;
}

/**
 * KPI → ticker item.
 *
 * Tone stays `default` for every KPI. A metric moving is not an alarm, and the
 * brand rule is calm by default with urgency reserved for genuine alarms — so
 * only the attention item and a breached published target carry colour.
 */
function statToTicker(stat: DashboardStats): TickerStat {
    const targetBreached = stat.target?.status === "danger" || stat.target?.status === "warning";

    return {
        icon: stat.target && targetBreached ? AlertTriangle : trendIcon(stat.trend),
        label: stat.label,
        tone: stat.target?.status === "danger" ? "danger" : stat.target?.status === "warning" ? "warning" : "default",
        value: (
            <>
                {stat.value}
                {stat.trendValue ? (
                    <span className="ms-1.5 text-xs font-medium text-muted-foreground">
                        {stat.trendValue} vs previous
                    </span>
                ) : null}
                {stat.target ? (
                    <span className="ms-1.5 text-xs font-medium text-muted-foreground">· {stat.target.label}</span>
                ) : null}
            </>
        ),
        // The subtitle carries the period this KPI covers — the deck's KPIs can
        // legitimately sit on different months, so the period travels with the value.
        title: stat.subtitle || undefined,
    };
}

export function DashboardTicker({
    stats,
    alerts,
    loading,
    error,
    isLiveData,
    periodNote,
}: {
    stats: DashboardStats[];
    alerts: OperationalAlert[];
    loading: boolean;
    error: string | null;
    isLiveData: boolean;
    periodNote: string;
}) {
    const items = useMemo<TickerStat[]>(() => {
        // A failed read must not be dressed up as a healthy estate. One honest
        // item, and none of the KPI figures — which would be stale or absent.
        if (error) {
            return [
                {
                    icon: ShieldAlert,
                    label: "Live data",
                    value: "Unavailable — figures below may be out of date",
                    tone: "danger",
                    title: error,
                },
            ];
        }

        const { critical, warning, total } = summariseAlerts(alerts);

        const attention: TickerStat =
            total === 0
                ? {
                      icon: CheckCircle2,
                      label: "Needs attention",
                      value: "Nothing flagged right now",
                      tone: "success",
                      title: "No unacknowledged water-loss, contract-expiry or STP alerts.",
                  }
                : {
                      icon: AlertTriangle,
                      label: "Needs attention",
                      value: [
                          critical > 0 ? `${critical} critical` : null,
                          warning > 0 ? `${warning} warning` : null,
                      ]
                          .filter(Boolean)
                          .join(" · ") || `${total} open`,
                      tone: critical > 0 ? "danger" : "warning",
                      title: "Open operational alerts. Full detail in Latest Updates below.",
                  };

        const connection: TickerStat | null = isLiveData
            ? null
            : {
                  icon: Wifi,
                  label: "Connection",
                  value: "Not connected to live data",
                  tone: "warning",
                  title: "The dashboard could not confirm a live database connection.",
              };

        return [attention, ...(connection ? [connection] : []), ...stats.map(statToTicker)];
    }, [stats, alerts, error, isLiveData]);

    // Nothing truthful to say yet — a skeleton is honest, invented numbers are not.
    if (loading && stats.length === 0 && !error) {
        return (
            <div
                className="h-[44px] motion-safe:animate-pulse rounded-[10.5px] border border-border bg-card shadow-card-standard"
                aria-hidden="true"
            />
        );
    }

    return (
        <div title={periodNote}>
            <InspectionTicker caption="Estate briefing" items={items} />
        </div>
    );
}
