/**
 * @fileoverview Supabase Database Integration Module
 * 
 * This module provides backward-compatible re-exports from the reorganized
 * codebase. All entities and functions have been modularized into:
 * - `/entities/` - Database models and transform functions
 * - `/functions/` - Supabase client and API functions
 * 
 * @module lib/supabase
 * 
 * ## Configuration
 * 
 * To connect to Supabase, create a `.env.local` file in the app root with:
 * ```
 * NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key (starts with "eyJ...")
 * ```
 * 
 * ## Usage
 * 
 * ```typescript
 * import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
 * 
 * // Check if Supabase is available
 * if (isSupabaseConfigured()) {
 *   const data = await getSTPOperationsFromSupabase();
 * }
 * ```
 * 
 * ## Fallback Behavior
 * 
 * All fetch functions gracefully return empty arrays when Supabase is not
 * configured, allowing the app to use mock data from `mock-data.ts`.
 * 
 * @see {@link ./mock-data.ts} for fallback data
 * @see {@link ./water-data.ts} for water meter utilities
 * @see {@link ../entities} for database models
 * @see {@link ../functions} for API functions
 */

// =============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// =============================================================================

// Supabase client configuration
export {
    isSupabaseConfigured,
    getSupabaseClient,
    isValidSupabaseKey
} from '@/functions/supabase-client';

// Entity types and transforms
export {
    // Asset
    type SupabaseAsset,
    transformAsset,
    // Contractor
    type ContractorTracker,
    type AmcContractorSummary,
    type AmcContractorDetails,
    type AmcContractorExpiry,
    type AmcContractorPricing,
    type AmcContract,
    type AmcExpiry,
    type AmcContact,
    type AmcPricing,
    transformContractor,
    // Electricity
    type ElectricityMeter,
    type ElectricityReading,
    // STP
    type SupabaseSTPOperation,
    transformSTPOperation,
    // Water
    type SupabaseWaterMeter,
    transformWaterMeter,
    type SupabaseDailyWaterConsumption,
    type DailyWaterConsumption,
    transformDailyWaterConsumption,
    // Fire Safety
    type FireSafetyEquipment,
    type FireQuotation,
    type FireQuotationItem,
} from '@/entities';

// API functions
export {
    // Assets
    getAssetsFromSupabase,
    // Contractors
    getContractorTrackerData,
    getContractorSummary,
    getContractorDetails,
    getContractorExpiry,
    getContractorPricing,
    getCombinedContractors,
    getAmcContracts,
    getAmcExpiry,
    getAmcContacts,
    getAmcPricing,
    // Electricity
    getElectricityMetersFromSupabase,
    // STP
    getSTPOperationsFromSupabase,
    // Water
    getWaterMetersFromSupabase,
    getDailyWaterConsumptionFromSupabase,
} from '@/functions';
