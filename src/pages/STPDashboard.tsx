
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { stpMonthlyData, formatMonth, getDailyDataForMonth } from '@/utils/stpDataUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STPMonthlyOverview } from '@/components/stp/STPMonthlyOverview';
import { STPDailyDetails } from '@/components/stp/STPDailyDetails';
import { STPMetricsCards } from '@/components/stp/STPMetricsCards';
import { AreaChart, BarChart2, CalendarClock, Droplets } from 'lucide-react';

const STPDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(stpMonthlyData[stpMonthlyData.length - 1].month);
  const [activeTab, setActiveTab] = useState<string>("monthly");

  useEffect(() => {
    document.title = 'STP Dashboard | Muscat Bay Asset Manager';
    
    // Log data to check if it's properly loaded
    console.log("Monthly data loaded:", stpMonthlyData);
    console.log("Daily data for selected month:", getDailyDataForMonth(selectedMonth));
  }, [selectedMonth]);

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-muscat-primary flex items-center">
              <Droplets className="mr-2 h-6 w-6" />
              STP Plant Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Real-time monitoring and analytics for the Sewage Treatment Plant</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <div className="px-3 py-1 bg-muscat-primary/10 rounded-md text-muscat-primary text-sm flex items-center">
              <CalendarClock className="mr-2 h-4 w-4" />
              Select Month:
            </div>
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
            <TabsTrigger value="monthly" className="flex items-center">
              <AreaChart className="mr-2 h-4 w-4" />
              Monthly Overview
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center">
              <BarChart2 className="mr-2 h-4 w-4" />
              Daily Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly">
            <STPMonthlyOverview selectedMonth={selectedMonth} />
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
