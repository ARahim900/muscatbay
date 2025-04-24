
import { useState, useEffect } from 'react';
import { ElectricityConsumptionData, ElectricityRecord } from '@/types/electricity';
import { fetchData } from '@/services/dataService';

export const useElectricityData = () => {
  const [data, setData] = useState<ElectricityConsumptionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElectricityData = async () => {
      try {
        setLoading(true);
        
        // Load data from JSON file
        const jsonData = await fetchData<any>('electricity/consumption.json');
        
        // Transform data to our expected format
        const transformedData: ElectricityConsumptionData = {
          records: jsonData.records || [],
          total: jsonData.total || { consumption: 0, cost: 0 },
          trends: jsonData.trends || {}
        };
        
        setData(transformedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching electricity data:', err);
        setError('Failed to load electricity data');
        setLoading(false);
      }
    };
    
    fetchElectricityData();
  }, []);

  // Function to generate random colors
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
