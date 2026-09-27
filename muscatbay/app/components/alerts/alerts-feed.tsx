"use client";

/**
 * @fileoverview Shared alert feed — ONE rendering of the alert center, used by
 * the mobile Alerts sheet (bottom nav) and the desktop topbar bell.
 *
 * Renders, in order:
 *  1. a monitoring-state banner when live evaluation is degraded/offline —
 *     the feed must never imply "all clear" while it is actually blind;
 *  2. active operational alerts (data-driven: water loss vs target, contract
 *     expiry, STP critical failures) — the whole card opens the alert's own
 *     view, with Acknowledge / Reopen as separate buttons;
 *  3. session notifications (transient notify() events from pages) — whole
 *     card tappable when the notification carries an href;
 *  4. an honest empty state that names what is being monitored.
 *
 * Colours come exclusively from the --status-* tokens and every severity is
 * paired with an icon + text label (never colour-only).
 *
 * Tap target: the title is the one real link, stretched over the whole card
 * with an ::after overlay. The action buttons are siblings raised above that
 * overlay (relative z-10) — never nested inside the link, which would be
 * invalid interactive nesting and would announce the card as one blob.
 *
 * Focus: the card itself draws the 3px --ring focus ring while its link has
 * keyboard focus (`has-[a:focus-visible]`), so the ring outlines the whole
 * card. An acknowledged card dims its content, not the card box, so that ring
 * is never faded with it.
 *
 * A link to the page already on screen navigates with `replace`: the page
 * strips the link's one-shot parameters straight after, and a pushed entry
 * would leave two identical history entries (Back would appear to do nothing).
 */

import { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BellOff,
  CheckCircle2,
  ChevronRight,
  Info,
  RotateCcw,
  WifiOff,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useAppNotifications } from "@/components/providers/notification-provider";
import { isSamePageHref } from "@/lib/deep-links";

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
  /** Called when the user opens an alert (close the hosting sheet/popover). */
  onNavigate?: () => void;
}

/**
 * The stretched link: its ::after covers the nearest `relative` ancestor (the
 * card), so a tap anywhere on the card navigates. Its own ring is switched off
 * — the card draws the focus ring instead (CARD_FOCUS_CLASS).
 */
const CARD_LINK_CLASS =
  "after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:ring-0";

/** Whole-card focus ring while the card's link has keyboard focus (brand: 3px, --ring). */
const CARD_FOCUS_CLASS = "has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring";

/** 3px --ring focus ring for the buttons raised above the overlay. */
const BUTTON_FOCUS_CLASS = "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring";

/** Card chrome shared by alert and notification cards; hover only when tappable. */
const CARD_HOVER_CLASS = "transition-colors hover:bg-muted-bg/50 dark:hover:bg-white/[0.04]";

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
  // The feed can be mounted twice (topbar bell + mobile sheet) — prefix ids.
  const idPrefix = useId();
  const pathname = usePathname();

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
          {[...activeAlerts, ...ackedAlerts].map((alert, index) => {
            const meta = LEVEL_META[alert.level];
            const MetaIcon = meta.Icon;
            const messageId = `${idPrefix}-alert-${index}`;
            return (
              <div
                key={alert.id}
                className={`relative rounded-2xl border p-3 ${CARD_HOVER_CLASS} ${CARD_FOCUS_CLASS} ${
                  alert.acknowledged
                    ? "border-border/60 dark:border-white/[0.06]"
                    : "border-border dark:border-white/10"
                } bg-card dark:bg-white/[0.02]`}
              >
                <div className={`flex items-start gap-3 ${alert.acknowledged ? "opacity-70" : ""}`}>
                  <MetaIcon
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: `var(${meta.token})` }}
                    aria-label={meta.label}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        <Link
                          href={alert.href}
                          replace={isSamePageHref(alert.href, pathname)}
                          onClick={onNavigate}
                          aria-describedby={messageId}
                          className={CARD_LINK_CLASS}
                        >
                          {alert.title}
                        </Link>
                      </p>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted-bg dark:bg-white/[0.06] rounded px-1.5 py-0.5">
                        {MODULE_LABEL[alert.module] ?? alert.module}
                      </span>
                      {alert.acknowledged && (
                        <span className="text-[10px] font-medium text-muted-foreground">Acknowledged</span>
                      )}
                    </div>
                    <p id={messageId} className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">{alert.message}</p>
                    {/* The buttons keep a 44px target but take 36px of layout
                        (-my-1), so the 44px rule does not make every card taller. */}
                    <div className="flex items-center gap-1 mt-1 -ms-2">
                      {/* Visual cue only — the card itself is the link, so this
                          is hidden from assistive tech to avoid a duplicate. */}
                      <span
                        aria-hidden="true"
                        className="text-xs font-semibold text-secondary px-2 inline-flex items-center gap-0.5"
                      >
                        Review <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                      {alert.acknowledged ? (
                        <button
                          type="button"
                          onClick={() => unacknowledgeAlert(alert.id)}
                          className={`relative z-10 text-xs font-medium text-muted-foreground hover:text-foreground px-2 h-11 -my-1 inline-flex items-center gap-1 rounded-lg hover:bg-muted-bg/60 dark:hover:bg-white/[0.06] transition-colors ${BUTTON_FOCUS_CLASS}`}
                        >
                          <RotateCcw className="w-3 h-3" aria-hidden="true" /> Reopen
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className={`relative z-10 text-xs font-medium text-muted-foreground hover:text-foreground px-2 h-11 -my-1 inline-flex items-center rounded-lg hover:bg-muted-bg/60 dark:hover:bg-white/[0.06] transition-colors ${BUTTON_FOCUS_CLASS}`}
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
          {notifications.map((n, index) => {
            const meta = LEVEL_META[n.level];
            const MetaIcon = meta.Icon;
            const messageId = `${idPrefix}-note-${index}`;
            return (
              <div
                key={n.id}
                className={`relative flex items-start gap-3 p-3 rounded-2xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.02] ${
                  n.href ? `${CARD_HOVER_CLASS} ${CARD_FOCUS_CLASS}` : ""
                }`}
              >
                <MetaIcon
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: `var(${meta.token})` }}
                  aria-label={meta.label}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {n.href ? (
                      <Link
                        href={n.href}
                        replace={isSamePageHref(n.href, pathname)}
                        onClick={onNavigate}
                        aria-describedby={n.message ? messageId : undefined}
                        className={CARD_LINK_CLASS}
                      >
                        {n.title}
                      </Link>
                    ) : (
                      n.title
                    )}
                  </p>
                  {n.message && (
                    <p id={messageId} className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">{n.message}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground/80 mt-1">{timeAgo(n.timestamp)}</p>
                </div>
                {/* 44px target; the negative margin keeps the card compact. */}
                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  className={`relative z-10 w-11 h-11 -m-1.5 flex-shrink-0 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted-bg dark:hover:bg-white/[0.06] transition-colors ${BUTTON_FOCUS_CLASS}`}
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
