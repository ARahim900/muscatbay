
/**
 * Type definitions for assets management
 */

export interface Asset {
  id: string;
  name: string;
  assetCategory: string;
  assetSubCategory: string;
  assetTag: string;
  locationName: string;
  locationTag: string;
  assetCondition: string;
  installationDate?: string;
  assetValue?: number;
  brand?: string;
  model?: string;
  countryOfOrigin?: string;
}

export interface AssetCategorySummary {
  name: string;
  count: number;
  assets: Asset[];
  totalValue: number;
  percentage: number;
}

export interface AssetLocationSummary {
  name: string;
  count: number;
  assets: Asset[];
  totalValue: number;
  percentage: number;
}

export interface AssetCondition {
  condition: string;
  count: number;
  percentage: number;
}

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
