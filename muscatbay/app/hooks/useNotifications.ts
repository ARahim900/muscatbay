"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/functions/supabase-client";

// ─── Types ──────────────────────────────────────────────────────────────────────

/** Notification severity — maps to toast types and browser notification urgency */
type NotificationLevel = "success" | "error" | "warning" | "info";

/** Shape of a notification dispatched through the system */
interface AppNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  message?: string;
  /** Timestamp when the notification was created */
  timestamp: Date;
  /** If true, also fire a browser push notification */
  pushToOS?: boolean;
}

/** Configuration for a Supabase table watcher */
interface RealtimeAlert {
  /** Supabase table to monitor */
  table: string;
  /** Unique channel name to prevent duplicates */
  channelName: string;
  /** Called with each row payload — return a notification or null to skip */
  evaluate: (payload: Record<string, unknown>) => {
    level: NotificationLevel;
    title: string;
    message?: string;
  } | null;
  /** Postgres filter expression, e.g. `column=eq.value` */
  filter?: string;
}

/** Permission state for browser notifications */
type PushPermission = "default" | "granted" | "denied" | "unsupported";

/** Return value of the useNotifications hook */
interface UseNotificationsReturn {
  /** All in-app notifications (newest first) */
  notifications: AppNotification[];
  /** Fire a notification (in-app toast + optional browser push) */
  notify: (
    level: NotificationLevel,
    title: string,
    message?: string,
    pushToOS?: boolean
  ) => void;
  /** Dismiss a single notification by id */
  dismiss: (id: string) => void;
  /** Clear all notifications */
  clearAll: () => void;
  /** Current browser notification permission status */
  permission: PushPermission;
  /** Request browser notification permission from the user */
  requestPermission: () => Promise<void>;
  /** Convenience helpers — same as notify() with the level preset */
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Generate a unique ID for each notification */
function uid(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Map notification level to a browser notification icon path */
function levelToIcon(level: NotificationLevel): string {
  // Using the app icon for all browser notifications
  return "/icons/icon-192x192.png";
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Unified notification hook for Muscat Bay O&M Dashboard.
 *
 * Provides:
 * - In-app notification list (for rendering toasts / notification drawer)
 * - Browser (OS-level) push notifications via the Notification API
 * - Optional Supabase realtime watchers that auto-fire notifications
 *   when a row change matches a threshold
 *
 * @param realtimeAlerts  Array of table watchers with threshold logic
 * @param maxNotifications  Max in-app notifications to keep (default 50)
 *
 * @example
 * ```tsx
 * const { notify, permission, requestPermission } = useNotifications([
 *   {
 *     table: "stp_readings",
 *     channelName: "stp-alerts",
 *     evaluate: (row) =>
 *       (row.daily_flow as number) > 500
 *         ? { level: "warning", title: "STP Alert", message: "High flow detected" }
 *         : null,
 *   },
 * ]);
 * ```
 */
export function useNotifications(
  realtimeAlerts: RealtimeAlert[] = [],
  maxNotifications = 50
): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<PushPermission>("default");

  // ── Check browser notification support & current permission ──────────
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);
  }, []);

  // ── Request browser notification permission ──────────────────────────
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);
    } catch {
      // Safari < 16.4 uses callback-based API
      Notification.requestPermission((result) => {
        setPermission(result as PushPermission);
      });
    }
  }, []);

  // ── Send a browser (OS-level) notification ───────────────────────────
  const sendBrowserNotification = useCallback(
    (title: string, message?: string, level: NotificationLevel = "info") => {
      if (permission !== "granted") return;

      // When the service worker is available, use it so notifications
      // work even when the tab is in the background.
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          // Extended NotificationOptions — `vibrate` and `data` are supported
          // in browsers but not in TypeScript's lib.dom.d.ts yet
          const options: NotificationOptions & {
            vibrate?: number[];
            data?: Record<string, unknown>;
          } = {
            body: message,
            icon: levelToIcon(level),
            badge: "/icons/icon-192x192.png",
            tag: `muscatbay-${level}-${Date.now()}`,
            vibrate:
              level === "error" || level === "warning"
                ? [200, 100, 200]
                : [100],
            data: { level, url: "/" },
          };
          registration.showNotification(title, options);
        });
      } else {
        // Fallback: plain Notification API (foreground only)
        new Notification(title, {
          body: message,
          icon: levelToIcon(level),
          tag: `muscatbay-${level}-${Date.now()}`,
        });
      }
    },
    [permission]
  );

  // ── Core notify function ─────────────────────────────────────────────
  const notify = useCallback(
    (
      level: NotificationLevel,
      title: string,
      message?: string,
      pushToOS = false
    ) => {
      const notification: AppNotification = {
        id: uid(),
        level,
        title,
        message,
        timestamp: new Date(),
        pushToOS,
      };

      setNotifications((prev) => {
        const updated = [notification, ...prev];
        // Cap at maxNotifications to prevent memory leaks
        return updated.length > maxNotifications
          ? updated.slice(0, maxNotifications)
          : updated;
      });

      // Also send browser notification if requested
      if (pushToOS) {
        sendBrowserNotification(title, message, level);
      }
    },
    [maxNotifications, sendBrowserNotification]
  );

  // ── Convenience helpers ──────────────────────────────────────────────
  const success = useCallback(
    (title: string, message?: string) => notify("success", title, message),
    [notify]
  );
  const error = useCallback(
    (title: string, message?: string) => notify("error", title, message, true),
    [notify]
  );
  const warning = useCallback(
    (title: string, message?: string) =>
      notify("warning", title, message, true),
    [notify]
  );
  const info = useCallback(
    (title: string, message?: string) => notify("info", title, message),
    [notify]
  );

  // ── Dismiss / clear ─────────────────────────────────────────────────
  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ── Supabase realtime watchers ───────────────────────────────────────
  // Stable ref so the effect doesn't re-run when `notify` identity changes
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const alertsKey = realtimeAlerts
    .map((a) => `${a.table}:${a.channelName}:${a.filter ?? ""}`)
    .join("|");

  useEffect(() => {
    if (realtimeAlerts.length === 0) return;

    const client = getSupabaseClient();
    if (!client) return;

    // Create one channel per alert config
    const channels = realtimeAlerts.map((alert) => {
      const channelConfig: {
        event: "*";
        schema: string;
        table: string;
        filter?: string;
      } = {
        event: "*",
        schema: "public",
        table: alert.table,
      };

      if (alert.filter) {
        channelConfig.filter = alert.filter;
      }

      return client
        .channel(alert.channelName)
        .on(
          "postgres_changes",
          channelConfig,
          (payload: { new: Record<string, unknown> }) => {
            const result = alert.evaluate(payload.new);
            if (result) {
              // Fire the notification with OS-level push for warnings/errors
              const shouldPush =
                result.level === "warning" || result.level === "error";
              notifyRef.current(
                result.level,
                result.title,
                result.message,
                shouldPush
              );
            }
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((ch) => client.removeChannel(ch));
    };
    // Re-subscribe when the set of alerts changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertsKey]);

  return {
    notifications,
    notify,
    dismiss,
    clearAll,
    permission,
    requestPermission,
    success,
    error,
    warning,
    info,
  };
}
