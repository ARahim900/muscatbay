
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Calendar, Search, Download, Filter, ChevronDown, Moon, Sun, Droplet, DollarSign, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import Layout from '@/components/layout/Layout';

// Sample data based on the provided file
const allMonthlyData = [
  { month: 'Jan-24', L1: 32803, L2: 11964, L3: 8114, DC: 16725, Retail: 15624, ResidentialVilla: 4240, IRR_Services: 3741, ResidentialApart: 1243, MB_Common: 274, Building: 181 },
  { month: 'Feb-24', L1: 27996, L2: 10292, L3: 7486, DC: 14781, Retail: 12880, ResidentialVilla: 3627, IRR_Services: 2849, ResidentialApart: 1074, MB_Common: 258, Building: 171 },
  { month: 'Mar-24', L1: 23860, L2: 11087, L3: 7631, DC: 12920, Retail: 11222, ResidentialVilla: 3768, IRR_Services: 2147, ResidentialApart: 861, MB_Common: 268, Building: 163 },
  { month: 'Apr-24', L1: 31869, L2: 13380, L3: 9329, DC: 15333, Retail: 13217, ResidentialVilla: 4621, IRR_Services: 2950, ResidentialApart: 1152, MB_Common: 307, Building: 162 },
  { month: 'May-24', L1: 30737, L2: 11785, L3: 8336, DC: 16304, Retail: 14150, ResidentialVilla: 4824, IRR_Services: 2211, ResidentialApart: 1217, MB_Common: 245, Building: 170 },
  { month: 'Jun-24', L1: 41953, L2: 15699, L3: 11277, DC: 18927, Retail: 15562, ResidentialVilla: 5429, IRR_Services: 4662, ResidentialApart: 1204, MB_Common: 215, Building: 147 },
  { month: 'Jul-24', L1: 35166, L2: 18370, L3: 12674, DC: 16319, Retail: 13347, ResidentialVilla: 5731, IRR_Services: 5247, ResidentialApart: 1189, MB_Common: 205, Building: 168 },
  { month: 'Aug-24', L1: 35420, L2: 16401, L3: 11296, DC: 16352, Retail: 14129, ResidentialVilla: 5849, IRR_Services: 3653, ResidentialApart: 1347, MB_Common: 195, Building: 197 },
  { month: 'Sep-24', L1: 41341, L2: 14818, L3: 10173, DC: 16074, Retail: 14217, ResidentialVilla: 5492, IRR_Services: 3040, ResidentialApart: 1154, MB_Common: 216, Building: 175 },
  { month: 'Oct-24', L1: 31519, L2: 16461, L3: 11127, DC: 22824, Retail: 19688, ResidentialVilla: 5430, IRR_Services: 2843, ResidentialApart: 1270, MB_Common: 232, Building: 166 },
  { month: 'Nov-24', L1: 35290, L2: 13045, L3: 8852, DC: 16868, Retail: 16745, ResidentialVilla: 5213, IRR_Services: 371, ResidentialApart: 1047, MB_Common: 227, Building: 117 },
  { month: 'Dec-24', L1: 36733, L2: 16148, L3: 11065, DC: 16344, Retail: 16520, ResidentialVilla: 5064, IRR_Services: 295, ResidentialApart: 1091, MB_Common: 233, Building: 142 },
  { month: 'Jan-25', L1: 32580, L2: 15327, L3: 10308, DC: 19897, Retail: 19780, ResidentialVilla: 4986, IRR_Services: 159, ResidentialApart: 1065, MB_Common: 275, Building: 152 },
  { month: 'Feb-25', L1: 44043, L2: 14716, L3: 9944, DC: 21338, Retail: 21066, ResidentialVilla: 4977, IRR_Services: 286, ResidentialApart: 1057, MB_Common: 252, Building: 140 }
];

