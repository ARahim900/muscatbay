"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import type { RecurringIssue } from "./types";

interface RecurringTabProps {
  issues: RecurringIssue[];
}

export function RecurringTab({ issues }: RecurringTabProps) {
  if (issues.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground dark:text-muted-foreground bg-white dark:bg-muted rounded-xl border border-border dark:border-border">
        <RefreshCw className="h-10 w-10 mx-auto mb-3 text-muted-foreground/70" />
        <p>No recurring issues found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <Card
          key={issue.id}
          className="bg-white dark:bg-muted rounded-xl border border-border dark:border-border shadow-sm hover:shadow-md motion-safe:hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200"
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
                        ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
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
                      <span className="text-emerald-600 dark:text-emerald-400">
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
