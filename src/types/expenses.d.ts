
/**
 * Type definitions for expenses management data
 */

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  vendor?: string;
  receiptUrl?: string;
  approvedBy?: string;
  approvalDate?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  budgetAllocation?: number;
  color?: string;
}

export interface ExpenseSummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpenseFilters {
  year?: number;
  month?: number;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}
