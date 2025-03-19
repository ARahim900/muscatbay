
import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from "recharts";
import { 
  Building, 
  Clock, 
  CalendarDays, 
  Download, 
  Filter, 
  Search, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  BarChart2, 
  ChevronRight, 
  ArrowUpRight, 
  Wrench, 
  Gauge, 
  Home,
  Info,
  FileWarning
} from "lucide-react";
import Layout from '../components/layout/Layout';

// Color palette for the application
const COLORS = {
  primary: "#4E4456",
  primaryLight: "#F3F1F5",
  primaryDark: "#352F3B",
  secondary: "#7A5C8D",
  secondaryLight: "#F5F1F9",
  success: "#557B6E",
  successLight: "#EDF5F2",
  warning: "#AB7D62",
  warningLight: "#F9F3EF",
  danger: "#A25F68",
  dangerLight: "#F8EFF1",
  neutral: "#6B7280",
  neutralLight: "#F9FAFB",
  bgLight: "#F9FAFB",
  bgDark: "#2D2A31",
  textDark: "#111827",
  textLight: "#F9FAFB",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  infrastructure: "#5D5068",
  infrastructureLight: "#F5F3F7",
  electrical: "#7A5C8D", 
  electricalLight: "#F5F1F9",
  hvac: "#8D677A",
  hvacLight: "#F7F2F5",
  doors: "#7D6556",
  doorsLight: "#F6F2F0",
  landscaping: "#557B6E",
  landscapingLight: "#EDF5F2"
};

// Sample data based on the provided documents
const assetCategories = [
  { name: "Infrastructure", value: 437000, count: 13, color: COLORS.infrastructure },
  { name: "Electrical Systems", value: 2228, count: 15, color: COLORS.electrical },
  { name: "HVAC", value: 130000, count: 18, color: COLORS.hvac },
  { name: "Doors", value: 286000, count: 572, color: COLORS.doors },
  { name: "Landscaping", value: 55000, count: 16, color: COLORS.landscaping }
];

const financialProjections = [
  { year: 2021, balance: 52636, contribution: 52636, expenditure: 0 },
  { year: 2022, balance: 105535, contribution: 52899, expenditure: 0 },
  { year: 2023, balance: 158698, contribution: 53163, expenditure: 0 },
  { year: 2024, balance: 212127, contribution: 53429, expenditure: 0 },
  { year: 2025, balance: 215823, contribution: 53696, expenditure: 50000 },
  { year: 2026, balance: 269789, contribution: 53966, expenditure: 0 },
  { year: 2027, balance: 324025, contribution: 54236, expenditure: 0 },
  { year: 2028, balance: 378532, contribution: 54507, expenditure: 0 },
  { year: 2029, balance: 433312, contribution: 54780, expenditure: 0 },
  { year: 2030, balance: 487490, contribution: 55054, expenditure: 876 },
  { year: 2031, balance: 542820, contribution: 55330, expenditure: 0 },
  { year: 2032, balance: 598427, contribution: 55607, expenditure: 0 },
  { year: 2033, balance: 534312, contribution: 55885, expenditure: 120000 },
  { year: 2034, balance: 590477, contribution: 56165, expenditure: 0 },
  { year: 2035, balance: 646847, contribution: 56446, expenditure: 174 },
  { year: 2036, balance: 317575, contribution: 56728, expenditure: 386000 },
  { year: 2037, balance: 374587, contribution: 57012, expenditure: 0 },
  { year: 2038, balance: 431884, contribution: 57297, expenditure: 0 },
  { year: 2039, balance: 454467, contribution: 57583, expenditure: 35000 },
  { year: 2040, balance: 532482, contribution: 57871, expenditure: 20356 }
];

const criticalAssets = [
  { 
    id: 1, 
    name: "Lagoon - Infra", 
    type: "Replace", 
    nextScheduledYear: 2025, 
    cost: 50000, 
    location: "Master Community",
    remainingLife: 0,
    category: "Infrastructure",
    status: "Critical"
  },
  { 
    id: 2, 
    name: "Fire Rated Wooden Doors", 
    type: "Replace", 
    nextScheduledYear: 2036, 
    cost: 206000, 
    location: "Staff Accommodation",
    remainingLife: 11,
    category: "Doors",
    status: "Monitor"
  },
  { 
    id: 3, 
    name: "Chillers (Type 1)", 
    type: "Replace", 
    nextScheduledYear: 2036, 
    cost: 85000, 
    location: "Staff Accommodation",
    remainingLife: 11,
    category: "HVAC",
    status: "Monitor"
  },
  { 
    id: 4, 
    name: "Helipad Civil Works", 
    type: "Replace", 
    nextScheduledYear: 2033, 
    cost: 100000, 
    location: "Master Community",
    remainingLife: 8,
    category: "Infrastructure",
    status: "Monitor"
  },
  { 
    id: 5, 
    name: "Air Handling Units", 
    type: "Replace", 
    nextScheduledYear: 2036, 
    cost: 45000, 
    location: "Staff Accommodation",
    remainingLife: 11,
    category: "HVAC",
    status: "Monitor"
  }
];

