import { Droplets, Gauge, Minus } from "lucide-react";
import { StatsGrid } from "@/components/shared/stats-grid";
import { formatDay } from "./dailyModel";
import {
  formatVolume,
  zoneName,
  type SatelliteState,
} from "./consumptionModel";
import type { summariseZoneBalance } from "./zoneBalance";
interface SatelliteSummaryProps {
  state: SatelliteState;
  balance: ReturnType<typeof summariseZoneBalance>;
  locationsKnown: boolean;
  lastUpdated?: Date | null;
}
export function SatelliteSummary({
  state,
  balance,
  locationsKnown,
  lastUpdated,
}: SatelliteSummaryProps) {
  const { bulk, bulkAccount, l3, count, difference, unavailable } = balance;
  const zone = state.zone ? zoneName(state.zone) : "All zones";
  return (
    <div className="space-y-3" aria-label="Zone consumption comparison">
      <StatsGrid
        stats={[
          {
            label: "Zone bulk consumption",
            value: formatVolume(bulk),
            unit: "m³",
            subtitle: bulkAccount
              ? `L2 · account ${bulkAccount}`
              : "Select a zone with a registered bulk meter",
            icon: Gauge,
            variant: "primary",
          },
          {
            label: "L3 consumption",
            value: formatVolume(l3.total),
            unit: "m³",
            subtitle: l3.partial
              ? "Partial total · recorded readings only"
              : "Total recorded L3 consumption",
            icon: Droplets,
            variant: "secondary",
            color: "#A4C5BB",
            bgColor: "var(--color-accent-tint)",
          },
          {
            label: "Bulk − L3 difference",
            value: formatVolume(difference),
            unit: "m³",
            subtitle:
              difference === null
                ? "Awaiting a complete comparison"
                : difference < 0
                  ? "L3 exceeds bulk · check readings"
                  : "Bulk consumption minus L3 consumption",
            icon: Minus,
            variant: "primary",
          },
        ]}
      />
      <p className="text-caption text-muted">
        {formatDay(state.date)} · {zone} · Coverage: bulk{" "}
        {bulkAccount ? `${bulk === null ? "0" : "1"} of 1` : "unavailable"}; L3{" "}
        {l3.reporting} of {count} reporting · Mapped L3:{" "}
        {locationsKnown ? `${l3.mapped} of ${count}` : "loading"}.
      </p>
      {difference === null ? (
        <p role="status" className="text-caption text-muted">
          {unavailable}
        </p>
      ) : (
        <p className="text-caption text-muted">
          Same-day L2 − L3 difference. This may include leakage, unmetered use
          or reading-time differences; it is not a confirmed leak measurement.
        </p>
      )}
      <p className="text-caption text-muted">
        Last refreshed:{" "}
        {lastUpdated
          ? lastUpdated.toLocaleString("en-GB", {
              timeZone: "Asia/Muscat",
              dateStyle: "medium",
              timeStyle: "short",
            }) + " · Oman"
          : "Unknown"}
        .
      </p>
    </div>
  );
}
