
import React from 'react';
import { Layout } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import STPDailyDetails from '@/components/stp/STPDailyDetails'; 
import STPMonthlyOverview from '@/components/stp/STPMonthlyOverview';
import STPMetricsCards from '@/components/stp/STPMetricsCards';
import STPDataImport from '@/components/stp/STPDataImport';

const STPDashboard = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Sewage Treatment Plant Dashboard</h1>
          <STPDataImport />
        </div>

        <STPMetricsCards />

        <Tabs defaultValue="monthly" className="mt-6">
          <TabsList>
            <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
            <TabsTrigger value="daily">Daily Details</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly" className="mt-4">
            <STPMonthlyOverview />
          </TabsContent>
          <TabsContent value="daily" className="mt-4">
            <STPDailyDetails />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default STPDashboard;
