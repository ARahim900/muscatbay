
import { useState, useEffect } from 'react';
import { fetchTableData } from '@/services/airtableService';
import { toast } from 'sonner';

interface UseAirtableDataOptions {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
  sort?: Array<{field: string, direction: 'asc' | 'desc'}>;
  enabled?: boolean;
}

/**
 * Custom hook to fetch data from Airtable
 * @param tableName - The name of the table to fetch from
 * @param options - Optional query parameters and settings
 * @returns Loading state, data, error and refetch function
 */
export default function useAirtableData<T = any>(
  tableName: string,
  options: UseAirtableDataOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { enabled = true, ...queryOptions } = options;

  const fetchData = async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching data from Airtable table: ${tableName}`);
      const fetchedData = await fetchTableData(tableName, queryOptions);
      console.log('Fetched data:', fetchedData);
      setData(fetchedData as T[]);
    } catch (err) {
      console.error('Error fetching Airtable data:', err);
      
      // Create a more informative error message
      let errorMessage = 'An unknown error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // Try to extract more detailed error information
        if ('statusCode' in err && typeof err.statusCode === 'number') {
          if (err.statusCode === 403) {
            errorMessage = 'Authentication error: Please check your Airtable API key and permissions';
          } else if (err.statusCode === 404) {
            errorMessage = `Table "${tableName}" not found. Please check table name`;
          }
        }
        
        if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message;
        }
      }
      
      const error = new Error(errorMessage);
      setError(error);
      
      // Only show toast for non-network errors
      if (!navigator.onLine) {
        toast.error('Network connection issue. Please check your internet connection.');
      } else {
        toast.error(`Failed to fetch data: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName, JSON.stringify(queryOptions), enabled]);

  return { data, isLoading, error, refetch: fetchData };
}
