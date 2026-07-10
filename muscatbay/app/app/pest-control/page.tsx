"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useTheme } from "@/components/providers";
import { Bug, ExternalLink, Loader2, Database } from "lucide-react";
import { cn } from "@/lib/utils";

// AITable share link for the pest-control operations base.
//
// This is a THIRD-PARTY, cross-origin iframe: its internal fonts, colours and
// layout are controlled by AITable and cannot be restyled from our codebase.
// So instead of fighting the embed, we frame it so the mismatch reads as
// intentional — a clearly-labelled "external data source" panel, brand card
// chrome, a theme param synced to the app, a loading cover, a size that doesn't
// dominate the page, and a prominent "Open full view" as the primary way in.
//
// FUTURE ENHANCEMENT (separate ticket, larger effort): pull pest-control data
// via AITable's REST API and render it in our own DataTable / StatsGrid so it
// fully matches the design system. Tracked as a future item, not this change.
const EMBED_BASE_URL = "https://aitable.ai/share/shrRV9Fp15zCH50ZFTWtb";

export default function PestControlPage() {
    const { resolvedTheme } = useTheme();
    // Tracks which theme's iframe has finished loading — flipping the app theme
    // remounts the iframe (key below), so readiness is per-theme and the loading
    // cover returns during the swap.
    const [loadedTheme, setLoadedTheme] = useState<"light" | "dark" | null>(null);
    const embedReady = loadedTheme === resolvedTheme;

    const embedUrl = `${EMBED_BASE_URL}?theme=${resolvedTheme}`;

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <PageHeader
                title="Pest Control"
                description="Monitor and manage pest control operations"
            />

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
                                    Live data from the pest control operations team.
                                </CardDescription>
                            </div>
                        </div>
                        {/* Primary CTA — the intended way to use the full tool
                            (filtering, sorting, record detail live in the native view). */}
                        <a
                            href={embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-secondary dark:text-primary-foreground dark:hover:bg-secondary/90"
                        >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            Open full view
                        </a>
                    </div>
                </CardHeader>

                {/* Source-attribution strip — makes it explicit that this section
                    is a connected third-party tool, not a native app page. */}
                <div className="flex items-center gap-2 border-y border-border/60 bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground sm:px-5">
                    <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>External data source · Powered by AITable.ai</span>
                    <span className="ms-auto hidden rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:text-secondary sm:inline">
                        Embedded preview
                    </span>
                </div>

                <CardContent className="p-0">
                    {/* Height capped to a preview (not the full viewport) so the
                        embed never visually dominates — the CTA above covers the
                        full experience. */}
                    <div className="relative h-[clamp(420px,58vh,640px)] w-full overflow-hidden bg-card">
                        {/* Loading cover — app card surface so the embed fades in
                            already-themed instead of flashing foreign UI. */}
                        {!embedReady && (
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
                            // Remount when the app theme flips so the embed re-reads
                            // its theme param and stays visually consistent.
                            key={resolvedTheme}
                            src={embedUrl}
                            width="100%"
                            height="100%"
                            loading="lazy"
                            onLoad={() => setLoadedTheme(resolvedTheme)}
                            referrerPolicy="no-referrer-when-downgrade"
                            allow="fullscreen"
                            className={cn(
                                "h-full w-full bg-card transition-opacity duration-300",
                                embedReady ? "opacity-100" : "opacity-0",
                            )}
                            style={{ border: "none" }}
                            title="Pest Control Daily Report Database"
                        />
                    </div>
                </CardContent>

                {/* Helper footer — points users to the native view for full detail. */}
                <div className="border-t border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground sm:px-5">
                    Showing an embedded preview. Use <span className="font-semibold text-foreground/80">Open full view</span> for filtering, sorting and complete record detail.
                </div>
            </Card>
        </div>
    );
}
