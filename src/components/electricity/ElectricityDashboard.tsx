
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Lightbulb, RefreshCw, FileDown } from 'lucide-react';
import { ElectricityDashboardFilters } from '@/types/electricitySystem';
import useElectricityData from '@/hooks/useElectricityData';
import { ELECTRICITY_TABLE_ID } from '@/services/api/electricityService';
import { toast } from 'sonner';

const ElectricityDashboard: React.FC = () => {
  // Dashboard state
  const [filters, setFilters] = useState<ElectricityDashboardFilters>({
    selectedMonth: "all",
    selectedZone: "all",
    selectedType: "all",
    selectedView: "overview"
  });

  // Fetch electricity data
  const {
    data: electricityData,
    isLoading,
    error,
    refetch
  } = useElectricityData(ELECTRICITY_TABLE_ID, {
    useFallback: true
  });

  // Available filter options
  const [availableMonths, setAvailableMonths] = useState<string[]>(['all']);
  const [availableZones, setAvailableZones] = useState<string[]>(['all']);
  const [availableTypes, setAvailableTypes] = useState<string[]>(['all']);

  // Extract available filter options from data
  useEffect(() => {
    if (electricityData && electricityData.length > 0) {
      // Extract months from data
      const months = new Set<string>();
      months.add('all');
      
      electricityData.forEach(record => {
        Object.keys(record).forEach(key => {
          if (key.includes('-')) {
            months.add(key);
          }
        });
      });
      
      setAvailableMonths(Array.from(months));
      
      // Extract zones
      const zones = new Set<string>();
      zones.add('all');
      
      electricityData.forEach(record => {
        if (record.Zone) {
          zones.add(record.Zone);
        }
      });
      
      setAvailableZones(Array.from(zones));
      
      // Extract types
      const types = new Set<string>();
      types.add('all');
      
      electricityData.forEach(record => {
        if (record.Type) {
          types.add(record.Type);
        }
      });
      
      setAvailableTypes(Array.from(types));
    }
  }, [electricityData]);

  // Manual refresh handler
  const handleRefresh = async () => {
    toast.info('Refreshing electricity data...');
    try {
      await refetch();
      toast.success('Electricity data refreshed successfully');
    } catch (err) {
      toast.error(`Failed to refresh data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Export data as CSV
  const handleExport = () => {
    toast.info('This feature is coming soon...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 mx-auto mb-4 text-purple-500 animate-spin" />
          <p className="text-lg text-muted-foreground">Loading electricity system data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-6 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6 text-amber-500" />
            Error Loading Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            <p className="font-medium">Failed to load electricity data: {error.message}</p>
            <p className="mt-2">Please check your connection settings and try again.</p>
            <div className="mt-4">
              <Button variant="outline" className="text-blue-600" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and action buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center text-violet-800 dark:text-violet-300">
            <Lightbulb className="mr-2 h-7 w-7 text-amber-500" />
            Electricity Consumption Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze electricity usage patterns across Muscat Bay
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-white" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="bg-white" onClick={handleExport}>
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
          <Select
            value={filters.selectedMonth}
            onValueChange={(value) => setFilters({...filters, selectedMonth: value})}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {month === 'all' ? 'All Periods' : month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
          <Select
            value={filters.selectedZone}
            onValueChange={(value) => setFilters({...filters, selectedZone: value})}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Zone" />
            </SelectTrigger>
            <SelectContent>
              {availableZones.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone === 'all' ? 'All Zones' : zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
          <Select
            value={filters.selectedType}
            onValueChange={(value) => setFilters({...filters, selectedType: value})}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Main tabs navigation */}
      <Tabs 
        defaultValue="overview" 
        value={filters.selectedView}
        onValueChange={(value) => setFilters({...filters, selectedView: value})}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Electricity Overview</h2>
            <p>Overview content will be displayed here.</p>
            <p className="text-muted-foreground">This section is under development.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="zones" className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Zone Analysis</h2>
            <p>Zone analysis content will be displayed here.</p>
            <p className="text-muted-foreground">This section is under development.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="types" className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Type Analysis</h2>
            <p>Type analysis content will be displayed here.</p>
            <p className="text-muted-foreground">This section is under development.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Detailed Analysis</h2>
            <p>Detailed electricity consumption analysis will be displayed here.</p>
            <p className="text-muted-foreground">This section is under development.</p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Data summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
          <CardDescription>
            {electricityData.length} meter records found in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            <p>Filters: {filters.selectedMonth === 'all' ? 'All Periods' : filters.selectedMonth}, 
               {filters.selectedZone === 'all' ? ' All Zones' : ` ${filters.selectedZone}`}, 
               {filters.selectedType === 'all' ? ' All Types' : ` ${filters.selectedType}`}</p>
            <p className="mt-2">The dashboard is currently in development phase. More features will be added soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricityDashboard;
