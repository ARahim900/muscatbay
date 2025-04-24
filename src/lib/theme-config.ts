
/**
 * Theme configuration for the Muscat Bay operations web application
 */

// Define the theme color palette
export const colorPalette = {
  // Primary colors
  primary: '#0565FF', // Blue
  secondary: '#14B8A6', // Teal
  tertiary: '#8884D8', // Lavender
  quaternary: '#FFB020', // Gold
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  
  // Background colors
  background: '#FFFFFF',
  backgroundLight: '#F9FAFB',
  backgroundDark: '#F3F4F6',
  
  // Success/Error colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Chart colors
  chartColors: [
    '#0565FF', // Blue
    '#14B8A6', // Teal
    '#8884D8', // Lavender
    '#FFB020', // Gold
    '#F43F5E', // Rose
    '#8B5CF6', // Purple
    '#10B981', // Emerald
    '#F97316', // Orange
  ]
};

// Define the theme config
export const themeConfig = {
  primary: colorPalette.primary,
  secondary: colorPalette.secondary,
  tertiary: colorPalette.tertiary,
  quaternary: colorPalette.quaternary,
  
  // Text colors
  text: colorPalette.textPrimary,
  textSecondary: colorPalette.textSecondary,
  textLight: colorPalette.textLight,
  
  // Background colors
  bg: colorPalette.background,
  bgLight: colorPalette.backgroundLight,
  bgDark: colorPalette.backgroundDark,
  
  // Card & Panel
  cardBg: colorPalette.background,
  panelBg: colorPalette.backgroundLight,
  border: 'border-gray-200 dark:border-gray-700',
  
  // Status colors
  success: colorPalette.success,
  warning: colorPalette.warning,
  error: colorPalette.error,
  info: colorPalette.info,
  
  // Chart colors
  chartColors: colorPalette.chartColors,
  
  // Color by module
  modules: {
    water: colorPalette.primary,
    electricity: colorPalette.quaternary,
    stp: colorPalette.secondary,
    assets: colorPalette.tertiary,
  }
};

/**
 * Get color for a specific metric based on its value
 * @param value The metric value
 * @param thresholds Object defining the thresholds for each color
 * @param inverse Whether to invert the color logic (higher is worse)
 * @returns Color code based on the value
 */
export const getMetricColor = (
  value: number,
  thresholds = { high: 80, medium: 50, low: 0 },
  inverse = false
): string => {
  if (inverse) {
    if (value >= thresholds.high) return colorPalette.error;
    if (value >= thresholds.medium) return colorPalette.warning;
    return colorPalette.success;
  } else {
    if (value >= thresholds.high) return colorPalette.success;
    if (value >= thresholds.medium) return colorPalette.warning;
    return colorPalette.error;
  }
};

export default themeConfig;
