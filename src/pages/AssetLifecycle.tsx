
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, LifeBuoy, Boxes, Calculator } from 'lucide-react';
import { useAssets } from "@/hooks/useAssets";
import { CriticalAssetsTable, AssetCategoriesTable, AssetConditionsTable, MaintenanceForecastTable, UpcomingMaintenanceTable } from "@/components/alm/tables";
import ServiceChargeCalculator from "@/components/alm/ServiceChargeCalculator";
import ReserveFundCalculator from "@/components/alm/ReserveFundCalculator";

const AssetLifecycle = () => {
  const { assets, loading, error } = useAssets();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Lifecycle Management</h1>
          <p className="text-muted-foreground">Manage and track assets across the property</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[800px]">
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
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>Calculator</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Overview content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assets.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assets.filter(a => a.condition === 'Poor').length}</div>
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
            <AssetCategoriesTable assets={assets} />
            <AssetConditionsTable assets={assets} />
          </div>
          
          <CriticalAssetsTable assets={assets} />
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          {/* Maintenance content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MaintenanceForecastTable />
            <UpcomingMaintenanceTable />
          </div>
        </TabsContent>
        
        <TabsContent value="service-charges" className="space-y-4">
          {/* Service charges content */}
          <ServiceChargeCalculator initialData={{
            zone3: {
              name: "Zaha Zone",
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
              unitTypes: {
                villa: {
                  name: "Villa",
                  baseRate: 1.8,
                  sizes: [750.35, 760.40, 943.00, 1187.47, 1844.67]
                }
              }
            }
          }} />
        </TabsContent>
        
        <TabsContent value="calculator" className="space-y-4">
          {/* Reserve Fund Calculator content */}
          <ReserveFundCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetLifecycle;
