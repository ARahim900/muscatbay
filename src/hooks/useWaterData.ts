
/**
 * React hook for water data management
 */
import { useState, useEffect } from 'react';
import { fetchWaterData, calculateEfficiency } from '@/services/waterService';

interface WaterDataState {
  data: any;
  loading: boolean;
  error: string | null;
}

export const useWaterData = () => {
  const [state, setState] = useState<WaterDataState>({
    data: null,
    loading: true,
    error: null
  });
  
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const waterData = await fetchWaterData(signal);
        setState(prev => ({ ...prev, data: waterData, loading: false }));
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
  
  return state;
};
