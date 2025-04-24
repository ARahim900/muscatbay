
/**
 * React hook for STP (Sewage Treatment Plant) data management
 */
import { useState, useEffect } from 'react';
import { 
  fetchSTPDailyData, 
  filterDataByDateRange, 
  filterDataByTimeRange,
  calculateMonthlyAggregates 
} from '@/services/stpService';
import { STPDailyRecord, STPMonthlyAggregate, STPFilters } from '@/types/stp';

export const useSTPData = (initialFilters: Partial<STPFilters> = {}) => {
  const [rawData, setRawData] = useState<STPDailyRecord[]>([]);
  const [filteredData, setFilteredData] = useState<STPDailyRecord[]>([]);
  const [monthlyData, setMonthlyData] = useState<STPMonthlyAggregate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<STPFilters>({
    timeRange: initialFilters.timeRange || 'ALL',
    year: initialFilters.year || 'all',
    month: initialFilters.month || 'all',
    aggregation: initialFilters.aggregation || 'daily'
  });

  // Load initial data
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const stpData = await fetchSTPDailyData(signal);
        setRawData(stpData);
        
        // Apply initial filters
        applyFilters(stpData, filters);
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

  // Apply filters when they change
  useEffect(() => {
    applyFilters(rawData, filters);
  }, [rawData, filters]);
  
  // Function to apply filters to the raw data
  const applyFilters = (data: STPDailyRecord[], currentFilters: STPFilters) => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      setMonthlyData([]);
      return;
    }
    
    let result: STPDailyRecord[];
    
    // Apply time range filter
    if (currentFilters.timeRange !== 'ALL') {
      result = filterDataByTimeRange(data, currentFilters.timeRange);
    } else {
      // Apply year and month filters
      result = data.filter(record => {
        const recordDate = new Date(record.date);
        
        if (currentFilters.year !== 'all') {
          const recordYear = recordDate.getFullYear().toString();
          if (recordYear !== currentFilters.year) return false;
        }
        
        if (currentFilters.month !== 'all') {
          const recordMonth = (recordDate.getMonth() + 1).toString().padStart(2, '0');
          if (recordMonth !== currentFilters.month) return false;
        }
        
        return true;
      });
    }
    
    // Set the filtered daily data
    setFilteredData(result);
    
    // Calculate monthly aggregates
    const aggregates = calculateMonthlyAggregates(result);
    setMonthlyData(aggregates);
  };
  
  // Update filters
  const updateFilters = (newFilters: Partial<STPFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  return {
    rawData,
    filteredData,
    monthlyData,
    loading,
    error,
    filters,
    updateFilters
  };
};
