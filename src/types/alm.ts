
// Asset Categories
export interface AssetCategory {
  id: number;
  name: string;
  subCategory: string;
  assetCount: number;
  totalReplacementCost: number;
  lifeExpectancyRange: string;
  zoneCoverage: string;
}

// Maintenance Forecast
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

// Asset Conditions
export interface AssetCondition {
  id: number;
  conditionRating: string;
  description: string;
  assetCount: number;
  percentage: number;
  recommendedAction: string;
}

// Critical Assets
export interface CriticalAsset {
  id: string;
  assetName: string;
  zone: string;
  currentCondition: string;
  replacementCost: number;
  criticalityRating: number;
  failureImpact: string;
  recommendedAction: string;
  targetCompletion: string;
}

// Upcoming Maintenance
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

// Service Charge Data Types
export interface UnitType {
  name: string;
  baseRate: number;
  sizes: number[];
}

export interface ZoneData {
  name: string;
  totalContribution: number;
  totalArea: number;
  unitTypes: Record<string, UnitType>;
  description: string;
}

export interface ServiceChargeData {
  [key: string]: ZoneData;
}

export interface ServiceCharge {
  annual: {
    total: number;
    baseCharge: number;
    vat: number;
    reserveFund?: number;
    operational?: number;
    admin?: number;
    masterCommunity?: number;
  };
  monthly: {
    total: number;
    baseCharge: number;
    vat: number;
    reserveFund?: number;
    operational?: number;
    admin?: number;
    masterCommunity?: number;
  };
}

export interface ReserveFund {
  zone: string;
  contribution: number;
  minimumBalance: number;
}
