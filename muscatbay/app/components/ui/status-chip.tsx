// components/ui/StatusChip.tsx
// The ONE data-source indicator. Four states, one layout, one size.
// Replaces: "Live Data (Supabase) · LIVE", the two-row "DATA THROUGH" card,
// "Connecting…", "Connected + OFFLINE", and the Settings "Authenticated" pill.
import { cn } from '@/lib/cn';

type State = 'live' | 'stale' | 'offline' | 'connecting';

type Props = {
  state: State;
  syncedAt?: string;   // "12:34"
  dataThrough?: string; // "01 Jul" — shown for `stale`
  daysBehind?: number;  // shown for `stale`
  className?: string;
};

const dot: Record<State, string> = {
  live: 'bg-success', stale: 'bg-warning', offline: 'bg-danger', connecting: 'bg-neutral animate-pulse',
};

export function StatusChip({ state, syncedAt, dataThrough, daysBehind, className }: Props) {
  const label =
    state === 'live' ? 'Live' :
    state === 'stale' ? `Data to ${dataThrough ?? '—'}${daysBehind != null ? ` · ${daysBehind} d behind` : ''}` :
    state === 'offline' ? 'Offline' : 'Connecting…';
  const detail =
    state === 'connecting' ? null :
    state === 'offline' ? (syncedAt ? `Last seen ${syncedAt}` : null) :
    (syncedAt ? `Synced ${syncedAt}` : null);

  return (
    <div role="status" className={cn(
      'inline-flex h-9 items-center gap-2 rounded-pill border border-line bg-card px-3 shadow-card', className)}>
      <span aria-hidden className={cn('h-2 w-2 rounded-pill', dot[state])} />
      <span className="text-label text-fg">{label}</span>
      {detail && <span className="text-caption tabular-nums text-muted">{detail}</span>}
    </div>
  );
}
