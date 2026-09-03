// components/ui/kpi-card.tsx
// The ONE KPI tile. It renders the same tile every module already draws
// through `StatsGrid` (HVAC, Contractors, Assets, Fire Safety, Electricity):
// icon in a tinted tile, eyebrow label, value + unit, one trend / subtitle
// line. Owner decision 2026-09-02 (review of the Water preview): the HVAC tile
// is the app's KPI card — its colours follow the KPI's meaning (purple, blue,
// green, amber, red), not the module, and the tile hugs its content instead
// of holding a fixed height.
//
// For a ROW of KPIs render `<StatsGrid stats={…} />` directly (it sets the
// column counts); use this component for a single tile inside other layouts.
'use client';
import type { LucideIcon } from 'lucide-react';
import { StatTile, type StatItem, type StatVariant } from '@/components/shared/stats-grid';

/** Module tones (kit vocabulary) and the tile's own meaning-based variants. */
type Tone =
  | 'water' | 'electricity' | 'stp' | 'assets' | 'contractors' | 'hvac' | 'pest' | 'fire' | 'neutral'
  | StatVariant;

type Props = {
  label: string;               // <= ~22 characters
  value: string;               // pre-formatted: "373,260", "4.7k", "2 / 3"
  unit?: string;               // "m³", "OMR", "%", "MWh"
  footnote?: string;           // one line: "Year to date · Jan–Aug 2026"
  icon: LucideIcon;
  tone?: Tone;
  trend?: { value: string; direction: 'up' | 'down' | 'flat'; good?: boolean }; // "3.0%"
  href?: string;               // makes the whole card a link
  className?: string;
};

/** Module tone → the tile variant it reads best in. Meaning-based variants pass through. */
const MODULE_VARIANT: Partial<Record<Tone, StatVariant>> = {
  water: 'water', electricity: 'warning', stp: 'success', assets: 'primary',
  contractors: 'info', hvac: 'warning', pest: 'success', fire: 'danger', neutral: 'primary',
};

export function KpiCard({ label, value, unit, footnote, icon, tone = 'neutral', trend, href, className }: Props) {
  const variant: StatVariant = MODULE_VARIANT[tone] ?? (tone as StatVariant);
  const stat: StatItem = {
    label,
    value,
    unit,
    subtitle: footnote,
    icon,
    variant,
    href,
    ...(trend && {
      trend: trend.direction === 'flat' ? ('neutral' as const) : trend.direction,
      trendValue: trend.value,
      trendContext: '',
      // The tile colours a trend by direction; `invertTrend` flips "down is good".
      invertTrend: trend.good === undefined ? false : (trend.direction === 'down') === trend.good,
    }),
  };
  return (
    <div className={className}>
      <StatTile stat={stat} index={0} />
    </div>
  );
}
