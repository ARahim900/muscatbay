
// Operating Expense type
export interface OperatingExpense {
  id: string;
  category: string;
  description: string;
  monthly: number;
  annual: number;
  status: 'Budgeted' | 'Actual' | 'Projected';
  year: number;
  quarter?: number;
  month?: number;
  notes?: string;
}

// Property Unit type
export interface PropertyUnit {
  id: string;
  unit_no: string;
  sector: string;
  property_type: string;
  status: string;
  unit_type: string;
  bua: number;
  plot_size: number;
  unit_value: number;
  handover_date: string;
  anticipated_handover_date: string | null;
}

// Property Owner type
export interface PropertyOwner {
  id: string;
  client_name: string;
  client_name_arabic: string | null;
  email: string;
  nationality: string;
  region: string;
  date_of_birth: string;
}

// Property Transaction type
export interface PropertyTransaction {
  id: string;
  property_id: string;
  owner_id: string;
  spa_date: string;
  property: PropertyUnit;
  owner: PropertyOwner;
}

// Expense Display type (for UI)
export interface ExpenseDisplay {
  category: string;
  quarterly: number[];
  monthly: number[];
  annual: number;
  percentage: number;
  previousYear?: number;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

// Service Charge Zone type
export interface ServiceChargeZone {
  id: string;
  name: string;
  code: string;
  totalBUA: number;
  unitCount: number;
  serviceChargeRate: number;
  reserveFundRate: number;
}