const zoneData = [
  { zone: 'ZONE FM', bulk: 24394, individual: 23208, difference: 1186, lossPercent: 4.9, costPerM3: 1.32, lossCost: 1565.52 },
  { zone: 'ZONE 3A', bulk: 38706, individual: 14020, difference: 24686, lossPercent: 63.8, costPerM3: 1.32, lossCost: 32585.52 },
  { zone: 'ZONE 3B', bulk: 41055, individual: 17120, difference: 23935, lossPercent: 58.3, costPerM3: 1.32, lossCost: 31594.20 },
  { zone: 'ZONE 5', bulk: 54039, individual: 19096, difference: 34943, lossPercent: 64.7, costPerM3: 1.32, lossCost: 46124.76 },
  { zone: 'ZONE 8', bulk: 40155, individual: 29265, difference: 10890, lossPercent: 27.1, costPerM3: 1.32, lossCost: 14374.80 },
  { zone: 'Village Square', bulk: 1144, individual: 904, difference: 240, lossPercent: 21.0, costPerM3: 1.32, lossCost: 316.80 }
];

const typeDistribution = [
  { name: 'Retail', value: 234682, percent: 48.8, color: '#F87171' },
  { name: 'Residential (Villas)', value: 66071, percent: 13.7, color: '#FBBF24' },
  { name: 'IRR_Services', value: 32357, percent: 6.7, color: '#60A5FA' },
  { name: 'Residential (Apart)', value: 16971, percent: 3.5, color: '#34D399' },
  { name: 'MB_Common', value: 3379, percent: 0.7, color: '#A78BFA' },
  { name: 'D_Building_Bulk', value: 7130, percent: 1.5, color: '#F472B6' },
  { name: 'D_Building_Common', value: 464, percent: 0.1, color: '#6EE7B7' },
  { name: 'System Losses', value: 120256, percent: 25.0, color: '#9CA3AF' }
];

interface MonthlyData {
  month: string;
  L1: number;
  L2: number;
  L3: number;
  DC: number;
  Retail: number;
  ResidentialVilla: number;
  IRR_Services: number;
  ResidentialApart: number;
  MB_Common: number;
  Building: number;
  [key: string]: number | string;
}

interface ZoneData {
  zone: string;
  bulk: number;
  individual: number;
  difference: number;
  lossPercent: number;
  costPerM3: number;
  lossCost: number;
}

interface TypeDistribution {
  name: string;
  value: number;
  percent: number;
  color: string;
}

interface CalculatedMetrics {
  totalL1: number;
  totalL2: number;
  totalL3: number;
  totalDC: number;
  l1ToL2Loss: number;
  l2ToL3Loss: number;
  totalLoss: number;
  lossPercentage: number;
  l1ToL2LossCost: number;
  l2ToL3LossCost: number;
  totalLossCost: number;
  latestData: MonthlyData;
  avgMonthlyConsumption: number;
  totalRetail: number;
  totalResidentialVilla: number;
  totalIRR: number;
  totalResidentialApart: number;
  totalMBCommon: number;
  totalBuilding: number;
  payableConsumption: number;
  payableCost: number;
}

