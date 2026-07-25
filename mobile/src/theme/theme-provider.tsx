/**
 * Theme + settings context.
 *
 * Dark mode is primary (control rooms, night shifts) but light mode is
 * first-class, so the default preference is `system` and both palettes are
 * production tokens rather than a tint of each other.
 *
 * NativeWind's `useColorScheme()` drives the `dark:` variant; the same value is
 * mirrored into `PALETTE` for everything that cannot take a class name.
 */
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
  type ThemePreference,
} from '~/lib/settings-store';
import { PALETTE, type ThemeName } from '~/theme/tokens';

interface ThemeContextValue {
  /** The theme actually being rendered. */
  theme: ThemeName;
  colors: (typeof PALETTE)[ThemeName];
  settings: AppSettings;
  /** True once stored settings have been read; screens wait for it. */
  ready: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadSettings().then((stored) => {
      if (cancelled) return;
      setSettings(stored);
      setColorScheme(stored.theme);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [setColorScheme]);

  const persist = useCallback((next: AppSettings) => {
    setSettings(next);
    void saveSettings(next);
  }, []);

  const setThemePreference = useCallback(
    (preference: ThemePreference) => {
      setColorScheme(preference);
      persist({ ...settings, theme: preference });
    },
    [persist, settings, setColorScheme],
  );

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => persist({ ...settings, ...patch }),
    [persist, settings],
  );

  const theme: ThemeName = colorScheme === 'dark' ? 'dark' : 'light';

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: PALETTE[theme],
      settings,
      ready,
      setThemePreference,
      updateSettings,
    }),
    [theme, settings, ready, setThemePreference, updateSettings],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
