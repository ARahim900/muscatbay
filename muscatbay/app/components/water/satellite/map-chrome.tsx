"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatItem } from "@/components/shared/stats-grid";
import { MeterDetails } from "./MeterDetails";
import { StatusMark, STATUS_TONES } from "./SatellitePanels";
import { formatDay, omanToday, shiftDay } from "./dailyModel";
import {
  STATUSES,
  STATUS_LABELS,
  formatMapVolume,
  formatVolume,
  type ConsumptionMeter,
} from "./consumptionModel";

/*
 * The phone map's chrome: a glass bar over the top of the imagery and a glass
 * sheet over the bottom (owner-approved sketch, 2026-09-28). Glass is used here
 * only — these panels float over the satellite map; page cards stay solid.
 * Every control is a 44px thumb target.
 */

const chip =
  "flex h-11 flex-none items-center rounded-control px-3.5 text-label font-medium text-fg transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-accent";
const iconButton =
  "mb-glass-inset grid size-11 flex-none place-items-center rounded-control text-primary transition-colors duration-150 disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-accent dark:text-fg";

/** "Sun 27 Sep" — weekday first, as the bar reads it at a glance. */
function dayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function MapTopBar({
  zones,
  zone,
  date,
  latestDay,
  loading,
  onZone,
  onDate,
  onClose,
}: {
  zones: { id: string; name: string }[];
  zone: string;
  date: string;
  latestDay: string | null;
  loading: boolean;
  onZone: (zone: string) => void;
  onDate: (date: string) => void;
  onClose: () => void;
}) {
  const chips = useRef<HTMLDivElement>(null);
  // The chosen zone's chip is always in view, even far along the strip.
  useEffect(() => {
    const chip = chips.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (chip && typeof chip.scrollIntoView === "function")
      chip.scrollIntoView({ block: "nearest", inline: "center" });
  }, [zone]);
  const next = shiftDay(date, 1);
  const canGoForward = next <= omanToday();
  const note = loading
    ? "Reading daily records…"
    : latestDay === date
      ? "Latest recorded day"
      : latestDay
        ? null
        : "No readings recorded this month";
  return (
    <div className="map-topbar mb-glass pointer-events-auto m-2.5 rounded-card p-2 text-fg sm:mx-auto sm:max-w-2xl">
      <div className="map-topbar-heading flex items-center justify-between gap-2 px-1 pb-1.5">
        <p className="text-title">Water · Satellite</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the map"
          className={iconButton}
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <div
        ref={chips}
        role="group"
        aria-label="Zone"
        className="map-topbar-zones flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none]"
      >
        {[{ id: "", name: "All zones" }, ...zones].map((z) => {
          const on = z.id === zone;
          return (
            <button
              key={z.id || "all"}
              type="button"
              aria-pressed={on}
              onClick={() => onZone(z.id)}
              className={cn(
                chip,
                on ? "bg-primary font-semibold text-on-primary" : "mb-glass-inset",
              )}
            >
              {z.name}
            </button>
          );
        })}
      </div>
      <div className="map-topbar-date mt-1.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onDate(shiftDay(date, -1))}
          aria-label="Previous day"
          className={iconButton}
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-label font-semibold tabular-nums">{dayLabel(date)}</p>
          {note ? (
            <p className="map-topbar-note text-caption text-muted">{note}</p>
          ) : (
            latestDay && (
              <button
                type="button"
                onClick={() => onDate(latestDay)}
                className="min-h-11 text-caption font-semibold text-primary underline underline-offset-2 dark:text-accent"
              >
                Go to latest · {dayLabel(latestDay)}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => onDate(next)}
          disabled={!canGoForward}
          aria-label="Next day"
          className={iconButton}
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <ul
      aria-label="Legend"
      className="map-legend mb-glass pointer-events-auto mx-2.5 mb-2 flex w-fit flex-wrap items-center gap-x-3 gap-y-1 rounded-control px-2.5 py-1.5 text-caption text-fg sm:mx-auto"
    >
      {STATUSES.map((status) => (
        <li key={status} className="inline-flex items-center gap-1.5">
          <StatusMark status={status} />
          {STATUS_LABELS[status]}
        </li>
      ))}
    </ul>
  );
}

function Figure({ stat }: { stat: StatItem }) {
  const warn = stat.dataQuality === "incomplete";
  return (
    <div className="mb-glass-inset @container min-w-0 rounded-card px-3 py-1.5">
      <p className="truncate text-eyebrow uppercase text-muted">{stat.label}</p>
      <p
        className="kpi-figure kpi-figure-compact text-kpi text-fg"
        style={{ "--kpi-chars": String(stat.value).length } as React.CSSProperties}
      >
        <span className="whitespace-nowrap">{stat.value}</span>
        {stat.unit && (
          <span className="ms-1 text-label font-medium tracking-normal text-muted">
            {stat.unit}
          </span>
        )}
      </p>
      {stat.subtitle && (
        <p
          title={stat.subtitle}
          className={cn("map-figure-sub truncate text-caption", warn ? "font-semibold text-fg" : "text-muted")}
        >
          {stat.subtitle}
        </p>
      )}
    </div>
  );
}

interface SelectedMeterSheetProps {
  meter: ConsumptionMeter;
  date: string;
  previous: ConsumptionMeter | undefined;
  following: ConsumptionMeter | undefined;
  villaLink: string;
  onMeter: (account: string) => void;
  onClose: () => void;
  onCentre: () => void;
}

function SelectedMeterSheet({
  meter, date, previous, following, villaLink, onMeter, onClose, onCentre,
}: SelectedMeterSheetProps) {
  const selectionKey = `${meter.account}:${date}`;
  const [disclosure, setDisclosure] = useState({ selectionKey, expanded: false });
  const expanded = disclosure.selectionKey === selectionKey && disclosure.expanded;
  const detailsId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const tone = STATUS_TONES[meter.status];
  // Reset only disclosure state; remounting would discard keyboard focus on navigation.
  if (disclosure.selectionKey !== selectionKey) {
    setDisclosure({ selectionKey, expanded: false });
  }
  const collapse = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !expanded) return;
    event.stopPropagation();
    setDisclosure({ selectionKey, expanded: false });
    toggle.current?.focus();
  };

  return (
    <div className="map-meter-sheet min-w-0" onKeyDown={collapse}>
      <div className="map-meter-heading flex min-w-0 items-start justify-between gap-2 pt-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-title" title={meter.name}>{meter.name}</h3>
          <p className="break-words text-caption text-muted">
            {meter.zoneName} · {meter.account} · {meter.level}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" className={iconButton} disabled={!previous}
            onClick={() => previous && onMeter(previous.account)} aria-label="Previous meter">
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button type="button" className={iconButton} disabled={!following}
            onClick={() => following && onMeter(following.account)} aria-label="Next meter">
            <ChevronRight size={18} aria-hidden />
          </button>
          <button type="button" className={iconButton} onClick={onClose} aria-label="Close meter details">
            <X size={18} aria-hidden />
          </button>
        </div>
      </div>
      <div className="map-meter-summary mt-1 flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="text-caption text-muted">{formatDay(date)}</p>
          <p className="break-words text-title font-semibold tabular-nums">
            <span className="sr-only">Selected day consumption: </span>
            {meter.value === null ? "No reading" : `${formatVolume(meter.value)} m³`}
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-caption">
          <StatusMark status={meter.status} />
          <span className={cn("font-semibold", tone === "danger" || tone === "warning" ? "text-fg" : "text-muted")}>
            {STATUS_LABELS[meter.status]}
          </span>
        </p>
      </div>
      <div className="map-meter-actions mt-2 flex gap-2">
        <button ref={toggle} type="button" onClick={() => setDisclosure({ selectionKey, expanded: !expanded })}
          aria-expanded={expanded} aria-controls={detailsId}
          className="mb-glass-inset flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-control text-label font-semibold text-primary focus-visible:outline-3 focus-visible:outline-accent dark:text-fg">
          {expanded ? <ChevronDown size={18} aria-hidden /> : <ChevronUp size={18} aria-hidden />}
          {expanded ? "Less detail" : "More detail"}
        </button>
        <button type="button" onClick={onCentre}
          className="mb-glass-inset flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-control text-label font-semibold text-primary focus-visible:outline-3 focus-visible:outline-accent dark:text-fg">
          <Crosshair size={16} aria-hidden />
          Centre on meter
        </button>
      </div>
      <div id={detailsId} hidden={!expanded} className="map-sheet-detail min-w-0">
        {expanded && (
          <>
            {meter.statusNote && <p className="mt-2 break-words text-caption text-muted">{meter.statusNote}</p>}
            {villaLink && <p className="mt-1 break-words text-caption text-muted">{villaLink}</p>}
            <MeterDetails meter={meter} date={date} showHeading={false} />
          </>
        )}
      </div>
    </div>
  );
}

