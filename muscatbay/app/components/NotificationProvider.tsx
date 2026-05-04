"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useNotifications } from "@/hooks/useNotifications";
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
  /** Number of unread notifications */
  unreadCount: number;
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
            Get alerts for STP thresholds, pump failures, and maintenance
            reminders.
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
 * - Notification history (for future notification bell / drawer)
 * - OS-level browser notifications via the service worker
 *
 * NOTE: In-app toast rendering is handled by the existing ToastProvider
 * in LayoutRouter. Use `useToast()` from `@/components/ui/toast-provider`
 * for in-app toasts, and `useAppNotifications()` for push + history.
 *
 * @example
 * ```tsx
 * // In any child component
 * const { warning, permission } = useAppNotifications();
 * warning("STP Alert", "Inlet sewage exceeded 500 m³");
 * ```
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const hook = useNotifications();

  // Unread count is derived directly from notifications rather than stored
  // in state + an effect — avoids the cascading render React 19 warns about
  // and removes a transient out-of-sync window between props and state.
  const unreadCount = hook.notifications.length;

  const clearAll = useCallback(() => {
    hook.clearAll();
  }, [hook]);

  const contextValue: NotificationContextValue = {
    ...hook,
    clearAll,
    unreadCount,
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
 * This hook provides browser push notifications + notification history.
 *
 * @example
 * ```tsx
 * const { success, error, warning, info, permission } = useAppNotifications();
 * warning("Pump Failure", "Pump #3 offline since 14:30");
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
