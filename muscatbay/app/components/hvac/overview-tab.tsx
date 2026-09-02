"use client";

import { useMemo } from "react";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionBoundary } from "@/components/shared/section-boundary";
import {
  ClipboardList, CheckCircle2, AlertCircle, Clock,
  AlertTriangle, RefreshCw, Building2, Shield, Mailbox,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
// Charts mount through the shared container, never Recharts' own
// ResponsiveContainer: it defers the plot until a ResizeObserver reports a real
// box and enforces a minHeight, so a parent that loses its fixed height can no
// longer produce a silent width(-1)/height(-1) blank chart.
import { ChartContainer } from "@/components/charts/chart-container";
import { format } from "date-fns";
import type { GulfExpertContract, GulfExpertData } from "./types";
import { CHART_PALETTE, STATUS_CHART_COLORS } from "@/lib/tokens";
import { useChartMotion } from "@/hooks/useReducedMotion";

interface OverviewTabProps {
  data: GulfExpertData;
}

/** `numeric` columns come back from PostgREST as strings — normalise before formatting. */
function formatOmr(value: number | string | null): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return "—";
  return `OMR ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : format(d, "dd MMM yyyy");
}

/** Free-text status from the database → the shared status palette. */
function contractStatusCls(status: string): string {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("active")) return "bg-mb-success-light text-mb-success-text";
  if (s.includes("expired")) return "bg-mb-danger-light text-mb-danger-text";
  if (s.includes("draft") || s.includes("pending") || s.includes("renew")) return "bg-mb-warning-light text-mb-warning-text";
  return "bg-muted text-muted-foreground";
}

function actionStatusCls(status: string | null): string {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("closed") || s.includes("done")) return "bg-mb-success-light text-mb-success-text";
  return "bg-mb-warning-light text-mb-warning-text";
}

/** Human label for the database's `contract_type` enum-ish text column. */
function contractTypeLabel(contract: GulfExpertContract): string {
  const t = contract.contract_type?.replace(/_/g, " ") ?? "AMC";
  return t.toUpperCase();
}

export function OverviewTab({ data }: OverviewTabProps) {
    const chartMotion = useChartMotion();
  const { findings, recurringIssues, contracts, communications } = data;

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

  // Contract cards are driven by public.gulf_expert_contracts. Show the ACTIVE
  // agreements; if none is marked active we fall back to the most recent per
  // contract type and its real status badge — never a hardcoded figure.
  const currentContracts = useMemo(() => {
    const active = contracts.filter((c) => c.status?.toLowerCase() === "active");
    // Fallback: the newest agreement of each contract type (end_date, then id
    // as the tiebreak) so the cards never go blank just because nothing is
    // flagged ACTIVE — the real status badge tells the operator what it is.
    const latestPerType = contracts.filter(
      (c) =>
        !contracts.some(
          (o) =>
            (o.contract_type || "") === (c.contract_type || "") &&
            ((o.end_date ?? "") > (c.end_date ?? "") ||
              ((o.end_date ?? "") === (c.end_date ?? "") && o.id > c.id)),
        ),
    );
    const pool = active.length > 0 ? active : latestPerType;
    return pool
      .slice()
      .sort((a, b) => (a.contract_type || "").localeCompare(b.contract_type || ""));
  }, [contracts]);

  // Open actions come from the correspondence log's own action_required /
  // action_status columns — identification only, no assignment or close-out.
  const openActions = useMemo(
    () =>
      communications
        .filter((c) => Boolean(c.action_required?.trim()) && c.action_status?.toLowerCase() !== "closed")
        .sort((a, b) => (b.communication_date ?? "").localeCompare(a.communication_date ?? "")),
    [communications],
  );

  return (
    <div className="space-y-6">
      <StatsGrid stats={stats} />

      <SectionBoundary title="HVAC Findings Charts">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart — Open items by building */}
          <Card className="bg-card rounded-xl border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Open Items by Building
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ChartContainer minHeight={280}>
                  <BarChart data={openByBuilding} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="building" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--chart-axis)" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="var(--chart-inlet)" radius={[4, 4, 0, 0]} name="Open Findings" {...chartMotion}/>
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie chart — Findings by status */}
          <Card className="bg-card rounded-xl border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-secondary" />
                Findings by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ChartContainer minHeight={280}>
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
                      labelLine={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
                      {...chartMotion}
                    >
                      {findingsByStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_CHART_COLORS[entry.status] || CHART_PALETTE[index % CHART_PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconSize={10}
                      formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionBoundary>

      <SectionBoundary title="FY25 PPM Schedule">
        {/* PPM Schedule Grid */}
        <Card className="bg-card rounded-xl border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              FY25 PPM Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="text-left">System</TableHead>
                  <TableHead scope="col" className="text-center">Q1 (PPM1)</TableHead>
                  <TableHead scope="col" className="text-center">Q2 (PPM2)</TableHead>
                  <TableHead scope="col" className="text-center">Q3 (PPM3)</TableHead>
                  <TableHead scope="col" className="text-center">Q4 (PPM4)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(["hvac", "bms"] as const).map((system) => (
                  <TableRow key={system}>
                    {/* Weight comes from the ops-table first-column emphasis rule */}
                    <TableCell className="text-foreground uppercase">
                      {system}
                    </TableCell>
                    {ppmSchedule[system].map((q, i) => (
                      <TableCell key={i} className="text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            q.status === "Completed"
                              ? "bg-mb-success-light text-mb-success-text"
                              : q.status === "In Progress"
                              ? "bg-mb-warning-light text-mb-warning-text"
                              : "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground"
                          }`}
                        >
                          {q.status === "Completed" && <CheckCircle2 className="h-3 w-3" />}
                          {q.status === "In Progress" && <Clock className="h-3 w-3" />}
                          {q.status}
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </SectionBoundary>

      {/* AMC contracts — live from public.gulf_expert_contracts */}
      <SectionBoundary title="AMC Contracts">
        <div>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-sm font-semibold text-foreground">AMC Contracts</h2>
            <span className="text-xs text-muted-foreground">
              Live from the Gulf Expert contract register
            </span>
          </div>
          {currentContracts.length === 0 ? (
            <div className="ops-table-shell">
              <EmptyState
                variant="no-data"
                title="No AMC contracts on record"
                description="The Gulf Expert contract register returned no rows."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentContracts.map((c) => (
                <Card key={c.id} className="bg-card rounded-xl border border-border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[7px] bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {contractTypeLabel(c)}
                        </p>
                        <p className="text-xl font-semibold text-foreground tabular-nums">
                          {formatOmr(c.value_omr_incl_vat)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">incl. VAT</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${contractStatusCls(c.status)}`}>
                          {c.status || "Unknown status"}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatDate(c.start_date)} → {formatDate(c.end_date)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground break-words">{c.contract_ref}</p>
                      {c.ppm_visits_per_year != null && (
                        <p className="text-[10px] text-muted-foreground">
                          {c.ppm_visits_per_year} PPM visits/year
                          {c.emergency_response_hours != null && ` · ${c.emergency_response_hours}h emergency response`}
                        </p>
                      )}
                      {c.scope_summary && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{c.scope_summary}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SectionBoundary>

      {/* Open actions — read straight off the correspondence log's own
          action_required / action_status columns. Display only: no assignment,
          due dates or close-out tracking. */}
      <SectionBoundary title="Open Actions">
        <Card className="bg-card rounded-xl border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mailbox className="h-4 w-4 text-secondary" aria-hidden="true" />
              Open Actions from AMC Correspondence
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Items in the Gulf Expert correspondence log still flagged as requiring action.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {openActions.length === 0 ? (
              <EmptyState
                variant="no-data"
                title="No open actions"
                description="Every logged item from the Gulf Expert correspondence is marked closed."
              />
            ) : (
              <ul className="space-y-2">
                {openActions.map((a) => (
                  <li key={a.id} className="flex gap-3 p-2.5 rounded-lg bg-muted dark:bg-muted/50">
                    <AlertCircle className="h-4 w-4 text-mb-warning-text flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-foreground">{a.subject}</p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${actionStatusCls(a.action_status)}`}>
                          {a.action_status || "Open"}
                        </span>
                        {a.related_contract && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary dark:text-muted-foreground/80">
                            {a.related_contract.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                        {a.action_required}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5 tabular-nums">
                        {formatDate(a.communication_date)}
                        {a.from_person ? ` · ${a.from_person}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </SectionBoundary>
    </div>
  );
}
