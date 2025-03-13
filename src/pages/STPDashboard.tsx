
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { stpMonthlyData, getDailyDataForMonth, calculateMonthlyMetrics, formatMonth } from '@/utils/stpDataUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STPMonthlyOverview } from '@/components/stp/STPMonthlyOverview';
import { STPDailyDetails } from '@/components/stp/STPDailyDetails';
import { STPMetricsCards } from '@/components/stp/STPMetricsCards';

const STPDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(stpMonthlyData[stpMonthlyData.length - 1].month);
  const [activeTab, setActiveTab] = useState<string>("monthly");

  useEffect(() => {
    document.title = 'STP Dashboard | Muscat Bay Asset Manager';
  }, []);

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-muscat-primary">STP Plant Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time monitoring and analytics for the Sewage Treatment Plant</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Select onValueChange={handleMonthChange} defaultValue={selectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {stpMonthlyData.map((month) => (
                  <SelectItem key={month.month} value={month.month}>
                    {formatMonth(month.month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <STPMetricsCards selectedMonth={selectedMonth} />

        <Tabs defaultValue="monthly" className="mt-6" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
            <TabsTrigger value="daily">Daily Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly">
            <STPMonthlyOverview />
          </TabsContent>
          
          <TabsContent value="daily">
            <STPDailyDetails selectedMonth={selectedMonth} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default STPDashboard;
