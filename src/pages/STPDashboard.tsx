
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { stpMonthlyData, formatMonth, getDailyDataForMonth } from '@/utils/stpDataUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { STPMonthlyOverview } from '@/components/stp/STPMonthlyOverview';
import { STPDailyDetails } from '@/components/stp/STPDailyDetails';
import { STPMetricsCards } from '@/components/stp/STPMetricsCards';
import { 
  AreaChart, 
  BarChart2, 
  CalendarClock, 
  Droplets, 
  Download, 
  DownloadCloud,
  FileSpreadsheet, 
  Info,
  PanelLeftClose
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STPDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(stpMonthlyData[stpMonthlyData.length - 1].month);
  const [activeTab, setActiveTab] = useState<string>("monthly");
  const [isCompactView, setIsCompactView] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'STP Dashboard | Muscat Bay Asset Manager';
    
    // Log data to check if it's properly loaded
    console.log("Monthly data loaded:", stpMonthlyData);
    const dailyData = getDailyDataForMonth(selectedMonth);
    console.log("Daily data for selected month:", dailyData);
    
    if (dailyData.length === 0) {
      toast.warning(`No daily data found for ${formatMonth(selectedMonth)}. Please select another month.`);
    }
  }, [selectedMonth]);

  const handleMonthChange = (value: string) => {
    console.log("Selected month changed to:", value);
    setSelectedMonth(value);
    const dailyData = getDailyDataForMonth(value);
    if (dailyData.length === 0) {
      toast.warning(`No daily data found for ${formatMonth(value)}. Please select another month.`);
    } else {
      toast.success(`Loaded ${dailyData.length} days of data for ${formatMonth(value)}`);
    }
  };

  const toggleCompactView = () => {
    setIsCompactView(!isCompactView);
    toast.info(isCompactView ? "Expanded view enabled" : "Compact view enabled");
  };

  const exportData = () => {
    toast.success("Data export started. Your file will be ready shortly.");
    // In a real implementation, this would trigger a data export process
  };

  return (
    <Layout>
      <div className={`container mx-auto py-6 transition-all duration-300 ${isCompactView ? 'py-3' : 'py-6'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 animate-fade-in">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold tracking-tight text-muscat-primary flex items-center">
                <Droplets className="mr-2 h-6 w-6" />
                STP Plant Dashboard
              </h1>
              <Badge variant="outline" className="ml-3 bg-muscat-primary/10 text-muscat-primary">
                Real-time
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Real-time monitoring and analytics for the Sewage Treatment Plant
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <div className="px-3 py-1 bg-muscat-primary/10 rounded-md text-muscat-primary text-sm flex items-center">
              <CalendarClock className="mr-2 h-4 w-4" />
              Select Month:
            </div>
            <Select onValueChange={handleMonthChange} value={selectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Month">
                  {formatMonth(selectedMonth)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {stpMonthlyData.map((month) => (
                  <SelectItem key={month.month} value={month.month}>
                    {formatMonth(month.month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={toggleCompactView}>
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle compact view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={exportData}>
                    <DownloadCloud className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export current data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="animate-fade-in" style={{animationDelay: "0.1s"}}>
          <STPMetricsCards selectedMonth={selectedMonth} />
        </div>

        <Tabs defaultValue="monthly" className="mt-6" onValueChange={setActiveTab} value={activeTab}>
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
          
          <TabsContent value="monthly" className="animate-fade-in" style={{animationDelay: "0.2s"}}>
            <STPMonthlyOverview selectedMonth={selectedMonth} />
          </TabsContent>
          
          <TabsContent value="daily" className="animate-fade-in" style={{animationDelay: "0.2s"}}>
            <STPDailyDetails selectedMonth={selectedMonth} />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 border-t pt-4 text-sm text-gray-500 flex justify-between items-center">
          <div className="flex items-center">
            <Info className="h-4 w-4 mr-2" />
            <span>Data updated daily at 00:00 GMT+4</span>
          </div>
          <div className="flex space-x-4">
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={exportData}>
              <FileSpreadsheet className="h-3 w-3 mr-1" />
              Export as Excel
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={exportData}>
              <Download className="h-3 w-3 mr-1" />
              Download PDF Report
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default STPDashboard;
