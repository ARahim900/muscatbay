/**
 * Design tokens as JavaScript values.
 *
 * NativeWind classes read the CSS variables in `src/global.css`; anything that
 * cannot take a class name — `react-native-svg` fills and strokes, lucide icon
 * colours, the React Navigation theme object, the status bar — reads from here.
 *
 * This is the exact same split the web app makes with `lib/tokens.ts`, and the
 * same rule applies: these hexes MIRROR `src/global.css` and must be changed
 * together. Authoritative spec: repo-root `DESIGN_SYSTEM.md` (v2.0).
 * (`BRAND_DESIGN.md`, cited by earlier versions of this file, is superseded.)
 *
 * Status and chart colours are per-theme records, not flat constants: the v2
 * status palette is muted, and a colour that reads on white does not read on
 * `#16141B`. Reach them through `useTheme().colors`, never by importing a
 * single hex.
 */

export type ThemeName = 'light' | 'dark';

export type StatusKey = 'normal' | 'warning' | 'danger' | 'info' | 'stale' | 'missing';

interface Palette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  component: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  chartAxis: string;
  /**
   * DESIGN_SYSTEM.md §2.2. Muted, never saturated, and AA in both themes —
   * the old stock `#22C55E` / `#EF4444` set measured ~2.3:1 as an icon on a
   * light card and had no dark variant at all.
   *
   * `stale` and `missing` map onto the warning and neutral tokens: §2.2 defines
   * five status colours and adding a sixth would invent one outside the system.
   * Nothing is lost — `StatusPill` always renders a shape-distinct icon and its
   * own label ("Stale", "No data"), so colour never carries the meaning alone.
   */
  status: Record<StatusKey, string>;
  /**
   * DESIGN_SYSTEM.md §2.4, in series order. Purple, water blue and violet lift
   * in dark mode so a 2px line stays visible on `#16141B` (brand purple is
   * 1.99:1 there); teal, amber and sage read in both themes and stay constant.
   * Mirrors the web fix in `app/design-tokens.css`.
   */
  chartSeries: readonly string[];
  chartLoss: string;
  chartSuccess: string;
}

export const PALETTE: Record<ThemeName, Palette> = {
  light: {
    background: '#F7F8F9',
    foreground: '#0A0A0A',
    card: '#FFFFFF',
    cardForeground: '#0A0A0A',
    component: '#F0F2F4',
    muted: '#F3F4F6',
    mutedForeground: '#5D6976',
    primary: '#4E4456',
    primaryForeground: '#FFFFFF',
    secondary: '#A1D1D5',
    secondaryForeground: '#1F2937',
    border: '#E5E7EB',
    input: '#E5E7EB',
    ring: '#4A8E93',
    sidebar: '#423846',
    sidebarForeground: '#E4E4E7',
    chartAxis: '#6B7280',
    status: {
      normal: '#2E7D42',
      warning: '#9A6B00',
      danger: '#B03A2E',
      info: '#2F5F9E',
      stale: '#9A6B00',
      missing: '#6B7280',
    },
    chartSeries: ['#4E4456', '#A1D1D5', '#3B7ED2', '#D4A843', '#8B6DB0', '#5FA88A'],
    chartLoss: '#C96B6B',
    chartSuccess: '#5FA88A',
  },
  dark: {
    background: '#0A090C',
    foreground: '#F1F5F9',
    card: '#16141B',
    cardForeground: '#F1F5F9',
    component: '#16141B',
    muted: '#22202A',
    mutedForeground: '#9CA3AF',
    primary: '#4E4456',
    primaryForeground: '#FFFFFF',
    secondary: '#A1D1D5',
    secondaryForeground: '#1F2937',
    // rgba(255,255,255,0.1) pre-composited over --card #16141B
    border: '#2D2B32',
    input: '#2D2B32',
    ring: '#A1D1D5',
    sidebar: '#3B3240',
    sidebarForeground: '#E4E4E7',
    chartAxis: '#9CA3AF',
    status: {
      normal: '#9FD6AE',
      warning: '#F0D08A',
      danger: '#F0A8A8',
      info: '#A9C6E6',
      stale: '#F0D08A',
      missing: '#9CA3AF',
    },
    chartSeries: ['#8B7F94', '#A1D1D5', '#6B9AC4', '#D4A843', '#A98BD1', '#5FA88A'],
    chartLoss: '#C96B6B',
    chartSuccess: '#5FA88A',
  },
};

/**
 * DESIGN_SYSTEM.md §2.3 — icons and chart series only, never page chrome.
 * Identical in both themes, so this one stays a flat constant and may be read
 * outside a React tree (`lib/modules.ts` builds its module table at import).
 */
export const MODULE_COLORS = {
  water: '#3B7ED2',
  electricity: '#D4A843',
  stp: '#5FA88A',
  assets: '#8B7F94',
  contractors: '#6B9AC4',
  hvac: '#C99A4B',
  pest: '#84B59F',
  fire: '#C96B6B',
} as const;

/**
 * The two brand hues (DESIGN_SYSTEM.md §1), for the handful of places that need
 * a colour outside a React tree and outside either theme — the Android
 * notification-channel LED, for one.
 */
export const BRAND = { purple: '#4E4456', teal: '#A1D1D5' } as const;

/** DESIGN_SYSTEM.md §4. */
export const RADIUS = { card: 10.5, input: 7, chip: 5 } as const;
