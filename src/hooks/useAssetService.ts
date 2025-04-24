
import { useState, useEffect } from 'react';
import {
  fetchAssets,
  fetchPropertyUnits,
  fetchContributionRates,
  calculateReserveFundContribution,
  categorizeAssetsByCategory,
  categorizeAssetsByLocation,
  analyzeAssetCondition
} from '@/services/assetService';
import { Asset } from '@/types/assets';

export const useAssetService = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [propertyUnits, setPropertyUnits] = useState<any[]>([]);
  const [contributionRates, setContributionRates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load assets data
        const assetsData = await fetchAssets(signal);
        setAssets(assetsData);
        
        // Extract available zones and categories
        const zones: string[] = [...new Set(assetsData.map(asset => asset.locationName || ''))];
        setSelectedZones(zones);
        
        const categories: string[] = [...new Set(assetsData.map(asset => asset.assetCategName || ''))];
        setSelectedCategories(categories);
        
        // Load property units data
        try {
          const units = await fetchPropertyUnits(signal);
          setPropertyUnits(units);
        } catch (err) {
          console.error('Error loading property units:', err);
          // Non-critical error, continue
        }
        
        // Load contribution rates
        try {
          const rates = await fetchContributionRates(signal);
          setContributionRates(rates);
        } catch (err) {
          console.error('Error loading contribution rates:', err);
          // Non-critical error, continue
        }
        
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error loading asset data:', err);
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

  // Filter assets by selected zones and categories
  const filteredAssets = assets.filter(asset => {
    const matchesZone = selectedZones.length === 0 || selectedZones.includes(asset.locationName || '');
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(asset.assetCategName || '');
    return matchesZone && matchesCategory;
  });

  // Derived data
  const assetsByCategory = categorizeAssetsByCategory(filteredAssets);
  const assetsByLocation = categorizeAssetsByLocation(filteredAssets);
  const assetConditions = analyzeAssetCondition(filteredAssets);

  // Update selected zones
  const updateSelectedZones = (zones: string[]) => {
    setSelectedZones(zones);
  };

  // Update selected categories
  const updateSelectedCategories = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  return {
    assets,
    filteredAssets,
    propertyUnits,
    contributionRates,
    loading,
    error,
    assetsByCategory,
    assetsByLocation,
    assetConditions,
    selectedZones,
    selectedCategories,
    updateSelectedZones,
    updateSelectedCategories,
    calculateReserveFundContribution
  };
};
