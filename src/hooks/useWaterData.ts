
import { useState, useEffect } from 'react';
import { WaterConsumptionData } from '@/types/water';

export const useWaterData = () => {
  const [data, setData] = useState<any>(null);
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [systemEfficiency, setSystemEfficiency] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Mock data for the water system dashboard
        const mockData = {
          total: {
            consumption: 481310,
            loss: 52941.24
          },
          zones: {
            "Zone A": { consumption: 125482, loss: 15698.3 },
            "Zone B": { consumption: 98763, loss: 12478.9 },
            "Zone C": { consumption: 156894, loss: 18234.7 },
            "Zone D": { consumption: 100171, loss: 6529.34 }
          }
        };
        
        // Calculate system efficiency
        const totalWater = mockData.total.consumption + mockData.total.loss;
        const efficiency = (mockData.total.consumption / totalWater) * 100;
        
        // Transform zone data for visualization
        const transformedZoneData = Object.entries(mockData.zones).map(([name, data]) => ({
          name,
          consumption: data.consumption,
          loss: data.loss,
          total: data.consumption + data.loss,
          efficiency: ((data.consumption / (data.consumption + data.loss)) * 100).toFixed(1)
        }));
        
        setData(mockData);
        setZoneData(transformedZoneData);
        setSystemEfficiency(parseFloat(efficiency.toFixed(1)));
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch water data", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const updateFilters = (filters: any) => {
    console.log("Filters updated:", filters);
    // In a real implementation, this would refetch data with the new filters
  };
  
  return {
    data,
    zoneData,
    systemEfficiency,
    loading,
    error,
    updateFilters
  };
};

export default useWaterData;
