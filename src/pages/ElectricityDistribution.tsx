
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Calendar, Search, Download, Filter, ChevronDown, Moon, Sun, Zap, DollarSign, AlertTriangle, TrendingUp, Gauge } from 'lucide-react';
import Layout from '@/components/layout/Layout';

// Sample electricity consumption data based on the provided table
const electricityData = [
  { name: 'Pumping Station RS2330', account: 'RS2330', type: 'PS', 'Apr-24': 1608, 'May-24': 1940, 'Jun-24': 1783, 'Jul-24': 1874, 'Aug-24': 1662, 'Sep-24': 3822, 'Oct-24': 6876, 'Nov-24': 1629, 'Dec-24': 1640, 'Jan-24': 1903, 'Feb-24': 2095 },
  { name: 'Pumping Station RS2329', account: 'RS2329', type: 'PS', 'Apr-24': 31, 'May-24': 47, 'Jun-24': 25, 'Jul-24': 3, 'Aug-24': 0, 'Sep-24': 0, 'Oct-24': 33, 'Nov-24': 0, 'Dec-24': 179, 'Jan-24': 33, 'Feb-24': 137 },
  { name: 'Pumping Station RS2327', account: 'RS2327', type: 'PS', 'Apr-24': 830, 'May-24': 818, 'Jun-24': 720, 'Jul-24': 731, 'Aug-24': 857, 'Sep-24': 1176, 'Oct-24': 445, 'Nov-24': 919, 'Dec-24': 921, 'Jan-24': 245, 'Feb-24': 870 },
  { name: 'Pumping Station RS2325', account: 'RS2325', type: 'PS', 'Apr-24': 1774, 'May-24': 2216, 'Jun-24': 2011, 'Jul-24': 2059, 'Aug-24': 2229, 'Sep-24': 5217, 'Oct-24': 2483, 'Nov-24': 2599, 'Dec-24': 1952, 'Jan-24': 2069, 'Feb-24': 2521 },
  { name: 'Lifting Station RS2328', account: 'RS2328', type: 'LS', 'Apr-24': 44, 'May-24': 0, 'Jun-24': 0, 'Jul-24': 0, 'Aug-24': 153, 'Sep-24': 125, 'Oct-24': 0, 'Nov-24': 0, 'Dec-24': 0, 'Jan-24': 0, 'Feb-24': 0 },
  { name: 'Lifting Station RS2333', account: 'RS2333', type: 'LS', 'Apr-24': 198, 'May-24': 269, 'Jun-24': 122, 'Jul-24': 203, 'Aug-24': 208, 'Sep-24': 257, 'Oct-24': 196, 'Nov-24': 91, 'Dec-24': 185, 'Jan-24': 28, 'Feb-24': 40 },
  { name: 'Lifting Station RS2324', account: 'RS2324', type: 'LS', 'Apr-24': 644, 'May-24': 865, 'Jun-24': 791, 'Jul-24': 768, 'Aug-24': 747, 'Sep-24': 723, 'Oct-24': 628, 'Nov-24': 686, 'Dec-24': 631, 'Jan-24': 701, 'Feb-24': 638 },
  { name: 'Lifting Station RS2332', account: 'RS2332', type: 'LS', 'Apr-24': 2056, 'May-24': 2577, 'Jun-24': 2361, 'Jul-24': 3016, 'Aug-24': 3684, 'Sep-24': 5866, 'Oct-24': 1715, 'Nov-24': 2413, 'Dec-24': 2643, 'Jan-24': 2873, 'Feb-24': 3665 },
  { name: 'Irrigation RS2324', account: 'RS2324', type: 'IRR', 'Apr-24': 1543, 'May-24': 2673, 'Jun-24': 2763, 'Jul-24': 2623, 'Aug-24': 1467, 'Sep-24': 1290, 'Oct-24': 1244, 'Nov-24': 1432, 'Dec-24': 1268, 'Jan-24': 1689, 'Feb-24': 2214 },
  { name: 'Irrigation RS2331', account: 'RS2331', type: 'IRR', 'Apr-24': 1272, 'May-24': 2839, 'Jun-24': 3118, 'Jul-24': 2330, 'Aug-24': 2458, 'Sep-24': 1875, 'Oct-24': 893, 'Nov-24': 974, 'Dec-24': 1026, 'Jan-24': 983, 'Feb-24': 1124 },
  { name: 'Irrigation RS2323', account: 'RS2323', type: 'IRR', 'Apr-24': 894, 'May-24': 866, 'Jun-24': 1869, 'Jul-24': 1543, 'Aug-24': 1793, 'Sep-24': 524, 'Oct-24': 266, 'Nov-24': 269, 'Dec-24': 417, 'Jan-24': 840, 'Feb-24': 1009 },
  { name: 'Irrigation RS3195', account: 'RS3195', type: 'IRR', 'Apr-24': 880, 'May-24': 827, 'Jun-24': 555, 'Jul-24': 443, 'Aug-24': 336, 'Sep-24': 195, 'Oct-24': 183, 'Nov-24': 212, 'Dec-24': 213, 'Jan-24': 40, 'Feb-24': 233 },
  { name: 'Actuator RS3196', account: 'RS3196', type: 'DB', 'Apr-24': 39, 'May-24': 49, 'Jun-24': 43, 'Jul-24': 43, 'Aug-24': 45, 'Sep-24': 43, 'Oct-24': 36, 'Nov-24': 34, 'Dec-24': 29, 'Jan-24': 7, 'Feb-24': 28 },
  { name: 'Actuator RS1900', account: 'RS1900', type: 'DB', 'Apr-24': 285, 'May-24': 335, 'Jun-24': 275, 'Jul-24': 220, 'Aug-24': 210, 'Sep-24': 219, 'Oct-24': 165, 'Nov-24': 232, 'Dec-24': 161, 'Jan-24': 33, 'Feb-24': 134 },
  // Include more data as needed...
];

