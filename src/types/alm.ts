// Asset Category type
export interface AssetCategory {
  id: string;
  name: string;
  subCategory: string;
  assetCount: number;
  totalReplacementCost: number;
  lifeExpectancyRange: string;
  zoneCoverage: string;
}

// Critical Asset type
export interface CriticalAsset {
  id: string;
  assetName: string;
  location: string;
  criticality: string;
  riskScore: number;
  lastInspectionDate: string;
  nextInspectionDate: string;
  replacementValue: number;
  notes?: string;
}

// Maintenance Forecast type
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

// Asset Condition type
export interface AssetCondition {
  id: string;
  conditionRating: string;
  description: string;
  assetCount: number;
  percentage: number;
  recommendedAction: string;
}

// Upcoming Maintenance type
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

// Reserve Fund Rate type
export interface ReserveFundRate {
  zone: string;
  zoneName: string;
  rate: number;
  effectiveDate: string;
  notes?: string;
}

// Service Charge Calculation type
export interface ServiceChargeCalculation {
  zone: string;
  buaTotal: number;
  operatingExpense: number;
  reserveFund: number;
  totalCharge: number;
  ratePerSqm: number;
}

// Service Charge Data for calculator
export interface ServiceChargeUnitType {
  name: string;
  baseRate: number;
  sizes: number[];
}

export interface ServiceChargeZoneData {
  name: string;
  unitTypes: {
    [key: string]: ServiceChargeUnitType;
  };
}

export interface ServiceChargeData {
  [key: string]: ServiceChargeZoneData;
}

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
