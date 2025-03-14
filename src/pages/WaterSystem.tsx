
import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, DropletIcon, DownloadIcon, Filter } from 'lucide-react';
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
  Area
} from 'recharts';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatCard from '@/components/dashboard/StatCard';

// Dummy data for visualization
const waterData = {
  totalConsumption: 481310,
  waterLoss: 102692,
  waterLossPercentage: 21.3,
  payableVolume: 40107,
  payableAmount: 52941.24,
  monthlyAverage: 34379,
  monthlyData: [
    { month: 'Mar-23', Retail: 12000, 'Residential (Villa)': 5500, 'IRR_Services': 3800, 'Residential (Apart)': 4200, MB_Common: 2100, Building: 19000 },
    { month: 'Apr-23', Retail: 10500, 'Residential (Villa)': 5800, 'IRR_Services': 4000, 'Residential (Apart)': 4500, MB_Common: 2300, Building: 11000 },
    { month: 'May-23', Retail: 13500, 'Residential (Villa)': 6000, 'IRR_Services': 4200, 'Residential (Apart)': 4800, MB_Common: 2500, Building: 12000 },
    { month: 'Jun-23', Retail: 11800, 'Residential (Villa)': 5900, 'IRR_Services': 4300, 'Residential (Apart)': 5000, MB_Common: 2700, Building: 14000 },
    { month: 'Jul-23', Retail: 14200, 'Residential (Villa)': 6100, 'IRR_Services': 4500, 'Residential (Apart)': 5200, MB_Common: 2900, Building: 16000 },
    { month: 'Aug-23', Retail: 15000, 'Residential (Villa)': 6200, 'IRR_Services': 4600, 'Residential (Apart)': 5400, MB_Common: 3100, Building: 18000 },
    { month: 'Sep-23', Retail: 13800, 'Residential (Villa)': 6000, 'IRR_Services': 4400, 'Residential (Apart)': 5300, MB_Common: 3000, Building: 17000 },
    { month: 'Oct-23', Retail: 12500, 'Residential (Villa)': 5700, 'IRR_Services': 4100, 'Residential (Apart)': 5100, MB_Common: 2800, Building: 18500 },
    { month: 'Nov-23', Retail: 15500, 'Residential (Villa)': 6300, 'IRR_Services': 4700, 'Residential (Apart)': 5500, MB_Common: 3200, Building: 22000 },
    { month: 'Dec-23', Retail: 18000, 'Residential (Villa)': 6500, 'IRR_Services': 4800, 'Residential (Apart)': 5700, MB_Common: 3300, Building: 24000 },
    { month: 'Jan-24', Retail: 16500, 'Residential (Villa)': 6400, 'IRR_Services': 4700, 'Residential (Apart)': 5600, MB_Common: 3200, Building: 21000 },
    { month: 'Feb-24', Retail: 19000, 'Residential (Villa)': 6600, 'IRR_Services': 4900, 'Residential (Apart)': 5800, MB_Common: 3400, Building: 25000 },
  ],
  pieData: [
    { name: 'Retail', value: 19000, color: '#FF5252' },
    { name: 'Residential (Villa)', value: 6600, color: '#FFC107' },
    { name: 'IRR_Services', value: 4900, color: '#2196F3' },
    { name: 'Residential (Apart)', value: 5800, color: '#4CAF50' },
    { name: 'MB_Common', value: 3400, color: '#9C27B0' },
    { name: 'Building', value: 25000, color: '#FF9800' },
  ]
};

const COLORS = ['#FF5252', '#FFC107', '#2196F3', '#4CAF50', '#9C27B0', '#FF9800'];

