import { cn } from "@/lib/utils";
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2, Wifi, WifiOff } from "lucide-react";

interface PageStatusBarProps {
    /** Whether data is connected to Supabase */
    isConnected: boolean;
    /** Whether realtime subscription is active (omit to hide badge) */
    isLive?: boolean;
    /** When the browser last fetched. This is *transport* recency, not data recency. */
    lastUpdated: Date | null;
    /**
     * Newest reading/record actually present in the data — the honest recency
     * signal. When supplied it becomes the primary indicator ("Data through
     * <date>") and `lastUpdated` demotes to a hover detail, because a fresh
     * fetch of a three-week-old table is not fresh data.
     */
    latestDataDate?: Date | string | null;
    /**
     * Days after which `latestDataDate` is flagged. Default 2 → warning,
     * 3× the threshold → stale. Raise it for monthly-cadence datasets.
     */
    staleAfterDays?: number;
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
    /**
     * First fetch still in flight. Shows a neutral "Connecting…" chip instead
     * of prematurely claiming Demo/OFFLINE (a false alarm while data is
     * simply still loading), and suppresses the Live badge + error line.
     */
    loading?: boolean;
}

type Freshness = "fresh" | "warning" | "stale";

const FRESHNESS_STYLE: Record<Freshness, { chip: string; icon: typeof CheckCircle2 }> = {
    fresh: {
        chip: "bg-[var(--status-normal-bg)] text-[var(--mb-success-text)]",
        icon: CheckCircle2,
    },
    warning: {
        chip: "bg-[var(--status-warning-bg)] text-[var(--mb-warning-text)]",
        icon: AlertTriangle,
    },
    stale: {
        chip: "bg-[var(--status-stale-bg)] text-[var(--mb-stale-text)]",
        icon: AlertTriangle,
    },
};

/** Whole days between a data date and now (negative values clamp to 0). */
function daysBehind(date: Date): number {
    const diffMs = Date.now() - date.getTime();
    return Math.max(0, Math.floor(diffMs / 86_400_000));
}

function toDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function PageStatusBar({
    isConnected,
    isLive,
    lastUpdated,
    latestDataDate,
    staleAfterDays = 2,
    locale,
    connectedLabel = "Live Data (Supabase)",
    disconnectedLabel = "Demo Data (Local)",
    children,
    error,
    loading = false,
}: PageStatusBarProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-end gap-1.5" role="status" aria-label="Connecting to live data">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    <Loader2 className="h-3 w-3 motion-safe:animate-spin" aria-hidden="true" />
                    Connecting…
                </div>
            </div>
        );
    }

    const dataDate = toDate(latestDataDate);
    const fetchedAt = lastUpdated
        ? lastUpdated.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : null;

    let freshness: Freshness = "fresh";
    let behind = 0;
    if (dataDate) {
        behind = daysBehind(dataDate);
        if (behind >= staleAfterDays * 3) freshness = "stale";
        else if (behind >= staleAfterDays) freshness = "warning";
    }
    const FreshnessIcon = FRESHNESS_STYLE[freshness].icon;
    const behindLabel = behind === 0 ? "today" : behind === 1 ? "1 day behind" : `${behind} days behind`;

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
                                ? "bg-[color-mix(in_oklab,var(--status-normal)_15%,transparent)] text-[var(--mb-success-text)]"
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

                {/* Primary recency: how current the DATA is. Colour is paired with an
                    icon and the "n days behind" text so it never reads on colour alone. */}
                {dataDate && (
                    <span
                        suppressHydrationWarning
                        title={fetchedAt ? `Fetched at ${fetchedAt}` : undefined}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
                            FRESHNESS_STYLE[freshness].chip
                        )}
                    >
                        <FreshnessIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="uppercase tracking-[0.06em]">Data through</span>
                        <time
                            dateTime={dataDate.toISOString()}
                            className="font-mono tabular-nums"
                        >
                            {dataDate.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}
                        </time>
                        <span className="sr-only">{`, ${behindLabel}`}</span>
                        {freshness !== "fresh" && (
                            <span aria-hidden="true" className="font-semibold">· {behindLabel}</span>
                        )}
                    </span>
                )}

                {/* Secondary: transport recency. Full chip only when there is no
                    data date to show; otherwise it lives in the hover title above. */}
                {fetchedAt && !dataDate && (
                    <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <CalendarClock className="h-3 w-3 text-muted-foreground/70" aria-hidden="true" />
                        <span className="uppercase tracking-[0.06em] text-muted-foreground/70">Last sync</span>
                        <span suppressHydrationWarning className="font-mono tabular-nums text-foreground/80">
                            {fetchedAt}
                        </span>
                    </span>
                )}
                {fetchedAt && dataDate && (
                    <span
                        suppressHydrationWarning
                        className="text-[11px] text-muted-foreground/70"
                    >
                        synced <span className="font-mono tabular-nums">{fetchedAt}</span>
                    </span>
                )}
            </div>
            {error && (
                <span role="alert" className="text-[var(--mb-warning-text)] flex items-center gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {error}
                </span>
            )}
        </div>
    );
}
