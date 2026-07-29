"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowUpRight,
    Bug,
    CheckCircle2,
    ExternalLink,
    Flame,
    HelpCircle,
    Package,
    Users,
    Wrench,
    type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoverageState, ModuleCoverage } from "@/hooks/useModuleCoverage";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/components/auth/auth-provider";
import { canAccessModule } from "@/lib/rbac";
import { MOTION } from "@/lib/motion";

/**
 * Compact coverage strip for the five modules that had no dashboard presence.
 *
 * Numbers here are live Supabase counts or nothing at all: a metric whose value
 * is `null` renders an em dash plus an explicit reason. There is deliberately
 * no "0" fallback — 0 is a claim, and an unread query has not earned it.
 */

const MODULE_ICON: Record<ModuleCoverage["key"], LucideIcon> = {
    assets: Package,
    contractors: Users,
    hvac: Wrench,
    firefighting: Flame,
    "pest-control": Bug,
};

/** Module accent — icons only, per the design system. */
const MODULE_ACCENT: Record<ModuleCoverage["key"], string> = {
    assets: "var(--module-assets)",
    contractors: "var(--module-contractors)",
    hvac: "var(--module-hvac)",
    firefighting: "var(--module-fire)",
    "pest-control": "var(--module-pest)",
};

/** Status token + icon + text label — never colour alone. */
const STATE_META: Record<CoverageState, { color: string; Icon: LucideIcon; label: string }> = {
    ok: { color: "var(--status-normal)", Icon: CheckCircle2, label: "Nothing flagged" },
    attention: { color: "var(--status-warning)", Icon: AlertTriangle, label: "Needs attention" },
    unavailable: { color: "var(--status-missing)", Icon: HelpCircle, label: "Unavailable" },
    external: { color: "var(--status-info)", Icon: ExternalLink, label: "External source" },
};

function MetricValue({ value }: { value: number | null }) {
    if (value === null) {
        return (
            <span className="tabular-nums text-muted-foreground" title="No figure available">
                &mdash;
            </span>
        );
    }
    return <span className="tabular-nums text-foreground">{value.toLocaleString()}</span>;
}

interface ModuleCoverageSectionProps {
    modules: ModuleCoverage[];
    loading: boolean;
}

/**
 * The module grid, split out purely so the scroll reveal works.
 *
 * `useScrollAnimation` sets up its GSAP timeline once, on mount. Attaching it
 * to a list that only appears after the fetch resolves would run the effect
 * against a `null` ref and never retry. Keeping the grid in its own component
 * means it mounts fresh when the skeleton gives way, and the reveal fires then.
 *
 * The cards carry live counts, so this is a reveal on real data — never a
 * placeholder animating in ahead of the figures it claims to show.
 */
function ModuleGrid({ modules }: { modules: ModuleCoverage[] }) {
    const gridRef = useScrollAnimation<HTMLUListElement>({
        // Shorter lift and tighter stagger than the default: these are small
        // cards in a dense operations view, not a hero section.
        y: 16,
        duration: MOTION.dur.sm,
        stagger: MOTION.stagger.tight,
        childSelector: ":scope > li",
    });

    return (
        <ul ref={gridRef} className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((mod) => {
                const Icon = MODULE_ICON[mod.key];
                const meta = STATE_META[mod.state];
                const StateIcon = meta.Icon;
                return (
                    <li key={mod.key}>
                        <Link
                            href={mod.href}
                            className="group/mod flex h-full flex-col gap-2 rounded-lg border border-border bg-muted/60 p-3 transition-[background-color,border-color] duration-150 hover:bg-card hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <Icon
                                    className="h-4 w-4 flex-shrink-0"
                                    style={{ color: MODULE_ACCENT[mod.key] }}
                                    aria-hidden="true"
                                />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                    {mod.label}
                                </span>
                                <ArrowUpRight
                                    className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover/mod:opacity-100"
                                    aria-hidden="true"
                                />
                            </div>

                            <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                                {mod.metrics.map((metric) => (
                                    <div key={metric.label} className="flex items-baseline gap-1.5">
                                        <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            {metric.label}
                                        </dt>
                                        <dd className="text-sm font-semibold">
                                            <MetricValue value={metric.value} />
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            <p
                                className="mt-auto flex items-start gap-1.5 text-[11px] leading-snug"
                                style={{ color: meta.color }}
                            >
                                <StateIcon className="mt-px h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                                <span className="min-w-0">{mod.note ?? meta.label}</span>
                            </p>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export function ModuleCoverageSection({ modules, loading }: ModuleCoverageSectionProps) {
    const role = useUserRole();
    const { isDevMode } = useAuth();

    // Every card here is a <Link>. Offering one for a module the user's role
    // cannot open sends them into RouteRoleGuard, which shows a "not available"
    // panel and then redirects to the dashboard — indistinguishable, on a phone,
    // from the app crashing and restarting. That is exactly what was reported on
    // 2026-07-28. Show only doors that open. Same rule as the sidebar and the
    // bottom nav, so all three navigation surfaces agree.
    const visible = isDevMode ? modules : modules.filter((m) => canAccessModule(role, m.key));

    // Nothing this user can reach → drop the section rather than render an
    // empty card with a heading promising five modules.
    if (!loading && visible.length === 0) return null;

    return (
        <Card className="card-elevated">
            <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                <CardTitle>Module coverage</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                    Assets, contractors, HVAC, fire safety and pest control — live counts only;
                    a dash means the figure could not be read, not zero.
                </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                {loading && modules.length === 0 ? (
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-[104px] rounded-lg border border-border bg-muted/60 motion-safe:animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                    <ModuleGrid modules={visible} />
                )}
            </CardContent>
        </Card>
    );
}
