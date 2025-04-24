
import { useState, useEffect } from 'react';
import { fetchWaterData, calculateEfficiency } from '@/services/waterService';
import { WaterConsumptionData } from '@/types/water';

export interface WaterDataState {
  data: WaterConsumptionData | null;
  loading: boolean;
  error: string | null;
  zoneData?: any[];
  systemEfficiency?: number;
  updateFilters?: (filters: any) => void;
}

export const useWaterData = (): WaterDataState => {
  const [state, setState] = useState<WaterDataState>({
    data: null,
    loading: true,
    error: null,
    zoneData: [],
    systemEfficiency: 0
  });
  
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const waterData = await fetchWaterData(signal);
        
        // Calculate system efficiency if data is available
        let efficiency = 0;
        if (waterData && waterData.total) {
          efficiency = calculateEfficiency(
            waterData.total.consumption, 
            waterData.total.loss
          );
        }
        
        setState(prev => ({ 
          ...prev, 
          data: waterData, 
          loading: false,
          zoneData: waterData?.zones || [],
          systemEfficiency: efficiency 
        }));
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error loading water data:', err);
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: err instanceof Error ? err.message : 'An unknown error occurred' 
          }));
        }
      }
    };

    loadData();

    // Clean up on unmount
    return () => {
      controller.abort();
    };
  }, []);
  
  // Add filter update function
  const updateFilters = (filters: any) => {
    console.log('Updating filters:', filters);
    // Implementation would go here in a real app
  };
  
  return {
    ...state,
    updateFilters
  };
};
