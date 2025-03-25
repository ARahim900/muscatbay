
import { supabase } from '@/integrations/supabase/client';
import { 
  Asset, 
  AssetCategorySummary, 
  AssetLocationSummary,
  AssetCondition,
  AssetMaintenance,
  AssetLifecycleForecast
} from '@/types/assets';

// Fetch all assets from Supabase
export const fetchAssets = async (): Promise<Asset[]> => {
  try {
    const { data, error } = await supabase
      .from('Muscat Bay Assets List')
      .select('*');

    if (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }

    // Map database columns to our Asset interface
    return data.map(asset => ({
      assetId: asset['Asset Id'],
      assetTag: asset['Asset Tag'] || '',
      assetName: asset['Asset Name'] || '',
      assetDesc: asset['Asset Desc'] || '',
      assetBrand: asset['Asset Brand'] || '',
      assetModel: asset['Asset Model'] || '',
      assetCategId: asset['Asset Categ Id'],
      assetCategName: asset['Asset Categ Name'] || '',
      assetSubCategId: asset['Asset Sub Categ Id'],
      assetSubCategName: asset['Asset Sub Categ Name'] || '',
      locationName: asset['Location Name'] || '',
      locationTag: asset['Location Tag'] || '',
      assetLocKeyId: asset['Asset Loc Key Id'],
      assetLocRef1: asset['Asset Loc Ref1'] || '',
      assetLocRef2: asset['Asset Loc Ref2'] || '',
      assetLocRef3: asset['Asset Loc Ref3'] || '',
      assetInLocSrlno: asset['Asset In Loc Srlno'] || '',
      countryOfOrigin: asset['Country Of Origin'] || '',
      ppmFreq: asset['Ppm Freq'] || '',
      isAssetActive: asset['Is Asset Active'] || '',
      client: asset['Client'] || ''
    }));
  } catch (err) {
    console.error('Error in fetchAssets:', err);
    return [];
  }
};

// Get asset category summary for charts
export const getAssetCategorySummary = async (): Promise<AssetCategorySummary[]> => {
  try {
    const assets = await fetchAssets();
    
    // Group assets by category
    const categoryMap = new Map<string, number>();
    let totalAssets = assets.length;
    
    assets.forEach(asset => {
      const category = asset.assetCategName;
      if (category) {
        const currentCount = categoryMap.get(category) || 0;
        categoryMap.set(category, currentCount + 1);
      }
    });
    
    // Create summary with percentages
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: totalAssets > 0 ? (count / totalAssets) * 100 : 0
    }));
  } catch (err) {
    console.error('Error in getAssetCategorySummary:', err);
    return [];
  }
};

// Get asset location summary for charts
export const getAssetLocationSummary = async (): Promise<AssetLocationSummary[]> => {
  try {
    const assets = await fetchAssets();
    
    // Group assets by location
    const locationMap = new Map<string, number>();
    let totalAssets = assets.length;
    
    assets.forEach(asset => {
      const location = asset.locationName;
      if (location) {
        const currentCount = locationMap.get(location) || 0;
        locationMap.set(location, currentCount + 1);
      }
    });
    
    // Create summary with percentages
    return Array.from(locationMap.entries()).map(([location, count]) => ({
      location,
      count,
      percentage: totalAssets > 0 ? (count / totalAssets) * 100 : 0
    }));
  } catch (err) {
    console.error('Error in getAssetLocationSummary:', err);
    return [];
  }
};

// Get critical assets (for demonstration, we'll consider assets without PPM frequency as critical)
export const getCriticalAssets = async (): Promise<Asset[]> => {
  try {
    const assets = await fetchAssets();
    return assets.filter(asset => !asset.ppmFreq || asset.ppmFreq === 'N/A');
  } catch (err) {
    console.error('Error in getCriticalAssets:', err);
    return [];
  }
};

