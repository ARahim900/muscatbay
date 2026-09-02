// Design-system primitives — DESIGN_SYSTEM.md §6. One way to do each thing.
//
// Files are kebab-case per CLAUDE.md. `Button` and `Badge` live in
// `mb-button.tsx` / `mb-badge.tsx` because the legacy shadcn `button.tsx` /
// `badge.tsx` still serve the pages that have not been migrated yet; on a
// case-insensitive filesystem the two names would otherwise collide.
export { Breadcrumb } from './breadcrumb';
export { PageHeader } from './page-header';
export { StatusChip } from './status-chip';
export { SegmentedControl, type SegOption } from './segmented-control';
export { Tabs, type TabItem } from './tabs';
export { KpiCard } from './kpi-card';
export { SectionCard } from './section-card';
export { Badge } from './mb-badge';
export { Button } from './mb-button';
export { ChartFrame, chartTheme } from './chart-frame';
export { DateRangePicker } from './date-range-picker';
export { EmbedFrame } from './embed-frame';
