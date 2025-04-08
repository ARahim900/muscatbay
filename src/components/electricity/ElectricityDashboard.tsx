
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, FileText, BarChart3, Grid3X3, Zap } from 'lucide-react';
import useAirtableData from '@/hooks/useAirtableData';
import { toast } from 'sonner';
import ElectricityOverview from './ElectricityOverview';
import ElectricityConsumptionChart from './ElectricityConsumptionChart';

const ELECTRICITY_BASE_ID = 'appbUreNO4vvslMme';
const ELECTRICITY_TABLE_ID = 'shrpAtmnZhxfZ87Ue';

const ElectricityDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedMonth, setSelectedMonth] = useState<string>('Feb');
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  const { data: electricityData, isLoading, error, refetch } = useAirtableData(
    ELECTRICITY_TABLE_ID,
    {
      view: 'Grid view',
    }
  );

  useEffect(() => {
    if (error) {
      toast.error('Failed to load electricity data. Please try again later.');
      console.error('Error loading electricity data:', error);
    }
  }, [error]);

  const handleExport = () => {
    toast.info('Exporting electricity data...');
    // Implement export functionality
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Electricity data refreshed');
  };

  const getMonthYearLabel = () => {
    return `${selectedMonth}-${selectedYear.substring(2)}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Electricity System</h1>
              <p className="text-sm text-muted-foreground">View and manage electricity consumption data</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[90px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[90px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jan">January</SelectItem>
                  <SelectItem value="Feb">February</SelectItem>
                  <SelectItem value="Mar">March</SelectItem>
                  <SelectItem value="Apr">April</SelectItem>
                  <SelectItem value="May">May</SelectItem>
                  <SelectItem value="Jun">June</SelectItem>
                  <SelectItem value="Jul">July</SelectItem>
                  <SelectItem value="Aug">August</SelectItem>
                  <SelectItem value="Sep">September</SelectItem>
                  <SelectItem value="Oct">October</SelectItem>
                  <SelectItem value="Nov">November</SelectItem>
                  <SelectItem value="Dec">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleRefresh}
            >
              <BarChart3 className="h-4 w-4" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="facilities" className="text-sm">Facilities</TabsTrigger>
            <TabsTrigger value="types" className="text-sm">Types</TabsTrigger>
            <TabsTrigger value="trends" className="text-sm">Trends</TabsTrigger>
          </TabsList>
          
          <div className="mt-2 text-sm text-muted-foreground">
            Showing: <span className="font-medium text-foreground">{getMonthYearLabel()}</span> electricity data
          </div>

          <TabsContent value="overview" className="mt-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                  <p className="text-center mt-4 text-sm text-muted-foreground">Loading electricity data...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-10">
                  <div className="flex justify-center">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <p className="text-center mt-4 text-sm text-muted-foreground">Error loading electricity data</p>
                  <div className="flex justify-center mt-4">
                    <Button variant="outline" size="sm" onClick={handleRefresh}>Try Again</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ElectricityOverview 
                electricityData={electricityData || []} 
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            )}
          </TabsContent>

          <TabsContent value="facilities" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Facilities Consumption</CardTitle>
                <CardDescription>
                  Electricity consumption breakdown by facility
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : (
                  <p>Facilities data will be shown here</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Consumption by Type</CardTitle>
                <CardDescription>
                  Electricity consumption breakdown by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : (
                  <p>Type breakdown data will be shown here</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>
                  Electricity consumption trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : (
                  <ElectricityConsumptionChart data={electricityData || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ElectricityDashboard;
