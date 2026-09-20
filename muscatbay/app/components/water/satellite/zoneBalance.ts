import { ZONE_CONFIG } from "@/lib/water-data";
import {
  SEVERITY_LABEL,
  dailySeverity,
  type DailySeverity,
} from "@/components/water/daily-report/daily-metrics";
import {
  formatMapVolume,
  summariseMeters,
  type ConsumptionMeter,
} from "./consumptionModel";

export function summariseZoneBalance(meters: ConsumptionMeter[], zone: string) {
  const l3Meters = meters.filter(
    (m) => m.level === "L3" && (!zone || m.zone === zone),
  );
  const l3 = summariseMeters(l3Meters);
  const configuration = ZONE_CONFIG.find((z) => z.code === zone);
  const bulkMeters = configuration
    ? meters.filter(
        (m) =>
          m.account === configuration.bulkMeterAccount &&
          m.level === "L2" &&
          m.zone === zone,
      )
    : [];
  const bulk = bulkMeters.length === 1 ? bulkMeters[0].value : null;
  let unavailable = "";
  if (!zone)
    unavailable = "Select a zone to compare its bulk and L3 consumption.";
  else if (bulkMeters.length !== 1)
    unavailable = "A unique registered zone bulk meter is unavailable.";
  else if (bulk === null)
    unavailable = "The zone bulk reading is missing for this day.";
  else if (l3Meters.length === 0)
    unavailable = "No L3 meters are registered in this zone.";
  else if (bulk < 0 || l3.invalid > 0)
    unavailable = "Negative source readings require a check before comparison.";
  else if (l3.partial)
    unavailable = `Difference unavailable: ${l3Meters.length - l3.reporting} L3 reading(s) missing.`;
  // Missing consumption is not zero. Only a complete, same-day zone can be compared.
  const difference =
    unavailable || bulk === null || l3.total === null ? null : bulk - l3.total;
  return {
    bulk,
    bulkAccount: bulkMeters.length === 1 ? bulkMeters[0].account : null,
    l3,
    count: l3Meters.length,
    difference,
    unavailable,
  };
}

export interface ZoneLoss {
  id: string;
  /** Bulk − L3 for the day; null until the comparison is complete. */
  loss: number | null;
  lossPct: number | null;
  /** The Daily report's scale (`dailySeverity`) — one loss model app-wide. */
  severity: DailySeverity;
  label: string;
}
/** Loss per registered zone, for the overview markers. Never estimated. */
export function summariseZoneLosses(meters: ConsumptionMeter[]): ZoneLoss[] {
  return ZONE_CONFIG.map((zone) => {
    const { bulk, difference } = summariseZoneBalance(meters, zone.code);
    const lossPct =
      difference !== null && bulk !== null && bulk > 0
        ? (difference / bulk) * 100
        : null;
    const severity = dailySeverity(difference, lossPct);
    return {
      id: zone.code,
      loss: difference,
      lossPct,
      severity,
      label:
        difference === null
          ? bulk === null
            ? "Loss — · bulk reading missing"
            : "Loss — · L3 readings incomplete"
          : `Loss ${formatMapVolume(difference)} m³${lossPct === null ? "" : ` · ${Math.round(lossPct)}%`} · ${SEVERITY_LABEL[severity]}`,
    };
  });
}
