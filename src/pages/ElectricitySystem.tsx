
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useTheme } from '@/components/theme/theme-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChartContainer
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
  Building,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  AreaChart as AreaChartIcon,
  ChevronLeft
} from 'lucide-react';
import { useElectricityData } from '@/hooks/useElectricityData';
import { ElectricitySummary } from '@/components/electricity/ElectricitySummary';
import { ElectricityFacilitiesTable } from '@/components/electricity/ElectricityFacilitiesTable';
import { ElectricityTrends } from '@/components/electricity/ElectricityTrends';
import { ElectricityComparison } from '@/components/electricity/ElectricityComparison';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatCard from '@/components/dashboard/StatCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import BreadcrumbNavigation from '@/components/ui/breadcrumb-navigation';
import { toast } from 'sonner';
import EnhancedPieChart from '@/components/ui/enhanced-pie-chart';
import ResponsiveBarChart from '@/components/ui/responsive-chart';

const ELECTRICITY_RATE = 0.025; // OMR per kWh
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];

const ElectricitySystem = () => {
  const { theme } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { data: electricityData, loading } = useElectricityData();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleBackToDashboard = () => {
    navigate('/');
    toast.success("Returned to dashboard");
  };

  const allMonths = [
    { value: 'all', label: 'All Months' },
    { value: 'Apr-24', label: 'April 2024' },
    { value: 'May-24', label: 'May 2024' },
    { value: 'Jun-24', label: 'June 2024' },
    { value: 'Jul-24', label: 'July 2024' },
    { value: 'Aug-24', label: 'August 2024' },
    { value: 'Sep-24', label: 'September 2024' },
    { value: 'Oct-24', label: 'October 2024' },
    { value: 'Nov-24', label: 'November 2024' },
    { value: 'Dec-24', label: 'December 2024' },
    { value: 'Jan-25', label: 'January 2025' },
    { value: 'Feb-25', label: 'February 2025' }
  ];

  const getConsumptionData = () => {
    if (!electricityData) {
      return {
        totalConsumption: 0,
        periodLabel: 'N/A',
        currentMonth: 0,
        currentMonthLabel: 'N/A',
        previousMonth: 0,
        previousMonthLabel: 'N/A',
        momChange: 0
      };
    }
    
    if (selectedMonth === 'all') {
      const janConsumption = electricityData.reduce((total: number, facility: any) => {
        return total + (facility.consumption['Jan-25'] || 0);
      }, 0);
      
      const febConsumption = electricityData.reduce((total: number, facility: any) => {
        return total + (facility.consumption['Feb-25'] || 0);
      }, 0);
      
      return {
        totalConsumption: janConsumption + febConsumption,
        periodLabel: 'Jan-Feb 2025',
        currentMonth: febConsumption,
        currentMonthLabel: 'February 2025',
        previousMonth: janConsumption,
        previousMonthLabel: 'January 2025',
        momChange: janConsumption > 0 ? ((febConsumption - janConsumption) / janConsumption) * 100 : 0
      };
    } else {
      const monthIndex = allMonths.findIndex(m => m.value === selectedMonth);
      const previousMonthIndex = monthIndex > 1 ? monthIndex - 1 : -1;
      const previousMonth = previousMonthIndex > 0 ? allMonths[previousMonthIndex].value : null;
      
      const currentMonthConsumption = electricityData.reduce((total: number, facility: any) => {
        return total + (facility.consumption[selectedMonth] || 0);
      }, 0);
      
      let previousMonthConsumption = 0;
      if (previousMonth) {
        previousMonthConsumption = electricityData.reduce((total: number, facility: any) => {
          return total + (facility.consumption[previousMonth] || 0);
        }, 0);
      }
      
      return {
        totalConsumption: currentMonthConsumption,
        periodLabel: allMonths.find(m => m.value === selectedMonth)?.label || selectedMonth,
        currentMonth: currentMonthConsumption,
        currentMonthLabel: allMonths.find(m => m.value === selectedMonth)?.label || selectedMonth,
        previousMonth: previousMonthConsumption,
        previousMonthLabel: previousMonth ? (allMonths.find(m => m.value === previousMonth)?.label || previousMonth) : 'N/A',
        momChange: previousMonthConsumption > 0 ? ((currentMonthConsumption - previousMonthConsumption) / previousMonthConsumption) * 100 : 0
      };
    }
  };

  const consumptionData = getConsumptionData();

  const getConsumptionByType = () => {
    if (!electricityData) return {};
    
    if (selectedMonth === 'all') {
      return electricityData.reduce((acc: Record<string, number>, facility: any) => {
        const type = facility.type;
        const consumption = facility.consumption['Feb-25'] || 0;
        
        if (!acc[type]) {
          acc[type] = 0;
        }
        
        acc[type] += consumption;
        return acc;
      }, {} as Record<string, number>);
    } else {
      return electricityData.reduce((acc: Record<string, number>, facility: any) => {
        const type = facility.type;
        const consumption = facility.consumption[selectedMonth] || 0;
        
        if (!acc[type]) {
          acc[type] = 0;
        }
        
        acc[type] += consumption;
        return acc;
      }, {} as Record<string, number>);
    }
  };

  const consumptionByType = getConsumptionByType();

  const consumptionByTypeArray = Object.entries(consumptionByType)
    .filter(([type]) => type && type !== '')
    .map(([type, consumption]) => ({
      type,
      consumption,
      cost: Number(consumption) * ELECTRICITY_RATE
    }))
    .sort((a, b) => b.consumption - a.consumption);

  // Format for Enhanced Pie Chart
  const pieChartData = consumptionByTypeArray.map((item, index) => ({
    name: item.type,
    value: Number(item.consumption),
    color: COLORS[index % COLORS.length]
  }));

  const getTopConsumers = () => {
    if (!electricityData) return [];
    
    const monthToUse = selectedMonth === 'all' ? 'Feb-25' : selectedMonth;
    
    return electricityData
      .filter((facility: any) => facility.name && facility.consumption[monthToUse] > 0)
      .map((facility: any) => ({
        name: facility.name,
        type: facility.type,
        consumption: facility.consumption[monthToUse] || 0,
        cost: (facility.consumption[monthToUse] || 0) * ELECTRICITY_RATE
      }))
      .sort((a: any, b: any) => b.consumption - a.consumption)
      .slice(0, 10);
  };

  const topConsumers = getTopConsumers();

  const months = ['Apr-24', 'May-24', 'Jun-24', 'Jul-24', 'Aug-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24', 'Jan-25', 'Feb-25'];
  
  const monthlyConsumption = months.map(month => {
    const totalForMonth = electricityData ? electricityData.reduce((total: number, facility: any) => {
      return total + (facility.consumption[month] || 0);
    }, 0) : 0;
    
    return {
      month,
      consumption: totalForMonth,
      cost: totalForMonth * ELECTRICITY_RATE
    };
  });

  if (isLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-muscat-primary animate-pulse" />
            <h2 className="text-xl font-medium text-gray-700">Loading Electricity System Dashboard...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  const breadcrumbItems = [
    { label: 'Utilities', path: '/' },
    { label: 'Electricity System', path: '/electricity-system', icon: <Zap className="h-3.5 w-3.5" /> }
  ];

  return (
    <Layout>
      <div className="container px-2 sm:px-4 py-4 sm:py-8 mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <BreadcrumbNavigation items={breadcrumbItems} className="mb-2 sm:mb-0" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToDashboard}
            className="self-start"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-muscat-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Electricity System Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-500">Current rate: <span className="font-medium text-muscat-primary">0.025 OMR/kWh</span></p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[200px] text-sm sm:text-base">
                <CalendarRange className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {allMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value} className="text-sm sm:text-base">
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <button className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md bg-muscat-primary text-white hover:bg-muscat-primary/90 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-800 overflow-x-auto whitespace-nowrap max-w-full p-1 sm:p-0 flex flex-nowrap">
            <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-muscat-primary data-[state=active]:text-white">
              <BarChartIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="facilities" className="text-xs sm:text-sm data-[state=active]:bg-muscat-primary data-[state=active]:text-white">
              <Building className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Facilities
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm data-[state=active]:bg-muscat-primary data-[state=active]:text-white">
              <AreaChartIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs sm:text-sm data-[state=active]:bg-muscat-primary data-[state=active]:text-white">
              <PieChartIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Comparison
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <StatCard
                title={`Total ${consumptionData.periodLabel} Consumption`}
                value={`${consumptionData.totalConsumption.toLocaleString()} kWh`}
                description={`${(consumptionData.totalConsumption * ELECTRICITY_RATE).toLocaleString()} OMR`}
                icon={Zap}
                color="primary"
              />
              
              <StatCard
                title={`${consumptionData.currentMonthLabel} Consumption`}
                value={`${consumptionData.currentMonth.toLocaleString()} kWh`}
                description={`${(consumptionData.currentMonth * ELECTRICITY_RATE).toLocaleString()} OMR`}
                icon={Zap}
                color="teal"
              />
              
              <StatCard
                title={`${consumptionData.previousMonthLabel} Consumption`}
                value={`${consumptionData.previousMonth.toLocaleString()} kWh`}
                description={`${(consumptionData.previousMonth * ELECTRICITY_RATE).toLocaleString()} OMR`}
                icon={Zap}
                color="lavender"
              />
              
              <StatCard
                title="Month-over-Month Change"
                value={`${consumptionData.momChange.toFixed(1)}%`}
                icon={consumptionData.momChange >= 0 ? TrendingUp : TrendingDown}
                trend={{
                  value: Math.abs(parseFloat(consumptionData.momChange.toFixed(1))),
                  isPositive: consumptionData.momChange >= 0
                }}
                color="gold"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-medium">Monthly Consumption Trend</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="w-full h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyConsumption}
                        margin={{ 
                          top: 10, 
                          right: isMobile ? 10 : 30, 
                          left: isMobile ? 0 : 20, 
                          bottom: isMobile ? 60 : 30 
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          angle={-45} 
                          textAnchor="end" 
                          height={60} 
                          tickMargin={20}
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                        />
                        <YAxis 
                          yAxisId="left"
                          tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                          label={{ 
                            value: 'kWh', 
                            angle: -90, 
                            position: 'insideLeft', 
                            offset: -5,
                            style: { fontSize: isMobile ? 10 : 12 }
                          }}
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right"
                          tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                          label={{ 
                            value: 'OMR', 
                            angle: 90, 
                            position: 'insideRight', 
                            offset: 5,
                            style: { fontSize: isMobile ? 10 : 12 }
                          }}
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
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
                        <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
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
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-medium">
                    Consumption by Facility Type {selectedMonth !== 'all' ? `(${allMonths.find(m => m.value === selectedMonth)?.label})` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="w-full h-64 md:h-80">
                    <EnhancedPieChart
                      data={pieChartData}
                      colors={COLORS}
                      outerRadius={isMobile ? 60 : 80}
                      valueFormatter={(value) => `${value.toLocaleString()} kWh`}
                      labelFormatter={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      tooltipFormatter={(value, name) => (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
                          <p className="font-medium">{name}</p>
                          <p className="text-sm">
                            Consumption: <span className="font-medium">{value.toLocaleString()} kWh</span>
                          </p>
                          <p className="text-sm">
                            Cost: <span className="font-medium">{(value * ELECTRICITY_RATE).toLocaleString()} OMR</span>
                          </p>
                        </div>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-medium">
                    Cost Breakdown {selectedMonth !== 'all' ? `(${allMonths.find(m => m.value === selectedMonth)?.label})` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveBarChart
                    data={consumptionByTypeArray}
                    xKey="type"
                    yKey="cost"
                    horizontal={true}
                    barColor="#0088FE"
                    yLabel="Cost (OMR)"
                    height={300}
                    barRadius={[0, 4, 4, 0]}
                    yFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                    tooltip={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
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
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-medium">
                    Top Consumers {selectedMonth !== 'all' ? `(${allMonths.find(m => m.value === selectedMonth)?.label})` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveBarChart
                    data={topConsumers}
                    xKey="name"
                    yKey="consumption"
                    horizontal={true}
                    barColor="#00C49F"
                    yLabel="Consumption (kWh)"
                    height={300}
                    barRadius={[0, 4, 4, 0]}
                    yFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                    tooltip={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-md rounded-md">
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="facilities">
            <ElectricityFacilitiesTable 
              electricityData={electricityData} 
              electricityRate={ELECTRICITY_RATE} 
            />
          </TabsContent>
          
          <TabsContent value="trends">
            <ElectricityTrends 
              electricityData={electricityData} 
              electricityRate={ELECTRICITY_RATE} 
            />
          </TabsContent>
          
          <TabsContent value="comparison">
            <ElectricityComparison 
              electricityData={electricityData} 
              electricityRate={ELECTRICITY_RATE} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ElectricitySystem;
