"use client";

/**
 * @fileoverview Shared alert feed — ONE rendering of the alert center, used by
 * the mobile Alerts sheet (bottom nav) and the desktop topbar bell.
 *
 * Renders, in order:
 *  1. a monitoring-state banner when live evaluation is degraded/offline —
 *     the feed must never imply "all clear" while it is actually blind;
 *  2. active operational alerts (data-driven: water loss vs target, contract
 *     expiry, STP critical failures) with Review + Acknowledge actions;
 *  3. session notifications (transient notify() events from pages);
 *  4. an honest empty state that names what is being monitored.
 *
 * Colours come exclusively from the --status-* tokens and every severity is
 * paired with an icon + text label (never colour-only).
 */

import Link from "next/link";
import {
  AlertTriangle,
  BellOff,
  CheckCircle2,
  Info,
  RotateCcw,
  WifiOff,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useAppNotifications } from "@/components/providers/notification-provider";

/** Notification level → icon + status token (paired icon+colour, never colour-only). */
export const LEVEL_META: Record<
  "success" | "error" | "warning" | "info",
  { Icon: LucideIcon; token: string; label: string }
> = {
  success: { Icon: CheckCircle2, token: "--status-normal", label: "Success" },
  warning: { Icon: AlertTriangle, token: "--status-warning", label: "Warning" },
  error: { Icon: XCircle, token: "--status-danger", label: "Critical" },
  info: { Icon: Info, token: "--status-info", label: "Info" },
};

const MODULE_LABEL: Record<string, string> = {
  water: "Water",
  contractors: "Contractors",
  stp: "STP Plant",
};

const SOURCE_LABEL: Record<string, string> = {
  water: "water loss",
  contractors: "contract expiry",
  stp: "STP failures",
};

/** Compact relative time — "just now", "5m ago", "2h ago", "3d ago". */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface AlertsFeedProps {
  /** Called when the user follows a Review link (close the hosting sheet/popover). */
  onNavigate?: () => void;
}

export function AlertsFeed({ onNavigate }: AlertsFeedProps) {
  const {
    notifications,
    dismiss,
    operationalAlerts,
    alertStatus,
    alertUnavailableSources,
    alertEvaluatedAt,
    acknowledgeAlert,
    unacknowledgeAlert,
  } = useAppNotifications();

  // Un-acknowledged first, then acknowledged (both remain visible while live).
  const activeAlerts = operationalAlerts.filter((a) => !a.acknowledged);
  const ackedAlerts = operationalAlerts.filter((a) => a.acknowledged);

  const monitoringDegraded =
    alertStatus === "unavailable" ||
    (alertStatus === "ready" && alertUnavailableSources.length > 0);

  const isEmpty =
    operationalAlerts.length === 0 && notifications.length === 0;

  return (
    <div className="space-y-2">
      {/* ── Monitoring health — never claim all-clear while blind ── */}
      {alertStatus !== "loading" && monitoringDegraded && (
        <div
          role="status"
          className="flex items-start gap-3 p-3 rounded-2xl border"
          style={{
            borderColor: "var(--status-stale)",
            backgroundColor: "var(--status-stale-bg)",
          }}
        >
          <WifiOff className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--status-stale)" }} aria-hidden="true" />
          <p className="text-xs leading-snug text-foreground/85">
            {alertStatus === "unavailable"
              ? "Live alert monitoring is offline — data sources are unreachable, so current conditions are unknown."
              : `Partially monitored: no live data for ${alertUnavailableSources
                  .map((s) => SOURCE_LABEL[s] ?? s)
                  .join(", ")}.`}
          </p>
        </div>
      )}

      {/* ── Operational alerts (data-driven) ── */}
      {(activeAlerts.length > 0 || ackedAlerts.length > 0) && (
        <div className="space-y-2" aria-label="Active operational alerts">
          {[...activeAlerts, ...ackedAlerts].map((alert) => {
            const meta = LEVEL_META[alert.level];
            const MetaIcon = meta.Icon;
            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-3 ${
                  alert.acknowledged
                    ? "border-border/60 dark:border-white/[0.06] opacity-70"
                    : "border-border dark:border-white/10"
                } bg-card dark:bg-white/[0.02]`}
              >
                <div className="flex items-start gap-3">
                  <MetaIcon
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: `var(${meta.token})` }}
                    aria-label={meta.label}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground leading-snug">{alert.title}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted-bg dark:bg-white/[0.06] rounded px-1.5 py-0.5">
                        {MODULE_LABEL[alert.module] ?? alert.module}
                      </span>
                      {alert.acknowledged && (
                        <span className="text-[10px] font-medium text-muted-foreground">Acknowledged</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">{alert.message}</p>
                    <div className="flex items-center gap-1 mt-1.5 -ms-2">
                      <Link
                        href={alert.href}
                        onClick={onNavigate}
                        className="text-xs font-semibold text-secondary hover:underline px-2 h-9 inline-flex items-center rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        Review
                      </Link>
                      {alert.acknowledged ? (
                        <button
                          onClick={() => unacknowledgeAlert(alert.id)}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 h-9 inline-flex items-center gap-1 rounded-lg hover:bg-muted-bg/60 dark:hover:bg-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <RotateCcw className="w-3 h-3" aria-hidden="true" /> Reopen
                        </button>
                      ) : (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 h-9 inline-flex items-center rounded-lg hover:bg-muted-bg/60 dark:hover:bg-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Session notifications ── */}
      {notifications.length > 0 && (
        <div className="space-y-2" aria-label="Recent notifications">
          {operationalAlerts.length > 0 && (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1 pt-1">
              Recent notifications
            </p>
          )}
          {notifications.map((n) => {
            const meta = LEVEL_META[n.level];
            const MetaIcon = meta.Icon;
            return (
              <div
                key={n.id}
                className="flex items-start gap-3 p-3 rounded-2xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.02]"
              >
                <MetaIcon
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: `var(${meta.token})` }}
                  aria-label={meta.label}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                  {n.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">{n.message}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground/80 mt-1">{timeAgo(n.timestamp)}</p>
                </div>
                <button
                  onClick={() => dismiss(n.id)}
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted-bg dark:hover:bg-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={`Dismiss: ${n.title}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty / loading states ── */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center text-center py-10 px-4">
          {alertStatus === "ready" ? (
            <>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: "var(--status-normal-bg)" }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: "var(--status-normal)" }} aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-foreground">All clear — no active alerts</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                Monitoring live data for water loss above target, contract expiry and STP critical failures.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-muted-bg dark:bg-white/[0.06] flex items-center justify-center mb-3">
                <BellOff className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {alertStatus === "loading" ? "Checking live data…" : "Alert status unknown"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                {alertStatus === "loading"
                  ? "Evaluating water loss, contracts and plant health."
                  : "Alerts cannot be evaluated while data sources are unreachable."}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Evaluation timestamp — trust cue ── */}
      {alertStatus === "ready" && alertEvaluatedAt && !isEmpty && (
        <p className="text-[10px] text-muted-foreground/80 text-center pt-1">
          Conditions evaluated {timeAgo(alertEvaluatedAt)}
        </p>
      )}
    </div>
  );
}
