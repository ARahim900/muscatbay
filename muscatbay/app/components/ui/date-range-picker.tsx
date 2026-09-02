// components/ui/DateRangePicker.tsx
// ONE period control, 44px tall. Replaces the stack of "Filter by year",
// the slider, start/end selects and the 3M/6M/1Y/YTD row.
//   presets on the left · start / end month selects · helper text on the right
'use client';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';

export type MonthKey = string; // "2026-01"
type Preset = '3M' | '6M' | '1Y' | 'YTD';

type Props = {
  months: MonthKey[];                       // every month that has data, ascending
  value: { start: MonthKey; end: MonthKey };
  onChange: (v: { start: MonthKey; end: MonthKey }) => void;
  className?: string;
};

const fmt = (k: MonthKey) =>
  new Date(`${k}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

export function DateRangePicker({ months, value, onChange, className }: Props) {
  const last = months[months.length - 1];
  const applyPreset = (p: Preset) => {
    const endIdx = months.length - 1;
    if (p === 'YTD') {
      const first = months.find(m => m.startsWith(last.slice(0, 4))) ?? months[0];
      return onChange({ start: first, end: last });
    }
    const n = { '3M': 3, '6M': 6, '1Y': 12 }[p];
    onChange({ start: months[Math.max(0, endIdx - n + 1)], end: last });
  };
  const count = months.indexOf(value.end) - months.indexOf(value.start) + 1;
  const select = 'h-8 rounded-control border border-line bg-card px-2 text-label text-fg';

  return (
    <div className={cn('flex h-11 items-center gap-3 rounded-card border border-line bg-card px-3 shadow-card', className)}>
      <Calendar size={16} strokeWidth={2} className="shrink-0 text-muted" aria-hidden />
      <div className="inline-flex gap-1" role="group" aria-label="Quick ranges">
        {(['3M', '6M', '1Y', 'YTD'] as Preset[]).map(p => (
          <button key={p} type="button" onClick={() => applyPreset(p)}
            className="h-7 rounded-control px-2 text-caption font-medium text-muted hover:bg-component hover:text-fg">
            {p}
          </button>
        ))}
      </div>
      <span aria-hidden className="h-5 w-px bg-line" />
      <label className="flex items-center gap-1.5 text-caption text-muted">
        From
        <select className={select} value={value.start} onChange={e => onChange({ ...value, start: e.target.value })}>
          {months.filter(m => m <= value.end).map(m => <option key={m} value={m}>{fmt(m)}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-caption text-muted">
        To
        <select className={select} value={value.end} onChange={e => onChange({ ...value, end: e.target.value })}>
          {months.filter(m => m >= value.start).map(m => <option key={m} value={m}>{fmt(m)}</option>)}
        </select>
      </label>
      <span className="ml-auto text-caption tabular-nums text-muted">
        {count} of {months.length} months
      </span>
    </div>
  );
}
