
/**
 * Type definitions for property management data
 */

export interface PropertyUnit {
  id: string;
  unitNo: string;
  sector: string;
  zone: string;
  propertyType: string;
  status: 'Available' | 'Sold' | 'Reserved' | 'Under Maintenance';
  unitType: string;
  bua?: number; // Built-up Area
  hasLift?: boolean;
  plotSize?: number;
  unitValue?: number;
  handoverDate?: string;
  anticipatedHandoverDate?: string;
  owner?: string;
}

export interface PropertyFilters {
  zone?: string;
  sector?: string;
  unitType?: string;
  status?: string;
  sortBy?: 'unitNo' | 'unitValue' | 'bua' | 'handoverDate';
  sortOrder?: 'asc' | 'desc';
}
