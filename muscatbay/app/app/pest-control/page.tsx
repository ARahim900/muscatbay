"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { EmptyState } from "@/components/shared/empty-state";
import { useTheme } from "@/components/providers/app-providers";
import { Bug, ExternalLink, Loader2, Database, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// AITable share link for the pest-control operations base.
//
// HONEST FRAMING: pest control has NO table in this app's Supabase schema —
// no equipment register, no treatment log, no readings. The operations team
// records everything in AITable. So this page deliberately shows no KPIs and
// no charts: there is nothing native to count, and inventing figures for a
// system we do not own would be worse than showing none. The page presents
// itself as what it is — a window onto an external system.
//
// The embed is a THIRD-PARTY, cross-origin iframe: its internal fonts, colours
// and layout are controlled by AITable and cannot be restyled from our
// codebase. We frame it so the mismatch reads as intentional — a clearly
// labelled "external data source" panel, a theme param synced to the app, and
// a prominent "Open full view" as the primary way in.
//
// FUTURE ENHANCEMENT (separate ticket, larger effort): pull pest-control data
// via AITable's REST API into our own tables, then render it with DataTable /
// StatsGrid like every other module.
const EMBED_BASE_URL = "https://aitable.ai/share/shrRV9Fp15zCH50ZFTWtb";

/**
 * How long to wait for the iframe's `load` event before declaring failure.
 *
 * `onLoad` never fires when the browser refuses the frame — a CSP
 * `frame-ancestors` rejection, an `X-Frame-Options` denial, a blocked network
 * or an offline device all produce silence, not an error. Without a timer the
 * page spins forever on a spinner with no way out.
 */
const EMBED_TIMEOUT_MS = 15_000;

type EmbedState = "loading" | "ready" | "failed";

export default function PestControlPage() {
    const { resolvedTheme } = useTheme();
    // Bumping this remounts the iframe, which is the only reliable way to
    // retry a frame the browser has already refused.
    const [attempt, setAttempt] = useState(0);
    // Readiness is recorded against the frame it belongs to. A theme flip or a
    // retry changes `frameKey`, which makes the stored status stale and the
    // page falls back to "loading" without an effect having to reset it.
    const [status, setStatus] = useState<{ frameKey: string; state: EmbedState } | null>(null);

    const frameKey = `${resolvedTheme}-${attempt}`;
    const embedState: EmbedState = status?.frameKey === frameKey ? status.state : "loading";
    const embedUrl = `${EMBED_BASE_URL}?theme=${resolvedTheme}`;

    // The only job of this effect is the failure timer for the current frame.
    useEffect(() => {
        const timer = setTimeout(() => {
            setStatus((prev) =>
                prev?.frameKey === frameKey && prev.state === "ready"
                    ? prev
                    : { frameKey, state: "failed" },
            );
        }, EMBED_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [frameKey]);

    const handleLoad = useCallback(() => setStatus({ frameKey, state: "ready" }), [frameKey]);
    const handleError = useCallback(() => setStatus({ frameKey, state: "failed" }), [frameKey]);
    const retry = useCallback(() => setAttempt((n) => n + 1), []);

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <PageHeader
                title="Pest Control"
                description="Operations are recorded in an external system — this page embeds it read-only"
            />

            <SectionBoundary title="Pest Control Database">
                {/* Constrained, centred panel so the embed reads as one bounded card
                    rather than a full-bleed page that dominates the layout. */}
                <Card className="card-elevated mx-auto flex w-full max-w-5xl flex-col overflow-hidden motion-safe:animate-in fade-in duration-200">
                    <CardHeader className="card-elevated-header">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mb-primary/10 text-mb-primary">
                                    <Bug className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                    <CardTitle>Daily Report Database</CardTitle>
                                    <CardDescription>
                                        Maintained by the pest control operations team in AITable.
                                    </CardDescription>
                                </div>
                            </div>
                            {/* Primary CTA — the intended way to use the full tool, and the
                                fallback whenever the embed cannot render. */}
                            <a
                                href={embedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                Open full view
                            </a>
                        </div>
                    </CardHeader>

                    {/* Source-attribution strip — makes it explicit that this section
                        is a connected third-party tool, not a native app page. */}
                    <div className="flex items-center gap-2 border-y border-border/60 bg-muted-bg/40 px-4 py-2 text-[11px] font-medium text-muted-foreground sm:px-5">
                        <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>External data source · Powered by AITable.ai</span>
                        <span className="ms-auto hidden rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:text-secondary sm:inline">
                            Embedded preview
                        </span>
                    </div>

                    <CardContent className="p-0">
                        {embedState === "failed" ? (
                            // Failure path: the embed was refused or never loaded. Say so
                            // plainly and give both recovery routes.
                            <div className="border-b border-border/60 bg-card">
                                <EmptyState
                                    variant="error"
                                    title="The embedded database didn’t load"
                                    description="AITable may be blocked by your network or browser, or it may be refusing to be framed. Open it in a new tab instead, or try loading the preview again."
                                    action={{ label: "Try again", onClick: retry }}
                                />
                                <div className="flex flex-wrap items-center justify-center gap-3 px-6 pb-8">
                                    <a
                                        href={embedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                        Open in a new tab
                                    </a>
                                    <button
                                        type="button"
                                        onClick={retry}
                                        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                                        Reload preview
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Height capped to a preview (not the full viewport) so the
                               embed never visually dominates — the CTA above covers the
                               full experience. */
                            <div className="relative h-[clamp(420px,58vh,640px)] w-full overflow-hidden bg-card">
                                {/* Loading cover — app card surface so the embed fades in
                                    already-themed instead of flashing foreign UI. */}
                                {embedState === "loading" && (
                                    <div
                                        role="status"
                                        aria-label="Loading pest control database"
                                        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card"
                                    >
                                        <Loader2 className="h-6 w-6 motion-safe:animate-spin text-secondary" aria-hidden="true" />
                                        <p className="text-xs text-muted-foreground">Loading operations database…</p>
                                    </div>
                                )}
                                <iframe
                                    // Remount on a theme flip (so the embed re-reads its theme
                                    // param) and on retry (the only way to re-request a frame
                                    // the browser already refused).
                                    key={frameKey}
                                    src={embedUrl}
                                    width="100%"
                                    height="100%"
                                    loading="lazy"
                                    onLoad={handleLoad}
                                    onError={handleError}
                                    referrerPolicy="no-referrer-when-downgrade"
                                    // Least privilege for a third-party frame: it may run its
                                    // own scripts and keep its own origin/storage so the share
                                    // view works, and open links in a new tab on a user
                                    // gesture — but it cannot navigate this page away or
                                    // submit forms into our origin.
                                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                                    allow="fullscreen"
                                    className={cn(
                                        "h-full w-full bg-card transition-opacity duration-300",
                                        embedState === "ready" ? "opacity-100" : "opacity-0",
                                    )}
                                    style={{ border: "none" }}
                                    title="Pest Control Daily Report Database"
                                />
                            </div>
                        )}
                    </CardContent>

                    {/* Helper footer — points users to the native view for full detail. */}
                    <div className="border-t border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground sm:px-5">
                        Showing an embedded preview. Use <span className="font-semibold text-foreground/80">Open full view</span> for filtering, sorting and complete record detail.
                    </div>
                </Card>
            </SectionBoundary>

            {/* Why this module has no KPIs — stated rather than filled with invented numbers. */}
            <Card className="mx-auto w-full max-w-5xl">
                <CardContent className="p-4 flex items-start gap-3">
                    <Database className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="text-xs text-muted-foreground leading-relaxed">
                        <p className="font-semibold text-foreground">No native pest-control data yet</p>
                        <p className="mt-1">
                            Pest control has no table in the Muscat Bay database — every treatment record lives
                            in the AITable base above. This page therefore shows no KPIs, trends or charts: there
                            is nothing to measure on our side, and figures would have to be invented to fill the
                            space. Once pest-control records are synced into Supabase, this module will get the
                            same KPI cards, tables and exports as the other utilities.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
