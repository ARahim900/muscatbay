
import { useState, useEffect } from 'react';
import { fetchElectricityData } from '@/services/electricityService';
import { ElectricityFilters } from '@/types/electricity';

export const useElectricityData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ElectricityFilters>({
    year: new Date().getFullYear(),
    month: 'all',
    zone: 'all',
    type: 'all',
    view: 'overview'
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const electricityData = await fetchElectricityData(signal);
        setData(electricityData);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error loading electricity data:', err);
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

  // Filter data based on current filters
  const filteredData = data ? data.filter((item: any) => {
    const matchesZone = filters.zone === 'all' || item.zone === filters.zone;
    const matchesType = filters.type === 'all' || item.type === filters.type;
    return matchesZone && matchesType;
  }) : [];

  // Update filters
  const updateFilters = (newFilters: Partial<ElectricityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    data,
    filteredData,
    loading,
    error,
    filters,
    updateFilters
  };
};
