/**
 * KPI tile.
 *
 * DESIGN_SYSTEM.md §3 "KPI Value Rule": 24px / 600, tabular numerals, tokenised
 * foreground. The value colour never shifts to red or green — that semantic
 * belongs to the status chip beneath it, so the number itself stays neutral and
 * readable.
 *
 * A `null` value renders "—". There is no zero fallback anywhere in this app.
 */
import { View } from 'react-native';

import { Card } from '~/components/ui/card';
import { StatusPill } from '~/components/ui/status';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import { PLACEHOLDER } from '~/lib/format';
import type { StatusKey } from '~/theme/tokens';

export interface KpiTileProps {
  label: string;
  /** Pre-formatted, or `null` when there is genuinely no reading. */
  value: string | null;
  unit?: string;
  /** Where the figure comes from, or why it is missing. */
  footnote?: string;
  status?: StatusKey;
  statusLabel?: string;
  className?: string;
}

export function KpiTile({
  label,
  value,
  unit,
  footnote,
  status,
  statusLabel,
  className,
}: KpiTileProps) {
  const shown = value ?? PLACEHOLDER;

  return (
    // `basis-[48%] grow`, not `flex-1`: inside a wrapping row React Native gives
    // `flex: 1` a zero basis, so every tile collapses. An explicit basis gives a
    // clean two-up grid and lets a lone odd tile stretch to full width.
    <Card className={cn('grow basis-[48%] gap-2 p-4', className)}>
      <Text variant="label" numberOfLines={2}>
        {label}
      </Text>

      <View className="flex-row items-baseline gap-1">
        <Text
          variant="display"
          style={{ fontVariant: ['tabular-nums'] }}
          accessibilityLabel={value === null ? `${label}: no data` : `${label}: ${shown} ${unit ?? ''}`}
          numberOfLines={1}>
          {shown}
        </Text>
        {unit && value !== null ? (
          <Text variant="caption" className="text-muted-foreground">
            {unit}
          </Text>
        ) : null}
      </View>

      {status ? <StatusPill status={status} label={statusLabel} /> : null}

      {footnote ? (
        <Text variant="caption" numberOfLines={2}>
          {footnote}
        </Text>
      ) : null}
    </Card>
  );
}

/** Two-column KPI deck. Two-up is the densest layout that stays legible on a phone. */
export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap gap-3">{children}</View>;
}
