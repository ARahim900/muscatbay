/**
 * Centralized Configuration for Muscat Bay Dashboard
 * 
 * All hardcoded constants and rates should be defined here.
 * This makes it easy to update values in one place and
 * enables future migration to database-driven configuration.
 */

// ==============================================
// Economic Rates
// ==============================================

/**
 * STP (Sewage Treatment Plant) Rates
 */
export const STP_RATES = {
    /** Fee charged per tanker trip in OMR */
    TANKER_FEE: 4.50,
    /** Savings rate for TSE (Treated Sewage Effluent) water in OMR per m³ */
    TSE_SAVING_RATE: 1.32,
} as const;

/**
 * Electricity Rates
 */
export const ELECTRICITY_RATES = {
    /** Rate per kilowatt-hour in OMR */
    RATE_PER_KWH: 0.025,
} as const;

/**
 * Water Rates (for future use)
 */
export const WATER_RATES = {
    /** Rate per cubic meter in OMR */
    RATE_PER_M3: 0.50,
} as const;

// ==============================================
// Pagination Settings
// ==============================================

export const PAGINATION = {
    /** Default number of items per page */
    DEFAULT_PAGE_SIZE: 50,
    /** Maximum items per page */
    MAX_PAGE_SIZE: 100,
    /** Items per page for table views */
    TABLE_PAGE_SIZE: 25,
} as const;

// ==============================================
// Feature Flags
// ==============================================

export const FEATURES = {
    /** Enable Supabase Realtime subscriptions */
    ENABLE_REALTIME: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
    /** Enable debug logging */
    DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
} as const;

// ==============================================
// UI Configuration
// ==============================================

export const UI_CONFIG = {
    /** Date format for display */
    DATE_FORMAT: 'dd MMM yyyy',
    /** Short date format */
    DATE_FORMAT_SHORT: 'MMM yyyy',
    /** Currency symbol */
    CURRENCY: 'OMR',
    /** Decimal places for currency */
    CURRENCY_DECIMALS: 3,
    /** Animation duration in ms */
    ANIMATION_DURATION: 200,
} as const;

// ==============================================
// Chart Colors (matching design system)
// ==============================================

export const CHART_COLORS = {
    PRIMARY: '#4E4456',    // Plum
    SECONDARY: '#81D8D0',  // Tiffany
    ACCENT: '#C9A962',     // Gold
    SUCCESS: '#22c55e',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    GRADIENT_START: 'rgba(129, 216, 208, 0.3)',
    GRADIENT_END: 'transparent',
} as const;

// ==============================================
// Default Export (for convenience)
// ==============================================

export const CONFIG = {
    STP: STP_RATES,
    ELECTRICITY: ELECTRICITY_RATES,
    WATER: WATER_RATES,
    PAGINATION,
    FEATURES,
    UI: UI_CONFIG,
    COLORS: CHART_COLORS,
} as const;

export default CONFIG;
