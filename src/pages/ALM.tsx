
import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetCategoriesTable, AssetConditionsTable, CriticalAssetsTable, UpcomingMaintenanceTable, MaintenanceForecastTable } from '@/components/alm/tables';
import ALMDashboard from '@/components/alm/ALMDashboard';
import ReserveFundCalculator from '@/components/alm/ReserveFundCalculator';
import PropertyServiceChargeCalculator from '@/components/alm/PropertyServiceChargeCalculator';

const ALM = () => {
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
          <ALMDashboard />
          
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
