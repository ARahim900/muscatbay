import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, LifeBuoy, Boxes, Calculator, Building2, ChevronRight, Home } from 'lucide-react';
import { useAssets } from "@/hooks/useAssets";
import { 
  CriticalAssetsTable, 
  AssetCategoriesTable, 
  AssetConditionsTable, 
  MaintenanceForecastTable, 
  UpcomingMaintenanceTable 
} from "@/components/alm/tables";
import ServiceChargeCalculator from "@/components/alm/ServiceChargeCalculator";
import RealPropertyServiceChargeCalculator from "@/components/alm/RealPropertyServiceChargeCalculator";
import ReserveFundCalculator from "@/components/alm/ReserveFundCalculator";
import { AssetCategorySummary, AssetCondition, CriticalAsset, MaintenanceForecast, UpcomingMaintenance } from '@/types/alm';
import { Link } from 'react-router-dom';
import BreadcrumbNavigation from '@/components/ui/breadcrumb-navigation';

const sampleCategoryData: AssetCategorySummary[] = [
  {
    id: "CAT-001",
    name: "HVAC Systems",
    subCategory: "Chillers",
    assetCount: 12,
    totalReplacementCost: 250000,
    lifeExpectancyRange: "15-20",
    zoneCoverage: "Zones 3, 5, 8"
  },
  {
    id: "CAT-002",
    name: "Electrical Systems",
    subCategory: "Transformers",
    assetCount: 8,
    totalReplacementCost: 180000,
    lifeExpectancyRange: "20-25",
    zoneCoverage: "All Zones"
  },
  {
    id: "CAT-003",
    name: "Plumbing",
    subCategory: "Water Pumps",
    assetCount: 24,
    totalReplacementCost: 120000,
    lifeExpectancyRange: "10-15",
    zoneCoverage: "All Zones"
  }
];

const sampleConditionData: AssetCondition[] = [
  {
    id: "COND-001",
    conditionRating: "Excellent",
    description: "Asset is new or like new",
    assetCount: 42,
    percentage: 35,
    recommendedAction: "Standard maintenance only"
  },
  {
    id: "COND-002",
    conditionRating: "Good",
    description: "Asset shows minor wear but functions well",
    assetCount: 56,
    percentage: 45,
    recommendedAction: "Regular preventive maintenance"
  },
  {
    id: "COND-003",
    conditionRating: "Fair",
    description: "Asset shows moderate wear, some components may need attention",
    assetCount: 18,
    percentage: 15,
    recommendedAction: "Targeted maintenance within 6 months"
  },
  {
    id: "COND-004",
    conditionRating: "Poor",
    description: "Asset has significant wear, function may be compromised",
    assetCount: 5,
    percentage: 4,
    recommendedAction: "Plan for replacement within 12-24 months"
  },
  {
    id: "COND-005",
    conditionRating: "Critical",
    description: "Asset at risk of failure or unsafe operation",
    assetCount: 1,
    percentage: 1,
    recommendedAction: "Immediate replacement required"
  }
];

const sampleCriticalAssetsData: CriticalAsset[] = [
  {
    id: "CRIT-001",
    assetName: "Main Chiller Unit",
    location: "Zone 3 - Plant Room",
    criticality: "High",
    riskScore: 8.5,
    lastInspectionDate: "2025-01-15",
    nextInspectionDate: "2025-04-15",
    replacementValue: 85000
  },
  {
    id: "CRIT-002",
    assetName: "Primary Electrical Transformer",
    location: "Zone 5 - Utility Room",
    criticality: "High",
    riskScore: 9.0,
    lastInspectionDate: "2025-02-01",
    nextInspectionDate: "2025-05-01",
    replacementValue: 110000
  },
  {
    id: "CRIT-003",
    assetName: "Emergency Generator",
    location: "Zone 8 - Service Building",
    criticality: "Medium",
    riskScore: 7.2,
    lastInspectionDate: "2025-01-20",
    nextInspectionDate: "2025-04-20",
    replacementValue: 65000
  }
];

const sampleMaintenanceData: MaintenanceForecast[] = [
  {
    id: "MAINT-001",
    assetName: "Cooling Tower",
    zone: "Zone 3",
    installationYear: 2020,
    currentCondition: "Good",
    nextMaintenanceYear: 2025,
    maintenanceType: "Major Overhaul",
    estimatedCost: 25000,
    lifeExpectancy: 15
  },
  {
    id: "MAINT-002",
    assetName: "Fire Pump System",
    zone: "Zone 5",
    installationYear: 2019,
    currentCondition: "Good",
    nextMaintenanceYear: 2024,
    maintenanceType: "Component Replacement",
    estimatedCost: 18000,
    lifeExpectancy: 20
  },
  {
    id: "MAINT-003",
    assetName: "Elevator - Tower B",
    zone: "Zone 8",
    installationYear: 2018,
    currentCondition: "Fair",
    nextMaintenanceYear: 2025,
    maintenanceType: "Motor Replacement",
    estimatedCost: 35000,
    lifeExpectancy: 25
  }
];