const maintenanceSchedule = [
  {
    id: 1,
    asset: "Lagoon - Infra",
    date: "2025-04-15",
    type: "Replace",
    estimatedDuration: "14 days",
    cost: 50000,
    status: "Scheduled",
    location: "Master Community",
    category: "Infrastructure"
  },
  {
    id: 2,
    asset: "Internal & External Lighting",
    date: "2030-06-10",
    type: "Replace",
    estimatedDuration: "7 days",
    cost: 876,
    status: "Future",
    location: "Typical Buildings",
    category: "Electrical Systems"
  },
  {
    id: 3,
    asset: "Helipad Civil Works",
    date: "2033-09-01",
    type: "Replace",
    estimatedDuration: "30 days",
    cost: 100000,
    status: "Future",
    location: "Master Community",
    category: "Infrastructure"
  },
  {
    id: 4,
    asset: "Standby Generator",
    date: "2035-03-15",
    type: "Upgrade",
    estimatedDuration: "2 days",
    cost: 174,
    status: "Future",
    location: "Typical Buildings",
    category: "Electrical Systems"
  },
  {
    id: 5,
    asset: "Fire Rated Wooden Doors",
    date: "2036-05-01",
    type: "Replace",
    estimatedDuration: "21 days",
    cost: 206000,
    status: "Future",
    location: "Staff Accommodation",
    category: "Doors"
  }
];

// Define proper TypeScript interfaces for component props
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { type: string; value: string };
  suffix?: string;
  color: string;
  bgColor?: string;
}

