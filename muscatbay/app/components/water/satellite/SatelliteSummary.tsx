import { AlertTriangle, Droplets, Gauge, Minus } from "lucide-react";
import { StatsGrid } from "@/components/shared/stats-grid";
import {
  formatMapVolume,
  type ConsumptionMeter,
  type MeterStatus,
} from "./consumptionModel";
import type { ZoneLoss } from "./zoneBalance";

interface SatelliteSummaryProps {
  /** The selected zone's row, or null at the All zones level. */
  zone: ZoneLoss | null;
  zones: ZoneLoss[];
  /** Every meter of the day — the main supply meter is read from here. */
  meters: ConsumptionMeter[];
  statusCounts: Record<MeterStatus, number>;
}
const sum = (values: (number | null)[]) => {
  const recorded = values.filter((v): v is number => v !== null);
  return recorded.length ? recorded.reduce((a, b) => a + b, 0) : null;
};
/** The KPI strip under the map: four figures for the level on screen. */
export function SatelliteSummary({
  zone,
  zones,
  meters,
  statusCounts,
}: SatelliteSummaryProps) {
  const findings = statusCounts.high + statusCounts.zero + statusCounts.missing;
  const findingsTile = {
    label: "Findings",
    value: String(findings),
    subtitle: `${statusCounts.high} high · ${statusCounts.zero} zero · ${statusCounts.missing} no reading`,
    icon: AlertTriangle,
    variant: findings ? ("warning" as const) : ("success" as const),
  };
  if (!zone) {
    const main = meters.filter((m) => m.level === "L1");
    const bulks = zones.filter((z) => z.bulk !== null);
    return (
      <StatsGrid
        stats={[
          {
            label: "Main supply in",
            value: formatMapVolume(main.length === 1 ? main[0].value : null),
            unit: "m³",
            subtitle:
              main.length === 1
                ? main[0].value === null
                  ? "Not entered for this day"
                  : `L1 · account ${main[0].account}`
                : "No single L1 meter registered",
            icon: Gauge,
            variant: "primary",
          },
          {
            label: "Zone bulks",
            value: formatMapVolume(sum(zones.map((z) => z.bulk))),
            unit: "m³",
            subtitle: `${bulks.length} of ${zones.length} zone bulks entered`,
            icon: Gauge,
            variant: "water",
          },
          {
            label: "Metered (L3)",
            value: formatMapVolume(sum(zones.map((z) => z.metered))),
            unit: "m³",
            subtitle: `${zones.reduce((n, z) => n + z.reporting, 0)} of ${zones.reduce((n, z) => n + z.count, 0)} meters reporting`,
            icon: Droplets,
            variant: "secondary",
          },
          findingsTile,
        ]}
      />
    );
  }
  return (
    <StatsGrid
      stats={[
        {
          label: "Bulk in",
          value: formatMapVolume(zone.bulk),
          unit: "m³",
          subtitle:
            zone.bulk === null ? "Not entered for this day" : `${zone.name} bulk`,
          icon: Gauge,
          variant: "primary",
        },
        {
          label: "Metered (L3)",
          value: formatMapVolume(zone.metered),
          unit: "m³",
          subtitle: `${zone.reporting} of ${zone.count} meters reporting`,
          icon: Droplets,
          variant: "secondary",
        },
        {
          label: "Unaccounted",
          value: formatMapVolume(zone.loss),
          unit:
            zone.lossPct === null ? "m³" : `m³ · ${Math.round(zone.lossPct)}%`,
          subtitle: zone.reason
            ? zone.reason
            : zone.partial
              ? `Partial · ${zone.count - zone.reporting} meter(s) not reporting`
              : zone.loss !== null && zone.loss < 0
                ? "Metered exceeds bulk · check readings"
                : "Bulk in minus metered, same day",
          icon: Minus,
          variant: "primary",
          dataQuality: zone.partial ? "incomplete" : undefined,
        },
        findingsTile,
      ]}
    />
  );
}
