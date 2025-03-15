import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Calendar, Search, Download, Filter, ChevronDown, Moon, Sun, Zap, DollarSign, TrendingUp, Activity, BarChart2, AlertTriangle } from 'lucide-react';
import Layout from '@/components/layout/Layout';

// Sample electricity consumption data based on the provided file
const electricityData = [{
  name: 'Pumping Station 01',
  account: 'R52330',
  type: 'PS',
  'Apr-24': 1608,
  'May-24': 1940,
  'Jun-24': 1783,
  'Jul-24': 1874,
  'Aug-24': 1662,
  'Sep-24': 3822,
  'Oct-24': 6876,
  'Nov-24': 1629,
  'Dec-24': 1640,
  'Jan-24': 1903,
  'Feb-24': 2095
}, {
  name: 'Pumping Station 03',
  account: 'R52329',
  type: 'PS',
  'Apr-24': 31,
  'May-24': 47,
  'Jun-24': 25,
  'Jul-24': 3,
  'Aug-24': 0,
  'Sep-24': 0,
  'Oct-24': 33,
  'Nov-24': 0,
  'Dec-24': 179,
  'Jan-24': 33,
  'Feb-24': 137
}, {
  name: 'Pumping Station 04',
  account: 'R52327',
  type: 'PS',
  'Apr-24': 830,
  'May-24': 818,
  'Jun-24': 720,
  'Jul-24': 731,
  'Aug-24': 857,
  'Sep-24': 1176,
  'Oct-24': 445,
  'Nov-24': 919,
  'Dec-24': 921,
  'Jan-24': 245,
  'Feb-24': 870
}, {
  name: 'Pumping Station 05',
  account: 'R52325',
  type: 'PS',
  'Apr-24': 1774,
  'May-24': 2216,
  'Jun-24': 2011,
  'Jul-24': 2059,
  'Aug-24': 2229,
  'Sep-24': 5217,
  'Oct-24': 2483,
  'Nov-24': 2599,
  'Dec-24': 1952,
  'Jan-24': 2069,
  'Feb-24': 2521
}, {
  name: 'Lifting Station 02',
  account: 'R52328',
  type: 'LS',
  'Apr-24': 44,
  'May-24': 0,
  'Jun-24': 0,
  'Jul-24': 0,
  'Aug-24': 153,
  'Sep-24': 125,
  'Oct-24': 0,
  'Nov-24': 0,
  'Dec-24': 0,
  'Jan-24': 0,
  'Feb-24': 0
}, {
  name: 'Lifting Station 03',
  account: 'R52333',
  type: 'LS',
  'Apr-24': 198,
  'May-24': 269,
  'Jun-24': 122,
  'Jul-24': 203,
  'Aug-24': 208,
  'Sep-24': 257,
  'Oct-24': 196,
  'Nov-24': 91,
  'Dec-24': 185,
  'Jan-24': 28,
  'Feb-24': 40
}, {
  name: 'Lifting Station 04',
  account: 'R52324',
  type: 'LS',
  'Apr-24': 644,
  'May-24': 865,
  'Jun-24': 791,
  'Jul-24': 768,
  'Aug-24': 747,
  'Sep-24': 723,
  'Oct-24': 628,
  'Nov-24': 686,
  'Dec-24': 631,
  'Jan-24': 701,
  'Feb-24': 638
}, {
  name: 'Lifting Station 05',
  account: 'R52332',
  type: 'LS',
  'Apr-24': 2056,
  'May-24': 2577,
  'Jun-24': 2361,
  'Jul-24': 3016,
  'Aug-24': 3684,
  'Sep-24': 5866,
  'Oct-24': 1715,
  'Nov-24': 2413,
  'Dec-24': 2643,
  'Jan-24': 2873,
  'Feb-24': 3665
}, {
  name: 'Irrigation Tank 01',
  account: 'R52324 (R52326)',
  type: 'IRR',
  'Apr-24': 1543,
  'May-24': 2673,
  'Jun-24': 2763,
  'Jul-24': 2623,
  'Aug-24': 1467,
  'Sep-24': 1290,
  'Oct-24': 1244,
  'Nov-24': 1432,
  'Dec-24': 1268,
  'Jan-24': 1689,
  'Feb-24': 2214
}, {
  name: 'Irrigation Tank 02',
  account: 'R52331',
  type: 'IRR',
  'Apr-24': 1272,
  'May-24': 2839,
  'Jun-24': 3118,
  'Jul-24': 2330,
  'Aug-24': 2458,
  'Sep-24': 1875,
  'Oct-24': 893,
  'Nov-24': 974,
  'Dec-24': 1026,
  'Jan-24': 983,
  'Feb-24': 1124
}, {
  name: 'Irrigation Tank 03',
  account: 'R52323',
  type: 'IRR',
  'Apr-24': 894,
  'May-24': 866,
  'Jun-24': 1869,
  'Jul-24': 1543,
  'Aug-24': 1793,
  'Sep-24': 524,
  'Oct-24': 266,
  'Nov-24': 269,
  'Dec-24': 417,
  'Jan-24': 840,
  'Feb-24': 1009
}, {
  name: 'Irrigation Tank 04',
  account: 'R53195',
  type: 'IRR',
  'Apr-24': 880,
  'May-24': 827,
  'Jun-24': 555,
  'Jul-24': 443,
  'Aug-24': 336,
  'Sep-24': 195,
  'Oct-24': 183,
  'Nov-24': 212,
  'Dec-24': 213,
  'Jan-24': 40,
  'Feb-24': 233
}, {
  name: 'Actuator DB 01 (Z8)',
  account: 'R53196',
  type: 'DB',
  'Apr-24': 39,
  'May-24': 49,
  'Jun-24': 43,
  'Jul-24': 43,
  'Aug-24': 45,
  'Sep-24': 43,
  'Oct-24': 36,
  'Nov-24': 34,
  'Dec-24': 29,
  'Jan-24': 7,
  'Feb-24': 28
}, {
  name: 'Actuator DB 02',
  account: 'R51900',
  type: 'DB',
  'Apr-24': 285,
  'May-24': 335,
  'Jun-24': 275,
  'Jul-24': 220,
  'Aug-24': 210,
  'Sep-24': 219,
  'Oct-24': 165,
  'Nov-24': 232,
  'Dec-24': 161,
  'Jan-24': 33,
  'Feb-24': 134
}, {
  name: 'Actuator DB 03',
  account: 'R51904',
  type: 'DB',
  'Apr-24': 188,
  'May-24': 226,
  'Jun-24': 197,
  'Jul-24': 203,
  'Aug-24': 212,
  'Sep-24': 203,
  'Oct-24': 196,
  'Nov-24': 220,
  'Dec-24': 199,
  'Jan-24': 56,
  'Feb-24': 203
}, {
  name: 'Actuator DB 04',
  account: 'R51901',
  type: 'DB',
  'Apr-24': 159,
  'May-24': 275,
  'Jun-24': 258,
  'Jul-24': 210,
  'Aug-24': 184,
  'Sep-24': 201,
  'Oct-24': 144,
  'Nov-24': 172,
  'Dec-24': 173,
  'Jan-24': 186,
  'Feb-24': 161
}, {
  name: 'Actuator DB 05',
  account: 'R51907',
  type: 'DB',
  'Apr-24': 15,
  'May-24': 18,
  'Jun-24': 15,
  'Jul-24': 16,
  'Aug-24': 16,
  'Sep-24': 16,
  'Oct-24': 15,
  'Nov-24': 18,
  'Dec-24': 16,
  'Jan-24': 4,
  'Feb-24': 18
}, {
  name: 'Actuator DB 06',
  account: 'R51909',
  type: 'DB',
  'Apr-24': 39,
  'May-24': 50,
  'Jun-24': 42,
  'Jul-24': 48,
  'Aug-24': 46,
  'Sep-24': 129,
  'Oct-24': 43,
  'Nov-24': 49,
  'Dec-24': 44,
  'Jan-24': 47,
  'Feb-24': 45
}, {
  name: 'Street Light FP 01 (Z8)',
  account: 'R53197',
  type: 'Street Light',
  'Apr-24': 2773,
  'May-24': 3276,
  'Jun-24': 3268,
  'Jul-24': 3040,
  'Aug-24': 3203,
  'Sep-24': 3225,
  'Oct-24': 3064,
  'Nov-24': 3593,
  'Dec-24': 3147,
  'Jan-24': 787,
  'Feb-24': 3228
}, {
  name: 'Street Light FP 02',
  account: 'R51906',
  type: 'Street Light',
  'Apr-24': 1705,
  'May-24': 2076,
  'Jun-24': 1758,
  'Jul-24': 1738,
  'Aug-24': 1940,
  'Sep-24': 2006,
  'Oct-24': 1944,
  'Nov-24': 2361,
  'Dec-24': 2258,
  'Jan-24': 633,
  'Feb-24': 2298
}, {
  name: 'Street Light FP 03',
  account: 'R51905',
  type: 'Street Light',
  'Apr-24': 1399,
  'May-24': 1608,
  'Jun-24': 1365,
  'Jul-24': 1380,
  'Aug-24': 1457,
  'Sep-24': 1499,
  'Oct-24': 1561,
  'Nov-24': 2060,
  'Dec-24': 1966,
  'Jan-24': 1868,
  'Feb-24': 1974
}, {
  name: 'Street Light FP 04',
  account: 'R51908',
  type: 'Street Light',
  'Apr-24': 861,
  'May-24': 1045,
  'Jun-24': 1051,
  'Jul-24': 2268,
  'Aug-24': 2478,
  'Sep-24': 2513,
  'Oct-24': 2341,
  'Nov-24': 2299,
  'Dec-24': 1389,
  'Jan-24': 325,
  'Feb-24': 1406
}, {
  name: 'Street Light FP 05',
  account: 'R51902',
  type: 'Street Light',
  'Apr-24': 532,
  'May-24': 587,
  'Jun-24': 575,
  'Jul-24': 770,
  'Aug-24': 1341,
  'Sep-24': 1895,
  'Oct-24': 1844,
  'Nov-24': 1477,
  'Dec-24': 1121,
  'Jan-24': 449,
  'Feb-24': 2070
}, {
  name: 'Beachwell',
  account: 'R51903',
  type: 'D_Building',
  'Apr-24': 16908,
  'May-24': 46,
  'Jun-24': 19332,
  'Jul-24': 23170,
  'Aug-24': 42241,
  'Sep-24': 15223,
  'Oct-24': 25370,
  'Nov-24': 24383,
  'Dec-24': 37236,
  'Jan-24': 38168,
  'Feb-24': 18422
}, {
  name: 'Helipad',
  account: 'R52334',
  type: 'D_Building',
  'Apr-24': 0,
  'May-24': 0,
  'Jun-24': 0,
  'Jul-24': 0,
  'Aug-24': 0,
  'Sep-24': 0,
  'Oct-24': 0,
  'Nov-24': 0,
  'Dec-24': 0,
  'Jan-24': 0,
  'Feb-24': 0
}, {
  name: 'Central Park',
  account: 'R54672',
  type: 'D_Building',
  'Apr-24': 12208,
  'May-24': 21845,
  'Jun-24': 29438,
  'Jul-24': 28186,
  'Aug-24': 21995,
  'Sep-24': 20202,
  'Oct-24': 14900,
  'Nov-24': 9604,
  'Dec-24': 19032,
  'Jan-24': 22819,
  'Feb-24': 19974
}, {
  name: 'Guard House',
  account: 'R53651',
  type: 'D_Building',
  'Apr-24': 823,
  'May-24': 1489,
  'Jun-24': 1574,
  'Jul-24': 1586,
  'Aug-24': 1325,
  'Sep-24': 1391,
  'Oct-24': 1205,
  'Nov-24': 1225,
  'Dec-24': 814,
  'Jan-24': 798,
  'Feb-24': 936
}, {
  name: 'Security Building',
  account: 'R53649',
  type: 'D_Building',
  'Apr-24': 3529,
  'May-24': 3898,
  'Jun-24': 4255,
  'Jul-24': 4359,
  'Aug-24': 3728,
  'Sep-24': 3676,
  'Oct-24': 3140,
  'Nov-24': 5702,
  'Dec-24': 5131,
  'Jan-24': 5559,
  'Feb-24': 5417
}, {
  name: 'ROP Building',
  account: 'R53648',
  type: 'D_Building',
  'Apr-24': 2047,
  'May-24': 4442,
  'Jun-24': 3057,
  'Jul-24': 4321,
  'Aug-24': 4185,
  'Sep-24': 3554,
  'Oct-24': 3692,
  'Nov-24': 3581,
  'Dec-24': 2352,
  'Jan-24': 2090,
  'Feb-24': 2246
}, {
  name: 'D Building 44',
  account: 'R53705',
  type: 'D_Building',
  'Apr-24': 463,
  'May-24': 2416,
  'Jun-24': 2036,
  'Jul-24': 2120,
  'Aug-24': 1645,
  'Sep-24': 1717,
  'Oct-24': 1643,
  'Nov-24': 1377,
  'Dec-24': 764,
  'Jan-24': 647,
  'Feb-24': 657
}, {
  name: 'Bank muscat',
  account: '',
  type: 'Retail',
  'Apr-24': 0,
  'May-24': 0,
  'Jun-24': 0,
  'Jul-24': 3,
  'Aug-24': 71,
  'Sep-24': -2,
  'Oct-24': 1407,
  'Nov-24': 148,
  'Dec-24': 72,
  'Jan-24': 59,
  'Feb-24': 98
}, {
  name: 'CIF kitchen',
  account: '',
  type: 'Retail',
  'Apr-24': 0,
  'May-24': 0,
  'Jun-24': 0,
  'Jul-24': 17895,
  'Aug-24': 16532,
  'Sep-24': 18955,
  'Oct-24': 15071,
  'Nov-24': 16742,
  'Dec-24': 15554,
  'Jan-24': 16788,
  'Feb-24': 16154
}];

