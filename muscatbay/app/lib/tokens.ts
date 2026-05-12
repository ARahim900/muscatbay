/**
 * Design-system color tokens for JS runtime usage (Recharts, SVG fill, etc.).
 * CSS variables cannot be used directly in SVG attributes — these hex values
 * mirror globals.css and must stay in sync with it.
 *
 * Aligned with the Muscat Bay palette defined in globals.css.
 */

/** Categorical chart palette (ordered by visual contrast) */
export const CHART_PALETTE = [
  '#4E4456', // brand purple  → --primary / --chart-5
  '#43B3AE', // teal          → --secondary / --chart-2
  '#E8C064', // amber         → --mb-warning / --chart-3
  '#D67A7A', // coral         → --mb-danger / --chart-loss
  '#6B9AC4', // blue          → --mb-info / --chart-1
  '#84B59F', // sage green    → --mb-success / --chart-4
] as const;

/** Module / domain accent colors (mirror --chart-*-primary CSS vars). */
export const MODULE_COLORS = {
  stp:         '#84B59F', // --chart-stp-primary
  water:       '#6B9AC4', // --chart-water-primary
  electricity: '#E8C064', // --chart-electricity-primary
  hvac:        '#43B3AE', // --chart-hvac-primary (teal)
} as const;

/** Status colors for HVAC / Gulf Expert ticket status charts */
export const STATUS_CHART_COLORS: Record<string, string> = {
  Open:           '#D67A7A', // --mb-danger
  Closed:         '#84B59F', // --mb-success
  'Awaiting LPO': '#E8C064', // --mb-warning
  Quoted:         '#6B9AC4', // --mb-info
  'In Progress':  '#6B5F73', // --mb-primary-light
};
