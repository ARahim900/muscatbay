import { formatDay, shiftDay } from "./dailyModel";
import { formatVolume, type ConsumptionMeter } from "./consumptionModel";

/** "Mon" and "21" for a trend row — the weekday reads first, the date is the anchor. */
function trendDay(date: string): { weekday: string; day: string } {
  const d = new Date(`${date}T00:00:00Z`);
  return {
    weekday: d.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short" }),
    day: String(d.getUTCDate()),
  };
}

/** The selected day's bar carries the meter's status colour; other days stay teal. */
function barTone(status: ConsumptionMeter["status"]): string {
  if (status === "high") return "bg-danger";
  if (status === "elevated") return "bg-warning";
  return "bg-accent";
}

export function MeterDetails({
  meter,
  date,
  showHeading = true,
}: {
  meter: ConsumptionMeter;
  date: string;
  /** Off where the surrounding sheet already names the meter. */
  showHeading?: boolean;
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
    <div className={`min-w-0 space-y-4 py-4 text-body [overflow-wrap:anywhere] ${showHeading ? "px-4" : ""}`}>
      {showHeading && (
        <div>
          <h3 className="text-title text-primary dark:text-fg">{meter.name}</h3>
          <p className="text-muted">
            Account {meter.account} · {meter.level}
          </p>
        </div>
      )}
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt>{formatDay(date)}</dt>
          <dd className="text-title font-semibold tabular-nums sm:text-kpi">
            {formatVolume(meter.value)} m³
          </dd>
        </div>
        <div>
          <dt>{formatDay(shiftDay(date, -1))}</dt>
          <dd className="text-title font-semibold tabular-nums sm:text-kpi">
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
        <div className="mb-2 flex items-baseline justify-between">
          <h4 className="text-eyebrow uppercase text-muted">Daily trend</h4>
          <span className="text-caption text-muted">m³</span>
        </div>
        <div>
          {meter.trend.map((point) => {
            const { weekday, day } = trendDay(point.date);
            const isSelected = point.date === date;
            // A recorded zero draws no bar — the minimum sliver is only for a
            // small positive reading, never for zero, missing or negative.
            const width =
              point.value !== null && point.value > 0
                ? Math.max(2, (point.value / max) * 100)
                : 0;
            return (
              <div
                key={point.date}
                className="grid h-7 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-2.5"
              >
                <span className="text-caption text-muted tabular-nums">
                  {weekday} <b className="font-semibold text-fg">{day}</b>
                </span>
                <span className="h-2.5 overflow-hidden rounded-pill bg-neutral-tint">
                  {width > 0 && (
                    <span
                      className={`block h-full rounded-pill ${isSelected ? barTone(meter.status) : "bg-accent"}`}
                      style={{ width: `${width}%` }}
                    />
                  )}
                </span>
                <span className="min-w-12 text-right text-label font-semibold tabular-nums">
                  {point.value === null ? "—" : formatVolume(point.value)}
                </span>
              </div>
            );
          })}
        </div>
        {meter.baseline !== null && (
          <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-dashed border-line pt-2 text-caption text-muted">
            <span>Usual — average of its recent recorded days</span>
            <span className="shrink-0 font-semibold text-fg tabular-nums">
              {formatVolume(meter.baseline)} m³
            </span>
          </div>
        )}
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
