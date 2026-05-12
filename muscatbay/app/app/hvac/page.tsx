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

const GULF_EXPERT_SELECT = {
  findings: "id, finding_code, equipment_id, building, system_type, equipment_label, fiscal_year, ppm_visit, description, quantity, priority, status, quotation_ref, action_required, contractor_notes, is_recurring, first_identified_ppm",
  equipment: "id, building, system_type, equipment_label, chiller_number, equipment_type, brand, model, operational_status, has_sys1, has_sys2, notes",
  compressors: "id, building, chiller_number, system_number, compressor_number, status, last_updated, notes",
  quotations: "id, quotation_ref, submission_date, submitted_by, scope_summary, buildings_covered, total_items_count, urgency, status, lpo_number, lpo_issued_date, notes",
  recurring: "id, equipment_id, building, equipment_label, issue_type, first_ppm, last_ppm, occurrence_count, still_open, resolved_ppm, notes",
  summary: "id, equipment_id, building, system_type, equipment_label, ppm1_findings, ppm2_findings, ppm3_findings, ppm4_findings, common_issues, fixed_issues, analysis_notes",
} as const;

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
        supabase.from("ge_ppm_findings").select(GULF_EXPERT_SELECT.findings),
        supabase.from("ge_equipment_registry").select(GULF_EXPERT_SELECT.equipment),
        supabase.from("ge_compressor_status").select(GULF_EXPERT_SELECT.compressors),
        supabase.from("ge_quotations").select(GULF_EXPERT_SELECT.quotations),
        supabase.from("ge_recurring_issues").select(GULF_EXPERT_SELECT.recurring),
        supabase.from("ge_equipment_summary").select(GULF_EXPERT_SELECT.summary),
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
        <div role="alert" className="bg-card rounded-xl border border-[var(--status-danger)]/30 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-[var(--status-danger)] mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to Load Data
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors text-sm"
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
