
import { useState, useEffect } from 'react';
import { 
  getAssets, 
  getAssetCategorySummary, 
  getAssetLocationSummary,
  getCriticalAssets,
  getAssetConditions
} from '@/services/assetService';
import {
  Asset,
  AssetCategorySummary,
  AssetLocationSummary,
  AssetCondition,
  AssetMaintenance,
  AssetLifecycleForecast
} from '@/types/asset';
import { useToast } from '@/hooks/use-toast';

// Mock data for maintenance and lifecycle
const mockMaintenanceData: AssetMaintenance[] = [
  {
    id: 'maint-001',
    assetId: 'asset-001',
    assetName: 'HVAC System - Building A',
    maintenanceType: 'Preventive',
    scheduledDate: '2023-09-15',
    estimatedCost: 2500,
    priority: 'Medium'
  },
  {
    id: 'maint-002',
    assetId: 'asset-002',
    assetName: 'Elevators - Main Building',
    maintenanceType: 'Inspection',
    scheduledDate: '2023-08-05',
    estimatedCost: 1800,
    priority: 'High'
  }
];

const mockForecastData: AssetLifecycleForecast[] = [
  {
    year: 2023,
    replacements: 2,
    maintenanceCosts: 45000,
    assets: []
  },
  {
    year: 2024,
    replacements: 5,
    maintenanceCosts: 78000,
    assets: []
  }
];

// Helper functions to mimic the missing service functions
const getAssetMaintenanceSchedule = (): AssetMaintenance[] => {
  return mockMaintenanceData;
};

const getAssetLifecycleForecast = (): AssetLifecycleForecast[] => {
  return mockForecastData;
};

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categorySummary, setCategorySummary] = useState<AssetCategorySummary[]>([]);
  const [locationSummary, setLocationSummary] = useState<AssetLocationSummary[]>([]);
  const [criticalAssets, setCriticalAssets] = useState<Asset[]>([]);
  const [assetConditions, setAssetConditions] = useState<AssetCondition[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<AssetMaintenance[]>([]);
  const [lifecycleForecast, setLifecycleForecast] = useState<AssetLifecycleForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all asset data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const assetsData = getAssets();
        const categoryData = getAssetCategorySummary();
        const locationData = getAssetLocationSummary();
        const criticalData = getCriticalAssets();
        const conditionsData = getAssetConditions();
        const maintenanceData = getAssetMaintenanceSchedule();
        const forecastData = getAssetLifecycleForecast();
        
        setAssets(assetsData);
        setCategorySummary(categoryData);
        setLocationSummary(locationData);
        setCriticalAssets(criticalData);
        setAssetConditions(conditionsData);
        setMaintenanceSchedule(maintenanceData);
        setLifecycleForecast(forecastData);
      } catch (err) {
        console.error('Error fetching asset data:', err);
        setError('Failed to load asset data. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load asset data. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  return {
    assets,
    categorySummary,
    locationSummary,
    criticalAssets,
    assetConditions,
    maintenanceSchedule,
    lifecycleForecast,
    loading,
    error
  };
};
