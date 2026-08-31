/**
 * Typography primitives.
 *
 * Inter ships to React Native as one font file per weight, so weight is chosen
 * by family (`font-sans-semibold`) rather than by `fontWeight`. Routing every
 * label through these components keeps that detail in one place and keeps the
 * type scale (BRAND_DESIGN.md §3) consistent across screens.
 */
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '~/lib/cn';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'mono';

const VARIANTS: Record<Variant, string> = {
  // KPI values: 24px / 600. BRAND_DESIGN.md §3 "KPI Value Rule".
  display: 'font-sans-semibold text-2xl text-foreground',
  title: 'font-sans-semibold text-xl text-foreground',
  heading: 'font-sans-semibold text-lg text-foreground',
  body: 'font-sans text-base text-foreground',
  label: 'font-sans-medium text-sm text-muted-foreground',
  caption: 'font-sans text-xs text-muted-foreground',
  mono: 'font-mono text-xs text-muted-foreground',
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  className?: string;
}

export function Text({ variant = 'body', className, ...rest }: TextProps) {
  return <RNText className={cn(VARIANTS[variant], className)} {...rest} />;
}

/** Meter ids, account numbers and asset tags — always in the mono face. */
export function MeterId({ className, ...rest }: RNTextProps & { className?: string }) {
  return <RNText className={cn('font-mono text-xs text-muted-foreground', className)} {...rest} />;
}
