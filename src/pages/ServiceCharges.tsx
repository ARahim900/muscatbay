
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, BarChart2, FileText, Settings, PieChart } from 'lucide-react';
import ServiceChargeCalculator from '@/components/service-charges/ServiceChargeCalculator';
import ServiceChargeOverview from '@/components/service-charges/ServiceChargeOverview';
import ServiceChargeExpenses from '@/components/service-charges/ServiceChargeExpenses';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a QueryClient for React Query
const queryClient = new QueryClient();

const ServiceCharges: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <QueryClientProvider client={queryClient}>
      <StandardPageLayout
        title="Service Charges"
        description="Manage and calculate service charges for all properties"
        icon={<Calculator className="h-5 w-5 text-primary" />}
        headerColor="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10"
      >
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span>Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span>Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ServiceChargeOverview />
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <ServiceChargeCalculator />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <ServiceChargeExpenses />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Charge Settings</CardTitle>
                <CardDescription>Configure service charge parameters and policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Reserve Fund Configuration</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure reserve fund rates by zone. These settings determine the contribution to the reserve fund for each property based on size and location.
                    </p>
                    <div className="bg-muted p-4 rounded text-center">
                      <p>Reserve fund settings editor will be implemented here.</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Service Charge Policies</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Define service charge policies, payment terms, and allocation rules for different property types and zones.
                    </p>
                    <div className="bg-muted p-4 rounded text-center">
                      <p>Policy configuration settings will be implemented here.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </StandardPageLayout>
    </QueryClientProvider>
  );
};

export default ServiceCharges;
