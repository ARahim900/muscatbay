// components/ui/PageHeader.tsx
// Fixed-height page header: title + one description line on the left,
// one StatusChip (or any single element) on the right.
// The title column is capped so it never wraps at >= 1280px. If a title
// wraps, shorten the title — do not change this component.
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
    <header className={cn('flex h-header items-center justify-between gap-6', className)}>
      <div className={cn('min-w-0 max-w-[60%] border-l-[3px] pl-4', bar[accent])}>
        <h1 className="text-display truncate text-primary dark:text-fg">{title}</h1>
        {description && <p className="text-body truncate text-muted">{description}</p>}
      </div>
      {status && <div className="shrink-0">{status}</div>}
    </header>
  );
}