// Group the data by type for easier analysis
const groupedByType = {
  PS: electricityData.filter(item => item.type === 'PS'),
  LS: electricityData.filter(item => item.type === 'LS'),
  IRR: electricityData.filter(item => item.type === 'IRR'),
  DB: electricityData.filter(item => item.type === 'DB'),
  'Street Light': electricityData.filter(item => item.type === 'Street Light'),
  'D_Building': electricityData.filter(item => item.type === 'D_Building'),
  'FP-Landscape': electricityData.filter(item => item.type === 'FP-Landscape'),
  'Retail': electricityData.filter(item => item.type === 'Retail')
};

// Aggregated consumption by type per month
const aggregatedByType = [
  { type: 'Pumping Stations', color: '#60A5FA', totalConsumption: 25622, percentOfTotal: 25.1 },
  { type: 'Lifting Stations', color: '#F87171', totalConsumption: 19424, percentOfTotal: 19.0 },
  { type: 'Irrigation', color: '#34D399', totalConsumption: 15632, percentOfTotal: 15.3 },
  { type: 'D-Buildings', color: '#A78BFA', totalConsumption: 28971, percentOfTotal: 28.3 },
  { type: 'Street Lights', color: '#FBBF24', totalConsumption: 10574, percentOfTotal: 10.3 },
  { type: 'Retail', color: '#F472B6', totalConsumption: 1053, percentOfTotal: 1.0 },
  { type: 'FP-Landscape', color: '#6EE7B7', totalConsumption: 974, percentOfTotal: 1.0 }
];

// Monthly aggregated data
const monthlyData = [
  { month: 'Apr-24', PS: 4243, LS: 2942, IRR: 4589, DB: 726, 'Street Light': 7270, 'D_Building': 42293, 'FP-Landscape': 47, Retail: 0 },
  { month: 'May-24', PS: 5021, LS: 3711, IRR: 7205, DB: 953, 'Street Light': 8592, 'D_Building': 83372, 'FP-Landscape': 77, Retail: 0 },
  { month: 'Jun-24', PS: 4539, LS: 3274, IRR: 8305, DB: 830, 'Street Light': 8017, 'D_Building': 83654, 'FP-Landscape': 40, Retail: 0 },
  { month: 'Jul-24', PS: 4667, LS: 3987, IRR: 6939, DB: 740, 'Street Light': 9196, 'D_Building': 86533, 'FP-Landscape': 47, Retail: 17895 },
  { month: 'Aug-24', PS: 4748, LS: 4792, IRR: 6054, DB: 713, 'Street Light': 11959, 'D_Building': 89784, 'FP-Landscape': 44, Retail: 16532 },
  { month: 'Sep-24', PS: 10215, LS: 6971, IRR: 3884, DB: 811, 'Street Light': 10138, 'D_Building': 81318, 'FP-Landscape': 38, Retail: 18955 },
  { month: 'Oct-24', PS: 9837, LS: 2539, IRR: 2586, DB: 599, 'Street Light': 11854, 'D_Building': 84724, 'FP-Landscape': 40, Retail: 15071 },
  { month: 'Nov-24', PS: 5147, LS: 3190, IRR: 2887, DB: 725, 'Street Light': 12790, 'D_Building': 73558, 'FP-Landscape': 46, Retail: 16742 },
  { month: 'Dec-24', PS: 4692, LS: 3459, IRR: 2924, DB: 622, 'Street Light': 9961, 'D_Building': 68845, 'FP-Landscape': 56, Retail: 15554 },
  { month: 'Jan-24', PS: 4250, LS: 3602, IRR: 3552, DB: 333, 'Street Light': 4062, 'D_Building': 82877, 'FP-Landscape': 13, Retail: 16788 },
  { month: 'Feb-24', PS: 5623, LS: 4343, IRR: 4580, DB: 589, 'Street Light': 10976, 'D_Building': 52651, 'FP-Landscape': 57, Retail: 16154 }
];

