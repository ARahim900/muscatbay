
// Asset related type definitions

export interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  installationDate: string;
  value: number;
  condition: string;
  criticalityLevel: string;
}

export interface AssetCategorySummary {
  category: string;
  count: number;
  totalValue: number;
}

export interface AssetLocationSummary {
  location: string;
  count: number;
  totalValue: number;
}

export interface AssetCondition {
  condition: string;
  count: number;
  totalValue: number;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  assetName: string;
  maintenanceType: string;
  scheduledDate: string;
  estimatedCost: number;
  priority: "Low" | "Medium" | "High" | "Critical";
}

export interface AssetLifecycleForecast {
  year: number;
  replacements: number;
  maintenanceCosts: number;
  assets: Asset[];
}

export interface AssetSummary {
  totalAssets: number;
  totalValue: number;
  criticalAssets: number;
}
