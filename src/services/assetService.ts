/**
 * Asset management service for Muscat Bay operations web application
 */
import { fetchData } from './dataService';
import {
  Asset,
  AssetCategorySummary,
  AssetLocationSummary,
  AssetCondition,
  AssetMaintenance,
  AssetLifecycleForecast
} from '@/types/assets';

/**
 * Fetches all assets
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with assets data
 */
export async function fetchAssets(signal?: AbortSignal): Promise<Asset[]> {
  try {
    const response = await fetchData<{metadata: any, data: Asset[]}>(
      'assets/assets.json',
      {
        signal,
        errorMessage: 'Failed to load assets data'
      }
    );
    
    return response.data || [];
  } catch (error) {
    console.error('Error in fetchAssets:', error);
    return [];
  }
}

/**
 * Gets asset category summary data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with asset category summary
 */
export async function getAssetCategorySummary(signal?: AbortSignal): Promise<AssetCategorySummary[]> {
  try {
    const assets = await fetchAssets(signal);
    
    // Group assets by category and count them
    const categories = assets.reduce<Record<string, AssetCategorySummary>>((acc, asset) => {
      const category = asset.category || 'Uncategorized';
      
      if (!acc[category]) {
        acc[category] = {
          category,
          count: 0,
          totalValue: 0,
          percentageOfTotal: 0
        };
      }
      
      acc[category].count++;
      acc[category].totalValue += asset.value || 0;
      
      return acc;
    }, {});
    
    // Calculate percentage of total
    const totalValue = Object.values(categories).reduce((sum, cat) => sum + cat.totalValue, 0);
    
    return Object.values(categories).map(category => ({
      ...category,
      percentageOfTotal: totalValue > 0 ? (category.totalValue / totalValue) * 100 : 0
    }));
  } catch (error) {
    console.error('Error in getAssetCategorySummary:', error);
    return [];
  }
}

/**
 * Gets asset location summary data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with asset location summary
 */
export async function getAssetLocationSummary(signal?: AbortSignal): Promise<AssetLocationSummary[]> {
  try {
    const assets = await fetchAssets(signal);
    
    // Group assets by location and count them
    const locations = assets.reduce<Record<string, AssetLocationSummary>>((acc, asset) => {
      const location = asset.location || 'Unknown';
      
      if (!acc[location]) {
        acc[location] = {
          location,
          count: 0,
          totalValue: 0
        };
      }
      
      acc[location].count++;
      acc[location].totalValue += asset.value || 0;
      
      return acc;
    }, {});
    
    return Object.values(locations);
  } catch (error) {
    console.error('Error in getAssetLocationSummary:', error);
    return [];
  }
}

/**
 * Gets critical assets
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with critical assets
 */
export async function getCriticalAssets(signal?: AbortSignal): Promise<Asset[]> {
  try {
    const assets = await fetchAssets(signal);
    
    // Filter assets with criticality rating of 'High' or 'Critical'
    return assets.filter(asset => 
      asset.criticality === 'High' || 
      asset.criticality === 'Critical'
    );
  } catch (error) {
    console.error('Error in getCriticalAssets:', error);
    return [];
  }
}

/**
 * Gets asset conditions summary
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with asset conditions
 */
export async function getAssetConditions(signal?: AbortSignal): Promise<AssetCondition[]> {
  try {
    const assets = await fetchAssets(signal);
    
    // Group assets by condition and count them
    const conditions = assets.reduce<Record<string, AssetCondition>>((acc, asset) => {
      const condition = asset.condition || 'Unknown';
      
      if (!acc[condition]) {
        acc[condition] = {
          condition,
          count: 0,
          percentage: 0
        };
      }
      
      acc[condition].count++;
      
      return acc;
    }, {});
    
    // Calculate percentage of total
    const totalCount = assets.length;
    
    return Object.values(conditions).map(condition => ({
      ...condition,
      percentage: totalCount > 0 ? (condition.count / totalCount) * 100 : 0
    }));
  } catch (error) {
    console.error('Error in getAssetConditions:', error);
    return [];
  }
}

/**
 * Gets asset maintenance schedule
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with asset maintenance schedule
 */
export async function getAssetMaintenanceSchedule(signal?: AbortSignal): Promise<AssetMaintenance[]> {
  try {
    // Fetch maintenance schedule data
    const response = await fetchData<{metadata: any, data: AssetMaintenance[]}>(
      'assets/maintenance.json',
      {
        signal,
        errorMessage: 'Failed to load asset maintenance schedule'
      }
    );
    
    return response.data || [];
  } catch (error) {
    console.error('Error in getAssetMaintenanceSchedule:', error);
    return [];
  }
}

/**
 * Gets asset lifecycle forecast
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with asset lifecycle forecast
 */
export async function getAssetLifecycleForecast(signal?: AbortSignal): Promise<AssetLifecycleForecast[]> {
  try {
    // Fetch lifecycle forecast data
    const response = await fetchData<{metadata: any, data: AssetLifecycleForecast[]}>(
      'assets/lifecycle.json',
      {
        signal,
        errorMessage: 'Failed to load asset lifecycle forecast'
      }
    );
    
    return response.data || [];
  } catch (error) {
    console.error('Error in getAssetLifecycleForecast:', error);
    return [];
  }
}
