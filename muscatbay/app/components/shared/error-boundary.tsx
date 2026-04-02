"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallbackTitle?: string;
    fallbackDescription?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        {this.props.fallbackTitle || "Something went wrong"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                        {this.props.fallbackDescription || "An unexpected error occurred. Please try again."}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors duration-200"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
