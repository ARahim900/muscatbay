
import { fetchData } from './dataService';

/**
 * Service for retrieving expense data
 */

/**
 * Fetches operating expenses data
 * @returns Promise with expenses data
 */
export async function fetchExpensesData(): Promise<any> {
  try {
    const data = await fetchData<any>('expenses/operating-expenses.json');
    return data;
  } catch (error) {
    console.error('Error fetching expenses data:', error);
    throw new Error('Failed to load expenses data');
  }
}

/**
 * Fetches expense summary by type
 * @returns Promise with expense summary by type
 */
export async function fetchExpenseSummaryByType(): Promise<any> {
  try {
    const data = await fetchData<any>('expenses/summary-by-type.json');
    return data;
  } catch (error) {
    console.error('Error fetching expense summary by type:', error);
    throw new Error('Failed to load expense summary by type');
  }
}

/**
 * Fetches expense summary by status
 * @returns Promise with expense summary by status
 */
export async function fetchExpenseSummaryByStatus(): Promise<any> {
  try {
    const data = await fetchData<any>('expenses/summary-by-status.json');
    return data;
  } catch (error) {
    console.error('Error fetching expense summary by status:', error);
    throw new Error('Failed to load expense summary by status');
  }
}
