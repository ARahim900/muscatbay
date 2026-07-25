import '~/global.css';

// Imported by weight subpath, not from the package root: the root barrel
// re-exports all 18 Geist instances and Metro then bundles every one of them
// (~1.6 MB of unused TTFs). These five are the only faces the app renders.
import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_500Medium } from '@expo-google-fonts/geist/500Medium';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { Geist_700Bold } from '@expo-google-fonts/geist/700Bold';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono/400Regular';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from '~/features/auth/session-provider';
import { configureNotificationHandler } from '~/lib/push';
import { ThemeProvider, useTheme } from '~/theme/theme-provider';

void SplashScreen.preventAutoHideAsync();

/**
 * Route guard.
 *
 * Two gates, checked in order:
 *   1. No Supabase session → the auth group.
 *   2. Session, but the biometric lock is armed → the lock screen.
 * Anything else lands in the tab shell.
 */
function RouteGuard() {
  const { status, locked } = useSession();
  const { ready: settingsReady } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading' || !settingsReady) return;

    const group = segments[0];
    const inAuthGroup = group === '(auth)';
    const onLockScreen = group === 'lock';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (status === 'authenticated' && locked && !onLockScreen) {
      router.replace('/lock');
    } else if (status === 'authenticated' && !locked && (inAuthGroup || onLockScreen)) {
      router.replace('/(tabs)');
    }
  }, [status, locked, settingsReady, segments, router]);

  return null;
}

function RootNavigator() {
  const { theme, colors, ready: settingsReady } = useTheme();

  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
  });

  // A font that fails to download must not hold the splash forever — the system
  // face is an acceptable fallback, a permanently blank app is not.
  const fontsSettled = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontsSettled && settingsReady) void SplashScreen.hideAsync();
  }, [fontsSettled, settingsReady]);

  useEffect(() => {
    void configureNotificationHandler();
  }, []);

  if (!fontsSettled || !settingsReady) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <RouteGuard />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lock" />
        <Stack.Screen
          name="module/[key]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.foreground,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="embed/[view]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.foreground,
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider>
            <RootNavigator />
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
