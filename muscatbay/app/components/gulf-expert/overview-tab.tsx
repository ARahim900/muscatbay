"use client";

import { useMemo } from "react";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardList, CheckCircle2, AlertCircle, Clock,
  AlertTriangle, RefreshCw, Building2, Shield,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { GulfExpertData } from "./types";

const CHART_COLORS = ["#4E4456", "#4DBFBF", "#F59E0B", "#EF4444", "#3B82F6", "#10B981"];

const STATUS_COLORS: Record<string, string> = {
  Open: "#EF4444",
  Closed: "#10B981",
  "Awaiting LPO": "#F59E0B",
  Quoted: "#3B82F6",
  "In Progress": "#8B5CF6",
};

interface OverviewTabProps {
  data: GulfExpertData;
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { findings, recurringIssues } = data;

  const stats = useMemo(() => {
    const totalFindings = findings.length;
    const fy24Closed = findings.filter(
      (f) => f.fiscal_year === "FY24" && f.status?.toLowerCase() === "closed"
    ).length;
    const fy25Open = findings.filter(
      (f) => f.fiscal_year === "FY25" && f.status?.toLowerCase() !== "closed"
    ).length;
    const awaitingLpo = findings.filter((f) =>
      f.status?.toLowerCase().includes("awaiting")
    ).length;
    const critical = findings.filter(
      (f) =>
        f.priority?.toLowerCase() === "critical" ||
        f.priority?.toLowerCase() === "high"
    ).length;
    const recurringCount = recurringIssues.filter((r) => r.still_open).length;

    return [
      { label: "TOTAL FINDINGS", value: totalFindings.toString(), icon: ClipboardList, variant: "primary" as const },
      { label: "FY24 CLOSED", value: fy24Closed.toString(), icon: CheckCircle2, variant: "success" as const },
      { label: "FY25 OPEN", value: fy25Open.toString(), icon: AlertCircle, variant: "danger" as const },
      { label: "AWAITING LPO", value: awaitingLpo.toString(), icon: Clock, variant: "warning" as const },
      { label: "CRITICAL / HIGH", value: critical.toString(), icon: AlertTriangle, variant: "danger" as const },
      { label: "RECURRING OPEN", value: recurringCount.toString(), icon: RefreshCw, variant: "info" as const },
    ];
  }, [findings, recurringIssues]);

  const openByBuilding = useMemo(() => {
    const counts: Record<string, number> = {};
    findings
      .filter((f) => f.status?.toLowerCase() !== "closed")
      .forEach((f) => {
        const key = f.building ? String(f.building) : "Unknown";
        counts[key] = (counts[key] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([building, count]) => ({ building, count }))
      .sort((a, b) => b.count - a.count);
  }, [findings]);

  const findingsByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    findings.forEach((f) => {
      const status = f.status || "Unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [findings]);

  const ppmSchedule = useMemo(() => {
    const fy25Findings = findings.filter((f) => f.fiscal_year === "FY25");
    const visits = ["PPM1", "PPM2", "PPM3", "PPM4"];

    const buildSchedule = (systemFilter: string) =>
      visits.map((visit) => {
        const matched = fy25Findings.filter(
          (f) =>
            f.ppm_visit === visit &&
            f.system_type?.toLowerCase().includes(systemFilter)
        );
        const completed =
          matched.length > 0 &&
          matched.every((f) => f.status?.toLowerCase() === "closed");
        const hasFindings = matched.length > 0;
        return {
          quarter: visit,
          status: completed
            ? "Completed"
            : hasFindings
            ? "In Progress"
            : "Scheduled",
        };
      });

    return { hvac: buildSchedule("hvac"), bms: buildSchedule("bms") };
  }, [findings]);

  return (
    <div className="space-y-6">
      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — Open items by building */}
        <Card className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Open Items by Building
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={openByBuilding} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="building" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--chart-inlet)" radius={[4, 4, 0, 0]} name="Open Findings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie chart — Findings by status */}
        <Card className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-secondary" />
              Findings by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={findingsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                    label={(props) => `${props.name}: ${props.value}`}
                    labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  >
                    {findingsByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconSize={10}
                    formatter={(value: string) => (
                      <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PPM Schedule Grid */}
      <Card className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            FY25 PPM Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-4 px-4 font-semibold uppercase tracking-wide text-sm text-white">System</th>
                  <th className="text-center py-4 px-4 font-semibold uppercase tracking-wide text-sm text-white">Q1 (PPM1)</th>
                  <th className="text-center py-4 px-4 font-semibold uppercase tracking-wide text-sm text-white">Q2 (PPM2)</th>
                  <th className="text-center py-4 px-4 font-semibold uppercase tracking-wide text-sm text-white">Q3 (PPM3)</th>
                  <th className="text-center py-4 px-4 font-semibold uppercase tracking-wide text-sm text-white">Q4 (PPM4)</th>
                </tr>
              </thead>
              <tbody>
                {(["hvac", "bms"] as const).map((system, sIdx) => (
                  <tr
                    key={system}
                    className={sIdx === 0 ? "border-b border-slate-100 dark:border-slate-800" : ""}
                  >
                    <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300 uppercase">
                      {system}
                    </td>
                    {ppmSchedule[system].map((q, i) => (
                      <td key={i} className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            q.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : q.status === "In Progress"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {q.status === "Completed" && <CheckCircle2 className="h-3 w-3" />}
                          {q.status === "In Progress" && <Clock className="h-3 w-3" />}
                          {q.status}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Contract Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">HVAC AMC — Gulf Expert</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 tabular-nums">OMR 8,557.5</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Active
                </span>
                <span className="text-xs text-slate-400">3 Jun 2025 → 2 Jun 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Renewal In Progress
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                2-year renewal requested 25 Mar 2026 · AHU/VRF excluded from scope · Quarterly PPM (Chillers B1–B8)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Shield className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">BMS AMC — Gulf Expert</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 tabular-nums">OMR 2,205</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Active
                </span>
                <span className="text-xs text-slate-400">3 Jun 2025 → 2 Jun 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Renewal In Progress
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                2-year renewal requested 25 Mar 2026 · Johnson Controls BMS · Software backup now in scope
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Items */}
      <Card className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3">Action Items — Verified 28 Mar 2026</p>
          <div className="space-y-2">
            {[
              {
                item: "HVAC & BMS AMC Renewal 2026–2028",
                detail: "Nouf requested 2-year agreements (25 Mar). Gulf Expert submitted 1-year drafts (18 Mar) — awaiting revised 2-year versions.",
                status: "Awaiting Gulf Expert",
              },
              {
                item: "AHU Services Quotation",
                detail: "Rahim requested AHU quotation. Gulf Expert confirmed working on it (11 Mar 2026). Not yet received.",
                status: "Pending Quote",
              },
              {
                item: "CIF Building AHU Blower/Bearing Repair",
                detail: "Work completed Apr 2025 (OMR 446.250). PO stopped Nov 2025 (CIF back-charge to Jumeirah). CFO approved payment 9 Nov. Nouf requested PR revision with valid 2026 proposal (Jan 2026).",
                status: "PR Revision Needed",
              },
            ].map((a) => (
              <div key={a.item} className="flex gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{a.item}</p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      {a.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{a.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
