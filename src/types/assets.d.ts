
/**
 * Type definitions for assets management
 */

export interface Asset {
  id: string;
  assetId: number;
  name: string;
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

export interface AssetCategorySummary {
  category: string;
  count: number;
  assets: Asset[];
  percentage: number;
}

export interface AssetLocationSummary {
  location: string;
  count: number;
  assets: Asset[];
  percentage: number;
}

export interface AssetCondition {
  id: string;
  assetId: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical' | 'Unknown';
  assessmentDate: string;
  notes?: string;
  estimatedLifeRemaining?: number; // in months
}

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

// Property units
export interface PropertyUnit {
  id: string;
  unitNo: string;
  sector: string;
  zoneCode: string;
  propertyType: string;
  unitType: string;
  hasLift: boolean;
  status: string;
  unitValue: number;
  plotSize: number;
  bua: number;
}

export interface ContributionRate {
  id: number;
  zone: string;
  category: string;
  propertyType: string;
  rate: number;
  year: number;
  description?: string;
}

export interface ReserveFundContribution {
  propertyId: string;
  baseRate: number;
  propertySize: number;
  annualContribution: number;
  monthlyContribution: number;
}
