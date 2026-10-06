import { ExtensionStorage } from '@bacons/apple-targets';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest, WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';

/**
 * Muscat Bay — iOS shell around the live web app.
 *
 * The app IS the website: it loads https://muscatbay.work full-screen, so every
 * Vercel deploy reaches the phone with no rebuild. The site already paints under
 * the notch (viewport-fit=cover + env(safe-area-inset-*)), so the WebView runs
 * edge-to-edge and the page handles its own insets — same as the Home Screen PWA.
 */

const APP_URL = 'https://muscatbay.work';

// Hosts that stay inside the app. The Supabase host serves the password-reset and
// email-confirmation hops that redirect back to the site.
const IN_APP_HOSTS = new Set(['muscatbay.work', 'www.muscatbay.work', 'utnlgeuqajmwibqmdmgt.supabase.co']);

// Google refuses OAuth inside embedded web views (403 disallowed_useragent), so the
// Google button is stopped at Supabase's authorize step with a clear message.
const OAUTH_AUTHORIZE_PATH = '/auth/v1/authorize';
const GOOGLE_AUTH_HOST = 'accounts.google.com';

// Hide the splash even if the first load never reports back.
const SPLASH_TIMEOUT_MS = 10_000;

// The site only clears the notch under `@media (display-mode: standalone)`
// (muscatbay/app/app/globals.css §3), and a WebView reports display-mode
// "browser". Re-apply those same rules here, and pad pages that have no topbar
// (sign-in, reset password) so their header clears the notch too. Keep the
// selectors in step with globals.css §3.
//
// The site's mobile nav is a floating pill lifted above the home indicator
// (components/layout/bottom-nav.tsx). In the app it is docked instead, like a
// standard iOS tab bar: wrapper pinned to the bottom edge, full width, square
// corners, a top hairline only, and the home-indicator inset added *inside* the
// bar so its background runs to the edge while the icons stay above the
// indicator. §3's own nav padding rule is not copied: combined with the pill's
// lifted wrapper it cleared the indicator twice. Page content already reserves
// 6rem + inset at the bottom (client-layout.tsx), more than the docked bar needs.
const SAFE_AREA_CSS = [
  '.topbar-dynamic{padding-block-start:env(safe-area-inset-top,0px)!important;block-size:calc(4rem + env(safe-area-inset-top,0px))!important}',
  'main#main-content{padding-block-start:calc(4rem + env(safe-area-inset-top,0px))!important}',
  'div:has(> nav[aria-label="Mobile navigation"]){bottom:0!important;padding-inline:0!important}',
  'nav[aria-label="Mobile navigation"]{max-width:none!important;border-radius:0!important;border-width:1px 0 0 0!important;box-shadow:none!important;padding-bottom:env(safe-area-inset-bottom,0px)!important}',
  'body:not(:has(.topbar-dynamic)){padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}',
].join('');

const INJECT_SAFE_AREA = `(function () {
  function add() {
    if (document.getElementById('mb-shell-safe-area')) return;
    var style = document.createElement('style');
    style.id = 'mb-shell-safe-area';
    style.textContent = ${JSON.stringify(SAFE_AREA_CSS)};
    (document.head || document.documentElement).appendChild(style);
  }
  add();
  document.addEventListener('DOMContentLoaded', add);
})();
true;`;

// ── Home Screen widget ──────────────────────────────────────────────────────
// The widget (targets/water-widget) cannot use the web view's session, so it
// reads its own per-device key from this App Group. The page asks for that key
// when the app announces `window.MuscatBayNative.widget` with paired: false
// (muscatbay/app/components/providers/widget-pairing.tsx), and posts it back
// as { type: 'mb-widget-key', key }. A null key (sign-out) forgets it. The
// widget marks a key the server refused, so the app pairs again on next launch.
const APP_GROUP = 'group.work.muscatbay.app';
const WIDGET_KEY = 'widgetKey';
const WIDGET_KEY_REJECTED = 'widgetKeyRejected';
const WIDGET_KEY_MESSAGE = 'mb-widget-key';
const WIDGET_LABEL = Platform.OS === 'ios' && Platform.isPad ? 'iPad widget' : 'iPhone widget';
const widgetStorage = new ExtensionStorage(APP_GROUP);

function widgetPaired(): boolean {
  return Boolean(widgetStorage.get(WIDGET_KEY)) && widgetStorage.get(WIDGET_KEY_REJECTED) !== '1';
}

function bridgeScript(paired: boolean): string {
  const bridge = JSON.stringify({ widget: { paired, label: WIDGET_LABEL } });
  return `window.MuscatBayNative = ${bridge};`;
}

// Widget taps open muscatbayshell://water/daily; each route maps to a page.
const DEEP_LINKS: Record<string, string> = {
  'water/daily': 'https://www.muscatbay.work/water?view=daily',
};

