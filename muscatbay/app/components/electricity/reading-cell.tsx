"use client";

/**
 * Reading cell — how a single monthly kWh value is rendered in the Meters table
 * and in its mobile card equivalent.
 *
 * Three defects this replaces:
 *  1. The table re-implemented its own anomaly gates (`>2 High, >1.5 Elevated,
 *     <0.3 Low`), disagreeing with Load Watch directly above it. Gates now come
 *     from lib/thresholds.ts, so a 2.5x reading is "High" on both surfaces.
 *  2. `val > 0 ? … : "—"` rendered a NEGATIVE reading — the documented Bank
 *     Muscat Sep-24 = −2 kWh — identically to a missing one, so the table hid
 *     an anomaly that Load Watch was flagging Critical. Negative, zero and
 *     missing are now three visibly different states.
 *  3. Status was colour-only (WCAG 1.4.1). Every flagged cell now carries an
 *     icon, a title and screen-reader text as well as its colour.
 */

import { AlertTriangle, ArrowDown, ArrowUp, CircleSlash, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ELECTRICITY_THRESHOLDS, ELECTRICITY_GATE_LABELS, classifyLoadRatio } from "@/lib/thresholds";

export type ReadingState = "missing" | "negative" | "zero" | "spike-crit" | "spike-high" | "dip" | "normal";

const { MIN_BASELINE_KWH } = ELECTRICITY_THRESHOLDS;
/** Ratio maths on fewer than this many positive reads is not a baseline. */
const MIN_SAMPLES = 3;

export interface ReadingDescriptor {
    state: ReadingState;
    /** Cell background/foreground classes — all token-backed. */
    className: string;
    /** Short label shown beside the number (never colour-only). */
    label: string | null;
    /** Full explanation, used as the cell `title` and the SR text. */
    title: string;
}

/** Mean of a meter's positive readings — the baseline every gate is measured against. */
export function readingBaseline(readings: Record<string, number>): { baseline: number; samples: number } {
    const positives = Object.values(readings).filter((v) => typeof v === "number" && v > 0);
    if (positives.length === 0) return { baseline: 0, samples: 0 };
    return {
        baseline: positives.reduce((a, b) => a + b, 0) / positives.length,
        samples: positives.length,
    };
}

export function describeReading(
    value: number | undefined,
    month: string,
    baseline: number,
    samples: number,
): ReadingDescriptor {
    if (value === undefined || value === null) {
        return {
            state: "missing",
            className: "text-muted-foreground",
            label: null,
            title: `${month}: no reading recorded — the meter was not read, or was out of service (kept distinct from a genuine 0 kWh).`,
        };
    }
    if (value < 0) {
        return {
            state: "negative",
            className: "bg-mb-danger-light text-mb-danger-text font-bold",
            label: "Negative",
            title: `${month}: ${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} kWh — a negative reading is impossible; likely a meter fault, reset or reversed CT.`,
        };
    }

    const ratioKnown = samples >= MIN_SAMPLES && baseline >= MIN_BASELINE_KWH;

    if (value === 0) {
        return ratioKnown
            ? {
                state: "zero",
                className: "bg-mb-warning-light text-mb-warning-text font-semibold",
                label: "Zero",
                title: `${month}: 0 kWh on a meter that normally draws ~${Math.round(baseline).toLocaleString("en-US")} kWh — check the breaker/supply and confirm the read.`,
            }
            : {
                state: "normal",
                className: "text-muted-foreground",
                label: null,
                title: `${month}: 0 kWh recorded.`,
            };
    }

    if (!ratioKnown) {
        return {
            state: "normal",
            className: "",
            label: null,
            title: `${month}: ${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} kWh — not enough history (or too small a baseline) to judge against.`,
        };
    }

    const ratio = value / baseline;
    const severity = classifyLoadRatio(ratio);
    const common = `${month}: ${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} kWh · ${ratio.toFixed(2)}× this meter's baseline of ${Math.round(baseline).toLocaleString("en-US")} kWh`;

    if (severity === "critical") {
        return {
            state: "spike-crit",
            className: "bg-mb-danger-light text-mb-danger-text font-bold",
            label: "Critical",
            title: `${common} — gate: ${ELECTRICITY_GATE_LABELS.spikeCritical}.`,
        };
    }
    if (severity === "high") {
        return {
            state: "spike-high",
            className: "bg-mb-warning-light text-mb-warning-text font-semibold",
            label: "High",
            title: `${common} — gate: ${ELECTRICITY_GATE_LABELS.spikeHigh}.`,
        };
    }
    if (severity === "watch") {
        return {
            state: "dip",
            className: "bg-mb-info-light text-mb-info-text font-semibold",
            label: "Low",
            title: `${common} — gate: ${ELECTRICITY_GATE_LABELS.dip}.`,
        };
    }
    return { state: "normal", className: "", label: null, title: `${common}.` };
}

