import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  Search,
  Filter,
  Activity
} from 'lucide-react';
import { electricityData } from '@/data/electricityData';
import { ElectricitySummary } from '@/components/electricity/ElectricitySummary';
import { ElectricityFacilitiesTable } from '@/components/electricity/ElectricityFacilitiesTable';
import { ElectricityTrends } from '@/components/electricity/ElectricityTrends';
import { ElectricityComparison } from '@/components/electricity/ElectricityComparison';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatCard from '@/components/dashboard/StatCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import EnhancedPieChart from '@/components/ui/enhanced-pie-chart';
import ResponsiveBarChart from '@/components/ui/responsive-chart';
import { AnimatePresence, motion } from 'framer-motion';
import { ElectricityFacility } from '@/types/electricity';

const ELECTRICITY_RATE = 0.025; // OMR per kWh
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];

const ElectricitySystem = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("overview");
  
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
    if (selectedMonth === 'all') {
      const janConsumption = electricityData.reduce((total, facility) => {
        return total + (facility.consumption['Jan-25'] || 0);
      }, 0);
      
      const febConsumption = electricityData.reduce((total, facility) => {
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
      
      const currentMonthConsumption = electricityData.reduce((total, facility) => {
        return total + (facility.consumption[selectedMonth] || 0);
      }, 0);
      
      let previousMonthConsumption = 0;
      if (previousMonth) {
        previousMonthConsumption = electricityData.reduce((total, facility) => {
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
    if (selectedMonth === 'all') {
      return electricityData.reduce((acc, facility) => {
        const type = facility.type;
        const consumption = facility.consumption['Feb-25'] || 0;
        
        if (!acc[type]) {
          acc[type] = 0;
        }
        
        acc[type] += consumption;
        return acc;
      }, {} as Record<string, number>);
    } else {
      return electricityData.reduce((acc, facility) => {
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
      cost: consumption * ELECTRICITY_RATE
    }))
    .sort((a, b) => b.consumption - a.consumption);

  const pieChartData = consumptionByTypeArray.map((item, index) => ({
    name: item.type,
    value: item.consumption,
    color: COLORS[index % COLORS.length]
  }));

  const getTopConsumers = () => {
    const monthToUse = selectedMonth === 'all' ? 'Feb-25' : selectedMonth;
    
    return electricityData
      .filter(facility => facility.name && facility.consumption[monthToUse] > 0)
      .map(facility => ({
        name: facility.name,
        type: facility.type,
        consumption: facility.consumption[monthToUse] || 0,
        cost: (facility.consumption[monthToUse] || 0) * ELECTRICITY_RATE
      }))
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 10);
  };

  const topConsumers = getTopConsumers();
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
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
            <h2 className="text-xl font-medium text-gray-700">Loading Electricity System Dashboard...</h2>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium">Monthly Consumption Trend</h2>
                </div>
                <div className="p-6">
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
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium">
                    Consumption by Facility Type {selectedMonth !== 'all' ? `(${allMonths.find(m => m.value === selectedMonth)?.label})` : ''}
                  </h2>
                </div>
                <div className="p-6">
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
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium">
                    Cost Breakdown {selectedMonth !== 'all' ? `(${allMonths.find(m => m.value === selectedMonth)?.label})` : ''}
                  </h2>
                </div>
                <div className="p-6">
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
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium">
                    Top Consumers {selectedMonth !== 'all' ? `(${allMonths.find(m => m.value === selectedMonth)?.label})` : ''}
                  </h2>
                </div>
                <div className="p-6">
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
                </div>
              </div>
            </div>
          </div>
        );
      case 'facilities':
        return <ElectricityFacilitiesTable 
                 electricityData={electricityData as ElectricityFacility[]} 
                 electricityRate={ELECTRICITY_RATE} 
               />;
      case 'trends':
        return <ElectricityTrends 
                 electricityData={electricityData as ElectricityFacility[]} 
                 electricityRate={ELECTRICITY_RATE} 
               />;
      case 'comparison':
        return <ElectricityComparison 
                 electricityData={electricityData as ElectricityFacility[]} 
                 electricityRate={ELECTRICITY_RATE} 
               />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full px-4 py-3 bg-white shadow-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h1 className="text-xl font-bold">OmniProp</h1>
          </div>
          
          <div className="relative w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <input 
              type="search" 
              className="w-full py-2 pl-10 pr-4 text-sm border rounded-lg bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
              placeholder="Search facilities, consumption..." 
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
              <Filter size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">MB</div>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-20 md:w-64 p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <nav className="space-y-1 mt-6">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'overview' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <BarChartIcon size={20} className="mr-3" />
              <span className="hidden md:inline">Overview</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('facilities')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'facilities' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <Building size={20} className="mr-3" />
              <span className="hidden md:inline">Facilities</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('trends')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'trends' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <AreaChartIcon size={20} className="mr-3" />
              <span className="hidden md:inline">Trends</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'comparison' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <PieChartIcon size={20} className="mr-3" />
              <span className="hidden md:inline">Comparison</span>
            </button>
            
            <button 
              onClick={() => navigate('/')}
              className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={20} className="mr-3" />
              <span className="hidden md:inline">Back to Dashboard</span>
            </button>
          </nav>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full text-sm">
                  <CalendarRange className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {allMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value} className="text-sm">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <button className="flex items-center justify-center w-full px-3 py-2 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors mt-2">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Electricity System Dashboard</h1>
                <p className="text-sm text-gray-500">Current rate: <span className="font-medium text-blue-500">0.025 OMR/kWh</span></p>
              </div>
              
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ElectricitySystem;
