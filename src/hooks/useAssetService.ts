
import { useState, useEffect } from 'react';
import { 
  Asset, 
  AssetCategorySummary, 
  AssetLocationSummary, 
  AssetCondition 
} from '@/types/asset';
import { 
  getAssets,
  getAssetsByCategory,
  getAssetsByLocation,
  getAssetConditions
} from '@/services/assetService';

interface AssetServiceState {
  assets: Asset[];
  categorySummaries: AssetCategorySummary[];
  locationSummaries: AssetLocationSummary[];
  criticalAssets: Asset[];
  conditions: AssetCondition[];
  propertyUnits: any[];
  contributionRates: any[];
  loading: boolean;
  error: string;
}

export const useAssetService = () => {
  const [state, setState] = useState<AssetServiceState>({
    assets: [],
    categorySummaries: [],
    locationSummaries: [],
    criticalAssets: [],
    conditions: [],
    propertyUnits: [],
    contributionRates: [],
    loading: true,
    error: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: '' }));
        
        // Fetch all assets
        const assets = await getAssets();
        
        // Get assets by category
        const categorySummaries = await getAssetsByCategory();
        
        // Get assets by location
        const locationSummaries = await getAssetsByLocation();
        
        // Get asset conditions
        const conditions = await getAssetConditions();
        
        // Filter for critical assets
        const criticalAssets = assets.filter(
          asset => asset.criticalityLevel === 'High' || asset.criticalityLevel === 'Critical'
        );
        
        setState({
          assets,
          categorySummaries,
          locationSummaries,
          criticalAssets,
          conditions,
          propertyUnits: [],
          contributionRates: [],
          loading: false,
          error: ''
        });
      } catch (error) {
        console.error('Error fetching asset data:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load asset data'
        }));
      }
    };
    
    fetchData();
  }, []);

  return state;
};
