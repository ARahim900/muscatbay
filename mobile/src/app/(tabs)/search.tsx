/**
 * Meter and asset lookup.
 *
 * The two meter registers are pulled once and filtered on-device, so typing is
 * instant on a slow site connection. The asset register is far larger, so it is
 * queried server-side per search (debounced) using the web app's own
 * `getAssetsFromSupabase` search path.
 */
import { useRouter } from 'expo-router';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { Card, PressableCard } from '~/components/ui/card';
import { Screen } from '~/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '~/components/ui/states';
import { MeterId, Text } from '~/components/ui/text';
import {
  filterMeters,
  loadMeterIndex,
  searchAssets,
  type SearchResult,
} from '~/features/data/queries';
import { useAsyncData } from '~/hooks/use-async-data';
import { MODULE_COLORS } from '~/theme/tokens';
import { useTheme } from '~/theme/theme-provider';

const KIND_LABEL: Record<SearchResult['kind'], string> = {
  'water-meter': 'Water meter',
  'electricity-meter': 'Electricity meter',
  asset: 'Asset',
};

const KIND_COLOR: Record<SearchResult['kind'], string> = {
  'water-meter': MODULE_COLORS.water,
  'electricity-meter': MODULE_COLORS.electricity,
  asset: MODULE_COLORS.assets,
};

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [assetResults, setAssetResults] = useState<SearchResult[]>([]);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [assetBusy, setAssetBusy] = useState(false);

  const index = useAsyncData(loadMeterIndex, []);

  const meterResults = useMemo(
    () => (index.data ? filterMeters(index.data.entries, query) : []),
    [index.data, query],
  );

  // Debounced server-side asset search.
  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      setAssetResults([]);
      setAssetError(null);
      return;
    }

    let cancelled = false;
    setAssetBusy(true);
    const handle = setTimeout(() => {
      searchAssets(needle)
        .then((rows) => {
          if (!cancelled) {
            setAssetResults(rows);
            setAssetError(null);
          }
        })
        .catch((caught: unknown) => {
          if (!cancelled) {
            setAssetResults([]);
            setAssetError(caught instanceof Error ? caught.message : String(caught));
          }
        })
        .finally(() => {
          if (!cancelled) setAssetBusy(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
      setAssetBusy(false);
    };
  }, [query]);

  const results = [...meterResults, ...assetResults];
  const searching = query.trim().length >= 2;

  return (
    <Screen title="Lookup" subtitle="Meters and assets across every register">
      <View className="flex-row items-center gap-2 rounded-md border border-input bg-card px-3">
        <SearchIcon size={17} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Meter name, account number, asset tag…"
          placeholderTextColor={colors.mutedForeground}
          style={{ color: colors.foreground }}
          accessibilityLabel="Search meters and assets"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          className="min-h-[48px] flex-1 font-sans text-base"
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setQuery('')}
            hitSlop={10}>
            <X size={17} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {index.loading && !index.data ? <LoadingState label="Building the meter index…" /> : null}

      {index.error ? <ErrorState detail={index.error} onRetry={() => void index.refresh()} /> : null}

      {index.data && index.data.errors.length > 0
        ? index.data.errors.map((entry) => (
            <Card key={entry} className="border-status-stale/30 bg-status-stale/10">
              <Text variant="caption">{entry}</Text>
            </Card>
          ))
        : null}

      {assetError ? <Text variant="caption" className="text-status-danger">{assetError}</Text> : null}

      {!searching && index.data ? (
        <EmptyState
          title="Type at least two characters"
          detail={`${index.data.entries.length} meters indexed. Assets are searched live.`}
        />
      ) : null}

      {searching && results.length === 0 && !assetBusy ? (
        <EmptyState title="Nothing matched" detail={`No meter or asset matches “${query.trim()}”.`} />
      ) : null}

      {assetBusy ? (
        <View className="flex-row items-center gap-2 py-1">
          <ActivityIndicator size="small" color={colors.mutedForeground} />
          <Text variant="caption">Searching the asset register…</Text>
        </View>
      ) : null}

      {results.map((result) => (
        <PressableCard
          key={result.id}
          accessibilityLabel={`${KIND_LABEL[result.kind]}: ${result.title}. Open ${result.moduleKey} module.`}
          onPress={() => router.push(`/module/${result.moduleKey}`)}
          className="gap-1.5">
          <View className="flex-row items-center gap-2">
            <View
              style={{ backgroundColor: KIND_COLOR[result.kind] }}
              className="h-1.5 w-1.5 rounded-full"
            />
            <Text variant="caption">{KIND_LABEL[result.kind]}</Text>
          </View>
          <Text variant="body" className="font-sans-medium" numberOfLines={2}>
            {result.title}
          </Text>
          {result.subtitle ? (
            <Text variant="caption" numberOfLines={1}>
              {result.subtitle}
            </Text>
          ) : null}
          {result.reference ? <MeterId>{result.reference}</MeterId> : null}
        </PressableCard>
      ))}
    </Screen>
  );
}
