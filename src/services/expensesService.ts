
/**
 * Expenses management service for Muscat Bay operations web application
 */
import { fetchData } from './dataService';
import { Expense, ExpenseCategory, ExpenseSummary } from '@/types/expenses';

/**
 * Fetches expenses data
 * @param options Filter options for expenses
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with expenses data
 */
export async function fetchExpenses(
  options: { 
    year?: number, 
    month?: number, 
    category?: string
  } = {},
  signal?: AbortSignal
): Promise<Expense[]> {
  try {
    const response = await fetchData<{metadata: any, data: Expense[]}>(
      'expenses/expenses.json',
      {
        signal,
        errorMessage: 'Failed to load expenses data'
      }
    );
    
    let filteredData = response.data || [];
    
    // Apply filters if provided
    if (options.year) {
      filteredData = filteredData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === options.year;
      });
    }
    
    if (options.month) {
      filteredData = filteredData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === options.month - 1; // JavaScript months are 0-indexed
      });
    }
    
    if (options.category) {
      filteredData = filteredData.filter(expense => expense.category === options.category);
    }
    
    return filteredData;
  } catch (error) {
    console.error('Error in fetchExpenses:', error);
    return [];
  }
}

/**
 * Gets available expense categories
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with expense categories
 */
export async function getExpenseCategories(signal?: AbortSignal): Promise<ExpenseCategory[]> {
  try {
    const response = await fetchData<{metadata: any, data: ExpenseCategory[]}>(
      'expenses/categories.json',
      {
        signal,
        errorMessage: 'Failed to load expense categories'
      }
    );
    
    return response.data || [];
  } catch (error) {
    console.error('Error in getExpenseCategories:', error);
    return [];
  }
}

/**
 * Calculates expense summary by category
 * @param expenses Expenses data
 * @returns Expense summary by category
 */
export function calculateExpenseSummaryByCategory(expenses: Expense[]): ExpenseSummary[] {
  if (!expenses || expenses.length === 0) {
    return [];
  }
  
  const categorySummary: Record<string, ExpenseSummary> = {};
  
  expenses.forEach(expense => {
    const category = expense.category || 'Uncategorized';
    
    if (!categorySummary[category]) {
      categorySummary[category] = {
        category,
        total: 0,
        count: 0,
        percentage: 0
      };
    }
    
    categorySummary[category].total += expense.amount;
    categorySummary[category].count++;
  });
  
  // Calculate total across all categories
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate percentage of total for each category
  return Object.values(categorySummary).map(summary => ({
    ...summary,
    percentage: totalAmount > 0 ? (summary.total / totalAmount) * 100 : 0
  }));
}

/**
 * Calculates monthly expense totals
 * @param expenses Expenses data
 * @param year Year to filter by
 * @returns Monthly expense totals
 */
export function calculateMonthlyExpenseTotals(
  expenses: Expense[],
  year?: number
): Record<string, number> {
  if (!expenses || expenses.length === 0) {
    return {};
  }
  
  const filteredExpenses = year 
    ? expenses.filter(expense => new Date(expense.date).getFullYear() === year)
    : expenses;
  
  const monthlyTotals: Record<string, number> = {};
  
  filteredExpenses.forEach(expense => {
    const expenseDate = new Date(expense.date);
    const month = expenseDate.getMonth(); // 0-indexed
    const monthName = expenseDate.toLocaleString('default', { month: 'short' });
    
    if (!monthlyTotals[monthName]) {
      monthlyTotals[monthName] = 0;
    }
    
    monthlyTotals[monthName] += expense.amount;
  });
  
  return monthlyTotals;
}
