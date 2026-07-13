"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  useOperationalAlerts,
  type AckableAlert,
  type OperationalAlertStatus,
} from "@/hooks/useOperationalAlerts";
import { Bell } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

type NotificationLevel = "success" | "error" | "warning" | "info";

interface AppNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  message?: string;
  timestamp: Date;
  pushToOS?: boolean;
}

type PushPermission = "default" | "granted" | "denied" | "unsupported";

interface NotificationContextValue {
  /** All in-app notifications (newest first) */
  notifications: AppNotification[];
  /** Fire a notification (also triggers browser push for warning/error) */
  notify: (
    level: NotificationLevel,
    title: string,
    message?: string,
    pushToOS?: boolean
  ) => void;
  /** Dismiss a notification from the history */
  dismiss: (id: string) => void;
  /** Clear all notifications */
  clearAll: () => void;
  /** Browser push permission state */
  permission: PushPermission;
  /** Request browser notification permission */
  requestPermission: () => Promise<void>;
  /** Convenience: fire a success notification */
  success: (title: string, message?: string) => void;
  /** Convenience: fire an error notification */
  error: (title: string, message?: string) => void;
  /** Convenience: fire a warning notification */
  warning: (title: string, message?: string) => void;
  /** Convenience: fire an info notification */
  info: (title: string, message?: string) => void;
  /** Unread badge count: un-acknowledged operational alerts + session notifications newer than the last feed open. */
  unreadCount: number;

  // ── Operational alerts (data-driven — loss exceedance, contract expiry, critical failures) ──
  /** Active operational alerts, most severe first. */
  operationalAlerts: AckableAlert[];
  /** loading = first evaluation in flight; unavailable = no live source reachable. */
  alertStatus: OperationalAlertStatus;
  /** Sources that could not be evaluated ("water" | "contractors" | "stp"). */
  alertUnavailableSources: string[];
  /** When the alert rules last ran. */
  alertEvaluatedAt: Date | null;
  /** Acknowledge an alert — keeps it listed (condition is still live) but out of the badge. */
  acknowledgeAlert: (id: string) => void;
  /** Undo an acknowledgement. */
  unacknowledgeAlert: (id: string) => void;
  /** Mark the feed as opened — session notifications up to now stop counting as unread. */
  markFeedOpened: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

// ─── Permission Banner ──────────────────────────────────────────────────────────
// Shown once on first visit. Asks the user to enable browser notifications.
// Persists dismissal in localStorage so it doesn't reappear.

function PermissionBanner({
  permission,
  onRequest,
}: {
  permission: PushPermission;
  onRequest: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe mount: defers localStorage read until after hydration to
  // avoid SSR/CSR mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const wasDismissed = localStorage.getItem("notif-banner-dismissed");

    if (wasDismissed) setDismissed(true);
  }, []);

  // Only show when permission hasn't been decided yet
  if (!mounted || dismissed || permission !== "default") return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[101] max-w-md w-[calc(100%-2rem)]">
      <div
        role="region"
        aria-label="Notifications permission"
        className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border shadow-xl"
      >
        <Bell className="h-5 w-5 text-secondary flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Enable notifications?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get alerts for water loss above target, expiring contracts, and
            critical plant failures.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            aria-label="Dismiss notifications permission banner"
            onClick={() => {
              setDismissed(true);
              localStorage.setItem("notif-banner-dismissed", "true");
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 min-h-[44px]"
          >
            Later
          </button>
          <button
            type="button"
            aria-label="Enable browser notifications"
            onClick={() => {
              onRequest();
              setDismissed(true);
            }}
            className="text-xs font-medium bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 hover:bg-secondary/80 transition-colors min-h-[44px]"
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider Component ─────────────────────────────────────────────────────────

/**
 * Wraps the app with notification capabilities.
 *
 * Handles:
 * - Browser push notification permission + banner
 * - Session notification history (manual notify() calls from pages)
 * - Operational alerts derived from live data (water loss vs target,
 *   contract expiry, STP critical failures) via `useOperationalAlerts`
 * - OS-level browser notifications via the service worker
 *
 * NOTE: In-app toast rendering is handled by the existing ToastProvider
 * in LayoutRouter. Use `useToast()` from `@/components/ui/toast-provider`
 * for in-app toasts, and `useAppNotifications()` for alerts + history.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const hook = useNotifications();
  const operational = useOperationalAlerts(hook.pushToOS);

  // Session notifications are "unread" until the feed is opened.
  const [lastFeedOpenAt, setLastFeedOpenAt] = useState<Date | null>(null);
  const markFeedOpened = useCallback(() => {
    setLastFeedOpenAt(new Date());
  }, []);

  const unreadSessionCount = useMemo(
    () =>
      hook.notifications.filter(
        (n) => !lastFeedOpenAt || n.timestamp > lastFeedOpenAt
      ).length,
    [hook.notifications, lastFeedOpenAt]
  );

  const unreadCount = operational.unacknowledgedCount + unreadSessionCount;

  const clearAll = useCallback(() => {
    hook.clearAll();
  }, [hook]);

  const contextValue: NotificationContextValue = {
    ...hook,
    clearAll,
    unreadCount,
    operationalAlerts: operational.alerts,
    alertStatus: operational.status,
    alertUnavailableSources: operational.unavailableSources,
    alertEvaluatedAt: operational.evaluatedAt,
    acknowledgeAlert: operational.acknowledge,
    unacknowledgeAlert: operational.unacknowledge,
    markFeedOpened,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* Permission banner — shown once until user acts */}
      <PermissionBanner
        permission={hook.permission}
        onRequest={hook.requestPermission}
      />
    </NotificationContext.Provider>
  );
}

// ─── Consumer Hook ──────────────────────────────────────────────────────────────

/**
 * Access the notification system from any component.
 *
 * Must be used within a <NotificationProvider>.
 *
 * For in-app toasts, also use `useToast()` from `@/components/ui/toast-provider`.
 * This hook provides browser push notifications, session notification history
 * and the data-driven operational alert feed.
 *
 * @example
 * ```tsx
 * const { operationalAlerts, unreadCount, acknowledgeAlert } = useAppNotifications();
 * ```
 */
export function useAppNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useAppNotifications must be used within a <NotificationProvider>"
    );
  }
  return ctx;
}
