"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

// Toast types
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Toast icons and colors
const toastConfig: Record<ToastType, { icon: React.ComponentType<{ className?: string }>; bgClass: string; borderClass: string; iconClass: string }> = {
    success: {
        icon: CheckCircle,
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-l-green-500",
        iconClass: "text-green-500",
    },
    error: {
        icon: AlertCircle,
        bgClass: "bg-red-50 dark:bg-red-900/20",
        borderClass: "border-l-red-500",
        iconClass: "text-red-500",
    },
    warning: {
        icon: AlertTriangle,
        bgClass: "bg-amber-50 dark:bg-amber-900/20",
        borderClass: "border-l-amber-500",
        iconClass: "text-amber-500",
    },
    info: {
        icon: Info,
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        borderClass: "border-l-blue-500",
        iconClass: "text-blue-500",
    },
};

// Individual Toast Component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const config = toastConfig[toast.type];
    const Icon = config.icon;

    React.useEffect(() => {
        if (toast.duration && toast.duration > 0) {
            const timer = setTimeout(onRemove, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.duration, onRemove]);

    return (
        <div
            className={`
        flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg
        ${config.bgClass} ${config.borderClass}
        animate-in slide-in-from-right-full duration-300
        max-w-sm w-full
      `}
            role="alert"
        >
            <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconClass}`} />
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-muted-foreground mt-1">{toast.message}</p>
                )}
            </div>
            <button
                onClick={onRemove}
                className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>
        </div>
    );
}

// Toast Container Component
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onRemove={() => onRemove(toast.id)}
                />
            ))}
        </div>
    );
}

// Toast Provider Component
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, title: string, message?: string, duration: number = 5000) => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newToast: Toast = { id, type, title, message, duration };

            setToasts((prev) => [...prev, newToast]);

            // Limit to 5 visible toasts
            setToasts((prev) => {
                if (prev.length > 5) {
                    return prev.slice(-5);
                }
                return prev;
            });
        },
        []
    );

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

// Hook for using toasts
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }

    const { showToast } = context;

    return {
        success: (title: string, message?: string, duration?: number) =>
            showToast("success", title, message, duration),
        error: (title: string, message?: string, duration?: number) =>
            showToast("error", title, message, duration),
        warning: (title: string, message?: string, duration?: number) =>
            showToast("warning", title, message, duration),
        info: (title: string, message?: string, duration?: number) =>
            showToast("info", title, message, duration),
    };
}
