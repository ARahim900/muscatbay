/**
 * Button — 5px radius, weight 500 (DESIGN_SYSTEM.md §4/§6).
 *
 * Minimum 48pt height rather than the 44pt floor: field users are often gloved
 * or working one-handed on a tablet in a plant room.
 */
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import * as haptics from '~/lib/haptics';
import { useTheme } from '~/theme/theme-provider';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-primary active:opacity-85',
  secondary: 'bg-secondary active:opacity-85',
  ghost: 'border border-border bg-transparent active:bg-muted',
  destructive: 'bg-destructive active:opacity-85',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  ghost: 'text-foreground',
  destructive: 'text-destructive-foreground',
};

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  className,
}: ButtonProps) {
  const inactive = disabled || loading;
  const { colors } = useTheme();
  const spinner =
    variant === 'ghost'
      ? undefined
      : variant === 'secondary'
        ? colors.secondaryForeground
        : colors.primaryForeground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      className={cn(
        'min-h-[48px] flex-row items-center justify-center gap-2 rounded-sm px-4',
        CONTAINER[variant],
        inactive && 'opacity-50',
        className,
      )}>
      {loading ? (
        <ActivityIndicator size="small" color={spinner} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text className={cn('font-sans-medium text-base', LABEL[variant])}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
