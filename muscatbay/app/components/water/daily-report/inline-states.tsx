"use client";

// ─── LoadingState + ErrorState + EmptyState for the Daily report.
//     Presentation only: SectionCard chrome, design tokens, kit Button.

import { Button, SectionCard } from "@/components/ui";
import { Skeleton } from "@/components/shared/skeleton";
import { RefreshCw, WifiOff, CalendarClock } from "lucide-react";

export function LoadingState() {
    return (
        <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading daily water report">
            {['Zone Bulk vs L3', 'Building Analysis', 'Direct Connections'].map(label => (
                <SectionCard key={label}>
                    <div className="flex h-card-header items-center gap-3 border-b border-line px-5">
                        <Skeleton className="h-4 w-4 rounded-control" />
                        <Skeleton className="h-4 w-48 rounded-control" />
                    </div>
                    <SectionCard.Body className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-full rounded-control" />
                        ))}
                    </SectionCard.Body>
                </SectionCard>
            ))}
        </div>
    );
}

/** Genuine fetch/network/database failure — alarm styling is earned here. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <SectionCard>
            <SectionCard.Body>
                <div role="alert" className="flex flex-col items-center px-4 py-10 text-center">
                    <div className="mb-4 rounded-pill bg-danger-tint p-4">
                        <WifiOff size={20} strokeWidth={2} className="text-danger" aria-hidden="true" />
                    </div>
                    <h3 className="mb-2 text-title text-primary dark:text-fg">
                        Failed to Load Report
                    </h3>
                    <p className="mb-6 max-w-md text-body text-muted">
                        {message}
                    </p>
                    <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>Retry</Button>
                </div>
            </SectionCard.Body>
        </SectionCard>
    );
}

/**
 * Benign "this month has no readings yet" state — distinct from a real failure.
 * Calm, neutral styling (no red alarm, no Wi-Fi/network imagery) so operators
 * read it as "data not uploaded yet", not "the system is broken".
 */
export function EmptyState({ month, onRetry }: { month: string; onRetry: () => void }) {
    return (
        <SectionCard>
            <SectionCard.Body>
                <div className="flex flex-col items-center px-4 py-10 text-center">
                    <div className="mb-4 rounded-pill bg-neutral-tint p-4">
                        <CalendarClock size={20} strokeWidth={2} className="text-muted" aria-hidden="true" />
                    </div>
                    <h3 className="mb-2 text-title text-primary dark:text-fg">
                        No readings yet for {month}
                    </h3>
                    <p className="mb-6 max-w-md text-body text-muted">
                        Daily consumption for this month hasn’t been uploaded yet. Pick an
                        earlier month, or check back once the data has been loaded.
                    </p>
                    <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>Check again</Button>
                </div>
            </SectionCard.Body>
        </SectionCard>
    );
}
