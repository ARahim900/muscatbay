
import React, { useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAssets } from '@/hooks/useAssets';
import { 
  AssetCategoriesTable, 
  AssetConditionsTable,
  CriticalAssetsTable,
  MaintenanceForecastTable,
  UpcomingMaintenanceTable
} from '@/components/alm/tables';

const AssetLifecycle = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
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
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#4ECDC4'];
  
  if (loading) {
    return (
      <StandardPageLayout title="Asset Lifecycle Management">
        <div className="grid gap-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading asset data...</p>
            </div>
          </div>
        </div>
      </StandardPageLayout>
    );
  }
  
  if (error) {
    return (
      <StandardPageLayout title="Asset Lifecycle Management">
        <div className="grid gap-6">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Error: {error}</p>
            </CardContent>
          </Card>
        </div>
      </StandardPageLayout>
    );
  }
  
  return (
    <StandardPageLayout title="Asset Lifecycle Management">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="critical">Critical Assets</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="forecast">Lifecycle Forecast</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asset Categories Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Categories</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySummaries}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="totalValue"
                        nameKey="category"
                        label={({ category }) => category}
                      >
                        {categorySummaries.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toLocaleString()} OMR`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Asset Locations Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Locations</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={locationSummaries}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="location" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toLocaleString()} OMR`} />
                      <Legend />
                      <Bar dataKey="totalValue" name="Total Value" fill="#8884d8" />
                      <Bar dataKey="count" name="Count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <AssetCategoriesTable categories={categorySummaries} />
        </TabsContent>
        
        <TabsContent value="conditions" className="space-y-6">
          <AssetConditionsTable conditions={conditions} />
        </TabsContent>
        
        <TabsContent value="critical" className="space-y-6">
          <CriticalAssetsTable assets={assets} />
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-6">
          <UpcomingMaintenanceTable maintenance={maintenanceSchedule} />
        </TabsContent>
        
        <TabsContent value="forecast" className="space-y-6">
          <MaintenanceForecastTable forecasts={lifecycleForecast} />
        </TabsContent>
      </Tabs>
    </StandardPageLayout>
  );
};

export default AssetLifecycle;
