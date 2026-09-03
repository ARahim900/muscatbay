"use client";

import { useState, useEffect, useCallback } from "react";
import { isSupabaseConfigured } from "@/functions/supabase-client";
import { PageHeader } from "@/components/shared/page-header";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { PageSkeleton, StatsGridSkeleton, Skeleton } from "@/components/shared/skeleton";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { EmptyState } from "@/components/shared/empty-state";
import {
  LayoutGrid, ClipboardList, AlertTriangle,
} from "lucide-react";
import type { GulfExpertData } from "@/components/hvac/types";
import { FindingsTab } from "@/components/hvac/findings-tab";
import { RecurringTab } from "@/components/hvac/recurring-tab";
import dynamic from "next/dynamic";
import { PageStatusBar } from "@/components/shared/page-status-bar";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import {
  getPpmFindings,
  getRecurringIssues,
  getGulfExpertContracts,
  getGulfExpertCommunications,
  GULF_EXPERT_REALTIME_TABLES,
} from "@/functions/api/gulf-expert";

// ─── Recharts is loaded on demand ──────────────────────────────────────────
// Overview is the only Recharts consumer on this route (Maintenance and
// Recurring Issues are tables, so they stay eagerly imported). It cannot render
// before the Gulf Expert fetch resolves — PageSkeleton holds the route until
// then — so the chart chunk downloads alongside the data instead of sitting in
// first-load JS. The fallback mirrors Overview's own block heights: the six-KPI
// grid, the two 280px chart cards and the PPM schedule table.
const OverviewTab = dynamic(
  () => import("@/components/hvac/overview-tab").then((m) => ({ default: m.OverviewTab })),
  {
    loading: () => (
      <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading HVAC overview">
        <StatsGridSkeleton count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[360px] w-full rounded-[10.5px]" />
          <Skeleton className="h-[360px] w-full rounded-[10.5px]" />
        </div>
        <Skeleton className="h-[220px] w-full rounded-[10.5px]" />
      </div>
    ),
    ssr: false,
  },
);

const tabs = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "findings", label: "Maintenance", icon: ClipboardList },
  { key: "recurring", label: "Recurring Issues", icon: AlertTriangle },
];

const EMPTY_DATA: GulfExpertData = {
  findings: [],
  recurringIssues: [],
  contracts: [],
  communications: [],
};

// Session cache — see lib/page-cache.ts (stale-while-revalidate on revisit)
const HVAC_CACHE_KEY = "hvac:page";
interface HvacPageCache {
  data: GulfExpertData;
  lastUpdated: Date;
  /** Names of datasets that hit the paging ceiling on the cached run. */
  truncated: string[];
}

export default function GulfExpertPage() {
  const [activeTab, setActiveTab] = useState("overview");
  // Seed from the session cache so revisits render instantly (silent refresh below)
  const [cached] = useState(() => getPageCache<HvacPageCache>(HVAC_CACHE_KEY));
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GulfExpertData>(cached?.data ?? EMPTY_DATA);
  const [dataSource, setDataSource] = useState<"supabase" | "none">(cached ? "supabase" : "none");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(cached?.lastUpdated ?? null);
  // Datasets whose row count exceeded the paging ceiling. Never silently drop
  // rows — if the register is bigger than we fetched, the page says so.
  const [truncated, setTruncated] = useState<string[]>(cached?.truncated ?? []);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Unable to connect to the database. Please try again later or contact support.");
      setDataSource("none");
      if (!silent) setLoading(false);
      return;
    }

    try {
      const [findingsRes, recurringRes, contractsRes, communicationsRes] = await Promise.all([
        getPpmFindings(),
        getRecurringIssues(),
        getGulfExpertContracts(),
        getGulfExpertCommunications(),
      ]);

      const next: GulfExpertData = {
        findings: findingsRes.rows,
        recurringIssues: recurringRes.rows,
        contracts: contractsRes.rows,
        communications: communicationsRes.rows,
      };

      const nextTruncated = [
        findingsRes.truncated ? "PPM findings" : null,
        recurringRes.truncated ? "Recurring issues" : null,
        contractsRes.truncated ? "Contracts" : null,
        communicationsRes.truncated ? "Correspondence" : null,
      ].filter((v): v is string => v !== null);

      setData(next);
      setTruncated(nextTruncated);
      setDataSource("supabase");
      const now = new Date();
      setLastUpdated(now);
      setPageCache<HvacPageCache>(HVAC_CACHE_KEY, {
        data: next,
        lastUpdated: now,
        truncated: nextTruncated,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      console.error("Gulf Expert data load error:", message);
      // A failed SILENT refresh keeps the (cached) data + status on screen.
      if (!silent) {
        setError(message);
        setDataSource("none");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Cache hit → already rendering last data; refresh silently in background.
  useEffect(() => {
    loadData(Boolean(cached));
  }, [loadData, cached]);

  // Realtime: the connection chip reflects an actual subscription rather than
  // a value that was true once at mount and never checked again.
  const { isLive } = useSupabaseRealtime({
    table: [...GULF_EXPERT_REALTIME_TABLES],
    channelName: "gulf-expert-rt",
    // Incoming rows must not blank the page — refresh silently.
    onChanged: () => loadData(true),
    enabled: dataSource === "supabase",
  });

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
        <PageHeader
          title="HVAC System"
          description="Preventive maintenance tracker for HVAC & BMS systems"
        />
        <div role="alert" className="ops-table-shell">
          <EmptyState
            variant="error"
            title="Failed to load HVAC data"
            description={error}
            action={{ label: "Retry", onClick: () => loadData() }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="HVAC System"
          description="Preventive maintenance tracker for HVAC & BMS systems across Muscat Bay"
        />
        <PageStatusBar
          isConnected={dataSource === "supabase"}
          isLive={isLive}
          lastUpdated={lastUpdated}
          connectedLabel="Connected"
          disconnectedLabel="No Connection"
        />
      </div>

      {truncated.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--status-warning)]/40 bg-mb-warning-light p-3"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-mb-warning-text" aria-hidden="true" />
          <p className="text-xs text-mb-warning-text">
            <span className="font-semibold">Partial data shown.</span>{" "}
            {truncated.join(", ")} exceeded the maximum number of rows this page will fetch, so
            counts and charts below cover only the rows retrieved. Export the register from the
            database for the complete set.
          </p>
        </div>
      )}

      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="HVAC sections" />

      {/* One tabpanel for the active tab — its id is what each tab's aria-controls points at. */}
      <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} tabIndex={0}>
        {activeTab === "overview" && (
          <SectionBoundary title="HVAC Overview">
            <OverviewTab data={data} />
          </SectionBoundary>
        )}
        {activeTab === "findings" && (
          <SectionBoundary title="PPM Findings">
            <FindingsTab findings={data.findings} />
          </SectionBoundary>
        )}
        {activeTab === "recurring" && (
          <SectionBoundary title="Recurring Issues">
            <RecurringTab issues={data.recurringIssues} />
          </SectionBoundary>
        )}
      </div>
    </div>
  );
}
