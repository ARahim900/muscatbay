/**
 * Design-system color tokens for JS runtime usage (Recharts series, SVG fills).
 *
 * These resolve the CSS variables in `globals.css` rather than duplicating their
 * hex values. SVG presentation attributes are parsed as CSS property values, so
 * `fill` / `stroke` / `stop-color` accept `var(...)` — the pattern already used
 * by every other Recharts surface in the app (`stroke="var(--chart-loss)"`,
 * `<stop stopColor={CHART_COLORS.primary} />`, …).
 *
 * Reading the variables instead of mirroring them fixes two classes of drift:
 *   1. the mirrored hexes could — and did — fall out of sync with the tokens:
 *      the categorical teal was `#43B3AE` while `--chart-2` is `#A1D1D5`, so
 *      pies and bars rendered a teal that appeared nowhere else in the app;
 *   2. the hexes were single-theme, so brand purple stayed near-black on the
 *      dark page background; `--chart-5` lightens itself in `.dark`.
 *
 * Consumers must not string-concatenate an alpha suffix onto these values
 * (`${color}1A`) — use `color-mix(in srgb, ${color} 12%, transparent)`.
 */

/** Categorical chart palette (ordered by visual contrast) */
export const CHART_PALETTE = [
  'var(--chart-5)',    // brand purple
  'var(--chart-2)',    // brand teal
  'var(--chart-3)',    // amber
  'var(--chart-loss)', // coral — loss / deficit
  'var(--chart-1)',    // soft blue
  'var(--chart-4)',    // sage green
] as const;

/** Module / domain accent colors (mirror the --chart-*-primary CSS vars). */
export const MODULE_COLORS = {
  stp:         'var(--chart-stp-primary)',
  water:       'var(--chart-water-primary)',
  electricity: 'var(--chart-elec-primary)',
  hvac:        'var(--module-hvac)',
} as const;

/** Status colors for HVAC / Gulf Expert ticket status charts */
export const STATUS_CHART_COLORS: Record<string, string> = {
  Open:           'var(--mb-danger)',
  Closed:         'var(--mb-success)',
  'Awaiting LPO': 'var(--mb-warning)',
  Quoted:         'var(--mb-info)',
  'In Progress':  'var(--mb-primary-light)',
};
