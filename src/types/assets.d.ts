
/**
 * Type definitions for asset management data
 */

export interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Under Maintenance' | 'Retired';
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  criticality: 'Low' | 'Medium' | 'High' | 'Critical';
  purchaseDate: string;
  installDate: string;
  value: number;
  expectedLifespan: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  notes?: string;
}

export interface AssetCategorySummary {
  category: string;
  count: number;
  totalValue: number;
  percentageOfTotal: number;
}

export interface AssetLocationSummary {
  location: string;
  count: number;
  totalValue: number;
}

export interface AssetCondition {
  condition: string;
  count: number;
  percentage: number;
}

export interface AssetMaintenance {
  assetId: string;
  assetName: string;
  scheduleDate: string;
  estimatedDuration: number;
  maintenanceType: 'Preventive' | 'Corrective' | 'Predictive';
  assignedTo: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Delayed';
}

export interface AssetLifecycleForecast {
  year: number;
  replacementCount: number;
  estimatedCost: number;
  assets: {
    id: string;
    name: string;
    estimatedReplacementCost: number;
  }[];
}

export interface AssetFilters {
  category?: string;
  location?: string;
  condition?: string;
  criticality?: string;
  status?: string;
  sortBy?: 'name' | 'value' | 'condition' | 'installDate';
  sortOrder?: 'asc' | 'desc';
}
