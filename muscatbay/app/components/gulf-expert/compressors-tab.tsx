"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { CompressorStatus } from "./types";

interface CompressorsTabProps {
  compressors: CompressorStatus[];
}

function statusIsOk(status: string): boolean {
  const s = status?.toUpperCase() || "";
  return s === "OK" || s === "WORKING";
}

function statusIsFault(status: string): boolean {
  const s = status?.toUpperCase() || "";
  return s.includes("NOT") || s === "FAULTY";
}

export function CompressorsTab({ compressors }: CompressorsTabProps) {
  const buildingGroups = useMemo(() => {
    const groups: Record<string, CompressorStatus[]> = {};
    compressors.forEach((c) => {
      if (!groups[c.building]) groups[c.building] = [];
      groups[c.building].push(c);
    });
    return Object.entries(groups).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [compressors]);

  const hasB5Critical = buildingGroups.some(
    ([building, comps]) =>
      building.includes("B5") && comps.some((c) => statusIsFault(c.status))
  );

  return (
    <div className="space-y-6">
      {hasB5Critical && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Critical Alert — Building B5
            </p>
            <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">
              One or more compressors are not operational. Immediate attention required.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {buildingGroups.map(([building, comps]) => {
          const hasFault = comps.some((c) => statusIsFault(c.status));
          return (
            <Card
              key={building}
              className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm ${
                hasFault
                  ? "border-2 border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-800"
                  : "border border-slate-200 dark:border-slate-800"
              }`}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                  {building}
                  {hasFault && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2.5">
                  {[1, 2].map((chiller) => (
                    <div key={chiller}>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1 uppercase">
                        Chiller {chiller}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[1, 2].map((sys) =>
                          [1, 2].map((comp) => {
                            const match = comps.find(
                              (c) =>
                                c.chiller_number === chiller &&
                                c.system_number === sys &&
                                c.compressor_number === comp
                            );
                            const status = match?.status || "NA";
                            const isOk = statusIsOk(status);
                            const isFault = statusIsFault(status);
                            return (
                              <div
                                key={`${sys}-${comp}`}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium ${
                                  isOk
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                    : isFault
                                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                                }`}
                                title={match?.notes || `S${sys}C${comp}: ${status}`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    isOk
                                      ? "bg-emerald-500"
                                      : isFault
                                      ? "bg-red-500 animate-pulse"
                                      : "bg-slate-300 dark:bg-slate-600"
                                  }`}
                                />
                                <span className="truncate">S{sys}C{comp}</span>
                                <span className="ml-auto text-[9px] opacity-70">
                                  {isOk ? "OK" : isFault ? "FAULT" : "N/A"}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
