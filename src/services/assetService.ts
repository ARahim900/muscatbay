// Import necessary types from the asset type definitions
import { Asset, AssetCategorySummary, AssetLocationSummary, AssetCondition } from '@/types/asset';

// Mock asset data
const assets: Asset[] = [
  {
    id: 'asset-001',
    name: 'HVAC System - Building A',
    category: 'Mechanical',
    location: 'Building A',
    acquisitionDate: '2019-03-15',
    value: 45000,
    lifeExpectancy: 15,
    condition: 'Good',
    criticality: 'High',
    nextMaintenanceDate: '2023-09-15'
  },
  {
    id: 'asset-002',
    name: 'Elevators - Main Building',
    category: 'Mechanical',
    location: 'Main Building',
    acquisitionDate: '2018-06-22',
    value: 120000,
    lifeExpectancy: 20,
    condition: 'Good',
    criticality: 'Critical',
    nextMaintenanceDate: '2023-08-05'
  },
  {
    id: 'asset-003',
    name: 'Security Cameras',
    category: 'Security',
    location: 'Perimeter',
    acquisitionDate: '2020-11-03',
    value: 28500,
    lifeExpectancy: 8,
    condition: 'Excellent',
    criticality: 'Medium',
    nextMaintenanceDate: '2023-10-12'
  },
  {
    id: 'asset-004',
    name: 'Fire Alarm System',
    category: 'Safety',
    location: 'Building A',
    acquisitionDate: '2021-01-10',
    value: 15000,
    lifeExpectancy: 10,
    condition: 'Good',
    criticality: 'High',
    nextMaintenanceDate: '2023-07-20'
  },
  {
    id: 'asset-005',
    name: 'Water Pumps - Building B',
    category: 'Plumbing',
    location: 'Building B',
    acquisitionDate: '2017-09-01',
    value: 32000,
    lifeExpectancy: 12,
    condition: 'Fair',
    criticality: 'Medium',
    nextMaintenanceDate: '2023-08-28'
  },
  {
    id: 'asset-006',
    name: 'Generator Set',
    category: 'Electrical',
    location: 'Power Room',
    acquisitionDate: '2016-05-18',
    value: 75000,
    lifeExpectancy: 25,
    condition: 'Good',
    criticality: 'Critical',
    nextMaintenanceDate: '2023-09-05'
  }
];

/**
 * Fetches all assets
 * @returns Array of assets
 */
export function getAssets(): Asset[] {
  return assets;
}

/**
 * Gets asset category summary
 * @returns Asset category summary
 */
export function getAssetCategorySummary(): AssetCategorySummary[] {
  const categoryMap = new Map<string, AssetCategorySummary>();
  
  assets.forEach(asset => {
    const category = asset.category;
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        count: 0,
        totalValue: 0,
        assets: []
      });
    }
    
    const summary = categoryMap.get(category)!;
    summary.count++;
    summary.totalValue += asset.value;
    summary.assets.push(asset);
  });
  
  return Array.from(categoryMap.values());
}

/**
 * Gets asset location summary
 * @returns Asset location summary
 */
export function getAssetLocationSummary(): AssetLocationSummary[] {
  const locationMap = new Map<string, AssetLocationSummary>();
  
  assets.forEach(asset => {
    const location = asset.location;
    
    if (!locationMap.has(location)) {
      locationMap.set(location, {
        location,
        count: 0,
        totalValue: 0,
        assets: []
      });
    }
    
    const summary = locationMap.get(location)!;
    summary.count++;
    summary.totalValue += asset.value;
    summary.assets.push(asset);
  });
  
  return Array.from(locationMap.values());
}

/**
 * Gets critical assets
 * @returns Array of critical assets
 */
export function getCriticalAssets(): Asset[] {
  return assets.filter(asset => 
    asset.criticality === 'Critical' || 
    asset.criticality === 'High'
  );
}

/**
 * Gets asset conditions
 * @returns Asset condition summary
 */
export function getAssetConditions(): AssetCondition[] {
  const conditions: AssetCondition[] = [
    { condition: 'Excellent', count: 0 },
    { condition: 'Good', count: 0 },
    { condition: 'Fair', count: 0 },
    { condition: 'Poor', count: 0 },
    { condition: 'Critical', count: 0 },
  ];
  
  assets.forEach(asset => {
    const condition = conditions.find(c => c.condition === asset.condition);
    if (condition) {
      condition.count++;
    }
  });
  
  return conditions;
}
