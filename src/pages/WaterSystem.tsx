
import React, { useState, useEffect } from 'react';
import useAirtableData from '@/hooks/useAirtableData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Droplets, FileDown, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import { fetchTableData, WATER_TABLE_ID, AIRTABLE_BASE_ID } from '@/services/airtableService';
import { WaterConsumptionData, WaterDashboardFilters } from '@/types/waterSystem';
import { 
  transformWaterData, 
  getAvailableMonths, 
  getZones,
  getTypes,
  filterWaterData,
  calculateLevelMetrics,
  calculateZoneMetrics,
  calculateTypeConsumption,
  calculateMonthlyTrends,
  getReadingValue
} from '@/utils/waterSystemUtils';

// Import components
import WaterOverview from '@/components/water/WaterOverview';
import WaterZones from '@/components/water/WaterZones';
import WaterLossAnalysis from '@/components/water/WaterLossAnalysis';

const WaterSystem = () => {
  // State
  const [filters, setFilters] = useState<WaterDashboardFilters>({
    selectedMonth: "all",
    selectedZone: "all",
    selectedType: "all",
    selectedView: "overview"
  });
  const [isManualLoading, setIsManualLoading] = useState(false);
  
  // Fetch data from Airtable
  const { data: waterData, isLoading, error, refetch } = useAirtableData<WaterConsumptionData>(
    WATER_TABLE_ID
  );

  // Handle manual fetch
  const handleManualFetch = async () => {
    setIsManualLoading(true);
    try {
      const data = await fetchTableData(WATER_TABLE_ID, {
        maxRecords: 1
      });
      console.log('Manual fetch successful:', data);
      toast.success('Table connection verified. Refreshing data...');
      refetch();
    } catch (err) {
      console.error('Manual fetch failed:', err);
      toast.error(`Manual fetch failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsManualLoading(false);
    }
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-lg text-muted-foreground">Loading water system data...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-6 w-6 text-amber-500" />
                Error Loading Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                <p className="font-medium">Failed to load water data: {error.message}</p>
                <p className="mt-2">Please check your Airtable connection settings and table configuration.</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-sm text-red-700 mb-1">Airtable Configuration:</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>API Key: The API key format appears valid</li>
                      <li>Base ID: {AIRTABLE_BASE_ID}</li>
                      <li>Table ID: {WATER_TABLE_ID}</li>
                      <li>API Key Permissions: Verify your API key has access to this base</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      className="text-blue-600"
                      onClick={() => refetch()}
                      disabled={isManualLoading}
                    >
                      {isManualLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Try Again
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-amber-600"
                      onClick={handleManualFetch}
                      disabled={isManualLoading}
                    >
                      {isManualLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking table...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Check Table Connection
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Handle empty data
  if (!waterData || waterData.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Droplets className="mr-2 h-6 w-6 text-blue-500" />
                Water System Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 text-amber-800 p-4 rounded-md">
                <p className="font-medium">No water consumption data available.</p>
                <p className="mt-2">
                  Make sure your Airtable table contains records and has the correct structure.
                </p>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="text-blue-600"
                    onClick={() => refetch()}
                  >
                    Refresh Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Transform and prepare data
  const transformedData = transformWaterData(waterData);
  
  // Get available filters
  const availableMonths = getAvailableMonths(transformedData);
  const zones = getZones(transformedData);
  const types = getTypes ? getTypes(transformedData) : ['all'];
  
  // Filter data based on selections
  const filteredData = filterWaterData(
    transformedData, 
    filters.selectedMonth, 
    filters.selectedZone,
    filters.selectedType
  );
  
  // Calculate metrics
  const levelMetrics = calculateLevelMetrics(transformedData, filters.selectedMonth);
  const zoneMetrics = calculateZoneMetrics(transformedData, filters.selectedMonth);
  const typeConsumption = calculateTypeConsumption(transformedData, filters.selectedMonth);
  const monthlyTrends = calculateMonthlyTrends(transformedData, availableMonths);
  
  // Handle export data
  const handleExportData = () => {
    toast.success("Exporting data... This feature will be implemented soon.");
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      selectedView: value
    }));
  };
  
  // Handle filter changes
  const handleMonthChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      selectedMonth: value
    }));
  };
  
  const handleZoneChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      selectedZone: value
    }));
  };
  
  const handleTypeChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      selectedType: value
    }));
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center">
                <Droplets className="mr-2 h-6 w-6 text-blue-500" />
                Water System Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor water consumption, distribution, and losses across Muscat Bay
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filters.selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month === 'all' ? 'All Months' : month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filters.selectedZone} onValueChange={handleZoneChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone === 'all' ? 'All Zones' : zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={handleExportData}>
                <FileDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={filters.selectedView} onValueChange={handleTabChange}>
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="zones">Zones</TabsTrigger>
              <TabsTrigger value="loss">Loss Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <WaterOverview 
                levelMetrics={levelMetrics}
                zoneMetrics={zoneMetrics}
                typeConsumption={typeConsumption}
                monthlyTrends={monthlyTrends}
                selectedMonth={filters.selectedMonth}
              />
            </TabsContent>
            
            <TabsContent value="zones" className="space-y-6">
              <WaterZones 
                zoneMetrics={zoneMetrics}
                waterData={transformedData}
                selectedMonth={filters.selectedMonth}
                selectedZone={filters.selectedZone || zones[1] || ''}
                onSelectZone={handleZoneChange}
              />
            </TabsContent>
            
            <TabsContent value="loss" className="space-y-6">
              <WaterLossAnalysis 
                zoneMetrics={zoneMetrics}
                levelMetrics={levelMetrics}
                selectedMonth={filters.selectedMonth}
              />
            </TabsContent>
          </Tabs>
          
          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Water Consumption Data</CardTitle>
              <CardDescription>
                Showing {filteredData.length} records {filters.selectedMonth !== 'all' && `for ${filters.selectedMonth}`}
                {filters.selectedZone !== 'all' && ` in ${filters.selectedZone}`}
                {filters.selectedType !== 'all' && ` of type ${filters.selectedType}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted text-left text-muted-foreground text-xs">
                      <th className="p-2 whitespace-nowrap">Meter Label</th>
                      <th className="p-2 whitespace-nowrap">Zone</th>
                      <th className="p-2 whitespace-nowrap">Type</th>
                      <th className="p-2 whitespace-nowrap">Level</th>
                      {filters.selectedMonth === 'all' ? (
                        <>
                          <th className="p-2 whitespace-nowrap text-right">Jan-25 (m³)</th>
                          <th className="p-2 whitespace-nowrap text-right">Feb-25 (m³)</th>
                        </>
                      ) : (
                        <th className="p-2 whitespace-nowrap text-right">{filters.selectedMonth} (m³)</th>
                      )}
                      <th className="p-2 whitespace-nowrap">Parent Meter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((record, index) => (
                      <tr 
                        key={record.id || index}
                        className="border-b border-gray-200 hover:bg-muted/50"
                      >
                        <td className="p-2 whitespace-nowrap">{record['Meter Label'] || '-'}</td>
                        <td className="p-2 whitespace-nowrap">
                          <Badge variant="outline" className="font-normal">
                            {record.Zone || '-'}
                          </Badge>
                        </td>
                        <td className="p-2 whitespace-nowrap">{record.Type || '-'}</td>
                        <td className="p-2 whitespace-nowrap">
                          <Badge 
                            variant="outline" 
                            className={`font-normal ${
                              record.Label === 'L1' ? 'bg-purple-50 text-purple-700' :
                              record.Label === 'L2' ? 'bg-blue-50 text-blue-700' :
                              record.Label === 'L3' ? 'bg-green-50 text-green-700' :
                              record.Label === 'DC' ? 'bg-amber-50 text-amber-700' :
                              ''
                            }`}
                          >
                            {record.Label || '-'}
                          </Badge>
                        </td>
                        {filters.selectedMonth === 'all' ? (
                          <>
                            <td className="p-2 whitespace-nowrap text-right">
                              {getReadingValue(record, 'Jan-25') || '-'}
                            </td>
                            <td className="p-2 whitespace-nowrap text-right">
                              {getReadingValue(record, 'Feb-25') || '-'}
                            </td>
                          </>
                        ) : (
                          <td className="p-2 whitespace-nowrap text-right">
                            {getReadingValue(record, filters.selectedMonth) || '-'}
                          </td>
                        )}
                        <td className="p-2 whitespace-nowrap">
                          {record['Parent Meter'] || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WaterSystem;
