/**
 * Alerts.
 *
 * Renders `@/lib/operational-alerts` — the web app's rules engine — natively.
 * That module is pure and takes `now` injected, so it runs here byte-for-byte:
 * the topbar bell on muscatbay.work and this screen cannot disagree about
 * whether anything is wrong.
 *
 * The app IDENTIFIES and DISPLAYS conditions. There is deliberately no
 * acknowledge, assign, due-date or close-out action anywhere on this screen.
 *
 * Severity is always colour + icon + text (WCAG 1.4.1).
 */
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, PressableCard } from '~/components/ui/card';
import { Screen } from '~/components/ui/screen';
import { ErrorState, LoadingState, PartialDataNote } from '~/components/ui/states';
import { StatusPill, statusFromAlertLevel } from '~/components/ui/status';
import { Text } from '~/components/ui/text';
import { loadAlerts } from '~/features/data/queries';
import { useAsyncData } from '~/hooks/use-async-data';
import { MODULES_BY_KEY } from '~/lib/modules';
import { useTheme } from '~/theme/theme-provider';

export default function AlertsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, error, loading, refreshing, refresh } = useAsyncData(loadAlerts, []);

  if (loading && !data) {
    return (
      <Screen title="Alerts">
        <LoadingState label="Evaluating operational rules…" />
      </Screen>
    );
  }

  if (error && !data) {
    return (
      <Screen title="Alerts">
        <ErrorState detail={error} onRetry={() => void refresh()} />
      </Screen>
    );
  }

  if (!data) return null;

  const { alerts, failedSources, evaluatedAt } = data;

  return (
    <Screen
      title="Alerts"
      subtitle={`Evaluated ${evaluatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · water loss, contract expiry, plant failures`}
      onRefresh={refresh}
      refreshing={refreshing}>
      <PartialDataNote sources={failedSources} />

      {alerts.length === 0 && failedSources.length === 0 ? (
        <Card className="items-center gap-2 py-8">
          <CheckCircle2 size={24} color={colors.status.normal} />
          <Text variant="heading">No conditions flagged</Text>
          <Text variant="caption" className="text-center">
            Water loss is within target, no active contract is past its end date, and the STP daily
            log is current.
          </Text>
        </Card>
      ) : null}

      {alerts.map((alert) => {
        const status = statusFromAlertLevel(alert.level);
        const module = MODULES_BY_KEY.get(alert.module);

        return (
          <PressableCard
            key={alert.id}
            urgent={alert.level === 'error'}
            accessibilityLabel={`${status} alert. ${alert.title}. ${alert.message}`}
            onPress={() => {
              if (module) router.push(`/module/${module.key}`);
            }}
            className="gap-3">
            <View className="flex-row items-start justify-between gap-3">
              <Text variant="heading" className="flex-1">
                {alert.title}
              </Text>
              <StatusPill status={status} />
            </View>

            <Text variant="body" className="text-foreground/85">
              {alert.message}
            </Text>

            {module ? (
              <View className="flex-row items-center gap-2">
                <View
                  style={{ backgroundColor: module.accent }}
                  className="h-1.5 w-1.5 rounded-full"
                />
                <Text variant="caption">{module.title}</Text>
              </View>
            ) : null}
          </PressableCard>
        );
      })}

      {alerts.length > 0 ? (
        <Text variant="caption" className="pt-1">
          This app identifies and displays conditions only. Assignment, scheduling and close-out are
          handled outside it.
        </Text>
      ) : null}
    </Screen>
  );
}
