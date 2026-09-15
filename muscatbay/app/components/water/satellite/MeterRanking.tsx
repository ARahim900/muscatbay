import { ListOrdered } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/mb-button";
import { formatVolume, type ConsumptionMeter } from "./consumptionModel";

export function MeterRanking({
  meters,
  selected,
  onSelect,
  showAll,
  onShowAll,
  locationsReady,
}: {
  meters: ConsumptionMeter[];
  selected: string;
  onSelect: (account: string) => void;
  showAll: boolean;
  onShowAll: () => void;
  locationsReady: boolean;
}) {
  const ranked = [...meters].sort((a, b) =>
    a.value === null
      ? b.value === null
        ? a.name.localeCompare(b.name)
        : 1
      : b.value === null
        ? -1
        : b.value - a.value,
  );
  const shown = showAll ? ranked : ranked.slice(0, 10);
  return (
    <SectionCard className="min-w-0 text-fg">
      <SectionCard.Header
        icon={ListOrdered}
        title="Largest recorded consumers"
        description={`${shown.length} of ${meters.length} meters · highest first`}
      />
      <SectionCard.Body flush>
        <div className="overflow-auto lg:max-h-96">
          <table className="w-full text-left text-body">
            <caption className="sr-only">
              Consumption ranking. Select a meter to view its details. Missing
              values appear as a dash.
            </caption>
            <thead className="sticky top-0 bg-primary text-eyebrow text-on-primary">
              <tr className="border-y border-line">
                <th scope="col" className="px-4 py-3">
                  Meter
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  m³
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr
                  key={m.account}
                  className={
                    selected === m.account
                      ? "border-b border-line bg-accent-tint"
                      : "border-b border-line even:bg-component"
                  }
                >
                  <td className="px-4">
                    <button
                      type="button"
                      onClick={() => onSelect(m.account)}
                      aria-pressed={selected === m.account}
                      className="min-h-11 py-2 text-left font-medium underline decoration-accent underline-offset-4 focus-visible:outline-3 focus-visible:outline-accent"
                    >
                      <span className="block">{m.name}</span>
                      <span className="block font-normal text-muted">
                        {m.account}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatVolume(m.value)}
                  </td>
                  <td className="px-4 py-3">
                    {m.value === null
                      ? "Missing"
                      : m.value < 0
                        ? "Check value"
                        : "Recorded"}
                    {!m.location && (
                      <span className="block text-muted">
                        {locationsReady ? "Unmapped" : "Location unconfirmed"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meters.length === 0 && (
          <p className="p-4 text-body">
            No meters match. Clear the search or choose another zone or level.
          </p>
        )}
        {!showAll && meters.length > 10 && (
          <Button onClick={onShowAll} className="m-4">
            Show all {meters.length} meters
          </Button>
        )}
      </SectionCard.Body>
      <SectionCard.Footer>
        A consumption ranking is not a leak alert.
      </SectionCard.Footer>
    </SectionCard>
  );
}
