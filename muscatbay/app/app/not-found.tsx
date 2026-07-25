/**
 * 404 page. Renders inside the app shell (sidebar + topbar stay mounted), so a
 * mistyped or retired URL is a dead end for one page, not for the session.
 */

import Link from "next/link";
import { SearchX } from "lucide-react";

export const metadata = {
    title: "Page not found · Muscat Bay Operations",
};

const SUGGESTIONS = [
    { href: "/", label: "Dashboard" },
    { href: "/water", label: "Water" },
    { href: "/electricity", label: "Electricity" },
    { href: "/stp", label: "STP Plant" },
    { href: "/assets", label: "Assets" },
];

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
            <div className="max-w-md space-y-5 text-center">
                <span
                    aria-hidden="true"
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"
                >
                    <SearchX className="h-7 w-7 text-muted-foreground" />
                </span>

                <div className="space-y-1">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">404</p>
                    <h1 className="text-base font-semibold text-foreground">This page doesn&apos;t exist</h1>
                    <p className="text-sm text-muted-foreground">
                        The link may be out of date, or the module may have moved. Pick a
                        destination below, or use the sidebar.
                    </p>
                </div>

                <nav aria-label="Suggested pages" className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="inline-flex min-h-11 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
