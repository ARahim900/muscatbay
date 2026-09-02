"use client";

/**
 * Desktop alert surface — a topbar bell with an unread badge and a dropdown
 * hosting the shared {@link AlertsFeed}.
 *
 * Until now the alert feed existed only inside the mobile bottom-nav sheet,
 * leaving desktop/control-room users (the primary surface) with no way to see
 * alerts at all. This mirrors the topbar profile dropdown's interaction
 * conventions: click-outside + Escape to close, focus returned to the trigger.
 */

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useAppNotifications } from "@/components/providers/notification-provider";
import { AlertsFeed } from "@/components/alerts/alerts-feed";

export function NotificationBell() {
    const { unreadCount, notifications, clearAll, markFeedOpened } = useAppNotifications();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Opening the feed marks session notifications as read.
    const toggle = () => {
        setOpen((prev) => {
            if (!prev) markFeedOpened();
            return !prev;
        });
    };

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
                document.getElementById("notification-bell-trigger")?.focus();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                id="notification-bell-trigger"
                onClick={toggle}
                className="relative w-11 h-11 flex items-center justify-center hover:bg-muted-bg dark:hover:bg-white/[0.06] rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
                aria-label={`Alerts${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls="notification-bell-panel"
            >
                <Bell className="w-[17px] h-[17px]" />
                {unreadCount > 0 && (
                    <span
                        className="absolute top-1.5 end-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-[var(--card)]"
                        style={{ backgroundColor: "var(--status-danger)" }}
                        aria-hidden="true"
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    id="notification-bell-panel"
                    role="dialog"
                    aria-label="Alerts"
                    className="absolute end-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-popover text-popover-foreground rounded-xl shadow-xl border border-border z-50 motion-safe:animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <span className="text-sm font-semibold text-foreground">Alerts</span>
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 h-8 rounded-lg hover:bg-muted-bg/60 dark:hover:bg-white/[0.06] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                Clear notifications
                            </button>
                        )}
                    </div>
                    <div className="max-h-[min(60vh,480px)] overflow-y-auto overscroll-contain p-3">
                        <AlertsFeed onNavigate={() => setOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
