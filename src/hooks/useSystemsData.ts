
import { useState, useEffect } from 'react';
import { fetchSTPDailyData, fetchSTPMonthlyData } from '@/utils/stpDataFetcher';
import { fetchWaterData } from '@/utils/waterDataUtils';
import { fetchElectricityData } from '@/utils/electricityDataUtils';
import type { STPDailyData, STPMonthlyData } from '@/types/stp';
import type { WaterData } from '@/types/water';
import { ElectricityData } from '@/utils/electricityDataUtils';

interface SystemsDataState {
  stpDailyData: STPDailyData[] | null;
  stpMonthlyData: STPMonthlyData[] | null;
  waterData: WaterData[] | null;
  electricityData: ElectricityData[] | null;
  loading: {
    stp: boolean;
    water: boolean;
    electricity: boolean;
  };
  error: {
    stp: string | null;
    water: string | null;
    electricity: string | null;
  };
}

/**
 * Hook that fetches data from all systems
 */
export const useSystemsData = () => {
  const [state, setState] = useState<SystemsDataState>({
    stpDailyData: null,
    stpMonthlyData: null,
    waterData: null,
    electricityData: null,
    loading: {
      stp: true,
      water: true,
      electricity: true
    },
    error: {
      stp: null,
      water: null,
      electricity: null
    }
  });

  // Fetch STP data
  const fetchSTPData = async () => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, stp: true },
      error: { ...prev.error, stp: null }
    }));

    try {
      // Fetch both daily and monthly data
      const [dailyResult, monthlyResult] = await Promise.all([
        fetchSTPDailyData(),
        fetchSTPMonthlyData()
      ]);

      if (dailyResult.error || monthlyResult.error) {
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, stp: false },
          error: { ...prev.error, stp: dailyResult.error || monthlyResult.error }
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        stpDailyData: dailyResult.data,
        stpMonthlyData: monthlyResult.data,
        loading: { ...prev.loading, stp: false }
      }));
    } catch (error) {
      console.error('Error fetching STP data:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, stp: false },
        error: { ...prev.error, stp: error instanceof Error ? error.message : 'Unknown error' }
      }));
    }
  };

  // Fetch water data
  const fetchWaterSystemData = async () => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, water: true },
      error: { ...prev.error, water: null }
    }));

    try {
      const result = await fetchWaterData();

      if (result.error) {
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, water: false },
          error: { ...prev.error, water: result.error }
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        waterData: result.data,
        loading: { ...prev.loading, water: false }
      }));
    } catch (error) {
      console.error('Error fetching water data:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, water: false },
        error: { ...prev.error, water: error instanceof Error ? error.message : 'Unknown error' }
      }));
    }
  };

  // Fetch electricity data
  const fetchElectricitySystemData = async () => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, electricity: true },
      error: { ...prev.error, electricity: null }
    }));

    try {
      const result = await fetchElectricityData();

      if (result.error) {
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, electricity: false },
          error: { ...prev.error, electricity: result.error }
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        electricityData: result.data,
        loading: { ...prev.loading, electricity: false }
      }));
    } catch (error) {
      console.error('Error fetching electricity data:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, electricity: false },
        error: { ...prev.error, electricity: error instanceof Error ? error.message : 'Unknown error' }
      }));
    }
  };

  // Fetch all data at once
  const fetchAllData = async () => {
    await Promise.all([
      fetchSTPData(),
      fetchWaterSystemData(),
      fetchElectricitySystemData()
    ]);
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  return {
    ...state,
    refreshSTPData: fetchSTPData,
    refreshWaterData: fetchWaterSystemData,
    refreshElectricityData: fetchElectricitySystemData,
    refreshAllData: fetchAllData
  };
};
