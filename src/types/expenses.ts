
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
