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
  else if (l3.total === null)
    unavailable = "No L3 reading is recorded in this zone for this day.";
  // Missing consumption is not zero and is never filled in. When some L3 meters
  // have not reported, the measured difference is still shown — marked partial,
  // as the Daily report does — because it can only overstate the loss, and a
  // zone with one silent meter would otherwise never show a figure at all
  // (owner ruling 2026-09-20).
  const difference =
    unavailable || bulk === null || l3.total === null ? null : bulk - l3.total;
  const missing = l3Meters.length - l3.reporting;
  return {
    partial: difference !== null && missing > 0,
    missing,
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
  name: string;
  bulk: number | null;
  metered: number | null;
  reporting: number;
  count: number;
  /** Some L3 meters have not reported: the loss is measured but overstated. */
  partial: boolean;
  /** Why there is no figure, in words ("" when there is one). */
  reason: string;
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
    const { bulk, difference, partial, l3, count, unavailable } =
      summariseZoneBalance(meters, zone.code);
    const lossPct =
      difference !== null && bulk !== null && bulk > 0
        ? (difference / bulk) * 100
        : null;
    const severity = dailySeverity(difference, lossPct);
    return {
      id: zone.code,
      name: zone.name,
      bulk,
      metered: l3.total,
      reporting: l3.reporting,
      count,
      partial,
      reason:
        difference !== null
          ? ""
          : bulk === null
            ? "Bulk reading not entered for this day"
            : unavailable,
      loss: difference,
      lossPct,
      severity,
      label:
        difference === null
          ? bulk === null
            ? "Loss — · bulk reading missing"
            : "Loss — · L3 readings incomplete"
          : `Loss ${formatMapVolume(difference)} m³${lossPct === null ? "" : ` · ${Math.round(lossPct)}%`} · ${SEVERITY_LABEL[severity]}${partial ? " · partial" : ""}`,
    };
  });
}
