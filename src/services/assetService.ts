
import { fetchData } from './dataService';
import { Asset, AssetCategorySummary, AssetLocationSummary, AssetCondition } from '@/types/assets';

/**
 * Fetches assets data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with assets data
 */
export async function fetchAssets(signal?: AbortSignal): Promise<Asset[]> {
  try {
    const response = await fetchData<{ assets: Asset[] }>(
      'assets/assets.json',
      {
        signal,
        errorMessage: 'Failed to load assets data'
      }
    );
    
    return response.assets || [];
  } catch (error) {
    console.error('Error in fetchAssets:', error);
    throw error;
  }
}

/**
 * Get asset category summary
 * @param assets Array of assets
 * @returns Array of asset category summaries
 */
export function getAssetCategorySummary(assets: Asset[]): AssetCategorySummary[] {
  return categorizeAssetsByCategory(assets);
}

/**
 * Get asset location summary
 * @param assets Array of assets
 * @returns Array of asset location summaries
 */
export function getAssetLocationSummary(assets: Asset[]): AssetLocationSummary[] {
  return categorizeAssetsByLocation(assets);
}

/**
 * Get critical assets
 * @param assets Array of assets
 * @returns Array of critical assets
 */
export function getCriticalAssets(assets: Asset[]): Asset[] {
  // In a real application, this would filter by some criticality criteria
  // For now, just return a sample of assets
  return assets.slice(0, 5);
}

/**
 * Get asset conditions
 * @param assets Array of assets
 * @returns Array of asset conditions
 */
export function getAssetConditions(assets: Asset[]): AssetCondition[] {
  return analyzeAssetCondition(assets);
}

/**
 * Get asset maintenance schedule
 * @param assets Array of assets
 * @returns Asset maintenance schedule
 */
export function getAssetMaintenanceSchedule(assets: Asset[]): any[] {
  // Placeholder implementation
  return [];
}

/**
 * Get asset lifecycle forecast
 * @param assets Array of assets
 * @returns Asset lifecycle forecast
 */
export function getAssetLifecycleForecast(assets: Asset[]): any[] {
  // Placeholder implementation
  return [];
}

/**
 * Categorizes assets by their asset category
 * @param assets Array of assets
 * @returns Asset categories with their respective assets
 */
export function categorizeAssetsByCategory(assets: Asset[]): AssetCategorySummary[] {
  if (!assets || assets.length === 0) return [];
  
  // Group assets by category
  const categorizedAssets: Record<string, Asset[]> = {};
  let totalAssets = 0;
  
  assets.forEach(asset => {
    const category = asset.assetCategName || 'Uncategorized';
    if (!categorizedAssets[category]) {
      categorizedAssets[category] = [];
    }
    
    categorizedAssets[category].push(asset);
    totalAssets++;
  });
  
  // Convert grouped assets to summary array
  return Object.entries(categorizedAssets).map(([category, categoryAssets]) => {
    const summary: AssetCategorySummary = {
      category,
      count: categoryAssets.length,
      assets: categoryAssets,
      percentage: (categoryAssets.length / totalAssets) * 100,
    };
    
    return summary;
  }).sort((a, b) => b.count - a.count);
}

/**
 * Categorizes assets by their location
 * @param assets Array of assets
 * @returns Asset locations with their respective assets
 */
export function categorizeAssetsByLocation(assets: Asset[]): AssetLocationSummary[] {
  if (!assets || assets.length === 0) return [];
  
  // Group assets by location
  const locationAssets: Record<string, Asset[]> = {};
  let totalAssets = 0;
  
  assets.forEach(asset => {
    const location = asset.locationName || 'Unknown';
    if (!locationAssets[location]) {
      locationAssets[location] = [];
    }
    
    locationAssets[location].push(asset);
    totalAssets++;
  });
  
  // Convert grouped assets to summary array
  return Object.entries(locationAssets).map(([location, locAssets]) => {
    const summary: AssetLocationSummary = {
      location,
      count: locAssets.length,
      assets: locAssets,
      percentage: (locAssets.length / totalAssets) * 100,
    };
    
    return summary;
  }).sort((a, b) => b.count - a.count);
}

/**
 * Analyzes asset condition distribution
 * @param assets Array of assets
 * @returns Condition distribution data
 */
export function analyzeAssetCondition(assets: Asset[]): AssetCondition[] {
  if (!assets || assets.length === 0) return [];
  
  const conditionCounts: Record<string, number> = {
    'Excellent': 0,
    'Good': 0,
    'Fair': 0,
    'Poor': 0,
    'Critical': 0,
    'Unknown': 0
  };
  
  assets.forEach(asset => {
    // For this example, we're assuming some assets might have a condition property
    // In a real application, you would use the actual property
    conditionCounts['Unknown']++;
  });
  
  // Convert to array of condition objects
  return Object.entries(conditionCounts)
    .map(([condition, count]) => ({
      id: `condition-${condition.toLowerCase()}`,
      assetId: 0, // Placeholder
      condition,
      assessmentDate: new Date().toISOString(),
      notes: `${count} assets in ${condition} condition`,
      estimatedLifeRemaining: 0
    }));
}

// Export other required functions to satisfy imports
export async function fetchPropertyUnits(): Promise<any[]> {
  return [];
}

export async function fetchContributionRates(): Promise<any[]> {
  return [];
}

export async function calculateReserveFundContribution(property: any, rates: any[]): Promise<any> {
  return {};
}

export type PropertyUnit = any;
export type ContributionRate = any;
export type ReserveFundContribution = any;