// Generate sample asset conditions data
// In a real app, this would fetch from a 'asset_conditions' table
export const getAssetConditions = async (): Promise<AssetCondition[]> => {
  try {
    const assets = await fetchAssets();
    const conditions = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'];
    
    // Generate sample conditions for the first 100 assets
    return assets.slice(0, 100).map((asset, index) => {
      const conditionIndex = Math.floor(Math.random() * conditions.length);
      const condition = conditions[conditionIndex] as 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
      
      // Calculate estimated life remaining based on condition
      let estimatedLifeRemaining: number;
      switch (condition) {
        case 'Excellent': estimatedLifeRemaining = 60 + Math.floor(Math.random() * 24); break;
        case 'Good': estimatedLifeRemaining = 36 + Math.floor(Math.random() * 24); break;
        case 'Fair': estimatedLifeRemaining = 12 + Math.floor(Math.random() * 24); break;
        case 'Poor': estimatedLifeRemaining = 1 + Math.floor(Math.random() * 12); break;
        case 'Critical': estimatedLifeRemaining = Math.floor(Math.random() * 6); break;
        default: estimatedLifeRemaining = 0;
      }
      
      // Generate assessment date within last year
      const date = new Date();
      date.setMonth(date.getMonth() - Math.floor(Math.random() * 12));
      
      return {
        id: `cond-${index + 1}`,
        assetId: asset.assetId,
        condition,
        assessmentDate: date.toISOString().split('T')[0],
        estimatedLifeRemaining,
        notes: `Last inspection completed on ${date.toLocaleDateString()}`
      };
    });
  } catch (err) {
    console.error('Error in getAssetConditions:', err);
    return [];
  }
};

// Generate sample maintenance schedule data
// In a real app, this would fetch from a 'asset_maintenance' table
export const getAssetMaintenanceSchedule = async (): Promise<AssetMaintenance[]> => {
  try {
    const assets = await fetchAssets();
    const maintenanceTypes = ['Preventive', 'Corrective', 'Condition-Based'];
    const statuses = ['Scheduled', 'In Progress', 'Completed', 'Overdue'];
    
    // Generate sample maintenance records for assets
    return assets.slice(0, 50).map((asset, index) => {
      const typeIndex = Math.floor(Math.random() * maintenanceTypes.length);
      const statusIndex = Math.floor(Math.random() * statuses.length);
      
      const maintenanceType = maintenanceTypes[typeIndex] as 'Preventive' | 'Corrective' | 'Condition-Based';
      const status = statuses[statusIndex] as 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
      
      // Generate scheduled date
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 60) - 30);
      
      // Generate completed date if status is 'Completed'
      let completedDate: string | undefined;
      if (status === 'Completed') {
        const compDate = new Date(scheduledDate);
        compDate.setDate(compDate.getDate() + Math.floor(Math.random() * 7));
        completedDate = compDate.toISOString().split('T')[0];
      }
      
      return {
        id: `maint-${index + 1}`,
        assetId: asset.assetId,
        maintenanceType,
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        completedDate,
        status,
        cost: status === 'Completed' ? 100 + Math.floor(Math.random() * 900) : undefined,
        technician: status === 'Completed' || status === 'In Progress' ? 'John Doe' : undefined,
        notes: `Maintenance ${status.toLowerCase()} for ${asset.assetName}`
      };
    });
  } catch (err) {
    console.error('Error in getAssetMaintenanceSchedule:', err);
    return [];
  }
};

// Generate sample lifecycle forecast data
// In a real app, this would fetch from a 'asset_lifecycle_forecast' table
export const getAssetLifecycleForecast = async (): Promise<AssetLifecycleForecast[]> => {
  try {
    const assets = await fetchAssets();
    const priorities = ['High', 'Medium', 'Low'];
    
    // Generate sample lifecycle forecasts for assets
    return assets.slice(0, 30).map((asset) => {
      const priorityIndex = Math.floor(Math.random() * priorities.length);
      const priority = priorities[priorityIndex] as 'High' | 'Medium' | 'Low';
      
      // Generate expected lifespan based on asset category and priority
      let expectedLifespan: number;
      switch (priority) {
        case 'High': expectedLifespan = 36 + Math.floor(Math.random() * 24); break;
        case 'Medium': expectedLifespan = 60 + Math.floor(Math.random() * 60); break;
        case 'Low': expectedLifespan = 96 + Math.floor(Math.random() * 84); break;
        default: expectedLifespan = 60;
      }
      
      // Calculate remaining lifespan
      const remainingLifespan = Math.max(0, Math.floor(expectedLifespan * (0.1 + Math.random() * 0.9)));
      
      // Calculate replacement year
      const currentYear = new Date().getFullYear();
      const replacementYear = currentYear + Math.floor(remainingLifespan / 12);
      
      return {
        assetId: asset.assetId,
        assetName: asset.assetName,
        assetCategory: asset.assetCategName,
        expectedLifespan,
        remainingLifespan,
        replacementCost: 1000 + Math.floor(Math.random() * 9000),
        replacementYear,
        priority
      };
    });
  } catch (err) {
    console.error('Error in getAssetLifecycleForecast:', err);
    return [];
  }
};
