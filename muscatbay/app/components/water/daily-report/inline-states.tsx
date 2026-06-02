"use client";

// ─── LoadingState + ErrorState — extracted verbatim from DailyWaterReport.tsx.
//     Pure relocation; no behavior changes.

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff, CalendarClock } from "lucide-react";

export function LoadingState() {
    return (
        <div className="space-y-4">
            {['Zone Bulk vs L3', 'Building Analysis', 'Direct Connections'].map(label => (
                <Card key={label} className="card-elevated">
                    <CardHeader className="card-elevated-header p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-border dark:bg-muted motion-safe:animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-48 bg-border dark:bg-muted rounded motion-safe:animate-pulse" />
                                <div className="h-3 w-72 bg-muted dark:bg-muted rounded motion-safe:animate-pulse" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-9 w-full rounded bg-muted dark:bg-muted motion-safe:animate-pulse" />
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/** Genuine fetch/network/database failure — alarm styling is earned here. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <WifiOff className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
                Failed to Load Report
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-md mb-6">
                {message}
            </p>
            <Button onClick={onRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Retry
            </Button>
        </div>
    );
}

/**
 * Benign "this month has no readings yet" state — distinct from a real failure.
 * Calm, info-toned styling (no red alarm, no Wi-Fi/network imagery) so operators
 * read it as "data not uploaded yet", not "the system is broken".
 */
export function EmptyState({ month, onRetry }: { month: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="p-4 rounded-full bg-muted dark:bg-muted/50 mb-4">
                <CalendarClock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
                No readings yet for {month}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-md mb-6">
                Daily consumption for this month hasn’t been uploaded yet. Pick an
                earlier month, or check back once the data has been loaded.
            </p>
            <Button onClick={onRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Check again
            </Button>
        </div>
    );
}
