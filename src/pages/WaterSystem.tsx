import React, { useState, useEffect } from 'react';
import useAirtableData from '@/hooks/useAirtableData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Droplets, FileDown, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { toast } from 'sonner';
import { fetchTableData, WATER_TABLE_ID } from '@/services/airtableService';

// Define types for water data
interface WaterConsumptionData {
  id: string;
  Date?: string;
  Month?: string;
  Zone?: string;
  'Consumption (m³)'?: number;
  'Cost (OMR)'?: number;
  'Change %'?: number;
  Type?: string;
  Location?: string;
  Notes?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#66BCFE'];

const WaterSystem = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedZone, setSelectedZone] = useState("all");
  const [isManualLoading, setIsManualLoading] = useState(false);
  
  // Fetch water consumption data from Airtable using the table ID instead of name
  const { data: waterData, isLoading, error, refetch } = useAirtableData<WaterConsumptionData>(
    WATER_TABLE_ID,
    {
      view: 'Grid view',
      sort: [{ field: 'Date', direction: 'desc' }],
    }
  );

  // Manual fetch function with direct table ID check
  const handleManualFetch = async () => {
    setIsManualLoading(true);
    try {
      // Let's verify the table actually exists by trying to fetch it directly
      const data = await fetchTableData(WATER_TABLE_ID, {
        view: 'Grid view',
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
                      <li>Base ID: appwGy1JHL1UYsO2W</li>
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
  
  // Extract available months and zones for filters
  const months = ['all', ...new Set(waterData.map(item => item.Month).filter(Boolean))];
  const zones = ['all', ...new Set(waterData.map(item => item.Zone).filter(Boolean))];
  
  // Filter data based on selections
  const filteredData = waterData.filter(record => {
    const monthMatch = selectedMonth === 'all' || record.Month === selectedMonth;
    const zoneMatch = selectedZone === 'all' || record.Zone === selectedZone;
    return monthMatch && zoneMatch;
  });
  
  // Calculate summary metrics
  const totalConsumption = filteredData.reduce((sum, item) => sum + (item['Consumption (m³)'] || 0), 0);
  const totalCost = filteredData.reduce((sum, item) => sum + (item['Cost (OMR)'] || 0), 0);
  const avgConsumptionPerZone = zones.length > 1 ? totalConsumption / (zones.length - 1) : 0;
  
  // Group data by zone for charts
  const consumptionByZone = zones
    .filter(zone => zone !== 'all')
    .map(zone => {
      const zoneData = waterData.filter(item => item.Zone === zone);
      const consumption = zoneData.reduce((sum, item) => sum + (item['Consumption (m³)'] || 0), 0);
      const cost = zoneData.reduce((sum, item) => sum + (item['Cost (OMR)'] || 0), 0);
      
      return {
        name: zone,
        consumption,
        cost
      };
    }).sort((a, b) => b.consumption - a.consumption);
  
  // Group data by month for trend analysis
  const consumptionByMonth = months
    .filter(month => month !== 'all')
    .map(month => {
      const monthData = waterData.filter(item => item.Month === month);
      const consumption = monthData.reduce((sum, item) => sum + (item['Consumption (m³)'] || 0), 0);
      const cost = monthData.reduce((sum, item) => sum + (item['Cost (OMR)'] || 0), 0);
      
      return {
        month,
        consumption,
        cost
      };
    });
  
  const handleExportData = () => {
    toast.success("Exporting data... This feature will be implemented soon.");
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center">
                <Droplets className="mr-2 h-6 w-6 text-blue-500" />
                Water System Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor water consumption and distribution across Muscat Bay
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month === 'all' ? 'All Months' : month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedZone} onValueChange={setSelectedZone}>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalConsumption.toLocaleString()} m³</div>
                <p className="text-xs text-muted-foreground">
                  {selectedMonth === 'all' ? 'All Time' : selectedMonth}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCost.toLocaleString()} OMR</div>
                <p className="text-xs text-muted-foreground">
                  {selectedMonth === 'all' ? 'All Time' : selectedMonth}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average per Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgConsumptionPerZone.toLocaleString()} m³</div>
                <p className="text-xs text-muted-foreground">
                  {selectedZone === 'all' ? 'All Zones' : selectedZone}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{zones.length - 1}</div>
                <p className="text-xs text-muted-foreground">
                  Distribution Zones
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="zones">Zones</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Water Consumption Overview</CardTitle>
                  <CardDescription>
                    Monthly water consumption across all zones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={consumptionByMonth}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                        />
                        <YAxis yAxisId="left" label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'OMR', angle: 90, position: 'insideRight' }} />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                                  <p className="font-medium">{label}</p>
                                  <p className="text-sm">
                                    Consumption: <span className="font-medium">{payload[0].value?.toLocaleString()} m³</span>
                                  </p>
                                  <p className="text-sm">
                                    Cost: <span className="font-medium">{payload[1].value?.toLocaleString()} OMR</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="consumption" 
                          name="Water Consumption"
                          stroke="#66BCFE" 
                          fill="#66BCFE" 
                          fillOpacity={0.3} 
                          yAxisId="left"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cost" 
                          name="Cost" 
                          stroke="#FF8042" 
                          fill="#FF8042" 
                          fillOpacity={0.3} 
                          yAxisId="right"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="zones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Consumption by Zone</CardTitle>
                  <CardDescription>
                    Distribution of water consumption across different zones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={consumptionByZone}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="consumption"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          >
                            {consumptionByZone.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, props) => [`${value.toLocaleString()} m³`, props.payload.name]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={consumptionByZone}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip
                            formatter={(value, name) => {
                              return [
                                name === "consumption" 
                                  ? `${value.toLocaleString()} m³` 
                                  : `${value.toLocaleString()} OMR`, 
                                name === "consumption" ? "Consumption" : "Cost"
                              ];
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="consumption" 
                            name="Consumption (m³)" 
                            fill="#66BCFE" 
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Water Consumption Trends</CardTitle>
                  <CardDescription>
                    Monthly trends and comparisons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={consumptionByMonth}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => {
                            return [
                              name === "consumption" 
                                ? `${value.toLocaleString()} m³` 
                                : `${value.toLocaleString()} OMR`, 
                              name === "consumption" ? "Consumption" : "Cost"
                            ];
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="consumption" 
                          name="Consumption (m³)" 
                          fill="#66BCFE" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <Card>
            <CardHeader>
              <CardTitle>Detailed Water Consumption Data</CardTitle>
              <CardDescription>
                Showing {filteredData.length} records {selectedMonth !== 'all' && `for ${selectedMonth}`}
                {selectedZone !== 'all' && ` in ${selectedZone}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted text-left text-muted-foreground text-xs">
                      <th className="p-2 whitespace-nowrap">Month</th>
                      <th className="p-2 whitespace-nowrap">Zone</th>
                      <th className="p-2 whitespace-nowrap">Location</th>
                      <th className="p-2 whitespace-nowrap text-right">Consumption (m³)</th>
                      <th className="p-2 whitespace-nowrap text-right">Cost (OMR)</th>
                      <th className="p-2 whitespace-nowrap text-right">Change %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((record, index) => (
                      <tr 
                        key={record.id || index}
                        className="border-b border-gray-200 hover:bg-muted/50"
                      >
                        <td className="p-2 whitespace-nowrap">{record.Month || '-'}</td>
                        <td className="p-2 whitespace-nowrap">
                          <Badge variant="outline" className="font-normal">
                            {record.Zone || '-'}
                          </Badge>
                        </td>
                        <td className="p-2 whitespace-nowrap">{record.Location || '-'}</td>
                        <td className="p-2 whitespace-nowrap text-right">
                          {record['Consumption (m³)']?.toLocaleString() || '-'}
                        </td>
                        <td className="p-2 whitespace-nowrap text-right">
                          {record['Cost (OMR)']?.toLocaleString() || '-'}
                        </td>
                        <td className="p-2 whitespace-nowrap text-right">
                          <span 
                            className={
                              record['Change %'] && record['Change %'] > 0 
                                ? 'text-red-500' 
                                : record['Change %'] && record['Change %'] < 0 
                                ? 'text-green-500' 
                                : ''
                            }
                          >
                            {record['Change %'] 
                              ? `${record['Change %'] > 0 ? '+' : ''}${record['Change %'].toFixed(1)}%` 
                              : '-'}
                          </span>
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