export function MapSheet({
  heading,
  reporting,
  reportingTone,
  stats,
  meters,
  selected,
  date,
  villaLink,
  query,
  onQuery,
  onMeter,
  onCloseMeter,
  onCentre,
}: {
  heading: string;
  reporting: string;
  reportingTone: "success" | "warning" | "danger";
  stats: StatItem[];
  /** The meters in view, findings first. */
  meters: ConsumptionMeter[];
  selected: ConsumptionMeter | undefined;
  date: string;
  villaLink: string;
  query: string;
  onQuery: (query: string) => void;
  onMeter: (account: string) => void;
  onCloseMeter: () => void;
  onCentre: () => void;
}) {
  const [open, setOpen] = useState(false);
  const index = selected ? meters.findIndex((m) => m.account === selected.account) : -1;
  const previous = index > 0 ? meters[index - 1] : undefined;
  const following = index >= 0 && index < meters.length - 1 ? meters[index + 1] : undefined;
  // Status colour sits in the dot; text on glass stays at full contrast.
  const toneDot = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[reportingTone];
  return (
    <div>
      {/* The legend reads the map; with a meter or the list open the sheet
          needs the room. */}
      {!selected && !open && <Legend />}
      <section
        aria-label={selected ? `Meter ${selected.name}` : `${heading} figures`}
        className="map-bottom-sheet mb-glass pointer-events-auto min-w-0 rounded-t-card px-3.5 pt-1.5 pb-3 text-fg sm:mx-auto sm:max-w-2xl"
      >
        {selected ? (
          <SelectedMeterSheet
            meter={selected}
            date={date}
            previous={previous}
            following={following}
            villaLink={villaLink}
            onMeter={onMeter}
            onClose={onCloseMeter}
            onCentre={onCentre}
          />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="flex h-11 w-full flex-col items-center justify-center gap-1"
            >
              <span aria-hidden className="h-1.5 w-10 rounded-pill bg-muted/40" />
              <span className="sr-only">{open ? "Show figures" : "Show meters"}</span>
            </button>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="truncate text-title">{heading}</p>
              <p className="flex shrink-0 items-center gap-1.5 text-caption font-semibold text-fg">
                <span aria-hidden className={cn("size-2 rounded-pill", toneDot)} />
                {reporting}
              </p>
            </div>
            {open ? (
              <div>
                <label className="mb-glass-inset mb-1.5 flex h-11 items-center gap-2 rounded-control px-3 focus-within:outline-3 focus-within:outline-accent">
                  <Search size={16} className="text-muted" aria-hidden />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => onQuery(event.target.value)}
                    placeholder="Villa, building or account"
                    aria-label="Search meters"
                    className="h-full min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-muted"
                  />
                </label>
                {meters.length === 0 ? (
                  <p className="py-4 text-body text-muted">No meter matches this view.</p>
                ) : (
                  <ul className="map-sheet-list">
                    {meters.map((meter) => (
                      <li key={meter.account} className="border-b border-line/60 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => onMeter(meter.account)}
                          className="flex min-h-11 w-full items-center gap-2.5 py-2 text-left"
                        >
                          <StatusMark status={meter.status} />
                          <span className="min-w-0 flex-1 truncate text-label font-medium">
                            {meter.name}
                          </span>
                          <span className="shrink-0 text-label font-semibold tabular-nums">
                            {meter.value === null
                              ? "No reading"
                              : `${formatMapVolume(meter.value)} m³`}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex h-11 w-full items-center justify-center gap-1.5 text-label font-semibold text-primary dark:text-accent"
                >
                  <ChevronDown size={16} aria-hidden />
                  Show figures
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {stats.map((stat) => (
                    <Figure key={stat.label} stat={stat} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="mt-1.5 flex h-11 w-full items-center justify-center gap-1.5 text-label font-semibold text-primary dark:text-accent"
                >
                  <ChevronUp size={16} aria-hidden />
                  Meters · {meters.length}
                </button>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
