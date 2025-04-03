
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

  // Create mock data for tables to fix the missing data properties
  const criticalAssetsData = [
    { id: "1", assetName: "Electrical Generator", location: "Master Community", criticality: "High", riskScore: 85, lastInspectionDate: "2024-12-01", nextInspectionDate: "2025-01-15", replacementValue: 75000 },
    { id: "2", assetName: "Water Pump System", location: "Zone 3", criticality: "High", riskScore: 78, lastInspectionDate: "2024-11-15", nextInspectionDate: "2025-02-15", replacementValue: 45000 },
    { id: "3", assetName: "HVAC Cooling Tower", location: "Typical Buildings", criticality: "Medium", riskScore: 65, lastInspectionDate: "2024-10-20", nextInspectionDate: "2025-01-20", replacementValue: 98000 }
  ];

  const assetConditionsData = [
    { id: "1", conditionRating: "Excellent", description: "New or like-new condition", assetCount: 1250, percentage: 26, recommendedAction: "Regular maintenance only" },
    { id: "2", conditionRating: "Good", description: "Minor wear, fully functional", assetCount: 2145, percentage: 45, recommendedAction: "Standard maintenance schedule" },
    { id: "3", conditionRating: "Fair", description: "Visible wear, still functional", assetCount: 856, percentage: 18, recommendedAction: "Enhanced monitoring" },
    { id: "4", conditionRating: "Poor", description: "Significant deterioration", assetCount: 415, percentage: 9, recommendedAction: "Plan for replacement" },
    { id: "5", conditionRating: "Critical", description: "Failure imminent", assetCount: 147, percentage: 3, recommendedAction: "Immediate replacement" }
  ];

  const upcomingMaintenanceData = [
    { id: "1", assetName: "Irrigation Pumps", zone: "Master Community", scheduledDate: "2025-01-15", maintenanceType: "Preventive", estimatedCost: 2500, duration: 3, resourceRequirements: "2 Technicians", priority: "Medium" },
    { id: "2", assetName: "Fire Alarm System", zone: "Zone 3", scheduledDate: "2025-01-20", maintenanceType: "Regulatory", estimatedCost: 1800, duration: 2, resourceRequirements: "Specialist Contractor", priority: "High" },
    { id: "3", assetName: "Elevator Systems", zone: "Typical Buildings", scheduledDate: "2025-02-05", maintenanceType: "Preventive", estimatedCost: 3500, duration: 4, resourceRequirements: "Elevator Technician", priority: "Medium" }
  ];

  const maintenanceForecastData = [
    { id: "1", assetName: "Swimming Pool Equipment", zone: "Zone 5", installationYear: 2020, currentCondition: "Good", nextMaintenanceYear: 2025, maintenanceType: "Major Service", estimatedCost: 12500, lifeExpectancy: 15 },
    { id: "2", assetName: "Road Surface", zone: "Master Community", installationYear: 2018, currentCondition: "Fair", nextMaintenanceYear: 2026, maintenanceType: "Resurfacing", estimatedCost: 85000, lifeExpectancy: 12 },
    { id: "3", assetName: "Landscaping - Palm Trees", zone: "Zone 8", installationYear: 2019, currentCondition: "Excellent", nextMaintenanceYear: 2025, maintenanceType: "Specialized Treatment", estimatedCost: 18200, lifeExpectancy: 25 }
  ];

  const assetCategoriesData = [
    { id: "1", name: "Infrastructure", subCategory: "Roads & Pathways", assetCount: 124, totalReplacementCost: 1250000, lifeExpectancyRange: "15-25 years", zoneCoverage: "All Zones" },
    { id: "2", name: "MEP Systems", subCategory: "HVAC Equipment", assetCount: 356, totalReplacementCost: 750000, lifeExpectancyRange: "10-15 years", zoneCoverage: "Zones 3, 5" },
    { id: "3", name: "Finishes/Structure", subCategory: "External Facades", assetCount: 215, totalReplacementCost: 320000, lifeExpectancyRange: "20-30 years", zoneCoverage: "All Zones" }
  ];

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
            <CriticalAssetsTable data={criticalAssetsData} />
            <AssetConditionsTable data={assetConditionsData} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingMaintenanceTable data={upcomingMaintenanceData} />
            <MaintenanceForecastTable data={maintenanceForecastData} />
          </div>
        </TabsContent>
        
        <TabsContent value="assets" className="space-y-6">
          <AssetCategoriesTable data={assetCategoriesData} />
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
