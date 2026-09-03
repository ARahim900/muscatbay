// components/ui/segmented-control.tsx
// PRIMARY mode switch (Monthly / Daily / Satellite). Max 4 options.
// Renders the app-wide pill strip (`TabNavigation`, primary variant): a filled
// purple pill that slides under the selected option on a bordered, shadowed
// track — the same control STP, Electricity and HVAC use, so the mode switch
// reads as selectable buttons on every module page.
// Owner decision 2026-09-02 (review of the Water preview): the kit's flat
// 36 px strip "did not give the impression of buttons that can be selected".
'use client';
import type { LucideIcon } from 'lucide-react';
import { TabNavigation } from '@/components/shared/tab-navigation';

export type SegOption<T extends string> = { value: T; label: string; icon?: LucideIcon };

type Props<T extends string> = {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  'aria-label': string;
  className?: string;
};

export function SegmentedControl<T extends string>({ options, value, onChange, className, ...a11y }: Props<T>) {
  return (
    <TabNavigation
      variant="primary"
      className={className}
      ariaLabel={a11y['aria-label']}
      tabs={options.slice(0, 4).map(({ value: v, label, icon }) => ({ key: v, label, icon }))}
      activeTab={value}
      onTabChange={(key) => onChange(key as T)}
    />
  );
}
