import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from '@/components/layout/Layout';

// Main color scheme
const COLORS = {
  primary: '#4E4456',
  secondary: '#6A5D75',
  tertiary: '#8A7A94',
  light: '#D8D0DE',
  background: '#F8F7FA',
  chartColors: ['#4E4456', '#6A5D75', '#8A7A94', '#AC9EB5', '#CAC0D1', '#E8E3EC']
};

const ElectricityDistribution = () => {
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
    
    // Sample data from the PDF
    const consumptionData = [
      { id: 1, zone: 'Infrastructure', type: 'MC', name: 'Pumping Station 01', meter: 'R52330', 
        consumption: { 'April-24': 1608, 'May-24': 1940, 'June-24': 1783, 'July-24': 1874, 'August-24': 1662, 
                     'September-24': 3822, 'October-24': 6876, 'November-24': 1629, 'December-24': 1640, 
                     'January-25': 1903, 'February-25': 2095 }},
      { id: 2, zone: 'Infrastructure', type: 'MC', name: 'Pumping Station 03', meter: 'R52329', 
        consumption: { 'April-24': 31, 'May-24': 47, 'June-24': 25, 'July-24': 3, 'August-24': 0, 
                     'September-24': 0, 'October-24': 33, 'November-24': 0, 'December-24': 179, 
                     'January-25': 32.5, 'February-25': 137.2 }},
      { id: 3, zone: 'Infrastructure', type: 'MC', name: 'Pumping Station 04', meter: 'R52327', 
        consumption: { 'April-24': 830, 'May-24': 818, 'June-24': 720, 'July-24': 731, 'August-24': 857, 
                     'September-24': 1176, 'October-24': 445, 'November-24': 919, 'December-24': 921, 
                     'January-25': 245.1, 'February-25': 869.5 }},
      { id: 4, zone: 'Infrastructure', type: 'MC', name: 'Pumping Station 05', meter: 'R52325', 
        consumption: { 'April-24': 1774, 'May-24': 2216, 'June-24': 2011, 'July-24': 2059, 'August-24': 2229, 
                     'September-24': 5217, 'October-24': 2483, 'November-24': 2599, 'December-24': 1952, 
                     'January-25': 2069, 'February-25': 2521 }},
      { id: 5, zone: 'Infrastructure', type: 'MC', name: 'Lifting Station 02', meter: 'R52328', 
        consumption: { 'April-24': 44, 'May-24': 0, 'June-24': 0, 'July-24': 0, 'August-24': 153, 
                     'September-24': 125, 'October-24': 0, 'November-24': 0, 'December-24': 0, 
                     'January-25': 0, 'February-25': 0 }},
      { id: 6, zone: 'Infrastructure', type: 'MC', name: 'Lifting Station 03', meter: 'R52333', 
        consumption: { 'April-24': 198, 'May-24': 269, 'June-24': 122, 'July-24': 203, 'August-24': 208, 
                     'September-24': 257, 'October-24': 196, 'November-24': 91, 'December-24': 185, 
                     'January-25': 28, 'February-25': 40 }},
      { id: 7, zone: 'Infrastructure', type: 'MC', name: 'Lifting Station 04', meter: 'R52324', 
        consumption: { 'April-24': 644, 'May-24': 865, 'June-24': 791, 'July-24': 768, 'August-24': 747, 
                     'September-24': 723, 'October-24': 628, 'November-24': 686, 'December-24': 631, 
                     'January-25': 701, 'February-25': 638 }},
      { id: 8, zone: 'Infrastructure', type: 'MC', name: 'Lifting Station 05', meter: 'R52332', 
        consumption: { 'April-24': 2056, 'May-24': 2577, 'June-24': 2361, 'July-24': 3016, 'August-24': 3684, 
                     'September-24': 5866, 'October-24': 1715, 'November-24': 2413, 'December-24': 2643, 
                     'January-25': 2873, 'February-25': 3665 }},
      { id: 9, zone: 'Infrastructure', type: 'MC', name: 'Irrigation Tank 01', meter: 'R52324 (R52326)', 
        consumption: { 'April-24': 1543, 'May-24': 2673, 'June-24': 2763, 'July-24': 2623, 'August-24': 1467, 
                     'September-24': 1290, 'October-24': 1244, 'November-24': 1432, 'December-24': 1268, 
                     'January-25': 1689, 'February-25': 2214 }},
      { id: 10, zone: 'Infrastructure', type: 'MC', name: 'Irrigation Tank 02', meter: 'R52331', 
        consumption: { 'April-24': 1272, 'May-24': 2839, 'June-24': 3118, 'July-24': 2330, 'August-24': 2458, 
                     'September-24': 1875, 'October-24': 893, 'November-24': 974, 'December-24': 1026, 
                     'January-25': 983, 'February-25': 1124 }},
      { id: 24, zone: 'Infrastructure', type: 'MC', name: 'Beachwell', meter: 'R51903', 
        consumption: { 'April-24': 16908, 'May-24': 46, 'June-24': 19332, 'July-24': 23170, 'August-24': 42241, 
                     'September-24': 15223, 'October-24': 25370, 'November-24': 24383, 'December-24': 37236, 
                     'January-25': 38168, 'February-25': 18422 }},
      { id: 26, zone: 'Central Park', type: 'MC', name: 'Central Park', meter: 'R54672', 
        consumption: { 'April-24': 12208, 'May-24': 21845, 'June-24': 29438, 'July-24': 28186, 'August-24': 21995, 
                     'September-24': 20202, 'October-24': 14900, 'November-24': 9604, 'December-24': 19032, 
                     'January-25': 22819, 'February-25': 19974 }},
      { id: 27, zone: 'Ancilary Building', type: 'MC', name: 'Guard House', meter: 'R53651', 
        consumption: { 'April-24': 823, 'May-24': 1489, 'June-24': 1573.6, 'July-24': 1586.4, 'August-24': 1325, 
                     'September-24': 1391, 'October-24': 1205, 'November-24': 1225, 'December-24': 814, 
                     'January-25': 798, 'February-25': 936 }},
      { id: 28, zone: 'Ancilary Building', type: 'MC', name: 'Security Building', meter: 'R53649', 
        consumption: { 'April-24': 3529, 'May-24': 3898, 'June-24': 4255, 'July-24': 4359, 'August-24': 3728, 
                     'September-24': 3676, 'October-24': 3140, 'November-24': 5702, 'December-24': 5131, 
                     'January-25': 5559, 'February-25': 5417 }},
      { id: 29, zone: 'Ancilary Building', type: 'MC', name: 'ROP Building', meter: 'R53648', 
        consumption: { 'April-24': 2047, 'May-24': 4442, 'June-24': 3057, 'July-24': 4321, 'August-24': 4185, 
                     'September-24': 3554, 'October-24': 3692, 'November-24': 3581, 'December-24': 2352, 
                     'January-25': 2090, 'February-25': 2246 }},
      { id: 30, zone: 'Zone 3', type: 'SBJ Common Meter', name: 'D 44 Apartment', meter: 'R53705', 
        consumption: { 'April-24': 463, 'May-24': 2416, 'June-24': 2036, 'July-24': 2120, 'August-24': 1645, 
                     'September-24': 1717, 'October-24': 1643, 'November-24': 1377, 'December-24': 764, 
                     'January-25': 647, 'February-25': 657 }},
      { id: 31, zone: 'Zone 3', type: 'SBJ Common Meter', name: 'D 45 Apartment', meter: 'R53665', 
        consumption: { 'April-24': 709, 'May-24': 2944, 'June-24': 1267, 'July-24': 262, 'August-24': 3212, 
                     'September-24': 1330, 'October-24': 1570, 'November-24': 1252, 'December-24': 841, 
                     'January-25': 670, 'February-25': 556 }},
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
      const itemTotal = Object.values(item.consumption).reduce((a: number, b: number) => a + b, 0);
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
        return sum + Object.values(item.consumption).reduce((a: number, b: number) => a + b, 0);
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
        return sum + Object.values(item.consumption).reduce((a: number, b: number) => a + b, 0);
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
        return sum + (item.consumption[month] || 0);
      }, 0);
      
      return {
        name: month,
        total: monthTotal
      };
    });
    setMonthlyTrends(byMonth);
    
    // Find top consumers
    const consumers = data.map(item => {
      const itemTotal = Object.values(item.consumption).reduce((a: number, b: number) => a + b, 0);
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
    const rate = 0.025; // OMR per unit
    return (consumption * rate).toFixed(3);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="px-6 py-4 shadow-md" style={{ backgroundColor: COLORS.primary }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-xl font-bold text-white">Muscat Bay Electricity Dashboard</h1>
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
                  <path d="M16 16H8V14H16V16ZM16 10H8V8H16V10ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
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
                        {totalConsumption.toLocaleString()} kWh
                      </p>
                      <p className="text-sm text-gray-600">
                        Cost: {calculateCost(totalConsumption)} OMR
                      </p>
                    </div>
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${COLORS.light}40` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Average Monthly Consumption</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                        {Math.round(averageConsumption).toLocaleString()} kWh
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
                        {maxConsumption.toLocaleString()} kWh
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
                        <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} kWh`} />
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
                        <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} kWh`} />
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
                            {consumer.total.toLocaleString()} kWh
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
                        <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} kWh`} />
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
                            {category.value.toLocaleString()} kWh ({category.percentage.toFixed(1)}%)
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
                        <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} kWh`} />
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
                        <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} kWh`} />
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
                  Consumption Trends (All Stations)
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
                      <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} kWh`} />
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
                      <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} kWh`} />
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
                          Station ID
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
                              {currentValue.toLocaleString()} kWh
                            </td>
                            <td className="py-2 text-sm text-right">
                              <span className={`px-2 py-0.5 rounded-full text-white ${
                                Number(percentChange) > 0 ? 'bg-red-500' : 'bg-green-500'
                              }`}>
                                {Number(percentChange) > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2 text-sm text-right text-gray-900">
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
        <footer className="bg-white p-4 border-t mt-auto">
          <div className="container mx-auto flex justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2025 Muscat Bay Electricity Monitoring System
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

export default ElectricityDistribution;