function deepLinkTarget(url: string | null): string | null {
  if (!url) return null;
  const match = /^muscatbayshell:\/\/\/?([^?#]*)/i.exec(url);
  return match ? DEEP_LINKS[match[1].replace(/\/+$/, '').toLowerCase()] ?? null : null;
}

const THEME = {
  light: { page: '#F7F8F9', text: '#0A0A0A', muted: '#454545' },
  dark: { page: '#0A090C', text: '#F7F8F9', muted: '#E5E7EB' },
} as const;

void SplashScreen.preventAutoHideAsync();

// React Native's URL polyfill does not implement `hostname`, so parse by hand.
function hostOf(url: string): string | null {
  const match = /^https?:\/\/([^/?#:]+)/i.exec(url);
  return match ? match[1].toLowerCase() : null;
}

function openOutside(url: string): void {
  if (/^https?:/i.test(url)) {
    WebBrowser.openBrowserAsync(url).catch(() => {
      void Linking.openURL(url);
    });
    return;
  }
  Linking.openURL(url).catch(() => {
    Alert.alert('Cannot open link', 'No app on this iPhone can open this link.');
  });
}

export default function App() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = THEME[scheme];
  const webViewRef = useRef<WebView>(null);
  const splashHidden = useRef(false);
  const [offline, setOffline] = useState(false);
  const [paired, setPaired] = useState(widgetPaired);
  const [sourceUrl, setSourceUrl] = useState(APP_URL);

  // A widget tap opens the app on the page it summarises — at launch or later.
  useEffect(() => {
    const open = (url: string | null) => {
      const target = deepLinkTarget(url);
      if (target) setSourceUrl(target);
    };
    void Linking.getInitialURL().then(open);
    const subscription = Linking.addEventListener('url', (event) => open(event.url));
    return () => subscription.remove();
  }, []);

  // The page reads `paired` on every load; keep the open page in step too.
  const announceBridge = useCallback((value: boolean) => {
    webViewRef.current?.injectJavaScript(`${bridgeScript(value)} true;`);
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const host = hostOf(event.nativeEvent.url);
      if (!host || !IN_APP_HOSTS.has(host)) return;
      let message: unknown;
      try {
        message = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (!message || typeof message !== 'object') return;
      const { type, key } = message as { type?: unknown; key?: unknown };
      if (type !== WIDGET_KEY_MESSAGE) return;
      if (key === null) {
        widgetStorage.remove(WIDGET_KEY);
        widgetStorage.remove('widgetCache');
      } else if (typeof key === 'string' && /^[0-9a-f]{64}$/.test(key)) {
        widgetStorage.set(WIDGET_KEY, key);
        widgetStorage.remove(WIDGET_KEY_REJECTED);
      } else {
        return;
      }
      ExtensionStorage.reloadWidget();
      const next = widgetPaired();
      setPaired(next);
      announceBridge(next);
    },
    [announceBridge],
  );

  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const timer = setTimeout(hideSplash, SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [hideSplash]);

  const handleNavigation = useCallback((request: ShouldStartLoadRequest): boolean => {
    const { url, isTopFrame } = request;

    // Sub-frames (e.g. the Satellite View iframe) and in-page schemes load as normal.
    if (!isTopFrame || /^(about|blob|data):/i.test(url)) return true;

    const host = hostOf(url);
    if (!host) {
      openOutside(url); // tel:, mailto:, sms:, maps: …
      return false;
    }

    if (host === GOOGLE_AUTH_HOST || url.includes(OAUTH_AUTHORIZE_PATH)) {
      Alert.alert(
        'Use email sign-in',
        'Google does not allow its sign-in inside apps. Please sign in with your email and password.',
        // Reload so the site's "Redirecting to Google…" button resets.
        [{ text: 'OK', onPress: () => webViewRef.current?.reload() }],
      );
      return false;
    }

    if (IN_APP_HOSTS.has(host)) return true;

    openOutside(url);
    return false;
  }, []);

  const handleOpenWindow = useCallback((targetUrl: string) => {
    const host = hostOf(targetUrl);
    if (host && IN_APP_HOSTS.has(host)) {
      webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(targetUrl)}; true;`);
      return;
    }
    openOutside(targetUrl);
  }, []);

  const retry = useCallback(() => {
    setOffline(false);
    webViewRef.current?.reload();
  }, []);

  return (
    <View style={[styles.fill, { backgroundColor: colors.page }]}>
      <StatusBar style="auto" />
      <WebView
        ref={webViewRef}
        source={{ uri: sourceUrl }}
        style={[styles.fill, { backgroundColor: colors.page }]}
        originWhitelist={['http://*', 'https://*', 'about:*']}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        sharedCookiesEnabled
        allowsInlineMediaPlayback
        applicationNameForUserAgent="MuscatBayApp/1.0"
        webviewDebuggingEnabled={__DEV__}
        injectedJavaScriptBeforeContentLoaded={`${bridgeScript(paired)}\n${INJECT_SAFE_AREA}`}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleNavigation}
        onOpenWindow={(event) => handleOpenWindow(event.nativeEvent.targetUrl)}
        onLoadEnd={hideSplash}
        onLoad={() => setOffline(false)}
        onError={() => {
          setOffline(true);
          hideSplash();
        }}
        // iOS can kill the web process under memory pressure, leaving a blank page.
        onContentProcessDidTerminate={() => webViewRef.current?.reload()}
      />
      {offline && (
        <View style={[StyleSheet.absoluteFill, styles.centre, { backgroundColor: colors.page }]}>
          <Text style={[styles.title, { color: colors.text }]}>Cannot reach Muscat Bay</Text>
          <Text style={[styles.body, { color: colors.muted }]}>Check your connection, then try again.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={retry}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centre: { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  title: { fontFamily: 'Georgia', fontSize: 22, fontWeight: '600', letterSpacing: -0.2, textAlign: 'center' },
  body: { fontSize: 16, textAlign: 'center' },
  button: { backgroundColor: '#4E4456', borderRadius: 5, paddingHorizontal: 24, paddingVertical: 12 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
