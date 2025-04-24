
import { useState, useEffect } from 'react';
import { fetchSTPDailyData, fetchSTPMonthlyData, processData } from '@/services/stpService';

/**
 * Hook for STP data management
 */
export const useSTPData = () => {
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    plant: 'all',
    dateRange: {
      start: '',
      end: ''
    },
    year: new Date().getFullYear(),
    month: 'all',
    view: 'daily'
  });

  // Fetch data when component mounts
  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch daily data
        const dailyResult = await fetchSTPDailyData();
        const processedDailyData = processData(dailyResult);
        setDailyData(processedDailyData);

        // Fetch monthly data
        const monthlyResult = await fetchSTPMonthlyData();
        setMonthlyData(monthlyResult || []);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error fetching STP data:', err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Clean up on unmount
    return () => {
      controller.abort();
    };
  }, [filters.dateRange, filters.plant]);

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    dailyData,
    monthlyData,
    loading,
    error,
    filters,
    updateFilters
  };
};
