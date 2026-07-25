import { useCallback, useEffect, useState } from "react";

import { getAssetSummaryFromSupabase, getContractorCounts } from "@/functions";
import { getSupabaseClient, isSupabaseConfigured } from "@/functions/supabase-client";
import { getPageCache, setPageCache } from "@/lib/page-cache";

/**
 * @fileoverview Cross-module coverage for the dashboard.
 *
 * Assets, Contractors, HVAC, Fire Safety and Pest Control had no dashboard
 * presence at all — five of the nine modules were invisible to anyone who only
 * ever opens the dashboard. This hook supplies a compact status line per
 * module.
 *
 * HARD RULE: every figure below comes from a live Supabase count. Nothing is
 * estimated, seeded or defaulted. When a module cannot be counted — the query
 * failed, Supabase is not configured, or the module simply has no in-app data
 * source — its metric value is `null` and the UI renders an explicit
 * unavailable state. A placeholder number would be worse than no number.
 */

/** A single figure in a module's coverage row. `null` = genuinely unknown. */
export interface CoverageMetric {
    label: string;
    value: number | null;
    /** true = a non-zero value is a problem (open issues, items to verify). */
    isExceptionCount?: boolean;
}

export type CoverageState =
    /** Counted successfully and nothing is flagged. */
    | "ok"
    /** Counted successfully and at least one exception count is non-zero. */
    | "attention"
    /** Query failed or Supabase is unavailable — figures are unknown. */
    | "unavailable"
    /** Module has no in-app data source (data lives in a third-party system). */
    | "external";

export interface ModuleCoverage {
    key: "assets" | "contractors" | "hvac" | "firefighting" | "pest-control";
    label: string;
    href: string;
    metrics: CoverageMetric[];
    state: CoverageState;
    /** Short plain-language explanation, shown whenever state !== "ok". */
    note?: string;
}

const CACHE_KEY = "dashboard:module-coverage";

/** Shape stored in the session cache (state is recomputed, not trusted blindly). */
type CoverageCache = ModuleCoverage[];

/** A module whose figures could not be read. Never fabricate a fallback count. */
function unavailable(
    key: ModuleCoverage["key"],
    label: string,
    href: string,
    metrics: string[],
    note: string,
): ModuleCoverage {
    return {
        key,
        label,
        href,
        metrics: metrics.map((m) => ({ label: m, value: null })),
        state: "unavailable",
        note,
    };
}

/** Optional equality / case-insensitive match applied to a count query. */
type CountFilter =
    | { op: "eq"; column: string; value: string }
    | { op: "ilike"; column: string; value: string };

/**
 * Exact row count for a table. `head: true` means Supabase returns the count
 * only — no rows are transferred, so this stays cheap on the dashboard.
 */
async function countRows(table: string, column: string, filter?: CountFilter): Promise<number> {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase client unavailable");

    const base = client.from(table).select(column, { count: "exact", head: true });
    const query = filter
        ? filter.op === "eq"
            ? base.eq(filter.column, filter.value)
            : base.ilike(filter.column, filter.value)
        : base;

    const { count, error } = await query;
    if (error) throw new Error(`Supabase error (${table}): ${error.message}`);
    return count ?? 0;
}

async function loadAssets(): Promise<ModuleCoverage> {
    try {
        const summary = await getAssetSummaryFromSupabase();
        return {
            key: "assets",
            label: "Assets",
            href: "/assets",
            metrics: [
                { label: "Registered", value: summary.total },
                { label: "To verify", value: summary.toVerify, isExceptionCount: true },
            ],
            state: summary.toVerify > 0 ? "attention" : "ok",
            note: summary.toVerify > 0
                ? `${summary.toVerify} asset records still need verification.`
                : undefined,
        };
    } catch {
        return unavailable("assets", "Assets", "/assets", ["Registered", "To verify"],
            "Asset register could not be read.");
    }
}

async function loadContractors(): Promise<ModuleCoverage> {
    try {
        const { total, active } = await getContractorCounts();
        const expired = total - active;
        return {
            key: "contractors",
            label: "Contractors",
            href: "/contractors",
            metrics: [
                { label: "Contracts", value: total },
                { label: "Active", value: active },
            ],
            state: expired > 0 ? "attention" : "ok",
            note: expired > 0
                ? `${expired} contract${expired === 1 ? "" : "s"} not currently active.`
                : undefined,
        };
    } catch {
        return unavailable("contractors", "Contractors", "/contractors", ["Contracts", "Active"],
            "Contractor tracker could not be read.");
    }
}

