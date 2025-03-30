
import { useState, useCallback } from 'react';
import { 
  fetchPropertyUnits, 
  fetchContributionRates, 
  calculateReserveFundContribution,
  fetchAssets,
  getAssetCategorySummary,
  getAssetLocationSummary,
  getCriticalAssets,
  getAssetConditions,
  getAssetMaintenanceSchedule,
  getAssetLifecycleForecast,
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

  const getAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const assets = await fetchAssets();
      return assets;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assets');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAssetCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const categories = await getAssetCategorySummary();
      return categories;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset categories');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAssetLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const locations = await getAssetLocationSummary();
      return locations;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset locations');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getCriticalAssetsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const assets = await getCriticalAssets();
      return assets;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch critical assets');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAssetConditionsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const conditions = await getAssetConditions();
      return conditions;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset conditions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getMaintenanceSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const schedule = await getAssetMaintenanceSchedule();
      return schedule;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch maintenance schedule');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getLifecycleForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const forecast = await getAssetLifecycleForecast();
      return forecast;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lifecycle forecast');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getPropertyUnits,
    calculateContribution,
    getAssets,
    getAssetCategories,
    getAssetLocations,
    getCriticalAssetsList,
    getAssetConditionsList,
    getMaintenanceSchedule,
    getLifecycleForecast,
    loading,
    error
  };
};
