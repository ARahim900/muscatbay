"use client";

import { useSidebar } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useEffect, useState } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Auto-collapse on smaller screens
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [setIsCollapsed]);

    return (
        <div className="h-full relative overflow-x-hidden">
            {/* Sidebar - fixed position */}
            <div
                className={`hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}
                style={{
                    backgroundColor: "var(--mb-primary)"
                }}
            >
                <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            </div>
            {/* Main content - dynamic padding */}
            <main
                className={`pb-10 transition-all duration-300 w-full min-w-0 overflow-x-hidden pl-0 ${isMounted ? (isCollapsed ? 'md:pl-20' : 'md:pl-72') : 'md:pl-72'}`}
            >
                <Topbar />
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </main>
        </div>
    );
}
