import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Calendar, AlertTriangle, Clock, DollarSign, CheckCircle, 
  Layers, MapPin, List, File, Calculator
} from 'lucide-react';
import { useTheme } from '@/components/theme/theme-provider';
import { 
  AssetCategory, AssetCondition, CriticalAsset, 
  MaintenanceForecast, UpcomingMaintenance 
} from '@/types/alm';
import AssetCategoriesTable from './tables/AssetCategoriesTable';
import MaintenanceForecastTable from './tables/MaintenanceForecastTable';
import AssetConditionsTable from './tables/AssetConditionsTable';
import CriticalAssetsTable from './tables/CriticalAssetsTable';
import UpcomingMaintenanceTable from './tables/UpcomingMaintenanceTable';
import ServiceChargeCalculator from './ServiceChargeCalculator';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AssetLifecycleDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { theme } = useTheme();

  // Sample data for charts
  const assetCategoriesData = [
    { name: 'Architectural', value: 500, color: '#8884d8' },
    { name: 'Mechanical', value: 400, color: '#82ca9d' },
    { name: 'Electrical', value: 350, color: '#ffc658' },
    { name: 'External Works', value: 650, color: '#ff8042' },
    { name: 'Infrastructure', value: 200, color: '#0088fe' }
  ];

  const maintenanceForecastData = [
    { year: '2023', cost: 75000 },
    { year: '2024', cost: 120000 },
    { year: '2025', cost: 90000 },
    { year: '2026', cost: 210000 },
    { year: '2027', cost: 180000 },
    { year: '2028', cost: 320000 },
    { year: '2029', cost: 450000 },
    { year: '2030', cost: 250000 }
  ];

  const assetConditionData = [
    { name: 'Excellent', value: 65, color: '#4CAF50' },
    { name: 'Good', value: 20, color: '#2196F3' },
    { name: 'Fair', value: 10, color: '#FFC107' },
    { name: 'Poor', value: 5, color: '#F44336' }
  ];

  // Asset Categories Table Data
  const assetCategoriesTableData: AssetCategory[] = [
    { id: 1, name: 'Architectural', subCategory: 'External Walls', assetCount: 24, totalReplacementCost: 83704, lifeExpectancyRange: '15-25', zoneCoverage: 'All Zones' },
    { id: 2, name: 'Architectural', subCategory: 'Roofing System', assetCount: 22, totalReplacementCost: 51350, lifeExpectancyRange: '10-15', zoneCoverage: 'All Zones' },
    { id: 3, name: 'Architectural', subCategory: 'Kerb Stones', assetCount: 36, totalReplacementCost: 148644, lifeExpectancyRange: '13-25', zoneCoverage: 'Master Community' },
    { id: 4, name: 'Architectural', subCategory: 'Paviours', assetCount: 16, totalReplacementCost: 120, lifeExpectancyRange: '10-20', zoneCoverage: 'Village Square' },
    { id: 5, name: 'Structural', subCategory: 'Metal Guards', assetCount: 14, totalReplacementCost: 1492, lifeExpectancyRange: '10-20', zoneCoverage: 'Master Community' },
    { id: 6, name: 'Structural', subCategory: 'Hard Landscaping', assetCount: 42, totalReplacementCost: 10500, lifeExpectancyRange: '10-15', zoneCoverage: 'All Zones' },
    { id: 7, name: 'Mechanical', subCategory: 'HVAC Systems', assetCount: 68, totalReplacementCost: 65625, lifeExpectancyRange: '12-20', zoneCoverage: 'Staff Accommodation & CF' },
    { id: 8, name: 'Mechanical', subCategory: 'Chillers', assetCount: 24, totalReplacementCost: 29295, lifeExpectancyRange: '20', zoneCoverage: 'Staff Accommodation & CF' },
    { id: 9, name: 'Mechanical', subCategory: 'Pumps', assetCount: 32, totalReplacementCost: 27720, lifeExpectancyRange: '13-16', zoneCoverage: 'Multiple Zones' },
    { id: 10, name: 'Mechanical', subCategory: 'Air Handling', assetCount: 18, totalReplacementCost: 12096, lifeExpectancyRange: '20', zoneCoverage: 'Staff Accommodation & CF' },
    { id: 11, name: 'Electrical', subCategory: 'Distribution Boards', assetCount: 42, totalReplacementCost: 9190, lifeExpectancyRange: '20', zoneCoverage: 'All Zones' },
    { id: 12, name: 'Electrical', subCategory: 'Lighting Systems', assetCount: 126, totalReplacementCost: 7144, lifeExpectancyRange: '10-15', zoneCoverage: 'All Zones' },
    { id: 13, name: 'Electrical', subCategory: 'Fire Alarm Systems', assetCount: 18, totalReplacementCost: 270, lifeExpectancyRange: '15', zoneCoverage: 'All Zones' },
    { id: 14, name: 'Electrical', subCategory: 'Security Systems', assetCount: 24, totalReplacementCost: 672, lifeExpectancyRange: '14', zoneCoverage: 'All Zones' },
    { id: 15, name: 'Interior', subCategory: 'Floor Finishes', assetCount: 86, totalReplacementCost: 59195, lifeExpectancyRange: '10-20', zoneCoverage: 'All Buildings' },
    { id: 16, name: 'Interior', subCategory: 'Wall Finishes', assetCount: 124, totalReplacementCost: 24962, lifeExpectancyRange: '7-15', zoneCoverage: 'All Buildings' },
    { id: 17, name: 'Interior', subCategory: 'Ceiling Finishes', assetCount: 64, totalReplacementCost: 14378, lifeExpectancyRange: '7-15', zoneCoverage: 'All Buildings' },
    { id: 18, name: 'Irrigation', subCategory: 'Pumps & Controls', assetCount: 14, totalReplacementCost: 46200, lifeExpectancyRange: '15', zoneCoverage: 'Master Community' },
    { id: 19, name: 'Recreational', subCategory: 'Swimming Pool', assetCount: 4, totalReplacementCost: 10240, lifeExpectancyRange: '15-20', zoneCoverage: 'Central Facilities' },
    { id: 20, name: 'Recreational', subCategory: 'Basketball Court', assetCount: 2, totalReplacementCost: 2625, lifeExpectancyRange: '18', zoneCoverage: 'Staff Facilities' }
  ];

  // Maintenance Forecast Table Data
  const maintenanceForecastTableData: MaintenanceForecast[] = [
    { id: 'A001', assetName: 'Distribution Board', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2041, maintenanceType: 'Refurbish', estimatedCost: 197, lifeExpectancy: 20 },
    { id: 'A002', assetName: 'Internal Lighting', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2031, maintenanceType: 'Replace', estimatedCost: 968, lifeExpectancy: 10 },
    { id: 'A003', assetName: 'Fire Alarm Panel', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2036, maintenanceType: 'Upgrade', estimatedCost: 291, lifeExpectancy: 15 },
    { id: 'A004', assetName: 'Fire Extinguishers', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2026, maintenanceType: 'Replace', estimatedCost: 136, lifeExpectancy: 5 },
    { id: 'A005', assetName: 'Fan Coil Unit', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2036, maintenanceType: 'Replace', estimatedCost: 276, lifeExpectancy: 15 },
    { id: 'A006', assetName: 'Split AC', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2033, maintenanceType: 'Replace', estimatedCost: 0, lifeExpectancy: 12 },
    { id: 'A007', assetName: 'Jet Fans', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2036, maintenanceType: 'Replace', estimatedCost: 1285, lifeExpectancy: 15 },
    { id: 'A008', assetName: 'Parking Extract Fans', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2036, maintenanceType: 'Replace', estimatedCost: 345, lifeExpectancy: 15 },
    { id: 'A009', assetName: 'Piping & Ducting', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2031, maintenanceType: 'Replace', estimatedCost: 5295, lifeExpectancy: 10 },
    { id: 'A010', assetName: 'Elevator Doors & Cabs', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2039, maintenanceType: 'Replace', estimatedCost: 1597, lifeExpectancy: 18 },
    { id: 'A011', assetName: 'Elevator Wire Ropes', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2027, maintenanceType: 'Replace', estimatedCost: 2524, lifeExpectancy: 6 },
    { id: 'A012', assetName: 'Elevator Motors', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2036, maintenanceType: 'Replace', estimatedCost: 394, lifeExpectancy: 15 },
    { id: 'A013', assetName: 'Emergency Lights', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2031, maintenanceType: 'Refurbish', estimatedCost: 391, lifeExpectancy: 10 },
    { id: 'A014', assetName: 'Video Intercom', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2035, maintenanceType: 'Upgrade', estimatedCost: 721, lifeExpectancy: 14 },
    { id: 'A015', assetName: 'Gate Barriers', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2031, maintenanceType: 'Replace', estimatedCost: 1896, lifeExpectancy: 10 },
    { id: 'A016', assetName: 'Roofing Waterproofing', zone: 'Typical Buildings', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2031, maintenanceType: 'Refurbish', estimatedCost: 703, lifeExpectancy: 10 },
    { id: 'A017', assetName: 'Tree Uplighter', zone: 'Zone 5 (Al Nameer)', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2035, maintenanceType: 'Replace', estimatedCost: 40010, lifeExpectancy: 15 },
    { id: 'A018', assetName: 'Recessed Stair Light', zone: 'Zone 5 (Al Nameer)', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2039, maintenanceType: 'Replace', estimatedCost: 1855, lifeExpectancy: 18 },
    { id: 'A019', assetName: 'Underwater Lights', zone: 'Zone 5 (Al Nameer)', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2035, maintenanceType: 'Replace', estimatedCost: 11044, lifeExpectancy: 15 },
    { id: 'A020', assetName: 'Main Fire Fighting', zone: 'Master Community', installationYear: 2021, currentCondition: 'Good', nextMaintenanceYear: 2034, maintenanceType: 'Replace', estimatedCost: 12753, lifeExpectancy: 13 }
  ];

  // Asset Conditions Table Data
  const assetConditionsTableData: AssetCondition[] = [
    { id: 1, conditionRating: 'Excellent', description: 'Like new, no visible defects', assetCount: 245, percentage: 23.5, recommendedAction: 'Regular inspection only' },
    { id: 2, conditionRating: 'Good', description: 'Minor wear, fully functional', assetCount: 493, percentage: 47.2, recommendedAction: 'Routine maintenance' },
    { id: 3, conditionRating: 'Fair', description: 'Visible wear, functional', assetCount: 186, percentage: 17.8, recommendedAction: 'Increased monitoring' },
    { id: 4, conditionRating: 'Poor', description: 'Significant deterioration', assetCount: 86, percentage: 8.2, recommendedAction: 'Plan for replacement' },
    { id: 5, conditionRating: 'Critical', description: 'Failing, requiring immediate attention', assetCount: 34, percentage: 3.3, recommendedAction: 'Immediate replacement' }
  ];

  // Critical Assets Table Data
  const criticalAssetsTableData: CriticalAsset[] = [
    { id: 'CA001', assetName: 'Sewerage Treatment Plant', zone: 'Master Community', currentCondition: 'Fair', replacementCost: 168000, criticalityRating: 5, failureImpact: 'Service disruption', recommendedAction: 'Comprehensive maintenance', targetCompletion: 'Q2 2023' },
    { id: 'CA002', assetName: 'Main Fire Fighting System', zone: 'Master Community', currentCondition: 'Good', replacementCost: 11658, criticalityRating: 5, failureImpact: 'Safety risk', recommendedAction: 'Inspection & testing', targetCompletion: 'Q3 2023' },
    { id: 'CA003', assetName: 'Chillers (Type 1)', zone: 'Staff Accommodation', currentCondition: 'Good', replacementCost: 65625, criticalityRating: 4, failureImpact: 'Occupant comfort', recommendedAction: 'Performance monitoring', targetCompletion: 'Q3 2023' },
    { id: 'CA004', assetName: 'Electrical MCC Panel', zone: 'Staff Accommodation', currentCondition: 'Good', replacementCost: 7940, criticalityRating: 4, failureImpact: 'Power distribution', recommendedAction: 'Preventive maintenance', targetCompletion: 'Q4 2023' },
    { id: 'CA005', assetName: 'Fire Alarm Control Panels', zone: 'Zone 3 (Al Zaha)', currentCondition: 'Good', replacementCost: 2430, criticalityRating: 5, failureImpact: 'Life safety', recommendedAction: 'Testing & certification', targetCompletion: 'Q2 2023' },
    { id: 'CA006', assetName: 'Swimming Pool Filtration', zone: 'Central Facilities', currentCondition: 'Fair', replacementCost: 26304, criticalityRating: 3, failureImpact: 'Amenity disruption', recommendedAction: 'Component replacement', targetCompletion: 'Q3 2023' },
    { id: 'CA007', assetName: 'Irrigation Pumps', zone: 'Master Community', currentCondition: 'Fair', replacementCost: 46200, criticalityRating: 4, failureImpact: 'Landscape damage', recommendedAction: 'System overhaul', targetCompletion: 'Q2 2023' },
    { id: 'CA008', assetName: 'Elevators', zone: 'Typical Buildings', currentCondition: 'Good', replacementCost: 9680, criticalityRating: 4, failureImpact: 'Access restrictions', recommendedAction: 'Preventive maintenance', targetCompletion: 'Q3 2023' },
    { id: 'CA009', assetName: 'Gate Barriers', zone: 'Master Community', currentCondition: 'Fair', replacementCost: 10920, criticalityRating: 3, failureImpact: 'Security concerns', recommendedAction: 'Lubrication & alignment', targetCompletion: 'Q2 2023' },
    { id: 'CA010', assetName: 'Lagoon Water Feature', zone: 'Master Community', currentCondition: 'Poor', replacementCost: 78750, criticalityRating: 3, failureImpact: 'Aesthetic impact', recommendedAction: 'Major renovation', targetCompletion: 'Q4 2023' }
  ];

  // Upcoming Maintenance Table Data
  const upcomingMaintenanceTableData: UpcomingMaintenance[] = [
    { id: 'M001', assetName: 'Roads Kerb Length', zone: 'Zone 5 (Al Nameer)', scheduledDate: '2023-06-15', maintenanceType: 'Replace', estimatedCost: 9633, duration: 14, resourceRequirements: 'Contractor team', priority: 'Medium' },
    { id: 'M002', assetName: 'Ground Floor Parking Epoxy', zone: 'Typical Buildings', scheduledDate: '2023-07-02', maintenanceType: 'Replace', estimatedCost: 1502, duration: 4, resourceRequirements: 'Painting team', priority: 'Low' },
    { id: 'M003', assetName: 'Store Room Floor Finishes', zone: 'Typical Buildings', scheduledDate: '2023-07-15', maintenanceType: 'Replace', estimatedCost: 216, duration: 2, resourceRequirements: 'Flooring team', priority: 'Low' },
    { id: 'M004', assetName: 'Roads PCC Paving', zone: 'Zone 3 (Al Zaha)', scheduledDate: '2023-09-10', maintenanceType: 'Replace', estimatedCost: 24688, duration: 21, resourceRequirements: 'Contractor team', priority: 'Medium' },
    { id: 'M005', assetName: 'Footpaths Light Duty', zone: 'Zone 5 (Al Nameer)', scheduledDate: '2023-10-05', maintenanceType: 'Replace', estimatedCost: 8630, duration: 12, resourceRequirements: 'Contractor team', priority: 'Low' },
    { id: 'M006', assetName: 'Store Room Floor Finishes', zone: 'Typical Buildings', scheduledDate: '2023-10-21', maintenanceType: 'Replace', estimatedCost: 220, duration: 2, resourceRequirements: 'Flooring team', priority: 'Low' },
    { id: 'M007', assetName: 'Footpaths PCC Paving', zone: 'Zone 5 (Al Nameer)', scheduledDate: '2023-11-15', maintenanceType: 'Replace', estimatedCost: 6058, duration: 10, resourceRequirements: 'Contractor team', priority: 'Low' },
    { id: 'M008', assetName: 'Roads Kerb Length', zone: 'Zone 5 (Al Nameer)', scheduledDate: '2024-02-10', maintenanceType: 'Replace', estimatedCost: 9778, duration: 14, resourceRequirements: 'Contractor team', priority: 'Medium' },
    { id: 'M009', assetName: 'Pocket Parking Kerb', zone: 'Zone 5 (Al Nameer)', scheduledDate: '2024-03-12', maintenanceType: 'Replace', estimatedCost: 278, duration: 5, resourceRequirements: 'Contractor team', priority: 'Low' },
    { id: 'M010', assetName: 'Elevator Wire Ropes', zone: 'Typical Buildings', scheduledDate: '2024-04-05', maintenanceType: 'Replace', estimatedCost: 2524, duration: 3, resourceRequirements: 'Elevator specialist', priority: 'High' },
    { id: 'M011', assetName: 'Ground Covering Plants', zone: 'Zone 3 (Al Zaha)', scheduledDate: '2024-05-18', maintenanceType: 'Replace', estimatedCost: 7177, duration: 7, resourceRequirements: 'Landscaping team', priority: 'Low' },
    { id: 'M012', assetName: 'Main Entrance Wall', zone: 'Typical Buildings', scheduledDate: '2024-06-22', maintenanceType: 'Replace', estimatedCost: 37, duration: 2, resourceRequirements: 'Painting team', priority: 'Low' },
    { id: 'M013', assetName: 'Helipad Electrical Works', zone: 'Master Community', scheduledDate: '2024-07-10', maintenanceType: 'Replace', estimatedCost: 11140, duration: 5, resourceRequirements: 'Electrical team', priority: 'Medium' },
    { id: 'M014', assetName: 'Stairwell Ceiling', zone: 'Typical Buildings', scheduledDate: '2024-08-15', maintenanceType: 'Replace', estimatedCost: 31, duration: 1, resourceRequirements: 'Painting team', priority: 'Low' },
    { id: 'M015', assetName: 'Main Entrance Ceiling', zone: 'Typical Buildings', scheduledDate: '2024-09-20', maintenanceType: 'Replace', estimatedCost: 12, duration: 1, resourceRequirements: 'Painting team', priority: 'Low' }
  ];

  // Add gradient definitions for charts
  const chartGradients = () => {
    return (
      <defs>
        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
        </linearGradient>
        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#2196F3" stopOpacity={0.2}/>
        </linearGradient>
        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.2}/>
        </linearGradient>
      </defs>
    );
  };

  // Background color based on theme
  const getBgColor = () => {
    return theme === 'dark' ? 'bg-background' : 'bg-gray-50';
  };

  const getCardBgColor = () => {
    return theme === 'dark' ? 'bg-card' : 'bg-white';
  };

  const getTextColor = () => {
    return theme === 'dark' ? 'text-foreground' : 'text-gray-900';
  };

  const getMutedTextColor = () => {
    return theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500';
  };

  return (
    <div className={`min-h-screen ${getBgColor()}`}>
      {/* Header */}
      <header className={`${getCardBgColor()} shadow`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className={`text-2xl sm:text-3xl font-bold ${getTextColor()}`}>Asset Lifecycle Management Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${getMutedTextColor()}`}>Muscat Bay Community</span>
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">Live Data</span>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4 sm:mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Asset Categories</span>
              <span className="sm:hidden">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="critical" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Critical Assets</span>
              <span className="sm:hidden">Critical</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Maintenance</span>
              <span className="sm:hidden">Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="conditions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Conditions</span>
              <span className="sm:hidden">Conditions</span>
            </TabsTrigger>
            <TabsTrigger value="serviceCharges" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Service Charges</span>
              <span className="sm:hidden">Charges</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs sm:text-sm ${getMutedTextColor()}`}>Total Assets</p>
                    <h2 className="text-xl sm:text-2xl font-semibold">2,100</h2>
                  </div>
                  <Layers className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs sm:text-sm ${getMutedTextColor()}`}>Critical Assets</p>
                    <h2 className="text-xl sm:text-2xl font-semibold">10</h2>
                  </div>
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs sm:text-sm ${getMutedTextColor()}`}>Upcoming Maintenance</p>
                    <h2 className="text-xl sm:text-2xl font-semibold">15</h2>
                  </div>
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                </div>
              </Card>
              <Card className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs sm:text-sm ${getMutedTextColor()}`}>Total Replacement Value</p>
                    <h2 className="text-xl sm:text-2xl font-semibold">OMR 612,305</h2>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-6">
                <h3 className={`text-base sm:text-lg font-medium ${getTextColor()} mb-3 sm:mb-4`}>Asset Categories Distribution</h3>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetCategoriesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {assetCategoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} units`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <h3 className={`text-base sm:text-lg font-medium ${getTextColor()} mb-3 sm:mb-4`}>Asset Condition Overview</h3>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetConditionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {assetConditionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card className="p-4 sm:p-6">
              <h3 className={`text-base sm:text-lg font-medium ${getTextColor()} mb-3 sm:mb-4`}>Maintenance Cost Forecast</h3>
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={maintenanceForecastData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    {chartGradients()}
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => `OMR ${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="cost" name="Estimated Cost" fill="url(#colorCost)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Asset Categories Tab */}
          <TabsContent value="categories">
            <Card className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className={`text-base sm:text-lg font-medium ${getTextColor()}`}>Asset Categories</h3>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span className={`text-xs sm:text-sm ${getMutedTextColor()}`}>Muscat Bay Community</span>
                </div>
              </div>
              <AssetCategoriesTable data={assetCategoriesTableData} />
            </Card>
          </TabsContent>

          {/* Critical Assets Tab */}
          <TabsContent value="critical">
            <Card className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className={`text-base sm:text-lg font-medium ${getTextColor()}`}>Critical Assets</h3>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                  <span className={`text-xs sm:text-sm ${getMutedTextColor()}`}>High Priority Items</span>
                </div>
              </div>
              <CriticalAssetsTable data={criticalAssetsTableData} />
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4 sm:space-y-6">
            <Card className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className={`text-base sm:text-lg font-medium ${getTextColor()}`}>Maintenance Forecast</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  <span className={`text-xs sm:text-sm ${getMutedTextColor()}`}>Long-term Planning</span>
                </div>
              </div>
              <MaintenanceForecastTable data={maintenanceForecastTableData} />
            </Card>

            <Card className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className={`text-base sm:text-lg font-medium ${getTextColor()}`}>Upcoming Maintenance Tasks</h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  <span className={`text-xs sm:text-sm ${getMutedTextColor()}`}>Scheduled Work</span>
                </div>
              </div>
              <UpcomingMaintenanceTable data={upcomingMaintenanceTableData} />
            </Card>
          </TabsContent>

          {/* Conditions Tab */}
          <TabsContent value="conditions">
            <Card className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className={`text-base sm:text-lg font-medium ${getTextColor()}`}>Asset Conditions</h3>
                <div className="flex items-center gap-2">
                  <File className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span className={`text-xs sm:text-sm ${getMutedTextColor()}`}>Condition Assessment</span>
                </div>
              </div>
              <AssetConditionsTable data={assetConditionsTableData} />
            </Card>
          </TabsContent>

          {/* Service Charges Tab */}
          <TabsContent value="serviceCharges">
            <ServiceChargeCalculator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AssetLifecycleDashboard;
