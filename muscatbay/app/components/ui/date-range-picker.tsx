// components/ui/date-range-picker.tsx
// ONE period control. Replaces the stack of "Filter by year", the slider,
// start/end selects and the 3M/6M/1Y/YTD row.
//   presets on the left · From / To month selects · helper text on the right
// Every control is a visible, bordered, shadowed button or select, and the
// preset that matches the current range is filled — owner decision 2026-09-02
// (review of the Water preview): the kit's flat text presets and borderless
// selects were "nearly invisible, with no indication of where to select".
'use client';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export type MonthKey = string; // "2026-01"
type Preset = '3M' | '6M' | '1Y' | 'YTD';
const PRESETS: Preset[] = ['3M', '6M', '1Y', 'YTD'];

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
  const endIdx = months.length - 1;
  const rangeFor = (p: Preset): { start: MonthKey; end: MonthKey } => {
    if (p === 'YTD') {
      const first = months.find(m => m.startsWith(last.slice(0, 4))) ?? months[0];
      return { start: first, end: last };
    }
    const n = { '3M': 3, '6M': 6, '1Y': 12 }[p];
    return { start: months[Math.max(0, endIdx - n + 1)], end: last };
  };
  const activePreset = PRESETS.find(p => {
    const r = rangeFor(p);
    return r.start === value.start && r.end === value.end;
  });
  const count = months.indexOf(value.end) - months.indexOf(value.start) + 1;

  const preset = 'h-9 rounded-control border px-3 text-label transition-colors duration-200';
  const select = 'h-9 appearance-none rounded-control border border-line bg-card pl-3 pr-8 text-label font-medium text-fg shadow-card outline-none hover:border-primary';

  return (
    <div className={cn('flex flex-wrap items-center gap-3 rounded-card border border-line bg-card px-4 py-3 shadow-card', className)}>
      <span className="inline-flex items-center gap-2 text-label text-fg">
        <Calendar size={16} strokeWidth={2} className="shrink-0 text-primary dark:text-accent" aria-hidden />
        Period
      </span>
      <div className="inline-flex gap-1.5" role="group" aria-label="Quick ranges">
        {PRESETS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(rangeFor(p))}
            aria-pressed={activePreset === p}
            className={cn(preset, activePreset === p
              ? 'border-primary bg-primary text-on-primary shadow-card'
              : 'border-line bg-card text-fg shadow-card hover:border-primary hover:bg-component')}
          >
            {p}
          </button>
        ))}
      </div>
      <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
      <label className="flex items-center gap-2 text-label text-muted">
        From
        <span className="relative">
          <select className={select} value={value.start} onChange={e => onChange({ ...value, start: e.target.value })}>
            {months.filter(m => m <= value.end).map(m => <option key={m} value={m}>{fmt(m)}</option>)}
          </select>
          <ChevronDown size={16} strokeWidth={2} aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted" />
        </span>
      </label>
      <label className="flex items-center gap-2 text-label text-muted">
        To
        <span className="relative">
          <select className={select} value={value.end} onChange={e => onChange({ ...value, end: e.target.value })}>
            {months.filter(m => m >= value.start).map(m => <option key={m} value={m}>{fmt(m)}</option>)}
          </select>
          <ChevronDown size={16} strokeWidth={2} aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted" />
        </span>
      </label>
      <span className="ml-auto text-caption tabular-nums text-muted">
        {count} of {months.length} months selected
      </span>
    </div>
  );
}
