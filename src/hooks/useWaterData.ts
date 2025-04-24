
/**
 * React hook for water data management
 */
import { useState, useEffect } from 'react';
import { fetchWaterData } from '@/services/waterService';
import { WaterConsumptionData } from '@/types/water';

export const useWaterData = () => {
  const [data, setData] = useState<WaterConsumptionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const waterData = await fetchWaterData(signal);
        setData(waterData);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error loading water data:', err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Clean up on unmount
    return () => {
      controller.abort();
    };
  }, []);

  return {
    data,
    loading,
    error
  };
};
