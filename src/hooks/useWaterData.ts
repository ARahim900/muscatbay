
import { useState, useEffect } from 'react';
import { WaterConsumptionData } from '@/types/water';
import { fetchData } from '@/services/dataService';

interface WaterDataState {
  data: any; // Using any for now - we should type this properly
  loading: boolean;
  error: string | null;
  zoneData?: any[];
  systemEfficiency?: number;
  filters?: {
    zone: string;
    period: string;
  };
}

export const useWaterData = () => {
  const [state, setState] = useState<WaterDataState>({
    data: null,
    loading: true,
    error: null,
    filters: {
      zone: 'all',
      period: 'last30days'
    }
  });

  useEffect(() => {
    const fetchWaterData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        // Load data from JSON file
        const data = await fetchData<any>('water/data.json');
        
        // Calculate system efficiency
        const systemEfficiency = data.systemStats?.systemEfficiency || 94.0;
        
        // Extract zone data
        const zoneData = data.waterZones || [];
        
        setState({
          data,
          loading: false,
          error: null,
          zoneData,
          systemEfficiency,
          filters: state.filters
        });
      } catch (err) {
        console.error('Error fetching water data:', err);
        setState(prev => ({
          ...prev,
          error: 'Failed to load water data',
          loading: false
        }));
      }
    };
    
    fetchWaterData();
  }, []);

  const updateFilters = (newFilters: Partial<{zone: string, period: string}>) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters!,
        ...newFilters
      }
    }));
  };

  return {
    ...state,
    updateFilters
  };
};
