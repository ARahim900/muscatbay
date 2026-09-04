import { StatusChip } from "@/components/ui/status-chip";
import { AlertTriangle } from "lucide-react";

/**
 * The page-level data-source indicator.
 *
 * This used to render a cluster — "Live Data (Supabase)" + a record count + a
 * LIVE/Offline badge + a "DATA THROUGH …" pill + "synced hh:mm:ss" — which made
 * every module header two to three times the height of Water's and pushed the
 * page title into wrapping. DESIGN_SYSTEM.md §6 allows exactly ONE chip
 * ("Never: two chips, or 'Connected' next to 'Offline'"), and `StatusChip` was
 * written to replace precisely this cluster; the pages simply had not adopted
 * it. This component now maps its props onto that one chip, so the six module
 * pages that use it match `/water` without each needing its own rewrite.
 *
 * State priority, following the mapping `/water` already uses:
 *   loading            → connecting
 *   not connected      → offline
 *   data behind        → stale   (outranks realtime: a 65-day-old table is the
 *                                 more important fact than the socket state)
 *   realtime down      → connecting
 *   otherwise          → live
 */
interface PageStatusBarProps {
    /** Whether data is connected to Supabase */
    isConnected: boolean;
    /** Whether the realtime subscription is active (omit if the page has none) */
    isLive?: boolean;
    /** When the browser last fetched. This is *transport* recency, not data recency. */
    lastUpdated: Date | null;
    /**
     * Newest reading/record actually present in the data — the honest recency
     * signal, and the one that drives the `stale` state. A fresh fetch of a
     * three-week-old table is not fresh data.
     */
    latestDataDate?: Date | string | null;
    /**
     * Days after which `latestDataDate` counts as stale. Default 2. Raise it for
     * monthly-cadence datasets.
     */
    staleAfterDays?: number;
    /** Locale for timestamp formatting. Defaults to en-GB, as `/water` uses. */
    locale?: string;
    /** Error message displayed below the chip */
    error?: string | null;
    /**
     * First fetch still in flight. Shows "Connecting…" rather than prematurely
     * claiming Offline, and suppresses the error line.
     */
    loading?: boolean;
}

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
    locale = "en-GB",
    error,
    loading = false,
}: PageStatusBarProps) {
    const dataDate = toDate(latestDataDate);
    const behind = dataDate ? daysBehind(dataDate) : 0;
    const isStale = Boolean(dataDate) && behind >= staleAfterDays;

    const state = loading
        ? "connecting"
        : !isConnected
            ? "offline"
            : isStale
                ? "stale"
                : isLive === false
                    ? "connecting"
                    : "live";

    return (
        <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
            <StatusChip
                state={state}
                // "23:41" — minutes, not seconds. A per-second timestamp reads as
                // precision the figure does not have.
                syncedAt={
                    lastUpdated
                        ? lastUpdated.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
                        : undefined
                }
                dataThrough={
                    dataDate
                        ? dataDate.toLocaleDateString(locale, { day: "2-digit", month: "short" })
                        : undefined
                }
                daysBehind={dataDate ? behind : undefined}
            />
            {error && !loading && (
                <span role="alert" className="flex items-center gap-1 text-xs text-[var(--mb-warning-text)] sm:justify-end">
                    <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {error}
                </span>
            )}
        </div>
    );
}
