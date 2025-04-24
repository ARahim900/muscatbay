
import React from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AssetStatusCard, 
  AssetDistributionChart, 
  AssetConditionChart,
  AssetLocationPieChart,
  CriticalAssetsTable,
  MaintenanceForecastTable
} from '@/components/alm';
import { useAssets } from '@/hooks/useAssets';

const AssetLifecycle = () => {
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

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Asset Lifecycle Management</h1>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="bg-gray-100 h-24"></CardHeader>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="bg-gray-100 h-8"></CardHeader>
                <CardContent className="bg-gray-50 h-64"></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
            <h3 className="font-bold">Error loading asset data</h3>
            <p>{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Asset Lifecycle Management</h1>
        
        {/* Asset Summary Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <AssetStatusCard
            title="Total Assets"
            count={assets.length}
            trend={+5}
            icon="LayersIcon"
          />
          <AssetStatusCard
            title="Critical Condition"
            count={conditions.filter(c => c.condition === 'Poor').length}
            trend={-2}
            icon="AlertCircleIcon"
            color="red"
          />
          <AssetStatusCard
            title="Maintenance Due"
            count={maintenanceSchedule.filter(m => 
              new Date(m.scheduledDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            ).length}
            trend={+3}
            icon="CalendarIcon"
            color="amber"
          />
          <AssetStatusCard
            title="Budgeted This Year"
            count={maintenanceSchedule.reduce(
              (sum, item) => sum + item.estimatedCost, 0
            )}
            isCurrency={true}
            trend={+12}
            icon="DollarSignIcon"
            color="green"
          />
        </div>
        
        {/* Asset Distribution Charts */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetDistributionChart data={categorySummaries} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Asset Distribution by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetLocationPieChart data={locationSummaries} />
            </CardContent>
          </Card>
        </div>
        
        {/* Condition and Critical Assets */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Condition Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetConditionChart data={conditions} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Critical Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <CriticalAssetsTable assets={assets} />
            </CardContent>
          </Card>
        </div>
        
        {/* Maintenance Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceForecastTable forecasts={lifecycleForecast} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AssetLifecycle;
