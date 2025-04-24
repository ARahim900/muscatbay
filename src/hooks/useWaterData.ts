
import { useState, useEffect } from 'react';
import { WaterConsumptionData } from '@/types/water';

export const useWaterData = () => {
  const [data, setData] = useState<WaterConsumptionData | null>(null);
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [systemEfficiency, setSystemEfficiency] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Mock data for now
        const mockData: WaterConsumptionData = {
          metadata: {
            version: '1.0',
            timestamp: new Date().toISOString(),
            description: 'Water consumption data'
          },
          total: {
            consumption: 48234,
            loss: 2511,
            cost: 4250
          },
          zones: [
            {
              id: 'z1',
              name: 'Zone A',
              consumption: 12543,
              loss: 780,
              trend: { 'Jan': 11800, 'Feb': 12100, 'Mar': 12543 }
            },
            {
              id: 'z2',
              name: 'Zone B',
              consumption: 18320,
              loss: 1150,
              trend: { 'Jan': 17900, 'Feb': 18100, 'Mar': 18320 }
            }
          ],
          trend: {
            'Jan': 46100,
            'Feb': 47200,
            'Mar': 48234
          }
        };
        
        // Calculate system efficiency
        const totalConsumption = mockData.total.consumption;
        const totalLoss = mockData.total.loss;
        const efficiency = totalConsumption > 0 ? 
          ((totalConsumption - totalLoss) / totalConsumption) * 100 : 0;
        
        // Format zone data for display
        const zones = mockData.zones.map(zone => ({
          name: zone.name,
          consumption: zone.consumption,
          loss: zone.loss,
          percentage: totalConsumption > 0 ? (zone.consumption / totalConsumption) * 100 : 0
        }));
        
        setData(mockData);
        setZoneData(zones);
        setSystemEfficiency(parseFloat(efficiency.toFixed(1)));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching water data:', err);
        setError('Failed to load water data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const updateFilters = (filters: any) => {
    console.log('Updating filters:', filters);
    // In a real app, this would filter the data based on the provided filters
  };

  return { data, zoneData, systemEfficiency, loading, error, updateFilters };
};
