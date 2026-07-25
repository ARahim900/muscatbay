/**
 * Embedded analytical view.
 *
 * INTERIM, AND FRAMED AS SUCH. These are the dense cross-tab pages — the water
 * monthly balance, the electricity meter table, the STP operations log — that
 * have no honest phone-native form yet. They render the real muscatbay.live page
 * inside a WebView until each one is rebuilt natively.
 *
 * Authentication reuses the web app's OWN existing handoff: `/auth/callback`
 * already accepts an implicit-flow hash fragment (`#access_token=…&refresh_token=…`)
 * and calls `supabase.auth.setSession()`, which writes the cookies the Next.js
 * proxy reads. So the operator is signed in inside the WebView as the same user,
 * with no second login and no change to the web app.
 *
 * The tokens travel in the URL FRAGMENT, which browsers never send to the
 * server, and the handoff URL is built once per mount and never reused.
 */
import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { Screen } from '~/components/ui/screen';
import { EmptyState, ErrorState } from '~/components/ui/states';
import { Text } from '~/components/ui/text';
import { WEB_APP_ORIGIN } from '~/adapters/env';
import { getSupabaseClient } from '~/adapters/supabase-client';
import { findEmbeddedView } from '~/lib/modules';
import { useTheme } from '~/theme/theme-provider';

/** A page that has not finished loading in this long is treated as failed. */
const LOAD_TIMEOUT_MS = 25_000;

type Phase = 'preparing' | 'loading' | 'ready' | 'failed';

export default function EmbeddedViewScreen() {
  const { view: viewId } = useLocalSearchParams<{ view: string }>();
  const entry = viewId ? findEmbeddedView(viewId) : null;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [phase, setPhase] = useState<Phase>('preparing');
  const [url, setUrl] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // Build a fresh, signed-in URL on mount and on every retry.
  useEffect(() => {
    if (!entry) return;
    let cancelled = false;

    const build = async () => {
      setPhase('preparing');
      setFailure(null);

      const client = getSupabaseClient();
      if (!client) {
        if (!cancelled) {
          setFailure('Supabase is not configured, so this page cannot be opened signed in.');
          setPhase('failed');
        }
        return;
      }

      const { data, error } = await client.auth.getSession();
      if (cancelled) return;

      if (error || !data.session) {
        setFailure('Your session could not be read. Sign out and back in, then try again.');
        setPhase('failed');
        return;
      }

      const target = `${WEB_APP_ORIGIN}/auth/callback?next=${encodeURIComponent(entry.view.path)}` +
        `#access_token=${encodeURIComponent(data.session.access_token)}` +
        `&refresh_token=${encodeURIComponent(data.session.refresh_token)}` +
        `&token_type=bearer&type=magiclink`;

      setUrl(target);
      setPhase('loading');
    };

    void build();
    return () => {
      cancelled = true;
    };
  }, [entry, attempt]);

  // Independent watchdog — a WebView that hangs never fires onError.
  useEffect(() => {
    clearTimer();
    if (phase !== 'loading') return;

    timer.current = setTimeout(() => {
      setFailure(
        `The page did not finish loading within ${LOAD_TIMEOUT_MS / 1000} seconds. It may be a slow connection, or muscatbay.live may be unreachable.`,
      );
      setPhase('failed');
    }, LOAD_TIMEOUT_MS);

    return clearTimer;
  }, [phase, clearTimer]);

  if (!entry) {
    return (
      <Screen title="Unknown view">
        <EmptyState title="No such view" detail={`"${viewId}" is not an embedded Muscat Bay page.`} />
      </Screen>
    );
  }

  const retry = () => {
    setAttempt((n) => n + 1);
  };

  /** Keep navigation inside the web app; anything else opens in the system browser. */
  const onNavigationStateChange = (nav: WebViewNavigation) => {
    if (nav.url && !nav.url.startsWith(WEB_APP_ORIGIN) && !nav.url.startsWith('about:')) {
      void WebBrowser.openBrowserAsync(nav.url);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: entry.view.title }} />
      <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
        {/* Honest framing, always visible — this is the website, not a native screen. */}
        <View className="border-b border-border bg-card px-4 py-2.5">
          <Text variant="caption">
            {entry.module.title} · web view. This page is still the muscatbay.live interface,
            embedded here until it is rebuilt natively.
          </Text>
        </View>

        {phase === 'failed' ? (
          <View className="p-4">
            <ErrorState
              title="Could not open this page"
              detail={failure ?? 'Unknown failure.'}
              onRetry={retry}
            />
          </View>
        ) : null}

        {url && phase !== 'failed' ? (
          <View className="flex-1">
            <WebView
              key={`${entry.view.id}-${attempt}`}
              source={{ uri: url }}
              originWhitelist={[`${WEB_APP_ORIGIN}/*`]}
              onNavigationStateChange={onNavigationStateChange}
              onLoadEnd={() => {
                clearTimer();
                setPhase('ready');
              }}
              onError={(event) => {
                clearTimer();
                setFailure(
                  event.nativeEvent.description || 'The page failed to load.',
                );
                setPhase('failed');
              }}
              onHttpError={(event) => {
                clearTimer();
                setFailure(
                  `The server returned HTTP ${event.nativeEvent.statusCode} for this page.`,
                );
                setPhase('failed');
              }}
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              domStorageEnabled
              javaScriptEnabled
              pullToRefreshEnabled
              allowsBackForwardNavigationGestures
              startInLoadingState={false}
              style={{ flex: 1, backgroundColor: colors.background }}
            />

            {phase !== 'ready' ? (
              <View className="absolute inset-0 items-center justify-center gap-3 bg-background">
                <ActivityIndicator color={colors.mutedForeground} />
                <Text variant="caption">
                  {phase === 'preparing' ? 'Signing you in…' : 'Loading the full analysis…'}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {phase === 'preparing' && !url ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator color={colors.mutedForeground} />
            <Text variant="caption">Signing you in…</Text>
          </View>
        ) : null}
      </View>
    </>
  );
}