// Metric Card Component
const MetricCard = ({ title, value, icon, trend, suffix, color, bgColor }: MetricCardProps) => {
  return (
    <div 
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md" 
      style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-base font-normal text-gray-500 ml-1">{suffix}</span>}
          </h3>
          {trend && (
            <p className={`text-xs mt-1.5 flex items-center font-medium ${trend.type === 'increase' ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.type === 'increase' ? 
                <ArrowUpRight size={12} className="mr-1" /> : 
                <ArrowUpRight size={12} className="mr-1 rotate-180" />
              }
              {trend.value}%
            </p>
          )}
        </div>
        <div 
          className="p-2.5 rounded-full" 
          style={{ backgroundColor: bgColor || `${color}20` }}
        >
          {React.cloneElement(icon as React.ReactElement, { size: 18, color: color })}
        </div>
      </div>
    </div>
  );
};

interface BadgeProps {
  text: string;
  color: string;
  bgColor?: string;
}

// Badge Component
const Badge = ({ text, color, bgColor }: BadgeProps) => {
  return (
    <span 
      className="px-2.5 py-1 text-xs font-medium rounded-full"
      style={{ backgroundColor: bgColor || `${color}20`, color: color }}
    >
      {text}
    </span>
  );
};

// Tab Component
const Tab = ({ active, label, onClick }) => {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        active 
          ? `text-gray-900 hover:opacity-90` 
          : `text-gray-600 hover:text-gray-900 hover:bg-gray-100`
      }`}
      style={active ? { backgroundColor: `${COLORS.primary}20` } : {}}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

// Filter Pill Component
const FilterPill = ({ label, active, onClick, color = COLORS.primary }) => {
  return (
    <button
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center ${
        active 
          ? `text-${color}` 
          : `bg-gray-100 text-gray-600 hover:bg-gray-200`
      }`}
      style={{ 
        backgroundColor: active ? `${color}15` : '',
        color: active ? color : '' 
      }}
      onClick={onClick}
    >
      {active && (
        <span 
          className="w-2 h-2 rounded-full mr-1.5"
          style={{ backgroundColor: color }}
        ></span>
      )}
      {label}
    </button>
  );
};

// Main Asset Lifecycle Management Component
const AssetLifecycleManagement = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedYear, setSelectedYear] = useState<number | "all">(2025);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  
  // Calculate total metrics
  const totalAssetCount = assetCategories.reduce((sum, category) => sum + category.count, 0);
  const totalAssetValue = assetCategories.reduce((sum, category) => sum + category.value, 0);
  const totalExpenditures = financialProjections.reduce((sum, year) => sum + year.expenditure, 0);
  const criticalAssetsCount = criticalAssets.filter(asset => asset.status === "Critical").length;
  
  // Find peak expenditure year
  const peakExpenditure = [...financialProjections].sort((a, b) => b.expenditure - a.expenditure)[0];
  
  // Get assets that need immediate attention (remaining life ≤ 2 years)
  const urgentAssets = criticalAssets.filter(asset => asset.remainingLife <= 2);
  
  // Filter maintenance schedule based on selections
  const filteredMaintenance = maintenanceSchedule.filter(item => {
    const itemYear = new Date(item.date).getFullYear();
    const matchesYear = selectedYear === "all" || itemYear === selectedYear;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesLocation = selectedLocation === "all" || item.location === selectedLocation;
    return matchesYear && matchesCategory && matchesLocation;
  });
  
  // Calculate lifecycle distribution data
  const lifecycleDistribution = [
    { range: "0-1 years", count: criticalAssets.filter(a => a.remainingLife <= 1).length, value: 50000, color: COLORS.danger },
    { range: "2-5 years", count: criticalAssets.filter(a => a.remainingLife > 1 && a.remainingLife <= 5).length, value: 0, color: COLORS.warning },
    { range: "6-10 years", count: criticalAssets.filter(a => a.remainingLife > 5 && a.remainingLife <= 10).length, value: 100000, color: COLORS.secondary },
    { range: "11-15 years", count: criticalAssets.filter(a => a.remainingLife > 10).length, value: 336000, color: COLORS.primary }
  ];
  
  // Generate locations list from data
  const locations = ["Master Community", "Staff Accommodation", "Typical Buildings", "Zone 3 (Al Zaha)", "Zone 5 (Al Nameer)", "Zone 8 (Al Wajd)"];
  
  return (
    <Layout>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <Clock size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Asset Lifecycle Management</h1>
                <p className="text-sm text-gray-500">Track, manage, and maintain your assets throughout their lifecycle</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <select 
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedYear.toString()}
                  onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                >
                  <option value="all">All Years</option>
                  {financialProjections.map(item => (
                    <option key={item.year} value={item.year}>{item.year}</option>
                  ))}
                </select>
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </header>
        
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-2">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Tab 
              active={activeTab === "overview"} 
              label="Overview" 
              onClick={() => setActiveTab("overview")}
            />
            <Tab 
              active={activeTab === "analysis"} 
              label="Analysis" 
              onClick={() => setActiveTab("analysis")}
            />
            <Tab 
              active={activeTab === "types"} 
              label="Asset Types" 
              onClick={() => setActiveTab("types")}
            />
            <Tab 
              active={activeTab === "schedule"} 
              label="Schedule" 
              onClick={() => setActiveTab("schedule")}
            />
            <Tab 
              active={activeTab === "financial"} 
              label="Financial" 
              onClick={() => setActiveTab("financial")}
            />
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Selection indicator - updates dynamically based on filters */}
        <div className="mb-4 text-sm text-gray-500">
            Showing: {selectedYear === "all" ? "All years" : `Year ${selectedYear}`} {selectedCategory !== "all" ? ` | ${selectedCategory}` : ""} {selectedLocation !== "all" ? ` | ${selectedLocation}` : ""}
          </div>
          
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                  title="Total Assets" 
                  value={totalAssetCount} 
                  icon={<Building />} 
                  color={COLORS.primary}
                />
                <MetricCard 
                  title="Asset Value" 
                  value={totalAssetValue} 
                  suffix="OMR" 
                  icon={<DollarSign />} 
                  color={COLORS.secondary}
                />
                <MetricCard 
                  title="Critical Assets" 
                  value={criticalAssetsCount} 
                  icon={<AlertTriangle />} 
                  color={COLORS.danger}
                />
                <MetricCard 
                  title="Peak Expenditure" 
                  value={peakExpenditure.expenditure} 
                  suffix="OMR" 
                  icon={<BarChart2 />}
                  trend={{ type: 'increase', value: '28' }}
                  color={COLORS.warning}
                />
              </div>
              
              {/* Main Content - 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Asset Lifecycle Timeline */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Asset Lifecycle Timeline</h3>
                      <div className="flex space-x-2">
                        <FilterPill label="All" active={selectedYear === "all"} onClick={() => setSelectedYear("all")} />
                        <FilterPill label="2025" active={selectedYear === 2025} onClick={() => setSelectedYear(2025)} color={COLORS.warning} />
                        <FilterPill label="2033" active={selectedYear === 2033} onClick={() => setSelectedYear(2033)} />
                        <FilterPill label="2036" active={selectedYear === 2036} onClick={() => setSelectedYear(2036)} />
                      </div>
                    </div>
                    
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={financialProjections.filter(year => year.expenditure > 0)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="year" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <YAxis 
                          tickFormatter={(value) => value >= 1000 ? `${Math.round(value/1000)}k` : value}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(value) => [`${value.toLocaleString()} OMR`, 'Planned Expenditure']}
                          labelFormatter={(value) => `Year ${value}`}
                          contentStyle={{
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                        <Bar 
                          dataKey="expenditure" 
                          fill={COLORS.primary} 
                          radius={[4, 4, 0, 0]}
                          barSize={40}
                        >
                          {financialProjections.filter(year => year.expenditure > 0).map((entry, index) => {
                            let color = COLORS.primary;
                            if (entry.expenditure > 300000) color = COLORS.danger;
                            else if (entry.expenditure > 100000) color = COLORS.warning;
                            else if (entry.expenditure > 50000) color = COLORS.secondary;
                            
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Asset Category Distribution */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Asset Category Distribution</h3>
                      <div className="flex space-x-2">
                        <FilterPill label="All" active={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} />
                        <FilterPill 
                          label="Infrastructure" 
                          active={selectedCategory === "Infrastructure"} 
                          onClick={() => setSelectedCategory("Infrastructure")}
                          color={COLORS.infrastructure}
                        />
                        <FilterPill 
                          label="HVAC" 
                          active={selectedCategory === "HVAC"} 
                          onClick={() => setSelectedCategory("HVAC")}
                          color={COLORS.hvac}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Pie Chart */}
                      <div>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={assetCategories}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={90}
                              dataKey="value"
                              paddingAngle={2}
                            >
                              {assetCategories.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.color} 
                                  stroke="none"
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value.toLocaleString()} OMR`]}
                              contentStyle={{
                                borderRadius: '8px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                border: 'none'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Category List */}
                      <div className="space-y-4 flex flex-col justify-center">
                        {assetCategories.map((category, index) => (
                          <div key={index} className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-3" 
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">{category.name}</span>
                                <span className="text-sm font-medium text-gray-700">{category.value.toLocaleString()} OMR</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div 
                                  className="h-1.5 rounded-full" 
                                  style={{ 
                                    width: `${(category.value / totalAssetValue) * 100}%`,
                                    backgroundColor: category.color 
                                  }}
                                ></div>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {category.count} assets ({Math.round((category.value / totalAssetValue) * 100)}%)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column (1/3 width) */}
                <div className="space-y-6">
                  {/* Critical Assets Panel */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Critical Assets</h3>
                      <button 
                        className="text-sm font-medium flex items-center hover:opacity-80"
                        style={{ color: COLORS.primary }}
                      >
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {urgentAssets.map((asset) => (
                        <div 
                          key={asset.id} 
                          className={`p-4 rounded-lg border ${
                            asset.remainingLife === 0 
                              ? 'bg-red-50 border-red-100' 
                              : 'bg-amber-50 border-amber-100'
                          }`}
                        >
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 flex items-center">
                                {asset.name}
                                {asset.remainingLife === 0 && (
                                  <AlertTriangle size={14} className="ml-1.5 text-red-500" />
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {asset.category} | {asset.location}
                              </p>
                            </div>
                            <Badge 
                              text={`${asset.cost.toLocaleString()} OMR`} 
                              color={COLORS.secondary}
                            />
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center">
                              <CalendarDays size={14} className="mr-1.5 text-gray-500" />
                              <span className="text-xs text-gray-600">
                                {asset.nextScheduledYear}
                              </span>
                            </div>
                            <Badge 
                              text={asset.remainingLife === 0 ? 'Due now' : `${asset.remainingLife} years remaining`} 
                              color={asset.remainingLife === 0 ? COLORS.danger : COLORS.warning}
                            />
                          </div>
                        </div>
                      ))}
                      
                      {urgentAssets.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          No critical assets requiring immediate attention
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Lifecycle Distribution */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Remaining Life Distribution</h3>
                    
                    <div className="space-y-4">
                      {lifecycleDistribution.map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {item.range}
                            </span>
                            <span className="text-sm font-medium" style={{ color: item.color }}>
                              {item.count} assets
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${(item.count / totalAssetCount) * 100}%`,
                                  backgroundColor: item.color 
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 w-12 text-right">
                              {Math.round((item.count / totalAssetCount) * 100)}%
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {item.value > 0 ? `${item.value.toLocaleString()} OMR planned` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Financial Insights */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Insights</h3>
                    
                    <div className="space-y-4">
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Peak expenditure:</span>
                          <span className="text-sm font-medium text-indigo-700">
                            {peakExpenditure.year} ({peakExpenditure.expenditure.toLocaleString()} OMR)
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">2040 projected balance:</span>
                          <span className="text-sm font-medium text-green-700">
                            {financialProjections[financialProjections.length - 1].balance.toLocaleString()} OMR
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Annual contribution growth:</span>
                          <span className="text-sm font-medium text-purple-700">0.5%</span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Total planned expenditure:</span>
                          <span className="text-sm font-medium text-orange-700">
                            {totalExpenditures.toLocaleString()} OMR
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Analysis Tab */}
          {activeTab === "analysis" && (
            <div className="space-y-6">
              {/* Filter Pills */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center mr-2">
                    <Filter size={16} className="mr-1.5 text-gray-500" />
                    Filter by:
                  </span>
                  
                  <FilterPill label="All Categories" active={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} />
                  <FilterPill 
                    label="Infrastructure" 
                    active={selectedCategory === "Infrastructure"} 
                    onClick={() => setSelectedCategory("Infrastructure")}
                    color={COLORS.infrastructure}
                  />
                  <FilterPill 
                    label="Electrical" 
                    active={selectedCategory === "Electrical Systems"} 
                    onClick={() => setSelectedCategory("Electrical Systems")}
                    color={COLORS.electrical}
                  />
                  <FilterPill 
                    label="HVAC" 
                    active={selectedCategory === "HVAC"} 
                    onClick={() => setSelectedCategory("HVAC")}
                    color={COLORS.hvac}
                  />
                  <FilterPill 
                    label="Doors" 
                    active={selectedCategory === "Doors"} 
                    onClick={() => setSelectedCategory("Doors")}
                    color={COLORS.doors}
                  />
                  <FilterPill 
                    label="Landscaping" 
                    active={selectedCategory === "Landscaping"} 
                    onClick={() => setSelectedCategory("Landscaping")}
                    color={COLORS.landscaping}
                  />
                </div>
              </div>
              
              {/* Lifecycle Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Asset Lifecycle Timeline</h3>
                
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart
                    data={financialProjections}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(value) => value >= 1000 ? `${Math.round(value/1000)}k` : value}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => value >= 1000 ? `${Math.round(value/1000)}k` : value}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "expenditure") return [`${value.toLocaleString()} OMR`, "Planned Expenditure"];
                        if (name === "balance") return [`${value.toLocaleString()} OMR`, "Reserve Balance"];
                        return [`${value.toLocaleString()} OMR`, name];
                      }}
                      labelFormatter={(value) => `Year ${value}`}
                      contentStyle={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        border: 'none'
                      }}
                    />
                    <Legend />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="balance" 
                      name="Reserve Balance" 
                      stroke={COLORS.primary} 
                      fillOpacity={1}
                      fill="url(#colorBalance)"
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="expenditure" 
                      name="Planned Expenditure" 
                      fill={COLORS.danger} 
                      barSize={20}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Asset Health Analysis */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Asset Health Analysis</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Critical Assets by Category */}
                  <div className="p-5 border border-gray-200 rounded-lg">
                    <h4 className="text-base font-medium text-gray-800 mb-4">Critical Assets by Category</h4>
                    
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Infrastructure", value: 2, color: COLORS.infrastructure },
                            { name: "Electrical", value: 0, color: COLORS.electrical },
                            { name: "HVAC", value: 0, color: COLORS.hvac },
                            { name: "Doors", value: 0, color: COLORS.doors },
                            { name: "Landscaping", value: 0, color: COLORS.landscaping }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {[
                            { name: "Infrastructure", value: 2, color: COLORS.infrastructure },
                            { name: "Electrical", value: 0, color: COLORS.electrical },
                            { name: "HVAC", value: 0, color: COLORS.hvac },
                            { name: "Doors", value: 0, color: COLORS.doors },
                            { name: "Landscaping", value: 0, color: COLORS.landscaping }
                          ].map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} assets`]}
                          contentStyle={{
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Asset Condition Distribution */}
                  <div className="p-5 border border-gray-200 rounded-lg">
                    <h4 className="text-base font-medium text-gray-800 mb-4">Asset Condition Distribution</h4>
                    
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={[
                          { condition: "Excellent", count: 35, color: COLORS.success },
                          { condition: "Good", count: 42, color: COLORS.primary },
                          { condition: "Fair", count: 12, color: COLORS.warning },
                          { condition: "Poor", count: 7, color: COLORS.danger },
                          { condition: "Critical", count: 2, color: COLORS.danger }
                        ]}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 50, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="condition" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(value) => [`${value} assets`]}
                          contentStyle={{
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                        <Bar 
                          dataKey="count"
                          radius={[0, 4, 4, 0]}
                        >
                          {[
                            { condition: "Excellent", count: 35, color: COLORS.success },
                            { condition: "Good", count: 42, color: COLORS.primary },
                            { condition: "Fair", count: 12, color: COLORS.warning },
                            { condition: "Poor", count: 7, color: COLORS.danger },
                            { condition: "Critical", count: 2, color: COLORS.danger }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Asset Cost Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Asset Cost Distribution</h3>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={assetCategories}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => value >= 1000 ? `${Math.round(value/1000)}k` : value}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${value.toLocaleString()} OMR`]}
                      contentStyle={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        border: 'none'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      name="Asset Value" 
                      radius={[4, 4, 0, 0]}
                      barSize={50}
                    >
                      {assetCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* Schedule Tab */}
          {activeTab === "schedule" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 flex items-center mr-2">
                    <Filter size={16} className="mr-1.5 text-gray-500" />
                    Filter by:
                  </span>
                  
                  <div>
                    <select 
                      className="text-sm border-gray-300 rounded-lg"
                      value={selectedYear.toString()}
                      onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                    >
                      <option value="all">All Years</option>
                      {financialProjections.map(item => (
                        <option key={item.year} value={item.year}>{item.year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <select 
                      className="text-sm border-gray-300 rounded-lg"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {assetCategories.map(category => (
                        <option key={category.name} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <select 
                      className="text-sm border-gray-300 rounded-lg"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <option value="all">All Locations</option>
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="ml-auto">
                    <span className="text-sm text-gray-500">
                      Showing {filteredMaintenance.length} of {maintenanceSchedule.length} items
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Maintenance Schedule Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMaintenance.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
                                style={{ 
                                  backgroundColor: 
                                    item.category === "Infrastructure" ? COLORS.infrastructureLight : 
                                    item.category === "Electrical Systems" ? COLORS.electricalLight :
                                    item.category === "HVAC" ? COLORS.hvacLight :
                                    item.category === "Doors" ? COLORS.doorsLight :
                                    COLORS.landscapingLight
                                }}
                              >
                                <Wrench 
                                  size={16} 
                                  style={{ 
                                    color: 
                                      item.category === "Infrastructure" ? COLORS.infrastructure : 
                                      item.category === "Electrical Systems" ? COLORS.electrical :
                                      item.category === "HVAC" ? COLORS.hvac :
                                      item.category === "Doors" ? COLORS.doors :
                                      COLORS.landscaping
                                  }} 
                                />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{item.asset}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              text={item.type} 
                              color={COLORS.secondary}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.estimatedDuration}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {item.cost.toLocaleString()} OMR
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredMaintenance.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                      <FileWarning className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                      <p>No maintenance items match your current filters</p>
                      <button 
                        className="mt-2 text-sm font-medium hover:opacity-80"
                        style={{ color: COLORS.primary }}
                        onClick={() => {
                          setSelectedYear("all");
                          setSelectedCategory("all");
                          setSelectedLocation("all");
                        }}
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Schedule Distribution Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Schedule Distribution by Year</h3>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { year: 2025, count: 1, value: 50000 },
                      { year: 2030, count: 1, value: 876 },
                      { year: 2033, count: 1, value: 100000 },
                      { year: 2035, count: 1, value: 174 },
                      { year: 2036, count: 3, value: 336000 },
                      { year: 2039, count: 1, value: 35000 },
                      { year: 2040, count: 2, value: 20356 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(value) => value >= 1000 ? `${Math.round(value/1000)}k` : value}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => value}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "value") return [`${value.toLocaleString()} OMR`, "Total Cost"];
                        return [`${value} items`, "Scheduled Items"];
                      }}
                      labelFormatter={(value) => `Year ${value}`}
                      contentStyle={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        border: 'none'
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="value" 
                      fill={COLORS.primary} 
                      name="Total Cost"
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="count"
                      name="Scheduled Items"
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* Financial Tab */}
          {activeTab === "financial" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                  title="2025 Opening Balance" 
                  value={financialProjections.find(item => item.year === 2025)?.balance} 
                  suffix="OMR" 
                  icon={<DollarSign />} 
                  color={COLORS.primary}
                  trend={undefined}
                />
                <MetricCard 
                  title="Total Planned Expenditure" 
                  value={totalExpenditures} 
                  suffix="OMR" 
                  icon={<BarChart2 />} 
                  color={COLORS.danger}
                  trend={undefined}
                />
                <MetricCard 
                  title="Annual Contribution (2025)" 
                  value={financialProjections.find(item => item.year === 2025)?.contribution} 
                  suffix="OMR" 
                  icon={<DollarSign />} 
                  color={COLORS.success}
                  trend={undefined}
                />
                <MetricCard 
                  title="2040 Projected Balance" 
                  value={financialProjections[financialProjections.length - 1].balance} 
                  suffix="OMR" 
                  icon={<Gauge />} 
                  color={COLORS.secondary}
                  trend={undefined}
                />
              </div>
              
              {/* 20-Year Financial Projection */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">20-Year Financial Projection</h3>
                  <p className="text-sm text-gray-500 mt-1">Reserve fund balance, contributions and expenditures</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Contribution</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expenditure</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reserve Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {financialProjections.map((item, index) => (
                        <tr 
                          key={item.year} 
                          className={selectedYear !== "all" && item.year === selectedYear ? 'bg-indigo-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${selectedYear !== "all" && item.year === selectedYear ? 'text-indigo-700' : 'text-gray-900'}`}>
                              {item.year}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {index === 0 ? '0' : financialProjections[index - 1].balance.toLocaleString()} OMR
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {item.contribution.toLocaleString()} OMR
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${item.expenditure > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {item.expenditure > 0 ? `${item.expenditure.toLocaleString()} OMR` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-900">
                            {item.balance.toLocaleString()} OMR
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Financial Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reserve Fund Balance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Reserve Fund Balance Projection</h3>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={financialProjections}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorFundBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value >= 1000 ? `${Math.round(value/1000)}k` : value}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`${value.toLocaleString()} OMR`]}
                        labelFormatter={(value) => `Year ${value}`}
                        contentStyle={{
                          borderRadius: '8px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                          border: 'none'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        name="Reserve Balance" 
                        stroke={COLORS.primary} 
                        fillOpacity={1}
                        fill="url(#colorFundBalance)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Annual Expenditure */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Annual Expenditure</h3>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={financialProjections.filter(item => item.expenditure > 0)}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value >= 1000 ? `${Math.round(value/1000)}k` : value}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`${value.toLocaleString()} OMR`]}
                        labelFormatter={(value) => `Year ${value}`}
                        contentStyle={{
                          borderRadius: '8px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                          border: 'none'
                        }}
                      />
                      <Bar 
                        dataKey="expenditure" 
                        name="Expenditure" 
                        fill={COLORS.danger} 
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Financial Parameters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-3">Growth & Inflation</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Contribution Growth Rate:</span>
                        <span className="text-sm font-medium text-gray-900">0.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Inflation Rate:</span>
                        <span className="text-sm font-medium text-gray-900">0.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Interest Rate:</span>
                        <span className="text-sm font-medium text-gray-900">1.5%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-3">Fund Health</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Percentage Funded:</span>
                        <span className="text-sm font-medium text-gray-900">100%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Minimum Balance:</span>
                        <span className="text-sm font-medium text-gray-900">103,180 OMR</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">VAT:</span>
                        <span className="text-sm font-medium text-gray-900">5.0%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-3">Other Parameters</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Contingency:</span>
                        <span className="text-sm font-medium text-gray-900">5.0%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Financial Year End:</span>
                        <span className="text-sm font-medium text-gray-900">December 31</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Update:</span>
                        <span className="text-sm font-medium text-gray-900">March 31, 2021</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Important Alert */}
                <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-100 flex">
                  <div className="flex-shrink-0 mr-3">
                    <Info size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Financial Alert</h4>
                    <p className="text-sm text-yellow-700">
                      Major expenditure of 386,000 OMR anticipated in 2036 for large-scale replacements including Fire Rated Wooden Doors (206,000 OMR), Chillers (85,000 OMR), and Air Handling Units (45,000 OMR).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Asset Types Tab */}
          {activeTab === "types" && (
            <div className="space-y-6">
              {/* Asset Categories Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {assetCategories.map((category, index) => (
                  <div 
                    key={index} 
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md cursor-pointer ${
                      selectedCategory === category.name ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={{ 
                      borderLeftColor: category.color, 
                      borderLeftWidth: '4px',
                      ...(selectedCategory === category.name ? { ringColor: category.color } : {})
                    }}
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.name ? "all" : category.name
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center" 
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Building size={18} style={{ color: category.color }} />
                      </div>
                      <Badge 
                        text={`${category.count} assets`} 
                        color={category.color}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                    <p className="text-2xl font-bold" style={{ color: category.color }}>
                      {category.value.toLocaleString()} 
                      <span className="text-sm font-normal text-gray-500 ml-1">OMR</span>
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Selected Category Details */}
              {selectedCategory !== "all" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    {selectedCategory} Assets
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-base font-medium text-gray-800 mb-4">Asset Components</h4>
                      <div className="space-y-3">
                        {selectedCategory === "Infrastructure" && (
                          <>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Roads</span>
                              <span className="text-sm font-medium text-gray-900">150,000 OMR</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Concrete Pavements</span>
                              <span className="text-sm font-medium text-gray-900">200,000 OMR</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Kerb Stones</span>
                              <span className="text-sm font-medium text-gray-900">25,000 OMR</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Paviours (Village Square)</span>
                              <span className="text-sm font-medium text-gray-900">12,000 OMR</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Lagoon - Infra</span>
                              <span className="text-sm font-medium text-gray-900">50,000 OMR</span>
                            </div>
                          </>
                        )}
                        
                        {selectedCategory === "Electrical Systems" && (
                          <>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Distribution Board</span>
                              <span className="text-sm font-medium text-gray-900">178 OMR</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Internal & External Lighting</span>
                              <span className="text-sm font-medium text-gray-900">876 OMR</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Standby Generator</span>
                              <span className="text-sm font-medium text-gray-900">174 OMR</span>
                            </div>
                          </>
                        )}
                        
                        {selectedCategory === "HVAC" && (
                          <>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Chillers (Type 1)</span>
                              <span className="text-sm font-medium text-gray-900">85,000 OMR</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Air Handling Units</span>
                              <span className="text-sm font-medium text-gray-900">45,000 OMR</span>
                            </div>
                          </>
                        )}
                        
                        {selectedCategory === "Doors" && (
                          <>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Fire Rated Wooden Door</span>
                              <span className="text-sm font-medium text-gray-900">206,000 OMR</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Non Fire Rated Wooden Door</span>
                              <span className="text-sm font-medium text-gray-900">80,000 OMR</span>
                            </div>
                          </>
                        )}
                        
                        {selectedCategory === "Landscaping" && (
                          <>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Soft Landscaping (Village Square)</span>
                              <span className="text-sm font-medium text-gray-900">20,000 OMR</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">Hard & Soft Landscaping</span>
                              <span className="text-sm font-medium text-gray-900">35,000 OMR</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-base font-medium text-gray-800 mb-4">Expenditure Timeline</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={[
                            ...(selectedCategory === "Infrastructure" ? [
                              { year: 2025, expenditure: 50000 },
                              { year: 2033, expenditure: 100000 }
                            ] : []),
                            ...(selectedCategory === "Electrical Systems" ? [
                              { year: 2030, expenditure: 876 },
                              { year: 2035, expenditure: 174 }
                            ] : []),
                            ...(selectedCategory === "HVAC" ? [
                              { year: 2036, expenditure: 130000 }
                            ] : []),
                            ...(selectedCategory === "Doors" ? [
                              { year: 2036, expenditure: 206000 }
                            ] : []),
                            ...(selectedCategory === "Landscaping" ? [
                              { year: 2039, expenditure: 35000 },
                              { year: 2040, expenditure: 20000 }
                            ] : [])
                          ].filter(item => item.expenditure > 0)}
                          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="year" 
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB' }}
                          />
                          <YAxis 
                            tickFormatter={(value) => value >= 1000 ? `${Math.round(value/1000)}k` : value}
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            formatter={(value) => [`${value.toLocaleString()} OMR`]}
                            labelFormatter={(value) => `Year ${value}`}
                            contentStyle={{
                              borderRadius: '8px',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                              border: 'none'
                            }}
                          />
                          <Bar 
                            dataKey="expenditure" 
                            name="Expenditure" 
                            fill={assetCategories.find(c => c.name === selectedCategory)?.color || COLORS.primary} 
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Asset Lifecycle Stage Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Asset Lifecycle Stage Distribution</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "New (0-2 years)", value: 22, color: COLORS.success },
                            { name: "Mid-life (3-10 years)", value: 45, color: COLORS.primary },
                            { name: "Mature (11-15 years)", value: 24, color: COLORS.secondary },
                            { name: "End-of-life (>15 years)", value: 7, color: COLORS.warning },
                            { name: "Overdue", value: 2, color: COLORS.danger }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={70}
                          outerRadius={120}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {[
                            { name: "New (0-2 years)", value: 22, color: COLORS.success },
                            { name: "Mid-life (3-10 years)", value: 45, color: COLORS.primary },
                            { name: "Mature (11-15 years)", value: 24, color: COLORS.secondary },
                            { name: "End-of-life (>15 years)", value: 7, color: COLORS.warning },
                            { name: "Overdue", value: 2, color: COLORS.danger }
                          ].map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} assets`, '']}
                          contentStyle={{
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    <div className="space-y-4">
                      {[
                        { name: "New (0-2 years)", value: 22, color: COLORS.success },
                        { name: "Mid-life (3-10 years)", value: 45, color: COLORS.primary },
                        { name: "Mature (11-15 years)", value: 24, color: COLORS.secondary },
                        { name: "End-of-life (>15 years)", value: 7, color: COLORS.warning },
                        { name: "Overdue", value: 2, color: COLORS.danger }
                      ].map((entry, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3" 
                            style={{ backgroundColor: entry.color }}
                          ></div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-900">{entry.name}</span>
                              <span className="text-sm font-medium text-gray-900">{entry.value} assets</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div 
                                className="h-1.5 rounded-full" 
                                style={{ 
                                  width: `${(entry.value / 100) * 100}%`,
                                  backgroundColor: entry.color 
                                }}
                              ></div>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {Math.round((entry.value / 100) * 100)}% of total assets
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AssetLifecycleManagement;
