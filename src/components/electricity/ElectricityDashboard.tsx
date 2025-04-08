
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, FileText, BarChart3, Zap } from 'lucide-react';
import { toast } from 'sonner';
import ElectricityOverview from './ElectricityOverview';
import ElectricityFacilitiesTab from './ElectricityFacilitiesTab';
import ElectricityTypesTab from './ElectricityTypesTab';
import ElectricityTrendsTab from './ElectricityTrendsTab';
import { mockElectricityData } from '@/data/electricityMockData';
import { getAvailableMonths, getAvailableYears } from '@/utils/electricityDataUtils';
import { fetchElectricityData } from '@/services/electricityService';

const ElectricityDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedMonth, setSelectedMonth] = useState<string>('Feb');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [useMockData, setUseMockData] = useState<boolean>(false);
  const [electricityData, setElectricityData] = useState(mockElectricityData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const availableMonths = getAvailableMonths();
  const availableYears = getAvailableYears();

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (useMockData) {
        setElectricityData(mockElectricityData);
        toast.info('Using demo data for demonstration purposes');
      } else {
        const data = await fetchElectricityData();
        setElectricityData(data);
        
        // If we got back mock data, that means the real data fetch failed
        if (data === mockElectricityData) {
          setUseMockData(true);
        }
      }
    } catch (err) {
      console.error('Error loading electricity data:', err);
      setError('Failed to load electricity data. Using demo data instead.');
      setUseMockData(true);
      setElectricityData(mockElectricityData);
      toast.error('Error loading data. Using demo data instead.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [useMockData]);

  const handleExport = () => {
    toast.info('Exporting electricity data...');
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleToggleMockData = () => {
    setUseMockData(!useMockData);
  };

  const getMonthYearLabel = () => {
    const monthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    return `${monthLabel} ${selectedYear}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
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
                  {availableYears.map(year => (
                    <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(month => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
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

            <Button
              variant={useMockData ? "default" : "outline"}
              size="sm"
              className="gap-1"
              onClick={handleToggleMockData}
            >
              <FileText className="h-4 w-4" />
              {useMockData ? "Using Demo Data" : "Use Demo Data"}
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
            {useMockData && <span className="ml-2 text-amber-600 font-medium">(Demo Data)</span>}
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
                  <p className="text-center text-sm text-red-500">{error}</p>
                </CardContent>
              </Card>
            ) : (
              <ElectricityOverview 
                electricityData={electricityData} 
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            )}
          </TabsContent>

          <TabsContent value="facilities" className="mt-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                  <p className="text-center mt-4 text-sm text-muted-foreground">Loading facilities data...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-10">
                  <p className="text-center text-sm text-red-500">{error}</p>
                </CardContent>
              </Card>
            ) : (
              <ElectricityFacilitiesTab
                electricityData={electricityData}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            )}
          </TabsContent>

          <TabsContent value="types" className="mt-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                  <p className="text-center mt-4 text-sm text-muted-foreground">Loading type data...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-10">
                  <p className="text-center text-sm text-red-500">{error}</p>
                </CardContent>
              </Card>
            ) : (
              <ElectricityTypesTab
                electricityData={electricityData}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            )}
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                  <p className="text-center mt-4 text-sm text-muted-foreground">Loading trends data...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-10">
                  <p className="text-center text-sm text-red-500">{error}</p>
                </CardContent>
              </Card>
            ) : (
              <ElectricityTrendsTab
                electricityData={electricityData}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ElectricityDashboard;
