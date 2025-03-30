
import { useState, useCallback } from 'react';
import { 
  fetchPropertyUnits, 
  fetchContributionRates, 
  calculateReserveFundContribution,
  PropertyUnit 
} from '@/services/assetService';

export const useAssetService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPropertyUnits = useCallback(async (filters?: {
    zone?: string, 
    property_type?: string, 
    building?: string
  }) => {
    setLoading(true);
    setError(null);
    try {
      const units = await fetchPropertyUnits(filters);
      return units;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch property units');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateContribution = useCallback(async (unit: PropertyUnit) => {
    setLoading(true);
    setError(null);
    try {
      const result = await calculateReserveFundContribution(unit);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to calculate contribution');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getPropertyUnits,
    calculateContribution,
    loading,
    error
  };
};
