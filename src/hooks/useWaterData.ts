
/**
 * React hook for water data management
 */
import { useState, useEffect } from 'react';
import { fetchWaterData, calculateEfficiency } from '@/services/waterService';
import { WaterConsumptionData, WaterSystemData } from '@/types/water';

export const useWaterData = () => {
  const [data, setData] = useState<WaterConsumptionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    zone: 'all',
    period: 'monthly',
    view: 'overview'
  });
  
  // Derived state
  const systemEfficiency = data ? calculateEfficiency(
    data.total.consumption, 
    data.total.loss
  ) : 0;
  
  const zoneData = data ? data.zones.map(zone => ({
    name: zone.name,
    consumption: zone.consumption,
    loss: zone.loss,
    efficiency: calculateEfficiency(zone.consumption, zone.loss)
  })) : [];

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
  
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    data,
    loading,
    error,
    zoneData,
    systemEfficiency,
    updateFilters
  };
};
