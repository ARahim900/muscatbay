
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, FileSpreadsheet, Calendar, Download, LineChart as LineChartIcon, PieChart as PieChartIcon, BarChart as BarChartIcon, Activity, Clock, Package, Building, Landmark, Wrench, AlertTriangle, Zap, Droplets, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

// Mock data for ALM page
const mockYearlyData = [
  { year: '2021', balance: 52636, contribution: 52636, expenditure: 0 },
  { year: '2022', balance: 106324, contribution: 52899, expenditure: 0 },
  { year: '2023', balance: 161082, contribution: 53163, expenditure: 0 },
  { year: '2024', balance: 216927, contribution: 53429, expenditure: 0 },
  { year: '2025', balance: 273878, contribution: 53696, expenditure: 0 },
  { year: '2026', balance: 331951, contribution: 53965, expenditure: 0 },
  { year: '2027', balance: 391164, contribution: 54235, expenditure: 0 },
  { year: '2028', balance: 451538, contribution: 54506, expenditure: 0 },
  { year: '2029', balance: 513089, contribution: 54778, expenditure: 0 },
  { year: '2030', balance: 559944, contribution: 55052, expenditure: 15893 }
];

const mockZoneBalances = [
  { name: 'Master Community', value: 798352, color: '#4E4456', percentage: 55 },
  { name: 'Typical Buildings', value: 227018, color: '#6D5D7B', percentage: 16 },
  { name: 'Zone 3 (Al Zaha)', value: 63604, color: '#8F7C9B', percentage: 4 },
  { name: 'Zone 5 (Al Nameer)', value: 63581, color: '#AD9BBD', percentage: 4 },
  { name: 'Zone 8 (Al Wajd)', value: 37884, color: '#CBB9DB', percentage: 3 },
  { name: 'Staff Accommodation', value: 273878, color: '#E9D7F5', percentage: 19 }
];

const mockAssetCategories = [
  { name: 'Infrastructure', value: 2000000, color: '#4E4456', percentage: 44 },
  { name: 'MEP Systems', value: 1500000, color: '#6D5D7B', percentage: 33 },
  { name: 'Finishes/Structure', value: 500000, color: '#8F7C9B', percentage: 11 },
  { name: 'Landscaping', value: 500000, color: '#CBB9DB', percentage: 11 }
];

const mockUpcomingReplacements = [
  { component: 'Helipad Electrical Works', location: 'Master Community', year: 2025, cost: 10920 },
  { component: 'Fire Extinguishers', location: 'Typical Buildings', year: 2026, cost: 129 },
  { component: 'Lagoon Infrastructure', location: 'Master Community', year: 2027, cost: 42000 },
  { component: 'Elevator Wire Ropes', location: 'Typical Buildings', year: 2027, cost: 2450 },
  { component: 'External Wall Paint', location: 'Typical Buildings', year: 2028, cost: 1465 },
  { component: 'Tree Uplighters', location: 'Zone 3', year: 2031, cost: 1120 }
];

