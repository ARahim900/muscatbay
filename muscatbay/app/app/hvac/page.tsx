"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/functions/supabase-client";
import { PageHeader } from "@/components/shared/page-header";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { PageSkeleton } from "@/components/shared/skeleton";
import {
  LayoutGrid, Cpu, ClipboardList, FileText,
  HardDrive, AlertTriangle,
} from "lucide-react";
import type { GulfExpertData } from "@/components/gulf-expert/types";
import { OverviewTab } from "@/components/gulf-expert/overview-tab";
import { CompressorsTab } from "@/components/gulf-expert/compressors-tab";
import { FindingsTab } from "@/components/gulf-expert/findings-tab";
import { QuotationsTab } from "@/components/gulf-expert/quotations-tab";
import { EquipmentTab } from "@/components/gulf-expert/equipment-tab";
import { RecurringTab } from "@/components/gulf-expert/recurring-tab";
import { PageStatusBar } from "@/components/shared/page-status-bar";

const tabs = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "compressors", label: "Compressors", icon: Cpu },
  { key: "findings", label: "Findings", icon: ClipboardList },
  { key: "quotations", label: "Quotations", icon: FileText },
  { key: "equipment", label: "Equipment", icon: HardDrive },
  { key: "recurring", label: "Recurring Issues", icon: AlertTriangle },
];

export default function GulfExpertPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GulfExpertData>({
    findings: [],
    equipment: [],
    compressors: [],
    quotations: [],
    recurringIssues: [],
    equipmentSummary: [],
  });
  const [dataSource, setDataSource] = useState<"supabase" | "none">("none");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Unable to connect to the database. Please try again later or contact support.");
      setDataSource("none");
      if (!silent) setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Unable to initialize the data connection. Please refresh the page.");
      if (!silent) setLoading(false);
      return;
    }

    try {
      const [
        findingsRes,
        equipmentRes,
        compressorsRes,
        quotationsRes,
        recurringRes,
        summaryRes,
      ] = await Promise.all([
        supabase.from("ge_ppm_findings").select("*"),
        supabase.from("ge_equipment_registry").select("*"),
        supabase.from("ge_compressor_status").select("*"),
        supabase.from("ge_quotations").select("*"),
        supabase.from("ge_recurring_issues").select("*"),
        supabase.from("ge_equipment_summary").select("*"),
      ]);

      const errors = [findingsRes, equipmentRes, compressorsRes, quotationsRes, recurringRes, summaryRes]
        .map((r) => r.error?.message)
        .filter(Boolean);

      if (errors.length > 0) {
        throw new Error(`Failed to load data: ${errors.join(", ")}`);
      }

      setData({
        findings: findingsRes.data || [],
        equipment: equipmentRes.data || [],
        compressors: compressorsRes.data || [],
        quotations: quotationsRes.data || [],
        recurringIssues: recurringRes.data || [],
        equipmentSummary: summaryRes.data || [],
      });
      setDataSource("supabase");
      setLastUpdated(new Date());
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      console.error("Gulf Expert data load error:", message);
      if (!silent) setError(message);
      setDataSource("none");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="HVAC System"
          description="Preventive maintenance tracker for HVAC & BMS systems"
        />
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Failed to Load Data
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm"
          >
            Retry
          </button>
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
          lastUpdated={lastUpdated}
          connectedLabel="Connected"
          disconnectedLabel="No Connection"
        />
      </div>

      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && <OverviewTab data={data} />}
      {activeTab === "compressors" && <CompressorsTab compressors={data.compressors} />}
      {activeTab === "findings" && <FindingsTab findings={data.findings} />}
      {activeTab === "quotations" && <QuotationsTab quotations={data.quotations} />}
      {activeTab === "equipment" && <EquipmentTab equipment={data.equipment} />}
      {activeTab === "recurring" && <RecurringTab issues={data.recurringIssues} />}
    </div>
  );
}
