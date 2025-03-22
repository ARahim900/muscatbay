
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import { Calendar, ChevronDown, Download, Filter, Clock, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import _ from 'lodash';
import ServiceChargeCalculator from '@/components/alm/ServiceChargeCalculator';
import { ServiceChargeData, ExpenseData, ZoneExpenseData, CategoryBreakdown, ExpenseType, MonthlyDistribution } from '@/types/alm';

// Color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];
const ZONE_COLORS: Record<string, string> = {
  'Typical Buildings': '#0088FE',
  'Zone 3 (Al Zaha)': '#00C49F', 
  'Zone 5 (Al Nameer)': '#FFBB28',
  'Zone 8 (Al Wajd)': '#FF8042',
  'Staff Accommodation & CF': '#8884d8',
  'Master Community': '#FF6B6B'
};

// Service charge data
const serviceChargeData: ServiceChargeData = {
  zone3: {
    name: 'Zone 3 (Al Zaha)',
    unitTypes: {
      apartment: { name: 'Apartment', baseRate: 9.00, sizes: [90, 120, 150, 200] },
      villa: { name: 'Villa', baseRate: 6.98, sizes: [200, 250, 300, 350] }
    }
  },
  zone5: {
    name: 'Zone 5 (Al Nameer)',
    unitTypes: {
      villa: { name: 'Villa', baseRate: 6.98, sizes: [280, 320, 380, 420] }
    }
  },
  zone8: {
    name: 'Zone 8 (Al Wajd)',
    unitTypes: {
      villa: { name: 'Villa', baseRate: 6.98, sizes: [300, 350, 400, 450] }
    }
  },
  typical: {
    name: 'Typical Buildings',
    unitTypes: {
      apartment: { name: 'Apartment', baseRate: 9.00, sizes: [75, 100, 125, 150] }
    }
  },
  staff: {
    name: 'Staff Accommodation & CF',
    unitTypes: {
      apartment: { name: 'Staff Apartment', baseRate: 9.00, sizes: [60, 80, 100] }
    }
  }
};

// Sample expense data based on the provided documents
const expenseData: ZoneExpenseData = {
  'Typical Buildings': [
    { year: 2021, expenses: 0 },
    { year: 2022, expenses: 0 },
    { year: 2023, expenses: 1693 },
    { year: 2024, expenses: 0 },
    { year: 2025, expenses: 132 },
    { year: 2026, expenses: 4243 },
    { year: 2027, expenses: 1585 },
    { year: 2028, expenses: 12 },
    { year: 2029, expenses: 1745 },
    { year: 2030, expenses: 9722 },
    { year: 2031, expenses: 0 },
    { year: 2032, expenses: 3755 },
    { year: 2033, expenses: 0 },
    { year: 2034, expenses: 3078 },
    { year: 2035, expenses: 4920 },
    { year: 2036, expenses: 11808 },
    { year: 2037, expenses: 0 },
    { year: 2038, expenses: 10939 },
    { year: 2039, expenses: 0 },
    { year: 2040, expenses: 10615 }
  ],
  'Zone 3 (Al Zaha)': [
    { year: 2021, expenses: 0 },
    { year: 2022, expenses: 0 },
    { year: 2023, expenses: 0 },
    { year: 2024, expenses: 7177 },
    { year: 2025, expenses: 0 },
    { year: 2026, expenses: 2782 },
    { year: 2027, expenses: 29711 },
    { year: 2028, expenses: 0 },
    { year: 2029, expenses: 54399 },
    { year: 2030, expenses: 10837 },
    { year: 2031, expenses: 11510 },
    { year: 2032, expenses: 23123 },
    { year: 2033, expenses: 3628 },
    { year: 2034, expenses: 22975 },
    { year: 2035, expenses: 37284 },
    { year: 2036, expenses: 11990 },
    { year: 2037, expenses: 21356 },
    { year: 2038, expenses: 12701 },
    { year: 2039, expenses: 30584 },
    { year: 2040, expenses: 8035 }
  ],
  'Zone 5 (Al Nameer)': [
    { year: 2021, expenses: 0 },
    { year: 2022, expenses: 9490 },
    { year: 2023, expenses: 0 },
    { year: 2024, expenses: 0 },
    { year: 2025, expenses: 9633 },
    { year: 2026, expenses: 15338 },
    { year: 2027, expenses: 6058 },
    { year: 2028, expenses: 9778 },
    { year: 2029, expenses: 55259 },
    { year: 2030, expenses: 12078 },
    { year: 2031, expenses: 15226 },
    { year: 2032, expenses: 0 },
    { year: 2033, expenses: 68699 },
    { year: 2034, expenses: 54206 },
    { year: 2035, expenses: 17349 },
    { year: 2036, expenses: 12374 },
    { year: 2037, expenses: 7532 },
    { year: 2038, expenses: 0 },
    { year: 2039, expenses: 58085 },
    { year: 2040, expenses: 16447 }
  ],
  'Zone 8 (Al Wajd)': [
    { year: 2021, expenses: 0 },
    { year: 2022, expenses: 0 },
    { year: 2023, expenses: 0 },
    { year: 2024, expenses: 0 },
    { year: 2025, expenses: 0 },
    { year: 2026, expenses: 9423 },
    { year: 2027, expenses: 5238 },
    { year: 2028, expenses: 0 },
    { year: 2029, expenses: 12651 },
    { year: 2030, expenses: 0 },
    { year: 2031, expenses: 15651 },
    { year: 2032, expenses: 5485 },
    { year: 2033, expenses: 38107 },
    { year: 2034, expenses: 20358 },
    { year: 2035, expenses: 5451 },
    { year: 2036, expenses: 5561 },
    { year: 2037, expenses: 11817 },
    { year: 2038, expenses: 2215 },
    { year: 2039, expenses: 13298 },
    { year: 2040, expenses: 10104 }
  ],
  'Staff Accommodation & CF': [
    { year: 2021, expenses: 0 },
    { year: 2022, expenses: 0 },
    { year: 2023, expenses: 0 },
    { year: 2024, expenses: 0 },
    { year: 2025, expenses: 0 },
    { year: 2026, expenses: 0 },
    { year: 2027, expenses: 0 },
    { year: 2028, expenses: 0 },
    { year: 2029, expenses: 0 },
    { year: 2030, expenses: 15893 },
    { year: 2031, expenses: 3888 },
    { year: 2032, expenses: 143581 },
    { year: 2033, expenses: 153062 },
    { year: 2034, expenses: 5072 },
    { year: 2035, expenses: 268275 },
    { year: 2036, expenses: 112647 },
    { year: 2037, expenses: 29474 },
    { year: 2038, expenses: 222075 },
    { year: 2039, expenses: 0 },
    { year: 2040, expenses: 210377 }
  ],
  'Master Community': [
    { year: 2021, expenses: 0 },
    { year: 2022, expenses: 0 },
    { year: 2023, expenses: 0 },
    { year: 2024, expenses: 11140 },
    { year: 2025, expenses: 55958 },
    { year: 2026, expenses: 43276 },
    { year: 2027, expenses: 0 },
    { year: 2028, expenses: 248821 },
    { year: 2029, expenses: 39144 },
    { year: 2030, expenses: 75176 },
    { year: 2031, expenses: 36870 },
    { year: 2032, expenses: 0 },
    { year: 2033, expenses: 1253391 },
    { year: 2034, expenses: 436662 },
    { year: 2035, expenses: 79188 },
    { year: 2036, expenses: 268677 },
    { year: 2037, expenses: 0 },
    { year: 2038, expenses: 573300 },
    { year: 2039, expenses: 293174 },
    { year: 2040, expenses: 24552 }
  ]
};

// Category breakdown based on appendix data
const categoryBreakdown: CategoryBreakdown[] = [
  { name: 'External Lighting', value: 92704 },
  { name: 'Hardscaping', value: 343781 },
  { name: 'Building Components', value: 154376 },
  { name: 'Mechanical Systems', value: 318950 },
  { name: 'Electrical Systems', value: 98640 },
  { name: 'Fire Systems', value: 42580 },
  { name: 'Miscellaneous', value: 62750 }
];

// Expense types
const expenseTypes: ExpenseType[] = [
  { name: 'Replacement', value: 782510 },
  { name: 'Repair', value: 198654 },
  { name: 'Upgrade', value: 87520 },
  { name: 'Refurbish', value: 55097 }
];

// Monthly distribution (sample for visualization)
const monthlyDistribution: MonthlyDistribution[] = [
  { month: 'Jan', value: 12 },
  { month: 'Feb', value: 8 },
  { month: 'Mar', value: 10 },
  { month: 'Apr', value: 15 },
  { month: 'May', value: 18 },
  { month: 'Jun', value: 7 },
  { month: 'Jul', value: 5 },
  { month: 'Aug', value: 4 },
  { month: 'Sep', value: 6 },
  { month: 'Oct', value: 9 },
  { month: 'Nov', value: 7 },
  { month: 'Dec', value: 8 }
];

// Main Dashboard Component
const AssetLifecycle: React.FC = () => {
  const [selectedYearRange, setSelectedYearRange] = useState('2025-2030');
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('analysis');
  
  const [yearFrom, yearTo] = selectedYearRange.split('-').map(Number);
  
  // Calculate total expenses for each zone in the selected range
  const zoneExpensesByYear: Record<string, number> = {};
  const yearList: number[] = [];
  
  for (let year = yearFrom; year <= yearTo; year++) {
    yearList.push(year);
    
    Object.keys(expenseData).forEach(zone => {
      if (!zoneExpensesByYear[zone]) {
        zoneExpensesByYear[zone] = 0;
      }
      
      const yearData = expenseData[zone].find(item => item.year === year);
      if (yearData) {
        zoneExpensesByYear[zone] += yearData.expenses;
      }
    });
  }
  
  // Calculate total expenses per year for all zones
  const totalExpensesByYear = yearList.map(year => {
    const total = Object.keys(expenseData).reduce((sum, zone) => {
      const yearData = expenseData[zone].find(item => item.year === year);
      return sum + (yearData ? yearData.expenses : 0);
    }, 0);
    
    return { year, expenses: total };
  });
  
  // Prepare data for stacked area chart
  const stackedAreaData = yearList.map(year => {
    const yearData: Record<string, any> = { year };
    
    Object.keys(expenseData).forEach(zone => {
      const zoneYearData = expenseData[zone].find(item => item.year === year);
      yearData[zone] = zoneYearData ? zoneYearData.expenses : 0;
    });
    
    return yearData;
  });
  
  // Prepare data for zone comparison chart
  const zoneComparisonData = Object.keys(zoneExpensesByYear).map(zone => ({
    zone,
    expenses: zoneExpensesByYear[zone]
  }));
  
  // Calculate the total expenses in the selected range
  const totalExpenses = Object.values(zoneExpensesByYear).reduce((sum, value) => sum + value, 0);
  
  // Calculate the highest expense year
  const highestExpenseYear = totalExpensesByYear.reduce(
    (max, item) => item.expenses > max.expenses ? item : max, 
    { year: 0, expenses: 0 }
  );
  
  // Calculate the average yearly expense
  const averageYearlyExpense = totalExpenses / yearList.length;
  
  // Filter expense data based on selected zone
  const filteredExpenseData = selectedZone === 'All'
    ? totalExpensesByYear
    : expenseData[selectedZone]
        .filter(item => item.year >= yearFrom && item.year <= yearTo)
        .map(item => ({ year: item.year, expenses: item.expenses }));
        
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-semibold text-gray-800">Asset Lifecycle Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <select 
                className="bg-transparent text-gray-700 focus:outline-none"
                value={selectedYearRange}
                onChange={(e) => setSelectedYearRange(e.target.value)}
              >
                <option value="2021-2025">2021-2025</option>
                <option value="2025-2030">2025-2030</option>
                <option value="2030-2035">2030-2035</option>
                <option value="2035-2040">2035-2040</option>
                <option value="2021-2040">All Years</option>
              </select>
              <ChevronDown className="h-4 w-4 text-gray-500 ml-1" />
            </div>
            <button className="flex items-center bg-orange-50 text-orange-600 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors">
              <Download className="h-5 w-5 mr-2" />
              Export Report
            </button>
          </div>
        </header>
        
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 px-6">
          <nav className="flex space-x-6 overflow-x-auto">
            <button 
              className={`py-4 px-1 font-medium ${activeTab === 'analysis' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('analysis')}
            >
              Analysis
            </button>
            <button 
              className={`py-4 px-1 font-medium ${activeTab === 'comparison' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('comparison')}
            >
              Zone Comparison
            </button>
            <button 
              className={`py-4 px-1 font-medium ${activeTab === 'categories' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('categories')}
            >
              Category Breakdown
            </button>
            <button 
              className={`py-4 px-1 font-medium ${activeTab === 'forecast' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('forecast')}
            >
              Forecast
            </button>
            <button 
              className={`py-4 px-1 font-medium ${activeTab === 'servicecharge' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('servicecharge')}
            >
              Service Charge
            </button>
          </nav>
        </div>
        
        {/* Filter Bar - Hide for service charge tab */}
        {activeTab !== 'servicecharge' && (
          <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing: <span className="font-medium text-gray-700">{selectedZone === 'All' ? 'All Zones' : selectedZone}</span> | <span className="font-medium text-gray-700">{selectedYearRange}</span>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Zone:</span>
                <select 
                  className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                >
                  <option value="All">All Zones</option>
                  {Object.keys(expenseData).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Category:</span>
                <select 
                  className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categoryBreakdown.map(category => (
                    <option key={category.name} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
              <button className="flex items-center border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4 mr-1.5" />
                More Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="p-6">
          {activeTab === 'analysis' && (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
                  <p className="text-gray-500 text-sm">Total Expenses ({selectedYearRange})</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-sm text-gray-500">OMR</span>
                  </p>
                  <p className="text-gray-600 text-sm mt-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {yearList.length} years period
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                  <p className="text-gray-500 text-sm">Average Yearly Expense</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {Math.round(averageYearlyExpense).toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-sm text-gray-500">OMR</span>
                  </p>
                  <p className="text-gray-600 text-sm mt-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Per year average
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                  <p className="text-gray-500 text-sm">Highest Expense Year</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {highestExpenseYear.year} <span className="text-sm text-gray-500">({Math.round(highestExpenseYear.expenses).toLocaleString()} OMR)</span>
                  </p>
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Peak expense year
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                  <p className="text-gray-500 text-sm">Major Expense Category</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {categoryBreakdown.reduce((max, item) => max.value > item.value ? max : item, { name: '', value: 0 }).name}
                  </p>
                  <p className="text-green-600 text-sm mt-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {Math.round(categoryBreakdown.reduce((max, item) => max.value > item.value ? max : item, { name: '', value: 0 }).value).toLocaleString()} OMR total
                  </p>
                </div>
              </div>
              
              {/* Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Expense Trend ({selectedYearRange})</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={filteredExpenseData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => value.toLocaleString()} />
                        <Tooltip 
                          formatter={(value: any) => [`${value.toLocaleString()} OMR`, 'Expenses']}
                          labelFormatter={(label) => `Year: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="expenses" 
                          stroke="#FF8042" 
                          strokeWidth={2}
                          name="Annual Expenses"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Expense Distribution by Zone</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(zoneExpensesByYear).map(([zone, expenses]) => ({ name: zone, value: expenses }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {Object.entries(zoneExpensesByYear).map(([zone, _], index) => (
                            <Cell key={`cell-${index}`} fill={ZONE_COLORS[zone] || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} OMR`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Additional Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Expense Distribution by Category</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryBreakdown}
                        margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                        barSize={40}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                          tickMargin={25}
                        />
                        <YAxis tickFormatter={(value) => value.toLocaleString()} />
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} OMR`} />
                        <Bar 
                          dataKey="value" 
                          name="Expense Amount" 
                          fill="#FF8042"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Expense Types</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseTypes}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={90}
                          paddingAngle={0}
                          dataKey="value"
                          label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {expenseTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} OMR`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Expense Tables */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-800">Expense Details by Year</h2>
                  <button className="text-orange-600 text-sm hover:text-orange-800 transition-colors">Export to Excel</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        {Object.keys(expenseData).map(zone => (
                          <th key={zone} className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {zone}
                          </th>
                        ))}
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {yearList.map((year) => {
                        const yearTotal = Object.keys(expenseData).reduce((sum, zone) => {
                          const yearData = expenseData[zone].find(item => item.year === year);
                          return sum + (yearData ? yearData.expenses : 0);
                        }, 0);
                        
                        return (
                          <tr key={year} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{year}</td>
                            {Object.keys(expenseData).map(zone => {
                              const yearData = expenseData[zone].find(item => item.year === year);
                              const expenses = yearData ? yearData.expenses : 0;
                              
                              return (
                                <td 
                                  key={`${year}-${zone}`} 
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right"
                                >
                                  {expenses > 0 ? expenses.toLocaleString() : '-'}
                                </td>
                              );
                            })}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {yearTotal.toLocaleString()} OMR
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                        {Object.keys(expenseData).map(zone => {
                          const zoneTotal = yearList.reduce((sum, year) => {
                            const yearData = expenseData[zone].find(item => item.year === year);
                            return sum + (yearData ? yearData.expenses : 0);
                          }, 0);
                          
                          return (
                            <td 
                              key={`total-${zone}`} 
                              className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right"
                            >
                              {zoneTotal.toLocaleString()} OMR
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {totalExpenses.toLocaleString()} OMR
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'comparison' && (
            <>
              <div className="grid grid-cols-1 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Zone Comparison ({selectedYearRange})</h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={zoneComparisonData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={60}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="zone" />
                        <YAxis tickFormatter={(value) => value.toLocaleString()} />
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} OMR`} />
                        <Bar 
                          dataKey="expenses" 
                          name="Total Expenses" 
                          radius={[4, 4, 0, 0]}
                        >
                          {zoneComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={ZONE_COLORS[entry.zone] || COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Expense Stacking by Zone</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={stackedAreaData}
                        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => value.toLocaleString()} />
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} OMR`} />
                        <Legend />
                        {Object.keys(expenseData).map((zone, index) => (
                          <Area 
                            key={zone}
                            type="monotone" 
                            dataKey={zone} 
                            stackId="1"
                            stroke={ZONE_COLORS[zone] || COLORS[index % COLORS.length]}
                            fill={ZONE_COLORS[zone] || COLORS[index % COLORS.length]}
                            fillOpacity={0.6}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Zone Expense Distribution</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={zoneComparisonData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="expenses"
                          nameKey="zone"
                          label={({name, percent}) => `${(name as string).split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {zoneComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={ZONE_COLORS[entry.zone] || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} OMR`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Zone Expense Ranking</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expenses</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Yearly Average</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Highest Year</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {zoneComparisonData
                        .sort((a, b) => b.expenses - a.expenses)
                        .map((item, index) => {
                          const highestYearExpense = expenseData[item.zone]
                            .filter(yData => yData.year >= yearFrom && yData.year <= yearTo)
                            .reduce((max, yData) => max.expenses > yData.expenses ? max : yData, { expenses: 0, year: 0 });
                            
                          return (
                            <tr key={item.zone} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ZONE_COLORS[item.zone] || COLORS[index % COLORS.length] }}></div>
                                  <span className="ml-2 text-sm font-medium text-gray-900">{item.zone}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.expenses.toLocaleString()} OMR</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {((item.expenses / totalExpenses) * 100).toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {Math.round(item.expenses / yearList.length).toLocaleString()} OMR
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {highestYearExpense.year > 0 ? 
                                  `${highestYearExpense.year} (${highestYearExpense.expenses.toLocaleString()} OMR)` : 
                                  'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'categories' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Expense by Category</h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryBreakdown}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                        barSize={30}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
                        <YAxis type="category" dataKey="name" width={120} />
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} OMR`} />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="Amount (OMR)" 
                          fill="#8884d8"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Category Distribution</h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} OMR`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Monthly Distribution (Sample)</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyDistribution}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={30}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `${value}%`} />
                        <Bar 
                          dataKey="value" 
                          name="% of Annual Expenses" 
                          fill="#FF8042"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Expense Types</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseTypes}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={120}
                          paddingAngle={0}
                          dataKey="value"
                          nameKey="name"
                          label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {expenseTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} OMR`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Category Analysis</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                        <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Component Count</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Cost per Component</th>
                        <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Work Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        { category: 'External Lighting', total: 92704, percentage: 8.4, count: 532, avgCost: 174, workType: 'Replace' },
                        { category: 'Hardscaping', total: 343781, percentage: 31.2, count: 183, avgCost: 1878, workType: 'Replace' },
                        { category: 'Building Components', total: 154376, percentage: 14.0, count: 97, avgCost: 1591, workType: 'Replace' },
                        { category: 'Mechanical Systems', total: 318950, percentage: 28.9, count: 124, avgCost: 2572, workType: 'Replace' },
                        { category: 'Electrical Systems', total: 98640, percentage: 8.9, count: 218, avgCost: 452, workType: 'Upgrade' },
                        { category: 'Fire Systems', total: 42580, percentage: 3.9, count: 76, avgCost: 560, workType: 'Replace' },
                        { category: 'Miscellaneous', total: 62750, percentage: 5.7, count: 112, avgCost: 560, workType: 'Repair' }
                      ].map((item) => (
                        <tr key={item.category} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.total.toLocaleString()} OMR</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.percentage}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{item.count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.avgCost.toLocaleString()} OMR</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.workType === 'Replace' ? 'bg-blue-100 text-blue-800' :
                                item.workType === 'Repair' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {item.workType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'forecast' && (
            <>
              <div className="grid grid-cols-1 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">20-Year Expense Forecast</h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
                               2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040].map(year => {
                          return {
                            year,
                            expenses: Object.values(expenseData)
                              .flatMap(zoneExpenses => zoneExpenses.filter(item => item.year === year))
                              .reduce((sum, item) => sum + item.expenses, 0),
                            contribution: 260262 * (1 + 0.005) ** (year - 2021)
                          };
                        })}
                        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => value.toLocaleString()} />
                        <Tooltip formatter={(value: any, name) => [
                          `${value.toLocaleString()} OMR`, 
                          name === 'expenses' ? 'Expenses' : 'Annual Contribution'
                        ]} />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="expenses"
                          name="Expenses"
                          stroke="#FF8042" 
                          fill="#FF8042"
                          fillOpacity={0.6}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="contribution"
                          name="Annual Contribution"
                          stroke="#0088FE" 
                          fill="#0088FE"
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">5-Year Expense Windows</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { period: '2021-2025', expenses: 85633 },
                          { period: '2026-2030', expenses: 573642 },
                          { period: '2031-2035', expenses: 2123950 },
                          { period: '2036-2040', expenses: 1638977 }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={60}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(value) => value.toLocaleString()} />
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} OMR`} />
                        <Bar 
                          dataKey="expenses" 
                          name="Total Expenses" 
                          fill="#8884d8"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Component Replacement Cycle</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '0-5 years', value: 154 },
                            { name: '6-10 years', value: 387 },
                            { name: '11-15 years', value: 642 },
                            { name: '16-20 years', value: 245 },
                            { name: '20+ years', value: 132 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {[0, 1, 2, 3, 4].map((index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value} components`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Major Replacement Years</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expense</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Major Components</th>
                        <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Zones Affected</th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total 20yr Expense</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        { year: 2033, expense: 1517579, components: 'Master Community Infra, Staff Accommodation HVAC, Zone 5 Hardscaping', zones: 5, percentage: 34.2 },
                        { year: 2028, expense: 258611, components: 'Master Community Road Network, Zone 3 PCC Paving', zones: 3, percentage: 5.8 },
                        { year: 2035, expense: 407467, components: 'Staff Accommodation MEP, Zone 3 Hardscaping', zones: 4, percentage: 9.2 },
                        { year: 2038, expense: 819230, components: 'Master Community Electrical, Zone 5 Hardscaping', zones: 5, percentage: 18.5 },
                        { year: 2040, expense: 270130, components: 'Staff Accommodation Finishes, Zone 3 & 5 Hardscaping', zones: 4, percentage: 6.1 },
                      ].map((item) => (
                        <tr key={item.year} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.year}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.expense.toLocaleString()} OMR</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.components}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{item.zones}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          
          {/* Service Charge Tab */}
          {activeTab === 'servicecharge' && (
            <div className="mb-8">
              <ServiceChargeCalculator initialData={serviceChargeData} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Service Charge Comparison by Zone</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Base Rate (OMR)</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Charge (150 sqm)</th>
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Charge</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(serviceChargeData).map(([key, zone]) => {
                          const unitType = Object.values(zone.unitTypes)[0];
                          const baseCharge = unitType.baseRate * 150;
                          const vat = baseCharge * 0.05;
                          const totalAnnual = baseCharge + vat;
                          const totalMonthly = totalAnnual / 12;
                          
                          return (
                            <tr key={key} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{zone.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{unitType.baseRate.toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{totalAnnual.toFixed(2)} OMR</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{totalMonthly.toFixed(2)} OMR</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Service Charge Components</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Maintenance', value: 35 },
                            { name: 'Security', value: 18 },
                            { name: 'Utilities', value: 22 },
                            { name: 'Admin & Management', value: 10 },
                            { name: 'Reserve Fund', value: 10 },
                            { name: 'VAT', value: 5 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Service Charge Information</h2>
                <div className="text-sm text-gray-700">
                  <p className="mb-3">
                    The service charge for Muscat Bay properties is calculated based on the unit type, zone, and area. The base rate varies by zone and unit type, with VAT added at 5%.
                  </p>
                  <p className="mb-3">
                    Service charges cover essential community services including maintenance of common areas, security, utilities for common areas, landscaping, and contributions to the reserve fund for future major repairs and replacements.
                  </p>
                  <p className="mb-3">
                    The service charge rates are reviewed annually based on:
                  </p>
                  <ul className="list-disc pl-5 mb-3 space-y-1">
                    <li>Actual expenses from the previous year</li>
                    <li>Projected expenses for the upcoming year</li>
                    <li>Reserve fund study recommendations</li>
                    <li>Market inflation adjustments</li>
                  </ul>
                  <p>
                    For detailed breakdowns or specific queries about your service charge, please contact the Muscat Bay community management office.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AssetLifecycle;
