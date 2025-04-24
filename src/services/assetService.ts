
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
  // Add more mock assets as needed
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

// Add mock property units and contribution rates
export interface PropertyUnit {
  id: string;
  name: string;
  type: string;
  area: number;
  unitFactor: number;
}

export interface ContributionRate {
  id: string;
  assetType: string;
  ratePerSqMeter: number;
  baseRate: number;
}

/**
 * Fetches property units
 * @returns Array of property units
 */
export function fetchPropertyUnits(): PropertyUnit[] {
  return [
    { id: 'unit-001', name: 'Apartment 101', type: 'Residential', area: 120, unitFactor: 1.0 },
    { id: 'unit-002', name: 'Apartment 102', type: 'Residential', area: 85, unitFactor: 0.9 },
    { id: 'unit-003', name: 'Commercial Space 1', type: 'Commercial', area: 200, unitFactor: 1.5 },
    // Add more mock units as needed
  ];
}

/**
 * Fetches contribution rates
 * @returns Array of contribution rates
 */
export function fetchContributionRates(): ContributionRate[] {
  return [
    { id: 'rate-001', assetType: 'Building', ratePerSqMeter: 5.2, baseRate: 1000 },
    { id: 'rate-002', assetType: 'Amenities', ratePerSqMeter: 3.8, baseRate: 500 },
    { id: 'rate-003', assetType: 'Common Areas', ratePerSqMeter: 2.5, baseRate: 750 },
    // Add more mock rates as needed
  ];
}

/**
 * Calculates reserve fund contribution
 * @param unit Property unit
 * @param rate Contribution rate
 * @returns Calculated contribution
 */
export function calculateReserveFundContribution(unit: PropertyUnit, rate: ContributionRate): number {
  return (unit.area * rate.ratePerSqMeter * unit.unitFactor) + rate.baseRate;
}