async function loadHvac(): Promise<ModuleCoverage> {
    try {
        // "Open" is derived as total − closed rather than filtered with a
        // negation, so rows with a NULL/odd status are counted as open instead
        // of silently vanishing from both sides.
        const [total, closed] = await Promise.all([
            countRows("ge_ppm_findings", "id"),
            countRows("ge_ppm_findings", "id", { op: "ilike", column: "status", value: "closed" }),
        ]);
        const open = Math.max(0, total - closed);
        return {
            key: "hvac",
            label: "HVAC System",
            href: "/hvac",
            metrics: [
                { label: "PPM findings", value: total },
                { label: "Open", value: open, isExceptionCount: true },
            ],
            state: open > 0 ? "attention" : "ok",
            note: open > 0 ? `${open} PPM finding${open === 1 ? "" : "s"} still open.` : undefined,
        };
    } catch {
        return unavailable("hvac", "HVAC System", "/hvac", ["PPM findings", "Open"],
            "Gulf Expert PPM tables could not be read.");
    }
}

async function loadFireSafety(): Promise<ModuleCoverage> {
    try {
        const [equipment, operational, issues] = await Promise.all([
            countRows("fire_safety_equipment", "id"),
            countRows("fire_safety_equipment", "id", { op: "eq", column: "status", value: "Operational" }),
            countRows("fire_issues_register", "id"),
        ]);
        const needsAttention = Math.max(0, equipment - operational);
        return {
            key: "firefighting",
            label: "Fire Safety",
            href: "/firefighting",
            metrics: [
                { label: "Equipment", value: equipment },
                { label: "Not operational", value: needsAttention, isExceptionCount: true },
                { label: "Logged issues", value: issues },
            ],
            state: needsAttention > 0 ? "attention" : "ok",
            note: needsAttention > 0
                ? `${needsAttention} device${needsAttention === 1 ? "" : "s"} not reporting as operational.`
                : undefined,
        };
    } catch {
        return unavailable("firefighting", "Fire Safety", "/firefighting",
            ["Equipment", "Not operational", "Logged issues"],
            "Fire safety register could not be read.");
    }
}

/**
 * Pest control has NO in-app data source — the module page embeds a
 * third-party AITable share view, so this app holds no pest-control rows to
 * count. Saying so is the honest answer; showing a number here would mean
 * inventing one.
 */
function pestControlCoverage(): ModuleCoverage {
    return {
        key: "pest-control",
        label: "Pest Control",
        href: "/pest-control",
        metrics: [{ label: "Records in app", value: null }],
        state: "external",
        note: "Operational data lives in the AITable base — open the module to view it.",
    };
}

/**
 * Live counts for the five modules that otherwise never reach the dashboard.
 * Seeded from the session cache so revisits paint instantly, then refreshed.
 */
export function useModuleCoverage() {
    const [cached] = useState(() => getPageCache<CoverageCache>(CACHE_KEY));
    const [modules, setModules] = useState<ModuleCoverage[]>(cached ?? []);
    const [loading, setLoading] = useState(!cached);

    const load = useCallback(async () => {
        if (!isSupabaseConfigured()) {
            setModules([
                unavailable("assets", "Assets", "/assets", ["Registered", "To verify"], "Not connected to the database."),
                unavailable("contractors", "Contractors", "/contractors", ["Contracts", "Active"], "Not connected to the database."),
                unavailable("hvac", "HVAC System", "/hvac", ["PPM findings", "Open"], "Not connected to the database."),
                unavailable("firefighting", "Fire Safety", "/firefighting", ["Equipment", "Not operational", "Logged issues"], "Not connected to the database."),
                pestControlCoverage(),
            ]);
            setLoading(false);
            return;
        }

        const next = await Promise.all([
            loadAssets(),
            loadContractors(),
            loadHvac(),
            loadFireSafety(),
        ]);
        const all = [...next, pestControlCoverage()];
        setModules(all);
        setLoading(false);
        // Only cache when at least one module actually resolved — caching an
        // all-unavailable pass would make a transient outage look sticky.
        if (all.some((m) => m.state === "ok" || m.state === "attention")) {
            setPageCache<CoverageCache>(CACHE_KEY, all);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { modules, loading };
}
