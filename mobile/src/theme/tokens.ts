/**
 * Design tokens as JavaScript values.
 *
 * NativeWind classes read the CSS variables in `src/global.css`; anything that
 * cannot take a class name — `react-native-svg` fills and strokes, lucide icon
 * colours, the React Navigation theme object, the status bar — reads from here.
 *
 * This is the exact same split the web app makes with `lib/tokens.ts`, and the
 * same rule applies: these hexes MIRROR `src/global.css` and must be changed
 * together. Authoritative spec: repo-root `BRAND_DESIGN.md`.
 */

export type ThemeName = 'light' | 'dark';

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
  chart5: string;
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
    chart5: '#4D445D',
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
    chartAxis: '#94A3B8',
    chart5: '#8B7F94',
  },
};

/** BRAND_DESIGN.md §2.6 — identical in both themes. Never used without an icon + label. */
export const STATUS_COLORS = {
  normal: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  stale: '#F97316',
  missing: '#94A3B8',
} as const;

export type StatusKey = keyof typeof STATUS_COLORS;

/** BRAND_DESIGN.md §2.8 — icons and chart series only, never page chrome. */
export const MODULE_COLORS = {
  water: '#3B7ED2',
  electricity: '#E8A838',
  stp: '#10B981',
  assets: '#8B7F94',
  contractors: '#6B9AC4',
  hvac: '#E8C064',
  pest: '#84B59F',
  fire: '#D67A7A',
} as const;

/** BRAND_DESIGN.md §2.9 categorical chart palette. */
export const CHART_SERIES = ['#6B9AC4', '#A1D1D5', '#E8C064', '#84B59F', '#4D445D'] as const;

export const CHART_LOSS = '#D67A7A';
export const CHART_SUCCESS = '#84B59F';

/** BRAND_DESIGN.md §5. */
export const RADIUS = { card: 10.5, input: 7, chip: 5 } as const;
