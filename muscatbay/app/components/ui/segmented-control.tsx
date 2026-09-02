// components/ui/SegmentedControl.tsx
// PRIMARY mode switch (Monthly / Daily / Satellite). Max 4 options.
// Filled purple active pill on a tinted track, 36px. Arrow keys move selection.
// This is visually distinct from <Tabs> on purpose — never use one for the other.
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SegOption<T extends string> = { value: T; label: string; icon?: LucideIcon };

type Props<T extends string> = {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  'aria-label': string;
  className?: string;
};

export function SegmentedControl<T extends string>({ options, value, onChange, className, ...a11y }: Props<T>) {
  const onKey = (e: React.KeyboardEvent) => {
    const i = options.findIndex(o => o.value === value);
    if (e.key === 'ArrowRight') onChange(options[(i + 1) % options.length].value);
    if (e.key === 'ArrowLeft') onChange(options[(i - 1 + options.length) % options.length].value);
  };
  return (
    <div role="radiogroup" aria-label={a11y['aria-label']} onKeyDown={onKey}
      className={cn('inline-flex h-9 items-center gap-1 rounded-control bg-component p-1', className)}>
      {options.slice(0, 4).map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button key={v} type="button" role="radio" aria-checked={active} tabIndex={active ? 0 : -1}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-control px-3 text-label transition-colors duration-200',
              active ? 'bg-primary text-on-primary shadow-card' : 'text-muted hover:text-fg')}>
            {Icon && <Icon size={16} strokeWidth={2} aria-hidden />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
