
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AssetCategoriesTable from '@/components/alm/tables/AssetCategoriesTable';
import AssetConditionsTable from '@/components/alm/tables/AssetConditionsTable';
import CriticalAssetsTable from '@/components/alm/tables/CriticalAssetsTable';
import MaintenanceForecastTable from '@/components/alm/tables/MaintenanceForecastTable';
import UpcomingMaintenanceTable from '@/components/alm/tables/UpcomingMaintenanceTable';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  AssetCategory, 
  AssetCondition, 
  CriticalAsset, 
  MaintenanceForecast, 
  UpcomingMaintenance 
} from '@/types/alm';

const AssetLifecycle: React.FC = () => {
  // Sample data for asset categories
  const assetCategories: AssetCategory[] = [
    { id: 'AC001', name: 'HVAC Systems', subCategory: 'Air Conditioning', assetCount: 87, totalReplacementCost: 1245000, lifeExpectancyRange: '15-20', zoneCoverage: 'All Zones' },
    { id: 'EL001', name: 'Electrical', subCategory: 'Distribution Panels', assetCount: 42, totalReplacementCost: 650000, lifeExpectancyRange: '25-30', zoneCoverage: 'Zone 3, 5, 8' },
    { id: 'PL001', name: 'Plumbing', subCategory: 'Water Supply', assetCount: 128, totalReplacementCost: 860000, lifeExpectancyRange: '20-25', zoneCoverage: 'All Zones' },
    { id: 'SFT001', name: 'Safety Systems', subCategory: 'Fire Alarms', assetCount: 315, totalReplacementCost: 520000, lifeExpectancyRange: '10-15', zoneCoverage: 'All Zones' },
    { id: 'LFT001', name: 'Elevators', subCategory: 'Passenger Lifts', assetCount: 24, totalReplacementCost: 1850000, lifeExpectancyRange: '20-25', zoneCoverage: 'Zone 3, Typical Buildings' },
  ];

  // Sample data for asset conditions
  const assetConditions: AssetCondition[] = [
    { id: 1, conditionRating: 'Excellent', description: 'New or like new condition', assetCount: 210, percentage: 25, recommendedAction: 'Regular maintenance only' },
    { id: 2, conditionRating: 'Good', description: 'Minor wear, fully functional', assetCount: 315, percentage: 37, recommendedAction: 'Regular maintenance, monitor' },
    { id: 3, conditionRating: 'Fair', description: 'Moderate wear, functional', assetCount: 168, percentage: 20, recommendedAction: 'Increased maintenance, plan for future replacement' },
    { id: 4, conditionRating: 'Poor', description: 'Significant wear, limited function', assetCount: 105, percentage: 12, recommendedAction: 'Plan for replacement within 1-2 years' },
    { id: 5, conditionRating: 'Critical', description: 'Severe wear, failure imminent', assetCount: 52, percentage: 6, recommendedAction: 'Immediate replacement required' },
  ];

  // Sample data for critical assets
  const criticalAssets: CriticalAsset[] = [
    { id: 'CA001', assetName: 'Main Electrical Panel - Zone 3', zone: 'Zone 3', currentCondition: 'Poor', replacementCost: 85000, criticalityRating: 5, failureImpact: 'Complete power loss to Zone 3', recommendedAction: 'Schedule replacement Q3 2023', targetCompletion: 'Sep 2023' },
    { id: 'CA002', assetName: 'Chiller Unit 2 - Central Plant', zone: 'Central Facilities', currentCondition: 'Critical', replacementCost: 125000, criticalityRating: 5, failureImpact: 'Loss of cooling to 40% of facilities', recommendedAction: 'Emergency replacement', targetCompletion: 'Jul 2023' },
    { id: 'CA003', assetName: 'Fire Alarm Control Panel - Zone 5', zone: 'Zone 5', currentCondition: 'Poor', replacementCost: 45000, criticalityRating: 4, failureImpact: 'Non-compliance with safety regulations', recommendedAction: 'Schedule replacement Q3 2023', targetCompletion: 'Aug 2023' },
    { id: 'CA004', assetName: 'Water Pump Station 3', zone: 'Zone 8', currentCondition: 'Fair', replacementCost: 65000, criticalityRating: 4, failureImpact: 'Reduced water pressure to Zone 8', recommendedAction: 'Increase maintenance, plan for replacement', targetCompletion: 'Dec 2023' },
    { id: 'CA005', assetName: 'Elevator 2 - Main Building', zone: 'Typical Buildings', currentCondition: 'Poor', replacementCost: 110000, criticalityRating: 3, failureImpact: 'Accessibility issues for residents', recommendedAction: 'Schedule replacement Q4 2023', targetCompletion: 'Nov 2023' },
  ];

  // Sample data for maintenance forecast
  const maintenanceForecast: MaintenanceForecast[] = [
    { id: 'MF001', assetName: 'HVAC Systems - Zone 3', zone: 'Zone 3', installationYear: 2015, currentCondition: 'Good', nextMaintenanceYear: 2024, maintenanceType: 'Major Service', estimatedCost: 35000, lifeExpectancy: 20 },
    { id: 'MF002', assetName: 'Roof Waterproofing - Zone 5', zone: 'Zone 5', installationYear: 2014, currentCondition: 'Fair', nextMaintenanceYear: 2023, maintenanceType: 'Partial Replacement', estimatedCost: 65000, lifeExpectancy: 15 },
    { id: 'MF003', assetName: 'Elevators - Typical Buildings', zone: 'Typical Buildings', installationYear: 2016, currentCondition: 'Good', nextMaintenanceYear: 2025, maintenanceType: 'Major Service', estimatedCost: 28000, lifeExpectancy: 25 },
    { id: 'MF004', assetName: 'Swimming Pool Equipment', zone: 'Zone 8', installationYear: 2018, currentCondition: 'Good', nextMaintenanceYear: 2024, maintenanceType: 'Partial Replacement', estimatedCost: 42000, lifeExpectancy: 12 },
    { id: 'MF005', assetName: 'Landscaping Irrigation System', zone: 'All Zones', installationYear: 2017, currentCondition: 'Fair', nextMaintenanceYear: 2023, maintenanceType: 'Major Service', estimatedCost: 25000, lifeExpectancy: 10 },
  ];

  // Sample data for upcoming maintenance
  const upcomingMaintenance: UpcomingMaintenance[] = [
    { id: 'UM001', assetName: 'Chiller Unit 1 - Central Plant', zone: 'Central Facilities', scheduledDate: '2023-07-15', maintenanceType: 'Major Service', estimatedCost: 28000, duration: 5, resourceRequirements: '2 HVAC technicians, 1 electrician', priority: 'High' },
    { id: 'UM002', assetName: 'Fire Alarm System - Zone 3', zone: 'Zone 3', scheduledDate: '2023-07-22', maintenanceType: 'Inspection and Testing', estimatedCost: 12000, duration: 3, resourceRequirements: '2 safety technicians', priority: 'High' },
    { id: 'UM003', assetName: 'Landscaping - Zone 5', zone: 'Zone 5', scheduledDate: '2023-08-05', maintenanceType: 'Seasonal Maintenance', estimatedCost: 18000, duration: 10, resourceRequirements: '4 landscapers', priority: 'Medium' },
    { id: 'UM004', assetName: 'Swimming Pool - Zone 8', zone: 'Zone 8', scheduledDate: '2023-08-12', maintenanceType: 'Chemical Treatment', estimatedCost: 5000, duration: 2, resourceRequirements: '1 pool technician', priority: 'Medium' },
    { id: 'UM005', assetName: 'Elevator Maintenance - Typical Buildings', zone: 'Typical Buildings', scheduledDate: '2023-08-18', maintenanceType: 'Quarterly Service', estimatedCost: 8000, duration: 2, resourceRequirements: '2 elevator technicians', priority: 'Low' },
  ];

  // Data for asset condition distribution chart
  const conditionDistributionData = [
    { name: 'Excellent', value: 25 },
    { name: 'Good', value: 37 },
    { name: 'Fair', value: 20 },
    { name: 'Poor', value: 12 },
    { name: 'Critical', value: 6 },
  ];

  // Colors for the pie chart
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

  // Data for replacement cost by category
  const replacementCostData = assetCategories.map(category => ({
    name: category.name,
    cost: category.totalReplacementCost,
  }));

  // Data for maintenance forecast by year
  const forecastByYearData = [
    { year: '2023', cost: 125000 },
    { year: '2024', cost: 210000 },
    { year: '2025', cost: 180000 },
    { year: '2026', cost: 250000 },
    { year: '2027', cost: 190000 },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Asset Lifecycle Management</h1>
        <p className="text-muted-foreground">Comprehensive overview of Muscat Bay's assets, their conditions, and maintenance schedules.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-700 dark:text-blue-400">Total Assets</h3>
            <p className="text-3xl font-bold mt-2">850</p>
            <p className="text-sm text-muted-foreground mt-1">Across all zones and categories</p>
          </Card>
          
          <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <h3 className="font-medium text-green-700 dark:text-green-400">Assets in Good Condition</h3>
            <p className="text-3xl font-bold mt-2">62%</p>
            <p className="text-sm text-muted-foreground mt-1">Excellent or Good condition rating</p>
          </Card>
          
          <Card className="p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <h3 className="font-medium text-amber-700 dark:text-amber-400">Planned Maintenance</h3>
            <p className="text-3xl font-bold mt-2">28</p>
            <p className="text-sm text-muted-foreground mt-1">Scheduled for next 3 months</p>
          </Card>
          
          <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <h3 className="font-medium text-red-700 dark:text-red-400">Critical Assets</h3>
            <p className="text-3xl font-bold mt-2">52</p>
            <p className="text-sm text-muted-foreground mt-1">Requiring immediate attention</p>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Asset Condition Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conditionDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {conditionDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Replacement Cost by Category</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={replacementCostData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip formatter={(value) => `OMR ${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="cost" name="Replacement Cost (OMR)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Maintenance Forecast by Year</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={forecastByYearData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `OMR ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="cost" name="Estimated Maintenance Cost (OMR)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Tabs defaultValue="asset-categories" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-5">
            <TabsTrigger value="asset-categories">Asset Categories</TabsTrigger>
            <TabsTrigger value="asset-conditions">Asset Conditions</TabsTrigger>
            <TabsTrigger value="critical-assets">Critical Assets</TabsTrigger>
            <TabsTrigger value="maintenance-forecast">Maintenance Forecast</TabsTrigger>
            <TabsTrigger value="upcoming-maintenance">Upcoming Maintenance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="asset-categories" className="mt-4">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Asset Categories</h3>
              <AssetCategoriesTable data={assetCategories} />
            </Card>
          </TabsContent>
          
          <TabsContent value="asset-conditions" className="mt-4">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Asset Conditions</h3>
              <AssetConditionsTable data={assetConditions} />
            </Card>
          </TabsContent>
          
          <TabsContent value="critical-assets" className="mt-4">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Critical Assets</h3>
              <CriticalAssetsTable data={criticalAssets} />
            </Card>
          </TabsContent>
          
          <TabsContent value="maintenance-forecast" className="mt-4">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Maintenance Forecast</h3>
              <MaintenanceForecastTable data={maintenanceForecast} />
            </Card>
          </TabsContent>
          
          <TabsContent value="upcoming-maintenance" className="mt-4">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Upcoming Maintenance</h3>
              <UpcomingMaintenanceTable data={upcomingMaintenance} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AssetLifecycle;
