// components/ui/PageHeader.tsx
// Fixed-height page header: title + one description line on the left,
// one StatusChip (or any single element) on the right.
// The title column is capped so it never wraps at >= 1280px. If a title
// wraps, shorten the title — do not change this component.
// Below the `sm` breakpoint (phones) the status stacks under the title
// instead of sharing its row: side by side, a chip or two squeezed the
// title to "W.." on a 402px screen. From `sm` up the layout is unchanged.
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  title: string;          // sentence case, short: "Water", "STP Plant", "Contractors"
  description?: string;   // one line, no full stop needed
  accent?: 'water' | 'electricity' | 'stp' | 'assets' | 'contractors' | 'hvac' | 'pest' | 'fire' | 'none';
  status?: ReactNode;     // <StatusChip .../>
  className?: string;
};

const bar: Record<NonNullable<Props['accent']>, string> = {
  water: 'border-mod-water', electricity: 'border-mod-electricity', stp: 'border-mod-stp',
  assets: 'border-mod-assets', contractors: 'border-mod-contractors', hvac: 'border-mod-hvac',
  pest: 'border-mod-pest', fire: 'border-mod-fire', none: 'border-primary',
};

export function PageHeader({ title, description, accent = 'none', status, className }: Props) {
  return (
    <header className={cn('flex flex-col items-start gap-3 sm:h-header sm:flex-row sm:items-center sm:justify-between sm:gap-6', className)}>
      <div className={cn('min-w-0 max-w-full border-l-[3px] pl-4 sm:max-w-[60%]', bar[accent])}>
        <h1 className="text-display truncate text-primary dark:text-fg">{title}</h1>
        {description && <p className="text-body truncate text-muted">{description}</p>}
      </div>
      {status && <div className="max-w-full shrink-0">{status}</div>}
    </header>
  );
}
