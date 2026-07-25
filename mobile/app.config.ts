import type { ExpoConfig } from 'expo/config';

/**
 * Muscat Bay Operations — Expo app config.
 *
 * Phase 1 target is Expo Go: `npx expo start`, scan the QR with Expo Go.
 * Everything below that only matters for a native build (bundle identifiers,
 * Info.plist usage strings, config plugins) is inert in Expo Go but is kept
 * correct so the first `eas build` needs no scramble.
 *
 * Secrets are never in this file. Supabase credentials come from
 * EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in `mobile/.env`.
 */
const config: ExpoConfig = {
  name: 'Muscat Bay Operations',
  slug: 'muscatbay-operations',
  scheme: 'muscatbay',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  primaryColor: '#4E4456',
  assetBundlePatterns: ['**/*'],

  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#4E4456',
    dark: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0A090C',
    },
  },

  ios: {
    bundleIdentifier: 'com.muscatbay.operations',
    supportsTablet: true,
    // Read-only operations app: no camera, mic, location or contacts access.
    infoPlist: {
      NSFaceIDUsageDescription:
        'Muscat Bay Operations uses Face ID to unlock the app so operational data stays protected if your phone is unattended.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    package: 'com.muscatbay.operations',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#4E4456',
    },
    edgeToEdgeEnabled: true,
    permissions: ['USE_BIOMETRIC', 'USE_FINGERPRINT', 'POST_NOTIFICATIONS'],
  },

  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Muscat Bay Operations uses Face ID to unlock the app so operational data stays protected if your phone is unattended.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#4E4456',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
        backgroundColor: '#4E4456',
        dark: { backgroundColor: '#0A090C' },
      },
    ],
    [
      'expo-font',
      {
        // Geist is bundled from @expo-google-fonts and loaded at runtime in
        // src/app/_layout.tsx; listing the plugin keeps native builds consistent.
        fonts: [],
      },
    ],
  ],

  experiments: {
    // Typed routes are deliberately OFF: they require a generated .expo/types
    // pass, which would make a clean-checkout `tsc --noEmit` fail.
    typedRoutes: false,
  },

  extra: {
    router: {},
    // Filled in by `eas init`. Push registration reads it and, when absent,
    // reports "not configured" rather than guessing a project id.
    eas: { projectId: process.env.EAS_PROJECT_ID ?? undefined },
  },
};

export default config;
