import { formatDay, shiftDay } from "./dailyModel";
import { formatVolume, type ConsumptionMeter } from "./consumptionModel";

export function MeterDetails({
  meter,
  date,
}: {
  meter: ConsumptionMeter;
  date: string;
}) {
  const comparable =
    meter.value !== null &&
    meter.previous !== null &&
    meter.value >= 0 &&
    meter.previous > 0;
  const change = comparable
    ? ((meter.value! - meter.previous!) / meter.previous!) * 100
    : null;
  const max = Math.max(1, ...meter.trend.map((p) => Math.max(0, p.value ?? 0)));
  return (
    <div className="space-y-4 p-4 text-body">
      <div>
        <h3 className="text-title text-primary dark:text-fg">{meter.name}</h3>
        <p className="text-muted">
          Account {meter.account} · {meter.level}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt>{formatDay(date)}</dt>
          <dd className="text-kpi font-semibold tabular-nums">
            {formatVolume(meter.value)} m³
          </dd>
        </div>
        <div>
          <dt>{formatDay(shiftDay(date, -1))}</dt>
          <dd className="text-kpi font-semibold tabular-nums">
            {formatVolume(meter.previous)} m³
          </dd>
        </div>
        <div className="col-span-2">
          <dt>Previous day comparison</dt>
          <dd>
            {change === null
              ? "Unavailable for missing or invalid days, or a zero baseline."
              : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
          </dd>
        </div>
        <div>
          <dt>Data status</dt>
          <dd>
            {meter.value === null
              ? "Missing"
              : meter.value < 0
                ? "Negative value — check source"
                : "Recorded"}
          </dd>
        </div>
        <div>
          <dt>Reading date</dt>
          <dd>
            {meter.value === null ? "No reading for this day" : formatDay(date)}
          </dd>
        </div>
      </dl>
      <section aria-label="Seven-day consumption trend">
        <h4 className="mb-2 font-medium">Daily trend · m³</h4>
        <div className="space-y-2">
          {meter.trend.map((point) => (
            <div
              key={point.date}
              className="grid grid-cols-4 items-center gap-2"
            >
              <span>{formatDay(point.date).slice(0, 6)}</span>
              <svg
                className="col-span-2 h-3 w-full"
                viewBox="0 0 100 12"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {point.value !== null && point.value >= 0 && (
                  <rect
                    width={(point.value / max) * 100}
                    height="12"
                    fill="#A4C5BB"
                  />
                )}
              </svg>
              <span className="text-right tabular-nums">
                {formatVolume(point.value)}
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="space-y-1 text-muted">
        <p>Zone: {meter.zoneName}</p>
        <p>Parent: {meter.parent}</p>
        <p>
          Location:{" "}
          {meter.location
            ? `${meter.location.coordinates[1].toFixed(6)}, ${meter.location.coordinates[0].toFixed(6)} · ${meter.location.precision}`
            : "Not mapped — available in the meter list"}
        </p>
      </div>
    </div>
  );
}
