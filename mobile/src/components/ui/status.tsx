/**
 * Status presentation.
 *
 * WCAG 1.4.1: status is NEVER carried by colour alone. Every helper here
 * returns a colour together with a shape-distinct icon and a text label, and
 * `StatusPill` always renders all three — the same contract the web app's
 * shared inspection toolkit and `<StatusIndicator />` enforce.
 */
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Clock,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

import type { OperationalAlertLevel } from '@/lib/operational-alerts';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import { useTheme } from '~/theme/theme-provider';
import type { StatusKey, ThemeName } from '~/theme/tokens';
import { PALETTE } from '~/theme/tokens';

export interface StatusPresentation {
  key: StatusKey;
  color: string;
  icon: LucideIcon;
  label: string;
  /** NativeWind classes for the tinted background + border. */
  tintClass: string;
}

const PRESENTATION: Record<StatusKey, Omit<StatusPresentation, 'key' | 'color'>> = {
  normal: {
    icon: CheckCircle2,
    label: 'Normal',
    tintClass: 'bg-status-normal/10 border-status-normal/30',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Watch',
    tintClass: 'bg-status-warning/10 border-status-warning/30',
  },
  danger: {
    icon: XCircle,
    label: 'Critical',
    tintClass: 'bg-status-danger/10 border-status-danger/30',
  },
  info: { icon: Info, label: 'Information', tintClass: 'bg-status-info/10 border-status-info/30' },
  stale: {
    // A clock, not the warning triangle. `stale` and `warning` share the §2.2
    // warning colour, so the icon is the only thing left to tell them apart —
    // and "this reading is old" is a clock, not a threshold breach.
    icon: Clock,
    label: 'Stale',
    tintClass: 'bg-status-stale/10 border-status-stale/30',
  },
  missing: {
    icon: CircleHelp,
    label: 'No data',
    tintClass: 'bg-status-missing/10 border-status-missing/30',
  },
};

/**
 * The colour half is per-theme (DESIGN_SYSTEM.md §2.2), so this needs to know
 * which theme is rendering. Inside a component prefer `useStatusPresentation`.
 */
export function presentation(key: StatusKey, theme: ThemeName): StatusPresentation {
  return { key, color: PALETTE[theme].status[key], ...PRESENTATION[key] };
}

export function useStatusPresentation(key: StatusKey): StatusPresentation {
  const { theme } = useTheme();
  return presentation(key, theme);
}

/** Map the shared alert engine's level onto the status vocabulary. */
export function statusFromAlertLevel(level: OperationalAlertLevel): StatusKey {
  if (level === 'error') return 'danger';
  if (level === 'warning') return 'warning';
  return 'info';
}

/**
 * Loss percentage → severity.
 *
 * Bands mirror `statusFromLoss` in `lib/water-monthly-data.ts` (≤ target Normal,
 * ≤ 25% Watch, above Critical). That function returns CSS `var(--…)` strings,
 * which React Native cannot resolve, so the mapping — not the thresholds — is
 * restated here.
 */
export function statusFromLoss(lossPct: number | null, targetPct: number): StatusKey {
  if (lossPct === null || !Number.isFinite(lossPct)) return 'missing';
  if (lossPct < 0) return 'info';
  if (lossPct <= targetPct) return 'normal';
  if (lossPct <= 25) return 'warning';
  return 'danger';
}

export interface StatusPillProps {
  status: StatusKey;
  /** Overrides the generic severity word when the raw value is more useful. */
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const p = useStatusPresentation(status);
  const Icon = p.icon;
  const text = label ?? p.label;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${p.label}: ${text}`}
      className={cn(
        'flex-row items-center gap-2 self-start rounded-sm border px-2 py-1',
        p.tintClass,
        className,
      )}>
      {/* 16px: the inline icon size in DESIGN_SYSTEM.md §1. The old 13px was
          below the smallest size the system defines and lost the shape cue that
          keeps status from being colour-only. */}
      <Icon size={16} color={p.color} />
      <Text className="font-sans-medium text-xs text-foreground">{text}</Text>
    </View>
  );
}

/** A 6pt dot, only ever rendered next to a text label. */
export function StatusDot({ status }: { status: StatusKey }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ backgroundColor: colors.status[status] }}
      className="h-1.5 w-1.5 rounded-full"
    />
  );
}
