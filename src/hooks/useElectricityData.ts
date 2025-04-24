
/**
 * React hook for electricity data management
 */
import { useState, useEffect } from 'react';
import { fetchElectricityData, getAvailableMonths, getFacilityTypes } from '@/services/electricityService';
import { ElectricityRecord, ElectricityFilters } from '@/types/electricity';

export const useElectricityData = (initialFilters: Partial<ElectricityFilters> = {}) => {
  const [data, setData] = useState<ElectricityRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [facilityTypes, setFacilityTypes] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<ElectricityFilters>({
    month: initialFilters.month || '',
    type: initialFilters.type || 'all',
    sortBy: initialFilters.sortBy || 'name',
    sortOrder: initialFilters.sortOrder || 'asc',
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
        
        const months = getAvailableMonths(electricityData);
        setAvailableMonths(months);
        
        // Set default month if not specified and months available
        if (!filters.month && months.length > 0) {
          setFilters(prev => ({ ...prev, month: months[months.length - 1] }));
        }
        
        const types = getFacilityTypes(electricityData);
        setFacilityTypes(types);
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
  
  // Filter and sort the data based on current filters
  const filteredData = data.filter(record => {
    // Apply type filter
    if (filters.type !== 'all' && record.type !== filters.type) {
      return false;
    }
    
    return true;
  });
  
  // Sort the filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    if (filters.sortBy === 'name') {
      return filters.sortOrder === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
    
    if (filters.sortBy === 'type') {
      return filters.sortOrder === 'asc' 
        ? a.type.localeCompare(b.type) 
        : b.type.localeCompare(a.type);
    }
    
    if (filters.sortBy === 'consumption' && filters.month) {
      const aConsumption = a.consumption?.[filters.month] || 0;
      const bConsumption = b.consumption?.[filters.month] || 0;
      
      return filters.sortOrder === 'asc' 
        ? aConsumption - bConsumption 
        : bConsumption - aConsumption;
    }
    
    return 0;
  });
  
  const updateFilters = (newFilters: Partial<ElectricityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  return {
    data: sortedData,
    rawData: data,
    loading,
    error,
    filters,
    availableMonths,
    facilityTypes,
    updateFilters
  };
};
