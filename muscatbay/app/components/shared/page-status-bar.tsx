"use client";

import { cn } from "@/lib/utils";
import { Clock, Radio, Wifi, WifiOff } from "lucide-react";

interface PageStatusBarProps {
    /** Whether data is connected to Supabase */
    isConnected: boolean;
    /** Whether realtime subscription is active (omit to hide badge) */
    isLive?: boolean;
    /** Last data update timestamp */
    lastUpdated: Date | null;
    /** Label shown when connected */
    connectedLabel?: string;
    /** Label shown when disconnected */
    disconnectedLabel?: string;
    /** Extra content in the badges row (e.g. readings count) */
    children?: React.ReactNode;
    /** Error message displayed below the status badges */
    error?: string | null;
}

export function PageStatusBar({
    isConnected,
    isLive,
    lastUpdated,
    connectedLabel = "Live Data (Supabase)",
    disconnectedLabel = "Demo Data (Local)",
    children,
    error,
}: PageStatusBarProps) {
    return (
        <div className="flex flex-col items-end gap-1.5">
            <div
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                    isConnected
                        ? "bg-mb-success-light text-[var(--mb-success-text)] dark:bg-mb-success-light/20"
                        : "bg-mb-warning-light text-[var(--mb-warning-text)] dark:bg-mb-warning-light/20"
                )}
            >
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? connectedLabel : disconnectedLabel}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                {children}
                {isLive !== undefined && (
                    <span
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
                            isLive
                                ? "bg-[color-mix(in_oklab,var(--status-normal)_15%,transparent)] text-[var(--status-normal)]"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        <Radio className={cn("h-3 w-3", isLive && "motion-safe:animate-pulse")} />
                        {isLive ? "Live" : "Offline"}
                    </span>
                )}
                {lastUpdated && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                        <Clock className="h-3 w-3" />
                        {lastUpdated.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                    </span>
                )}
            </div>
            {error && (
                <span role="alert" className="text-[var(--mb-warning-text)] flex items-center gap-1 text-xs">
                    {error}
                </span>
            )}
        </div>
    );
}
