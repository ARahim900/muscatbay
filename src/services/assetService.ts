
import { Asset, AssetCategorySummary, AssetLocationSummary, AssetCondition } from '@/types/asset';

// Mock function to get all assets
export const getAssets = async (): Promise<Asset[]> => {
  // This would usually fetch from an API
  const mockAssets: Asset[] = [
    { 
      id: "a1", 
      name: "HVAC System", 
      category: "Mechanical", 
      location: "Main Building", 
      installationDate: "2020-05-15", 
      value: 25000,
      condition: "Good",
      criticalityLevel: "High"
    },
    { 
      id: "a2", 
      name: "Irrigation Pump", 
      category: "Plumbing", 
      location: "Garden Area", 
      installationDate: "2021-03-10", 
      value: 8500,
      condition: "Excellent",
      criticalityLevel: "Medium"
    },
    { 
      id: "a3", 
      name: "Backup Generator", 
      category: "Electrical", 
      location: "Utility Room", 
      installationDate: "2019-11-22", 
      value: 35000,
      condition: "Fair",
      criticalityLevel: "Critical"
    }
  ];
  
  return mockAssets;
};

// Get assets grouped by category
export const getAssetsByCategory = async (): Promise<AssetCategorySummary[]> => {
  const assets = await getAssets();
  
  // Group by category
  const categories = assets.reduce<Record<string, { count: number; totalValue: number }>>(
    (acc, asset) => {
      if (!acc[asset.category]) {
        acc[asset.category] = { count: 0, totalValue: 0 };
      }
      
      acc[asset.category].count += 1;
      acc[asset.category].totalValue += asset.value;
      
      return acc;
    },
    {}
  );
  
  // Convert to array
  return Object.entries(categories).map(([category, data]) => ({
    category,
    count: data.count,
    totalValue: data.totalValue
  }));
};

// Get assets grouped by location
export const getAssetsByLocation = async (): Promise<AssetLocationSummary[]> => {
  const assets = await getAssets();
  
  // Group by location
  const locations = assets.reduce<Record<string, { count: number; totalValue: number }>>(
    (acc, asset) => {
      if (!acc[asset.location]) {
        acc[asset.location] = { count: 0, totalValue: 0 };
      }
      
      acc[asset.location].count += 1;
      acc[asset.location].totalValue += asset.value;
      
      return acc;
    },
    {}
  );
  
  // Convert to array
  return Object.entries(locations).map(([location, data]) => ({
    location,
    count: data.count,
    totalValue: data.totalValue
  }));
};

// Get assets grouped by condition
export const getAssetConditions = async (): Promise<AssetCondition[]> => {
  const assets = await getAssets();
  
  // Group by condition
  const conditions = assets.reduce<Record<string, { count: number; totalValue: number }>>(
    (acc, asset) => {
      if (!acc[asset.condition]) {
        acc[asset.condition] = { count: 0, totalValue: 0 };
      }
      
      acc[asset.condition].count += 1;
      acc[asset.condition].totalValue += asset.value;
      
      return acc;
    },
    {}
  );
  
  // Convert to array
  return Object.entries(conditions).map(([condition, data]) => ({
    condition,
    count: data.count,
    totalValue: data.totalValue
  }));
};
