
import React, { useState } from 'react';
import { PackageOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetCategoriesTable, AssetConditionsTable, CriticalAssetsTable, UpcomingMaintenanceTable, MaintenanceForecastTable } from '@/components/alm/tables';
import ALMDashboard from '@/components/alm/ALMDashboard';
import ReserveFundCalculator from '@/components/alm/ReserveFundCalculator';
import PropertyServiceChargeCalculator from '@/components/alm/PropertyServiceChargeCalculator';

const ALM = () => {
  // Initialize dashboard state variables
  const [year, setYear] = useState('2025');
  const [zone, setZone] = useState('all');
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for the dashboard
  const dashboardData = {
    summaryStats: {
      totalAssets: 4813,
      criticalCount: 147,
      upcomingMaintenance: 52,
      totalReplacementCost: 4500000
    },
    yearOptions: [
      { value: '2025', label: '2025' },
      { value: '2026', label: '2026' },
      { value: '2027', label: '2027' }
    ],
    zoneOptions: [
      { value: 'all', label: 'All Zones' },
      { value: 'z3', label: 'Zone 3 (Al Zaha)' },
      { value: 'z5', label: 'Zone 5 (Al Nameer)' },
      { value: 'z8', label: 'Zone 8 (Al Wajd)' }
    ],
    categoryOptions: [
      { value: 'all', label: 'All Categories' },
      { value: 'infrastructure', label: 'Infrastructure' },
      { value: 'mep', label: 'MEP Systems' },
      { value: 'finishes', label: 'Finishes/Structure' },
      { value: 'landscaping', label: 'Landscaping' }
    ],
    assetCategoryData: [
      { name: 'Infrastructure', value: 2000000, color: '#4E4456' },
      { name: 'MEP Systems', value: 1500000, color: '#6D5D7B' },
      { name: 'Finishes/Structure', value: 500000, color: '#8F7C9B' },
      { name: 'Landscaping', value: 500000, color: '#CBB9DB' }
    ],
    zoneBalancesData: [
      { name: 'Master Community', value: 798352, color: '#4E4456' },
      { name: 'Typical Buildings', value: 227018, color: '#6D5D7B' },
      { name: 'Zone 3 (Al Zaha)', value: 63604, color: '#8F7C9B' },
      { name: 'Zone 5 (Al Nameer)', value: 63581, color: '#AD9BBD' },
      { name: 'Zone 8 (Al Wajd)', value: 37884, color: '#CBB9DB' },
      { name: 'Staff Accommodation', value: 273878, color: '#E9D7F5' }
    ],
    reserveFundData: [
      { year: '2021', balance: 52636, contribution: 52636, expenditure: 0 },
      { year: '2022', balance: 106324, contribution: 52899, expenditure: 0 },
      { year: '2023', balance: 161082, contribution: 53163, expenditure: 0 },
      { year: '2024', balance: 216927, contribution: 53429, expenditure: 0 },
      { year: '2025', balance: 273878, contribution: 53696, expenditure: 0 }
    ],
    filteredReplacements: [
      { component: 'Helipad Electrical Works', location: 'Master Community', year: 2025, cost: 10920 },
      { component: 'Fire Extinguishers', location: 'Typical Buildings', year: 2026, cost: 129 },
      { component: 'Lagoon Infrastructure', location: 'Master Community', year: 2027, cost: 42000 }
    ]
  };

  // Event handlers
  const handleYearChange = (value) => {
    setYear(value);
  };

  const handleZoneChange = (value) => {
    setZone(value);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
  };

  const handleExport = () => {
    console.log('Exporting data...');
    // Export functionality would go here
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
          <PackageOpen className="h-6 w-6 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold">Asset Lifecycle Management</h1>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="property-service-charges">Service Charges</TabsTrigger>
          <TabsTrigger value="reserve-fund">Reserve Fund</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <ALMDashboard 
            summaryStats={dashboardData.summaryStats}
            year={year}
            zone={zone}
            category={category}
            activeTab={activeTab}
            darkMode={false}
            filteredReplacements={dashboardData.filteredReplacements}
            assetCategoryData={dashboardData.assetCategoryData}
            zoneBalancesData={dashboardData.zoneBalancesData}
            reserveFundData={dashboardData.reserveFundData}
            handleYearChange={handleYearChange}
            handleZoneChange={handleZoneChange}
            handleCategoryChange={handleCategoryChange}
            handleExport={handleExport}
            setActiveTab={setActiveTab}
            yearOptions={dashboardData.yearOptions}
            zoneOptions={dashboardData.zoneOptions}
            categoryOptions={dashboardData.categoryOptions}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CriticalAssetsTable />
            <AssetConditionsTable />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingMaintenanceTable />
            <MaintenanceForecastTable />
          </div>
        </TabsContent>
        
        <TabsContent value="assets" className="space-y-6">
          <AssetCategoriesTable />
        </TabsContent>
        
        <TabsContent value="property-service-charges">
          <PropertyServiceChargeCalculator />
        </TabsContent>
        
        <TabsContent value="reserve-fund">
          <ReserveFundCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ALM;