const WaterSystem = () => {
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [year, setYear] = useState('All');
  const [month, setMonth] = useState('All');
  
  return (
    <Layout>
      <div className="p-4 max-w-full">
        <div className="flex flex-col space-y-4">
          {/* Header with Title and Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <DropletIcon className="h-6 w-6" />
              </div>
              <h1 className={cn("font-bold text-muscat-primary", isMobile ? "text-xl" : "text-2xl")}>
                Muscat Bay Water System
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Year:</span>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Month:</span>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Jan">Jan</SelectItem>
                      <SelectItem value="Feb">Feb</SelectItem>
                      <SelectItem value="Mar">Mar</SelectItem>
                      <SelectItem value="Apr">Apr</SelectItem>
                      <SelectItem value="May">May</SelectItem>
                      <SelectItem value="Jun">Jun</SelectItem>
                      <SelectItem value="Jul">Jul</SelectItem>
                      <SelectItem value="Aug">Aug</SelectItem>
                      <SelectItem value="Sep">Sep</SelectItem>
                      <SelectItem value="Oct">Oct</SelectItem>
                      <SelectItem value="Nov">Nov</SelectItem>
                      <SelectItem value="Dec">Dec</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <ThemeToggle />
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-4">
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
              <TabsTrigger value="zone-analysis">
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 10V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.04 16.04L14.92 12.72C14.57 11.56 15.53 10.42 16.7 10.57L19.51 10.94C20.29 11.04 20.83 11.79 20.73 12.58L20.36 15.36C20.22 16.54 18.94 17.23 17.85 16.74L16.04 16.04Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Zone Analysis
                </span>
              </TabsTrigger>
              <TabsTrigger value="conservation">
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 9.5C9.5 5.5 9.5 14.5 13.5 10.5C17.5 6.5 17.5 18.5 21.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.5 14.5H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.5 17C9.5 17.9428 9.5 18.4142 9.2071 18.7071C8.9142 19 8.44281 19 7.5 19C6.55719 19 6.0858 19 5.7929 18.7071C5.5 18.4142 5.5 17.9428 5.5 17C5.5 16.0572 5.5 15.5858 5.7929 15.2929C6.0858 15 6.55719 15 7.5 15C8.44281 15 8.9142 15 9.2071 15.2929C9.5 15.5858 9.5 16.0572 9.5 17Z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Conservation
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="text-lg font-medium mb-2">Showing: All Data</div>
              
              {/* Stats Cards */}
              <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-4"} gap-4 mb-6`}>
                <StatCard
                  title="Total Consumption"
                  value={`${waterData.totalConsumption.toLocaleString()}`}
                  description="m³ for All Data"
                  icon={DropletIcon}
                  color="primary"
                />
                
                <StatCard
                  title="Water Loss"
                  value={`${waterData.waterLoss.toLocaleString()}`}
                  description={`${waterData.waterLossPercentage}% of total supply`}
                  icon={DropletIcon}
                  color="teal"
                  trend={{ value: 2.5, isPositive: false }}
                />
                
                <StatCard
                  title="Payable Volume"
                  value={`${waterData.payableVolume.toLocaleString()}`}
                  description={`${waterData.payableAmount.toLocaleString()} OMR`}
                  icon={DropletIcon}
                  color="lavender"
                />
                
                <StatCard
                  title="Monthly Average"
                  value={`${waterData.monthlyAverage.toLocaleString()}`}
                  description="m³ per month"
                  icon={DropletIcon}
                  color="gold"
                />
              </div>
              
              {/* Filter Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-6">
                <div className="mb-2 font-medium flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter by Type
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Retail', 'Residential (Villa)', 'IRR_Services', 'Residential (Apart)', 'MB_Common', 'Building'].map((type, index) => (
                    <div key={type} className="flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${COLORS[index]}20`, color: COLORS[index] }}>
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></span>
                      {type}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Charts */}
              <div className="space-y-6">
                {/* Monthly Trend Chart */}
                <Card className="p-4">
                  <h3 className="text-lg font-medium mb-4">Monthly Consumption Trend</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={waterData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Legend />
                        {['Retail', 'Residential (Villa)', 'IRR_Services', 'Residential (Apart)', 'MB_Common', 'Building'].map((type, index) => (
                          <Line
                            key={type}
                            type="monotone"
                            dataKey={type}
                            stroke={COLORS[index]}
                            activeDot={{ r: 8 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                {/* Pie Chart */}
                <Card className="p-4">
                  <h3 className="text-lg font-medium mb-4">Consumption by Type</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={waterData.pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={isMobile ? 80 : 100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {waterData.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {waterData.pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center text-xs">
                        <div className="w-3 h-3 mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span>{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                
                {/* Composition Chart */}
                <Card className="p-4">
                  <h3 className="text-lg font-medium mb-4">Consumption Composition</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={waterData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Legend />
                        {['Retail', 'Residential (Villa)', 'IRR_Services', 'Residential (Apart)', 'MB_Common', 'Building'].map((type, index) => (
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
            
            <TabsContent value="zone-analysis">
              <div className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">Zone Analysis</h3>
                <p className="text-gray-500">Zone analysis features are coming soon.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="conservation">
              <div className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">Water Conservation</h3>
                <p className="text-gray-500">Conservation features are coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default WaterSystem;

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
