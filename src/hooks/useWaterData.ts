
import { useState, useEffect } from 'react';
import { WaterConsumptionData } from '@/types/water';

export const useWaterData = () => {
  const [data, setData] = useState<WaterConsumptionData | null>(null);
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
            loss: 2865,
            cost: 14470
          },
          zones: [
            {
              id: 'z1',
              name: 'Residential',
              consumption: 28940,
              loss: 1736,
              trend: {
                'Jan': 27500,
                'Feb': 28100,
                'Mar': 28400,
                'Apr': 28940,
                'May': 29300,
                'Jun': 30100
              }
            },
            {
              id: 'z2',
              name: 'Commercial',
              consumption: 12450,
              loss: 747,
              trend: {
                'Jan': 11900,
                'Feb': 12200,
                'Mar': 12000,
                'Apr': 12450,
                'May': 12600,
                'Jun': 12800
              }
            },
            {
              id: 'z3',
              name: 'Common Areas',
              consumption: 6844,
              loss: 382,
              trend: {
                'Jan': 6500,
                'Feb': 6600,
                'Mar': 6750,
                'Apr': 6844,
                'May': 6900,
                'Jun': 7100
              }
            }
          ],
          trend: {
            'Jan': 45900,
            'Feb': 46900,
            'Mar': 47150,
            'Apr': 48234,
            'May': 48800,
            'Jun': 50000
          }
        };
        
        setData(mockData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching water data:', err);
        setError('Failed to load water data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return { data, loading, error };
};
