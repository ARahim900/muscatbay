import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Lightbulb, RefreshCw, FileDown, Settings } from 'lucide-react';
import { ElectricityDashboardFilters } from '@/types/electricitySystem';
import useElectricityData from '@/hooks/useElectricityData';
import { ELECTRICITY_TABLE_ID } from '@/services/api/electricityService';
import { toast } from 'sonner';
import { airtableApi } from '@/services/api/apiClient';
import { electricityData as fallbackData } from '@/data/electricityData';
import ElectricityOverview from './ElectricityOverview';
import { ElectricityRecord } from '@/types/electricity';

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
  } = useElectricityData<ElectricityRecord>(ELECTRICITY_TABLE_ID, {
    useFallback: true,
    initialData: fallbackData
  });

  // Available filter options
  const [availableMonths, setAvailableMonths] = useState<string[]>(['all']);
  const [availableZones, setAvailableZones] = useState<string[]>(['all']);
  const [availableTypes, setAvailableTypes] = useState<string[]>(['all']);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

  // Check API key status
  useEffect(() => {
    const checkApiKey = () => {
      if (!airtableApi.isKeyLoaded()) {
        setApiKeyMissing(true);
      }
    };
    
    // Check after a slight delay to allow for loading
    const timer = setTimeout(checkApiKey, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Extract available filter options from data
  useEffect(() => {
    if (electricityData && electricityData.length > 0) {
      // Extract months from data
      const months = new Set<string>();
      months.add('all');
      
      electricityData.forEach(record => {
        Object.keys(record.consumption).forEach(key => {
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
        if (record.zone) {
          zones.add(record.zone);
        }
      });
      
      setAvailableZones(Array.from(zones));
      
      // Extract types
      const types = new Set<string>();
      types.add('all');
      
      electricityData.forEach(record => {
        if (record.type) {
          types.add(record.type);
        }
      });
      
      setAvailableTypes(Array.from(types));
    }
  }, [electricityData]);

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (!electricityData) return [];
    
    return electricityData.filter(record => {
      const matchesZone = filters.selectedZone === 'all' || record.zone === filters.selectedZone;
      const matchesType = filters.selectedType === 'all' || record.type === filters.selectedType;
      return matchesZone && matchesType;
    });
  }, [electricityData, filters.selectedZone, filters.selectedType]);

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
    if (!filteredData || filteredData.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    try {
      // Create CSV header 
      const headers = ['id', 'name', 'type', 'zone', 'meterAccountNo', ...Object.keys(filteredData[0].consumption)].join(',');
      
      // Generate CSV rows
      const csvRows = filteredData.map(record => {
        const baseValues = [
          record.id || '',
          record.name || '',
          record.type || '',
          record.zone || '',
          record.meterAccountNo || ''
        ];
        
        const consumptionValues = Object.values(record.consumption).map(value => value || 0);
        
        return [...baseValues, ...consumptionValues].map(value => {
          // Handle strings with commas by wrapping in quotes
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',');
      });
      
      // Combine header and rows
      const csvContent = [headers, ...csvRows].join('\n');
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `electricity-data-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // API key warning display
  if (apiKeyMissing) {
    return (
      <Card className="mb-6 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6 text-amber-500" />
            API Key Missing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 text-amber-800 p-4 rounded-md">
            <p className="font-medium">No Airtable API key has been configured.</p>
            <p className="mt-2">To fetch live data, you need to add an API key to your Supabase database.</p>
            <ol className="mt-4 list-decimal pl-5 space-y-2">
              <li>Go to the Supabase admin panel</li>
              <li>Insert a record in the 'api_keys' table with:
                <ul className="list-disc pl-5 mt-1">
                  <li>service: "airtable"</li>
                  <li>key: "your_airtable_api_key"</li>
                  <li>is_active: true</li>
                </ul>
              </li>
              <li>Return to this page and click "Try Again"</li>
            </ol>
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
            <p className="mt-2">This could be due to:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>Missing or invalid API key</li>
              <li>Network connectivity issues</li>
              <li>Airtable API rate limiting</li>
            </ul>
            <p className="mt-2">Using fallback data for now. Check your connection settings and try again.</p>
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
          {electricityData && electricityData.length > 0 ? (
            <ElectricityOverview 
              electricityData={filteredData} 
              selectedMonth={filters.selectedMonth}
              selectedYear="2024-2025"
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
              <p className="text-muted-foreground">No data available. Please check your data source.</p>
            </div>
          )}
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
            {filteredData.length} meter records found in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            <p>Filters: {filters.selectedMonth === 'all' ? 'All Periods' : filters.selectedMonth}, 
               {filters.selectedZone === 'all' ? ' All Zones' : ` ${filters.selectedZone}`}, 
               {filters.selectedType === 'all' ? ' All Types' : ` ${filters.selectedType}`}</p>
            {!airtableApi.isKeyLoaded() && (
              <div className="mt-4 text-amber-600 bg-amber-50 p-3 rounded-md">
                <p className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Using local fallback data. Add API key to fetch live data.</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricityDashboard;
