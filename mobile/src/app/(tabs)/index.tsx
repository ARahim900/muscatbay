/**
 * Dashboard.
 *
 * The KPI deck and module status, read live through the web app's own data
 * layer. Every figure is either a real reading or "—"; there are no sample
 * numbers anywhere on this screen, including while it loads.
 */
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { MiniBars } from '~/components/charts/mini-bars';
import { PairedLines } from '~/components/charts/paired-lines';
import { Card, PressableCard } from '~/components/ui/card';
import { KpiGrid, KpiTile } from '~/components/ui/kpi';
import { Screen } from '~/components/ui/screen';
import { ErrorState, LoadingState, PartialDataNote } from '~/components/ui/states';
import { StatusPill, statusFromAlertLevel, statusFromLoss } from '~/components/ui/status';
import { Text } from '~/components/ui/text';
import { loadDashboard } from '~/features/data/queries';
import { useSession } from '~/features/auth/session-provider';
import { useAsyncData } from '~/hooks/use-async-data';
import { formatCompact, formatNumber, formatPercent } from '~/lib/format';
import * as haptics from '~/lib/haptics';
import { useTheme } from '~/theme/theme-provider';
import { MODULE_COLORS } from '~/theme/tokens';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, canAccess } = useSession();
  const { data, error, loading, refreshing, refresh } = useAsyncData(loadDashboard, []);

  const greeting = user?.fullName ? user.fullName.split(' ')[0] : (user?.email ?? '');

  const openAlerts = useCallback(() => router.push('/(tabs)/alerts'), [router]);

  if (loading && !data) {
    return (
      <Screen title="Operations" subtitle="Loading live data">
        <LoadingState />
      </Screen>
    );
  }

  if (error && !data) {
    return (
      <Screen title="Operations">
        <ErrorState detail={error} onRetry={() => void refresh()} />
      </Screen>
    );
  }

  if (!data) return null;

  const { water, electricity, stp, contractors, assets, alerts, alertSourcesFailed } = data;
  const criticalAlerts = alerts.filter((a) => a.level === 'error').length;

  return (
    <Screen
      title="Operations"
      subtitle={
        greeting
          ? `${greeting} · updated ${data.loadedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
          : undefined
      }
      onRefresh={refresh}
      refreshing={refreshing}>
      <PartialDataNote sources={alertSourcesFailed} />

      {/* ── Alert summary ─────────────────────────────────────────── */}
      <PressableCard
        onPress={openAlerts}
        urgent={criticalAlerts > 0}
        accessibilityLabel={
          alerts.length === 0
            ? 'No open alerts. Open the alerts tab.'
            : `${alerts.length} open alerts, ${criticalAlerts} critical. Open the alerts tab.`
        }
        className="flex-row items-center gap-3">
        <View className="flex-1 gap-2">
          <Text variant="label">Operational alerts</Text>
          {alerts.length === 0 ? (
            <StatusPill status="normal" label="No conditions flagged" />
          ) : (
            <View className="flex-row flex-wrap gap-2">
              <StatusPill
                status={statusFromAlertLevel(alerts[0].level)}
                label={`${alerts.length} open`}
              />
              {criticalAlerts > 0 ? (
                <StatusPill status="danger" label={`${criticalAlerts} critical`} />
              ) : null}
            </View>
          )}
        </View>
        <ChevronRight size={18} color={MODULE_COLORS.assets} />
      </PressableCard>

      {/* ── Water ─────────────────────────────────────────────────── */}
      {canAccess('water') ? (
        <View className="gap-3">
          <SectionHeader
            title="Water"
            detail={water.period ? `Balance for ${water.period}` : 'No computable month yet'}
            onPress={() => router.push('/module/water')}
          />
          {water.error ? (
            <ErrorState detail={water.error} onRetry={() => void refresh()} />
          ) : (
            <KpiGrid>
              <KpiTile
                label="Supply (A1)"
                value={formatCompact(water.supply)}
                unit="m³"
                footnote={`${water.meterCount} meters in register`}
              />
              <KpiTile
                label="System loss"
                value={formatPercent(water.lossPct)}
                status={statusFromLoss(water.lossPct, water.targetPct)}
                statusLabel={`Target ${water.targetPct}%`}
                footnote={
                  water.loss !== null ? `${formatNumber(Math.round(water.loss))} m³ unaccounted` : undefined
                }
              />
            </KpiGrid>
          )}
          {water.missingMeters ? (
            <Text variant="caption">
              {water.missingMeters} meters have no reading for {water.period} — a missing L2/L3
              inflates apparent loss.
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* ── Electricity ───────────────────────────────────────────── */}
      {canAccess('electricity') ? (
        <View className="gap-3">
          <SectionHeader
            title="Electricity"
            detail={electricity.period ? `Latest month ${electricity.period}` : 'No readings'}
            onPress={() => router.push('/module/electricity')}
          />
          {electricity.error ? (
            <ErrorState detail={electricity.error} onRetry={() => void refresh()} />
          ) : (
            <>
              <KpiGrid>
                <KpiTile
                  label="Consumption"
                  value={formatCompact(electricity.totalKwh)}
                  unit="kWh"
                  footnote={`${electricity.meterCount} meters`}
                />
                <KpiTile
                  label="Missing reads"
                  value={
                    electricity.metersMissingLatest === null
                      ? null
                      : formatNumber(electricity.metersMissingLatest)
                  }
                  status={
                    electricity.metersMissingLatest === null
                      ? 'missing'
                      : electricity.metersMissingLatest > 0
                        ? 'warning'
                        : 'normal'
                  }
                  statusLabel={
                    electricity.metersMissingLatest ? 'Manual read due' : 'All meters read'
                  }
                />
              </KpiGrid>
              {electricity.trend.length > 1 ? (
                <Card>
                  <MiniBars
                    data={electricity.trend}
                    color={MODULE_COLORS.electricity}
                    caption="kWh per month"
                    format={(v) => `${formatCompact(v)} kWh`}
                  />
                </Card>
              ) : null}
            </>
          )}
        </View>
      ) : null}

      {/* ── STP ───────────────────────────────────────────────────── */}
      {canAccess('stp') ? (
        <View className="gap-3">
          <SectionHeader
            title="STP Plant"
            detail={
              stp.windowDays > 0 ? `Last ${stp.windowDays} logged days` : 'No operations logged'
            }
            onPress={() => router.push('/module/stp')}
          />
          {stp.error ? (
            <ErrorState detail={stp.error} onRetry={() => void refresh()} />
          ) : (
            <>
              <KpiGrid>
                <KpiTile
                  label="TSE recovery"
                  value={formatPercent(stp.recoveryPct)}
                  status={
                    stp.recoveryPct === null
                      ? 'missing'
                      : stp.recoveryPct < 80
                        ? 'danger'
                        : stp.recoveryPct < 90
                          ? 'warning'
                          : 'normal'
                  }
                  statusLabel={stp.recoveryPct === null ? 'No data' : 'Target 90%'}
                />
                <KpiTile
                  label="Inlet sewage"
                  value={formatCompact(stp.inlet)}
                  unit="m³"
                  footnote={stp.latestLogDate ? `Last log ${stp.latestLogDate}` : undefined}
                />
              </KpiGrid>
              {stp.daily.length > 1 ? (
                <Card>
                  <PairedLines
                    series={[
                      {
                        name: 'Inlet sewage',
                        color: MODULE_COLORS.stp,
                        values: stp.daily.map((d) => d.inlet),
                      },
                      {
                        name: 'TSE for irrigation',
                        color: colors.chartSeries[1],
                        values: stp.daily.map((d) => d.tse),
                        dashed: true,
                      },
                    ]}
                    caption={`m³ per day over the last ${stp.daily.length} logged days`}
                  />
                </Card>
              ) : null}
            </>
          )}
        </View>
      ) : null}

      {/* ── Register health ───────────────────────────────────────── */}
      <View className="gap-3">
        <Text variant="heading">Registers</Text>
        <KpiGrid>
          {canAccess('contractors') ? (
            <KpiTile
              label="Contracts expiring"
              value={
                contractors.error ? null : formatNumber(contractors.expiringSoon + contractors.expired)
              }
              status={
                contractors.error
                  ? 'missing'
                  : contractors.expired > 0
                    ? 'danger'
                    : contractors.expiringSoon > 0
                      ? 'warning'
                      : 'normal'
              }
              statusLabel={
                contractors.expired > 0 ? `${contractors.expired} already expired` : 'Within 60 days'
              }
              footnote={contractors.error ?? `${contractors.active} active contracts`}
            />
          ) : null}
          {canAccess('assets') ? (
            <KpiTile
              label="Assets registered"
              value={assets.summary ? formatNumber(assets.summary.total) : null}
              status={
                assets.summary
                  ? assets.summary.highCriticalityNoAmc > 0
                    ? 'warning'
                    : 'normal'
                  : 'missing'
              }
              statusLabel={
                assets.summary
                  ? `${assets.summary.highCriticalityNoAmc} high-criticality without AMC`
                  : 'No data'
              }
              footnote={assets.error ?? undefined}
            />
          ) : null}
        </KpiGrid>
      </View>
    </Screen>
  );
}

/**
 * A section title with its "Open" affordance.
 *
 * The affordance is a real `Pressable` at the 44pt floor the rest of this app
 * enforces — it used to be a bare `<Text onPress>` whose target was about 34pt
 * tall and only as wide as the word, which is the one control on this screen a
 * gloved thumb could miss. It also carries the tap haptic every other pressable
 * here gives, and `text-ring` was swapped for a link colour that passes AA in
 * both themes: the light ring `#4A8E93` was 3.5:1 on the page, under the 4.5:1
 * floor for body text.
 */
function SectionHeader({
  title,
  detail,
  onPress,
}: {
  title: string;
  detail: string;
  onPress: () => void;
}) {
  const { theme, colors } = useTheme();
  // Brand purple carries the link in light mode (8.9:1 on the page) and brand
  // teal in dark (12:1); each is unreadable in the other theme.
  const link = theme === 'dark' ? colors.secondary : colors.primary;

  return (
    <View className="flex-row items-end justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text variant="heading">{title}</Text>
        <Text variant="caption">{detail}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${title}`}
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        className="min-h-[44px] flex-row items-center gap-1 rounded-sm px-3 active:bg-muted">
        <Text className="font-sans-medium text-sm" style={{ color: link }}>
          Open
        </Text>
        <ChevronRight size={16} color={link} />
      </Pressable>
    </View>
  );
}
