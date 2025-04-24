
import React from 'react';
import { useAssets } from '@/hooks/useAssets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber } from '@/lib/utils';
import { ReserveCalculator } from '@/components/alm/ReserveCalculator';
import { 
  AssetCategoriesTable, 
  AssetConditionsTable, 
  CriticalAssetsTable, 
  MaintenanceForecastTable,
  UpcomingMaintenanceTable
} from '@/components/alm/tables';

const AssetLifecycle: React.FC = () => {
  const { 
    assets, 
    categorySummaries, 
    locationSummaries, 
    conditions, 
    maintenanceSchedule,
    lifecycleForecast,
    loading, 
    error 
  } = useAssets();
  
  // Filter assets with critical level
  const criticalAssets = React.useMemo(() => {
    return assets.filter(asset => asset.criticalityLevel === 'Critical' || asset.criticalityLevel === 'High');
  }, [assets]);
  
  if (loading) {
    return <div className="p-6">Loading asset data...</div>;
  }
  
  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }
  
  // Calculate total asset value
  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Asset Lifecycle Management</h1>
      <p className="text-muted-foreground mb-6">
        Track and manage assets throughout their lifecycle
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Asset Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalAssetValue)} OMR</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalAssets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((criticalAssets.length / assets.length) * 100).toFixed(1)}% of total assets
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="critical">Critical Assets</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="reserves">Reserve Calculator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Conditions</CardTitle>
                <CardDescription>Distribution of assets by condition</CardDescription>
              </CardHeader>
              <CardContent>
                <AssetConditionsTable conditions={conditions} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Asset Categories</CardTitle>
                <CardDescription>Distribution of assets by category</CardDescription>
              </CardHeader>
              <CardContent>
                <AssetCategoriesTable categories={categorySummaries} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Asset Categories</CardTitle>
              <CardDescription>Detailed breakdown of asset categories</CardDescription>
            </CardHeader>
            <CardContent>
              <AssetCategoriesTable categories={categorySummaries} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="critical">
          <Card>
            <CardHeader>
              <CardTitle>Critical Assets</CardTitle>
              <CardDescription>Assets requiring special attention</CardDescription>
            </CardHeader>
            <CardContent>
              <CriticalAssetsTable assets={criticalAssets} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
                <CardDescription>Scheduled maintenance activities</CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingMaintenanceTable maintenance={maintenanceSchedule} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Forecast</CardTitle>
                <CardDescription>Projected maintenance and replacements</CardDescription>
              </CardHeader>
              <CardContent>
                <MaintenanceForecastTable forecasts={lifecycleForecast} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="reserves">
          <ReserveCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetLifecycle;
