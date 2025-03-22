
// Asset Categories
export interface AssetCategory {
  id: string;
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
  unitTypes: Record<string, UnitType>;
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

// New types for expense analysis
export interface ExpenseData {
  year: number;
  expenses: number;
}

export interface ZoneExpenseData {
  [key: string]: ExpenseData[];
}

export interface CategoryBreakdown {
  name: string;
  value: number;
}

export interface ExpenseType {
  name: string;
  value: number;
}

export interface MonthlyDistribution {
  month: string;
  value: number;
}

export interface CategoryAnalysisItem {
  category: string;
  total: number;
  percentage: number;
  count: number;
  avgCost: number;
  workType: string;
}

export interface MajorReplacementYear {
  year: number;
  expense: number;
  components: string;
  zones: number;
  percentage: number;
}
