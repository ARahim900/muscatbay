
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from '@/components/layout/Layout';
import { Droplets } from 'lucide-react';

// Main color scheme
const COLORS = {
  primary: '#0EA5E9',  // Ocean Blue for water theme
  secondary: '#38BDF8',
  tertiary: '#7DD3FC',
  light: '#BAE6FD',
  background: '#F0F9FF',
  chartColors: ['#0EA5E9', '#38BDF8', '#7DD3FC', '#BAE6FD', '#E0F2FE', '#F0F9FF']
};

const WaterDistribution = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showExportMessage, setShowExportMessage] = useState(false);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [timePeriods, setTimePeriods] = useState<string[]>([]);
  
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [averageConsumption, setAverageConsumption] = useState(0);
  const [maxConsumption, setMaxConsumption] = useState(0);
  const [consumptionByCategory, setConsumptionByCategory] = useState<any[]>([]);
  const [consumptionByZone, setConsumptionByZone] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [topConsumers, setTopConsumers] = useState<any[]>([]);
  
  useEffect(() => {
    // Create structured data from the file content
    const months = ['April-24', 'May-24', 'June-24', 'July-24', 'August-24', 'September-24', 
                   'October-24', 'November-24', 'December-24', 'January-25', 'February-25'];
                   
    // Set the default selected month to the latest month
    setSelectedMonth('February-25');
    
    // Sample data for water consumption
    const consumptionData = [
      { id: 1, zone: 'Residential', type: 'MC', name: 'Building A', meter: 'W5230', 
        consumption: { 'April-24': 1208, 'May-24': 1140, 'June-24': 1483, 'July-24': 1674, 'August-24': 1862, 
                     'September-24': 1522, 'October-24': 1376, 'November-24': 1229, 'December-24': 1140, 
                     'January-25': 1303, 'February-25': 1095 }},
      { id: 2, zone: 'Residential', type: 'MC', name: 'Building B', meter: 'W5231', 
        consumption: { 'April-24': 931, 'May-24': 947, 'June-24': 1025, 'July-24': 1203, 'August-24': 1300, 
                     'September-24': 1100, 'October-24': 933, 'November-24': 800, 'December-24': 779, 
                     'January-25': 832.5, 'February-25': 937.2 }},
      { id: 3, zone: 'Commercial', type: 'MC', name: 'Retail Complex', meter: 'W5232', 
        consumption: { 'April-24': 2830, 'May-24': 2818, 'June-24': 2920, 'July-24': 3131, 'August-24': 3257, 
                     'September-24': 2976, 'October-24': 2645, 'November-24': 2519, 'December-24': 2421, 
                     'January-25': 2545.1, 'February-25': 2669.5 }},
      { id: 4, zone: 'Commercial', type: 'MC', name: 'Hotel Complex', meter: 'W5233', 
        consumption: { 'April-24': 3774, 'May-24': 4216, 'June-24': 4511, 'July-24': 5059, 'August-24': 5229, 
                     'September-24': 4817, 'October-24': 4483, 'November-24': 3599, 'December-24': 3952, 
                     'January-25': 4069, 'February-25': 4221 }},
      { id: 5, zone: 'Landscaping', type: 'MC', name: 'Central Garden', meter: 'W5234', 
        consumption: { 'April-24': 5044, 'May-24': 6210, 'June-24': 6450, 'July-24': 6800, 'August-24': 6153, 
                     'September-24': 5825, 'October-24': 4600, 'November-24': 4200, 'December-24': 4000, 
                     'January-25': 4300, 'February-25': 4900 }},
      { id: 6, zone: 'Landscaping', type: 'MC', name: 'Roadside Greenery', meter: 'W5235', 
        consumption: { 'April-24': 3198, 'May-24': 3969, 'June-24': 4122, 'July-24': 4303, 'August-24': 4208, 
                     'September-24': 3957, 'October-24': 3196, 'November-24': 2991, 'December-24': 2885, 
                     'January-25': 3028, 'February-25': 3240 }},
      { id: 7, zone: 'Public', type: 'MC', name: 'Community Center', meter: 'W5236', 
        consumption: { 'April-24': 944, 'May-24': 965, 'June-24': 1091, 'July-24': 1168, 'August-24': 1247, 
                     'September-24': 1123, 'October-24': 928, 'November-24': 886, 'December-24': 831, 
                     'January-25': 901, 'February-25': 938 }},
      { id: 8, zone: 'Public', type: 'MC', name: 'Sports Complex', meter: 'W5237', 
        consumption: { 'April-24': 2856, 'May-24': 3077, 'June-24': 3361, 'July-24': 3616, 'August-24': 3684, 
                     'September-24': 3466, 'October-24': 2915, 'November-24': 2613, 'December-24': 2443, 
                     'January-25': 2673, 'February-25': 2865 }},
      { id: 9, zone: 'Facilities', type: 'MC', name: 'Water Treatment Plant', meter: 'W5238', 
        consumption: { 'April-24': 543, 'May-24': 573, 'June-24': 663, 'July-24': 723, 'August-24': 767, 
                     'September-24': 690, 'October-24': 644, 'November-24': 532, 'December-24': 468, 
                     'January-25': 589, 'February-25': 614 }},
      { id: 10, zone: 'Facilities', type: 'MC', name: 'Maintenance Building', meter: 'W5239', 
        consumption: { 'April-24': 272, 'May-24': 289, 'June-24': 318, 'July-24': 330, 'August-24': 358, 
                     'September-24': 325, 'October-24': 293, 'November-24': 274, 'December-24': 256, 
                     'January-25': 283, 'February-25': 304 }},
    ];
    
    setData(consumptionData);
    processData(consumptionData);
  }, []);
  
  const processData = (data: any[]) => {
    // Extract unique categories, zones, and time periods
    const uniqueCategories = [...new Set(data.map(item => getCategoryFromName(item.name)))];
    const uniqueZones = [...new Set(data.map(item => item.zone))];
    const uniqueTimePeriods = Object.keys(data[0]?.consumption || {});
    
    setCategories(uniqueCategories);
    setZones(uniqueZones);
    setTimePeriods(uniqueTimePeriods);
    
    // Calculate total consumption
    const total = data.reduce((sum, item) => {
      const itemTotal = Object.values(item.consumption).reduce((a: number, b: number) => a + Number(b), 0);
      return sum + itemTotal;
    }, 0);
    setTotalConsumption(total);
    
    // Calculate average consumption
    const avg = total / (data.length * uniqueTimePeriods.length);
    setAverageConsumption(avg);
    
    // Find max consumption
    const max = data.reduce((currentMax, item) => {
      const itemMax = Math.max(...Object.values(item.consumption).map(v => Number(v)));
      return Math.max(currentMax, itemMax);
    }, 0);
    setMaxConsumption(max);
    
    // Process consumption by category
    const byCategory = uniqueCategories.map(category => {
      const categoryItems = data.filter(item => getCategoryFromName(item.name) === category);
      const categoryTotal = categoryItems.reduce((sum, item) => {
        return sum + Object.values(item.consumption).reduce((a: number, b: number) => a + Number(b), 0);
      }, 0);
      
      return {
        name: category,
        value: categoryTotal,
        percentage: (categoryTotal / total) * 100
      };
    });
    setConsumptionByCategory(byCategory);
    
    // Process consumption by zone
    const byZone = uniqueZones.map(zone => {
      const zoneItems = data.filter(item => item.zone === zone);
      const zoneTotal = zoneItems.reduce((sum, item) => {
        return sum + Object.values(item.consumption).reduce((a: number, b: number) => a + Number(b), 0);
      }, 0);
      
      return {
        name: zone,
        value: zoneTotal,
        percentage: (zoneTotal / total) * 100
      };
    });
    setConsumptionByZone(byZone);
    
    // Process monthly trends
    const byMonth = uniqueTimePeriods.map(month => {
      const monthTotal = data.reduce((sum, item) => {
        return sum + Number(item.consumption[month] || 0);
      }, 0);
      
      return {
        name: month,
        total: monthTotal
      };
    });
    setMonthlyTrends(byMonth);
    
    // Find top consumers
    const consumers = data.map(item => {
      const itemTotal = Object.values(item.consumption).reduce((a: number, b: number) => a + Number(b), 0);
      return {
        id: item.id,
        name: item.name,
        zone: item.zone,
        meter: item.meter,
        total: itemTotal,
        percentage: (itemTotal / total) * 100
      };
    });
    
    setTopConsumers(consumers.sort((a, b) => b.total - a.total).slice(0, 10));
  };
  
  const getCategoryFromName = (name: string) => {
    if (name.includes('Building')) return 'Residential';
    if (name.includes('Retail')) return 'Retail';
    if (name.includes('Hotel')) return 'Hospitality';
    if (name.includes('Garden') || name.includes('Greenery')) return 'Landscaping';
    if (name.includes('Center') || name.includes('Complex')) return 'Public Facilities';
    if (name.includes('Treatment') || name.includes('Maintenance')) return 'Utility Facilities';
    return 'Other';
  };
  
  const toggleCategoryFilter = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  const toggleZoneFilter = (zone: string) => {
    if (selectedZones.includes(zone)) {
      setSelectedZones(selectedZones.filter(z => z !== zone));
    } else {
      setSelectedZones([...selectedZones, zone]);
    }
  };
  
  const resetFilters = () => {
    setTimeframe('all');
    setSelectedCategories([]);
    setSelectedZones([]);
  };
  
  // Calculate cost (using a fictional rate)
  const calculateCost = (consumption: number) => {
    const rate = 0.003; // OMR per unit (cubic meter)
    return (consumption * rate).toFixed(3);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="px-6 py-4 shadow-md" style={{ backgroundColor: COLORS.primary }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Droplets className="w-6 h-6 text-white" />
              <h1 className="text-xl font-bold text-white">Muscat Bay Water Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="flex items-center px-3 py-1 rounded-lg bg-white text-sm" 
                style={{ color: COLORS.primary }}
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4H21V6H3V4ZM5 11H19V13H5V11ZM7 18H17V20H7V18Z" fill={COLORS.primary}/>
                </svg>
                Filters
              </button>
              <button className="flex items-center px-3 py-1 rounded-lg bg-white text-sm" style={{ color: COLORS.primary }}>
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 19H21V21H3V19ZM13 13V3H11V13H4L12 21L20 13H13Z" fill={COLORS.primary}/>
                </svg>
                Export
              </button>
            </div>
          </div>
        </header>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium" style={{ color: COLORS.primary }}>Filter Dashboard</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Time</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="last90">Last 90 Days</option>
                  <option value="last180">Last 180 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategoryFilter(category)}
                      className={`px-2 py-1 text-xs rounded-full ${
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
                <label className="block text-sm font-medium mb-1 text-gray-700">Zones</label>
                <div className="flex flex-wrap gap-2">
                  {zones.map(zone => (
                    <button
                      key={zone}
                      onClick={() => toggleZoneFilter(zone)}
                      className={`px-2 py-1 text-xs rounded-full ${
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
                className="flex items-center px-3 py-1 rounded-lg text-sm text-white"
                style={{ backgroundColor: COLORS.primary }}
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="white"/>
                </svg>
                Reset Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex border-b px-6 bg-white">
          <button
            className={`py-4 px-4 font-medium border-b-2 ${
              activeTab === 'overview' ? 'border-current' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'overview' ? COLORS.primary : 'gray' }}
            onClick={() => setActiveTab('overview')}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
              </svg>
              Overview
            </div>
          </button>
          <button
            className={`py-4 px-4 font-medium border-b-2 ${
              activeTab === 'categories' ? 'border-current' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'categories' ? COLORS.primary : 'gray' }}
            onClick={() => setActiveTab('categories')}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V7H9V17ZM13 17H11V10H13V17ZM17 17H15V13H17V17Z" fill="currentColor"/>
              </svg>
              Categories
            </div>
          </button>
          <button
            className={`py-4 px-4 font-medium border-b-2 ${
              activeTab === 'zones' ? 'border-current' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'zones' ? COLORS.primary : 'gray' }}
            onClick={() => setActiveTab('zones')}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
              </svg>
              Zones
            </div>
          </button>
          <button
            className={`py-4 px-4 font-medium border-b-2 ${
              activeTab === 'trends' ? 'border-current' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'trends' ? COLORS.primary : 'gray' }}
            onClick={() => setActiveTab('trends')}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 18.49L9.5 12.48L13.5 16.48L22 6.92L20.59 5.51L13.5 13.48L9.5 9.48L2 16.99L3.5 18.49Z" fill="currentColor"/>
              </svg>
              Trend Analysis
            </div>
          </button>
          <button
            className={`py-4 px-4 font-medium border-b-2 ${
              activeTab === 'reports' ? 'border-current' : 'border-transparent'
            }`}
            style={{ color: activeTab === 'reports' ? COLORS.primary : 'gray' }}
            onClick={() => setActiveTab('reports')}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
              </svg>
              Reports
            </div>
          </button>
        </div>
        
        {/* Main Content */}
        <main className="container mx-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Key Metrics Cards */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Consumption</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                        {totalConsumption.toLocaleString()} m³
                      </p>
                      <p className="text-sm text-gray-600">
                        Cost: {calculateCost(totalConsumption)} OMR
                      </p>
                    </div>
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${COLORS.light}40` }}>
                      <Droplets className="w-6 h-6" style={{ color: COLORS.primary }} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Average Monthly Consumption</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                        {Math.round(averageConsumption).toLocaleString()} m³
                      </p>
                      <p className="text-sm text-gray-600">
                        Per facility per month
                      </p>
                    </div>
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${COLORS.light}40` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 18H21M8 6H21M8 12H21M3 6V6.01M3 12V12.01M3 18V18.01" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Maximum Consumption</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                        {maxConsumption.toLocaleString()} m³
                      </p>
                      <p className="text-sm text-gray-600">
                        Highest recorded in a month
                      </p>
                    </div>
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${COLORS.light}40` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 3H12H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V9M13 3L19 9M13 3V9H19" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Consumption by Category */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-md font-medium mb-4" style={{ color: COLORS.primary }}>
                    Consumption by Category
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={consumptionByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {consumptionByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} m³`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Monthly Consumption Trend */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-md font-medium mb-4" style={{ color: COLORS.primary }}>
                    Monthly Consumption Trend
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => value.split('-')[0]}
                        />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} m³`} />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          name="Consumption"
                          stroke={COLORS.primary} 
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Top Consumers */}
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-md font-medium mb-4" style={{ color: COLORS.primary }}>
                  Top Consumers
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          #
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          Facility
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          Zone
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          Meter
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          Total Consumption
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          % of Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topConsumers.map((consumer, index) => (
                        <tr key={consumer.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-2 text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="py-2 text-sm text-gray-900">
                            {consumer.name}
                          </td>
                          <td className="py-2 text-sm text-gray-900">
                            {consumer.zone}
                          </td>
                          <td className="py-2 text-sm text-gray-900">
                            {consumer.meter}
                          </td>
                          <td className="py-2 text-sm text-right text-gray-900">
                            {consumer.total.toLocaleString()} m³
                          </td>
                          <td className="py-2 text-sm text-right text-gray-900">
                            <div className="flex items-center justify-end">
                              <span className="mr-2">{consumer.percentage.toFixed(1)}%</span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full"
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Category Distribution */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-md font-medium mb-4" style={{ color: COLORS.primary }}>
                    Category Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={consumptionByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} m³`} />
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
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-md font-medium mb-4" style={{ color: COLORS.primary }}>
                    Category Breakdown
                  </h3>
                  <div className="overflow-y-auto h-64">
                    {consumptionByCategory.map((category, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: COLORS.primary }}>
                            {category.name}
                          </span>
                          <span className="text-sm text-gray-600">
                            {category.value.toLocaleString()} m³ ({category.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Zone Distribution */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-md font-medium mb-4" style={{ color: COLORS.primary }}>
                    Zone Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={consumptionByZone}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {consumptionByZone.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} m³`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Zone Comparison */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-md font-medium mb-4" style={{ color: COLORS.primary }}>
                    Zone Comparison
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={consumptionByZone}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} m³`} />
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
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-md font-medium mb-4" style={{ color: COLORS.primary }}>
                  Consumption Trends (All Facilities)
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} m³`} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        name="Total Consumption"
                        stroke={COLORS.primary} 
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-md font-medium mb-4" style={{ color: COLORS.primary }}>
                  Seasonal Patterns
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { name: 'Summer (Apr-Sep)', value: monthlyTrends.slice(0, 6).reduce((sum, m) => sum + m.total, 0) },
                        { name: 'Winter (Oct-Feb)', value: monthlyTrends.slice(6).reduce((sum, m) => sum + m.total, 0) }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} m³`} />
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
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium" style={{ color: COLORS.primary }}>
                    Monthly Consumption Report
                  </h3>
                  <button 
                    onClick={() => {
                      setShowExportMessage(true);
                      setTimeout(() => setShowExportMessage(false), 3000);
                    }}
                    className="flex items-center px-3 py-1 rounded-lg text-sm text-white"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 19H21V21H3V19ZM13 13V3H11V13H4L12 21L20 13H13Z" fill="white"/>
                    </svg>
                    Export PDF
                  </button>
                  {showExportMessage && (
                    <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p>Exporting PDF for {selectedMonth}...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {timePeriods.map((month, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMonth(month)}
                      className={`px-3 py-1 text-xs rounded-lg ${
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
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          Meter ID
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          Name
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          Zone
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          Consumption
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          vs Prev Month
                        </th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                          Cost (OMR)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, index) => {
                        const currentMonth = selectedMonth;
                        // Find the previous month in the time periods array
                        const currentMonthIndex = timePeriods.indexOf(currentMonth);
                        const previousMonth = currentMonthIndex > 0 ? timePeriods[currentMonthIndex - 1] : null;
                        
                        const currentValue = item.consumption[currentMonth] || 0;
                        const previousValue = previousMonth ? (item.consumption[previousMonth] || 0) : 0;
                        
                        const percentChange = previousValue === 0
                          ? 100
                          : ((Number(currentValue) - Number(previousValue)) / Number(previousValue)) * 100;
                        
                        return (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-2 text-sm text-gray-900">
                              {item.meter}
                            </td>
                            <td className="py-2 text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="py-2 text-sm text-gray-900">
                              {item.zone}
                            </td>
                            <td className="py-2 text-sm text-right text-gray-900">
                              {Number(currentValue).toLocaleString()} m³
                            </td>
                            <td className="py-2 text-sm text-right">
                              <span className={`px-2 py-0.5 rounded-full text-white ${
                                Number(percentChange) > 0 ? 'bg-red-500' : 'bg-green-500'
                              }`}>
                                {Number(percentChange) > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2 text-sm text-right text-gray-900">
                              {calculateCost(Number(currentValue))}
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
        <footer className="bg-white p-4 border-t mt-auto">
          <div className="container mx-auto flex justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2025 Muscat Bay Water Monitoring System
            </p>
            <p className="text-sm text-gray-600">
              Last updated: March 13, 2025
            </p>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default WaterDistribution;
