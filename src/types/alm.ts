
// Asset Category definition
export interface AssetCategory {
  id: string;
  name: string;
  subCategory: string;
  assetCount: number;
  totalReplacementCost: number;
  lifeExpectancyRange: string;
  zoneCoverage: string;
}

// Asset Category Summary definition for charts and tables
export interface AssetCategorySummary {
  id: string;
  name: string;
  subCategory: string;
  assetCount: number;
  totalReplacementCost: number;
  lifeExpectancyRange: string;
  zoneCoverage: string;
}

// Asset Condition definition
export interface AssetCondition {
  id: string;
  conditionRating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  description: string;
  assetCount: number;
  percentage: number;
  recommendedAction: string;
}

// Critical Asset definition
export interface CriticalAsset {
  id: string;
  assetName: string;
  location: string;
  criticality: 'High' | 'Medium' | 'Low';
  riskScore: number;
  lastInspectionDate: string;
  nextInspectionDate: string;
  replacementValue: number;
}

// Maintenance Forecast definition
export interface MaintenanceForecast {
  id: string;
  assetName: string;
  zone: string;
  installationYear: number;
  currentCondition: string;
  nextMaintenanceYear: number;
  maintenanceType: string;
  estimatedCost: number;
  lifeExpectancy: number;
}

// Upcoming Maintenance definition
export interface UpcomingMaintenance {
  id: string;
  assetName: string;
  zone: string;
  scheduledDate: string;
  maintenanceType: string;
  estimatedCost: number;
  duration: number;
  resourceRequirements: string;
  priority: string;
}

// Property Unit definition
export interface PropertyUnit {
  id: string;
  unitNo: string;
  sector: string;
  zone: string;
  propertyType: string;
  status: string;
  unitType: string;
  bua: number;
  hasLift: boolean;
  plotSize?: number;
  unitValue?: number;
  handoverDate?: string | null;
  anticipatedHandoverDate?: string | null;
  owner?: string;
}

// Service Charge Data definition
export interface ServiceChargeZone {
  name: string;
  code: string;
  unitTypes: {
    [key: string]: {
      name: string;
      baseRate: number;
      sizes: number[];
    };
  };
}

export interface ServiceChargeData {
  [zoneKey: string]: ServiceChargeZone;
}

// Service Charge calculation result
export interface ServiceCharge {
  annual: {
    total: number;
    baseCharge: number;
    vat: number;
  };
  monthly: {
    total: number;
    baseCharge: number;
    vat: number;
  };
}

// Service Charge Zone from database
export interface ServiceChargeZoneData {
  id: number;
  name: string;
  code: string;
  totalBua: number;
  unitCount: number;
  serviceChargeRate: number;
  reserveFundRate: number;
}
