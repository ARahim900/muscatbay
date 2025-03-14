
import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Zap, DownloadIcon, Filter, Activity, Building, Lightbulb } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatCard from '@/components/dashboard/StatCard';

// Dummy data for visualization
const electricityData = {
  totalConsumption: 693320,
  totalCost: 17333000,
  ratePerKWH: 0.025,
  monthlyAverage: 63029,
  peakMonth: 'Aug-24',
  peakConsumption: 84973,
  monthlyData: [
    { month: 'Mar-23', 'Total Consumption': 55000, PS: 5000, LS: 3500, IRR: 4000, 'Street Light': 4000, D_Building: 38500 },
    { month: 'Apr-23', 'Total Consumption': 50000, PS: 4800, LS: 3200, IRR: 3500, 'Street Light': 3800, D_Building: 34700 },
    { month: 'May-23', 'Total Consumption': 60000, PS: 5500, LS: 3800, IRR: 4200, 'Street Light': 4500, D_Building: 42000 },
    { month: 'Jun-23', 'Total Consumption': 68000, PS: 6200, LS: 4200, IRR: 4800, 'Street Light': 5100, D_Building: 47700 },
    { month: 'Jul-23', 'Total Consumption': 75000, PS: 6800, LS: 4500, IRR: 5200, 'Street Light': 5600, D_Building: 52900 },
    { month: 'Aug-23', 'Total Consumption': 85000, PS: 7700, LS: 5100, IRR: 6000, 'Street Light': 6400, D_Building: 59800 },
    { month: 'Sep-23', 'Total Consumption': 80000, PS: 7300, LS: 4800, IRR: 5600, 'Street Light': 6000, D_Building: 56300 },
    { month: 'Oct-23', 'Total Consumption': 70000, PS: 6400, LS: 4300, IRR: 4900, 'Street Light': 5300, D_Building: 49100 },
    { month: 'Nov-23', 'Total Consumption': 62000, PS: 5600, LS: 3800, IRR: 4300, 'Street Light': 4700, D_Building: 43600 },
    { month: 'Dec-23', 'Total Consumption': 58000, PS: 5300, LS: 3600, IRR: 4100, 'Street Light': 4400, D_Building: 40600 },
    { month: 'Jan-24', 'Total Consumption': 65000, PS: 5900, LS: 4000, IRR: 4600, 'Street Light': 4900, D_Building: 45600 },
    { month: 'Feb-24', 'Total Consumption': 70000, PS: 6400, LS: 4300, IRR: 4900, 'Street Light': 5300, D_Building: 49100 },
  ],
  pieData: [
    { name: 'PS', value: 9.1, color: '#F59E0B' },
    { name: 'LS', value: 6.2, color: '#10B981' },
    { name: 'IRR', value: 7.7, color: '#3B82F6' },
    { name: 'Street Light', value: 7.7, color: '#EC4899' },
    { name: 'D_Building', value: 69.3, color: '#EF4444' },
  ],
  // Consumption analysis data
  consumptionAnalysis: {
    peakHours: [
      { hour: '00:00', consumption: 2100 },
      { hour: '01:00', consumption: 1900 },
      { hour: '02:00', consumption: 1800 },
      { hour: '03:00', consumption: 1750 },
      { hour: '04:00', consumption: 1700 },
      { hour: '05:00', consumption: 1800 },
      { hour: '06:00', consumption: 2300 },
      { hour: '07:00', consumption: 2800 },
      { hour: '08:00', consumption: 3500 },
      { hour: '09:00', consumption: 3800 },
      { hour: '10:00', consumption: 4000 },
      { hour: '11:00', consumption: 4200 },
      { hour: '12:00', consumption: 4100 },
      { hour: '13:00', consumption: 4300 },
      { hour: '14:00', consumption: 4500 },
      { hour: '15:00', consumption: 4400 },
      { hour: '16:00', consumption: 4200 },
      { hour: '17:00', consumption: 4000 },
      { hour: '18:00', consumption: 3900 },
      { hour: '19:00', consumption: 3700 },
      { hour: '20:00', consumption: 3500 },
      { hour: '21:00', consumption: 3200 },
      { hour: '22:00', consumption: 2800 },
      { hour: '23:00', consumption: 2400 },
    ],
    seasonalTrends: [
      { season: 'Winter', consumption: 60000, cost: 1500 },
      { season: 'Spring', consumption: 58000, cost: 1450 },
      { season: 'Summer', consumption: 82000, cost: 2050 },
      { season: 'Fall', consumption: 65000, cost: 1625 },
    ]
  },
  // Facilities management data
  facilities: [
    { name: 'Main Building', consumption: 175000, efficiency: 85, maintenance: 'Scheduled' },
    { name: 'Residential Area', consumption: 210000, efficiency: 78, maintenance: 'Completed' },
    { name: 'Commercial Complex', consumption: 145000, efficiency: 82, maintenance: 'Due' },
    { name: 'Public Areas', consumption: 95000, efficiency: 90, maintenance: 'Scheduled' },
    { name: 'Infrastructure', consumption: 68320, efficiency: 88, maintenance: 'Completed' },
  ],
  // Cost analysis data
  costAnalysis: {
    byMonth: [
      { month: 'Mar-23', cost: 1375 },
      { month: 'Apr-23', cost: 1250 },
      { month: 'May-23', cost: 1500 },
      { month: 'Jun-23', cost: 1700 },
      { month: 'Jul-23', cost: 1875 },
      { month: 'Aug-23', cost: 2125 },
      { month: 'Sep-23', cost: 2000 },
      { month: 'Oct-23', cost: 1750 },
      { month: 'Nov-23', cost: 1550 },
      { month: 'Dec-23', cost: 1450 },
      { month: 'Jan-24', cost: 1625 },
      { month: 'Feb-24', cost: 1750 },
    ],
    predictions: [
      { month: 'Mar-24', predicted: 1400, actual: 1375 },
      { month: 'Apr-24', predicted: 1300, actual: 1250 },
      { month: 'May-24', predicted: 1550, actual: 1500 },
      { month: 'Jun-24', predicted: 1800, actual: 1700 },
      { month: 'Jul-24', predicted: 1950, actual: 1875 },
      { month: 'Aug-24', predicted: 2200, actual: 2125 },
      { month: 'Sep-24', predicted: 2100, actual: 2000 },
      { month: 'Oct-24', predicted: 1800, actual: 1750 },
      { month: 'Nov-24', predicted: 1600, actual: 1550 },
      { month: 'Dec-24', predicted: 1500, actual: 1450 },
      { month: 'Jan-25', predicted: 1700, actual: null },
      { month: 'Feb-25', predicted: 1800, actual: null },
    ]
  }
};

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#EF4444'];

