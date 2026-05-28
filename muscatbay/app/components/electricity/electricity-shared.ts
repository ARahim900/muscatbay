// ─── Shared constants & helpers for the electricity page ────────────────────
// Extracted from app/electricity/page.tsx (verbatim) so the chart and table
// subcomponents can reuse them without circular imports.

export const CHART_COLORS = {
    primary: 'var(--chart-elec-primary)',
    secondary: 'var(--chart-elec-secondary)',
    accent: 'var(--chart-elec-accent)',
    success: 'var(--chart-success)',
    loss: 'var(--chart-loss)',
    brand: 'var(--chart-brand)',
    amber: 'var(--chart-amber)',
    gray: 'var(--chart-gray)',
} as const;

// Color palette for per-meter lines (module-level to avoid recreating on each render)
export const meterColors = [
    CHART_COLORS.primary,
    CHART_COLORS.success,
    CHART_COLORS.secondary,
    CHART_COLORS.loss,
    CHART_COLORS.gray,
    'var(--chart-1)',        // blue
    'var(--chart-3)',        // amber variant
    'var(--chart-4)',        // emerald variant
    'var(--chart-5)',        // violet — extended palette
    'var(--chart-teal)',     // cyan — extended palette
];
