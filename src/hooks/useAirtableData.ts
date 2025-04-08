
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
  
  const { enabled = true, useFallback = true, ...queryOptions } = options;

  // Remove 'Grid view' from options if present
  const finalQueryOptions = {...queryOptions};
  if (finalQueryOptions.view === 'Grid view') {
    delete finalQueryOptions.view;
  }

  // Function to attempt to load data from Supabase if connected
  const fetchFromSupabase = async () => {
    try {
      // Try to get the table name mapped to a Supabase table
      const supabaseTable = getSupabaseTableName(tableName);
      
      if (!supabaseTable) {
        throw new Error('No Supabase table mapping found');
      }
      
      const { data: supabaseData, error: supabaseError } = await supabase
        .from(supabaseTable)
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
  
  // Helper function to map Airtable table names to Supabase table names
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
      
      // Create a more informative error message
      let errorMessage = 'An unknown error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // Try to extract more detailed error information
        if ('statusCode' in err && typeof err.statusCode === 'number') {
          if (err.statusCode === 403) {
            errorMessage = 'Authentication error: Please check your Airtable API key and permissions';
            
            // Try to use fallback data if Airtable permission fails
            if (useFallback) {
              const fallbackData = await fetchFromSupabase();
              
              if (fallbackData) {
                setData(fallbackData);
                setIsLoading(false);
                toast.info('Using stored data instead of live Airtable connection');
                return; // Exit early with successful fallback
              }
            }
          } else if (err.statusCode === 404) {
            errorMessage = `Table "${tableName}" not found. Please check table name`;
          } else if (err.statusCode === 422) {
            errorMessage = `Table view issue. Using default view instead.`;
            // Try again without specifying a view
            try {
              const retryOptions = {...finalQueryOptions};
              delete retryOptions.view;
              const fetchedData = await fetchTableData(tableName, retryOptions);
              setData(fetchedData as T[]);
              setIsLoading(false);
              return; // Exit early if successful
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
      
      // Only show toast for non-network errors
      if (!navigator.onLine) {
        toast.error('Network connection issue. Please check your internet connection.');
      } else {
        toast.error(`Failed to fetch data: ${errorMessage}`);
      }
      
      // Load mock data if Airtable fails and there's no Supabase fallback
      if (useFallback) {
        try {
          // Try to load mock data based on the table name
          const mockData = await loadMockData(tableName);
          if (mockData) {
            setData(mockData as T[]);
            toast.info('Using mock data instead of live Airtable connection');
          }
        } catch (mockErr) {
          console.error('Failed to load mock data:', mockErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to load mock data
  const loadMockData = async (tableName: string) => {
    // Determine which mock data to load based on the table name
    if (tableName.includes('shrjrIEpBjAANAxZy')) {
      // Water system mock data
      return generateWaterMockData();
    }
    
    return null;
  };
  
  // Generate water system mock data
  const generateWaterMockData = () => {
    const zones = ['Zone 01', 'Zone 02', 'Zone 03', 'Zone 04', 'Zone 05'];
    const types = ['Residential', 'Commercial', 'Irrigation', 'Common Areas'];
    const levels = ['L1', 'L2', 'L3', 'DC'];
    
    const mockData = [];
    
    // L1 meter - Main bulk meter
    mockData.push({
      id: 'rec1',
      'Meter Label': 'Main Bulk Meter',
      'Acct #': 1001,
      'Zone': 'All',
      'Type': 'Main Supply',
      'Label': 'L1',
      'Jan-25': 25000,
      'Feb-25': 24500,
      'Parent Meter': null
    });
    
    // L2 meters - Zone bulk meters
    for (let i = 0; i < zones.length; i++) {
      mockData.push({
        id: `rec${i + 2}`,
        'Meter Label': `${zones[i]} Bulk Meter`,
        'Acct #': 2000 + i,
        'Zone': zones[i],
        'Type': 'Bulk Supply',
        'Label': 'L2',
        'Jan-25': 4500 + Math.floor(Math.random() * 500),
        'Feb-25': 4300 + Math.floor(Math.random() * 500),
        'Parent Meter': 'Main Bulk Meter'
      });
    }
    
    // L3 meters - Individual meters
    let meterCount = zones.length + 2;
    zones.forEach(zone => {
      types.forEach(type => {
        const meterCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < meterCount; i++) {
          mockData.push({
            id: `rec${meterCount++}`,
            'Meter Label': `${zone} ${type} Meter ${i + 1}`,
            'Acct #': 3000 + meterCount,
            'Zone': zone,
            'Type': type,
            'Label': 'L3',
            'Jan-25': 800 + Math.floor(Math.random() * 300),
            'Feb-25': 750 + Math.floor(Math.random() * 300),
            'Parent Meter': `${zone} Bulk Meter`
          });
        }
      });
    });
    
    // Direct connections
    for (let i = 0; i < 3; i++) {
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      
      mockData.push({
        id: `rec${meterCount++}`,
        'Meter Label': `DC-${zone}-${i + 1}`,
        'Acct #': 4000 + i,
        'Zone': zone,
        'Type': type,
        'Label': 'DC',
        'Jan-25': 300 + Math.floor(Math.random() * 100),
        'Feb-25': 280 + Math.floor(Math.random() * 100),
        'Parent Meter': `${zone} Bulk Meter`
      });
    }
    
    return mockData;
  };

  useEffect(() => {
    fetchData();
  }, [tableName, JSON.stringify(finalQueryOptions), enabled]);

  return { data, isLoading, error, refetch: fetchData };
}
