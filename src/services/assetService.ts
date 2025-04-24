
import { fetchData } from './dataService';
import {
  Asset,
  AssetCategorySummary,
  AssetLocationSummary,
  AssetCondition,
  PropertyUnit,
  ContributionRate,
  ReserveFundContribution
} from '@/types/assets';

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
    const category = asset.assetCategory || 'Uncategorized';
    if (!categorizedAssets[category]) {
      categorizedAssets[category] = [];
    }
    
    categorizedAssets[category].push(asset);
    totalAssets++;
  });
  
  // Convert grouped assets to summary array
  return Object.entries(categorizedAssets).map(([category, categoryAssets]) => {
    const summary: AssetCategorySummary = {
      name: category,
      count: categoryAssets.length,
      assets: categoryAssets,
      percentage: (categoryAssets.length / totalAssets) * 100,
      totalValue: 0
    };
    
    // Calculate total value if available
    categoryAssets.forEach(asset => {
      if (asset.assetValue) {
        summary.totalValue += asset.assetValue;
      }
    });
    
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
      name: location,
      count: locAssets.length,
      assets: locAssets,
      percentage: (locAssets.length / totalAssets) * 100,
      totalValue: 0
    };
    
    // Calculate total value if available
    locAssets.forEach(asset => {
      if (asset.assetValue) {
        summary.totalValue += asset.assetValue;
      }
    });
    
    return summary;
  }).sort((a, b) => b.count - a.count);
}

/**
 * Analyzes asset criticality distribution
 * @param assets Array of assets
 * @returns Criticality distribution data
 */
export function analyzeAssetCriticality(assets: Asset[]): any[] {
  if (!assets || assets.length === 0) return [];
  
  const criticalityCount: Record<string, number> = {
    'High': 0,
    'Medium': 0,
    'Low': 0,
    'Unknown': 0
  };
  
  assets.forEach(asset => {
    // For this example, we're assuming the asset doesn't have a criticality property
    // In a real application, you would use the actual property
    criticalityCount['Unknown']++;
  });
  
  return Object.entries(criticalityCount)
    .map(([criticality, count]) => ({
      criticality,
      count,
      percentage: (count / assets.length) * 100
    }));
}

/**
 * Analyzes asset condition distribution
 * @param assets Array of assets
 * @returns Condition distribution data
 */
export function analyzeAssetCondition(assets: Asset[]): AssetCondition[] {
  if (!assets || assets.length === 0) return [];
  
  const conditionCount: Record<string, number> = {
    'Excellent': 0,
    'Good': 0,
    'Fair': 0,
    'Poor': 0,
    'Critical': 0,
    'Unknown': 0
  };
  
  assets.forEach(asset => {
    const condition = asset.assetCondition || 'Unknown';
    
    if (conditionCount[condition] !== undefined) {
      conditionCount[condition]++;
    } else {
      conditionCount['Unknown']++;
    }
  });
  
  return Object.entries(conditionCount)
    .map(([condition, count]) => ({
      condition,
      count,
      percentage: (count / assets.length) * 100
    }));
}

/**
 * Fetch property units data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with property units data
 */
export async function fetchPropertyUnits(signal?: AbortSignal): Promise<PropertyUnit[]> {
  try {
    const response = await fetchData<{ units: PropertyUnit[] }>(
      'property/units.json',
      {
        signal,
        errorMessage: 'Failed to load property units data'
      }
    );
    
    return response.units || [];
  } catch (error) {
    console.error('Error in fetchPropertyUnits:', error);
    throw error;
  }
}

/**
 * Fetch contribution rates data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with contribution rates data
 */
export async function fetchContributionRates(signal?: AbortSignal): Promise<ContributionRate[]> {
  try {
    const response = await fetchData<{ rates: ContributionRate[] }>(
      'property/contribution-rates.json',
      {
        signal,
        errorMessage: 'Failed to load contribution rates data'
      }
    );
    
    return response.rates || [];
  } catch (error) {
    console.error('Error in fetchContributionRates:', error);
    throw error;
  }
}

/**
 * Calculate reserve fund contribution
 * @param property Property unit
 * @param rates Contribution rates
 * @returns Reserve fund contribution details
 */
export async function calculateReserveFundContribution(
  property: PropertyUnit,
  rates: ContributionRate[]
): Promise<ReserveFundContribution> {
  // Find applicable rate for the property
  const applicableRate = rates.find(rate => 
    rate.zone === property.zoneCode && 
    rate.propertyType === property.propertyType
  );
  
  const baseRate = applicableRate?.rate || 0;
  const annualContribution = baseRate * property.bua;
  
  return {
    propertyId: property.id,
    baseRate,
    propertySize: property.bua,
    annualContribution,
    monthlyContribution: annualContribution / 12
  };
}