const sampleUpcomingMaintenanceData: UpcomingMaintenance[] = [
  {
    id: "UPM-001",
    assetName: "Swimming Pool Filtration System",
    zone: "Zone 3",
    scheduledDate: "2025-04-15",
    maintenanceType: "Filter Replacement",
    estimatedCost: 5200,
    duration: 3,
    resourceRequirements: "2 Technicians, Specialized Tools",
    priority: "Medium"
  },
  {
    id: "UPM-002",
    assetName: "Building Management System",
    zone: "All Zones",
    scheduledDate: "2025-03-28",
    maintenanceType: "Software Update",
    estimatedCost: 3500,
    duration: 1,
    resourceRequirements: "IT Specialist, BMS Vendor",
    priority: "High"
  },
  {
    id: "UPM-003",
    assetName: "Landscape Irrigation System",
    zone: "Zone 8",
    scheduledDate: "2025-04-10",
    maintenanceType: "Valve Replacement",
    estimatedCost: 4800,
    duration: 5,
    resourceRequirements: "Irrigation Specialist Team",
    priority: "Low"
  }
];

const AssetLifecycle = () => {
  const { assets, loading, error } = useAssets();
  const [activeTab, setActiveTab] = useState("overview");
  const [serviceChargeCalculatorType, setServiceChargeCalculatorType] = useState<'template' | 'real'>('real');

  const breadcrumbItems = [
    {
      label: "Asset Lifecycle Management",
      path: "/alm",
      icon: <Building2 className="h-4 w-4" />
    }
  ];

  return (
    <div className="container py-6 space-y-6">
      <div className="mb-2">
        <BreadcrumbNavigation items={breadcrumbItems} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Lifecycle Management</h1>
          <p className="text-muted-foreground">Manage and track assets across the property</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:w-[800px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="service-charges" className="flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            <span>Service Charges</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Properties</span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>Calculator</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assets?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sampleCriticalAssetsData.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Requiring immediate attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground mt-1">Scheduled in next 30 days</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AssetCategoriesTable data={sampleCategoryData} />
            <AssetConditionsTable data={sampleConditionData} />
          </div>
          
          <CriticalAssetsTable data={sampleCriticalAssetsData} />
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MaintenanceForecastTable data={sampleMaintenanceData} />
            <UpcomingMaintenanceTable data={sampleUpcomingMaintenanceData} />
          </div>
        </TabsContent>
        
        <TabsContent value="service-charges" className="space-y-4">
          <div className="flex justify-end space-x-2 mb-4">
            <button
              onClick={() => setServiceChargeCalculatorType('template')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                serviceChargeCalculatorType === 'template' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Template Calculator
            </button>
            <button
              onClick={() => setServiceChargeCalculatorType('real')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                serviceChargeCalculatorType === 'real' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Property-Based Calculator
            </button>
          </div>
          
          {serviceChargeCalculatorType === 'template' ? (
            <ServiceChargeCalculator initialData={{
              zone3: {
                name: "Zaha Zone",
                code: "Z3",
                unitTypes: {
                  apartment: {
                    name: "Apartment",
                    baseRate: 2.5,
                    sizes: [79.09, 115.47, 199.13, 355.07, 361.42]
                  },
                  villa: {
                    name: "Villa",
                    baseRate: 2.2,
                    sizes: [357.12, 422.24]
                  }
                }
              },
              zone5: {
                name: "Nameer Zone",
                code: "Z5",
                unitTypes: {
                  villa: {
                    name: "Villa",
                    baseRate: 2.0,
                    sizes: [426.78, 497.62]
                  }
                }
              },
              zone8: {
                name: "Wajd Zone",
                code: "Z8",
                unitTypes: {
                  villa: {
                    name: "Villa",
                    baseRate: 1.8,
                    sizes: [750.35, 760.40, 943.00, 1187.47, 1844.67]
                  }
                }
              }
            }} />
          ) : (
            <RealPropertyServiceChargeCalculator />
          )}
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Management</CardTitle>
              <CardDescription>View and manage property units in Muscat Bay</CardDescription>
            </CardHeader>
            <CardContent>
              <p>The property management interface will be implemented here. You can currently use the Property-Based calculator in the Service Charges tab to view property details.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calculator" className="space-y-4">
          <ReserveFundCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetLifecycle;
