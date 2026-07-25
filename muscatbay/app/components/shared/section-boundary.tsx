"use client";

/**
 * SectionBoundary — the single React error boundary for the app.
 *
 * Wrap any page section that renders live data so one bad payload (a null
 * series, an unexpected shape from Supabase) degrades that card instead of
 * blanking the whole route:
 *
 *   <SectionBoundary title="Water balance">
 *       <WaterBalanceChart data={data} />
 *   </SectionBoundary>
 *
 * Scope
 * -----
 * - Catches errors thrown during the render/commit of its subtree (the React
 *   error-boundary contract). It cannot catch async rejections or event-handler
 *   errors — those belong to the calling code.
 * - `app/error.tsx` is the route-level net (whole page segment) and
 *   `app/global-error.tsx` the last resort (root layout). This is the
 *   in-page, section-level net between them.
 *
 * Retry re-mounts the subtree via a bumped `resetKey`, so a component that
 * cached bad state in a `useState` initialiser starts clean.
 */

import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface SectionBoundaryProps {
    children: ReactNode;
    /** Section name, shown in the fallback so an operator knows what is missing. */
    title?: string;
    /** Replaces the built-in fallback card entirely. */
    fallback?: ReactNode;
    /** Hook for telemetry. Called in addition to the console breadcrumb. */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface SectionBoundaryState {
    error: Error | null;
    /** Bumped on retry to force the children subtree to remount. */
    resetKey: number;
}

export class SectionBoundary extends Component<SectionBoundaryProps, SectionBoundaryState> {
    state: SectionBoundaryState = { error: null, resetKey: 0 };

    static getDerivedStateFromError(error: Error): Partial<SectionBoundaryState> {
        return { error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Console breadcrumb keeps the failure discoverable in the field; wire
        // telemetry through `onError` when a reporter is added.
        console.error(
            `SectionBoundary caught an error${this.props.title ? ` in "${this.props.title}"` : ""}:`,
            error,
            errorInfo
        );
        this.props.onError?.(error, errorInfo);
    }

    private handleRetry = (): void => {
        this.setState((prev) => ({ error: null, resetKey: prev.resetKey + 1 }));
    };

    render(): ReactNode {
        const { error } = this.state;
        const { children, fallback, title } = this.props;

        if (!error) {
            // Keyed Fragment: no wrapper element (grid/flex layouts are untouched)
            // but bumping the key still remounts the subtree on retry.
            return <Fragment key={this.state.resetKey}>{children}</Fragment>;
        }

        if (fallback) return <>{fallback}</>;

        return (
            <div
                role="alert"
                className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-border bg-card px-6 py-8 text-center"
            >
                <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--status-danger-bg)]"
                >
                    <AlertTriangle className="h-5 w-5 text-[var(--status-danger)]" />
                </span>

                <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                        {title ? `${title} could not be displayed` : "This section could not be displayed"}
                    </p>
                    <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                        The rest of the page is unaffected. Retry to reload just this section.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={this.handleRetry}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Retry
                </button>
            </div>
        );
    }
}
