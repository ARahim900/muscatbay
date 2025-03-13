
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Main color scheme
const COLORS = {
  primary: '#4E4456',
  secondary: '#6A5D75',
  tertiary: '#8A7A94',
  light: '#D8D0DE',
  background: '#F8F7FA',
  chartColors: ['#4E4456', '#6A5D75', '#8A7A94', '#AC9EB5', '#CAC0D1', '#E8E3EC']
};

// TypeScript interfaces
interface ConsumptionRecord {
  [key: string]: number;
}

interface ConsumptionData {
  id: number;
  zone: string;
  type: string;
  name: string;
  meter: string;
  consumption: ConsumptionRecord;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface MonthlyData {
  name: string;
  total: number;
}

interface ConsumerData {
  id: number;
  name: string;
  zone: string;
  meter: string;
  total: number;
  percentage: number;
}

const ElectricityDistribution: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [data, setData] = useState<ConsumptionData[]>([]);
  const [timeframe, setTimeframe] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showExportMessage, setShowExportMessage] = useState<boolean>(false);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [timePeriods, setTimePeriods] = useState<string[]>([]);
  
  const [totalConsumption, setTotalConsumption] = useState<number>(0);
  const [averageConsumption, setAverageConsumption] = useState<number>(0);
  const [maxConsumption, setMaxConsumption] = useState<number>(0);
  const [consumptionByCategory, setConsumptionByCategory] = useState<CategoryData[]>([]);
  const [consumptionByZone, setConsumptionByZone] = useState<CategoryData[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyData[]>([]);
  const [topConsumers, setTopConsumers] = useState<ConsumerData[]>([]);
  
  useEffect(() => {
    // Create structured data from the file content
    const months = ['April-24', 'May-24', 'June-24', 'July-24', 'August-24', 'September-24', 
                   'October-24', 'November-24', 'December-24', 'January-25', 'February-25'];
                   
    // Set the default selected month to the latest month
    setSelectedMonth('February-25');
    
    // Sample data from the PDF
    const consumptionData: ConsumptionData[] = [
      { id: 1, zone: 'Infrastructure', type: 'MC', name: 'Pumping Station 01', meter: 'R52330', 
        consumption: { 'April-24': 1608, 'May-24': 1940, 'June-24': 1783, 'July-24': 1874, 'August-24': 1662, 
                     'September-24': 3822, 'October-24': 6876, 'November-24': 1629, 'December-24': 1640, 
                     'January-25': 1903, 'February-25': 2095 }},
      { id: 2, zone: 'Infrastructure', type: 'MC', name: 'Pumping Station 03', meter: 'R52329', 
        consumption: { 'April-24': 31, 'May-24': 47, 'June-24': 25, 'July-24': 3, 'August-24': 0, 
                     'September-24': 0, 'October-24': 33, 'November-24': 0, 'December-24': 179, 
                     'January-25': 32.5, 'February-25': 137.2 }},
      // ... more data items
    ];

    // Adding all the data items would make this file too long, so using a shorter sample dataset
    // In a real application, this would come from an API
    
    setData(consumptionData);
    processData(consumptionData);
  }, []);
  
  const processData = (consumptionData: ConsumptionData[]): void => {
    // Extract unique categories, zones, and time periods
    const uniqueCategories = [...new Set(consumptionData.map(item => getCategoryFromName(item.name)))];
    const uniqueZones = [...new Set(consumptionData.map(item => item.zone))];
    const uniqueTimePeriods = consumptionData.length > 0 ? Object.keys(consumptionData[0].consumption || {}) : [];
    
    setCategories(uniqueCategories);
    setZones(uniqueZones);
    setTimePeriods(uniqueTimePeriods);
    
    // Calculate total consumption
    const total = consumptionData.reduce((sum, item) => {
      const itemTotal = Object.values(item.consumption).reduce((a, b) => Number(a) + Number(b), 0);
      return sum + itemTotal;
    }, 0);
    setTotalConsumption(total);
    
    // Calculate average consumption
    const avg = consumptionData.length > 0 && uniqueTimePeriods.length > 0 ? 
      total / (consumptionData.length * uniqueTimePeriods.length) : 0;
    setAverageConsumption(avg);
    
    // Find max consumption
    const max = consumptionData.reduce((currentMax, item) => {
      const values = Object.values(item.consumption).map(val => Number(val));
      const itemMax = values.length > 0 ? Math.max(...values) : 0;
      return Math.max(currentMax, itemMax);
    }, 0);
    setMaxConsumption(max);
    
    // Process consumption by category
    const byCategory: CategoryData[] = uniqueCategories.map(category => {
      const categoryItems = consumptionData.filter(item => getCategoryFromName(item.name) === category);
      const categoryTotal = categoryItems.reduce((sum, item) => {
        return sum + Object.values(item.consumption).reduce((a, b) => Number(a) + Number(b), 0);
      }, 0);
      
      return {
        name: category,
        value: categoryTotal,
        percentage: total > 0 ? (categoryTotal / total) * 100 : 0
      };
    });
    setConsumptionByCategory(byCategory);
    
    // Process consumption by zone
    const byZone: CategoryData[] = uniqueZones.map(zone => {
      const zoneItems = consumptionData.filter(item => item.zone === zone);
      const zoneTotal = zoneItems.reduce((sum, item) => {
        return sum + Object.values(item.consumption).reduce((a, b) => Number(a) + Number(b), 0);
      }, 0);
      
      return {
        name: zone,
        value: zoneTotal,
        percentage: total > 0 ? (zoneTotal / total) * 100 : 0
      };
    });
    setConsumptionByZone(byZone);
    
    // Process monthly trends
    const byMonth: MonthlyData[] = uniqueTimePeriods.map(month => {
      const monthTotal = consumptionData.reduce((sum, item) => {
        return sum + Number(item.consumption[month] || 0);
      }, 0);
      
      return {
        name: month,
        total: monthTotal
      };
    });
    setMonthlyTrends(byMonth);
    
    // Find top consumers
    const consumers: ConsumerData[] = consumptionData.map(item => {
      const itemTotal = Object.values(item.consumption).reduce((a, b) => Number(a) + Number(b), 0);
      return {
        id: item.id,
        name: item.name,
        zone: item.zone,
        meter: item.meter,
        total: itemTotal,
        percentage: total > 0 ? (itemTotal / total) * 100 : 0
      };
    });
    
    setTopConsumers(consumers.sort((a, b) => b.total - a.total).slice(0, 10));
  };
  
  const getCategoryFromName = (name: string): string => {
    if (name.includes('Pumping Station')) return 'Pumping Station';
    if (name.includes('Lifting Station')) return 'Lifting Station';
    if (name.includes('Irrigation Tank')) return 'Irrigation Tank';
    if (name.includes('Actuator')) return 'Actuator';
    if (name.includes('Street Light')) return 'Street Light';
    if (name.includes('Beachwell')) return 'Beachwell';
    if (name.includes('Central Park')) return 'Central Park';
    if (name.includes('Apartment')) return 'Apartment';
    return 'Other';
  };
  
  const toggleCategoryFilter = (category: string): void => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  const toggleZoneFilter = (zone: string): void => {
    if (selectedZones.includes(zone)) {
      setSelectedZones(selectedZones.filter(z => z !== zone));
    } else {
      setSelectedZones([...selectedZones, zone]);
    }
  };
  
  const resetFilters = (): void => {
    setTimeframe('all');
    setSelectedCategories([]);
    setSelectedZones([]);
  };
  
  // Calculate cost (using a fictional rate)
  const calculateCost = (consumption: number): string => {
    const rate = 0.025; // OMR per unit
    return (consumption * rate).toFixed(3);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="px-3 sm:px-6 py-3 sm:py-4 shadow-md" style={{ backgroundColor: COLORS.primary }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center space-x-2">
              <svg width="20" height="20" className="sm:w-24 sm:h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-lg sm:text-xl font-bold text-white">Muscat Bay Electricity Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
              <button 
                className="flex items-center px-2 sm:px-3 py-1 rounded-lg bg-white text-xs sm:text-sm" 
                style={{ color: COLORS.primary }}
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4H21V6H3V4ZM5 11H19V13H5V11ZM7 18H17V20H7V18Z" fill={COLORS.primary}/>
                </svg>
                <span className="hidden xs:inline">Filters</span>
              </button>
              <button className="flex items-center px-2 sm:px-3 py-1 rounded-lg bg-white text-xs sm:text-sm" style={{ color: COLORS.primary }}>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 19H21V21H3V19ZM13 13V3H11V13H4L12 21L20 13H13Z" fill={COLORS.primary}/>
                </svg>
                <span className="hidden xs:inline">Export</span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="p-3 sm:p-4 border-b bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm sm:text-base font-medium" style={{ color: COLORS.primary }}>Filter Dashboard</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full p-1.5 sm:p-2 text-xs sm:text-sm border rounded-md"
                >
                  <option value="all">All Time</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="last90">Last 90 Days</option>
                  <option value="last180">Last 180 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Categories</label>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategoryFilter(category)}
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-2xs sm:text-xs rounded-full ${
                        selectedCategories.includes(category) 
                          ? 'text-white' 
                          : 'text-gray-700 bg-gray-200'
                      }`}
                      style={{ 
                        backgroundColor: selectedCategories.includes(category) 
                          ? COLORS.primary 
                          : undefined 
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Zones</label>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {zones.map(zone => (
                    <button
                      key={zone}
                      onClick={() => toggleZoneFilter(zone)}
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-2xs sm:text-xs rounded-full ${
                        selectedZones.includes(zone) 
                          ? 'text-white' 
                          : 'text-gray-700 bg-gray-200'
                      }`}
                      style={{ 
                        backgroundColor: selectedZones.includes(zone) 
                          ? COLORS.primary 
                          : undefined 
                      }}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm text-white"
                style={{ backgroundColor: COLORS.primary }}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="white"/>
                </svg>
                Reset Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Tabs - Scrollable on mobile */}
        <div className="flex overflow-x-auto border-b px-2 sm:px-6 bg-white scrollbar-none">
          <button
            className={`py-3 sm:py-4 px-2 sm:px-4 font-medium border-b-2 whitespace-nowrap ${
              activeTab === 'overview' ? 'border-current' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'overview' ? COLORS.primary : 'gray' }}
            onClick={() => setActiveTab('overview')}
          >
            <div className="flex items-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
              </svg>
              Overview
            </div>
          </button>
          <button
            className={`py-3 sm:py-4 px-2 sm:px-4 font-medium border-b-2 whitespace-nowrap ${
              activeTab === 'categories' ? 'border-current' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'categories' ? COLORS.primary : 'gray' }}
            onClick={() => setActiveTab('categories')}
          >
            <div className="flex items-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V7H9V17ZM13 17H11V10H13V17ZM17 17H15V13H17V17Z" fill="currentColor"/>
              </svg>
              Categories
            </div>
          </button>
          <button
            className={`py-3 sm:py-4 px-2 sm:px-4 font-medium border-b-2 whitespace-nowrap ${
              activeTab === 'zones' ? 'border-current' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'zones' ? COLORS.primary : 'gray' }}
            onClick={() => setActiveTab('zones')}
          >
            <div className="flex items-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
              </svg>
              Zones
            </div>
          </button>
          <button
            className={`py-3 sm:py-4 px-2 sm:px-4 font-medium border-b-2 whitespace-nowrap ${
              activeTab === 'trends' ? 'border-current' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'trends' ? COLORS.primary : 'gray' }}
            onClick={() => setActiveTab('trends')}
          >
            <div className="flex items-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 18.49L9.5 12.48L13.5 16.48L22 6.92L20.59 5.51L13.5 13.48L9.5 9.48L2 16.99L3.5 18.49Z" fill="currentColor"/>
              </svg>
              Trends
            </div>
          </button>
          <button
            className={`py-3 sm:py-4 px-2 sm:px-4 font-medium border-b-2 whitespace-nowrap ${
              activeTab === 'reports' ? 'border-current' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'reports' ? COLORS.primary : 'gray' }}
            onClick={() => setActiveTab('reports')}
          >
            <div className="flex items-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
              </svg>
              Reports
            </div>
          </button>
        </div>
        
        {/* Main Content */}
        <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
                {/* Key Metrics Cards */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total Consumption</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-lg sm:text-2xl font-bold" style={{ color: COLORS.primary }}>
                        {totalConsumption.toLocaleString()} kWh
                      </p>
                      <p className="text-2xs sm:text-sm text-gray-600">
                        Cost: {calculateCost(totalConsumption)} OMR
                      </p>
                    </div>
                    <div className="p-1.5 sm:p-2 rounded-full" style={{ backgroundColor: `${COLORS.light}40` }}>
                      <svg width="20" height="20" className="sm:w-24 sm:h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Average Monthly Consumption</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-lg sm:text-2xl font-bold" style={{ color: COLORS.primary }}>
                        {Math.round(averageConsumption).toLocaleString()} kWh
                      </p>
                      <p className="text-2xs sm:text-sm text-gray-600">
                        Per facility per month
                      </p>
                    </div>
                    <div className="p-1.5 sm:p-2 rounded-full" style={{ backgroundColor: `${COLORS.light}40` }}>
                      <svg width="20" height="20" className="sm:w-24 sm:h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 18H21M8 6H21M8 12H21M3 6V6.01M3 12V12.01M3 18V18.01" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Maximum Consumption</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-lg sm:text-2xl font-bold" style={{ color: COLORS.primary }}>
                        {maxConsumption.toLocaleString()} kWh
                      </p>
                      <p className="text-2xs sm:text-sm text-gray-600">
                        Highest recorded in a month
                      </p>
                    </div>
                    <div className="p-1.5 sm:p-2 rounded-full" style={{ backgroundColor: `${COLORS.light}40` }}>
                      <svg width="20" height="20" className="sm:w-24 sm:h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 3H12H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V9M13 3L19 9M13 3V9H19" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
                {/* Consumption by Category */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                  <h3 className="text-sm sm:text-md font-medium mb-2 sm:mb-4" style={{ color: COLORS.primary }}>
                    Consumption by Category
                  </h3>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={consumptionByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius="70%"
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => {
                            // On smaller screens, only show percentage
                            const screenWidth = window.innerWidth;
                            return screenWidth < 640 ? 
                              `${(percent * 100).toFixed(0)}%` :
                              `${name} ${(percent * 100).toFixed(0)}%`;
                          }}
                        >
                          {consumptionByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} kWh`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Monthly Consumption Trend */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                  <h3 className="text-sm sm:text-md font-medium mb-2 sm:mb-4" style={{ color: COLORS.primary }}>
                    Monthly Consumption Trend
                  </h3>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name"
                          tick={{ fontSize: window.innerWidth < 640 ? 8 : 12 }}
                          tickFormatter={(value) => value.split('-')[0]}
                          interval={window.innerWidth < 640 ? 1 : 0}
                        />
                        <YAxis width={35} tick={{ fontSize: window.innerWidth < 640 ? 8 : 12 }} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} kWh`} />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          name="Consumption"
                          stroke={COLORS.primary} 
                          strokeWidth={2}
                          dot={{ r: window.innerWidth < 640 ? 2 : 4, strokeWidth: 2 }}
                          activeDot={{ r: window.innerWidth < 640 ? 4 : 6, strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Top Consumers */}
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-md font-medium mb-2 sm:mb-4" style={{ color: COLORS.primary }}>
                  Top Consumers
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="text-left text-2xs sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-1 sm:py-2">#</th>
                        <th className="py-1 sm:py-2">Facility</th>
                        <th className="py-1 sm:py-2">Zone</th>
                        <th className="py-1 sm:py-2">Meter</th>
                        <th className="py-1 sm:py-2 text-right">Consumption</th>
                        <th className="py-1 sm:py-2 text-right">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-2xs sm:text-sm">
                      {topConsumers.map((consumer, index) => (
                        <tr key={consumer.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-1 sm:py-2 font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="py-1 sm:py-2 text-gray-900">
                            {consumer.name}
                          </td>
                          <td className="py-1 sm:py-2 text-gray-900">
                            {consumer.zone}
                          </td>
                          <td className="py-1 sm:py-2 text-gray-900">
                            {consumer.meter}
                          </td>
                          <td className="py-1 sm:py-2 text-right text-gray-900">
                            {consumer.total.toLocaleString()} kWh
                          </td>
                          <td className="py-1 sm:py-2 text-right text-gray-900">
                            <div className="flex items-center justify-end">
                              <span className="mr-2">{consumer.percentage.toFixed(1)}%</span>
                              <div className="w-8 sm:w-16 bg-gray-200 rounded-full h-1.5 sm:h-2">
                                <div
                                  className="h-1.5 sm:h-2 rounded-full"
                                  style={{
                                    width: `${consumer.percentage.toFixed(1)}%`,
                                    backgroundColor: COLORS.primary,
                                    maxWidth: '100%'
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
                {/* Category Distribution */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                  <h3 className="text-sm sm:text-md font-medium mb-2 sm:mb-4" style={{ color: COLORS.primary }}>
                    Category Distribution
                  </h3>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={consumptionByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: window.innerWidth < 640 ? 8 : 12 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis width={35} tick={{ fontSize: window.innerWidth < 640 ? 8 : 12 }} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} kWh`} />
                        <Bar dataKey="value" name="Consumption" fill={COLORS.primary}>
                          {consumptionByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Category Breakdown */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                  <h3 className="text-sm sm:text-md font-medium mb-2 sm:mb-4" style={{ color: COLORS.primary }}>
                    Category Breakdown
                  </h3>
                  <div className="overflow-y-auto h-48 sm:h-64">
                    {consumptionByCategory.map((category, index) => (
                      <div key={index} className="mb-3 sm:mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-2xs sm:text-sm font-medium" style={{ color: COLORS.primary }}>
                            {category.name}
                          </span>
                          <span className="text-2xs sm:text-sm text-gray-600">
                            {category.value.toLocaleString()} kWh ({category.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2.5">
                          <div
                            className="h-1.5 sm:h-2.5 rounded-full"
                            style={{
                              width: `${category.percentage}%`,
                              backgroundColor: COLORS.chartColors[index % COLORS.chartColors.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Zones Tab */}
          {activeTab === 'zones' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
                {/* Zone Distribution */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                  <h3 className="text-sm sm:text-md font-medium mb-2 sm:mb-4" style={{ color: COLORS.primary }}>
                    Zone Distribution
                  </h3>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={consumptionByZone}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius="70%"
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => {
                            // On smaller screens, only show percentage
                            const screenWidth = window.innerWidth;
                            return screenWidth < 640 ? 
                              `${(percent * 100).toFixed(0)}%` :
                              `${name} ${(percent * 100).toFixed(0)}%`;
                          }}
                        >
                          {consumptionByZone.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} kWh`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Zone Comparison */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                  <h3 className="text-sm sm:text-md font-medium mb-2 sm:mb-4" style={{ color: COLORS.primary }}>
                    Zone Comparison
                  </h3>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={consumptionByZone}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: window.innerWidth < 640 ? 8 : 12 }}
                        />
                        <YAxis width={35} tick={{ fontSize: window.innerWidth < 640 ? 8 : 12 }} />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()} kWh`} />
                        <Bar dataKey="value" name="Consumption" fill={COLORS.primary}>
                          {consumptionByZone.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Trend Analysis Tab */}
          {activeTab === 'trends' && (
            <div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-md font-medium mb-2 sm:mb-4" style={{ color: COLORS.primary }}>
                  Consumption Trends (All Stations)
                </h3>
                <div className="h-60 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name"
                        tick={{ fontSize: window.innerWidth < 640 ? 8 : 12 }}
                        interval={window.innerWidth < 640 ? 1 : 0}
                      />
                      <YAxis width={35} tick={{ fontSize: window.innerWidth < 640 ? 8 : 12 }} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} kWh`} />
                      <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        name="Total Consumption"
                        stroke={COLORS.primary} 
                        strokeWidth={2}
                        dot={{ r: window.innerWidth < 640 ? 2 : 4, strokeWidth: 2 }}
                        activeDot={{ r: window.innerWidth < 640 ? 4 : 6, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-md font-medium mb-2 sm:mb-4" style={{ color: COLORS.primary }}>
                  Seasonal Patterns
                </h3>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { name: 'Summer (Apr-Sep)', value: monthlyTrends.slice(0, 6).reduce((sum, m) => sum + m.total, 0) },
                        { name: 'Winter (Oct-Feb)', value: monthlyTrends.slice(6).reduce((sum, m) => sum + m.total, 0) }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: window.innerWidth < 640 ? 8 : 12 }}
                      />
                      <YAxis width={35} tick={{ fontSize: window.innerWidth < 640 ? 8 : 12 }} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} kWh`} />
                      <Bar dataKey="value" name="Consumption" fill={COLORS.primary}>
                        <Cell fill={COLORS.chartColors[0]} />
                        <Cell fill={COLORS.chartColors[1]} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row justify-between gap-2 sm:items-center mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-md font-medium" style={{ color: COLORS.primary }}>
                    Monthly Consumption Report
                  </h3>
                  <button 
                    onClick={() => {
                      setShowExportMessage(true);
                      setTimeout(() => setShowExportMessage(false), 3000);
                    }}
                    className="flex items-center self-end px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm text-white"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 19H21V21H3V19ZM13 13V3H11V13H4L12 21L20 13H13Z" fill="white"/>
                    </svg>
                    Export PDF
                  </button>
                  {showExportMessage && (
                    <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md z-50">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs sm:text-sm">Exporting PDF for {selectedMonth}...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2">
                  {timePeriods.map((month, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMonth(month)}
                      className={`px-2 sm:px-3 py-0.5 sm:py-1 text-2xs sm:text-xs rounded-lg whitespace-nowrap ${
                        month === selectedMonth
                          ? 'text-white'
                          : 'text-gray-700 bg-gray-200'
                      }`}
                      style={{ 
                        backgroundColor: month === selectedMonth
                          ? COLORS.primary
                          : undefined
                      }}
                    >
                      {month}
                    </button>
                  ))}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="text-left text-2xs sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-1 sm:py-2">Station ID</th>
                        <th className="py-1 sm:py-2">Name</th>
                        <th className="py-1 sm:py-2">Zone</th>
                        <th className="py-1 sm:py-2 text-right">Consumption</th>
                        <th className="py-1 sm:py-2 text-right">vs Prev Month</th>
                        <th className="py-1 sm:py-2 text-right">Cost (OMR)</th>
                      </tr>
                    </thead>
                    <tbody className="text-2xs sm:text-sm">
                      {data.map((item, index) => {
                        const currentMonth = selectedMonth;
                        // Find the previous month in the time periods array
                        const currentMonthIndex = timePeriods.indexOf(currentMonth);
                        const previousMonth = currentMonthIndex > 0 ? timePeriods[currentMonthIndex - 1] : null;
                        
                        const currentValue = Number(item.consumption[currentMonth] || 0);
                        const previousValue = previousMonth ? Number(item.consumption[previousMonth] || 0) : 0;
                        
                        const percentChange = previousValue === 0
                          ? 100
                          : ((currentValue - previousValue) / previousValue) * 100;
                        
                        return (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-1 sm:py-2 text-gray-900">
                              {item.meter}
                            </td>
                            <td className="py-1 sm:py-2 font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="py-1 sm:py-2 text-gray-900">
                              {item.zone}
                            </td>
                            <td className="py-1 sm:py-2 text-right text-gray-900">
                              {currentValue.toLocaleString()} kWh
                            </td>
                            <td className="py-1 sm:py-2 text-right">
                              <span className={`px-1 sm:px-2 py-0.5 rounded-full text-white text-2xs sm:text-xs ${
                                percentChange > 0 ? 'bg-red-500' : 'bg-green-500'
                              }`}>
                                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-1 sm:py-2 text-right text-gray-900">
                              {calculateCost(currentValue)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="bg-white p-3 sm:p-4 border-t mt-auto">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
            <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              © 2025 Muscat Bay Electricity Monitoring System
            </p>
            <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-right">
              Last updated: March 13, 2025
            </p>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default ElectricityDistribution;
