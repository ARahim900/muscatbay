import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, 
  AreaChart, Area 
} from 'recharts';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Filter, Calendar, DropletIcon, AlertTriangle, Activity, Home, Building, Droplets } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useWaterSystem } from '@/hooks/useWaterSystem';
import WaterFilters from '@/components/water/WaterFilters';
import { WaterFilter } from '@/types/water';

const WaterDashboard = () => {
  const { 
    waterData, 
    loading, 
    error, 
    filters, 
    availableZones, 
    availableTypes,
    updateFilters 
  } = useWaterSystem();
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // Color schemes
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
    '#82CA9D', '#FF6B6B', '#6A7FDB', '#61DAFB', '#FF9AA2'
  ];
  
  const LOSS_COLORS = {
    loss: '#FF6B6B',
    consumption: '#0088FE'
  };
  
  // Data transformations for charts
  const prepareZoneData = () => {
    if (!waterData?.zones) return [];
    
    return Object.entries(waterData.zones).map(([zone, data]) => ({
      name: zone,
      consumption: data.consumption,
      loss: data.loss
    }));
  };
  
  const prepareTypeData = () => {
    if (!waterData?.types) return [];
    
    return Object.entries(waterData.types)
      .filter(([type]) => type !== 'Main BULK' && type !== 'Zone Bulk')
      .map(([type, value]) => ({
        name: type,
        value
      }));
  };
  
  const prepareLossAnalysisData = () => {
    if (!waterData?.losses) return [];
    
    return [
      { name: 'Consumption', value: waterData.levels.L3 },
      { name: 'System Loss', value: waterData.losses.systemLoss }
    ];
  };
  
  const prepareMonthlyTrendData = () => {
    if (!waterData?.monthlyTrends) return [];
    
    return Object.entries(waterData.monthlyTrends).map(([month, data]) => ({
      name: month.replace('_', '-'),
      consumption: data.consumption,
      loss: data.loss
    }));
  };
  
  const handleFilterChange = (newFilter: Partial<WaterFilter>) => {
    updateFilters(newFilter);
  };

  const handleResetFilters = () => {
    updateFilters({
      month: 'feb_25',
      zone: 'all',
      type: 'all'
    });
  };
  
  useEffect(() => {
    document.title = 'Water Dashboard | Muscat Bay Asset Manager';
  }, []);
  
  const formatNumber = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  // Safely format percentages to avoid NaN or infinity
  const calculatePercentage = (part: number, total: number) => {
    if (!total) return 0;
    return (part / total * 100).toFixed(1);
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Water Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Water Dashboard</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading water data</p>
            <p>{error}</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Calculate total and percentages
  const totalConsumption = waterData?.levels.L1 || 0;
  const totalLoss = (waterData?.losses?.systemLoss || 0);
  const lossPercentage = calculatePercentage(totalLoss, totalConsumption);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Droplets className="h-8 w-8 mr-3 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Water Management Dashboard</h1>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  2024-2025
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          {/* Filter Bar */}
          <WaterFilters 
            filters={filters}
            availableZones={availableZones}
            availableTypes={availableTypes}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
          
          {/* Tabs */}
          <Tabs 
            defaultValue="overview" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-6"
          >
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="zones">Zones</TabsTrigger>
              <TabsTrigger value="types">Types</TabsTrigger>
              <TabsTrigger value="losses">Losses</TabsTrigger>
            </TabsList>
            
            <div className="mt-2 text-sm text-gray-500">
              Showing: {filters.zone === 'all' ? 'All Zones' : filters.zone} | 
              {filters.type === 'all' ? ' All Types' : ` ${filters.type}`}
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Consumption</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(totalConsumption)} m³</div>
                    <p className="text-xs text-gray-500 mt-1">From main bulk meter</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">System Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(totalLoss)} m³</div>
                    <p className="text-xs text-gray-500 mt-1">{lossPercentage}% of total</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Financial Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(waterData?.losses?.financialImpact || 0)} OMR</div>
                    <p className="text-xs text-gray-500 mt-1">Cost of water loss</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Zones Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Object.keys(waterData?.zones || {}).length}</div>
                    <p className="text-xs text-gray-500 mt-1">Active zones</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Monthly Consumption Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={prepareMonthlyTrendData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [formatNumber(Number(value)) + ' m³', 'Volume']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="consumption" 
                            name="Consumption" 
                            stroke="#0088FE" 
                            strokeWidth={2}
                            activeDot={{ r: 8 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="loss" 
                            name="Loss" 
                            stroke="#FF6B6B" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Consumption vs Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareLossAnalysisData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          >
                            {prepareLossAnalysisData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? LOSS_COLORS.consumption : LOSS_COLORS.loss} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [formatNumber(Number(value)) + ' m³', 'Volume']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-white mb-8">
                <CardHeader>
                  <CardTitle>Water Consumption by Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareZoneData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [formatNumber(Number(value)) + ' m³', 'Volume']}
                        />
                        <Legend />
                        <Bar dataKey="consumption" name="Consumption" fill="#0088FE" />
                        <Bar dataKey="loss" name="Loss" fill="#FF6B6B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Zones Tab */}
            <TabsContent value="zones" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Highest Consumption Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prepareZoneData().length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {prepareZoneData().sort((a, b) => b.consumption - a.consumption)[0]?.name || 'N/A'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNumber(prepareZoneData().sort((a, b) => b.consumption - a.consumption)[0]?.consumption || 0)} m³
                        </p>
                      </>
                    ) : (
                      <div className="text-lg text-gray-400">No data available</div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Highest Loss Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prepareZoneData().length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {prepareZoneData().sort((a, b) => b.loss - a.loss)[0]?.name || 'N/A'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNumber(prepareZoneData().sort((a, b) => b.loss - a.loss)[0]?.loss || 0)} m³
                        </p>
                      </>
                    ) : (
                      <div className="text-lg text-gray-400">No data available</div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Lowest Consumption Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prepareZoneData().length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {prepareZoneData().sort((a, b) => a.consumption - b.consumption)[0]?.name || 'N/A'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNumber(prepareZoneData().sort((a, b) => a.consumption - b.consumption)[0]?.consumption || 0)} m³
                        </p>
                      </>
                    ) : (
                      <div className="text-lg text-gray-400">No data available</div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Average Zone Consumption</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prepareZoneData().length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {formatNumber(
                            prepareZoneData().reduce((sum, zone) => sum + zone.consumption, 0) / 
                            prepareZoneData().length
                          )} m³
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Per zone</p>
                      </>
                    ) : (
                      <div className="text-lg text-gray-400">No data available</div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-white mb-8">
                <CardHeader>
                  <CardTitle>Zone Consumption Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareZoneData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip 
                          formatter={(value) => [formatNumber(Number(value)) + ' m³', 'Volume']}
                        />
                        <Legend />
                        <Bar dataKey="consumption" name="Consumption" fill="#0088FE" />
                        <Bar dataKey="loss" name="Loss" fill="#FF6B6B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white mb-8">
                <CardHeader>
                  <CardTitle>Zone Loss Percentage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareZoneData().map(zone => ({
                          name: zone.name,
                          lossPercentage: zone.consumption ? (zone.loss / zone.consumption * 100) : 0
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Loss %', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value) => {
                            // Convert value to string before formatting
                            const stringValue = String(value); 
                            return [`${parseFloat(stringValue).toFixed(1)}%`, 'Loss Percentage']
                          }} 
                        />
                        <Bar dataKey="lossPercentage" name="Loss Percentage">
                          {prepareZoneData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.consumption && (entry.loss / entry.consumption * 100) > 15 
                                  ? '#FF6B6B' 
                                  : '#FFBB28'
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Types Tab */}
            <TabsContent value="types" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Highest Consumption Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prepareTypeData().length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {prepareTypeData().sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNumber(prepareTypeData().sort((a, b) => b.value - a.value)[0]?.value || 0)} m³
                        </p>
                      </>
                    ) : (
                      <div className="text-lg text-gray-400">No data available</div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Lowest Consumption Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prepareTypeData().length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {prepareTypeData().sort((a, b) => a.value - b.value)[0]?.name || 'N/A'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNumber(prepareTypeData().sort((a, b) => a.value - b.value)[0]?.value || 0)} m³
                        </p>
                      </>
                    ) : (
                      <div className="text-lg text-gray-400">No data available</div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Type Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{prepareTypeData().length}</div>
                    <p className="text-xs text-gray-500 mt-1">Unique consumption types</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Average Type Consumption</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prepareTypeData().length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {formatNumber(
                            prepareTypeData().reduce((sum, type) => sum + type.value, 0) / 
                            prepareTypeData().length
                          )} m³
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Per type</p>
                      </>
                    ) : (
                      <div className="text-lg text-gray-400">No data available</div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Consumption by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareTypeData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          >
                            {prepareTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [formatNumber(Number(value)) + ' m³', 'Volume']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Type Distribution Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareTypeData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [formatNumber(Number(value)) + ' m³', 'Volume']}
                          />
                          <Bar dataKey="value" name="Consumption">
                            {prepareTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Losses Tab */}
            <TabsContent value="losses" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total System Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(waterData?.losses?.systemLoss || 0)} m³</div>
                    <p className="text-xs text-gray-500 mt-1">{lossPercentage}% of total flow</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Financial Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(waterData?.losses?.financialImpact || 0)} OMR</div>
                    <p className="text-xs text-gray-500 mt-1">Cost of water loss</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Highest Loss Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prepareZoneData().length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {prepareZoneData().sort((a, b) => b.loss - a.loss)[0]?.name || 'N/A'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNumber(prepareZoneData().sort((a, b) => b.loss - a.loss)[0]?.loss || 0)} m³
                        </p>
                      </>
                    ) : (
                      <div className="text-lg text-gray-400">No data available</div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">System Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(100 - parseFloat(lossPercentage)).toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Water delivery efficiency</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Loss Percentage by Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareZoneData().map(zone => ({
                            name: zone.name,
                            lossPercentage: zone.consumption ? (zone.loss / zone.consumption * 100) : 0
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis label={{ value: 'Loss %', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${parseFloat(value.toString())}%`, 'Loss Percentage']} />
                          <Bar dataKey="lossPercentage" name="Loss Percentage">
                            {prepareZoneData().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={
                                  entry.consumption && (entry.loss / entry.consumption * 100) > 15 
                                    ? '#FF6B6B' 
                                    : '#FFBB28'
                                } 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Monthly Loss Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={prepareMonthlyTrendData()}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [formatNumber(Number(value)) + ' m³', 'Volume']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="loss" 
                            name="Loss" 
                            stroke="#FF6B6B" 
                            fill="#FFCDD2" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-white mb-8">
                <CardHeader>
                  <CardTitle>Consumption vs Loss Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={prepareMonthlyTrendData()}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        stackOffset="expand"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(tick) => `${(tick * 100)}%`} />
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const total = props.payload.consumption + props.payload.loss;
                            return [`${((Number(value) / total) * 100).toFixed(1)}%`, name];
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="consumption" 
                          name="Consumption" 
                          stackId="1"
                          stroke="#0088FE" 
                          fill="#0088FE" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="loss" 
                          name="Loss" 
                          stackId="1"
                          stroke="#FF6B6B" 
                          fill="#FF6B6B" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default WaterDashboard;
