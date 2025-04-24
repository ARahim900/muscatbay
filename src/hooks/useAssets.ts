
import { useState, useEffect } from 'react';
import { getAssets, getAssetsByCategory, getAssetsByLocation, getAssetConditions } from '@/services/assetService';
import { 
  Asset, 
  AssetCategorySummary,
  AssetLocationSummary, 
  AssetCondition,
  AssetMaintenance,
  AssetLifecycleForecast 
} from '@/types/asset';

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<AssetCategorySummary[]>([]);
  const [locationSummaries, setLocationSummaries] = useState<AssetLocationSummary[]>([]);
  const [conditions, setConditions] = useState<AssetCondition[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<AssetMaintenance[]>([]);
  const [lifecycleForecast, setLifecycleForecast] = useState<AssetLifecycleForecast[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssetData = async () => {
      try {
        setLoading(true);
        
        // Fetch all assets
        const assetsData = await getAssets();
        setAssets(assetsData);
        
        // Fetch asset category summaries
        const categoryData = await getAssetsByCategory();
        setCategorySummaries(categoryData);
        
        // Fetch asset location summaries
        const locationData = await getAssetsByLocation();
        setLocationSummaries(locationData);
        
        // Fetch asset conditions
        const conditionData = await getAssetConditions();
        setConditions(conditionData);
        
        // Generate mock maintenance schedule
        const mockMaintenanceSchedule = generateMockMaintenanceSchedule(assetsData);
        setMaintenanceSchedule(mockMaintenanceSchedule);
        
        // Generate mock lifecycle forecast
        const mockLifecycleForecast = generateMockLifecycleForecast(assetsData);
        setLifecycleForecast(mockLifecycleForecast);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching asset data:", err);
        setError("Failed to load asset data");
        setLoading(false);
      }
    };
    
    fetchAssetData();
  }, []);
  
  // Helper function to generate mock maintenance schedule
  const generateMockMaintenanceSchedule = (assets: Asset[]): AssetMaintenance[] => {
    const priorityOptions: ('Low' | 'Medium' | 'High' | 'Critical')[] = ['Low', 'Medium', 'High', 'Critical'];
    const maintenanceTypes = ['Preventive', 'Corrective', 'Condition-based', 'Predictive'];
    
    return assets.slice(0, 10).map((asset, index) => ({
      id: `ms-${index}`,
      assetId: asset.id,
      assetName: asset.name,
      maintenanceType: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
      scheduledDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedCost: Math.round(Math.random() * 1000) * 10,
      priority: priorityOptions[Math.floor(Math.random() * priorityOptions.length)]
    }));
  };
  
  // Helper function to generate mock lifecycle forecast
  const generateMockLifecycleForecast = (assets: Asset[]): AssetLifecycleForecast[] => {
    const currentYear = new Date().getFullYear();
    const forecasts: AssetLifecycleForecast[] = [];
    
    for (let i = 0; i < 5; i++) {
      const year = currentYear + i;
      const assetsForYear = assets.filter((_, index) => index % 5 === i).slice(0, 3);
      
      forecasts.push({
        year,
        replacements: assetsForYear.length,
        maintenanceCosts: assetsForYear.reduce((sum, asset) => sum + asset.value * 0.1, 0),
        assets: assetsForYear
      });
    }
    
    return forecasts;
  };

  return {
    assets,
    categorySummaries,
    locationSummaries,
    conditions,
    maintenanceSchedule,
    lifecycleForecast,
    loading,
    error
  };
};

export default useAssets;
