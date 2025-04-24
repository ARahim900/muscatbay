
import { useState, useEffect } from 'react';
import { 
  fetchSTPDailyData, 
  fetchSTPMonthlyData, 
  filterDataByDateRange, 
  calculateMonthlyAggregates
} from '@/services/stpService';
import { STPDailyRecord, STPMonthlyAggregate, STPFilters } from '@/types/stp';

export const useSTPData = () => {
  const [dailyData, setDailyData] = useState<STPDailyRecord[]>([]);
  const [monthlyData, setMonthlyData] = useState<STPMonthlyAggregate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<STPFilters>({
    year: new Date().getFullYear(),
    month: 'all',
    view: 'daily',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load daily data
        const stpDailyData = await fetchSTPDailyData(signal);
        setDailyData(stpDailyData);
        
        // Load monthly data
        const stpMonthlyData = await fetchSTPMonthlyData(signal);
        setMonthlyData(stpMonthlyData as STPMonthlyAggregate[]);
        
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error loading STP data:', err);
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

  // Get filtered daily data
  const getFilteredDailyData = (): STPDailyRecord[] => {
    if (dailyData.length === 0) return [];
    
    let filtered = [...dailyData];
    
    // Filter by year
    filtered = filtered.filter(record => {
      const date = new Date(record.date);
      return date.getFullYear() === filters.year;
    });
    
    // Filter by month if needed
    if (filters.month !== 'all') {
      filtered = filtered.filter(record => {
        const date = new Date(record.date);
        return date.getMonth() === (filters.month as number) - 1; // Month is 0-indexed in JS
      });
    }
    
    // Sort the data
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy] || 0;
      const bValue = b[filters.sortBy] || 0;
      
      if (filters.sortBy === 'date') {
        const aDate = new Date(a.date).getTime();
        const bDate = new Date(b.date).getTime();
        return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      return filters.sortOrder === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
    });
    
    return filtered;
  };

  // Update filters
  const updateFilters = (newFilters: Partial<STPFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    dailyData,
    monthlyData,
    filteredDailyData: getFilteredDailyData(),
    loading,
    error,
    filters,
    updateFilters
  };
};
