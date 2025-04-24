
/**
 * Type definitions for expenses data
 */

export interface Expense {
  id: string;
  serviceType: string;
  serviceProvider: string;
  status: string;
  annualCost: number;
  monthlyCost: number;
  notes?: string;
  category: string;
  allocation: string;
}

export interface ExpenseCategory {
  name: string;
  total: number;
  count: number;
  expenses: Expense[];
}

export interface ExpenseSummary {
  totalAnnual: number;
  totalMonthly: number;
  categoryCounts: {
    [key: string]: number;
  };
  statusCounts: {
    [key: string]: number;
  };
  byCategory: {
    [key: string]: number;
  };
  byStatus: {
    [key: string]: number;
  };
}