const STATE_ICON = {
    "spike-crit": AlertTriangle,
    "spike-high": ArrowUp,
    dip: ArrowDown,
    zero: CircleSlash,
    negative: Minus,
} as const;

/** The rendered value: number + (where flagged) icon and label, never colour alone. */
export function ReadingValue({ value, descriptor }: { value: number | undefined; descriptor: ReadingDescriptor }) {
    if (descriptor.state === "missing") {
        return (
            <span className="text-muted-foreground/70">
                —<span className="sr-only"> no reading recorded</span>
            </span>
        );
    }
    const Icon = descriptor.state in STATE_ICON
        ? STATE_ICON[descriptor.state as keyof typeof STATE_ICON]
        : null;
    return (
        <span className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
            {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
            <span className="tabular-nums">{(value as number).toLocaleString("en-US", { maximumFractionDigits: 1 })}</span>
            {descriptor.label && (
                <>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" aria-hidden="true">{descriptor.label}</span>
                    <span className="sr-only">{descriptor.title}</span>
                </>
            )}
        </span>
    );
}

const LEGEND: { state: Exclude<ReadingState, "normal">; label: string; gate: string }[] = [
    { state: "spike-crit", label: "Critical spike", gate: ELECTRICITY_GATE_LABELS.spikeCritical },
    { state: "spike-high", label: "High spike", gate: ELECTRICITY_GATE_LABELS.spikeHigh },
    { state: "dip", label: "Low draw", gate: ELECTRICITY_GATE_LABELS.dip },
    { state: "zero", label: "Zero", gate: "0 kWh on a meter that normally draws" },
    { state: "negative", label: "Negative", gate: "below 0 kWh — meter fault" },
    { state: "missing", label: "No reading", gate: "not read / out of service" },
];

/**
 * Wrapping legend (the old one was a single non-wrapping flex row that ran off
 * the screen on mobile) that prints the LIVE gate values rather than prose.
 */
export function AnomalyLegend() {
    return (
        <div className="flex flex-col gap-1.5 px-1 text-xs text-muted-foreground">
            <p className="font-medium text-muted-foreground">
                Anomaly detection — each reading against that meter&apos;s own average
                (only where the baseline is ≥ {MIN_BASELINE_KWH} kWh over ≥ {MIN_SAMPLES} reads):
            </p>
            <ul className="flex list-none flex-wrap items-center gap-x-4 gap-y-1.5">
                {LEGEND.map((l) => {
                    const Icon = l.state in STATE_ICON ? STATE_ICON[l.state as keyof typeof STATE_ICON] : null;
                    return (
                        <li key={l.state} className="flex items-center gap-1.5">
                            <span
                                className={cn(
                                    "inline-flex h-4 min-w-4 items-center justify-center rounded border border-border/50 px-0.5",
                                    l.state === "spike-crit" && "bg-mb-danger-light text-mb-danger-text",
                                    l.state === "spike-high" && "bg-mb-warning-light text-mb-warning-text",
                                    l.state === "dip" && "bg-mb-info-light text-mb-info-text",
                                    l.state === "zero" && "bg-mb-warning-light text-mb-warning-text",
                                    l.state === "negative" && "bg-mb-danger-light text-mb-danger-text",
                                    l.state === "missing" && "bg-muted-bg text-muted-foreground",
                                )}
                                aria-hidden="true"
                            >
                                {Icon ? <Icon className="h-2.5 w-2.5" /> : "—"}
                            </span>
                            <span><span className="font-medium text-foreground">{l.label}</span> · {l.gate}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
