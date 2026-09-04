/**
 * Per-module KPI summary.
 *
 * Native KPIs at the top (real readings only), then explicit links into the
 * dense analytical pages that are still the web app inside a WebView. Those
 * links are framed honestly rather than dressed up as native screens.
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, ExternalLink } from 'lucide-react-native';
import { useCallback } from 'react';
import { View } from 'react-native';

import { MiniBars } from '~/components/charts/mini-bars';
import { PairedLines } from '~/components/charts/paired-lines';
import { Card, PressableCard } from '~/components/ui/card';
import { KpiGrid, KpiTile } from '~/components/ui/kpi';
import { MeterId, Text } from '~/components/ui/text';
import { Screen } from '~/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '~/components/ui/states';
import { StatusPill, statusFromLoss } from '~/components/ui/status';
import { useSession } from '~/features/auth/session-provider';
import {
  loadContractorsSummary,
  loadElectricitySummary,
  loadFireSummary,
  loadHvacSummary,
  loadStpSummary,
  loadWaterSummary,
  loadAssetsSummary,
} from '~/features/data/queries';
import { useAsyncData } from '~/hooks/use-async-data';
import { formatCompact, formatDateUTC, formatNumber, formatPercent } from '~/lib/format';
import { MODULES_BY_KEY, type ModuleDefinition } from '~/lib/modules';
import { useTheme } from '~/theme/theme-provider';

export default function ModuleScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const module = key ? MODULES_BY_KEY.get(key) : undefined;
  const { canAccess } = useSession();

  if (!module) {
    return (
      <Screen title="Unknown module">
        <EmptyState title="No such module" detail={`"${key}" is not a Muscat Bay module.`} />
      </Screen>
    );
  }

  if (!canAccess(module.key)) {
    return (
      <Screen title={module.title}>
        <EmptyState
          title="Not available for your role"
          detail="Your account does not have access to this module. Ask an administrator if you need it."
        />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: module.title }} />
      <ModuleBody module={module} />
    </>
  );
}

function ModuleBody({ module }: { module: ModuleDefinition }) {
  switch (module.key) {
    case 'water':
      return <WaterModule module={module} />;
    case 'electricity':
      return <ElectricityModule module={module} />;
    case 'stp':
      return <StpModule module={module} />;
    case 'contractors':
      return <ContractorsModule module={module} />;
    case 'assets':
      return <AssetsModule module={module} />;
    case 'hvac':
      return <HvacModule module={module} />;
    case 'firefighting':
      return <FireModule module={module} />;
    case 'pest-control':
      return <PestModule module={module} />;
  }
}

/* ------------------------------------------------------------------ */
/*  Shared pieces                                                      */
/* ------------------------------------------------------------------ */

function EmbeddedLinks({ module }: { module: ModuleDefinition }) {
  const router = useRouter();
  const { colors } = useTheme();

  if (module.embeds.length === 0) return null;

  return (
    <View className="gap-3 pt-2">
      <View className="gap-1">
        <Text variant="heading">Full analysis</Text>
        <Text variant="caption">
          These open the muscatbay.work page inside the app, signed in as you. They are the web view
          for now — a native version is planned.
        </Text>
      </View>

      {module.embeds.map((view) => (
        <PressableCard
          key={view.id}
          accessibilityLabel={`Open ${view.title} as an embedded web page`}
          onPress={() => router.push(`/embed/${view.id}`)}
          className="flex-row items-center gap-3">
          <ExternalLink size={17} color={module.accent} />
          <View className="flex-1 gap-1">
            <Text variant="body" className="font-sans-medium">
              {view.title}
            </Text>
            <Text variant="caption" numberOfLines={2}>
              {view.note}
            </Text>
          </View>
          <ChevronRight size={17} color={colors.mutedForeground} />
        </PressableCard>
      ))}
    </View>
  );
}

