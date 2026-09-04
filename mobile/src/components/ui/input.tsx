/**
 * Text field — 7px radius (DESIGN_SYSTEM.md §4), tokenised border and
 * placeholder colour, focus ring in `--ring`.
 */
import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import { useTheme } from '~/theme/theme-provider';

export interface InputProps extends TextInputProps {
  label: string;
  /** Validation or submission failure for this field. */
  error?: string | null;
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.mutedForeground}
        style={{ color: colors.foreground }}
        onFocus={(event) => {
          setFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          rest.onBlur?.(event);
        }}
        className={cn(
          'min-h-[48px] rounded-md border bg-card px-3 font-sans text-base',
          focused ? 'border-ring' : 'border-input',
          error && 'border-status-danger',
          className,
        )}
        {...rest}
      />
      {error ? (
        <Text variant="caption" className="text-status-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
