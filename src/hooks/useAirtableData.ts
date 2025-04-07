
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
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      console.error('Error fetching Airtable data:', error);
      setError(error);
      toast.error(`Failed to fetch data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName, JSON.stringify(queryOptions), enabled]);

  return { data, isLoading, error, refetch: fetchData };
}
