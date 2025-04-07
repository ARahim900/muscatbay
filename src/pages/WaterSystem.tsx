
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useAirtableData from '@/hooks/useAirtableData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Droplets, FileDown, Loader2, AlertTriangle, RefreshCw, AreaChart, PieChart, BarChart2 } from 'lucide-react';
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
import WaterDataRefresh from '@/components/water/WaterDataRefresh';
import { WaterThemeProvider } from '@/components/water/WaterTheme';

const WaterSystem = () => {
  // State
  const [filters, setFilters] = useState<WaterDashboardFilters>({
    selectedMonth: "all",
    selectedZone: "all",
    selectedType: "all",
    selectedView: "overview"
  });
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
  
  // Fetch data from Airtable
  const { data: waterData, isLoading, error, refetch } = useAirtableData<WaterConsumptionData>(
    WATER_TABLE_ID
  );

  // Handle manual fetch
  const handleManualFetch = async () => {
    setIsManualLoading(true);
    try {
      await fetchTableData(WATER_TABLE_ID, {
        maxRecords: 1
      });
      await refetch();
      setLastUpdated(new Date());
      toast.success('Water data refreshed successfully');
    } catch (err) {
      console.error('Manual fetch failed:', err);
      toast.error(`Failed to refresh data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsManualLoading(false);
    }
  };
  
  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-4 text-blue-500 animate-spin" />
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
        <motion.div 
          className="container mx-auto p-4"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          <Card className="mb-6 border-red-200">
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
        </motion.div>
      </Layout>
    );
  }
  
  // Handle empty data
  if (!waterData || waterData.length === 0) {
    return (
      <Layout>
        <motion.div 
          className="container mx-auto p-4"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          <Card className="mb-6 border-amber-200">
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
        </motion.div>
      </Layout>
    );
  }
  
  // Transform and prepare data
  const transformedData = transformWaterData(waterData);
  
  // Get available filters
  const availableMonths = getAvailableMonths(transformedData);
  const zones = getZones(transformedData);
  const types = getTypes(transformedData);
  
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
    // Create CSV content
    const headers = ["Meter Label", "Zone", "Type", "Level", `${filters.selectedMonth} (m³)`, "Parent Meter"];
    const rows = filteredData.map(record => [
      record['Meter Label'] || '-',
      record.Zone || '-',
      record.Type || '-',
      record.Label || '-',
      getReadingValue(record, filters.selectedMonth) || '-',
      record['Parent Meter'] || '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `water-consumption-${filters.selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Data exported successfully");
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
    <WaterThemeProvider>
      <Layout>
        <motion.div 
          className="container mx-auto p-4"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
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
              
              <div className="flex flex-wrap items-center gap-3">
                <Select value={filters.selectedMonth} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-[160px]">
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
                  <SelectTrigger className="w-[160px]">
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
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleExportData}
                  title="Export Data"
                >
                  <FileDown className="h-4 w-4" />
                </Button>
                
                <WaterDataRefresh 
                  onRefresh={handleManualFetch}
                  lastUpdated={lastUpdated}
                />
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs 
              value={filters.selectedView} 
              onValueChange={handleTabChange}
              className="space-y-6"
            >
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="zones" className="flex items-center gap-2">
                  <AreaChart className="h-4 w-4" />
                  <span>Zones</span>
                </TabsTrigger>
                <TabsTrigger value="loss" className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  <span>Loss Analysis</span>
                </TabsTrigger>
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
            <Card className="shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">Water Consumption Details</CardTitle>
                    <CardDescription>
                      Showing {filteredData.length} records {filters.selectedMonth !== 'all' && `for ${filters.selectedMonth}`}
                      {filters.selectedZone !== 'all' && ` in ${filters.selectedZone}`}
                      {filters.selectedType !== 'all' && ` of type ${filters.selectedType}`}
                    </CardDescription>
                  </div>
                  
                  {types.length > 1 && (
                    <Select value={filters.selectedType} onValueChange={handleTypeChange}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filter by Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type === 'all' ? 'All Types' : type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800 text-left text-xs">
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Meter Label</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Zone</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Type</th>
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Level</th>
                        {filters.selectedMonth === 'all' ? (
                          <>
                            <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Jan-25 (m³)</th>
                            <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Feb-25 (m³)</th>
                          </>
                        ) : (
                          <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">{filters.selectedMonth} (m³)</th>
                        )}
                        <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Parent Meter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredData.map((record, index) => (
                        <tr 
                          key={record.id || index}
                          className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{record['Meter Label'] || '-'}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <Badge variant="outline" className="font-normal">
                              {record.Zone || '-'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{record.Type || '-'}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <Badge 
                              variant="outline" 
                              className={`font-normal ${
                                record.Label === 'L1' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                                record.Label === 'L2' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                                record.Label === 'L3' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                                record.Label === 'DC' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' :
                                ''
                              }`}
                            >
                              {record.Label || '-'}
                            </Badge>
                          </td>
                          {filters.selectedMonth === 'all' ? (
                            <>
                              <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-medium">
                                {getReadingValue(record, 'Jan-25') ? getReadingValue(record, 'Jan-25').toLocaleString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-medium">
                                {getReadingValue(record, 'Feb-25') ? getReadingValue(record, 'Feb-25').toLocaleString() : '-'}
                              </td>
                            </>
                          ) : (
                            <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-medium">
                              {getReadingValue(record, filters.selectedMonth) ? 
                                getReadingValue(record, filters.selectedMonth).toLocaleString() : '-'}
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                            {record['Parent Meter'] || '-'}
                          </td>
                        </tr>
                      ))}
                      
                      {filteredData.length === 0 && (
                        <tr>
                          <td 
                            colSpan={filters.selectedMonth === 'all' ? 7 : 6} 
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No records found with the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </Layout>
    </WaterThemeProvider>
  );
};

export default WaterSystem;
