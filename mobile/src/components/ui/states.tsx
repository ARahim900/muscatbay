/**
 * Loading / empty / error states.
 *
 * These exist so a screen never has a fourth, unnamed state where a failed read
 * looks identical to "there is nothing to show". Every consumer must pick one.
 */
import { AlertOctagon, Inbox, RefreshCw } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Card } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import * as haptics from '~/lib/haptics';
import { useTheme } from '~/theme/theme-provider';

export function LoadingState({ label = 'Loading live data…' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View className="items-center gap-3 py-12" accessibilityRole="progressbar">
      <ActivityIndicator color={colors.mutedForeground} />
      <Text variant="caption">{label}</Text>
    </View>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  const { colors } = useTheme();
  return (
    <Card className="items-center gap-2 py-8">
      <Inbox size={22} color={colors.mutedForeground} />
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      {detail ? (
        <Text variant="caption" className="text-center">
          {detail}
        </Text>
      ) : null}
    </Card>
  );
}

export interface ErrorStateProps {
  title?: string;
  /** The real failure text. Never replaced with a generic apology. */
  detail: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Could not load this data',
  detail,
  onRetry,
  className,
}: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <Card className={cn('gap-3 border-status-danger/30 bg-status-danger/5', className)}>
      <View className="flex-row items-center gap-2">
        <AlertOctagon size={18} color={colors.status.danger} />
        <Text variant="heading" className="flex-1">
          {title}
        </Text>
      </View>
      <Text variant="caption" className="text-foreground/80">
        {detail}
      </Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry loading"
          onPress={() => {
            haptics.tap();
            onRetry();
          }}
          className="min-h-[44px] flex-row items-center justify-center gap-2 rounded-sm bg-primary px-4 active:opacity-80">
          <RefreshCw size={16} color={colors.primaryForeground} />
          <Text className="font-sans-medium text-sm text-primary-foreground">Retry</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

/** Inline note for a partial failure — some sources loaded, some did not. */
export function PartialDataNote({ sources }: { sources: string[] }) {
  const { colors } = useTheme();
  if (sources.length === 0) return null;
  return (
    <View className="flex-row items-center gap-2 rounded-sm border border-status-stale/30 bg-status-stale/10 px-3 py-2">
      <AlertOctagon size={16} color={colors.status.stale} />
      <Text variant="caption" className="flex-1 text-foreground/80">
        {sources.join(', ')} could not be read, so this view is incomplete. It is not evidence that
        nothing is wrong.
      </Text>
    </View>
  );
}
