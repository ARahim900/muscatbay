import { formatMapVolume, type ConsumptionMeter } from "./consumptionModel";

interface UnmappedMetersProps {
  /** Meters in the current zone and level. */
  meters: ConsumptionMeter[];
  /** False until the map has reported its position register. */
  ready: boolean;
}
/**
 * Meters the map cannot draw because no position is registered for them,
 * grouped by zone so each can be located and assigned. Positions are never
 * guessed: a meter stays here until its plot or chamber is recorded.
 */
export function UnmappedMeters({ meters, ready }: UnmappedMetersProps) {
  if (!ready) return null;
  const unmapped = meters.filter((m) => !m.location);
  if (unmapped.length === 0) return null;
  const zones = new Map<string, { total: number; missing: ConsumptionMeter[] }>();
  for (const meter of meters) {
    const zone = zones.get(meter.zoneName) ?? { total: 0, missing: [] };
    zone.total += 1;
    if (!meter.location) zone.missing.push(meter);
    zones.set(meter.zoneName, zone);
  }
  const groups = [...zones]
    .filter(([, zone]) => zone.missing.length > 0)
    .sort((a, b) => b[1].missing.length - a[1].missing.length);
  return (
    <details className="rounded-card border border-line bg-card shadow-card">
      <summary className="min-h-11 cursor-pointer p-4 text-title">
        Unmapped meters · {unmapped.length} of {meters.length}
        <span className="block text-caption text-muted">
          Read and counted in every total, but not drawn — no position is
          registered for them yet.
        </span>
      </summary>
      <div className="grid gap-3.5 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(([zone, { total, missing }]) => (
          <section key={zone} aria-label={`${zone} unmapped meters`}>
            <h3 className="text-label text-fg">
              {zone} · {missing.length} of {total} unmapped
            </h3>
            <ul className="mt-1 space-y-1 text-caption text-muted">
              {missing.map((meter) => (
                <li key={meter.account} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {meter.name} · <span className="meter">{meter.account}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatMapVolume(meter.value)} m³
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