/** Standard loading / error / content wrapper for a module screen. */
function ModuleShell({
  module,
  subtitle,
  loading,
  error,
  refreshing,
  refresh,
  children,
}: {
  module: ModuleDefinition;
  subtitle?: string;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <Screen title={module.title} subtitle={subtitle} onRefresh={refresh} refreshing={refreshing}>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState detail={error} onRetry={() => void refresh()} /> : null}
      {!loading && !error ? children : null}
      <EmbeddedLinks module={module} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/*  Water                                                              */
/* ------------------------------------------------------------------ */

function WaterModule({ module }: { module: ModuleDefinition }) {
  const { data, error, loading, refreshing, refresh } = useAsyncData(loadWaterSummary, []);
  const summaryError = error ?? data?.error ?? null;

  return (
    <ModuleShell
      module={module}
      subtitle={data?.period ? `Balance for ${data.period}` : undefined}
      loading={loading && !data}
      error={summaryError}
      refreshing={refreshing}
      refresh={refresh}>
      {data ? (
        <>
          <KpiGrid>
            <KpiTile label="Supply (A1)" value={formatCompact(data.supply)} unit="m³" />
            <KpiTile label="Distributed (A2)" value={formatCompact(data.distributed)} unit="m³" />
            <KpiTile label="Consumed (A3)" value={formatCompact(data.consumed)} unit="m³" />
            <KpiTile
              label="System loss"
              value={formatPercent(data.lossPct)}
              status={statusFromLoss(data.lossPct, data.targetPct)}
              statusLabel={`Target ${data.targetPct}%`}
            />
          </KpiGrid>

          {data.negatives > 0 ? (
            <Card className="gap-2 border-status-warning/30 bg-status-warning/5">
              <Text variant="heading">{data.negatives} negative readings in the source</Text>
              <Text variant="caption">
                Physically impossible values are shown as recorded, not rewritten to zero — they
                deflate the balance and need correcting at source.
              </Text>
            </Card>
          ) : null}

          <View className="gap-3">
            <Text variant="heading">Zones by loss</Text>
            {data.zones.length === 0 ? (
              <EmptyState title="No zone readings for this period" />
            ) : (
              data.zones.map((zone) => (
                <Card key={zone.name} className="gap-2">
                  <View className="flex-row items-start justify-between gap-3">
                    <Text variant="body" className="flex-1 font-sans-medium">
                      {zone.name}
                    </Text>
                    <StatusPill
                      status={statusFromLoss(zone.lossPct, data.targetPct)}
                      label={formatPercent(zone.lossPct)}
                    />
                  </View>
                  <View className="flex-row gap-4">
                    <Text variant="caption">Bulk {formatCompact(zone.bulk)} m³</Text>
                    <Text variant="caption">End-user {formatCompact(zone.end)} m³</Text>
                    {zone.missing > 0 ? (
                      <Text variant="caption" className="text-status-warning">
                        {zone.missing} missing
                      </Text>
                    ) : null}
                  </View>
                </Card>
              ))
            )}
          </View>
        </>
      ) : null}
    </ModuleShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Electricity                                                        */
/* ------------------------------------------------------------------ */

function ElectricityModule({ module }: { module: ModuleDefinition }) {
  const { data, error, loading, refreshing, refresh } = useAsyncData(loadElectricitySummary, []);

  return (
    <ModuleShell
      module={module}
      subtitle={data?.period ? `Latest month ${data.period}` : undefined}
      loading={loading && !data}
      error={error ?? data?.error ?? null}
      refreshing={refreshing}
      refresh={refresh}>
      {data ? (
        <>
          <KpiGrid>
            <KpiTile label="Total consumption" value={formatCompact(data.totalKwh)} unit="kWh" />
            <KpiTile
              label="Meters"
              value={formatNumber(data.meterCount)}
              footnote={
                data.metersMissingLatest !== null
                  ? `${data.metersMissingLatest} with no reading this month`
                  : undefined
              }
            />
          </KpiGrid>

          {data.trend.length > 1 ? (
            <Card>
              <MiniBars
                data={data.trend}
                color={module.accent}
                caption="kWh per month"
                format={(v) => `${formatCompact(v)} kWh`}
              />
            </Card>
          ) : null}

          <View className="gap-3">
            <Text variant="heading">Highest consumers · {data.period ?? '—'}</Text>
            {data.top.length === 0 ? (
              <EmptyState title="No readings for the latest month" />
            ) : (
              data.top.map((meter) => (
                <Card key={meter.id} className="flex-row items-center gap-3">
                  <View className="flex-1 gap-1">
                    <Text variant="body" numberOfLines={1}>
                      {meter.name}
                    </Text>
                    <MeterId>{meter.account || 'no account number'}</MeterId>
                  </View>
                  <Text
                    variant="body"
                    className="font-sans-semibold"
                    style={{ fontVariant: ['tabular-nums'] }}>
                    {formatCompact(meter.consumption)} kWh
                  </Text>
                </Card>
              ))
            )}
          </View>
        </>
      ) : null}
    </ModuleShell>
  );
}

/* ------------------------------------------------------------------ */
/*  STP                                                                */
/* ------------------------------------------------------------------ */

function StpModule({ module }: { module: ModuleDefinition }) {
  const { colors } = useTheme();
  const { data, error, loading, refreshing, refresh } = useAsyncData(loadStpSummary, []);

  return (
    <ModuleShell
      module={module}
      subtitle={data?.windowDays ? `Last ${data.windowDays} logged days` : undefined}
      loading={loading && !data}
      error={error ?? data?.error ?? null}
      refreshing={refreshing}
      refresh={refresh}>
      {data ? (
        <>
          <KpiGrid>
            <KpiTile label="Inlet sewage" value={formatCompact(data.inlet)} unit="m³" />
            <KpiTile label="TSE for irrigation" value={formatCompact(data.tse)} unit="m³" />
            <KpiTile
              label="Recovery"
              value={formatPercent(data.recoveryPct)}
              status={
                data.recoveryPct === null
                  ? 'missing'
                  : data.recoveryPct < 80
                    ? 'danger'
                    : data.recoveryPct < 90
                      ? 'warning'
                      : 'normal'
              }
              statusLabel={data.recoveryPct === null ? 'No data' : 'Target 90%'}
            />
            <KpiTile
              label="Tanker trips"
              value={formatNumber(data.tankerTrips)}
              footnote={data.latestLogDate ? `Last log ${data.latestLogDate}` : undefined}
            />
          </KpiGrid>

          {data.daily.length > 1 ? (
            <Card>
              <PairedLines
                series={[
                  {
                    name: 'Inlet sewage',
                    color: module.accent,
                    values: data.daily.map((d) => d.inlet),
                  },
                  {
                    name: 'TSE for irrigation',
                    color: colors.chartSeries[1],
                    values: data.daily.map((d) => d.tse),
                    dashed: true,
                  },
                ]}
                caption={`m³ per day over the last ${data.daily.length} logged days`}
              />
            </Card>
          ) : null}
        </>
      ) : null}
    </ModuleShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Contractors                                                        */
/* ------------------------------------------------------------------ */

function ContractorsModule({ module }: { module: ModuleDefinition }) {
  const { data, error, loading, refreshing, refresh } = useAsyncData(loadContractorsSummary, []);

  const expiryStatus = useCallback((days: number | null) => {
    if (days === null) return 'missing' as const;
    if (days < 0) return 'danger' as const;
    if (days <= 60) return 'warning' as const;
    return 'normal' as const;
  }, []);

  return (
    <ModuleShell
      module={module}
      subtitle={data ? `${data.total} contracts in the register` : undefined}
      loading={loading && !data}
      error={error ?? data?.error ?? null}
      refreshing={refreshing}
      refresh={refresh}>
      {data ? (
        <>
          <KpiGrid>
            <KpiTile label="Active" value={formatNumber(data.active)} />
            <KpiTile
              label="Expired but active"
              value={formatNumber(data.expired)}
              status={data.expired > 0 ? 'danger' : 'normal'}
              statusLabel={data.expired > 0 ? 'Live service gap' : 'None'}
            />
            <KpiTile
              label="Expiring ≤ 60 days"
              value={formatNumber(data.expiringSoon)}
              status={data.expiringSoon > 0 ? 'warning' : 'normal'}
              statusLabel={data.expiringSoon > 0 ? 'Renewal due' : 'None'}
            />
            <KpiTile
              label="Annual value"
              value={data.annualValueOmr === null ? null : formatCompact(data.annualValueOmr)}
              unit="OMR"
              footnote={data.annualValueOmr === null ? 'No values recorded' : undefined}
            />
          </KpiGrid>

          <View className="gap-3">
            <Text variant="heading">Soonest to expire</Text>
            {data.rows.slice(0, 12).map((row, index) => (
              <Card key={`${row.contractor}-${index}`} className="gap-2">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text variant="body" className="font-sans-medium">
                      {row.contractor}
                    </Text>
                    {row.service ? <Text variant="caption">{row.service}</Text> : null}
                  </View>
                  <StatusPill
                    status={expiryStatus(row.daysRemaining)}
                    label={
                      row.daysRemaining === null
                        ? 'No end date'
                        : row.daysRemaining < 0
                          ? `${Math.abs(row.daysRemaining)}d overdue`
                          : `${row.daysRemaining}d left`
                    }
                  />
                </View>
                <Text variant="caption">
                  {row.status} · ends {formatDateUTC(row.endDate)}
                </Text>
              </Card>
            ))}
          </View>
        </>
      ) : null}
    </ModuleShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Assets                                                             */
/* ------------------------------------------------------------------ */

function AssetsModule({ module }: { module: ModuleDefinition }) {
  const { data, error, loading, refreshing, refresh } = useAsyncData(loadAssetsSummary, []);
  const summary = data?.summary ?? null;

  return (
    <ModuleShell
      module={module}
      subtitle={summary ? `${formatNumber(summary.total)} assets registered` : undefined}
      loading={loading && !data}
      error={error ?? data?.error ?? null}
      refreshing={refreshing}
      refresh={refresh}>
      {summary ? (
        <KpiGrid>
          <KpiTile label="Total" value={formatNumber(summary.total)} />
          <KpiTile
            label="Working / active"
            value={formatNumber(summary.workingStatus)}
            footnote="status ∈ (Working, Active)"
          />
          <KpiTile
            label="High criticality"
            value={formatNumber(summary.highCriticality)}
            footnote="criticality = High"
          />
          <KpiTile
            label="High criticality, no AMC"
            value={formatNumber(summary.highCriticalityNoAmc)}
            status={summary.highCriticalityNoAmc > 0 ? 'warning' : 'normal'}
            statusLabel={summary.highCriticalityNoAmc > 0 ? 'Uncovered' : 'All covered'}
          />
          <KpiTile
            label="End of life ≤ 2y"
            value={formatNumber(summary.endOfLifeSoon)}
            status={summary.endOfLifeSoon > 0 ? 'warning' : 'normal'}
            statusLabel="erl_years ≤ 2"
          />
          <KpiTile
            label="To verify"
            value={formatNumber(summary.toVerify)}
            footnote="status = TO VERIFY"
          />
        </KpiGrid>
      ) : null}
    </ModuleShell>
  );
}

/* ------------------------------------------------------------------ */
/*  HVAC                                                               */
/* ------------------------------------------------------------------ */

function HvacModule({ module }: { module: ModuleDefinition }) {
  const { data, error, loading, refreshing, refresh } = useAsyncData(loadHvacSummary, []);

  return (
    <ModuleShell
      module={module}
      subtitle={data?.findings !== null && data ? `${formatNumber(data.findings)} PPM findings` : undefined}
      loading={loading && !data}
      error={error ?? data?.error ?? null}
      refreshing={refreshing}
      refresh={refresh}>
      {data ? (
        <>
          <KpiGrid>
            <KpiTile label="PPM findings" value={data.findings === null ? null : formatNumber(data.findings)} />
            <KpiTile
              label="Still open"
              value={data.openFindings === null ? null : formatNumber(data.openFindings)}
              status={data.openFindings ? 'warning' : 'normal'}
              statusLabel={data.openFindings ? 'Awaiting action' : 'All closed'}
            />
            <KpiTile
              label="Recurring"
              value={data.recurring === null ? null : formatNumber(data.recurring)}
              footnote="Seen in more than one PPM visit"
            />
          </KpiGrid>

          {data.truncated ? (
            <Card className="gap-2 border-status-warning/30 bg-status-warning/5">
              <Text variant="heading">Partial read</Text>
              <Text variant="caption">
                The findings table hit the paging safety ceiling, so these counts are lower than the
                true totals. Open the full analysis below.
              </Text>
            </Card>
          ) : null}
        </>
      ) : null}
    </ModuleShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Fire safety                                                        */
/* ------------------------------------------------------------------ */

function FireModule({ module }: { module: ModuleDefinition }) {
  const { data, error, loading, refreshing, refresh } = useAsyncData(loadFireSummary, []);

  return (
    <ModuleShell
      module={module}
      loading={loading && !data}
      error={error ?? data?.error ?? null}
      refreshing={refreshing}
      refresh={refresh}>
      {data ? (
        <KpiGrid>
          <KpiTile
            label="Equipment registered"
            value={data.equipment === null ? null : formatNumber(data.equipment)}
          />
          <KpiTile
            label="Open issues"
            value={data.openIssues === null ? null : formatNumber(data.openIssues)}
            status={data.openIssues ? 'warning' : 'normal'}
            statusLabel={data.openIssues ? 'Not yet closed' : 'None open'}
          />
        </KpiGrid>
      ) : null}
    </ModuleShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Pest control                                                       */
/* ------------------------------------------------------------------ */

/**
 * Pest control has NO table in the Muscat Bay Supabase schema — every treatment
 * record lives in AITable. The web module says so plainly rather than inventing
 * KPIs, and this screen does the same.
 */
function PestModule({ module }: { module: ModuleDefinition }) {
  return (
    <Screen title={module.title}>
      <Card className="gap-2">
        <Text variant="heading">No database table yet</Text>
        <Text variant="caption">
          Pest control records live in AITable, not in the Muscat Bay database, so there is nothing
          to compute KPIs from. Once the records are migrated this module gets the same native
          treatment as water, electricity and STP.
        </Text>
      </Card>
      <EmbeddedLinks module={module} />
    </Screen>
  );
}
