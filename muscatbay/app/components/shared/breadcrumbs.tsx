"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Navigation mapping for breadcrumb labels
const ROUTE_LABELS: Record<string, string> = {
    "/": "Dashboard",
    "/water": "Water",
    "/electricity": "Electricity",
    "/stp": "STP Plant",
    "/contractors": "Contractors",
    "/assets": "Assets",
    "/pest-control": "Pest Control",
    "/firefighting": "Fire Safety",
    "/settings": "Settings",
};

interface BreadcrumbItem {
    label: string;
    href: string;
    isCurrentPage?: boolean;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
    const pathname = usePathname();

    // Auto-generate breadcrumbs from pathname if items not provided
    const breadcrumbItems: BreadcrumbItem[] = items || (() => {
        const segments = pathname?.split("/").filter(Boolean) || [];
        const crumbs: BreadcrumbItem[] = [
            { label: "Dashboard", href: "/", isCurrentPage: segments.length === 0 }
        ];

        let currentPath = "";
        segments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const label = ROUTE_LABELS[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
            crumbs.push({
                label,
                href: currentPath,
                isCurrentPage: index === segments.length - 1
            });
        });

        return crumbs;
    })();

    // Don't render if we're on the dashboard (home page)
    if (breadcrumbItems.length <= 1) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-sm ${className}`}>
            {breadcrumbItems.map((item, index) => (
                <span key={item.href} className="flex items-center gap-1.5">
                    {index > 0 && (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    )}
                    {item.isCurrentPage ? (
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                            {item.label}
                        </span>
                    ) : (
                        <Link
                            href={item.href}
                            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-[#4E4456] dark:hover:text-[#81D8D0] transition-colors"
                        >
                            {index === 0 && <Home className="h-3.5 w-3.5" />}
                            <span>{item.label}</span>
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
