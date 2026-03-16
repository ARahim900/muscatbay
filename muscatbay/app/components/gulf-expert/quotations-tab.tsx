"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, Info } from "lucide-react";
import type { Quotation } from "./types";

interface QuotationsTabProps {
  quotations: Quotation[];
}

function getUrgencyBadge(urgency: string) {
  const u = urgency?.toUpperCase() || "";
  if (u === "URGENT")
    return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800";
  if (u === "HIGH")
    return "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
}

function getStatusBadge(status: string) {
  const s = status?.toLowerCase() || "";
  if (s.includes("awaiting"))
    return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (s.includes("approved"))
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (s.includes("rejected"))
    return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
}

export function QuotationsTab({ quotations }: QuotationsTabProps) {
  if (quotations.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
        <p>No quotations found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {quotations.map((q) => (
        <Card
          key={q.id}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {q.quotation_ref}
                </p>
                {q.submitted_by && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    by {q.submitted_by}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getUrgencyBadge(q.urgency ?? "Unknown")}`}
              >
                {q.urgency ?? "Unknown"}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {q.scope_summary}
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Calendar className="h-3 w-3" />
                {q.submission_date || "N/A"}
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-500 dark:text-slate-400">
                {q.buildings_covered}
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-500 dark:text-slate-400">
                {q.total_items_count} items
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadge(q.status)}`}
              >
                {q.status}
              </span>
              {q.lpo_number && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  LPO: {q.lpo_number}
                </span>
              )}
            </div>

            {q.notes && (
              <div className="flex gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {q.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
