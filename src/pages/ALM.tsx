import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, FileSpreadsheet, Calendar, Download, LineChart as LineChartIcon, PieChart as PieChartIcon, BarChart as BarChartIcon, Activity, Clock, Package, Building, Landmark, Wrench, AlertTriangle, Zap, Droplets, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

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
  const criticalComponents = useMemo(() => mockUpcomingReplacements.filter(item => parseInt(item.year) <= parseInt(selectedYear) + 2 ).length, [selectedYear]);
  const chartColors = { balance: '#4E4456', contribution: '#6D5D7B', expenditure: '#AD9BBD' };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} flex flex-col transition-colors duration-300`}>
      <header className={`bg-gradient-to-r from-[#4E4456] to-[#6D5D7B] text-white shadow-lg sticky top-0 z-10 transition-all duration-300 ${compactView ? 'py-1' : 'py-3'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <h1 className={`font-bold tracking-tight transition-all duration-300 ${compactView ? 'text-lg' : 'text-xl'}`}>Asset Lifecycle Management</h1>
            </div>
            <nav className="hidden md:flex space-x-1 flex-grow justify-center px-4">
              {['overview', 'analysis', 'categories', 'zones', 'maintenance'].map((tab) => (
                <button 
                  key={tab} 
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`} 
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
            <div className="flex items-center space-x-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px] bg-white/10 border-none text-white">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {mockYearlyData.map(data => (
                    <SelectItem key={data.year} value={data.year}>{data.year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className={`flex-1 container mx-auto px-4 transition-all duration-300 ${compactView ? 'py-3' : 'py-6'} relative`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Assets</p>
                  <h3 className="text-2xl font-bold mt-1">{currentYearData.balance.toLocaleString()}</h3>
                  <p className="text-xs text-gray-500">Across all categories</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Critical Assets</p>
                  <h3 className="text-2xl font-bold mt-1">{criticalComponents}</h3>
                  <p className="text-xs text-gray-500">Require immediate attention</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Maintenance Due</p>
                  <h3 className="text-2xl font-bold mt-1">{currentYearData.expenditure.toLocaleString()}</h3>
                  <p className="text-xs text-gray-500">Scheduled this month</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Asset Health</p>
                  <h3 className="text-2xl font-bold mt-1">{fundingPercentage}%</h3>
                  <p className="text-xs text-gray-500">Overall condition score</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Asset Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockAssetCategories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {mockAssetCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString() + ' OMR', '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Maintenance Forecast</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredYearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="expenditure" stroke={chartColors.expenditure} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Asset Registry</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mockUpcomingReplacements.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{`AST-${index + 1}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.component}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">Infrastructure</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.year === 2025 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.year === 2025 ? 'Critical' : 'Operational'}
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
