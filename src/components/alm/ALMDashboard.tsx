import React, { useMemo } from 'react';
import { BarChart3, FileSpreadsheet, Calendar, Download, LineChart, PieChart, BarChart, Activity, Clock, Package, Building, Landmark, Wrench, AlertTriangle, Zap, Droplets, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { AssetCategorySummary, AssetLocationSummary, AssetCondition, AssetMaintenance, AssetLifecycleForecast } from '@/types/assets';

// KPI Card Component
export const KpiCard = ({ title, value, description, trend = "neutral", icon, compactView = false, darkMode }) => {
  return (
    <div className={`overflow-hidden shadow-md rounded-lg transform transition-transform hover:scale-[1.02] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`p-5 ${compactView ? 'p-4' : 'p-5'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{title}</h3>
            <div className="mt-1 flex items-baseline">
              <p className={`${compactView ? 'text-xl' : 'text-2xl'} font-semibold ${darkMode ? 'text-white' : 'text-[#4E4456]'}`}>{value}</p>
              {trend && (
                <span className={`ml-2 flex items-center text-xs font-medium ${trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {trend === 'up' ? (
                    <svg className="self-center flex-shrink-0 h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : trend === 'down' ? (
                    <svg className="self-center flex-shrink-0 h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  ) : null}
                </span>
              )}
            </div>
            <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
          </div>
          <div className={`rounded-md p-3 ${darkMode ? 'bg-[#4E4456]/30 text-[#AD9BBD]' : 'bg-[#4E4456]/10 text-[#4E4456]'}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

// Chart Card Component
export const ChartCard = ({ title, children, darkMode }) => {
  return (
    <div className={`overflow-hidden shadow-md rounded-lg transform transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-medium ${darkMode ? 'text-[#AD9BBD]' : 'text-[#4E4456]'}`}>{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

// Global Styles Component
export const GlobalStyles = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const trackColor = isDarkMode ? '#1f2937' : '#f1f1f1';
  const thumbColor = isDarkMode ? '#4b5563' : '#888';
  const thumbHoverColor = isDarkMode ? '#6b7280' : '#555';
  
  return (
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.5s ease-out forwards;
      }
      
      .dark {
        color-scheme: dark;
      }
      
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: ${trackColor};
        border-radius: 10px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: ${thumbColor};
        border-radius: 10px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: ${thumbHoverColor};
      }
    `}</style>
  );
};

// Define ALMDashboard Props Interface
interface ALMDashboardProps {
  summaryStats: {
    totalAssets: number;
    criticalCount: number;
    upcomingMaintenance: number;
    totalReplacementCost: number;
  };
  year: string;
  zone: string;
  category: string;
  activeTab: string;
  darkMode: boolean;
  filteredReplacements: any[];
  assetCategoryData: any[];
  zoneBalancesData: any[];
  reserveFundData: any[];
  handleYearChange: (value: string) => void;
  handleZoneChange: (value: string) => void;
  handleCategoryChange: (value: string) => void;
  handleExport: () => void;
  setActiveTab: (value: string) => void;
  yearOptions: { value: string; label: string }[];
  zoneOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
}

// Default props for the component
const defaultProps: Partial<ALMDashboardProps> = {
  summaryStats: {
    totalAssets: 0,
    criticalCount: 0,
    upcomingMaintenance: 0,
    totalReplacementCost: 0
  },
  year: '2025',
  zone: 'all',
  category: 'all',
  activeTab: 'overview',
  darkMode: false,
  filteredReplacements: [],
  assetCategoryData: [],
  zoneBalancesData: [],
  reserveFundData: [],
  yearOptions: [{ value: '2025', label: '2025' }],
  zoneOptions: [{ value: 'all', label: 'All Zones' }],
  categoryOptions: [{ value: 'all', label: 'All Categories' }],
  handleYearChange: () => {},
  handleZoneChange: () => {},
  handleCategoryChange: () => {},
  handleExport: () => {},
  setActiveTab: () => {}
};

const ALMDashboard: React.FC<ALMDashboardProps> = ({
  summaryStats = defaultProps.summaryStats,
  year = defaultProps.year,
  zone = defaultProps.zone,
  category = defaultProps.category,
  activeTab = defaultProps.activeTab,
  darkMode = defaultProps.darkMode,
  filteredReplacements = defaultProps.filteredReplacements,
  assetCategoryData = defaultProps.assetCategoryData,
  zoneBalancesData = defaultProps.zoneBalancesData,
  reserveFundData = defaultProps.reserveFundData,
  handleYearChange = defaultProps.handleYearChange,
  handleZoneChange = defaultProps.handleZoneChange,
  handleCategoryChange = defaultProps.handleCategoryChange,
  handleExport = defaultProps.handleExport,
  setActiveTab = defaultProps.setActiveTab,
  yearOptions = defaultProps.yearOptions,
  zoneOptions = defaultProps.zoneOptions,
  categoryOptions = defaultProps.categoryOptions
}) => {
  
  return (
    <>
      <GlobalStyles />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center">
          <div className="bg-primary/10 p-2 rounded-lg mr-3">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Asset Lifecycle Management</h1>
            <p className="text-sm text-muted-foreground">Manage and monitor all assets across Muscat Bay</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex space-x-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Year</label>
              <Select value={year} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Zone</label>
              <Select value={zone} onValueChange={handleZoneChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  {zoneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="whitespace-nowrap" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export Data
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue="overview" 
        className="w-full mb-6"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        <div className="mt-2 text-sm text-muted-foreground">
          Showing: {activeTab === "overview" ? "Overview dashboard" : 
                    activeTab === "analysis" ? "Asset performance analysis" :
                    activeTab === "categories" ? "Asset categories breakdown" :
                    activeTab === "zones" ? "Zones breakdown" : "Maintenance schedule"}
        </div>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard 
              title="Total Assets" 
              value={summaryStats.totalAssets.toLocaleString()} 
              description="Total assets under management" 
              icon={<Package className="h-5 w-5" />}
              darkMode={darkMode}
              trend="neutral"
              compactView={false}
            />
            <KpiCard 
              title="Critical Assets" 
              value={summaryStats.criticalCount.toLocaleString()} 
              description="Assets requiring immediate attention" 
              trend="up" 
              icon={<AlertTriangle className="h-5 w-5" />}
              darkMode={darkMode}
              compactView={false}
            />
            <KpiCard 
              title="Upcoming Maintenance" 
              value={summaryStats.upcomingMaintenance.toLocaleString()} 
              description={`Scheduled in ${year}`} 
              icon={<Wrench className="h-5 w-5" />}
              darkMode={darkMode}
              trend="neutral"
              compactView={false}
            />
            <KpiCard 
              title="Total Replacement Value" 
              value={`${Math.round(summaryStats.totalReplacementCost/1000).toLocaleString()} K`} 
              description="Estimated asset replacement cost" 
              icon={<Landmark className="h-5 w-5" />}
              darkMode={darkMode}
              trend="neutral"
              compactView={false}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartCard title="Reserve Fund Projection" darkMode={darkMode}>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={reserveFundData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}K`} />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()} OMR`, ""]} />
                  <Legend />
                  <Line type="monotone" dataKey="balance" name="Balance" stroke="#4E4456" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="contribution" name="Contribution" stroke="#9F7AEA" />
                  <Line type="monotone" dataKey="expenditure" name="Expenditure" stroke="#F56565" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </ChartCard>
          
            <ChartCard title="Asset Allocation by Category" darkMode={darkMode}>
              <div className="flex items-center justify-center h-[300px]">
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart>
                    <Pie
                      data={assetCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {assetCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} OMR`} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Upcoming Asset Replacements" darkMode={darkMode}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Component</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost (OMR)</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReplacements.length > 0 ? (
                    filteredReplacements.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.component}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.cost.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No replacements scheduled for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <ChartCard title="Asset Performance Analysis" darkMode={darkMode}>
              <div className="p-4 text-muted-foreground text-center">
                Detailed asset performance analysis by category and condition
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <ChartCard title="Asset Categories" darkMode={darkMode}>
              <div className="flex items-center justify-center h-[300px]">
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart>
                    <Pie
                      data={assetCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {assetCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} OMR`} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="zones" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <ChartCard title="Zone Allocation" darkMode={darkMode}>
              <div className="flex items-center justify-center h-[300px]">
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart>
                    <Pie
                      data={zoneBalancesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {zoneBalancesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} OMR`} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="maintenance" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <ChartCard title="Maintenance Schedule" darkMode={darkMode}>
              <div className="p-4 text-muted-foreground text-center">
                Scheduled maintenance activities and asset replacement plans
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 my-6">
        <Link to="/water-system" className="group">
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-blue-50 p-3">
                <Droplets className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium group-hover:text-blue-600 transition-colors">Water System</h3>
                <p className="text-xs text-muted-foreground">Manage water distribution assets</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/electricity-system" className="group">
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-amber-50 p-3">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium group-hover:text-amber-600 transition-colors">Electricity System</h3>
                <p className="text-xs text-muted-foreground">Manage electrical distribution assets</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/reserve-fund-calculator" className="group">
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-purple-50 p-3">
                <Calculator className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-medium group-hover:text-purple-600 transition-colors">Reserve Fund Calculator</h3>
                <p className="text-xs text-muted-foreground">Calculate required reserve fund contributions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
};

export default ALMDashboard;
