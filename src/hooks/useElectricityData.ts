
import { useState, useEffect } from 'react';
import { fetchElectricityData } from '@/services/api/electricityService';
import { ElectricityConsumptionData } from '@/types/electricitySystem';

interface UseElectricityDataOptions {
  useFallback?: boolean;
  initialData?: ElectricityConsumptionData[];
}

const useElectricityData = <T = ElectricityConsumptionData>(
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
      setError(err instanceof Error ? err : new Error(String(err)));
      
      if (options.useFallback && options.initialData) {
        setData(options.initialData as T[]);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData().catch(err => {
      console.error('Error in useElectricityData hook:', err);
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