const ElectricitySystem = () => {
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [month, setMonth] = useState('All Months');
  
  return (
    <Layout>
      <div className="p-4 max-w-full system-section">
        <div className="flex flex-col space-y-4">
          {/* Header with Title and Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg text-white">
                <Zap className="h-6 w-6" />
              </div>
              <h1 className={cn("font-bold text-muscat-primary dark:text-white", isMobile ? "text-xl" : "text-2xl")}>
                Electricity System
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Month:</span>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Months">All Months</SelectItem>
                    <SelectItem value="Mar-23">Mar 2023</SelectItem>
                    <SelectItem value="Apr-23">Apr 2023</SelectItem>
                    <SelectItem value="May-23">May 2023</SelectItem>
                    <SelectItem value="Jun-23">Jun 2023</SelectItem>
                    <SelectItem value="Jul-23">Jul 2023</SelectItem>
                    <SelectItem value="Aug-23">Aug 2023</SelectItem>
                    <SelectItem value="Sep-23">Sep 2023</SelectItem>
                    <SelectItem value="Oct-23">Oct 2023</SelectItem>
                    <SelectItem value="Nov-23">Nov 2023</SelectItem>
                    <SelectItem value="Dec-23">Dec 2023</SelectItem>
                    <SelectItem value="Jan-24">Jan 2024</SelectItem>
                    <SelectItem value="Feb-24">Feb 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <ThemeToggle />
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-4">
              <TabsTrigger value="overview">
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.28 13.61C15.15 14.74 13.53 15.09 12.1 14.64L9.51001 17.22C9.33001 17.41 8.96001 17.53 8.69001 17.49L7.49001 17.33C7.09001 17.28 6.73001 16.9 6.67001 16.51L6.51001 15.31C6.47001 15.05 6.60001 14.68 6.78001 14.49L9.36001 11.91C8.92001 10.48 9.26001 8.86001 10.39 7.73001C12.01 6.11001 14.65 6.11001 16.28 7.73001C17.9 9.34001 17.9 11.98 16.28 13.61Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.45 16.28L9.59998 15.42" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.3945 10.7H13.4035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Overview
                </span>
              </TabsTrigger>
              <TabsTrigger value="consumption">
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.5 12H6.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.97 7.5L17.5 12L12.97 16.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Consumption
                </span>
              </TabsTrigger>
              <TabsTrigger value="facilities">
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.02 2.84001L3.63 7.04001C2.73 7.74001 2 9.23001 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.78V10.5C22 9.29001 21.19 7.74001 20.2 7.05001L14.02 2.72001C12.62 1.74001 10.37 1.79001 9.02 2.84001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 17.99V14.99" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Facilities
                </span>
              </TabsTrigger>
              <TabsTrigger value="cost">
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.99998 14.5C7.99998 12.8 9.19998 11.4 12 11.4C14.8 11.4 16 12.8 16 14.5C16 16.2 14.8 17.6 12 17.6C9.19998 17.6 7.99998 16.2 7.99998 14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 9.6C13.3256 9.6 14.4 8.52548 14.4 7.2C14.4 5.87452 13.3256 4.8 12 4.8C10.6745 4.8 9.6 5.87452 9.6 7.2C9.6 8.52548 10.6745 9.6 12 9.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Cost
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="text-lg font-medium mb-2 text-muscat-primary dark:text-white">Showing: {month}</div>
              
              {/* Stats Cards */}
              <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-4"} gap-4 mb-6`}>
                <StatCard
                  title="Total Consumption"
                  value={`${electricityData.totalConsumption.toLocaleString()}`}
                  description="kWh"
                  icon={Zap}
                  color="primary"
                />
                
                <StatCard
                  title="Total Cost"
                  value={`${(electricityData.totalCost / 1000).toLocaleString()} OMR`}
                  description={`at ${electricityData.ratePerKWH} OMR per kWh`}
                  icon={Zap}
                  color="teal"
                />
                
                <StatCard
                  title="Monthly Average"
                  value={`${electricityData.monthlyAverage.toLocaleString()}`}
                  description="kWh per month"
                  icon={Zap}
                  color="lavender"
                />
                
                <StatCard
                  title="Peak Month"
                  value={electricityData.peakMonth}
                  description={`${electricityData.peakConsumption.toLocaleString()} kWh`}
                  icon={Zap}
                  color="gold"
                />
              </div>
              
              {/* Filter Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-6">
                <div className="mb-2 font-medium flex items-center text-muscat-primary dark:text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter by Facility Type
                </div>
                <div className="flex flex-wrap gap-2">
                  {['PS', 'LS', 'IRR', 'Street Light', 'D_Building'].map((type, index) => (
                    <div key={type} className="flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${COLORS[index]}20`, color: COLORS[index] }}>
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></span>
                      {type}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Charts */}
              <div className="space-y-6">
                {/* Monthly Consumption Chart */}
                <Card className="p-4 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="text-lg font-medium mb-4 text-muscat-primary dark:text-white">Monthly Electricity Consumption</h3>
                  <div className="h-[300px] w-full system-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={electricityData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Legend />
                        {['Total Consumption', 'PS', 'LS', 'IRR', 'Street Light', 'D_Building'].map((type, index) => (
                          <Line
                            key={type}
                            type="monotone"
                            dataKey={type}
                            stroke={index === 0 ? '#FFD700' : COLORS[index - 1]}
                            activeDot={{ r: 8 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                {/* Pie Chart */}
                <Card className="p-4 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="text-lg font-medium mb-4 text-muscat-primary dark:text-white">Consumption by Facility Type</h3>
                  <div className="h-[300px] w-full system-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={electricityData.pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={isMobile ? 80 : 100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {electricityData.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {electricityData.pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center text-xs dark:text-gray-300">
                        <div className="w-3 h-3 mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span>{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                
                {/* Composition Chart */}
                <Card className="p-4 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="text-lg font-medium mb-4 text-muscat-primary dark:text-white">Consumption Composition</h3>
                  <div className="h-[300px] w-full system-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={electricityData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Legend />
                        {['PS', 'LS', 'IRR', 'Street Light', 'D_Building'].map((type, index) => (
                          <Area
                            key={type}
                            type="monotone"
                            dataKey={type}
                            stackId="1"
                            stroke={COLORS[index]}
                            fill={COLORS[index]}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="consumption" className="space-y-4">
              <div className="text-lg font-medium mb-4 dark:text-white">Consumption Analysis</div>
              
              {/* Consumption Stats */}
              <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-4 mb-6`}>
                <StatCard
                  title="Average Daily Usage"
                  value="2,310 kWh"
                  description="Per day"
                  icon={Activity}
                  color="primary"
                />
                
                <StatCard
                  title="Peak Hour Usage"
                  value="4,500 kWh"
                  description="At 14:00"
                  icon={Activity}
                  color="teal"
                />
                
                <StatCard
                  title="Seasonal Variance"
                  value="41.4%"
                  description="Summer vs. Winter"
                  icon={Activity}
                  color="gold"
                />
              </div>
              
              {/* Hourly Usage Chart */}
              <Card className="p-4 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-lg font-medium mb-4 dark:text-white">24-Hour Usage Pattern</h3>
                <div className="h-[300px] w-full system-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={electricityData.consumptionAnalysis.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="consumption" 
                        name="Consumption (kWh)" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              
              {/* Seasonal Trends Chart */}
              <Card className="p-4 dark:border-gray-700 dark:bg-gray-800 mt-6">
                <h3 className="text-lg font-medium mb-4 dark:text-white">Seasonal Consumption Trends</h3>
                <div className="h-[300px] w-full system-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={electricityData.consumptionAnalysis.seasonalTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="season" fontSize={10} />
                      <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" fontSize={10} />
                      <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={10} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        yAxisId="left" 
                        dataKey="consumption" 
                        name="Consumption (kWh)" 
                        fill="#3B82F6" 
                      />
                      <Bar 
                        yAxisId="right" 
                        dataKey="cost" 
                        name="Cost (OMR)" 
                        fill="#F59E0B" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="facilities" className="space-y-4">
              <div className="text-lg font-medium mb-4 dark:text-white">Facilities Management</div>
              
              {/* Facilities List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700">
                  <h3 className="text-lg font-medium dark:text-white">Facility Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Facility</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Consumption (kWh)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Efficiency (%)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maintenance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {electricityData.facilities.map((facility) => (
                        <tr key={facility.name}>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-2 text-gray-400" />
                              {facility.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{facility.consumption.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                facility.efficiency >= 85 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                facility.efficiency >= 80 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {facility.efficiency}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              facility.maintenance === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                              facility.maintenance === 'Scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                              'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            }`}>
                              {facility.maintenance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Efficiency Chart */}
              <Card className="p-4 dark:border-gray-700 dark:bg-gray-800 mt-6">
                <h3 className="text-lg font-medium mb-4 dark:text-white">Facility Efficiency Comparison</h3>
                <div className="h-[300px] w-full system-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={electricityData.facilities}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[70, 100]} />
                      <YAxis dataKey="name" type="category" width={150} fontSize={10} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="efficiency" 
                        name="Efficiency (%)" 
                        fill="#10B981"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="cost" className="space-y-4">
              <div className="text-lg font-medium mb-4 dark:text-white">Cost Analysis</div>
              
              {/* Cost Stats */}
              <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-4 mb-6`}>
                <StatCard
                  title="Total Annual Cost"
                  value="17,333 OMR"
                  description="For 693,320 kWh"
                  icon={Zap}
                  color="primary"
                />
                
                <StatCard
                  title="Average Monthly Cost"
                  value="1,444 OMR"
                  description="Per month"
                  icon={Zap}
                  color="teal"
                />
                
                <StatCard
                  title="Cost Savings Potential"
                  value="2,600 OMR"
                  description="Estimated annual savings"
                  icon={Lightbulb}
                  color="gold"
                  trend={{ value: 15, isPositive: true }}
                />
              </div>
              
              {/* Monthly Cost Chart */}
              <Card className="p-4 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-lg font-medium mb-4 dark:text-white">Monthly Cost Trend</h3>
                <div className="h-[300px] w-full system-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={electricityData.costAnalysis.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="cost" 
                        name="Cost (OMR)" 
                        stroke="#EF4444" 
                        fill="#EF4444" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              
              {/* Cost Prediction Chart */}
              <Card className="p-4 dark:border-gray-700 dark:bg-gray-800 mt-6">
                <h3 className="text-lg font-medium mb-4 dark:text-white">Cost Prediction vs Actual</h3>
                <div className="h-[300px] w-full system-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={electricityData.costAnalysis.predictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        name="Predicted Cost" 
                        stroke="#3B82F6" 
                        strokeDasharray="5 5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        name="Actual Cost" 
                        stroke="#10B981" 
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ElectricitySystem;

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
