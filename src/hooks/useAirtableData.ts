
import { useState, useEffect } from 'react';
import { fetchTableData } from '@/services/airtableService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseAirtableDataOptions {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
  sort?: Array<{field: string, direction: 'asc' | 'desc'}>;
  enabled?: boolean;
  useFallback?: boolean;
}

export default function useAirtableData<T = any>(
  tableName: string,
  options: UseAirtableDataOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { enabled = true, useFallback = true, ...queryOptions } = options;

  const finalQueryOptions = {...queryOptions};
  if (finalQueryOptions.view === 'Grid view') {
    delete finalQueryOptions.view;
  }

  const fetchFromSupabase = async () => {
    try {
      const supabaseTable = getSupabaseTableName(tableName);
      
      if (!supabaseTable) {
        throw new Error('No Supabase table mapping found');
      }
      
      const { data: supabaseData, error: supabaseError } = await supabase
        .from(supabaseTable as any)
        .select('*');
        
      if (supabaseError) throw supabaseError;
      
      if (supabaseData && supabaseData.length > 0) {
        console.log(`Successfully loaded fallback data from Supabase table: ${supabaseTable}`);
        return supabaseData as T[];
      }
      
      throw new Error('No data found in Supabase');
    } catch (err) {
      console.error('Fallback Supabase load failed:', err);
      return null;
    }
  };
  
  const getSupabaseTableName = (airtableTable: string) => {
    const tableMap: Record<string, string> = {
      'shrjrIEpBjAANAxZy': 'water_distribution_master',
      // Add more mappings as needed
    };
    
    return tableMap[airtableTable];
  };

  const fetchData = async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching data from Airtable table: ${tableName}`);
      const fetchedData = await fetchTableData(tableName, finalQueryOptions);
      console.log('Fetched data:', fetchedData);
      setData(fetchedData as T[]);
    } catch (err) {
      console.error('Error fetching Airtable data:', err);
      
      let errorMessage = 'An unknown error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        if ('statusCode' in err && typeof err.statusCode === 'number') {
          if (err.statusCode === 403) {
            errorMessage = 'Authentication error: Please check your Airtable API key and permissions';
            
            if (useFallback) {
              const fallbackData = await fetchFromSupabase();
              
              if (fallbackData) {
                setData(fallbackData);
                setIsLoading(false);
                toast.info('Using stored data instead of live Airtable connection');
                return;
              }
            }
          } else if (err.statusCode === 404) {
            errorMessage = `Table "${tableName}" not found. Please check table name`;
          } else if (err.statusCode === 422) {
            errorMessage = `Table view issue. Using default view instead.`;
            try {
              const retryOptions = {...finalQueryOptions};
              delete retryOptions.view;
              const fetchedData = await fetchTableData(tableName, retryOptions);
              setData(fetchedData as T[]);
              setIsLoading(false);
              return;
            } catch (retryErr) {
              console.error('Retry failed:', retryErr);
              errorMessage = `Unable to access table "${tableName}" after retry`;
            }
          }
        }
        
        if ('error' in err && typeof err.error === 'string') {
          errorMessage = `API Error: ${err.error}`;
        }
        
        if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message;
        }
      }
      
      const error = new Error(errorMessage);
      setError(error);
      
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
  }, [tableName, JSON.stringify(finalQueryOptions), enabled]);

  return { data, isLoading, error, refetch: fetchData };
}
