
// Asset related type definitions

export interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  acquisitionDate: string;
  value: number;
  lifeExpectancy: number;
  condition: string;
  criticality: string;
  nextMaintenanceDate: string;
}

export interface AssetCategorySummary {
  category: string;
  count: number;
  totalValue: number;
  assets: Asset[];
}

export interface AssetLocationSummary {
  location: string;
  count: number;
  totalValue: number;
  assets: Asset[];
}

export interface AssetCondition {
  condition: string;
  count: number;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  assetName: string;
  maintenanceType: string;
  scheduledDate: string;
  estimatedCost: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface AssetLifecycleForecast {
  year: number;
  replacements: number;
  maintenanceCosts: number;
  assets: Asset[];
}
