
/**
 * Expenses data service for Muscat Bay operations web application
 */
import { fetchData } from './dataService';
import { Expense, ExpenseCategory, ExpenseSummary } from '@/types/expenses';

/**
 * Fetches expenses data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with expenses data
 */
export async function fetchExpenses(signal?: AbortSignal): Promise<Expense[]> {
  try {
    const response = await fetchData<{ expenses: Expense[] }>(
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
 * Categorizes expenses by their service type
 * @param expenses Array of expenses
 * @returns Expense categories with their respective expenses
 */
export function categorizeExpensesByType(expenses: Expense[]): ExpenseCategory[] {
  if (!expenses || expenses.length === 0) return [];
  
  // Group expenses by category
  const categorizedExpenses: Record<string, Expense[]> = {};
  
  expenses.forEach(expense => {
    const category = expense.category || 'Uncategorized';
    if (!categorizedExpenses[category]) {
      categorizedExpenses[category] = [];
    }
    
    categorizedExpenses[category].push(expense);
  });
  
  // Convert grouped expenses to summary array
  return Object.entries(categorizedExpenses).map(([category, categoryExpenses]) => {
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.annualCost, 0);
    
    return {
      name: category,
      total,
      count: categoryExpenses.length,
      expenses: categoryExpenses
    };
  }).sort((a, b) => b.total - a.total);
}

/**
 * Generates a summary of expenses
 * @param expenses Array of expenses
 * @returns Expense summary data
 */
export function generateExpensesSummary(expenses: Expense[]): ExpenseSummary {
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
  
  const categoryCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  
  let totalAnnual = 0;
  let totalMonthly = 0;
  
  expenses.forEach(expense => {
    // Count by category
    const category = expense.category || 'Uncategorized';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    byCategory[category] = (byCategory[category] || 0) + expense.annualCost;
    
    // Count by status
    const status = expense.status || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    byStatus[status] = (byStatus[status] || 0) + expense.annualCost;
    
    // Calculate totals
    totalAnnual += expense.annualCost || 0;
    totalMonthly += expense.monthlyCost || 0;
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
