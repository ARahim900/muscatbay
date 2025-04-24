
import { useState, useEffect } from 'react';
import { WaterSystemData, WaterFilter } from '@/types/water';
import { parseWaterData, getAvailableZones, getAvailableTypes } from '@/services/waterSystemService';

export const useWaterSystem = () => {
  const [waterData, setWaterData] = useState<WaterSystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WaterFilter>({
    month: 'feb_25', // Default to most recent month
    zone: 'all',
    type: 'all'
  });
  const [availableZones, setAvailableZones] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load filter options
        const zones = await getAvailableZones();
        const types = await getAvailableTypes();
        setAvailableZones(zones);
        setAvailableTypes(types);
        
        // Load water data based on current filters
        const data = await parseWaterData(filters);
        setWaterData(data);
      } catch (err) {
        console.error('Error loading water system data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load water system data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [filters]);
  
  const updateFilters = (newFilters: Partial<WaterFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  return {
    waterData,
    loading,
    error,
    filters,
    availableZones,
    availableTypes,
    updateFilters
  };
};
