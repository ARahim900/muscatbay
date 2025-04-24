
/**
 * React hook for water data management
 */
import { useState, useEffect } from 'react';
import { fetchWaterData, getZoneConsumption, calculateSystemEfficiency } from '@/services/waterService';
import { WaterConsumptionData, WaterZone, WaterFilter } from '@/types/water';

export const useWaterData = (initialFilters: Partial<WaterFilter> = {}) => {
  const [data, setData] = useState<WaterConsumptionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WaterFilter>({
    month: initialFilters.month || 'current',
    zone: initialFilters.zone || 'all',
    type: initialFilters.type || 'all',
  });

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
  
  // Get zone consumption data
  const zoneData: WaterZone[] = data ? getZoneConsumption(data) : [];
  
  // Calculate system efficiency
  const systemEfficiency: number = data ? calculateSystemEfficiency(data) : 0;
  
  const updateFilters = (newFilters: Partial<WaterFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  return {
    data,
    zoneData,
    systemEfficiency,
    loading,
    error,
    filters,
    updateFilters
  };
};
