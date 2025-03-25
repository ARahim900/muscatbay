export interface OperatingExpense {
  id: string;
  service_provider: string;
  service_type: string;
  monthly_cost: number;
  annual_cost: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSummaryByType {
  service_type: string;
  count: number;
  total_monthly_cost: number;
  total_annual_cost: number;
}

export interface ExpenseSummaryByStatus {
  status: string;
  count: number;
  total_monthly_cost: number;
  total_annual_cost: number;
}

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
  handover_date: string | null;
  anticipated_handover_date: string | null;
}

export interface PropertyOwner {
  id: string;
  client_name: string;
  client_name_arabic: string | null;
  email: string | null;
  nationality: string | null;
  region: string | null;
  date_of_birth: string | null;
}

export interface PropertyTransaction {
  id: string;
  property_id: string;
  owner_id: string;
  spa_date: string | null;
  property: PropertyUnit;
  owner: PropertyOwner;
}

export interface ServiceChargeData {
  [key: string]: {
    name: string;
    unitTypes: {
      [key: string]: {
        name: string;
        baseRate: number;
        sizes: number[];
      }
    }
  }
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

export interface ReserveFundRate {
  zone: string;
  zoneName: string;
  rate: number;
  effectiveDate: string;
  notes?: string;
}

export interface OperatingExpense {
  category: string;
  supplier: string;
  annual: number;
  allocation: string;
  description?: string;
}