// Cost per kWh by type (illustrative)
const COST_BY_TYPE = {
  PS: 0.048,
  LS: 0.048,
  IRR: 0.048,
  DB: 0.048,
  'Street Light': 0.048,
  'D_Building': 0.048,
  'FP-Landscape': 0.048,
  Retail: 0.048
};

interface ElectricityDistributionProps {}

const ElectricityDistribution: React.FC<ElectricityDistributionProps> = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedYear, setSelectedYear] = useState<string>('24');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [visibleTypes, setVisibleTypes] = useState<string[]>(['PS', 'LS', 'IRR', 'DB', 'Street Light', 'D_Building', 'FP-Landscape', 'Retail']);
  const [showYearDropdown, setShowYearDropdown] = useState<boolean>(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState<boolean>(false);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  
  // Months list for filtering
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  
  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num?.toLocaleString() || '0';
  };

  // Format currency
  const formatCurrency = (num: number): string => {
    return `${formatNumber(num)} OMR`;
  };

  // Toggle type visibility for charts
  const toggleTypeVisibility = (type: string) => {
    if (visibleTypes.includes(type)) {
      setVisibleTypes(visibleTypes.filter(t => t !== type));
    } else {
      setVisibleTypes([...visibleTypes, type]);
    }
  };

  // Calculate total consumption by type
  const calculateTotalByType = useMemo(() => {
    const totals: Record<string, number> = {};
    
    Object.keys(groupedByType).forEach(type => {
      totals[type] = groupedByType[type].reduce((sum, item) => {
        // Sum up all months for this type
        const monthlyValues = Object.entries(item)
          .filter(([key]) => key.includes('-24'))
          .map(([_, value]) => Number(value));
        
        return sum + monthlyValues.reduce((acc, curr) => acc + curr, 0);
      }, 0);
    });
    
    return totals;
  }, []);

  // Calculate total cost by type
  const calculateCostByType = useMemo(() => {
    const costs: Record<string, number> = {};
    
    Object.keys(calculateTotalByType).forEach(type => {
      costs[type] = calculateTotalByType[type] * COST_BY_TYPE[type as keyof typeof COST_BY_TYPE];
    });
    
    return costs;
  }, [calculateTotalByType]);

  // Calculate grand totals
  const grandTotal = useMemo(() => 
    Object.values(calculateTotalByType).reduce((acc, curr) => acc + curr, 0),
    [calculateTotalByType]
  );
  
  const grandTotalCost = useMemo(() => 
    Object.values(calculateCostByType).reduce((acc, curr) => acc + curr, 0),
    [calculateCostByType]
  );

  // Calculate monthly averages
  const monthlyAverage = Math.round(grandTotal / 12);

  // Background and text colors based on dark mode
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const secondaryText = darkMode ? 'text-gray-400' : 'text-gray-500';
  const activeTabBg = darkMode ? 'bg-gray-700' : 'bg-indigo-50';
  const activeTabText = darkMode ? 'text-indigo-400' : 'text-indigo-600';
  const headerBg = darkMode ? 'bg-gray-800' : 'bg-white';

  // Define tabs for the dashboard
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
    { id: 'consumption-types', label: 'Consumption Types', icon: <Zap size={16} /> },
    { id: 'cost-analysis', label: 'Cost Analysis', icon: <DollarSign size={16} /> },
    { id: 'anomalies', label: 'Anomalies', icon: <AlertTriangle size={16} /> }
  ];

  // Get display text for date filter
  const getDisplayText = () => {
    if (selectedYear === 'all' && selectedMonth === 'all') return 'All Data';
    if (selectedYear === 'all') return `${selectedMonth} (All Years)`;
    if (selectedMonth === 'all') return `All Months, 20${selectedYear}`;
    return `${selectedMonth} 20${selectedYear}`;
  };

  // Add CSS for no scrollbar when component mounts
  useEffect(() => {
    // Set document title
    document.title = 'Electricity Distribution | Muscat Bay Asset Manager';
    
    // Add style for no scrollbar
    const style = document.createElement('style');
    style.textContent = `
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Clean up
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Layout>
      <div className={`min-h-screen ${bgColor} ${textColor}`}>
        {/* Header */}
        <div className={`${headerBg} border-b ${borderColor} p-4 flex justify-between items-center`}>
          <div className="flex items-center">
            <div className="flex items-center justify-center p-2 w-10 h-10 rounded bg-indigo-600 text-white mr-3">
              <Zap size={20} />
            </div>
            <h1 className="text-2xl font-bold">Muscat Bay Electricity Distribution</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Year Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowYearDropdown(!showYearDropdown);
                  setShowMonthDropdown(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 border ${borderColor} rounded-md`}
              >
                <Calendar size={16} className={secondaryText} />
                <span>Year: 20{selectedYear}</span>
                <ChevronDown size={16} className={secondaryText} />
              </button>
              
              {showYearDropdown && (
                <div className={`absolute z-10 mt-1 w-48 rounded-md shadow-lg ${cardBg} ring-1 ring-black ring-opacity-5`}>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSelectedYear('24');
                        setShowYearDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${selectedYear === '24' ? 'bg-indigo-100 text-indigo-900' : `${secondaryText} hover:bg-gray-100`}`}
                    >
                      2024
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Month Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowMonthDropdown(!showMonthDropdown);
                  setShowYearDropdown(false);
                }}
                className={`flex items-center space-x-2 px-3 py-2 border ${borderColor} rounded-md`}
              >
                <Calendar size={16} className={secondaryText} />
                <span>Month: {selectedMonth === 'all' ? 'All' : selectedMonth}</span>
                <ChevronDown size={16} className={secondaryText} />
              </button>
              
              {showMonthDropdown && (
                <div className={`absolute z-10 mt-1 w-48 rounded-md shadow-lg ${cardBg} ring-1 ring-black ring-opacity-5`}>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSelectedMonth('all');
                        setShowMonthDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${selectedMonth === 'all' ? 'bg-indigo-100 text-indigo-900' : `${secondaryText} hover:bg-gray-100`}`}
                    >
                      All Months
                    </button>
                    {months.map(month => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(month);
                          setShowMonthDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${selectedMonth === month ? 'bg-indigo-100 text-indigo-900' : `${secondaryText} hover:bg-gray-100`}`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center"
              >
                <Download size={16} className="mr-2" />
                <span>Export</span>
                <ChevronDown size={16} className="ml-2" />
              </button>
              
              {showExportDropdown && (
                <div className={`absolute right-0 z-10 mt-1 w-48 rounded-md shadow-lg ${cardBg} ring-1 ring-black ring-opacity-5`}>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        console.log('Export as CSV');
                        setShowExportDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${secondaryText} hover:bg-gray-100`}
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        console.log('Export as Excel');
                        setShowExportDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${secondaryText} hover:bg-gray-100`}
                    >
                      Export as Excel
                    </button>
                    <button
                      onClick={() => {
                        console.log('Export as PDF');
                        setShowExportDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${secondaryText} hover:bg-gray-100`}
                    >
                      Export as PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Horizontal Navigation */}
        <div className={`${cardBg} border-b ${borderColor} py-3 px-6`}>
          <div className="flex overflow-x-auto no-scrollbar space-x-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md whitespace-nowrap transition-all duration-200 flex items-center ${
                  activeTab === tab.id 
                    ? `${activeTabBg} ${activeTabText} font-medium` 
                    : `hover:bg-gray-100 ${secondaryText}`
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 overflow-y-auto">
          {/* Current selection display */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Showing: <span className="text-indigo-600">{getDisplayText()}</span>
            </h2>
          </div>
          
          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards for Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Total Consumption</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{formatNumber(grandTotal)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>kWh for {getDisplayText()}</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Total Cost</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-indigo-600">{formatCurrency(grandTotalCost)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>0.048 OMR per kWh</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Largest Consumer</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-purple-600">D-Buildings</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>{Math.round(calculateTotalByType['D_Building'] / grandTotal * 100)}% of total</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Monthly Average</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{formatNumber(monthlyAverage)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>kWh per month</p>
                  </div>
                </div>
              </div>

              {/* Filters for types */}
              <div className={`${cardBg} p-4 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="font-medium mb-3">Filter by Type</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleTypeVisibility('PS')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('PS') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                    Pumping Stations
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('LS')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('LS') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                    Lifting Stations
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('IRR')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('IRR') ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                    Irrigation
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('DB')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('DB') ? 'bg-gray-500 text-gray-100' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-gray-800 mr-2"></span>
                    Actuators
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('Street Light')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('Street Light') ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                    Street Lights
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('D_Building')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('D_Building') ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                    D-Buildings
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('Retail')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('Retail') ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-pink-500 mr-2"></span>
                    Retail
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('FP-Landscape')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('FP-Landscape') ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
                    FP-Landscape
                  </button>
                </div>
              </div>

              {/* Monthly Consumption Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Monthly Consumption Trend</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatNumber(Number(value)) + ' kWh', '']} />
                      <Legend />
                      {visibleTypes.includes('PS') && (
                        <Line 
                          type="monotone" 
                          dataKey="PS" 
                          name="Pumping Stations" 
                          stroke="#60A5FA" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('LS') && (
                        <Line 
                          type="monotone" 
                          dataKey="LS" 
                          name="Lifting Stations" 
                          stroke="#F87171" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('IRR') && (
                        <Line 
                          type="monotone" 
                          dataKey="IRR" 
                          name="Irrigation" 
                          stroke="#34D399" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('DB') && (
                        <Line 
                          type="monotone" 
                          dataKey="DB" 
                          name="Actuators" 
                          stroke="#6B7280" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('Street Light') && (
                        <Line 
                          type="monotone" 
                          dataKey="Street Light" 
                          name="Street Light" 
                          stroke="#FBBF24" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('D_Building') && (
                        <Line 
                          type="monotone" 
                          dataKey="D_Building" 
                          name="D-Buildings" 
                          stroke="#A78BFA" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('FP-Landscape') && (
                        <Line 
                          type="monotone" 
                          dataKey="FP-Landscape" 
                          name="FP-Landscape" 
                          stroke="#6EE7B7" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('Retail') && (
                        <Line 
                          type="monotone" 
                          dataKey="Retail" 
                          name="Retail" 
                          stroke="#F472B6" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribution Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Type Distribution Chart */}
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Consumption by Type</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={aggregatedByType.filter(item => 
                            visibleTypes.includes(item.type === 'Pumping Stations' ? 'PS' : 
                                               item.type === 'Lifting Stations' ? 'LS' : 
                                               item.type === 'Irrigation' ? 'IRR' : 
                                               item.type === 'D-Buildings' ? 'D_Building' : 
                                               item.type === 'Street Lights' ? 'Street Light' : 
                                               item.type)
                          )}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="totalConsumption"
                          nameKey="type"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {aggregatedByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(Number(value)) + ' kWh'} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Consumption Composition Area Chart */}
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Consumption Composition</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatNumber(Number(value)) + ' kWh'} />
                        <Legend />
                        {visibleTypes.includes('PS') && (
                          <Area type="monotone" dataKey="PS" stackId="1" fill="#60A5FA" stroke="#60A5FA" name="Pumping Stations" />
                        )}
                        {visibleTypes.includes('LS') && (
                          <Area type="monotone" dataKey="LS" stackId="1" fill="#F87171" stroke="#F87171" name="Lifting Stations" />
                        )}
                        {visibleTypes.includes('IRR') && (
                          <Area type="monotone" dataKey="IRR" stackId="1" fill="#34D399" stroke="#34D399" name="Irrigation" />
                        )}
                        {visibleTypes.includes('DB') && (
                          <Area type="monotone" dataKey="DB" stackId="1" fill="#6B7280" stroke="#6B7280" name="Actuators" />
                        )}
                        {visibleTypes.includes('Street Light') && (
                          <Area type="monotone" dataKey="Street Light" stackId="1" fill="#FBBF24" stroke="#FBBF24" name="Street Lights" />
                        )}
                        {visibleTypes.includes('D_Building') && (
                          <Area type="monotone" dataKey="D_Building" stackId="1" fill="#A78BFA" stroke="#A78BFA" name="D-Buildings" />
                        )}
                        {visibleTypes.includes('FP-Landscape') && (
                          <Area type="monotone" dataKey="FP-Landscape" stackId="1" fill="#6EE7B7" stroke="#6EE7B7" name="FP-Landscape" />
                        )}
                        {visibleTypes.includes('Retail') && (
                          <Area type="monotone" dataKey="Retail" stackId="1" fill="#F472B6" stroke="#F472B6" name="Retail" />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Consumption Types Tab */}
          {activeTab === 'consumption-types' && (
            <>
              {/* Stats Cards for Consumption Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Pumping Stations</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-blue-500">{formatNumber(calculateTotalByType.PS)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>kWh ({((calculateTotalByType.PS / grandTotal) * 100).toFixed(1)}% of total)</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Lifting Stations</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-red-500">{formatNumber(calculateTotalByType.LS)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>kWh ({((calculateTotalByType.LS / grandTotal) * 100).toFixed(1)}% of total)</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>D-Buildings</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-purple-500">{formatNumber(calculateTotalByType.D_Building)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>kWh ({((calculateTotalByType.D_Building / grandTotal) * 100).toFixed(1)}% of total)</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Street Lights</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-yellow-500">{formatNumber(calculateTotalByType['Street Light'])}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>kWh ({((calculateTotalByType['Street Light'] / grandTotal) * 100).toFixed(1)}% of total)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Consumption by Type Bar Chart */}
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Consumption by Type</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Pumping Stations', value: calculateTotalByType.PS, color: '#60A5FA' },
                          { name: 'Lifting Stations', value: calculateTotalByType.LS, color: '#F87171' },
                          { name: 'Irrigation', value: calculateTotalByType.IRR, color: '#34D399' },
                          { name: 'Actuators', value: calculateTotalByType.DB, color: '#6B7280' },
                          { name: 'Street Lights', value: calculateTotalByType['Street Light'], color: '#FBBF24' },
                          { name: 'D-Buildings', value: calculateTotalByType.D_Building, color: '#A78BFA' },
                          { name: 'FP-Landscape', value: calculateTotalByType['FP-Landscape'], color: '#6EE7B7' },
                          { name: 'Retail', value: calculateTotalByType.Retail, color: '#F472B6' },
                        ].filter(item => 
                          visibleTypes.includes(
                            item.name === 'Pumping Stations' ? 'PS' : 
                            item.name === 'Lifting Stations' ? 'LS' : 
                            item.name === 'Irrigation' ? 'IRR' :
                            item.name === 'Actuators' ? 'DB' :
                            item.name === 'Street Lights' ? 'Street Light' :
                            item.name === 'D-Buildings' ? 'D_Building' :
                            item.name === 'FP-Landscape' ? 'FP-Landscape' :
                            'Retail'
                          )
                        )}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={110} />
                        <Tooltip formatter={(value) => formatNumber(Number(value)) + ' kWh'} />
                        <Bar 
                          dataKey="value" 
                          animationDuration={1000}
                        >
                          {[
                            { name: 'Pumping Stations', color: '#60A5FA' },
                            { name: 'Lifting Stations', color: '#F87171' },
                            { name: 'Irrigation', color: '#34D399' },
                            { name: 'Actuators', color: '#6B7280' },
                            { name: 'Street Lights', color: '#FBBF24' },
                            { name: 'D-Buildings', color: '#A78BFA' },
                            { name: 'FP-Landscape', color: '#6EE7B7' },
                            { name: 'Retail', color: '#F472B6' },
                          ]
                            .filter(item => 
                              visibleTypes.includes(
                                item.name === 'Pumping Stations' ? 'PS' : 
                                item.name === 'Lifting Stations' ? 'LS' : 
                                item.name === 'Irrigation' ? 'IRR' :
                                item.name === 'Actuators' ? 'DB' :
                                item.name === 'Street Lights' ? 'Street Light' :
                                item.name === 'D-Buildings' ? 'D_Building' :
                                item.name === 'FP-Landscape' ? 'FP-Landscape' :
                                'Retail'
                              )
                            )
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cost Distribution */}
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Cost Distribution</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pumping Stations', value: calculateCostByType.PS, color: '#60A5FA' },
                            { name: 'Lifting Stations', value: calculateCostByType.LS, color: '#F87171' },
                            { name: 'Irrigation', value: calculateCostByType.IRR, color: '#34D399' },
                            { name: 'Actuators', value: calculateCostByType.DB, color: '#6B7280' },
                            { name: 'Street Lights', value: calculateCostByType['Street Light'], color: '#FBBF24' },
                            { name: 'D-Buildings', value: calculateCostByType.D_Building, color: '#A78BFA' },
                            { name: 'FP-Landscape', value: calculateCostByType['FP-Landscape'], color: '#6EE7B7' },
                            { name: 'Retail', value: calculateCostByType.Retail, color: '#F472B6' },
                          ].filter(item => 
                            visibleTypes.includes(
                              item.name === 'Pumping Stations' ? 'PS' : 
                              item.name === 'Lifting Stations' ? 'LS' : 
                              item.name === 'Irrigation' ? 'IRR' :
                              item.name === 'Actuators' ? 'DB' :
                              item.name === 'Street Lights' ? 'Street Light' :
                              item.name === 'D-Buildings' ? 'D_Building' :
                              item.name === 'FP-Landscape' ? 'FP-Landscape' :
                              'Retail'
                            )
                          )}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {[
                            { name: 'Pumping Stations', color: '#60A5FA' },
                            { name: 'Lifting Stations', color: '#F87171' },
                            { name: 'Irrigation', color: '#34D399' },
                            { name: 'Actuators', color: '#6B7280' },
                            { name: 'Street Lights', color: '#FBBF24' },
                            { name: 'D-Buildings', color: '#A78BFA' },
                            { name: 'FP-Landscape', color: '#6EE7B7' },
                            { name: 'Retail', color: '#F472B6' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Consumption Trend by Type */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Consumption Trend by Type</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatNumber(Number(value)) + ' kWh'} />
                      <Legend />
                      {visibleTypes.includes('PS') && (
                        <Line 
                          type="monotone" 
                          dataKey="PS" 
                          name="Pumping Stations" 
                          stroke="#60A5FA" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('LS') && (
                        <Line 
                          type="monotone" 
                          dataKey="LS" 
                          name="Lifting Stations" 
                          stroke="#F87171" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('IRR') && (
                        <Line 
                          type="monotone" 
                          dataKey="IRR" 
                          name="Irrigation" 
                          stroke="#34D399" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('DB') && (
                        <Line 
                          type="monotone" 
                          dataKey="DB" 
                          name="Actuators" 
                          stroke="#6B7280" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('Street Light') && (
                        <Line 
                          type="monotone" 
                          dataKey="Street Light" 
                          name="Street Lights" 
                          stroke="#FBBF24" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('D_Building') && (
                        <Line 
                          type="monotone" 
                          dataKey="D_Building" 
                          name="D-Buildings" 
                          stroke="#A78BFA" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('FP-Landscape') && (
                        <Line 
                          type="monotone" 
                          dataKey="FP-Landscape" 
                          name="FP-Landscape" 
                          stroke="#6EE7B7" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('Retail') && (
                        <Line 
                          type="monotone" 
                          dataKey="Retail" 
                          name="Retail" 
                          stroke="#F472B6" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Cost Analysis Tab */}
          {activeTab === 'cost-analysis' && (
            <>
              {/* Stats Cards for Cost Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Total Cost</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-indigo-600">{formatCurrency(grandTotalCost)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>For all electricity usage</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>D-Buildings Cost</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-purple-600">{formatCurrency(calculateCostByType.D_Building)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>{((calculateCostByType.D_Building / grandTotalCost) * 100).toFixed(1)}% of total cost</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Pumping Stations Cost</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-blue-600">{formatCurrency(calculateCostByType.PS)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>{((calculateCostByType.PS / grandTotalCost) * 100).toFixed(1)}% of total cost</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Rate per kWh</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">0.048 OMR</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>Standard electricity rate</p>
                  </div>
                </div>
              </div>
              
              {/* Monthly Cost Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Monthly Cost by Type</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData.map(month => {
                        // Convert each consumption value to cost
                        const costData: any = { month: month.month };
                        Object.keys(month).forEach(key => {
                          if (key !== 'month') {
                            costData[key] = month[key as keyof typeof month] * COST_BY_TYPE[key as keyof typeof COST_BY_TYPE];
                          }
                        });
                        return costData;
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      {visibleTypes.includes('PS') && (
                        <Bar dataKey="PS" name="Pumping Stations" fill="#60A5FA" />
                      )}
                      {visibleTypes.includes('LS') && (
                        <Bar dataKey="LS" name="Lifting Stations" fill="#F87171" />
                      )}
                      {visibleTypes.includes('IRR') && (
                        <Bar dataKey="IRR" name="Irrigation" fill="#34D399" />
                      )}
                      {visibleTypes.includes('DB') && (
                        <Bar dataKey="DB" name="Actuators" fill="#6B7280" />
                      )}
                      {visibleTypes.includes('Street Light') && (
                        <Bar dataKey="Street Light" name="Street Lights" fill="#FBBF24" />
                      )}
                      {visibleTypes.includes('D_Building') && (
                        <Bar dataKey="D_Building" name="D-Buildings" fill="#A78BFA" />
                      )}
                      {visibleTypes.includes('FP-Landscape') && (
                        <Bar dataKey="FP-Landscape" name="FP-Landscape" fill="#6EE7B7" />
                      )}
                      {visibleTypes.includes('Retail') && (
                        <Bar dataKey="Retail" name="Retail" fill="#F472B6" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Cost Distribution Pie Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Cost Distribution</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pumping Stations', value: calculateCostByType.PS, color: '#60A5FA' },
                          { name: 'Lifting Stations', value: calculateCostByType.LS, color: '#F87171' },
                          { name: 'Irrigation', value: calculateCostByType.IRR, color: '#34D399' },
                          { name: 'Actuators', value: calculateCostByType.DB, color: '#6B7280' },
                          { name: 'Street Lights', value: calculateCostByType['Street Light'], color: '#FBBF24' },
                          { name: 'D-Buildings', value: calculateCostByType.D_Building, color: '#A78BFA' },
                          { name: 'FP-Landscape', value: calculateCostByType['FP-Landscape'], color: '#6EE7B7' },
                          { name: 'Retail', value: calculateCostByType.Retail, color: '#F472B6' },
                        ].filter(item => 
                          visibleTypes.includes(
                            item.name === 'Pumping Stations' ? 'PS' : 
                            item.name === 'Lifting Stations' ? 'LS' : 
                            item.name === 'Irrigation' ? 'IRR' :
                            item.name === 'Actuators' ? 'DB' :
                            item.name === 'Street Lights' ? 'Street Light' :
                            item.name === 'D-Buildings' ? 'D_Building' :
                            item.name === 'FP-Landscape' ? 'FP-Landscape' :
                            'Retail'
                          )
                        )}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {[
                          { name: 'Pumping Stations', color: '#60A5FA' },
                          { name: 'Lifting Stations', color: '#F87171' },
                          { name: 'Irrigation', color: '#34D399' },
                          { name: 'Actuators', color: '#6B7280' },
                          { name: 'Street Lights', color: '#FBBF24' },
                          { name: 'D-Buildings', color: '#A78BFA' },
                          { name: 'FP-Landscape', color: '#6EE7B7' },
                          { name: 'Retail', color: '#F472B6' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Anomalies Tab */}
          {activeTab === 'anomalies' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Consumption Irregularities</h2>
                  <div className="space-y-4">
                    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mr-3">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-orange-800">Beachwell RS1903 (D_Building)</p>
                          <p className="text-sm text-orange-700">Significant fluctuation in consumption patterns</p>
                          <p className="text-xs text-orange-600 mt-1">42241 kWh in Aug-24 vs 46 kWh in May-24</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 mr-3">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-800">Lifting Station RS2332 (LS)</p>
                          <p className="text-sm text-red-700">High consumption spike in Sep-24</p>
                          <p className="text-xs text-red-600 mt-1">5866 kWh (Sep-24) vs 3684 kWh (Aug-24)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-yellow-800">D Building RS3668 (D_Building)</p>
                          <p className="text-sm text-yellow-700">Unusual consumption spike in May-24</p>
                          <p className="text-xs text-yellow-600 mt-1">6744 kWh in May-24 vs ~1200 kWh average</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-800">Central Pa RS4672 (D_Building)</p>
                          <p className="text-sm text-purple-700">Consistently high consumption</p>
                          <p className="text-xs text-purple-600 mt-1">Average 20,000+ kWh monthly</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Anomaly Detection</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: 'Apr-24', value: 16908, threshold: 18000 },
                          { month: 'May-24', value: 46, threshold: 18000 },
                          { month: 'Jun-24', value: 19332, threshold: 18000 },
                          { month: 'Jul-24', value: 23170, threshold: 18000 },
                          { month: 'Aug-24', value: 42241, threshold: 18000 },
                          { month: 'Sep-24', value: 15223, threshold: 18000 },
                          { month: 'Oct-24', value: 25370, threshold: 18000 },
                          { month: 'Nov-24', value: 24383, threshold: 18000 },
                          { month: 'Dec-24', value: 37236, threshold: 18000 },
                          { month: 'Jan-24', value: 38168, threshold: 18000 },
                          { month: 'Feb-24', value: 18422, threshold: 18000 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatNumber(Number(value)) + ' kWh'} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          name="Beachwell RS1903 Consumption" 
                          stroke="#F97316" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="threshold" 
                          name="Expected Threshold" 
                          stroke="#9333EA" 
                          strokeDasharray="5 5"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Consumption Variance Analysis</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Value</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Value</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RS1903</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Beachwell</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">D_Building</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">42241 kWh</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">46 kWh</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">91740%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Critical
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RS2332</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Lifting Station</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">LS</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5866 kWh</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1715 kWh</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">242%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Warning
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RS3668</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">D Building</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">D_Building</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">6744 kWh</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">475 kWh</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1319%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                            High
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ElectricityDistribution;
