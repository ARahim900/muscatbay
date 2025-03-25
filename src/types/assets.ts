
// Asset type definitions
export interface Asset {
  assetId: number;
  assetTag: string;
  assetName: string;
  assetDesc: string;
  assetBrand: string;
  assetModel: string;
  assetCategId: number;
  assetCategName: string;
  assetSubCategId: number;
  assetSubCategName: string;
  locationName: string;
  locationTag: string;
  assetLocKeyId: number;
  assetLocRef1: string;
  assetLocRef2: string;
  assetLocRef3: string;
  assetInLocSrlno: string;
  countryOfOrigin: string;
  ppmFreq: string;
  isAssetActive: string;
  client: string;
}

// Asset Category summary for charts and stats
export interface AssetCategorySummary {
  category: string;
  count: number;
  percentage: number;
}

// Asset Location summary for charts and stats
export interface AssetLocationSummary {
  location: string;
  count: number;
  percentage: number;
}

// Asset Condition type
export interface AssetCondition {
  id: string;
  assetId: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  assessmentDate: string;
  notes?: string;
  estimatedLifeRemaining?: number; // in months
}

// Asset Maintenance type
export interface AssetMaintenance {
  id: string;
  assetId: number;
  maintenanceType: 'Preventive' | 'Corrective' | 'Condition-Based';
  scheduledDate: string;
  completedDate?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
  cost?: number;
  technician?: string;
  notes?: string;
}

// Asset Lifecycle Forecast
export interface AssetLifecycleForecast {
  assetId: number;
  assetName: string;
  assetCategory: string;
  installationDate?: string;
  expectedLifespan: number; // in months
  remainingLifespan: number; // in months
  replacementCost?: number;
  replacementYear: number;
  priority: 'High' | 'Medium' | 'Low';
}
