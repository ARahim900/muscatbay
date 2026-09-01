import { cn } from "@/lib/utils";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleHelp, Database, Loader2, WifiOff } from "lucide-react";

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
    connectedLabel = "Supabase",
    disconnectedLabel = "No data source",
    children,
    error,
    loading = false,
}: PageStatusBarProps) {
    if (loading) {
        return (
            <div className="rounded-xl border border-border/70 bg-card px-3 py-2 shadow-sm" role="status" aria-label="Connecting to live data">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
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
        <div className="flex max-w-full flex-col items-stretch gap-1.5 sm:items-end">
            <div className="flex max-w-full flex-wrap items-center justify-start gap-x-2.5 gap-y-1.5 rounded-xl border border-border/70 bg-card px-3 py-2 text-xs shadow-sm sm:justify-end">
                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 font-semibold",
                        isConnected ? "text-[var(--mb-success-text)]" : "text-[var(--mb-warning-text)]"
                    )}
                >
                    {isConnected ? <Database className="h-3.5 w-3.5" aria-hidden="true" /> : <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />}
                    {isConnected ? connectedLabel : disconnectedLabel}
                </span>
                <span aria-hidden="true" className="hidden h-3 w-px bg-border sm:block" />
                {isLive !== undefined && (
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
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
                        {isLive ? "Live" : "Delayed"}
                    </span>
                )}

                {/* Primary recency: how current the DATA is. Colour is paired with an
                    icon and the "n days behind" text so it never reads on colour alone. */}
                {dataDate && (
                    <span
                        suppressHydrationWarning
                        title={fetchedAt ? `Fetched at ${fetchedAt}` : undefined}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            FRESHNESS_STYLE[freshness].chip,
                        )}
                    >
                        <FreshnessIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="uppercase tracking-[0.06em]">Latest period</span>
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
                        <span className="uppercase tracking-[0.06em] text-muted-foreground/70">Last synced</span>
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
                        Last synced <span className="font-mono tabular-nums">{fetchedAt}</span>
                    </span>
                )}
                {children && (
                    <span
                        className="group relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground focus-within:ring-2 focus-within:ring-secondary/50"
                    >
                        <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full" aria-label="Data source details">
                            <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span role="tooltip" className="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden min-w-max rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-md group-hover:block group-focus-within:block">
                            {children}
                        </span>
                    </span>
                )}
            </div>
            {error && (
                <span role="alert" className="flex items-center gap-1 text-xs text-[var(--mb-warning-text)] sm:justify-end">
                    <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {error}
                </span>
            )}
        </div>
    );
}