// Map month indexes to month names for better reference
const monthMapping = {
  'Apr-24': 0,
  'May-24': 1,
  'Jun-24': 2,
  'Jul-24': 3,
  'Aug-24': 4,
  'Sep-24': 5,
  'Oct-24': 6,
  'Nov-24': 7,
  'Dec-24': 8,
  'Jan-24': 9,
  'Feb-24': 10
};

// All month names in order
const monthNames = ['Apr-24', 'May-24', 'Jun-24', 'Jul-24', 'Aug-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24', 'Jan-24', 'Feb-24'];

// Get unique facility types for filtering
const facilityTypes = [...new Set(electricityData.map(item => item.type))];

// Transform data for visualization
const transformedData = monthNames.map(month => {
  const monthData = {
    month
  };
  facilityTypes.forEach(type => {
    const typeTotal = electricityData.filter(item => item.type === type).reduce((sum, item) => sum + (item[month] || 0), 0);
    monthData[type] = typeTotal;
  });
  monthData.total = facilityTypes.reduce((sum, type) => sum + (monthData[type] || 0), 0);
  return monthData;
});

// Electricity Dashboard Component
const ElectricitySystem = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [visibleTypes, setVisibleTypes] = useState([...facilityTypes]);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [filteredData, setFilteredData] = useState(transformedData);

  // Electricity cost per kWh
  const COST_PER_KWH = 0.025;

  // Format numbers with commas
  const formatNumber = num => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString();
  };

  // Format currency
  const formatCurrency = num => {
    if (num === undefined || num === null) return '0 OMR';
    return `${(num * COST_PER_KWH).toLocaleString(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    })} OMR`;
  };

  // Filter data based on selected month
  useEffect(() => {
    if (selectedMonth === 'all') {
      setFilteredData(transformedData);
    } else {
      setFilteredData(transformedData.filter(item => item.month === selectedMonth));
    }
  }, [selectedMonth]);

  // Calculate metrics for dashboard
  const metrics = useMemo(() => {
    const totalConsumption = filteredData.reduce((sum, month) => sum + month.total, 0);
    const averageMonthlyConsumption = Math.round(totalConsumption / (filteredData.length || 1));

    // Calculate consumption by type
    const consumptionByType = {};
    facilityTypes.forEach(type => {
      consumptionByType[type] = filteredData.reduce((sum, month) => sum + (month[type] || 0), 0);
    });

    // Calculate cost by type
    const costByType = {};
    facilityTypes.forEach(type => {
      costByType[type] = consumptionByType[type] * COST_PER_KWH;
    });

    // Total cost
    const totalCost = totalConsumption * COST_PER_KWH;

    // Find peak month
    let peakMonth = null;
    let peakConsumption = 0;
    filteredData.forEach(month => {
      if (month.total > peakConsumption) {
        peakConsumption = month.total;
        peakMonth = month.month;
      }
    });

    // Get consumption for the most recent month
    const latestMonth = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;
    return {
      totalConsumption,
      averageMonthlyConsumption,
      consumptionByType,
      costByType,
      totalCost,
      peakMonth,
      peakConsumption,
      latestMonth
    };
  }, [filteredData, COST_PER_KWH]);

  // Toggle a type's visibility
  const toggleTypeVisibility = type => {
    if (visibleTypes.includes(type)) {
      setVisibleTypes(visibleTypes.filter(t => t !== type));
    } else {
      setVisibleTypes([...visibleTypes, type]);
    }
  };

  // Background and text colors based on dark mode
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const secondaryText = darkMode ? 'text-gray-400' : 'text-gray-500';
  const activeTabBg = darkMode ? 'bg-gray-700' : 'bg-yellow-50';
  const activeTabText = darkMode ? 'text-yellow-400' : 'text-yellow-600';
  const headerBg = darkMode ? 'bg-gray-800' : 'bg-white';

  // Define tabs for the dashboard
  const tabs = [{
    id: 'overview',
    label: 'Overview',
    icon: <TrendingUp size={16} />
  }, {
    id: 'consumption',
    label: 'Consumption Analysis',
    icon: <BarChart2 size={16} />
  }, {
    id: 'facilities',
    label: 'Facility Types',
    icon: <Activity size={16} />
  }, {
    id: 'costs',
    label: 'Cost Analysis',
    icon: <DollarSign size={16} />
  }];

  // Get display text for date filter
  const getDisplayText = () => {
    return selectedMonth === 'all' ? 'All Months' : selectedMonth;
  };

  // Generate type-specific colors
  const typeColors = {
    'PS': '#F59E0B',
    // Amber
    'LS': '#10B981',
    // Emerald
    'IRR': '#3B82F6',
    // Blue
    'DB': '#8B5CF6',
    // Purple
    'Street Light': '#EC4899',
    // Pink
    'D_Building': '#EF4444',
    // Red
    'FP-Landscape Lights Z3': '#6366F1',
    // Indigo
    'Retail': '#F97316' // Orange
  };

  // Prepare data for pie chart
  const consumptionByTypeData = Object.keys(metrics.consumptionByType || {}).filter(type => visibleTypes.includes(type)).map(type => ({
    name: type,
    value: metrics.consumptionByType[type],
    color: typeColors[type]
  }));

  // Calculate total visible consumption for percentage calculation
  const totalVisibleConsumption = consumptionByTypeData.reduce((sum, item) => sum + item.value, 0);

  // Add percentage to pie chart data
  consumptionByTypeData.forEach(item => {
    item.percent = item.value / totalVisibleConsumption * 100;
  });
  return <Layout>
      <div className={`min-h-screen ${textColor}`}>
        {/* Header */}
        <div className={`${cardBg} border-b ${borderColor} p-4 flex justify-between items-center mb-4 rounded-lg shadow-sm`}>
          <div className="flex items-center">
            <div className="flex items-center justify-center p-2 w-10 h-10 rounded text-white mr-3 bg-[#71657c]">
              <Zap size={20} />
            </div>
            <h1 className="text-2xl font-bold">Muscat Bay Electricity System</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Month Selector */}
            <div className="relative">
              <button onClick={() => setShowMonthDropdown(!showMonthDropdown)} className={`flex items-center space-x-2 px-3 py-2 border ${borderColor} rounded-md`}>
                <Calendar size={16} className={secondaryText} />
                <span>Month: {getDisplayText()}</span>
                <ChevronDown size={16} className={secondaryText} />
              </button>
              
              {showMonthDropdown && <div className={`absolute z-10 mt-1 w-48 rounded-md shadow-lg ${cardBg} ring-1 ring-black ring-opacity-5`}>
                  <div className="py-1">
                    <button key="all" onClick={() => {
                  setSelectedMonth('all');
                  setShowMonthDropdown(false);
                }} className={`block w-full text-left px-4 py-2 text-sm ${selectedMonth === 'all' ? 'bg-yellow-100 text-yellow-900' : `${secondaryText} hover:bg-gray-100`}`}>
                      All Months
                    </button>
                    {monthNames.map(month => <button key={month} onClick={() => {
                  setSelectedMonth(month);
                  setShowMonthDropdown(false);
                }} className={`block w-full text-left px-4 py-2 text-sm ${selectedMonth === month ? 'bg-yellow-100 text-yellow-900' : `${secondaryText} hover:bg-gray-100`}`}>
                        {month}
                      </button>)}
                  </div>
                </div>}
            </div>
            
            <div className="relative">
              <button onClick={() => setShowExportDropdown(!showExportDropdown)} className="px-3 py-2 text-white rounded-md flex items-center bg-[71657c] bg-[#71657c]">
                <Download size={16} className="mr-2" />
                <span>Export</span>
                <ChevronDown size={16} className="ml-2" />
              </button>
              
              {showExportDropdown && <div className={`absolute right-0 z-10 mt-1 w-48 rounded-md shadow-lg ${cardBg} ring-1 ring-black ring-opacity-5`}>
                  <div className="py-1">
                    <button onClick={() => {
                  console.log('Export as CSV');
                  setShowExportDropdown(false);
                }} className={`block w-full text-left px-4 py-2 text-sm ${secondaryText} hover:bg-gray-100`}>
                      Export as CSV
                    </button>
                    <button onClick={() => {
                  console.log('Export as Excel');
                  setShowExportDropdown(false);
                }} className={`block w-full text-left px-4 py-2 text-sm ${secondaryText} hover:bg-gray-100`}>
                      Export as Excel
                    </button>
                    <button onClick={() => {
                  console.log('Export as PDF');
                  setShowExportDropdown(false);
                }} className={`block w-full text-left px-4 py-2 text-sm ${secondaryText} hover:bg-gray-100`}>
                      Export as PDF
                    </button>
                  </div>
                </div>}
            </div>
            
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} aria-label="Toggle dark mode">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Horizontal Navigation */}
        <div className={`${cardBg} border-b ${borderColor} py-3 px-6 mb-6 rounded-lg shadow-sm`}>
          <div className="flex overflow-x-auto no-scrollbar space-x-2 bg-neutral-100">
            {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-md whitespace-nowrap transition-all duration-200 flex items-center ${activeTab === tab.id ? `${activeTabBg} ${activeTabText} font-medium` : `hover:bg-gray-100 ${secondaryText}`}`}>
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>)}
          </div>
        </div>

        {/* Main content */}
        <div className="overflow-y-auto">
          {/* Current selection display */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Showing: <span className="text-yellow-600">{getDisplayText()}</span>
            </h2>
          </div>
          
          {/* Overview Tab Content */}
          {activeTab === 'overview' && <>
              {/* Stats Cards for Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Total Consumption</h3>
                  <div className="mt-2 bg-[#fefdff]">
                    <div className="text-3xl font-bold">{formatNumber(metrics.totalConsumption)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>kWh</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Total Cost</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-yellow-600">{formatCurrency(metrics.totalConsumption)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>at {COST_PER_KWH.toFixed(3)} OMR per kWh</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Monthly Average</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{formatNumber(metrics.averageMonthlyConsumption)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>kWh per month</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Peak Month</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{metrics.peakMonth || 'N/A'}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>{metrics.peakConsumption ? formatNumber(metrics.peakConsumption) + ' kWh' : ''}</p>
                  </div>
                </div>
              </div>

              {/* Filters for types */}
              <div className={`${cardBg} p-4 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="font-medium mb-3">Filter by Facility Type</h2>
                <div className="flex flex-wrap gap-2">
                  {facilityTypes.map(type => <button key={type} onClick={() => toggleTypeVisibility(type)} className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200`} style={{
                backgroundColor: visibleTypes.includes(type) ? `${typeColors[type]}20` : '#f3f4f6',
                color: visibleTypes.includes(type) ? typeColors[type] : '#6b7280'
              }}>
                      <span className="w-3 h-3 rounded-full mr-2" style={{
                  backgroundColor: typeColors[type]
                }}></span>
                      {type}
                    </button>)}
                </div>
              </div>

              {/* Monthly Consumption Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Monthly Electricity Consumption Trend</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData} margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={value => [formatNumber(value) + ' kWh', '']} />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Total Consumption" stroke="#F59E0B" strokeWidth={3} dot={{
                    r: 3
                  }} activeDot={{
                    r: 5
                  }} />
                      {visibleTypes.map(type => <Line key={type} type="monotone" dataKey={type} name={type} stroke={typeColors[type]} strokeWidth={2} dot={{
                    r: 2
                  }} activeDot={{
                    r: 4
                  }} />)}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribution Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Type Distribution Chart */}
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Consumption by Facility Type</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={consumptionByTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" nameKey="name" label={({
                      name,
                      percent
                    }) => `${name}: ${percent.toFixed(1)}%`}>
                          {consumptionByTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={value => formatNumber(value) + ' kWh'} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Consumption Composition Area Chart */}
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Consumption Composition</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredData} margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5
                  }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={value => formatNumber(value) + ' kWh'} />
                        <Legend />
                        {visibleTypes.map(type => <Area key={type} type="monotone" dataKey={type} stackId="1" fill={`${typeColors[type]}90`} stroke={typeColors[type]} name={type} />)}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>}

          {/* Consumption Analysis Tab */}
          {activeTab === 'consumption' && <>
              {/* Stats Cards for Consumption Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Top 4 facility types by consumption */}
                {Object.entries(metrics.consumptionByType || {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([type, consumption]) => <div key={type} className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`} style={{
              borderLeftColor: typeColors[type],
              borderLeftWidth: '4px'
            }}>
                      <h3 className={secondaryText}>{type}</h3>
                      <div className="mt-2">
                        <div className="text-3xl font-bold" style={{
                  color: typeColors[type]
                }}>{formatNumber(consumption)}</div>
                        <p className={`text-sm ${secondaryText} mt-1`}>kWh ({(consumption / metrics.totalConsumption * 100).toFixed(1)}% of total)</p>
                      </div>
                    </div>)}
              </div>
              
              {/* Monthly Consumption by Type Bar Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Monthly Consumption by Type</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transformedData} margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [formatNumber(value) + ' kWh', name]} />
                      <Legend />
                      {visibleTypes.map(type => <Bar key={type} dataKey={type} name={type} fill={typeColors[type]} stackId="a" />)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Consumption by Facility */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Top Consuming Facilities</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Facility</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total kWh</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {electricityData.map(facility => {
                    const totalConsumption = monthNames.reduce((sum, month) => sum + (facility[month] || 0), 0);
                    return {
                      ...facility,
                      totalConsumption
                    };
                  }).sort((a, b) => b.totalConsumption - a.totalConsumption).slice(0, 10).map((facility, index) => <tr key={index} className={index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-700'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{facility.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                        backgroundColor: `${typeColors[facility.type]}30`,
                        color: typeColors[facility.type]
                      }}>
                                {facility.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatNumber(facility.totalConsumption)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatCurrency(facility.totalConsumption)}</td>
                          </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </>}

          {/* Facility Types Tab */}
          {activeTab === 'facilities' && <>
              {/* Facility Type Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {facilityTypes.map(type => <div key={type} className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`} style={{
              borderLeftColor: typeColors[type],
              borderLeftWidth: '4px'
            }}>
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium" style={{
                  color: typeColors[type]
                }}>{type}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                  backgroundColor: `${typeColors[type]}30`,
                  color: typeColors[type]
                }}>
                        {electricityData.filter(item => item.type === type).length} facilities
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-bold">{formatNumber(metrics.consumptionByType[type])}</div>
                      <p className={`text-sm ${secondaryText} mt-1`}>kWh total consumption</p>
                    </div>
                    <div className="mt-2">
                      <div className="text-lg font-semibold text-yellow-600">{formatCurrency(metrics.consumptionByType[type])}</div>
                      <p className={`text-sm ${secondaryText} mt-1`}>total cost</p>
                    </div>
                  </div>)}
              </div>
              
              {/* Facility Type Comparison Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Facility Type Comparison</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={consumptionByTypeData} margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5
                }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip formatter={value => formatNumber(value) + ' kWh'} />
                      <Bar dataKey="value" name="Consumption (kWh)">
                        {consumptionByTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Facilities List by Type */}
              {facilityTypes.map(type => <div key={type} className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4" style={{
              color: typeColors[type]
            }}>{type} Facilities</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Facility</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total kWh</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {electricityData.filter(facility => facility.type === type).map(facility => {
                    const totalConsumption = monthNames.reduce((sum, month) => sum + (facility[month] || 0), 0);
                    return {
                      ...facility,
                      totalConsumption
                    };
                  }).sort((a, b) => b.totalConsumption - a.totalConsumption).map((facility, index) => <tr key={index} className={index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-700'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{facility.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{facility.account}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatNumber(facility.totalConsumption)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatCurrency(facility.totalConsumption)}</td>
                            </tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>)}
            </>}

          {/* Cost Analysis Tab */}
          {activeTab === 'costs' && <>
              {/* Cost Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Total Electricity Cost</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-yellow-600">{formatCurrency(metrics.totalConsumption)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>{formatNumber(metrics.totalConsumption)} kWh at {COST_PER_KWH.toFixed(3)} OMR/kWh</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Average Monthly Cost</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-yellow-600">{formatCurrency(metrics.averageMonthlyConsumption)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>{formatNumber(metrics.averageMonthlyConsumption)} kWh per month</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Highest Cost Facility</h3>
                  <div className="mt-2">
                    {(() => {
                  const facilityCosts = electricityData.map(facility => {
                    const totalConsumption = monthNames.reduce((sum, month) => sum + (facility[month] || 0), 0);
                    return {
                      name: facility.name,
                      type: facility.type,
                      cost: totalConsumption * COST_PER_KWH
                    };
                  });
                  const highestCostFacility = facilityCosts.sort((a, b) => b.cost - a.cost)[0];
                  return <>
                          <div className="text-3xl font-bold text-yellow-600">{formatCurrency(highestCostFacility.cost / COST_PER_KWH)}</div>
                          <p className={`text-sm ${secondaryText} mt-1`}>{highestCostFacility.name} ({highestCostFacility.type})</p>
                        </>;
                })()}
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Cost per Type</h3>
                  <div className="mt-2">
                    <div className="text-xl font-semibold">
                      {Object.entries(metrics.consumptionByType || {}).sort((a, b) => b[1] - a[1]).slice(0, 1).map(([type, consumption]) => <div key={type} style={{
                    color: typeColors[type]
                  }}>
                            {type}: {formatCurrency(consumption)}
                          </div>)}
                    </div>
                    <p className={`text-sm ${secondaryText} mt-1`}>Highest cost facility type</p>
                  </div>
                </div>
              </div>
              
              {/* Monthly Cost Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Monthly Electricity Cost Trend</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={transformedData.map(month => ({
                  ...month,
                  cost: month.total * COST_PER_KWH
                }))} margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" unit=" kWh" domain={[0, 'dataMax']} />
                      <Tooltip formatter={(value, name) => {
                    if (name === 'cost') return [formatCurrency(value / COST_PER_KWH), 'Cost'];
                    return [formatNumber(value) + ' kWh', name];
                  }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="cost" name="Cost (OMR)" stroke="#F59E0B" strokeWidth={3} dot={{
                    r: 3
                  }} activeDot={{
                    r: 5
                  }} />
                      <Line yAxisId="right" type="monotone" dataKey="total" name="Consumption (kWh)" stroke="#3B82F6" strokeWidth={2} dot={{
                    r: 3
                  }} activeDot={{
                    r: 5
                  }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Cost by Type Pie Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Cost Distribution by Facility Type</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={consumptionByTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" nameKey="name" label={({
                      name,
                      percent
                    }) => `${name}: ${percent.toFixed(1)}%`}>
                          {consumptionByTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={value => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cost by Type Bar Chart */}
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Cost by Facility Type</h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={consumptionByTypeData.map(type => ({
                    ...type,
                    cost: type.value * COST_PER_KWH
                  }))} margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5
                  }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip formatter={value => formatCurrency(value / COST_PER_KWH)} />
                        <Bar dataKey="cost" name="Cost (OMR)">
                          {consumptionByTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Cost by Facility Table */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Top Facilities by Cost</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Facility</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total kWh</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Cost</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {electricityData.map(facility => {
                    const totalConsumption = monthNames.reduce((sum, month) => sum + (facility[month] || 0), 0);
                    return {
                      ...facility,
                      totalConsumption,
                      totalCost: totalConsumption * COST_PER_KWH
                    };
                  }).sort((a, b) => b.totalCost - a.totalCost).slice(0, 15).map((facility, index) => <tr key={index} className={index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-700'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{facility.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                        backgroundColor: `${typeColors[facility.type]}30`,
                        color: typeColors[facility.type]
                      }}>
                                {facility.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatNumber(facility.totalConsumption)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400 font-medium">{formatCurrency(facility.totalConsumption)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {(facility.totalConsumption / metrics.totalConsumption * 100).toFixed(2)}%
                            </td>
                          </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </>}
        </div>
      </div>
    </Layout>;
};

// Add this CSS to hide scrollbars while allowing scrolling
const style = document.createElement('style');
style.textContent = `
  .no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera */
  }
`;
document.head.appendChild(style);
export default ElectricitySystem;