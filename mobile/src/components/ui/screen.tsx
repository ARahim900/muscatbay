/**
 * Screen shell — safe areas, page background, offline banner, pull-to-refresh.
 *
 * Every scrollable screen goes through here so the refresh gesture, the header
 * treatment and the safe-area insets behave identically across modules
 * ("one system, many modules").
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, View } from 'react-native';

import { OfflineBanner } from '~/components/offline-banner';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import * as haptics from '~/lib/haptics';
import { useTheme } from '~/theme/theme-provider';

export interface ScreenProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
  refreshing?: boolean;
  /** Set for screens that manage their own scrolling (WebView, FlatList). */
  scroll?: boolean;
  contentClassName?: string;
}

export function Screen({
  title,
  subtitle,
  children,
  onRefresh,
  refreshing = false,
  scroll = true,
  contentClassName,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const header =
    title || subtitle ? (
      <View className="gap-1 px-4 pb-3 pt-1">
        {title ? <Text variant="title">{title}</Text> : null}
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
    ) : null;

  const body = <View className={cn('gap-3 px-4 pb-10', contentClassName)}>{children}</View>;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <OfflineBanner />
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                tintColor={colors.mutedForeground}
                colors={[colors.primary]}
                progressBackgroundColor={colors.card}
                onRefresh={() => {
                  haptics.tap();
                  void Promise.resolve(onRefresh()).then(haptics.success, haptics.failure);
                }}
              />
            ) : undefined
          }>
          {header}
          {body}
        </ScrollView>
      ) : (
        <>
          {header}
          <View className="flex-1">{children}</View>
        </>
      )}
    </View>
  );
}
