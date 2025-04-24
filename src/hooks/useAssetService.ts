
import { useState, useEffect } from 'react';
import { 
  getAssets, 
  getAssetCategorySummary, 
  getAssetLocationSummary, 
  getCriticalAssets, 
  getAssetConditions,
} from '@/services/assetService';
import { Asset, AssetCategorySummary, AssetLocationSummary, AssetCondition } from '@/types/asset';

export interface AssetServiceState {
  assets: Asset[];
  categorySummary: AssetCategorySummary[];
  locationSummary: AssetLocationSummary[];
  criticalAssets: Asset[];
  conditions: AssetCondition[];
  propertyUnits: any[];
  contributionRates: any[];
  loading: boolean;
  error: string | null;
}

export const useAssetService = () => {
  const [state, setState] = useState<AssetServiceState>({
    assets: [],
    categorySummary: [],
    locationSummary: [],
    criticalAssets: [],
    conditions: [],
    propertyUnits: [],
    contributionRates: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        // Fetch all asset data
        const assets = getAssets();
        const categorySummary = getAssetCategorySummary();
        const locationSummary = getAssetLocationSummary();
        const criticalAssets = getCriticalAssets();
        const conditions = getAssetConditions();
        const propertyUnits = [];
        const contributionRates = [];
        
        setState(prev => ({
          ...prev,
          assets,
          categorySummary,
          locationSummary,
          criticalAssets,
          conditions,
          propertyUnits,
          contributionRates,
          loading: false
        }));
      } catch (error) {
        console.error('Error loading asset data:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error.message : 'An unknown error occurred' 
        }));
      }
    };

    loadData();
  }, []);
  
  // Provide a function to calculate contributions
  const calculateContribution = (unit: any, rate: any): number => {
    return 0; // Mock implementation
  };

  return {
    ...state,
    calculateContribution
  };
};

export default useAssetService;
