"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, HardDrive } from "lucide-react";
import { MultiSelectDropdown } from "@/components/shared/data-table";
import type { EquipmentRegistry } from "./types";

interface EquipmentTabProps {
  equipment: EquipmentRegistry[];
}

function getStatusDot(status: string) {
  const s = status?.toUpperCase() || "";
  if (s === "OPERATIONAL" || s === "OK") return "bg-emerald-500";
  if (s.includes("NOT") || s === "FAULTY") return "bg-red-500";
  if (s.includes("PARTIAL") || s.includes("DEGRADED")) return "bg-amber-500";
  return "bg-slate-400";
}

export function EquipmentTab({ equipment }: EquipmentTabProps) {
  const [search, setSearch] = useState("");
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const uniqueBuildings = useMemo(
    () => [...new Set(equipment.map((e) => e.building).filter(Boolean))].sort(),
    [equipment]
  );
  const uniqueStatuses = useMemo(
    () => [...new Set(equipment.map((e) => e.operational_status).filter(Boolean))].sort(),
    [equipment]
  );

  const filtered = useMemo(() => {
    let result = [...equipment];
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.equipment_label?.toLowerCase().includes(term) ||
          e.equipment_type?.toLowerCase().includes(term) ||
          e.building?.toLowerCase().includes(term) ||
          e.brand?.toLowerCase().includes(term) ||
          e.model?.toLowerCase().includes(term)
      );
    }
    if (selectedBuildings.length > 0 && selectedBuildings.length < uniqueBuildings.length)
      result = result.filter((e) => e.building != null && selectedBuildings.includes(e.building));
    if (selectedStatuses.length > 0 && selectedStatuses.length < uniqueStatuses.length)
      result = result.filter((e) => e.operational_status != null && selectedStatuses.includes(e.operational_status));
    return result;
  }, [equipment, search, selectedBuildings, uniqueBuildings, selectedStatuses, uniqueStatuses]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm"
          />
        </div>
        <MultiSelectDropdown label="Building" options={uniqueBuildings} selected={selectedBuildings} onChange={setSelectedBuildings} />
        <MultiSelectDropdown label="Status" options={uniqueStatuses} selected={selectedStatuses} onChange={setSelectedStatuses} />
        <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{filtered.length}</span> equipment
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <HardDrive className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p>No equipment found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((e) => {
            const isNotOp = e.operational_status?.toUpperCase().includes("NOT");
            return (
              <Card
                key={e.id}
                className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200 ${
                  isNotOp
                    ? "border-2 border-red-300 dark:border-red-700"
                    : "border border-slate-200 dark:border-slate-800"
                }`}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-slate-300">
                      {e.building}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(e.operational_status)}`} />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{e.operational_status}</span>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                    {e.equipment_label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {[e.equipment_type, e.brand, e.model].filter(Boolean).join(" · ")}
                  </p>
                  {e.notes && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2">{e.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
