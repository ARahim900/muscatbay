// components/ui/Tabs.tsx
// SECONDARY section switch (Overview / Zone Analysis / …). Underline style,
// 40px, full-width bottom rule, teal underline on the active tab.
// Never scrolls: if more than 6 sections, reduce the sections.
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type TabItem<T extends string> = { value: T; label: string; icon?: LucideIcon; count?: number };

type Props<T extends string> = {
  tabs: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  'aria-label': string;
  className?: string;
};

export function Tabs<T extends string>({ tabs, value, onChange, className, ...a11y }: Props<T>) {
  const onKey = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex(t => t.value === value);
    if (e.key === 'ArrowRight') onChange(tabs[(i + 1) % tabs.length].value);
    if (e.key === 'ArrowLeft') onChange(tabs[(i - 1 + tabs.length) % tabs.length].value);
  };
  return (
    <div role="tablist" aria-label={a11y['aria-label']} onKeyDown={onKey}
      className={cn('flex h-10 items-stretch gap-6 border-b border-line', className)}>
      {tabs.slice(0, 6).map(({ value: v, label, icon: Icon, count }) => {
        const active = v === value;
        return (
          <button key={v} type="button" role="tab" aria-selected={active} tabIndex={active ? 0 : -1}
            onClick={() => onChange(v)}
            className={cn(
              'relative inline-flex items-center gap-1.5 whitespace-nowrap text-label transition-colors duration-200',
              active ? 'text-primary dark:text-fg' : 'text-muted hover:text-fg')}>
            {Icon && <Icon size={16} strokeWidth={2} aria-hidden />}
            {label}
            {count != null && (
              <span className="rounded-pill bg-component px-1.5 text-caption tabular-nums text-muted">{count}</span>
            )}
            {active && <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 rounded-pill bg-accent" />}
          </button>
        );
      })}
    </div>
  );
}
