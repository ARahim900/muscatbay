"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { ExportButton, type ExportColumn } from "@/components/shared/data-table";
import type { RecurringIssue } from "./types";

interface RecurringTabProps {
  issues: RecurringIssue[];
}

// Full ge_recurring_issues column set for the database export
const RECURRING_EXPORT_COLUMNS: ExportColumn<RecurringIssue>[] = [
  { key: "building", header: "Building" },
  { key: "equipment_id", header: "Equipment ID" },
  { key: "equipment_label", header: "Equipment" },
  { key: "issue_type", header: "Issue Type" },
  { key: "occurrence_count", header: "Occurrences" },
  { key: "first_ppm", header: "First PPM" },
  { key: "last_ppm", header: "Last PPM" },
  { key: "still_open", header: "Status", format: (i) => (i.still_open ? "Open" : "Closed") },
  { key: "resolved_ppm", header: "Resolved PPM" },
  { key: "notes", header: "Notes" },
];

export function RecurringTab({ issues }: RecurringTabProps) {
  if (issues.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground dark:text-muted-foreground bg-card rounded-xl border border-border dark:border-border">
        <RefreshCw className="h-10 w-10 mx-auto mb-3 text-muted-foreground/70" />
        <p>No recurring issues found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          <span className="font-semibold text-foreground dark:text-muted-foreground/70">{issues.length}</span> recurring issue{issues.length === 1 ? "" : "s"}
        </p>
        <ExportButton rows={issues} filename="hvac-recurring-issues" columns={RECURRING_EXPORT_COLUMNS} />
      </div>
      {issues.map((issue) => (
        <Card
          key={issue.id}
          className="bg-card rounded-xl border border-border dark:border-border shadow-sm hover:shadow-md motion-safe:hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200"
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-4">
              {/* Occurrence count */}
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary dark:text-muted-foreground/70 tabular-nums">
                  {issue.occurrence_count}
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-foreground dark:text-muted-foreground">
                    {issue.issue_type}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                      issue.still_open
                        ? "bg-mb-danger-light text-mb-danger-text"
                        : "bg-mb-success-light text-mb-success-text"
                    }`}
                  >
                    {issue.still_open ? "Open" : "Closed"}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  {issue.building} — {issue.equipment_label}
                </p>

                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground dark:text-muted-foreground">
                  <span>
                    {issue.first_ppm} → {issue.last_ppm}
                  </span>
                  {issue.resolved_ppm && (
                    <>
                      <span className="text-muted-foreground/70 dark:text-muted-foreground">|</span>
                      <span className="text-mb-success">
                        Resolved: {issue.resolved_ppm}
                      </span>
                    </>
                  )}
                </div>

                {issue.notes && (
                  <p className="text-[11px] text-muted-foreground dark:text-muted-foreground mt-1">
                    {issue.notes}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
