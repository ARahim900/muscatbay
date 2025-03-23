
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme/theme-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import {
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Zap, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  CalendarRange,
  Info,
  Building,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  AreaChart as AreaChartIcon
} from 'lucide-react';
import { electricityData } from '@/data/electricityData';
import { ElectricitySummary } from '@/components/electricity/ElectricitySummary';
import { ElectricityFacilitiesTable } from '@/components/electricity/ElectricityFacilitiesTable';
import { ElectricityTrends } from '@/components/electricity/ElectricityTrends';
import { ElectricityComparison } from '@/components/electricity/ElectricityComparison';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatCard from '@/components/dashboard/StatCard';

const ELECTRICITY_RATE = 0.025; // OMR per kWh
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];

const ElectricitySystem = () => {
  const { theme } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Calculate total consumption for Jan-Feb 2025
  const totalConsumption2025 = electricityData.reduce((total, facility) => {
    return total + (facility.consumption['Jan-25'] || 0) + (facility.consumption['Feb-25'] || 0);
  }, 0);

  // Calculate total consumption for Feb 2025
  const febConsumption = electricityData.reduce((total, facility) => {
    return total + (facility.consumption['Feb-25'] || 0);
  }, 0);

  // Calculate total consumption for Jan 2025
  const janConsumption = electricityData.reduce((total, facility) => {
    return total + (facility.consumption['Jan-25'] || 0);
  }, 0);

  // Calculate month over month change
  const momChange = ((febConsumption - janConsumption) / janConsumption) * 100;

  // Group consumption by facility type for February 2025
  const consumptionByType = electricityData.reduce((acc, facility) => {
    const type = facility.type;
    const consumption = facility.consumption['Feb-25'] || 0;
    
    if (!acc[type]) {
      acc[type] = 0;
    }
    
    acc[type] += consumption;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array for charts
  const consumptionByTypeArray = Object.entries(consumptionByType)
    .filter(([type]) => type && type !== '')
    .map(([type, consumption]) => ({
      type,
      consumption,
      cost: consumption * ELECTRICITY_RATE
    }))
    .sort((a, b) => b.consumption - a.consumption);

  // Get top consumers for February 2025
  const topConsumers = electricityData
    .filter(facility => facility.name && facility.consumption['Feb-25'] > 0)
    .map(facility => ({
      name: facility.name,
      type: facility.type,
      consumption: facility.consumption['Feb-25'] || 0,
      cost: (facility.consumption['Feb-25'] || 0) * ELECTRICITY_RATE
    }))
    .sort((a, b) => b.consumption - a.consumption)
    .slice(0, 10);

  // Monthly consumption trend (Apr 2024 - Feb 2025)
  const months = ['Apr-24', 'May-24', 'Jun-24', 'Jul-24', 'Aug-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24', 'Jan-25', 'Feb-25'];
  
  const monthlyConsumption = months.map(month => {
    const totalForMonth = electricityData.reduce((total, facility) => {
      return total + (facility.consumption[month] || 0);
    }, 0);
    
    return {
      month,
      consumption: totalForMonth,
      cost: totalForMonth * ELECTRICITY_RATE
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-muscat-primary animate-pulse" />
          <h2 className="text-xl font-medium text-gray-700">Loading Electricity System Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <Zap className="w-8 h-8 mr-3 text-muscat-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Electricity System Dashboard</h1>
            <p className="text-sm text-gray-500">Current rate: <span className="font-medium text-muscat-primary">0.025 OMR/kWh</span></p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <CalendarRange className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="Jan-25">January 2025</SelectItem>
              <SelectItem value="Feb-25">February 2025</SelectItem>
            </SelectContent>
          </Select>
          
          <button className="flex items-center justify-center px-4 py-2 rounded-md bg-muscat-primary text-white hover:bg-muscat-primary/90 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-muscat-primary data-[state=active]:text-white">
            <BarChartIcon className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="facilities" className="data-[state=active]:bg-muscat-primary data-[state=active]:text-white">
            <Building className="w-4 h-4 mr-2" />
            Facilities
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-muscat-primary data-[state=active]:text-white">
            <AreaChartIcon className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-muscat-primary data-[state=active]:text-white">
            <PieChartIcon className="w-4 h-4 mr-2" />
            Comparison
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab Content */}
        <TabsContent value="overview" className="mt-0">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Consumption (Jan-Feb 2025)"
              value={`${totalConsumption2025.toLocaleString()} kWh`}
              description={`${(totalConsumption2025 * ELECTRICITY_RATE).toLocaleString()} OMR`}
              icon={Zap}
              color="primary"
            />
            
            <StatCard
              title="February 2025 Consumption"
              value={`${febConsumption.toLocaleString()} kWh`}
              description={`${(febConsumption * ELECTRICITY_RATE).toLocaleString()} OMR`}
              icon={Zap}
              color="teal"
            />
            
            <StatCard
              title="January 2025 Consumption"
              value={`${janConsumption.toLocaleString()} kWh`}
              description={`${(janConsumption * ELECTRICITY_RATE).toLocaleString()} OMR`}
              icon={Zap}
              color="lavender"
            />
            
            <StatCard
              title="Month-over-Month Change"
              value={`${momChange.toFixed(1)}%`}
              icon={momChange >= 0 ? TrendingUp : TrendingDown}
              trend={{
                value: Math.abs(parseFloat(momChange.toFixed(1))),
                isPositive: momChange >= 0
              }}
              color="gold"
            />
          </div>
          
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Consumption Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Monthly Consumption Trend</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer
                  className="h-80"
                  config={{
                    consumption: {},
                    cost: {}
                  }}
                >
                  <AreaChart
                    data={monthlyConsumption}
                    margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60} 
                      tickMargin={20}
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={(value) => `${value.toLocaleString()}`}
                      label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: -5 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tickFormatter={(value) => `${value.toLocaleString()}`}
                      label={{ value: 'OMR', angle: 90, position: 'insideRight', offset: 5 }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                              <p className="font-medium">{label}</p>
                              <p className="text-sm">
                                Consumption: <span className="font-medium">{payload[0].value?.toLocaleString()} kWh</span>
                              </p>
                              <p className="text-sm">
                                Cost: <span className="font-medium">{(Number(payload[0].value) * ELECTRICITY_RATE).toLocaleString()} OMR</span>
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
                      yAxisId="left"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      name="Consumption (kWh)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
            
            {/* Consumption by Facility Type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Consumption by Facility Type</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer
                  className="h-80"
                  config={{
                    type: {},
                    consumption: {},
                    cost: {}
                  }}
                >
                  <PieChart>
                    <Pie
                      data={consumptionByTypeArray}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="consumption"
                      nameKey="type"
                      label={({ type, percent }) => 
                        `${type}: ${(percent * 100).toFixed(1)}%`
                      }
                    >
                      {consumptionByTypeArray.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => {
                        if (name === "consumption") {
                          return [`${Number(value).toLocaleString()} kWh`, "Consumption"];
                        }
                        return [value, name];
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                              <p className="font-medium">{data.type}</p>
                              <p className="text-sm">
                                Consumption: <span className="font-medium">{data.consumption.toLocaleString()} kWh</span>
                              </p>
                              <p className="text-sm">
                                Cost: <span className="font-medium">{data.cost.toLocaleString()} OMR</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* February 2025 Cost Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">February 2025 Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer
                  className="h-80"
                  config={{
                    type: {},
                    cost: {}
                  }}
                >
                  <BarChart
                    data={consumptionByTypeArray}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => `${value.toLocaleString()} OMR`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="type" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value, name, props) => {
                        if (name === "cost") {
                          return [`${Number(value).toLocaleString()} OMR`, "Cost"];
                        }
                        return [value, name];
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                              <p className="font-medium">{data.type}</p>
                              <p className="text-sm">
                                Cost: <span className="font-medium">{data.cost.toLocaleString()} OMR</span>
                              </p>
                              <p className="text-sm">
                                Consumption: <span className="font-medium">{data.consumption.toLocaleString()} kWh</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="cost"
                      fill="#0088FE"
                      name="Cost (OMR)"
                      radius={[0, 4, 4, 0]}
                    >
                      {consumptionByTypeArray.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            
            {/* Top Consumers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Top Consumers - February 2025</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer
                  className="h-80"
                  config={{
                    name: {},
                    consumption: {}
                  }}
                >
                  <BarChart
                    data={topConsumers}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number"
                      tickFormatter={(value) => `${value.toLocaleString()}`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-gray-500">{data.type}</p>
                              <p className="text-sm mt-1">
                                Consumption: <span className="font-medium">{data.consumption.toLocaleString()} kWh</span>
                              </p>
                              <p className="text-sm">
                                Cost: <span className="font-medium">{data.cost.toLocaleString()} OMR</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="consumption"
                      fill="#00C49F"
                      name="Consumption (kWh)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Facilities Tab Content */}
        <TabsContent value="facilities">
          <ElectricityFacilitiesTable 
            electricityData={electricityData} 
            electricityRate={ELECTRICITY_RATE} 
          />
        </TabsContent>
        
        {/* Trends Tab Content */}
        <TabsContent value="trends">
          <ElectricityTrends 
            electricityData={electricityData} 
            electricityRate={ELECTRICITY_RATE} 
          />
        </TabsContent>
        
        {/* Comparison Tab Content */}
        <TabsContent value="comparison">
          <ElectricityComparison 
            electricityData={electricityData} 
            electricityRate={ELECTRICITY_RATE} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ElectricitySystem;