const ALM = () => {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [yearsToShow, setYearsToShow] = useState(10);
  const [selectedChart, setSelectedChart] = useState('balance');
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [compactView, setCompactView] = useState(false);

  const filteredYearlyData = useMemo(() => mockYearlyData.slice(0, yearsToShow), [yearsToShow]);
  const currentYearData = useMemo(() => mockYearlyData.find(data => data.year === selectedYear) || mockYearlyData[4], [selectedYear]);
  const fundingPercentage = 72;
  const criticalComponents = useMemo(() => mockUpcomingReplacements.filter(item => item.year <= parseInt(selectedYear) + 2).length, [selectedYear]);
  const chartColors = { balance: '#4E4456', contribution: '#6D5D7B', expenditure: '#AD9BBD' };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} transition-colors duration-300`}>
      <header className={`bg-[#4E4456] text-white shadow-lg sticky top-0 z-10 transition-all duration-300 py-4`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <h1 className="font-bold tracking-tight text-xl">Muscat Bay Reserve Fund</h1>
            </div>
            <nav className="hidden md:flex space-x-1 flex-grow justify-center px-4">
              {['Dashboard', 'Calculator', 'Reports', 'Assets'].map((tab) => (
                <button 
                  key={tab} 
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    tab === 'Dashboard' ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`} 
                >
                  {tab}
                </button>
              ))}
            </nav>
            <div className="flex items-center">
              <button className="p-2 rounded-md text-white hover:bg-white/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#4E4456]">Reserve Fund Dashboard</h2>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Year:</span>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[90px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockYearlyData.map(data => (
                    <SelectItem key={data.year} value={data.year}>{data.year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Forecast:</span>
              <Select value={yearsToShow.toString()} onValueChange={(value) => setYearsToShow(parseInt(value))}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Years</SelectItem>
                  <SelectItem value="10">10 Years</SelectItem>
                  <SelectItem value="15">15 Years</SelectItem>
                  <SelectItem value="20">20 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Reserve Balance</p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-bold">OMR</h3>
                  </div>
                  <h3 className="text-3xl font-bold text-[#4E4456]">{currentYearData.balance.toLocaleString()}</h3>
                  <p className="text-xs text-gray-500 mt-1">Projected EOY Balance</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Landmark className="h-6 w-6 text-[#4E4456]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Annual Contribution</p>
                  <div className="flex items-baseline mt-1">
                    <h3 className="text-2xl font-bold">OMR</h3>
                  </div>
                  <h3 className="text-3xl font-bold text-[#4E4456]">{currentYearData.contribution.toLocaleString()}</h3>
                  <p className="text-xs text-gray-500 mt-1">Projected for the year</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-[#4E4456]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Funding Percentage</p>
                  <h3 className="text-3xl font-bold text-[#4E4456] mt-1">{fundingPercentage}%</h3>
                  <p className="text-xs text-gray-500 mt-1">Current funding adequacy</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[#4E4456]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Critical Components</p>
                  <h3 className="text-3xl font-bold text-[#4E4456] mt-1">{criticalComponents}</h3>
                  <p className="text-xs text-gray-500 mt-1">Requiring replacement soon</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-[#4E4456]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Reserve Fund Overview</h3>
              <div className="flex mb-4">
                <button 
                  className={`px-3 py-1 text-sm rounded-md ${selectedChart === 'balance' ? 'bg-[#4E4456] text-white' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setSelectedChart('balance')}
                >
                  Balance
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md ml-2 ${selectedChart === 'contribution' ? 'bg-[#4E4456] text-white' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setSelectedChart('contribution')}
                >
                  Contribution
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md ml-2 ${selectedChart === 'expenditure' ? 'bg-[#4E4456] text-white' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setSelectedChart('expenditure')}
                >
                  Expenditure
                </button>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredYearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {selectedChart === 'balance' && <Line type="monotone" dataKey="balance" stroke={chartColors.balance} activeDot={{ r: 8 }} />}
                    {selectedChart === 'contribution' && <Line type="monotone" dataKey="contribution" stroke={chartColors.contribution} activeDot={{ r: 8 }} />}
                    {selectedChart === 'expenditure' && <Line type="monotone" dataKey="expenditure" stroke={chartColors.expenditure} activeDot={{ r: 8 }} />}
                    {selectedChart === 'all' && (
                      <>
                        <Line type="monotone" dataKey="balance" stroke={chartColors.balance} />
                        <Line type="monotone" dataKey="contribution" stroke={chartColors.contribution} />
                        <Line type="monotone" dataKey="expenditure" stroke={chartColors.expenditure} />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-sm text-gray-500 mt-2">Reserve Balance</div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Fund Distribution by Zone (EOY 2025)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockZoneBalances}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {mockZoneBalances.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString() + ' OMR', '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {mockZoneBalances.map((zone, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: zone.color }}></div>
                    <span className="mr-2">{zone.name}</span>
                    <span className="ml-auto font-medium">OMR {zone.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Asset Categories by Replacement Value</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockAssetCategories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {mockAssetCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString() + ' OMR', '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {mockAssetCategories.map((category, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                    <span className="mr-2">{category.name}</span>
                    <span className="ml-auto font-medium">OMR {(category.value / 1000000).toFixed(1)}M</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Upcoming Component Replacements</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500 uppercase">
                      <th className="pb-2">Component</th>
                      <th className="pb-2">Location</th>
                      <th className="pb-2 text-right">Est. Replace Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUpcomingReplacements.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">{item.component}</td>
                        <td className="py-3">{item.location}</td>
                        <td className="py-3 text-right">{item.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <Button variant="outline" className="bg-[#4E4456] text-white hover:bg-[#6D5D7B] border-none">
                  View All Components
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/water-system" className="block">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-3">
                  <Droplets className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Water System</h3>
                  <p className="text-sm text-gray-500">Manage water assets</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/electricity-system" className="block">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="rounded-full bg-yellow-100 p-3">
                  <Zap className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium">Electricity System</h3>
                  <p className="text-sm text-gray-500">Manage electrical assets</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/reserve-fund-calculator" className="block">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="rounded-full bg-purple-100 p-3">
                  <Calculator className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Reserve Calculator</h3>
                  <p className="text-sm text-gray-500">Calculate asset reserves</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ALM;
