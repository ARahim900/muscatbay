/**
 * Card surface — `--card` background, `--border` hairline, 10.5px radius
 * (BRAND_DESIGN.md §8). Flat by default: elevation is reserved for things that
 * genuinely sit above the page, not for decoration.
 */
import { Pressable, View, type ViewProps } from 'react-native';

import { cn } from '~/lib/cn';
import * as haptics from '~/lib/haptics';

export interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, ...rest }: CardProps) {
  return <View className={cn('rounded-lg border border-border bg-card p-4', className)} {...rest} />;
}

export interface PressableCardProps extends CardProps {
  onPress: () => void;
  accessibilityLabel: string;
  /** Set for rows that open something carrying a critical alert. */
  urgent?: boolean;
}

/**
 * A tappable card.
 *
 * 44pt minimum target, a light haptic on press (or a warning pulse when the row
 * carries an alarm), and a pressed state that is a tint rather than a scale
 * animation — operators may be wearing gloves and reading in low light.
 */
export function PressableCard({
  className,
  onPress,
  accessibilityLabel,
  urgent = false,
  ...rest
}: PressableCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        if (urgent) haptics.warn();
        else haptics.tap();
        onPress();
      }}
      className={cn(
        'min-h-[44px] rounded-lg border border-border bg-card p-4',
        'active:bg-muted',
        className,
      )}
      {...rest}
    />
  );
}
