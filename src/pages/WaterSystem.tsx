import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Droplets, TrendingUp, TrendingDown } from 'lucide-react';
import { faker } from '@faker-js/faker';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarRange, Download, Search, Filter, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ImportWaterData from '@/components/water/ImportWaterData';

const WATER_RATE = 0.015; // OMR per m3
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];

const WaterSystem = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const allMonths = [
    { value: 'all', label: 'All Months' },
    { value: 'Jan-24', label: 'January 2024' },
    { value: 'Feb-24', label: 'February 2024' },
    { value: 'Mar-24', label: 'March 2024' },
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
      const janConsumption = 55000;
      const febConsumption = 68000;
      
      return {
        totalConsumption: janConsumption + febConsumption,
        periodLabel: 'Jan-Feb 2025',
        currentMonth: febConsumption,
        currentMonthLabel: 'February 2025',
        previousMonth: janConsumption,
        previousMonthLabel: 'January 2025',
        momChange: ((febConsumption - janConsumption) / janConsumption) * 100
      };
    } else {
      const currentMonthConsumption = faker.number.int({ min: 50000, max: 70000 });
      const previousMonthConsumption = faker.number.int({ min: 45000, max: 65000 });
      
      return {
        totalConsumption: currentMonthConsumption,
        periodLabel: allMonths.find(m => m.value === selectedMonth)?.label || selectedMonth,
        currentMonth: currentMonthConsumption,
        currentMonthLabel: allMonths.find(m => m.value === selectedMonth)?.label || selectedMonth,
        previousMonth: previousMonthConsumption,
        previousMonthLabel: 'Previous Month',
        momChange: ((currentMonthConsumption - previousMonthConsumption) / previousMonthConsumption) * 100
      };
    }
  };

  const consumptionData = getConsumptionData();

  const pieChartData = [
    { name: 'Residential', value: faker.number.int({ min: 10000, max: 20000 }), color: COLORS[0] },
    { name: 'Commercial', value: faker.number.int({ min: 15000, max: 25000 }), color: COLORS[1] },
    { name: 'Retail', value: faker.number.int({ min: 8000, max: 18000 }), color: COLORS[2] },
    { name: 'Industrial', value: faker.number.int({ min: 12000, max: 22000 }), color: COLORS[3] },
  ];

  const monthlyConsumption = allMonths.slice(1).map(month => ({
    month: month.label,
    consumption: faker.number.int({ min: 40000, max: 70000 }),
    cost: faker.number.int({ min: 600, max: 1050 })
  }));

  const handleBackToDashboard = () => {
    navigate('/');
    toast.success("Returned to dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Droplets className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
            <h2 className="text-xl font-medium text-gray-700">Loading Water System Dashboard...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full px-4 py-3 bg-white shadow-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                <Droplets size={20} />
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
                onClick={handleBackToDashboard}
                className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Activity size={20} className="mr-3" />
                <span className="hidden md:inline">Activity</span>
              </button>
              
              <button 
                onClick={handleBackToDashboard}
                className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Activity size={20} className="mr-3" />
                <span className="hidden md:inline">Consumption</span>
              </button>
              
              <button 
                onClick={handleBackToDashboard}
                className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Activity size={20} className="mr-3" />
                <span className="hidden md:inline">Facilities</span>
              </button>
              
              <button 
                onClick={handleBackToDashboard}
                className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Activity size={20} className="mr-3" />
                <span className="hidden md:inline">Trends</span>
              </button>
              
              <button 
                onClick={handleBackToDashboard}
                className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Activity size={20} className="mr-3" />
                <span className="hidden md:inline">Comparison</span>
              </button>
              
              <button 
                onClick={handleBackToDashboard}
                className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Activity size={20} className="mr-3" />
                <span className="hidden md:inline">Settings</span>
              </button>
              
              <button 
                onClick={handleBackToDashboard}
                className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Activity size={20} className="mr-3" />
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
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Water System Dashboard</h1>
              <p className="text-sm text-gray-500">Current rate: <span className="font-medium text-blue-500">0.015 OMR/m3</span></p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <StatCard
                title={`Total ${consumptionData.periodLabel} Consumption`}
                value={`${consumptionData.totalConsumption.toLocaleString()} m3`}
                description={`${(consumptionData.totalConsumption * WATER_RATE).toLocaleString()} OMR`}
                icon={Droplets}
                color="primary"
              />
              
              <StatCard
                title={`${consumptionData.currentMonthLabel} Consumption`}
                value={`${consumptionData.currentMonth.toLocaleString()} m3`}
                description={`${(consumptionData.currentMonth * WATER_RATE).toLocaleString()} OMR`}
                icon={Droplets}
                color="teal"
              />
              
              <StatCard
                title={`${consumptionData.previousMonthLabel} Consumption`}
                value={`${consumptionData.previousMonth.toLocaleString()} m3`}
                description={`${(consumptionData.previousMonth * WATER_RATE).toLocaleString()} OMR`}
                icon={Droplets}
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
                  <ResponsiveContainer width="100%" height={300}>
                    {/* Placeholder chart - replace with actual Recharts implementation */}
                    <div>Monthly Consumption Chart</div>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium">Consumption by Type</h2>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        dataKey="value"
                        isAnimationActive={false}
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <ImportWaterData />
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default WaterSystem;
