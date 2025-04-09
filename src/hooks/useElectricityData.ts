
import { useState, useEffect } from 'react';
import { fetchElectricityData } from '@/services/api/electricityService';
import { ElectricityConsumptionData } from '@/types/electricitySystem';
import { toast } from 'sonner';
import { ElectricityRecord } from '@/types/electricity';

interface UseElectricityDataOptions {
  useFallback?: boolean;
  initialData?: ElectricityConsumptionData[] | ElectricityRecord[];
}

const useElectricityData = <T = ElectricityConsumptionData | ElectricityRecord>(
  tableId: string,
  options: UseElectricityDataOptions = {}
) => {
  const [data, setData] = useState<T[]>(options.initialData as T[] || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchElectricityData<T>({ maxRecords: 1000 });
      setData(result as T[]);
      return result;
    } catch (err) {
      console.error('Error in useElectricityData hook:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      if (options.useFallback && options.initialData) {
        toast.warning('Using fallback data due to API connection issue');
        setData(options.initialData as T[]);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData().catch(err => {
      // Error is already handled in fetchData
    });
  }, [tableId]);

  const refetch = async () => {
    return fetchData();
  };

  return {
    data,
    isLoading,
    error,
    refetch
  };
};

export default useElectricityData;
