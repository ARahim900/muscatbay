
import { useState, useEffect } from 'react';
import { ElectricityRecord, ElectricityConsumptionData } from '@/types/electricity';

export const useElectricityData = () => {
  const [data, setData] = useState<ElectricityConsumptionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Mock data for now
        const mockData: ElectricityConsumptionData = {
          records: [
            { id: 'e1', zone: 'Residential', consumption: 1500, cost: 135 },
            { id: 'e2', zone: 'Commercial', consumption: 2800, cost: 252 },
            { id: 'e3', zone: 'Common Areas', consumption: 950, cost: 85.5 }
          ],
          total: {
            consumption: 5250,
            cost: 472.5
          },
          trends: {
            'Jan': 5100,
            'Feb': 5200,
            'Mar': 5150,
            'Apr': 5250,
            'May': 5300,
            'Jun': 5500
          }
        };
        
        setData(mockData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching electricity data:', err);
        setError('Failed to load electricity data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fixed by removing the argument
  const getRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return { data, loading, error, getRandomColor };
};
