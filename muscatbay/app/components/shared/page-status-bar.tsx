import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

interface PageStatusBarProps {
    /** Whether data is connected to Supabase */
    isConnected: boolean;
    /** Whether realtime subscription is active (omit to hide badge) */
    isLive?: boolean;
    /** Last data update timestamp */
    lastUpdated: Date | null;
    /** Locale for timestamp formatting; omit to use the runtime/browser locale */
    locale?: string;
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
    locale,
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
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
                            isLive
                                ? "bg-[color-mix(in_oklab,var(--status-normal)_15%,transparent)] text-[var(--status-normal)]"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        <span
                            aria-hidden="true"
                            className={cn(
                                "inline-block h-2 w-2 rounded-full",
                                isLive ? "bg-[var(--status-normal)] motion-safe:animate-pulse" : "bg-muted-foreground"
                            )}
                        />
                        {isLive ? "Live" : "Offline"}
                    </span>
                )}
                {lastUpdated && (
                    <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <span className="uppercase tracking-[0.06em] text-muted-foreground/70">Last sync</span>
                        <span className="font-mono tabular-nums text-foreground/80">
                            {lastUpdated.toLocaleTimeString(locale, {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            })}
                        </span>
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
