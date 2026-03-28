"use client";

import { cn } from "@/lib/utils";

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Wraps page content with a subtle fade-in-up entrance animation.
 * Respects prefers-reduced-motion automatically via CSS.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
    return (
        <div
            className={cn(
                "animate-fade-in-up motion-reduce:animate-none",
                className
            )}
        >
            {children}
        </div>
    );
}
