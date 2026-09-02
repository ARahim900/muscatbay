// components/ui/KpiCard.tsx
// The ONE KPI tile. Fixed 104px so every card in a grid is identical.
// Label and footnote are single-line with ellipsis; if a label does not fit,
// shorten the label ("Designated zones" -> "Zones"). Never let the card grow.
import type { ElementType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'water' | 'electricity' | 'stp' | 'assets' | 'contractors' | 'hvac' | 'pest' | 'fire' | 'neutral';

type Props = {
  label: string;               // <= ~22 characters
  value: string;               // pre-formatted: "373,260", "4.7k", "2 / 3"
  unit?: string;               // "m³", "OMR", "%", "MWh"
  footnote?: string;           // one line: "Year to date · Jan–Aug 2026"
  icon: LucideIcon;
  tone?: Tone;
  trend?: { value: string; direction: 'up' | 'down' | 'flat'; good?: boolean }; // "3.0%"
  href?: string;               // makes the whole card a link (hover lift)
  className?: string;
};

const tile: Record<Tone, string> = {
  water: 'bg-mod-water/12 text-mod-water', electricity: 'bg-mod-electricity/15 text-mod-electricity',
  stp: 'bg-mod-stp/15 text-mod-stp', assets: 'bg-mod-assets/15 text-mod-assets',
  contractors: 'bg-mod-contractors/15 text-mod-contractors', hvac: 'bg-mod-hvac/15 text-mod-hvac',
  pest: 'bg-mod-pest/15 text-mod-pest', fire: 'bg-mod-fire/15 text-mod-fire',
  neutral: 'bg-accent-tint text-primary dark:text-accent',
};

export function KpiCard({ label, value, unit, footnote, icon: Icon, tone = 'neutral', trend, href, className }: Props) {
  // Typed as ElementType (not `any`) — the repo's lint forbids explicit any.
  const Tag: ElementType = href ? 'a' : 'div';
  const TrendIcon = trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : Minus;
  const trendColor = !trend ? '' : trend.direction === 'flat' ? 'text-muted' : trend.good ? 'text-success' : 'text-danger';

  return (
    <Tag href={href} className={cn(
      'flex h-kpi gap-3 rounded-card border border-line bg-card p-4 shadow-card',
      href && 'transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-card-hover',
      className)}>
      <span aria-hidden className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-control', tile[tone])}>
        <Icon size={20} strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <p className="truncate text-eyebrow uppercase text-muted" title={label}>{label}</p>
        <p className="flex items-baseline gap-1.5 text-kpi tabular-nums text-fg">
          <span className="truncate">{value}</span>
          {unit && <span className="text-caption font-medium text-muted">{unit}</span>}
          {trend && (
            <span className={cn('ml-auto inline-flex items-center gap-0.5 text-caption font-medium', trendColor)}>
              <TrendIcon size={14} strokeWidth={2} aria-hidden />{trend.value}
            </span>
          )}
        </p>
        <p className="truncate text-caption text-muted" title={footnote}>{footnote ?? ' '}</p>
      </div>
    </Tag>
  );
}
