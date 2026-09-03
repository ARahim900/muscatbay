// components/ui/tabs.tsx
// SECONDARY section switch (Overview / Zone Analysis / …). Max 6 sections.
// Renders the app-wide pill strip (`TabNavigation`, secondary variant): a
// raised card pill with the teal underline — the style the STP Plant page uses
// for its sections, so every module's section switch looks the same.
// Owner decision 2026-09-02 (review of the Water preview): the kit's underline
// tabs were "not clear or visible enough" and differed from STP.
'use client';
import type { LucideIcon } from 'lucide-react';
import { TabNavigation } from '@/components/shared/tab-navigation';

export type TabItem<T extends string> = { value: T; label: string; icon?: LucideIcon; count?: number };

type Props<T extends string> = {
  tabs: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  'aria-label': string;
  className?: string;
};

export function Tabs<T extends string>({ tabs, value, onChange, className, ...a11y }: Props<T>) {
  return (
    <TabNavigation
      variant="secondary"
      className={className}
      ariaLabel={a11y['aria-label']}
      tabs={tabs.slice(0, 6).map(({ value: v, label, icon, count }) => ({
        key: v,
        label: count != null ? `${label} (${count})` : label,
        icon,
      }))}
      activeTab={value}
      onTabChange={(key) => onChange(key as T)}
    />
  );
}
