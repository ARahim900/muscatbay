"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useTheme } from "@/components/providers";
import { Bug, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// AITable share link for the pest-control operations base. The widget is a
// cross-origin iframe, so its internals cannot be restyled from here — what we
// CAN do is pass its supported `theme` param (kept in sync with the app theme)
// and own everything around it: brand header, card chrome, and a loading
// cover so the foreign UI never "pops" in unstyled.
const EMBED_BASE_URL = "https://aitable.ai/share/shrRV9Fp15zCH50ZFTWtb";

export default function PestControlPage() {
    const { resolvedTheme } = useTheme();
    // Tracks which theme's iframe has finished loading — flipping the app
    // theme remounts the iframe (key below), so readiness is per-theme and
    // the loading cover returns during the swap.
    const [loadedTheme, setLoadedTheme] = useState<"light" | "dark" | null>(null);
    const embedReady = loadedTheme === resolvedTheme;

    const embedUrl = `${EMBED_BASE_URL}?theme=${resolvedTheme}`;

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <PageHeader
                title="Pest Control"
                description="Monitor and manage pest control operations"
            />

            <Card className="card-elevated h-[calc(100vh-12rem)] min-h-[60vh] sm:min-h-[600px] flex flex-col motion-safe:animate-in fade-in duration-200">
                <CardHeader className="card-elevated-header">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                            <Bug className="w-6 h-6 shrink-0 text-mb-primary" />
                            <div className="min-w-0">
                                <CardTitle>Daily Report Database</CardTitle>
                                <CardDescription>
                                    Live data from the pest control operations team.
                                </CardDescription>
                            </div>
                        </div>
                        {/* The embed hides row detail on small screens — offer the
                            native full view as a consistent, branded affordance. */}
                        <a
                            href={embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Open full view</span>
                        </a>
                    </div>
                </CardHeader>
                <CardContent className="relative flex-1 border-t border-border/60 p-0 overflow-hidden">
                    {/* Loading cover — matches the app card surface so the embed
                        fades in already-themed instead of flashing foreign UI. */}
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
                            "w-full h-full bg-card transition-opacity duration-300",
                            embedReady ? "opacity-100" : "opacity-0",
                        )}
                        style={{ border: "none" }}
                        title="Pest Control Daily Report Database"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
