import React, { useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AssetCategory, CriticalAsset, MaintenanceForecast, AssetCondition } from '@/types/alm';
import { PropertyTransaction, PropertyOwner, PropertyUnit } from '@/types/expenses';
import { PackageOpen, Wrench, AlertCircle, BarChart3, Ruler, Calculator } from 'lucide-react';
import ServiceChargeCalculator from '@/components/service-charges/ServiceChargeCalculator';
import { getMockExpenseDisplayData } from '@/utils/expenseUtils';
import { 
  AssetCategoriesTable, 
  CriticalAssetsTable, 
  MaintenanceForecastTable, 
  AssetConditionsTable, 
  UpcomingMaintenanceTable 
} from '@/components/alm/tables';

// Mock asset categories data
const assetCategories: AssetCategory[] = [
  { 
    id: '1', 
    name: 'HVAC Systems', 
    subCategory: 'Mechanical', 
    assetCount: 58, 
    totalReplacementCost: 1200000, 
    lifeExpectancyRange: '15-20 years', 
    zoneCoverage: 'All Zones' 
  },
  { 
    id: '2', 
    name: 'Electrical Distribution', 
    subCategory: 'Electrical', 
    assetCount: 45, 
    totalReplacementCost: 850000, 
    lifeExpectancyRange: '20-25 years', 
    zoneCoverage: 'Zones 1-5' 
  },
  { 
    id: '3', 
    name: 'Water Distribution', 
    subCategory: 'Plumbing', 
    assetCount: 65, 
    totalReplacementCost: 720000, 
    lifeExpectancyRange: '25-30 years', 
    zoneCoverage: 'All Zones' 
  },
  { 
    id: '4', 
    name: 'Fire Protection', 
    subCategory: 'Safety', 
    assetCount: 32, 
    totalReplacementCost: 450000, 
    lifeExpectancyRange: '10-15 years', 
    zoneCoverage: 'All Buildings' 
  },
  { 
    id: '5', 
    name: 'Elevators', 
    subCategory: 'Mechanical', 
    assetCount: 12, 
    totalReplacementCost: 680000, 
    lifeExpectancyRange: '20-25 years', 
    zoneCoverage: 'Residential Towers' 
  }
];

// Mock property transactions
const propertyTransactions: PropertyTransaction[] = [
  {
    id: '1',
    property_id: 'prop1',
    owner_id: 'owner1',
    spa_date: '2023-01-15',
    property: {
      id: 'prop1',
      unit_no: 'Z3-001',
      sector: 'Zone 3',
      property_type: 'Residential',
      status: 'Occupied',
      unit_type: 'Apartment',
      bua: 120,
      plot_size: 0,
      unit_value: 185000,
      handover_date: '2022-06-10',
      anticipated_handover_date: null
    },
    owner: {
      id: 'owner1',
      client_name: 'Mohammed Al-Balushi',
      client_name_arabic: 'محمد البلوشي',
      email: 'mohammed@example.com',
      nationality: 'Omani',
      region: 'Muscat',
      date_of_birth: '1975-03-22'
    }
  },
  {
    id: '2',
    property_id: 'prop2',
    owner_id: 'owner2',
    spa_date: '2023-02-20',
    property: {
      id: 'prop2',
      unit_no: 'Z5-015',
      sector: 'Zone 5',
      property_type: 'Residential',
      status: 'Occupied',
      unit_type: 'Villa',
      bua: 250,
      plot_size: 400,
      unit_value: 425000,
      handover_date: '2022-07-15',
      anticipated_handover_date: null
    },
    owner: {
      id: 'owner2',
      client_name: 'Sarah Johnson',
      client_name_arabic: null,
      email: 'sarah@example.com',
      nationality: 'British',
      region: 'International',
      date_of_birth: '1982-09-12'
    }
  }
];

const AssetLifecycle: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get expense data for service charge calculations
  const expenses = getMockExpenseDisplayData();
  
  // Mock reserve fund rates
  const reserveFundRates = [
    { zone: 'Z3', zoneName: 'Zone 3 (Zaha)', rate: 0.40, effectiveDate: '2023-01-01', notes: 'Residential apartments' },
    { zone: 'Z5', zoneName: 'Zone 5 (Nameer)', rate: 0.50, effectiveDate: '2023-01-01', notes: 'Premium villas' },
    { zone: 'Z8', zoneName: 'Zone 8 (Wajd)', rate: 0.60, effectiveDate: '2023-01-01', notes: 'Luxury villas' },
    { zone: 'COM', zoneName: 'Commercial', rate: 0.70, effectiveDate: '2023-01-01', notes: 'Retail and office spaces' }
  ];

  return (
    <StandardPageLayout
      title="Asset Lifecycle Management"
      icon={<PackageOpen className="h-8 w-8 text-blue-600" />}
      description="Comprehensive asset management and service charge calculations"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Assets</p>
                <h3 className="text-2xl font-bold">{assetCategories.reduce((sum, cat) => sum + cat.assetCount, 0)}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PackageOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Properties</p>
                <h3 className="text-2xl font-bold">{propertyTransactions.length}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Ruler className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Total Replacement Value</p>
                <h3 className="text-2xl font-bold">OMR {(assetCategories.reduce((sum, cat) => sum + cat.totalReplacementCost, 0) / 1000000).toFixed(1)}M</h3>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Service Charges</p>
                <h3 className="text-2xl font-bold">OMR {(expenses.reduce((sum, expense) => sum + expense.annual, 0) / 1000).toFixed(1)}K</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calculator className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <PackageOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Asset Categories</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            <span className="hidden sm:inline">Properties</span>
          </TabsTrigger>
          <TabsTrigger value="service-charges" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Service Charges</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Asset Replacement Value by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {/* Placeholder for chart */}
                  <div className="w-full h-full bg-gray-50 rounded-md flex items-center justify-center">
                    Asset Replacement Value Chart
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Asset Distribution by Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {/* Placeholder for chart */}
                  <div className="w-full h-full bg-gray-50 rounded-md flex items-center justify-center">
                    Asset Distribution Chart
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetCategoriesTable data={assetCategories} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit No</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">BUA (sqm)</TableHead>
                    <TableHead className="text-right">Value (OMR)</TableHead>
                    <TableHead>Handover Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.property.unit_no}</TableCell>
                      <TableCell>{transaction.property.sector}</TableCell>
                      <TableCell>{transaction.property.unit_type}</TableCell>
                      <TableCell>{transaction.owner.client_name}</TableCell>
                      <TableCell className="text-right">{transaction.property.bua}</TableCell>
                      <TableCell className="text-right">{transaction.property.unit_value.toLocaleString()}</TableCell>
                      <TableCell>{transaction.property.handover_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-charges" className="space-y-4">
          <ServiceChargeCalculator 
            expenses={expenses}
            reserveFundRates={reserveFundRates}
          />
        </TabsContent>
      </Tabs>
    </StandardPageLayout>
  );
};

export default AssetLifecycle;
