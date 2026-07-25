/**
 * Device-local preferences, AsyncStorage-backed.
 *
 * The web app keeps its equivalents in `lib/alert-preferences.ts` and
 * `lib/filter-preferences.ts` on top of a synchronous `localStorage`. React
 * Native has no synchronous key/value store, so those two modules cannot be
 * reused as-is; this is their mobile counterpart. The stored SHAPES are kept
 * deliberately small and independent so nothing has to stay in sync across
 * platforms.
 *
 * Nothing operational is cached here — the app is read-only and always renders
 * live Supabase data or an honest error.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  theme: ThemePreference;
  /** Require Face ID / fingerprint when the app returns to the foreground. */
  biometricLock: boolean;
  /** User has opted in to operational push alerts. */
  pushEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  biometricLock: false,
  pushEnabled: false,
};

const KEY = 'muscatbay.settings.v1';

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** Parse defensively — a corrupted value must never brick app start-up. */
function parse(raw: string | null): AppSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;
    const record = parsed as Record<string, unknown>;
    return {
      theme: isThemePreference(record.theme) ? record.theme : DEFAULT_SETTINGS.theme,
      biometricLock:
        typeof record.biometricLock === 'boolean'
          ? record.biometricLock
          : DEFAULT_SETTINGS.biometricLock,
      pushEnabled:
        typeof record.pushEnabled === 'boolean' ? record.pushEnabled : DEFAULT_SETTINGS.pushEnabled,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    return parse(await AsyncStorage.getItem(KEY));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Could not persist settings:', error);
  }
}
