import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Tone class names defined in globals.css for conditional numeric cells. */
export type NumTone = "num-good" | "num-warn" | "num-bad";

interface NumToneOptions {
  /** |value| at/above this maps to amber (moderate movement). Default 10. */
  warn?: number;
  /** |value| at/above this maps to red (large swing). Default 25. */
  alert?: number;
  /**
   * "magnitude" (default) colours purely by how big the change is — small is
   * calm green, bigger is amber, biggest is red, regardless of direction.
   * "sign" colours by direction — positive green, negative red — with the
   * thresholds only deciding when a negative becomes amber vs red.
   */
  mode?: "magnitude" | "sign";
}

/**
 * Map a numeric delta to a conditional-tone class for `.ops-table` cells.
 * Returns `undefined` for null/NaN so callers can spread it without a fallback.
 * Example: <td className={cn("num", numTone(row.changePct))}>{row.changePct}</td>
 */
export function numTone(
  value: number | null | undefined,
  { warn = 10, alert = 25, mode = "magnitude" }: NumToneOptions = {},
): NumTone | undefined {
  if (value === null || value === undefined || Number.isNaN(value)) return undefined;
  const mag = Math.abs(value);
  if (mode === "sign") {
    if (value >= 0) return "num-good";
    return mag >= alert ? "num-bad" : "num-warn";
  }
  if (mag >= alert) return "num-bad";
  if (mag >= warn) return "num-warn";
  return "num-good";
}