// Add CSS for no scrollbar
const noScrollbarStyle = `
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;

const WaterSystem: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [filteredData, setFilteredData] = useState<MonthlyData[]>(allMonthlyData);
  const [visibleTypes, setVisibleTypes] = useState<string[]>(['Retail', 'ResidentialVilla', 'IRR_Services', 'ResidentialApart', 'MB_Common', 'Building']);
  const [visibleZones, setVisibleZones] = useState<string[]>(['ZONE FM', 'ZONE 3A', 'ZONE 3B', 'ZONE 5', 'ZONE 8', 'Village Square']);
  const [showYearDropdown, setShowYearDropdown] = useState<boolean>(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState<boolean>(false);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  
  // Cost per cubic meter
  const COST_PER_M3 = 1.32;
  
  // Calculate available years and months from data
  const availableYears = useMemo(() => {
    const years = [...new Set(allMonthlyData.map(item => item.month.split('-')[1]))];
    return ['all', ...years];
  }, []);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Get available months based on selected year
  const availableMonths = useMemo(() => {
    if (selectedYear === 'all') {
      return ['all', ...monthNames];
    }
    
    const months = allMonthlyData
      .filter(item => item.month.includes(`-${selectedYear}`))
      .map(item => item.month.split('-')[0]);
    
    return ['all', ...new Set(months)];
  }, [selectedYear]);

  // Format numbers with commas
  const formatNumber = (num: number | undefined): string => {
    return num?.toLocaleString() || '0';
  };

  // Format currency
  const formatCurrency = (num: number): string => {
    return `${formatNumber(num)} OMR`;
  };

  useEffect(() => {
    // Add the style element for no scrollbar
    const style = document.createElement('style');
    style.textContent = noScrollbarStyle;
    document.head.appendChild(style);
    
    // Set the document title
    document.title = 'Water System | Muscat Bay Asset Manager';
    
    return () => {
      // Clean up the style element when component unmounts
      document.head.removeChild(style);
    };
  }, []);

  // Filter data based on selected year and month
  useEffect(() => {
    let filtered = [...allMonthlyData];
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(item => item.month.includes(`-${selectedYear}`));
    }
    
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(item => item.month.startsWith(selectedMonth));
    }
    
    // If no data matches the filter, don't change the current data
    // This prevents selecting non-existent month-year combinations
    if (filtered.length === 0) {
      if (selectedMonth !== 'all' && selectedYear !== 'all') {
        // Alert user about invalid selection
        alert(`No data available for ${selectedMonth} 20${selectedYear}`);
      } else {
        setFilteredData(allMonthlyData);
      }
    } else {
      setFilteredData(filtered);
    }
  }, [selectedYear, selectedMonth]);

  // Calculate summaries based on filtered data
  const calculateMetrics = useMemo<CalculatedMetrics | null>(() => {
    // Only calculate if we have data
    if (!filteredData.length) return null;
    
    const totalL1 = filteredData.reduce((sum, month) => sum + month.L1, 0);
    const totalL2 = filteredData.reduce((sum, month) => sum + month.L2, 0);
    const totalL3 = filteredData.reduce((sum, month) => sum + month.L3, 0);
    const totalDC = filteredData.reduce((sum, month) => sum + month.DC, 0);
    
    // Calculate losses
    const l1ToL2Loss = totalL1 - (totalL2 + totalDC);
    const l2ToL3Loss = totalL2 - totalL3;
    const totalLoss = l1ToL2Loss + l2ToL3Loss;
    const lossPercentage = (totalLoss / totalL1) * 100;
    
    // Calculate monetary values
    const l1ToL2LossCost = l1ToL2Loss * COST_PER_M3;
    const l2ToL3LossCost = l2ToL3Loss * COST_PER_M3;
    const totalLossCost = totalLoss * COST_PER_M3;
    
    // Latest data point
    const latestData = filteredData[filteredData.length - 1];
    
    // Calculate monthly average
    const avgMonthlyConsumption = Math.round(totalL1 / filteredData.length);
    
    // Consumption types total
    const totalRetail = filteredData.reduce((sum, month) => sum + month.Retail, 0);
    const totalResidentialVilla = filteredData.reduce((sum, month) => sum + month.ResidentialVilla, 0);
    const totalIRR = filteredData.reduce((sum, month) => sum + month.IRR_Services, 0);
    const totalResidentialApart = filteredData.reduce((sum, month) => sum + month.ResidentialApart, 0);
    const totalMBCommon = filteredData.reduce((sum, month) => sum + month.MB_Common, 0);
    const totalBuilding = filteredData.reduce((sum, month) => sum + month.Building, 0);
    
    // Payable consumption (from your original data)
    const payableConsumption = totalIRR + totalMBCommon + totalBuilding;
    const payableCost = payableConsumption * COST_PER_M3;

    return {
      totalL1,
      totalL2,
      totalL3,
      totalDC,
      l1ToL2Loss,
      l2ToL3Loss,
      totalLoss,
      lossPercentage,
      l1ToL2LossCost,
      l2ToL3LossCost,
      totalLossCost,
      latestData,
      avgMonthlyConsumption,
      totalRetail,
      totalResidentialVilla,
      totalIRR,
      totalResidentialApart,
      totalMBCommon,
      totalBuilding,
      payableConsumption,
      payableCost
    };
  }, [filteredData, COST_PER_M3]);

  // Toggle a type's visibility
  const toggleTypeVisibility = (type: string) => {
    if (visibleTypes.includes(type)) {
      setVisibleTypes(visibleTypes.filter(t => t !== type));
    } else {
      setVisibleTypes([...visibleTypes, type]);
    }
  };

  // Toggle a zone's visibility
  const toggleZoneVisibility = (zone: string) => {
    if (visibleZones.includes(zone)) {
      setVisibleZones(visibleZones.filter(z => z !== zone));
    } else {
      setVisibleZones([...visibleZones, zone]);
    }
  };

  // Background and text colors based on dark mode
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const secondaryText = darkMode ? 'text-gray-400' : 'text-gray-500';
  const activeTabBg = darkMode ? 'bg-gray-700' : 'bg-blue-50';
  const activeTabText = darkMode ? 'text-blue-400' : 'text-blue-600';
  const headerBg = darkMode ? 'bg-gray-800' : 'bg-white';

  // Filter zone data based on visible zones
  const filteredZoneData = zoneData.filter(zone => visibleZones.includes(zone.zone));
  
  // Define tabs for the dashboard
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
    { id: 'zone-analysis', label: 'Zone Analysis', icon: <Zap size={16} /> },
    { id: 'consumption', label: 'Consumption Types', icon: <Droplet size={16} /> },
    { id: 'losses', label: 'Losses', icon: <AlertTriangle size={16} /> }
  ];

  // Get display text for date filter
  const getDisplayText = () => {
    if (selectedYear === 'all' && selectedMonth === 'all') return 'All Data';
    if (selectedYear === 'all') return `${selectedMonth} (All Years)`;
    if (selectedMonth === 'all') return `All Months, 20${selectedYear}`;
    return `${selectedMonth} 20${selectedYear}`;
  };
  
  // Check if metrics calculated successfully
  if (!calculateMetrics) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Loading data...</h2>
            <p>Please wait while we prepare your dashboard.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${bgColor} ${textColor}`}>
        {/* Header */}
        <div className={`${headerBg} border-b ${borderColor} p-4 flex justify-between items-center`}>
          <div className="flex items-center">
            <div className="flex items-center justify-center p-2 w-10 h-10 rounded bg-blue-600 text-white mr-3">
              <Droplet size={20} />
            </div>
            <h1 className="text-2xl font-bold">Muscat Bay Water System</h1>
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
                <span>Year: {selectedYear === 'all' ? 'All' : `20${selectedYear}`}</span>
                <ChevronDown size={16} className={secondaryText} />
              </button>
              
              {showYearDropdown && (
                <div className={`absolute z-10 mt-1 w-48 rounded-md shadow-lg ${cardBg} ring-1 ring-black ring-opacity-5`}>
                  <div className="py-1">
                    {availableYears.map(year => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          // Reset month if changing year
                          if (year !== selectedYear) {
                            setSelectedMonth('all');
                          }
                          setShowYearDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${selectedYear === year ? 'bg-blue-100 text-blue-900' : `${secondaryText} hover:bg-gray-100`}`}
                      >
                        {year === 'all' ? 'All Years' : `20${year}`}
                      </button>
                    ))}
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
                    {availableMonths.map(month => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(month);
                          setShowMonthDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${selectedMonth === month ? 'bg-blue-100 text-blue-900' : `${secondaryText} hover:bg-gray-100`}`}
                      >
                        {month === 'all' ? 'All Months' : month}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
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
              Showing: <span className="text-blue-600">{getDisplayText()}</span>
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
                    <div className="text-3xl font-bold">{formatNumber(calculateMetrics.totalL1)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>m³ for {getDisplayText()}</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Water Loss</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-red-600">{formatNumber(calculateMetrics.totalLoss)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>{calculateMetrics.lossPercentage.toFixed(1)}% of total supply</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Payable Volume</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{formatNumber(calculateMetrics.payableConsumption)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>{formatCurrency(calculateMetrics.payableCost)}</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Monthly Average</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{formatNumber(calculateMetrics.avgMonthlyConsumption)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>m³ per month</p>
                  </div>
                </div>
              </div>

              {/* Filters for types */}
              <div className={`${cardBg} p-4 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="font-medium mb-3">Filter by Type</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleTypeVisibility('Retail')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('Retail') ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                    Retail
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('ResidentialVilla')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('ResidentialVilla') ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                    Residential (Villa)
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('IRR_Services')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('IRR_Services') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                    IRR_Services
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('ResidentialApart')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('ResidentialApart') ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                    Residential (Apart)
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('MB_Common')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('MB_Common') ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                    MB_Common
                  </button>
                  <button
                    onClick={() => toggleTypeVisibility('Building')}
                    className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleTypes.includes('Building') ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span className="w-3 h-3 rounded-full bg-pink-500 mr-2"></span>
                    Building
                  </button>
                </div>
              </div>

              {/* Monthly Consumption Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Monthly Consumption Trend</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatNumber(Number(value)) + ' m³', '']} />
                      <Legend />
                      {visibleTypes.includes('Retail') && (
                        <Line 
                          type="monotone" 
                          dataKey="Retail" 
                          name="Retail" 
                          stroke="#F87171" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('ResidentialVilla') && (
                        <Line 
                          type="monotone" 
                          dataKey="ResidentialVilla" 
                          name="Residential (Villa)" 
                          stroke="#FBBF24" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('IRR_Services') && (
                        <Line 
                          type="monotone" 
                          dataKey="IRR_Services" 
                          name="IRR_Services" 
                          stroke="#60A5FA" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('ResidentialApart') && (
                        <Line 
                          type="monotone" 
                          dataKey="ResidentialApart" 
                          name="Residential (Apart)" 
                          stroke="#34D399" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('MB_Common') && (
                        <Line 
                          type="monotone" 
                          dataKey="MB_Common" 
                          name="MB_Common" 
                          stroke="#A78BFA" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('Building') && (
                        <Line 
                          type="monotone" 
                          dataKey="Building" 
                          name="Building" 
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
                          data={typeDistribution.filter(item => 
                            visibleTypes.includes(item.name.replace(' (Villas)', 'Villa').replace(' (Apart)', 'Apart'))
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
                          {typeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(Number(value)) + ' m³'} />
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
                        data={filteredData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatNumber(Number(value)) + ' m³'} />
                        <Legend />
                        {visibleTypes.includes('Retail') && (
                          <Area type="monotone" dataKey="Retail" stackId="1" fill="#F87171" stroke="#F87171" name="Retail" />
                        )}
                        {visibleTypes.includes('ResidentialVilla') && (
                          <Area type="monotone" dataKey="ResidentialVilla" stackId="1" fill="#FBBF24" stroke="#FBBF24" name="Residential (Villa)" />
                        )}
                        {visibleTypes.includes('IRR_Services') && (
                          <Area type="monotone" dataKey="IRR_Services" stackId="1" fill="#60A5FA" stroke="#60A5FA" name="IRR_Services" />
                        )}
                        {visibleTypes.includes('ResidentialApart') && (
                          <Area type="monotone" dataKey="ResidentialApart" stackId="1" fill="#34D399" stroke="#34D399" name="Residential (Apart)" />
                        )}
                        {visibleTypes.includes('MB_Common') && (
                          <Area type="monotone" dataKey="MB_Common" stackId="1" fill="#A78BFA" stroke="#A78BFA" name="MB_Common" />
                        )}
                        {visibleTypes.includes('Building') && (
                          <Area type="monotone" dataKey="Building" stackId="1" fill="#F472B6" stroke="#F472B6" name="Building" />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Zone Analysis Tab */}
          {activeTab === 'zone-analysis' && (
            <>
              {/* Stats Cards for Zone Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Total Zone Bulk (L2)</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{formatNumber(calculateMetrics.totalL2)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>m³ across all zones</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Total Individual (L3)</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{formatNumber(calculateMetrics.totalL3)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>m³ consumed by end users</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Zone Losses</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-red-600">{formatNumber(calculateMetrics.l2ToL3Loss)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>{formatCurrency(calculateMetrics.l2ToL3LossCost)}</p>
                  </div>
                </div>
              </div>
            
              {/* Filter for Zones */}
              <div className={`${cardBg} p-4 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="font-medium mb-3">Filter by Zone</h2>
                <div className="flex flex-wrap gap-2">
                  {zoneData.map((zone) => (
                    <button
                      key={zone.zone}
                      onClick={() => toggleZoneVisibility(zone.zone)}
                      className={`px-4 py-2 rounded-full text-sm flex items-center transition-colors duration-200 ${visibleZones.includes(zone.zone) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                      {zone.zone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone Data Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {filteredZoneData.map((zone) => (
                  <div key={zone.zone} className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                    <h2 className="text-lg font-medium mb-2">{zone.zone}</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className={secondaryText}>Bulk (L2)</p>
                        <p className="text-lg font-semibold">{formatNumber(zone.bulk)} m³</p>
                      </div>
                      <div>
                        <p className={secondaryText}>Individual (L3)</p>
                        <p className="text-lg font-semibold">{formatNumber(zone.individual)} m³</p>
                      </div>
                      <div>
                        <p className={secondaryText}>Loss</p>
                        <p className="text-lg font-semibold text-red-500">{formatNumber(zone.difference)} m³</p>
                      </div>
                      <div>
                        <p className={secondaryText}>Loss Cost</p>
                        <p className="text-lg font-semibold text-red-500">{formatNumber(zone.lossCost)} OMR</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className={secondaryText}>Loss Percentage</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1 mb-1">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${zone.lossPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-sm font-semibold text-right">{zone.lossPercent.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Zone Comparison Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Zone Comparison</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredZoneData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zone" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'individual') return [formatNumber(Number(value)) + ' m³', 'Individual (L3)'];
                        if (name === 'bulk') return [formatNumber(Number(value)) + ' m³', 'Bulk (L2)'];
                        if (name === 'difference') return [formatNumber(Number(value)) + ' m³', 'Loss'];
                        return [formatNumber(Number(value)), name];
                      }} />
                      <Legend />
                      <Bar dataKey="bulk" name="Bulk (L2)" fill="#3B82F6" />
                      <Bar dataKey="individual" name="Individual (L3)" fill="#60A5FA" />
                      <Bar dataKey="difference" name="Loss" fill="#F87171" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Loss Percentage by Zone Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Loss Percentage by Zone</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredZoneData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis dataKey="zone" type="category" width={100} />
                      <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                      <Bar dataKey="lossPercent" name="Loss Percentage" fill="#F87171">
                        {filteredZoneData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.lossPercent > 50 ? '#EF4444' : (entry.lossPercent > 25 ? '#F59E0B' : '#10B981')} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Consumption Types Tab */}
          {activeTab === 'consumption' && (
            <>
              {/* Stats Cards for Consumption */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Retail</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-orange-500">{formatNumber(calculateMetrics.totalRetail)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>m³ ({((calculateMetrics.totalRetail / calculateMetrics.totalL1) * 100).toFixed(1)}% of total)</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Residential</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-yellow-500">{formatNumber(calculateMetrics.totalResidentialVilla + calculateMetrics.totalResidentialApart)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>m³ ({(((calculateMetrics.totalResidentialVilla + calculateMetrics.totalResidentialApart) / calculateMetrics.totalL1) * 100).toFixed(1)}% of total)</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>IRR Services</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-blue-500">{formatNumber(calculateMetrics.totalIRR)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>m³ ({((calculateMetrics.totalIRR / calculateMetrics.totalL1) * 100).toFixed(1)}% of total)</p>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h3 className={secondaryText}>Common Areas</h3>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-purple-500">{formatNumber(calculateMetrics.totalMBCommon + calculateMetrics.totalBuilding)}</div>
                    <p className={`text-sm ${secondaryText} mt-1`}>m³ ({(((calculateMetrics.totalMBCommon + calculateMetrics.totalBuilding) / calculateMetrics.totalL1) * 100).toFixed(1)}% of total)</p>
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
                          { name: 'Retail', value: calculateMetrics.totalRetail, color: '#F87171' },
                          { name: 'Residential (Villa)', value: calculateMetrics.totalResidentialVilla, color: '#FBBF24' },
                          { name: 'IRR_Services', value: calculateMetrics.totalIRR, color: '#60A5FA' },
                          { name: 'Residential (Apart)', value: calculateMetrics.totalResidentialApart, color: '#34D399' },
                          { name: 'MB_Common', value: calculateMetrics.totalMBCommon, color: '#A78BFA' },
                          { name: 'Building', value: calculateMetrics.totalBuilding, color: '#F472B6' },
                        ].filter(item => visibleTypes.includes(item.name.replace(' (Villa)', 'Villa').replace(' (Apart)', 'Apart')))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={110} />
                        <Tooltip formatter={(value) => formatNumber(Number(value)) + ' m³'} />
                        <Bar 
                          dataKey="value" 
                          animationDuration={1000}
                        >
                          {[
                            { name: 'Retail', color: '#F87171' },
                            { name: 'Residential (Villa)', color: '#FBBF24' },
                            { name: 'IRR_Services', color: '#60A5FA' },
                            { name: 'Residential (Apart)', color: '#34D399' },
                            { name: 'MB_Common', color: '#A78BFA' },
                            { name: 'Building', color: '#F472B6' },
                          ]
                            .filter(item => visibleTypes.includes(item.name.replace(' (Villa)', 'Villa').replace(' (Apart)', 'Apart')))
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Payable Consumption */}
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm`}>
                  <h2 className="text-xl font-medium mb-4">Payable Consumption</h2>
                  <div className="space-y-4 mb-6">
                    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow duration-300">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <Droplet size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">IRR_Services</p>
                          <p className="text-lg font-bold">{formatNumber(calculateMetrics.totalIRR)} m³</p>
                          <p className="text-sm text-gray-500">Cost: {formatCurrency(calculateMetrics.totalIRR * COST_PER_M3)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow duration-300">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                          <Droplet size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">MB_Common</p>
                          <p className="text-lg font-bold">{formatNumber(calculateMetrics.totalMBCommon)} m³</p>
                          <p className="text-sm text-gray-500">Cost: {formatCurrency(calculateMetrics.totalMBCommon * COST_PER_M3)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow duration-300">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 mr-3">
                          <Droplet size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Building</p>
                          <p className="text-lg font-bold">{formatNumber(calculateMetrics.totalBuilding)} m³</p>
                          <p className="text-sm text-gray-500">Cost: {formatCurrency(calculateMetrics.totalBuilding * COST_PER_M3)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-semibold text-green-800">Total Payable</p>
                        <p className="text-sm text-green-600">{COST_PER_M3.toFixed(3)} OMR per m³</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-800">{formatNumber(calculateMetrics.payableConsumption)} m³</p>
                        <p className="text-lg font-medium text-green-600">{formatCurrency(calculateMetrics.payableCost)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Consumption Trend by Type */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Consumption Trend by Type</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatNumber(Number(value)) + ' m³'} />
                      <Legend />
                      {visibleTypes.includes('Retail') && (
                        <Line 
                          type="monotone" 
                          dataKey="Retail" 
                          name="Retail" 
                          stroke="#F87171" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('ResidentialVilla') && (
                        <Line 
                          type="monotone" 
                          dataKey="ResidentialVilla" 
                          name="Residential (Villa)" 
                          stroke="#FBBF24" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('IRR_Services') && (
                        <Line 
                          type="monotone" 
                          dataKey="IRR_Services" 
                          name="IRR_Services" 
                          stroke="#60A5FA" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('ResidentialApart') && (
                        <Line 
                          type="monotone" 
                          dataKey="ResidentialApart" 
                          name="Residential (Apart)" 
                          stroke="#34D399" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('MB_Common') && (
                        <Line 
                          type="monotone" 
                          dataKey="MB_Common" 
                          name="MB_Common" 
                          stroke="#A78BFA" 
                          strokeWidth={2} 
                          dot={{ r: 3 }} 
                          activeDot={{ r: 5 }} 
                        />
                      )}
                      {visibleTypes.includes('Building') && (
                        <Line 
                          type="monotone" 
                          dataKey="Building" 
                          name="Building" 
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

          {/* Losses Tab */}
          {activeTab === 'losses' && (
            <>
              {/* System Losses Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h2 className="text-lg font-medium text-gray-500 mb-2">Total System Loss</h2>
                  <div className="text-3xl font-bold text-red-600">{formatNumber(calculateMetrics.totalLoss)} <span className="text-base font-normal text-gray-500">m³</span></div>
                  <p className="text-gray-500 mt-1">{calculateMetrics.lossPercentage.toFixed(1)}% of total consumption</p>
                  <p className="text-red-600 font-semibold mt-1">{formatCurrency(calculateMetrics.totalLossCost)}</p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-red-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${calculateMetrics.lossPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h2 className="text-lg font-medium text-gray-500 mb-2">L1 to L2/DC Loss</h2>
                  <div className="text-3xl font-bold text-amber-600">{formatNumber(calculateMetrics.l1ToL2Loss)} <span className="text-base font-normal text-gray-500">m³</span></div>
                  <p className="text-gray-500 mt-1">{((calculateMetrics.l1ToL2Loss / calculateMetrics.totalL1) * 100).toFixed(1)}% of main bulk (L1)</p>
                  <p className="text-amber-600 font-semibold mt-1">{formatCurrency(calculateMetrics.l1ToL2LossCost)}</p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-amber-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${(calculateMetrics.l1ToL2Loss / calculateMetrics.totalL1) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className={`${cardBg} p-6 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                  <h2 className="text-lg font-medium text-gray-500 mb-2">L2 to L3 Loss</h2>
                  <div className="text-3xl font-bold text-orange-600">{formatNumber(calculateMetrics.l2ToL3Loss)} <span className="text-base font-normal text-gray-500">m³</span></div>
                  <p className="text-gray-500 mt-1">{((calculateMetrics.l2ToL3Loss / calculateMetrics.totalL2) * 100).toFixed(1)}% of zone bulk (L2)</p>
                  <p className="text-orange-600 font-semibold mt-1">{formatCurrency(calculateMetrics.l2ToL3LossCost)}</p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-orange-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${(calculateMetrics.l2ToL3Loss / calculateMetrics.totalL2) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Loss Breakdown Chart */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Loss Breakdown by Stage</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'L1 to L2 Loss', value: calculateMetrics.l1ToL2Loss, color: '#F59E0B' },
                          { name: 'L2 to L3 Loss', value: calculateMetrics.l2ToL3Loss, color: '#F97316' }
                        ]}
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
                          { name: 'L1 to L2 Loss', color: '#F59E0B' },
                          { name: 'L2 to L3 Loss', color: '#F97316' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [
                        `${formatNumber(Number(value))} m³ (${formatCurrency(Number(value) * COST_PER_M3)})`,
                        ''
                      ]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Loss Comparison by Zone */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Loss Comparison by Zone</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredZoneData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zone" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" unit="%" />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'difference') return [formatNumber(Number(value)) + ' m³', 'Loss Volume'];
                        if (name === 'lossPercent') return [Number(value).toFixed(1) + '%', 'Loss %'];
                        if (name === 'lossCost') return [formatCurrency(Number(value)), 'Loss Cost'];
                        return [value, name];
                      }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="difference" name="Loss Volume (m³)" fill="#F87171" />
                      <Bar yAxisId="right" dataKey="lossPercent" name="Loss %" fill="#60A5FA" />
                      <Bar yAxisId="left" dataKey="lossCost" name="Loss Cost (OMR)" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Monthly Loss Trend */}
              <div className={`${cardBg} p-6 rounded-lg border ${borderColor} mb-6 shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Monthly Loss Trend</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredData.map(month => ({
                        ...month,
                        L1toL2Loss: month.L1 - (month.L2 + month.DC),
                        L2toL3Loss: month.L2 - month.L3,
                        TotalLoss: month.L1 - (month.L3 + month.DC)
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatNumber(Number(value)) + ' m³'} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="L1toL2Loss" 
                        name="L1 to L2 Loss" 
                        stroke="#F59E0B" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="L2toL3Loss" 
                        name="L2 to L3 Loss" 
                        stroke="#F97316" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="TotalLoss" 
                        name="Total Loss" 
                        stroke="#EF4444" 
                        strokeWidth={3} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WaterSystem;
