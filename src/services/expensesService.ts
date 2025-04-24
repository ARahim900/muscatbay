
import { fetchData } from './dataService';

/**
 * Fetches expenses data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with expenses data
 */
export async function fetchExpenses(signal?: AbortSignal): Promise<any[]> {
  try {
    const response = await fetchData<{ expenses: any[] }>(
      'expenses/expenses.json',
      {
        signal,
        errorMessage: 'Failed to load expenses data'
      }
    );
    
    return response.expenses || [];
  } catch (error) {
    console.error('Error in fetchExpenses:', error);
    throw error;
  }
}

/**
 * Categorizes expenses by category
 * @param expenses Array of expenses
 * @returns Object with expenses categorized by their category
 */
export function categorizeExpensesByCategory(expenses: any[]): Record<string, any[]> {
  if (!expenses || expenses.length === 0) return {};
  
  const categorized: Record<string, any[]> = {};
  
  expenses.forEach(expense => {
    const category = expense.category || 'Uncategorized';
    
    if (!categorized[category]) {
      categorized[category] = [];
    }
    
    categorized[category].push(expense);
  });
  
  return categorized;
}

/**
 * Calculates expense summary
 * @param expenses Array of expenses
 * @returns Summary object with various aggregations
 */
export function calculateExpenseSummary(expenses: any[]): any {
  if (!expenses || expenses.length === 0) {
    return {
      totalAnnual: 0,
      totalMonthly: 0,
      categoryCounts: {},
      statusCounts: {},
      byCategory: {},
      byStatus: {}
    };
  }
  
  let totalAnnual = 0;
  let totalMonthly = 0;
  const categoryCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  
  expenses.forEach(expense => {
    const category = expense.category || 'Uncategorized';
    const status = expense.status || 'Unknown';
    
    // Update totals
    totalAnnual += expense.annualCost || 0;
    totalMonthly += expense.monthlyCost || 0;
    
    // Update category counts
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    
    // Update status counts
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    
    // Update by category totals
    byCategory[category] = (byCategory[category] || 0) + (expense.annualCost || 0);
    
    // Update by status totals
    byStatus[status] = (byStatus[status] || 0) + (expense.annualCost || 0);
  });
  
  return {
    totalAnnual,
    totalMonthly,
    categoryCounts,
    statusCounts,
    byCategory,
    byStatus
  };
}
