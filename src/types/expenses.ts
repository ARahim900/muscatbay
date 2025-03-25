// Operating Expense type
export interface OperatingExpense {
  id: string;
  category: string;
  description: string;
  service_provider: string;
  service_type: string;
  monthly_cost: number;
  annual_cost: number;
  status: 'Active' | 'Pending' | 'Expired';
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

// Expense Summary By Status
export interface ExpenseSummaryByStatus {
  status: string;
  count: number;
  total_monthly_cost: number;
  total_annual_cost: number;
}

// Expense Summary By Type
export interface ExpenseSummaryByType {
  service_type: string;
  count: number;
  total_monthly_cost: number;
  total_annual_cost: number;
}

// Operating Expense Display for UI
export interface OperatingExpenseDisplay extends ExpenseDisplay {
  // Additional UI-specific properties
}

// Reserve Fund Rate type
export interface ReserveFundRate {
  zone: string;
  zoneName: string;
  rate: number;
  effectiveDate: string;
  notes?: string;
}

// Service Charge Calculator Props
export interface ServiceChargeCalculatorProps {
  expenses: OperatingExpenseDisplay[];
  reserveFundRates: ReserveFundRate[];
}

// Service Charge Expenses Props
export interface ServiceChargeExpensesProps {
  expenses: OperatingExpenseDisplay[];
  reserveFundRates: ReserveFundRate[];
}

// Service Charge Overview Props
export interface ServiceChargeOverviewProps {
  expenses: OperatingExpenseDisplay[];
  reserveFundRates: ReserveFundRate[];
}
