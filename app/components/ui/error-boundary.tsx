"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    showDetails: boolean;
}

/**
 * Error Boundary component for graceful error handling in React.
 * Catches JavaScript errors anywhere in the child component tree.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console for development
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        // Update state with error details
        this.setState({ errorInfo });

        // Call optional error handler
        this.props.onError?.(error, errorInfo);
    }

    handleReload = (): void => {
        window.location.reload();
    };

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false,
        });
    };

    toggleDetails = (): void => {
        this.setState((prev) => ({ showDetails: !prev.showDetails }));
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <Card className="max-w-lg w-full border-red-200 dark:border-red-900/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 p-3 rounded-full bg-red-100 dark:bg-red-900/30 w-fit">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                            <CardTitle className="text-xl text-red-600 dark:text-red-400">
                                Something went wrong
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-center text-muted-foreground">
                                An unexpected error occurred. This has been logged and we&apos;ll work to fix it.
                            </p>

                            {/* Error message */}
                            {this.state.error && (
                                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <p className="text-sm font-mono text-red-700 dark:text-red-300 break-all">
                                        {this.state.error.message || "Unknown error"}
                                    </p>
                                </div>
                            )}

                            {/* Stack trace toggle */}
                            {this.state.errorInfo && (
                                <div className="space-y-2">
                                    <button
                                        onClick={this.toggleDetails}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {this.state.showDetails ? (
                                            <ChevronUp className="h-3 w-3" />
                                        ) : (
                                            <ChevronDown className="h-3 w-3" />
                                        )}
                                        {this.state.showDetails ? "Hide" : "Show"} technical details
                                    </button>

                                    {this.state.showDetails && (
                                        <pre className="max-h-32 overflow-auto p-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded border text-muted-foreground">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3 justify-center pt-2">
                                <Button variant="outline" onClick={this.handleReset}>
                                    Try Again
                                </Button>
                                <Button onClick={this.handleReload} className="gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Reload Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Wrapper component for error boundary with simpler usage
 */
export function WithErrorBoundary({
    children,
    fallback,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
