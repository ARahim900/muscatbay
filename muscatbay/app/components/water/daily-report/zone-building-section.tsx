"use client";

// ─── ZoneBuildingSection — Zone Analysis body for one zone ────────────────────
// For Zones 3A/3B, a Building balance summary (bulk vs apartments + common, one
// row per building) sits above the L3 meter table; choosing a building opens
// its day-by-day breakdown in that table. Zones without buildings show the L3
// table alone.

import { useMemo, useState } from "react";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import type { ZoneBulkConfig } from "@/lib/water-accounts";
import { BuildingBalanceTable } from "@/components/water/building-balance-table";
import { buildDailyGrid, zoneBuildingBalances } from "./daily-metrics";
import { ZoneL3Table, type BuildingFocusRequest } from "./inline-zone-l3-table";
import type { BuildingRow, ZoneRow } from "./inline-shared";

export function ZoneBuildingSection({
    zoneRow, zoneConfig, monthData, buildingRows,
}: {
    zoneRow: ZoneRow;
    zoneConfig: ZoneBulkConfig;
    monthData: SupabaseDailyWaterConsumption[];
    buildingRows: BuildingRow[];
}) {
    const balances = useMemo(() => zoneBuildingBalances(buildDailyGrid(monthData), zoneConfig), [monthData, zoneConfig]);
    const [focus, setFocus] = useState<BuildingFocusRequest | undefined>(undefined);

    return (
        <>
            {balances.length > 0 && (
                <BuildingBalanceTable
                    rows={balances}
                    unit="day"
                    showZone={false}
                    filename={`water-building-balance-${zoneConfig.zoneName.replace(/\s+/g, "-").toLowerCase()}`}
                    onSelect={(r) => setFocus(prev => ({ bulkAccount: r.bulkAccount, seq: (prev?.seq ?? 0) + 1 }))}
                />
            )}
            <ZoneL3Table
                zoneRow={zoneRow}
                zoneConfig={zoneConfig}
                monthData={monthData}
                buildingRows={buildingRows}
                focus={focus}
            />
        </>
    );
}
